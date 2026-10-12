import FavoriteHeartOverlay from "../components/FavoriteHeartOverlay";
import React, { useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { ArrowLeft, Heart, MapPin } from "lucide-react-native";
import { useFavorites } from "../context/FavoritesContext";
import FavoriteHeartButton from "../components/FavoriteHeartButton";
import { theme } from "../utils/theme";
import { BASEURL } from "../utils/ApiHelper";
export default function FavoritesScreen({ navigation }) {
  const { projects, loading, loaded, error, refreshFavorites } = useFavorites();
  useFocusEffect(
    useCallback(() => {
      refreshFavorites().catch(() => {});
    }, [refreshFavorites]),
  );
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={21} color={theme.colors.blackText} />
        </Pressable>
        <Text style={styles.heading}>Favourite properties</Text>
        <View style={styles.headerSpacer} />
      </View>
      {error && (
        <Pressable
          onPress={() => refreshFavorites().catch(() => {})}
          style={styles.error}
        >
          <Text>{error}</Text>
          <Text style={styles.retry}>Tap to retry</Text>
        </Pressable>
      )}
      {loading && !loaded ? (
        <ActivityIndicator style={styles.loading} color="#191919" />
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={projects}
          keyExtractor={(item) => String(item._id || item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={() => refreshFavorites().catch(() => {})}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Heart size={40} color="#999999" />
              <Text style={styles.emptyTitle}>No favourites yet</Text>
              <Text style={styles.subtitle}>
                Tap a property heart to save it here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const image = item.bannerImage || item.gallery?.[0];
            const price =
              item.plotDetails?.price ?? item.configurations?.[0]?.price;
            return (
              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.card,
                  pressed && styles.pressed,
                ]}
                onPress={() =>
                  navigation.navigate("PropertyDetailScreen", { project: item })
                }
              >
                <Image
                  source={
                    image
                      ? {
                          uri: /^https?:\/\//.test(image)
                            ? image
                            : `${BASEURL.replace(/\/$/, "")}/${image.replace(/^\//, "")}`,
                        }
                      : require("../assets/defaultnoimg.png")
                  }
                  style={styles.image}
                />
                <View style={styles.info}>
                  <Text numberOfLines={2} style={styles.name}>
                    {item.name || "Property"}
                  </Text>
                  <View style={styles.location}>
                    <MapPin size={14} color="#777777" />
                    <Text numberOfLines={1} style={styles.address}>
                      {item.address || "Location pending"}
                    </Text>
                  </View>
                  <View style={styles.categoryPill}>
                              <Text style={styles.categoryText}>
                                {item.projectType || item.category || "Project"}
                              </Text>
                            </View>
                  <View style={{flexDirection:"row",justifyContent:"space-between",width:"100%"}}>
                    <View> <Text style={styles.priceText}>
                      {price != null
                        ? `₹ ${Number(price).toLocaleString("en-IN")}`
                        : "₹ 45 Lakh"}
                    </Text></View>
                      <FavoriteHeartButton
                      project={item}
                      style={styles.heartButton}
                    />
                  </View>
                  {/* <View style={styles.price}>
                    <Text style={styles.priceText}>
                      {price != null
                        ? `₹ ${Number(price).toLocaleString("en-IN")}`
                        : "₹ 45 Lakh"}
                    </Text>
                    <FavoriteHeartButton
                      project={item}
                      style={styles.heartButton}
                    />
                  </View> */}
                </View>
                <FavoriteHeartOverlay project={item} />
              </Pressable>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.colors.purewhiteBackground },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    minHeight: 58,
    gap: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
  },
  headerSpacer: { width: 44 },
  heading: {
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.blackText,
  },
  list: {
    paddingHorizontal: 16,
    // paddingTop: 8,
    paddingBottom: 32,
    flexGrow: 1,
  },
  card: {
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
  pressed: { opacity: 0.75 },
  image: {
    // width: "32%",
    // minHeight: 112,
    // alignSelf: "stretch",
    // borderRadius: 7,
    // backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 8, overflow: "hidden", width: "40%",
    height:112
  },
  info: {
    width: "60%",
    justifyContent: "space-between",
    gap: 6,
    paddingVertical: 2,
    paddingRight:5
  },
  name: {
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.blackText,
  },
  location: { flexDirection: "row", alignItems: "center", gap: 5 },
  address: {
    flex: 1,
    color: theme.colors.subText,
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },  categoryPill: {
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
  price: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
    flex:1
  },
  priceText: {
    flex: 1,
    // width:"95%",
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.blackText,
    fontSize: 14,
  },
  heartButton: {
    // width: 44,
    // flex:1,
    // height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
  },
  emptyTitle: {
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    color: theme.colors.blackText,
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.subText,
    textAlign: "center",
  },
  error: {
    backgroundColor: "#FFF1F1",
    padding: 14,
    marginHorizontal: 16,
    borderRadius: 10,
  },
  retry: { marginTop: 5, fontFamily: theme.fonts.bold },
  loading: { marginTop: 40 },
});
