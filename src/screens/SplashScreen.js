import { StyleSheet, Text, ImageBackground, View } from 'react-native'
import React, { useEffect } from 'react'
import { StorageUtils } from '../utils/StorageUtils';
import { SafeAreaView } from 'react-native-safe-area-context';

const SplashScreen = ({navigation}) => {
    useEffect(() => {
    const checkUserData = async () => {
      try {
        const userData = await StorageUtils.getItem('userData');
        console.log("userdataaaaaaa",userData);
        
        if (userData) {
          setTimeout(() => {
            navigation.replace('BottomTab');
          },800);
        } else {
          setTimeout(() => {
            navigation.replace('OnboardingScreen1');
          }, 800);
        }
      } catch (error) {
        console.error('Error reading user data', error);
        // navigation.replace('LoginScreen');
      }
    };
    checkUserData();
  }, []);
  return (
    <View style={{ flex: 1 }}>
<ImageBackground
  source={require('../assets/SplashScreenimg.png')}
  style={{ flex: 1 }}
  resizeMode="cover"
/>
</View>
  )
}

export default SplashScreen

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  title: {
    fontSize: 40,
    fontFamily: 'Manrope_700Bold',
    color: '#121212',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
})