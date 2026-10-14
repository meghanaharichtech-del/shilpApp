import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
  return <View style={styles.container}>
    <View style={styles.row}><UserRound size={13} color="#8D5B2E" /><Text style={styles.name}>{name || 'Contact person unavailable'}</Text></View>
    <View style={styles.row}><Phone size={13} color="#8D5B2E" /><Text style={styles.phone}>{phone || 'Number unavailable'}</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  container: { borderTopWidth: 1, borderTopColor: '#EFE8E0', paddingTop: 8, gap: 5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flex: 1, fontFamily: theme.fonts.medium, color: '#555', fontSize: 12 },
  phone: { flex: 1, fontFamily: theme.fonts.regular, color: '#777', fontSize: 12 },
});
