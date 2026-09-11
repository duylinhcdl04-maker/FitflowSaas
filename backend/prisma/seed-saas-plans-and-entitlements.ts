import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

export const PLATFORM_FEATURES = [
  // Check-in Module
  {
    code: 'QR_CHECKIN',
    name: 'Check-in bằng mã QR',
    module: 'Check-in',
    feature_type: 'BOOLEAN',
    description: 'Cho phép hội viên tự quét mã QR tại quầy hoặc cửa kiểm soát',
  },
  {
    code: 'FACE_RECOGNITION',
    name: 'Nhận diện khuôn mặt AI FaceID',
    module: 'Check-in',
    feature_type: 'BOOLEAN',
    description:
      'Tích hợp Camera AI nhận diện khuôn mặt tự động mở cổng / check-in',
  },
  {
    code: 'ATTENDANCE_ANALYTICS',
    name: 'Phân tích tần suất ra vào',
    module: 'Check-in',
    feature_type: 'BOOLEAN',
    description:
      'Thống kê giờ cao điểm và phân bổ lưu lượng người tập theo thời gian thực',
  },

  // Membership Module
  {
    code: 'MEMBERSHIP_MANAGEMENT',
    name: 'Quản lý hội viên & gói tập',
    module: 'Membership',
    feature_type: 'BOOLEAN',
    description:
      'Quản trị hồ sơ, hợp đồng, thẻ thành viên và lịch sử tập luyện',
  },
  {
    code: 'AUTO_RENEWAL',
    name: 'Tự động gia hạn hội viên',
    module: 'Membership',
    feature_type: 'BOOLEAN',
    description:
      'Cơ chế kích hoạt nhắc nhở và tự động gia hạn hợp đồng hội viên',
  },
  {
    code: 'MEMBERSHIP_EXPIRATION_ALERT',
    name: 'Cảnh báo hội viên sắp hết hạn',
    module: 'Membership',
    feature_type: 'BOOLEAN',
    description:
      'Tự động gửi cảnh báo trước 7 ngày, 3 ngày cho ban quản lý và hội viên',
  },

  // PT Module
  {
    code: 'PT_MANAGEMENT',
    name: 'Quản lý HLV & chia hoa hồng',
    module: 'PT',
    feature_type: 'BOOLEAN',
    description:
      'Quản lý danh sách PT, chấm công, tính KPI và tỷ lệ chia hoa hồng dạy học',
  },
  {
    code: 'PT_BOOKING',
    name: 'Đặt lịch tập PT thông minh',
    module: 'PT',
    feature_type: 'BOOLEAN',
    description:
      'Hội viên và PT tự đặt lịch, xếp lịch và hủy ca dạy trên ứng dụng',
  },
  {
    code: 'WORKOUT_PLANS',
    name: 'Giáo án & chỉ số thể hình',
    module: 'PT',
    feature_type: 'BOOLEAN',
    description:
      'Theo dõi tiến trình tập luyện, giáo án điện tử và chỉ số InBody của hội viên',
  },

  // Analytics Module
  {
    code: 'BASIC_ANALYTICS',
    name: 'Báo cáo doanh thu & hội viên cơ bản',
    module: 'Analytics',
    feature_type: 'BOOLEAN',
    description:
      'Biểu đồ doanh thu ngày/tuần/tháng, số lượng hội viên mới và gia hạn',
  },
  {
    code: 'ADVANCED_ANALYTICS',
    name: 'Phân tích chuyên sâu & dự báo',
    module: 'Analytics',
    feature_type: 'BOOLEAN',
    description:
      'Dự báo xu hướng churn rate, phân tích retention và hiệu quả kinh doanh',
  },

  // Communication Module
  {
    code: 'EMAIL_NOTIFICATION',
    name: 'Thông báo tự động qua Email',
    module: 'Communication',
    feature_type: 'BOOLEAN',
    description:
      'Gửi hóa đơn điện tử, thông báo lịch tập và nhắc hẹn qua email',
  },
  {
    code: 'SMS_NOTIFICATION',
    name: 'Tin nhắn SMS Brandname / OTP',
    module: 'Communication',
    feature_type: 'BOOLEAN',
    description: 'Gửi SMS chăm sóc khách hàng và xác thực giao dịch',
  },

  // Security Module
  {
    code: 'TWO_FACTOR_AUTH',
    name: 'Xác thực 2 lớp 2FA',
    module: 'Security',
    feature_type: 'BOOLEAN',
    description: 'Bảo vệ tài khoản quản trị bằng mã OTP 2FA',
  },
  {
    code: 'AUDIT_LOGS',
    name: 'Nhật ký truy vết thao tác (Audit Logs)',
    module: 'Security',
    feature_type: 'BOOLEAN',
    description:
      'Ghi nhận chi tiết mọi hành vi thêm, sửa, xóa nhạy cảm trên hệ thống',
  },
];

