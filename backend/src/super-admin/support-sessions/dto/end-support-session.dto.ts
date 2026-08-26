import { IsOptional, IsString } from 'class-validator';

// Ending early is a routine, expected action (support finished before the
// time-box ran out) — unlike starting a session, a reason here is a courtesy
// note, not a mandated audit fact, so it stays optional.
export class EndSupportSessionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
