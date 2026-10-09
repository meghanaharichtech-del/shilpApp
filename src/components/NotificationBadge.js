import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../utils/theme';

export default function NotificationBadge({ count, style }) {
  if (!count) return null;

  return (
    <View style={[styles.badge, style]} pointerEvents="none">
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    backgroundColor: '#D92D20',
    borderColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1.5,
    height: 18,
    justifyContent: 'center',
    minWidth: 18,
    paddingHorizontal: 4,
    position: 'absolute',
  },
  text: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.bold,
    fontSize: 9,
    lineHeight: 11,
  },
});
