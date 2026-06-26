import React from 'react';
import { Animated, Modal, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Module-level singleton refs ────────────────────────────────────────────
let _triggerToast = null;
let _triggerModal = null;

export function showToast(message, icon = '✓') {
  if (_triggerToast) _triggerToast({ message, icon });
}

export function showModal({ icon = '⚠️', title, message, buttons }) {
  if (_triggerModal) _triggerModal({ icon, title, message, buttons: buttons || [{ label: 'OK' }] });
}

// ─── Toast ───────────────────────────────────────────────────────────────────
export function AppToast() {
  const [toast, setToast] = React.useState(null);
  const slideY = React.useRef(new Animated.Value(-120)).current;
  const opacity = React.useRef(new Animated.Value(0)).current;
  const timerRef = React.useRef(null);

  React.useEffect(() => {
    _triggerToast = ({ message, icon }) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setToast({ message, icon });
      slideY.setValue(-120);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(slideY, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideY, { toValue: -120, duration: 280, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]).start(() => setToast(null));
      }, 2600);
    };
    return () => { _triggerToast = null; if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  if (!toast) return null;

  return (
    <Modal transparent animationType="none" visible={!!toast} statusBarTranslucent>
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 56,
          left: 16,
          right: 16,
          transform: [{ translateY: slideY }],
          opacity,
          zIndex: 9999,
          backgroundColor: '#1e293b',
          borderRadius: 18,
          paddingVertical: 14,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <Text style={{ fontSize: 24, marginRight: 12 }}>{toast.icon}</Text>
        <Text style={{ color: '#f1f5f9', fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 21 }}>
          {toast.message}
        </Text>
      </Animated.View>
    </Modal>
  );
}

// ─── Modal dialog ─────────────────────────────────────────────────────────────
export function AppModal() {
  const [config, setConfig] = React.useState(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.88)).current;

  React.useEffect(() => {
    _triggerModal = (cfg) => {
      setConfig(cfg);
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 100, friction: 10 }),
      ]).start();
    };
    return () => { _triggerModal = null; };
  }, []);

  const dismiss = (onPress) => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 0.92, duration: 160, useNativeDriver: true }),
    ]).start(() => {
      setConfig(null);
      if (onPress) onPress();
    });
  };

  if (!config) return null;

  return (
    <Modal transparent animationType="none" visible={!!config} statusBarTranslucent onRequestClose={() => dismiss()}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 28,
          opacity: fadeAnim,
        }}
      >
        <Animated.View
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 24,
            paddingTop: 32,
            paddingBottom: 24,
            paddingHorizontal: 24,
            width: '100%',
            maxWidth: 360,
            alignItems: 'center',
            transform: [{ scale: scaleAnim }],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.22,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {config.icon ? (
            <Text style={{ fontSize: 48, marginBottom: 14 }}>{config.icon}</Text>
          ) : null}

          {config.title ? (
            <Text style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: 8,
              textAlign: 'center',
              letterSpacing: -0.3,
            }}>
              {config.title}
            </Text>
          ) : null}

          {config.message ? (
            <Text style={{
              fontSize: 15,
              color: '#475569',
              lineHeight: 22,
              textAlign: 'center',
              marginBottom: 26,
              paddingHorizontal: 4,
            }}>
              {config.message}
            </Text>
          ) : null}

          <View style={{ width: '100%', gap: 10 }}>
            {(config.buttons || [{ label: 'OK' }]).map((btn, i) => {
              if (btn.style === 'cancel') {
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => dismiss(btn.onPress)}
                    activeOpacity={0.75}
                    style={{
                      backgroundColor: '#f1f5f9',
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                      width: '100%',
                    }}
                  >
                    <Text style={{ color: '#64748b', fontSize: 16, fontWeight: '600' }}>{btn.label}</Text>
                  </TouchableOpacity>
                );
              }
              if (btn.style === 'destructive') {
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => dismiss(btn.onPress)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#fff1f2',
                      borderRadius: 14,
                      paddingVertical: 14,
                      alignItems: 'center',
                      width: '100%',
                      borderWidth: 1.5,
                      borderColor: '#fecaca',
                    }}
                  >
                    <Text style={{ color: '#dc2626', fontSize: 16, fontWeight: '700' }}>{btn.label}</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => dismiss(btn.onPress)}
                  activeOpacity={0.85}
                  style={{ width: '100%' }}
                >
                  <LinearGradient
                    colors={['#2563eb', '#1e40af']}
                    style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '700' }}>{btn.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}
