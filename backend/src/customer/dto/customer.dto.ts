import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CustomerChangePasswordDto {
  @IsString({ message: 'Mật khẩu hiện tại không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  currentPassword!: string;

  @IsString({ message: 'Mật khẩu mới không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  newPassword!: string;
}

export class UpdateCustomerProfileDto {
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh không hợp lệ' })
  dateOfBirth?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}

export class FaceConsentDto {
  @IsString({ message: 'Ảnh khuôn mặt không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng cung cấp ảnh khuôn mặt' })
  imageDataUrl!: string;
}

export class CreatePtBookingDto {
  @IsDateString({}, { message: 'Thời gian bắt đầu không hợp lệ' })
  scheduledStart!: string;

  @IsOptional()
  @IsDateString({}, { message: 'Thời gian kết thúc không hợp lệ' })
  scheduledEnd?: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CancelPtBookingDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

// page/pageSize deliberately have no numeric validator (matches
// owner/customers/dto/query-customers.dto.ts): ValidationPipe's `transform`
// doesn't coerce raw query strings to numbers without a class-transformer
// @Type() decorator, so `@IsInt()` here would reject a perfectly valid
// "?page=2" query string. parsePagination() (common/utils/pagination.ts)
// does its own `Number(...)` coercion, so these stay untyped-through.
export class QueryAttendanceDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;
}

export class QueryPaymentsDto {
  @IsOptional()
  page?: number;

  @IsOptional()
  pageSize?: number;

  // Not validated against a fixed enum — the DB's payments_status_check constraint
  // isn't mirrored in Prisma (see status column comment); pass through and let an
  // unknown value simply match nothing rather than reject a valid-but-unlisted one.
  @IsOptional()
  @IsString()
  status?: string;
}
