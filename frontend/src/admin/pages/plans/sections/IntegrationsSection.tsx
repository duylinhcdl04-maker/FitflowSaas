import {
  Plug,
  Code,
  WebhooksLogo as WebhookIcon,
  ChatCircleText,
  CreditCard,
  Receipt,
  UsersThree,
  PuzzlePiece,
  Check,
} from '@phosphor-icons/react';
import type { PlatformIntegration } from '../../../api/plans';

interface IntegrationsSectionProps {
  integrations: PlatformIntegration[];
  integrationValues: Record<string, { isEnabled: boolean; integrationId: string; configOptions?: any }>;
  onToggleIntegration: (code: string) => void;
}

export default function IntegrationsSection({
  integrations,
  integrationValues,
  onToggleIntegration,
}: IntegrationsSectionProps) {
  const getIcon = (code: string) => {
    switch (code) {
      case 'OPEN_API':
        return <Code className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'WEBHOOK':
        return <WebhookIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'ZALO':
        return <ChatCircleText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'PAYMENT_GATEWAY':
        return <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'ACCOUNTING':
        return <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'CRM':
        return <UsersThree className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'CUSTOM_INTEGRATION':
      default:
        return <PuzzlePiece className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    }
  };

  const enabledCount = Object.values(integrationValues).filter((v) => v.isEnabled).length;

  return (
    <div className="space-y-6">
      <div className="bg-indigo-50/70 border border-indigo-200/80 dark:bg-indigo-950/20 dark:border-indigo-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Plug className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" weight="bold" />
        <div className="text-sm text-indigo-900 dark:text-indigo-200">
          <p className="font-bold">Dimension 5: Cổng kết nối tích hợp (System Integrations)</p>
          <p className="mt-0.5 text-xs text-indigo-700/80 dark:text-indigo-300/80">
            Open API & Webhook được quản lý nghiêm ngặt tại đây dưới dạng cổng kết nối đối tác cao cấp (không phải boolean feature thông thường). Đang mở khóa:{' '}
            <span className="font-bold">
              {enabledCount} / {integrations.length}
            </span>{' '}
            cổng kết nối.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((i) => {
          const isEnabled = integrationValues[i.code]?.isEnabled ?? false;

          return (
            <div
              key={i.code}
              onClick={() => onToggleIntegration(i.code)}
              className={`p-5 rounded-2xl border cursor-pointer select-none transition-all flex items-start gap-4 shadow-xs ${
                isEnabled
                  ? 'border-indigo-500 bg-indigo-50/30 dark:border-indigo-500/60 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20'
                  : 'border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900 hover:border-zinc-300'
              }`}
            >
              <div className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700 shrink-0">
                {getIcon(i.code)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{i.name}</h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isEnabled
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                        : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {isEnabled ? <Check className="w-3 h-3" weight="bold" /> : null}
                    {isEnabled ? 'Mở Khóa' : 'Đang Khóa'}
                  </span>
                </div>

                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                  {i.description}
                </p>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
                    {i.code}
                  </span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    Phân loại: {i.category}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
