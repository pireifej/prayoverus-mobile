import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Animated, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';

const { width: SW, height: SH } = Dimensions.get('window');
const SAFE_TOP = Platform.OS === 'android' ? 28 : 50;
const BASE_URL = 'https://shouldcallpaul.replit.app';

const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(str)));
  const { Buffer } = require('buffer');
  return Buffer.from(str, 'utf-8').toString('base64');
};
const AUTH = () => 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc');

// Build the spoken text: "Prayer for Name. Title. Content. Amen."
const buildSpokenText = (prayer) => {
  const parts = [];
  if (prayer?.author) parts.push(`Prayer for ${prayer.author}.`);
  if (prayer?.title) parts.push(prayer.title + '.');
  if (prayer?.content) parts.push(prayer.content);
  parts.push('Amen.');
  return parts.join(' ');
};

// Ripple animation component — 3 concentric expanding rings
function Ripples({ playing }) {
  const r1 = useRef(new Animated.Value(0)).current;
  const r2 = useRef(new Animated.Value(0)).current;
  const r3 = useRef(new Animated.Value(0)).current;
  const loopsRef = useRef([]);

  useEffect(() => {
    loopsRef.current.forEach(l => l?.stop());
    loopsRef.current = [];
    [r1, r2, r3].forEach(a => a.setValue(0));

    if (!playing) return;

    const startRipple = (anim, delay) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 3200, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      return loop;
    };
    loopsRef.current = [
      startRipple(r1, 0),
      startRipple(r2, 1067),
      startRipple(r3, 2133),
    ];
    return () => loopsRef.current.forEach(l => l?.stop());
  }, [playing]);

  if (!playing) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {[r1, r2, r3].map((anim, i) => {
        const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.2, 2.4] });
        const opacity = anim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.22, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: SW * 0.85,
              height: SW * 0.85,
              borderRadius: SW * 0.425,
              borderWidth: 1.5,
              borderColor: '#93c5fd',
              top: SH * 0.5 - SW * 0.425,
              left: SW * 0.075,
              transform: [{ scale }],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

// Floating particles while playing
function FloatingParticles({ playing }) {
  const anims = useRef(
    Array.from({ length: 8 }, () => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: (Math.random() - 0.5) * SW * 0.7,
    }))
  ).current;
  const loopsRef = useRef([]);

  useEffect(() => {
    loopsRef.current.forEach(l => l?.stop());
    loopsRef.current = [];
    anims.forEach(a => { a.y.setValue(0); a.opacity.setValue(0); });

    if (!playing) return;

    anims.forEach((a, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 400),
          Animated.parallel([
            Animated.timing(a.y, { toValue: -SH * 0.35, duration: 3500, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(a.opacity, { toValue: 0.55, duration: 800, useNativeDriver: true }),
              Animated.timing(a.opacity, { toValue: 0, duration: 2700, useNativeDriver: true }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(a.y, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(a.opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );
      loop.start();
      loopsRef.current.push(loop);
    });
    return () => loopsRef.current.forEach(l => l?.stop());
  }, [playing]);

  if (!playing) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: SH * 0.25 }]} pointerEvents="none">
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: i % 2 === 0 ? '#93c5fd' : '#e0e7ff',
            transform: [{ translateX: a.x }, { translateY: a.y }],
            opacity: a.opacity,
          }}
        />
      ))}
    </View>
  );
}

