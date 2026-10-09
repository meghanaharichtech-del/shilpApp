import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AuthLayout, { Field, styles } from '../components/AuthLayout';
import { brokerRequest, apiError } from '../utils/brokerApi';
import { StorageUtils } from '../utils/StorageUtils';
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  async function submit() {
    if (loading) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await brokerRequest('login', 'post', {
        email: email.trim().toLowerCase()
      });
      await StorageUtils.setItem('pendingAuth', {
        ...data,
        resendAt: Date.now() + (data.resendAfterSeconds || 60) * 1000
      });
      navigation.replace('OtpScreen', { email: data.email });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  return <AuthLayout title="Welcome back" subtitle="Enter your registered email to receive a login code" error={error} action="Send OTP" loading={loading} onSubmit={submit} footer={<TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}><Text style={styles.link}>Don&apos;t have an account? Sign Up</Text></TouchableOpacity>}><Field label="Email" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="done" onSubmitEditing={submit} /></AuthLayout>;
}
