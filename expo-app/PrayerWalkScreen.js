import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Platform, Animated, ActivityIndicator, Dimensions,
  StatusBar as RNStatusBar, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useEffect, useState, useRef, useCallback } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useKeepAwake } from 'expo-keep-awake';

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

// Spoken text = "Prayer for Name." + the generated prayer + "Amen." at the end
const buildSpokenText = (prayer, prayerText) => {
  const intro = prayer?.author ? `Prayer for ${prayer.author}. ` : '';
  const body = prayerText.replace(/\.?\s*Amen\.?\s*$/i, '').trim();
  return `${intro}${body}. Amen.`;
};

// ─────────────────────────────────────────────────────────────────
// Blue celestial rings animation
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
        const opacity = anim.interpolate({ inputRange: [0, 0.25, 0.8, 1], outputRange: [0, 0.5, 0.12, 0] });
        return (
          <Animated.View
            key={i}
            style={{
              position: 'absolute',
              width: BASE_R * 2,
              height: BASE_R * 2,
              borderRadius: BASE_R,
              borderWidth: 1.2,
              borderColor: '#93c5fd',
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
// Floating blue light particles
// ─────────────────────────────────────────────────────────────────
function BlueSparks({ playing }) {
  const SPARK_COUNT = 14;
  const sparks = useRef(
    Array.from({ length: SPARK_COUNT }, (_, i) => ({
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      x: (Math.random() - 0.5) * SW * 0.75,
      size: 3 + Math.random() * 4,
      color: i % 3 === 0 ? '#dbeafe' : i % 3 === 1 ? '#93c5fd' : '#60a5fa',
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
// Pulsing central blue glow
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
        backgroundColor: '#1e3a8a',
        opacity: playing ? 0.22 : 0.08,
        top: CENTER_Y - SW * 0.475, left: SW * 0.025,
      }} />
      {/* Mid glow */}
      <View style={{
        position: 'absolute',
        width: SW * 0.55, height: SW * 0.55, borderRadius: SW * 0.275,
        backgroundColor: '#2563eb',
        opacity: playing ? 0.28 : 0.10,
        top: CENTER_Y - SW * 0.275, left: SW * 0.225,
      }} />
      {/* Inner bright glow */}
      <View style={{
        position: 'absolute',
        width: SW * 0.26, height: SW * 0.26, borderRadius: SW * 0.13,
        backgroundColor: '#60a5fa',
        opacity: playing ? 0.28 : 0.10,
        top: CENTER_Y - SW * 0.13, left: SW * 0.37,
      }} />
      {/* Core */}
      <View style={{
        position: 'absolute',
        width: SW * 0.10, height: SW * 0.10, borderRadius: SW * 0.05,
        backgroundColor: '#dbeafe',
        opacity: playing ? 0.40 : 0.12,
        top: CENTER_Y - SW * 0.05, left: SW * 0.45,
      }} />
    </Animated.View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main screen
// ─────────────────────────────────────────────────────────────────
const MUSIC_URI = 'https://shouldcallpaul.replit.app/audio/canon.mp3';
const MUSIC_VOLUME = 0.18;

export default function PrayerWalkScreen({ prayers, onPrayForRequest, onClose }) {
  // Keep the screen on for the whole Prayer Walk session
  useKeepAwake();

  // Snapshot the list ONCE at mount — never re-filter mid-walk so indices never shift
  const [prayerList] = useState(() => (prayers || []).filter(p => !p.user_has_prayed));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioStatus, setAudioStatus] = useState('idle');
  const [isFinished, setIsFinished] = useState(false);
  const [prayedThisSession, setPrayedThisSession] = useState(0);
  const [musicMuted, setMusicMuted] = useState(false);
  const soundRef = useRef(null);
  const musicSoundRef = useRef(null);
  const isActiveRef = useRef(true);
  // Track which prayer is currently playing — prevents stale didJustFinish from advancing
  const activePrayerIdRef = useRef(null);

  const total = prayerList.length;
  const current = prayerList[currentIndex];

  // Start ambient background music on mount, stop on unmount
  useEffect(() => {
    let mounted = true;
    const startMusic = async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: MUSIC_URI },
          { shouldPlay: true, isLooping: true, volume: MUSIC_VOLUME }
        );
        if (!mounted) { sound.unloadAsync(); return; }
        musicSoundRef.current = sound;
      } catch (e) {
        console.log('[PrayerWalk] music error:', e?.message);
      }
    };
    startMusic();
    return () => {
      mounted = false;
      musicSoundRef.current?.stopAsync().catch(() => {});
      musicSoundRef.current?.unloadAsync().catch(() => {});
      musicSoundRef.current = null;
    };
  }, []);

  // Toggle music mute/unmute
  const toggleMusic = async () => {
    try {
      if (!musicSoundRef.current) return;
      const next = !musicMuted;
      await musicSoundRef.current.setVolumeAsync(next ? 0 : MUSIC_VOLUME);
      setMusicMuted(next);
    } catch (_) {}
  };

  useEffect(() => () => {
    isActiveRef.current = false;
    soundRef.current?.unloadAsync();
  }, []);

  const stopAndUnload = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
  };

  const advance = useCallback((prayedId) => {
    if (prayedId && onPrayForRequest) onPrayForRequest(prayedId);
    setPrayedThisSession(n => n + 1);
    setCurrentIndex(prev => {
      const next = prev + 1;
      if (next >= prayerList.length) { setIsFinished(true); return prev; }
      return next;
    });
  }, [prayerList.length, onPrayForRequest]);

  const playPrayer = useCallback(async (prayer) => {
    if (!prayer || !isActiveRef.current) return;
    activePrayerIdRef.current = prayer.id;
    setAudioStatus('loading');
    try { await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;

    try {
      const localUri = `${FileSystem.cacheDirectory}prayerWalkGen3_${prayer.id}.mp3`;
      const cached = await FileSystem.getInfoAsync(localUri);

      if (!cached.exists) {
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

      if (!isActiveRef.current || activePrayerIdRef.current !== prayer.id) return;

      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: localUri },
        { shouldPlay: true },
        (status) => {
          if (!isActiveRef.current) return;
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
      console.log('[PrayerWalk] error:', e?.message);
      if (isActiveRef.current && activePrayerIdRef.current === prayer.id) setAudioStatus('error');
    }
  }, [advance]);

  // Auto-play current prayer on mount and index change
  useEffect(() => {
    if (prayerList[currentIndex] && !isFinished) playPrayer(prayerList[currentIndex]);
  }, [currentIndex, isFinished]);

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

  const handlePauseResume = async () => {
    if (audioStatus === 'playing') {
      await soundRef.current?.pauseAsync();
      setAudioStatus('paused');
    } else if (audioStatus === 'paused') {
      await soundRef.current?.playAsync();
      setAudioStatus('playing');
    }
  };

  const handleClose = async () => {
    try { await soundRef.current?.stopAsync(); await soundRef.current?.unloadAsync(); } catch (_) {}
    soundRef.current = null;
    onClose();
  };

  const isPlaying = audioStatus === 'playing';

  // ── Empty ──
  if (total === 0) return (
    <LinearGradient colors={['#071428', '#0d2151', '#1a3a8f']} style={styles.container}>
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
    <LinearGradient colors={['#071428', '#0d2151', '#1a3a8f']} style={styles.container}>
      <StatusBar style="light" />
      <CentralGlow playing />
      <BlueSparks playing />
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
    <LinearGradient colors={['#071428', '#0d2151', '#1a3a8f']} style={styles.container}>
      <StatusBar style="light" />

      {/* Blue celestial background animations */}
      <CentralGlow playing={isPlaying} />
      <CelestialRings playing={isPlaying} />
      <BlueSparks playing={isPlaying} />

      {/* Prayer picture — translucent so the animations show through */}
      {current?.picture ? (
        <Image
          source={{ uri: current.picture.startsWith('http') ? current.picture : `${BASE_URL}${current.picture}` }}
          style={styles.prayerBgImage}
          resizeMode="cover"
          blurRadius={2}
        />
      ) : null}

      {/* Header — well clear of the status bar */}
      <View style={[styles.header, { paddingTop: SAFE_TOP }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>🕊  Prayer Walk</Text>
          <Text style={styles.progressLabel}>{currentIndex + 1} of {total}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleMusic} style={[styles.musicBtn, musicMuted && styles.musicBtnMuted]} activeOpacity={0.7}>
            <Text style={styles.musicBtnText}>{musicMuted ? '🔇' : '🎵'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>
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
            <><ActivityIndicator color="#93c5fd" size="small" style={{ marginRight: 8 }} />
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

  // Translucent prayer picture shown as background — animations layer on top
  prayerBgImage: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.18,
    zIndex: 1,
  },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 22, paddingBottom: 14, zIndex: 10,
  },
  headerLeft: { gap: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLabel: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: '500' },

  musicBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.35)',
  },
  musicBtnMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
  },
  musicBtnText: { fontSize: 16 },

  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 18,
    width: 36, height: 36, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  progressTrack: {
    height: 3, backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 22, borderRadius: 2, marginBottom: 24, zIndex: 10,
  },
  progressFill: { height: 3, backgroundColor: '#60a5fa', borderRadius: 2 },

  cardArea: { flex: 1, paddingHorizontal: 18, zIndex: 10 },
  cardContent: { paddingBottom: 12 },

  prayerCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 24, padding: 26,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    marginBottom: 16,
  },
  prayerCardActive: {
    backgroundColor: 'rgba(96,165,250,0.10)',
    borderColor: 'rgba(96,165,250,0.30)',
  },
  prayerTitle: {
    color: '#93c5fd', fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 1.3, marginBottom: 14,
  },
  prayerContent: {
    color: '#f1f5f9', fontSize: 18, lineHeight: 30, fontStyle: 'italic',
  },
  prayerAuthor: {
    color: 'rgba(255,255,255,0.38)', fontSize: 13, marginTop: 20,
  },

  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 28, paddingHorizontal: 16,
  },
  statusText: { color: 'rgba(255,255,255,0.45)', fontSize: 13, textAlign: 'center' },
  statusPlaying: {
    color: '#93c5fd', fontSize: 13, textAlign: 'center', fontWeight: '500',
  },

  controls: { paddingHorizontal: 18, paddingTop: 8, gap: 12, zIndex: 10 },

  pauseBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: 'rgba(96,165,250,0.14)',
    borderRadius: 16, paddingVertical: 12,
    borderWidth: 1, borderColor: 'rgba(96,165,250,0.35)',
  },
  pauseIcon: { fontSize: 18 },
  pauseLabel: { color: '#93c5fd', fontSize: 15, fontWeight: '600' },

  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  skipBtn: {
    flex: 1, paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  skipText: { color: 'rgba(255,255,255,0.55)', fontSize: 15, fontWeight: '600' },
  amenBtn: {
    flex: 2, paddingVertical: 16,
    backgroundColor: '#2563eb', borderRadius: 16,
    alignItems: 'center', elevation: 6,
    shadowColor: '#3b82f6', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 4 },
  },
  amenText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  doneEmoji: { fontSize: 64, marginBottom: 20 },
  doneTitle: { color: '#fff', fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  doneSub: {
    color: 'rgba(255,255,255,0.55)', fontSize: 16,
    textAlign: 'center', lineHeight: 26, marginBottom: 36,
  },
  doneBtn: {
    backgroundColor: '#2563eb', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 40, elevation: 4,
    shadowColor: '#3b82f6', shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
  },
  doneBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
