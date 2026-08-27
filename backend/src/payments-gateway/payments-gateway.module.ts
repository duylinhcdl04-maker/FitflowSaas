import { Module } from '@nestjs/common';
import { SepayWebhookController } from './sepay-webhook.controller';
import { SepayWebhookService } from './sepay-webhook.service';
import { ManagerModule } from '../manager/manager.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [ManagerModule, RealtimeModule, NotificationsModule],
  controllers: [SepayWebhookController],
  providers: [SepayWebhookService],
})
export class PaymentsGatewayModule {}
