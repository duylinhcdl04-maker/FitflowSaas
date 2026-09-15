import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { SepayWebhookService } from './sepay-webhook.service';
import { BypassAccessMode } from '../common/decorators/bypass-access-mode.decorator';

/**
 * Public SePay IPN endpoint — no @UseGuards on purpose (matches the
 * `acceptInvite`-style convention used elsewhere for genuinely public routes;
 * this codebase has no @Public() decorator / global guard to bypass).
 * Authenticity is verified inside the service via the per-account SePay API Key.
 *
 * @BypassAccessMode: request.tenant thường là null ở đây (SePay không gửi
 * header x-tenant-slug), nhưng khai báo tường minh để không bao giờ có rủi ro
 * một thanh toán hợp lệ — chính là thứ giúp Tenant thoát khỏi READ_ONLY/BLOCKED
 * — bị AccessModeGuard chặn nhầm.
 */
@BypassAccessMode()
@Controller('webhooks/sepay')
export class SepayWebhookController {
  constructor(private readonly sepayWebhookService: SepayWebhookService) {}

  @Post('platform')
  @HttpCode(HttpStatus.OK)
  handlePlatformIpn(
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: any,
  ) {
    return this.sepayWebhookService.handlePlatformIpn(authorization, payload);
  }

  @Post(':tenantId/:paymentAccountId')
  @HttpCode(HttpStatus.OK)
  handleIpn(
    @Param('tenantId') tenantId: string,
    @Param('paymentAccountId') paymentAccountId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: any,
  ) {
    return this.sepayWebhookService.handleIpn(
      tenantId,
      paymentAccountId,
      authorization,
      payload,
    );
  }
}
