import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  FlatList,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { theme } from '../utils/theme'
const { width, height } = Dimensions.get('window')

const DATA = [
{
  id: '1',
  title: 'Discover Spaces Worth Knowing',
  subtitle: 'Explore thoughtfully selected projects, properties, and opportunities in one place.',
  image: require('../assets/OnboardingScreenimg1.png'),
},
{
  id: '2',
  title: 'Everything You Need, All In One Place',
  subtitle: 'Browse project details, inventory, documents, and updates without the usual hassle.',
  image: require('../assets/OnboardingScreenimg3.png'),
},
{
  id: '3',
  title: 'Turn Properties Into Possibilities',
  subtitle: 'Find the right space, stay informed, and connect with the people who make it happen.',
  image: require('../assets/OnboardingScreenimg2.png'),
},
]

const OnboardingScreen1 = ({ navigation }) => {
  const flatListRef = useRef(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0)
    }
  }, [])

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  })


  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % DATA.length
      try {
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
      } catch (e) {

      }
    }, 3000)

    return () => clearInterval(interval)
  }, [currentIndex])

  const handleButton = useCallback(() => {
    if (currentIndex === DATA.length - 1) {
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      })
    } else {
      const nextIndex = currentIndex + 1
      try {
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
      } catch (e) { }
    }
  }, [currentIndex])

  const renderItem = useCallback(({ item }) => {
    return (
      <ImageBackground
        source={item.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.textBlock}>
            <Text style={styles.heading}>{item.title}</Text>
            <Text style={styles.subheading}>{item.subtitle}</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    )
  }, [])

  const keyExtractor = useCallback((item) => item.id, [])

  const getItemLayout = useCallback((_, index) => ({
    length: width,
    offset: width * index,
    index,
  }), [])

  return (
    <View style={styles.container}>
      {/* <StatusBar barStyle="light-content" translucent backgroundColor="transparent" /> */}
      <FlatList
        ref={flatListRef}
        data={DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig.current}
        getItemLayout={getItemLayout}
        scrollEventThrottle={16}
        bounces={false}
      />
      <SafeAreaView style={styles.overlayContainer} edges={['bottom']}>
        <View style={styles.dotsContainer}>
          {DATA.map((_, index) => (
            <View
              key={index}
              style={[styles.dot, currentIndex === index && styles.dotActive]}
            />
          ))}
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleButton}
          activeOpacity={0.85}
        >
          <Text style={styles.buttonText}>
            {currentIndex === DATA.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

export default OnboardingScreen1

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  backgroundImage: {
    width,
    justifyContent: 'flex-end',
  },
  safeArea: {
    paddingHorizontal: 24,
  },

  textBlock: {
    marginBottom: 160,
    gap:16
  },

  heading: {
    fontSize: 24,
    fontFamily: theme.fonts.bold,
    color: '#121212',
    lineHeight: 32,
    // letterSpacing: -0.3,
  },

  subheading: {
    fontSize: 17,
    fontFamily: theme.fonts.regular,
    color: '#535353ff',
    lineHeight: 22,
  },

  overlayContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.borderlightgraycolour,
  },

  dotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#121212',
  },

  button: {
    backgroundColor: '#191919',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: theme.fonts.semiBold,
    letterSpacing: 0.2,
  },
})

// import { StyleSheet, Text, View } from 'react-native'
// import React from 'react'

// const OnboardingScreen1 = () => {
//   return (
//     <View style={{flex:1, backgroundColor:"red"}}>
//       <Text>OnboardingScreen1</Text>
//     </View>
//   )
// }

// export default OnboardingScreen1

// const styles = StyleSheet.create({})