import { useState, useEffect } from 'react';
import {
  Info,
  CurrencyDollar,
  Sparkle,
  Gauge,
  Plug,
  Package,
  HourglassSimple,
  Lifebuoy,
  Eye,
  ShieldCheck,
  FloppyDisk,
  Users,
  ArrowRight,
  ArrowLeft,
} from '@phosphor-icons/react';
import type {
  Plan,
  PlatformCatalog,
  PlanPrice,
} from '../../api/plans';
import { PLAN_10_DIMENSIONS, type PlanSection } from './types';
import BasicSection from './sections/BasicSection';
import PricingSection from './sections/PricingSection';
import FeaturesSection from './sections/FeaturesSection';
import QuotasSection, { type QuotaFormItem } from './sections/QuotasSection';
import IntegrationsSection from './sections/IntegrationsSection';
import AddonsSection from './sections/AddonsSection';
import TrialSection from './sections/TrialSection';
import SupportSection from './sections/SupportSection';
import DisplaySection from './sections/DisplaySection';
import ReviewSection from './sections/ReviewSection';

interface PlanDetailProps {
  plan: Plan;
  catalog: PlatformCatalog;
  onSaveConfig: (payload: any) => Promise<void>;
  onPublish: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDuplicate: () => void;
  onDelete: () => Promise<void>;
  onViewSubscribers: () => void;
  isSaving?: boolean;
}

const SECTION_KEYS: PlanSection[] = [
  'basic',
  'pricing',
  'features',
  'quotas',
  'integrations',
  'addons',
  'trial',
  'support',
  'display',
  'review',
];

const SECTION_SHORT_LABELS: Record<PlanSection, string> = {
  basic: '1. Cơ bản',
  pricing: '2. Bảng giá',
  features: '3. Tính năng',
  quotas: '4. Định mức',
  integrations: '5. Tích hợp',
  addons: '6. Add-ons',
  trial: '7. Dùng thử',
  support: '8. Hỗ trợ SLA',
  display: '9. Hiển thị',
  review: '10. Xác nhận',
};

