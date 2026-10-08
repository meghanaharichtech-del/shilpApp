import React from 'react';
import { Image, Text, TouchableOpacity } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Field, styles } from './AuthLayout';
export default function CompanyFields({
  name,
  setName,
  logo,
  setLogo,
  onError
}) {
  async function pick() {
    try {
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
  return <><Field label="Company name" value={name} onChangeText={setName} maxLength={200} />{logo ? <Image source={{
      uri: logo
    }} style={{
      height: 90,
      width: 90,
      borderRadius: 12
    }} resizeMode="contain" /> : null}<TouchableOpacity onPress={pick}><Text style={styles.link}>{logo ? 'Change company logo' : 'Upload company logo'}</Text></TouchableOpacity><Field label="Or enter a logo URL" value={logo.startsWith('data:') ? '' : logo} onChangeText={setLogo} autoCapitalize="none" keyboardType="url" placeholder="https://example.com/logo.png" /></>;
}
export function validCompany(name, logo) {
  return !!name.trim() && name.trim().length <= 200 && (/^https?:\/\/[^\s]+$/i.test(logo.trim()) || /^data:image\/(png|jpeg|webp);base64,/.test(logo));
}
