import ResourceActions from './ResourceActions';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { X, ChevronRight, FileText, ExternalLink } from 'lucide-react-native';
import { loadDocumentFile, googleDriveDocument } from '../utils/documentFiles';

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

export default function PdfDocumentViewer({ document }) {
  const [open, setOpen] = useState(false);
  const [linkError, setLinkError] = useState('');
  const drive = googleDriveDocument(document.url);
  const title = document.title || 'Project document';
  return <View>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${title}`} onPress={() => setOpen(true)} style={({ pressed }) => [styles.documentRow, pressed && styles.pressed]}>
      <View style={styles.fileIcon}><FileText size={24} color="#8D5B2E" /></View>
      <View style={styles.documentInfo}>
        <Text style={styles.documentTitle} numberOfLines={2}>{title}</Text>
        <Text style={styles.documentSubtitle}>{drive ? 'Google Drive document' : 'Document'} · Tap to view</Text>
      </View>
      <ChevronRight size={20} color="#8C8C8C" />
    </Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <SafeAreaView style={styles.fullscreen}>
        <View style={styles.header}>
          <View style={styles.headerInfo}><Text numberOfLines={2} style={styles.title}>{title}</Text><Text style={styles.documentSubtitle}>Document viewer</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close document" onPress={() => setOpen(false)} style={styles.close}><X size={24} color="#222" /></Pressable>
        </View>
        {open && (drive ? <View style={styles.state}>
          <View style={styles.fileIcon}><FileText size={28} color="#8D5B2E" /></View>
          <Text style={styles.documentTitle}>{title}</Text>
          <Text style={styles.driveDescription}>Open this document in Google Drive to view its contents.</Text>
          <Pressable accessibilityRole="link" style={styles.driveButton} onPress={async () => {
            setLinkError('');
            try { await Linking.openURL(document.url.trim()); }
            catch { setLinkError('Unable to open this link. Please try again.'); }
          }}><ExternalLink size={18} color="#FFFFFF" /><Text style={styles.driveButtonText}>Open in Google Drive</Text></Pressable>
          {linkError ? <Text accessibilityRole="alert" style={styles.linkError}>{linkError}</Text> : null}
        </View> : <PdfSurface document={document} preview={false} />)}
        <View style={styles.fullscreenActions}><ResourceActions url={document.url} title={title} /></View>
      </SafeAreaView>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 76, padding: 6 },
  pressed: { opacity: 0.65 },
  fileIcon: { width: 48, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5ECE3' },
  documentInfo: { flex: 1, minWidth: 0, gap: 5 },
  documentTitle: { fontSize: 14, fontWeight: '600', color: '#191919' },
  documentSubtitle: { fontSize: 12, color: '#777777', marginTop: 3 },
  headerInfo: { flex: 1, minWidth: 0, gap: 3 },
  driveDescription: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 21 },
  driveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 48, borderRadius: 12, backgroundColor: '#8D5B2E', paddingHorizontal: 18, paddingVertical: 12 },
  driveButtonText: { color: '#FFFFFF', fontWeight: '600' },
  linkError: { color: '#B3261E', textAlign: 'center' },
  surface: { flex: 1, backgroundColor: '#F3F3F3' },
  fullscreenActions: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#EEEEEE' },
  fullscreen: { flex: 1, backgroundColor: 'white' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#EEE' },
  title: { fontSize: 16, fontWeight: '600', color: '#191919' },
  close: { padding: 10 },
  state: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10, padding: 16 },
  retry: { padding: 10 },
  loading: { position: 'absolute', top: '40%', left: 0, right: 0, alignItems: 'center', gap: 8 },
});
