// Local dev seed: one Super Admin account + two demo tenants so the
// Super Admin dashboard has something real to show. Idempotent — safe to
// re-run. Run with: npx ts-node prisma/seed.ts
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SUPER_ADMIN_EMAIL = 'admin@fitflow.vn';
const SUPER_ADMIN_PASSWORD = 'SuperAdmin@123'; // dev-only, change before any shared/staging use

async function seedPlatformUser(opts: {
  roleCode: string;
  email: string;
  password: string;
  fullName: string;
}) {
  const role = await prisma.roles.findUnique({ where: { code: opts.roleCode } });
  if (!role) throw new Error(`Role ${opts.roleCode} chưa được seed trong bảng roles`);

  const existing = await prisma.user.findFirst({
    where: { tenant_id: null, email: opts.email },
  });
  if (existing) {
    console.log(`Tài khoản platform đã tồn tại: ${opts.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(opts.password, 10);
  const user = await prisma.user.create({
    data: {
      tenant_id: null,
      user_type: 'PLATFORM',
      email: opts.email,
      full_name: opts.fullName,
      password_hash: passwordHash,
      status: 'ACTIVE',
    },
  });

  await prisma.user_roles.create({
    data: { user_id: user.id, role_id: role.id, tenant_id: null },
  });

  console.log(`Đã tạo ${opts.roleCode}: ${opts.email} / ${opts.password}`);
}

async function seedDemoTenant(opts: {
  code: string;
  name: string;
  planCode: string;
  subscriptionStatus: 'TRIAL' | 'ACTIVE';
  ownerEmail: string;
  ownerName: string;
}) {
  const existing = await prisma.tenant.findUnique({ where: { code: opts.code } });
  if (existing) {
    console.log(`Tenant demo đã tồn tại: ${opts.code}`);
    return;
  }

  const plan = await prisma.saasPlan.findUnique({ where: { code: opts.planCode } });
  if (!plan) throw new Error(`Không tìm thấy plan ${opts.planCode}, chạy seed plan trước`);

  const ownerRole = await prisma.roles.findUnique({ where: { code: 'OWNER' } });
  if (!ownerRole) throw new Error('Role OWNER chưa được seed');

  const startDate = new Date();
  const periodEnd = new Date(startDate);
  periodEnd.setDate(periodEnd.getDate() + (opts.subscriptionStatus === 'TRIAL' ? plan.trial_days || 14 : 30));

  await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        code: opts.code,
        name: opts.name,
        contact_email: opts.ownerEmail,
        status: opts.subscriptionStatus === 'TRIAL' ? 'TRIAL' : 'ACTIVE',
      },
    });

    await tx.subscription.create({
      data: {
        tenant_id: tenant.id,
        plan_id: plan.id,
        status: opts.subscriptionStatus,
        start_date: startDate,
        end_date: periodEnd,
        trial_ends_at: opts.subscriptionStatus === 'TRIAL' ? periodEnd : null,
        billing_cycle: plan.billing_cycle,
        billing_cycle_months: plan.billing_cycle_months,
        price: plan.price,
        currency: plan.currency,
      },
    });

    const passwordHash = await bcrypt.hash('Owner@123', 10);
    const owner = await tx.user.create({
      data: {
        tenant_id: tenant.id,
        user_type: 'TENANT',
        email: opts.ownerEmail,
        full_name: opts.ownerName,
        password_hash: passwordHash,
        status: 'ACTIVE',
      },
    });

    await tx.user_roles.create({
      data: { user_id: owner.id, role_id: ownerRole.id, tenant_id: tenant.id },
    });
  });

  console.log(`Đã tạo tenant demo: ${opts.code} (${opts.subscriptionStatus})`);
}

async function main() {
  const defaultRoles = [
    { code: 'SUPER_ADMIN', name: 'Super Admin', scope: 'SYSTEM', is_system: true },
    { code: 'OWNER', name: 'Tenant Owner', scope: 'TENANT', is_system: true },
    { code: 'TENANT_OWNER', name: 'Tenant Owner', scope: 'TENANT', is_system: true },
    { code: 'BRANCH_MANAGER', name: 'Branch Manager', scope: 'TENANT', is_system: true },
    { code: 'MANAGER', name: 'Manager', scope: 'TENANT', is_system: true },
    { code: 'STAFF', name: 'Staff', scope: 'TENANT', is_system: true },
    { code: 'PT', name: 'Personal Trainer', scope: 'TENANT', is_system: true },
    { code: 'CUSTOMER', name: 'Customer', scope: 'TENANT', is_system: true },
  ];

  for (const r of defaultRoles) {
    await prisma.roles.upsert({
      where: { code: r.code },
      update: {},
      create: r,
    });
  }

  const defaultPlans = [
    { code: 'TRIAL', name: 'Gói Dùng Thử 14 Ngày', price: 0, trial_days: 14, is_public: true, description: 'Gói trải nghiệm dùng thử 14 ngày cho chủ phòng tập mới' },
    { code: 'BASIC', name: 'Gói Cơ Bản', price: 490000, trial_days: 14, is_public: true, description: 'Dành cho phòng tập quy mô nhỏ' },
    { code: 'PRO', name: 'Gói Chuyên Nghiệp', price: 990000, trial_days: 14, is_public: true, description: 'Dành cho phòng tập quy mô vừa và chuỗi chi nhánh' },
    { code: 'ENTERPRISE', name: 'Gói Doanh Nghiệp', price: 2490000, trial_days: 30, is_public: true, description: 'Dành cho chuỗi phòng tập lớn' },
  ];

  for (const p of defaultPlans) {
    await prisma.saasPlan.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  await seedPlatformUser({
    roleCode: 'SUPER_ADMIN',
    email: SUPER_ADMIN_EMAIL,
    password: SUPER_ADMIN_PASSWORD,
    fullName: 'FitFlow Super Admin',
  });
  await seedDemoTenant({
    code: 'ironfit',
    name: 'IronFit Gym',
    planCode: 'PRO',
    subscriptionStatus: 'ACTIVE',
    ownerEmail: 'owner@ironfit.vn',
    ownerName: 'Nguyễn Văn Long',
  });
  await seedDemoTenant({
    code: 'gym365',
    name: 'Gym 365',
    planCode: 'BASIC',
    subscriptionStatus: 'TRIAL',
    ownerEmail: 'owner@gym365.vn',
    ownerName: 'Trần Thị Mai',
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
