import { IsString, MinLength } from 'class-validator';

export class RejectPackageDto {
  @IsString()
  @MinLength(3, { message: 'Cần nêu lý do từ chối' })
  reason!: string;
}
