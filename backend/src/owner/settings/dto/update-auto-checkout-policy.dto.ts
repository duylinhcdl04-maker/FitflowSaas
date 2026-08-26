import { IsIn, IsNotEmpty, IsOptional, IsNumber, Max, Min } from 'class-validator';

export class UpdateAutoCheckoutPolicyDto {
  @IsIn(['DURATION', 'CLOSING_TIME'], { message: 'Chế độ tự động check-out không hợp lệ' })
  @IsNotEmpty()
  mode!: 'DURATION' | 'CLOSING_TIME';

  /** Required when mode = 'DURATION'. */
  @IsOptional()
  @IsNumber()
  @Min(1, { message: 'Số giờ tự động check-out tối thiểu là 1' })
  @Max(24, { message: 'Số giờ tự động check-out tối đa là 24' })
  hours?: number;
}
