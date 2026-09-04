import { SetMetadata } from '@nestjs/common';

export const REQUIRE_TENANT_KEY = 'require_tenant';
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);
