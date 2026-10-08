import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { X } from "lucide-react-native";
import { theme } from "../utils/theme";

const CustomDialog = ({
  visible,
  title,
  message,
  onClose,
  onConfirm,
  confirmLabel = "OK",
  cancelLabel,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onClose}
  >
    <View style={styles.overlay}>
      <View style={styles.dialog}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          {cancelLabel ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.button, styles.cancelButton]}
            >
              <Text style={styles.cancelLabel}>{cancelLabel}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onClose();
              onConfirm?.();
            }}
            style={[
              styles.button,
              styles.confirmButton,
              !cancelLabel && styles.fullWidthButton,
            ]}
          >
            <Text style={styles.confirmLabel}>{confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close dialog"
        onPress={onClose}
        hitSlop={8}
        style={styles.closeButton}
      >
        <X size={20} color="#777777" strokeWidth={2} />
      </Pressable>
    </View>
  </Modal>
);

export default CustomDialog;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },
  dialog: {
    width: "100%",
    maxWidth: 380,
    padding: 20,
    borderRadius: 18,
    backgroundColor: theme.colors.purewhiteBackground,
  },
  title: {
    color: theme.colors.blackText,
    fontSize: 18,
    fontFamily: theme.fonts.bold,
    marginBottom: 8,
  },
  message: {
    color: theme.colors.subText,
    fontSize: 14,
    fontFamily: theme.fonts.regular,
    lineHeight: 21,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 22,
  },
  button: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 13,
    paddingHorizontal: 12,
  },
  cancelButton: {
    backgroundColor: "#EEEEEE",
  },
  confirmButton: {
    backgroundColor: "#242424",
  },
  fullWidthButton: {
    flex: 0,
    width: "100%",
  },
  cancelLabel: {
    color: "#242424",
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
  },
  confirmLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: theme.fonts.semiBold,
  },
  closeButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    borderRadius: 19,
    backgroundColor: "#D6D6D6",
  },
});
