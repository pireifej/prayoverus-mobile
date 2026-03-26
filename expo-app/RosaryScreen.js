import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar,
  StyleSheet, Animated, Alert, Platform, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FONT_SIZES   = [15, 18, 21, 25, 30];
const LINE_HEIGHTS = [23, 27, 34, 40, 48];
const FONT_LABELS  = ['ᴬ', 'A', 'A', 'A', 'A'];
const FONT_WEIGHTS = ['400', '400', '400', '600', '700'];

// ─── AdMob (same conditional-import pattern as App.js) ────────────────────────
let BannerAd, BannerAdSize, TestIds;
let isAdMobAvailable = false;
let ROSARY_BANNER_ID = null;
try {
  const adMobModule = require('react-native-google-mobile-ads');
  BannerAd     = adMobModule.BannerAd;
  BannerAdSize = adMobModule.BannerAdSize;
  TestIds      = adMobModule.TestIds;
  isAdMobAvailable = true;
  ROSARY_BANNER_ID = __DEV__
    ? TestIds.BANNER
    : (Platform.OS === 'ios'
        ? 'ca-app-pub-9861737616974560/9395514909'
        : 'ca-app-pub-9861737616974560/9395514909');
} catch (_) {}

// ─── Music Options (hosted on backend — public domain recordings) ─────────────
const AUDIO_BASE = 'https://shouldcallpaul.replit.app/audio/';
const MUSIC_OPTIONS = [
  { key: 'off',     label: 'Off',          emoji: '🔇', uri: null },
  { key: 'canon',   label: 'Canon in D',   emoji: '📿', uri: AUDIO_BASE + 'canon.mp3' },
  { key: 'jesu',    label: 'Jesu, Joy',    emoji: '✝️', uri: AUDIO_BASE + 'jesu.mp3' },
  { key: 'vivaldi', label: 'Vivaldi',      emoji: '🌸', uri: AUDIO_BASE + 'vivaldi.mp3' },
];

// ─── Mystery Data ────────────────────────────────────────────────────────────
const MYSTERY_TYPES = {
  joyful: {
    key: 'joyful', name: 'Joyful Mysteries', emoji: '✨', days: [1, 6], dayNames: 'Monday & Saturday',
    mysteries: [
      { name: 'The Annunciation', meditation: 'The Angel Gabriel announces to Mary that she will be the Mother of God. Mary says yes to God\'s plan with perfect trust and humility.' },
      { name: 'The Visitation', meditation: 'Mary visits her cousin Elizabeth, who is carrying John the Baptist. Elizabeth is filled with the Holy Spirit and proclaims Mary blessed among women.' },
      { name: 'The Nativity', meditation: 'Jesus is born in a humble stable in Bethlehem. The angels sing Glory to God and shepherds come to adore the newborn King.' },
      { name: 'The Presentation', meditation: 'Mary and Joseph present the infant Jesus in the Temple. Simeon recognizes him as the light of the world and the salvation of all nations.' },
      { name: 'The Finding in the Temple', meditation: 'After three days of searching, Mary and Joseph find the young Jesus in the Temple, sitting among the teachers and asking them questions.' },
    ],
  },
  sorrowful: {
    key: 'sorrowful', name: 'Sorrowful Mysteries', emoji: '✝️', days: [2, 5], dayNames: 'Tuesday & Friday',
    mysteries: [
      { name: 'The Agony in the Garden', meditation: 'Jesus kneels in the Garden of Gethsemane, sweating blood as he accepts the Father\'s will. He says: "Not my will, but yours be done."' },
      { name: 'The Scourging at the Pillar', meditation: 'Jesus is bound to a pillar and scourged mercilessly by Roman soldiers. He endures this great suffering out of love for each of us.' },
      { name: 'The Crowning with Thorns', meditation: 'The soldiers mock Jesus as King by pressing a crown of thorns onto his head. He accepts this humiliation with patience and love.' },
      { name: 'The Carrying of the Cross', meditation: 'Jesus carries his heavy cross through the streets of Jerusalem toward Calvary, falling three times along the way.' },
      { name: 'The Crucifixion', meditation: 'Jesus is nailed to the cross and dies after three hours. His last words offer forgiveness to those who crucified him.' },
    ],
  },
  glorious: {
    key: 'glorious', name: 'Glorious Mysteries', emoji: '👑', days: [0, 3], dayNames: 'Sunday & Wednesday',
    mysteries: [
      { name: 'The Resurrection', meditation: 'On the third day, Jesus rises from the dead in a glorified body. He appears first to Mary Magdalene, then to the apostles.' },
      { name: 'The Ascension', meditation: 'Forty days after Easter, Jesus ascends to the right hand of the Father, promising to send the Holy Spirit to his disciples.' },
      { name: 'The Descent of the Holy Spirit', meditation: 'On Pentecost Sunday, the Holy Spirit descends on Mary and the apostles as tongues of fire. The Church is born.' },
      { name: 'The Assumption of Mary', meditation: 'At the end of her earthly life, Mary is assumed body and soul into heavenly glory — a sign of what awaits all believers.' },
      { name: 'The Coronation of Mary', meditation: 'Mary is crowned Queen of Heaven and Earth, interceding for all who call upon her as Mother of the Church.' },
    ],
  },
  luminous: {
    key: 'luminous', name: 'Luminous Mysteries', emoji: '💡', days: [4], dayNames: 'Thursday',
    mysteries: [
      { name: 'The Baptism of Jesus', meditation: 'Jesus is baptized by John in the Jordan River. The heavens open and the Father declares: "This is my beloved Son, with whom I am well pleased."' },
      { name: 'The Wedding at Cana', meditation: 'At Mary\'s intercession, Jesus turns water into wine at a wedding feast, revealing his glory for the first time.' },
      { name: 'The Proclamation of the Kingdom', meditation: 'Jesus proclaims the Kingdom of God, calls all people to repentance, and forgives those who believe in him.' },
      { name: 'The Transfiguration', meditation: 'On Mount Tabor, Jesus is transfigured in dazzling light before Peter, James, and John, revealing his divine glory.' },
      { name: 'The Institution of the Eucharist', meditation: 'At the Last Supper, Jesus gives his disciples his Body and Blood in bread and wine, instituting the greatest sacrament.' },
    ],
  },
};

