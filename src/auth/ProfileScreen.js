import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Building2,
  ChevronRight,
  Mail,
  Phone,
  Settings,
  ShieldAlert,
  UserRound,
} from "lucide-react-native";
import { brokerRequest, saveSession } from "../utils/brokerApi";
import { StorageUtils } from "../utils/StorageUtils";
import { theme } from "../utils/theme";

const valueOrFallback = (value) => value || "Not provided";

function DetailRow({ icon: Icon, label, value, last = false }) {
  return (
    <View style={[styles.detailRow, !last && styles.detailBorder]}>
      <View style={styles.detailIcon}>
        <Icon size={18} color="#343434" strokeWidth={1.8} />
      </View>
      <View style={styles.detailText}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{valueOrFallback(value)}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const data = await brokerRequest("profile", "get", undefined, true);
      const normalized = {
        ...data.user,
        phoneNumber: data.user?.phoneNumber || data.user?.phone || null,
        companyName: data.company?.companyName || null,
        companyLogo: data.company?.logo || null,
      };
      setProfile(normalized);
      await Promise.all([
        saveSession(data),
        StorageUtils.setItem("brokerProfile", normalized),
      ]);
    } catch (requestError) {
      const cached = await StorageUtils.getItem("brokerProfile");
      if (cached) setProfile(cached);
      setError(
        requestError?.response?.data?.error ||
          requestError?.message ||
          "Could not load your profile.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile]),
  );

  if (loading && !profile)
    return (
      <SafeAreaView style={[styles.screen, styles.center]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.colors.orangeColor} />
      </SafeAreaView>
    );

  const initial = profile?.name?.trim()?.charAt(0)?.toUpperCase() || "B";
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
                <View style={styles.header}><Text style={styles.headerTitle}>Profile</Text></View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            colors={[theme.colors.orangeColor]}
            tintColor={theme.colors.orangeColor}
          />
        }
      >
      

        <View style={styles.identity}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.identityText}>
            <Text style={styles.name} numberOfLines={1}>
              {valueOrFallback(profile?.name)}
            </Text>
            <Text style={styles.role}>Channel Partner</Text>
          </View>
          <Pressable
            onPress={() => navigation.navigate("ProfileEditScreen")}
            style={styles.editButton}
          >
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
        </View>

        {error ? (
          <View style={styles.error}>
            <ShieldAlert size={16} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Broker details</Text>
        <View style={styles.card}>
          <DetailRow
            icon={UserRound}
            label="Broker name"
            value={profile?.name}
          />
          <DetailRow icon={Mail} label="Email address" value={profile?.email} />
          <DetailRow
            icon={Phone}
            label="Phone number"
            value={profile?.phoneNumber}
            last
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Company details</Text>
          <Pressable onPress={() => navigation.navigate("ProfileEditScreen")}>
            <Text style={styles.sectionAction}>Edit</Text>
          </Pressable>
        </View>
        <View style={styles.companyCard}>
          {profile?.companyLogo ? (
            <Image
              source={{ uri: profile.companyLogo }}
              style={styles.companyLogo}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.companyLogoPlaceholder}>
              <Building2 size={25} color="#777777" />
            </View>
          )}
          <View style={styles.companyText}>
            <Text style={styles.detailLabel}>Company name</Text>
            <Text style={styles.companyName}>
              {valueOrFallback(profile?.companyName)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Settings</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          onPress={() => navigation.navigate("SettingsScreen")}
          style={({ pressed }) => [
            styles.settingsCard,
            pressed && styles.settingsCardPressed,
          ]}
        >
          <View style={styles.detailIcon}>
            <Settings size={18} color="#343434" strokeWidth={1.8} />
          </View>
          <View style={styles.settingsCardText}>
            <Text style={styles.settingsCardTitle}>App settings</Text>
            <Text style={styles.settingsCardSubtitle}>
              Support, compliance and account controls
            </Text>
          </View>
          <ChevronRight size={19} color="#999999" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.backgroundmaincolor, flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 16, paddingBottom: 112, gap:10
   },
 header: { justifyContent: 'center', minHeight: 58, paddingHorizontal: 16 },
  headerTitle: { color: theme.colors.blackText, fontFamily: theme.fonts.bold, fontSize: 18 },
 
  identity: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 26,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  avatarText: { color: "#FFFFFF", fontFamily: theme.fonts.bold, fontSize: 21 },
  identityText: { flex: 1, marginLeft: 12 },
  name: { color: "#191919", fontFamily: theme.fonts.bold, fontSize: 17 },
  role: {
    color: "#777777",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  editButton: {
    backgroundColor: "#F3F3F3",
    borderRadius: 7,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  editText: {
    color: "#333333",
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
  },
  sectionTitle: {
    color: "#303030",
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    // marginBottom: 9,
    // marginTop: 20,
  },
  sectionHeader: {
    alignItems: "flex-end",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sectionAction: {
    color: theme.colors.orangeColor,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    marginBottom: 9,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: { alignItems: "center", flexDirection: "row", padding: 14 },
  detailBorder: { borderBottomColor: "#EEEEEE", borderBottomWidth: 1 },
  detailIcon: {
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  detailText: { flex: 1, marginLeft: 12 },
  detailLabel: {
    color: "#858585",
    fontFamily: theme.fonts.regular,
    fontSize: 11,
  },
  detailValue: {
    color: "#252525",
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    marginTop: 2,
  },
  companyCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 14,
  },
  companyLogo: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    height: 52,
    width: 52,
  },
  companyLogoPlaceholder: {
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  companyText: { flex: 1, marginLeft: 12 },
  companyName: {
    color: "#252525",
    fontFamily: theme.fonts.bold,
    fontSize: 15,
    marginTop: 3,
  },
  settingsCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E8E8E8",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    padding: 14,
  },
  settingsCardPressed: { backgroundColor: "#F7F7F7" },
  settingsCardText: { flex: 1, marginLeft: 12 },
  settingsCardTitle: {
    color: "#252525",
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  settingsCardSubtitle: {
    color: "#858585",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  error: {
    alignItems: "center",
    backgroundColor: "#FEF3F2",
    borderRadius: 8,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    padding: 11,
  },
  errorText: {
    color: "#B42318",
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
});
