import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ScrollView
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Bell,
  Download,
  FileText,
  RefreshCw,
  Settings,
  Tag,
  X,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { getOffers, downloadOfferFile } from "../utils/offerApi";
import { resolveMediaUrl } from "../utils/mediaUrl";
import { useNotifications } from "../context/NotificationContext";
import NotificationBadge from "../components/NotificationBadge";
import { apiError } from "../utils/brokerApi";
import { theme } from "../utils/theme";
import { Asset } from "expo-asset";
import { File } from "expo-file-system";
import { WebView } from "react-native-webview";
import { loadDocumentFile } from "../utils/documentFiles";

const FALLBACK_BANNER = require("../assets/BannerImg1.png");
const BACKGROUND_IMAGE = require("../assets/LoginScreenbgimg.png");

// Memory cache for prepared PDF preview HTML to avoid re-reading and re-encoding
const pdfThumbnailCache = new Map();
let cachedViewerAssetHtml = null;

function OfferThumbnail({ offer }) {
  const pdfUrl = offer?.pdfUrl ? resolveMediaUrl(offer.pdfUrl) : null;
  const [thumbImage, setThumbImage] = useState(() => (pdfUrl ? pdfThumbnailCache.get(pdfUrl)?.image || null : null));
  const [html, setHtml] = useState(() => (pdfUrl ? pdfThumbnailCache.get(pdfUrl)?.html || null : null));
  const [failed, setFailed] = useState(false);
  const webviewRef = React.useRef(null);
  const base64Ref = React.useRef(pdfUrl ? pdfThumbnailCache.get(pdfUrl)?.encoded || null : null);

  useEffect(() => {
    if (!pdfUrl || pdfThumbnailCache.has(pdfUrl)) return;

    let active = true;

    const preparePreview = async () => {
      setFailed(false);
      try {
        if (!cachedViewerAssetHtml) {
          const asset = await Asset.fromModule(
            require("../assets/pdf-viewer/viewer.html")
          ).downloadAsync();
          if (Platform.OS === "web") {
            const res = await fetch(asset.uri);
            cachedViewerAssetHtml = await res.text();
          } else {
            cachedViewerAssetHtml = await new File(
              asset.localUri || asset.uri
            ).text();
          }
        }

        let encoded = "";
        if (Platform.OS === "web") {
          const pdfRes = await fetch(pdfUrl);
          if (!pdfRes.ok) throw new Error("Could not fetch PDF");
          const blob = await pdfRes.blob();
          encoded = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = () => reject(new Error("Could not read PDF"));
            reader.readAsDataURL(blob);
          });
        } else {
          const file = await loadDocumentFile(pdfUrl, offer?.title || "Offer");
          encoded = await file.base64();
        }

        if (!active) return;

        const thumbnailOverrideCss = `
          <style>
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background-color: #FFFFFF !important;
              overflow: hidden !important;
              width: 100% !important;
              height: 100% !important;
            }
            #toolbar, #status { display: none !important; }
            #pages {
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
              height: 100% !important;
              display: flex !important;
              align-items: flex-start !important;
              justify-content: center !important;
              overflow: hidden !important;
            }
            canvas {
              width: 100% !important;
              height: auto !important;
              max-width: 100% !important;
              display: block !important;
              margin: 0 auto !important;
              box-shadow: none !important;
            }
          </style>
        `;

        let source = cachedViewerAssetHtml.replace("</head>", `${thumbnailOverrideCss}</head>`);
        source = source.replace(
          "if(number===1)send('rendered',String(pdfDocument.numPages));",
          "if(number===1){try{var t=canvas.toDataURL('image/jpeg',0.85);send('thumbnail',t);}catch(e){}send('rendered',String(pdfDocument.numPages));}"
        );
        source = source.replace(
          '<script type="module">',
          `<script>window.initialPdf=${JSON.stringify(encoded)};window.previewOnly=true;</script><script type="module">`
        );

        base64Ref.current = encoded;
        pdfThumbnailCache.set(pdfUrl, { html: source, encoded });
        setHtml(source);
      } catch (_err) {
        if (active) {
          setFailed(true);
        }
      }
    };

    preparePreview();

    return () => {
      active = false;
    };
  }, [pdfUrl, offer?.title]);

  // If we already have the rendered first page thumbnail image
  if (thumbImage) {
    return (
      <View style={styles.thumbnailContainer} pointerEvents="none">
        <Image
          source={{ uri: thumbImage }}
          style={styles.thumbnailImage}
          resizeMode="cover"
        />
      </View>
    );
  }

  // If HTML is ready, render the preview WebView (and capture thumbnail image)
  if (pdfUrl && html && !failed) {
    return (
      <View style={styles.thumbnailContainer} pointerEvents="none">
        {Platform.OS === "web" ? (
          React.createElement("iframe", {
            srcDoc: html,
            title: offer?.title || "PDF Preview",
            style: { width: "100%", height: "100%", border: 0, pointerEvents: "none" },
          })
        ) : (
          <WebView
            ref={webviewRef}
            source={{ html, baseUrl: "https://shilp-viewer.invalid/" }}
            originWhitelist={["*"]}
            javaScriptEnabled
            scrollEnabled={false}
            nestedScrollEnabled={false}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            pointerEvents="none"
            style={styles.thumbnailWebView}
            onMessage={(event) => {
              try {
                const message = JSON.parse(event.nativeEvent.data);
                if (message.type === "thumbnail" && message.message) {
                  setThumbImage(message.message);
                  pdfThumbnailCache.set(pdfUrl, {
                    ...(pdfThumbnailCache.get(pdfUrl) || {}),
                    image: message.message,
                  });
                }
                if (message.type === "ready" && base64Ref.current && !thumbImage) {
                  webviewRef.current?.injectJavaScript(
                    `if(!window.rendered){window.renderPdf(${JSON.stringify(base64Ref.current)}, true); window.rendered=true;} true;`
                  );
                }
              } catch {
                // Ignore parsing errors
              }
            }}
          />
        )}
      </View>
    );
  }

  // Fallback if no PDF or while preparing
  const cover = offer?.thumbnail || offer?.coverImage || offer?.imageUrl;
  const resolvedCover = cover ? resolveMediaUrl(cover) : null;

  return (
    <View style={styles.thumbnailContainer}>
      <Image
        source={resolvedCover ? { uri: resolvedCover } : FALLBACK_BANNER}
        style={styles.thumbnailImage}
        resizeMode="cover"
      />
      <View style={styles.thumbnailBadgeOverlay}>
        <FileText size={18} color="#FFFFFF" strokeWidth={2} />
        <Text numberOfLines={1} style={styles.thumbnailTagText}>
          PDF
        </Text>
      </View>
    </View>
  );
}

