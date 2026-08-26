import { SetMetadata } from '@nestjs/common';
import type { RoleCode } from '../types/role';

export const ROLES_KEY = 'roles';

/** Restricts a route to the given role codes. Combine with RolesGuard. */
export const Roles = (...roles: RoleCode[]) => SetMetadata(ROLES_KEY, roles);
