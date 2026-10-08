import React, { useCallback, useState } from "react";
import { ActivityIndicator, Image, Linking, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BadgeCheck, Building2, ChevronRight, FileText, HelpCircle, LogOut, Mail, Phone, ShieldAlert, ShieldCheck, User } from "lucide-react-native";
import { useFocusEffect } from "@react-navigation/native";
import { brokerRequest, saveSession } from "../utils/brokerApi";
import { StorageUtils } from "../utils/StorageUtils";
import { theme } from "../utils/theme";
import CustomDialog from "../components/CustomDialog";
const getAccessToken = userData => userData?.token || userData?.data?.token || userData?.accessToken || userData?.data?.accessToken;
const displayValue = (value, fallback = "Not provided") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
};
const InfoRow = ({
  icon: Icon,
  label,
  value,
  subvalue,
  isLast = false,
  badgeText,
  badgeColor,
  onPress
}) => {
  const content = <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
      <View style={styles.infoIconWrap}>
        <Icon size={18} color="#121212" strokeWidth={1.8} />
      </View>
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} numberOfLines={2}>
          {displayValue(value)}
        </Text>
        {subvalue ? <Text style={styles.infoSubvalue}>{subvalue}</Text> : null}
      </View>
      {badgeText ? <View style={[styles.badge, badgeColor ? {
      backgroundColor: badgeColor.bg
    } : null]}>
          <Text style={[styles.badgeText, badgeColor ? {
        color: badgeColor.text
      } : null]}>
            {badgeText}
          </Text>
        </View> : onPress ? <ChevronRight size={18} color={theme.colors.grayiconcolor} /> : null}
    </View>;
  if (onPress) {
    return <Pressable onPress={onPress} android_ripple={{
      color: "#EAEAEA"
    }}>
        {content}
      </Pressable>;
  }
  return content;
};
const ProfileScreen = ({
  navigation
}) => {
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const userData = await StorageUtils.getItem("userData");
      const token = getAccessToken(userData);
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }
      const data = await brokerRequest("profile", "get", undefined, true);
      const response = {
        data: {
          success: true,
          broker: {
            ...data.user,
            phone: data.user.phoneNumber,
            company: data.company?.companyName,
            companyLogo: data.company?.logo
          }
        }
      };
      await saveSession(data);
      if (!response.data?.success || !response.data?.broker) {
        throw new Error(response.data?.message || "Unable to load your profile.");
      }
      setBroker(response.data.broker);
      await StorageUtils.setItem("brokerProfile", response.data.broker);
    } catch (requestError) {
      const cachedProfile = await StorageUtils.getItem("brokerProfile");
      if (cachedProfile) setBroker(cachedProfile);
      setError(requestError?.response?.data?.error || requestError?.response?.data?.message || requestError?.message || "Could not load your profile.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);
  useFocusEffect(useCallback(() => {
    loadProfile();
  }, [loadProfile]));
  const handleLogout = () => {
    setDialog({
      title: "Log Out",
      message: "Are you sure you want to log out from Shilp App?",
      confirmLabel: "Log Out",
      cancelLabel: "Cancel",
      onConfirm: async () => {
        try {
          await StorageUtils.removeItem("userData");
          await StorageUtils.removeItem("brokerProfile");
          navigation.reset({
            index: 0,
            routes: [{
              name: "LoginScreen"
            }]
          });
        } catch (_err) {
          navigation.navigate("LoginScreen");
        }
      }
    });
  };

  // Derived company and business fields
  const companyName = broker?.companyName || broker?.company?.name || broker?.company || "";
  const isEmailVerified = broker?.isVerified === true;

  if (loading) {
    return <SafeAreaView style={[styles.safeArea, styles.center]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.colors.orangeColor} />
      </SafeAreaView>;
  }
  return <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProfile(true)} colors={[theme.colors.orangeColor]} tintColor={theme.colors.orangeColor} />}>
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <Pressable onPress={() => navigation.navigate("ProfileEditScreen")}><Text style={styles.sectionActionText}>Edit Profile</Text></Pressable>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>
              {broker?.role === "admin" ? "Channel Partner" : "Channel Partner"}
            </Text>
          </View>
        </View>

        {/* ── Hero Profile Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {broker?.companyLogo ? <Image source={{
            uri: broker.companyLogo
          }} style={styles.avatarImg} /> : <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {broker?.name?.charAt(0)?.toUpperCase() || broker?.firstName?.charAt(0)?.toUpperCase() || "U"}
                </Text>
              </View>}
            {isEmailVerified && <View style={styles.avatarBadge}>
                <BadgeCheck size={18} color="#2E7D32" />
              </View>}
          </View>

          <View style={styles.heroText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayValue(broker?.name || `${broker?.firstName || ""} ${broker?.lastName || ""}`.trim())}
              </Text>
            </View>

            {broker?.email ? <View style={styles.contactItem}>
                <Mail size={13} color="#777777" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {broker.email}
                </Text>
              </View> : null}

            {broker?.phone ? <View style={styles.contactItem}>
                <Phone size={13} color="#777777" />
                <Text style={styles.contactText}>{broker.phone}</Text>
              </View> : null}
          </View>
        </View>

        {error ? <View style={styles.errorBox}>
            <ShieldAlert size={16} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View> : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Broker Details</Text>
        </View>
        <View style={styles.cardContainer}>
          <InfoRow icon={User} label="Full name" value={broker?.name} />
          <InfoRow icon={Mail} label="Email" value={broker?.email} />
          <InfoRow icon={Phone} label="Phone number" value={broker?.phone} />
          <InfoRow icon={ShieldCheck} label="Email verification" value={broker?.isVerified ? 'Verified' : 'Pending'} isLast />
        </View>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <Pressable onPress={() => navigation.navigate('ProfileEditScreen')}><Text style={styles.sectionActionText}>Edit Company</Text></Pressable>
        </View>
        <View style={styles.cardContainer}>
          <InfoRow icon={Building2} label="Company Name" value={companyName} isLast />
          {broker?.companyLogo ? <Image source={{
          uri: broker.companyLogo
        }} style={{
          width: 100,
          height: 100,
          margin: 16
        }} resizeMode="contain" /> : null}
        </View>

        {/* ── Support & Legal ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Support & Compliance</Text>
        </View>

        <View style={styles.cardContainer}>
          <InfoRow icon={ShieldCheck} label="Privacy Policy" value="View legal terms and data privacy" onPress={() => setDialog({
          title: "Privacy Policy",
          message: "Shilp App prioritizes your privacy. Your data, customer leads, and business information are securely encrypted and protected in accordance with real estate regulatory standards."
        })} />
          <InfoRow icon={FileText} label="Terms & Conditions" value="Channel partner agreement" onPress={() => setDialog({
          title: "Terms & Conditions",
          message: "As a registered channel partner with Shilp App, all commission payouts, project presentations, and client registrations are governed by the broker policy agreement."
        })} />
          <InfoRow icon={HelpCircle} label="Help & Partner Support" value="support@shilpgroup.com" isLast onPress={() => {
          Linking.openURL("mailto:support@shilpgroup.com").catch(() => {});
        }} />
        </View>

        {/* ── Logout Button ── */}
        <Pressable style={styles.logoutButton} onPress={handleLogout} android_ripple={{
        color: "#FFE8E8"
      }}>
          <LogOut size={18} color="#D92D20" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footerText}>
          Shilp App • Channel Partner v1.0.0
        </Text>
      </ScrollView>

      <CustomDialog visible={Boolean(dialog)} title={dialog?.title} message={dialog?.message} confirmLabel={dialog?.confirmLabel} cancelLabel={dialog?.cancelLabel} onClose={() => setDialog(null)} onConfirm={dialog?.onConfirm} />
    </SafeAreaView>;
};
export default ProfileScreen;
const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.backgroundmaincolor,
    flex: 1
  },
  center: {
    alignItems: "center",
    justifyContent: "center"
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 110
  },
  // ── Header ──
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4
  },
  screenTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 26
  },
  partnerBadge: {
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  partnerBadgeText: {
    color: "#555555",
    fontFamily: theme.fonts.semiBold,
    fontSize: 12
  },
  // ── Hero Profile Card ──
  heroCard: {
    alignItems: "center",
    backgroundColor: theme.colors.purewhiteBackground,
    borderColor: "#EAEAEA",
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  avatarWrap: {
    position: "relative"
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    width: 60
  },
  avatarImg: {
    borderRadius: 30,
    height: 60,
    width: 60
  },
  avatarText: {
    color: theme.colors.whiteText,
    fontFamily: theme.fonts.bold,
    fontSize: 24
  },
  avatarBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    bottom: -2,
    position: "absolute",
    right: -2
  },
  heroText: {
    flex: 1,
    marginLeft: 14
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  name: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 18
  },
  contactItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 4
  },
  contactText: {
    color: "#666666",
    fontFamily: theme.fonts.regular,
    fontSize: 13
  },
  // ── Stats Row Card (PropertyDetailScreen Style) ──
  statsCard: {
    backgroundColor: theme.colors.purewhiteBackground,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  statPill: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    paddingHorizontal: 6
  },
  statPillBorder: {
    borderRightColor: "#F0F0F0",
    borderRightWidth: 1
  },
  statValue: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    textAlign: "center"
  },
  statLabel: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    textAlign: "center"
  },
  // ── Sections & Cards ──
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2
  },
  sectionTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 15
  },
  sectionActionText: {
    color: theme.colors.graysubtext,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13
  },
  cardContainer: {
    backgroundColor: theme.colors.purewhiteBackground,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1
  },
  // ── Info Rows ──
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 13
  },
  infoRowBorder: {
    borderBottomColor: "#F4F4F4",
    borderBottomWidth: 1
  },
  infoIconWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  infoTextWrap: {
    flex: 1,
    marginLeft: 12
  },
  infoLabel: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5
  },
  infoValue: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    marginTop: 1
  },
  infoSubvalue: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5,
    marginTop: 2
  },
  badge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4
  },
  badgeText: {
    color: "#2E7D32",
    fontFamily: theme.fonts.semiBold,
    fontSize: 11.5
  },
  // ── Logout Button ──
  logoutButton: {
    alignItems: "center",
    backgroundColor: "#FFF5F5",
    borderColor: "#FECDCA",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 6,
    paddingVertical: 14
  },
  logoutText: {
    color: "#D92D20",
    fontFamily: theme.fonts.bold,
    fontSize: 14
  },
  // ── Error & Footer ──
  errorBox: {
    alignItems: "center",
    backgroundColor: "#FEF3F2",
    borderColor: "#FECDCA",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    padding: 12
  },
  errorText: {
    color: "#B42318",
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12.5
  },
  footerText: {
    color: "#AAAAAA",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5,
    marginTop: 4,
    textAlign: "center"
  },
  // ── Modal Styles ──
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end"
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: "75%",
    maxHeight: "85%"
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingBottom: 4,
    paddingTop: 10
  },
  dragHandle: {
    backgroundColor: "#DDDDDD",
    borderRadius: 3,
    height: 5,
    width: 40
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: "#F5F5F5",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 8
  },
  modalTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 19
  },
  modalSubtitle: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12.5,
    marginTop: 2
  },
  modalCloseBtn: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  modalBody: {
    flex: 1
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 36
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAEAEA",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden"
  }
});
