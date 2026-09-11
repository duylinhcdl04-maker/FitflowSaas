-- SaaS Plan Configuration & Entitlement Engine Migration
-- Additive-only, idempotent migration for FitFlow Platform.

-- 1. Alter saas_plans with extended metadata
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS slogan TEXT;
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS target_audience TEXT;
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS is_popular BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS badge_text VARCHAR(50);
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS support_tier VARCHAR(30) NOT NULL DEFAULT 'COMMUNITY';
ALTER TABLE saas_plans ADD COLUMN IF NOT EXISTS cta_text VARCHAR(50);

-- 2. Multi-cycle Plan Prices table
CREATE TABLE IF NOT EXISTS plan_prices (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id                UUID NOT NULL REFERENCES saas_plans(id) ON DELETE CASCADE,
  billing_cycle          VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'SEMI_ANNUAL', 'YEARLY')),
  billing_cycle_months   SMALLINT NOT NULL,
  price                  NUMERIC(15, 2) NOT NULL DEFAULT 0,
  currency               CHAR(3) NOT NULL DEFAULT 'VND',
  discount_percentage    NUMERIC(5, 2) NOT NULL DEFAULT 0,
  is_active              BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, billing_cycle_months)
);

CREATE INDEX IF NOT EXISTS ix_plan_prices_plan ON plan_prices (plan_id);

-- 3. Platform Quotas (10 quotas with metadata)
CREATE TABLE IF NOT EXISTS platform_quotas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  unit        VARCHAR(30) NOT NULL,
  module      VARCHAR(50) NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Plan Quotas (tri-state mode: LIMITED, UNLIMITED, DISABLED)
CREATE TABLE IF NOT EXISTS plan_quotas (
  plan_id     UUID NOT NULL REFERENCES saas_plans(id) ON DELETE CASCADE,
  quota_id    UUID NOT NULL REFERENCES platform_quotas(id) ON DELETE RESTRICT,
  mode        VARCHAR(20) NOT NULL DEFAULT 'LIMITED' CHECK (mode IN ('LIMITED', 'UNLIMITED', 'DISABLED')),
  quota_value INT,
  PRIMARY KEY (plan_id, quota_id)
);

-- 5. Platform Integrations (7 connectors)
CREATE TABLE IF NOT EXISTS platform_integrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) UNIQUE NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  category    VARCHAR(50) NOT NULL,
  icon        VARCHAR(50),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Plan Integrations
CREATE TABLE IF NOT EXISTS plan_integrations (
  plan_id        UUID NOT NULL REFERENCES saas_plans(id) ON DELETE CASCADE,
  integration_id UUID NOT NULL REFERENCES platform_integrations(id) ON DELETE RESTRICT,
  is_enabled     BOOLEAN NOT NULL DEFAULT false,
  config_options JSONB,
  PRIMARY KEY (plan_id, integration_id)
);

-- 7. Addon extensions
ALTER TABLE addons ADD COLUMN IF NOT EXISTS addon_type VARCHAR(30) NOT NULL DEFAULT 'RESOURCE'
  CHECK (addon_type IN ('RESOURCE', 'FEATURE', 'INTEGRATION'));

CREATE TABLE IF NOT EXISTS addon_quotas (
  addon_id    UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  quota_id    UUID NOT NULL REFERENCES platform_quotas(id) ON DELETE RESTRICT,
  added_value INT NOT NULL,
  PRIMARY KEY (addon_id, quota_id)
);

CREATE TABLE IF NOT EXISTS addon_features (
  addon_id   UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES platform_features(id) ON DELETE RESTRICT,
  PRIMARY KEY (addon_id, feature_id)
);
