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
  onVerify,
  verificationLoading = false,
  onManage,
  billingBlocked = false,
  contentIsFree = false,
}) {
  const storeName = Platform.OS === 'ios' ? 'App Store' : 'Google Play';
  const upgradeDisabled = !!upgradeLoading || !!billingBlocked;
  const restoreDisabled = !!restoreLoading || !!billingBlocked;

  return (
    <View
      testID="profile-pro-section"
      accessibilityLabel="Pray Over Us Pro membership"
      style={{
        marginTop: 20,
        marginBottom: 20,
        padding: 5,
        borderRadius: 25,
        backgroundColor: '#f3eedc',
        borderWidth: 1,
        borderColor: '#e4d9b7',
      }}
    >
      <View
        testID="profile-pro-banner"
        style={{
          backgroundColor: '#1e1b4b',
          borderRadius: 20,
          paddingHorizontal: 20,
          paddingTop: 20,
          paddingBottom: 14,
          borderWidth: 1,
          borderColor: 'rgba(251, 191, 36, 0.5)',
          overflow: 'hidden',
        }}
      >
        <View style={{
          height: 3,
          width: 44,
          borderRadius: 2,
          backgroundColor: '#fbbf24',
          marginBottom: 16,
        }} />

        <View style={{ marginBottom: 12 }}>
          <Text style={{
            color: '#fcd34d',
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 1.2,
            marginBottom: 5,
          }}>
            PRAY OVER US · MEMBERSHIP
          </Text>
          <Text style={{
            color: '#fff',
            fontSize: 22,
            lineHeight: 28,
            fontWeight: '800',
            flexShrink: 1,
          }}>
            Pray Over Us Pro
          </Text>
          <Text style={{
            color: '#fcd34d',
            fontSize: 13,
            lineHeight: 19,
            fontWeight: '700',
            marginTop: 4,
          }}>
            {isPro ? 'YOUR PRO MEMBERSHIP IS ACTIVE' : price ? `MONTHLY · ${price}` : 'GO DEEPER IN PRAYER'}
          </Text>
        </View>

        <Text style={{ color: '#e2e8f0', fontSize: 15, lineHeight: 23, marginBottom: 18 }}>
          {contentIsFree
            ? 'Unlimited prayer requests, Deepen Prayer, and premium themes. Daily Bread and Prayer Walk are currently available to all signed-in members.'
            : 'Unlimited prayer requests, full Daily Bread readings and audio, and guided Prayer Walk.'}
        </Text>

        {!isPro && (
          <Pressable
            testID="profile-upgrade-pro"
            accessibilityRole="button"
            accessibilityState={{ disabled: upgradeDisabled }}
            disabled={upgradeDisabled}
            onPress={onUpgrade}
            style={({ pressed }) => ({
              minHeight: 54,
              borderRadius: 14,
              backgroundColor: '#fbbf24',
              paddingHorizontal: 14,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              opacity: pressed || upgradeDisabled ? 0.82 : 1,
            })}
          >
            {upgradeLoading ? (
              <>
                <ActivityIndicator color="#1e1b4b" size="small" />
                <Text style={{ color: '#1e1b4b', fontWeight: '800', marginLeft: 9, fontSize: 16, textAlign: 'center' }}>
                  Checking monthly plan…
                </Text>
              </>
            ) : (
              <Text style={{ color: '#1e1b4b', fontWeight: '800', fontSize: 16, textAlign: 'center' }}>
                Upgrade to Pro
              </Text>
            )}
          </Pressable>
        )}

        <Pressable
          testID="profile-restore-purchases"
          accessibilityRole="button"
          accessibilityState={{ disabled: restoreDisabled }}
          disabled={restoreDisabled}
          onPress={onRestore}
          style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', marginTop: 5, opacity: restoreDisabled ? 0.65 : 1 }}
        >
          {restoreLoading && <ActivityIndicator color="#fcd34d" size="small" />}
          <Text style={{ color: '#fde68a', fontSize: 14, lineHeight: 20, fontWeight: '700', marginLeft: restoreLoading ? 8 : 0, textAlign: 'center' }}>
            {restoreLoading ? 'Checking purchases…' : 'Restore purchases'}
          </Text>
        </Pressable>

        {!!onVerify && (
          <Pressable
            testID="profile-verify-membership"
            accessibilityRole="button"
            accessibilityState={{ disabled: !!verificationLoading }}
            disabled={!!verificationLoading}
            onPress={onVerify}
            style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }}
          >
            {verificationLoading && <ActivityIndicator color="#fcd34d" size="small" />}
            <Text style={{ color: '#fde68a', fontSize: 14, lineHeight: 20, fontWeight: '700', marginLeft: verificationLoading ? 8 : 0, textAlign: 'center' }}>
              {verificationLoading ? 'Verifying membership…' : 'Retry membership verification'}
            </Text>
          </Pressable>
        )}

        {!!onManage && (
          <Pressable
            testID="profile-manage-subscription"
            accessibilityRole="button"
            onPress={onManage}
            style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ color: '#fde68a', fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' }}>
              Manage subscription
            </Text>
          </Pressable>
        )}

        {!!actionMessage && (
          <Text accessibilityRole="alert" testID="profile-billing-message" style={{
            color: '#fff',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: 12,
            marginTop: 6,
            fontSize: 14,
            lineHeight: 20,
            textAlign: 'center',
          }}>
            {actionMessage}
          </Text>
        )}

        <Text style={{ color: '#c7d2fe', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9 }}>
          {isPro
            ? `Manage your subscription through the ${storeName}.`
            : `Monthly subscription. Cancel anytime in ${storeName} settings.`}
        </Text>
      </View>
    </View>
  );
}
