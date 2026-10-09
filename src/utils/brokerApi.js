import axios from 'axios';
import { BASEURL } from './ApiHelper';
import { StorageUtils } from './StorageUtils';
const sessionExpiredListeners = new Set();
export function onSessionExpired(listener) {
  sessionExpiredListeners.add(listener);
  return () => sessionExpiredListeners.delete(listener);
}

export const apiError = error => error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Please try again.';
export async function apiRequest(path, method = 'get', body, authenticated = false, options = {}) {
  const session = authenticated ? await StorageUtils.getItem('userData') : null;
  const token = session?.token || session?.data?.token || session?.accessToken || session?.data?.accessToken;
  if (authenticated && !token) throw new Error('Your session has expired. Please sign in again.');
  try {
    const response = await axios({
      url: `${BASEURL}${String(path).replace(/^\//, '')}`,
      method,
      data: body,
      timeout: 30000,
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : {}
    });
    if (!response.data?.success) throw new Error(response.data?.error || 'Unable to complete request');
    return response.data.data;
  } catch (error) {
    if (authenticated && error?.response?.status === 401 && !options.keepSessionOnUnauthorized) {
      await StorageUtils.removeItem('userData');
      await StorageUtils.removeItem('brokerProfile');
      sessionExpiredListeners.forEach(listener => listener());
    }
    throw error;
  }
}
export function brokerRequest(path, method = 'get', body, authenticated = false, options = {}) {
  return apiRequest(`api/broker/${path}`, method, body, authenticated, options);
}
export async function saveSession(data) {
  const previous = await StorageUtils.getItem('userData');
  const session = {
    ...previous,
    ...data,
    token: data.token || previous?.token || previous?.data?.token
  };
  await StorageUtils.setItem('userData', session);
  return session;
}
export function authDestination(data) {
  if (!data?.token) return 'LoginScreen';
  if (data.isRegistrationComplete !== true) return 'OtpScreen';
  return data.isCompanyProfileComplete === true ? 'BottomTab' : 'ProfileAddScreen';
}
