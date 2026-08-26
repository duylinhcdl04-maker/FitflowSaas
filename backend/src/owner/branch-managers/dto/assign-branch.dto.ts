import { IsString } from 'class-validator';

export class AssignBranchDto {
  @IsString()
  branchId!: string;
}
