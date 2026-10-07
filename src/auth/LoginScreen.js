import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import React, { useState } from 'react';
import axios from 'axios';
import { LOGIN_API } from '../utils/ApiHelper';
import { StorageUtils } from '../utils/StorageUtils';
import { theme } from '../utils/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('jayrajsinhjadavharichtech@gmail.com');
  const [password, setPassword] = useState('Jayubha@1121');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [secureEntry, setSecureEntry] = useState(true);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPasswordError('');

    if (!email.trim()) {
      setEmailError('Email is required');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address');
      valid = false;
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 4) {
      setPasswordError('Password must be at least 4 characters');
      valid = false;
    }

    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const response = await axios.post(LOGIN_API, {
        email: email.trim(),
        password: password,
      });

      if (response.status === 200) {
        await StorageUtils.setItem('userData', response.data);
        console.log('Login response:', response.data);
        setTimeout(() => {
          navigation.replace('BottomTab');
        }, 200);
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.response?.data?.error || 'Invalid email or password';
      setEmailError(message);
      console.log('Login Error:', message);
    } finally {
      setLoading(false);
    }
  };

  return (
      <View style={{ flex: 1 }}>

    <ImageBackground
      source={require('../assets/LoginScreenbgimg.png')}
      style={styles.background}
      resizeMode="cover"
    >   
     <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      /> */}

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.headerBlock}>
              <Text style={styles.title}>Welcome back</Text>
              <Text style={styles.subtitle}>
                Sign in to continue managing your projects
              </Text>
            </View>

            {/* Email Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Email</Text>
              <View style={[styles.inputContainer, emailError && styles.inputError]}>
                <TextInput
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                  }}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.colors.textlightgray}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                />
              </View>
              {emailError ? (
                <Text style={styles.errorText}>{emailError}</Text>
              ) : null}
            </View>

            {/* Password Input */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Password</Text>
              <View style={[styles.inputContainer, passwordError && styles.inputError]}>
                <TextInput
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor={theme.colors.textlightgray}
                  style={styles.input}
                  secureTextEntry={secureEntry}
                  autoCapitalize="none"
                  returnKeyType="done"
                />
                <TouchableOpacity
                  onPress={() => setSecureEntry(!secureEntry)}
                  style={styles.eyeBtn}
                >
                  <Text style={styles.eyeText}>
                    {secureEntry ? 'Show' : 'Hide'}
                  </Text>
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={styles.errorText}>{passwordError}</Text>
              ) : null}
            </View>
<View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('SignUpScreen')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            {/* Login Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
    </ImageBackground>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,

  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 18,
  },
  headerBlock: {
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: theme.colors.blackText,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: theme.fonts.regular,
    color: theme.colors.subText,
    lineHeight: 22,
  },
  inputWrapper: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.blackText,
  },
  inputContainer: {
    height: 50,
    paddingHorizontal: 16,
    backgroundColor: '#F8F8F8',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderColor: theme.colors.borderColor,
    borderWidth: 1,
  },
  inputError: {
    borderColor: '#E53935',
  },
  input: {
    flex: 1,
    height: '100%',
    color: theme.colors.blackText,
    fontSize: 15,
    fontFamily: theme.fonts.regular,
  },
  eyeBtn: {
    paddingLeft: 12,
  },
  eyeText: {
    fontSize: 13,
    fontFamily: theme.fonts.semiBold,
    color: theme.colors.graysubtext,
  },
  errorText: {
    color: '#E53935',
    fontSize: 12,
    fontFamily: theme.fonts.regular,
    marginTop: -2,
  },
  button: {
    backgroundColor: '#121212',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 0.2,
  },
  signupRow: {
    flexDirection: 'row',
    // justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  signupText: {
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    color: theme.colors.subText,
  },
  signupLink: {
    fontSize: 14,
    fontFamily: theme.fonts.bold,
    color: theme.colors.blackText,
  },
});