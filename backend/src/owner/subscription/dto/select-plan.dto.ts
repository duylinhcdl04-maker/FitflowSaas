import { IsString, MinLength } from 'class-validator';

export class SelectPlanDto {
  @IsString()
  @MinLength(2)
  planCode!: string;
}
