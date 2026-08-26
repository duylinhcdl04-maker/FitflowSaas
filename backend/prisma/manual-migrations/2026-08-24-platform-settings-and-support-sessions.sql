-- Additive-only. This DB is managed via `prisma db pull`, not `prisma migrate`
-- (see 2026-08-20-billing-cycle-months-and-platform-roles.sql header) — apply by
-- hand against the real database, then refresh schema.prisma to match.
--
-- Adds storage for two SuperAdmin features:
--   1. SA-20 Cài đặt nền tảng — a flexible key/value platform settings store,
--      mirroring the existing per-tenant `tenant_settings` table shape.
--   2. SA-17 Phiên hỗ trợ (hardening) — persists impersonation/support sessions
--      instead of the JWT-only, ephemeral approach, per BR-SA-003/004/005:
--      "có thời hạn, có lý do, có ghi nhận" needs a queryable record, not just
--      a token that disappears once it expires.

-- 1. Platform-wide settings (SA-20). One row per known setting key; value is a
-- free-form JSON blob so each group (branding, dunning thresholds, security,
-- tenant defaults, notification webhooks) can evolve its own shape without a
-- schema migration per field.
CREATE TABLE IF NOT EXISTS platform_settings (
  setting_key   VARCHAR(100) PRIMARY KEY,
  setting_value JSONB NOT NULL,
  updated_by    UUID,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Support sessions (SA-17). One row per "Mở phiên hỗ trợ" action.
CREATE TABLE IF NOT EXISTS support_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      UUID NOT NULL REFERENCES tenants(id),
  actor_user_id  UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  access_level   VARCHAR(20) NOT NULL DEFAULT 'READ_ONLY'
                   CHECK (access_level IN ('READ_ONLY', 'WRITE')),
  scope          TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  reason         TEXT NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                   CHECK (status IN ('ACTIVE', 'ENDED', 'EXPIRED')),
  started_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at     TIMESTAMPTZ NOT NULL,
  ended_at       TIMESTAMPTZ,
  ended_by       UUID REFERENCES users(id),
  end_reason     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_support_sessions_tenant
  ON support_sessions (tenant_id, started_at DESC);

-- Ties every audit_logs row written during a support session back to that
-- session, so a Tenant's SA-03 "Phiên hỗ trợ" tab can eventually show not just
-- that a session happened but what was read/changed during it (BR-SA-005).
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS support_session_id UUID;

CREATE INDEX IF NOT EXISTS ix_audit_support_session
  ON audit_logs (support_session_id)
  WHERE support_session_id IS NOT NULL;
