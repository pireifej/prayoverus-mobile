import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Animated, ActivityIndicator, Dimensions,
  StatusBar as RNStatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';

const { width: SW, height: SH } = Dimensions.get('window');

// Accurate safe areas — no useSafeAreaInsets (causes white screen)
const STATUS_H = Platform.OS === 'android' ? (RNStatusBar.currentHeight || 24) : 0;
const SAFE_TOP = Platform.OS === 'android' ? STATUS_H + 28 : 64;
const SAFE_BOTTOM = Platform.OS === 'android' ? 64 : 48;

const BASE_URL = 'https://shouldcallpaul.replit.app';

const base64Encode = (str) => {
  if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(str)));
  const { Buffer } = require('buffer');
  return Buffer.from(str, 'utf-8').toString('base64');
};
const AUTH = () => 'Basic ' + base64Encode('shouldcallpaul_admin:rA$b2p&!x9P#sYc');

const stripHtml = (html) => (html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

// Only the generated prayer — never the raw request text
const fallbackPrayer = (prayer) =>
  `Heavenly Father, we lift up ${prayer.author || 'this person'} to Your loving care and ask for Your blessing upon their prayer request. ` +
  `Grant ${prayer.author || 'them'} Your peace, guidance, and strength in this situation. ` +
  `May Your will be accomplished in their life according to Your perfect plan. ` +
  `Through Christ our Lord. Amen.`;

const fetchPrayerText = async (prayer) => {
  try {
    const res = await fetch(`${BASE_URL}/getPrayerByRequestId`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': AUTH() },
      body: JSON.stringify({ requestId: prayer.id }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.error === 0 && data.prayerText) return stripHtml(data.prayerText);
    }
  } catch (_) {}
  return fallbackPrayer(prayer);
};

// Spoken text = "Prayer for Name." + the generated prayer ONLY — no request content ever
const buildSpokenText = (prayer, prayerText) => {
  const intro = prayer?.author ? `Prayer for ${prayer.author}. ` : '';
  return intro + prayerText;
};

// ─────────────────────────────────────────────────────────────────
// Golden celestial rings animation
// ─────────────────────────────────────────────────────────────────
function CelestialRings({ playing }) {
  const rings = useRef([0, 1, 2, 3].map(() => new Animated.Value(0))).current;
  const loopsRef = useRef([]);

  useEffect(() => {
    loopsRef.current.forEach(l => l?.stop());
    loopsRef.current = [];
    rings.forEach(r => r.setValue(0));
    if (!playing) return;

    rings.forEach((anim, i) => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 900),
          Animated.timing(anim, { toValue: 1, duration: 3600, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loop.start();
      loopsRef.current.push(loop);
    });
    return () => loopsRef.current.forEach(l => l?.stop());
  }, [playing]);

  const CENTER_Y = SH * 0.42;
  const BASE_R = SW * 0.18;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {rings.map((anim, i) => {
        const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 2.8] });
        const opacity = anim.interpolate({ inputRange: [0, 0.25, 0.8, 1], outputRange: [0, 0.45, 0.12, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: BASE_R * 2,
              height: BASE_R * 2,
              borderRadius: BASE_R,
              borderWidth: 1.2,
              borderColor: '#f59e0b',
              top: CENTER_Y - BASE_R,
              left: SW / 2 - BASE_R,
              transform: [{ scale }],
              opacity,
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Floating golden sparks
// ─────────────────────────────────────────────────────────────────
function GoldenSparks({ playing }) {
  const SPARK_COUNT = 14;
  const sparks = useRef(
    Array.from({ length: SPARK_COUNT }, (_, i) => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: (Math.random() - 0.5) * SW * 0.75,
      size: 3 + Math.random() * 4,
      color: i % 3 === 0 ? '#fef3c7' : i % 3 === 1 ? '#fbbf24' : '#f59e0b',
    }))
  ).current;
  const loopsRef = useRef([]);

  useEffect(() => {
    loopsRef.current.forEach(l => l?.stop());
    loopsRef.current = [];
    sparks.forEach(s => { s.y.setValue(0); s.opacity.setValue(0); });
    if (!playing) return;

    sparks.forEach((s, i) => {
      const duration = 2800 + Math.random() * 2000;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.delay(i * 320),
          Animated.parallel([
            Animated.timing(s.y, { toValue: -(SH * 0.45), duration, useNativeDriver: true }),
            Animated.sequence([
              Animated.timing(s.opacity, { toValue: 0.85, duration: 600, useNativeDriver: true }),
              Animated.timing(s.opacity, { toValue: 0, duration: duration - 600, useNativeDriver: true }),
            ]),
          ]),
          Animated.parallel([
            Animated.timing(s.y, { toValue: 0, duration: 0, useNativeDriver: true }),
            Animated.timing(s.opacity, { toValue: 0, duration: 0, useNativeDriver: true }),
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
    <View
      style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'flex-end', paddingBottom: SH * 0.22 }]}
      pointerEvents="none"
    >
      {sparks.map((s, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            width: s.size,
            height: s.size,
            borderRadius: s.size / 2,
            backgroundColor: s.color,
            transform: [{ translateX: s.x }, { translateY: s.y }],
            opacity: s.opacity,
          }}
        />
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pulsing central glow (stacked circles)
// ─────────────────────────────────────────────────────────────────
function CentralGlow({ playing }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const loopRef = useRef(null);

  useEffect(() => {
    loopRef.current?.stop();
    if (!playing) {
      Animated.spring(pulse, { toValue: 1, useNativeDriver: true }).start();
      return;
    }
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.12, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.94, duration: 1800, useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [playing]);

  const CENTER_Y = SH * 0.42;

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { transform: [{ scale: pulse }] }]}
      pointerEvents="none"
    >
      {/* Outermost soft glow */}
      <View style={{
        position: 'absolute',
        width: SW * 0.95, height: SW * 0.95, borderRadius: SW * 0.475,
        backgroundColor: '#78350f',
        opacity: playing ? 0.18 : 0.07,
        top: CENTER_Y - SW * 0.475, left: SW * 0.025,
      }} />
      {/* Mid glow */}
      <View style={{
        position: 'absolute',
        width: SW * 0.55, height: SW * 0.55, borderRadius: SW * 0.275,
        backgroundColor: '#b45309',
        opacity: playing ? 0.22 : 0.08,
        top: CENTER_Y - SW * 0.275, left: SW * 0.225,
      }} />
      {/* Inner bright glow */}
      <View style={{
        position: 'absolute',
        width: SW * 0.26, height: SW * 0.26, borderRadius: SW * 0.13,
        backgroundColor: '#f59e0b',
        opacity: playing ? 0.22 : 0.08,
        top: CENTER_Y - SW * 0.13, left: SW * 0.37,
      }} />
      {/* Core */}
      <View style={{
        position: 'absolute',
        width: SW * 0.10, height: SW * 0.10, borderRadius: SW * 0.05,
        backgroundColor: '#fef3c7',
        opacity: playing ? 0.35 : 0.1,
        top: CENTER_Y - SW * 0.05, left: SW * 0.45,
      }} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────
export default function PrayerWalkScreen({ prayers, onPrayForRequest, onClose }) {
  // Snapshot the list ONCE at mount — never re-filter mid-walk so indices never shift
  const [prayerList] = useState(() => (prayers || []).filter(p => !p.user_has_prayed));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioStatus, setAudioStatus] = useState('idle');
  const [isFinished, setIsFinished] = useState(false);
  const [prayedThisSession, setPrayedThisSession] = useState(0);
  const soundRef = useRef(null);
  const isActiveRef = useRef(true);
  // Track which prayer is currently playing — prevents stale didJustFinish from advancing
  const activePrayerIdRef = useRef(null);

  const total = prayerList.length;
  const current = prayerList[currentIndex];

  useEffect(() => () => {
    isActiveRef.current = false;
    soundRef.current?.unloadAsync();
  }, []);

  useEffect(() => {
    if (prayerList[currentIndex] && !isFinished) {
      playPrayer(prayerList[currentIndex]);
    }
  }, [currentIndex, isFinished]);

  const playPrayer = async (prayer) => {
    if (!prayer || !isActiveRef.current) return;

    // Mark this prayer as the active one — stale callbacks from previous sounds will bail out
    activePrayerIdRef.current = prayer.id;

    setAudioStatus('loading');
    try { await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;

    try {
      const localUri = `${FileSystem.cacheDirectory}prayerWalkGen3_${prayer.id}.mp3`;
      const cached = await FileSystem.getInfoAsync(localUri);

      if (!cached.exists) {
        // Get the generated prayer from the DB — never the raw request text
        const prayerText = await fetchPrayerText(prayer);
        const spokenText = buildSpokenText(prayer, prayerText);

        const res = await fetch(`${BASE_URL}/getPrayerAudio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': AUTH() },
          body: JSON.stringify({ requestId: prayer.id, text: spokenText }),
        });
        if (!res.ok) throw new Error(`getPrayerAudio ${res.status}`);

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

      // Bail if a newer prayer has taken over since the async work started
      if (!isActiveRef.current || activePrayerIdRef.current !== prayer.id) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        (status) => {
          if (!isActiveRef.current) return;
          // Only advance if THIS prayer is still the active one
          if (status.isLoaded && status.didJustFinish && activePrayerIdRef.current === prayer.id) {
            soundRef.current?.unloadAsync();
            soundRef.current = null;
            setAudioStatus('idle');
            advance(prayer.id);
          }
          if (status.error && isActiveRef.current && activePrayerIdRef.current === prayer.id) {
            setAudioStatus('error');
          }
        }
      );

      if (!isActiveRef.current || activePrayerIdRef.current !== prayer.id) {
        sound.unloadAsync();
        return;
      }
      soundRef.current = sound;
      setAudioStatus('playing');
    } catch (e) {
      console.log('[PrayerWalk] error:', e.message);
      if (isActiveRef.current && activePrayerIdRef.current === prayer.id) setAudioStatus('error');
    }
  };

  const advance = useCallback((prayedId) => {
    if (prayedId) onPrayForRequest(prayedId);
    setPrayedThisSession(n => n + 1);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= prayerList.length) { setIsFinished(true); return prev; }
      return next;
    });
  }, [prayerList.length, onPrayForRequest]);

  const handlePauseResume = async () => {
    if (audioStatus === 'playing') {
      await soundRef.current?.pauseAsync();
      setAudioStatus('paused');
    } else if (audioStatus === 'paused') {
      await soundRef.current?.playAsync();
      setAudioStatus('playing');
    }
  };

  const handleAmen = async () => {
    activePrayerIdRef.current = null;
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    advance(current?.id);
  };

  const handleSkip = async () => {
    activePrayerIdRef.current = null;
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    setAudioStatus('idle');
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= prayerList.length) { setIsFinished(true); return prev; }
      return next;
    });
  };

  const handleClose = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    onClose();
  };

  const isPlaying = audioStatus === 'playing';

  // ── Empty ──
  if (total === 0) return (
    <LinearGradient colors={['#030810', '#060f22']} style={styles.container}>
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

  // ── Finished ──
  if (isFinished) return (
    <LinearGradient colors={['#030810', '#060f22', '#0a1a0a']} style={styles.container}>
      <StatusBar style="light" />
      <CentralGlow playing />
      <GoldenSparks playing />
      <View style={styles.center}>
        <Text style={styles.doneEmoji}>✨</Text>
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

  // ── Main ──
  return (
    <LinearGradient colors={['#030810', '#06111f', '#081628']} style={styles.container}>
      <StatusBar style="light" />

      {/* Celestial background animations */}
      <CentralGlow playing={isPlaying} />
      <CelestialRings playing={isPlaying} />
      <GoldenSparks playing={isPlaying} />

      {/* Header — well clear of the status bar */}
      <View style={[styles.header, { paddingTop: SAFE_TOP }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>🕊  Prayer Walk</Text>
          <Text style={styles.progressLabel}>{currentIndex + 1} of {total}</Text>
        </View>
        <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: `${((currentIndex + 1) / total) * 100}%` }]} />
      </View>

      {/* Prayer card */}
      <ScrollView
        style={styles.cardArea}
        contentContainerStyle={styles.cardContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.prayerCard, isPlaying && styles.prayerCardActive]}>
          {current?.title ? (
            <Text style={styles.prayerTitle}>{current.title}</Text>
          ) : null}
          <Text style={styles.prayerContent}>{current?.content || ''}</Text>
          <Text style={styles.prayerAuthor}>— {current?.author || 'Community Member'}</Text>
        </View>

        {/* Status line */}
        <View style={styles.statusRow}>
          {audioStatus === 'loading' && (
            <><ActivityIndicator color="#f59e0b" size="small" style={{ marginRight: 8 }} />
              <Text style={styles.statusText}>Preparing your prayer…</Text></>
          )}
          {audioStatus === 'playing' && (
            <Text style={styles.statusPlaying}>🕊  Playing — pray along as you listen</Text>
          )}
          {audioStatus === 'paused' && (
            <Text style={styles.statusText}>⏸  Paused</Text>
          )}
          {audioStatus === 'error' && (
            <Text style={[styles.statusText, { color: '#fca5a5' }]}>
              Audio unavailable — tap Amen when ready
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Controls — padded above Android nav bar */}
      <View style={[styles.controls, { paddingBottom: SAFE_BOTTOM }]}>
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
          <TouchableOpacity style={styles.amenBtn} onPress={handleAmen} activeOpacity={0.8}>
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

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 22, paddingBottom: 14, zIndex: 10,
  },
  headerLeft: { gap: 2 },
  headerLabel: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  progressLabel: { color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: '500' },

  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  progressTrack: {
    height: 2, backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 22, borderRadius: 1, marginBottom: 24, zIndex: 10,
  },
  progressFill: { height: 2, backgroundColor: '#f59e0b', borderRadius: 1 },

  cardArea: { flex: 1, paddingHorizontal: 18, zIndex: 10 },
  cardContent: { paddingBottom: 12 },

  prayerCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 24, padding: 26,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  prayerCardActive: {
    backgroundColor: 'rgba(245,158,11,0.07)',
    borderColor: 'rgba(245,158,11,0.25)',
  },
  prayerTitle: {
    color: '#f59e0b', fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 14,
  },
  prayerContent: {
    color: '#f1f5f9', fontSize: 18, lineHeight: 30, fontStyle: 'italic',
  },
  prayerAuthor: {
    color: 'rgba(255,255,255,0.35)', fontSize: 13, marginTop: 20,
  },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 28, paddingHorizontal: 16,
  },
  statusText: { color: 'rgba(255,255,255,0.4)', fontSize: 13, textAlign: 'center' },
  statusPlaying: {
    color: '#f59e0b', fontSize: 13, textAlign: 'center', fontWeight: '500',
  },

  controls: { paddingHorizontal: 18, paddingTop: 8, gap: 12, zIndex: 10 },

  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
  },
  pauseIcon: { fontSize: 18 },
  pauseLabel: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: {
    flex: 1, paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: { color: 'rgba(255,255,255,0.5)', fontSize: 15, fontWeight: '600' },
  amenBtn: {
    flex: 2, paddingVertical: 16,
    backgroundColor: '#b45309', borderRadius: 16,
    alignItems: 'center', elevation: 6,
    shadowColor: '#f59e0b', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
  },
  amenText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  doneEmoji: { fontSize: 64, marginBottom: 20 },
  doneTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  doneSub: {
    color: 'rgba(255,255,255,0.5)', fontSize: 16,
    textAlign: 'center', lineHeight: 26, marginBottom: 36,
  },
  doneBtn: {
    backgroundColor: '#b45309', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 40, elevation: 4,
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
