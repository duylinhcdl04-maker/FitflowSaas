import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

// SA-19: single-role architecture (see common/types/role.ts) — every account
// created here is automatically granted ROLE.SUPER_ADMIN. There is no role
// picker: AI_INSTRUCTIONS.md forbids inventing intermediate platform roles.
export class CreateStaffDto {
  @IsString()
  @MinLength(2, { message: 'Họ tên quá ngắn' })
  fullName!: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
