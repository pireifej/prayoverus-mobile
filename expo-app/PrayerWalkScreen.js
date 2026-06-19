import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Animated, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';

const SAFE_TOP = Platform.OS === 'android' ? 28 : 50;
const BASE_URL = 'https://shouldcallpaul.replit.app';

const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') return btoa(str);
  const { Buffer } = require('buffer');
  return Buffer.from(str, 'utf-8').toString('base64');
};
const AUTH = () => 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc');

export default function PrayerWalkScreen({ prayers, currentUser, onPrayForRequest, onClose }) {
  const unprayed = (prayers || []).filter(p => !p.user_has_prayed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioStatus, setAudioStatus] = useState('idle'); // idle | loading | playing | paused
  const [isFinished, setIsFinished] = useState(false);
  const [prayedThisSession, setPrayedThisSession] = useState(0);
  const soundRef = useRef(null);
  const isActiveRef = useRef(true);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);

  const total = unprayed.length;
  const current = unprayed[currentIndex];

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Unload sound when advancing to next prayer
  useEffect(() => {
    return () => {
      soundRef.current?.unloadAsync();
      soundRef.current = null;
    };
  }, [currentIndex]);

  useEffect(() => {
    if (audioStatus === 'playing') {
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.18, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      Animated.spring(pulseAnim, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [audioStatus]);

  const playCurrent = async () => {
    if (!current) return;
    setAudioStatus('loading');

    try {
      const localUri = `${FileSystem.cacheDirectory}prayerAudio_${current.id}.mp3`;
      const cached = await FileSystem.getInfoAsync(localUri);

      if (!cached.exists) {
        const text = `${current.title ? current.title + '. ' : ''}${current.content || ''}`;
        const res = await fetch(`${BASE_URL}/getPrayerAudio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': AUTH() },
          body: JSON.stringify({ requestId: current.id, text }),
        });
        if (!res.ok) throw new Error(`Audio API ${res.status}`);

        const blob = await res.blob();
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const r = reader.result;
            resolve(r.indexOf(',') >= 0 ? r.split(',')[1] : r);
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        await FileSystem.writeAsStringAsync(localUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      await soundRef.current?.unloadAsync();
      soundRef.current = null;
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        (status) => {
          if (!isActiveRef.current) return;
          if (status.isLoaded && status.didJustFinish) {
            setAudioStatus('idle');
            soundRef.current?.unloadAsync();
            soundRef.current = null;
            handlePrayedAndAdvance();
          }
          if (status.error) setAudioStatus('idle');
        }
      );
      soundRef.current = sound;
      setAudioStatus('playing');
    } catch (e) {
      console.log('[PrayerWalk] audio error:', e.message);
      if (isActiveRef.current) setAudioStatus('idle');
    }
  };

  const handlePauseResume = async () => {
    if (audioStatus === 'playing') {
      await soundRef.current?.pauseAsync();
      setAudioStatus('paused');
    } else if (audioStatus === 'paused') {
      await soundRef.current?.playAsync();
      setAudioStatus('playing');
    }
  };

  const handleStop = async () => {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setAudioStatus('idle');
  };

  const handlePrayedAndAdvance = () => {
    if (!current) return;
    onPrayForRequest(current.id);
    setPrayedThisSession(n => n + 1);
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
      setAudioStatus('idle');
    } else {
      setIsFinished(true);
    }
  };

  const handleSkip = async () => {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    setAudioStatus('idle');
    if (currentIndex < total - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleClose = async () => {
    await soundRef.current?.stopAsync();
    await soundRef.current?.unloadAsync();
    soundRef.current = null;
    onClose();
  };

  const audioLabel = audioStatus === 'loading' ? 'Loading...'
    : audioStatus === 'playing' ? '⏸  Pause'
    : audioStatus === 'paused' ? '▶  Resume'
    : '▶  Play Aloud';

  if (total === 0) {
    return (
      <LinearGradient colors={['#0f172a', '#1e3a5f']} style={styles.container}>
        <StatusBar style="light" />
        <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { top: SAFE_TOP }]}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🙏</Text>
          <Text style={styles.doneTitle}>You've prayed for everyone!</Text>
          <Text style={styles.doneSub}>Come back when new requests are posted.</Text>
          <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Back to Feed</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (isFinished) {
    return (
      <LinearGradient colors={['#0f172a', '#1e3a5f']} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Prayer Walk Complete!</Text>
          <Text style={styles.doneSub}>
            You prayed for {prayedThisSession} {prayedThisSession === 1 ? 'person' : 'people'} today.{'\n'}God bless you!
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={handleClose} activeOpacity={0.8}>
            <Text style={styles.doneBtnText}>Back to Feed</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0f172a', '#1e3a5f', '#1e40af']} style={styles.container}>
      <StatusBar style="light" />

      <TouchableOpacity onPress={handleClose} style={[styles.closeBtn, { top: SAFE_TOP }]}>
        <Text style={styles.closeBtnText}>✕</Text>
      </TouchableOpacity>

      <View style={[styles.header, { paddingTop: SAFE_TOP + 20 }]}>
        <Text style={styles.headerLabel}>🎧 Prayer Walk</Text>
        <Text style={styles.progressLabel}>{currentIndex + 1} of {total}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / total) * 100}%` }]} />
      </View>

      <ScrollView style={styles.cardArea} contentContainerStyle={styles.cardContent} showsVerticalScrollIndicator={false}>
        <View style={styles.prayerCard}>
          {current?.title ? (
            <Text style={styles.prayerTitleText}>{current.title}</Text>
          ) : null}
          <Text style={styles.prayerContentText}>{current?.content || ''}</Text>
          <Text style={styles.prayerAuthorText}>— {current?.author || 'Community Member'}</Text>
        </View>

        <Text style={styles.hint}>
          {audioStatus === 'loading'
            ? '⏳ Preparing audio...'
            : audioStatus === 'playing'
            ? '🎙 Playing — pray along as you listen.'
            : audioStatus === 'paused'
            ? '⏸ Paused'
            : 'Press ▶ to hear this request read aloud, then pray along.'}
        </Text>
      </ScrollView>

      <View style={styles.controls}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.speakBtn,
              audioStatus === 'playing' && styles.speakBtnActive,
              audioStatus === 'loading' && { opacity: 0.7 },
            ]}
            onPress={
              audioStatus === 'idle' ? playCurrent
              : audioStatus === 'loading' ? undefined
              : handlePauseResume
            }
            disabled={audioStatus === 'loading'}
            activeOpacity={0.8}
          >
            {audioStatus === 'loading'
              ? <ActivityIndicator color="#fff" size="large" />
              : <Text style={styles.speakIcon}>{audioStatus === 'playing' ? '⏸' : audioStatus === 'paused' ? '▶' : '▶'}</Text>
            }
            {audioStatus !== 'loading' && (
              <Text style={styles.speakLabel}>{audioLabel}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip ›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.amenBtn} onPress={handlePrayedAndAdvance} activeOpacity={0.8}>
            <Text style={styles.amenText}>🙏  Amen, I Prayed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  closeBtn: {
    position: 'absolute', right: 20, zIndex: 20,
    backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 12,
  },
  headerLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  progressLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' },
  progressTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.15)',
    marginHorizontal: 24, borderRadius: 2, marginBottom: 24,
  },
  progressFill: { height: 3, backgroundColor: '#60a5fa', borderRadius: 2 },
  cardArea: { flex: 1, paddingHorizontal: 20 },
  cardContent: { paddingBottom: 16 },
  prayerCard: {
    backgroundColor: 'rgba(255,255,255,0.09)', borderRadius: 20,
    padding: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)',
    marginBottom: 16,
  },
  prayerTitleText: {
    color: '#93c5fd', fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12,
  },
  prayerContentText: { color: '#f1f5f9', fontSize: 18, lineHeight: 28, fontStyle: 'italic' },
  prayerAuthorText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, marginTop: 18 },
  hint: {
    color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center',
    lineHeight: 20, paddingHorizontal: 16,
  },
  controls: {
    paddingHorizontal: 24, paddingBottom: Platform.OS === 'android' ? 28 : 44,
    paddingTop: 8, alignItems: 'center', gap: 14,
  },
  speakBtn: {
    width: 148, height: 148, borderRadius: 74,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  speakBtnActive: { backgroundColor: 'rgba(96,165,250,0.25)', borderColor: '#60a5fa' },
  speakIcon: { fontSize: 36, marginBottom: 4 },
  speakLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, width: '100%' },
  skipBtn: {
    flex: 1, paddingVertical: 14,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
  },
  skipText: { color: 'rgba(255,255,255,0.6)', fontSize: 15, fontWeight: '600' },
  amenBtn: { flex: 2, paddingVertical: 14, backgroundColor: '#2563eb', borderRadius: 14, alignItems: 'center', elevation: 4 },
  amenText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneEmoji: { fontSize: 64, marginBottom: 20 },
  doneTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  doneSub: { color: 'rgba(255,255,255,0.55)', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 36 },
  doneBtn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, elevation: 4 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
