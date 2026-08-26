import { Module } from '@nestjs/common';
import { OwnerAuthModule } from './auth/owner-auth.module';
import { OwnerDashboardModule } from './dashboard/owner-dashboard.module';
import { OwnerBranchesModule } from './branches/owner-branches.module';
import { OwnerStaffModule } from './staff/owner-staff.module';
import { OwnerCatalogModule } from './catalog/owner-catalog.module';
import { OwnerSettingsModule } from './settings/owner-settings.module';
import { OwnerSubscriptionModule } from './subscription/owner-subscription.module';
import { OwnerCustomersModule } from './customers/owner-customers.module';
import { OwnerCheckinModule } from './checkin/owner-checkin.module';
import { OwnerMembershipsModule } from './memberships/owner-memberships.module';
import { OwnerPtModule } from './pt/owner-pt.module';
import { OwnerBranchManagersModule } from './branch-managers/owner-branch-managers.module';

@Module({
  imports: [
    OwnerAuthModule,
    OwnerDashboardModule,
    OwnerBranchesModule,
    OwnerStaffModule,
    OwnerCatalogModule,
    OwnerSettingsModule,
    OwnerSubscriptionModule,
    OwnerCustomersModule,
    OwnerCheckinModule,
    OwnerMembershipsModule,
    OwnerPtModule,
    OwnerBranchManagersModule,
  ],
})
export class OwnerModule {}
