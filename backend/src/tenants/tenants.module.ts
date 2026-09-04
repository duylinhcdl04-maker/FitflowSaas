import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantResolverService } from './tenant-resolver.service';

@Module({
  controllers: [TenantsController],
  providers: [TenantResolverService],
  exports: [TenantResolverService],
})
export class TenantsModule {}
