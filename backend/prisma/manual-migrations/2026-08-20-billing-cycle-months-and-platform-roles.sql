-- Manual migration (this DB is managed via `prisma db pull`, not `prisma migrate` —
-- see AI_INSTRUCTIONS.md / session history: `prisma migrate dev` would have reset
-- the whole public schema against 46+ pre-existing production tables).
--
-- Additive only. Nothing here drops or renames an existing column, constraint,
-- or row — matches BR-SA-001's "no destructive change" spirit extended to schema.
--
-- Part 1: configurable billing cycle (1-12 months) for SaaS Plans/Subscriptions,
--         alongside the existing billing_cycle enum column (kept for compatibility
--         with anything still reading MONTHLY/QUARTERLY/YEARLY/CUSTOM).
-- Part 2: NT-2 internal role split — PLATFORM_BILLING / PLATFORM_SUPPORT roles,
--         plus the platform.* permission catalog from UI_SuperAdmin.md section V.

BEGIN;

-- ── Part 1: billing_cycle_months ────────────────────────────────────────────

ALTER TABLE saas_plans
  ADD COLUMN IF NOT EXISTS billing_cycle_months SMALLINT
    CHECK (billing_cycle_months BETWEEN 1 AND 12);

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS billing_cycle_months SMALLINT
    CHECK (billing_cycle_months BETWEEN 1 AND 12);

-- Backfill from the legacy enum so existing rows report a real month count.
UPDATE saas_plans SET billing_cycle_months = CASE billing_cycle
  WHEN 'MONTHLY' THEN 1
  WHEN 'QUARTERLY' THEN 3
  WHEN 'YEARLY' THEN 12
  ELSE NULL
END
WHERE billing_cycle_months IS NULL;

UPDATE subscriptions SET billing_cycle_months = CASE billing_cycle
  WHEN 'MONTHLY' THEN 1
  WHEN 'QUARTERLY' THEN 3
  WHEN 'YEARLY' THEN 12
  ELSE NULL
END
WHERE billing_cycle_months IS NULL;

-- ── Part 2: internal role split (NT-2) + permission catalog (section V) ────

INSERT INTO roles (id, code, name, scope, description, is_system, created_at)
SELECT gen_random_uuid(), 'PLATFORM_BILLING', 'Platform Billing', 'PLATFORM',
       'Ke toan nen tang: goi, thue bao, hoa don, doi soat. Khong duoc khoa Tenant hay truy cap du lieu Tenant.',
       true, now()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'PLATFORM_BILLING');

INSERT INTO roles (id, code, name, scope, description, is_system, created_at)
SELECT gen_random_uuid(), 'PLATFORM_SUPPORT', 'Platform Support', 'PLATFORM',
       'CSKH / ky thuat: xem tenant, mo phien ho tro (mac dinh chi doc), xem log loi. Khong duoc sua goi hay doi trang thai Tenant.',
       true, now()
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE code = 'PLATFORM_SUPPORT');

-- Note: the existing SUPER_ADMIN role is kept as-is (not renamed) and treated as
-- the PLATFORM_ADMIN of NT-2 — full permissions, unchanged code so nothing that
-- already references role_id/code 'SUPER_ADMIN' (JWT payloads, seed.ts, other
-- migrations) breaks.

INSERT INTO permissions (id, code, module, action, description)
VALUES
  (gen_random_uuid(), 'platform.tenant.read', 'tenant', 'read', 'Xem danh sach va chi tiet doanh nghiep'),
  (gen_random_uuid(), 'platform.tenant.create', 'tenant', 'create', 'Tao doanh nghiep moi / chinh sua thong tin doanh nghiep'),
  (gen_random_uuid(), 'platform.tenant.suspend', 'tenant', 'suspend', 'Tam khoa / mo khoa doanh nghiep'),
  (gen_random_uuid(), 'platform.tenant.reset_owner', 'tenant', 'reset_owner', 'Dat lai mat khau tai khoan Owner'),
  (gen_random_uuid(), 'platform.plan.read', 'plan', 'read', 'Xem danh sach goi SaaS'),
  (gen_random_uuid(), 'platform.plan.manage', 'plan', 'manage', 'Tao / sua goi SaaS va tinh nang di kem'),
  (gen_random_uuid(), 'platform.subscription.read', 'subscription', 'read', 'Xem danh sach thue bao'),
  (gen_random_uuid(), 'platform.subscription.manage', 'subscription', 'manage', 'Doi goi, gia han, huy thue bao'),
  (gen_random_uuid(), 'platform.invoice.read', 'invoice', 'read', 'Xem hoa don SaaS'),
  (gen_random_uuid(), 'platform.invoice.manage', 'invoice', 'manage', 'Ghi nhan thanh toan hoa don'),
  (gen_random_uuid(), 'platform.invoice.reconcile', 'invoice', 'reconcile', 'Doi soat giao dich thanh toan'),
  (gen_random_uuid(), 'platform.feature.manage', 'feature', 'manage', 'Quan ly danh muc tinh nang nen tang'),
  (gen_random_uuid(), 'platform.monitoring.read', 'monitoring', 'read', 'Xem suc khoe he thong'),
  (gen_random_uuid(), 'platform.error.read', 'error', 'read', 'Xem nhat ky loi'),
  (gen_random_uuid(), 'platform.support.readonly', 'support', 'readonly', 'Mo phien ho tro chi doc'),
  (gen_random_uuid(), 'platform.support.write', 'support', 'write', 'Mo phien ho tro co thao tac'),
  (gen_random_uuid(), 'platform.audit.read', 'audit', 'read', 'Xem nhat ky kiem toan'),
  (gen_random_uuid(), 'platform.user.manage', 'user', 'manage', 'Quan ly tai khoan nhan su FitFlow'),
  (gen_random_uuid(), 'platform.setting.manage', 'setting', 'manage', 'Quan ly cai dat nen tang')
ON CONFLICT (code) DO NOTHING;

-- SUPER_ADMIN (= PLATFORM_ADMIN of NT-2): every platform.* permission.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'SUPER_ADMIN' AND p.code LIKE 'platform.%'
ON CONFLICT DO NOTHING;

-- PLATFORM_BILLING: everything money-related, no suspend/reset_owner/support/feature/monitoring/error/user.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PLATFORM_BILLING'
  AND p.code IN (
    'platform.tenant.read', 'platform.tenant.create',
    'platform.plan.read', 'platform.plan.manage',
    'platform.subscription.read', 'platform.subscription.manage',
    'platform.invoice.read', 'platform.invoice.manage', 'platform.invoice.reconcile',
    'platform.audit.read', 'platform.setting.manage'
  )
ON CONFLICT DO NOTHING;

-- PLATFORM_SUPPORT: read-heavy, reset_owner (with approval, not yet enforced), read-only support sessions.
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.code = 'PLATFORM_SUPPORT'
  AND p.code IN (
    'platform.tenant.read', 'platform.tenant.reset_owner',
    'platform.plan.read', 'platform.subscription.read', 'platform.invoice.read',
    'platform.monitoring.read', 'platform.error.read',
    'platform.support.readonly', 'platform.audit.read'
  )
ON CONFLICT DO NOTHING;

COMMIT;