export const PLATFORM_QUOTAS = [
  {
    code: 'MAX_BRANCHES',
    name: 'Số chi nhánh tối đa',
    unit: 'Chi nhánh',
    module: 'Hạ tầng',
    description: 'Giới hạn số điểm tập / phòng gym trong cùng một tenant',
  },
  {
    code: 'MAX_MEMBERS',
    name: 'Tổng hội viên tối đa',
    unit: 'Hội viên',
    module: 'Hội viên',
    description: 'Tổng số hồ sơ hội viên lưu trữ trong cơ sở dữ liệu',
  },
  {
    code: 'MAX_ACTIVE_MEMBERS',
    name: 'Hội viên hoạt động đồng thời',
    unit: 'Hội viên',
    module: 'Hội viên',
    description: 'Số hội viên có gói tập đang còn hiệu lực',
  },
  {
    code: 'MAX_STAFF',
    name: 'Nhân viên quản trị tối đa',
    unit: 'Nhân sự',
    module: 'Nhân sự',
    description: 'Số lượng tài khoản lễ tân, quản lý, admin được cấp quyền',
  },
  {
    code: 'MAX_PT',
    name: 'Huấn luyện viên (PT) tối đa',
    unit: 'HLV',
    module: 'Nhân sự',
    description: 'Số lượng huấn luyện viên hoạt động trên hệ thống',
  },
  {
    code: 'MAX_PT_BOOKINGS',
    name: 'Lượt đặt lịch PT / tháng',
    unit: 'Lượt/tháng',
    module: 'Vận hành',
    description: 'Số lượt book lịch dạy PT phát sinh trong chu kỳ thanh toán',
  },
  {
    code: 'MAX_CHECKINS_MONTH',
    name: 'Lượt check-in / tháng',
    unit: 'Lượt/tháng',
    module: 'Vận hành',
    description: 'Tổng số lượt quẹt thẻ / Face ID / QR check-in mỗi tháng',
  },
  {
    code: 'MAX_STORAGE',
    name: 'Dung lượng lưu trữ đám mây',
    unit: 'GB',
    module: 'Tài nguyên',
    description: 'Dung lượng lưu ảnh hội viên, hợp đồng, camera snapshot',
  },
  {
    code: 'MAX_EMAILS_MONTH',
    name: 'Email gửi tự động / tháng',
    unit: 'Email/tháng',
    module: 'Truyền thông',
    description: 'Số lượng email hệ thống gửi đi mỗi tháng',
  },
  {
    code: 'MAX_SMS_MONTH',
    name: 'Tin nhắn SMS gửi / tháng',
    unit: 'SMS/tháng',
    module: 'Truyền thông',
    description: 'Hạn mức tin nhắn SMS Brandname gửi đi trong tháng',
  },
];

