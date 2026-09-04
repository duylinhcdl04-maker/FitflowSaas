import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
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
import { TenantsModule } from './tenants/tenants.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { TenantGuard } from './common/guards/tenant.guard';

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
    TenantsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: TenantGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

