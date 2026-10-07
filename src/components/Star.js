import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect, ClipPath } from 'react-native-svg';

const StarIcon = ({ fill = 'full', size = 15 }) => {
  const starPath = "M7.5 0L9.8175 4.695L15 5.4525L11.25 9.105L12.135 14.265L7.5 11.8275L2.865 14.265L3.75 9.105L0 5.4525L5.1825 4.695L7.5 0Z";

  if (fill === 'full') {
    return (
      <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
        <Path d={starPath} fill="#F2AA2D" />
      </Svg>
    );
  }

  if (fill === 'empty') {
    return (
      <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
        <Path d={starPath} fill="#D9D9D9" />
      </Svg>
    );
  }

  const fillPercent = typeof fill === 'number' ? fill : 0.5;
  const id = `grad_${Math.random().toString(36).slice(2)}`;

  return (
    <Svg width={size} height={size} viewBox="0 0 15 15" fill="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset={`${fillPercent}`} stopColor="#F2AA2D" />
          <Stop offset={`${fillPercent}`} stopColor="#D9D9D9" />
        </LinearGradient>
      </Defs>
      <Path d={starPath} fill={`url(#${id})`} />
    </Svg>
  );
};

const Star = ({ rating = 0, totalStars = 5, size = 15, gap = 3 }) => {
  const stars = [];

  for (let i = 1; i <= totalStars; i++) {
    if (rating >= i) {

      stars.push(<StarIcon key={i} fill="full" size={size} />);
    } else if (rating >= i - 1 && rating < i) {
      
      const partial = rating - (i - 1);
      stars.push(<StarIcon key={i} fill={partial} size={size} />);
    } else {
      stars.push(<StarIcon key={i} fill="empty" size={size} />);
    }
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      {stars}
    </View>
  );
};

export default Star;