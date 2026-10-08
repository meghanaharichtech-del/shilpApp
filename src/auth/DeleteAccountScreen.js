import React, { useRef, useState } from 'react';
import { Keyboard, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthLayout, { Field, styles } from '../components/AuthLayout';
import CustomDialog from '../components/CustomDialog';
import { apiError, brokerRequest } from '../utils/brokerApi';
export default function DeleteAccountScreen({ navigation }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const busy = useRef(false);
  function askToDelete() {
    if (busy.current) return;
    if (!password) {
      setError('Enter your password to confirm account deletion.');
      return;
    }
    Keyboard.dismiss();
    setError('');
    setConfirming(true);
  }
  async function deleteAccount() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    setError('');
    try {
      // This endpoint also returns 401 for an incorrect password. Keep the
      // session so the user can correct it instead of being logged out.
      await brokerRequest('profile', 'delete', {
        password
      }, true, {
        keepSessionOnUnauthorized: true
      });
    } catch (requestError) {
      setError(apiError(requestError));
      busy.current = false;
      setLoading(false);
      return;
    }
    setPassword('');
    try {
      await AsyncStorage.multiRemove(['userData', 'brokerProfile', 'pendingAuth']);
      navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
    } catch {
      setError('Your account was deleted, but the saved session could not be cleared. Tap below to try again.');
      setDeleted(true);
      busy.current = false;
      setLoading(false);
    }
  }
  const [deleted, setDeleted] = useState(false);
  async function clearDeletedSession() {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      await AsyncStorage.multiRemove(['userData', 'brokerProfile', 'pendingAuth']);
      navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
    } catch {
      setError('Unable to clear your saved session. Please try again.');
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }
  return <>
    <AuthLayout title="Delete account" subtitle="Deleting your broker account is permanent. Your broker and company profile will no longer be available. Enter your password to continue." error={error} action={deleted ? 'Clear saved session' : 'Delete Account'} loading={loading} onSubmit={deleted ? clearDeletedSession : askToDelete} footer={!deleted && <TouchableOpacity disabled={loading} onPress={() => navigation.goBack()}><Text style={styles.link}>Cancel</Text></TouchableOpacity>}>
      {!deleted && <Field label="Confirm password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" editable={!loading} autoComplete="current-password" />}
    </AuthLayout>
    <CustomDialog visible={confirming} title="Delete your account?" message="This permanently deletes your broker account and company profile. You cannot undo this action." confirmLabel="Delete Account" cancelLabel="Cancel" onClose={() => setConfirming(false)} onConfirm={deleteAccount} />
  </>;
}