function PdfModalViewer({ visible, offer, onClose, onDownload, downloading }) {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const webviewRef = React.useRef(null);
  const base64DataRef = React.useRef(null);
  const targetPdfUrl = visible && offer?.pdfUrl ? resolveMediaUrl(offer.pdfUrl) : null;

  useEffect(() => {
    if (!targetPdfUrl) return;

    let active = true;
    const loadPdf = async () => {
      setLoading(true);
      setError("");
      try {
        const fullUrl = targetPdfUrl;
        const asset = await Asset.fromModule(
          require("../assets/pdf-viewer/viewer.html"),
        ).downloadAsync();

        if (Platform.OS === "web") {
          const [htmlRes, pdfRes] = await Promise.all([
            fetch(asset.uri),
            fetch(fullUrl),
          ]);
          if (!htmlRes.ok || !pdfRes.ok)
            throw new Error("Unable to download PDF preview");
          let source = await htmlRes.text();
          const blob = await pdfRes.blob();
          const encoded = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(",")[1]);
            reader.onerror = () => reject(new Error("Unable to read PDF"));
            reader.readAsDataURL(blob);
          });
          if (!active) return;
          source = source.replace(
            '<script type="module">',
            `<script>window.initialPdf=${JSON.stringify(encoded)};window.previewOnly=false;</script><script type="module">`,
          );
          setHtml(source);
          setLoading(false);
        } else {
          const file = await loadDocumentFile(fullUrl, offer.title);
          const source = await new File(asset.localUri || asset.uri).text();
          const encoded = await file.base64();
          if (!active) return;
          base64DataRef.current = encoded;
          setHtml(source);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "Failed to load PDF");
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      active = false;
    };
  }, [targetPdfUrl, offer?.title]);

  const category = offer?.category || offer?.tag || offer?.propertyType || "Residential";
  const fileSize = offer?.fileSize || offer?.size || "PDF";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalScreen} edges={["top", "bottom"]}>
        {/* Modal Header */}
        <View style={styles.modalTopBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close PDF"
            hitSlop={8}
            onPress={onClose}
            style={styles.modalCloseButton}
          >
            <X size={20} color="#191919" />
          </Pressable>
          <Text style={styles.modalTopBarTitle}>Brochure Preview</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download PDF"
            hitSlop={8}
            disabled={downloading}
            onPress={() => onDownload(offer)}
            style={styles.modalActionButton}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={theme.colors.orangeColor} />
            ) : (
              <Download size={19} color="#191919" />
            )}
          </Pressable>
        </View>

        {/* Offer Details with FULL Description */}
        <View style={styles.modalInfoCard}>
          <View style={styles.modalMetaRow}>
            {category ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{category}</Text>
              </View>
            ) : null}
            <Text style={styles.modalMetaText}>
              {fileSize.includes("MB") || fileSize.includes("KB")
                ? `${fileSize} • PDF`
                : "PDF Document"}
            </Text>
          </View>
          <Text style={styles.modalOfferTitle}>
            {offer?.title || "Offer Document"}
          </Text>
          {offer?.description ? (
            <ScrollView
              style={styles.modalDescriptionScroll}
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalOfferDescription}>
                {offer.description}
              </Text>
            </ScrollView>
          ) : null}
        </View>

        {/* PDF Viewer Body */}
        <View style={styles.modalBody}>
          {error ? (
            <View style={styles.modalErrorContainer}>
              <Text style={styles.modalErrorText}>{error}</Text>
              <Pressable
                style={styles.retryButton}
                onPress={() => onDownload(offer)}
              >
                <Text style={styles.retryText}>Download Instead</Text>
              </Pressable>
            </View>
          ) : html ? (
            Platform.OS === "web" ? (
              React.createElement("iframe", {
                srcDoc: html,
                title: offer?.title || "PDF",
                style: { width: "100%", height: "100%", border: 0 },
              })
            ) : (
              <WebView
                ref={webviewRef}
                source={{ html, baseUrl: "https://shilp-viewer.invalid/" }}
                originWhitelist={["*"]}
                javaScriptEnabled
                scrollEnabled
                nestedScrollEnabled
                style={styles.webview}
                onShouldStartLoadWithRequest={(request) =>
                  [
                    "about:blank",
                    "https://shilp-viewer.invalid/",
                  ].includes(request.url)
                }
                onMessage={(event) => {
                  try {
                    const message = JSON.parse(event.nativeEvent.data);
                    if (message.type === "ready" && base64DataRef.current) {
                      webviewRef.current?.injectJavaScript(
                        `window.renderPdf(${JSON.stringify(base64DataRef.current)}, false); true;`,
                      );
                    }
                    if (message.type === "rendered") setLoading(false);
                    if (message.type === "error") {
                      setError(message.message || "Failed to render PDF");
                      setLoading(false);
                    }
                  } catch {
                    setError("Unable to render PDF preview");
                    setLoading(false);
                  }
                }}
                onError={() => {
                  setError("Unable to display PDF preview");
                  setLoading(false);
                }}
              />
            )
          ) : null}

          {loading && !error ? (
            <View pointerEvents="none" style={styles.modalLoadingContainer}>
              <ActivityIndicator
                size="large"
                color={theme.colors.orangeColor}
              />
              <Text style={styles.modalLoadingText}>Loading brochure…</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Download Bar */}
        <View style={styles.modalBottomBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Download and save brochure"
            disabled={downloading}
            onPress={() => onDownload(offer)}
            style={({ pressed }) => [
              styles.modalDownloadButton,
              pressed && { opacity: 0.8 },
              downloading && { opacity: 0.6 },
            ]}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <View style={styles.modalDownloadButtonContent}>
                <Download size={18} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.modalDownloadButtonText}>
                  Download Brochure
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default function OffersScreen({ navigation }) {
  const { unreadCount } = useNotifications();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState(null);
  const [activeOffer, setActiveOffer] = useState(null);

  const fetchOffers = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const data = await getOffers();
      setOffers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleDownload = async (offer) => {
    const offerId = offer?._id || offer?.id || offer?.title;
    if (downloadingId === offerId) return;

    if (!offer?.pdfUrl) {
      Toast.show({
        type: "error",
        text1: "Brochure unavailable",
        text2: "This offer does not have an attached PDF.",
      });
      return;
    }

    setDownloadingId(offerId);
    try {
      await downloadOfferFile(offer);
      Toast.show({
        type: "success",
        text1: "Downloaded",
        text2: `${offer.title || "Offer"} brochure saved successfully.`,
      });
    } catch (err) {
      Toast.show({
        type: "error",
        text1: "Download failed",
        text2: err.message || "Unable to download PDF. Please try again.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const canGoBack = navigation?.canGoBack && navigation.canGoBack();

  const renderHeader = () => (
   <View style={styles.header}>
         <Text style={styles.title}>Available Offers</Text>
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
  );

  const renderListHeader = () => {
    if (loading && offers.length === 0) return null;
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available Offers</Text>
        <Text style={styles.filesCount}>
          {offers.length} {offers.length === 1 ? "File" : "Files"}
        </Text>
      </View>
    );
  };

  const renderOfferItem = ({ item }) => {
    const isDownloading = downloadingId === (item._id || item.id || item.title);
    const category = item.category || item.tag || item.propertyType || "Residential";
    const fileSize = item.fileSize || item.size || "PDF";

    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Offer: ${item.title}`}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => setActiveOffer(item)}
      >
        <OfferThumbnail offer={item} />

        <View style={styles.cardContent}>
          <Text numberOfLines={1} style={styles.cardTitle}>
            {item.title || "Offer Brochure"}
          </Text>
          <Text numberOfLines={2} style={styles.cardDescription}>
            {item.description || "Special launch pricing & benefits"}
          </Text>

          <View style={styles.cardMetaRow}>
            <Text style={styles.cardMetaText}>
              {fileSize.includes("MB") || fileSize.includes("KB")
                ? `${fileSize} • PDF`
                : "PDF Document"}
            </Text>
            
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Download offer PDF"
          disabled={isDownloading}
          onPress={() => handleDownload(item)}
          style={({ pressed }) => [
            styles.downloadButton,
            pressed && styles.buttonPressed,
          ]}
          hitSlop={6}
        >
          {isDownloading ? (
            <ActivityIndicator
              size="small"
              color={theme.colors.orangeColor}
            />
          ) : (
            <Download size={20} color="#1A1A1A" strokeWidth={1.8} />
          )}
        </Pressable>
      </Pressable>
    );
  };

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.skeletonContainer}>
          {[1, 2, 3].map((key) => (
            <View key={key} style={styles.skeletonCard}>
              <View style={styles.skeletonThumb} />
              <View style={styles.skeletonContent}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSub} />
                <View style={styles.skeletonMeta} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <RefreshCw size={32} color="#777777" />
          <Text style={styles.errorTitle}>Could not load offers</Text>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => fetchOffers()}
          >
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIcon}>
          <Tag size={28} color="#7A7A7A" strokeWidth={1.7} />
        </View>
        <Text style={styles.emptyTitle}>No offers available</Text>
        <Text style={styles.emptySubtitle}>
          Special launch offers, promotions, and project brochures will appear
          here.
        </Text>
      </View>
    );
  };

  return (
    <ImageBackground
      source={BACKGROUND_IMAGE}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.screen} edges={["top"]}>
        {renderHeader()}

        <FlatList
          data={offers}
          renderItem={renderOfferItem}
          keyExtractor={(item, index) =>
            String(item._id || item.id || `offer-${index}`)
          }
          // ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={[
            styles.listContent,
            offers.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchOffers(true)}
              tintColor={theme.colors.orangeColor}
              colors={[theme.colors.orangeColor]}
            />
          }
          showsVerticalScrollIndicator={false}
        />

        <PdfModalViewer
          visible={Boolean(activeOffer)}
          offer={activeOffer}
          onClose={() => setActiveOffer(null)}
          onDownload={handleDownload}
          downloading={Boolean(
            downloadingId &&
              activeOffer &&
              (activeOffer._id || activeOffer.id || activeOffer.title) ===
                downloadingId,
          )}
        />
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
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
  headerActions: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  notificationBadge: { right: -5, top: -5 },

  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    // marginTop: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    color: "#111111",
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    letterSpacing: -0.3,
  },
  filesCount: {
    color: "#777777",
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 112,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  emptyListContent: {
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
    // minHeight: 168,
    overflow: "hidden",
    padding: 6,
    gap: 10,
    flex: 1,
  },
  cardPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  thumbnailContainer: {
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    height: 72,
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    width: 72,
  },
  thumbnailImage: {
    borderRadius: 12,
    height: "100%",
    width: "100%",
  },
  thumbnailBadgeOverlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  thumbnailBrand: {
    color: "#F25F17",
    fontFamily: theme.fonts.extraBold,
    fontSize: 9,
    letterSpacing: 1.2,
  },
  thumbnailTagText: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.bold,
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  cardContent: {
    flex: 1,
    justifyContent: "center",
    marginHorizontal: 12,
  },
  cardTitle: {
    color: "#191919",
    fontFamily: theme.fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
  cardDescription: {
    color: "#666666",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  cardMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  cardMetaText: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
  categoryBadge: {
    backgroundColor: "#FFF2E8",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  categoryText: {
    color: "#D46B08",
    fontFamily: theme.fonts.semiBold,
    fontSize: 11,
  },
  downloadButton: {
    alignItems: "center",
    backgroundColor: "#F7F7F8",
    borderColor: "#EBEBEB",
    borderRadius: 12,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  buttonPressed: {
    opacity: 0.65,
  },
  emptyContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 90,
    paddingHorizontal: 32,
    paddingTop: 80,
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
  emptyTitle: {
    color: "#242424",
    fontFamily: theme.fonts.bold,
    fontSize: 17,
  },
  emptySubtitle: {
    color: "#777777",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 6,
    textAlign: "center",
  },
  errorContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingBottom: 70,
    paddingHorizontal: 32,
    paddingTop: 80,
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
    borderRadius: 8,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  retryText: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.bold,
    fontSize: 13,
  },
  skeletonContainer: {
    paddingTop: 10,
  },
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#EFEFEF",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
    padding: 12,
  },
  skeletonThumb: {
    backgroundColor: "#ECECEC",
    borderRadius: 12,
    height: 72,
    width: 72,
  },
  skeletonContent: {
    flex: 1,
    gap: 8,
    justifyContent: "center",
  },
  skeletonTitle: {
    backgroundColor: "#E8E8E8",
    borderRadius: 4,
    height: 14,
    width: "65%",
  },
  skeletonSub: {
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    height: 12,
    width: "85%",
  },
  skeletonMeta: {
    backgroundColor: "#EFEFEF",
    borderRadius: 4,
    height: 10,
    width: "40%",
  },
  thumbnailWebView: {
    backgroundColor: "transparent",
    height: "100%",
    width: "100%",
  },
  modalScreen: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  modalTopBar: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 54,
    paddingHorizontal: 16,
  },
  modalCloseButton: {
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  modalTopBarTitle: {
    color: "#191919",
    fontFamily: theme.fonts.bold,
    fontSize: 16,
  },
  modalActionButton: {
    alignItems: "center",
    backgroundColor: "#F2F2F2",
    borderRadius: 18,
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  modalInfoCard: {
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#EEEEEE",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalMetaRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  modalMetaText: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },
  modalOfferTitle: {
    color: "#191919",
    fontFamily: theme.fonts.bold,
    fontSize: 18,
    lineHeight: 24,
  },
  modalDescriptionScroll: {
    maxHeight: 120,
    marginTop: 8,
  },
  modalOfferDescription: {
    color: "#555555",
    fontFamily: theme.fonts.regular,
    fontSize: 14,
    lineHeight: 21,
  },
  modalBody: {
    flex: 1,
    position: "relative",
    backgroundColor: "#F5F5F5",
  },
  webview: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  modalLoadingContainer: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.92)",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  modalLoadingText: {
    color: "#555555",
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    marginTop: 10,
  },
  modalErrorContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  modalErrorText: {
    color: "#B42318",
    fontFamily: theme.fonts.medium,
    fontSize: 14,
    textAlign: "center",
  },
  modalBottomBar: {
    backgroundColor: "#FFFFFF",
    borderTopColor: "#EEEEEE",
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalDownloadButton: {
    alignItems: "center",
    backgroundColor: "#191919",
    borderRadius: 10,
    height: 48,
    justifyContent: "center",
  },
  modalDownloadButtonContent: {
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  modalDownloadButtonText: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
  },
});
