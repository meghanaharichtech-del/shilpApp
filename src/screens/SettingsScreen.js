import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRight, Trash2, UserRound } from 'lucide-react-native';
import { theme } from '../utils/theme';
export default function SettingsScreen({ navigation }) {
  return <SafeAreaView style={styles.screen} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.subtitle}>Manage your account</Text>
    <View style={styles.card}>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('ProfileEditScreen')} style={styles.row}><UserRound size={22} color="#121212" /><Text style={styles.label}>Edit profile</Text><ChevronRight size={20} /></Pressable>
      <Pressable accessibilityRole="button" onPress={() => navigation.navigate('DeleteAccountScreen')} style={styles.row}><Trash2 size={22} color="#B42318" /><Text style={[styles.label, {
            color: '#B42318'
          }]}>Delete account</Text><ChevronRight size={20} color="#B42318" /></Pressable>
    </View>
  </ScrollView></SafeAreaView>;
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.backgroundmaincolor
  },
  content: {
    padding: 24,
    paddingBottom: 110,
    gap: 16
  },
  title: {
    fontFamily: theme.fonts.bold,
    fontSize: 26,
    color: theme.colors.blackText
  },
  subtitle: {
    fontFamily: theme.fonts.regular,
    color: theme.colors.subText
  },
  card: {
    backgroundColor: theme.colors.purewhiteBackground,
    borderRadius: 16
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 20,
    minHeight: 64
  },
  label: {
    flex: 1,
    fontFamily: theme.fonts.semiBold,
    fontSize: 15,
    color: theme.colors.blackText
  }
});
