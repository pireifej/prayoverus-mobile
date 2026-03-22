import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StatusBar,
  StyleSheet, TextInput, Alert, Platform, Vibration, Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  signOfCross:   { title: 'Sign of the Cross',  text: 'In the name of the Father, and of the Son, and of the Holy Spirit. Amen.' },
  apostlesCreed: { title: "Apostles' Creed",     text: "I believe in God, the Father Almighty, Creator of Heaven and earth; and in Jesus Christ, His only Son, Our Lord, Who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died, and was buried. He descended into hell; the third day He arose again from the dead; He ascended into Heaven, sitteth at the right hand of God, the Father Almighty; from thence He shall come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body and life everlasting. Amen." },
  ourFather:     { title: 'Our Father',          text: "Our Father, Who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen." },
  hailMary:      { title: 'Hail Mary',           text: "Hail Mary, full of grace. The Lord is with thee. Blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen." },
  gloryBe:       { title: 'Glory Be',            text: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen." },
  fatimaPrayer:  { title: 'Fatima Prayer',       text: "O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to heaven, especially those who are most in need of Thy mercy. Amen." },
  hailHolyQueen: { title: 'Hail, Holy Queen',    text: "Hail, Holy Queen, Mother of Mercy, our life, our sweetness and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us; and after this, our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary! Pray for us, O Holy Mother of God, that we may be made worthy of the promises of Christ. Amen." },
  finalPrayer:   { title: 'Closing Prayer',      text: "O God, whose only-begotten Son, by His life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech Thee, that while meditating upon these mysteries of the most holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ Our Lord. Amen." },
};

