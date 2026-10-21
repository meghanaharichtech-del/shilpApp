import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { socialLinks } from '../utils/socialLinks';
import { theme } from '../utils/theme';

export default function PropertySocialLinks({ onOpen }) {
  return (
    <View style={styles.row}>
      {socialLinks.map(({ name, icon, url }) => (
        <Pressable
          key={name}
          accessibilityRole="link"
          accessibilityLabel={`Open ${name}`}
          accessibilityState={{ disabled: !url }}
          disabled={!url}
          onPress={() => onOpen(url)}
          style={({ pressed }) => [styles.icon, pressed && styles.pressed]}
        >
          <FontAwesome name={icon} size={22} color={theme.colors.graysubtext} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', gap: 14, paddingVertical: 14, marginBottom: 20 },
  icon: { width: 44, height: 44, borderRadius: 10, backgroundColor: theme.colors.borderlightgraycolour, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.65 },
});
