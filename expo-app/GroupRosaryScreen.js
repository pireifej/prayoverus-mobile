import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar,
  StyleSheet, TextInput, Alert, Platform, Vibration, Animated,
  KeyboardAvoidingView, PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── AdMob ────────────────────────────────────────────────────────────────────
let BannerAd, BannerAdSize, TestIds;
let isAdMobAvailable = false;
let GROUP_BANNER_ID = null;
try {
  const adMobModule = require('react-native-google-mobile-ads');
  BannerAd     = adMobModule.BannerAd;
  BannerAdSize = adMobModule.BannerAdSize;
  TestIds      = adMobModule.TestIds;
  isAdMobAvailable = true;
  GROUP_BANNER_ID = __DEV__
    ? TestIds.BANNER
    : (Platform.OS === 'ios'
        ? 'ca-app-pub-9861737616974560/9395514909'
        : 'ca-app-pub-9861737616974560/9395514909');
} catch (e) {}

const WS_URL = 'wss://shouldcallpaul.replit.app';
const API_URL = 'https://shouldcallpaul.replit.app';

const FONT_SIZES   = [15, 18, 21, 25, 30];
const LINE_HEIGHTS = [23, 27, 34, 40, 48];

// ─── Prayer Data (shared with RosaryScreen) ───────────────────────────────────
const MYSTERY_TYPES = {
  joyful: {
    key: 'joyful', name: 'Joyful Mysteries', emoji: '✨', days: [1, 6],
    mysteries: [
      { name: 'The Annunciation', meditation: 'The Angel Gabriel announces to Mary that she will be the Mother of God. Mary says yes to God\'s plan with perfect trust and humility.' },
      { name: 'The Visitation', meditation: 'Mary visits her cousin Elizabeth, who is carrying John the Baptist. Elizabeth is filled with the Holy Spirit and proclaims Mary blessed among women.' },
      { name: 'The Nativity', meditation: 'Jesus is born in a humble stable in Bethlehem. The angels sing Glory to God and shepherds come to adore the newborn King.' },
      { name: 'The Presentation', meditation: 'Mary and Joseph present the infant Jesus in the Temple. Simeon recognizes him as the light of the world and the salvation of all nations.' },
      { name: 'The Finding in the Temple', meditation: 'After three days of searching, Mary and Joseph find the young Jesus in the Temple, sitting among the teachers and asking them questions.' },
    ],
  },
  sorrowful: {
    key: 'sorrowful', name: 'Sorrowful Mysteries', emoji: '✝️', days: [2, 5],
    mysteries: [
      { name: 'The Agony in the Garden', meditation: 'Jesus kneels in the Garden of Gethsemane, sweating blood as he accepts the Father\'s will. He says: "Not my will, but yours be done."' },
      { name: 'The Scourging at the Pillar', meditation: 'Jesus is bound to a pillar and scourged mercilessly by Roman soldiers. He endures this great suffering out of love for each of us.' },
      { name: 'The Crowning with Thorns', meditation: 'The soldiers mock Jesus as King by pressing a crown of thorns onto his head. He accepts this humiliation with patience and love.' },
      { name: 'The Carrying of the Cross', meditation: 'Jesus carries his heavy cross through the streets of Jerusalem toward Calvary, falling three times along the way.' },
      { name: 'The Crucifixion', meditation: 'Jesus is nailed to the cross and dies after three hours. His last words offer forgiveness to those who crucified him.' },
    ],
  },
  glorious: {
    key: 'glorious', name: 'Glorious Mysteries', emoji: '👑', days: [0, 3],
    mysteries: [
      { name: 'The Resurrection', meditation: 'On the third day, Jesus rises from the dead in a glorified body. He appears first to Mary Magdalene, then to the apostles.' },
      { name: 'The Ascension', meditation: 'Forty days after Easter, Jesus ascends to the right hand of the Father, promising to send the Holy Spirit to his disciples.' },
      { name: 'The Descent of the Holy Spirit', meditation: 'On Pentecost Sunday, the Holy Spirit descends on Mary and the apostles as tongues of fire. The Church is born.' },
      { name: 'The Assumption of Mary', meditation: 'At the end of her earthly life, Mary is assumed body and soul into heavenly glory — a sign of what awaits all believers.' },
      { name: 'The Coronation of Mary', meditation: 'Mary is crowned Queen of Heaven and Earth, interceding for all who call upon her as Mother of the Church.' },
    ],
  },
  luminous: {
    key: 'luminous', name: 'Luminous Mysteries', emoji: '💡', days: [4],
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
  signOfCross:   { title: 'Sign of the Cross',  text: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.',
    call: 'In the name of the Father, and of the Son, and of the Holy Spirit.', response: 'Amen.' },
  apostlesCreed: { title: "Apostles' Creed",    text: "I believe in God, the Father Almighty, Creator of Heaven and earth; and in Jesus Christ, His only Son, Our Lord, Who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; the third day He arose again from the dead; He ascended into Heaven, sitteth at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body and life everlasting. Amen.", leaderOnly: true },
  ourFather:     { title: 'Our Father',          text: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
    call: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come, thy will be done on earth as it is in heaven.",
    response: "Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen." },
  hailMary:      { title: 'Hail Mary',           text: "Hail Mary, full of grace. The Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
    call: "Hail Mary, full of grace. The Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus.",
    response: "Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen." },
  gloryBe:       { title: 'Glory Be',            text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
    call: "Glory be to the Father, and to the Son, and to the Holy Spirit.",
    response: "As it was in the beginning, is now, and ever shall be, world without end. Amen." },
  fatimaPrayer:  { title: 'Fatima Prayer',       text: "O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to heaven, especially those who are most in need of Thy mercy. Amen.", communal: true },
  hailHolyQueen: { title: 'Hail, Holy Queen',    text: "Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us; and after this, our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary! Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen.", leaderOnly: true },
  finalPrayer:   { title: 'Closing Prayer',      text: "O God, whose only-begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that while meditating upon these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ Our Lord. Amen.", leaderOnly: true },
};

// Prayers with call/response get split into two consecutive steps: 'call' then 'response'.
// Prayers marked leaderOnly (or announcements) remain a single step.
const pushPrayer = (steps, id, prayer, section, decade) => {
  if (prayer.call && prayer.response && !prayer.leaderOnly) {
    steps.push({ id: `${id}-c`, ...prayer, phase: 'call',     section, decade });
    steps.push({ id: `${id}-r`, ...prayer, phase: 'response', section, decade });
  } else {
    steps.push({ id, ...prayer, section, decade });
  }
};

const generateSteps = (mysteryTypeKey) => {
  const mt = MYSTERY_TYPES[mysteryTypeKey] || MYSTERY_TYPES.joyful;
  const steps = [];
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];

  pushPrayer(steps, 'open-soc',   PRAYERS.signOfCross,   'Opening Prayers', 0);
  steps.push({ id: 'open-creed', ...PRAYERS.apostlesCreed, section: 'Opening Prayers', decade: 0 });
  pushPrayer(steps, 'open-of',    PRAYERS.ourFather,     'Opening Prayers', 0);
  pushPrayer(steps, 'open-hm1',   { ...PRAYERS.hailMary, title: 'Hail Mary — for Faith',    hmCurrent: 1, hmTotal: 3 }, 'Opening Prayers', 0);
  pushPrayer(steps, 'open-hm2',   { ...PRAYERS.hailMary, title: 'Hail Mary — for Hope',     hmCurrent: 2, hmTotal: 3 }, 'Opening Prayers', 0);
  pushPrayer(steps, 'open-hm3',   { ...PRAYERS.hailMary, title: 'Hail Mary — for Charity',  hmCurrent: 3, hmTotal: 3 }, 'Opening Prayers', 0);
  pushPrayer(steps, 'open-gb',    PRAYERS.gloryBe,       'Opening Prayers', 0);

  for (let d = 0; d < 5; d++) {
    const mystery = mt.mysteries[d];
    const dec = d + 1;
    const shortMysteryType = mt.name.replace(' Mysteries', '');
    steps.push({ id: `d${dec}-announce`, title: `${ordinals[d]} ${shortMysteryType} Mystery`, text: mystery.name + '\n\n' + mystery.meditation, section: `Decade ${dec} of 5`, decade: dec, isAnnouncement: true });
    pushPrayer(steps, `d${dec}-of`, PRAYERS.ourFather, `Decade ${dec} of 5`, dec);
    for (let hm = 1; hm <= 10; hm++) {
      pushPrayer(steps, `d${dec}-hm${hm}`, { ...PRAYERS.hailMary, title: 'Hail Mary', hmCurrent: hm, hmTotal: 10 }, `Decade ${dec} of 5`, dec);
    }
    pushPrayer(steps, `d${dec}-gb`,     PRAYERS.gloryBe,     `Decade ${dec} of 5`, dec);
    pushPrayer(steps, `d${dec}-fatima`, PRAYERS.fatimaPrayer, `Decade ${dec} of 5`, dec);
  }

  steps.push({ id: 'close-hhq', ...PRAYERS.hailHolyQueen, section: 'Closing Prayers', decade: 6 });
  steps.push({ id: 'close-fp',  ...PRAYERS.finalPrayer,   section: 'Closing Prayers', decade: 6 });
  pushPrayer(steps, 'close-soc', PRAYERS.signOfCross, 'Closing Prayers', 6);
  return steps;
};

