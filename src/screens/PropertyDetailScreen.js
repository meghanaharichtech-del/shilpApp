import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Heart,
  Share2,
  MapPin,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Images,
  Video,
  LayoutGrid,
  FileText,
  HardHat,
  Send,
  ShieldCheck,
  BarChart3,
  X,
  Download,
  ExternalLink,
  FileDown,
  FileImage,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react-native";
import { theme } from "../utils/theme";
import { BASEURL, PROJECTS_API } from "../utils/ApiHelper";
import { StorageUtils } from "../utils/StorageUtils";
import CustomDialog from "../components/CustomDialog";
import axios from "axios";
import { propertyResources } from "../utils/propertyResources";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const IMAGE_HEIGHT = 200;
const FALLBACK_IMAGE = require("../assets/defaultnoimg.png");
const GRID_GAP = 6;
const NUM_COLUMNS = 3;
const GRID_IMAGE_SIZE =
  (SCREEN_WIDTH - 32 - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const CAROUSEL_AUTO_SLIDE_DURATION = 3500;
const ACTIVE_DOT_WIDTH = 26;

const extractPincode = (project) => {
  if (!project) return "—";

  // 1. Direct fields on project (pincode, pinCode, postalCode, zip, etc.)
  const direct =
    project.pincode ??
    project.pinCode ??
    project.pin_code ??
    project.postalCode ??
    project.postal_code ??
    project.zipCode ??
    project.zip;
  if (direct != null && String(direct).trim()) {
    return String(direct).trim();
  }

  // 2. Inside address object
  if (project.address && typeof project.address === "object") {
    const addrPin =
      project.address.pincode ??
      project.address.pinCode ??
      project.address.pin_code ??
      project.address.postalCode ??
      project.address.zipCode ??
      project.address.zip;
    if (addrPin != null && String(addrPin).trim()) {
      return String(addrPin).trim();
    }
  }

  // 3. Inside location object
  if (project.location && typeof project.location === "object") {
    const locPin =
      project.location.pincode ??
      project.location.pinCode ??
      project.location.pin_code ??
      project.location.postalCode ??
      project.location.zipCode ??
      project.location.zip ??
      project.location.address?.pincode ??
      project.location.address?.pinCode;
    if (locPin != null && String(locPin).trim()) {
      return String(locPin).trim();
    }
  }

  // 4. Regex extraction from string candidate fields (address, location, etc.)
  const candidateStrings = [
    typeof project.address === "string" ? project.address : null,
    typeof project.location === "string" ? project.location : null,
    typeof project.location?.name === "string" ? project.location.name : null,
    typeof project.location?.address === "string" ? project.location.address : null,
    typeof project.location?.fullAddress === "string" ? project.location.fullAddress : null,
    typeof project.fullAddress === "string" ? project.fullAddress : null,
    typeof project.city === "string" ? project.city : null,
  ].filter(Boolean);

  for (const str of candidateStrings) {
    const match = str.match(/\b([1-9][0-9]{5})\b/) || str.match(/\b(\d{6})\b/);
    if (match) {
      return match[1];
    }
  }

  return "—";
};

const imageSource = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string") return FALLBACK_IMAGE;
  if (/^https?:\/\//i.test(imagePath)) return { uri: imagePath };
  return {
    uri: `${BASEURL.replace(/\/$/, "")}/${imagePath.replace(/^\//, "")}`,
  };
};

const buildFullUrl = (path) => {
  if (!path || typeof path !== "string") return null;
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASEURL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
};

const statusLabel = (status) => {
  if (!status) return "Available";
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const statusColor = (status) => {
  switch (status) {
    case "ready-possession":
      return { bg: "#E8F5E9", text: "#2E7D32", icon: "#2E7D32" };
    case "under-construction":
      return { bg: "#FFF3E0", text: "#E65100", icon: "#E65100" };
    default:
      return { bg: "#FFF3E0", text: "#E65100", icon: "#E65100" };
  }
};

// ─── Menu Item Component ───────────────────────────────────────────────────────
const MenuItemRow = ({ icon: Icon, label, subtitle, isLast, onPress }) => (
  <Pressable
    style={[styles.menuItem, !isLast && styles.menuItemBorder]}
    onPress={onPress}
    android_ripple={{ color: "#F5F5F5" }}
  >
    <View style={styles.menuIconWrap}>
      <Icon size={20} color="#121212" strokeWidth={1.8} />
    </View>
    <View style={styles.menuTextWrap}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
    </View>
    <ChevronRight size={20} color="#BDBDBD" />
  </Pressable>
);


// ─── Bottom Sheet Modal ────────────────────────────────────────────────────────
const BottomSheet = ({ visible, onClose, title, subtitle, children }) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <Pressable style={styles.modalOverlay} onPress={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose} />
      <View
        style={styles.modalSheet}
        onStartShouldSetResponder={() => true}
      >
        {/* Drag Handle */}
        <Pressable
          style={styles.dragHandleWrap}
          onPress={onClose}
          hitSlop={10}
        >
          <View style={styles.dragHandle} />
        </Pressable>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.modalTitle}>{title}</Text>
            {subtitle ? (
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
            ) : null}
          </View>
          <Pressable
            style={styles.modalCloseBtn}
            onPress={onClose}
            hitSlop={12}
          >
            <X size={20} color="#191919" />
          </Pressable>
        </View>
        {/* Content */}
        <ScrollView
          style={styles.modalBody}
          contentContainerStyle={styles.modalBodyContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </View>
    </Pressable>
  </Modal>
);

// ─── Category Chip ─────────────────────────────────────────────────────────────
const CategoryChip = ({ label, count, active, onPress }) => (
  <Pressable
    style={[styles.chipBtn, active && styles.chipBtnActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipTextActive]}>
      {label}
      {count != null ? ` (${count})` : ""}
    </Text>
  </Pressable>
);

// ─── Document Row ──────────────────────────────────────────────────────────────
const DocumentRow = ({ icon: Icon, title, subtitle, url, isLast }) => {
  const [dialog, setDialog] = useState(null);
  const hasUrl = Boolean(
    url && typeof url === "string" && url.trim().length > 0,
  );

  const handlePress = async () => {
    if (hasUrl) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
        } else {
          await Linking.openURL(url);
        }
      } catch (e) {
        setDialog({
          title: "Cannot Open Document",
          message:
            "Unable to open this document link on your device. Please check your browser or PDF viewer.",
        });
      }
    } else {
      setDialog({
        title: "Document Pending",
        message: `The ${title} has not been uploaded yet for this project. It will be available once uploaded by the developer.`,
      });
    }
  };

  return (
    <>
      <Pressable
        style={[styles.docRow, !isLast && styles.docRowBorder]}
        onPress={handlePress}
      >
        <View style={styles.docIconWrap}>
          <Icon size={20} color="#121212" strokeWidth={1.8} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.docTitle}>{title}</Text>
          {subtitle ? <Text style={styles.docSubtitle}>{subtitle}</Text> : null}
        </View>
        <View style={styles.docActionWrap}>
          {hasUrl ? (
            <View style={styles.docBadgeAvailable}>
              <Text style={styles.docBadgeTextAvailable}>View</Text>
              <ExternalLink size={13} color="#C96A10" />
            </View>
          ) : (
            <View style={styles.docBadgePending}>
              <Text style={styles.docBadgeTextPending}>Pending</Text>
            </View>
          )}
        </View>
      </Pressable>
      <CustomDialog
        visible={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        onClose={() => setDialog(null)}
      />
    </>
  );
};

