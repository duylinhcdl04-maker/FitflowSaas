import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ROLE } from '../../common/types/role';
import type { RequestUser } from '../../common/types/jwt-payload';
import { SettingsService } from './settings.service';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';

@Controller('super-admin/settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get('public')
  getPublicBranding() {
    return this.settingsService.getPublicBranding();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Get('banks')
  listBanks() {
    return this.settingsService.listBanks();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Get()
  getAll() {
    return this.settingsService.getAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Post('upload')
  async upload(@Body() body: { dataUri: string; folder?: string }) {
    if (!body?.dataUri) {
      throw new BadRequestException(
        'Dữ liệu hình ảnh (dataUri) không được để trống',
      );
    }
    const url = await this.cloudinaryService.uploadImage(
      body.dataUri,
      body.folder || 'fitflow/platform-branding',
    );
    return { url };
  }

  // =========================================================================
  // TELEGRAM INTEGRATION ENDPOINTS
  // =========================================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Post('telegram/verify')
  verifyTelegram(@Body() body: { token: string }) {
    return this.settingsService.verifyTelegramBot(body?.token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Post('telegram/discover-chats')
  discoverTelegramChats(@Body() body: { token: string }) {
    return this.settingsService.discoverTelegramChats(body?.token);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Post('telegram/test')
  testTelegram(
    @Body() body: { token?: string; chatId: string; text?: string },
  ) {
    return this.settingsService.testTelegramMessage(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Post('telegram/save')
  saveTelegram(
    @Body()
    body: {
      token: string;
      chatId: string;
      chatTitle?: string;
      chatType?: string;
      botName?: string;
      botUsername?: string;
    },
    @CurrentUser() actor: RequestUser,
  ) {
    return this.settingsService.saveTelegramConnection(body, actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Post('telegram/disconnect')
  disconnectTelegram(@CurrentUser() actor: RequestUser) {
    return this.settingsService.disconnectTelegram(actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Patch('telegram/toggle')
  toggleTelegram(
    @Body() body: { isActive: boolean },
    @CurrentUser() actor: RequestUser,
  ) {
    return this.settingsService.toggleTelegram(Boolean(body?.isActive), actor);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.SUPER_ADMIN)
  @Put(':key')
  upsert(
    @Param('key') key: string,
    @Body() dto: UpsertSettingDto,
    @CurrentUser() actor: RequestUser,
  ) {
    return this.settingsService.upsert(key, dto, actor);
  }
}
