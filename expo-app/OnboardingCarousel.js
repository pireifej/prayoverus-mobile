import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';

const { width: SW } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '🙏',
    title: 'Pray for Real People',
    subtitle: 'Browse prayer requests from your community and lift them up — one prayer at a time.',
    gradient: ['#071428', '#0d2151', '#1a3a8f'],
    accent: '#60a5fa',
  },
  {
    emoji: '🎧',
    title: 'Walk & Pray Together',
    subtitle: 'Put on your headphones and go for a walk while prayer requests are read aloud to you.',
    gradient: ['#0d1f0d', '#1a3a1a', '#1e6b1e'],
    accent: '#86efac',
  },
  {
    emoji: '📖',
    title: 'Daily Bread',
    subtitle: 'Start every morning with a short devotional reflection to feed your spirit for the day.',
    gradient: ['#1c0a00', '#3b1a00', '#7c3a00'],
    accent: '#fbbf24',
  },
];

export default function OnboardingCarousel({ onDone }) {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = (next) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
    setTimeout(() => setIndex(next), 150);
  };

  const handleNext = () => {
    if (index < SLIDES.length - 1) {
      goTo(index + 1);
    } else {
      onDone();
    }
  };

  const slide = SLIDES[index];

  return (
    <LinearGradient colors={slide.gradient} style={styles.container}>
      <StatusBar style="light" />

      {/* Skip */}
      <TouchableOpacity style={styles.skipBtn} onPress={onDone} activeOpacity={0.7}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.subtitle}>{slide.subtitle}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <TouchableOpacity key={i} onPress={() => goTo(i)}>
            <View style={[
              styles.dot,
              i === index ? { ...styles.dotActive, backgroundColor: slide.accent } : styles.dotInactive
            ]} />
          </TouchableOpacity>
        ))}
      </View>

      {/* Next / Get Started */}
      <TouchableOpacity
        style={[styles.nextBtn, { backgroundColor: slide.accent }]}
        onPress={handleNext}
        activeOpacity={0.85}
      >
        <Text style={styles.nextText}>
          {index < SLIDES.length - 1 ? 'Next →' : 'Get Started'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  skipBtn: {
    position: 'absolute', top: 60, right: 24, zIndex: 10,
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 20,
  },
  skipText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '600' },

  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 36, paddingTop: 60,
  },
  emoji: { fontSize: 88, marginBottom: 32 },
  title: {
    color: '#fff', fontSize: 28, fontWeight: '800',
    textAlign: 'center', marginBottom: 18, letterSpacing: 0.2,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)', fontSize: 17,
    textAlign: 'center', lineHeight: 26,
  },

  dots: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 10, marginBottom: 28,
  },
  dot: { borderRadius: 6 },
  dotActive: { width: 22, height: 8 },
  dotInactive: { width: 8, height: 8, backgroundColor: 'rgba(255,255,255,0.25)' },

  nextBtn: {
    marginHorizontal: 28, borderRadius: 18,
    paddingVertical: 18, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  nextText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
});
