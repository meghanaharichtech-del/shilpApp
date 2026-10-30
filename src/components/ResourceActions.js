import React, { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Download, Send } from 'lucide-react-native';
import { saveDocumentFile, shareDocument } from '../utils/documentFiles';

export default function ResourceActions({ url, title = 'Project file', dark = false, compact = false }) {
  const busy = useRef(false);
  const [action, setAction] = useState(null);
  const [message, setMessage] = useState('');
  const color = dark ? '#FFFFFF' : '#191919';
  const run = async kind => {
    if (busy.current) return;
    busy.current = true;
    setAction(kind);
    setMessage('');
    try {
      if (kind === 'share') await shareDocument(url, title);
      else { await saveDocumentFile(url, title); setMessage('File saved'); }
    } catch (error) {
      if (error?.name !== 'AbortError' && !/cancel|dismiss/i.test(`${error?.code || ''} ${error?.message || ''}`)) {
        setMessage(error?.message || 'Unable to prepare this file. Please try again.');
      }
    } finally { busy.current = false; setAction(null); }
  };
  if (!url) return null;
  return <View style={compact && styles.compact}>
    <View style={styles.row}>
      {[['share', Send, 'Share'], ['save', Download, 'Download']].map(([kind, Icon, label]) =>
        <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`${label} ${title}`} accessibilityState={{ disabled: Boolean(action), busy: action === kind }} disabled={Boolean(action)} onPress={() => run(kind)} style={({ pressed }) => [styles.button, dark && styles.darkButton, pressed && styles.pressed, action && styles.disabled]}>
          {action === kind ? <ActivityIndicator size="small" color={color} /> : <Icon size={22} strokeWidth={1.8} color={color} />}
          {!compact && <Text style={{ color, fontSize: 12 }}>{label}</Text>}
        </Pressable>)}
    </View>
    {message ? <Text accessibilityLiveRegion="polite" style={[styles.message, dark && { color: '#FFFFFF' }]}>{message}</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  button: { minWidth: 44, minHeight: 44, padding: 8, alignItems: 'center', justifyContent: 'center', gap: 4 },
  darkButton: { backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 12 },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.6 },
  compact: { maxWidth: '100%' },
  message: { fontSize: 12, color: '#555555', padding: 4 },
});
