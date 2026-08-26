import { Module } from '@nestjs/common';
import { OwnerBranchesController } from './owner-branches.controller';
import { OwnerBranchesService } from './owner-branches.service';

@Module({
  controllers: [OwnerBranchesController],
  providers: [OwnerBranchesService],
  exports: [OwnerBranchesService],
})
export class OwnerBranchesModule {}
