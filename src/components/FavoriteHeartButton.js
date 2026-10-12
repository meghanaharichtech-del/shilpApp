import React, { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Pressable } from "react-native";
import { Heart } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { useFavorites } from "../context/FavoritesContext";
import { projectId } from "../context/favoritesStore";
import { apiError } from "../utils/brokerApi";
export default function FavoriteHeartButton({ project, style, size =18 }) {
  const { isFavorite, toggleFavorite, pending, loading } = useFavorites();
  const [scale] = useState(() => new Animated.Value(1));
  const reduceMotion = useRef(false);
  const animation = useRef(null);

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) reduceMotion.current = enabled;
      })
      .catch(() => {});
    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      (enabled) => {
        reduceMotion.current = enabled;
        if (enabled) {
          animation.current?.stop();
          scale.setValue(1);
        }
      },
    );
    return () => {
      active = false;
      subscription.remove();
      animation.current?.stop();
    };
  }, [scale]);

  const animateHeart = () => {
    animation.current?.stop();
    scale.setValue(1);
    if (reduceMotion.current) return;
    animation.current = Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.85,
        duration: 65,
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.timing(scale, {
        toValue: liked ? 1.1 : 1.3,
        duration: 110,
        useNativeDriver: true,
        isInteraction: false,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 180,
        useNativeDriver: true,
        isInteraction: false,
      }),
    ]);
    animation.current.start();
  };

  const liked = isFavorite(project);
  const disabled =
    loading || pending.has(projectId(project)) || !projectId(project);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        liked ? "Remove property from favourites" : "Add property to favourites"
      }
      accessibilityState={{ selected: liked, disabled }}
      disabled={disabled}
      hitSlop={10}
      style={[{ padding: 8, opacity: disabled ? 0.6 : 1 }, style]}
      onPress={(event) => {
        event.stopPropagation();
        if (disabled) return;
        animateHeart();
        toggleFavorite(project).catch((error) =>
          Toast.show({
            type: "error",
            text1: "Unable to update favourites",
            text2: apiError(error),
          }),
        );
      }}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Heart
          size={size}
          color={liked ? "#E53935" : "#191919"}
          fill={liked ? "#E53935" : "none"}
        />
      </Animated.View>
    </Pressable>
  );
}
