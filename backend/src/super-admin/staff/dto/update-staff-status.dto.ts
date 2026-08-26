import { IsIn, IsString, MinLength } from 'class-validator';

export const STAFF_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type StaffStatus = (typeof STAFF_STATUSES)[number];

// NT-5: no optional reason box anywhere in this area.
export class UpdateStaffStatusDto {
  @IsIn(STAFF_STATUSES)
  status!: StaffStatus;

  @IsString()
  @MinLength(5, { message: 'Cần nêu lý do (tối thiểu 5 ký tự)' })
  reason!: string;
}
