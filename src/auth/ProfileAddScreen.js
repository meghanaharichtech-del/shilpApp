import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import AuthLayout, { styles } from '../components/AuthLayout';
import CompanyFields, { validCompany } from '../components/CompanyFields';
import { brokerRequest, apiError, saveSession, authDestination } from '../utils/brokerApi';
import { StorageUtils } from '../utils/StorageUtils';
export default function ProfileAddScreen({ navigation }) {
  const [name, setName] = useState(''),
    [logo, setLogo] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [exists, setExists] = useState(false);
  useEffect(() => {
    brokerRequest('company', 'get', undefined, true).then(data => {
      setName(data.company?.companyName || '');
      setLogo(data.company?.logo || '');
      setExists(!!data.company);
    }).catch(e => setError(apiError(e))).finally(() => setLoading(false));
  }, []);
  async function save() {
    if (loading) return;
    if (!validCompany(name, logo)) {
      setError('Enter your company name and choose a company logo from the gallery.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await brokerRequest('company', exists ? 'put' : 'post', {
        companyName: name.trim(),
        logo: logo.trim()
      }, true);
      const session = await saveSession(data);
      navigation.reset({ index: 0, routes: [{ name: authDestination(session) }] });
    } catch (e) {
      setError(apiError(e));
    } finally {
      setLoading(false);
    }
  }
  return <AuthLayout title="Company profile" subtitle="Add your company details to complete your registration" error={error} action="Save & Continue" loading={loading} onSubmit={save} footer={<TouchableOpacity onPress={async () => {
    await StorageUtils.removeItem('userData');
    await StorageUtils.removeItem('brokerProfile');
    navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
  }}><Text style={styles.link}>Sign out</Text></TouchableOpacity>}><CompanyFields name={name} setName={setName} logo={logo} setLogo={setLogo} onError={setError} /></AuthLayout>;
}
