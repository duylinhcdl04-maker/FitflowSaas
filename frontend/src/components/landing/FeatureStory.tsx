import { motion } from 'motion/react'
import { CheckCircle, ShieldCheck, Lightning, UsersThree } from '@phosphor-icons/react'
import { CINEMATIC_EASE } from '../../lib/motion'

interface StoryItem {
  num: string
  tag: string
  headline: string
  description: string
  highlights: string[]
  visualBadge: string
  metrics: { label: string; value: string }[]
}

const stories: StoryItem[] = [
  {
    num: '01',
    tag: 'VÒNG ĐỜI HỘI VIÊN',
    headline: 'THẤU HIỂU TỪNG HỘI VIÊN.',
    description:
      'Biến khách vãng lai thành hội viên trung thành trọn đời. Theo dõi lịch sử tập luyện, check-in nhận diện khuôn mặt tức thì, chu kỳ gia hạn và các mốc tiến bộ thể hình trên một giao diện thống nhất.',
    highlights: [
      'Kiosk nhận diện khuôn mặt siêu tốc dưới 0.2 giây',
      'Tự động gửi thông báo nhắc gia hạn qua SMS & Zalo/Email',
      'Quản lý hồ sơ sức khỏe và lịch sử điểm danh chi tiết',
    ],
    visualBadge: 'ĐỒNG BỘ SINH TRẮC HỌC',
    metrics: [
      { label: 'Độ trễ Check-in', value: '< 200ms' },
      { label: 'Tỷ lệ Giữ chân', value: '94.2%' },
    ],
  },
  {
    num: '02',
    tag: 'ĐIỀU PHỐI HUẤN LUYỆN VIÊN',
    headline: 'TỐI ƯU NĂNG SUẤT HLV.',
    description:
      'Chấm dứt hoàn toàn tình trạng trùng lịch và bỏ sót buổi tập. Phân bổ gói PT thông minh, cân bằng lịch dạy của từng huấn luyện viên và tự động chốt hoa hồng minh bạch.',
    highlights: [
      'Bảng điều phối lịch tập PT trực quan kéo thả',
      'Tự động đối soát hoa hồng theo số buổi thực dạy',
      'Ứng dụng di động riêng cho HLV theo dõi tiến độ học viên',
    ],
    visualBadge: 'ĐIỀU PHỐI HUẤN LUYỆN',
    metrics: [
      { label: 'Xung đột lịch tập', value: '0%' },
      { label: 'Hiệu suất khai thác HLV', value: '88.5%' },
    ],
  },
  {
    num: '03',
    tag: 'TĂNG TRƯỞNG DÒNG TIỀN',
    headline: 'KIỂM SOÁT TỪNG ĐỒNG DOANH THU.',
    description:
      'Thu đủ mọi nguồn doanh thu không thất thoát. Tích hợp thanh toán VietQR động, bán đồ uống quầy POS, gia hạn tự động và báo cáo dòng tiền chuẩn xác từng ca làm việc.',
    highlights: [
      'Mã VietQR động tự động khớp lệnh chuyển khoản ngân hàng',
      'Báo cáo doanh thu POS chi tiết theo ca trực lễ tân',
      'Xuất báo cáo tài chính kiểm toán chỉ với 1 cú nhấp chuột',
    ],
    visualBadge: 'CÔNG CỤ VIETQR & POS',
    metrics: [
      { label: 'Tốc độ đối soát', value: 'Tức thì' },
      { label: 'Tỷ lệ thất thoát', value: '0.0%' },
    ],
  },
  {
    num: '04',
    tag: 'MỞ RỘNG QUY MÔ',
    headline: 'MỘT TẦM NHÌN. MỌI CHI NHÁNH.',
    description:
      'Mở rộng từ 1 phòng tập ban đầu thành chuỗi phòng gym phủ khắp các thành phố. Quản lý đồng bộ quản lý chi nhánh, chuẩn hóa bảng giá và so sánh hiệu quả kinh doanh giữa các cơ sở.',
    highlights: [
      'Ma trận phân quyền đa cấp (Chủ phòng, Quản lý, Lễ tân, PT)',
      'Hỗ trợ hội viên tập liên chi nhánh linh hoạt',
      'Báo cáo so sánh tăng trưởng giữa các cơ sở theo thời gian thực',
    ],
    visualBadge: 'KIẾN TRÚC ĐA CHI NHÁNH',
    metrics: [
      { label: 'Chi nhánh hỗ trợ', value: 'Không giới hạn' },
      { label: 'Đồng bộ dữ liệu', value: '< 50ms' },
    ],
  },
]

