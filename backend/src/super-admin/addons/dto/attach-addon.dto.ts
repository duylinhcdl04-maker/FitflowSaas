import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class AttachAddonDto {
  @IsString()
  addonCode!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number;
}
