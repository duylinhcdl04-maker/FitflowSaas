-- Additive-only, applied by hand (this DB is managed via `prisma db pull`,
-- not `prisma migrate` — see 2026-08-20 migration header).
--
-- Supports the Owner self-serve onboarding flow (frontend/docs/UI_Owner.md):
-- registration + OTP verification, Tenant creation with a 7-day Trial, and
-- BR-TRIAL-04 (one Trial per user, tracked in trial_history).

-- 1. OTP codes for email/phone verification (registration today; the table is
-- purpose-tagged so a password-reset OTP flow can reuse it later).
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     VARCHAR(30) NOT NULL DEFAULT 'REGISTER_VERIFY',
  code_hash   TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  attempts    INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_otp_codes_user
  ON otp_codes (user_id, purpose, created_at DESC);

-- 2. BR-TRIAL-04: MVP trial-abuse control — one Trial per user account,
-- flagged on the user row, with full history kept for SuperAdmin's manual
-- anomaly review (per the accepted "cách xử lý tốt nhất cho MVP").
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS trial_history (
  trial_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id),
  tenant_id  UUID NOT NULL REFERENCES tenants(id),
  start_at   TIMESTAMPTZ NOT NULL,
  end_at     TIMESTAMPTZ NOT NULL,
  status     VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_trial_history_user ON trial_history (user_id);

-- 3. Data fix: the seeded "TRIAL" saas_plans row predates every business-rule
-- doc (PackageSaasTrial.md, BE_Owner.md, UI_Owner.md all agree on different
-- numbers than what was seeded: 14 days / 5 branches / 50 staff). Align it
-- with the decision actually made for the Owner self-serve flow: 7 days,
-- 1 branch, up to 10 staff.
UPDATE saas_plans SET trial_days = 7 WHERE code = 'TRIAL';

UPDATE saas_plan_features spf
SET quota_value = 1
FROM saas_plans sp, platform_features pf
WHERE spf.plan_id = sp.id AND spf.feature_id = pf.id
  AND sp.code = 'TRIAL' AND pf.code = 'MAX_BRANCHES';

UPDATE saas_plan_features spf
SET quota_value = 10
FROM saas_plans sp, platform_features pf
WHERE spf.plan_id = sp.id AND spf.feature_id = pf.id
  AND sp.code = 'TRIAL' AND pf.code = 'MAX_STAFF';