export default function FeatureStory() {
  return (
    <section className="py-24 sm:py-32 bg-[#0B090E] bg-grain overflow-hidden border-t border-white/6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-28 sm:gap-36">
          {stories.map((story, index) => {
            const isEven = index % 2 === 1

            return (
              <div
                key={story.num}
                className={`grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center ${
                  isEven ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Text Content Column */}
                <div
                  className={`lg:col-span-6 ${
                    isEven ? 'lg:order-2' : 'lg:order-1'
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6, ease: CINEMATIC_EASE }}
                    className="flex items-center gap-3 mb-4"
                  >
                    <span className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl text-purple-400">
                      {story.num}
                    </span>
                    <span className="text-xs font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-wider text-[#A7A1AD] uppercase">
                      / {story.tag}
                    </span>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, delay: 0.1, ease: CINEMATIC_EASE }}
                    className="font-['Be_Vietnam_Pro',sans-serif] font-extrabold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-[#F5F3F7] leading-[1.18] mb-6"
                  >
                    {story.headline}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, delay: 0.2, ease: CINEMATIC_EASE }}
                    className="font-['Plus_Jakarta_Sans',sans-serif] text-base sm:text-lg text-[#A7A1AD] leading-relaxed mb-8"
                  >
                    {story.description}
                  </motion.p>

                  {/* Feature Highlights Checklist */}
                  <motion.ul
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.7, delay: 0.3, ease: CINEMATIC_EASE }}
                    className="space-y-3 mb-8"
                  >
                    {story.highlights.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#F5F3F7]"
                      >
                        <CheckCircle
                          size={18}
                          weight="fill"
                          className="text-purple-400 shrink-0 mt-0.5"
                        />
                        <span>{item}</span>
                      </li>
                    ))}
                  </motion.ul>

                  {/* Story Metrics */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, delay: 0.4, ease: CINEMATIC_EASE }}
                    className="grid grid-cols-2 gap-6 pt-6 border-t border-white/8"
                  >
                    {story.metrics.map((m, idx) => (
                      <div key={idx}>
                        <div className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-2xl sm:text-3xl text-white tracking-tight">
                          {m.value}
                        </div>
                        <div className="font-['Plus_Jakarta_Sans',sans-serif] text-xs text-[#A7A1AD] uppercase tracking-wider mt-0.5">
                          {m.label}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>

                {/* Visual Card / Mockup Column */}
                <div
                  className={`lg:col-span-6 ${
                    isEven ? 'lg:order-1' : 'lg:order-2'
                  }`}
                >
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 32 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: 0.85, ease: CINEMATIC_EASE }}
                    className="relative rounded-[10px] border border-white/10 bg-[#151119] p-8 sm:p-10 shadow-2xl overflow-hidden group"
                  >
                    {/* Top Corner Badge */}
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-[11px] font-['Plus_Jakarta_Sans',sans-serif] font-bold tracking-widest text-purple-300 uppercase px-3 py-1 rounded bg-purple-950/70 border border-purple-500/30">
                        {story.visualBadge}
                      </span>
                      <ShieldCheck size={20} className="text-emerald-400" weight="bold" />
                    </div>

                    {/* Architectural Wireframe Visual Block */}
                    <div className="space-y-4 my-6">
                      <div className="h-12 w-full rounded-[6px] bg-[#1B1521] border border-white/6 flex items-center justify-between px-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          <span className="font-['Plus_Jakarta_Sans',sans-serif] text-xs font-semibold text-white">
                            {story.headline}
                          </span>
                        </div>
                        <span className="text-xs font-['JetBrains_Mono'] text-purple-400 font-semibold">
                          SẴN SÀNG
                        </span>
                      </div>

                      <div className="h-24 w-full rounded-[6px] bg-[#1B1521] border border-white/6 p-4 flex flex-col justify-between">
                        <div className="flex items-center justify-between text-xs text-[#A7A1AD] font-['Plus_Jakarta_Sans',sans-serif]">
                          <span>Trạng thái máy chủ</span>
                          <span className="text-emerald-400 font-semibold">100% Ổn định</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full w-[92%]" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-[6px] bg-[#1B1521] border border-white/6 flex items-center gap-3">
                          <Lightning size={20} className="text-purple-400" />
                          <div>
                            <div className="text-[11px] text-[#A7A1AD]">Tốc độ đo lường</div>
                            <div className="text-xs font-bold text-white">Đồng bộ tức thời</div>
                          </div>
                        </div>
                        <div className="p-3.5 rounded-[6px] bg-[#1B1521] border border-white/6 flex items-center gap-3">
                          <UsersThree size={20} className="text-purple-400" />
                          <div>
                            <div className="text-[11px] text-[#A7A1AD]">Kiểm soát quyền</div>
                            <div className="text-xs font-bold text-white">Đa vai trò</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-['JetBrains_Mono'] text-[#6F6877] text-right mt-4">
                      FitFlow Event Engine // 2026.09.08
                    </div>
                  </motion.div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
