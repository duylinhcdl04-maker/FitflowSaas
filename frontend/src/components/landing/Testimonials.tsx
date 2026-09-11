import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CaretLeft, CaretRight, Quotes } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface Testimonial {
  quote: string
  author: string
  role: string
  gym: string
  metric: string
}

const testimonials: Testimonial[] = [
  {
    quote: 'FitFlow mang đến tầm nhìn rõ ràng và chuẩn xác cho toàn bộ chuỗi 4 cơ sở của chúng tôi mỗi ngày.',
    author: 'Nguyễn Hoàng Nam',
    role: 'Nhà sáng lập & CEO',
    gym: 'Hệ thống Apex Performance Gym (TP.HCM)',
    metric: '+38% Tăng trưởng doanh thu 6 tháng đầu năm',
  },
  {
    quote: 'Check-in bằng khuôn mặt dưới 0.2 giây đã giải tỏa toàn bộ tắc nghẽn tại quầy lễ tân giờ cao điểm.',
    author: 'Elena Nguyễn',
    role: 'Giám đốc Vận hành',
    gym: 'Vibe Boutique Pilates & Yoga Club (Hà Nội)',
    metric: '0.2s Check-in & 0 thời gian chờ',
  },
  {
    quote: 'Tính hoa hồng cho 20 HLV từng tốn 3 ngày trên Excel. Nay FitFlow tự động chốt chuẩn xác trong vài giây.',
    author: 'Trần Bảo Trung',
    role: 'Trưởng bộ phận Huấn luyện viên',
    gym: 'Học viện Thể hình IronDistrict (Đà Nẵng)',
    metric: '100% Tự động hóa đối soát lương & hoa hồng',
  },
]

export default function Testimonials() {
  const [current, setCurrent] = useState(0)

  function next() {
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }

  function prev() {
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  const activeTestimonial = testimonials[current]

  return (
    <section className="py-28 sm:py-36 bg-[#070609] bg-grain overflow-hidden border-t border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          {/* Top Quote Icon & Label */}
          <div className="flex items-center justify-between mb-12">
            <div className="p-3 rounded-xl bg-[#151119] border border-white/10 text-purple-400">
              <Quotes size={32} weight="fill" />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={prev}
                className="w-12 h-12 rounded-full border border-white/10 hover:border-purple-500 bg-[#151119] hover:bg-purple-950/40 text-white flex items-center justify-center transition-all"
                aria-label="Đánh giá trước"
              >
                <CaretLeft size={20} weight="bold" />
              </button>
              <button
                type="button"
                onClick={next}
                className="w-12 h-12 rounded-full border border-white/10 hover:border-purple-500 bg-[#151119] hover:bg-purple-950/40 text-white flex items-center justify-center transition-all"
                aria-label="Đánh giá tiếp theo"
              >
                <CaretRight size={20} weight="bold" />
              </button>
            </div>
          </div>

          {/* Large Editorial Quotation */}
          <div className="min-h-[220px] sm:min-h-[200px] flex items-center mb-10">
            <AnimatePresence mode="wait">
              <motion.blockquote
                key={current}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, ease: CINEMATIC_EASE }}
                className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-[#F5F3F7] leading-[1.3]"
              >
                &ldquo;{activeTestimonial.quote}&rdquo;
              </motion.blockquote>
            </AnimatePresence>
          </div>

          {/* Author Details & Proof Metric */}
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-8 border-t border-white/8"
            >
              <div>
                <div className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-lg text-white">
                  {activeTestimonial.author}
                </div>
                <div className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-purple-300 mt-0.5">
                  {activeTestimonial.role} — {activeTestimonial.gym}
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#151119] border border-purple-500/20 text-xs font-['Plus_Jakarta_Sans',sans-serif] font-semibold text-purple-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{activeTestimonial.metric}</span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slider Dots Indicator */}
          <div className="flex items-center gap-2 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrent(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  current === idx ? 'w-8 bg-purple-500' : 'w-2 bg-white/20 hover:bg-white/40'
                }`}
                aria-label={`Chuyển đến đánh giá ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
