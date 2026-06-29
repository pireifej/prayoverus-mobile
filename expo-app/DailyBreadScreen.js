import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, Animated, Image, StyleSheet, TouchableOpacity,
  Clipboard, Share, Platform, Dimensions, Alert, ScrollView, Modal,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base64 encoding — works in both web and React Native environments
const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  } else {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
};

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = Math.round(SCREEN_HEIGHT * 0.40);
const SAFE_TOP = Platform.OS === 'ios' ? 64 : 56;
const CREAM = '#F9F7F2';
const AMBER = '#b45309';
const SERIF = Platform.OS === 'ios' ? 'Georgia' : 'serif';


function formatMs(ms) {
  const s = Math.floor((ms || 0) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function formatDate(dateStr, lang) {
  const locale = lang === 'es' ? 'es-MX' : 'en-US';
  if (!dateStr) return new Date().toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
}

// Animated sound wave — 3 bars that pulse while audio plays
function SoundWave({ playing }) {
  const bars = [useRef(new Animated.Value(0.4)).current, useRef(new Animated.Value(0.7)).current, useRef(new Animated.Value(0.5)).current];
  const anims = useRef([]);

  useEffect(() => {
    anims.current.forEach(a => a && a.stop());
    if (playing) {
      anims.current = bars.map((bar, i) =>
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, { toValue: 1, duration: 300 + i * 80, useNativeDriver: true }),
            Animated.timing(bar, { toValue: 0.25, duration: 300 + i * 80, useNativeDriver: true }),
          ])
        )
      );
      anims.current.forEach(a => a.start());
    } else {
      bars.forEach(b => Animated.timing(b, { toValue: 0.4, duration: 150, useNativeDriver: true }).start());
    }
    return () => anims.current.forEach(a => a && a.stop());
  }, [playing]);

  return (
    <View style={waveStyles.wrap}>
      {bars.map((bar, i) => (
        <Animated.View key={i} style={[waveStyles.bar, { transform: [{ scaleY: bar }] }]} />
      ))}
    </View>
  );
}

const waveStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', height: 20, gap: 3, marginRight: 8 },
  bar: { width: 4, height: 18, borderRadius: 2, backgroundColor: '#fff' },
});

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function isOlderThan30Days(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr.split('T')[0]);
  return Date.now() - d.getTime() > THIRTY_DAYS_MS;
}

