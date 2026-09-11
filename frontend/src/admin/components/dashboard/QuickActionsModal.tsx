import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Stack,
  Package,
  Receipt,
  WarningCircle,
  ClipboardText,
  GearSix,
  MagnifyingGlass,
  X,
} from '@phosphor-icons/react';
import Modal from '../Modal';

interface QuickActionsModalProps {
  open: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
}

export default function QuickActionsModal({
  open,
  onClose,
  onOpenSearch,
}: QuickActionsModalProps) {
  const navigate = useNavigate();

  if (!open) return null;

  const actions = [
    {
      title: 'Tạo Tenant Mới',
      desc: 'Khởi tạo tài khoản phòng gym và cấp phát cơ sở dữ liệu riêng biệt',
      icon: Plus,
      color: 'bg-emerald-500 text-white',
      onClick: () => {
        onClose();
        navigate('/admin/tenants/new');
      },
    },
    {
      title: 'Tạo Gói Cước Mới',
      desc: 'Định nghĩa gói Starter, Pro, Enterprise hoặc thiết lập giá mới',
      icon: Stack,
      color: 'bg-blue-500 text-white',
      onClick: () => {
        onClose();
        navigate('/admin/plans');
      },
    },
    {
      title: 'Tạo Add-on Mới',
      desc: 'Thêm dịch vụ bổ sung như Face ID, Dung lượng lưu trữ, SMS Brandname',
      icon: Package,
      color: 'bg-purple-500 text-white',
      onClick: () => {
        onClose();
        navigate('/admin/addons');
      },
    },
    {
      title: 'Kiểm tra Thanh toán lỗi',
      desc: 'Xem danh sách 7 subscription chưa thanh toán thành công chu kỳ',
      icon: WarningCircle,
      color: 'bg-rose-500 text-white',
      onClick: () => {
        onClose();
        navigate('/admin/invoices?status=FAILED');
      },
    },
    {
      title: 'Tìm kiếm Toàn hệ thống (⌘K)',
      desc: 'Tra cứu nhanh tenant, gói cước, hóa đơn, người dùng hoặc email',
      icon: MagnifyingGlass,
      color: 'bg-zinc-700 text-white',
      onClick: () => {
        onClose();
        onOpenSearch();
      },
    },
    {
      title: 'Nhật ký Kiểm toán (Audit Logs)',
      desc: 'Xem lịch sử thao tác của các Super Admin và sự kiện quan trọng',
      icon: ClipboardText,
      color: 'bg-teal-500 text-white',
      onClick: () => {
        onClose();
        navigate('/admin/audit-logs');
      },
    },
  ];

  return (
    <Modal open={open} onClose={onClose} title="Thao tác Quản trị Nhanh">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 pt-2">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              type="button"
              onClick={act.onClick}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-3.5 text-left transition-all hover:border-emerald-300 hover:bg-emerald-50/30 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-emerald-700 dark:hover:bg-emerald-950/20"
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${act.color}`}
              >
                <Icon size={16} weight="bold" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {act.title}
                </h4>
                <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 leading-tight">
                  {act.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
