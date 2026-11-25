import { summarizePurchaseInfo, summarizeBackendStatus } from '../../utils/purchaseDiagnostics';

test('allowlists expired sandbox purchase details without transaction or account secrets', () => {
  const result = summarizePurchaseInfo({
    originalAppUserId: '353', requestDate: '2026-11-25T16:00:00Z',
    allPurchasedProductIdentifiers: ['monthly'], activeSubscriptions: [],
    subscriptionsByProductIdentifier: {
      monthly: {
        isSandbox: true, store: 'PLAY_STORE', expiresDate: '2026-10-22T17:17:49Z',
        storeTransactionId: 'private-transaction',
      },
    },
    attributes: { email: 'private-email' }, receipt: 'secret-receipt',
    nonSubscriptionTransactions: [{ productIdentifier: 'single', transactionIdentifier: 'secret-token' }],
  });
  expect(result.products[0]).toEqual({
    product: 'monthly', environment: 'Sandbox / test', store: 'PLAY_STORE',
    expiration: '2026-10-22T17:17:49.000Z', active: false,
  });
  expect(result.products[1].environment).toBe('Not reported by SDK');
  expect(JSON.stringify(result)).not.toMatch(/secret|private/);
});

test('uses entitlement details when subscription metadata is unavailable', () => {
  expect(summarizePurchaseInfo({
    entitlements: { all: { Pro: {
      productIdentifier: 'monthly', isSandbox: false, isActive: true,
      expirationDate: '2026-12-25T00:00:00Z', store: 'APP_STORE',
    } } },
  }).products[0]).toEqual({
    product: 'monthly', environment: 'Production', store: 'APP_STORE',
    expiration: '2026-12-25T00:00:00.000Z', active: true,
  });
  expect(summarizePurchaseInfo(null).products).toEqual([]);
  expect(summarizePurchaseInfo({
    allPurchasedProductIdentifiers: ['unknown'],
    allExpirationDates: { unknown: 'not-a-date' },
  }).products[0].expiration).toBeNull();
});

test('only reports allowlisted backend flags and a safe reason code', () => {
  expect(summarizeBackendStatus({
    isPro: false, identityVerificationRequired: true, reason: 'account_binding_required',
    token: 'private-token', rawResponse: {},
  })).toEqual({
    state: 'success', checkedAt: expect.any(String), isPro: false,
    identityVerificationRequired: true, reason: 'account_binding_required',
  });
  expect(summarizeBackendStatus({ reason: 'unexpected sensitive message' }).reason).toBeNull();
});
