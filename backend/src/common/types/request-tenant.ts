export interface RequestTenant {
  id: string;
  slug: string; // mapped from tenant.code
  name: string;
  status: string; // 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'INACTIVE'
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: RequestTenant | null;
    }
  }
}
