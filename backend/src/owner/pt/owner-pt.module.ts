import { Module } from '@nestjs/common';
import { OwnerPtController } from './owner-pt.controller';
import { OwnerPtService } from './owner-pt.service';

@Module({
  controllers: [OwnerPtController],
  providers: [OwnerPtService],
})
export class OwnerPtModule {}
