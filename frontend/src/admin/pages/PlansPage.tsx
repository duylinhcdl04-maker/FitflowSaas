import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Sparkle,
  Gauge,
  ArrowsLeftRight,
  Package,
  CheckCircle,
  XCircle,
  Info,
} from '@phosphor-icons/react';
import {
  listPlans,
  listFeatures,
  getPlatformCatalog,
  createPlan,
  updatePlan,
  upsertPlanFeatures,
  createFeature,
  duplicatePlan,
  savePlanConfiguration,
  publishPlan,
  archivePlan,
  deletePlan,
  type Plan,
  type PlatformFeature,
  type PlatformCatalog,
  type CreatePlanPayload,
} from '../api/plans';
import PlanList from './plans/PlanList';
import PlanDetail from './plans/PlanDetail';
import FeatureListTab from './plans/FeatureListTab';
import LimitListTab from './plans/LimitListTab';
import FeatureMatrixTab from './plans/FeatureMatrixTab';
import CreatePlanDrawer from './plans/CreatePlanDrawer';
import CreateFeatureModal from './plans/CreateFeatureModal';
import CreateVersionModal from './plans/CreateVersionModal';
import TenantSubscribersModal from './plans/TenantSubscribersModal';
import type { PlanTab } from './plans/types';

export default function PlansPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<PlanTab>('plans');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  // Modals / Drawers state
  const [isCreatePlanOpen, setIsCreatePlanOpen] = useState(false);
  const [isCreateFeatureOpen, setIsCreateFeatureOpen] = useState(false);
  const [createFeatureType, setCreateFeatureType] = useState<'BOOLEAN' | 'QUOTA'>('BOOLEAN');
  const [isCreateVersionOpen, setIsCreateVersionOpen] = useState(false);
  const [isSubscribersOpen, setIsSubscribersOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Queries
  const { data: plans = [], isLoading: isPlansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: listPlans,
  });

  const { data: catalog, isLoading: isCatalogLoading } = useQuery({
    queryKey: ['platform-catalog'],
    queryFn: getPlatformCatalog,
  });

  const { data: features = [], isLoading: isFeaturesLoading } = useQuery({
    queryKey: ['features'],
    queryFn: listFeatures,
  });

  // Selected plan calculation
  const selectedPlan = useMemo(() => {
    if (!plans.length) return null;
    if (selectedPlanId) {
      const found = plans.find((p) => p.id === selectedPlanId);
      if (found) return found;
    }
    return plans[0];
  }, [plans, selectedPlanId]);

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: async (payload: {
      plan: CreatePlanPayload;
      features: { featureCode: string; isEnabled: boolean; quotaValue?: number | null }[];
    }) => {
      const created = await createPlan(payload.plan);
      if (payload.features.length > 0) {
        await upsertPlanFeatures(
          created.id,
          payload.features.map((f) => ({
            featureCode: f.featureCode,
            isEnabled: f.isEnabled,
            quotaValue: f.quotaValue ?? undefined,
          }))
        );
      }
      return created;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['platform-catalog'] });
      setSelectedPlanId(created.id);
      showToast(`Đã tạo thành công gói ${created.name}`);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể tạo gói', 'error');
    },
  });

  const savePlanConfigMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (!selectedPlan) return;
      return savePlanConfiguration(selectedPlan.id, payload);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['platform-catalog'] });
      showToast(`Đã lưu cấu hình 10 chiều thành công cho gói ${updated?.name || selectedPlan?.name}`);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể lưu cấu hình gói', 'error');
    },
  });

  const publishPlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return;
      return publishPlan(selectedPlan.id);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast(`Đã xuất bản (Publish) thành công gói ${updated.name}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Không thể xuất bản gói';
      const errors = err?.response?.data?.errors;
      showToast(errors ? `${msg}: ${errors.join('; ')}` : msg, 'error');
    },
  });

  const archivePlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return;
      return archivePlan(selectedPlan.id);
    },
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      showToast(`Đã lưu trữ (Archive) gói ${updated.name}`);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể lưu trữ gói', 'error');
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return;
      return deletePlan(selectedPlan.id);
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setSelectedPlanId(null);
      showToast(res.message || 'Đã xóa gói thành công');
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể xóa gói', 'error');
    },
  });

  const duplicatePlanMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPlan) return;
      return duplicatePlan(selectedPlan.id);
    },
    onSuccess: (newPlan) => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      setSelectedPlanId(newPlan.id);
      showToast(`Đã nhân bản thành công gói ${newPlan.name}`);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể nhân bản gói', 'error');
    },
  });

  const createFeatureMutation = useMutation({
    mutationFn: createFeature,
    onSuccess: (feat) => {
      queryClient.invalidateQueries({ queryKey: ['features'] });
      showToast(`Đã tạo thành công tính năng/định mức ${feat.name}`);
    },
    onError: (err: any) => {
      showToast(err?.response?.data?.message || 'Không thể tạo tính năng', 'error');
    },
  });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
      {/* Toast notification banner */}
      {toast && (
        <div
          className={`fixed right-6 top-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-lg backdrop-blur-md transition-all animate-in fade-in ${
            toast.type === 'success'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
              : 'border border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" weight="bold" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" weight="bold" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Page Header */}
      <div className="border-b border-zinc-200/80 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Package className="h-4.5 w-4.5" weight="bold" />
              </span>
              <h1 className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Gói & Tính năng
              </h1>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Quản lý các gói SaaS, quyền hạn tính năng, giới hạn định mức tài nguyên và ma trận so sánh.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => {
                setCreateFeatureType('BOOLEAN');
                setIsCreateFeatureOpen(true);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-2xs transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>+ Feature mới</span>
            </button>

            <button
              type="button"
              onClick={() => setIsCreatePlanOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-500 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" weight="bold" />
              <span>+ Gói mới</span>
            </button>
          </div>
        </div>

        {/* 4 Main Module Tabs */}
        <div className="mt-5 flex items-center gap-1 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'plans'
                ? 'bg-emerald-50 text-emerald-700 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Package className="h-4 w-4" weight={activeTab === 'plans' ? 'bold' : 'regular'} />
            <span>Gói ({plans.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('features')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'features'
                ? 'bg-emerald-50 text-emerald-700 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Sparkle className="h-4 w-4" weight={activeTab === 'features' ? 'bold' : 'regular'} />
            <span>Tính năng ({features.filter((f) => f.feature_type !== 'QUOTA').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('limits')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'limits'
                ? 'bg-emerald-50 text-emerald-700 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Gauge className="h-4 w-4" weight={activeTab === 'limits' ? 'bold' : 'regular'} />
            <span>Giới hạn ({features.filter((f) => f.feature_type === 'QUOTA').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition ${
              activeTab === 'matrix'
                ? 'bg-emerald-50 text-emerald-700 shadow-2xs dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <ArrowsLeftRight className="h-4 w-4" weight={activeTab === 'matrix' ? 'bold' : 'regular'} />
            <span>So sánh gói</span>
          </button>
        </div>
      </div>

      {/* Main Tab Views */}
      <div className="flex flex-1 overflow-hidden">
        {/* TAB 1: GÓI (2-Column Layout: Left Plan List, Right Plan Detail) */}
        {activeTab === 'plans' && (
          <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
            <PlanList
              plans={plans}
              selectedPlanId={selectedPlan?.id ?? null}
              onSelectPlan={(id) => setSelectedPlanId(id)}
              onCreateNewPlan={() => setIsCreatePlanOpen(true)}
              isLoading={isPlansLoading}
            />

            {selectedPlan && catalog ? (
              <PlanDetail
                key={selectedPlan.id}
                plan={selectedPlan}
                catalog={catalog}
                onSaveConfig={savePlanConfigMutation.mutateAsync}
                onPublish={publishPlanMutation.mutateAsync}
                onArchive={archivePlanMutation.mutateAsync}
                onDuplicate={() => duplicatePlanMutation.mutate()}
                onDelete={deletePlanMutation.mutateAsync}
                onViewSubscribers={() => setIsSubscribersOpen(true)}
                isSaving={savePlanConfigMutation.isPending}
              />
            ) : isCatalogLoading || isPlansLoading ? (
              <div className="flex flex-1 items-center justify-center p-12 text-center text-xs text-zinc-400">
                Đang tải cấu hình SaaS Plan...
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center p-12 text-center text-xs text-zinc-400">
                Chưa có gói cước nào được chọn.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: TÍNH NĂNG */}
        {activeTab === 'features' && (
          <FeatureListTab
            features={features}
            plans={plans}
            onCreateFeature={() => {
              setCreateFeatureType('BOOLEAN');
              setIsCreateFeatureOpen(true);
            }}
            isLoading={isFeaturesLoading}
          />
        )}

        {/* TAB 3: GIỚI HẠN */}
        {activeTab === 'limits' && (
          <LimitListTab
            features={features}
            plans={plans}
            onCreateLimit={() => {
              setCreateFeatureType('QUOTA');
              setIsCreateFeatureOpen(true);
            }}
            isLoading={isFeaturesLoading}
          />
        )}

        {/* TAB 4: SO SÁNH GÓI */}
        {activeTab === 'matrix' && (
          <FeatureMatrixTab
            plans={plans}
            features={features}
            onSelectPlan={(id) => {
              setSelectedPlanId(id);
              setActiveTab('plans');
            }}
            isLoading={isPlansLoading || isFeaturesLoading}
          />
        )}
      </div>

      {/* Drawers and Modals */}
      <CreatePlanDrawer
        allFeatures={features}
        isOpen={isCreatePlanOpen}
        onClose={() => setIsCreatePlanOpen(false)}
        onSubmit={createPlanMutation.mutateAsync}
        isSubmitting={createPlanMutation.isPending}
      />

      <CreateFeatureModal
        isOpen={isCreateFeatureOpen}
        onClose={() => setIsCreateFeatureOpen(false)}
        onSubmit={createFeatureMutation.mutateAsync}
        isSubmitting={createFeatureMutation.isPending}
        initialType={createFeatureType}
      />

      {selectedPlan && (
        <>
          <CreateVersionModal
            plan={selectedPlan}
            isOpen={isCreateVersionOpen}
            onClose={() => setIsCreateVersionOpen(false)}
            onSubmit={async (vData) => {
              showToast(`Đã tạo thành công phiên bản ${vData.versionName} cho gói ${selectedPlan.name}`);
            }}
          />

          <TenantSubscribersModal
            plan={selectedPlan}
            isOpen={isSubscribersOpen}
            onClose={() => setIsSubscribersOpen(false)}
          />
        </>
      )}
    </div>
  );
}
