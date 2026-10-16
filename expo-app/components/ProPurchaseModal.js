import React from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';

// Mounted outside screen-specific returns so every premium entry point works.
export default function ProPurchaseModal({ iap }) {
  const { iapModal, iapPurchasing, setIapModal, doIapPurchase, doIapRestore, getIapPrice } = iap;
  return (
    <Modal
      visible={!!iapModal?.package}
      transparent
      animationType="slide"
      onRequestClose={() => !iapPurchasing && setIapModal(null)}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#1e1b4b', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 28 }}>
          <Text style={{ color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 12 }}>
            {iapModal?.title}
          </Text>
          <Text style={{ color: '#ddd', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
            {iapModal?.description}
          </Text>
          <Pressable
            testID="pro-subscribe"
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
          <Pressable testID="pro-restore" onPress={doIapRestore} disabled={iapPurchasing} style={{ padding: 16 }}>
            <Text style={{ color: '#ddd', textAlign: 'center' }}>Restore purchases</Text>
          </Pressable>
          <Pressable testID="pro-dismiss" onPress={() => setIapModal(null)} disabled={iapPurchasing} style={{ padding: 12 }}>
            <Text style={{ color: '#ddd', textAlign: 'center' }}>Not now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
