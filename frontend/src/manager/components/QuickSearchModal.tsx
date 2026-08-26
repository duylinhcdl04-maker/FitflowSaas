import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlass,
  QrCode,
  Users,
  CreditCard,
  CalendarCheck,
  House,
  UserGear,
  FileText,
  Ticket,
  X,
} from '@phosphor-icons/react';
import { getManagerCustomers } from '../api/manager';
import { useAuthStore } from '../../owner/store/auth-store';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function QuickSearchModal({ isOpen, onClose }: QuickSearchModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const isStaffOnly =
    Boolean(user?.roles?.includes('STAFF')) &&
    !user?.roles?.includes('BRANCH_MANAGER') &&
    !user?.roles?.includes('OWNER');

  // Handle ESC key press
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setCustomers([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setCustomers([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await getManagerCustomers(query);
        setCustomers(res?.items || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const quickActions = isStaffOnly
    ? [
        { label: 'Check-in quầy', path: '/staff/checkin', icon: QrCode, desc: 'Mở bàn check-in quầy thời gian thực' },
        { label: 'Hội viên & Face ID', path: '/staff/members', icon: Users, desc: 'Tra cứu & Tạo hồ sơ hội viên mới' },
        { label: 'Bán gói & POS Thu ngân', path: '/staff/pos', icon: CreditCard, desc: 'Bán gói & Thu tiền hội viên' },
        { label: 'Vé lượt vãng lai', path: '/staff/guest-visits', icon: Ticket, desc: 'Tiếp đón khách vãng lai 1 buổi' },
        { label: 'Tổng quan ca trực', path: '/staff', icon: House, desc: 'Xem thông tin ca trực lễ tân' },
      ]
    : [
        { label: 'Check-in quầy', path: '/manager/checkin', icon: QrCode, desc: 'Mở bàn check-in quầy thời gian thực' },
        { label: 'Đăng ký hội viên', path: '/manager/customers', icon: Users, desc: 'Tạo hồ sơ khách hàng mới' },
        { label: 'Tạo thanh toán gói tập', path: '/manager/memberships', icon: CreditCard, desc: 'Bán gói & Thu tiền hội viên' },
        { label: 'Đặt lịch PT', path: '/manager/pt', icon: CalendarCheck, desc: 'Xếp lịch tập với Huấn luyện viên' },
        { label: 'Tổng quan chi nhánh', path: '/manager', icon: House, desc: 'Xem trung tâm điều hành' },
        { label: 'Nhân sự chi nhánh', path: '/manager/staff', icon: UserGear, desc: 'Danh sách nhân viên & PT' },
        { label: 'Báo cáo & Audit Log', path: '/manager/reports', icon: FileText, desc: 'Xem lịch sử thao tác & báo cáo' },
      ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-sm animate-fade-in cursor-pointer"
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-stone-200/80 bg-white shadow-2xl overflow-hidden dark:border-zinc-800 dark:bg-zinc-900 transition-all cursor-default"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100 dark:border-zinc-800">
          <MagnifyingGlass size={20} className="text-zinc-400 dark:text-zinc-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên hội viên, mã thẻ, SĐT hoặc nhập lệnh..."
            className="w-full bg-transparent text-sm font-medium text-zinc-900 placeholder-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder-zinc-500"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-block rounded border border-stone-200 bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-stone-100 hover:text-zinc-700 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Đóng cửa sổ"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Results Container */}
        <div className="max-h-96 overflow-y-auto p-2">
          {/* Customer search results */}
          {query.trim() !== '' && (
            <div className="mb-4">
              <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
                Kết quả tìm kiếm hội viên ({customers.length})
              </span>
              {loading ? (
                <div className="py-4 text-center text-xs text-zinc-400">Đang tìm...</div>
              ) : customers.length === 0 ? (
                <div className="py-4 text-center text-xs text-zinc-400">Không tìm thấy hội viên phù hợp</div>
              ) : (
                customers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      onClose();
                      navigate(isStaffOnly ? '/staff/members' : '/manager/customers');
                    }}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-stone-100 dark:hover:bg-zinc-800/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs dark:bg-emerald-950 dark:text-emerald-300">
                        {c.full_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{c.full_name}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400">SĐT: {c.phone} • Mã: {c.customer_code}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Xem chi tiết →</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Quick Actions List */}
          <div>
            <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block">
              Điều hướng & Lệnh thao tác nhanh
            </span>

            <div className="flex flex-col gap-0.5 mt-1">
              {quickActions.map((act) => {
                const Icon = act.icon;
                return (
                  <div
                    key={act.path}
                    onClick={() => {
                      onClose();
                      navigate(act.path);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-emerald-50/80 hover:text-emerald-900 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-200 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Icon size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-emerald-950 dark:group-hover:text-emerald-200">
                          {act.label}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{act.desc}</p>
                      </div>
                    </div>
                    <span className="text-xs text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-medium">↵</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
