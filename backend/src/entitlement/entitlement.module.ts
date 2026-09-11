import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementService } from './entitlement.service';
import { EntitlementController } from './entitlement.controller';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [EntitlementController],
  providers: [EntitlementService],
  exports: [EntitlementService],
})
export class EntitlementModule {}
