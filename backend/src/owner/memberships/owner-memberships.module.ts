import { Module } from '@nestjs/common';
import { OwnerMembershipsController } from './owner-memberships.controller';
import { OwnerMembershipsService } from './owner-memberships.service';

@Module({
  controllers: [OwnerMembershipsController],
  providers: [OwnerMembershipsService],
})
export class OwnerMembershipsModule {}
