import { Eye, Star, Tag, CursorClick, SortAscending } from '@phosphor-icons/react';

interface DisplaySectionProps {
  isPopular: boolean;
  setIsPopular: (v: boolean) => void;
  badgeText: string;
  setBadgeText: (v: string) => void;
  displayOrder: number;
  setDisplayOrder: (v: number) => void;
  ctaText: string;
  setCtaText: (v: string) => void;
  isPublic: boolean;
  setIsPublic: (v: boolean) => void;
}

const inputClass =
  'w-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all shadow-xs';

export default function DisplaySection({
  isPopular,
  setIsPopular,
  badgeText,
  setBadgeText,
  displayOrder,
  setDisplayOrder,
  ctaText,
  setCtaText,
  isPublic,
  setIsPublic,
}: DisplaySectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-amber-50/70 border border-amber-200/80 dark:bg-amber-950/20 dark:border-amber-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-amber-900 dark:text-amber-200">
          <p className="font-bold">Dimension 9: Hiển thị & Vị trí tiếp thị (Display & Hero Plan)</p>
          <p className="mt-0.5 text-xs text-amber-700/80 dark:text-amber-300/80">
            Tùy biến nhãn huy hiệu, thiết lập gói chủ lực (Hero / Most Popular) và nút hành động (Call To Action) trên Landing Page.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Hero Plan Highlight */}
        <div
          onClick={() => setIsPopular(!isPopular)}
          className={`p-5 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-4 shadow-xs ${
            isPopular
              ? 'border-amber-500 bg-amber-50/40 text-amber-950 dark:border-amber-500/60 dark:bg-amber-950/20 dark:text-amber-100 ring-1 ring-amber-500/20'
              : 'border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPopular
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Star className="w-5 h-5" weight={isPopular ? 'fill' : 'regular'} />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Gói Chủ Lực (Hero / Most Popular)</h4>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isPopular
                    ? 'bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {isPopular ? 'ĐANG BẬT' : 'TẮT'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Tự động phóng to thẻ gói, hiển thị viền nổi bật và đề xuất cho đa số khách hàng tiềm năng trên Landing Page.
            </p>
          </div>
        </div>

        {/* Public Visibility */}
        <div
          onClick={() => setIsPublic(!isPublic)}
          className={`p-5 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-4 shadow-xs ${
            isPublic
              ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 dark:border-emerald-500/60 dark:bg-emerald-950/20 dark:text-emerald-100 ring-1 ring-emerald-500/20'
              : 'border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 opacity-75'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPublic
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
            }`}
          >
            <Eye className="w-5 h-5" />
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Hiển thị Công khai (Public)</h4>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isPublic
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                    : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {isPublic ? 'CÔNG KHAI' : 'ẨN'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Cho phép khách hàng tự xem bảng giá và đăng ký trực tiếp trên cổng SaaS FitFlow.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            Huy hiệu nhãn (Badge Text)
          </label>
          <input
            type="text"
            value={badgeText}
            onChange={(e) => setBadgeText(e.target.value)}
            placeholder="TIẾT KIỆM, PHỔ BIẾN NHẤT"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Gắn nhãn ribbon ở góc trên cùng thẻ gói</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
            <CursorClick className="w-3.5 h-3.5 text-emerald-600" />
            Nút kêu gọi hành động (CTA Text)
          </label>
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            placeholder="Bắt đầu dùng thử, Liên hệ tư vấn"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Dòng chữ nút đăng ký chính</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
            <SortAscending className="w-3.5 h-3.5 text-purple-600" />
            Thứ tự hiển thị (Display Order)
          </label>
          <input
            type="number"
            min={1}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(Number(e.target.value) || 1)}
            className={`${inputClass} font-mono font-bold`}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Số nhỏ hơn sẽ đứng trước từ trái qua phải</p>
        </div>
      </div>
    </div>
  );
}
