import { DASHBOARD_API } from "../utils/ApiHelper";
import FavoriteHeartButton from '../components/FavoriteHeartButton';
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowUpRight,
  Bell,
  Building2,
  CalendarDays,
  House,
  MapPin,
  Maximize,
  Settings,
  Users,
  Wallet,
  Clock,
} from "lucide-react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import NotificationBadge from "../components/NotificationBadge";
import { useNotifications } from "../context/NotificationContext";
import { apiError, apiRequest } from "../utils/brokerApi";
import { theme } from "../utils/theme";

const number = (value) => Number(value || 0).toLocaleString("en-IN");
// Decorative silhouettes stay behind the content and out of the accessibility tree.
function MetricArtwork({ variant }) {
  const artwork = {
    buildings: <><Rect x="12" y="36" width="24" height="48" rx="4" /><Rect x="42" y="14" width="30" height="70" rx="4" /><Path d="M50 28h14M50 40h14M50 52h14M20 49h8M20 61h8" stroke="white" strokeWidth="4" /></>,
    growth: <><Rect x="14" y="54" width="16" height="30" rx="6" /><Rect x="39" y="36" width="16" height="48" rx="6" /><Rect x="64" y="16" width="16" height="68" rx="6" /></>,
    homes: <><Path d="M8 47 33 25l25 22v35H8Z" /><Path d="m42 29 19-17 25 22v40H65V44Z" opacity="0.6" /><Rect x="26" y="59" width="14" height="23" rx="2" fill="white" /></>,
    area: <><Path d="m10 57 37-22 39 22-39 23Z" /><Path d="m10 43 37-22 39 22-39 23Z" fill="none" stroke="currentColor" strokeWidth="5" strokeLinejoin="round" /><Path d="M10 72 47 94 86 72" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></>,
    people: <><Circle cx="48" cy="30" r="14" /><Circle cx="18" cy="39" r="10" opacity="0.6" /><Circle cx="78" cy="39" r="10" opacity="0.6" /><Path d="M25 83V66a23 23 0 0 1 46 0v17ZM2 80V65a16 16 0 0 1 20-15 29 29 0 0 0-4 16v14ZM78 80V66a29 29 0 0 0-4-16 16 16 0 0 1 20 15v15Z" /></>,
    booking: <><Rect x="15" y="24" width="66" height="60" rx="9" /><Path d="M30 16v18M66 16v18" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" /><Path d="M15 43h66" stroke="white" strokeWidth="4" /><Path d="m32 63 11 10 21-22" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></>,
    paid: <><Rect x="10" y="37" width="64" height="45" rx="8" /><Path d="m16 30 44-16 7 16Z" /><Circle cx="71" cy="68" r="21" /><Path d="m60 68 8 8 14-17" fill="none" stroke="white" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></>,
    pending: <><Circle cx="48" cy="49" r="34" /><Path d="M48 28v23l15 10" fill="none" stroke="white" strokeWidth="6" strokeLinecap="round" /><Circle cx="77" cy="79" r="15" /><Path d="M73 73v12M81 73v12" stroke="white" strokeWidth="3" strokeLinecap="round" /></>,
  };
  return (
    <View style={styles.metricArtwork} pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width="100%" height="100%" viewBox="0 0 96 100" fill="#CBD9E5" color="#CBD9E5">
        {artwork[variant]}
      </Svg>
    </View>
  );
}

