import { ImageBackground, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const SignupScreen = () => {
  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../assets/LoginScreenbgimg.png')}
        style={{ flex: 1 }}
        resizeMode="cover"
      />
    </View>
  )
}   

export default SignupScreen

const styles = StyleSheet.create({})