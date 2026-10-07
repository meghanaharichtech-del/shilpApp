import React from 'react';
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import LocationIcon from '../assets/addressIcon.svg';
import { theme } from '../utils/theme';
import Star from './Star';



const ServiceCard = ({
  title,
  items = [],
  onAddCart,
  onViewDetail,
  showDiscount = true,
  showTitle = true,
  buttonLabel = 'Add to cart',
  // navigation
}) => {
  if (!items || items.length === 0) return null;

  return (
    <View style={{ gap: 10, }}>
      {showTitle && title ? (
        <Text style={{ fontSize: 18, color: theme.colors.blackText }}>
          {title}
        </Text>
      ) : null}
      <FlatList
        data={items}
        //  showsHorizontalScrollIndicator={false}
        horizontal={true} 
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={{ gap: 12, paddingHorizontal: 4 }}
        showsHorizontalScrollIndicator={false} 
        renderItem={({ item }) => {
const distanceMeters = item?.workshop.distance_meters || item?.workshop?.distanceKm;
console.log("--- service", item.workshop.distance_meters);

let formattedDistance = "Nearby";

if (distanceMeters != null) {
  const distanceKm =
    item?.distanceKm ?? distanceMeters / 1000;

  formattedDistance =
    distanceKm < 1
      ? `${Math.round(distanceMeters)} m away`
      : `${distanceKm.toFixed(1)} km away`;
}
          const rating = item.workshop?.rating;
          const reviews = item.workshop?.totalReviews;
          console.log("items", item.workshop?.rating);
          
          return (
            
             <TouchableOpacity
        onPress={() => {
          onViewDetail(item);  
        }}
        style={{
    width: 282,
    backgroundColor: theme.colors.purewhiteBackground,
    borderRadius: 10,
    borderColor: theme.colors.borderColor,
    borderWidth: 1,
    overflow: 'hidden',
  
        }}
      >
        <View style={{padding:6}}>

        <Image
          source={
            item.workshop?.imageUrl
            ? { uri: item.workshop.imageUrl }
            : require('../assets/Noimg.png')
          }
          style={{ width: '100%',height:150, borderRadius: 10 }}
          resizeMode="cover"
          />
          </View>
        <View style={{ padding: 16, paddingTop: 10, gap: 10 }}>
          <Text
            style={{
              color: theme.colors.blackText,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            {item.workshop.name}
          </Text>
          <View style={{ flexDirection: 'row' }}>
          {item.workshop.rating !=null &&
           <View
  style={{
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  }}
>
  <Star
  rating={item.workshop.rating || 0}
  size={15}
  gap={3}
  />

  <Text
  style={{
    color: '#F2AA2D',
    fontSize: 14,
    fontWeight: '600',
  }}
  >
    {(item?.workshop.rating || 0).toFixed(1)}
  </Text>
</View>
  }
            <View
              style={{
                width: 2,
                height: 16, 
                backgroundColor: theme.colors.borderColor,
                marginHorizontal: 10,
              }}
            />
            <View
              style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}
            >
              <LocationIcon />
              <Text style={{ color: theme.colors.graysubtext, fontSize: 14 }}>
                {formattedDistance}
              </Text>
            </View>
          </View>
          <Text
            ellipsizeMode="tail"
            numberOfLines={2}
            style={{
              color: theme.colors.subTextsmall,
              fontSize: 14,
              fontWeight: 400,
            }}
          >
            {item.workshop.address}
          </Text>
        </View>
      </TouchableOpacity>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default ServiceCard;

const styles = StyleSheet.create({
  workshopImage: {
    width: '100%',
    height: 140,
    overflow: 'hidden',
     
    backgroundColor:theme.colors.subTextsmall,

     borderRadius: 10
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  ratingStars: {
    color: '#FFA500',
    fontSize: 14,
  },

  ratingText: {
    fontSize: 12,
    color: '#666',
  },
});