const getTodaysMystery = () => {
  const day = new Date().getDay();
  if (day === 1 || day === 6) return 'joyful';
  if (day === 2 || day === 5) return 'sorrowful';
  if (day === 0 || day === 3) return 'glorious';
  return 'luminous';
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function GroupRosaryScreen({ onExit, currentUser, onComplete }) {
  // Screen flow: 'entry' → 'waiting' → 'praying' → 'complete'
  const [screen, setScreen]       = useState('entry');
  const [tab, setTab]             = useState('host'); // 'host' | 'join'
  const [codeInput, setCodeInput] = useState('');
  const userName = currentUser?.firstName || currentUser?.real_name || currentUser?.email?.split('@')[0] || 'Guest';
  const [connecting, setConnecting] = useState(false);

  // Room state
  const [roomCode, setRoomCode]         = useState(null);
  const [userId, setUserId]             = useState(null);
  const [participants, setParticipants] = useState([]);
  const [hostId, setHostId]             = useState(null);
  const [mysteryType, setMysteryType]   = useState(getTodaysMystery());
  const [steps, setSteps]               = useState([]);
  const [currentStep, setCurrentStep]   = useState(0);
  const [currentLeaderId, setCurrentLeaderId] = useState(null);

  // Font size
  const [fontSizeIdx, setFontSizeIdx] = useState(2);

  // Pulse animation for YOUR TURN
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const prevMyTurn = useRef(false);

  const wsRef    = useRef(null);
  const userIdRef = useRef(null);
  const roomCodeRef = useRef(null);

  // Refs so the PanResponder (created once) can always call the latest advance/goBack
  const advanceFnRef = useRef(null);
  const goBackFnRef  = useRef(null);

  const swipePanResponder = useRef(
    PanResponder.create({
      // Only claim the gesture when it is clearly horizontal
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        Math.abs(dx) > Math.abs(dy) * 1.5 && Math.abs(dx) > 12,
      onPanResponderRelease: (_, { dx }) => {
        if (dx < -50) advanceFnRef.current?.();  // swipe left  → next
        else if (dx > 50) goBackFnRef.current?.(); // swipe right → back
      },
    })
  ).current;

  // Normalize participant name — server may use 'name' or 'userName'
  const pName = (p) => p?.name || p?.userName || p?.displayName || '?';

  // Computed
  const isHost = userId && hostId && userId === hostId;
  // Participant ID may come as p.id or p.userId from the server
  const getPId = (p) => p?.id || p?.userId || p?.participantId;

  const step = steps[currentStep] || null;
  // Host always leads — no rotation.
  const isLeader = isHost;
  // Non-host participants are "active" during the response phase.
  const isResponding = !isHost && step?.phase === 'response';

  const totalSteps  = steps.length;
  const isLastStep  = currentStep >= totalSteps - 1;
  const progress    = totalSteps > 0 ? (currentStep + 1) / totalSteps : 0;

  useEffect(() => { setSteps(generateSteps(mysteryType)); }, [mysteryType]);

  // Load saved font size
  useEffect(() => {
    AsyncStorage.getItem('@rosary_font_size').then(v => {
      if (v !== null) setFontSizeIdx(parseInt(v));
    }).catch(() => {});
  }, []);

  // Pulse animation — fires for participants when the response phase begins
  useEffect(() => {
    if (isResponding && !prevMyTurn.current) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else if (!isResponding && prevMyTurn.current) {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    prevMyTurn.current = isResponding;
  }, [isResponding]);

  // Vibrate for participants once when the response phase step begins
  useEffect(() => {
    if (!isHost && steps[currentStep]?.phase === 'response') {
      Vibration.vibrate(150);
    }
  }, [currentStep]);

  // Heartbeat — sends a ping every 25 s to prevent idle-timeout disconnects
  const heartbeatRef = useRef(null);

  const startHeartbeat = () => {
    if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    heartbeatRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);
  };

  const stopHeartbeat = () => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  };

  // Cleanup WS and heartbeat on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      pulseLoop.current?.stop();
      stopHeartbeat();
    };
  }, []);

  const send = useCallback((msg) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'room_created':
        setUserId(msg.userId);
        userIdRef.current = msg.userId;
        setHostId(msg.userId);
        setRoomCode(msg.code);
        roomCodeRef.current = msg.code;
        setConnecting(false);
        setScreen('waiting');
        break;

      case 'joined_room':
        setUserId(msg.userId);
        userIdRef.current = msg.userId;
        setRoomCode(msg.code);
        roomCodeRef.current = msg.code;
        setConnecting(false);
        setScreen('waiting');
        break;

      case 'room_updated':
        setParticipants(msg.participants || []);
        setHostId(msg.hostId);
        if (msg.currentLeaderId) setCurrentLeaderId(msg.currentLeaderId);
        break;

      case 'session_started':
        setMysteryType(msg.mysteryType);
        setSteps(generateSteps(msg.mysteryType));
        setCurrentStep(msg.currentStep || 0);
        setCurrentLeaderId(msg.currentLeaderId || msg.hostId);
        setScreen('praying');
        break;

      case 'step_changed':
        setCurrentStep(msg.currentStep);
        break;

      case 'decade_complete':
        setCurrentStep(msg.currentStep);
        setCurrentLeaderId(msg.currentLeaderId);
        break;

      case 'pong':
        break; // heartbeat acknowledged — do nothing

      case 'error':
        setConnecting(false);
        Alert.alert('Group Rosary', msg.message || 'Something went wrong. Please try again.');
        break;

      default:
        break;
    }
  }, []);

  const connect = useCallback((onOpen) => {
    setConnecting(true);
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen    = () => { startHeartbeat(); onOpen(); };
    ws.onmessage = (e) => { try { handleMessage(JSON.parse(e.data)); } catch (err) {} };
    ws.onerror   = () => { stopHeartbeat(); setConnecting(false); Alert.alert('Connection Error', 'Could not connect to the group server. Please check your internet connection.'); };
    ws.onclose   = () => { stopHeartbeat(); };
  }, [handleMessage]);

  const handleCreateRoom = () => {
    connect(() => send({ type: 'create_room', userName }));
  };

  const handleJoinRoom = () => {
    if (codeInput.trim().length !== 4) { Alert.alert('Invalid code', 'Please enter the 4-digit room code from the host.'); return; }
    connect(() => send({ type: 'join_room', code: codeInput.trim(), userName }));
  };

  const handleStart = () => {
    send({ type: 'start_session', mysteryType });
  };

  const advance = () => {
    if (!isHost) return;
    if (isLastStep) {
      setScreen('complete');
      if (currentUser?.id) {
        fetch(`${API_URL}/rosary/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: currentUser.id }),
        })
          .then(r => r.json())
          .then(data => { if (onComplete) onComplete(data.rosaryCount); })
          .catch(() => { if (onComplete) onComplete(); });
      }
      return;
    }
    send({ type: 'advance_step' });
  };

  const goBack = () => {
    if (!isHost || currentStep === 0) return;
    send({ type: 'go_back' });
  };

  const handleLeave = () => {
    Alert.alert('Leave Group Rosary', 'Are you sure you want to leave the group prayer?', [
      { text: 'Stay', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => { wsRef.current?.close(); onExit(); } },
    ]);
  };

  const changeFontSize = (idx) => {
    setFontSizeIdx(idx);
    AsyncStorage.setItem('@rosary_font_size', String(idx)).catch(() => {});
  };

  // ── Render: Entry ──────────────────────────────────────────────────────────
  if (screen === 'entry') {
    return (
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0f172a', '#1e3a5f', '#2563eb']} style={{ flex: 1 }}>
          {/* Header */}
          <View style={gs.entryHeader}>
            <TouchableOpacity onPress={onExit} style={gs.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={gs.backBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={gs.entryTitle}>Group Rosary</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, paddingTop: 8 }} keyboardShouldPersistTaps="handled">
            <Text style={gs.entryEmoji}>📿</Text>
            <Text style={gs.entrySubtitle}>Pray together in the same room, perfectly in sync.</Text>
            <Text style={gs.entryName}>Joining as  <Text style={{ fontWeight: '800' }}>{userName}</Text></Text>

            {/* Host / Join tabs */}
            <View style={gs.tabRow}>
              <TouchableOpacity style={[gs.tab, tab === 'host' && gs.tabActive]} onPress={() => setTab('host')} activeOpacity={0.8}>
                <Text style={[gs.tabText, tab === 'host' && gs.tabTextActive]}>Host a Group</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[gs.tab, tab === 'join' && gs.tabActive]} onPress={() => setTab('join')} activeOpacity={0.8}>
                <Text style={[gs.tabText, tab === 'join' && gs.tabTextActive]}>Join a Group</Text>
              </TouchableOpacity>
            </View>

            {tab === 'host' ? (
              <View style={gs.tabContent}>
                <Text style={gs.tabDesc}>You'll receive a 4-digit code to share with everyone in the room. You'll lead the opening and closing prayers, and control the pace.</Text>
                <TouchableOpacity style={gs.primaryBtn} onPress={handleCreateRoom} activeOpacity={0.85} disabled={connecting}>
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={gs.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={gs.primaryBtnText}>{connecting ? 'Connecting…' : 'Create Room  →'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={gs.tabContent}>
                <Text style={gs.tabDesc}>Enter the 4-digit code shown on the host's phone.</Text>
                <TextInput
                  style={[gs.nameInput, { letterSpacing: 8, fontSize: 28, fontWeight: '700', textAlign: 'center', marginBottom: 20 }]}
                  value={codeInput}
                  onChangeText={t => setCodeInput(t.replace(/[^0-9]/g, '').slice(0, 4))}
                  placeholder="0000"
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  keyboardType="number-pad"
                  maxLength={4}
                />
                <TouchableOpacity style={gs.primaryBtn} onPress={handleJoinRoom} activeOpacity={0.85} disabled={connecting}>
                  <LinearGradient colors={['#2563eb', '#1e40af']} style={gs.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={gs.primaryBtnText}>{connecting ? 'Joining…' : 'Join Room  →'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  // ── Render: Waiting Room ───────────────────────────────────────────────────
  if (screen === 'waiting') {
    return (
      <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#0f172a', '#1e3a5f', '#2563eb']} style={gs.waitHeader}>
          <TouchableOpacity onPress={handleLeave} style={gs.backBtn} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={gs.backBtnText}>✕</Text>
          </TouchableOpacity>
          <Text style={gs.entryTitle}>Waiting Room</Text>
          <View style={{ width: 44 }} />
        </LinearGradient>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
          {/* Room code */}
          {isHost && (
            <View style={gs.codeCard}>
              <Text style={gs.codeLabel}>SHARE THIS CODE</Text>
              <Text style={gs.codeNumber}>{roomCode}</Text>
              <Text style={gs.codeHint}>Tell everyone in the room to open Group Rosary and enter this code.</Text>
            </View>
          )}
          {!isHost && (
            <View style={[gs.codeCard, { backgroundColor: '#dbeafe' }]}>
              <Text style={[gs.codeLabel, { color: '#1e40af' }]}>ROOM CODE</Text>
              <Text style={[gs.codeNumber, { color: '#1e3a5f' }]}>{roomCode}</Text>
              <Text style={[gs.codeHint, { color: '#3b82f6' }]}>Waiting for the host to start…</Text>
            </View>
          )}

          {/* Participants */}
          <Text style={gs.sectionLabel}>IN THE ROOM  ({participants.length})</Text>
          <View style={gs.participantList}>
            {participants.map((p) => (
              <View key={p.id} style={gs.participantRow}>
                <View style={[gs.participantAvatar, p.id === hostId && { backgroundColor: '#f59e0b' }]}>
                  <Text style={gs.participantInitial}>{pName(p)[0].toUpperCase()}</Text>
                </View>
                <Text style={gs.participantName}>{pName(p)}</Text>
                {p.id === hostId && <View style={gs.hostBadge}><Text style={gs.hostBadgeText}>HOST</Text></View>}
              </View>
            ))}
            {participants.length === 0 && (
              <Text style={{ color: '#94a3b8', textAlign: 'center', paddingVertical: 16 }}>Waiting for participants…</Text>
            )}
          </View>

          {/* Mystery picker — host only */}
          {isHost && (
            <>
              <Text style={gs.sectionLabel}>MYSTERY TYPE</Text>
              <View style={gs.mysteryGrid}>
                {Object.values(MYSTERY_TYPES).map((mt) => (
                  <TouchableOpacity
                    key={mt.key}
                    style={[gs.mysteryBtn, mysteryType === mt.key && gs.mysteryBtnActive]}
                    onPress={() => setMysteryType(mt.key)}
                    activeOpacity={0.8}
                  >
                    <Text style={gs.mysteryEmoji}>{mt.emoji}</Text>
                    <Text style={[gs.mysteryName, mysteryType === mt.key && { color: '#fff' }]}>{mt.name.replace(' Mysteries', '')}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[gs.startBtn, participants.length < 1 && { opacity: 0.5 }]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#f59e0b', '#d97706']} style={gs.startBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={gs.startBtnText}>Begin Group Rosary  🙏</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={{ textAlign: 'center', color: '#94a3b8', fontSize: 13, marginTop: 8 }}>
                You can start now — others can join while you pray.
              </Text>
            </>
          )}
        </ScrollView>
      </View>
    );
  }

  // ── Render: Complete ───────────────────────────────────────────────────────
  if (screen === 'complete') {
    return (
      <LinearGradient colors={['#0f172a', '#1e3a5f', '#1e40af']} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <StatusBar barStyle="light-content" />
        <Text style={{ fontSize: 72, marginBottom: 20 }}>🙏</Text>
        <Text style={{ fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 12 }}>Rosary Complete</Text>
        <Text style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, marginBottom: 40 }}>
          You prayed the Rosary together as a group.{'\n'}May Our Lady intercede for all of you.
        </Text>
        <View style={gs.participantList}>
          {participants.map((p) => (
            <View key={p.id} style={[gs.participantRow, { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, marginBottom: 6 }]}>
              <View style={[gs.participantAvatar, { backgroundColor: '#2563eb' }]}>
                <Text style={gs.participantInitial}>{pName(p)[0].toUpperCase()}</Text>
              </View>
              <Text style={[gs.participantName, { color: '#fff' }]}>{pName(p)}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity onPress={onExit} style={[gs.primaryBtn, { marginTop: 24, width: '100%' }]}>
          <LinearGradient colors={['#2563eb', '#1e40af']} style={gs.primaryBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={gs.primaryBtnText}>Done  ✓</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  // ── Render: Praying ────────────────────────────────────────────────────────
  if (!step) return null;

  // Keep swipe refs current on every render so PanResponder always calls the latest functions
  advanceFnRef.current = advance;
  goBackFnRef.current  = goBack;

  const hostParticipant = participants.find(p => getPId(p) === hostId);
  const hostName = hostParticipant ? pName(hostParticipant) : 'Host';

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }} {...(isHost ? swipePanResponder.panHandlers : {})}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0f172a', '#1e3a5f', '#2563eb']} style={gs.prayHeader}>
        <TouchableOpacity onPress={handleLeave} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={gs.prayHeaderBack}>✕</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={gs.prayHeaderTitle}>{MYSTERY_TYPES[mysteryType]?.name}</Text>
          <Text style={gs.prayHeaderSub}>{participants.length} praying together</Text>
        </View>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress bar */}
      <View style={{ height: 6, backgroundColor: '#e2e8f0' }}>
        <View style={{ height: 6, backgroundColor: '#f59e0b', width: `${progress * 100}%` }} />
      </View>

      {/* Section label */}
      <View style={{ backgroundColor: '#f8fafc', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8 }}>{step.section?.toUpperCase()}</Text>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>{currentStep + 1} / {totalSteps}</Text>
      </View>

      {/* Fixed-height status banner — same height in all states so layout never jumps */}
      <View style={[
        gs.statusBanner,
        isHost
          ? (step?.phase === 'response' ? gs.statusBannerBlue : gs.statusBannerGold)
          : isResponding ? gs.statusBannerBlue : gs.statusBannerNeutral,
      ]}>
        {isHost ? (
          <Text style={[gs.statusBannerText, { color: '#fff' }]}>
            {step?.phase === 'response' ? 'Group responds in unison' : '📢  Read aloud — swipe or tap Next'}
          </Text>
        ) : isResponding ? (
          <Animated.Text style={[gs.statusBannerText, { color: '#fff', opacity: pulseAnim }]}>
            Respond in Unison
          </Animated.Text>
        ) : (
          <Text style={[gs.statusBannerText, { color: '#3b82f6' }]}>
            🗣  {hostName} is leading
          </Text>
        )}
      </View>

      {/* Prayer content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 16, gap: 12 }}>

        {/* Hail Mary progress indicator */}
        {step.hmTotal && (
          <View style={gs.hmProgressRow}>
            <Text style={gs.hmProgressLabel}>
              Hail Mary {step.hmCurrent} of {step.hmTotal}
            </Text>
            <View style={gs.hmDots}>
              {Array.from({ length: step.hmTotal }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    gs.hmDot,
                    i < step.hmCurrent && gs.hmDotFilled,
                    i === step.hmCurrent - 1 && gs.hmDotCurrent,
                  ]}
                />
              ))}
            </View>
          </View>
        )}

        {step.isAnnouncement ? (
          <View style={[gs.prayerCard, isHost && gs.prayerCardActive]}>
            {isHost && <Text style={gs.callRoleLabel}>📢  YOU ANNOUNCE</Text>}
            {!isHost && <Text style={gs.followRoleLabel}>🗣  {hostName} is announcing</Text>}
            <Text style={[gs.announceMystery, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>
              {step.text?.split('\n\n')[0]}
            </Text>
            {step.text?.split('\n\n')[1] && (
              <Text style={[gs.announceMeditation, { fontSize: Math.max(14, FONT_SIZES[fontSizeIdx] - 3), lineHeight: LINE_HEIGHTS[fontSizeIdx] - 4 }]}>
                {step.text.split('\n\n')[1]}
              </Text>
            )}
          </View>
        ) : step.leaderOnly ? (
          <View style={[gs.prayerCard, isHost && gs.prayerCardActive]}>
            {isHost && <Text style={gs.callRoleLabel}>📢  YOU LEAD</Text>}
            {!isHost && <Text style={gs.followRoleLabel}>🗣  {hostName} leads</Text>}
            <Text style={gs.prayerTitle}>{step.title}</Text>
            <Text style={[gs.prayerText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.text}</Text>
          </View>
        ) : step.phase === 'call' ? (
          <>
            {/* CALL — host reads, gold and bright; response dimmed as preview */}
            <View style={[gs.callBox, gs.callBoxActive]}>
              <Text style={gs.callBoxLabel}>{isHost ? '📢  YOU SAY:' : `🗣  ${hostName} says:`}</Text>
              <Text style={[gs.callBoxText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.call}</Text>
            </View>
            <View style={gs.responseBox}>
              <Text style={gs.responseBoxLabel}>🙏  All respond — coming up next:</Text>
              <Text style={[gs.responseBoxText, gs.dimText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.response}</Text>
            </View>
          </>
        ) : step.phase === 'response' ? (
          <>
            {/* RESPONSE — group reads in unison; call dimmed */}
            <View style={gs.callBox}>
              <Text style={[gs.callBoxLabel, gs.dimText]}>{isHost ? 'You said:' : `${hostName} said:`}</Text>
              <Text style={[gs.callBoxText, gs.dimText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.call}</Text>
            </View>
            <View style={[gs.responseBox, gs.responseBoxActive]}>
              <Text style={gs.responseBoxLabel}>🙏  {isHost ? 'ALL RESPOND IN UNISON:' : 'RESPOND IN UNISON:'}</Text>
              <Text style={[gs.responseBoxText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.response}</Text>
            </View>
          </>
        ) : step.communal ? (
          <View style={gs.communalBox}>
            <Text style={gs.communalLabel}>🙏  ALL PRAY TOGETHER:</Text>
            <Text style={gs.prayerTitle}>{step.title}</Text>
            <Text style={[gs.communalText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.text}</Text>
          </View>
        ) : (
          <View style={[gs.prayerCard, isHost && gs.prayerCardActive]}>
            <Text style={gs.prayerTitle}>{step.title}</Text>
            <Text style={[gs.prayerText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.text}</Text>
          </View>
        )}
      </ScrollView>

      {/* Font size row */}
      <View style={gs.fontSizeRow}>
        {FONT_SIZES.map((_, idx) => (
          <TouchableOpacity key={idx} onPress={() => changeFontSize(idx)} style={[gs.fontSizeBtn, fontSizeIdx === idx && gs.fontSizeBtnActive]} activeOpacity={0.7}>
            <Text style={[gs.fontSizeBtnText, { fontSize: 10 + idx * 3 }, fontSizeIdx === idx && gs.fontSizeBtnTextActive]}>A</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Banner Ad */}
      {isAdMobAvailable && BannerAd && GROUP_BANNER_ID && (
        <View style={gs.bannerContainer}>
          <BannerAd unitId={GROUP_BANNER_ID} size={BannerAdSize.BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
        </View>
      )}

      {/* Bottom controls */}
      <View style={gs.bottomControls}>
        {isHost ? (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[gs.backNavBtn, currentStep === 0 && { opacity: 0.3 }]}
              onPress={goBack}
              disabled={currentStep === 0}
              activeOpacity={0.8}
            >
              <Text style={gs.backNavBtnText}>← Back</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={advance} activeOpacity={0.85} style={{ flex: 1 }}>
              <LinearGradient
                colors={isLastStep ? ['#16a34a', '#15803d'] : step?.phase === 'call' ? ['#b45309', '#92400e'] : ['#2563eb', '#1e40af']}
                style={gs.nextBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={gs.nextBtnText}>
                  {isLastStep ? 'Complete Rosary  🙏' : step?.phase === 'call' ? 'Group responds  →' : 'Next Prayer  →'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={gs.followingRow}>
            <View style={[gs.followingDot, isResponding && { backgroundColor: '#2563eb' }]} />
            <Text style={gs.followingText}>
              {isResponding ? 'Read your response in unison with the group' : `${hostName} is leading — your response box will light up`}
            </Text>
          </View>
        )}

        {/* Participant strip — gold ring always on host */}
        <View style={gs.participantStrip}>
          {participants.slice(0, 6).map((p) => (
            <View key={getPId(p)} style={[gs.stripAvatar, getPId(p) === hostId && gs.stripAvatarActive]}>
              <Text style={gs.stripInitial}>{pName(p)[0].toUpperCase()}</Text>
            </View>
          ))}
          {participants.length > 6 && (
            <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>+{participants.length - 6}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const gs = StyleSheet.create({
  // Entry
  entryHeader:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 16, paddingBottom: 12 },
  entryTitle:      { fontSize: 20, fontWeight: '800', color: '#fff' },
  entryEmoji:      { fontSize: 64, textAlign: 'center', marginTop: 8, marginBottom: 12 },
  entrySubtitle:   { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, marginBottom: 14 },
  entryName:       { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginBottom: 24 },
  backBtn:         { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backBtnText:     { fontSize: 20, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  inputLabel:      { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.8, marginBottom: 8 },
  nameInput:       { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 16, paddingVertical: 14, fontSize: 18, color: '#fff', marginBottom: 24 },
  tabRow:          { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 14, padding: 4, marginBottom: 20 },
  tab:             { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 11 },
  tabActive:       { backgroundColor: '#fff' },
  tabText:         { fontSize: 15, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive:   { color: '#1e3a5f' },
  tabContent:      { gap: 0 },
  tabDesc:         { fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 21, marginBottom: 20 },
  primaryBtn:      { borderRadius: 16, overflow: 'hidden' },
  primaryBtnGrad:  { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  primaryBtnText:  { fontSize: 17, fontWeight: '700', color: '#fff' },

  // Waiting
  waitHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 16, paddingBottom: 16 },
  codeCard:        { backgroundColor: '#1e3a5f', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5 },
  codeLabel:       { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: 1.5, marginBottom: 8 },
  codeNumber:      { fontSize: 64, fontWeight: '800', color: '#f59e0b', letterSpacing: 12, marginBottom: 8 },
  codeHint:        { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 19 },
  sectionLabel:    { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 1.2, marginBottom: 10, marginTop: 4 },
  participantList: { backgroundColor: '#fff', borderRadius: 16, padding: 12, marginBottom: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  participantRow:  { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  participantAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  participantInitial: { fontSize: 17, fontWeight: '700', color: '#fff' },
  participantName: { fontSize: 16, fontWeight: '600', color: '#0f172a', flex: 1 },
  hostBadge:       { backgroundColor: '#fef3c7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  hostBadgeText:   { fontSize: 11, fontWeight: '800', color: '#d97706', letterSpacing: 0.5 },
  mysteryGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  mysteryBtn:      { flex: 1, minWidth: '45%', backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 2, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  mysteryBtnActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  mysteryEmoji:    { fontSize: 24, marginBottom: 6 },
  mysteryName:     { fontSize: 13, fontWeight: '700', color: '#0f172a', textAlign: 'center' },
  startBtn:        { borderRadius: 16, overflow: 'hidden', marginTop: 4 },
  startBtnGrad:    { paddingVertical: 18, alignItems: 'center', borderRadius: 16 },
  startBtnText:    { fontSize: 18, fontWeight: '800', color: '#fff' },

  // Praying header
  prayHeader:      { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingHorizontal: 16, paddingBottom: 14 },
  prayHeaderBack:  { fontSize: 20, color: 'rgba(255,255,255,0.8)', fontWeight: '600', width: 36 },
  prayHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#fff' },
  prayHeaderSub:   { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  // Status banner — fixed height so the layout never jumps between states
  statusBanner:        { height: 44, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 },
  statusBannerGold:    { backgroundColor: '#f59e0b' },
  statusBannerBlue:    { backgroundColor: '#2563eb' },
  statusBannerNeutral: { backgroundColor: '#eff6ff', borderBottomWidth: 1, borderBottomColor: '#dbeafe' },
  statusBannerText:    { fontSize: 13, fontWeight: '700', textAlign: 'center', letterSpacing: 0.2 },

  // Prayer card
  prayerCard:      { backgroundColor: '#fff', borderRadius: 18, padding: 20, shadowColor: '#0f172a', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 3, borderWidth: 2, borderColor: 'transparent' },
  prayerCardActive: { borderColor: '#f59e0b', shadowColor: '#f59e0b', shadowOpacity: 0.25 },
  prayerTitle:     { fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 12, textTransform: 'uppercase' },
  prayerText:      { color: '#1e293b', lineHeight: 30 },
  announceMystery: { fontWeight: '800', color: '#1e3a5f', marginBottom: 14 },
  announceMeditation: { color: '#475569', lineHeight: 28, fontStyle: 'italic' },

  // Font size
  fontSizeRow:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#f8fafc', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  fontSizeBtn:         { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e8f0' },
  fontSizeBtnActive:   { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  fontSizeBtnText:     { color: '#64748b', fontWeight: '600' },
  fontSizeBtnTextActive: { color: '#fff' },

  // Bottom controls
  bottomControls:  { backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  backNavBtn:      { paddingVertical: 16, paddingHorizontal: 20, borderRadius: 14, backgroundColor: '#f1f5f9', borderWidth: 1.5, borderColor: '#e2e8f0', justifyContent: 'center' },
  backNavBtnText:  { color: '#64748b', fontSize: 15, fontWeight: '600' },
  nextBtn:         { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  nextBtnText:     { color: '#fff', fontSize: 17, fontWeight: '700' },
  followingRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 8 },
  followingDot:    { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  followingText:   { fontSize: 15, color: '#64748b', fontWeight: '500' },

  // Participant strip
  participantStrip: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 10, gap: 6 },
  stripAvatar:      { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'transparent' },
  stripAvatarActive: { borderColor: '#f59e0b', backgroundColor: '#fef3c7' },
  stripInitial:     { fontSize: 13, fontWeight: '700', color: '#1e40af' },

  // Call-and-response boxes
  callBox:          { borderRadius: 16, padding: 18, backgroundColor: '#fffbeb', borderWidth: 2, borderColor: '#e2e8f0' },
  callBoxActive:    { borderColor: '#f59e0b', backgroundColor: '#fef3c7' },
  callBoxLabel:     { fontSize: 11, fontWeight: '800', color: '#b45309', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  callBoxText:      { color: '#1e293b', lineHeight: 30 },

  responseBox:      { borderRadius: 16, padding: 18, backgroundColor: '#f0f9ff', borderWidth: 2, borderColor: '#e2e8f0' },
  responseBoxActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  responseBoxLabel: { fontSize: 11, fontWeight: '800', color: '#1d4ed8', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  responseBoxText:  { color: '#1e293b', lineHeight: 30 },

  dimText:          { opacity: 0.38 },
  callRoleLabel:    { fontSize: 11, fontWeight: '800', color: '#b45309', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  followRoleLabel:  { fontSize: 11, fontWeight: '700', color: '#3b82f6', letterSpacing: 0.5, marginBottom: 10 },

  // Hail Mary progress
  hmProgressRow:    { backgroundColor: '#f8fafc', borderRadius: 14, padding: 12, alignItems: 'center', gap: 8 },
  hmProgressLabel:  { fontSize: 12, fontWeight: '700', color: '#475569', letterSpacing: 0.5 },
  hmDots:           { flexDirection: 'row', flexWrap: 'wrap', gap: 5, justifyContent: 'center' },
  hmDot:            { width: 8, height: 8, borderRadius: 4, backgroundColor: '#e2e8f0' },
  hmDotFilled:      { backgroundColor: '#93c5fd' },
  hmDotCurrent:     { backgroundColor: '#2563eb', width: 10, height: 10, borderRadius: 5 },

  // Communal prayer (all pray together)
  communalBox:      { borderRadius: 16, padding: 18, backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#86efac' },
  communalLabel:    { fontSize: 11, fontWeight: '800', color: '#16a34a', letterSpacing: 0.8, marginBottom: 10, textTransform: 'uppercase' },
  communalText:     { color: '#1e293b', lineHeight: 30 },

  // Banner ad
  bannerContainer:  { alignItems: 'center', backgroundColor: '#f8fafc' },
});
