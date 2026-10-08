import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowUpRight,
  BellDot,
  MapPin,
  Search,
  Settings,
  SlidersHorizontal,
  WifiOff,
  X,
} from "lucide-react-native";
import axios from "axios";
import { BASEURL, PROJECTS_API } from "../utils/ApiHelper";
import { theme } from "../utils/theme";
import { StorageUtils } from "../utils/StorageUtils";
import { showToastMSGNormal } from "../utils/ToastMessages";

const FALLBACK_IMAGE = require("../assets/defaultnoimg.png");
const BANNER_IMAGES = [
  require("../assets/BannerImg1.png"),
  require("../assets/BannerImg2.png"),
  require("../assets/BannerImg3.png"),
];
const BANNER_AUTO_SLIDE_DURATION = 3500;
const ACTIVE_DOT_WIDTH = 28;
const PAGE_SIZE = 20;

const firstImage = (project) =>
  project?.bannerImage ||
  project?.gallery?.[0] ||
  project?.elevationGallery?.[0] ||
  null;

const imageSource = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(imagePath)) return { uri: imagePath };

  return {
    uri: `${BASEURL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`,
  };
};

const statusLabel = (status) => {
  if (!status) return "Available";
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatPrice = (price) => {
  const value = Number(price);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 10000000)
    return `₹ ${(value / 10000000).toFixed(value % 10000000 ? 2 : 0)} Cr`;
  if (value >= 100000)
    return `₹ ${(value / 100000).toFixed(value % 100000 ? 2 : 0)} Lakh`;
  return `₹ ${value.toLocaleString("en-IN")}`;
};

