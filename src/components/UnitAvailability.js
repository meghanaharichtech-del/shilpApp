import React, { useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, Check, Search, X } from 'lucide-react-native';

export default function UnitAvailability({ blocks = [] }) {
  const insets = useSafeAreaInsets();
  const [blockIndex, setBlockIndex] = useState(0);
  const [floorIndex, setFloorIndex] = useState(0);
  const [picker, setPicker] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const block = blocks[blockIndex] || blocks[0];
  const floors = block?.floors || [];
  const floor = floors[floorIndex] || floors[0];
  const units = floor?.units || [];
  const available = units.filter(unit => unit.status === 'available').length;
  const filtered = units.filter(unit => status === 'all' || unit.status === status);
  const options = (picker === 'block' ? blocks : floors).map((item, index) => ({ item, index })).filter(({ item }) => item.name.toLowerCase().includes(query.trim().toLowerCase()));
  function openPicker(kind) { setQuery(''); setPicker(kind); }
  function choose(index) {
    if (picker === 'block') { setBlockIndex(index); setFloorIndex(0); }
    else setFloorIndex(index);
    setPicker(null);
  }
  return <View style={styles.container}>
    <View style={styles.selectors}>
      {[{ kind: 'block', label: 'BLOCK', value: block?.name, count: blocks.length }, { kind: 'floor', label: 'FLOOR', value: floor?.name, count: floors.length }].map(({ kind, label, value, count }) => <Pressable key={kind} accessibilityRole="button" accessibilityLabel={`Choose ${kind}, ${value || 'none'}`} disabled={!count} style={styles.selector} onPress={() => openPicker(kind)}><View style={styles.selectorText}><Text style={styles.caption}>{label}</Text><Text numberOfLines={1} style={styles.selection}>{value || 'Not added'}</Text></View><ChevronDown size={17} color="#555" /></Pressable>)}
    </View>
    <Text style={styles.hint}>{blocks.length} blocks · {floors.length} floors in this block</Text>
    <View style={styles.filters}>{[{ key: 'all', label: `All ${units.length}` }, { key: 'available', label: `Available ${available}` }, { key: 'booked', label: `Booked ${units.length - available}` }].map(item => <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: status === item.key }} style={[styles.filter, status === item.key && styles.filterSelected]} onPress={() => { setStatus(item.key); }}><Text style={[styles.filterText, status === item.key && styles.filterTextSelected]}>{item.label}</Text></Pressable>)}</View>
    <Text style={styles.selection}>{block?.name} / {floor?.name}</Text>
    {filtered.length > 9 && <Text style={styles.hint}>Scroll down to see more rooms.</Text>}
    <ScrollView key={`${blockIndex}-${floorIndex}-${status}`} nestedScrollEnabled directionalLockEnabled showsVerticalScrollIndicator style={styles.roomScroller} contentContainerStyle={styles.roomGrid} accessibilityLabel="Unit availability rooms">
    {filtered.map((unit, index) => <View key={index} accessible accessibilityLabel={`${floor?.type} ${unit.number}, ${unit.status}`} style={[styles.tile, unit.status === 'available' ? styles.available : styles.booked]}><Text style={styles.unitNumber}>{unit.number}</Text><Text style={styles.unitType}>{floor?.type}</Text><Text style={styles.unitStatus}>{unit.status === 'available' ? 'Available' : 'Booked'}</Text></View>)}
    </ScrollView>
    {!filtered.length && <Text style={styles.empty}>{units.length ? `No ${status} units on this floor.` : 'No units added on this floor.'}</Text>}
    <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
      <View style={styles.modal}><Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel="Close selection" onPress={() => setPicker(null)} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHeader}><Text style={styles.sheetTitle}>Choose {picker === 'block' ? 'block' : 'floor'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Close selection" style={styles.pageButton} onPress={() => setPicker(null)}><X size={20} color="#222" /></Pressable></View>
          <View style={styles.search}><Search size={18} color="#777" /><TextInput accessibilityLabel={`Search ${picker || 'units'}`} style={styles.searchInput} placeholder={`Search ${picker === 'block' ? 'blocks' : 'floors'}…`} placeholderTextColor="#888" value={query} onChangeText={setQuery} autoCorrect={false} /></View>
          <FlatList data={options} keyExtractor={({ index }) => String(index)} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.optionList} ListEmptyComponent={<Text style={styles.empty}>No matches found.</Text>} renderItem={({ item: { item, index } }) => {
            const selected = index === (picker === 'block' ? blockIndex : floorIndex);
            return <Pressable accessibilityRole="button" accessibilityState={{ selected }} style={[styles.option, selected && styles.optionSelected]} onPress={() => choose(index)}><View style={styles.selectorText}><Text style={styles.selection}>{item.name}</Text><Text style={styles.hint}>{picker === 'block' ? `${item.floors.length} floors` : `${item.units.length} units · ${item.units.filter(unit => unit.status === 'available').length} available`}</Text></View>{selected && <Check size={20} color="#111" />}</Pressable>;
          }} />
        </View>
      </View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  container: { gap: 12 }, selectors: { flexDirection: 'row', gap: 10 }, selector: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 12, padding: 12, backgroundColor: '#fff', minHeight: 64 }, selectorText: { flex: 1, gap: 4 }, caption: { fontSize: 10, fontWeight: '600', letterSpacing: 1, color: '#888' }, selection: { fontSize: 14, fontWeight: '600', color: '#222' }, hint: { fontSize: 11, color: '#777' }, filters: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' }, filter: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 10, backgroundColor: '#f3f3f3' }, filterSelected: { backgroundColor: '#171717' }, filterText: { fontSize: 11, color: '#666' }, filterTextSelected: { color: '#fff' }, roomScroller: { width: '100%', maxHeight: 280, flexGrow: 0 }, roomGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 8, paddingBottom: 10, paddingRight: 6 }, tile: { width: '31.5%', flexShrink: 0, minHeight: 62, padding: 6, justifyContent: 'center', alignItems: 'center', borderRadius: 8, gap: 2 }, available: { backgroundColor: '#16803c' }, booked: { backgroundColor: '#be123c' }, unitNumber: { fontSize: 14, fontWeight: '700', color: '#fff', textAlign: 'center' }, unitType: { fontSize: 10, color: '#fff' }, unitStatus: { fontSize: 9, color: '#fff' }, empty: { padding: 20, textAlign: 'center', color: '#777', fontSize: 13 }, pagination: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, pageButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: .3 }, modal: { flex: 1, backgroundColor: '#00000066', justifyContent: 'flex-end' }, sheet: { height: '65%', backgroundColor: '#fff', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 20 }, sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12 }, sheetTitle: { fontSize: 19, fontWeight: '600', color: '#171717' }, search: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, backgroundColor: '#f5f5f5', borderRadius: 10, marginVertical: 12 }, searchInput: { flex: 1, height: 46, color: '#222' }, optionList: { paddingBottom: 12 }, option: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 10 }, optionSelected: { backgroundColor: '#f1f1f1' },
});
