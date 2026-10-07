import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BellDot, ChartNoAxesCombined, House, UserRound } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import HomeScreen from '../screens/users/HomeScreen';
import NotificationScreen from '../screens/NotificationScreen';
import HomeScreen from '../screens/HomeScreen';
import ProjectListingScreen from '../screens/ProjectListingScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../auth/ProfileScreen';


const Tab = createBottomTabNavigator();

const tabIcons = {
  Home: House,
  AnalyticsScreen: ChartNoAxesCombined,
  NotificationScreen: BellDot,
  ProfileScreen: UserRound,
};

function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { bottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.container}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const TabIcon = tabIcons[route.name];

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              style={({ pressed }) => [
                styles.tab,
                isFocused && styles.activeTab,
                pressed && styles.pressedTab,
              ]}
            >
              <TabIcon size={20} color="#F4F4F5" strokeWidth={2.35} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function BottomTab() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="AnalyticsScreen" component={AnalyticsScreen} />
      <Tab.Screen name="NotificationScreen" component={NotificationScreen} />
      <Tab.Screen name="ProfileScreen" component={ProfileScreen} />

    </Tab.Navigator>
  );
}
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    backgroundColor: '#111112',
    borderColor: '#29292B',
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  wrapper: {
    bottom: 16,
    left: 44,
    position: 'absolute',
    right: 44,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 24,
    flex: 1,
    height: 45,
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#28282A',
  },
  pressedTab: {
    opacity: Platform.OS === 'ios' ? 0.72 : 0.85,
  },
});
