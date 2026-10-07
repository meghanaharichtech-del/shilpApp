import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
const Stack = createNativeStackNavigator();
import SplashScreen from '../screens/SplashScreen.js';
import BottomTab from './BottomTab.js';
import OnboardingScreen1 from '../screens/OnboardingScreen1.js';
import LoginScreen from '../auth/LoginScreen.js';
import SignupScreen from '../auth/SignupScreen.js';
import PropertyDetailScreen from '../screens/PropertyDetailScreen.js';
export default function AppNavigator() {
  return (
    <>
        <NavigationContainer>
         <Stack.Navigator
  initialRouteName="SplashScreen"
  screenOptions={{
    headerShown: false,
    animation: 'slide_from_right',
    gestureEnabled: true,
    freezeOnBlur: true,
    contentStyle: {
      backgroundColor: '#020202ff',
    },
  }}
>
            <Stack.Screen name="BottomTab" component={BottomTab} />
            <Stack.Screen name='SplashScreen' component={SplashScreen} />
            <Stack.Screen name="OnboardingScreen1" component={OnboardingScreen1} />
            <Stack.Screen name="SignupScreen" component={SignupScreen} />
            <Stack.Screen name="LoginScreen" component={LoginScreen} />
            <Stack.Screen name="PropertyDetailScreen" component={PropertyDetailScreen} />
                </Stack.Navigator>
        </NavigationContainer>
        {/* <Toast /> */}
    </>
  );
}

