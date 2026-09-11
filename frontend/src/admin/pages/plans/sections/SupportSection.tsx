import { Lifebuoy, Headset, Star, Crown, Check } from '@phosphor-icons/react';

interface SupportSectionProps {
  supportTier: string;
  setSupportTier: (v: any) => void;
}

const SUPPORT_TIERS = [
  {
    key: 'COMMUNITY',
    title: 'Hỗ trợ Cơ bản (Community)',
    desc: 'Hỗ trợ qua Trung tâm tài liệu trực tuyến và Email tiêu chuẩn trong giờ hành chính.',
    response: '24h - 48h làm việc',
    channels: ['Email Support', 'Help Center Docs', 'Cộng đồng người dùng'],
    icon: <Lifebuoy className="w-5 h-5 text-zinc-500" />,
  },
  {
    key: 'STANDARD',
    title: 'Hỗ trợ Tiêu chuẩn (Standard)',
    desc: 'Email và Hotline trong giờ làm việc (8h - 18h). Thích hợp cho phòng tập đơn điểm.',
    response: 'Dưới 12h làm việc',
    channels: ['Email ưu tiên', 'Hotline hỗ trợ 8h-18h', 'Tài liệu hướng dẫn trực tiếp'],
    icon: <Headset className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  },
  {
    key: 'PRIORITY',
    title: 'Hỗ trợ Ưu tiên 12/7 (Priority)',
    desc: 'Hotline riêng và kỹ thuật viên hỗ trợ ưu tiên 12 giờ/ngày từ 7h đến 22h kể cả cuối tuần.',
    response: 'Dưới 2h phản hồi',
    channels: ['Hotline VIP 12/7', 'Kênh Zalo CSKH riêng', 'Hỗ trợ kỹ thuật camera/cửa từ xa'],
    icon: <Star className="w-5 h-5 text-amber-500" weight="fill" />,
  },
  {
    key: 'DEDICATED',
    title: 'Hỗ trợ Chuyên trách 24/7 (Dedicated SLA 99.9%)',
    desc: 'Chuyên viên kỹ thuật và quản lý tài khoản riêng (Account Manager) túc trực 24/7 với cam kết SLA doanh nghiệp.',
    response: 'Dưới 15 phút xử lý khẩn cấp',
    channels: ['Dedicated Account Manager', 'On-site Support khi có sự cố', 'SLA Cam kết 99.9% Uptime'],
    icon: <Crown className="w-5 h-5 text-purple-600 dark:text-purple-400" weight="fill" />,
  },
];

export default function SupportSection({ supportTier, setSupportTier }: SupportSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-rose-50/70 border border-rose-200/80 dark:bg-rose-950/20 dark:border-rose-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Lifebuoy className="w-5 h-5 text-rose-600 dark:text-rose-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-rose-900 dark:text-rose-200">
          <p className="font-bold">Dimension 8: Cấp độ Hỗ trợ & Cam kết dịch vụ (Support SLA)</p>
          <p className="mt-0.5 text-xs text-rose-700/80 dark:text-rose-300/80">
            Cam kết chất lượng hỗ trợ kỹ thuật và thời gian phản hồi cho ban quản lý phòng tập.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SUPPORT_TIERS.map((tier) => {
          const isSelected = supportTier === tier.key;

          return (
            <div
              key={tier.key}
              onClick={() => setSupportTier(tier.key)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all select-none flex flex-col justify-between shadow-xs ${
                isSelected
                  ? 'border-rose-500 bg-rose-50/40 text-rose-950 dark:border-rose-500/60 dark:bg-rose-950/20 dark:text-rose-100 ring-1 ring-rose-500/20'
                  : 'border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700">
                      {tier.icon}
                    </div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{tier.title}</h4>
                  </div>
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" weight="bold" />
                    </span>
                  )}
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-4">
                  {tier.desc}
                </p>

                <div className="space-y-1.5 mb-4">
                  {tier.channels.map((ch, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span>{ch}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs">
                <span className="text-zinc-400">Cam kết phản hồi:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">{tier.response}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
