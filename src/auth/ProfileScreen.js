import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import {
  BadgeCheck,
  Building2,
  ChevronRight,
  CreditCard,
  FileCheck2,
  FileText,
  HelpCircle,
  Landmark,
  LogOut,
  Mail,
  MapPin,
  MapPinned,
  Percent,
  Phone,
  Receipt,
  Share2,
  ShieldAlert,
  ShieldCheck,
  User,
  Wallet,
  X,
} from "lucide-react-native";
import { PROFILE_API } from "../utils/ApiHelper";
import { StorageUtils } from "../utils/StorageUtils";
import { theme } from "../utils/theme";

const getAccessToken = (userData) =>
  userData?.token || userData?.accessToken || userData?.data?.accessToken;

const displayValue = (value, fallback = "Not provided") => {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim();
};

const StatPill = ({ icon: Icon, value, label, isLast = false, color }) => (
  <View style={[styles.statPill, !isLast && styles.statPillBorder]}>
    <Icon size={18} color={color || "#C96A10"} strokeWidth={1.8} />
    <Text style={[styles.statValue, color ? { color } : null]} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoRow = ({
  icon: Icon,
  label,
  value,
  subvalue,
  isLast = false,
  badgeText,
  badgeColor,
  onPress,
}) => {
  const content = (
    <View style={[styles.infoRow, !isLast && styles.infoRowBorder]}>
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
      {badgeText ? (
        <View
          style={[
            styles.badge,
            badgeColor ? { backgroundColor: badgeColor.bg } : null,
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              badgeColor ? { color: badgeColor.text } : null,
            ]}
          >
            {badgeText}
          </Text>
        </View>
      ) : onPress ? (
        <ChevronRight size={18} color={theme.colors.grayiconcolor} />
      ) : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} android_ripple={{ color: "#EAEAEA" }}>
        {content}
      </Pressable>
    );
  }

  return content;
};