const PRAYERS = {
  signOfCross:   { title: 'Sign of the Cross',  text: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.' },
  apostlesCreed: { title: "Apostles' Creed",     text: "I believe in God, the Father Almighty, Creator of Heaven and earth; and in Jesus Christ, His only Son, Our Lord, Who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; the third day He arose again from the dead; He ascended into Heaven, sitteth at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body and life everlasting. Amen." },
  ourFather:     { title: 'Our Father',          text: "Our Father, Who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen." },
  hailMary:      { title: 'Hail Mary',           text: "Hail Mary, full of grace. The Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen." },
  gloryBe:       { title: 'Glory Be',            text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen." },
  fatimaPrayer:  { title: 'Fatima Prayer',       text: "O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to heaven, especially those who are most in need of Thy mercy. Amen." },
  hailHolyQueen: { title: 'Hail, Holy Queen',    text: "Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us; and after this, our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary! Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen." },
  finalPrayer:   { title: 'Closing Prayer',      text: "O God, whose only-begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that while meditating upon these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ Our Lord. Amen." },
};

// ─── Step Generator ──────────────────────────────────────────────────────────
const generateSteps = (mysteryTypeKey) => {
  const mt = MYSTERY_TYPES[mysteryTypeKey];
  const steps = [];
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];

  steps.push({ id: 'open-soc',   ...PRAYERS.signOfCross,   section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-creed', ...PRAYERS.apostlesCreed, section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-of',    ...PRAYERS.ourFather,     section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-hm1',   ...PRAYERS.hailMary, title: 'Hail Mary — for Faith',   section: 'Opening Prayers', decade: 0, hmIndex: 1 });
  steps.push({ id: 'open-hm2',   ...PRAYERS.hailMary, title: 'Hail Mary — for Hope',    section: 'Opening Prayers', decade: 0, hmIndex: 2 });
  steps.push({ id: 'open-hm3',   ...PRAYERS.hailMary, title: 'Hail Mary — for Charity', section: 'Opening Prayers', decade: 0, hmIndex: 3 });
  steps.push({ id: 'open-gb',    ...PRAYERS.gloryBe,       section: 'Opening Prayers', decade: 0 });

  for (let d = 0; d < 5; d++) {
    const mystery = mt.mysteries[d];
    const dec = d + 1;
    const shortMysteryType = mt.name.replace(' Mysteries', '');
    steps.push({ id: `d${dec}-announce`, title: `${ordinals[d]} ${shortMysteryType} Mystery`, text: mystery.name + '\n\n' + mystery.meditation, section: `Decade ${dec} of 5`, decade: dec, isAnnouncement: true, mysteryName: mystery.name });
    steps.push({ id: `d${dec}-of`, ...PRAYERS.ourFather, section: `Decade ${dec} of 5`, decade: dec });
    for (let hm = 1; hm <= 10; hm++) {
      steps.push({ id: `d${dec}-hm${hm}`, ...PRAYERS.hailMary, title: `Hail Mary ${hm} of 10`, section: `Decade ${dec} of 5`, decade: dec, hmIndex: hm });
    }
    steps.push({ id: `d${dec}-gb`,     ...PRAYERS.gloryBe,     section: `Decade ${dec} of 5`, decade: dec });
    steps.push({ id: `d${dec}-fatima`, ...PRAYERS.fatimaPrayer, section: `Decade ${dec} of 5`, decade: dec });
  }

  steps.push({ id: 'close-hhq', ...PRAYERS.hailHolyQueen, section: 'Closing Prayers', decade: 6 });
  steps.push({ id: 'close-fp',  ...PRAYERS.finalPrayer,   section: 'Closing Prayers', decade: 6 });
  steps.push({ id: 'close-soc', ...PRAYERS.signOfCross,   section: 'Closing Prayers', decade: 6 });

  return steps;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getTodaysMystery = () => {
  const day = new Date().getDay();
  if (day === 1 || day === 6) return 'joyful';
  if (day === 2 || day === 5) return 'sorrowful';
  if (day === 0 || day === 3) return 'glorious';
  return 'luminous';
};

const AUTO_SPEEDS = {
  slow:   { label: 'Slow',   seconds: 20, desc: '20 sec / prayer' },
  medium: { label: 'Medium', seconds: 12, desc: '12 sec / prayer' },
  fast:   { label: 'Fast',   seconds: 7,  desc: '7 sec / prayer'  },
};

// ─── Component ───────────────────────────────────────────────────────────────
const BACKEND_URL = 'https://shouldcallpaul.replit.app';

export default function RosaryScreen({ onExit, onComplete, currentUser }) {
  const [screen, setScreen]         = useState('setup');
  const [mysteryType, setMysteryType] = useState(getTodaysMystery());
  const [playMode, setPlayMode]     = useState('manual');
  const [autoSpeed, setAutoSpeed]   = useState('medium');
  const [musicChoice, setMusicChoice] = useState('off');
  const [isMuted, setIsMuted]       = useState(false);
  const [steps, setSteps]           = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused]     = useState(false);
  const [startTime, setStartTime]   = useState(null);
  const [fontSizeIdx, setFontSizeIdx] = useState(2);

  const progressAnim    = useRef(new Animated.Value(0)).current;
  const nudgeAnim       = useRef(new Animated.Value(0)).current;
  const hasNudged       = useRef(false);
  const progressAnimRef = useRef(null);
  const autoTimerRef    = useRef(null);
  const soundRef        = useRef(null);

  // Keep refs to advance/goBack so PanResponder can call the latest version
  const advanceRef = useRef(null);
  const goBackRef  = useRef(null);

  useEffect(() => { setSteps(generateSteps(mysteryType)); }, [mysteryType]);

  // ── Load saved font size ──────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.getItem('@rosary_font_size').then(v => {
      if (v !== null) setFontSizeIdx(parseInt(v));
    }).catch(() => {});
  }, []);

  const changeFontSize = (idx) => {
    setFontSizeIdx(idx);
    AsyncStorage.setItem('@rosary_font_size', String(idx)).catch(() => {});
  };

  // ── Nudge animation: play once when praying screen first opens ────────────
  useEffect(() => {
    if (screen !== 'praying' || hasNudged.current) return;
    hasNudged.current = true;
    setTimeout(() => {
      Animated.sequence([
        Animated.timing(nudgeAnim, { toValue: -28, duration: 220, useNativeDriver: true }),
        Animated.spring(nudgeAnim,  { toValue: 0,   useNativeDriver: true, tension: 120, friction: 7 }),
        Animated.delay(250),
        Animated.timing(nudgeAnim, { toValue: 28,  duration: 220, useNativeDriver: true }),
        Animated.spring(nudgeAnim,  { toValue: 0,   useNativeDriver: true, tension: 120, friction: 7 }),
      ]).start();
    }, 600);
  }, [screen]);

  // ── Music: load / unload when screen or music choice changes ──────────────
  useEffect(() => {
    if (screen !== 'praying' || musicChoice === 'off') {
      unloadMusic();
      return;
    }
    loadMusic();
    return () => {};
  }, [screen, musicChoice]);

  // ── Music: respond to mute toggle without reloading ───────────────────────
  useEffect(() => {
    if (!soundRef.current) return;
    soundRef.current.setVolumeAsync(isMuted ? 0 : 0.35).catch(() => {});
  }, [isMuted]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAutoTimer();
      unloadMusic();
    };
  }, []);

  const loadMusic = async () => {
    await unloadMusic();
    const option = MUSIC_OPTIONS.find(o => o.key === musicChoice);
    if (!option || !option.uri) return;
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync(
        { uri: option.uri },
        { shouldPlay: true, isLooping: true, volume: isMuted ? 0 : 0.35 }
      );
      soundRef.current = sound;
    } catch (e) {
      console.log('[Rosary] Music load error:', e);
    }
  };

  const unloadMusic = async () => {
    if (soundRef.current) {
      try { await soundRef.current.unloadAsync(); } catch (_) {}
      soundRef.current = null;
    }
  };

  // ── Auto-play engine ──────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'praying' || playMode !== 'auto' || isPaused || steps.length === 0) {
      stopAutoTimer();
      return;
    }
    startAutoTimer();
    return () => stopAutoTimer();
  }, [screen, playMode, isPaused, currentStep, autoSpeed, steps.length]);

  const stopAutoTimer = () => {
    if (progressAnimRef.current) progressAnimRef.current.stop();
    if (autoTimerRef.current) clearTimeout(autoTimerRef.current);
    progressAnim.setValue(0);
  };

  const startAutoTimer = () => {
    stopAutoTimer();
    const duration = AUTO_SPEEDS[autoSpeed].seconds * 1000;
    progressAnimRef.current = Animated.timing(progressAnim, {
      toValue: 1, duration, useNativeDriver: false,
    });
    progressAnimRef.current.start(({ finished }) => { if (finished) advance(); });
  };

  const advance = () => {
    setCurrentStep(prev => {
      if (prev >= steps.length - 1) { finishRosary(); return prev; }
      return prev + 1;
    });
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Keep refs current so PanResponder closure always calls latest
  advanceRef.current = advance;
  goBackRef.current  = goBack;

  // ── Swipe gesture (horizontal) ────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 15 && Math.abs(gs.dx) > Math.abs(gs.dy) * 1.8,
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60)      advanceRef.current?.();  // swipe left  → next
        else if (gs.dx > 60)  goBackRef.current?.();   // swipe right → back
      },
    })
  ).current;

  const finishRosary = async () => {
    stopAutoTimer();
    setScreen('complete');
    if (currentUser?.id) {
      try {
        const res = await fetch(`${BACKEND_URL}/rosary/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        });
        const data = await res.json();
        if (onComplete) onComplete(data.rosaryCount);
      } catch (e) {
        if (onComplete) onComplete();
      }
    } else {
      if (onComplete) onComplete();
    }
  };

  const handleBegin = () => {
    const s = generateSteps(mysteryType);
    setSteps(s);
    setCurrentStep(0);
    setIsPaused(false);
    setStartTime(new Date());
    setScreen('praying');
  };

  const handleExitConfirm = () => {
    Alert.alert('Leave Rosary?', 'Your progress will be lost. Are you sure?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: async () => {
        stopAutoTimer();
        await unloadMusic();
        onExit();
      }},
    ]);
  };

  const autoBarWidth = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  // ══════════════════════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'setup') {
    const todayType = getTodaysMystery();
    return (
      <View style={rs.container}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0f172a', '#1e3a5f', '#2563eb']} style={rs.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity onPress={onExit} style={rs.headerBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={rs.headerBackText}>←</Text>
          </TouchableOpacity>
          <Text style={rs.headerTitle}>Pray the Rosary</Text>
          <View style={{ minWidth: 48 }} />
        </LinearGradient>

        <ScrollView style={rs.scroll} contentContainerStyle={rs.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={rs.card}>
            <Text style={{ fontSize: 36, marginBottom: 10 }}>📿</Text>
            <Text style={rs.cardTitle}>Solo Rosary</Text>
            <Text style={rs.cardSubtitle}>Pray all 5 decades at your own pace. Choose your mysteries, music, and mode — then begin.</Text>
          </View>

          {/* Mysteries */}
          <Text style={rs.sectionLabel}>MYSTERIES</Text>
          {Object.values(MYSTERY_TYPES).map((mt) => (
            <TouchableOpacity
              key={mt.key}
              style={[rs.mysteryRow, mysteryType === mt.key && rs.mysteryRowSelected]}
              onPress={() => setMysteryType(mt.key)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                <Text style={{ fontSize: 26 }}>{mt.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={[rs.mysteryRowName, mysteryType === mt.key && { color: '#2563eb' }]}>{mt.name}</Text>
                    {mt.key === todayType && <View style={rs.todayBadge}><Text style={rs.todayBadgeText}>Today</Text></View>}
                  </View>
                  <Text style={rs.mysteryRowDays}>{mt.dayNames}</Text>
                </View>
              </View>
              <View style={[rs.radio, mysteryType === mt.key && rs.radioSelected]}>
                {mysteryType === mt.key && <View style={rs.radioDot} />}
              </View>
            </TouchableOpacity>
          ))}

          {/* Music */}
          <Text style={[rs.sectionLabel, { marginTop: 8 }]}>BACKGROUND MUSIC</Text>
          <View style={rs.card}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {MUSIC_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[rs.musicBtn, musicChoice === opt.key && rs.musicBtnSelected]}
                  onPress={() => setMusicChoice(opt.key)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 20, marginBottom: 3 }}>{opt.emoji}</Text>
                  <Text style={[rs.musicBtnLabel, musicChoice === opt.key && { color: '#2563eb' }]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Mode */}
          <Text style={[rs.sectionLabel, { marginTop: 8 }]}>MODE</Text>
          <View style={rs.card}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {['manual', 'auto'].map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[rs.modeBtn, playMode === mode && rs.modeBtnSelected]}
                  onPress={() => setPlayMode(mode)}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 26, marginBottom: 4 }}>{mode === 'manual' ? '👆' : '▶️'}</Text>
                  <Text style={[rs.modeBtnLabel, playMode === mode && { color: '#2563eb' }]}>
                    {mode === 'manual' ? 'Manual' : 'Auto-Play'}
                  </Text>
                  <Text style={rs.modeBtnDesc}>{mode === 'manual' ? 'Tap to advance' : 'Advances on timer'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {playMode === 'auto' && (
              <View style={{ marginTop: 18 }}>
                <Text style={[rs.sectionLabel, { marginBottom: 8 }]}>SPEED</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {Object.entries(AUTO_SPEEDS).map(([key, val]) => (
                    <TouchableOpacity
                      key={key}
                      style={[rs.speedBtn, autoSpeed === key && rs.speedBtnSelected]}
                      onPress={() => setAutoSpeed(key)}
                    >
                      <Text style={[rs.speedBtnLabel, autoSpeed === key && { color: '#2563eb' }]}>{val.label}</Text>
                      <Text style={[rs.speedBtnDesc, autoSpeed === key && { color: '#3b82f6' }]}>{val.desc}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          <TouchableOpacity onPress={handleBegin} activeOpacity={0.85} style={{ marginBottom: 48 }}>
            <LinearGradient colors={['#2563eb', '#1e40af']} style={rs.bigBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={rs.bigBtnText}>Begin Rosary  📿</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PRAYING SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'praying' && steps.length > 0) {
    const step        = steps[currentStep];
    const totalSteps  = steps.length;
    const overallPct  = Math.round(((currentStep + 1) / totalSteps) * 100);
    const currentDecade = step.decade;
    const hmIndex     = step.hmIndex || 0;
    const isLastStep  = currentStep >= totalSteps - 1;
    const musicLabel  = MUSIC_OPTIONS.find(o => o.key === musicChoice)?.label || '';

    return (
      <View style={rs.container} {...panResponder.panHandlers}>
        <StatusBar style="light" />

        {/* Header */}
        <LinearGradient colors={['#0f172a', '#1e3a5f', '#2563eb']} style={rs.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <TouchableOpacity onPress={handleExitConfirm} style={rs.headerBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={rs.headerBackText}>✕</Text>
          </TouchableOpacity>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={rs.headerTitle}>{MYSTERY_TYPES[mysteryType].name}</Text>
            <Text style={rs.headerSub}>{step.section}</Text>
          </View>
          {/* Mute / music toggle */}
          <TouchableOpacity
            onPress={() => setIsMuted(m => !m)}
            style={rs.muteBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            disabled={musicChoice === 'off'}
          >
            <View style={[rs.muteBtnInner, musicChoice !== 'off' && !isMuted && rs.muteBtnActive]}>
              <Text style={{ fontSize: 24, color: musicChoice === 'off' || isMuted ? 'rgba(255,255,255,0.4)' : '#fff' }}>{musicChoice === 'off' || isMuted ? '♪' : '♫'}</Text>
              <Text style={{ fontSize: 10, color: musicChoice === 'off' ? 'rgba(255,255,255,0.4)' : '#fff', marginTop: 2, fontWeight: '600' }}>
                {musicChoice === 'off' ? 'Off' : isMuted ? 'Muted' : 'Mute'}
              </Text>
            </View>
          </TouchableOpacity>
        </LinearGradient>

        {/* Overall progress bar */}
        <View style={rs.overallBar}>
          <View style={[rs.overallBarFill, { width: `${overallPct}%` }]} />
        </View>

        {/* Decade tracker */}
        <View style={rs.decadeRow}>
          {[0, 1, 2, 3, 4, 5, 6].map((d) => {
            const active = d === currentDecade;
            const done   = d < currentDecade;
            if (d === 0) {
              return (
                <View key={d} style={[rs.decadeSmall, done && rs.decadeDone, active && rs.decadeActive]}>
                  <Text style={{ fontSize: 9, color: active ? '#fff' : done ? '#93c5fd' : '#94a3b8' }}>✝</Text>
                </View>
              );
            }
            if (d === 6) {
              return (
                <React.Fragment key={d}>
                  <View style={rs.decadeGap} />
                  <View style={[rs.decadeSmall, done && rs.decadeDone, active && rs.decadeActive]}>
                    <Text style={{ fontSize: 14 }}>🙏</Text>
                  </View>
                </React.Fragment>
              );
            }
            return (
              <React.Fragment key={d}>
                <View style={[rs.decadeLine, d <= currentDecade && rs.decadeLineDone]} />
                <View style={[rs.decadeDot, done && rs.decadeDone, active && rs.decadeActive]}>
                  <Text style={[rs.decadeDotTxt, active && { color: '#fff' }, done && { color: '#3b82f6' }]}>{d}</Text>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {/* Hail Mary bead tracker */}
        {currentDecade >= 1 && currentDecade <= 5 && (
          <View style={rs.hmRow}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <View
                key={i}
                style={[rs.hmBead, hmIndex > i && rs.hmBeadDone, hmIndex === i && rs.hmBeadCurrent]}
              />
            ))}
          </View>
        )}

        {/* Scrollable prayer content with nudge animation + side swipe arrows */}
        <View style={{ flex: 1 }}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: nudgeAnim }] }}>
            <ScrollView style={rs.scroll} contentContainerStyle={[rs.scrollContent, { paddingBottom: 16 }]} showsVerticalScrollIndicator={false}>
              {step.isAnnouncement ? (
                <View style={rs.announceCard}>
                  <Text style={rs.announceDecade}>{step.title}</Text>
                  <Text style={rs.announceMystery}>{step.mysteryName}</Text>
                  <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 14 }} />
                  <Text style={[rs.announceMeditation, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.text.split('\n\n')[1]}</Text>
                </View>
              ) : (
                <View style={rs.prayerCard}>
                  <Text style={rs.prayerTitle}>{step.title}</Text>
                  <View style={rs.prayerDivider} />
                  <Text style={[rs.prayerText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.text}</Text>
                </View>
              )}
              <Text style={rs.stepCount}>Prayer {currentStep + 1} of {totalSteps}</Text>
            </ScrollView>
          </Animated.View>

          {/* Side swipe arrows — tap OR swipe */}
          <TouchableOpacity
            style={[rs.sideArrow, rs.sideArrowLeft, currentStep === 0 && { opacity: 0.2 }]}
            onPress={goBack}
            disabled={currentStep === 0}
            activeOpacity={0.7}
          >
            <Text style={rs.sideArrowText}>‹</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[rs.sideArrow, rs.sideArrowRight]}
            onPress={isLastStep ? finishRosary : advance}
            activeOpacity={0.7}
          >
            <Text style={rs.sideArrowText}>{isLastStep ? '✓' : '›'}</Text>
          </TouchableOpacity>
        </View>

        {/* Auto-play progress bar (above buttons, outside scroll) */}
        {playMode === 'auto' && (
          <View style={rs.autoBar}>
            <Animated.View style={[rs.autoBarFill, { width: autoBarWidth }]} />
          </View>
        )}

        {/* ── Font size selector ── */}
        <View style={rs.fontSizeRow}>
          {FONT_SIZES.map((_, idx) => (
            <TouchableOpacity key={idx} onPress={() => changeFontSize(idx)} style={[rs.fontSizeBtn, fontSizeIdx === idx && rs.fontSizeBtnActive]} activeOpacity={0.7}>
              <Text style={[rs.fontSizeBtnText, { fontSize: 10 + idx * 3 }, fontSizeIdx === idx && rs.fontSizeBtnTextActive]}>A</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Banner Ad (between prayer text and next button) ── */}
        {isAdMobAvailable && BannerAd && ROSARY_BANNER_ID && (
          <View style={rs.bannerContainer}>
            <BannerAd
              unitId={ROSARY_BANNER_ID}
              size={BannerAdSize.BANNER}
              requestOptions={{ requestNonPersonalizedAdsOnly: true }}
            />
          </View>
        )}

        {/* ── Fixed bottom controls ── */}
        <View style={rs.bottomControls}>
          {playMode === 'manual' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[rs.backBtn, currentStep === 0 && { opacity: 0.3 }]}
                onPress={goBack}
                disabled={currentStep === 0}
                activeOpacity={0.8}
              >
                <Text style={rs.backBtnText}>← Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={isLastStep ? finishRosary : advance} activeOpacity={0.85} style={{ flex: 1 }}>
                <LinearGradient
                  colors={isLastStep ? ['#16a34a', '#15803d'] : ['#2563eb', '#1e40af']}
                  style={rs.bigBtn}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                >
                  <Text style={rs.bigBtnText}>{isLastStep ? 'Complete Rosary  🙏' : 'Next Prayer  →'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={rs.pauseBtn} onPress={() => setIsPaused(p => !p)} activeOpacity={0.8}>
                <Text style={rs.pauseBtnText}>{isPaused ? '▶  Resume' : '⏸  Pause'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={rs.skipBtn} onPress={isLastStep ? finishRosary : advance} activeOpacity={0.8}>
                <Text style={rs.skipBtnText}>{isLastStep ? 'Finish' : 'Skip →'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </View>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // COMPLETE SCREEN
  // ══════════════════════════════════════════════════════════════════════════
  if (screen === 'complete') {
    const elapsed = startTime ? Math.round((new Date() - startTime) / 60000) : 0;
    const mt = MYSTERY_TYPES[mysteryType];

    return (
      <View style={rs.container}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0f172a', '#1e3a5f', '#2563eb']} style={rs.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={{ minWidth: 48 }} />
          <Text style={rs.headerTitle}>Rosary Complete</Text>
          <View style={{ minWidth: 48 }} />
        </LinearGradient>

        <ScrollView style={rs.scroll} contentContainerStyle={[rs.scrollContent, { alignItems: 'center', paddingTop: 32 }]} showsVerticalScrollIndicator={false}>
          <Text style={{ fontSize: 72, marginBottom: 16 }}>📿</Text>
          <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', marginBottom: 10, textAlign: 'center' }}>Rosary Complete!</Text>
          <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', lineHeight: 25, marginBottom: 28, paddingHorizontal: 16 }}>
            Well done! You have prayed the {mt.name} and offered {steps.length} prayers to Our Lady.
          </Text>

          <View style={[rs.card, { width: '100%', marginBottom: 24 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: '#2563eb' }}>{steps.length}</Text>
                <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Prayers</Text>
              </View>
              <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 30, fontWeight: '800', color: '#2563eb' }}>5</Text>
                <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Decades</Text>
              </View>
              {elapsed > 0 && (
                <>
                  <View style={{ width: 1, backgroundColor: '#e2e8f0' }} />
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 30, fontWeight: '800', color: '#2563eb' }}>{elapsed}m</Text>
                    <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Time</Text>
                  </View>
                </>
              )}
            </View>
          </View>

          <Text style={{ fontSize: 15, color: '#475569', textAlign: 'center', fontStyle: 'italic', lineHeight: 24, marginBottom: 36, paddingHorizontal: 20 }}>
            "Blessed is she who believed that the Lord would fulfill his promises to her."{'\n'}— Luke 1:45
          </Text>

          <TouchableOpacity
            onPress={() => { setCurrentStep(0); setIsPaused(false); setStartTime(new Date()); setScreen('praying'); }}
            activeOpacity={0.85}
            style={{ width: '100%', marginBottom: 12 }}
          >
            <LinearGradient colors={['#2563eb', '#1e40af']} style={rs.bigBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={rs.bigBtnText}>Pray Again  📿</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onExit} activeOpacity={0.7} style={{ paddingVertical: 14, marginBottom: 40 }}>
            <Text style={{ color: '#94a3b8', fontSize: 15 }}>Return to Groups</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return null;
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const rs = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#f1f5f9' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 80 : 64, paddingBottom: 22, paddingHorizontal: 16 },
  headerBack:   { padding: 8, minWidth: 48, alignItems: 'flex-start' },
  headerBackText: { fontSize: 22, color: '#fff', fontWeight: '600' },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#fff', textAlign: 'center' },
  headerSub:    { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  muteBtn:       { minWidth: 52, alignItems: 'center', padding: 4 },
  muteBtnInner:  { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)' },
  muteBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.15)' },

  scroll:        { flex: 1 },
  scrollContent: { padding: 16 },

  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  cardTitle:    { fontSize: 20, fontWeight: '700', color: '#0f172a', marginBottom: 6 },
  cardSubtitle: { fontSize: 15, color: '#64748b', lineHeight: 22 },

  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 8 },

  mysteryRow:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 2, borderColor: 'transparent', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  mysteryRowSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  mysteryRowName:     { fontSize: 15, fontWeight: '600', color: '#1e293b' },
  mysteryRowDays:     { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  todayBadge:         { backgroundColor: '#dbeafe', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 },
  todayBadgeText:     { fontSize: 11, color: '#2563eb', fontWeight: '700' },
  radio:              { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioSelected:      { borderColor: '#2563eb' },
  radioDot:           { width: 11, height: 11, borderRadius: 6, backgroundColor: '#2563eb' },

  musicBtn:         { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12, alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 2, borderColor: 'transparent', minWidth: 58 },
  musicBtnSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  musicBtnLabel:    { fontSize: 12, fontWeight: '600', color: '#64748b' },

  modeBtn:         { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 2, borderColor: 'transparent' },
  modeBtnSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  modeBtnLabel:    { fontSize: 14, fontWeight: '700', color: '#1e293b', marginBottom: 2 },
  modeBtnDesc:     { fontSize: 12, color: '#94a3b8', textAlign: 'center' },

  speedBtn:         { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#f8fafc', borderWidth: 2, borderColor: 'transparent' },
  speedBtnSelected: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  speedBtnLabel:    { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  speedBtnDesc:     { fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 2 },

  bigBtn:     { borderRadius: 14, paddingVertical: 18, alignItems: 'center' },
  bigBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },

  overallBar:     { height: 8, backgroundColor: '#e2e8f0' },
  overallBarFill: { height: 8, backgroundColor: '#f59e0b' },

  decadeRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  decadeGap:      { width: 20 },
  decadeDot:      { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  decadeSmall:    { width: 28, height: 28, borderRadius: 14, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#e2e8f0' },
  decadeActive:   { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  decadeDone:     { backgroundColor: '#dbeafe', borderColor: '#93c5fd' },
  decadeDotTxt:   { fontSize: 14, fontWeight: '700', color: '#94a3b8' },
  decadeLine:     { height: 2, flex: 1, backgroundColor: '#e2e8f0', maxWidth: 20 },
  decadeLineDone: { backgroundColor: '#93c5fd' },

  hmRow:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 10, gap: 5, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  hmBead:        { width: 14, height: 14, borderRadius: 7, backgroundColor: '#e2e8f0', borderWidth: 1.5, borderColor: '#cbd5e1' },
  hmBeadDone:    { backgroundColor: '#93c5fd', borderColor: '#3b82f6' },
  hmBeadCurrent: { backgroundColor: '#2563eb', borderColor: '#1d4ed8', width: 20, height: 20, borderRadius: 10 },

  announceCard:       { backgroundColor: '#1e3a5f', borderRadius: 16, padding: 24, marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5 },
  announceDecade:     { fontSize: 12, fontWeight: '700', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 8 },
  announceMystery:    { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 4 },
  announceMeditation: { fontSize: 15, color: 'rgba(255,255,255,0.85)', lineHeight: 24 },

  prayerCard:    { backgroundColor: '#fff', borderRadius: 16, padding: 24, marginBottom: 16, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  prayerTitle:   { fontSize: 12, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 },
  prayerDivider: { height: 2, backgroundColor: '#eff6ff', borderRadius: 1, marginBottom: 16 },
  prayerText:    { fontSize: 20, color: '#0f172a', lineHeight: 34, fontWeight: '400' },

  stepCount: { textAlign: 'center', color: '#94a3b8', fontSize: 13, marginBottom: 8 },

  autoBar:     { height: 6, backgroundColor: '#e2e8f0', overflow: 'hidden' },
  autoBarFill: { height: 6, backgroundColor: '#2563eb' },

  bottomControls: { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 16, paddingBottom: Platform.OS === 'ios' ? 32 : 22, borderTopWidth: 1, borderTopColor: '#e2e8f0' },

  backBtn:     { paddingVertical: 16, paddingHorizontal: 18, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center' },
  backBtnText: { fontSize: 15, color: '#64748b', fontWeight: '600' },

  pauseBtn:     { flex: 1, paddingVertical: 16, borderRadius: 14, backgroundColor: '#1e3a5f', alignItems: 'center' },
  pauseBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn:      { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center' },
  skipBtnText:  { color: '#64748b', fontSize: 15, fontWeight: '600' },

  bannerContainer: { alignItems: 'center', backgroundColor: '#fff', paddingBottom: Platform.OS === 'ios' ? 4 : 0 },

  sideArrow:      { position: 'absolute', top: '35%', width: 44, height: 64, borderRadius: 32, backgroundColor: 'rgba(37,99,235,0.18)', alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  sideArrowLeft:  { left: 4 },
  sideArrowRight: { right: 4 },
  sideArrowText:  { fontSize: 38, color: '#2563eb', fontWeight: '300', lineHeight: 46, marginTop: -2 },

  fontSizeRow:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  fontSizeBtn:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  fontSizeBtnActive:   { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  fontSizeBtnText:     { color: '#64748b', fontWeight: '600' },
  fontSizeBtnTextActive: { color: '#fff' },
});
