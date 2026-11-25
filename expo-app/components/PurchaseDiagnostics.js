import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const flag = value => typeof value === 'boolean' ? String(value) : 'Not checked';

export default function PurchaseDiagnostics({
  sdk, backend, serverId, loading, billingBusy, onRead, theme = {},
}) {
  const [expanded, setExpanded] = useState(false);
  const disabled = loading || billingBusy;
  const row = (label, value) => (
    <Text selectable style={[theme.body, styles.row]}>{label}: {value || 'Not reported'}</Text>
  );
  return (
    <View style={theme.container} testID="purchase-diagnostics">
      <Pressable testID="toggle-purchase-diagnostics" accessibilityRole="button"
        accessibilityState={{ expanded }} style={styles.button}
        onPress={() => setExpanded(value => !value)}>
        <Text style={theme.button}>{expanded ? 'Hide purchase diagnostics' : 'Purchase diagnostics'}</Text>
      </Pressable>
      {expanded && (
        <View testID="purchase-diagnostics-details">
          <Text style={[theme.body, styles.row]}>
            Read-only support information. Reading this does not purchase, restore, or move anything.
            Device information may be cached. IDs identify your account; share only with support.
          </Text>
          {row('Backend-issued RevenueCat ID', serverId)}
          {row('Backend check observed', backend?.checkedAt)}
          {backend?.state === 'success' ? (
            <>
              {row('Backend isPro', flag(backend.isPro))}
              {row('Backend identityVerificationRequired', flag(backend.identityVerificationRequired))}
              {row('Backend reason', backend.reason)}
            </>
          ) : row('Backend status', backend?.message || 'Not checked in this session')}
          <Text style={[theme.body, styles.row]}>
            These are the latest membership-check results observed by this app, not a new backend lookup.
          </Text>
          <Pressable testID="read-purchase-diagnostics" accessibilityRole="button"
            accessibilityState={{ disabled }} disabled={disabled}
            style={styles.button} onPress={onRead}>
            <Text style={theme.button}>{loading ? 'Reading device information…' : 'Read device purchase information'}</Text>
          </Pressable>
          {billingBusy && <Text style={theme.body}>Finish the current store action first.</Text>}
          {sdk?.state === 'success' && (
            <>
              {row('Device SDK RevenueCat ID', sdk.sdkId)}
              {row('SDK ID matches backend ID', serverId ? flag(sdk.sdkId === serverId) : 'Backend ID unavailable')}
              {row('SDK original customer ID', sdk.originalAppUserId)}
              {row('Device information read', sdk.checkedAt)}
              {row('SDK customer information date', sdk.requestDate)}
              {!sdk.products.length && <Text style={theme.body}>No purchase history reported by SDK.</Text>}
              {sdk.products.map((product, index) => (
                <View key={`${product.product}-${index}`} style={styles.product}>
                  {row('Product', product.product)}
                  {row('Environment', product.environment)}
                  {row('Store', product.store)}
                  {row('Active subscription / entitlement', flag(product.active))}
                  {row('Expiration (UTC)', product.expiration || 'No expiration reported')}
                </View>
              ))}
            </>
          )}
          {sdk?.state === 'error' && <Text accessibilityRole="alert" style={theme.body}>{sdk.message}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, justifyContent: 'center', paddingVertical: 10 },
  row: { fontSize: 13, lineHeight: 20, marginBottom: 8, flexShrink: 1 },
  product: { marginTop: 12, paddingTop: 8 },
});
