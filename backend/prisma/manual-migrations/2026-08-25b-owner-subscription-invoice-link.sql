-- Owner Subscription lifecycle (OW-06b/07/08): links an invoice to the plan
-- it was raised for, so that once SuperAdmin confirms payment (SA-10), the
-- Subscription can be activated onto that exact plan. Nullable — invoices
-- created ad hoc by SuperAdmin (not from an Owner plan-change request) keep
-- this NULL and never trigger auto-activation.
ALTER TABLE saas_invoices
  ADD COLUMN IF NOT EXISTS target_plan_id UUID REFERENCES saas_plans(id);
