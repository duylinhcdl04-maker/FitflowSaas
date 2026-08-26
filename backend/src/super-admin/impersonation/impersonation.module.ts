import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module';
import { SupportSessionsModule } from '../support-sessions/support-sessions.module';
import { ImpersonationController } from './impersonation.controller';
import { ImpersonationService } from './impersonation.service';

@Module({
  imports: [AuthModule, SupportSessionsModule],
  controllers: [ImpersonationController],
  providers: [ImpersonationService],
})
export class ImpersonationModule {}
