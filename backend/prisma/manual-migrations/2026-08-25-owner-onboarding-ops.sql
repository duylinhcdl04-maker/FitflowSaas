-- Additive-only (this DB is managed via `prisma db pull`, not `prisma migrate`).
--
-- Supports Owner Onboarding (OW-04): mời nhân sự cần một cơ chế "tạo tài
-- khoản chờ chấp nhận" khác với OTP (OTP gắn với user_id đã tồn tại và mã 6
-- số ngắn hạn cho tự đăng ký; lời mời cần token dài hạn hơn, gửi qua link
-- email, và có thể bị thu hồi trước khi nhân viên chấp nhận).

CREATE TABLE IF NOT EXISTS invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  role_code   VARCHAR(30) NOT NULL,
  branch_id   UUID REFERENCES branches(id),
  token_hash  TEXT NOT NULL,
  status      VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                CHECK (status IN ('PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED')),
  invited_by  UUID NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_invitations_tenant ON invitations (tenant_id, status);
