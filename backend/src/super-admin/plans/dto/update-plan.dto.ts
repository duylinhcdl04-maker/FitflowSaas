import { PartialType } from '@nestjs/mapped-types';
import { IsIn, IsOptional } from 'class-validator';
import { CreatePlanDto } from './create-plan.dto';

export const PLAN_STATUSES = ['ACTIVE', 'INACTIVE'] as const;

export class UpdatePlanDto extends PartialType(CreatePlanDto) {
  @IsOptional()
  @IsIn(PLAN_STATUSES)
  status?: (typeof PLAN_STATUSES)[number];
}
