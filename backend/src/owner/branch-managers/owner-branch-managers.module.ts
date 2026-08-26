import { Module } from '@nestjs/common';
import { OwnerBranchManagersController } from './owner-branch-managers.controller';
import { OwnerBranchManagersService } from './owner-branch-managers.service';

@Module({
  controllers: [OwnerBranchManagersController],
  providers: [OwnerBranchManagersService],
  exports: [OwnerBranchManagersService],
})
export class OwnerBranchManagersModule {}
