import { Module } from '@nestjs/common';
import { OwnerSeedService } from './owner-seed.service';

@Module({
  providers: [OwnerSeedService],
  exports: [OwnerSeedService],
})
export class OwnerSeedModule {}
