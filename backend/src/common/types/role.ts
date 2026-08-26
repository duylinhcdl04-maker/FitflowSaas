// Mirrors the `code` values seeded in the `roles` table (roles.scope_check / seed data).
// Single Super Admin role for the whole platform side — no internal role split.
export const ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  BRANCH_MANAGER: 'BRANCH_MANAGER',
  STAFF: 'STAFF',
  PT: 'PT',
  CUSTOMER: 'CUSTOMER',
} as const;

export type RoleCode = (typeof ROLE)[keyof typeof ROLE];
