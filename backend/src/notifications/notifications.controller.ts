import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { RequestUser } from '../common/types/jwt-payload';
import { NotificationsService } from './notifications.service';

// Không @Roles() riêng — chuông thông báo dùng chung cho mọi role trong tenant
// (Owner/Manager/Staff/PT), mỗi người chỉ thấy thông báo gửi riêng cho mình.
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@CurrentUser() user: RequestUser) {
    return this.notificationsService.list(user.tenantId!, user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  markRead(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notificationsService.markRead(user.tenantId!, user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  markAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllRead(user.tenantId!, user.id);
  }

  @Delete('read')
  removeAllRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.removeAllRead(user.tenantId!, user.id);
  }

  @Delete(':id')
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.notificationsService.remove(user.tenantId!, user.id, id);
  }
}
