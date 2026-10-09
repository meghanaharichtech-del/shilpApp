import React, { useEffect, useState } from 'react';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Toast from 'react-native-toast-message';
import { toastConfig } from '../../ToastConfig';
import { onSessionExpired } from '../utils/brokerApi';
import SplashScreen from '../screens/SplashScreen';
import BottomTab from './BottomTab';
import OnboardingScreen1 from '../auth/OnboardingScreen1';
import LoginScreen from '../auth/LoginScreen';
import SignupScreen from '../auth/SignupScreen';
import OtpScreen from '../auth/OtpScreen';
import ProfileAddScreen from '../auth/ProfileAddScreen';
import ProfileEditScreen from '../auth/ProfileEditScreen';
import DeleteAccountScreen from '../auth/DeleteAccountScreen';
import PropertyDetailScreen from '../screens/PropertyDetailScreen';
import NotificationScreen from '../screens/NotificationScreen';
import { useNotifications } from '../context/NotificationContext';
import SettingsScreen from '../screens/SettingsScreen';
import InAppNotificationBanner from '../components/InAppNotificationBanner';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const navigationRef = useNavigationContainerRef();
  const [currentRoute, setCurrentRoute] = useState('SplashScreen');
  const { clearNotifications, latestNotification, dismissLatestNotification } = useNotifications();

  useEffect(() => onSessionExpired(() => {
    clearNotifications();
    if (navigationRef.isReady()) {
      navigationRef.resetRoot({ index: 0, routes: [{ name: 'LoginScreen' }] });
    }
  }), [clearNotifications, navigationRef]);

  useEffect(() => {
    if (currentRoute === 'NotificationScreen' && latestNotification) dismissLatestNotification();
  }, [currentRoute, dismissLatestNotification, latestNotification]);

  return (
    <>
      <NavigationContainer ref={navigationRef} onReady={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)} onStateChange={() => setCurrentRoute(navigationRef.getCurrentRoute()?.name)}>
        <Stack.Navigator initialRouteName="SplashScreen" screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: true,
          freezeOnBlur: true,
          contentStyle: { backgroundColor: '#020202ff' },
        }}>
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="OnboardingScreen1" component={OnboardingScreen1} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen name="OtpScreen" component={OtpScreen} />
          <Stack.Screen name="ProfileAddScreen" component={ProfileAddScreen} />
          <Stack.Screen name="BottomTab" component={BottomTab} />
          <Stack.Screen name="ProfileEditScreen" component={ProfileEditScreen} />
          <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
          <Stack.Screen name="DeleteAccountScreen" component={DeleteAccountScreen} />
          <Stack.Screen name="PropertyDetailScreen" component={PropertyDetailScreen} />
          <Stack.Screen name='NotificationScreen' component={NotificationScreen} />
        </Stack.Navigator>
      </NavigationContainer>
      <InAppNotificationBanner notification={currentRoute === 'NotificationScreen' ? null : latestNotification} onClose={dismissLatestNotification} onPress={() => {
        dismissLatestNotification();
        if (navigationRef.isReady()) navigationRef.navigate('NotificationScreen');
      }} />
      <Toast config={toastConfig} />
    </>
  );
}
