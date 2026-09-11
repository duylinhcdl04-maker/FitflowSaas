import {
  Sparkle,
  Check,
  Broadcast,
} from '@phosphor-icons/react';
import type { PlatformFeature } from '../../../api/plans';
import { FEATURE_MODULE_GROUPS } from '../types';

interface FeaturesSectionProps {
  features: PlatformFeature[];
  featureValues: Record<string, { isEnabled: boolean; featureId: string }>;
  onToggleFeature: (code: string) => void;
  onEnableAll: (moduleCode?: string) => void;
  onDisableAll: (moduleCode?: string) => void;
}

export default function FeaturesSection({
  features,
  featureValues,
  onToggleFeature,
  onEnableAll,
  onDisableAll,
}: FeaturesSectionProps) {
  // Count total enabled
  const enabledCount = Object.values(featureValues).filter((v) => v.isEnabled).length;

  return (
    <div className="space-y-6">
      <div className="bg-purple-50/70 border border-purple-200/80 dark:bg-purple-950/20 dark:border-purple-800/40 rounded-2xl p-4 flex items-start gap-3">
        <Sparkle className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" weight="fill" />
        <div className="text-sm text-purple-900 dark:text-purple-200">
          <p className="font-bold">Dimension 3: Tính năng hệ thống (Features Matrix)</p>
          <p className="mt-0.5 text-xs text-purple-700/80 dark:text-purple-300/80">
            Cấu hình 15 tính năng phân loại theo 6 module chức năng. Đang kích hoạt:{' '}
            <span className="font-bold text-purple-950 dark:text-purple-100">
              {enabledCount} / {features.length}
            </span>{' '}
            tính năng.
          </p>
        </div>
      </div>

      {/* Realtime Core Infrastructure Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Broadcast className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                WebSocket & SSE Realtime Stream
              </h4>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                CORE PLATFORM INFRASTRUCTURE
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Hạ tầng đồng bộ thời gian thực cho check-in quầy, thông báo và trạng thái cửa. Luôn sẵn sàng cho mọi gói và không bị giới hạn.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
          <Check className="w-3.5 h-3.5" weight="bold" />
          <span>Luôn Bật</span>
        </div>
      </div>

      {/* 6 Feature Modules */}
      <div className="space-y-5">
        {FEATURE_MODULE_GROUPS.map((group) => {
          const moduleFeatures = features.filter((f) => f.module === group.code);
          if (moduleFeatures.length === 0) return null;

          const moduleEnabledCount = moduleFeatures.filter(
            (f) => featureValues[f.code]?.isEnabled,
          ).length;

          return (
            <div
              key={group.code}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                    <span>{group.name}</span>
                    <span className="text-xs font-medium text-zinc-400">
                      ({moduleEnabledCount} / {moduleFeatures.length} kích hoạt)
                    </span>
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{group.desc}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onEnableAll(group.code)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 transition-colors"
                  >
                    Bật tất cả
                  </button>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <button
                    type="button"
                    onClick={() => onDisableAll(group.code)}
                    className="text-xs text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 transition-colors"
                  >
                    Tắt tất cả
                  </button>
                </div>
              </div>

              {/* 2-column wide layout prevents text cramped wrapping! */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {moduleFeatures.map((f) => {
                  const isEnabled = featureValues[f.code]?.isEnabled ?? false;

                  return (
                    <div
                      key={f.code}
                      onClick={() => onToggleFeature(f.code)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                        isEnabled
                          ? 'border-purple-500 bg-purple-50/40 text-purple-950 dark:border-purple-500/60 dark:bg-purple-950/20 dark:text-purple-100 ring-1 ring-purple-500/20 shadow-xs'
                          : 'border-zinc-200/80 bg-zinc-50/50 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-850/40 dark:hover:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isEnabled
                            ? 'bg-purple-600 text-white'
                            : 'bg-white border border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700 text-transparent'
                        }`}
                      >
                        {isEnabled && <Check className="w-3.5 h-3.5" weight="bold" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-xs font-bold leading-snug ${isEnabled ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            {f.name}
                          </p>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 font-medium">
                            {f.code}
                          </span>
                        </div>
                        {f.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {f.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
