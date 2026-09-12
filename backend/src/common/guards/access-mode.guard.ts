import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { deriveAccessMode } from '../utils/access-mode';
import { BYPASS_ACCESS_MODE_KEY } from '../decorators/bypass-access-mode.decorator';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * BR-TRIAL-06 (frontend/docs/UI_Owner.md) — enforce Access Mode
 * (FULL_ACCESS/READ_ONLY/BLOCKED) tính bởi `deriveAccessMode()` ở tầng
 * request, không chỉ trả về để hiển thị như trước đây (owner-dashboard,
 * owner-subscription). Nguyên tắc: KHÔNG BAO GIỜ xoá dữ liệu — guard này chỉ
 * chặn ghi (READ_ONLY) hoặc chặn toàn bộ (BLOCKED), không đụng tới dữ liệu.
 *
 * - READ_ONLY (Trial/Subscription hết hạn, còn trong Grace Period 30 ngày):
 *   vẫn cho xem (GET/HEAD/OPTIONS), chặn mọi thao tác ghi.
 * - BLOCKED (hết Grace Period, hoặc Tenant bị SuperAdmin khoá): chặn toàn bộ,
 *   trừ các route được đánh dấu `@BypassAccessMode()` (đăng nhập,
 *   Subscription/Billing, webhook thanh toán) để Owner còn đường tự khôi
 *   phục quyền truy cập.
 */
@Injectable()
export class AccessModeGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const tenant = request.tenant;

    // Route không thuộc phạm vi 1 Tenant cụ thể (SuperAdmin, health-check,
    // webhook không định danh qua header/host...) — không có gì để enforce.
    if (!tenant) return true;

    const isBypassed = this.reflector.getAllAndOverride<boolean>(
      BYPASS_ACCESS_MODE_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (isBypassed) return true;

    const subscription = await this.prisma.subscription.findUnique({
      where: { tenant_id: tenant.id },
      select: { status: true, trial_ends_at: true, end_date: true },
    });
    // Chưa có Subscription (race condition hiếm khi Tenant vừa tạo xong) —
    // không đủ căn cứ để chặn, ưu tiên an toàn cho người dùng thay vì khoá nhầm.
    if (!subscription) return true;

    const accessMode = deriveAccessMode({
      tenantStatus: tenant.status,
      subscriptionStatus: subscription.status,
      trialEndsAt: subscription.trial_ends_at,
      subscriptionEndDate: subscription.end_date,
    });

    if (accessMode === 'FULL_ACCESS') return true;

    if (accessMode === 'BLOCKED') {
      throw new ForbiddenException(
        'Cửa hàng đã hết thời gian dùng thử và quá hạn gia hạn (30 ngày). Vui lòng nâng cấp gói để tiếp tục sử dụng — toàn bộ dữ liệu của bạn vẫn được lưu giữ an toàn.',
      );
    }

    // READ_ONLY: chỉ chặn thao tác ghi, vẫn cho xem dữ liệu hiện có.
    if (!SAFE_METHODS.has(request.method)) {
      throw new ForbiddenException(
        'Thời gian dùng thử đã hết hạn. Bạn có thể xem dữ liệu hiện có nhưng không thể tạo/sửa/xoá cho đến khi nâng cấp gói.',
      );
    }

    return true;
  }
}
