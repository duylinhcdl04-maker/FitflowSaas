import { apiClient } from '../owner/api/client';

/** One record behind a notification (a member, a payment, ...) — same shape whether
 * the notification covers 1 record or several. See backend NotificationDetailItem. */
export interface NotificationDetailItem {
  id: string;
  customerName: string;
  customerPhone?: string | null;
  amount?: number;
  method?: string;
  packageName?: string;
  startDate?: string;
  endDate?: string;
  lastVisitAt?: string | null;
}

export interface AppNotification {
  id: string;
  eventCode: string;
  title: string;
  body: string | null;
  payload: {
    targetPath?: string;
    branchId?: string;
    branchName?: string;
    count?: number;
    items?: NotificationDetailItem[];
    [key: string]: unknown;
  } | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsListResponse {
  items: AppNotification[];
  unreadCount: number;
}

export function getNotifications() {
  return apiClient.get<NotificationsListResponse>('/notifications').then((res) => res.data);
}

export function markNotificationRead(id: string) {
  return apiClient.post(`/notifications/${id}/read`).then((res) => res.data);
}

export function markAllNotificationsRead() {
  return apiClient.post('/notifications/read-all').then((res) => res.data);
}

export function deleteNotification(id: string) {
  return apiClient.delete(`/notifications/${id}`).then((res) => res.data);
}

export function deleteAllReadNotifications() {
  return apiClient.delete('/notifications/read').then((res) => res.data);
}
