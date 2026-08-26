import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { listTenants } from '../api/tenants';
import StatusBadge from './StatusBadge';

/**
 * Real (not decorative) global search: filters actual tenants via the same
 * listTenants endpoint the Tenants page uses, and navigates to the tenant
 * detail page on selection. Opened via the topbar button or Ctrl/Cmd+K
 * (the keydown listener lives in AdminLayout, which owns `open`/`onClose`).
 */
export default function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data, isFetching } = useQuery({
    queryKey: ['command-palette-tenants', query],
    queryFn: () => listTenants({ search: query || undefined, page: 1, pageSize: 8 }),
    enabled: open,
  });

  if (!open) return null;

  function handleSelect(tenantId: string) {
    navigate(`/admin/tenants/${tenantId}`);
    onClose();
    setQuery('');
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-zinc-950/40 px-4 pt-[14vh] animate-[admin-backdrop-in_150ms_ease-out]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 animate-[admin-modal-in_150ms_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 border-b border-zinc-100 px-4 dark:border-zinc-800">
          <MagnifyingGlass size={18} className="shrink-0 text-zinc-400" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tenant theo tên, mã, email..."
            className="w-full bg-transparent py-3.5 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100"
          />
          <kbd className="shrink-0 rounded border border-zinc-200 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400 dark:border-zinc-700">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {isFetching && <p className="px-3 py-6 text-center text-sm text-zinc-400">Đang tìm...</p>}
          {!isFetching && (data?.items.length ?? 0) === 0 && (
            <p className="px-3 py-6 text-center text-sm text-zinc-400">
              {query ? 'Không tìm thấy tenant nào.' : 'Chưa có tenant nào trên nền tảng.'}
            </p>
          )}
          {!isFetching &&
            data?.items.map((tenant) => (
              <button
                key={tenant.id}
                type="button"
                onClick={() => handleSelect(tenant.id)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-zinc-900 dark:text-zinc-50">
                    {tenant.name}
                  </span>
                  <span className="font-mono block text-xs text-zinc-400">{tenant.code}</span>
                </span>
                <StatusBadge status={tenant.status} />
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
