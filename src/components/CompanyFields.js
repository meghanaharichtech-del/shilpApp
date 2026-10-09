import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Field, styles } from './AuthLayout';
import { ImagePlus } from 'lucide-react-native';
import { theme } from '../utils/theme';
export default function CompanyFields({
  name,
  setName,
  logo,
  setLogo,
  onError
}) {
  async function pick() {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Allow photo library access to choose a company logo.');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
        base64: true
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.base64 || asset.base64.length * 0.75 > 5 * 1024 * 1024) throw new Error('Choose an image smaller than 5 MB.');
      const mime = asset.mimeType || 'image/jpeg';
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(mime)) throw new Error('Choose a PNG, JPEG, or WebP image.');
      setLogo(`data:${mime};base64,${asset.base64}`);
    } catch (e) {
      onError(e.message);
    }
  }
  return <><Field label="Company name" value={name} onChangeText={setName} maxLength={200} /><View style={localStyles.logoRow}>{logo ? <Image source={{ uri: logo }} style={localStyles.logo} resizeMode="contain" /> : <View style={localStyles.logoPlaceholder}><ImagePlus size={25} color={theme.colors.grayiconcolor} /></View>}<TouchableOpacity onPress={pick} style={localStyles.uploadButton}><ImagePlus size={17} color={theme.colors.orangeColor} /><Text style={styles.link}>{logo ? 'Change company logo' : 'Choose logo from gallery'}</Text></TouchableOpacity></View></>;
}
export function validCompany(name, logo) {
  return !!name.trim() && name.trim().length <= 200 && (/^https?:\/\/[^\s]+$/i.test(logo.trim()) || /^data:image\/(png|jpeg|webp);base64,/.test(logo));
}

const localStyles = StyleSheet.create({
  logoRow: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  logo: { backgroundColor: '#F5F5F5', borderRadius: 10, height: 72, width: 72 },
  logoPlaceholder: { alignItems: 'center', backgroundColor: '#F3F3F3', borderRadius: 10, height: 72, justifyContent: 'center', width: 72 },
  uploadButton: { alignItems: 'center', flexDirection: 'row', flexShrink: 1, gap: 7, minHeight: 44 },
});
