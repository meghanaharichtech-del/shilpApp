import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';

export default function EarningsScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.text}>Coming soon</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.purewhiteBackground,
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  text: {
    fontFamily: theme.fonts.regular,
    fontSize: 16,
    color: theme.colors.subText,
  },
});
