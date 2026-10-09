import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { getNotifications, getNotificationUnreadCount } from '../utils/notificationApi';
import { StorageUtils } from '../utils/StorageUtils';

const NotificationContext = createContext(null);
const UNREAD_POLL_INTERVAL = 10000;

const hasToken = session => Boolean(
  session?.token ||
  session?.data?.token ||
  session?.accessToken ||
  session?.data?.accessToken
);

export function NotificationProvider({ children }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestNotification, setLatestNotification] = useState(null);
  const requestRef = useRef(null);
  const sessionVersionRef = useRef(0);
  const countInitializedRef = useRef(false);
  const lastServerCountRef = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (requestRef.current) return requestRef.current;

    const sessionVersion = sessionVersionRef.current;
    const request = (async () => {
      const session = await StorageUtils.getItem('userData');
      if (!hasToken(session)) {
        if (sessionVersion === sessionVersionRef.current) setUnreadCount(0);
        return 0;
      }

      const data = await getNotificationUnreadCount();
      const count = Math.max(0, Number(data?.unreadCount) || 0);
      if (sessionVersion === sessionVersionRef.current) {
        const hasNewNotification = countInitializedRef.current && count > lastServerCountRef.current;
        lastServerCountRef.current = count;
        countInitializedRef.current = true;
        setUnreadCount(count);
        if (hasNewNotification) {
          const list = await getNotifications({ page: 1, limit: 1, filter: 'unread' });
          if (sessionVersion === sessionVersionRef.current && list?.notifications?.[0]) {
            setLatestNotification(list.notifications[0]);
          }
        }
      }
      return count;
    })();

    requestRef.current = request;
    try {
      return await request;
    } finally {
      if (requestRef.current === request) requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount().catch(() => {});
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') refreshUnreadCount().catch(() => {});
    });
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') refreshUnreadCount().catch(() => {});
    }, UNREAD_POLL_INTERVAL);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [refreshUnreadCount]);

  const markOneRead = useCallback(() => {
    setUnreadCount(current => Math.max(0, current - 1));
  }, []);

  const clearNotifications = useCallback(() => {
    sessionVersionRef.current += 1;
    requestRef.current = null;
    countInitializedRef.current = false;
    lastServerCountRef.current = 0;
    setLatestNotification(null);
    setUnreadCount(0);
  }, []);

  const dismissLatestNotification = useCallback(() => setLatestNotification(null), []);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      latestNotification,
      setUnreadCount,
      refreshUnreadCount,
      markOneRead,
      clearNotifications,
      dismissLatestNotification,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const value = useContext(NotificationContext);
  if (!value) throw new Error('useNotifications must be used inside NotificationProvider');
  return value;
}
