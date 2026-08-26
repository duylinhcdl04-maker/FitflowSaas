import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { TenantsModule } from './tenants/tenants.module';
import { PlansModule } from './plans/plans.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SupportSessionsModule } from './support-sessions/support-sessions.module';
import { ImpersonationModule } from './impersonation/impersonation.module';
import { StaffModule } from './staff/staff.module';
import { InvoicesModule } from './invoices/invoices.module';
import { SettingsModule } from './settings/settings.module';
import { AddonsModule } from './addons/addons.module';

@Module({
  imports: [
    DashboardModule,
    TenantsModule,
    PlansModule,
    SubscriptionsModule,
    AuditLogsModule,
    SupportSessionsModule,
    ImpersonationModule,
    StaffModule,
    InvoicesModule,
    SettingsModule,
    AddonsModule,
  ],
})
export class SuperAdminModule {}
