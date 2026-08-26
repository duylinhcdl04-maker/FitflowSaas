import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

// SA-17 "Phạm vi" checkboxes.
export const SUPPORT_SESSION_SCOPES = [
  'CONFIG',
  'CUSTOMERS',
  'BILLING',
  'ATTENDANCE',
] as const;
export type SupportSessionScope = (typeof SUPPORT_SESSION_SCOPES)[number];

// SA-17 "Thời hạn" radio: 30 phút / 2 giờ / 8 giờ.
export const SUPPORT_SESSION_DURATIONS = [30, 120, 480] as const;

export class StartImpersonationDto {
  // Mandatory: BR-SA-005 requires a logged reason for every support session.
  @IsString()
  @MinLength(5, {
    message: 'Cần nêu lý do truy cập hỗ trợ (tối thiểu 5 ký tự)',
  })
  reason!: string;

  // Defaults to the tenant's Owner when omitted.
  @IsOptional()
  @IsString()
  targetUserId?: string;

  // SA-17 "Mức truy cập". Defaults true (BR-SA-004: read-only unless explicitly
  // elevated). Recorded on the persisted support_sessions row (access_level)
  // and on the JWT claim; DB/route-level enforcement is still blocked on the
  // tenant-facing API not existing yet — see SupportSessionsService doc comment.
  @IsOptional()
  @IsBoolean()
  readOnly?: boolean;

  // SA-17 "Phạm vi". Empty/omitted = no scope restriction recorded (legacy
  // callers before this field existed behave the same as before).
  @IsOptional()
  @IsArray()
  @IsIn(SUPPORT_SESSION_SCOPES, { each: true })
  scope?: SupportSessionScope[];

  // SA-17 "Thời hạn" — minutes. Defaults to 30 (the doc's default option).
  @IsOptional()
  @IsIn(SUPPORT_SESSION_DURATIONS)
  durationMinutes?: number;
}
