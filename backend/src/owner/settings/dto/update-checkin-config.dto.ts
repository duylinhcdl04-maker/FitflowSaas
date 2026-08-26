import { IsBoolean } from 'class-validator';

// OW-04d. Owner chọn phương thức Check-in được phép — Face chỉ hợp lệ khi
// Entitlement hiện tại có FACE_RECOGNITION (service tự kiểm tra).
export class UpdateCheckinConfigDto {
  @IsBoolean()
  qr!: boolean;

  @IsBoolean()
  manual!: boolean;

  @IsBoolean()
  face!: boolean;
}
