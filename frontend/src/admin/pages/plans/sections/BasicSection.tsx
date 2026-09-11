import { Info, Sparkle, Tag, Users } from '@phosphor-icons/react';

interface BasicSectionProps {
  name: string;
  setName: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  slogan: string;
  setSlogan: (v: string) => void;
  targetAudience: string;
  setTargetAudience: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  status: string;
}

const inputClass =
  'w-full bg-white dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition-all shadow-xs';

export default function BasicSection({
  name,
  setName,
  code,
  setCode,
  slogan,
  setSlogan,
  targetAudience,
  setTargetAudience,
  description,
  setDescription,
}: BasicSectionProps) {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50/70 border border-blue-200/80 dark:bg-blue-950/20 dark:border-blue-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-blue-900 dark:text-blue-200">
          <p className="font-bold">Dimension 1: Thông tin cơ bản (Basic Information)</p>
          <p className="mt-0.5 text-xs text-blue-700/80 dark:text-blue-300/80">
            Định nghĩa thông điệp giá trị, định danh hệ thống và phân khúc khách hàng mục tiêu cho gói SaaS.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Tên Gói SaaS <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Gói Tăng Trưởng (Growth)"
              className={inputClass}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Tên hiển thị thương mại trên Bảng giá và Hóa đơn</p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-zinc-500" />
              Mã định danh (Code) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
              placeholder="STARTER, GROWTH, ENTERPRISE"
              className={`${inputClass} font-mono uppercase`}
            />
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Mã hệ thống duy nhất, viết hoa không dấu</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
            <Sparkle className="w-3.5 h-3.5 text-amber-500" weight="fill" />
            Slogan / Thông điệp giá trị
          </label>
          <input
            type="text"
            value={slogan}
            onChange={(e) => setSlogan(e.target.value)}
            placeholder="Ví dụ: Tăng trưởng bứt phá cùng tự động hóa và AI FaceID"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Câu slogan ngắn gọn nêu bật điểm khác biệt lớn nhất của gói</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Phân khúc khách hàng mục tiêu (Target Audience)
          </label>
          <input
            type="text"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            placeholder="Ví dụ: Trung tâm Fitness chuyên nghiệp cần mở rộng và nâng tầm dịch vụ"
            className={inputClass}
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">Gợi ý phân khúc giúp chủ phòng tập nhận diện gói phù hợp</p>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
            Mô tả chi tiết giải pháp
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả phạm vi ứng dụng, giá trị mang lại cho chủ đầu tư..."
            className={inputClass}
          />
        </div>
      </div>
    </div>
  );
}
