import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { AuthModule } from './auth/auth.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { OwnerModule } from './owner/owner.module';
import { ManagerModule } from './manager/manager.module';
import { PtModule } from './pt/pt.module';
import { CustomerModule } from './customer/customer.module';
import { RealtimeModule } from './realtime/realtime.module';
import { PaymentsGatewayModule } from './payments-gateway/payments-gateway.module';
import { AutoCheckoutSchedulerModule } from './auto-checkout/auto-checkout-scheduler.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    MailModule,
    AuthModule,
    SuperAdminModule,
    OwnerModule,
    ManagerModule,
    PtModule,
    CustomerModule,
    RealtimeModule,
    PaymentsGatewayModule,
    AutoCheckoutSchedulerModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