const ProfileScreen = ({ navigation }) => {
  const [broker, setBroker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [companyModalVisible, setCompanyModalVisible] = useState(false);

  const loadProfile = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError("");
    try {
      const userData = await StorageUtils.getItem("userData");
      const token = getAccessToken(userData);
      if (!token) {
        throw new Error("Your session has expired. Please sign in again.");
      }

      const response = await axios.get(PROFILE_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data?.success || !response.data?.broker) {
        throw new Error(
          response.data?.message || "Unable to load your profile.",
        );
      }
      setBroker(response.data.broker);
      await StorageUtils.setItem("brokerProfile", response.data.broker);
    } catch (requestError) {
      const cachedProfile = await StorageUtils.getItem("brokerProfile");
      if (cachedProfile) setBroker(cachedProfile);
      setError(
        requestError?.response?.data?.message ||
          requestError?.message ||
          "Could not load your profile.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out from Shilp App?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            try {
              await StorageUtils.removeItem("userData");
              await StorageUtils.removeItem("brokerProfile");
              navigation.reset({
                index: 0,
                routes: [{ name: "LoginScreen" }],
              });
            } catch (err) {
              navigation.navigate("LoginScreen");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  // Derived company and business fields
  const companyName =
    broker?.companyName || broker?.company?.name || broker?.company || "";
  const registrationNo =
    broker?.companyRegistration || broker?.reraNumber || broker?.registrationNumber || "";
  const gstNumber = broker?.gstNumber || "";
  const panNumber = broker?.panNumber || "";
  const aadhaarNumber = broker?.aadhaarNumber || "";
  const officeAddress = broker?.companyAddress || broker?.address || "";
  const cityStateZip = [broker?.city, broker?.state, broker?.zipCode]
    .filter(Boolean)
    .join(", ");
  const commission =
    broker?.commissionRate != null ? `${broker.commissionRate}%` : "2.0%";
  const kycStatus = broker?.kycStatus || (broker?.isVerified ? "verified" : "pending");
  const isKycVerified = kycStatus === "verified" || broker?.isVerified;

  const kycBadge = isKycVerified
    ? { bg: "#E8F5E9", text: "#2E7D32", label: "Verified" }
    : kycStatus === "submitted"
      ? { bg: "#E3F2FD", text: "#1565C0", label: "Under Review" }
      : { bg: "#FFF3E0", text: "#E65100", label: "Pending" };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.center]} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.colors.orangeColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProfile(true)}
            colors={[theme.colors.orangeColor]}
            tintColor={theme.colors.orangeColor}
          />
        }
      >
        {/* ── Top Header ── */}
        <View style={styles.headerRow}>
          <Text style={styles.screenTitle}>Profile</Text>
          <View style={styles.partnerBadge}>
            <Text style={styles.partnerBadgeText}>
              {broker?.role === "admin" ? "Channel Partner" : "Channel Partner"}
            </Text>
          </View>
        </View>

        {/* ── Hero Profile Card ── */}
        <View style={styles.heroCard}>
          <View style={styles.avatarWrap}>
            {broker?.profilePhoto ? (
              <Image
                source={{ uri: broker.profilePhoto }}
                style={styles.avatarImg}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {broker?.name?.charAt(0)?.toUpperCase() ||
                    broker?.firstName?.charAt(0)?.toUpperCase() ||
                    "U"}
                </Text>
              </View>
            )}
            {isKycVerified && (
              <View style={styles.avatarBadge}>
                <BadgeCheck size={18} color="#2E7D32" />
              </View>
            )}
          </View>

          <View style={styles.heroText}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {displayValue(broker?.name || `${broker?.firstName || ""} ${broker?.lastName || ""}`.trim())}
              </Text>
            </View>

            {broker?.email ? (
              <View style={styles.contactItem}>
                <Mail size={13} color="#777777" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {broker.email}
                </Text>
              </View>
            ) : null}

            {broker?.phone ? (
              <View style={styles.contactItem}>
                <Phone size={13} color="#777777" />
                <Text style={styles.contactText}>{broker.phone}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <ShieldAlert size={16} color="#B42318" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Quick Stats Card (Theme-aligned with PropertyDetailScreen) ── */}
        <View style={styles.statsCard}>
          <StatPill
            icon={Percent}
            value={commission}
            label="Commission"
          />
          <StatPill
            icon={ShieldCheck}
            value={kycBadge.label}
            label="KYC Status"
            color={kycBadge.text}
          />
          <StatPill
            icon={Share2}
            value={broker?.referralCode || "—"}
            label="Partner Code"
            isLast
          />
        </View>

        {/* ── Company & Business Details (Expanded & Detailed) ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Company Details</Text>
          <Pressable
            onPress={() => setCompanyModalVisible(true)}
            hitSlop={8}
          >
            <Text style={styles.sectionActionText}>View Full Sheet</Text>
          </Pressable>
        </View>

        <View style={styles.cardContainer}>
          <InfoRow
            icon={Building2}
            label="Company Name"
            value={companyName}
            subvalue={registrationNo ? `Reg / RERA: ${registrationNo}` : null}
          />
          <InfoRow
            icon={Receipt}
            label="GSTIN / Tax ID"
            value={gstNumber}
          />
          <InfoRow
            icon={CreditCard}
            label="PAN Number"
            value={panNumber}
          />
          <InfoRow
            icon={MapPin}
            label="Office Address"
            value={officeAddress}
            subvalue={cityStateZip || null}
            isLast
          />
        </View>

        {/* ── Bank & Payout Details ── */}
        {broker?.bankDetails && Object.keys(broker.bankDetails).length > 0 ? (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Banking & Payouts</Text>
            </View>
            <View style={styles.cardContainer}>
              <InfoRow
                icon={Landmark}
                label="Bank Name"
                value={broker.bankDetails?.bankName}
              />
              <InfoRow
                icon={User}
                label="Account Holder"
                value={broker.bankDetails?.accountHolderName || broker?.name}
              />
              <InfoRow
                icon={Wallet}
                label="Account Number"
                value={
                  broker.bankDetails?.accountNumber
                    ? `•••• •••• ${String(broker.bankDetails.accountNumber).slice(-4)}`
                    : null
                }
                subvalue={broker.bankDetails?.ifsc ? `IFSC: ${broker.bankDetails.ifsc}` : null}
                isLast
              />
            </View>
          </>
        ) : null}

        {/* ── Support & Legal ── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Support & Compliance</Text>
        </View>

        <View style={styles.cardContainer}>
          <InfoRow
            icon={ShieldCheck}
            label="Privacy Policy"
            value="View legal terms and data privacy"
            onPress={() =>
              Alert.alert(
                "Privacy Policy",
                "Shilp App prioritizes your privacy. Your data, customer leads, and business information are securely encrypted and protected in accordance with real estate regulatory standards.",
              )
            }
          />
          <InfoRow
            icon={FileText}
            label="Terms & Conditions"
            value="Channel partner agreement"
            onPress={() =>
              Alert.alert(
                "Terms & Conditions",
                "As a registered channel partner with Shilp App, all commission payouts, project presentations, and client registrations are governed by the broker policy agreement.",
              )
            }
          />
          <InfoRow
            icon={HelpCircle}
            label="Help & Partner Support"
            value="support@shilpgroup.com"
            isLast
            onPress={() => {
              Linking.openURL("mailto:support@shilpgroup.com").catch(() => {});
            }}
          />
        </View>

        {/* ── Logout Button ── */}
        <Pressable
          style={styles.logoutButton}
          onPress={handleLogout}
          android_ripple={{ color: "#FFE8E8" }}
        >
          <LogOut size={18} color="#D92D20" />
          <Text style={styles.logoutText}>Log Out</Text>
        </Pressable>

        <Text style={styles.footerText}>
          Shilp App • Channel Partner v1.0.0
        </Text>
      </ScrollView>

      {/* ── Full Company Details Modal ── */}
      <Modal
        visible={companyModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setCompanyModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setCompanyModalVisible(false)}
        >
          <View
            style={styles.modalSheet}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.dragHandleWrap}>
              <View style={styles.dragHandle} />
            </View>

            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Company Profile</Text>
                <Text style={styles.modalSubtitle}>
                  Verified Channel Partner Information
                </Text>
              </View>
              <Pressable
                style={styles.modalCloseBtn}
                onPress={() => setCompanyModalVisible(false)}
                hitSlop={10}
              >
                <X size={19} color="#191919" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={styles.modalBodyContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalCard}>
                <InfoRow
                  icon={Building2}
                  label="Registered Entity"
                  value={companyName}
                />
                <InfoRow
                  icon={FileCheck2}
                  label="RERA / Registration No."
                  value={registrationNo}
                />
                <InfoRow
                  icon={Receipt}
                  label="GSTIN"
                  value={gstNumber}
                />
                <InfoRow
                  icon={CreditCard}
                  label="PAN Number"
                  value={panNumber}
                />
                {aadhaarNumber ? (
                  <InfoRow
                    icon={FileText}
                    label="Aadhaar No."
                    value={`•••• •••• ${String(aadhaarNumber).slice(-4)}`}
                  />
                ) : null}
                <InfoRow
                  icon={MapPin}
                  label="Office Address"
                  value={officeAddress}
                />
                <InfoRow
                  icon={MapPinned}
                  label="City, State & Zip"
                  value={cityStateZip}
                  isLast
                />
              </View>
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.backgroundmaincolor,
    flex: 1,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    gap: 14,
    padding: 16,
    paddingBottom: 110,
  },

  // ── Header ──
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  screenTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 26,
  },
  partnerBadge: {
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  partnerBadgeText: {
    color: "#555555",
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    alignItems: "center",
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 30,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  avatarImg: {
    borderRadius: 30,
    height: 60,
    width: 60,
  },
  avatarText: {
    color: theme.colors.whiteText,
    fontFamily: theme.fonts.bold,
    fontSize: 24,
  },
  avatarBadge: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    bottom: -2,
    position: "absolute",
    right: -2,
  },
  heroText: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  name: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
  },
  contactItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  contactText: {
    color: "#666666",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  statPill: {
    alignItems: "center",
    flex: 1,
    gap: 4,
    paddingHorizontal: 6,
  },
  statPillBorder: {
    borderRightColor: "#F0F0F0",
    borderRightWidth: 1,
  },
  statValue: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 14,
    textAlign: "center",
  },
  statLabel: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    textAlign: "center",
  },

  // ── Sections & Cards ──
  sectionHeaderRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 15,
  },
  sectionActionText: {
    color: theme.colors.graysubtext,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
  },
  cardContainer: {
    backgroundColor: theme.colors.purewhiteBackground,
    borderColor: "#EAEAEA",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },

  // ── Info Rows ──
  infoRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoRowBorder: {
    borderBottomColor: "#F4F4F4",
    borderBottomWidth: 1,
  },
  infoIconWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  infoTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5,
  },
  infoValue: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
    marginTop: 1,
  },
  infoSubvalue: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "#E8F5E9",
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#2E7D32",
    fontFamily: theme.fonts.semiBold,
    fontSize: 11.5,
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
    paddingVertical: 14,
  },
  logoutText: {
    color: "#D92D20",
    fontFamily: theme.fonts.bold,
    fontSize: 14,
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
    padding: 12,
  },
  errorText: {
    color: "#B42318",
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12.5,
  },
  footerText: {
    color: "#AAAAAA",
    fontFamily: theme.fonts.regular,
    fontSize: 11.5,
    marginTop: 4,
    textAlign: "center",
  },

  // ── Modal Styles ──
  modalOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: "75%",
    maxHeight: "85%",
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingBottom: 4,
    paddingTop: 10,
  },
  dragHandle: {
    backgroundColor: "#DDDDDD",
    borderRadius: 3,
    height: 5,
    width: 40,
  },
  modalHeader: {
    alignItems: "center",
    borderBottomColor: "#F5F5F5",
    borderBottomWidth: 1,
    flexDirection: "row",
    paddingBottom: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 19,
  },
  modalSubtitle: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12.5,
    marginTop: 2,
  },
  modalCloseBtn: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 36,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EAEAEA",
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
});
