import { BadRequestException, Injectable } from '@nestjs/common';
import type { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { writeAuditLog } from '../../common/utils/audit';
import type { RequestUser } from '../../common/types/jwt-payload';
import {
  PLATFORM_SETTING_KEYS,
  PlatformSettingKey,
  UpsertSettingDto,
} from './dto/upsert-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Always returns every known key, `null` for ones nobody has configured yet. */
  async getAll() {
    const rows = await this.prisma.platformSetting.findMany();
    const byKey = new Map(rows.map((r) => [r.setting_key, r]));

    return Object.fromEntries(
      PLATFORM_SETTING_KEYS.map((key) => [
        key,
        {
          value: byKey.get(key)?.setting_value ?? null,
          updatedAt: byKey.get(key)?.updated_at ?? null,
        },
      ]),
    );
  }

  async upsert(key: string, dto: UpsertSettingDto, actor: RequestUser) {
    if (!PLATFORM_SETTING_KEYS.includes(key as PlatformSettingKey)) {
      throw new BadRequestException(`Không hỗ trợ nhóm cài đặt "${key}"`);
    }

    const before = await this.prisma.platformSetting.findUnique({
      where: { setting_key: key },
    });

    const value = dto.value as Prisma.InputJsonValue;
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
}
