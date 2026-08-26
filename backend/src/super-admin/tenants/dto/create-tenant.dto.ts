import { Type } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
  ValidateNested,
} from 'class-validator';

class NewOwnerDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8, { message: 'Mật khẩu tối thiểu 8 ký tự' })
  password!: string;
}

export class CreateTenantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @Matches(/^[a-z0-9-]{2,50}$/, {
    message: 'Mã tenant chỉ gồm chữ thường, số và dấu gạch ngang',
  })
  code!: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  taxCode?: string;

  @IsEmail()
  contactEmail!: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsString()
  planCode!: string;

  @ValidateNested()
  @Type(() => NewOwnerDto)
  owner!: NewOwnerDto;
}
