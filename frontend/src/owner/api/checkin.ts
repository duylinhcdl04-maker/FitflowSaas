import { apiClient } from './client';
import type { Paginated } from './customers';

export interface CheckinRow {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerCode?: string;
  branchId?: string;
  branchName: string;
  type: 'MEMBER' | 'GUEST';
  checkInAt: string;
  checkOutAt: string | null;
  method: string;
  status: string;
}

export interface CheckinOverview {
  today: { total: number; members: number; guests: number; currentlyInGym: number };
  list: Paginated<CheckinRow>;
}

export interface QueryCheckin {
  search?: string;
  branchId?: string;
  type?: 'MEMBER' | 'GUEST';
  method?: 'FACE' | 'QR' | 'MANUAL' | 'AUTO';
  status?: 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
  page?: number;
}

export function getCheckinOverview(query: QueryCheckin) {
  return apiClient.get<CheckinOverview>('/owner/checkin/overview', { params: query }).then((res) => res.data);
}
