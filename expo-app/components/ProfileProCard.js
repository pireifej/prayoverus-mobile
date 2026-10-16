import React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';

export default function ProfileProCard({
  isPro,
  price,
  upgradeLoading,
  restoreLoading,
  actionMessage,
  onUpgrade,
  onRestore,
}) {
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';

  return (
    <View style={{
      backgroundColor: '#1e1b4b',
      borderRadius: 20,
      padding: 20,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: 'rgba(251, 191, 36, 0.35)',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={{
          width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(251,191,36,0.16)',
          alignItems: 'center', justifyContent: 'center', marginRight: 12,
        }}>
          <Text style={{ fontSize: 20 }}>✨</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 19, fontWeight: '800' }}>Pray Over Us Pro</Text>
          <Text style={{ color: '#fcd34d', fontSize: 12, fontWeight: '700', marginTop: 2 }}>
            {isPro ? 'YOUR SUBSCRIPTION IS ACTIVE' : price ? `MONTHLY · ${price}` : 'GO DEEPER IN PRAYER'}
          </Text>
        </View>
      </View>

      <Text style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 21, marginBottom: 16 }}>
        Unlimited prayer requests, full Daily Bread readings and audio, and guided Prayer Walk.
      </Text>

      {!isPro && (
        <Pressable
          testID="profile-upgrade-pro"
          accessibilityRole="button"
          accessibilityState={{ disabled: upgradeLoading }}
          disabled={upgradeLoading}
          onPress={onUpgrade}
          style={({ pressed }) => ({
            minHeight: 50, borderRadius: 14, backgroundColor: '#fbbf24',
            alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
            opacity: pressed || upgradeLoading ? 0.82 : 1,
          })}
        >
          {upgradeLoading ? (
            <>
              <ActivityIndicator color="#1e1b4b" size="small" />
              <Text style={{ color: '#1e1b4b', fontWeight: '800', marginLeft: 9 }}>
                Checking monthly plan…
              </Text>
            </>
          ) : (
            <Text style={{ color: '#1e1b4b', fontWeight: '800', fontSize: 16 }}>Upgrade to Pro</Text>
          )}
        </Pressable>
      )}

      <Pressable
        testID="profile-restore-purchases"
        accessibilityRole="button"
        accessibilityState={{ disabled: restoreLoading }}
        disabled={restoreLoading}
        onPress={onRestore}
        style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 4 }}
      >
        {restoreLoading && <ActivityIndicator color="#fcd34d" size="small" />}
        <Text style={{ color: '#fde68a', fontSize: 14, fontWeight: '700', marginLeft: restoreLoading ? 8 : 0 }}>
          {restoreLoading ? 'Checking purchases…' : 'Restore purchases'}
        </Text>
      </Pressable>

      {!!actionMessage && (
        <Text accessibilityRole="alert" testID="profile-billing-message" style={{
          color: '#fff', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10,
          padding: 10, marginTop: 6, fontSize: 13, lineHeight: 18, textAlign: 'center',
        }}>
          {actionMessage}
        </Text>
      )}

      <Text style={{ color: '#c7d2fe', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 8 }}>
        {isPro
          ? `Manage your subscription through the ${storeName}.`
          : `Monthly subscription. Cancel anytime in ${storeName} settings.`}
      </Text>
    </View>
  );
}
