import { Module } from '@nestjs/common';
import { PtController } from './pt.controller';
import { PtService } from './pt.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PtController],
  providers: [PtService],
  exports: [PtService],
})
export class PtModule {}
