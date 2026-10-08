import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AuthLayout, { Field, styles } from '../components/AuthLayout';
import { brokerRequest, apiError, saveSession, authDestination } from '../utils/brokerApi';
import { StorageUtils } from '../utils/StorageUtils';
export default function OtpScreen({ navigation, route }) {
  const params = route.params || {};
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : ''),
    [otp, setOtp] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(false),
    [resending, setResending] = useState(false),
    [until, setUntil] = useState(() => Date.now() + 60000),
    [seconds, setSeconds] = useState(60);
  useEffect(() => {
    StorageUtils.getItem('pendingAuth').then(data => {
      if (data) {
        setEmail(data.email);
        setUntil(data.resendAt || Date.now());
      }
    });
  }, []);
  useEffect(() => {
    const tick = () => setSeconds(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);
  async function verify() {
    if (loading || resending) return;
    if (!email || !/^\d{6}$/.test(otp)) {
      setError('Enter the six-digit code sent to your email.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await brokerRequest('verify-otp', 'post', {
        email,
        otp
      });
      if (!data.token) throw new Error('Verification did not return a session. Please sign in again.');
      const session = await saveSession(data);
      await StorageUtils.removeItem('pendingAuth');
      navigation.reset({ index: 0, routes: [{ name: authDestination(session) }] });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  async function resend() {
    if (seconds || resending || loading) return;
    setResending(true);
    setError('');
    try {
      const data = await brokerRequest('resend-otp', 'post', {
        email
      });
      const resendAt = Date.now() + (data.resendAfterSeconds || 60) * 1000;
      await StorageUtils.setItem('pendingAuth', {
        ...data,
        resendAt
      });
      setUntil(resendAt);
      setOtp('');
    } catch (e) {
      setError(apiError(e));
    } finally {
      setResending(false);
    }
  }
  return <AuthLayout title="Verify your email" subtitle={`Enter the six-digit code sent to ${email || 'your email'}`} action="Verify OTP" onSubmit={verify} loading={loading || resending} error={error} footer={<TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] })}><Text style={styles.link}>Back to Sign In</Text></TouchableOpacity>}><Field label="Verification code" value={otp} onChangeText={text => setOtp(text.replace(/\D/g, ''))} keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" autoComplete="one-time-code" /><TouchableOpacity disabled={seconds > 0 || resending || loading || !email} onPress={resend}><Text style={styles.link}>{resending ? 'Sending…' : seconds ? `Resend OTP in ${seconds}s` : 'Resend OTP'}</Text></TouchableOpacity></AuthLayout>;
}
