import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  UserList,
  UserPlus,
  MagnifyingGlass,
  CheckCircle,
  WarningCircle,
  Eye,
} from '@phosphor-icons/react';
import {
  getManagerCustomers,
  quickRegisterCustomer,
  getBranchPackages,
  toggleCustomerStatus,
} from '../../manager/api/manager';
import { apiErrorMessage } from '../../owner/api/client';
import Callout from '../../owner/components/Callout';
import Button from '../../owner/components/Button';
import FormField from '../../owner/components/FormField';
import Modal from '../../owner/components/Modal';
import MemberDetailModal from '../../manager/components/MemberDetailModal';

export default function StaffMembersPage() {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('MALE');

  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const { data: customerData, isLoading } = useQuery({
    queryKey: ['staff-members-list', search, page, limit],
    queryFn: () => getManagerCustomers(search, undefined, undefined, page, limit),
  });

  const meta = customerData?.meta || { total: 0, page: 1, limit: 10, totalPages: 1 };

  const { data: branchPackages = [] } = useQuery({
    queryKey: ['staff-branch-packages'],
    queryFn: getBranchPackages,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: ({ customerId, newStatus }: { customerId: string; newStatus: 'ACTIVE' | 'INACTIVE' }) =>
      toggleCustomerStatus(customerId, newStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể thay đổi trạng thái tài khoản'));
    },
  });

  const registerMutation = useMutation({
    mutationFn: () => quickRegisterCustomer(fullName, phone, email, gender),
    onSuccess: (newCust) => {
      setSuccessMsg(`Đã tạo hồ sơ hội viên thành công cho ${newCust.full_name} (${newCust.customer_code})!`);
      setError(null);
      setRegisterModalOpen(false);
      setFullName('');
      setPhone('');
      setEmail('');
      queryClient.invalidateQueries({ queryKey: ['staff-members-list'] });
    },
    onError: (err) => {
      setError(apiErrorMessage(err, 'Không thể đăng ký hồ sơ khách hàng'));
    },
  });

  function handleOpenDetail(cust: any) {
    setSelectedCustomer(cust);
    setDetailModalOpen(true);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UserList className="text-emerald-600 dark:text-emerald-400" size={28} />
            Quản Lý Hồ Sơ Hội Viên & Face ID
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Đăng ký hội viên mới, tra cứu hồ sơ thẻ tập và thu thập dữ liệu khuôn mặt (Face Enrollment).
          </p>
        </div>

        <Button onClick={() => setRegisterModalOpen(true)} className="gap-2">
          <UserPlus size={18} /> Đăng Ký Hồ Sơ Khách Mới
        </Button>
      </div>

      {successMsg && (
        <Callout tone="success">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        </Callout>
      )}

      {error && (
        <Callout tone="danger">
          <div className="flex items-center gap-2">
            <WarningCircle size={18} className="text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        </Callout>
      )}

      {/* Filter & Search Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm kiếm hội viên theo Họ tên, SĐT, Mã hội viên..."
            className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-10 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
          />
          <MagnifyingGlass size={16} className="absolute left-3 top-3 text-slate-400" />
        </div>
      </div>

      {/* Members Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Đang tải danh sách hội viên...</div>
        ) : customerData?.items?.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
            Không tìm thấy hội viên chính thức nào khớp từ khóa tìm kiếm.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 dark:border-zinc-800">
                  <th className="py-3 px-3 font-semibold">Mã hội viên</th>
                  <th className="py-3 px-3 font-semibold">Họ và tên</th>
                  <th className="py-3 px-3 font-semibold">Số điện thoại</th>
                  <th className="py-3 px-3 font-semibold">Gói tập hiện tại</th>
                  <th className="py-3 px-3 font-semibold">Trạng thái</th>
                  <th className="py-3 px-3 text-right font-semibold">Chi tiết & Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {customerData?.items?.map((cust: any) => {
                  const activePkg = cust.memberships?.[0];
                  return (
                    <tr
                      key={cust.id}
                      onClick={() => handleOpenDetail(cust)}
                      className="hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {cust.customer_code}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                        {cust.full_name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-zinc-300">
                        {cust.phone || 'N/A'}
                      </td>
                      <td className="py-3 px-3">
                        {activePkg ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded text-[11px]">
                            {activePkg.package_name_snapshot}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Chưa có gói</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStatusMutation.mutate({
                              customerId: cust.id,
                              newStatus: cust.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                            });
                          }}
                          className="focus:outline-none cursor-pointer"
                          title="Nhấp để thay đổi trạng thái kích hoạt"
                        >
                          <span
                            className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-extrabold transition ${
                              cust.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-200 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {cust.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm khóa'}
                          </span>
                        </button>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(cust);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300 transition"
                        >
                          <Eye size={14} /> Chi tiết & Thao tác
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {meta.total > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-zinc-400">
            <div className="flex items-center gap-2">
              <span>
                Hiển thị <strong className="text-slate-900 dark:text-white font-mono">{(page - 1) * limit + 1}</strong> - <strong className="text-slate-900 dark:text-white font-mono">{Math.min(page * limit, meta.total)}</strong> trên tổng số <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{meta.total}</strong> hội viên
              </span>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="ml-2 rounded-lg border border-slate-200 bg-slate-50 py-1 px-2 font-semibold text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                <option value={10}>10 dòng/trang</option>
                <option value={20}>20 dòng/trang</option>
                <option value={50}>50 dòng/trang</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                « Đầu
              </button>
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                ‹ Trước
              </button>

              <span className="px-3 py-1.5 font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 rounded-lg border border-emerald-200 dark:border-emerald-900">
                Trang {page} / {meta.totalPages}
              </span>

              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Sau ›
              </button>
              <button
                type="button"
                disabled={page >= meta.totalPages}
                onClick={() => setPage(meta.totalPages)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-800 font-bold hover:bg-slate-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Cuối »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      {detailModalOpen && (
        <MemberDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          branchPackages={branchPackages}
          isFaceIdEnabled={true}
        />
      )}

      {/* Modal Quick Register Customer */}
      {registerModalOpen && (
        <Modal open={registerModalOpen} onClose={() => setRegisterModalOpen(false)} title="Đăng Ký Hồ Sơ Khách Hàng Mới">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              registerMutation.mutate();
            }}
            className="flex flex-col gap-4"
          >
            <FormField label="Họ và tên *" htmlFor="cust-name">
              <input
                id="cust-name"
                type="text"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder="Nhập họ và tên khách hàng"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormField>

            <FormField label="Số điện thoại *" htmlFor="cust-phone">
              <input
                id="cust-phone"
                type="tel"
                required
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>

            <FormField label="Email" htmlFor="cust-email">
              <input
                id="cust-email"
                type="email"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                placeholder="email@example.com (Không bắt buộc)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Giới tính" htmlFor="cust-gender">
              <select
                id="cust-gender"
                className="w-full rounded-xl border border-slate-300 bg-slate-50 p-2.5 text-xs text-slate-900 focus:border-emerald-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </FormField>

            <div className="flex justify-end gap-2 mt-2">
              <Button type="button" variant="secondary" onClick={() => setRegisterModalOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Đang tạo...' : 'Tạo Hồ Sơ Hội Viên'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