function Metric({ label, value, artwork, icon: Icon = Building2 }) {
  return (
    <View style={styles.metric}>
      <MetricArtwork variant={artwork} />
      <View style={styles.metricIcon}>
        <Icon size={19} color={theme.colors.blackText} strokeWidth={1.7} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

export default function DashboardScreen({ navigation }) {
  const { unreadCount } = useNotifications();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(
    () =>
      apiRequest(DASHBOARD_API, "get", undefined, true)
        .then((data) => {
          setDashboard(data);
          setError("");
        })
        .catch((err) => setError(apiError(err)))
        .finally(() => setLoading(false)),
    [],
  );
  useEffect(() => {
    load();
  }, [load]);
  const refresh = () => {
    setLoading(true);
    load();
  };
  const openSearch = (query = "") =>
    navigation.navigate("SearchScreen", { query, searchKey: Date.now() });
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <View style={styles.headerActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => navigation.navigate("NotificationScreen")}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Bell size={21} color="#111111" />
            <NotificationBadge
              count={unreadCount}
              style={styles.notificationBadge}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={() => navigation.navigate("SettingsScreen")}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Settings size={21} color="#111111" />
          </Pressable>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={theme.colors.orangeColor}
            colors={[theme.colors.orangeColor]}
          />
        }
      >
        {loading && !dashboard ? <ActivityIndicator color="#FA7200" /> : null}
        {error ? (
          <Pressable onPress={refresh} accessibilityRole="button">
            <Text style={styles.error}>{error} · Tap to retry</Text>
          </Pressable>
        ) : null}
        {dashboard ? (
          <>
            <View style={styles.heading}>
              <Text style={styles.section}>Projects</Text>
              <Pressable
                onPress={() => openSearch()}
                accessibilityRole="button"
              >
                <Text style={styles.link}>View all</Text>
              </Pressable>
            </View>
            <View style={styles.grid}>
              <Metric
                artwork="buildings"
                label="Current projects"
                value={number(dashboard.overview?.currentProjects)}
              />
              <Metric
                icon={CalendarDays}
                artwork="growth"
                label="Upcoming projects"
                value={number(dashboard.overview?.upcomingProjects)}
              />
            </View>
            <Text style={styles.section}>Availability</Text>
            <View style={styles.grid}>
              <Metric
                icon={House}
                artwork="homes"
                label="Available properties"
                value={number(dashboard.availability?.properties)}
              />
              <Metric
                icon={Maximize}
                artwork="area"
                label="Available area"
                value={`${number(dashboard.availability?.area)} sq ft`}
              />
            </View>
            <Text style={styles.section}>Your business</Text>
            <View style={styles.grid}>
              <Metric
                icon={Users}
                artwork="people"
                label="Active leads"
                value={number(dashboard.stats?.activeLeads)}
              />
              <Metric
                icon={CalendarDays}
                artwork="booking"
                label="Bookings"
                value={number(dashboard.stats?.bookings)}
              />
            </View>
            <View style={styles.grid}>
              <Metric
                icon={Wallet}
                artwork="paid"
                label="Paid commission"
                value={`₹${number(dashboard.stats?.paidCommission)}`}
              />
              <Metric
                icon={Clock}
                artwork="pending"
                label="Pending commission"
                value={`₹${number(dashboard.stats?.pendingCommission)}`}
              />
            </View>
            <Text style={styles.section}>Working areas</Text>
            {(dashboard.workingAreas || []).map((area) => (
              <Pressable
                key={area.name}
                style={styles.area}
                accessibilityRole="button"
                onPress={() => openSearch(area.name)}
              >
                <View style={styles.areaIcon}>
                  <MapPin size={19} color={theme.colors.blackText} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.areaName}>{area.name}</Text>
                  <Text style={styles.rowSubtitle}>
                    {number(area.projects)} projects
                  </Text>
                </View>
                <ArrowUpRight size={19} color={theme.colors.blackText} />
              </Pressable>
            ))}
            <View style={styles.heading}>
              <Text style={styles.section}>Recent projects</Text>
              <Pressable
                onPress={() => openSearch()}
                accessibilityRole="button"
              >
                <Text style={styles.link}>View all</Text>
              </Pressable>
            </View>
            {(
              dashboard.recentProjects ||
              dashboard.sections?.latestLaunches ||
              []
            )
              .slice(0, 3)
              .map((project) => (
                <Pressable
                  key={project._id}
                  style={styles.area}
                  onPress={() =>
                    navigation.navigate("PropertyDetailScreen", { project })
                  }
                >
                  <View style={styles.areaIcon}>
                    <Building2 size={19} color={theme.colors.blackText} />
                  </View>
                  <View style={styles.rowBody}>
                    <Text numberOfLines={2} style={styles.areaName}>
                      {project.name}
                    </Text>
                    <Text numberOfLines={2} style={styles.rowSubtitle}>
                      {project.address || "Location details coming soon"}
                    </Text>
                  </View>
                  <FavoriteHeartButton project={project} />
                  <View style={styles.arrowButton}>
                    <ArrowUpRight size={19} color={theme.colors.blackText} />
                  </View>
                </Pressable>
              ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.purewhiteBackground },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.blackText,
  },
  headerActions: { flexDirection: "row", gap: 10 },
  iconButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 44,
    width: 44,
  },
  notificationBadge: { right: -5, top: -5 },
  content: { paddingHorizontal: 16, paddingTop: 6, paddingBottom: 112 },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  section: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
    color: theme.colors.blackText,
    marginBottom: 12,
    marginTop: 12,
  },
  grid: { flexDirection: "row", gap: 5 },
  metricArtwork: {
    position: "absolute",
    right: 8,
    bottom: 25,
    width: "42%",
    height: 76,
    opacity: 0.45,
  },
  metric: {
    overflow: "hidden",
    flex: 1,
    padding: 14,
    borderRadius: 10,
    backgroundColor: theme.colors.whiteBackground,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    minHeight: 142,
  },
  metricIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: theme.colors.borderlightgraycolour,
    marginBottom: 12,
  },
  label: {
    fontFamily: theme.fonts.medium,
    color: theme.colors.subText,
    fontSize: 12,
    marginTop: 4,
  },
  value: {
    fontFamily: theme.fonts.bold,
    color: theme.colors.blackText,
    fontSize: 22,
    flexShrink: 1,
  },
  area: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.whiteBackground,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    borderRadius: 10,
    marginBottom: 10,
  },
  areaIcon: {
    alignItems: "center",
    justifyContent: "center",
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: theme.colors.borderlightgraycolour,
  },
  rowBody: { flex: 1 },
  areaName: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.blackText,
    fontSize: 15,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.graysubtext,
    fontSize: 12,
  },
  arrowButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 34,
    height: 34,
    borderRadius: 17,
    // backgroundColor: "#FFF0DE",
  },
  link: {
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.graysubtext,
    fontSize: 14,
    paddingVertical: 12,
  },
  error: {
    color: "#B42318",
    fontFamily: theme.fonts.regular,
    paddingVertical: 16,
  },
});
