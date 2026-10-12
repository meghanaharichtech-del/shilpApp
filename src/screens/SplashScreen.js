import { PROFILE_API } from "../utils/ApiHelper";
import React, { useEffect } from 'react';
import { ImageBackground } from 'react-native';
import { StorageUtils } from '../utils/StorageUtils';
import { authDestination, apiRequest, saveSession } from '../utils/brokerApi';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    let active = true;
    async function restoreSession() {
      let destination = 'LoginScreen';
      try {
        let session = await StorageUtils.getItem('userData');
        if (session?.token) {
          try {
            session = await saveSession(await apiRequest(PROFILE_API, 'get', undefined, true));
          } catch {
            session = await StorageUtils.getItem('userData');
          }
          destination = authDestination(session);
        } else {
          const pending = await StorageUtils.getItem('pendingAuth');
          if (pending?.email && pending.authFlow === 'signup') {
            destination = 'OtpScreen';
          } else {
            await StorageUtils.removeItem('pendingAuth');
            destination = 'OnboardingScreen1';
          }
        }
      } finally {
        if (active) navigation.reset({ index: 0, routes: [{ name: destination }] });
      }
    }
    restoreSession().catch(() => {});
    return () => { active = false; };
  }, [navigation]);

  return <ImageBackground source={require('../assets/SplashScreenimg.png')} style={{ flex: 1 }} />;
}