export const PLATFORM_INTEGRATIONS = [
  {
    code: 'OPEN_API',
    name: 'Open API RESTful',
    category: 'DEVELOPER',
    icon: 'Code',
    description:
      'Cung cấp API Key cho bên thứ ba tích hợp và truy xuất dữ liệu hai chiều',
  },
  {
    code: 'WEBHOOK',
    name: 'Outbound Webhooks',
    category: 'DEVELOPER',
    icon: 'Webhook',
    description:
      'Bắn sự kiện realtime (checkin, thanh toán, hợp đồng mới) về server khách hàng',
  },
  {
    code: 'ZALO',
    name: 'Zalo OA & ZNS',
    category: 'COMMUNICATION',
    icon: 'MessageSquare',
    description: 'Gửi tin nhắn chăm sóc qua Zalo ZNS và kết nối Mini App Zalo',
  },
  {
    code: 'PAYMENT_GATEWAY',
    name: 'Cổng thanh toán tự động (VietQR/Momo)',
    category: 'FINANCE',
    icon: 'CreditCard',
    description:
      'Tự động tạo QR động và kích hoạt hợp đồng ngay khi tiền về tài khoản',
  },
  {
    code: 'ACCOUNTING',
    name: 'Phần mềm kế toán (MISA/KiotViet)',
    category: 'FINANCE',
    icon: 'Receipt',
    description:
      'Đồng bộ hóa đơn bán hàng và doanh thu sang phần mềm tài chính',
  },
  {
    code: 'CRM',
    name: 'Hệ thống CRM chuyên sâu',
    category: 'MARKETING',
    icon: 'Users',
    description:
      'Tự động đẩy lead khách hàng mới sang Hubspot, Salesforce hoặc CRM ngoài',
  },
  {
    code: 'CUSTOM_INTEGRATION',
    name: 'Tích hợp phần cứng & phần mềm riêng',
    category: 'ENTERPRISE',
    icon: 'Puzzle',
    description:
      'Kết nối cổng xoay Flap Barrier, Tripod chuyên biệt của hãng thứ 3',
  },
];

