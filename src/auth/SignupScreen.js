import React, { useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AuthLayout, { Field, styles } from '../components/AuthLayout';
import { brokerRequest, apiError } from '../utils/brokerApi';
import { StorageUtils } from '../utils/StorageUtils';
export default function SignupScreen({ navigation }) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [phone, setPhone] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false);
  async function submit() {
    if (loading) return;
    if (!name.trim() || name.trim().length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || phone && !/^\d{10}$/.test(phone) || password.length < 8 || encodeURIComponent(password).replace(/%[A-F\d]{2}/g, 'x').length > 72 || password !== confirm) {
      setError('Enter your name, valid email, optional 10-digit phone, and matching passwords (8 characters minimum, 72 bytes maximum).');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await brokerRequest('register', 'post', {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        ...(phone ? {
          phoneNumber: phone
        } : {})
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
  return <AuthLayout title="Create your account" subtitle="Join Shilp as a channel partner" error={error} action="Sign Up" loading={loading} onSubmit={submit} footer={<TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] })}><Text style={styles.link}>Already have an account? Sign In</Text></TouchableOpacity>}><Field label="Full name" value={name} onChangeText={setName} maxLength={120} /><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" /><Field label="Phone number (optional)" value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={10} /><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" /><Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none" /></AuthLayout>;
}
