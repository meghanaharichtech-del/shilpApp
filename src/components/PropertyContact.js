import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Phone, UserRound } from 'lucide-react-native';
import { theme } from '../utils/theme';

const textValue = (...values) => values.find(value =>
  (typeof value === 'string' || typeof value === 'number') && String(value).trim()
);

export default function PropertyContact({ project }) {
  const item = project?.project || project || {};
  const contacts = Array.isArray(item.contacts) ? item.contacts : [item];
  const visible = contacts.filter(contact => contact && (
    contact.contactPerson || contact.contactPhone || contact.contactName ||
    contact.contactDetails?.name || contact.contactDetails?.phone
  ));

  return (
    <View style={styles.list}>
      {visible.length ? visible.map((contact, index) => (
        <ContactDetails key={contact._id || index} project={contact} />
      )) : <ContactDetails project={{}} />}
    </View>
  );
}

function ContactDetails({ project }) {
  const item = project?.project || project || {};
  const contact = item.contactPerson;
  const name = textValue(contact?.name, contact, item.contactName, item.contactDetails?.name);
  const phone = textValue(item.contactPhone, contact?.phone, contact?.contactPhone, item.contactDetails?.phone);
  const dialNumber = phone ? String(phone).replace(/[^\d+*#]/g, '') : '';
  const canCall = /\d/.test(dialNumber);
  const initials = name ? String(name).trim().split(/\s+/).slice(0, 2).map(word => Array.from(word)[0]).join('').toUpperCase() : '';
  const callPhone = () => {
    if (!canCall) return;
    Linking.openURL(`tel:${dialNumber}`).catch(() => {});
  };

  return (
    <Pressable
      accessibilityRole={canCall ? 'link' : undefined}
      accessibilityLabel={canCall ? `Call ${name || 'property contact'} at ${phone}` : `${name || 'Property contact'}, phone number unavailable`}
      disabled={!canCall}
      onPress={callPhone}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      <View style={styles.identity}>
        <View style={styles.avatar}>
          {initials ? <Text style={styles.initials}>{initials}</Text> : (
            <UserRound size={20} color={theme.colors.orangeColor} strokeWidth={1.7} />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.name}>{name || 'Property contact'}</Text>
          <View style={styles.phoneRow}>
            <Phone size={14} color={theme.colors.subText} strokeWidth={1.7} />
            <Text style={[styles.phone, !phone && styles.unavailable]}>
              {phone || 'Phone number unavailable'}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10, marginBottom: 20 },
  card: {
    backgroundColor: theme.colors.purewhiteBackground,
    borderWidth: 1,
    borderColor: '#ECECEC',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    minHeight: 76,
  },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.lightOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontFamily: theme.fonts.semiBold, fontSize: 14, color: '#A83D0A' },
  textWrap: { flex: 1, minWidth: 0 },
  name: { fontFamily: theme.fonts.semiBold, color: theme.colors.blackText, fontSize: 15, lineHeight: 22 },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  phone: { flexShrink: 1, fontFamily: theme.fonts.medium, color: theme.colors.subText, fontSize: 13, lineHeight: 20 },
  unavailable: { fontFamily: theme.fonts.regular, color: theme.colors.subText, fontSize: 12 },
  cardPressed: { backgroundColor: theme.colors.lightOrange },
});
