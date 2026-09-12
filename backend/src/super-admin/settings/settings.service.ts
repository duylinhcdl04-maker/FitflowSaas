import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import type { RequestUser } from '../../common/types/jwt-payload';
import {
  PLATFORM_SETTING_KEYS,
  PlatformSettingKey,
  UpsertSettingDto,
} from './dto/upsert-setting.dto';

export interface TelegramChatInfo {
  id: string;
  title: string;
  type: string; // 'supergroup' | 'group' | 'channel' | 'private'
  username?: string;
}

export interface TelegramVerifyResult {
  valid: boolean;
  bot: {
    id: number;
    name: string;
    username: string;
  };
}

export interface TelegramConnectionState {
  configured: boolean;
  isActive: boolean;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  bot?: {
    id?: number;
    name: string;
    username: string;
  };
  chat?: {
    id: string;
    name: string;
    type: string;
    maskedChatId: string;
  };
  lastCheckedAt?: string | null;
  lastError?: string | null;
}

function maskChatId(chatId: string): string {
  if (!chatId) return '';
  const str = String(chatId);
  if (str.length <= 4) return '••••' + str;
  return '•••••••' + str.slice(-4);
}

function mapTelegramError(errText: string, status?: number): string {
  const lower = (errText || '').toLowerCase();
  if (
    status === 401 ||
    lower.includes('unauthorized') ||
    lower.includes('not found')
  ) {
    return 'Mã Bot Token không chính xác hoặc đã bị thu hồi (TELEGRAM_INVALID_TOKEN)';
  }
  if (status === 400 && lower.includes('chat not found')) {
    return 'Không tìm thấy cuộc trò chuyện hoặc Chat ID không tồn tại (TELEGRAM_CHAT_NOT_FOUND)';
  }
  if (
    status === 403 &&
    (lower.includes('kicked') ||
      lower.includes('deactivated') ||
      lower.includes('blocked'))
  ) {
    return 'Bot đã bị xóa khỏi nhóm hoặc bị chặn (TELEGRAM_BOT_KICKED)';
  }
  if (
    status === 403 ||
    lower.includes('not a member') ||
    lower.includes('forbidden')
  ) {
    return 'Bot chưa được thêm vào Group hoặc chưa được cấp quyền gửi tin nhắn (TELEGRAM_FORBIDDEN)';
  }
  if (
    lower.includes('timeout') ||
    lower.includes('abort') ||
    lower.includes('econnrefused')
  ) {
    return 'Quá thời gian kết nối tới máy chủ Telegram (TELEGRAM_TIMEOUT)';
  }
  return `Không thể gửi tin nhắn Telegram: ${errText || 'Lỗi không xác định'} (TELEGRAM_SEND_FAILED)`;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Returns public branding settings (name, logo, favicon, support links) without requiring auth. */
  async getPublicBranding() {
    const row = await this.prisma.platformSetting.findUnique({
      where: { setting_key: 'BRANDING' },
    });
    return (row?.setting_value as Record<string, any>) || {};
  }

  /** Always returns every known key, `null` for ones nobody has configured yet. */
  async getAll() {
    const rows = await this.prisma.platformSetting.findMany();
    const byKey = new Map(rows.map((r) => [r.setting_key, r]));

    const result: Record<string, { value: any; updatedAt: Date | null }> = {};

    for (const key of PLATFORM_SETTING_KEYS) {
      const row = byKey.get(key);
      let value = (row?.setting_value as Record<string, any>) ?? null;

      // Mask sensitive credentials if this is NOTIFICATIONS
      if (key === 'NOTIFICATIONS' && value) {
        const sanitized = { ...value };
        if (sanitized.telegram) {
          const tele = { ...sanitized.telegram };
          const rawToken = tele.botToken;
          tele.hasToken = Boolean(rawToken);
          delete tele.botToken; // never expose raw botToken to frontend
          if (tele.chat?.id) {
            tele.chat.maskedChatId = maskChatId(tele.chat.id);
          }
          sanitized.telegram = tele;
        }
        value = sanitized;
      }

      result[key] = {
        value,
        updatedAt: row?.updated_at ?? null,
      };
    }

    return result;
  }

  async upsert(key: string, dto: UpsertSettingDto, actor: RequestUser) {
    if (!PLATFORM_SETTING_KEYS.includes(key as PlatformSettingKey)) {
      throw new BadRequestException(`Không hỗ trợ nhóm cài đặt "${key}"`);
    }

    const before = await this.prisma.platformSetting.findUnique({
      where: { setting_key: key },
    });

    const valueToStore = dto.value;

    // If updating NOTIFICATIONS and telegram botToken is omitted, preserve existing botToken
    if (key === 'NOTIFICATIONS') {
      const existing = (before?.setting_value as Record<string, any>) ?? {};
      const existingTele = existing.telegram ?? {};
      const incomingTele = (dto.value as any)?.telegram;

      if (incomingTele && !incomingTele.botToken && existingTele.botToken) {
        incomingTele.botToken = existingTele.botToken;
      }
    }

    const value = valueToStore as Prisma.InputJsonValue;
    const updated = await this.prisma.platformSetting.upsert({
      where: { setting_key: key },
      create: { setting_key: key, setting_value: value, updated_by: actor.id },
      update: {
        setting_value: value,
        updated_by: actor.id,
        updated_at: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PLATFORM_SETTING',
      entityId: null,
      action: 'PLATFORM_SETTING_UPDATED',
      beforeData: before ? { key, value: before.setting_value } : null,
      afterData: { key, value: updated.setting_value },
    });

    return { value: updated.setting_value, updatedAt: updated.updated_at };
  }

  // =========================================================================
  // TELEGRAM BOT API METHODS
  // =========================================================================

  /** Step 1: Verify Bot Token via Telegram getMe */
  async verifyTelegramBot(token: string): Promise<TelegramVerifyResult> {
    const trimmed = (token || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Mã Bot Token không được để trống');
    }

    try {
      const res = await fetch(`https://api.telegram.org/bot${trimmed}/getMe`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        const errorDesc = data?.description || res.statusText;
        throw new BadRequestException(mapTelegramError(errorDesc, res.status));
      }

      return {
        valid: true,
        bot: {
          id: data.result.id,
          name: data.result.first_name,
          username: data.result.username,
        },
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Telegram verify failed', err);
      throw new BadRequestException(mapTelegramError(err?.message));
    }
  }

  /** Step 2: Discover Chats/Groups via Telegram getUpdates */
  async discoverTelegramChats(
    token: string,
  ): Promise<{ chats: TelegramChatInfo[] }> {
    const trimmed = (token || '').trim();
    if (!trimmed) {
      throw new BadRequestException('Mã Bot Token không được để trống');
    }

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${trimmed}/getUpdates?limit=100`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        },
      );
      const data = await res.json();

      if (!res.ok || !data.ok) {
        const errorDesc = data?.description || res.statusText;
        throw new BadRequestException(mapTelegramError(errorDesc, res.status));
      }

      const updates: any[] = data.result || [];
      const chatMap = new Map<string, TelegramChatInfo>();

      for (const upd of updates) {
        const rawChat =
          upd.message?.chat ||
          upd.channel_post?.chat ||
          upd.my_chat_member?.chat ||
          upd.chat_member?.chat;

        if (rawChat?.id) {
          const chatId = String(rawChat.id);
          const title =
            rawChat.title ||
            [rawChat.first_name, rawChat.last_name].filter(Boolean).join(' ') ||
            rawChat.username ||
            `Chat ${chatId}`;

          chatMap.set(chatId, {
            id: chatId,
            title,
            type: rawChat.type || 'group',
            username: rawChat.username,
          });
        }
      }

      return { chats: Array.from(chatMap.values()) };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Telegram discover failed', err);
      throw new BadRequestException(mapTelegramError(err?.message));
    }
  }

  /** Step 3: Send Test Message via Telegram sendMessage */
  async testTelegramMessage(params: {
    token?: string;
    chatId: string;
    text?: string;
  }): Promise<{ success: boolean; messageId: number }> {
    let token = (params.token || '').trim();
    const chatId = (params.chatId || '').trim();

    if (!chatId) {
      throw new BadRequestException('Chat ID không được để trống');
    }

    // If no token passed, try to fetch stored token
    if (!token) {
      const stored = await this.prisma.platformSetting.findUnique({
        where: { setting_key: 'NOTIFICATIONS' },
      });
      const tele = (stored?.setting_value as any)?.telegram;
      if (!tele?.botToken) {
        throw new BadRequestException(
          'Chưa có Bot Token. Vui lòng nhập Bot Token trước khi gửi thử.',
        );
      }
      token = tele.botToken;
    }

    const timestampStr = new Date().toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
    });
    const defaultText = `🟢 *FitFlow Telegram Connected*\n\nTelegram notification channel đã được kết nối thành công\\.\n\n*Environment:* Production\n*Time:* ${timestampStr}`;
    const textToSend = params.text || defaultText;

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: chatId,
            text: textToSend,
            parse_mode: 'Markdown',
          }),
        },
      );

      const data = await res.json();
      if (!res.ok || !data.ok) {
        const errorDesc = data?.description || res.statusText;
        throw new BadRequestException(mapTelegramError(errorDesc, res.status));
      }

      return { success: true, messageId: data.result.message_id };
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('Telegram test message failed', err);
      throw new BadRequestException(mapTelegramError(err?.message));
    }
  }

  /** Step 4: Save Verified Telegram Connection */
  async saveTelegramConnection(
    params: {
      token: string;
      chatId: string;
      chatTitle?: string;
      chatType?: string;
      botName?: string;
      botUsername?: string;
    },
    actor: RequestUser,
  ) {
    const token = (params.token || '').trim();
    const chatId = (params.chatId || '').trim();

    if (!token || !chatId) {
      throw new BadRequestException('Bot Token và Chat ID là bắt buộc');
    }

    const before = await this.prisma.platformSetting.findUnique({
      where: { setting_key: 'NOTIFICATIONS' },
    });

    const currentVal = (before?.setting_value as Record<string, any>) || {};

    const telegramState = {
      configured: true,
      isActive: true,
      botToken: token,
      bot: {
        name: params.botName || 'FitFlow Alert Bot',
        username: params.botUsername || '',
      },
      chat: {
        id: chatId,
        name: params.chatTitle || `Chat ${chatId}`,
        type: params.chatType || 'group',
      },
      status: 'CONNECTED',
      lastCheckedAt: new Date().toISOString(),
      lastError: null,
    };

    const newVal = {
      ...currentVal,
      telegram: telegramState,
    };

    const updated = await this.prisma.platformSetting.upsert({
      where: { setting_key: 'NOTIFICATIONS' },
      create: {
        setting_key: 'NOTIFICATIONS',
        setting_value: newVal,
        updated_by: actor.id,
      },
      update: {
        setting_value: newVal,
        updated_by: actor.id,
        updated_at: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PLATFORM_SETTING',
      entityId: null,
      action: 'TELEGRAM_CHANNEL_CONNECTED',
      beforeData: before ? { value: before.setting_value } : null,
      afterData: {
        chatId,
        botUsername: params.botUsername,
        chatTitle: params.chatTitle,
      },
    });

    // Return sanitized without raw botToken
    const sanitizedTele = { ...telegramState };
    delete (sanitizedTele as any).botToken;
    (sanitizedTele as any).hasToken = true;
    (sanitizedTele as any).chat.maskedChatId = maskChatId(chatId);

    return sanitizedTele;
  }

  /** Disconnect Telegram Channel */
  async disconnectTelegram(actor: RequestUser) {
    const before = await this.prisma.platformSetting.findUnique({
      where: { setting_key: 'NOTIFICATIONS' },
    });

    const currentVal = (before?.setting_value as Record<string, any>) || {};

    const newVal = {
      ...currentVal,
      telegram: {
        configured: false,
        isActive: false,
        status: 'DISCONNECTED',
        lastCheckedAt: new Date().toISOString(),
      },
    };

    await this.prisma.platformSetting.upsert({
      where: { setting_key: 'NOTIFICATIONS' },
      create: {
        setting_key: 'NOTIFICATIONS',
        setting_value: newVal,
        updated_by: actor.id,
      },
      update: {
        setting_value: newVal,
        updated_by: actor.id,
        updated_at: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'PLATFORM_SETTING',
      entityId: null,
      action: 'TELEGRAM_CHANNEL_DISCONNECTED',
      beforeData: null,
      afterData: null,
    });

    return { success: true };
  }

  /** Toggle Active state of Telegram Channel */
  async toggleTelegram(isActive: boolean, actor: RequestUser) {
    const before = await this.prisma.platformSetting.findUnique({
      where: { setting_key: 'NOTIFICATIONS' },
    });

    const currentVal = (before?.setting_value as Record<string, any>) || {};
    const tele = currentVal.telegram || {};

    tele.isActive = isActive;
    tele.status = isActive ? 'CONNECTED' : 'DISCONNECTED';
    tele.lastCheckedAt = new Date().toISOString();

    const newVal = {
      ...currentVal,
      telegram: tele,
    };

    await this.prisma.platformSetting.upsert({
      where: { setting_key: 'NOTIFICATIONS' },
      create: {
        setting_key: 'NOTIFICATIONS',
        setting_value: newVal,
        updated_by: actor.id,
      },
      update: {
        setting_value: newVal,
        updated_by: actor.id,
        updated_at: new Date(),
      },
    });

    return { success: true, isActive };
  }
}
