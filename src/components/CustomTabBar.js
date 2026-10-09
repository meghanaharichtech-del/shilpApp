import React from 'react';
import { Bell, ChartNoAxesCombined, House, Settings, UserRound } from 'lucide-react-native';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import NotificationBadge from './NotificationBadge';
import { useNotifications } from '../context/NotificationContext';
const tabIcons = {
  Home: House,
  AnalyticsScreen: ChartNoAxesCombined,
  NotificationScreen: Bell,
  ProfileScreen: UserRound,
  SettingsScreen: Settings,
};

export function CustomTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotifications();

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
              <View>
                <TabIcon size={20} color="#F4F4F5" strokeWidth={2.35} />
                {route.name === 'NotificationScreen' ? <NotificationBadge count={unreadCount} style={styles.badge} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
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
  badge: {
    right: -12,
    top: -9,
  },
});
