import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ChevronRight, FileText, HelpCircle, LogOut, ShieldCheck, Trash2, UserRound } from 'lucide-react-native';
import CustomDialog from '../components/CustomDialog';
import { useNotifications } from '../context/NotificationContext';
import { StorageUtils } from '../utils/StorageUtils';
import { theme } from '../utils/theme';

function SettingRow({ icon: Icon, title, subtitle, onPress, destructive = false, last = false }) {
  const color = destructive ? '#B42318' : '#252525';
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, !last && styles.rowBorder, pressed && styles.pressed]}>
    <View style={[styles.icon, destructive && styles.destructiveIcon]}><Icon size={19} color={color} strokeWidth={1.9} /></View>
    <View style={styles.rowText}><Text style={[styles.rowTitle, destructive && styles.destructiveText]}>{title}</Text>{subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}</View>
    <ChevronRight size={18} color={destructive ? '#B42318' : '#999999'} />
  </Pressable>;
}

export default function SettingsScreen({ navigation }) {
  const [dialog, setDialog] = useState(null);
  const { clearNotifications } = useNotifications();

  const logout = () => setDialog({
    title: 'Log out?',
    message: 'You will need to sign in again to access your broker account.',
    confirmLabel: 'Log Out',
    cancelLabel: 'Cancel',
    action: async () => {
      await Promise.all([StorageUtils.removeItem('userData'), StorageUtils.removeItem('brokerProfile')]);
      clearNotifications();
      navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
    },
  });

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <View style={styles.header}><Pressable accessibilityLabel="Go back" onPress={() => navigation.goBack()} style={styles.back}><ArrowLeft size={21} color="#191919" /></Pressable><Text style={styles.title}>Settings</Text><View style={styles.headerSpacer} /></View>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Account</Text>
      <View style={styles.card}><SettingRow icon={UserRound} title="Edit profile" subtitle="Broker and company information" last onPress={() => navigation.navigate('ProfileEditScreen')} /></View>

      <Text style={styles.sectionTitle}>Support & compliance</Text>
      <View style={styles.card}>
        <SettingRow icon={ShieldCheck} title="Privacy policy" subtitle="How your information is protected" onPress={() => setDialog({ title: 'Privacy Policy', message: 'Shilp App protects your account, customer leads, and business information in accordance with applicable privacy and real estate regulatory requirements.' })} />
        <SettingRow icon={FileText} title="Terms & conditions" subtitle="Channel partner agreement" onPress={() => setDialog({ title: 'Terms & Conditions', message: 'Project presentations, client registrations, commissions, and account use are governed by the Shilp channel partner agreement.' })} />
        <SettingRow icon={HelpCircle} title="Help & partner support" subtitle="support@shilpgroup.com" last onPress={() => Linking.openURL('mailto:support@shilpgroup.com')} />
      </View>

      <Text style={styles.sectionTitle}>Session</Text>
      <View style={styles.card}>
        <SettingRow icon={LogOut} title="Log out" onPress={logout} />
        <SettingRow icon={Trash2} title="Delete account" subtitle="Permanently remove your account" destructive last onPress={() => navigation.navigate('DeleteAccountScreen')} />
      </View>
      <Text style={styles.version}>Shilp App · Channel Partner v1.0.0</Text>
    </ScrollView>
    <CustomDialog visible={Boolean(dialog)} title={dialog?.title} message={dialog?.message} confirmLabel={dialog?.confirmLabel} cancelLabel={dialog?.cancelLabel} onClose={() => setDialog(null)} onConfirm={dialog?.action} />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { backgroundColor: theme.colors.backgroundmaincolor, flex: 1 },
  header: { alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomColor: '#EBEBEB', borderBottomWidth: 1, flexDirection: 'row', minHeight: 58, paddingHorizontal: 12 },
  back: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 }, headerSpacer: { width: 40 }, title: { color: '#191919', flex: 1, fontFamily: theme.fonts.bold, fontSize: 18, textAlign: 'center' },
  content: { padding: 16, paddingBottom: 36 }, sectionTitle: { color: '#555555', fontFamily: theme.fonts.bold, fontSize: 13, marginBottom: 9, marginTop: 18 },
  card: { backgroundColor: '#FFFFFF', borderColor: '#E8E8E8', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  row: { alignItems: 'center', flexDirection: 'row', minHeight: 68, paddingHorizontal: 14, paddingVertical: 12 }, rowBorder: { borderBottomColor: '#EEEEEE', borderBottomWidth: 1 }, pressed: { backgroundColor: '#F7F7F7' },
  icon: { alignItems: 'center', backgroundColor: '#F2F2F2', borderRadius: 8, height: 38, justifyContent: 'center', width: 38 }, destructiveIcon: { backgroundColor: '#FEF3F2' },
  rowText: { flex: 1, marginLeft: 12 }, rowTitle: { color: '#252525', fontFamily: theme.fonts.semiBold, fontSize: 14 }, rowSubtitle: { color: '#858585', fontFamily: theme.fonts.regular, fontSize: 11.5, marginTop: 2 }, destructiveText: { color: '#B42318' },
  version: { color: '#AAAAAA', fontFamily: theme.fonts.regular, fontSize: 11, marginTop: 24, textAlign: 'center' },
});
