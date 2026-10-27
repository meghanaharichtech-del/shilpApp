import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/Appnavigator';
import { FavoritesProvider } from './src/context/FavoritesContext';
import {
  useFonts,
  Manrope_200ExtraLight,
  Manrope_300Light,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { useEffect } from 'react';
import { NotificationProvider } from './src/context/NotificationContext';
import { DataRefreshProvider } from './src/context/DataRefreshContext';



export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_200ExtraLight,
    Manrope_300Light,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // SplashScreen.hide();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>

      <SafeAreaProvider>
        <DataRefreshProvider>
          <NotificationProvider>
            <FavoritesProvider><AppNavigator /></FavoritesProvider>
          </NotificationProvider>
        </DataRefreshProvider>
      </SafeAreaProvider>
    </>
  );
}
