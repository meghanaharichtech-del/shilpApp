import { formatPropertyPrice } from '../utils/propertyPrice';
import { resolveMediaUrl } from '../utils/mediaUrl';
import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { ArrowUpRight, MapPin } from "lucide-react-native";
import FavoriteHeartButton from "./FavoriteHeartButton";
import FavoriteHeartOverlay from "./FavoriteHeartOverlay";
import { theme } from "../utils/theme";

const FALLBACK_IMAGE = require("../assets/defaultnoimg.png");
const firstImage = (project) =>
  project?.bannerImage ||
  project?.gallery?.[0] ||
  project?.elevationGallery?.[0] ||
  null;

const imageSource = (imagePath) => {
  const uri = resolveMediaUrl(imagePath);
  return uri ? { uri } : FALLBACK_IMAGE;
};

const statusLabel = (status) => {
  if (!status) return "Available";
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};



export default function PropertyCard({ project: item, onPress }) {
    const imageUrl = firstImage(item);
    const location =
      item.address || item.location?.name || "Location details coming soon";
    const price = formatPropertyPrice(item);
    // console.log("PROJECT:", item.name);
    // console.log("PLOT DETAILS:", item.plotDetails);
    // console.log("CONFIGURATIONS:", item.configurations);
    // isDebug && console.log(
    //   "RAW PRICE:",
    //   item.price || item.plotDetails?.price || item.configurations?.[0]?.price
    // );
    return (
      <Pressable
        style={styles.projectCard}
        android_ripple={{ color: "#999898ff" }}
        onPress={onPress}
      >
        <View style={styles.imageWrap}>
          <Image
            source={imageSource(imageUrl)}
            style={styles.projectImage}
            defaultSource={require("../assets/defaultnoimg.png")}
          />
          <View
            style={[
              styles.statusPill,
              item.status === "ready-possession" && styles.readyDot,
            ]}
          >
            {/* <View
              style={[
                styles.statusDot,
                item.status === "ready-possession" && styles.readyDot,
              ]}
            /> */}
            <Text
              style={[
                styles.statusText,
                {
                  color:
                    item.status === "ready-possession"
                      ? theme.colors.purewhiteBackground
                      : theme.colors.subText,
                },
              ]}
            >
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>
        <View style={styles.projectInfo}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={styles.projectName}>
              {item.name || "Untitled project"}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={15} color="#676767" />
            <Text numberOfLines={1} style={styles.detailText}>
              {location}
            </Text>
          </View>
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>
              {item.projectType || item.category || "Project"}
            </Text>
          </View>
          <View style={styles.priceRow}>
              <Text style={styles.priceText}>{price || "Price on request"}</Text>
            </View>
        </View>
        <View style={styles.cardActions}>
          <FavoriteHeartButton project={item} style={styles.heartButton} />
          <View style={styles.arrowButton}>
            <ArrowUpRight size={19} color="#C96A10" />
          </View>
        </View>
        <FavoriteHeartOverlay project={item} />
      </Pressable>
    );
  }

const styles = StyleSheet.create({
  projectCard: {
    backgroundColor: theme.colors.whiteBackground,
    borderColor: "#F0F0F0",
    borderRadius: 10,
    borderWidth: 1,
    elevation: 0.7,
    flexDirection: "row",
    marginBottom: 10,
    minHeight: 132,
    overflow: "hidden",
    padding: 6,
    gap: 10,
    alignSelf: "stretch",
  },
  imageWrap: { borderRadius: 8, overflow: "hidden", width: "40%" },
  projectImage: { ...StyleSheet.absoluteFillObject },
  statusPill: {
    alignItems: "center",
    backgroundColor: theme.colors.bordergray,
    borderRadius: 6,
    flexDirection: "row",
    // left: 8,
    maxWidth: 120,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: "absolute",
    top: 5,
    right: 5,
  },
  statusDot: {
    // backgroundColor: "#FA7200",
    borderRadius: 5,
    height: 8,
    // marginRight: 6,
    width: 8,
  },
  readyDot: { backgroundColor: theme.colors.subTextsmall },
  statusText: {
    // color: theme.colors.purewhiteBackground,
    fontFamily: theme.fonts.medium,
    fontSize: 10,
  },
  projectInfo: {
    flex: 1,
    minWidth: 0,
    gap: 8,
    // flex:1,
    // width:80 ,
    // justifyContent: "center",
    // paddingHorizontal: ,
    // paddingRight: 2,
  },
  nameRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 6,
    justifyContent: "space-between",
    backgroundColor: "",
    width: "100%",
  },
  projectName: {
    color: theme.colors.blackText,
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 16,
    // lineHeight: 23,
  },
  detailRow: {
    // alignItems: "center",
    flexDirection: "row",
    gap: 6,
    // marginTop: 8,
  },
  detailText: {
    color: theme.colors.graysubtext,
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    // lineHeight: 17,
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#FFF1E2",
    borderRadius: 4,
    // marginTop: 8,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  categoryText: {
    color: "#A4530B",
    fontFamily: theme.fonts.medium,
    fontSize: 11,
    textTransform: "capitalize",
  },
  cardActions: { width: 44, alignItems: "center", justifyContent: "space-between" },
  heartButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  priceRow: {
    flexWrap: "wrap",
    alignItems: "center",
    flexDirection: "row",
    gap: 2,
    // alignItems:"center"

    // marginTop: 11,
    // backgroundColor:"red"
  },
  priceText: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.medium,
    fontSize: 15,
  },
  onwardsText: {
    color: theme.colors.subText,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    textAlign: "center",
  },
  arrowButton: {
    alignItems: "center",
    alignSelf: "flex-end",
    backgroundColor: "#FFF0DE",
    borderRadius: 19,
    height: 38,
    justifyContent: "center",
    marginBottom: 5,
    width: 38,
  },
});
