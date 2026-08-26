import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateTenantDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;
}
