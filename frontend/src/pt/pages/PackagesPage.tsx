import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Barbell,
  PlusCircle,
} from '@phosphor-icons/react';
import { getPtPackages, createPtPackagePlan } from '../api/pt';

export default function PtPackagesPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sessionCount, setSessionCount] = useState<number>(10);
  const [price, setPrice] = useState<number>(3000000);
  const [validityDays, setValidityDays] = useState<number>(60);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(60);

  const { data: packagesList, isLoading, isError } = useQuery({
    queryKey: ['pt-packages'],
    queryFn: getPtPackages,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createPtPackagePlan({
        name,
        description,
        sessionCount,
        price,
        validityDays,
        sessionDurationMinutes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pt-packages'] });
      setCreateModalOpen(false);
      setName('');
      setDescription('');
    },
  });

  return (
    <div className="space-y-6">
      {/* Header & New Package Action */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Barbell className="h-6 w-6 text-emerald-600 dark:text-emerald-400" /> Gói Huấn Luyện PT & Niêm Yết Giá
          </h1>
          <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium">
            Cấu hình danh mục gói tập PT cá nhân và gửi yêu cầu phê duyệt giá tới Owner/Manager.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition active:scale-95 self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Đề Xuất Gói PT Mới</span>
        </button>
      </div>

      {/* Packages Grid */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600 dark:border-zinc-800 dark:border-t-emerald-400" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          Không thể tải danh sách gói PT.
        </div>
      ) : !packagesList || packagesList.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 dark:border-zinc-800 dark:bg-zinc-900">
          <Barbell className="mx-auto h-12 w-12 text-slate-300 dark:text-zinc-700" />
          <p className="mt-2 text-sm font-semibold">Chưa có gói huấn luyện cá nhân nào được tạo</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packagesList.map((pkg) => {
            const formattedPrice = Number(pkg.price).toLocaleString('vi-VN');

            return (
              <div
                key={pkg.id}
                className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between hover:border-emerald-300 transition"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-slate-900 dark:text-white">
                      {pkg.name}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        pkg.status === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : pkg.status === 'PENDING_APPROVAL'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300'
                      }`}
                    >
                      {pkg.status === 'ACTIVE'
                        ? 'Đã duyệt (Active)'
                        : pkg.status === 'PENDING_APPROVAL'
                        ? 'Chờ duyệt'
                        : 'Bản nháp'}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                    {pkg.description || 'Gói tập huấn luyện cá nhân 1:1'}
                  </p>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-zinc-800/60 border border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Số buổi tập:</span>
                      <span className="font-mono font-black text-slate-900 dark:text-white">{pkg.session_count} buổi</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Giá niêm yết:</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{formattedPrice} VNĐ</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 dark:text-zinc-400">Thời hạn sử dụng:</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{pkg.validity_days || 60} ngày</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Package Plan Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-emerald-600" /> Tạo Đề Xuất Gói PT Mới
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Gửi đề xuất cấu hình gói huấn luyện cá nhân tới Owner/Manager để kiểm duyệt.
            </p>

            <div className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300">Tên gói PT *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: PT Transformation 20 Buổi"
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Số buổi tập *</label>
                  <input
                    type="number"
                    value={sessionCount}
                    onChange={(e) => setSessionCount(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Giá (VNĐ) *</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Thời lượng / Buổi *</label>
                  <select
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value={30}>30 Phút</option>
                    <option value={45}>45 Phút</option>
                    <option value={60}>60 Phút (Tiêu chuẩn)</option>
                    <option value={75}>75 Phút</option>
                    <option value={90}>90 Phút</option>
                    <option value={120}>120 Phút (2 Tiếng)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-zinc-300">Hạn sử dụng (Ngày) *</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={(e) => setValidityDays(Number(e.target.value))}
                    placeholder="Ví dụ: 60 ngày"
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-zinc-300">Mô tả gói tập</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả mục tiêu và quyền lợi của học viên..."
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-slate-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-zinc-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!name || createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Đang gửi...' : 'Gửi Phê Duyệt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
