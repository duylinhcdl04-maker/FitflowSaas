-- Reverts the NT-2 3-role split from 2026-08-20-billing-cycle-months-and-platform-roles.sql.
-- Product decision: a single SUPER_ADMIN does everything on the platform side —
-- no PLATFORM_BILLING / PLATFORM_SUPPORT roles. Does NOT touch billing_cycle_months
-- (that part of the earlier migration stays).

BEGIN;

-- Demo platform staff accounts for the two roles being removed.
DELETE FROM user_roles
WHERE role_id IN (SELECT id FROM roles WHERE code IN ('PLATFORM_BILLING', 'PLATFORM_SUPPORT'));

DELETE FROM users
WHERE tenant_id IS NULL AND email IN ('billing@fitflow.vn', 'support@fitflow.vn');

-- Permission grants for every platform role (SUPER_ADMIN included — back to
-- plain @Roles(SUPER_ADMIN) guards, no permission-code enforcement).
DELETE FROM role_permissions
WHERE role_id IN (SELECT id FROM roles WHERE scope = 'PLATFORM');

-- The platform.* permission catalog seeded for the NT-2 model.
DELETE FROM permissions WHERE code LIKE 'platform.%';

-- The two extra internal roles.
DELETE FROM roles WHERE code IN ('PLATFORM_BILLING', 'PLATFORM_SUPPORT');

COMMIT;
