import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { theme } from './theme';

const Loader = (props) => {
  const { loadings, ...attributes } = props;

  return (
    <Modal
      transparent={true}
      animationType={"fade"}
      visible={loadings}
      onRequestClose={() => {
      }}>
      <View style={styles.modalBackground}>
          <ActivityIndicator
            animating={true}
            color={theme.colors.orangeColor}
            size="large"
            style={styles.activityIndicator}
          />
          {/* <Text style={{ color: "#121212", marginBottom: 16, fontWeight: 'bold' }}>Please wait...</Text> */}
        {/* </View> */}
      </View>
    </Modal>
  )
};

export default Loader;

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  activityIndicatorWrapper: {
    backgroundColor: theme.colors.orangeColor,
    height: 80,
    width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  activityIndicator: {
    alignItems: 'center',
    height: 80,
  }
});