export default function PrayerWalkScreen({ prayers, onPrayForRequest, onClose }) {
  const unprayed = (prayers || []).filter(p => !p.user_has_prayed);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioStatus, setAudioStatus] = useState('idle'); // idle | loading | playing | paused | error
  const [isFinished, setIsFinished] = useState(false);
  const [prayedThisSession, setPrayedThisSession] = useState(0);
  const soundRef = useRef(null);
  const isActiveRef = useRef(true);
  const currentIndexRef = useRef(0);

  const total = unprayed.length;
  const current = unprayed[currentIndex];

  useEffect(() => {
    return () => {
      isActiveRef.current = false;
      soundRef.current?.unloadAsync();
    };
  }, []);

  // Auto-play whenever the current prayer changes
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    if (unprayed[currentIndex] && !isFinished) {
      playPrayer(unprayed[currentIndex]);
    }
  }, [currentIndex, isFinished]);

  const playPrayer = async (prayer) => {
    if (!prayer) return;
    if (!isActiveRef.current) return;

    setAudioStatus('loading');

    // Unload any previous sound
    try { await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;

    try {
      const localUri = `${FileSystem.cacheDirectory}prayerWalk_${prayer.id}.mp3`;
      const cached = await FileSystem.getInfoAsync(localUri);

      if (!cached.exists) {
        const spokenText = buildSpokenText(prayer);
        const res = await fetch(`${BASE_URL}/getPrayerAudio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': AUTH() },
          body: JSON.stringify({ requestId: prayer.id, text: spokenText }),
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

      if (!isActiveRef.current) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        (status) => {
          if (!isActiveRef.current) return;
          if (status.isLoaded && status.didJustFinish) {
            soundRef.current?.unloadAsync();
            soundRef.current = null;
            if (isActiveRef.current) {
              setAudioStatus('idle');
              handlePrayedAndAdvance(prayer.id);
            }
          }
          if (status.error) {
            if (isActiveRef.current) setAudioStatus('error');
          }
        }
      );

      if (!isActiveRef.current) { sound.unloadAsync(); return; }
      soundRef.current = sound;
      setAudioStatus('playing');
    } catch (e) {
      console.log('[PrayerWalk] audio error:', e.message);
      if (isActiveRef.current) setAudioStatus('error');
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

  const handlePrayedAndAdvance = useCallback((prayedId) => {
    if (prayedId) onPrayForRequest(prayedId);
    setPrayedThisSession(n => n + 1);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= unprayed.length) {
        setIsFinished(true);
        return prev;
      }
      return next;
    });
  }, [unprayed.length, onPrayForRequest]);

  const handleSkip = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    setAudioStatus('idle');
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= unprayed.length) { setIsFinished(true); return prev; }
      return next;
    });
  };

  const handleAmenManual = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    handlePrayedAndAdvance(current?.id);
  };

  const handleClose = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    onClose();
  };

  const isPlaying = audioStatus === 'playing';

  // ─── Empty state ───
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

  // ─── Finished state ───
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

  // ─── Main ───
  return (
    <LinearGradient colors={['#0a0f1e', '#0f2044', '#1a3a6b']} style={styles.container}>
      <StatusBar style="light" />

      {/* Full-screen ambient animation behind everything */}
      <Ripples playing={isPlaying} />
      <FloatingParticles playing={isPlaying} />

      {/* Soft glow behind prayer card when playing */}
      {isPlaying && (
        <View style={styles.glowOrb} pointerEvents="none" />
      )}

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

      <ScrollView
        style={styles.cardArea}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.prayerCard, isPlaying && styles.prayerCardActive]}>
          {current?.title ? (
            <Text style={styles.prayerTitleText}>{current.title}</Text>
          ) : null}
          <Text style={styles.prayerContentText}>{current?.content || ''}</Text>
          <Text style={styles.prayerAuthorText}>— {current?.author || 'Community Member'}</Text>
        </View>

        {/* Status label */}
        <View style={styles.statusRow}>
          {audioStatus === 'loading' && (
            <>
              <ActivityIndicator color="#93c5fd" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>Preparing prayer audio…</Text>
            </>
          )}
          {audioStatus === 'playing' && (
            <Text style={styles.statusTextPlaying}>🎙  Playing — pray along as you listen</Text>
          )}
          {audioStatus === 'paused' && (
            <Text style={styles.statusText}>⏸  Paused</Text>
          )}
          {audioStatus === 'error' && (
            <Text style={[styles.statusText, { color: '#fca5a5' }]}>Audio unavailable — tap Amen when ready</Text>
          )}
        </View>
      </ScrollView>

      <View style={styles.controls}>
        {/* Pause / Resume only — audio auto-starts */}
        {(audioStatus === 'playing' || audioStatus === 'paused') && (
          <TouchableOpacity style={styles.pauseBtn} onPress={handlePauseResume} activeOpacity={0.8}>
            <Text style={styles.pauseIcon}>{audioStatus === 'playing' ? '⏸' : '▶'}</Text>
            <Text style={styles.pauseLabel}>{audioStatus === 'playing' ? 'Pause' : 'Resume'}</Text>
          </TouchableOpacity>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>Skip ›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.amenBtn} onPress={handleAmenManual} activeOpacity={0.8}>
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
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 12, zIndex: 5,
  },
  headerLabel: { color: '#fff', fontSize: 17, fontWeight: '700' },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '500' },
  progressTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 24, borderRadius: 2, marginBottom: 28, zIndex: 5,
  },
  progressFill: { height: 3, backgroundColor: '#60a5fa', borderRadius: 2 },
  cardArea: { flex: 1, paddingHorizontal: 20, zIndex: 5 },
  cardContent: { paddingBottom: 16 },
  prayerCard: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 22,
    padding: 26, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 18,
  },
  prayerCardActive: {
    backgroundColor: 'rgba(96,165,250,0.1)',
    borderColor: 'rgba(96,165,250,0.3)',
  },
  prayerTitleText: {
    color: '#93c5fd', fontSize: 13, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 14,
  },
  prayerContentText: { color: '#f1f5f9', fontSize: 18, lineHeight: 30, fontStyle: 'italic' },
  prayerAuthorText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, marginTop: 20 },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 28, paddingHorizontal: 16,
  },
  statusText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center' },
  statusTextPlaying: { color: '#93c5fd', fontSize: 13, textAlign: 'center', fontWeight: '500' },
  glowOrb: {
    position: 'absolute',
    width: SW * 0.8,
    height: SW * 0.8,
    borderRadius: SW * 0.4,
    backgroundColor: '#1d4ed8',
    top: SH * 0.3,
    left: SW * 0.1,
    opacity: 0.12,
    zIndex: 0,
  },
  controls: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'android' ? 28 : 44,
    paddingTop: 8, gap: 12, zIndex: 5,
  },
  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(96,165,250,0.18)',
    borderRadius: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)',
  },
  pauseIcon: { fontSize: 20 },
  pauseLabel: { color: '#93c5fd', fontSize: 15, fontWeight: '600' },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: {
    flex: 1, paddingVertical: 15,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '600' },
  amenBtn: { flex: 2, paddingVertical: 15, backgroundColor: '#2563eb', borderRadius: 14, alignItems: 'center', elevation: 4 },
  amenText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  doneEmoji: { fontSize: 64, marginBottom: 20 },
  doneTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  doneSub: { color: 'rgba(255,255,255,0.55)', fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 36 },
  doneBtn: { backgroundColor: '#2563eb', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, elevation: 4 },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
