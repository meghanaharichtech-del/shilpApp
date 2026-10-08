import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../components/CustomTabBar';
import HomeScreen from '../screens/HomeScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../auth/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export default function BottomTab() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
      {/* <Tab.Screen name="NotificationScreen" component={NotificationScreen} /> */}
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
      <Tab.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'Settings' }} />
    </Tab.Navigator>
  );
}
