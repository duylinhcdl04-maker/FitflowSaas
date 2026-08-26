import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { writeAuditLog } from '../common/utils/audit';
import type { RequestUser } from '../common/types/jwt-payload';

export const AUTO_CHECKOUT_POLICY_KEY = 'auto_checkout_policy';

export type AutoCheckoutPolicy =
  | { mode: 'DURATION'; hours: number }
  | { mode: 'CLOSING_TIME' };

export const DEFAULT_AUTO_CHECKOUT_POLICY: AutoCheckoutPolicy = { mode: 'DURATION', hours: 4 };

/**
 * Owner-configurable policy for when a forgotten check-in gets auto-closed:
 *  - DURATION: N hours after check-in (matches the old hardcoded 4h default).
 *  - CLOSING_TIME: at that day's branch closing_time (Branch.closing_time).
 *
 * Tenant-wide (same key/value shape as the existing checkin_methods setting in
 * OwnerSettingsService — see that file's CHECKIN_CONFIG_KEY for the identical pattern).
 * The actual sweep that acts on this lives in AutoCheckoutSchedulerService — this
 * service only computes/stores the policy and the resulting `auto_checkout_at` for a
 * given check-in; it never touches attendances.status itself.
 */
@Injectable()
export class AutoCheckoutPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  async getPolicy(tenantId: string): Promise<AutoCheckoutPolicy> {
    const row = await this.prisma.tenantSettings.findUnique({
      where: {
        tenant_id_setting_key: { tenant_id: tenantId, setting_key: AUTO_CHECKOUT_POLICY_KEY },
      },
    });
    return (row?.setting_value as AutoCheckoutPolicy | undefined) ?? DEFAULT_AUTO_CHECKOUT_POLICY;
  }

  async setPolicy(tenantId: string, policy: AutoCheckoutPolicy, actor: RequestUser) {
    if (policy.mode === 'DURATION' && (!policy.hours || policy.hours <= 0 || policy.hours > 24)) {
      throw new BadRequestException('Số giờ tự động check-out phải trong khoảng 1–24 giờ');
    }

    await this.prisma.tenantSettings.upsert({
      where: {
        tenant_id_setting_key: { tenant_id: tenantId, setting_key: AUTO_CHECKOUT_POLICY_KEY },
      },
      create: {
        tenant_id: tenantId,
        setting_key: AUTO_CHECKOUT_POLICY_KEY,
        setting_value: policy,
        updated_by: actor.id,
      },
      update: {
        setting_value: policy,
        updated_by: actor.id,
        updated_at: new Date(),
      },
    });

    await writeAuditLog(this.prisma, {
      tenantId,
      actorUserId: actor.id,
      actorRole: actor.roles.join(', '),
      entityType: 'TENANT_SETTINGS',
      action: 'AUTO_CHECKOUT_POLICY_UPDATED',
      afterData: policy,
    });

    return policy;
  }

  /** Computes the auto_checkout_at to stamp on a new attendance/guest visit at check-in time. */
  async computeAutoCheckoutAt(tenantId: string, branchId: string, checkInAt: Date): Promise<Date> {
    const policy = await this.getPolicy(tenantId);

    if (policy.mode === 'DURATION') {
      return new Date(checkInAt.getTime() + policy.hours * 60 * 60 * 1000);
    }

    // CLOSING_TIME: same calendar day as check-in, at the branch's configured closing time.
    const branch = await this.prisma.branch.findUnique({
      where: { id: branchId },
      select: { closing_time: true },
    });
    const closing = branch?.closing_time;

    const result = new Date(checkInAt);
    if (closing) {
      result.setHours(closing.getHours(), closing.getMinutes(), closing.getSeconds(), 0);
    } else {
      result.setHours(22, 0, 0, 0); // fallback if branch has no closing_time somehow
    }
    // Check-in happened after today's closing time (late shift) -> roll to next day's closing.
    if (result <= checkInAt) {
      result.setDate(result.getDate() + 1);
    }
    return result;
  }
}
