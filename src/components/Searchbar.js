import { StyleSheet, Text, View } from 'react-native'
import React from 'react'

const Searchbar = () => {
  return (
    <View>
      <Text>Searchbar</Text>
      <Searchbar placeholder="Search"
        onChangeText={onChangeSearch}
        value={searchQuery}
        styles={{ backgroundColor: theme.colors.whiteBackground, borderRadius: 10, elevation: 2, marginBottom: 10 }}
         />
    </View>
  )
}

export default Searchbar

const styles = StyleSheet.create({})