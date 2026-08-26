import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../../super-admin/subscriptions/subscriptions.module';
import { OwnerSubscriptionController } from './owner-subscription.controller';
import { OwnerSubscriptionService } from './owner-subscription.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [OwnerSubscriptionController],
  providers: [OwnerSubscriptionService],
})
export class OwnerSubscriptionModule {}
