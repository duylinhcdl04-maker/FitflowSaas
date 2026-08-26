import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserGear, UserPlus, ShieldCheck } from '@phosphor-icons/react';
import { getManagerStaff, createManagerStaff } from '../../api/manager';
import Card from '../../../owner/components/Card';
import Callout from '../../../owner/components/Callout';
import Button from '../../../owner/components/Button';
import Modal from '../../../owner/components/Modal';
import FormField, { inputClass } from '../../../owner/components/FormField';
import { Skeleton } from '../../../owner/components/Skeleton';
import { apiErrorMessage } from '../../../owner/api/client';

export default function ManagerStaffPage() {
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('MALE');
  const [role, setRole] = useState<'RECEPTIONIST' | 'STAFF' | 'PT'>('STAFF');

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ['manager-staff-list'],
    queryFn: () => getManagerStaff(),
  });

  const createStaffMutation = useMutation({
    mutationFn: () =>
      createManagerStaff({
        fullName,
        phone,
        email,
        gender,
        role,
      }),
    onSuccess: (res) => {
      setSuccessMsg(res.message);
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['manager-staff-list'] });
      setTimeout(() => {
        handleCloseModal();
      }, 2500);
    },
    onError: (err) => setError(apiErrorMessage(err, 'Không thể tạo nhân sự')),
  });

  function handleCloseModal() {
    setIsAddModalOpen(false);
    setError(null);
    setSuccessMsg(null);
    setFullName('');
    setPhone('');
    setEmail('');
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">Quản lý Nhân sự chi nhánh</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Danh sách Lễ tân, Thu ngân (Staff) và Huấn luyện viên (PT) thuộc chi nhánh
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)} className="self-start sm:self-auto shrink-0 flex items-center gap-2">
          <UserPlus size={18} />
          <span>+ Thêm nhân sự mới</span>
        </Button>
      </div>

      <Callout tone="warning">
        <strong>Quy tắc Quota SaaS:</strong> Tài khoản Manager, Staff và PT sẽ được tính riêng vào quota hạn ngạch nhân sự của gói SaaS. Tài khoản hội viên và khách lẻ được tính vào quota riêng dành cho Customer.
      </Callout>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-base font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <UserGear size={20} className="text-emerald-600 dark:text-emerald-400" /> Đội ngũ Nhân sự ({staff.length})
          </h2>
        </div>

        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <>
            {/* Mobile Card List View (< 768px) */}
            <div className="block md:hidden space-y-3">
              {staff.length > 0 ? (
                staff.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 shadow-xs flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                          {s.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-zinc-100 text-sm">{s.full_name}</p>
                          <p className="text-xs text-slate-500 dark:text-zinc-400">{s.phone || 'Chưa có SĐT'}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        {s.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-zinc-400 truncate">
                      <strong>Email:</strong> {s.email || 'N/A'}
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      <span className="text-[11px] font-semibold text-slate-500">Vai trò:</span>
                      {s.roles.map((r: string) => (
                        <span key={r} className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 dark:bg-zinc-800 dark:text-zinc-200">
                          {r === 'PT' ? 'Huấn luyện viên (PT)' : r === 'STAFF' ? 'Lễ tân / Thu ngân' : r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-xs text-zinc-400">
                  Chưa có nhân sự nào trong chi nhánh.
                </div>
              )}
            </div>

            {/* Desktop Table View (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-600 dark:text-zinc-300 min-w-[650px]">
                <thead className="bg-stone-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <tr>
                    <th className="px-4 py-3">Họ và tên</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Số điện thoại</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-zinc-800">
                  {staff.length > 0 ? (
                    staff.map((s: any) => (
                      <tr key={s.id} className="hover:bg-stone-50/50 dark:hover:bg-zinc-800/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                            {s.full_name.charAt(0).toUpperCase()}
                          </div>
                          <span>{s.full_name}</span>
                        </td>
                        <td className="px-4 py-3">{s.email || 'N/A'}</td>
                        <td className="px-4 py-3">{s.phone || 'Chưa có SĐT'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {s.roles.map((r: string) => (
                              <span key={r} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                {r === 'PT' ? 'Huấn luyện viên (PT)' : r === 'STAFF' ? 'Lễ tân / Thu ngân' : r}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold dark:text-emerald-400">
                            <ShieldCheck size={14} /> {s.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-xs text-zinc-400">
                        Chưa có nhân sự nào gán vào chi nhánh này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Modal Tạo tài khoản nhân sự mới (High-end 2-Column Responsive Layout) */}
      <Modal open={isAddModalOpen} onClose={handleCloseModal} title="Cấp tài khoản nhân sự chi nhánh">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createStaffMutation.mutate();
          }}
          className="flex flex-col gap-4.5"
        >
          {successMsg && (
            <div className="rounded-xl bg-emerald-50 p-3.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
              {successMsg}
            </div>
          )}

          {/* Selector Card chọn Vai trò (Lễ tân vs PT) - Chiều cao h-[68px] đồng bộ */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Chọn chức danh / vai trò *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('STAFF')}
                className={`h-[68px] p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  role === 'STAFF'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🏢 Lễ tân / Thu ngân
                  </span>
                  {role === 'STAFF' && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  Quản lý check-in & tiếp quầy
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRole('PT')}
                className={`h-[68px] p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                  role === 'PT'
                    ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 dark:border-emerald-500 ring-1 ring-emerald-500/50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/60 dark:border-zinc-800 dark:bg-zinc-800/40 dark:hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                    🏋️ Huấn luyện viên (PT)
                  </span>
                  {role === 'PT' && (
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  )}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                  Dạy 1-on-1 & quản lý lịch tập
                </span>
              </button>
            </div>
          </div>

          {/* Lưới 2 cột điền Thông tin cá nhân - Nhãn 1 dòng ngắn gọn & Input h-11 chuẩn tuyệt đối */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Họ và tên *" htmlFor="staff-fullname">
              <input
                id="staff-fullname"
                required
                className={`${inputClass} h-11 py-0 rounded-xl`}
                placeholder="VD: Trần Thị Mai"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </FormField>

            <FormField label="Email đăng nhập *" htmlFor="staff-email">
              <input
                id="staff-email"
                type="email"
                required
                className={`${inputClass} h-11 py-0 rounded-xl`}
                placeholder="letan.mai@gym.vn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>

            <FormField label="Số điện thoại" htmlFor="staff-phone">
              <input
                id="staff-phone"
                className={`${inputClass} h-11 py-0 rounded-xl`}
                placeholder="VD: 0987654321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </FormField>

            <FormField label="Giới tính" htmlFor="staff-gender">
              <select
                id="staff-gender"
                className={`${inputClass} h-11 py-0 rounded-xl`}
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="MALE">Nam</option>
                <option value="FEMALE">Nữ</option>
                <option value="OTHER">Khác</option>
              </select>
            </FormField>
          </div>

          {/* Banner thông báo bảo mật gửi mật khẩu qua Email */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3 text-xs text-slate-600 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-300 flex items-start gap-2">
            <span className="text-base shrink-0">📩</span>
            <div className="leading-snug">
              <strong className="text-slate-900 dark:text-zinc-100">Bảo mật tài khoản:</strong> Mật khẩu ngẫu nhiên được hệ thống tự động tạo và gửi tới email đăng nhập. Nhân sự đổi mật khẩu trong lần đăng nhập đầu tiên.
            </div>
          </div>

          {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}

          <div className="flex justify-end gap-2 mt-1">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Hủy
            </Button>
            <Button type="submit" disabled={createStaffMutation.isPending}>
              {createStaffMutation.isPending ? 'Đang khởi tạo...' : 'Xác nhận tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
