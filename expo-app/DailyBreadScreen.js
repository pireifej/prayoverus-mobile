import React, { useState, useRef } from 'react';
import {
  View, Text, Animated, Image, StyleSheet, TouchableOpacity,
  Clipboard, Share, Platform, Dimensions, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

const { height } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(height * 0.40);
const MIN_HEADER = Platform.OS === 'ios' ? 110 : 90;
const CREAM = '#F9F7F2';
const AMBER = '#b45309';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';

function formatDate(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function DailyBreadScreen({ devotional, onBack, pastDevotionals = [], onSelectPast }) {
  const [prayerCopied, setPrayerCopied] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;

  if (!devotional) return null;

  const headerHeight = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - MIN_HEADER],
    outputRange: [IMAGE_HEIGHT, MIN_HEADER],
    extrapolate: 'clamp',
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, IMAGE_HEIGHT - MIN_HEADER],
    outputRange: [1, 0.3],
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

      {/* Collapsing header image */}
      <Animated.View style={[styles.imageWrap, { height: headerHeight }]}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          {devotional.imageURL ? (
            <Image source={{ uri: devotional.imageURL }} style={StyleSheet.absoluteFill} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#1e3a5f', '#2563eb']} style={StyleSheet.absoluteFill} />
          )}
        </Animated.View>
        <LinearGradient
          colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.18)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Top bar — always visible */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onBack} style={styles.topBtn} activeOpacity={0.8}>
            <Text style={styles.topBtnText}>← Back</Text>
          </TouchableOpacity>
          <View style={styles.topRight}>
            {pastDevotionals.length > 1 && (
              <TouchableOpacity onPress={() => setShowPast(true)} style={[styles.topBtn, { marginRight: 8 }]} activeOpacity={0.8}>
                <Text style={styles.topBtnText}>📚 Archive</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleShare} style={styles.topBtn} activeOpacity={0.8}>
              <Text style={styles.topBtnText}>Share ↗</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Scrollable body */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
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
      </Animated.ScrollView>

      {/* Past Devotionals Modal */}
      <Modal visible={showPast} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowPast(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Daily Bread Archive</Text>
            <TouchableOpacity onPress={() => setShowPast(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={pastDevotionals}
            keyExtractor={(item, i) => item.date || item.title || String(i)}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.pastItem}
                activeOpacity={0.75}
                onPress={() => {
                  setShowPast(false);
                  onSelectPast && onSelectPast(item);
                }}
              >
                {item.imageURL ? (
                  <Image source={{ uri: item.imageURL }} style={styles.pastItemImage} resizeMode="cover" />
                ) : (
                  <LinearGradient colors={['#1e3a5f', '#2563eb']} style={styles.pastItemImage} />
                )}
                <View style={styles.pastItemInfo}>
                  <Text style={styles.pastItemDate}>{formatDate(item.date)}</Text>
                  <Text style={styles.pastItemTitle} numberOfLines={2}>{item.title}</Text>
                  {item.verseReference ? (
                    <Text style={styles.pastItemVerse}>{item.verseReference}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CREAM,
  },
  imageWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 36,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topBtn: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  topBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
    backgroundColor: CREAM,
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 60,
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
  modalContainer: {
    flex: 1,
    backgroundColor: CREAM,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e2d8',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: SERIF,
    color: '#1a1714',
  },
  modalClose: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  pastItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  pastItemImage: {
    width: 88,
    height: 88,
  },
  pastItemInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  pastItemDate: {
    fontSize: 11,
    color: '#94928c',
    marginBottom: 4,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  pastItemTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: SERIF,
    color: '#1a1714',
    lineHeight: 20,
    marginBottom: 4,
  },
  pastItemVerse: {
    fontSize: 12,
    color: AMBER,
    fontWeight: '600',
  },
});
