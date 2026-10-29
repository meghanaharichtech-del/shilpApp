import React from 'react';
import { useWindowDimensions } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { CustomTabBar } from '../components/CustomTabBar';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../auth/ProfileScreen';
import OffersScreen from '../screens/OffersScreen';

// The pager supports horizontal screen gestures with our existing bottom bar.
const Tab = createMaterialTopTabNavigator();

export default function BottomTab() {
  const { width } = useWindowDimensions();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      backBehavior="firstRoute"
      tabBarPosition="bottom"
      initialLayout={{ width }}
      keyboardDismissMode="on-drag"
      overScrollMode="never"
      screenOptions={{
        swipeEnabled: true,
        animationEnabled: true,
        lazy: true,
        lazyPreloadDistance: 1,
        sceneStyle: { backgroundColor: '#FFFFFF' },
      }}
      tabBar={props => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarAccessibilityLabel: "Home" }} />
      <Tab.Screen name="DashboardScreen" component={DashboardScreen} options={{ tabBarAccessibilityLabel: "Dashboard" }} />
      <Tab.Screen name="OffersScreen" component={OffersScreen} options={{ tabBarAccessibilityLabel: "Offers" }} />
      <Tab.Screen name="NotificationScreen" component={NotificationScreen} options={{ tabBarAccessibilityLabel: "Notifications" }} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} options={{ tabBarAccessibilityLabel: "Profile" }} />
    </Tab.Navigator>
  );
}
