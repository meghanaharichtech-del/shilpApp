import { apiRequest } from './brokerApi';

export function getNotifications({ page = 1, limit = 20, filter = 'all' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    filter,
  });
  return apiRequest(`api/notifications?${params.toString()}`, 'get', undefined, true);
}

export function getNotificationUnreadCount() {
  return apiRequest('api/notifications/unread-count', 'get', undefined, true);
}

export function markNotificationRead(notificationId) {
  return apiRequest(
    `api/notifications/${encodeURIComponent(notificationId)}/read`,
    'patch',
    undefined,
    true,
  );
}

export function markAllNotificationsRead() {
  return apiRequest('api/notifications/read-all', 'patch', undefined, true);
}
