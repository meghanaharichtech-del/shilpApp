import { NOTIFICATIONS_API, NOTIFICATION_UNREAD_COUNT_API, NOTIFICATION_READ_API, NOTIFICATIONS_READ_ALL_API } from "./ApiHelper";
import { apiRequest } from './brokerApi';

export function getNotifications({ page = 1, limit = 20, filter = 'all' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    filter,
  });
  return apiRequest(`${NOTIFICATIONS_API}?${params.toString()}`, 'get', undefined, true);
}

export function getNotificationUnreadCount() {
  return apiRequest(NOTIFICATION_UNREAD_COUNT_API, 'get', undefined, true);
}

export function markNotificationRead(notificationId) {
  return apiRequest(
    NOTIFICATION_READ_API(notificationId),
    'patch',
    undefined,
    true,
  );
}

export function markAllNotificationsRead() {
  return apiRequest(NOTIFICATIONS_READ_ALL_API, 'patch', undefined, true);
}
