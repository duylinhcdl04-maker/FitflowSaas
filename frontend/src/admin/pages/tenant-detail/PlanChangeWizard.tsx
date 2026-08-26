import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight } from '@phosphor-icons/react';
import { listPlans, type Plan } from '../../api/plans';
import { checkPlanChangeConflicts, updateSubscription, type SubscriptionRow } from '../../api/subscriptions';
import { apiErrorMessage } from '../../api/client';
import { monthsLabel } from '../../lib/billing';
import Modal from '../../components/Modal';
import Callout from '../../components/Callout';
import Button from '../../components/Button';

function formatMoney(amount: string | number, currency: string) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(Number(amount));
}

/**
 * SA-08 wizard. Step 2 (quota conflict check) only ever runs for a plan
 * *change*, and hard-blocks proceeding when the target plan has an explicit
 * quota the Tenant already exceeds (NT-4: show the real consequence before
 * acting) — matches the doc's "Chặn cứng, không cho ghi đè" call.
 */
export default function PlanChangeWizard({
  tenantId,
  currentSubscription,
  onClose,
}: {
  tenantId: string;
  currentSubscription: SubscriptionRow;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: plans } = useQuery({ queryKey: ['plans'], queryFn: listPlans });

  const conflictQuery = useQuery({
    queryKey: ['plan-change-check', tenantId, selectedPlan?.code],
    queryFn: () => checkPlanChangeConflicts(tenantId, selectedPlan!.code),
    enabled: step === 2 && Boolean(selectedPlan),
  });

  const applyMutation = useMutation({
    mutationFn: () => updateSubscription(tenantId, { planCode: selectedPlan!.code }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription', tenantId] });
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      onClose();
    },
    onError: (err) => setError(apiErrorMessage(err)),
  });

  const otherPlans = (plans ?? []).filter((p) => p.id !== currentSubscription.saas_plans.id);

  const footer =
    step === 1 ? (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Huỷ
        </Button>
        <Button variant="primary" disabled={!selectedPlan} onClick={() => setStep(2)}>
          Tiếp tục
        </Button>
      </div>
    ) : step === 2 ? (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setStep(1)}>
          Chọn gói khác
        </Button>
        <Button variant="primary" disabled={!conflictQuery.data?.canProceed} onClick={() => setStep(3)}>
          Tiếp tục
        </Button>
      </div>
    ) : (
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => setStep(2)}>
          Quay lại
        </Button>
        <Button variant="primary" disabled={applyMutation.isPending} onClick={() => applyMutation.mutate()}>
          {applyMutation.isPending ? 'Đang áp dụng...' : 'Xác nhận đổi gói'}
        </Button>
      </div>
    );

  return (
    <Modal title="Đổi gói (upgrade / downgrade)" onClose={onClose} footer={footer}>
      <div className="flex flex-col gap-4">
        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <span className={step >= 1 ? 'text-emerald-700 dark:text-emerald-400' : ''}>1. Chọn gói</span>
          <ArrowRight size={12} />
          <span className={step >= 2 ? 'text-emerald-700 dark:text-emerald-400' : ''}>2. Kiểm tra hạn mức</span>
          <ArrowRight size={12} />
          <span className={step >= 3 ? 'text-emerald-700 dark:text-emerald-400' : ''}>3. Xác nhận</span>
        </div>

        {step === 1 && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-zinc-500">
              Gói hiện tại: <span className="font-medium text-zinc-900 dark:text-zinc-50">{currentSubscription.saas_plans.name}</span>
              {' · '}
              {formatMoney(currentSubscription.price, currentSubscription.currency)} /{' '}
              {monthsLabel(currentSubscription.billing_cycle_months)}
            </p>
            <div className="mt-1 flex flex-col gap-2">
              {otherPlans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                    selectedPlan?.id === plan.id
                      ? 'border-emerald-600 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-500/10'
                      : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">{plan.name}</span>
                  <span className="font-mono text-xs text-zinc-500">
                    {Number(plan.price) === 0 ? 'Liên hệ' : formatMoney(plan.price, plan.currency)} /{' '}
                    {monthsLabel(plan.billing_cycle_months)}
                  </span>
                </button>
              ))}
              {otherPlans.length === 0 && (
                <p className="text-sm text-zinc-400">Không có gói khác đang mở bán.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && selectedPlan && (
          <div className="flex flex-col gap-3">
            {conflictQuery.isLoading && <p className="text-sm text-zinc-500">Đang kiểm tra hạn mức...</p>}
            {conflictQuery.data && conflictQuery.data.quotaConflicts.length > 0 && (
              <Callout tone="danger" title={`Vượt hạn mức nếu đổi sang ${selectedPlan.name}`}>
                <table className="mt-2 w-full text-left text-xs">
                  <thead className="text-red-500 dark:text-red-400">
                    <tr>
                      <th className="py-1 font-medium">Hạng mục</th>
                      <th className="py-1 font-medium">Hiện tại</th>
                      <th className="py-1 font-medium">Gói mới</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conflictQuery.data.quotaConflicts.map((c) => (
                      <tr key={c.code}>
                        <td className="py-1">{c.label}</td>
                        <td className="py-1 font-mono">{c.used}</td>
                        <td className="py-1 font-mono">{c.limit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-2">
                  Không thể đổi gói khi dữ liệu đang vượt hạn mức gói mới. Doanh nghiệp cần giảm quy mô trước, hoặc chọn gói khác.
                </p>
              </Callout>
            )}
            {conflictQuery.data && conflictQuery.data.featuresLost.length > 0 && (
              <Callout tone="warning">
                Tính năng sẽ tắt: {conflictQuery.data.featuresLost.map((f) => f.name).join(', ')}
              </Callout>
            )}
            {conflictQuery.data?.canProceed && conflictQuery.data.quotaConflicts.length === 0 && (
              <Callout tone="success">Không có xung đột hạn mức. Có thể đổi gói an toàn.</Callout>
            )}
          </div>
        )}

        {step === 3 && selectedPlan && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Xác nhận đổi <span className="font-medium text-zinc-900 dark:text-zinc-50">{currentSubscription.saas_plans.name}</span>{' '}
              → <span className="font-medium text-zinc-900 dark:text-zinc-50">{selectedPlan.name}</span>, áp dụng ngay.
            </p>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
