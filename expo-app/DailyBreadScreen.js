import React, { useState, useRef } from 'react';
import {
  View, Text, Animated, Image, StyleSheet, TouchableOpacity,
  Clipboard, Share, Platform, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.40);
const SAFE_TOP = Platform.OS === 'ios' ? 64 : 56;
const CREAM = '#F9F7F2';
const AMBER = '#b45309';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyBreadScreen({ devotional, onBack, pastDevotionals = [], onSelectPast }) {
  const [prayerCopied, setPrayerCopied] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!devotional) return null;

  // Image fades and compresses as user scrolls — fully gone by IMAGE_HEIGHT
  const headerHeight = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT],
    outputRange: [IMAGE_HEIGHT, 0],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT * 0.65],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const handleShare = async () => {
    const deepLink = 'https://prayoverus.com/download.html?open=dailybread';
    const verse = devotional.verseReference ? ` (${devotional.verseReference})` : '';
    const message = `"${devotional.title}"${verse}\n\nRead today's Daily Bread devotional in the Pray Over Us app:\n${deepLink}`;
    try {
      await Share.share({ message });
    } catch (e) {}
  };

  const handleCopyPrayer = () => {
    Clipboard.setString(devotional.prayer || '');
    setPrayerCopied(true);
    setTimeout(() => setPrayerCopied(false), 2500);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Image header — absolute, collapses behind scroll content */}
      <Animated.View style={[styles.imageWrap, { height: headerHeight }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          {devotional.imageURL ? (
            <Image source={{ uri: devotional.imageURL }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#1e3a5f', '#2563eb']} style={StyleSheet.absoluteFill} />
          )}
          <LinearGradient
            colors={['rgba(0,0,0,0.32)', 'transparent']}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </Animated.View>

      {/* Scroll content — full screen, cream card slides over image */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Transparent spacer reveals the image beneath */}
        <View style={{ height: IMAGE_HEIGHT - 24 }} />

        {/* Cream content card slides up over the image */}
        <View style={styles.contentCard}>
          <Text style={styles.sectionLabel}>Daily Bread</Text>
          <Text style={styles.dateText}>{formatDate(devotional.date)}</Text>
          <Text style={styles.title}>{devotional.title}</Text>

          {(devotional.bibleVerse || devotional.verseReference) ? (
            <View style={styles.verseBlock}>
              <View style={styles.verseBorder} />
              <View style={styles.verseInner}>
                {devotional.bibleVerse ? (
                  <Text style={styles.verseText}>"{devotional.bibleVerse}"</Text>
                ) : null}
                {devotional.verseReference ? (
                  <Text style={styles.verseRef}>— {devotional.verseReference}</Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {devotional.content ? (
            <Text style={styles.bodyText}>{devotional.content}</Text>
          ) : null}

          {devotional.prayer ? (
            <View style={styles.prayerSection}>
              <Text style={styles.prayerLabel}>✝️ Today's Prayer</Text>
              <Text style={styles.prayerText}>{devotional.prayer}</Text>
              <TouchableOpacity
                style={[styles.copyBtn, prayerCopied && styles.copyBtnDone]}
                onPress={handleCopyPrayer}
                activeOpacity={0.8}
              >
                <Text style={styles.copyBtnText}>
                  {prayerCopied ? '✓ Copied to Clipboard' : '🙏 Copy Prayer'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <Text style={styles.footer}>Curated by Paul Ireifej</Text>
        </View>
      </Animated.ScrollView>

      {/* Floating buttons — always visible regardless of scroll position */}
      <View style={[styles.topBar, { top: SAFE_TOP }]}>
        <TouchableOpacity onPress={onBack} style={styles.topBtn} activeOpacity={0.8}>
          <Text style={styles.topBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.topRight}>
          <TouchableOpacity onPress={handleShare} style={styles.topBtn} activeOpacity={0.8}>
            <Text style={styles.topBtnText}>Share ↗</Text>
          </TouchableOpacity>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e3a5f',
  },
  imageWrap: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    overflow: 'hidden',
    zIndex: 0,
  },
  topBar: {
    position: 'absolute',
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 20,
    elevation: 20,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    elevation: 20,
  },
  topBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  contentCard: {
    backgroundColor: CREAM,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 28,
    paddingBottom: 40,
    minHeight: SCREEN_HEIGHT,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: AMBER,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 13,
    color: '#94928c',
    marginBottom: 12,
    fontFamily: SERIF,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: SERIF,
    color: '#1a1714',
    lineHeight: 36,
    marginBottom: 24,
  },
  verseBlock: {
    flexDirection: 'row',
    marginBottom: 28,
    paddingVertical: 4,
  },
  verseBorder: {
    width: 4,
    borderRadius: 2,
    backgroundColor: AMBER,
    marginRight: 14,
  },
  verseInner: {
    flex: 1,
  },
  verseText: {
    fontSize: 18,
    fontFamily: SERIF,
    fontStyle: 'italic',
    color: '#3d3a35',
    lineHeight: 28,
    marginBottom: 6,
  },
  verseRef: {
    fontSize: 14,
    fontWeight: '600',
    color: AMBER,
    fontFamily: SERIF,
  },
  bodyText: {
    fontSize: 20,
    fontFamily: SERIF,
    color: '#2d2a26',
    lineHeight: 32,
    marginBottom: 32,
  },
  prayerSection: {
    backgroundColor: '#EEF2F7',
    borderRadius: 14,
    padding: 20,
    marginBottom: 32,
  },
  prayerLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: '#1e40af',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  prayerText: {
    fontSize: 17,
    fontFamily: SERIF,
    fontStyle: 'italic',
    color: '#2d2a26',
    lineHeight: 27,
    marginBottom: 16,
  },
  copyBtn: {
    backgroundColor: '#1e40af',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
  },
  copyBtnDone: {
    backgroundColor: '#047857',
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#b0ad9e',
    fontFamily: SERIF,
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 20,
  },
});
