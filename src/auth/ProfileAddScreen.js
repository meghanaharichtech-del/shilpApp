import { StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import axios from 'axios'

import { theme } from '../utils/theme';
import BackIcon from '../assets/arrow-left.svg';
import { ADD_USER_PROFILE_API } from '../utils/ApiHelper';
import { StorageUtils } from '../utils/StorageUtils';
import { showToastMSGError, showToastMSGNormal } from '../utils/ToastMessages';

const ProfileAddScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);

  const genderOptions = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' }
  ];

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      showToastMSGError('Please enter your full name');
      return;
    }
    if (!gender) {
      showToastMSGError('Please select your gender');
      return;
    }

    try {
      setLoading(true);
      const userData = await StorageUtils.getItem('userData');
      const token = userData?.token;
      
      if (!token) {
        showToastMSGError('Session expired. Please login again');
        navigation.navigate('LoginScreen');
        return;
      }

      console.log('Sending profile data:', { name: name.trim(), gender });
      const response = await axios.post(ADD_USER_PROFILE_API, {
        name: name.trim(),
        gender: gender
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Profile update response:', response.data);

      if (response.data.success) {
        showToastMSGNormal(response.data.message || 'Profile updated successfully');
        await StorageUtils.setItem('generatedUsername', name.trim());
        navigation.reset({
          index: 0,
          routes: [{ name: 'VehicleNumberScreen',params: { from: 'ProfileAddScreen' }}],
        });
      } else {
        showToastMSGError(response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.log('Error updating profile:', error.response.data.message);
      showToastMSGError(error?.response?.data.message || 'Error saving profile details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
 <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
      {/* Header */}
      <View style={styles.headerRow}>
        
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Tell us about yourself</Text>
          {/* <Text style={styles.headerSubTitle}>Enter your details to proceed with Motnic</Text> */}
        </View>
      </View>

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

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && { opacity: 0.7 }]}
        onPress={handleSaveProfile}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <Text style={styles.saveBtnText}>Save & Proceed</Text>
        )}
      </TouchableOpacity>
      </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  )
}

export default ProfileAddScreen 

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.whiteBackground,
    padding: 16,
    gap: 24,
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
  inputContainer: {
    gap: 8,
    paddingTop:10,
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
  genderContainer: {
    gap: 8,
    paddingTop:10,
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
  saveBtn: {
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 8,
  },
  saveBtnText: {
    color: theme.colors.whiteText,
    fontSize: 16.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
})