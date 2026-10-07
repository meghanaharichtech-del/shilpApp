import {
  ImageBackground,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  StatusBar,
} from 'react-native';
import BackIcon from '../assets/arrow-left.svg';
import { OtpInput } from 'react-native-otp-entry';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';
import { LOGIN_API, OTP_VERIFICATION_API } from '../utils/ApiHelper';
import { showToastMSGError, showToastMSGNormal } from '../utils/ToastMessages';
import Loader from '../utils/Loader';
import { StorageUtils } from '../utils/StorageUtils';
import { theme } from '../utils/theme';

const OtpScreen = ({ route, navigation }) => {
  const mobile = route?.params?.mobile || 'Unknown Number';

  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [resendLoading, setResendLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const hasVerified = useRef(false);
  const otpRef = useRef(null);

  // ── Countdown timer ──────────────────────────────────────────────────────
  useEffect(() => {
    if (timer === 0) return;
    const id = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // ── Core verify ──────────────────────────────────────────────────────────
  const verifyOtp = useCallback(async (otpString) => {
    if (hasVerified.current) return;
    if (!otpString || otpString.length !== 4) {
      setError('Enter complete OTP');
      return;
    }

    hasVerified.current = true;
    Keyboard.dismiss();

    try {
      setVerifyLoading(true);
      const res = await axios.post(OTP_VERIFICATION_API, {
        mobile,
        otp: otpString,
      });

      if (res.data.success) {
        setError('');
        showToastMSGNormal(res.data.message);
        await StorageUtils.setItem('userData', {
          token: res.data.data.accessToken,
          mobile,
        });
        console.log("Otp response -------------",res.data.data);
        if (res.data.data?.isProfileCreated) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'BottomTab' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'ProfileAddScreen' }],
          });
        }
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Invalid OTP');
      hasVerified.current = false;
    } finally {
      setVerifyLoading(false);
    }
  }, [mobile, navigation]);

  // ── Resend ───────────────────────────────────────────────────────────────
  const resendOtp = async () => {
    if (timer > 0 || resendLoading) return;
    try {
      setResendLoading(true);
      const res = await axios.post(LOGIN_API, { mobile });
      if (res.data.success) {
        setError('');
        showToastMSGNormal('OTP sent again');
        setOtp('');
        hasVerified.current = false;
        setTimer(30);
        otpRef.current?.clear();
        otpRef.current?.focus();
      }
    } catch {
      showToastMSGError('Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ImageBackground
            source={require('../assets/loginImg.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
          >
            <TouchableOpacity
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => navigation.goBack()}
              style={{backgroundColor:theme.colors.purewhiteBackground, padding:5, borderRadius:10, justifyContent:"center", alignItems:"center", position:"absolute", top:40, left:10}}
            >
              <BackIcon />
            </TouchableOpacity>
          </ImageBackground>

          <View style={styles.content}>
            <View style={{ gap: 4 }}>
              <Text style={styles.title}>Enter OTP</Text>
              <Text style={styles.subtitle}>
                We have sent an OTP to
                <Text style={styles.mobileText}> {mobile}</Text>
              </Text>
            </View>

            <View style={{ gap: 10 }}>
              {/* ✅ OtpInput handles autofill, paste, SMS suggestion natively */}
              <OtpInput
                ref={otpRef}
                numberOfDigits={4}
                autoFocus
                focusOnLoad
                // ✅ Called on every change — update state
                onTextChange={(text) => {
                  if (error) setError('');
                  if (text.length < 4) hasVerified.current = false;
                  setOtp(text);
                }}
                // ✅ Called ONLY when all 4 digits are filled — auto verify here
                onFilled={(text) => {
                  verifyOtp(text);
                }}
                textInputProps={{
                  accessibilityLabel: 'OTP Input',
                  textContentType: 'oneTimeCode',   // iOS SMS autofill
                  autoComplete: 'sms-otp',          // Android SMS suggestion
                }}
                theme={{
                  containerStyle: styles.otpContainer,
                  inputsContainerStyle: styles.otpInputsContainer,
                  pinCodeContainerStyle: styles.otpBox,
                  pinCodeTextStyle: styles.otpText,
                  focusedPinCodeContainerStyle: styles.otpBoxFocused,
                  filledPinCodeContainerStyle: styles.otpBoxFilled,
                }}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                disabled={timer > 0 || resendLoading}
                onPress={resendOtp}
              >
                {resendLoading ? (
                  <Loader />
                ) : (
                  <Text style={[styles.timerText, timer > 0 && { opacity: 0.4 }]}>
                    {timer > 0 ? `Resend OTP in ${timer}s` : 'Resend OTP'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {verifyLoading && <Loader />}

            <TouchableOpacity
              style={[styles.button, verifyLoading && { opacity: 0.7 }]}
              onPress={() => verifyOtp(otp)}
              activeOpacity={0.85}
              disabled={verifyLoading}
            >
              <Text style={styles.buttonText}>Verify</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default OtpScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.whiteBackground,
  },
  backgroundImage: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
  },
  content: {
    flex: 3,
    padding: 24,
    gap: 20,
  },
  title: {
    fontSize: 20,
    color: theme.colors.blackText,
  },
  subtitle: {
    color: theme.colors.graysubtext,
    fontSize: 14,
  },
  mobileText: {
    color: theme.colors.blackText,
    fontSize: 14,
    fontWeight: '600',
  },
  errorText: {
    color: 'red',
    fontSize: 13,
  },

  // OtpInput styling — matches your original box look
  otpContainer: {
    marginVertical: 4,
  },
  otpInputsContainer: {
    justifyContent: 'space-between',
    gap: 12,
  },
  otpBox: {
    width: 70,
    height: 56,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.borderColor,
    backgroundColor: theme.colors.purewhiteBackground,
  },
  otpBoxFocused: {
    borderColor: theme.colors.orangeColor,
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: theme.colors.orangeColor,
    backgroundColor: '#FFFFFF',
  },
  otpText: {
    fontSize: 22,
    color: theme.colors.orangeColor,
    fontWeight: '600',
  },

  timerText: {
    color: '#191919',
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.colors.orangeColor,
    borderRadius: 4,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  buttonText: {
    color: theme.colors.whiteText,
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});