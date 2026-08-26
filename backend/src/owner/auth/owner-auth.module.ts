import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { OwnerSeedModule } from '../seed/owner-seed.module';
import { OwnerAuthController } from './owner-auth.controller';
import { OwnerAuthService } from './owner-auth.service';

@Module({
  imports: [AuthModule, OwnerSeedModule],
  controllers: [OwnerAuthController],
  providers: [OwnerAuthService],
})
export class OwnerAuthModule {}