const generateSteps = (mysteryTypeKey) => {
  const mt = MYSTERY_TYPES[mysteryTypeKey] || MYSTERY_TYPES.joyful;
  const steps = [];
  const ordinals = ['1st', '2nd', '3rd', '4th', '5th'];
  steps.push({ id: 'open-soc',   ...PRAYERS.signOfCross,   section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-creed', ...PRAYERS.apostlesCreed, section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-of',    ...PRAYERS.ourFather,     section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-hm1',   ...PRAYERS.hailMary, title: 'Hail Mary — for Faith',   section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-hm2',   ...PRAYERS.hailMary, title: 'Hail Mary — for Hope',    section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-hm3',   ...PRAYERS.hailMary, title: 'Hail Mary — for Charity', section: 'Opening Prayers', decade: 0 });
  steps.push({ id: 'open-gb',    ...PRAYERS.gloryBe,       section: 'Opening Prayers', decade: 0 });
  for (let d = 0; d < 5; d++) {
    const mystery = mt.mysteries[d];
    const dec = d + 1;
    const shortMysteryType = mt.name.replace(' Mysteries', '');
    steps.push({ id: `d${dec}-announce`, title: `${ordinals[d]} ${shortMysteryType} Mystery`, text: mystery.name + '\n\n' + mystery.meditation, section: `Decade ${dec} of 5`, decade: dec, isAnnouncement: true });
    steps.push({ id: `d${dec}-of`, ...PRAYERS.ourFather, section: `Decade ${dec} of 5`, decade: dec });
    for (let hm = 1; hm <= 10; hm++) {
      steps.push({ id: `d${dec}-hm${hm}`, ...PRAYERS.hailMary, title: `Hail Mary ${hm} of 10`, section: `Decade ${dec} of 5`, decade: dec });
    }
    steps.push({ id: `d${dec}-gb`,     ...PRAYERS.gloryBe,     section: `Decade ${dec} of 5`, decade: dec });
    steps.push({ id: `d${dec}-fatima`, ...PRAYERS.fatimaPrayer, section: `Decade ${dec} of 5`, decade: dec });
  }
  steps.push({ id: 'close-hhq', ...PRAYERS.hailHolyQueen, section: 'Closing Prayers', decade: 6 });
  steps.push({ id: 'close-fp',  ...PRAYERS.finalPrayer,   section: 'Closing Prayers', decade: 6 });
  steps.push({ id: 'close-soc', ...PRAYERS.signOfCross,   section: 'Closing Prayers', decade: 6 });
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
export default function GroupRosaryScreen({ onExit, currentUser }) {
  // Screen flow: 'entry' → 'waiting' → 'praying' → 'complete'
  const [screen, setScreen]       = useState('entry');
  const [tab, setTab]             = useState('host'); // 'host' | 'join'
  const [codeInput, setCodeInput] = useState('');
  const userName = currentUser?.firstName || currentUser?.real_name || currentUser?.email?.split('@')[0] || 'Guest';
  const [connecting, setConnecting] = useState(false);

  // Room state
  const [roomCode, setRoomCode]             = useState(null);
  const [userId, setUserId]                 = useState(null);
  const [participants, setParticipants]     = useState([]);
  const [hostId, setHostId]                 = useState(null);
  const [mysteryType, setMysteryType]       = useState(getTodaysMystery());
  const [steps, setSteps]                   = useState([]);
  const [currentStep, setCurrentStep]       = useState(0);
  const [decadeAssignments, setDecadeAssignments] = useState({});

  // Font size
  const [fontSizeIdx, setFontSizeIdx] = useState(2);

  // Pulse animation for YOUR TURN
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef(null);
  const prevMyTurn = useRef(false);

  const wsRef    = useRef(null);
  const userIdRef = useRef(null);
  const roomCodeRef = useRef(null);

  // Normalize participant name — server may use 'name' or 'userName'
  const pName = (p) => p?.name || p?.userName || p?.displayName || '?';

  // Computed
  const isHost   = userId && hostId && userId === hostId;
  const myDecade = Object.entries(decadeAssignments).find(([, uid]) => uid === userId)?.[0];
  const step     = steps[currentStep] || null;
  const isMyTurn = step ? (
    isHost
      ? (step.decade === 0 || step.decade === 6)
      : myDecade && parseInt(myDecade) === step.decade
  ) : false;
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

  // Pulse animation — start/stop when turn changes
  useEffect(() => {
    if (isMyTurn && !prevMyTurn.current) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1,    duration: 700, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else if (!isMyTurn && prevMyTurn.current) {
      pulseLoop.current?.stop();
      pulseAnim.setValue(1);
    }
    prevMyTurn.current = isMyTurn;
  }, [isMyTurn]);

  // Vibrate on every step advance when it's your turn to read
  useEffect(() => {
    if (isMyTurn && currentStep > 0) {
      Vibration.vibrate(300);
    }
  }, [currentStep]);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => {
      wsRef.current?.close();
      pulseLoop.current?.stop();
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
        console.log('🙏 room_updated participants:', JSON.stringify(msg.participants));
        setParticipants(msg.participants || []);
        setHostId(msg.hostId);
        break;

      case 'session_started':
        setMysteryType(msg.mysteryType);
        setSteps(generateSteps(msg.mysteryType));
        setCurrentStep(msg.currentStep || 0);
        setDecadeAssignments(msg.decadeAssignments || {});
        setScreen('praying');
        break;

      case 'step_changed':
        setCurrentStep(msg.currentStep);
        break;

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
    ws.onopen    = onOpen;
    ws.onmessage = (e) => { try { handleMessage(JSON.parse(e.data)); } catch (err) {} };
    ws.onerror   = () => { setConnecting(false); Alert.alert('Connection Error', 'Could not connect to the group server. Please check your internet connection.'); };
    ws.onclose   = () => {};
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
    if (isLastStep) { setScreen('complete'); return; }
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

  const leaderName = (() => {
    if (step.decade === 0 || step.decade === 6) {
      const host = participants.find(p => p.id === hostId);
      return host ? pName(host) : 'Host';
    }
    const leaderId = decadeAssignments[String(step.decade)];
    const leader = participants.find(p => p.id === leaderId);
    return leader ? pName(leader) : '';
  })();

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
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

      {/* YOUR TURN banner */}
      {isMyTurn && (
        <Animated.View style={[gs.yourTurnBanner, { opacity: pulseAnim }]}>
          <Text style={gs.yourTurnText}>📢  YOUR TURN — READ ALOUD</Text>
        </Animated.View>
      )}

      {/* Leader indicator (when not your turn) */}
      {!isMyTurn && leaderName ? (
        <View style={gs.leaderBanner}>
          <Text style={gs.leaderText}>🗣  {leaderName} is leading</Text>
        </View>
      ) : null}

      {/* Prayer content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 16 }}>
        <View style={[gs.prayerCard, isMyTurn && gs.prayerCardActive]}>
          {step.isAnnouncement ? (
            <>
              <Text style={[gs.announceMystery, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>
                {step.text?.split('\n\n')[0]}
              </Text>
              {step.text?.split('\n\n')[1] && (
                <Text style={[gs.announceMeditation, { fontSize: Math.max(14, FONT_SIZES[fontSizeIdx] - 3), lineHeight: LINE_HEIGHTS[fontSizeIdx] - 4 }]}>
                  {step.text.split('\n\n')[1]}
                </Text>
              )}
            </>
          ) : (
            <>
              <Text style={gs.prayerTitle}>{step.title}</Text>
              <Text style={[gs.prayerText, { fontSize: FONT_SIZES[fontSizeIdx], lineHeight: LINE_HEIGHTS[fontSizeIdx] }]}>{step.text}</Text>
            </>
          )}
        </View>
      </ScrollView>

      {/* Font size row */}
      <View style={gs.fontSizeRow}>
        {FONT_SIZES.map((_, idx) => (
          <TouchableOpacity key={idx} onPress={() => changeFontSize(idx)} style={[gs.fontSizeBtn, fontSizeIdx === idx && gs.fontSizeBtnActive]} activeOpacity={0.7}>
            <Text style={[gs.fontSizeBtnText, { fontSize: 10 + idx * 3 }, fontSizeIdx === idx && gs.fontSizeBtnTextActive]}>A</Text>
          </TouchableOpacity>
        ))}
      </View>

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
                colors={isLastStep ? ['#16a34a', '#15803d'] : ['#2563eb', '#1e40af']}
                style={gs.nextBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={gs.nextBtnText}>{isLastStep ? 'Complete Rosary  🙏' : 'Next Prayer  →'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={gs.followingRow}>
            <View style={gs.followingDot} />
            <Text style={gs.followingText}>Following — {leaderName || 'host'} is leading the pace</Text>
          </View>
        )}

        {/* Participant mini-list */}
        <View style={gs.participantStrip}>
          {participants.slice(0, 6).map((p) => {
            const isLeader = p.id === hostId
              ? (step.decade === 0 || step.decade === 6)
              : decadeAssignments[String(step.decade)] === p.id;
            return (
              <View key={p.id} style={[gs.stripAvatar, isLeader && gs.stripAvatarActive]}>
                <Text style={gs.stripInitial}>{pName(p)[0].toUpperCase()}</Text>
              </View>
            );
          })}
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

  // YOUR TURN
  yourTurnBanner:  { backgroundColor: '#f59e0b', paddingVertical: 10, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  yourTurnText:    { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  leaderBanner:    { backgroundColor: '#eff6ff', paddingVertical: 8, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#dbeafe' },
  leaderText:      { fontSize: 13, color: '#3b82f6', fontWeight: '600' },

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
});
