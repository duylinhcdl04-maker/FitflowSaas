import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreateAddonDto } from './create-addon.dto';

export const ADDON_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type AddonStatus = (typeof ADDON_STATUSES)[number];

// BR-FEATURE-01 style rule: an add-on's `code` is a technical identifier
// referenced by subscription_addons and must not change after creation, same
// rule already applied to SaasPlan.code. `code` stays in the inherited shape
// (matches UpdatePlanDto's convention) but AddonsService.update() never
// forwards it to Prisma — see that method.
export class UpdateAddonDto extends PartialType(CreateAddonDto) {
  @IsOptional()
  @IsIn(ADDON_STATUSES)
  status?: AddonStatus;
}
