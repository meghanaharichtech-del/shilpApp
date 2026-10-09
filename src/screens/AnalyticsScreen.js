import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartNoAxesCombined } from 'lucide-react-native';
import { theme } from '../utils/theme';

export default function AnalyticsScreen() {
  return <SafeAreaView style={styles.screen} edges={['top']}>
    <View style={styles.header}><Text style={styles.headerTitle}>Analytics</Text></View>
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIcon}><ChartNoAxesCombined size={28} color="#7A7A7A" strokeWidth={1.7} /></View>
      <Text style={styles.emptyTitle}>Analytics coming soon</Text>
      <Text style={styles.emptySubtitle}>Your project performance and business insights will appear here.</Text>
    </View>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#FFFFFF', flex: 1 },
  header: { justifyContent: 'center', minHeight: 58, paddingHorizontal: 16 },
  headerTitle: { color: theme.colors.blackText, fontFamily: theme.fonts.bold, fontSize: 18 },
  emptyContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 100, paddingHorizontal: 32 },
  emptyIcon: { alignItems: 'center', backgroundColor: '#F2F2F2', borderRadius: 28, height: 56, justifyContent: 'center', marginBottom: 16, width: 56 },
  emptyTitle: { color: '#242424', fontFamily: theme.fonts.bold, fontSize: 17 },
  emptySubtitle: { color: '#777777', fontFamily: theme.fonts.regular, fontSize: 13, lineHeight: 20, marginTop: 6, maxWidth: 300, textAlign: 'center' },
});
