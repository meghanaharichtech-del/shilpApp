import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { Keyboard, ImageBackground, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../utils/theme';
const FormScrollContext = createContext(null);
export default function AuthLayout({
  title,
  subtitle,
  children,
  error,
  action,
  onSubmit,
  loading,
  footer
}) {
  const scrollRef = useRef(null);
  const focusedY = useRef(null);
  const scrollToField = useCallback(() => {
    if (focusedY.current !== null) scrollRef.current?.scrollTo({
      y: Math.max(0, focusedY.current - 16),
      animated: true
    });
  }, []);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', scrollToField);
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      focusedY.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [scrollToField]);
  const focusField = useCallback(y => {
    focusedY.current = y;
    requestAnimationFrame(scrollToField);
  }, [scrollToField]);
  return <ImageBackground source={require('../assets/LoginScreenbgimg.png')} style={{
    flex: 1
  }} resizeMode="cover"><SafeAreaView style={{
      flex: 1
    }}><KeyboardAvoidingView style={{
        flex: 1
      }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><FormScrollContext.Provider value={focusField}><ScrollView ref={scrollRef} style={{
            flex: 1
          }} keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}><View style={{
              gap: 6
            }}><Text style={styles.title}>{title}</Text><Text style={styles.subtitle}>{subtitle}</Text></View>{children}{error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}{footer}<TouchableOpacity accessibilityRole="button" disabled={loading} onPress={onSubmit} style={[styles.button, loading && {
              opacity: 0.6
            }]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{action}</Text>}</TouchableOpacity></ScrollView></FormScrollContext.Provider></KeyboardAvoidingView></SafeAreaView></ImageBackground>;
}
export function Field({
  label,
  ...props
}) {
  const focusField = useContext(FormScrollContext);
  const position = useRef(0);
  return <View onLayout={event => {
    position.current = event.nativeEvent.layout.y;
  }} style={{
    gap: 6
  }}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor={theme.colors.textlightgray} style={styles.input} autoCorrect={false} {...props} onFocus={event => {
      focusField?.(position.current);
      props.onFocus?.(event);
    }} /></View>;
}
export const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 18
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontFamily: theme.fonts.bold,
    color: theme.colors.blackText
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: theme.fonts.regular,
    color: theme.colors.subText
  },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.blackText
  },
  input: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    fontSize: 15,
    fontFamily: theme.fonts.regular,
    color: theme.colors.blackText
  },
  error: {
    color: '#B42318',
    fontFamily: theme.fonts.regular
  },
  button: {
    marginTop: 'auto',
    backgroundColor: '#121212',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center'
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontFamily: theme.fonts.semiBold
  },
  link: {
    color: theme.colors.blackText,
    fontFamily: theme.fonts.bold,
    fontSize: 14
  }
});
