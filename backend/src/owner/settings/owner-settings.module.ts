import { Module } from '@nestjs/common';
import { OwnerSettingsController } from './owner-settings.controller';
import { OwnerSettingsService } from './owner-settings.service';
import { AutoCheckoutPolicyModule } from '../../auto-checkout/auto-checkout-policy.module';

@Module({
  imports: [AutoCheckoutPolicyModule],
  controllers: [OwnerSettingsController],
  providers: [OwnerSettingsService],
  // Cần cho ManagerModule đọc checkin_methods (getCheckinConfig, read-only) — Staff/Manager
  // không có quyền gọi /owner/settings/checkin-config (Roles(OWNER) only) nhưng UI của họ
  // (MemberDetailModal — Face ID tab) cần biết Owner có bật Face check-in hay không.
  exports: [OwnerSettingsService],
})
export class OwnerSettingsModule {}
