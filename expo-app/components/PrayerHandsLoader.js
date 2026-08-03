import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export default function PrayerHandsLoader() {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotateAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(rotateAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '20deg'],
  });

  return (
    <Animated.Text style={{ fontSize: 20, transform: [{ rotate }] }}>
      🙏
    </Animated.Text>
  );
}
