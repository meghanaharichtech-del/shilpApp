import React, { useEffect } from 'react';
import { ImageBackground } from 'react-native';
import { StorageUtils } from '../utils/StorageUtils';

const MIN_SPLASH_DURATION_MS = 700;

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let active = true;
    const minimumSplashDuration = new Promise(resolve => {
      setTimeout(resolve, MIN_SPLASH_DURATION_MS);
    });
    async function restoreSession() {
      let destination = 'OnboardingScreen1';
      try {
        const session = await StorageUtils.getItem('userData');
        if (session?.token) {
          destination = 'BottomTab';
        } else {
          await StorageUtils.removeItem('pendingAuth');
        }
      } finally {
        await minimumSplashDuration;
        if (active) navigation.reset({ index: 0, routes: [{ name: destination }] });
      }
    }
    restoreSession().catch(() => {});
    return () => { active = false; };
  }, [navigation]);

  return <ImageBackground source={require('../assets/SplashScreenimg.png')} style={{ flex: 1 }} />;
}
