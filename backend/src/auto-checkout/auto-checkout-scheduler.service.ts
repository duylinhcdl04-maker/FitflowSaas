import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ManagerService } from '../manager/manager.service';

const SWEEP_BATCH_LIMIT = 500; // safety cap per tick — never process an unbounded backlog in one pass

/**
 * Periodic sweep that closes out check-ins nobody manually checked out (staff forgot,
 * customer just left). Every attendance already carries its own `auto_checkout_at`
 * (computed at check-in time by AutoCheckoutPolicyService, from the Owner's configured
 * policy — see that service). This job's only job is: find CHECKED_IN attendances whose
 * auto_checkout_at has passed, and check them out — across ALL tenants/branches in one pass.
 */
@Injectable()
export class AutoCheckoutSchedulerService {
  private readonly logger = new Logger(AutoCheckoutSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly managerService: ManagerService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweep() {
    const due = await this.prisma.attendances.findMany({
      where: { status: 'CHECKED_IN', auto_checkout_at: { lte: new Date() } },
      select: { id: true },
      take: SWEEP_BATCH_LIMIT,
    });

    if (due.length === 0) return;

    this.logger.log(`Auto-checkout sweep: closing out ${due.length} overdue check-in(s)`);

    for (const { id } of due) {
      try {
        await this.managerService.autoCheckoutAttendance(id);
      } catch (err) {
        this.logger.error(`Auto-checkout failed for attendance ${id}`, err as Error);
      }
    }
  }
}
