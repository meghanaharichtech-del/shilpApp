import React, { useEffect, useState } from 'react';
import AuthLayout, { Field } from '../components/AuthLayout';
import CompanyFields, { validCompany } from '../components/CompanyFields';
import { brokerRequest, apiError, saveSession } from '../utils/brokerApi';
export default function ProfileEditScreen({ navigation }) {
  const [name, setName] = useState(''),
    [email, setEmail] = useState(''),
    [phone, setPhone] = useState(''),
    [company, setCompany] = useState(''),
    [logo, setLogo] = useState(''),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    Promise.all([brokerRequest('profile', 'get', undefined, true), brokerRequest('company', 'get', undefined, true)]).then(([data, business]) => {
      setName(data.user.name || '');
      setEmail(data.user.email);
      setPhone(data.user.phoneNumber || '');
      setCompany(business.company?.companyName || '');
      setLogo(business.company?.logo || '');
      setLoaded(true);
    }).catch(e => setError(apiError(e))).finally(() => setLoading(false));
  }, []);
  async function save() {
    if (loading || !loaded) return;
    if (!name.trim() || name.trim().length > 120 || phone && !/^\d{10}$/.test(phone) || !validCompany(company, logo)) {
      setError('Enter your name, optional 10-digit phone, company name and choose a valid logo.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const user = await brokerRequest('profile', 'patch', {
        name: name.trim(),
        phoneNumber: phone || null
      }, true);
      await saveSession(user);
      const data = await brokerRequest('company', 'put', {
        companyName: company.trim(),
        logo: logo.trim()
      }, true);
      await saveSession(data);
      navigation.popTo('BottomTab', { screen: 'ProfileScreen' });
    } catch (e) {
      setError(`Some changes may already be saved. ${apiError(e)}`);
    } finally {
      setLoading(false);
    }
  }
  return <AuthLayout title="Edit profile" subtitle="Update your broker and company details" action="Save Changes" onSubmit={save} onBack={() => navigation.goBack()} loading={loading || !loaded} error={error}><Field label="Full name" value={name} onChangeText={setName} maxLength={120} /><Field label="Email (verified)" value={email} editable={false} /><Field label="Phone number (optional)" value={phone} onChangeText={setPhone} keyboardType="number-pad" maxLength={10} /><CompanyFields name={company} setName={setCompany} logo={logo} setLogo={setLogo} onError={setError} /></AuthLayout>;
}
