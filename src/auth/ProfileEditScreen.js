import {
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import axios from 'axios';
import { theme } from '../utils/theme';
import BackIcon from '../assets/arrow-left.svg';
import { GET_USER_DETAILS_API } from '../utils/ApiHelper';
import { StorageUtils } from '../utils/StorageUtils';
import { showToastMSGError, showToastMSGNormal } from '../utils/ToastMessages';

const ProfileEditScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState('');
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
  ];

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      // Check cache first
      const cachedProfileStr = await StorageUtils.getItem('userProfile');
      if (cachedProfileStr) {
        const cachedProfile = JSON.parse(cachedProfileStr);
        setName(cachedProfile.name ?? '');
        setEmail(cachedProfile.email ?? '');
        setGender(cachedProfile.gender ?? '');
        setMobile(cachedProfile.mobile ?? '');
        setLoading(false);
        return;
      }

      // API fetch if no cache
      const userData = await StorageUtils.getItem('userData');
      const token = userData?.token;
      if (!token) {
        showToastMSGError('Session expired. Please login again');
        navigation.navigate('LoginScreen');
        return;
      }

      const response = await axios.get(GET_USER_DETAILS_API, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data.data;
      if (user) {
        setName(user.name ?? '');
        setEmail(user.email ?? '');
        setGender(user.gender ?? '');
        setMobile(user.mobile ?? '');
        
        // Save to cache
        await StorageUtils.setItem('userProfile', JSON.stringify(user));
      }
    } catch (error) {
      console.log('Error loading user profile:', error);
      showToastMSGError('Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!name.trim()) {
      showToastMSGError('Please enter your full name');
      return;
    }
    if (!gender) {
      showToastMSGError('Please select your gender');
      return;
    }

    try {
      setUpdating(true);
      const userData = await StorageUtils.getItem('userData');
      const token = userData?.token;
      
      if (!token) {
        showToastMSGError('Session expired. Please login again');
        navigation.navigate('LoginScreen');
        return;
      }

      const payload = {
        name: name.trim(),
        email: email.trim() || null,
        gender: gender,
      };

      console.log('Updating profile with:', payload);
      const response = await axios.post(GET_USER_DETAILS_API, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log('Profile edit response:', response.data);

      if (response.data.success) {
        showToastMSGNormal(response.data.message || 'Profile updated successfully');
        
        const updatedUser = response.data.data;
        // Save processed user to local cache
        const processedProfile = {
          ...updatedUser,
          name: name.trim(),
        };
        await StorageUtils.setItem('userProfile', JSON.stringify(processedProfile));
        await StorageUtils.setItem('generatedUsername', name.trim());
        
        navigation.goBack();
      } else {
        showToastMSGError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.log('Error updating profile:', error);
      showToastMSGError(error?.response?.data?.message || 'Error saving profile details');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={theme.colors.orangeColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Header */}
       <View style={{ gap: 10, flexDirection: 'row'}}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <BackIcon />
                </TouchableOpacity>
                <View style={{ width: '50%' }}>
                    <Text numberOfLines={1} style={{ fontSize: 20, fontWeight: '600' }}>
                        Edit Profile
                    </Text>
                </View>
            </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Name Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              placeholder="Enter your full name"
              placeholderTextColor={theme.colors.graysubtext}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              placeholder="Enter your email address"
              placeholderTextColor={theme.colors.graysubtext}
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Mobile Input (Read-only) */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput
              value={mobile}
              style={[styles.input, styles.disabledInput]}
              editable={false}
              selectTextOnFocus={false}
            />
            <Text style={styles.hintText}>Mobile number verified via OTP cannot be modified.</Text>
          </View>

          {/* Gender Picker (Radio Button Style) */}
          <View style={styles.genderContainer}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.radioGroup}>
              {genderOptions.map((option) => {
                const isSelected = gender === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={styles.radioOption}
                    activeOpacity={0.8}
                    onPress={() => setGender(option.value)}
                  >
                    <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                    <Text style={styles.radioLabel}>{option.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.saveBtn, updating && { opacity: 0.7 }]}
            onPress={handleUpdateProfile}
            disabled={updating}
            activeOpacity={0.85}
          >
            {updating ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ProfileEditScreen;

const styles = StyleSheet.create({
container: {
    flex: 1,
    backgroundColor: theme.colors.whiteBackground,
    padding: 16,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  backBtn: {
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.blackText,
  },
  headerSubTitle: {
    color: theme.colors.graysubtext,
    fontSize: 13.5,
  },
  scrollContent: {
    // padding: 16,
    gap: 20,
    // backgroundColor:"pink"
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.blackText,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: theme.colors.blackText,
    backgroundColor: theme.colors.purewhiteBackground,
  },
  disabledInput: {
    backgroundColor: '#EAEAEA',
    borderColor: '#CCCCCC',
    color: '#777777',
  },
  hintText: {
    fontSize: 11.5,
    color: theme.colors.graysubtext,
    paddingLeft: 4,
  },
  genderContainer: {
    gap: 8,
  },
  radioGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginTop: 4,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#808080',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: theme.colors.orangeColor,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.orangeColor,
  },
  radioLabel: {
    fontSize: 15.5,
    color: theme.colors.blackText,
  },
  bottomBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.whiteBackground,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderColor,
  },
  saveBtn: {
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: theme.colors.whiteText,
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});