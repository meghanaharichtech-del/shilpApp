import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';
import { Heart } from 'lucide-react-native';
import { useFavorites } from '../context/FavoritesContext';

export default function FavoriteHeartOverlay({ project }) {
  const { isFavorite } = useFavorites();
  const liked = isFavorite(project);
  const previousLiked = useRef(liked);
  const reduceMotion = useRef(false);
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then(enabled => {
      if (active) reduceMotion.current = enabled;
    }).catch(() => {});
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', enabled => {
      reduceMotion.current = enabled;
      if (enabled) {
        progress.stopAnimation();
        progress.setValue(0);
      }
    });
    return () => { active = false; subscription.remove(); };
  }, [progress]);

  useEffect(() => {
    const justLiked = liked && !previousLiked.current;
    previousLiked.current = liked;
    progress.setValue(0);
    if (!justLiked || reduceMotion.current) return;
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 750,
      useNativeDriver: true,
      isInteraction: false,
    });
    animation.start();
    return () => animation.stop();
  }, [liked, progress]);

  return (
    <View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.overlay}>
      <Animated.View style={{
        opacity: progress.interpolate({ inputRange: [0, 0.15, 0.65, 1], outputRange: [0, 1, 1, 0] }),
        transform: [{ scale: progress.interpolate({ inputRange: [0, 0.25, 0.4, 0.7, 1], outputRange: [0.3, 1.2, 1, 1, 0.8] }) }],
      }}>
        <Heart size={76} color="#FFFFFF" fill="#E53935" strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
});
