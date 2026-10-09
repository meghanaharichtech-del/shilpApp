import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AuthLayout, { styles as authStyles } from '../components/AuthLayout';
import { brokerRequest, apiError, saveSession, authDestination } from '../utils/brokerApi';
import { StorageUtils } from '../utils/StorageUtils';
import { useNotifications } from '../context/NotificationContext';
import { theme } from '../utils/theme';
export default function OtpScreen({ navigation, route }) {
  const inputRef = useRef(null);
  const { refreshUnreadCount } = useNotifications();
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
      await refreshUnreadCount().catch(() => {});
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
  return <AuthLayout title="Verify your email" subtitle={`Enter the six-digit code sent to ${email || 'your email'}`} action="Verify OTP" onSubmit={verify} loading={loading || resending} error={error} footer={<TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] })}><Text style={authStyles.link}>Back to Sign In</Text></TouchableOpacity>}>
    <View style={localStyles.codeSection}>
      <Text style={localStyles.label}>Verification code</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Enter six-digit verification code" onPress={() => inputRef.current?.focus()} style={localStyles.cells}>
        {Array.from({ length: 6 }, (_, index) => {
          const digit = otp[index] || '';
          const active = index === Math.min(otp.length, 5) && otp.length < 6;
          return <View key={index} style={[localStyles.cell, active && localStyles.cellActive, digit && localStyles.cellFilled]}><Text style={localStyles.digit}>{digit}</Text>{active && !digit ? <View style={localStyles.cursor} /> : null}</View>;
        })}
        <TextInput ref={inputRef} autoFocus value={otp} onChangeText={text => setOtp(text.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} textContentType="oneTimeCode" autoComplete="one-time-code" returnKeyType="done" onSubmitEditing={verify} caretHidden style={localStyles.hiddenInput} />
      </Pressable>
    </View>
    <TouchableOpacity disabled={seconds > 0 || resending || loading || !email} onPress={resend} style={localStyles.resendButton}><Text style={[authStyles.link, (seconds > 0 || resending || loading || !email) && localStyles.resendDisabled]}>{resending ? 'Sending…' : seconds ? `Resend OTP in ${seconds}s` : 'Resend OTP'}</Text></TouchableOpacity>
  </AuthLayout>;
}

const localStyles = StyleSheet.create({
  codeSection: { gap: 9 },
  label: { color: theme.colors.blackText, fontFamily: theme.fonts.semiBold, fontSize: 14 },
  cells: { flexDirection: 'row', gap: 8, justifyContent: 'space-between', position: 'relative', width: '100%' },
  cell: { alignItems: 'center', aspectRatio: 0.86, backgroundColor: '#F8F8F8', borderColor: theme.colors.borderColor, borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center', maxWidth: 52, minWidth: 40 },
  cellActive: { backgroundColor:theme.colors.borderlightgraycolour, borderColor: theme.colors.blackText, borderWidth: 1.5 },
  cellFilled: { backgroundColor: '#FFFFFF', borderColor: '#CFCFCF' },
  digit: { color: theme.colors.blackText, fontFamily: theme.fonts.bold, fontSize: 21 },
  cursor: { backgroundColor: theme.colors.blackText, height: 22, position: 'absolute', width: 1.5 },
  hiddenInput: { height: 1, left: 0, opacity: 0, position: 'absolute', top: 0, width: 1 },
  resendButton: { alignSelf: 'flex-start', minHeight: 36, justifyContent: 'center' },
  resendDisabled: { color: '#999999' },
});
