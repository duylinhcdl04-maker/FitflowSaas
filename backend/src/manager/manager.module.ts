import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';
import { RealtimeModule } from '../realtime/realtime.module';
import { AutoCheckoutPolicyModule } from '../auto-checkout/auto-checkout-policy.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    RealtimeModule,
    AutoCheckoutPolicyModule,
    NotificationsModule,
    JwtModule.register({}),
  ],
  controllers: [ManagerController],
  providers: [ManagerService, SalesFulfillmentService],
  exports: [ManagerService, SalesFulfillmentService],
})
export class ManagerModule {}
