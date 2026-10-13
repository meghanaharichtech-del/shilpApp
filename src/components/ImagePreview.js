import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Minus, Plus } from 'lucide-react-native';
import { resolveMediaUrl } from '../utils/mediaUrl';

export default function ImagePreview({ uri, title = 'Project image', style, children }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { width, height } = useWindowDimensions();
  const url = resolveMediaUrl(uri);
  return <>
    <Pressable style={style} accessibilityRole="button" accessibilityLabel={`Preview ${title}`} disabled={!url} onPress={() => { setZoom(1); setFailed(false); setLoading(true); setOpen(true); }}>{children}</Pressable>
    <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}><Text style={styles.title}>{title}</Text><Pressable accessibilityLabel="Close image" style={styles.button} onPress={() => setOpen(false)}><X color="white" size={24} /></Pressable></View>
        {open && <ScrollView contentContainerStyle={{ flexGrow: 1 }}><ScrollView horizontal contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
          <Image source={{ uri: url }} resizeMode="contain" style={{ width: width * zoom, height: Math.max(200, height - 180) * zoom }} onLoadEnd={() => setLoading(false)} onError={() => setFailed(true)} />
        </ScrollView></ScrollView>}
        {loading && !failed && <ActivityIndicator style={styles.loading} color="white" />}
        {failed && <Text style={styles.error}>Unable to load this image. Close and tap to retry.</Text>}
        <View style={styles.controls}><Pressable accessibilityLabel="Zoom out" style={styles.button} onPress={() => setZoom(value => Math.max(1, value - 0.5))}><Minus color="white" /></Pressable><Text style={styles.label}>{Math.round(zoom * 100)}%</Text><Pressable accessibilityLabel="Zoom in" style={styles.button} onPress={() => setZoom(value => Math.min(3, value + 0.5))}><Plus color="white" /></Pressable></View>
      </SafeAreaView>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#141414' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { flex: 1, color: 'white', fontSize: 16 },
  button: { padding: 12, minHeight: 48, minWidth: 48, alignItems: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  label: { color: 'white' },
  loading: { position: 'absolute', top: '50%', alignSelf: 'center' },
  error: { color: 'white', textAlign: 'center', padding: 16 },
});
