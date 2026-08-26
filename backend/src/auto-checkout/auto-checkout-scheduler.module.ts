import { Module } from '@nestjs/common';
import { AutoCheckoutSchedulerService } from './auto-checkout-scheduler.service';
import { ManagerModule } from '../manager/manager.module';

@Module({
  imports: [ManagerModule],
  providers: [AutoCheckoutSchedulerService],
})
export class AutoCheckoutSchedulerModule {}
