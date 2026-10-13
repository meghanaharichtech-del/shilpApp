import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { X, Maximize2, Download } from 'lucide-react-native';
import { loadDocumentFile, downloadDocument } from '../utils/documentFiles';

function PdfSurface({ document, preview }) {
  const webview = useRef(null);
  const data = useRef(null);
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const asset = await Asset.fromModule(require('../assets/pdf-viewer/viewer.html')).downloadAsync();
      let source, encoded;
      if (Platform.OS === 'web') {
        const [htmlResponse, pdfResponse] = await Promise.all([fetch(asset.uri), fetch(document.url)]);
        if (!htmlResponse.ok || !pdfResponse.ok) throw new Error('Unable to download PDF preview');
        source = await htmlResponse.text();
        const blob = await pdfResponse.blob();
        encoded = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result).split(',')[1]);
          reader.onerror = () => reject(new Error('Unable to read PDF'));
          reader.readAsDataURL(blob);
        });
      } else {
        const file = await loadDocumentFile(document.url, document.title);
        source = await new File(asset.localUri || asset.uri).text();
        encoded = await file.base64();
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          const mime = file.name.endsWith('.png') ? 'image/png' : file.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
          if (active) { setHtml(`<html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><img style="width:100%;height:100vh;object-fit:contain" src="data:${mime};base64,${encoded}" /></body></html>`); setLoading(false); }
          return;
        }
      }
      if (!active) return;
      data.current = encoded;
      if (Platform.OS === 'web') source = source.replace('<script type="module">', `<script>window.initialPdf=${JSON.stringify(encoded)};window.previewOnly=${preview};</script><script type="module">`);
      setHtml(source);
      if (Platform.OS === 'web') setLoading(false);
    };
    load().catch(err => { if (active) { setError(err.message); setLoading(false); } });
    return () => { active = false; };
  }, [document.url, document.title, preview, retry]);
  return <View style={styles.surface}>
    {error ? <View style={styles.state}><Text>{error}</Text><Pressable onPress={() => { setError(''); setHtml(null); setLoading(true); setRetry(value => value + 1); }} style={styles.retry}><Text>Retry</Text></Pressable></View> : html ? Platform.OS === 'web'
      ? React.createElement('iframe', { srcDoc: html, title: document.title || 'PDF', style: { width: '100%', height: '100%', border: 0 } })
      : <WebView ref={webview} source={{ html, baseUrl: 'https://shilp-viewer.invalid/' }} originWhitelist={['*']} javaScriptEnabled scrollEnabled={!preview} nestedScrollEnabled={!preview} style={styles.surface} onShouldStartLoadWithRequest={request => ['about:blank', 'https://shilp-viewer.invalid/'].includes(request.url)} onMessage={event => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ready' && data.current) webview.current?.injectJavaScript(`window.renderPdf(${JSON.stringify(data.current)}, ${preview}); true;`);
            if (message.type === 'rendered') setLoading(false);
            if (message.type === 'error') { setError(message.message); setLoading(false); }
          } catch { setError('Unable to read PDF'); setLoading(false); }
        }} onError={() => { setError('Unable to load PDF'); setLoading(false); }} /> : null}
    {loading && !error && <View pointerEvents="none" style={styles.loading}><ActivityIndicator /><Text>Loading PDF…</Text></View>}
  </View>;
}

export default function PdfDocumentViewer({ document, height = 300 }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const save = async () => {
    setSaving(true); setSaveError('');
    try { await downloadDocument(document.url, document.title); }
    catch (error) { setSaveError(error.message || 'Unable to save document'); }
    finally { setSaving(false); }
  };
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${document.title || 'PDF'}`} onPress={() => setOpen(true)} style={[styles.preview, { height }]}>
      <View pointerEvents="none" style={styles.surface}><PdfSurface document={document} preview /></View>
      <View style={styles.hint}><Maximize2 size={14} color="#555" /><Text style={styles.hintText}>Tap to open PDF</Text></View>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Save or share document" disabled={saving} style={styles.save} onPress={save}><Download size={18} color="#8D5B2E" /><Text>{saving ? 'Preparing document…' : 'Save / Share PDF'}</Text></Pressable>
    {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.fullscreen}>
        <View style={styles.header}><Text numberOfLines={1} style={styles.title}>{document.title || 'PDF document'}</Text><Pressable accessibilityLabel="Close PDF" onPress={() => setOpen(false)} style={styles.close}><X size={24} color="#222" /></Pressable></View>
        {open && <PdfSurface document={document} preview={false} />}
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  save: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 14, minHeight: 48 },
  saveError: { color: '#B3261E', paddingBottom: 8 },
  surface: { flex: 1, backgroundColor: '#F3F3F3' },
  preview: { overflow: 'hidden', borderRadius: 8, backgroundColor: '#F3F3F3', marginTop: 10 },
  fullscreen: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { flex: 1, fontSize: 16, fontWeight: '600' },
  close: { padding: 10 },
  hint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'white', padding: 10 },
  hintText: { fontSize: 12, color: '#555' },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 16 },
  retry: { padding: 10 },
  loading: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', gap: 8 },
});
