import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CaretDown, CaretRight, ClipboardText } from '@phosphor-icons/react';
import { listAuditLogs, type AuditLogEntry } from '../api/auditLogs';
import { inputClass } from '../components/FormField';
import Card from '../components/Card';
import EmptyState from '../components/EmptyState';
import { SkeletonRow } from '../components/Skeleton';
import Button from '../components/Button';

const ENTITY_TYPES = ['', 'TENANT', 'SAAS_PLAN', 'SUBSCRIPTION', 'USER'];
const COLUMN_COUNT = 6;

function DiffBlock({ label, data }: { label: string; data: unknown }) {
  if (data === null || data === undefined) {
    return (
      <div>
        <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">{label}</p>
        <p className="mt-1 text-xs text-zinc-400">—</p>
      </div>
    );
  }
  return (
    <div>
      <p className="text-[11px] font-semibold tracking-wide text-zinc-400 uppercase">{label}</p>
      <pre className="font-mono mt-1 max-h-48 overflow-auto rounded-lg bg-zinc-100 p-2.5 text-xs text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
}

function AuditRow({ entry }: { entry: AuditLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDiff = entry.before_data != null || entry.after_data != null;

  return (
    <>
      <tr
        className={`transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-900/60 ${hasDiff ? 'cursor-pointer' : ''}`}
        onClick={() => hasDiff && setExpanded((e) => !e)}
      >
        <td className="px-4 py-3.5">
          {hasDiff ? (
            expanded ? (
              <CaretDown size={14} className="text-zinc-400" />
            ) : (
              <CaretRight size={14} className="text-zinc-400" />
            )
          ) : null}
        </td>
        <td className="px-4 py-3.5 whitespace-nowrap text-zinc-500">
          {new Date(entry.occurred_at).toLocaleString('vi-VN')}
        </td>
        <td className="px-4 py-3.5 font-medium text-zinc-900 dark:text-zinc-50">{entry.action}</td>
        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">
          {entry.entity_type}
          {entry.entity_id && (
            <span className="font-mono block text-xs text-zinc-400">{entry.entity_id.slice(0, 8)}</span>
          )}
        </td>
        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{entry.actor_role ?? '-'}</td>
        <td className="px-4 py-3.5 text-zinc-600 dark:text-zinc-400">{entry.reason ?? '-'}</td>
      </tr>
      {expanded && hasDiff && (
        <tr className="bg-zinc-50/60 dark:bg-zinc-950/40">
          <td colSpan={COLUMN_COUNT} className="px-4 py-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DiffBlock label="Trước" data={entry.before_data} />
              <DiffBlock label="Sau" data={entry.after_data} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export default function AuditLogsPage() {
  const [entityType, setEntityType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs-all', entityType, page],
    queryFn: () => listAuditLogs({ entityType: entityType || undefined, page, pageSize: 25 }),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Audit Log
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Toàn bộ thay đổi cấp nền tảng: Tenant, SaaS Plan, Subscription, truy cập hỗ trợ. Nhấn một dòng có mũi tên
          để xem chi tiết trước/sau.
        </p>
      </div>

      <select
        className={`${inputClass} w-56`}
        value={entityType}
        onChange={(e) => {
          setEntityType(e.target.value);
          setPage(1);
        }}
      >
        {ENTITY_TYPES.map((type) => (
          <option key={type} value={type}>
            {type || 'Tất cả loại đối tượng'}
          </option>
        ))}
      </select>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-50 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
            <tr>
              <th className="w-8 px-4 py-3.5" />
              <th className="px-4 py-3.5 font-medium">Thời gian</th>
              <th className="px-4 py-3.5 font-medium">Hành động</th>
              <th className="px-4 py-3.5 font-medium">Đối tượng</th>
              <th className="px-4 py-3.5 font-medium">Người thực hiện</th>
              <th className="px-4 py-3.5 font-medium">Lý do</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading &&
              Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} columns={COLUMN_COUNT} />)}
            {!isLoading && data?.items.length === 0 && (
              <tr>
                <td colSpan={COLUMN_COUNT}>
                  <EmptyState icon={ClipboardText} title="Chưa có bản ghi audit log nào" />
                </td>
              </tr>
            )}
            {data?.items.map((entry) => <AuditRow key={entry.id} entry={entry} />)}
          </tbody>
        </table>
      </Card>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-zinc-500">
          <span>
            Trang {data.page}/{data.totalPages} • {data.total} bản ghi
          </span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Trước
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
