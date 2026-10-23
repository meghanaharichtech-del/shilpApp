import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Phone, UserRound } from 'lucide-react-native';
import { theme } from '../utils/theme';

const textValue = (...values) => values.find(value =>
  (typeof value === 'string' || typeof value === 'number') && String(value).trim()
);

export default function PropertyContact({ project }) {
  const item = project?.project || project || {};
  const contact = item.contactPerson;
  const name = textValue(contact?.name, contact, item.contactName, item.contactDetails?.name);
  const phone = textValue(item.contactPhone, contact?.contactPhone, contact?.contactPhone, item.contactDetails?.phone, item.contactPhone);
  const callPhone = () => {
    if (!phone) return;
    const dialNumber = String(phone).replace(/[^\d+*#]/g, '');
    Linking.openURL(`tel:${dialNumber}`).catch(() => {});
  };
  return <View style={styles.container}>
    <View style={[styles.row, styles.rowBorder]}>
      <View style={styles.iconWrap}><UserRound size={20} color={theme.colors.graysubtext} strokeWidth={1.6} /></View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>Contact person</Text>
        <Text style={styles.value}>{name || 'Contact person unavailable'}</Text>
      </View>
    </View>
    <Pressable
      accessibilityRole={phone ? 'link' : undefined}
      accessibilityLabel={phone ? `Call ${phone}` : 'Phone number unavailable'}
      disabled={!phone}
      onPress={callPhone}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.iconWrap}><Phone size={20} color={theme.colors.graysubtext} strokeWidth={1.6} /></View>
      <View style={styles.textWrap}>
        <Text style={styles.label}>Phone number</Text>
        <Text style={[styles.value, phone && styles.phoneValue]}>{phone || 'Number unavailable'}</Text>
      </View>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.purewhiteBackground },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 14 },
  rowPressed: { opacity: 0.65 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.backgroundmaincolor },
  iconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: theme.colors.borderlightgraycolour, alignItems: 'center', justifyContent: 'center' },
  textWrap: { flex: 1, minWidth: 0 },
  label: { fontFamily: theme.fonts.semiBold, color: theme.colors.blackText, fontSize: 14 },
  value: { fontFamily: theme.fonts.regular, color: theme.colors.subText, fontSize: 12, marginTop: 3 },
  phoneValue: { color: theme.colors.orangeColor },
});
