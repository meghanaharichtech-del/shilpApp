import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bell, CheckCheck, RefreshCw, X } from "lucide-react-native";
import { useNotifications } from "../context/NotificationContext";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../utils/notificationApi";
import { apiError } from "../utils/brokerApi";
import { theme } from "../utils/theme";

const PAGE_SIZE = 20;
const startOfDay = (value) => {
  const date = new Date(value);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};
const groupLabel = (value) => {
  const date = new Date(value);
  const days = Math.round(
    (startOfDay(new Date()) - startOfDay(date)) / 86400000,
  );
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7)
    return date.toLocaleDateString(undefined, { weekday: "long" });
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
const formatTime = (value) =>
  new Date(value).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

const NotificationRow = memo(function NotificationRow({ item, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? "" : "Unread notification. "}${item.title}`}
      onPress={() => onPress(item)}
      style={({ pressed }) => [
        styles.notification,
        !item.isRead && styles.notificationUnread,
        pressed && styles.notificationPressed,
      ]}
    >
      <View
        style={[
          styles.notificationIcon,
          !item.isRead && styles.notificationIconUnread,
        ]}
      >
        <Bell
          size={18}
          color={item.isRead ? "#777777" : theme.colors.orangeColor}
        />
      </View>
      <View style={styles.notificationBody}>
        <View style={styles.notificationTitleRow}>
          <Text
            numberOfLines={2}
            style={[
              styles.notificationTitle,
              !item.isRead && styles.notificationTitleUnread,
            ]}
          >
            {item.title}
          </Text>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text
          style={[styles.description, !item.isRead && styles.descriptionUnread]}
        >
          {item.description}
        </Text>
        <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
});

const Skeleton = () => (
  <View style={styles.skeletonList}>
    {[0, 1, 2, 3, 4].map((index) => (
      <View key={index} style={styles.skeletonRow}>
        <View style={styles.skeletonIcon} />
        <View style={styles.skeletonBody}>
          <View style={styles.skeletonTitle} />
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonShortLine} />
        </View>
      </View>
    ))}
  </View>
);

function Header({ unreadCount, markingAll, onMarkAll }) {
  return (
    <View style={styles.header}>
                     
                    <Text style={styles.headerTitle}>Notifications</Text>
      <View style={[styles.headerSide, styles.headerActionSide]}>
        <Pressable
          accessibilityRole="button"
          disabled={unreadCount === 0 || markingAll}
          hitSlop={6}
          onPress={onMarkAll}
          style={({ pressed }) => [
            styles.markAllButton,
            pressed && styles.pressed,
            unreadCount === 0 && styles.disabled,
          ]}
        >
          <CheckCheck size={17} color={theme.colors.orangeColor} />
          <Text style={styles.markAllText}>
            {markingAll ? "Reading..." : "Read all"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FilterBar({ filter, onChange }) {
  return (
    <View style={styles.filterWrap}>
      {["all", "unread"].map((value) => (
        <Pressable
          key={value}
          onPress={() => onChange(value)}
          style={[
            styles.filterButton,
            filter === value && styles.filterButtonActive,
          ]}
        >
          <Text
            style={[
              styles.filterText,
              filter === value && styles.filterTextActive,
            ]}
          >
            {value === "all" ? "All" : "Unread"}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NotificationScreen({ navigation }) {
  const isFocused = useIsFocused();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);
  const requestSequence = useRef(0);
  const readRequests = useRef(new Set());
  const loadingMoreRef = useRef(false);
  const { unreadCount, setUnreadCount, markOneRead } = useNotifications();
  const observedUnreadCount = useRef(unreadCount);

  const loadPage = useCallback(
    async (nextPage = 1, mode = "initial") => {
      if (mode === "more" && loadingMoreRef.current) return;
      const sequence = ++requestSequence.current;
      if (mode === "refresh") setRefreshing(true);
      else if (mode === "more") {
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else if (mode !== "silent") {
        setLoading(true);
        setNotifications([]);
        setPage(1);
        setHasMore(false);
      }
      setError("");
      try {
        const data = await getNotifications({
          page: nextPage,
          limit: PAGE_SIZE,
          filter,
        });
        if (sequence !== requestSequence.current) return;
        const incoming = Array.isArray(data?.notifications)
          ? data.notifications
          : [];
        setNotifications((current) => {
          if (nextPage === 1) return incoming;
          const ids = new Set(current.map((item) => item._id || item.id));
          return [
            ...current,
            ...incoming.filter((item) => !ids.has(item._id || item.id)),
          ];
        });
        setUnreadCount(Math.max(0, Number(data?.unreadCount) || 0));
        setPage(nextPage);
        setHasMore(
          Boolean(
            data?.pagination?.hasNextPage ||
            nextPage < Number(data?.pagination?.pages),
          ),
        );
      } catch (requestError) {
        if (sequence === requestSequence.current)
          setError(apiError(requestError));
      } finally {
        if (sequence === requestSequence.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
          loadingMoreRef.current = false;
        }
      }
    },
    [filter, setUnreadCount],
  );

  useFocusEffect(
    useCallback(() => {
      loadPage(1);
      return () => {
        requestSequence.current += 1;
        loadingMoreRef.current = false;
      };
    }, [loadPage]),
  );

  useEffect(() => {
    const previousCount = observedUnreadCount.current;
    observedUnreadCount.current = unreadCount;
    if (isFocused && unreadCount > previousCount && !loading)
      loadPage(1, "silent");
  }, [isFocused, loadPage, loading, unreadCount]);

  const groupedData = useMemo(() => {
    const rows = [];
    let previous = null;
    notifications.forEach((notification) => {
      const label = groupLabel(notification.createdAt);
      if (label !== previous) {
        rows.push({
          type: "header",
          label,
          key: `header-${label}-${notification.createdAt}`,
        });
        previous = label;
      }
      rows.push({
        type: "notification",
        ...notification,
        key: notification._id || notification.id,
      });
    });
    return rows;
  }, [notifications]);

  const onNotificationPress = useCallback(
    async (item) => {
      setSelectedNotification(item);
      const id = item._id || item.id;
      if (item.isRead || !id || readRequests.current.has(id)) return;
      readRequests.current.add(id);
      try {
        const data = await markNotificationRead(id);
        if (filter === "unread")
          setNotifications((current) =>
            current.filter(
              (notification) => (notification._id || notification.id) !== id,
            ),
          );
        else
          setNotifications((current) =>
            current.map((notification) =>
              (notification._id || notification.id) === id
                ? {
                    ...notification,
                    isRead: true,
                    readAt: data?.readAt || new Date().toISOString(),
                  }
                : notification,
            ),
          );
        setSelectedNotification((current) => current && ({ ...current, isRead: true, readAt: data?.readAt || new Date().toISOString() }));
        markOneRead();
      } catch (requestError) {
        setError(apiError(requestError));
      } finally {
        readRequests.current.delete(id);
      }
    },
    [filter, markOneRead],
  );

  const onMarkAllRead = useCallback(async () => {
    if (markingAll || unreadCount === 0) return;
    setMarkingAll(true);
    setError("");
    try {
      await markAllNotificationsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        filter === "unread"
          ? []
          : current.map((item) => ({
              ...item,
              isRead: true,
              readAt: item.readAt || readAt,
            })),
      );
      setUnreadCount(0);
    } catch (requestError) {
      setError(apiError(requestError));
    } finally {
      setMarkingAll(false);
    }
  }, [filter, markingAll, setUnreadCount, unreadCount]);

  const renderItem = useCallback(
    ({ item }) =>
      item.type === "header" ? (
        <Text style={styles.groupTitle}>{item.label}</Text>
      ) : (
        <NotificationRow item={item} onPress={onNotificationPress} />
      ),
    [onNotificationPress],
  );
  const header = (
    <>
      <Header
        navigation={navigation}
        unreadCount={unreadCount}
        markingAll={markingAll}
        onMarkAll={onMarkAllRead}
      />
      <FilterBar filter={filter} onChange={setFilter} />
    </>
  );

  if (loading && notifications.length === 0)
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {header}
        <Skeleton />
      </SafeAreaView>
    );
  if (error && notifications.length === 0)
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {header}
        <View style={styles.errorState}>
          <RefreshCw size={28} color="#777777" />
          <Text style={styles.errorTitle}>Could not load notifications</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryButton} onPress={() => loadPage(1)}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      {header}
      {error ? <Text style={styles.inlineError}>{error}</Text> : null}
      <FlatList
        data={groupedData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        contentContainerStyle={[
          styles.listContent,
          groupedData.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Bell size={28} color="#7A7A7A" strokeWidth={1.7} />
            </View>
            <Text style={styles.emptyTitle}>
              {filter === "unread"
                ? "You are all caught up"
                : "No notifications yet"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "unread"
                ? "New notifications will appear here."
                : "Updates from Shilp will appear here."}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              style={styles.footerLoader}
              color={theme.colors.orangeColor}
            />
          ) : null
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadPage(1, "refresh")}
            tintColor={theme.colors.orangeColor}
            colors={[theme.colors.orangeColor]}
          />
        }
        onEndReached={() => hasMore && loadPage(page + 1, "more")}
        onEndReachedThreshold={0.35}
        initialNumToRender={14}
        maxToRenderPerBatch={12}
        updateCellsBatchingPeriod={40}
        windowSize={7}
        showsVerticalScrollIndicator={false}
      />
      <Modal visible={Boolean(selectedNotification)} transparent animationType="fade" onRequestClose={() => setSelectedNotification(null)}>
        <Pressable style={styles.detailOverlay} onPress={() => setSelectedNotification(null)}>
          <Pressable style={styles.detailModal} onPress={() => {}}>
            <View style={styles.detailHeader}>
              <View style={styles.detailIcon}><Bell size={20} color={theme.colors.orangeColor} /></View>
              <Text style={styles.detailHeading}>Notification</Text>
              <Pressable accessibilityLabel="Close notification" hitSlop={8} onPress={() => setSelectedNotification(null)} style={styles.detailClose}><X size={20} color="#666666" /></Pressable>
            </View>
            <Text style={styles.detailTitle}>{selectedNotification?.title}</Text>
            <Text style={styles.detailDescription}>{selectedNotification?.description}</Text>
            <Text style={styles.detailDate}>{selectedNotification?.createdAt ? new Date(selectedNotification.createdAt).toLocaleString() : ''}</Text>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },

  backButton: {
    alignItems: "center",
    // height: 40,
    justifyContent: "center",
    // width: 40,
  },
   header: { justifyContent: 'center', minHeight: 58, paddingHorizontal: 16, justifyContent:"space-between", flexDirection:"row",alignItems:"center" },
  headerTitle: { color: theme.colors.blackText, fontFamily: theme.fonts.bold, fontSize: 18 },
 
 
  markAllButton: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    minHeight: 40,
  },
  markAllText: {
    color: theme.colors.orangeColor,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
  },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.42 },
  filterWrap: {
    alignSelf: "flex-start",
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    flexDirection: "row",
    marginBottom: 8,
    marginHorizontal: 16,
    padding: 3,
  },
  filterButton: {
    alignItems: "center",
    borderRadius: 6,
    justifyContent: "center",
    minHeight: 34,
    paddingHorizontal: 20,
  },
  filterButtonActive: {
    backgroundColor: "#FFFFFF",
    elevation: 1,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  filterText: {
    color: "#666666",
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  filterTextActive: { color: "#191919", fontFamily: theme.fonts.bold },
  listContent: { paddingBottom: 112 },
  emptyList: { flexGrow: 1 },
  groupTitle: {
    color: "#555555",
    fontFamily: theme.fonts.bold,
    fontSize: 13,
    paddingBottom: 8,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  notification: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  notificationUnread: { backgroundColor: "#FFF7F2" },
  notificationPressed: { opacity: 0.72 },
  notificationIcon: {
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 20,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  notificationIconUnread: { backgroundColor: "#FDE8DC" },
  notificationBody: { flex: 1 },
  notificationTitleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 8,
  },
  notificationTitle: {
    color: "#303030",
    flex: 1,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  notificationTitleUnread: { color: "#111111", fontFamily: theme.fonts.bold },
  unreadDot: {
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 4,
    height: 8,
    marginTop: 6,
    width: 8,
  },
  description: {
    color: "#777777",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  descriptionUnread: { color: "#4D4D4D", fontFamily: theme.fonts.medium },
  time: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    marginTop: 7,
  },
  footerLoader: { marginVertical: 20 },
  inlineError: {
    backgroundColor: "#FFF1F0",
    color: "#B42318",
    fontFamily: theme.fonts.medium,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 90,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 28,
    height: 56,
    justifyContent: "center",
    marginBottom: 16,
    width: 56,
  },
  emptyTitle: { color: "#242424", fontFamily: theme.fonts.bold, fontSize: 17 },
  emptySubtitle: {
    color: "#777777",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  errorState: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 70,
    paddingHorizontal: 32,
  },
  errorTitle: {
    color: "#242424",
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    marginTop: 14,
  },
  errorText: {
    color: "#777777",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#191919",
    borderRadius: 7,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryText: { color: "#FFFFFF", fontFamily: theme.fonts.bold, fontSize: 13 },
  skeletonList: { paddingTop: 10 },
  skeletonRow: {
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  skeletonIcon: {
    backgroundColor: "#ECECEC",
    borderRadius: 20,
    height: 40,
    width: 40,
  },
  skeletonBody: { flex: 1, gap: 8, paddingTop: 2 },
  skeletonTitle: {
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    height: 12,
    width: "58%",
  },
  skeletonLine: {
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    height: 10,
    width: "90%",
  },
  skeletonShortLine: {
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    height: 10,
    width: "34%",
  },
  detailOverlay: { alignItems: "center", backgroundColor: "rgba(0,0,0,0.48)", flex: 1, justifyContent: "center", padding: 22 },
  detailModal: { backgroundColor: "#FFFFFF", borderRadius: 8, maxWidth: 420, padding: 20, width: "100%" },
  detailHeader: { alignItems: "center", flexDirection: "row", marginBottom: 18 },
  detailIcon: { alignItems: "center", backgroundColor: "#FFF0E7", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  detailHeading: { color: "#777777", flex: 1, fontFamily: theme.fonts.semiBold, fontSize: 12, marginLeft: 10, textTransform: "uppercase" },
  detailClose: { alignItems: "center", height: 36, justifyContent: "center", width: 36 },
  detailTitle: { color: "#191919", fontFamily: theme.fonts.bold, fontSize: 18, lineHeight: 25 },
  detailDescription: { color: "#4D4D4D", fontFamily: theme.fonts.regular, fontSize: 14, lineHeight: 22, marginTop: 10 },
  detailDate: { color: "#999999", fontFamily: theme.fonts.regular, fontSize: 11, marginTop: 18 },
});
