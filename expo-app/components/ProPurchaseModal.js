import React, { useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator, Animated, Modal, PanResponder, Platform, Pressable,
  ScrollView, StyleSheet, Text, useWindowDimensions, View,
} from 'react-native';
import { SafeAreaInsetsContext, initialWindowMetrics } from 'react-native-safe-area-context';

// Mounted outside screen-specific returns so every premium entry point works.
export default function ProPurchaseModal({ iap }) {
  const { iapModal, iapPurchasing, setIapModal, doIapPurchase, doIapRestore, getIapPrice } = iap;
  const { height, fontScale } = useWindowDimensions();
  // Some entry points have no SafeAreaProvider; don't use a hook that throws
  // in that case. Keep a conservative system-navigation fallback as well.
  const insets = useContext(SafeAreaInsetsContext) || initialWindowMetrics?.insets;
  const bottomPadding = Math.max(Platform.OS === 'android' ? 50 : 28, (insets?.bottom || 0) + 20);
  const sheetHeight = Math.min(560 * Math.max(1, fontScale), height - (insets?.top || 0) - 16);
  const translation = useRef(new Animated.Value(0)).current;
  const scrollOffset = useRef(0);
  const scrollRef = useRef(null);
  const dismiss = useCallback(() => {
    if (!iapPurchasing) setIapModal(null);
  }, [iapPurchasing, setIapModal]);
  const resetPosition = useCallback(() => {
    Animated.spring(translation, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
  }, [translation]);
  const swipe = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponderCapture: (_, gesture) =>
      !iapPurchasing && scrollOffset.current <= 0 &&
      gesture.dy > 12 && gesture.dy > Math.abs(gesture.dx) * 1.5,
    onPanResponderMove: (_, gesture) => {
      if (!iapPurchasing) translation.setValue(Math.max(0, gesture.dy));
    },
    onPanResponderRelease: (_, gesture) => {
      if (!iapPurchasing && (gesture.dy > 80 || (gesture.dy > 24 && gesture.vy > 0.8))) {
        dismiss();
        translation.setValue(0);
      } else {
        resetPosition();
      }
    },
    onPanResponderTerminate: resetPosition,
  }), [dismiss, iapPurchasing, resetPosition, translation]);

  useEffect(() => {
    translation.setValue(0);
    scrollOffset.current = 0;
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [iapModal?.package, translation]);

  return (
    <Modal
      visible={!!iapModal?.package}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable
          testID="pro-backdrop"
          accessibilityRole="button"
          accessibilityLabel="Dismiss Pro subscription"
          accessibilityState={{ disabled: !!iapPurchasing }}
          disabled={iapPurchasing}
          onPress={dismiss}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          testID="pro-sheet"
          accessibilityViewIsModal
          onAccessibilityEscape={dismiss}
          {...swipe.panHandlers}
          style={{
            backgroundColor: '#1e1b4b', borderTopLeftRadius: 24, borderTopRightRadius: 24,
            height: sheetHeight, paddingBottom: bottomPadding,
            transform: [{ translateY: translation }],
          }}
        >
          <View style={{ paddingTop: 12, paddingHorizontal: 20, paddingBottom: 16 }}>
            <View accessible={false} style={{
              alignSelf: 'center', width: 42, height: 5, borderRadius: 3,
              backgroundColor: 'rgba(255,255,255,0.4)', marginBottom: 12,
            }} />
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text accessibilityRole="header" style={{
                flex: 1, color: '#fff', fontSize: 22, fontWeight: '800', marginRight: 12,
              }}>
                {iapModal?.title}
              </Text>
              <Pressable
                testID="pro-close"
                accessibilityRole="button"
                accessibilityLabel="Close Pro subscription"
                accessibilityState={{ disabled: !!iapPurchasing }}
                disabled={iapPurchasing}
                onPress={dismiss}
                style={({ pressed }) => ({
                  minWidth: 48, minHeight: 48, borderRadius: 24,
                  backgroundColor: pressed ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.10)',
                  alignItems: 'center', justifyContent: 'center', opacity: iapPurchasing ? 0.45 : 1,
                })}
              >
                <Text style={{ color: '#fde68a', fontSize: 28, lineHeight: 32 }}>×</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView
            ref={scrollRef}
            testID="pro-sheet-content"
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
            onScroll={event => { scrollOffset.current = Math.max(0, event.nativeEvent.contentOffset.y); }}
            scrollEventThrottle={16}
            bounces={false}
          >
          <Text style={{ color: '#ddd', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
            {iapModal?.description}
          </Text>
          {!!iap.subscriptionMessage && (
            <Text accessibilityRole="alert" testID="pro-subscription-message" style={{
              color: '#fff',
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: 12,
              marginBottom: 16,
              fontSize: 14,
              lineHeight: 20,
              textAlign: 'center',
            }}>
              {iap.subscriptionMessage}
            </Text>
          )}
          <Pressable
            testID="pro-subscribe"
            accessibilityRole="button"
            accessibilityState={{ disabled: !!iapPurchasing }}
            disabled={iapPurchasing}
            onPress={() => doIapPurchase(iapModal?.package, iapModal?.onSuccess)}
            style={{ backgroundColor: '#fbbf24', borderRadius: 14, padding: 16, alignItems: 'center' }}
          >
            {iapPurchasing ? <ActivityIndicator color="#1e1b4b" /> : (
              <Text style={{ color: '#1e1b4b', fontWeight: '800', fontSize: 17 }}>
                Subscribe — {getIapPrice(iapModal?.package) ?? '…'} / month
              </Text>
            )}
          </Pressable>
          <Text style={{ color: '#ddd', textAlign: 'center', marginTop: 12, fontSize: 12 }}>
            Monthly subscription renews automatically unless canceled in your store settings.
          </Text>
          <Pressable testID="pro-restore" accessibilityRole="button" onPress={doIapRestore} disabled={iapPurchasing} style={{ minHeight: 48, padding: 16 }}>
            <Text style={{ color: '#ddd', textAlign: 'center' }}>Restore purchases</Text>
          </Pressable>
          {typeof iap.openManageSubscriptions === 'function' && (
            <Pressable
              testID="pro-manage-subscription"
              accessibilityRole="link"
              accessibilityState={{ disabled: !!iapPurchasing }}
              onPress={iap.openManageSubscriptions}
              disabled={!!iapPurchasing}
              style={{ minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ color: '#fde68a', textAlign: 'center', fontWeight: '700' }}>
                Manage subscription
              </Text>
            </Pressable>
          )}
          <Pressable testID="pro-dismiss" accessibilityRole="button" onPress={dismiss} disabled={iapPurchasing} style={{ minHeight: 48, padding: 12 }}>
            <Text style={{ color: '#ddd', textAlign: 'center' }}>Not now</Text>
          </Pressable>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
