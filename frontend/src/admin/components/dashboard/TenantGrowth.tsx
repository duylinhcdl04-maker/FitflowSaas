import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Buildings, ArrowUpRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import type { TenantGrowthPoint } from '../../types/dashboard';

interface TenantGrowthProps {
  data: TenantGrowthPoint[];
  isLoading?: boolean;
}

export default function TenantGrowth({ data, isLoading }: TenantGrowthProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col justify-between rounded-xl border border-zinc-200 bg-white p-5 shadow-2xs dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Tăng trưởng Tenant
            </h2>
            <span className="flex h-5 items-center rounded-full bg-emerald-50 px-2 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              +25 Net
            </span>
          </div>
          <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            Tương quan Tenant mới gia nhập và Tenant ngưng sử dụng
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/admin/tenants')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
        >
          <span>Quản lý Tenant</span>
          <ArrowUpRight size={13} />
        </button>
      </div>

      <div className="mt-4 h-64 w-full">
        {isLoading ? (
          <div className="flex h-full w-full items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-950/40">
            <span className="text-xs text-zinc-400">Đang nạp dữ liệu tăng trưởng...</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e4e4e7"
                className="dark:stroke-zinc-800/80"
              />
              <XAxis
                dataKey="month"
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as TenantGrowthPoint;
                    return (
                      <div className="rounded-lg border border-zinc-200 bg-white/95 p-3 shadow-lg backdrop-blur-xs dark:border-zinc-800 dark:bg-zinc-900/95">
                        <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                          Tháng: {label}
                        </p>
                        <div className="flex flex-col gap-1 text-xs">
                          <div className="flex items-center justify-between gap-4 text-emerald-600 dark:text-emerald-400">
                            <span>Tenant mới:</span>
                            <span className="font-mono font-bold">+{row.newTenants}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-rose-600 dark:text-rose-400">
                            <span>Tenant rời bỏ (Churn):</span>
                            <span className="font-mono font-bold">-{row.churnedTenants}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-1 font-semibold text-zinc-900 dark:border-zinc-800 dark:text-zinc-50">
                            <span>Tăng trưởng ròng (Net):</span>
                            <span className="font-mono">+{row.netGrowth}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: 11, paddingBottom: 8 }}
                formatter={(value) => {
                  if (value === 'newTenants') return 'Mới';
                  if (value === 'churnedTenants') return 'Rời bỏ';
                  return value;
                }}
              />
              <Bar dataKey="newTenants" name="newTenants" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="churnedTenants" name="churnedTenants" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
