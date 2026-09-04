import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import type { RequestTenant } from '../common/types/request-tenant';

@Injectable()
export class TenantResolverService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Trích xuất tenant slug từ request dựa theo thứ tự ưu tiên:
   * 1. Header `x-tenant-slug` / `x-tenant-code` (frontend client gửi)
   * 2. Hostname / Host header (yoyo.localhost:5000, yoyo.fitflow.io.vn)
   * 3. Origin header (http://yoyo.localhost:5173)
   * 4. Referer header
   */
  extractSlugFromRequest(req: Request): string | null {
    // 1. Explicit custom header
    const headerSlug = (req.headers['x-tenant-slug'] ||
      req.headers['x-tenant-code']) as string | undefined;
    if (headerSlug && typeof headerSlug === 'string' && headerSlug.trim()) {
      return headerSlug.trim().toLowerCase();
    }

    const extractFromHost = (host: string | undefined): string | null => {
      if (!host) return null;
      // Bỏ port nếu có (e.g. yoyo.localhost:5000 -> yoyo.localhost)
      const cleanHost = host.split(':')[0].toLowerCase();

      // Kiểm tra pattern .localhost (e.g. yoyo.localhost)
      if (cleanHost.endsWith('.localhost')) {
        const parts = cleanHost.replace(/\.localhost$/, '').split('.');
        const sub = parts[parts.length - 1];
        if (sub && sub !== 'www' && sub !== 'api') return sub;
        return null;
      }

      // Kiểm tra pattern production .fitflow.io.vn hoặc domain >= 3 phần
      const parts = cleanHost.split('.');
      if (parts.length >= 3) {
        const sub = parts[0];
        if (sub && sub !== 'www' && sub !== 'api') return sub;
      }

      return null;
    };

    // 2. Hostname / Host header
    const hostSub =
      extractFromHost(req.hostname) ||
      extractFromHost(req.headers.host as string | undefined);
    if (hostSub) return hostSub;

    // 3. Origin header (gửi từ frontend browser CORS request)
    const origin = req.headers.origin as string | undefined;
    if (origin) {
      try {
        const url = new URL(origin);
        const originSub = extractFromHost(url.hostname);
        if (originSub) return originSub;
      } catch {
        // bỏ qua nếu origin không phải URL hợp lệ
      }
    }

    // 4. Referer header
    const referer = req.headers.referer as string | undefined;
    if (referer) {
      try {
        const url = new URL(referer);
        const refererSub = extractFromHost(url.hostname);
        if (refererSub) return refererSub;
      } catch {
        // bỏ qua nếu referer không phải URL hợp lệ
      }
    }

    return null;
  }

  /**
   * Tra cứu tenant theo slug. Dùng cho API GET /api/v1/tenants/resolve/:slug
   * Ném NotFoundException nếu không có, ForbiddenException nếu SUSPENDED/INACTIVE.
   */
  async resolveBySlug(slug: string): Promise<RequestTenant> {
    const cleanSlug = slug.trim().toLowerCase();
    const tenant = await this.prisma.tenant.findUnique({
      where: { code: cleanSlug },
      select: { id: true, code: true, name: true, status: true },
    });

    if (!tenant) {
      throw new NotFoundException('Không tìm thấy cửa hàng với địa chỉ này');
    }

    if (tenant.status === 'SUSPENDED' || tenant.status === 'INACTIVE') {
      throw new ForbiddenException(
        'Cửa hàng này hiện đang bị tạm ngưng hoặc ngừng hoạt động',
      );
    }

    return {
      id: tenant.id,
      slug: tenant.code,
      name: tenant.name,
      status: tenant.status,
    };
  }

  /**
   * Tra cứu tenant cho Middleware. Trả về RequestTenant hoặc null.
   */
  async findTenantBySlug(slug: string): Promise<RequestTenant | null> {
    const cleanSlug = slug.trim().toLowerCase();
    const tenant = await this.prisma.tenant.findUnique({
      where: { code: cleanSlug },
      select: { id: true, code: true, name: true, status: true },
    });

    if (!tenant) return null;

    return {
      id: tenant.id,
      slug: tenant.code,
      name: tenant.name,
      status: tenant.status,
    };
  }
}
