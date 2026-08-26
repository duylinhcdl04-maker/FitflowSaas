import { Module } from '@nestjs/common';
import { ManagerController } from './manager.controller';
import { ManagerService } from './manager.service';
import { SalesFulfillmentService } from './sales-fulfillment.service';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [RealtimeModule],
  controllers: [ManagerController],
  providers: [ManagerService, SalesFulfillmentService],
  exports: [ManagerService, SalesFulfillmentService],
})
export class ManagerModule {}