export default function PlanDetail({
  plan,
  catalog,
  onSaveConfig,
  onPublish,
  onArchive,
  onDuplicate,
  onDelete,
  onViewSubscribers,
  isSaving = false,
}: PlanDetailProps) {
  const [activeSection, setActiveSection] = useState<PlanSection>('basic');

  // Dimension 1: Basic Information
  const [name, setName] = useState(plan.name);
  const [code, setCode] = useState(plan.code);
  const [slogan, setSlogan] = useState(plan.slogan || '');
  const [targetAudience, setTargetAudience] = useState(plan.target_audience || '');
  const [description, setDescription] = useState(plan.description || '');

  // Dimension 2: Pricing & Billing
  const [price, setPrice] = useState(Number(plan.price) || 0);
  const [currency, setCurrency] = useState(plan.currency || 'VND');
  const [prices, setPrices] = useState<PlanPrice[]>(() => {
    if (plan.plan_prices && plan.plan_prices.length > 0) {
      return plan.plan_prices;
    }
    return [
      { billing_cycle: 'MONTHLY', billing_cycle_months: 1, price: Number(plan.price) || 0, currency: plan.currency || 'VND', discount_percentage: 0, is_active: true },
      { billing_cycle: 'QUARTERLY', billing_cycle_months: 3, price: (Number(plan.price) || 0) * 3 * 0.95, currency: plan.currency || 'VND', discount_percentage: 5, is_active: true },
      { billing_cycle: 'YEARLY', billing_cycle_months: 12, price: (Number(plan.price) || 0) * 12 * 0.85, currency: plan.currency || 'VND', discount_percentage: 15, is_active: true },
    ];
  });

  // Dimension 3: Features
  const [featureValues, setFeatureValues] = useState<
    Record<string, { isEnabled: boolean; featureId: string }>
  >(() => {
    const map: Record<string, { isEnabled: boolean; featureId: string }> = {};
    const existingMap = new Map(plan.saas_plan_features?.map((f) => [f.platform_features?.code, f]) ?? []);

    for (const f of catalog.features) {
      const existing = existingMap.get(f.code);
      map[f.code] = {
        isEnabled: existing ? existing.is_enabled : false,
        featureId: f.id,
      };
    }
    return map;
  });

  // Dimension 4: Resource Quotas
  const [quotaValues, setQuotaValues] = useState<Record<string, QuotaFormItem>>(() => {
    const map: Record<string, QuotaFormItem> = {};
    const existingMap = new Map(plan.plan_quotas?.map((q) => [q.platform_quotas?.code, q]) ?? []);

    for (const q of catalog.quotas) {
      const existing = existingMap.get(q.code);
      map[q.code] = {
        quotaId: q.id,
        mode: existing ? existing.mode : 'LIMITED',
        quotaValue: existing ? existing.quota_value : 100,
      };
    }
    return map;
  });

  // Dimension 5: Integrations
  const [integrationValues, setIntegrationValues] = useState<
    Record<string, { isEnabled: boolean; integrationId: string; configOptions?: any }>
  >(() => {
    const map: Record<string, { isEnabled: boolean; integrationId: string; configOptions?: any }> = {};
    const existingMap = new Map(plan.plan_integrations?.map((i) => [i.platform_integrations?.code, i]) ?? []);

    for (const item of catalog.integrations) {
      const existing = existingMap.get(item.code);
      map[item.code] = {
        isEnabled: existing ? existing.is_enabled : false,
        integrationId: item.id,
        configOptions: existing?.config_options,
      };
    }
    return map;
  });

  // Dimension 7: Trial Policy
  const [trialDays, setTrialDays] = useState(plan.trial_days || 0);

  // Dimension 8: Support SLA
  const [supportTier, setSupportTier] = useState(plan.support_tier || 'STANDARD');

  // Dimension 9: Display & Hero
  const [isPopular, setIsPopular] = useState(plan.is_popular || false);
  const [badgeText, setBadgeText] = useState(plan.badge_text || '');
  const [displayOrder, setDisplayOrder] = useState(plan.display_order || 1);
  const [ctaText, setCtaText] = useState(plan.cta_text || 'Bắt đầu ngay');
  const [isPublic, setIsPublic] = useState(plan.is_public !== undefined ? plan.is_public : true);

  // Dimension 10: Status
  const [status, setStatus] = useState(plan.status || 'DRAFT');

  // Update when plan prop changes
  useEffect(() => {
    setName(plan.name);
    setCode(plan.code);
    setSlogan(plan.slogan || '');
    setTargetAudience(plan.target_audience || '');
    setDescription(plan.description || '');
    setPrice(Number(plan.price) || 0);
    setCurrency(plan.currency || 'VND');
    setTrialDays(plan.trial_days || 0);
    setSupportTier(plan.support_tier || 'STANDARD');
    setIsPopular(plan.is_popular || false);
    setBadgeText(plan.badge_text || '');
    setDisplayOrder(plan.display_order || 1);
    setCtaText(plan.cta_text || 'Bắt đầu ngay');
    setIsPublic(plan.is_public !== undefined ? plan.is_public : true);
    setStatus(plan.status || 'DRAFT');

    if (plan.plan_prices && plan.plan_prices.length > 0) {
      setPrices(plan.plan_prices);
    }
  }, [plan]);

  // Feature actions
  const handleToggleFeature = (fCode: string) => {
    setFeatureValues((prev) => ({
      ...prev,
      [fCode]: {
        ...prev[fCode],
        isEnabled: !prev[fCode]?.isEnabled,
      },
    }));
  };

  const handleEnableAllFeatures = (moduleCode?: string) => {
    setFeatureValues((prev) => {
      const next = { ...prev };
      for (const f of catalog.features) {
        if (!moduleCode || f.module === moduleCode) {
          if (next[f.code]) {
            next[f.code] = { ...next[f.code], isEnabled: true };
          }
        }
      }
      return next;
    });
  };

  const handleDisableAllFeatures = (moduleCode?: string) => {
    setFeatureValues((prev) => {
      const next = { ...prev };
      for (const f of catalog.features) {
        if (!moduleCode || f.module === moduleCode) {
          if (next[f.code]) {
            next[f.code] = { ...next[f.code], isEnabled: false };
          }
        }
      }
      return next;
    });
  };

  // Quota actions
  const handleUpdateQuota = (
    qCode: string,
    mode: 'LIMITED' | 'UNLIMITED' | 'DISABLED',
    value?: number | null,
  ) => {
    setQuotaValues((prev) => ({
      ...prev,
      [qCode]: {
        ...prev[qCode],
        mode,
        quotaValue: mode === 'LIMITED' ? (value !== undefined ? value : prev[qCode]?.quotaValue || 10) : null,
      },
    }));
  };

  // Integration actions
  const handleToggleIntegration = (iCode: string) => {
    setIntegrationValues((prev) => ({
      ...prev,
      [iCode]: {
        ...prev[iCode],
        isEnabled: !prev[iCode]?.isEnabled,
      },
    }));
  };

  // Save All Changes
  const handleSaveAll = async () => {
    const payload = {
      name,
      code,
      slogan,
      targetAudience,
      description,
      price,
      currency,
      prices: prices.map((p) => ({
        billingCycle: p.billing_cycle,
        billingCycleMonths: p.billing_cycle_months,
        price: Number(p.price),
        discountPercentage: Number(p.discount_percentage) || 0,
        isActive: p.is_active,
      })),
      features: Object.values(featureValues).map((f) => ({
        featureId: f.featureId,
        isEnabled: f.isEnabled,
      })),
      quotas: Object.values(quotaValues).map((q) => ({
        quotaId: q.quotaId,
        mode: q.mode,
        quotaValue: q.mode === 'LIMITED' ? q.quotaValue : null,
      })),
      integrations: Object.values(integrationValues).map((i) => ({
        integrationId: i.integrationId,
        isEnabled: i.isEnabled,
        configOptions: i.configOptions,
      })),
      trialDays,
      supportTier,
      isPopular,
      badgeText,
      displayOrder,
      ctaText,
      isPublic,
      status,
    };

    await onSaveConfig(payload);
  };

  const getDimensionIcon = (key: PlanSection) => {
    switch (key) {
      case 'basic':
        return <Info className="w-4 h-4" />;
      case 'pricing':
        return <CurrencyDollar className="w-4 h-4" />;
      case 'features':
        return <Sparkle className="w-4 h-4" />;
      case 'quotas':
        return <Gauge className="w-4 h-4" />;
      case 'integrations':
        return <Plug className="w-4 h-4" />;
      case 'addons':
        return <Package className="w-4 h-4" />;
      case 'trial':
        return <HourglassSimple className="w-4 h-4" />;
      case 'support':
        return <Lifebuoy className="w-4 h-4" />;
      case 'display':
        return <Eye className="w-4 h-4" />;
      case 'review':
        return <ShieldCheck className="w-4 h-4" />;
    }
  };

  const subscribersCount = plan._count?.subscriptions || 0;
  const currentSectionIndex = SECTION_KEYS.indexOf(activeSection);

  const goToPrevSection = () => {
    if (currentSectionIndex > 0) {
      setActiveSection(SECTION_KEYS[currentSectionIndex - 1]);
    }
  };

  const goToNextSection = () => {
    if (currentSectionIndex < SECTION_KEYS.length - 1) {
      setActiveSection(SECTION_KEYS[currentSectionIndex + 1]);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Top Header Bar */}
      <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">{name}</h2>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-semibold border border-zinc-200 dark:border-zinc-700">
                {code}
              </span>
              {isPopular && (
                <span className="bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  ★ HERO PLAN
                </span>
              )}
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  status === 'ACTIVE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40'
                    : status === 'ARCHIVED'
                    ? 'bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                    : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40'
                }`}
              >
                {status}
              </span>
            </div>
            {slogan && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1">{slogan}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onViewSubscribers}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 transition-colors"
          >
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{subscribersCount} Doanh nghiệp</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 active:scale-95"
          >
            <FloppyDisk className="w-4 h-4" weight="bold" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL 10-DIMENSION TAB STEPPER (Replaces cramped left sidebar!) */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50 px-4 py-2 overflow-x-auto shrink-0 scrollbar-none">
        <div className="flex items-center gap-1.5 min-w-max">
          {PLAN_10_DIMENSIONS.map((dim) => {
            const isActive = activeSection === dim.key;
            return (
              <button
                key={dim.key}
                type="button"
                onClick={() => setActiveSection(dim.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none border ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-1 ring-emerald-600/20'
                    : 'bg-white dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-zinc-400 dark:text-zinc-500'}>
                  {getDimensionIcon(dim.key)}
                </span>
                <span>{SECTION_SHORT_LABELS[dim.key] || dim.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace (Full-Width Studio Editor) */}
      <main className="flex-1 overflow-y-auto p-6 bg-zinc-50/40 dark:bg-zinc-950/40">
        <div className="max-w-5xl mx-auto space-y-6 pb-12">
          {activeSection === 'basic' && (
            <BasicSection
              name={name}
              setName={setName}
              code={code}
              setCode={setCode}
              slogan={slogan}
              setSlogan={setSlogan}
              targetAudience={targetAudience}
              setTargetAudience={setTargetAudience}
              description={description}
              setDescription={setDescription}
              status={status}
            />
          )}

          {activeSection === 'pricing' && (
            <PricingSection
              price={price}
              setPrice={setPrice}
              currency={currency}
              setCurrency={setCurrency}
              prices={prices}
              setPrices={setPrices}
            />
          )}

          {activeSection === 'features' && (
            <FeaturesSection
              features={catalog.features}
              featureValues={featureValues}
              onToggleFeature={handleToggleFeature}
              onEnableAll={handleEnableAllFeatures}
              onDisableAll={handleDisableAllFeatures}
            />
          )}

          {activeSection === 'quotas' && (
            <QuotasSection
              quotas={catalog.quotas}
              quotaValues={quotaValues}
              onUpdateQuota={handleUpdateQuota}
            />
          )}

          {activeSection === 'integrations' && (
            <IntegrationsSection
              integrations={catalog.integrations}
              integrationValues={integrationValues}
              onToggleIntegration={handleToggleIntegration}
            />
          )}

          {activeSection === 'addons' && (
            <AddonsSection
              plan={plan}
              addons={catalog.addons || []}
            />
          )}

          {activeSection === 'trial' && (
            <TrialSection
              trialDays={trialDays}
              setTrialDays={setTrialDays}
            />
          )}

          {activeSection === 'support' && (
            <SupportSection
              supportTier={supportTier}
              setSupportTier={setSupportTier}
            />
          )}

          {activeSection === 'display' && (
            <DisplaySection
              isPopular={isPopular}
              setIsPopular={setIsPopular}
              badgeText={badgeText}
              setBadgeText={setBadgeText}
              displayOrder={displayOrder}
              setDisplayOrder={setDisplayOrder}
              ctaText={ctaText}
              setCtaText={setCtaText}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
            />
          )}

          {activeSection === 'review' && (
            <ReviewSection
              planId={plan.id}
              planName={name}
              status={status}
              setStatus={setStatus}
              onPublish={onPublish}
              onArchive={onArchive}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onSaveAll={handleSaveAll}
              isSaving={isSaving}
            />
          )}

          {/* Sticky Bottom Navigation Bar between Tabs */}
          <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-8">
            <button
              type="button"
              onClick={goToPrevSection}
              disabled={currentSectionIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>
                {currentSectionIndex > 0 ? SECTION_SHORT_LABELS[SECTION_KEYS[currentSectionIndex - 1]] : 'Đầu danh sách'}
              </span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                Bước {currentSectionIndex + 1} / 10
              </span>
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
              >
                <FloppyDisk size={14} weight="bold" />
                <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={goToNextSection}
              disabled={currentSectionIndex === SECTION_KEYS.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <span>
                {currentSectionIndex < SECTION_KEYS.length - 1 ? SECTION_SHORT_LABELS[SECTION_KEYS[currentSectionIndex + 1]] : 'Hoàn tất'}
              </span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
