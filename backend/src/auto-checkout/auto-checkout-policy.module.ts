import { Module } from '@nestjs/common';
import { AutoCheckoutPolicyService } from './auto-checkout-policy.service';

@Module({
  providers: [AutoCheckoutPolicyService],
  exports: [AutoCheckoutPolicyService],
})
export class AutoCheckoutPolicyModule {}
