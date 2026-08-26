import { Module } from '@nestjs/common';
import { OwnerCheckinController } from './owner-checkin.controller';
import { OwnerCheckinService } from './owner-checkin.service';

@Module({
  controllers: [OwnerCheckinController],
  providers: [OwnerCheckinService],
})
export class OwnerCheckinModule {}
