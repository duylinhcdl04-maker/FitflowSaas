import { IsString, MinLength } from 'class-validator';

// NT-5: gỡ một add-on có thể lấy đi tính năng/hạn mức Tenant đang dùng — bắt
// buộc lý do, khác với gắn thêm (routine, không bắt buộc).
export class CancelAddonDto {
  @IsString()
  @MinLength(5, { message: 'Cần nêu lý do gỡ add-on (tối thiểu 5 ký tự)' })
  reason!: string;
}