// ─── Construction Timeline Item ────────────────────────────────────────────────
const TimelineItem = ({ update, isLast }) => {
  const title = update?.title || update?.phase || "Update";
  const date = update?.date || update?.updatedAt || update?.createdAt;
  const desc = update?.description || update?.note || update?.details || "";
  const status = update?.status || "in-progress";
  const progress = update?.progress || update?.percentage;

  const StatusIcon =
    status === "completed"
      ? CheckCircle2
      : status === "pending"
        ? AlertCircle
        : Clock;
  const statusClr =
    status === "completed"
      ? "#2E7D32"
      : status === "pending"
        ? "#999"
        : "#E65100";

  return (
    <View style={[styles.timelineItem, !isLast && styles.timelineBorder]}>
      <View style={[styles.timelineDot, { backgroundColor: statusClr }]}>
        <StatusIcon size={12} color="#FFFFFF" />
      </View>
      <View style={styles.timelineContent}>
        <Text style={styles.timelineTitle}>{title}</Text>
        {date ? (
          <Text style={styles.timelineDate}>
            {new Date(date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </Text>
        ) : null}
        {desc ? <Text style={styles.timelineDesc}>{desc}</Text> : null}
        {progress != null && (
          <View style={styles.progressWrap}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(progress, 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const PropertyDetailScreen = ({ navigation, route }) => {
  const initialProject = route.params?.project;
  const [project, setProject] = useState(initialProject || {});
  const carouselRef = useRef(null);
  const [slideIndex, setSlideIndex] = useState(0);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const isAutoScrollingRef = useRef(false);
  const slideIndexRef = useRef(0);
  slideIndexRef.current = slideIndex;
  const slideWidth = SCREEN_WIDTH - 32;

  // Sync when route params change
  useEffect(() => {
    if (initialProject) {
      setProject((prev) => ({ ...initialProject, ...prev }));
    }
  }, [initialProject]);

  // Fetch full project details including documents, brochure, creatives
  useEffect(() => {
    const fetchFullDetails = async () => {
      const pid = initialProject?._id || initialProject?.id;
      if (!pid) return;

      try {
        const userData = await StorageUtils.getItem("userData");
        const accessToken =
          userData?.token ||
          userData?.accessToken ||
          userData?.data?.accessToken;
        if (!accessToken) return;

        const res = await axios.get(`${PROJECTS_API}/${pid}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (res.data?.success && res.data?.project) {
          setProject((prev) => ({ ...prev, ...res.data.project }));
        }
      } catch (err) {
        // Fallback: try fetching documents directly from /api/projects/:id/documents
        try {
          const userData = await StorageUtils.getItem("userData");
          const accessToken =
            userData?.token ||
            userData?.accessToken ||
            userData?.data?.accessToken;
          if (!accessToken) return;

          const docRes = await axios.get(`${PROJECTS_API}/${pid}/documents`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (docRes.data?.success && docRes.data?.documents) {
            setProject((prev) => ({
              ...prev,
              documents: docRes.data.documents,
            }));
          }
        } catch (_) {}
      }
    };

    fetchFullDetails();
  }, [initialProject?._id, initialProject?.id]);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isLiked, setIsLiked] = useState(false);

  // Modal states
  const [activeModal, setActiveModal] = useState(null);
  const [resourceError, setResourceError] = useState(null);
  const openResource = async (url) => {
    if (!url) return;
    try { await Linking.openURL(url); }
    catch { setResourceError("Unable to open this link. Please check your browser or PDF viewer."); }
  };
  const [galleryFilter, setGalleryFilter] = useState("all");

  const openModal = (name) => setActiveModal(name);
  const closeModal = () => {
    setActiveModal(null);
    setGalleryFilter("all");
  };

  // Build gallery from all available images
  const allGalleryImages = useMemo(() => {
    const images = [];
    const categorized = {
      exterior: [],
      amenities: [],
      landscape: [],
      others: [],
    };

    if (project?.bannerImage) {
      images.push({ url: project.bannerImage, category: "exterior" });
      categorized.exterior.push(project.bannerImage);
    }
    if (Array.isArray(project?.gallery)) {
      project.gallery.forEach((img) => {
        if (img && !images.find((i) => i.url === img)) {
          images.push({ url: img, category: "exterior" });
          categorized.exterior.push(img);
        }
      });
    }
    if (Array.isArray(project?.elevationGallery)) {
      project.elevationGallery.forEach((img) => {
        if (img && !images.find((i) => i.url === img)) {
          images.push({ url: img, category: "amenities" });
          categorized.amenities.push(img);
        }
      });
    }
    if (Array.isArray(project?.layoutImages)) {
      project.layoutImages.forEach((img) => {
        if (img && !images.find((i) => i.url === img)) {
          images.push({ url: img, category: "landscape" });
          categorized.landscape.push(img);
        }
      });
    }
    if (Array.isArray(project?.otherImages)) {
      project.otherImages.forEach((img) => {
        if (img && !images.find((i) => i.url === img)) {
          images.push({ url: img, category: "others" });
          categorized.others.push(img);
        }
      });
    }
    return { all: images, categorized };
  }, [project]);

  const carouselImages = useMemo(() => {
    const imgs = allGalleryImages.all.map((i) => i.url);
    return imgs.length > 0 ? imgs : [null];
  }, [allGalleryImages]);

  const filteredGallery = useMemo(() => {
    if (galleryFilter === "all") return allGalleryImages.all;
    return allGalleryImages.all.filter((img) => img.category === galleryFilter);
  }, [allGalleryImages, galleryFilter]);

  const galleryCounts = useMemo(
    () => ({
      all: allGalleryImages.all.length,
      exterior: allGalleryImages.categorized.exterior.length,
      amenities: allGalleryImages.categorized.amenities.length,
      landscape: allGalleryImages.categorized.landscape.length,
      others: allGalleryImages.categorized.others.length,
    }),
    [allGalleryImages],
  );

  const totalImages = carouselImages.length;

  const startProgressAnimation = useCallback(() => {
    progressAnim.setValue(0);
    const anim = Animated.timing(progressAnim, {
      toValue: 1,
      duration: CAROUSEL_AUTO_SLIDE_DURATION,
      easing: Easing.linear,
      useNativeDriver: false,
    });

    anim.start(({ finished }) => {
      if (finished) {
        if (totalImages <= 1) return;
        const next = (slideIndexRef.current + 1) % totalImages;
        isAutoScrollingRef.current = true;
        carouselRef.current?.scrollTo({ x: next * slideWidth, animated: true });
        setSlideIndex(next);
      }
    });

    return anim;
  }, [slideWidth, totalImages, progressAnim]);

  // Auto-slide image carousel with animated progress bar
  useEffect(() => {
    if (totalImages <= 1) return;
    const anim = startProgressAnimation();
    return () => {
      anim.stop();
    };
  }, [slideIndex, totalImages, startProgressAnimation]);

  const onCarouselScrollBeginDrag = useCallback(() => {
    isAutoScrollingRef.current = false;
    progressAnim.stopAnimation();
  }, [progressAnim]);

  const onCarouselScroll = useCallback(
    (event) => {
      if (isAutoScrollingRef.current) {
        isAutoScrollingRef.current = false;
        return;
      }
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / slideWidth);
      if (newIndex >= 0 && newIndex < totalImages) {
        if (newIndex === slideIndex) {
          startProgressAnimation();
        } else {
          setSlideIndex(newIndex);
        }
      }
    },
    [slideWidth, totalImages, slideIndex, startProgressAnimation],
  );

  // Data extraction
  const projectName = project?.name || "Untitled Project";
  const location = useMemo(() => {
    if (typeof project?.address === "string" && project.address.trim()) {
      return project.address.trim();
    }
    if (typeof project?.location === "string" && project.location.trim()) {
      return project.location.trim();
    }
    if (project?.location && typeof project.location === "object") {
      const parts = [
        project.location.name,
        project.location.address,
        project.location.city,
        project.location.state,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    if (project?.address && typeof project.address === "object") {
      const parts = [
        project.address.line1,
        project.address.street,
        project.address.city,
        project.address.state,
      ].filter(Boolean);
      if (parts.length > 0) return parts.join(", ");
    }
    return (
      project?.location?.name ||
      project?.location?.address ||
      "Location not available"
    );
  }, [project]);

  const status = project?.status;
  const colors = statusColor(status);
  const projectType = project?.projectType || project?.category || "Project";
  const pincode = useMemo(() => extractPincode(project), [project]);
  const totalUnits =
    project?.totalUnits || project?.configurations?.length || "—";
  const description =
    project?.description ||
    project?.about ||
    `${projectName} is a premium ${projectType.toLowerCase()} development, offering modern infrastructure and excellent connectivity.`;

  const descriptionTruncated =
    description.length > 150 && !descExpanded
      ? description.slice(0, 150) + "..."
      : description;

  const resources = propertyResources(project, buildFullUrl);
  const brochureUrl = resources.brochure;
  const walkthroughUrl = resources.walkthrough;

  // Plot / inventory data
  const plots =
    project?.plotDetails || project?.plots || project?.inventory || null;
  const plotLayout =
    project?.plotLayout || project?.layoutImage || project?.masterPlan || null;
  const configurations = project?.configurations || [];

  // Legal documents normalization
  const legalDocs = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    const addDoc = (title, subtitle, rawUrl, type = "document") => {
      const url = buildFullUrl(rawUrl);
      const key = url || title;
      if (seenKeys.has(key)) return;
      seenKeys.add(key);
      list.push({ title, subtitle, url, type });
    };

    // 1. If project.documents array exists (from ProjectDocument collection)
    if (Array.isArray(project?.documents)) {
      project.documents.filter(doc => ["legal", "rera", "approval", "title"].includes(doc?.type)).forEach((doc, idx) => {
        const fileUrl = doc.fileUrl || doc.url || doc.file || doc.link;
        const title = doc.title || doc.name || `Document ${idx + 1}`;
        const type = doc.type || "document";
        const subtitle =
          doc.description ||
          doc.detail ||
          (type === "rera"
            ? "RERA registered document"
            : type === "approval"
              ? "Government approval & clearance"
              : type === "title"
                ? "Title verification document"
                : type === "legal"
                  ? "Legal compliance document"
                  : null);
        addDoc(title, subtitle, fileUrl, type);
      });
    }

    // 2. If project.legalDocuments is object or array
    if (Array.isArray(project?.legalDocuments)) {
      project.legalDocuments.forEach((doc, idx) => {
        const fileUrl = doc.fileUrl || doc.url || doc.file || doc.link;
        addDoc(
          doc.title || doc.name || `Legal Document ${idx + 1}`,
          doc.description || null,
          fileUrl,
          "legal",
        );
      });
    } else if (
      project?.legalDocuments &&
      typeof project.legalDocuments === "object"
    ) {
      const ld = project.legalDocuments;
      if (ld.rera) {
        addDoc(
          "RERA Certificate",
          project.reraNumber
            ? `RERA No: ${project.reraNumber}`
            : "Official RERA certificate",
          ld.rera,
          "rera",
        );
      }
      if (Array.isArray(ld.approvals)) {
        ld.approvals.forEach((item, i) => {
          if (typeof item === "string") {
            addDoc(
              `Approval ${i + 1}`,
              "Official clearance & permission",
              item,
              "approval",
            );
          } else if (item && typeof item === "object") {
            addDoc(
              item.title || `Approval ${i + 1}`,
              item.description || null,
              item.fileUrl || item.url,
              "approval",
            );
          }
        });
      }
      if (Array.isArray(ld.titleDocuments)) {
        ld.titleDocuments.forEach((item, i) => {
          if (typeof item === "string") {
            addDoc(
              `Title Document ${i + 1}`,
              "Title & ownership clearance",
              item,
              "title",
            );
          } else if (item && typeof item === "object") {
            addDoc(
              item.title || `Title Document ${i + 1}`,
              item.description || null,
              item.fileUrl || item.url,
              "title",
            );
          }
        });
      }
      if (Array.isArray(ld.documents)) {
        ld.documents.forEach((doc, i) => {
          addDoc(
            doc.title || `Document ${i + 1}`,
            doc.description || null,
            typeof doc === "string" ? doc : doc.fileUrl || doc.url,
            doc.type || "legal",
          );
        });
      }
    }

    // 3. Direct project certificates
    if (project?.reraCertificate || project?.reraDoc || project?.reraPdf) {
      addDoc(
        "RERA Certificate",
        project.reraNumber
          ? `RERA No: ${project.reraNumber}`
          : "Official RERA document",
        project.reraCertificate || project.reraDoc || project.reraPdf,
        "rera",
      );
    }
    if (project?.titleClearCertificate || project?.titleClearDoc) {
      addDoc(
        "Title Clear Certificate",
        "Legal clearance documentation",
        project.titleClearCertificate || project.titleClearDoc,
        "title",
      );
    }
    if (project?.naOrder || project?.naDoc) {
      addDoc(
        "NA Order",
        "Non-agricultural conversion order",
        project.naOrder || project.naDoc,
        "legal",
      );
    }

    return list;
  }, [project]);

  // Construction updates
  const constructionUpdates =
    project?.constructionUpdates ||
    project?.constructionProgress ||
    project?.updates ||
    [];

  // Social media creatives
  const creatives =
    project?.socialMediaCreatives ||
    project?.creatives ||
    project?.marketingAssets ||
    [];

  // ── Render helpers ──
  const renderGalleryGrid = () => (
    <View style={styles.galleryGrid}>
      {filteredGallery.map((img, idx) => (
        <View key={`gal-${idx}`} style={styles.galleryThumb}>
          <Image
            source={imageSource(img.url)}
            style={styles.galleryThumbImg}
            resizeMode="cover"
            defaultSource={FALLBACK_IMAGE}
          />
        </View>
      ))}
      {filteredGallery.length === 0 && (
        <View style={styles.emptyModalState}>
          <Images size={32} color="#CCCCCC" />
          <Text style={styles.emptyModalText}>No images available</Text>
        </View>
      )}
    </View>
  );

  const renderBrochureContent = () => (
    <View>
      {brochureUrl ? (
        <Pressable
          style={styles.brochureCard}
          onPress={() => openResource(brochureUrl)}
        >
          <View style={styles.brochureIconWrap}>
            <FileDown size={28} color="#C96A10" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.brochureTitle}>
              {projectName} - Brochure.pdf
            </Text>
            <Text style={styles.brochureSubtitle}>
              Tap to download or view the project brochure
            </Text>
          </View>
          <View style={styles.downloadBtn}>
            <Download size={18} color="#FFFFFF" />
          </View>
        </Pressable>
      ) : (
        <View style={styles.emptyModalState}>
          <BookOpen size={32} color="#CCCCCC" />
          <Text style={styles.emptyModalText}>Brochure not available yet</Text>
          <Text style={styles.emptyModalSubtext}>
            The project brochure will be uploaded soon
          </Text>
        </View>
      )}
    </View>
  );

  const renderWalkthroughContent = () => (
    <View>
      {walkthroughUrl ? (
        <Pressable
          style={styles.walkthroughCard}
          onPress={() => openResource(walkthroughUrl)}
        >
          <View style={styles.walkthroughPreview}>
            <Image
              source={imageSource(carouselImages[0])}
              style={styles.walkthroughImage}
              resizeMode="cover"
              defaultSource={FALLBACK_IMAGE}
            />
            <View style={styles.playOverlay}>
              <View style={styles.playBtn}>
                <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
              </View>
            </View>
          </View>
          <View style={styles.walkthroughInfo}>
            <Text style={styles.walkthroughTitle}>
              Experience {projectName} in 3D
            </Text>
            <Text style={styles.walkthroughSub}>
              Tap to open virtual walkthrough
            </Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.emptyModalState}>
          <Video size={32} color="#CCCCCC" />
          <Text style={styles.emptyModalText}>
            Virtual walkthrough coming soon
          </Text>
          <Text style={styles.emptyModalSubtext}>
            The 3D experience will be available shortly
          </Text>
        </View>
      )}
    </View>
  );

  const renderPlotContent = () => (
    <View>
      {/* Plot layout image */}
      {plotLayout && !/\.pdf(?:[?#]|$)/i.test(typeof plotLayout === "string" ? plotLayout : plotLayout?.url || "") && (
        <View style={styles.plotLayoutWrap}>
          <Image
            source={imageSource(
              typeof plotLayout === "string" ? plotLayout : plotLayout?.url,
            )}
            style={styles.plotLayoutImg}
            resizeMode="contain"
            defaultSource={FALLBACK_IMAGE}
          />
        </View>
      )}

      {plotLayout && <DocumentRow icon={FileText} title="Master plan" url={buildFullUrl(typeof plotLayout === "string" ? plotLayout : plotLayout?.url)} />}
      {(project?.floorPlans || []).map((plan, index) => <DocumentRow key={`floor-plan-${index}`} icon={FileText} title={plan.title || `Floor plan ${index + 1}`} url={buildFullUrl(plan.pdf || plan.image)} />)}

      {/* Configurations / Plot sizes */}
      {configurations.length > 0 && (
        <View style={styles.configList}>
          <Text style={styles.configHeading}>Available Configurations</Text>
          {configurations.map((config, idx) => (
            <View
              key={`config-${idx}`}
              style={[
                styles.configItem,
                idx < configurations.length - 1 && styles.configItemBorder,
              ]}
            >
              <View style={styles.configIconWrap}>
                <LayoutGrid size={18} color="#C96A10" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.configTitle}>
                  {config.name ||
                    config.type ||
                    config.size ||
                    `Config ${idx + 1}`}
                </Text>
                {config.areaSqFt || config.area || config.sqft ? (
                  <Text style={styles.configSub}>
                    {config.areaSqFt || config.area || config.sqft}
                    {config.unit || " sq.ft."}
                  </Text>
                ) : null}
              </View>
              {config.price ? (
                <Text style={styles.configPrice}>
                  ₹{" "}
                  {Number(config.price) >= 100000
                    ? `${(Number(config.price) / 100000).toFixed(
                        Number(config.price) % 100000 ? 2 : 0,
                      )} L`
                    : Number(config.price).toLocaleString("en-IN")}
                </Text>
              ) : null}
              {config.status && (
                <View
                  style={[
                    styles.plotStatusPill,
                    {
                      backgroundColor:
                        config.status === "available" ? "#E8F5E9" : "#FFF3E0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.plotStatusText,
                      {
                        color:
                          config.status === "available" ? "#2E7D32" : "#E65100",
                      },
                    ]}
                  >
                    {config.status.charAt(0).toUpperCase() +
                      config.status.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Plot details */}
      {plots && typeof plots === "object" && !Array.isArray(plots) && (
        <View style={styles.plotDetailsCard}>
          {plots.totalPlots && (
            <View style={styles.plotDetailRow}>
              <Text style={styles.plotDetailLabel}>Total Plots</Text>
              <Text style={styles.plotDetailValue}>{plots.totalPlots}</Text>
            </View>
          )}
          {plots.availablePlots != null && (
            <View style={styles.plotDetailRow}>
              <Text style={styles.plotDetailLabel}>Available</Text>
              <Text style={[styles.plotDetailValue, { color: "#2E7D32" }]}>
                {plots.availablePlots}
              </Text>
            </View>
          )}
          {plots.soldPlots != null && (
            <View style={styles.plotDetailRow}>
              <Text style={styles.plotDetailLabel}>Sold</Text>
              <Text style={[styles.plotDetailValue, { color: "#E65100" }]}>
                {plots.soldPlots}
              </Text>
            </View>
          )}
          {(plots.pricePerSqFt || plots.price) && (
            <View style={styles.plotDetailRow}>
              <Text style={styles.plotDetailLabel}>Starting Price</Text>
              <Text style={styles.plotDetailValue}>
                ₹ {plots.pricePerSqFt || plots.price}
                {plots.pricePerSqFt ? " /sq.ft." : ""}
              </Text>
            </View>
          )}
        </View>
      )}

      {!plotLayout && configurations.length === 0 && !plots && (
        <View style={styles.emptyModalState}>
          <LayoutGrid size={32} color="#CCCCCC" />
          <Text style={styles.emptyModalText}>Plot details coming soon</Text>
          <Text style={styles.emptyModalSubtext}>
            Availability information will be updated shortly
          </Text>
        </View>
      )}
    </View>
  );

  const renderLegalContent = () => (
    <View>
      {legalDocs.map((doc, idx) => (
        <DocumentRow
          key={`doc-${idx}`}
          icon={doc.type === "rera" ? ShieldCheck : FileText}
          title={doc.title}
          subtitle={doc.subtitle}
          url={doc.url}
          isLast={idx === legalDocs.length - 1}
        />
      ))}
    </View>
  );

  const renderConstructionContent = () => (
    <View>
      {Array.isArray(constructionUpdates) && constructionUpdates.length > 0 ? (
        constructionUpdates.map((update, idx) => (
          <TimelineItem
            key={`cu-${idx}`}
            update={update}
            isLast={idx === constructionUpdates.length - 1}
          />
        ))
      ) : (
        <View style={styles.emptyModalState}>
          <HardHat size={32} color="#CCCCCC" />
          <Text style={styles.emptyModalText}>No construction updates yet</Text>
          <Text style={styles.emptyModalSubtext}>
            Progress updates will be posted as the project develops
          </Text>
        </View>
      )}
    </View>
  );

  const renderCreativesContent = () => (
    <View>
      {Array.isArray(creatives) && creatives.length > 0 ? (
        <View style={styles.galleryGrid}>
          {creatives.map((item, idx) => {
            const url =
              typeof item === "string" ? item : item?.url || item?.image;
            const caption =
              typeof item === "string" ? null : item?.title || item?.caption;
            return (
              <Pressable
                key={`cr-${idx}`}
                style={styles.creativeThumb}
                onPress={() => {
                  const fullUrl = buildFullUrl(url);
                  if (fullUrl) Linking.openURL(fullUrl).catch(() => {});
                }}
              >
                <Image
                  source={imageSource(url)}
                  style={styles.creativeThumbImg}
                  resizeMode="cover"
                  defaultSource={FALLBACK_IMAGE}
                />
                {caption && (
                  <Text style={styles.creativeCaption} numberOfLines={1}>
                    {caption}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </View>
      ) : (
        <View style={styles.emptyModalState}>
          <Send size={32} color="#CCCCCC" />
          <Text style={styles.emptyModalText}>No creatives available</Text>
          <Text style={styles.emptyModalSubtext}>
            Marketing assets will be added soon
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <ArrowLeft size={22} color="#191919" />
        </Pressable>
        <Text style={styles.headerTitle}>SHILP</Text>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.headerBtn}
            onPress={() => setIsLiked(!isLiked)}
            hitSlop={10}
          >
            <Heart
              size={20}
              color={isLiked ? "#E53935" : "#191919"}
              fill={isLiked ? "#E53935" : "none"}
            />
          </Pressable>
          <Pressable style={styles.headerBtn} hitSlop={10}>
            <Share2 size={20} color="#191919" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Image Carousel ── */}
        <View style={styles.carouselWrap}>
          <ScrollView
            ref={carouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={onCarouselScrollBeginDrag}
            onMomentumScrollEnd={onCarouselScroll}
            decelerationRate="fast"
          >
            {carouselImages.map((img, index) => (
              <View key={`img-${index}`} style={styles.imageSlide}>
                <Image
                  source={imageSource(img)}
                  style={styles.carouselImage}
                  resizeMode="cover"
                  defaultSource={FALLBACK_IMAGE}
                />
              </View>
            ))}
          </ScrollView>

          {/* Dots */}
          {totalImages > 1 && (
            <View style={styles.dotsRow}>
              {carouselImages.map((_, index) => {
                const isActive = index === slideIndex;
                return (
                  <Pressable
                    key={`carousel-dot-${index}`}
                    onPress={() => {
                      if (index !== slideIndex) {
                        carouselRef.current?.scrollTo({
                          x: index * slideWidth,
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

          {/* Image Counter */}
          <View style={styles.imageCounter}>
            <Images size={14} color="#FFFFFF" />
            <Text style={styles.imageCounterText}>
              {slideIndex + 1}/{totalImages}
            </Text>
          </View>
        </View>

        {/* ── Title & Status ── */}
        <View style={styles.titleRow}>
          <Text style={styles.projectName}>{projectName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <HardHat size={13} color={colors.icon} />
            <Text style={[styles.statusBadgeText, { color: colors.text }]}>
              {statusLabel(status)}
            </Text>
          </View>
        </View>

     

        {resources.directions && <Pressable style={styles.locationRow} accessibilityRole="link" onPress={() => openResource(resources.directions)}><MapPin size={18} color="#C96A10" /><Text style={styles.locationText}>Open map · {location || "Get directions"}</Text></Pressable>}

        {/* ── Description ── */}
        <View style={styles.descriptionWrap}>
          <Text style={styles.descriptionText}>{descriptionTruncated}</Text>
          {description.length > 150 && (
            <Pressable
              onPress={() => setDescExpanded(!descExpanded)}
              style={styles.readMoreRow}
            >
              <Text style={styles.readMoreText}>
                {descExpanded ? "Show less" : "Read more"}
              </Text>
              {descExpanded ? (
                <ChevronUp size={16} color="#191919" />
              ) : (
                <ChevronDown size={16} color="#191919" />
              )}
            </Pressable>
          )}
        </View>

        {/* ── Project Resources ── */}
        {(brochureUrl || allGalleryImages.all.length > 0 || walkthroughUrl || project?.factSheet?.fileUrl || project?.brokeragePolicy?.pdfUrl) && <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Project Resources</Text>
        </View>}
        {(brochureUrl || allGalleryImages.all.length > 0 || walkthroughUrl || project?.factSheet?.fileUrl || project?.brokeragePolicy?.pdfUrl) && <View style={styles.menuCard}>
          {brochureUrl && <MenuItemRow
            icon={BookOpen}
            label="Project Brochure"
            subtitle="Download project brochure"
            onPress={() => openModal("brochure")}
          />}
          {project?.factSheet?.fileUrl && <DocumentRow icon={FileText} title={project.factSheet.title || "Fact sheet"} url={buildFullUrl(project.factSheet.fileUrl)} />}
          {project?.brokeragePolicy?.pdfUrl && <DocumentRow icon={FileText} title="Brokerage policy" url={buildFullUrl(project.brokeragePolicy.pdfUrl)} />}
          {allGalleryImages.all.length > 0 && <MenuItemRow
            icon={Images}
            label="Gallery"
            subtitle="View project images and media"
            onPress={() => openModal("gallery")}
          />}
          {walkthroughUrl && <MenuItemRow
            icon={Video}
            label="Virtual Walkthrough"
            subtitle="Experience the project in 3D"
            isLast
            onPress={() => openResource(walkthroughUrl)}
          />}
        </View>}

        {/* ── Inventory ── */}
        {(plotLayout || configurations.length > 0 || plots) && <Text style={styles.sectionTitle}>Inventory</Text>}
        {(plotLayout || configurations.length > 0 || plots) && <View style={styles.menuCard}>
          <MenuItemRow
            icon={LayoutGrid}
            label="Plot Availability"
            subtitle="Check available plots and layout"
            isLast
            onPress={() => openModal("plots")}
          />
        </View>}

        {/* ── Project Information ── */}
        {(legalDocs.length > 0 || constructionUpdates.length > 0 || creatives.length > 0) && <Text style={styles.sectionTitle}>Project Information</Text>}
        {(legalDocs.length > 0 || constructionUpdates.length > 0 || creatives.length > 0) && <View style={styles.menuCard}>
          {legalDocs.length > 0 && <MenuItemRow
            icon={ShieldCheck}
            label="Legal Documents"
            subtitle="Approvals, legal and compliance"
            onPress={() => openModal("legal")}
          />}
          {constructionUpdates.length > 0 && <MenuItemRow
            icon={HardHat}
            label="Construction Update"
            subtitle="Track project progress"
            onPress={() => openModal("construction")}
          />}
          {creatives.length > 0 && <MenuItemRow
            icon={Send}
            label="Social Media Creative"
            subtitle="Marketing assets and creatives"
            isLast
            onPress={() => openModal("creatives")}
          />}
        </View>}

        {/* Bottom spacer for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ═══════════ MODALS ═══════════ */}

      {/* ── Gallery Modal ── */}
      <BottomSheet
        visible={activeModal === "gallery"}
        onClose={closeModal}
        title="Gallery"
        subtitle="View project images and media"
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          <CategoryChip
            label="All"
            count={galleryCounts.all}
            active={galleryFilter === "all"}
            onPress={() => setGalleryFilter("all")}
          />
          {galleryCounts.exterior > 0 && (
            <CategoryChip
              label="Exterior"
              count={galleryCounts.exterior}
              active={galleryFilter === "exterior"}
              onPress={() => setGalleryFilter("exterior")}
            />
          )}
          {galleryCounts.amenities > 0 && (
            <CategoryChip
              label="Amenities"
              count={galleryCounts.amenities}
              active={galleryFilter === "amenities"}
              onPress={() => setGalleryFilter("amenities")}
            />
          )}
          {galleryCounts.landscape > 0 && (
            <CategoryChip
              label="Landscape"
              count={galleryCounts.landscape}
              active={galleryFilter === "landscape"}
              onPress={() => setGalleryFilter("landscape")}
            />
          )}
          {galleryCounts.others > 0 && (
            <CategoryChip
              label="Others"
              count={galleryCounts.others}
              active={galleryFilter === "others"}
              onPress={() => setGalleryFilter("others")}
            />
          )}
        </ScrollView>
        {renderGalleryGrid()}
      </BottomSheet>

      {/* ── Brochure Modal ── */}
      <BottomSheet
        visible={activeModal === "brochure"}
        onClose={closeModal}
        title="Project Brochure"
        subtitle="Download project brochure"
      >
        {renderBrochureContent()}
      </BottomSheet>

      {/* ── Walkthrough Modal ── */}
      <BottomSheet
        visible={activeModal === "walkthrough"}
        onClose={closeModal}
        title="Virtual Walkthrough"
        subtitle="Experience the project in 3D"
      >
        {renderWalkthroughContent()}
      </BottomSheet>

      {/* ── Plot Availability Modal ── */}
      <BottomSheet
        visible={activeModal === "plots"}
        onClose={closeModal}
        title="Plot Availability"
        subtitle="Check available plots and layout"
      >
        {renderPlotContent()}
      </BottomSheet>

      {/* ── Legal Documents Modal ── */}
      <BottomSheet
        visible={activeModal === "legal"}
        onClose={closeModal}
        title="Legal Documents"
        subtitle="Approvals, legal and compliance"
      >
        {renderLegalContent()}
      </BottomSheet>

      {/* ── Construction Updates Modal ── */}
      <BottomSheet
        visible={activeModal === "construction"}
        onClose={closeModal}
        title="Construction Update"
        subtitle="Track project progress"
      >
        {renderConstructionContent()}
      </BottomSheet>

      {/* ── Social Media Creatives Modal ── */}
      <BottomSheet
        visible={activeModal === "creatives"}
        onClose={closeModal}
        title="Social Media Creative"
        subtitle="Marketing assets and creatives"
      >
        {renderCreativesContent()}
      </BottomSheet>
      <CustomDialog visible={Boolean(resourceError)} title="Cannot open resource" message={resourceError || ""} confirmText="OK" onClose={() => setResourceError(null)} onConfirm={() => setResourceError(null)} />
    </SafeAreaView>
  );
};

export default PropertyDetailScreen;

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  // Header
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerBtn: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    height: 42,
    justifyContent: "center",
    width: 42,
  },
  headerTitle: {
    color: "#0D0D0D",
    fontFamily: theme.fonts.extraBold,
    fontSize: 22,
    letterSpacing: 3,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
  },
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  // Carousel
  carouselWrap: {
    borderRadius: 14,
    marginBottom: 16,
    overflow: "hidden",
  },
  imageSlide: {
    width: SCREEN_WIDTH - 32,
    height: IMAGE_HEIGHT,
  },
  carouselImage: {
    borderRadius: 14,
    height: "100%",
    width: "100%",
  },
  dotsRow: {
    bottom: 14,
    flexDirection: "row",
    gap: 5,
    left: 16,
    position: "absolute",
  },
  dot: {
    backgroundColor: "rgba(255,255,255,0.45)",
    borderRadius: 3,
    height: 5,
    width: 10,
  },
  activeDotTrack: {
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: 3,
    height: 5,
    overflow: "hidden",
    width: ACTIVE_DOT_WIDTH,
  },
  activeDotFill: {
    backgroundColor: "#FFFFFF",
    borderRadius: 3,
    height: "100%",
  },
  imageCounter: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 8,
    bottom: 12,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    right: 12,
  },
  imageCounterText: {
    color: "#FFFFFF",
    fontFamily: theme.fonts.medium,
    fontSize: 12,
  },
  // Title & Status
  titleRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  projectName: {
    color: theme.colors.blackText,
    flex: 1,
    fontFamily: theme.fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    marginRight: 10,
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 8,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgeText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
  },
  // Location
  locationRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginBottom: 16,
  },
  locationText: {
    color: "#777777",
    flex: 1,
    fontFamily: theme.fonts.regular,
    fontSize: 13,
  },
  // Stats
  statsCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0F0F0",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    overflow: "hidden",
  },
  statPill: {
    alignItems: "center",
    flex: 1,
    paddingVertical: 14,
    gap: 4,
  },
  statPillBorder: {
    borderRightColor: "#F0F0F0",
    borderRightWidth: 1,
  },
  statValue: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  statLabel: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 11,
  },
  // Description
  descriptionWrap: {
    marginBottom: 20,
  },
  descriptionText: {
    color: "#555555",
    fontFamily: theme.fonts.regular,
    fontSize: 13.5,
    lineHeight: 21,
  },
  readMoreRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
    marginTop: 6,
  },
  readMoreText: {
    color: "#191919",
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
  },
  // Sections
  sectionHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 17,
    marginBottom: 10,
  },
  seeAll: {
    color: theme.colors.graysubtext,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
    marginBottom: 10,
  },
  // Menu Cards
  menuCard: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F0F0F0",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  menuItemBorder: {
    borderBottomColor: "#F5F5F5",
    borderBottomWidth: 1,
  },
  menuIconWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    marginRight: 14,
    width: 40,
  },
  menuTextWrap: {
    flex: 1,
  },
  menuLabel: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  menuSubtitle: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },

  // ═══════════ MODAL STYLES ═══════════
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    height: SCREEN_HEIGHT * 0.60,
    maxHeight: SCREEN_HEIGHT * 0.92,
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  dragHandle: {
    backgroundColor: "#DDDDDD",
    borderRadius: 3,
    height: 5,
    width: 40,
  },
  modalHeader: {
    alignItems: "flex-start",
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
    fontSize: 20,
  },
  modalSubtitle: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    marginTop: 3,
  },
  modalCloseBtn: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    height: 36,
    justifyContent: "center",
    marginLeft: 12,
    width: 36,
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // ── Gallery Modal ──
  chipRow: {
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 0,
  },
  chipBtn: {
    backgroundColor: "#F6F6F6",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  chipBtnActive: {
    backgroundColor: "#191919",
  },
  chipText: {
    color: "#444444",
    fontFamily: theme.fonts.medium,
    fontSize: 13,
  },
  chipTextActive: {
    color: "#FFFFFF",
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  galleryThumb: {
    borderRadius: 10,
    height: GRID_IMAGE_SIZE,
    overflow: "hidden",
    width: GRID_IMAGE_SIZE,
  },
  galleryThumbImg: {
    height: "100%",
    width: "100%",
  },

  // ── Brochure Modal ──
  brochureCard: {
    alignItems: "center",
    backgroundColor: "#FFF9F3",
    borderColor: "#FFE5CC",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    padding: 16,
  },
  brochureIconWrap: {
    alignItems: "center",
    backgroundColor: "#FFF0E0",
    borderRadius: 12,
    height: 52,
    justifyContent: "center",
    width: 52,
  },
  brochureTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  brochureSubtitle: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  downloadBtn: {
    alignItems: "center",
    backgroundColor: "#C96A10",
    borderRadius: 12,
    height: 40,
    justifyContent: "center",
    width: 40,
  },

  // ── Walkthrough Modal ──
  walkthroughCard: {
    borderColor: "#F0F0F0",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  walkthroughPreview: {
    height: 200,
    position: "relative",
  },
  walkthroughImage: {
    height: "100%",
    width: "100%",
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
  },
  playBtn: {
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderColor: "rgba(255,255,255,0.6)",
    borderRadius: 32,
    borderWidth: 2,
    height: 64,
    justifyContent: "center",
    width: 64,
  },
  walkthroughInfo: {
    padding: 16,
  },
  walkthroughTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
  },
  walkthroughSub: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },

  // ── Plot Modal ──
  plotLayoutWrap: {
    backgroundColor: "#FAFAFA",
    borderColor: "#F0F0F0",
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    overflow: "hidden",
    padding: 8,
  },
  plotLayoutImg: {
    height: 220,
    width: "100%",
  },
  configList: {
    marginBottom: 16,
  },
  configHeading: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    marginBottom: 10,
  },
  configItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
  },
  configItemBorder: {
    borderBottomColor: "#F5F5F5",
    borderBottomWidth: 1,
  },
  configIconWrap: {
    alignItems: "center",
    backgroundColor: "#FFF5EC",
    borderRadius: 10,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  configTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.medium,
    fontSize: 14,
  },
  configSub: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  configPrice: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  plotStatusPill: {
    borderRadius: 6,
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  plotStatusText: {
    fontFamily: theme.fonts.medium,
    fontSize: 11,
  },
  plotDetailsCard: {
    backgroundColor: "#FAFAFA",
    borderColor: "#F0F0F0",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  plotDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  plotDetailLabel: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
  },
  plotDetailValue: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 13,
  },

  // ── Legal Documents Modal ──
  docRow: {
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  docRowBorder: {
    borderBottomColor: "#F5F5F5",
    borderBottomWidth: 1,
  },
  docIconWrap: {
    alignItems: "center",
    backgroundColor: theme.colors.borderlightgraycolour,
    borderRadius: 10,
    height: 40,
    justifyContent: "center",
    marginRight: 14,
    width: 40,
  },
  docTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  docSubtitle: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 2,
  },
  docActionWrap: {
    marginLeft: 10,
  },
  docBadgeAvailable: {
    alignItems: "center",
    backgroundColor: "#FFF5EC",
    borderRadius: 8,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docBadgeTextAvailable: {
    color: "#C96A10",
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
  },
  docBadgePending: {
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  docBadgeTextPending: {
    color: "#888888",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
  },

  // ── Construction Timeline ──
  timelineItem: {
    flexDirection: "row",
    gap: 14,
    paddingBottom: 18,
  },
  timelineBorder: {
    borderLeftColor: "#E8E8E8",
    borderLeftWidth: 0,
  },
  timelineDot: {
    alignItems: "center",
    borderRadius: 14,
    height: 26,
    justifyContent: "center",
    marginTop: 2,
    width: 26,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 14,
    borderBottomColor: "#F5F5F5",
    borderBottomWidth: 1,
  },
  timelineTitle: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 14,
  },
  timelineDate: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 12,
    marginTop: 3,
  },
  timelineDesc: {
    color: "#666666",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  progressWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  progressTrack: {
    backgroundColor: "#F0F0F0",
    borderRadius: 4,
    flex: 1,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    backgroundColor: "#C96A10",
    borderRadius: 4,
    height: "100%",
  },
  progressText: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.semiBold,
    fontSize: 12,
  },

  // ── Social Media Creatives ──
  creativeThumb: {
    borderRadius: 10,
    marginBottom: 4,
    overflow: "hidden",
    width: GRID_IMAGE_SIZE,
  },
  creativeThumbImg: {
    height: GRID_IMAGE_SIZE,
    width: "100%",
  },
  creativeCaption: {
    backgroundColor: "#FAFAFA",
    color: "#666666",
    fontFamily: theme.fonts.regular,
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },

  // ── Empty States ──
  emptyModalState: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 30,
  },
  emptyModalText: {
    color: "#555555",
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    marginTop: 14,
  },
  emptyModalSubtext: {
    color: "#999999",
    fontFamily: theme.fonts.regular,
    fontSize: 13,
    marginTop: 5,
    textAlign: "center",
  },
});