const HomeScreen = ({ navigation }) => {
  const [projects, setProjects] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const carouselRef = useRef(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const [carouselWidth, setCarouselWidth] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isAutoScrollingRef = useRef(false);
  const slideIndexRef = useRef(0);
  slideIndexRef.current = slideIndex;
  const [categoryOffset, setCategoryOffset] = useState(null);
  const [isCategorySticky, setIsCategorySticky] = useState(false);

  const loadProjects = useCallback(
    async (searchText = "", category = "All", isRefresh = false) => {
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError("");
      try {
        const userData = await StorageUtils.getItem("userData");
        const accessToken =
          userData?.token ||
          userData?.accessToken ||
          userData?.data?.accessToken;
        if (!accessToken) {
          throw new Error("Your session has expired. Please sign in again.");
        }
        const params = { page: 1, limit: PAGE_SIZE };
        if (searchText.trim()) params.search = searchText.trim();
        if (category !== "All") params.category = category.toLowerCase();

        const response = await axios.get(PROJECTS_API, {
          params,
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        // console.log("--------", response);

        if (!response.data?.success)
          throw new Error("Unable to load projects.");
        setProjects(
          Array.isArray(response.data.projects) ? response.data.projects : [],
        );
        setPagination(response.data.pagination ?? null);
      } catch (error) {
        console.log(
          "Failed to load projects:",
          error?.response?.status || error?.message,
        );
        setProjects([]);
        setError(
          error?.response?.data?.message ||
            error?.message ||
            "Could not load projects. Check your connection and try again.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(
      () => loadProjects(query, activeCategory),
      query ? 350 : 0,
    );
    return () => clearTimeout(timer);
  }, [activeCategory, loadProjects, query]);

  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(0);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: BANNER_AUTO_SLIDE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished) {
        if (carouselWidth <= 0 || BANNER_IMAGES.length <= 1) return;
        const next = (slideIndexRef.current + 1) % BANNER_IMAGES.length;
        isAutoScrollingRef.current = true;
        carouselRef.current?.scrollTo({
          x: next * carouselWidth,
          animated: true,
        });
        setSlideIndex(next);
      }
    });

    return anim;
  }, [carouselWidth, progressAnim]);

  // Auto-slide banner carousel with animated progress bar
  useEffect(() => {
    if (carouselWidth <= 0 || BANNER_IMAGES.length <= 1) return;
    const anim = startProgressAnimation();
    return () => {
      anim.stop();
    };
  }, [slideIndex, carouselWidth, startProgressAnimation]);

  const onBannerScrollBeginDrag = useCallback(() => {
    isAutoScrollingRef.current = false;
    progressAnim.stopAnimation();
  }, [progressAnim]);

  const onBannerMomentumScrollEnd = useCallback(
    (event) => {
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        return;
      }
      if (carouselWidth <= 0) return;
      const newIndex = Math.round(
        event.nativeEvent.contentOffset.x / carouselWidth,
      );
      if (newIndex >= 0 && newIndex < BANNER_IMAGES.length) {
        if (newIndex === slideIndex) {
          startProgressAnimation();
        } else {
          setSlideIndex(newIndex);
        }
      }
    },
    [carouselWidth, slideIndex, startProgressAnimation],
  );

  const categories = useMemo(
    () => ["All", "Residential", "Commercial", "Plot"],
    [],
  );

  const selectCategory = (category) => {
    setActiveCategory(category);
    showToastMSGNormal("hello")
  };

  const renderCategoryChips = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryList}
    >
      {categories.map((category) => (
        <Pressable
          key={category}
          onPress={() => selectCategory(category)}
          style={[
            styles.categoryChip,
            activeCategory === category && styles.categoryChipActive,
          ]}
        >
          <Text
            style={[
              styles.categoryChipText,
              activeCategory === category && styles.categoryChipTextActive,
            ]}
          >
            {category === "All"
              ? `${category} (${pagination?.total ?? projects.length})`
              : category}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderProject = ({ item }) => {
    const imageUrl = firstImage(item);
    const location =
      item.address || item.location?.name || "Location details coming soon";
 const rawPrice =
  item.plotDetails?.price ??
  item.configurations?.[0]?.price ??
  null;

const price = rawPrice !== null
  ? formatPrice(rawPrice)
  : "₹ 45L";
// console.log("PROJECT:", item.name);
// console.log("PLOT DETAILS:", item.plotDetails);
// console.log("CONFIGURATIONS:", item.configurations);
// console.log(
//   "RAW PRICE:",
//   item.plotDetails?.price || item.configurations?.[0]?.price
// );
    return (
      <Pressable
        style={styles.projectCard}
        android_ripple={{ color: "#999898ff" }}
        
        onPress={() => navigation.navigate("PropertyDetailScreen", { project: item })
      }
      >
        <View style={styles.imageWrap}>
          <Image source={imageSource(imageUrl)} style={styles.projectImage} defaultSource={require("../assets/defaultnoimg.png")} />
          <View  style={[
                styles.statusPill,
                item.status === "ready-possession" && styles.readyDot,
              ]}>
            {/* <View
              style={[
                styles.statusDot,
                item.status === "ready-possession" && styles.readyDot,
              ]}
            /> */}
            <Text style={[styles.statusText,{color:item.status === "ready-possession"?theme.colors.purewhiteBackground:theme.colors.subText}]}>{statusLabel(item.status)}</Text>
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
          {price ? (
            <View style={styles.priceRow}>
              <Text style={styles.priceText}>{price ? `${price}`:"45L"}</Text>
              <Text style={styles.onwardsText}> Onwards</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.arrowButton}>
          <ArrowUpRight size={19} color="#C96A10" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>SHILP</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => navigation.navigate("NotificationScreen")}
            style={styles.iconButton}
            hitSlop={8}
          >
            <BellDot size={21} color="#111111" />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate("ProfileScreen")}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Settings size={21} color="#111111" />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item, index) => item._id || item.slug || String(index)}
        renderItem={renderProject}
        // style={{ gap: 16 }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          if (categoryOffset === null) return;
          const shouldStick =
            event.nativeEvent.contentOffset.y >= categoryOffset;
          setIsCategorySticky((current) =>
            current === shouldStick ? current : shouldStick,
          );
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadProjects(query, activeCategory, true)}
            tintColor="#FA7200"
          />
        }
        ListHeaderComponent={
          <>
            <View
              style={styles.carouselWrap}
              onLayout={(event) =>
                setCarouselWidth(event.nativeEvent.layout.width)
              }
            >
              <ScrollView
                ref={carouselRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.carousel}
                onScrollBeginDrag={onBannerScrollBeginDrag}
                onMomentumScrollEnd={onBannerMomentumScrollEnd}
              >
                {BANNER_IMAGES.map((image, index) => (
                  <View
                    key={`banner-${index}`}
                    style={[
                      styles.slide,
                      carouselWidth > 0 && { width: carouselWidth },
                    ]}
                  >
                    <Image
                      source={image}
                      style={styles.banner}
                      resizeMode="cover"
                    />
                  </View>
                ))}
              </ScrollView>
              {BANNER_IMAGES.length > 1 && (
                <View style={styles.dots}>
                  {BANNER_IMAGES.map((_, index) => {
                    const isActive = index === slideIndex;
                    return (
                      <Pressable
                        key={`banner-dot-${index}`}
                        onPress={() => {
                          if (index !== slideIndex && carouselWidth > 0) {
                            carouselRef.current?.scrollTo({
                              x: index * carouselWidth,
                              animated: true,
                            });
                            setSlideIndex(index);
                          }
                        }}
                        style={[
                          styles.dot,
                          isActive && styles.activeDotTrack,
                        ]}
                      >
                        {isActive && (
                          <Animated.View
                            style={[
                              styles.activeDotFill,
                              {
                                width: progressAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, ACTIVE_DOT_WIDTH],
                                }),
                              },
                            ]}
                          />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.searchRow}>
              <View style={styles.searchBox}>
                <Search size={21} color="#191919" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Search projects, locations..."
                  placeholderTextColor="#8A8A8A"
                  style={styles.searchInput}
                  returnKeyType="search"
                />
                {query ? (
                  <Pressable onPress={() => setQuery("")}>
                    <X size={19} color="#555" />
                  </Pressable>
                ) : null}
              </View>
              <Pressable
                onPress={() => selectCategory("All")}
                style={styles.filterButton}
              >
                <SlidersHorizontal size={22} color="#141414" />
              </Pressable>
            </View>

            <View
              onLayout={(event) =>
                setCategoryOffset(event.nativeEvent.layout.y)
              }
            >
              {renderCategoryChips()}
            </View>

            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Featured Projects</Text>
              <Text style={styles.viewAll}>View all</Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              {error ? (
                <WifiOff size={28} color="#777" />
              ) : (
                <Search size={28} color="#777" />
              )}
              <Text style={styles.emptyTitle}>
                {error ? "Projects unavailable" : "No projects found"}
              </Text>
              <Text style={styles.emptyText}>
                {error || "Try changing your search or filters."}
              </Text>
              <Pressable
                onPress={() => loadProjects(query, activeCategory)}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Try again</Text>
              </Pressable>
            </View>
          ) : null
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              size="small"
              color="#FA7200"
              style={styles.loader}
            />
          ) : (
            <View style={styles.footerSpace} />
          )
        }
      />
      {isCategorySticky && (
        <View style={styles.stickyCategoryBar}>{renderCategoryChips()}</View>
      )}
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  listContent: { paddingHorizontal: 16, paddingBottom: 104 },
  header: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    paddingHorizontal: 16,
    // height: 70,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  logo: {
    color: "#0D0D0D",
    fontFamily: theme.fonts.extraBold,
    fontSize: 26,
    letterSpacing: 3,
    // marginLeft: 3,
  },
  logoGroup: {
    color: "#8B8B8B",
    fontFamily: theme.fonts.medium,
    fontSize: 13,
    letterSpacing: 5.5,
    marginLeft: 3,
    marginTop: 3,
  },
  headerActions: { flexDirection: "row", gap: 10 },
  iconButton: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  carouselWrap: { marginBottom: 10, width: "100%" },
  carousel: { width: "100%" },
  slide: { paddingRight: 5 },
  banner: {
    backgroundColor: "#EDEDED",
    borderRadius: 10,
    height: 138,
    width: "100%",
  },
  dots: {
    bottom: 10,
    flexDirection: "row",
    gap: 6,
    left: 18,
    position: "absolute",
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.42)",
    borderRadius: 3,
    height: 4,
    width: 10,
  },
  activeDotTrack: {
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: 3,
    height: 4,
    overflow: "hidden",
    width: ACTIVE_DOT_WIDTH,
  },
  activeDotFill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    height: "100%",
  },
  searchRow: { flexDirection: "row", gap: 9, marginBottom: 10 },
  searchBox: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    flex: 1,
    flexDirection: "row",
    // height: 46,
    // paddingVertical: 1,
    paddingHorizontal: 17,
  },
  searchInput: {
    color: theme.colors.blackText,
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 15,
    // height: "100%",
    marginLeft: 11,
  },
  filterButton: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    // height: 36,
    padding: 12,
    justifyContent: "center",
    // width: 56,
  },
  filterButtonActive: { backgroundColor: theme.colors.borderlightgraycolour },
  categoryList: { gap: 9, paddingBottom: 10 },
  stickyCategoryBar: {
    backgroundColor: "#FFFFFF",
    left: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    position: "absolute",
    right: 0,
    top: 88,
    zIndex: 10,
  },
  categoryChip: {
    backgroundColor: "#F6F6F6",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  categoryChipActive: { backgroundColor: "#121212" },
  categoryChipText: {
    color: "#242424",
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  categoryChipTextActive: { color: theme.colors.purewhiteBackground },
  sectionHeading: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    // marginTop: 32,
  },
  sectionTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 18,
  },
  projectCount: {
    color: "#7B7B7B",
    fontFamily: theme.fonts.regular,
    fontSize: 18,
  },
  viewAll: {
    color: theme.colors.graysubtext,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  projectCard: {
    backgroundColor: theme.colors.whiteBackground,
    borderColor: "#F0F0F0",
    borderRadius: 10,
    borderWidth: 1,
    elevation: 0.7,
    flexDirection: "row",
    marginBottom: 10,
    // minHeight: 168,
    overflow: "hidden",
    padding: 6,
    gap:10,flex:1
  },
  imageWrap: { borderRadius: 8, overflow: "hidden", width: "40%",},
  projectImage: { height: "100%", width: "100%" },
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
    right:5
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
width:"57%",
gap:8,
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
    backgroundColor:"",
    width:"100%"
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
  priceRow: {
    alignItems: "center",
    flexDirection: "row",
    gap:2,
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
    textAlign:"center"
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
  loader: { marginTop: 32 },
  footerSpace: { height: 6 },
  emptyState: { alignItems: "center", paddingHorizontal: 30, paddingTop: 38 },
  emptyTitle: {
    color: "#202020",
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    marginTop: 11,
  },
  emptyText: {
    color: "#777777",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#171717",
    borderRadius: 18,
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
  },
});