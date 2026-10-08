import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { theme } from './src/utils/theme';

// Custom SVG Icons matching the visual design
const SuccessIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#22C55E" strokeWidth="2" />
    <Path
      d="M8.5 12.5l2.5 2.5 5-5"
      stroke="#22C55E"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ErrorIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3l7.79 4.5v9l-7.79 4.5L4.21 16.5v-9L12 3z"
      fill="#EF4444"
      stroke="#EF4444"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <Path
      d="M12 8.5v5M12 16.5h.01"
      stroke="#1E1F22"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

const InfoIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#3B82F6" strokeWidth="2" />
    <Path
      d="M12 8v.01M12 11v5"
      stroke="#3B82F6"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

const WarningIcon = () => (
  <Svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke="#F59E0B" strokeWidth="2" />
    <Path
      d="M12 8v5M12 16h.01"
      stroke="#F59E0B"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </Svg>
);

const ToastSuccess = ({ text1 }) => (
  <View style={toastStyles.wrapper}>
    <SuccessIcon />
    <Text style={toastStyles.text}>{text1}</Text>
  </View>
);

const ToastError = ({ text1 }) => (
  <View style={toastStyles.wrapper}>
    <ErrorIcon />
    <Text style={toastStyles.text}>{text1}</Text>
  </View>
);

const ToastInfo = ({ text1 }) => (
  <View style={toastStyles.wrapper}>
    <InfoIcon />
    <Text style={toastStyles.text}>{text1}</Text>
  </View>
);

const ToastWarning = ({ text1 }) => (
  <View style={toastStyles.wrapper}>
    <WarningIcon />
    <Text style={toastStyles.text}>{text1}</Text>
  </View>
);

const toastStyles = StyleSheet.create({
  wrapper: {
    width: '90%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30, // Stadium shape/highly rounded corners
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E1F22', // Dark premium background
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  text: {
    fontSize: 14,
    fontFamily: theme.fonts.medium,
    color: '#EEEEEE', // Off-white color for premium readability
    flex: 1,
    flexShrink: 1,
    lineHeight: 18,
  },
});

export const toastConfig = {
  success: ({ text1 }) => <ToastSuccess text1={text1} />,
  error: ({ text1 }) => <ToastError text1={text1} />,
  info: ({ text1 }) => <ToastInfo text1={text1} />,
  warning: ({ text1 }) => <ToastWarning text1={text1} />,
};
