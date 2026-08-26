import { Body, Controller, Headers, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { SepayWebhookService } from './sepay-webhook.service';

/**
 * Public SePay IPN endpoint — no @UseGuards on purpose (matches the
 * `acceptInvite`-style convention used elsewhere for genuinely public routes;
 * this codebase has no @Public() decorator / global guard to bypass).
 * Authenticity is verified inside the service via the per-account SePay API Key.
 */
@Controller('webhooks/sepay')
export class SepayWebhookController {
  constructor(private readonly sepayWebhookService: SepayWebhookService) {}

  @Post(':tenantId/:paymentAccountId')
  @HttpCode(HttpStatus.OK)
  handleIpn(
    @Param('tenantId') tenantId: string,
    @Param('paymentAccountId') paymentAccountId: string,
    @Headers('authorization') authorization: string | undefined,
    @Body() payload: any,
  ) {
    return this.sepayWebhookService.handleIpn(tenantId, paymentAccountId, authorization, payload);
  }
}