export default function DailyBreadScreen({ devotional, onBack, pastDevotionals = [], onSelectPast, bannerAdProps, archiveUnlocked, onUnlockArchive, userId, onNewBadge, lang = 'en' }) {
  const [prayerCopied, setPrayerCopied] = useState(false);
  const [audioStatus, setAudioStatus] = useState('idle'); // idle | loading | playing | paused
  const [audioPosition, setAudioPosition] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [showArchive, setShowArchive] = useState(false);
  const [streak, setStreak] = useState(null);
  const soundRef = useRef(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  // Call readDailyBread once per day to award points, track streak, check for new badge
  useEffect(() => {
    if (!userId || !devotional) return;
    const today = new Date().toISOString().split('T')[0];
    const storageKey = `readDailyBread_${today}`;
    AsyncStorage.getItem(storageKey).then(async (alreadyRead) => {
      if (alreadyRead) return; // already called today
      try {
        const res = await fetch('https://shouldcallpaul.replit.app/readDailyBread', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
          },
          body: JSON.stringify({ userId, devotionalId: devotional.id || devotional.date }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.streak) setStreak(data.streak);
          if (data.new_badge && onNewBadge) onNewBadge(data.new_badge);
          await AsyncStorage.setItem(storageKey, '1');
        }
      } catch (e) {
        console.warn('[DailyBread] readDailyBread error:', e?.message);
      }
    });
  }, [userId, devotional?.id]);

  // Unload audio when leaving the screen
  useEffect(() => {
    return () => { soundRef.current?.unloadAsync(); };
  }, []);

  if (!devotional) return null;

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
    try { await Share.share({ message }); } catch (e) {}
  };

  const handleCopyPrayer = () => {
    Clipboard.setString(devotional.prayer || '');
    setPrayerCopied(true);
    setTimeout(() => setPrayerCopied(false), 2500);
  };

  const handlePlayPause = async () => {
    try {
      if (audioStatus === 'playing') {
        await soundRef.current?.pauseAsync();
        setAudioStatus('paused');
        return;
      }
      if (audioStatus === 'paused') {
        await soundRef.current?.playAsync();
        setAudioStatus('playing');
        return;
      }

      // idle — fetch from Paul's backend (OpenAI nova voice, cached by date)
      setAudioStatus('loading');
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const date = devotional.date?.split('T')[0] || new Date().toISOString().split('T')[0];
      const langKey = lang === 'es' ? 'es' : 'en';
      const localUri = `${FileSystem.cacheDirectory}dailybread_${langKey}_${date}.mp3`;

      // Check device cache first — skip network call if already downloaded today
      const cached = await FileSystem.getInfoAsync(localUri);
      if (!cached.exists) {
        // POST to Paul's backend — same Basic Auth as all other APIs, returns MP3 binary directly
        const res = await fetch('https://shouldcallpaul.replit.app/getDailyBreadAudio', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc'),
          },
          body: JSON.stringify({
            date,
            lang: langKey,
            title: devotional.title || '',
            content: devotional.content || '',
            bibleVerse: devotional.bibleVerse || '',
            verseReference: devotional.verseReference || '',
            prayer: devotional.prayer || '',
          }),
        });
        if (!res.ok) throw new Error(`Audio API returned ${res.status}`);

        // Response is raw MP3 binary — convert via FileReader (async, won't freeze UI)
        const blob = await res.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            // result is "data:audio/mpeg;base64,<data>" — grab everything after the comma
            const result = reader.result;
            resolve(result.indexOf(',') >= 0 ? result.split(',')[1] : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Play from local cached file
      await soundRef.current?.unloadAsync();
      soundRef.current = null;

      setAudioPosition(0);
      setAudioDuration(0);
      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setAudioPosition(status.positionMillis || 0);
            setAudioDuration(status.durationMillis || 0);
            if (status.didJustFinish) {
              setAudioStatus('idle');
              setAudioPosition(0);
              soundRef.current?.unloadAsync();
              soundRef.current = null;
            }
          }
          if (status.error) {
            console.log('[TTS] playback error:', status.error);
            setAudioStatus('idle');
          }
        }
      );
      soundRef.current = sound;
      setAudioStatus('playing');
    } catch (e) {
      console.log('[TTS] error:', e?.message || e);
      setAudioStatus('idle');
      Alert.alert('Audio Error', e?.message || 'Could not load audio. Please try again.');
    }
  };

  const isEs = lang === 'es';
  const audioLabel = audioStatus === 'loading' ? (isEs ? 'Cargando...' : 'Loading...') : audioStatus === 'playing' ? '⏸ Pause' : audioStatus === 'paused' ? '▶ Resume' : (isEs ? '🔊 Escuchar' : '🔊 Listen');

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
          <LinearGradient colors={['rgba(0,0,0,0.32)', 'transparent']} style={StyleSheet.absoluteFill} />
        </Animated.View>
      </Animated.View>

      {/* Scroll content */}
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
        <View style={{ height: IMAGE_HEIGHT - 24 }} />

        <View style={styles.contentCard}>
          <Text style={styles.sectionLabel}>{lang === 'es' ? 'Pan Diario' : 'Daily Bread'}</Text>
          <Text style={styles.dateText}>{formatDate(devotional.date, lang)}</Text>
          <Text style={styles.title}>{devotional.title}</Text>

          {/* Listen button + progress bar */}
          <TouchableOpacity
            style={[styles.listenBtn, audioStatus === 'playing' && styles.listenBtnActive, audioStatus === 'loading' && { opacity: 0.7 }]}
            onPress={handlePlayPause}
            activeOpacity={0.8}
            disabled={audioStatus === 'loading'}
          >
            {audioStatus === 'playing' && <SoundWave playing />}
            <Text style={styles.listenBtnText}>{audioLabel}</Text>
          </TouchableOpacity>

          {/* Progress bar — visible while playing or paused */}
          {audioDuration > 0 && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${(audioPosition / audioDuration) * 100}%` }]} />
              </View>
              <Text style={styles.progressTime}>
                {formatMs(audioPosition)} / {formatMs(audioDuration)}
              </Text>
            </View>
          )}

          {(devotional.bibleVerse || devotional.verseReference) ? (
            <View style={styles.verseBlock}>
              <View style={styles.verseBorder} />
              <View style={styles.verseInner}>
                {devotional.bibleVerse ? <Text style={styles.verseText}>"{devotional.bibleVerse}"</Text> : null}
                {devotional.verseReference ? <Text style={styles.verseRef}>— {devotional.verseReference}</Text> : null}
              </View>
            </View>
          ) : null}

          {devotional.content ? <Text style={styles.bodyText}>{devotional.content}</Text> : null}

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
                  {prayerCopied ? (lang === 'es' ? '✓ Copiado' : '✓ Copied to Clipboard') : (lang === 'es' ? '🙏 Copiar Oración' : '🙏 Copy Prayer')}
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {bannerAdProps?.isAvailable && bannerAdProps?.BannerAd && bannerAdProps?.adUnitId ? (
            <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 4 }}>
              <bannerAdProps.BannerAd
                unitId={bannerAdProps.adUnitId}
                size={bannerAdProps.BannerAdSize?.BANNER}
                requestOptions={{ requestNonPersonalizedAdsOnly: false }}
              />
            </View>
          ) : null}
          <Text style={styles.footer}>Curated by Paul Ireifej</Text>
        </View>
      </Animated.ScrollView>

      {/* Floating top buttons */}
      <View style={[styles.topBar, { top: SAFE_TOP }]}>
        <TouchableOpacity onPress={onBack} style={styles.topBtn} activeOpacity={0.8}>
          <Text style={styles.topBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {pastDevotionals.length > 0 && (
            <TouchableOpacity onPress={() => setShowArchive(true)} style={styles.topBtn} activeOpacity={0.8}>
              <Text style={styles.topBtnText}>📅 Archive</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleShare} style={styles.topBtn} activeOpacity={0.8}>
            <Text style={styles.topBtnText}>Share ↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Archive Modal */}
      <Modal
        visible={showArchive}
        animationType="slide"
        transparent
        onRequestClose={() => setShowArchive(false)}
      >
        <View style={archiveStyles.overlay}>
          <View style={archiveStyles.sheet}>
            <View style={archiveStyles.sheetHandle} />
            <Text style={archiveStyles.sheetTitle}>{lang === 'es' ? '📅 Devocionales Anteriores' : '📅 Past Devotionals'}</Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {pastDevotionals.map((item, i) => {
                const locked = !archiveUnlocked && isOlderThan30Days(item.date);
                return (
                  <TouchableOpacity
                    key={i}
                    style={[archiveStyles.item, locked && archiveStyles.itemLocked]}
                    activeOpacity={locked ? 0.9 : 0.7}
                    onPress={() => {
                      if (locked) {
                        Alert.alert(
                          '🔒 Locked',
                          'Watch a short video to unlock devotionals older than 30 days.',
                          [
                            { text: 'Not Now', style: 'cancel' },
                            { text: 'Unlock Archive', onPress: () => { setShowArchive(false); if (onUnlockArchive) onUnlockArchive(); } },
                          ]
                        );
                      } else {
                        onSelectPast(item);
                        setShowArchive(false);
                      }
                    }}
                  >
                    <View style={archiveStyles.itemLeft}>
                      <Text style={archiveStyles.itemDate}>{formatDate(item.date, lang)}</Text>
                      <Text style={archiveStyles.itemTitle} numberOfLines={2}>
                        {locked ? '🔒 ' : ''}{item.title || 'Daily Bread'}
                      </Text>
                    </View>
                    {!locked && <Text style={archiveStyles.itemArrow}>›</Text>}
                    {locked && (
                      <View style={archiveStyles.watchAdBtn}>
                        <Text style={archiveStyles.watchAdText}>Watch ad</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={archiveStyles.closeBtn} onPress={() => setShowArchive(false)} activeOpacity={0.8}>
              <Text style={archiveStyles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1e3a5f' },
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
  topBtn: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 11,
    elevation: 20,
  },
  topBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
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
    fontSize: 11, fontWeight: '700', letterSpacing: 2.5, color: AMBER,
    textTransform: 'uppercase', marginBottom: 4,
  },
  dateText: { fontSize: 13, color: '#94928c', marginBottom: 12, fontFamily: SERIF },
  title: {
    fontSize: 28, fontWeight: '700', fontFamily: SERIF,
    color: '#1a1714', lineHeight: 36, marginBottom: 20,
  },
  listenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginBottom: 28,
    alignSelf: 'flex-start',
    minWidth: 140,
    elevation: 3,
    shadowColor: '#1e40af',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  listenBtnActive: { backgroundColor: '#dc2626' },
  listenBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  progressWrap: { marginTop: -16, marginBottom: 24, gap: 6 },
  progressTrack: { height: 4, backgroundColor: '#ddd8ce', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#1e40af', borderRadius: 2 },
  progressTime: { fontSize: 12, color: '#94928c', textAlign: 'right', fontFamily: SERIF },
  verseBlock: { flexDirection: 'row', marginBottom: 28, paddingVertical: 4 },
  verseBorder: { width: 4, borderRadius: 2, backgroundColor: AMBER, marginRight: 14 },
  verseInner: { flex: 1 },
  verseText: {
    fontSize: 18, fontFamily: SERIF, fontStyle: 'italic',
    color: '#3d3a35', lineHeight: 28, marginBottom: 6,
  },
  verseRef: { fontSize: 14, fontWeight: '600', color: AMBER, fontFamily: SERIF },
  bodyText: {
    fontSize: 20, fontFamily: SERIF, color: '#2d2a26',
    lineHeight: 32, marginBottom: 32,
  },
  prayerSection: { backgroundColor: '#EEF2F7', borderRadius: 14, padding: 20, marginBottom: 32 },
  prayerLabel: {
    fontSize: 13, fontWeight: '700', letterSpacing: 1.5, color: '#1e40af',
    textTransform: 'uppercase', marginBottom: 10,
  },
  prayerText: {
    fontSize: 17, fontFamily: SERIF, fontStyle: 'italic',
    color: '#2d2a26', lineHeight: 27, marginBottom: 16,
  },
  copyBtn: { backgroundColor: '#1e40af', borderRadius: 10, paddingVertical: 13, alignItems: 'center' },
  copyBtnDone: { backgroundColor: '#047857' },
  copyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  footer: {
    textAlign: 'center', fontSize: 12, color: '#b0ad9e',
    fontFamily: SERIF, fontStyle: 'italic', marginTop: 8, marginBottom: 20,
  },
});

const archiveStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#1e293b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12, paddingHorizontal: 20, paddingBottom: 36,
    maxHeight: '80%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2, alignSelf: 'center', marginBottom: 16,
  },
  sheetTitle: {
    color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 16,
  },
  item: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)',
  },
  itemLocked: { opacity: 0.65 },
  itemLeft: { flex: 1, marginRight: 12 },
  itemDate: { color: 'rgba(255,255,255,0.45)', fontSize: 11, marginBottom: 3 },
  itemTitle: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  itemArrow: { color: 'rgba(255,255,255,0.35)', fontSize: 22 },
  watchAdBtn: {
    backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.35)',
  },
  watchAdText: { color: '#fbbf24', fontSize: 11, fontWeight: '600' },
  closeBtn: {
    marginTop: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
