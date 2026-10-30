import ResourceActions from './ResourceActions';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { resolveMediaUrl } from '../utils/mediaUrl';

function PhotoPage({ photo, width, height, zoom }) {
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  return <View style={{ width, height }}>
    <ScrollView scrollEnabled={zoom > 1} contentContainerStyle={styles.fill}>
      <ScrollView horizontal scrollEnabled={zoom > 1} contentContainerStyle={styles.center}>
        <Image key={retry} source={{ uri: photo.url }} resizeMode="contain" style={{ width: width * zoom, height: height * zoom }} onLoadEnd={() => setLoading(false)} onError={() => setFailed(true)} />
      </ScrollView>
    </ScrollView>
    {loading && !failed && <ActivityIndicator pointerEvents="none" style={styles.loading} color="white" />}
    {failed && <View style={styles.failure}><Text style={styles.label}>Unable to load this image.</Text><Pressable accessibilityRole="button" style={styles.button} onPress={() => { setFailed(false); setLoading(true); setRetry(value => value + 1); }}><Text style={styles.label}>Retry</Text></Pressable></View>}
  </View>;
}

function PhotoGallery({ uri, title, images, onClose }) {
  const { width, height } = useWindowDimensions();
  const photos = useMemo(() => {
    const items = (images?.length ? images : [{ url: uri, title }]).map((item, index) => ({
      url: resolveMediaUrl(typeof item === 'string' ? item : item?.url || item?.uri || item?.image || item?.fileUrl),
      title: (typeof item === 'object' && item?.title) || (images?.length ? `Photo ${index + 1}` : title),
    })).filter(photo => photo.url);
    if (!items.some(photo => photo.url === resolveMediaUrl(uri))) items.unshift({ url: resolveMediaUrl(uri), title });
    return items;
  }, [images, uri, title]);
  const [index, setIndex] = useState(() => Math.max(0, photos.findIndex(photo => photo.url === resolveMediaUrl(uri))));
  const [zoom, setZoom] = useState(1);
  const [pageHeight, setPageHeight] = useState(Math.max(200, height - 240));
  const list = useRef(null);
  const photo = photos[index] || photos[0];
  const goTo = next => {
    if (next < 0 || next >= photos.length) return;
    setZoom(1);
    setIndex(next);
    list.current?.scrollToIndex({ index: next, animated: true });
  };
  return <SafeAreaView style={styles.screen}>
    <View style={styles.header}>
      <Text numberOfLines={2} style={styles.title}>{photo?.title || title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Close image" style={styles.button} onPress={onClose}><X color="white" size={24} /></Pressable>
    </View>
    <View style={styles.stage} onLayout={event => setPageHeight(Math.max(1, event.nativeEvent.layout.height))}>
      <FlatList key={width} ref={list} data={photos} horizontal pagingEnabled scrollEnabled={zoom === 1} showsHorizontalScrollIndicator={false} initialScrollIndex={index} getItemLayout={(_, position) => ({ length: width, offset: width * position, index: position })} keyExtractor={(item, position) => `${item.url}-${position}`} initialNumToRender={1} maxToRenderPerBatch={3} windowSize={3} extraData={`${index}-${zoom}-${pageHeight}`} onMomentumScrollEnd={event => {
        const next = Math.max(0, Math.min(photos.length - 1, Math.round(event.nativeEvent.contentOffset.x / width)));
        setIndex(next);
        setZoom(1);
      }} renderItem={({ item, index: position }) => <PhotoPage photo={item} width={width} height={pageHeight} zoom={position === index ? zoom : 1} />} />
    </View>
    {photos.length > 1 && <View style={styles.navigation}>
      <Pressable accessibilityRole="button" accessibilityLabel="Previous photo" disabled={index === 0} style={[styles.button, index === 0 && styles.disabled]} onPress={() => goTo(index - 1)}><ChevronLeft color="white" /></Pressable>
      <Text accessibilityLiveRegion="polite" style={styles.label}>{index + 1} / {photos.length}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Next photo" disabled={index === photos.length - 1} style={[styles.button, index === photos.length - 1 && styles.disabled]} onPress={() => goTo(index + 1)}><ChevronRight color="white" /></Pressable>
    </View>}
    <View style={styles.fileActions}><ResourceActions key={photo?.url} url={photo?.url} title={photo?.title} dark /></View>
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel="Zoom out" disabled={zoom === 1} style={[styles.button, zoom === 1 && styles.disabled]} onPress={() => setZoom(value => Math.max(1, value - 0.5))}><Minus color="white" /></Pressable>
      <Text style={styles.label}>{Math.round(zoom * 100)}%</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Zoom in" disabled={zoom === 3} style={[styles.button, zoom === 3 && styles.disabled]} onPress={() => setZoom(value => Math.min(3, value + 0.5))}><Plus color="white" /></Pressable>
    </View>
    {zoom > 1 && photos.length > 1 && <Text style={styles.hint}>Zoom out to swipe, or use the arrows</Text>}
  </SafeAreaView>;
}

export default function ImagePreview({ uri, title = 'Project image', images, style, children }) {
  const [open, setOpen] = useState(false);
  const url = resolveMediaUrl(uri);
  return <>
    <Pressable style={style} accessibilityRole="button" accessibilityLabel={`Preview ${title}`} disabled={!url} onPress={() => setOpen(true)}>{children}</Pressable>
    <Modal visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      {open && <PhotoGallery uri={uri} title={title} images={images} onClose={() => setOpen(false)} />}
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#141414' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { flex: 1, color: 'white', fontSize: 16 },
  stage: { flex: 1, minHeight: 0 },
  fill: { flexGrow: 1 },
  center: { flexGrow: 1, alignItems: 'center' },
  button: { padding: 12, minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  navigation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  fileActions: { alignItems: 'center', paddingTop: 4 },
  label: { color: 'white' },
  disabled: { opacity: 0.35 },
  hint: { color: '#BBBBBB', fontSize: 12, textAlign: 'center', paddingBottom: 8 },
  loading: { position: 'absolute', top: '50%', alignSelf: 'center' },
  failure: { position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center', padding: 16, backgroundColor: '#141414' },
});
