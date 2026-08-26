import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

// OW-04a. `code` không có trên wireframe gốc — tự sinh từ tên nếu bỏ trống,
// giữ tuỳ chọn nhập tay cho Owner muốn đặt riêng.
export class CreateBranchDto {
  @IsString()
  @MinLength(2, { message: 'Tên chi nhánh quá ngắn' })
  name!: string;

  @IsOptional()
  @Matches(/^[a-z0-9-]{2,50}$/, {
    message: 'Mã chi nhánh chỉ gồm chữ thường, số và dấu gạch ngang',
  })
  code?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  openingDays?: string;

  // "HH:mm" — service tự ghép thành giờ Postgres.
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Định dạng giờ không hợp lệ (HH:mm)',
  })
  openingTime?: string;

  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'Định dạng giờ không hợp lệ (HH:mm)',
  })
  closingTime?: string;

  // OW-11b. Gán ngay các Quản lý chi nhánh đang "chưa được giao" (từ
  // owner/branch-managers) cho chi nhánh mới này — tuỳ chọn, không bắt buộc.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  managerIds?: string[];
}
