import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import { File } from 'expo-file-system';
import { WebView } from 'react-native-webview';
import { ArrowLeft, Download } from 'lucide-react-native';
import { loadDocumentFile, downloadDocument } from '../utils/documentFiles';

export default function PdfDocumentViewer({ document, onBack, height = 450 }) {
  const webview = useRef(null);
  const data = useRef(null);
  const ready = useRef(false);
  const busy = useRef(false);
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [retry, setRetry] = useState(0);
  const injectDocument = () => {
    if (ready.current && data.current) webview.current?.injectJavaScript(`window.renderPdf(${JSON.stringify(data.current)}); true;`);
  };
  useEffect(() => {
    let active = true;
    ready.current = false; data.current = null;
    const load = async () => {
      const [asset, file] = await Promise.all([
        Asset.fromModule(require('../assets/pdf-viewer/viewer.html')).downloadAsync(),
        loadDocumentFile(document.url, document.title),
      ]);
      if (!active) return;
      if (file.browser) throw new Error('The embedded reader is available in the mobile app.');
      const source = await new File(asset.localUri || asset.uri).text();
      const encoded = await file.base64();
      if (!active) return;
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        const mime = file.name.endsWith('.png') ? 'image/png' : file.name.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
        setHtml(`<html><meta name="viewport" content="width=device-width,initial-scale=1"><img style="width:100%" src="data:${mime};base64,${encoded}" /></html>`);
        setLoading(false);
      } else { data.current = encoded; setHtml(source); }
    };
    load().catch(err => { if(active) {setError(err.message);setLoading(false);} });
    return () => {active = false;};
  }, [document.url, document.title, retry]);
  const download = async () => {
    if (busy.current) return;
    busy.current = true; setDownloading(true);
    try { await downloadDocument(document.url, document.title); }
    catch(err) {setError(err.message);}
    finally {busy.current=false;setDownloading(false);}
  };
  return <View style={{ height }}>
    <View style={styles.toolbar}><Pressable accessibilityLabel="Back to documents" onPress={onBack} style={styles.button}><ArrowLeft size={18} /><Text>Back</Text></Pressable><Pressable accessibilityLabel="Download PDF" disabled={downloading} onPress={download} style={styles.button}>{downloading ? <ActivityIndicator /> : <Download size={18} />}<Text>{downloading ? 'Downloading…' : 'Download'}</Text></Pressable></View>
    {error ? <View style={styles.state}><Text>{error}</Text><Pressable onPress={() => {setError('');setHtml(null);setLoading(true);setRetry(value=>value+1);}} style={styles.button}><Text>Retry</Text></Pressable></View> : html ? <WebView ref={webview} source={{ html, baseUrl: 'https://shilp-viewer.invalid/' }} originWhitelist={['*']} javaScriptEnabled style={styles.viewer} onShouldStartLoadWithRequest={request => ['about:blank', 'https://shilp-viewer.invalid/'].includes(request.url)} onMessage={event => {
      try { const message=JSON.parse(event.nativeEvent.data); if(message.type==='ready'){ready.current=true;injectDocument();} if(message.type==='rendered')setLoading(false); if(message.type==='error'){setError(message.message);setLoading(false);} } catch {setError('Unable to read the PDF viewer response.');}
    }} onError={() => {setError('Unable to load the PDF viewer.');setLoading(false);}} /> : null}
    {loading && !error && <View pointerEvents="none" style={styles.loading}><ActivityIndicator /><Text>Loading PDF…</Text></View>}
  </View>;
}
const styles=StyleSheet.create({ toolbar:{flexDirection:'row',justifyContent:'space-between',paddingBottom:10},button:{flexDirection:'row',alignItems:'center',gap:8,padding:10},viewer:{flex:1,backgroundColor:'#EEEEEE'},state:{flex:1,justifyContent:'center',alignItems:'center',gap:10,padding:16},loading:{position:'absolute',top:80,left:0,right:0,alignItems:'center',gap:8} });
