import type { RoleCode } from './role';

export interface ImpersonationClaim {
  by: string; // Super Admin user id who started the session
  reason: string;
  readOnly: boolean; // SA-17: "Chỉ đọc" vs "Có thao tác" access level
  sessionId: string; // support_sessions.id — the persisted record backing this token
}

export interface JwtPayload {
  sub: string; // user id
  tenantId: string | null;
  userType: 'PLATFORM' | 'TENANT' | 'CUSTOMER';
  roles: RoleCode[];
  impersonation?: ImpersonationClaim;
}

export interface RequestUser extends JwtPayload {
  id: string; // alias of sub, set by JwtStrategy for convenience
  selectedBranchId?: string; // from X-Branch-Id header or query branchId
}
