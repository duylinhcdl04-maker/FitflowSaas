import { IsNotEmpty, IsString } from 'class-validator';

export class LookupAccountNameDto {
  /** Bank BIN from the VietQR bank list (e.g. "970436" for Vietcombank). */
  @IsString({ message: 'Vui lòng chọn ngân hàng' })
  @IsNotEmpty({ message: 'Vui lòng chọn ngân hàng' })
  bin!: string;

  @IsString({ message: 'Số tài khoản không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng nhập số tài khoản' })
  accountNumber!: string;
}
