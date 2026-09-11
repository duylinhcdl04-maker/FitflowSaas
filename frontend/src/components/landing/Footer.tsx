import { ShieldCheck } from '@phosphor-icons/react'

export default function Footer() {
  return (
    <footer className="bg-[#050407] border-t border-white/8 pt-16 pb-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-8 lg:gap-12 pb-14 border-b border-white/8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-4 flex flex-col justify-between">
            <div>
              <a href="#" className="inline-block group mb-4">
                <span className="font-['Be_Vietnam_Pro',sans-serif] font-black text-3xl text-white tracking-wider uppercase group-hover:text-purple-400 transition-colors">
                  FITFLOW
                </span>
              </a>
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#A7A1AD] max-w-sm leading-relaxed mb-6">
                Nền tảng SaaS thế hệ mới dành cho các phòng tập thể hình, boutique studio và chuỗi gym fitness. Tối ưu hiệu năng và vận hành mượt mà.
              </p>
            </div>

            {/* Live System Status */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151119] border border-white/8 text-xs font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD] w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span>Hệ thống hoạt động 100% ổn định</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-4">
              SẢN PHẨM
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Tính năng
                </a>
              </li>
              <li>
                <a href="#ecosystem" className="hover:text-white transition-colors">
                  Hệ sinh thái
                </a>
              </li>
              <li>
                <a href="#showcase" className="hover:text-white transition-colors">
                  Bảng điều khiển
                </a>
              </li>
              <li>
                <a href="#solutions" className="hover:text-white transition-colors">
                  Giải pháp
                </a>
              </li>
              <li>
                <a href="#pricing" className="hover:text-white transition-colors">
                  Bảng giá
                </a>
              </li>
            </ul>
          </div>

          {/* Portals Direct Access */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-4">
              CỔNG TRUY CẬP
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
              <li>
                <a href="/owner/login" className="hover:text-purple-400 transition-colors">
                  Chủ phòng gym
                </a>
              </li>
              <li>
                <a href="/manager" className="hover:text-purple-400 transition-colors">
                  Quản lý chi nhánh
                </a>
              </li>
              <li>
                <a href="/staff" className="hover:text-purple-400 transition-colors">
                  Lễ tân / Check-in
                </a>
              </li>
              <li>
                <a href="/pt" className="hover:text-purple-400 transition-colors">
                  Huấn luyện viên (PT)
                </a>
              </li>
              <li>
                <a href="/customer" className="hover:text-purple-400 transition-colors">
                  Cổng hội viên
                </a>
              </li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-4">
              CÔNG TY
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Bảo mật dữ liệu
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Liên hệ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Tuyển dụng
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="font-['Be_Vietnam_Pro',sans-serif] font-bold text-sm text-white tracking-wider uppercase mb-4">
              PHÁP LÝ
            </h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-['Plus_Jakarta_Sans',sans-serif] text-[#A7A1AD]">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Cam kết SLA
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-['Plus_Jakarta_Sans',sans-serif] text-[#6F6877]">
          <div>
            &copy; {new Date().getFullYear()} FitFlow Inc. Bản quyền đã được đăng ký.
          </div>
          <div className="flex items-center gap-1.5 text-[#A7A1AD]">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span>Hạ tầng mã hóa sinh trắc học & tài chính chuẩn doanh nghiệp</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
