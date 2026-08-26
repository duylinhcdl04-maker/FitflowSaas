import { Module } from '@nestjs/common';
import { OwnerSettingsController } from './owner-settings.controller';
import { OwnerSettingsService } from './owner-settings.service';
import { AutoCheckoutPolicyModule } from '../../auto-checkout/auto-checkout-policy.module';

@Module({
  imports: [AutoCheckoutPolicyModule],
  controllers: [OwnerSettingsController],
  providers: [OwnerSettingsService],
})
export class OwnerSettingsModule {}
