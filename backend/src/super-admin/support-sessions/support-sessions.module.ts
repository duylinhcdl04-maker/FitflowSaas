import { Module } from '@nestjs/common';
import { SupportSessionsController } from './support-sessions.controller';
import { SupportSessionsService } from './support-sessions.service';

@Module({
  controllers: [SupportSessionsController],
  providers: [SupportSessionsService],
  exports: [SupportSessionsService],
})
export class SupportSessionsModule {}
