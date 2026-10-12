import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { CustomTabBar } from '../components/CustomTabBar';
import HomeScreen from '../screens/HomeScreen';
import DashboardScreen from '../screens/DashboardScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SearchScreen from '../screens/SearchScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../auth/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function BottomTab() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="DashboardScreen" component={DashboardScreen} options={{ tabBarAccessibilityLabel: "Dashboard" }} />
      {/* <Tab.Screen name="FavoritesScreen" component={FavoritesScreen} options={{ tabBarAccessibilityLabel: "Favourites" }} /> */}
      {/* <Tab.Screen name="SearchScreen" component={SearchScreen} options={{ tabBarAccessibilityLabel: "Search" }} /> */}
      <Tab.Screen name="NotificationScreen" component={NotificationScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