async function seed() {
  console.log('🚀 Seeding Platform Features...');
  const featureMap: Record<string, string> = {};
  for (const f of PLATFORM_FEATURES) {
    const record = await prisma.platformFeature.upsert({
      where: { code: f.code },
      update: {
        name: f.name,
        module: f.module,
        description: f.description,
        feature_type: f.feature_type,
      },
      create: f,
    });
    featureMap[f.code] = record.id;
  }

  console.log('🚀 Seeding Platform Quotas...');
  const quotaMap: Record<string, string> = {};
  for (const q of PLATFORM_QUOTAS) {
    const record = await prisma.platformQuota.upsert({
      where: { code: q.code },
      update: {
        name: q.name,
        unit: q.unit,
        module: q.module,
        description: q.description,
      },
      create: q,
    });
    quotaMap[q.code] = record.id;
  }

  console.log('🚀 Seeding Platform Integrations...');
  const integrationMap: Record<string, string> = {};
  for (const i of PLATFORM_INTEGRATIONS) {
    const record = await prisma.platformIntegration.upsert({
      where: { code: i.code },
      update: {
        name: i.name,
        category: i.category,
        icon: i.icon,
        description: i.description,
      },
      create: i,
    });
    integrationMap[i.code] = record.id;
  }

  // Update existing BASIC -> STARTER and PRO -> GROWTH if they exist
  const existingBasic = await prisma.saasPlan.findUnique({
    where: { code: 'BASIC' },
  });
  if (existingBasic) {
    await prisma.saasPlan.update({
      where: { id: existingBasic.id },
      data: { code: 'STARTER', name: 'Gói Cơ Bản (Starter)' },
    });
    console.log('✅ Migrated legacy plan code BASIC -> STARTER');
  }

  const existingPro = await prisma.saasPlan.findUnique({
    where: { code: 'PRO' },
  });
  if (existingPro) {
    await prisma.saasPlan.update({
      where: { id: existingPro.id },
      data: { code: 'GROWTH', name: 'Gói Tăng Trưởng (Growth)' },
    });
    console.log('✅ Migrated legacy plan code PRO -> GROWTH');
  }

  console.log('🚀 Configuring 3 Standard SaaS Plans + Entitlements...');

  const PLANS_CONFIG = [
    {
      // Gói dùng thử 14 ngày — trước bản sửa này KHÔNG có mặt trong danh sách,
      // nên TRIAL không có bất kỳ dòng saas_plan_features/plan_quotas/plan_integrations
      // nào; EntitlementService coi thiếu dòng = tắt/0, tức mọi tenant TRIAL (phần lớn
      // tenant thật trên nền tảng) sẽ bị chặn hết mọi tính năng nếu enforcement được bật.
      // Chủ trương: mở đủ tính năng như GROWTH để tenant trải nghiệm trọn vẹn trước khi
      // mua, nhưng quota giữ mức thấp như STARTER để tránh lạm dụng bản dùng thử.
      code: 'TRIAL',
      name: 'Gói Dùng Thử 14 Ngày',
      description:
        'Gói trải nghiệm miễn phí 14 ngày cho chủ phòng tập mới, mở đủ tính năng của gói Growth để trải nghiệm trọn vẹn trước khi nâng cấp',
      slogan: 'Trải nghiệm đầy đủ tính năng Growth, miễn phí 14 ngày',
      target_audience:
        'Chủ phòng tập mới muốn dùng thử trước khi chọn gói trả phí',
      is_popular: false,
      badge_text: 'DÙNG THỬ',
      support_tier: 'COMMUNITY',
      cta_text: 'Bắt đầu dùng thử',
      billing_cycle: 'MONTHLY',
      billing_cycle_months: 1,
      price: 0,
      currency: 'VND',
      trial_days: 14,
      display_order: 0,
      is_public: true,
      status: 'ACTIVE',
      prices: [
        {
          billing_cycle: 'MONTHLY',
          billing_cycle_months: 1,
          price: 0,
          discount_percentage: 0,
        },
      ],
      // = GROWTH.features
      features: {
        QR_CHECKIN: true,
        FACE_RECOGNITION: true,
        ATTENDANCE_ANALYTICS: true,
        MEMBERSHIP_MANAGEMENT: true,
        AUTO_RENEWAL: true,
        MEMBERSHIP_EXPIRATION_ALERT: true,
        PT_MANAGEMENT: true,
        PT_BOOKING: true,
        WORKOUT_PLANS: true,
        BASIC_ANALYTICS: true,
        ADVANCED_ANALYTICS: true,
        EMAIL_NOTIFICATION: true,
        SMS_NOTIFICATION: true,
        TWO_FACTOR_AUTH: true,
        AUDIT_LOGS: true,
      },
      // = STARTER.quotas
      quotas: {
        MAX_BRANCHES: { mode: 'LIMITED', value: 1 },
        MAX_MEMBERS: { mode: 'LIMITED', value: 300 },
        MAX_ACTIVE_MEMBERS: { mode: 'LIMITED', value: 200 },
        MAX_STAFF: { mode: 'LIMITED', value: 5 },
        MAX_PT: { mode: 'LIMITED', value: 5 },
        MAX_PT_BOOKINGS: { mode: 'LIMITED', value: 150 },
        MAX_CHECKINS_MONTH: { mode: 'LIMITED', value: 3000 },
        MAX_STORAGE: { mode: 'LIMITED', value: 5 },
        MAX_EMAILS_MONTH: { mode: 'LIMITED', value: 1000 },
        MAX_SMS_MONTH: { mode: 'DISABLED', value: null },
      },
      // = STARTER.integrations (tích hợp bên thứ 3 vẫn giữ làm điểm nâng cấp)
      integrations: {
        OPEN_API: false,
        WEBHOOK: false,
        ZALO: false,
        PAYMENT_GATEWAY: true,
        ACCOUNTING: false,
        CRM: false,
        CUSTOM_INTEGRATION: false,
      },
    },
    {
      code: 'STARTER',
      name: 'Gói Cơ Bản (Starter)',
      description:
        'Giải pháp số hóa tinh gọn cho phòng tập đơn điểm, studio Yoga/Pilates quy mô nhỏ',
      slogan: 'Số hóa tinh gọn cho phòng gym đơn điểm & studio',
      target_audience: 'Phòng tập đơn điểm, studio dưới 300 hội viên',
      is_popular: false,
      badge_text: 'TIẾT KIỆM',
      support_tier: 'COMMUNITY',
      cta_text: 'Bắt đầu với Starter',
      billing_cycle: 'MONTHLY',
      billing_cycle_months: 1,
      price: 490000,
      currency: 'VND',
      trial_days: 0,
      display_order: 1,
      is_public: true,
      status: 'ACTIVE',
      prices: [
        {
          billing_cycle: 'MONTHLY',
          billing_cycle_months: 1,
          price: 490000,
          discount_percentage: 0,
        },
        {
          billing_cycle: 'QUARTERLY',
          billing_cycle_months: 3,
          price: 1390000,
          discount_percentage: 5.4,
        },
        {
          billing_cycle: 'YEARLY',
          billing_cycle_months: 12,
          price: 4990000,
          discount_percentage: 15.1,
        },
      ],
      features: {
        QR_CHECKIN: true,
        FACE_RECOGNITION: false,
        ATTENDANCE_ANALYTICS: true,
        MEMBERSHIP_MANAGEMENT: true,
        AUTO_RENEWAL: false,
        MEMBERSHIP_EXPIRATION_ALERT: true,
        PT_MANAGEMENT: true,
        PT_BOOKING: true,
        WORKOUT_PLANS: false,
        BASIC_ANALYTICS: true,
        ADVANCED_ANALYTICS: false,
        EMAIL_NOTIFICATION: true,
        SMS_NOTIFICATION: false,
        TWO_FACTOR_AUTH: false,
        AUDIT_LOGS: false,
      },
      quotas: {
        MAX_BRANCHES: { mode: 'LIMITED', value: 1 },
        MAX_MEMBERS: { mode: 'LIMITED', value: 300 },
        MAX_ACTIVE_MEMBERS: { mode: 'LIMITED', value: 200 },
        MAX_STAFF: { mode: 'LIMITED', value: 5 },
        MAX_PT: { mode: 'LIMITED', value: 5 },
        MAX_PT_BOOKINGS: { mode: 'LIMITED', value: 150 },
        MAX_CHECKINS_MONTH: { mode: 'LIMITED', value: 3000 },
        MAX_STORAGE: { mode: 'LIMITED', value: 5 },
        MAX_EMAILS_MONTH: { mode: 'LIMITED', value: 1000 },
        MAX_SMS_MONTH: { mode: 'DISABLED', value: null },
      },
      integrations: {
        OPEN_API: false,
        WEBHOOK: false,
        ZALO: false,
        PAYMENT_GATEWAY: true,
        ACCOUNTING: false,
        CRM: false,
        CUSTOM_INTEGRATION: false,
      },
    },
    {
      code: 'GROWTH',
      name: 'Gói Tăng Trưởng (Growth)',
      description:
        'Giải pháp toàn diện tối ưu doanh thu với Camera AI Face Recognition và giáo án PT',
      slogan: 'Tăng trưởng bứt phá cùng tự động hóa và AI FaceID',
      target_audience:
        'Trung tâm Fitness chuyên nghiệp cần mở rộng và nâng tầm dịch vụ',
      is_popular: true, // Hero Plan
      badge_text: 'PHỔ BIẾN NHẤT',
      support_tier: 'PRIORITY',
      cta_text: 'Chọn Gói Phổ Biến',
      billing_cycle: 'MONTHLY',
      billing_cycle_months: 1,
      price: 990000,
      currency: 'VND',
      trial_days: 0,
      display_order: 2,
      is_public: true,
      status: 'ACTIVE',
      prices: [
        {
          billing_cycle: 'MONTHLY',
          billing_cycle_months: 1,
          price: 990000,
          discount_percentage: 0,
        },
        {
          billing_cycle: 'QUARTERLY',
          billing_cycle_months: 3,
          price: 2790000,
          discount_percentage: 6.0,
        },
        {
          billing_cycle: 'YEARLY',
          billing_cycle_months: 12,
          price: 9990000,
          discount_percentage: 15.9,
        },
      ],
      features: {
        QR_CHECKIN: true,
        FACE_RECOGNITION: true,
        ATTENDANCE_ANALYTICS: true,
        MEMBERSHIP_MANAGEMENT: true,
        AUTO_RENEWAL: true,
        MEMBERSHIP_EXPIRATION_ALERT: true,
        PT_MANAGEMENT: true,
        PT_BOOKING: true,
        WORKOUT_PLANS: true,
        BASIC_ANALYTICS: true,
        ADVANCED_ANALYTICS: true,
        EMAIL_NOTIFICATION: true,
        SMS_NOTIFICATION: true,
        TWO_FACTOR_AUTH: true,
        AUDIT_LOGS: true,
      },
      quotas: {
        MAX_BRANCHES: { mode: 'LIMITED', value: 3 },
        MAX_MEMBERS: { mode: 'LIMITED', value: 2000 },
        MAX_ACTIVE_MEMBERS: { mode: 'LIMITED', value: 1200 },
        MAX_STAFF: { mode: 'LIMITED', value: 20 },
        MAX_PT: { mode: 'LIMITED', value: 20 },
        MAX_PT_BOOKINGS: { mode: 'LIMITED', value: 800 },
        MAX_CHECKINS_MONTH: { mode: 'LIMITED', value: 15000 },
        MAX_STORAGE: { mode: 'LIMITED', value: 25 },
        MAX_EMAILS_MONTH: { mode: 'LIMITED', value: 5000 },
        MAX_SMS_MONTH: { mode: 'LIMITED', value: 500 },
      },
      integrations: {
        OPEN_API: false,
        WEBHOOK: false,
        ZALO: true,
        PAYMENT_GATEWAY: true,
        ACCOUNTING: false,
        CRM: false,
        CUSTOM_INTEGRATION: false,
      },
    },
    {
      code: 'ENTERPRISE',
      name: 'Gói Doanh Nghiệp (Enterprise)',
      description:
        'Hệ thống quản trị hợp nhất chuỗi gym & nhượng quyền, mở rộng Open API & Webhook',
      slogan: 'Hệ sinh thái mở rộng không giới hạn cho chuỗi quy mô lớn',
      target_audience:
        'Chuỗi gym quy mô lớn, nhượng quyền và tập đoàn thể hình',
      is_popular: false,
      badge_text: 'DOANH NGHIỆP',
      support_tier: 'DEDICATED',
      cta_text: 'Liên hệ Enterprise',
      billing_cycle: 'MONTHLY',
      billing_cycle_months: 1,
      price: 2490000,
      currency: 'VND',
      trial_days: 0,
      display_order: 3,
      is_public: true,
      status: 'ACTIVE',
      prices: [
        {
          billing_cycle: 'MONTHLY',
          billing_cycle_months: 1,
          price: 2490000,
          discount_percentage: 0,
        },
        {
          billing_cycle: 'QUARTERLY',
          billing_cycle_months: 3,
          price: 6990000,
          discount_percentage: 6.4,
        },
        {
          billing_cycle: 'YEARLY',
          billing_cycle_months: 12,
          price: 24900000,
          discount_percentage: 16.7,
        },
      ],
      features: {
        QR_CHECKIN: true,
        FACE_RECOGNITION: true,
        ATTENDANCE_ANALYTICS: true,
        MEMBERSHIP_MANAGEMENT: true,
        AUTO_RENEWAL: true,
        MEMBERSHIP_EXPIRATION_ALERT: true,
        PT_MANAGEMENT: true,
        PT_BOOKING: true,
        WORKOUT_PLANS: true,
        BASIC_ANALYTICS: true,
        ADVANCED_ANALYTICS: true,
        EMAIL_NOTIFICATION: true,
        SMS_NOTIFICATION: true,
        TWO_FACTOR_AUTH: true,
        AUDIT_LOGS: true,
      },
      quotas: {
        MAX_BRANCHES: { mode: 'LIMITED', value: 15 },
        MAX_MEMBERS: { mode: 'LIMITED', value: 10000 },
        MAX_ACTIVE_MEMBERS: { mode: 'LIMITED', value: 6000 },
        MAX_STAFF: { mode: 'LIMITED', value: 100 },
        MAX_PT: { mode: 'LIMITED', value: 100 },
        MAX_PT_BOOKINGS: { mode: 'LIMITED', value: 5000 },
        MAX_CHECKINS_MONTH: { mode: 'LIMITED', value: 60000 },
        MAX_STORAGE: { mode: 'LIMITED', value: 100 },
        MAX_EMAILS_MONTH: { mode: 'LIMITED', value: 20000 },
        MAX_SMS_MONTH: { mode: 'LIMITED', value: 2000 },
      },
      integrations: {
        OPEN_API: true,
        WEBHOOK: true,
        ZALO: true,
        PAYMENT_GATEWAY: true,
        ACCOUNTING: true,
        CRM: true,
        CUSTOM_INTEGRATION: true,
      },
    },
  ];

  for (const p of PLANS_CONFIG) {
    const plan = await prisma.saasPlan.upsert({
      where: { code: p.code },
      update: {
        name: p.name,
        description: p.description,
        slogan: p.slogan,
        target_audience: p.target_audience,
        is_popular: p.is_popular,
        badge_text: p.badge_text,
        support_tier: p.support_tier,
        cta_text: p.cta_text,
        price: p.price,
        billing_cycle: p.billing_cycle,
        billing_cycle_months: p.billing_cycle_months,
        trial_days: p.trial_days,
        display_order: p.display_order,
        is_public: p.is_public,
        status: p.status,
      },
      create: {
        code: p.code,
        name: p.name,
        description: p.description,
        slogan: p.slogan,
        target_audience: p.target_audience,
        is_popular: p.is_popular,
        badge_text: p.badge_text,
        support_tier: p.support_tier,
        cta_text: p.cta_text,
        price: p.price,
        billing_cycle: p.billing_cycle,
        billing_cycle_months: p.billing_cycle_months,
        trial_days: p.trial_days,
        display_order: p.display_order,
        is_public: p.is_public,
        status: p.status,
      },
    });

    // 1. Sync Plan Prices
    for (const pr of p.prices) {
      await prisma.planPrice.upsert({
        where: {
          plan_id_billing_cycle_months: {
            plan_id: plan.id,
            billing_cycle_months: pr.billing_cycle_months,
          },
        },
        update: {
          price: pr.price,
          discount_percentage: pr.discount_percentage,
          billing_cycle: pr.billing_cycle,
          is_active: true,
        },
        create: {
          plan_id: plan.id,
          billing_cycle: pr.billing_cycle,
          billing_cycle_months: pr.billing_cycle_months,
          price: pr.price,
          discount_percentage: pr.discount_percentage,
          is_active: true,
        },
      });
    }

    // 2. Sync Plan Features
    for (const [featCode, isEnabled] of Object.entries(p.features)) {
      const featId = featureMap[featCode];
      if (!featId) continue;
      await prisma.saasPlanFeature.upsert({
        where: { plan_id_feature_id: { plan_id: plan.id, feature_id: featId } },
        update: { is_enabled: isEnabled },
        create: { plan_id: plan.id, feature_id: featId, is_enabled: isEnabled },
      });
    }

    // 3. Sync Plan Quotas
    for (const [quotaCode, qConfig] of Object.entries(p.quotas)) {
      const quotaId = quotaMap[quotaCode];
      if (!quotaId) continue;
      await prisma.planQuota.upsert({
        where: { plan_id_quota_id: { plan_id: plan.id, quota_id: quotaId } },
        update: { mode: qConfig.mode, quota_value: qConfig.value },
        create: {
          plan_id: plan.id,
          quota_id: quotaId,
          mode: qConfig.mode,
          quota_value: qConfig.value,
        },
      });
    }

    // 4. Sync Plan Integrations
    for (const [integCode, isEnabled] of Object.entries(p.integrations)) {
      const integId = integrationMap[integCode];
      if (!integId) continue;
      await prisma.planIntegration.upsert({
        where: {
          plan_id_integration_id: { plan_id: plan.id, integration_id: integId },
        },
        update: { is_enabled: isEnabled },
        create: {
          plan_id: plan.id,
          integration_id: integId,
          is_enabled: isEnabled,
        },
      });
    }
  }

  console.log('🚀 Seeding Add-ons...');
  const ADDONS = [
    {
      code: 'ADDON_MEMBERS_500',
      name: 'Gói bổ sung +500 Hội viên',
      description: 'Mở rộng lưu trữ thêm 500 hồ sơ hội viên cho phòng tập',
      addon_type: 'RESOURCE',
      pricing_model: 'FIXED',
      price: 150000,
      currency: 'VND',
      effect_type: 'QUOTA',
      effect_amount: 500,
      compatible_plan_codes: ['STARTER', 'GROWTH'],
      quotas: [{ quotaCode: 'MAX_MEMBERS', addedValue: 500 }],
    },
    {
      code: 'ADDON_BRANCH_1',
      name: 'Gói bổ sung +1 Chi nhánh',
      description: 'Mở thêm 1 chi nhánh/cơ sở mới không cần nâng gói cao cấp',
      addon_type: 'RESOURCE',
      pricing_model: 'FIXED',
      price: 250000,
      currency: 'VND',
      effect_type: 'QUOTA',
      effect_amount: 1,
      compatible_plan_codes: ['STARTER', 'GROWTH'],
      quotas: [{ quotaCode: 'MAX_BRANCHES', addedValue: 1 }],
    },
    {
      code: 'ADDON_STORAGE_10GB',
      name: 'Gói bổ sung +10GB Cloud Storage',
      description:
        'Tăng thêm 10GB lưu trữ hình ảnh check-in và tài liệu hội viên',
      addon_type: 'RESOURCE',
      pricing_model: 'FIXED',
      price: 100000,
      currency: 'VND',
      effect_type: 'QUOTA',
      effect_amount: 10,
      compatible_plan_codes: ['STARTER', 'GROWTH', 'ENTERPRISE'],
      quotas: [{ quotaCode: 'MAX_STORAGE', addedValue: 10 }],
    },
    {
      code: 'ADDON_FACE_AI',
      name: 'Tính năng AI Face Recognition',
      description: 'Mở khóa nhận diện khuôn mặt cho gói Starter',
      addon_type: 'FEATURE',
      pricing_model: 'FIXED',
      price: 300000,
      currency: 'VND',
      effect_type: 'FEATURE',
      compatible_plan_codes: ['STARTER'],
      features: ['FACE_RECOGNITION'],
    },
    {
      code: 'ADDON_OPEN_API',
      name: 'Tích hợp Open API & Webhook',
      description: 'Mở khóa cổng API RESTful và Webhook cho gói Growth',
      addon_type: 'INTEGRATION',
      pricing_model: 'FIXED',
      price: 500000,
      currency: 'VND',
      effect_type: 'FEATURE',
      compatible_plan_codes: ['GROWTH'],
      features: [],
    },
  ];

  for (const a of ADDONS) {
    const addon = await prisma.addon.upsert({
      where: { code: a.code },
      update: {
        name: a.name,
        description: a.description,
        addon_type: a.addon_type,
        pricing_model: a.pricing_model,
        price: a.price,
        currency: a.currency,
        compatible_plan_codes: a.compatible_plan_codes,
      },
      create: {
        code: a.code,
        name: a.name,
        description: a.description,
        addon_type: a.addon_type,
        pricing_model: a.pricing_model,
        price: a.price,
        currency: a.currency,
        compatible_plan_codes: a.compatible_plan_codes,
      },
    });

    if (a.quotas) {
      for (const q of a.quotas) {
        const qId = quotaMap[q.quotaCode];
        if (qId) {
          await prisma.addonQuota.upsert({
            where: { addon_id_quota_id: { addon_id: addon.id, quota_id: qId } },
            update: { added_value: q.addedValue },
            create: {
              addon_id: addon.id,
              quota_id: qId,
              added_value: q.addedValue,
            },
          });
        }
      }
    }

    if (a.features) {
      for (const fCode of a.features) {
        const fId = featureMap[fCode];
        if (fId) {
          await prisma.addonFeature.upsert({
            where: {
              addon_id_feature_id: { addon_id: addon.id, feature_id: fId },
            },
            update: {},
            create: { addon_id: addon.id, feature_id: fId },
          });
        }
      }
    }
  }

  console.log(
    '🎉 Seed SaaS Plan Configuration & Entitlements finished successfully!',
  );
}

seed()
  .catch((err) => {
    console.error('❌ Seed error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
