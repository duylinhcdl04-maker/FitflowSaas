import { useState } from 'react'
import { motion } from 'motion/react'
import { Check, ArrowRight, Sparkle } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface PricingPlan {
  id: string
  name: string
  tagline: string
  monthlyPrice: string
  annualPrice: string
  popular?: boolean
  features: string[]
  cta: string
}

const plans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'GÓI KHỞI ĐỘNG (STARTER)',
    tagline: 'Hoàn hảo cho 1 phòng tập boutique studio hoặc phòng gym mới thành lập.',
    monthlyPrice: '₫990,000',
    annualPrice: '₫790,000',
    features: [
      'Tối đa 300 hội viên hoạt động',
      'Tích hợp kiosk Face AI check-in',
      'Quản lý hợp đồng & hồ sơ số hóa hội viên',
      'Xếp lịch tập & điều phối huấn luyện viên PT',
      'Thanh toán VietQR động tự động khớp lệnh',
      'Hỗ trợ kỹ thuật qua Email & Ticket',
    ],
    cta: 'DÙNG THỬ MIỄN PHÍ',
  },
  {
    id: 'pro',
    name: 'GÓI CHUYÊN NGHIỆP (PRO)',
    tagline: 'Giải pháp toàn diện nhất cho các phòng gym thương mại tăng trưởng cao.',
    monthlyPrice: '₫2,490,000',
    annualPrice: '₫1,990,000',
    popular: true,
    features: [
      'Tối đa 2,500 hội viên hoạt động',
      'Hỗ trợ lên tới 3 chi nhánh',
      'Không giới hạn thiết bị Face Check-in AI',
      'Tự động tính hoa hồng & bảng lương HLV',
      'Bán lẻ POS quầy nước & thực phẩm bổ sung',
      'Báo cáo tài chính & chỉ số giữ chân chuyên sâu',
      'Phân quyền đa cấp (Quản lý, Lễ tân, PT)',
      'Hỗ trợ ưu tiên 24/7 qua Hotline/Zalo',
    ],
    cta: 'BẮT ĐẦU VỚI GÓI PRO',
  },
  {
    id: 'enterprise',
    name: 'GÓI DOANH NGHIỆP (ENTERPRISE)',
    tagline: 'Đặc quyền dành riêng cho chuỗi gym đa chi nhánh và hệ thống nhượng quyền.',
    monthlyPrice: '₫5,990,000',
    annualPrice: '₫4,790,000',
    features: [
      'Không giới hạn hội viên & lượt check-in',
      'Không giới hạn số lượng chi nhánh',
      'Chính sách tập luyện liên chi nhánh linh hoạt',
      'Cơ sở dữ liệu độc lập & tên miền riêng',
      'Tích hợp API & Webhook mở rộng với ERP',
      'Tùy biến luồng tài chính & nghiệp vụ kế toán',
      'Quản lý tài khoản riêng biệt & Cam kết SLA 99.99%',
      'Hỗ trợ đào tạo nhân sự & lắp đặt thiết bị tận nơi',
    ],
    cta: 'LIÊN HỆ TƯ VẤN DOANH NGHIỆP',
  },
]

export default function Pricing() {
  const [annual, setAnnual] = useState(true)

  return (
    <section id="pricing" className="py-28 sm:py-36 bg-[#0B090E] bg-grain overflow-hidden border-t border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-[#151119] mb-4"
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold tracking-widest text-purple-300 uppercase">
              BẢNG GIÁ MINH BẠCH
            </span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.1, ease: CINEMATIC_EASE }}
            className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-5xl lg:text-6xl tracking-tight text-[#F5F3F7] leading-[1.18] mb-6"
          >
            CHI PHÍ TINH GỌN. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5F3F7] via-[#C084FC] to-purple-400">
              TĂNG TRƯỞNG VƯỢT TRỘI.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
            className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg text-[#A7A1AD] leading-relaxed mb-8"
          >
            Không phí ẩn cài đặt, không cắt phần trăm hoa hồng trên từng giao dịch. Lựa chọn gói phù hợp với quy mô hiện tại và nâng cấp bất cứ lúc nào.
          </motion.p>

          {/* Billing Cycle Toggle */}
          <div className="inline-flex items-center gap-3 p-1.5 rounded-full bg-[#151119] border border-white/10">
            <button
              type="button"
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-xs font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-wide transition-all ${
                !annual
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#A7A1AD] hover:text-white'
              }`}
            >
              THANH TOÁN THÁNG
            </button>
            <button
              type="button"
              onClick={() => setAnnual(true)}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-full text-xs font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-wide transition-all ${
                annual
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-[#A7A1AD] hover:text-white'
              }`}
            >
              <span>THANH TOÁN NĂM</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-purple-950 text-purple-300 font-extrabold">
                TIẾT KIỆM 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: CINEMATIC_EASE }}
              className={`relative rounded-[16px] p-8 sm:p-10 flex flex-col justify-between border transition-all duration-300 ${
                plan.popular
                  ? 'bg-gradient-to-b from-[#1E1627] to-[#151119] border-purple-500/60 shadow-[0_8px_40px_rgba(168,85,247,0.2)] lg:-translate-y-2'
                  : 'bg-[#151119] border-white/8 hover:border-white/20'
              }`}
            >
              {/* Popular Flag Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-purple-600 border border-purple-400 text-[10px] font-['Plus_Jakarta_Sans',sans-serif] font-extrabold tracking-wider text-white uppercase flex items-center gap-1.5 shadow-[0_0_16px_rgba(168,85,247,0.5)] whitespace-nowrap">
                  <Sparkle size={12} weight="fill" />
                  <span>PHỔ BIẾN NHẤT</span>
                </div>
              )}

              <div>
                <h3 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl uppercase text-white tracking-tight mb-2">
                  {plan.name}
                </h3>
                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD] min-h-[36px] mb-6">
                  {plan.tagline}
                </p>

                {/* Price Display */}
                <div className="pt-4 pb-6 border-y border-white/8 mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-3xl sm:text-4xl text-white tracking-tight">
                      {annual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD]">
                      / tháng
                    </span>
                  </div>
                  <span className="text-[11px] font-['Plus_Jakarta_Sans',sans-serif] text-purple-400 mt-1 block">
                    {annual ? 'Thanh toán hàng năm (Tặng 2 tháng sử dụng)' : 'Thanh toán hàng tháng, hủy bất kỳ lúc nào'}
                  </span>
                </div>

                {/* Features List */}
                <div className="space-y-3.5 mb-8">
                  <div className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-bold text-white uppercase tracking-wider mb-2">
                    Tính năng bao gồm:
                  </div>
                  {plan.features.map((feat, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#F5F3F7]"
                    >
                      <div className="w-4 h-4 rounded-full bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                        <Check size={11} weight="bold" className="text-purple-300" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <a
                href="/owner/register"
                className={`w-full py-4 rounded-[10px] font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_24px_rgba(168,85,247,0.35)] hover:shadow-[0_0_36px_rgba(168,85,247,0.55)]'
                    : 'bg-[#1B1521] hover:bg-white/10 text-white border border-white/10'
                }`}
              >
                <span>{plan.cta}</span>
                <ArrowRight size={15} weight="bold" />
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
