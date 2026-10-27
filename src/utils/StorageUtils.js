import AsyncStorage from '@react-native-async-storage/async-storage';

const sessionListeners = new Set();
export const onSessionChange = listener => { sessionListeners.add(listener); return () => sessionListeners.delete(listener); };
const notifySessionChange = () => sessionListeners.forEach(listener => { Promise.resolve().then(listener).catch(() => {}); });

export const isDebug = false;

// AsyncStorage stores strings, so this wrapper serializes objects consistently.
export const StorageUtils = {
  async setItem(key, value) {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      if (key === 'userData') notifySessionChange();
    } catch (error) {
      console.error('Error setting item in AsyncStorage', error);
    }
  },

  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      return value != null ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Error getting item from AsyncStorage', error);
      return null;
    }
  },

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      if (key === 'userData') notifySessionChange();
    } catch (error) {
      console.error('Error removing item from AsyncStorage', error);
    }
  },
};

export const getCurrentUserId = async () => {
  try {
    const userData = await StorageUtils.getItem('userData');
    return userData?.user?.id ?? userData?.data?.user?.id ?? userData?.id ?? null;
  } catch (error) {
    console.error('Error getting current user ID from AsyncStorage', error);
    return null;
  }
};
