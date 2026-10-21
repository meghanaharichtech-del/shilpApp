import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { createFavoritesStore } from './favoritesStore';
import { getFavorites, addFavorite, removeFavorite } from '../utils/favoriteApi';
import { StorageUtils, onSessionChange } from '../utils/StorageUtils';
import { onSessionExpired } from '../utils/brokerApi';
const FavoritesContext = createContext(null);
export function FavoritesProvider({ children }) {
  const [store] = useState(() => createFavoritesStore({ list: getFavorites, add: addFavorite, remove: removeFavorite }));
  const [snapshot, setSnapshot] = useState(() => store.getSnapshot());
  useEffect(() => store.subscribe(setSnapshot), [store]);
  useEffect(() => {
    let active = true, identity = null;
    const sync = async () => {
      const session = await StorageUtils.getItem('userData');
      if (!active) return;
      const token = session?.token || session?.data?.token || session?.accessToken || session?.data?.accessToken;
      if (identity !== token) {identity = token;store.reset(token);}
      if (token) await store.refresh().catch(() => {});
    };
    sync();
    const unsubscribe = onSessionChange(sync);
    const expired = onSessionExpired(store.reset);
    const subscription = AppState.addEventListener('change', state => {if(state === 'active') sync();});
    return () => {active=false;unsubscribe();expired();subscription.remove();};
  }, [store]);
  const value = useMemo(() => ({ ...snapshot, isFavorite: store.isFavorite, toggleFavorite: store.toggle, refreshFavorites: store.refresh, clearFavorites: store.reset }), [snapshot, store]);
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}
export function useFavorites() {
  const value = useContext(FavoritesContext);
  // console.log("===>",value?.projects)
  if (!value) throw new Error('useFavorites requires FavoritesProvider');
  return value;
}
