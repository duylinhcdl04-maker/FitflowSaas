-- Additive-only, applied by hand (see 2026-08-20 migration header — this DB is
-- managed via `prisma db pull`, not `prisma migrate`).
--
-- Adds "Add-on Management" (BE_Superadmin.md §9): sellable SKUs independent of
-- a Plan (FACE_RECOGNITION, EXTRA_BRANCH, ...), attachable to any compatible
-- subscription with their own pricing, distinct from a Plan's built-in
-- features (saas_plan_features / subscription_features).

CREATE TABLE IF NOT EXISTS addons (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                   VARCHAR(50) UNIQUE NOT NULL,
  name                   VARCHAR(150) NOT NULL,
  description            TEXT,
  pricing_model          VARCHAR(20) NOT NULL DEFAULT 'FIXED'
                           CHECK (pricing_model IN ('FIXED', 'PER_BRANCH', 'PER_USER', 'PER_USAGE')),
  price                  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency               CHAR(3) NOT NULL DEFAULT 'VND',
  -- Optional Entitlement effect (BR-SA-12 "Add-on có thể làm thay đổi
  -- Entitlement"). NULL effect_feature_code = pure billing SKU, no automatic
  -- effect. See AddonsService.recomputeEntitlement for how this is applied.
  effect_feature_code    VARCHAR(50),
  effect_type            VARCHAR(20) CHECK (effect_type IN ('QUOTA_DELTA', 'ENABLE_FEATURE')),
  effect_amount          INT,
  compatible_plan_codes  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], -- empty = compatible with every plan
  status                 VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One row per (subscription, addon) — mirrors subscription_features: updated
-- in place (status flips ACTIVE/CANCELLED) rather than inserting new rows,
-- consistent with this codebase's no-hard-delete convention.
CREATE TABLE IF NOT EXISTS subscription_addons (
  subscription_id        UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  addon_id               UUID NOT NULL REFERENCES addons(id),
  quantity               INT NOT NULL DEFAULT 1,
  price_snapshot         NUMERIC(15, 2) NOT NULL,
  pricing_model_snapshot VARCHAR(20) NOT NULL,
  status                 VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED')),
  added_by               UUID,
  added_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_by           UUID,
  cancelled_at           TIMESTAMPTZ,
  cancel_reason          TEXT,
  PRIMARY KEY (subscription_id, addon_id)
);

CREATE INDEX IF NOT EXISTS ix_subscription_addons_addon ON subscription_addons (addon_id);
