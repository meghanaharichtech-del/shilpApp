import React, { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

export default function InAppNotificationBanner({ notification, onPress, onClose }) {
  const insets = useSafeAreaInsets();
  const [translateY] = useState(() => new Animated.Value(-140));

  useEffect(() => {
    if (!notification) return undefined;
    translateY.setValue(-140);
    Animated.spring(translateY, { toValue: 0, damping: 18, stiffness: 180, mass: 0.8, useNativeDriver: true }).start();
    const timeout = setTimeout(onClose, 5000);
    return () => clearTimeout(timeout);
  }, [notification, onClose, translateY]);

  if (!notification) return null;
  return <Animated.View style={[styles.position, { paddingTop: Math.max(insets.top, 8), transform: [{ translateY }] }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open notification: ${notification.title}`} onPress={onPress} style={styles.banner}>
      <View style={styles.icon}><Bell size={19} color={theme.colors.orangeColor} /></View>
      <View style={styles.content}><Text style={styles.label}>New notification</Text><Text style={styles.title} numberOfLines={1}>{notification.title}</Text><Text style={styles.description} numberOfLines={2}>{notification.description}</Text></View>
      <Pressable accessibilityLabel="Dismiss notification" hitSlop={10} onPress={event => { event.stopPropagation(); onClose(); }} style={styles.close}><X size={17} color="#777777" /></Pressable>
    </Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  position: { left: 12, position: 'absolute', right: 12, top: 0, zIndex: 1000 },
  banner: { alignItems: 'flex-start', backgroundColor: '#FFFFFF', borderColor: '#E5E5E5', borderRadius: 8, borderWidth: 1, elevation: 12, flexDirection: 'row', padding: 12, shadowColor: '#000000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 12 },
  icon: { alignItems: 'center', backgroundColor: '#FFF0E7', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  content: { flex: 1, marginLeft: 10 }, label: { color: theme.colors.orangeColor, fontFamily: theme.fonts.bold, fontSize: 10, textTransform: 'uppercase' }, title: { color: '#191919', fontFamily: theme.fonts.bold, fontSize: 13, marginTop: 2 }, description: { color: '#666666', fontFamily: theme.fonts.regular, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  close: { alignItems: 'center', height: 30, justifyContent: 'center', marginLeft: 4, marginTop: -5, width: 30 },
});
