import { IsString, MinLength } from 'class-validator';

// BR-INVITE-01: nhân sự tự đặt mật khẩu, Owner không đặt hộ.
export class AcceptInviteDto {
  @IsString()
  invitationId!: string;

  @IsString()
  token!: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password!: string;
}
