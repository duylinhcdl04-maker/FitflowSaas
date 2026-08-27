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
  today: {
    // BR-STAT-001: "Khách đã đến hôm nay" — một khách chỉ tính một lần dù có nhiều lượt.
    dailyUniqueVisitors: number;
    // "Tổng lượt Check-in" — mỗi lượt vào tính riêng, khác với dailyUniqueVisitors ở trên.
    totalCheckInEvents: number;
    memberVisitors: number;
    guestVisitors: number;
    currentlyInGym: number;
  };
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
