import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AuthLayout, { Field, styles } from '../components/AuthLayout';
import { brokerRequest, apiError, saveSession, authDestination } from '../utils/brokerApi';
export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [visible, setVisible] = useState(false);
  async function submit() {
    if (loading) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) {
      setError('Enter a valid email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await brokerRequest('login', 'post', {
        email: email.trim().toLowerCase(),
        password
      });
      if (data.token) {
        const session = await saveSession(data);
        navigation.reset({ index: 0, routes: [{ name: authDestination(session) }] });
      } else {
        const otp = await brokerRequest('send-otp', 'post', {
          email: data.email
        });
        await import('../utils/StorageUtils').then(({
          StorageUtils
        }) => StorageUtils.setItem('pendingAuth', {
          ...otp,
          resendAt: Date.now() + (otp.resendAfterSeconds || 60) * 1000
        }));
        navigation.replace('OtpScreen', { email: otp.email });
      }
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  return <AuthLayout title="Welcome back" subtitle="Sign in to continue managing your projects" error={error} action="Sign In" loading={loading} onSubmit={submit} footer={<TouchableOpacity onPress={() => navigation.navigate('SignupScreen')}><Text style={styles.link}>Don&apos;t have an account? Sign Up</Text></TouchableOpacity>}><Field label="Email" placeholder="Enter your email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><Field label="Password" placeholder="Enter your password" value={password} onChangeText={setPassword} secureTextEntry={!visible} autoCapitalize="none" /><TouchableOpacity onPress={() => setVisible(!visible)}><Text style={styles.link}>{visible ? 'Hide password' : 'Show password'}</Text></TouchableOpacity></AuthLayout>;
}
