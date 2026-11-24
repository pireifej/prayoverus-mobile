jest.mock('../../services/purchasesClient', () => ({
  client: {
    getCustomerInfo: jest.fn(), getOfferings: jest.fn(), purchasePackage: jest.fn(),
    restorePurchases: jest.fn(), getAppUserID: jest.fn(), logIn: jest.fn(),
  },
  isAvailable: true,
}));
jest.mock('../../services/userSession', () => ({
  getUserSessionToken: jest.fn().mockResolvedValue('session'),
  setRevenueCatAppUserId: jest.fn(),
}));
jest.mock('../../services/api', () => ({
  apiGetSubscriptionIdentity: jest.fn(), apiGetProStatus: jest.fn(), apiGetAccessPolicy: jest.fn(),
}));
jest.mock('../../AppModals', () => ({ showToast: jest.fn(), showModal: jest.fn() }));

import { act, renderHook } from '@testing-library/react-native';
import { AppState } from 'react-native';
import { useIap, PRO_ENTITLEMENT } from '../../hooks/useIap';
import { client } from '../../services/purchasesClient';
import { apiGetSubscriptionIdentity, apiGetProStatus, apiGetAccessPolicy } from '../../services/api';
import { getUserSessionToken } from '../../services/userSession';
import { showModal, showToast } from '../../AppModals';

const ID = 'pou_v1_account42';
const identity = (id = ID) => ({ revenuecatAppUserId: id, entitlement: PRO_ENTITLEMENT, requiresSdkLogin: true });
const status = (isPro = false, extra = {}) => ({
  ...identity(), isPro, identityVerificationRequired: false, ...extra,
});
const policy = enabled => ({
  contentPaywallEnabled: enabled, dailyBread: { requiresPro: enabled },
  prayerWalk: { requiresPro: enabled }, extendedPrayer: { requiresPro: true },
});
const info = (paid = false) => ({
  entitlements: { active: paid ? { [PRO_ENTITLEMENT]: { isActive: true } } : {} },
  allPurchasedProductIdentifiers: paid ? ['monthly'] : [],
});
const monthly = {
  identifier: '$rc_monthly', packageType: 'MONTHLY',
  product: { identifier: 'pro_monthly', priceString: '€9,99' },
};
let sdkId;
let onForeground;
beforeEach(() => {
  jest.resetAllMocks();
  sdkId = '$RCAnonymousID:empty';
  getUserSessionToken.mockResolvedValue('session');
  apiGetSubscriptionIdentity.mockResolvedValue(identity());
  apiGetProStatus.mockResolvedValue(status());
  apiGetAccessPolicy.mockResolvedValue(policy(false));
  client.getAppUserID.mockImplementation(async () => sdkId);
  client.logIn.mockImplementation(async id => { sdkId = id; return { customerInfo: info() }; });
  client.getCustomerInfo.mockResolvedValue(info());
  client.getOfferings.mockResolvedValue({ current: { identifier: 'live-offering', availablePackages: [monthly] } });
  client.purchasePackage.mockResolvedValue({ customerInfo: info(true) });
  client.restorePurchases.mockResolvedValue(info(true));
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_, callback) => {
    onForeground = callback;
    return { remove: jest.fn() };
  });
});
afterEach(() => jest.restoreAllMocks());

async function start() {
  const hook = renderHook(() => useIap());
  await act(async () => { await hook.result.current.identifyRevenueCatUser('42'); });
  return hook;
}

test('uses backend status, not even an active anonymous SDK entitlement, to grant Pro', async () => {
  client.getCustomerInfo.mockResolvedValue(info(true));
  const { result } = await start();
  expect(result.current.isPro).toBe(false);
  expect(client.logIn).not.toHaveBeenCalled();
  expect(apiGetSubscriptionIdentity).toHaveBeenCalledWith();
  expect(apiGetProStatus).toHaveBeenCalledWith({ revenuecatAppUserId: ID, refresh: true });
  expect(result.current.getIapPrice()).toBe('€9,99');
  expect(result.current.iapOffering.identifier).toBe('live-offering');
});

test('accepts verified backend complimentary Pro even without SDK entitlement', async () => {
  apiGetProStatus.mockResolvedValue(status(true));
  const { result } = await start();
  expect(result.current.isPro).toBe(true);
  expect(result.current.hasEntitlement(PRO_ENTITLEMENT)).toBe(true);
  expect(result.current.hasEntitlement('another-entitlement')).toBe(false);
});

test('free access follows policy without pretending the account is Pro', async () => {
  const { result } = await start();
  expect(result.current.isPro).toBe(false);
  expect(result.current.canAccessFeature('dailyBread')).toBe(true);
  expect(result.current.canAccessFeature('prayerWalk')).toBe(true);
  expect(result.current.canAccessFeature('extendedPrayer')).toBe(false);
  apiGetAccessPolicy.mockResolvedValue(policy(true));
  await act(async () => { await result.current.refreshAccessPolicy(); });
  expect(result.current.canAccessFeature('dailyBread')).toBe(false);
  expect(result.current.canAccessFeature('prayerWalk')).toBe(false);
  apiGetProStatus.mockResolvedValue(status(true));
  await act(async () => { await result.current.refreshProStatus(); });
  expect(result.current.canAccessFeature('dailyBread')).toBe(true);
});

test('policy succeeds independently of a subscription outage; unknown policy requires retry', async () => {
  apiGetProStatus.mockRejectedValue(new Error('unavailable'));
  const { result } = await start();
  expect(result.current.canAccessFeature('dailyBread')).toBe(true);
  expect(result.current.isPro).toBe(false);
  apiGetAccessPolicy.mockRejectedValue(new Error('unavailable'));
  await act(async () => { await result.current.refreshAccessPolicy(); });
  expect(result.current.canAccessFeature('dailyBread')).toBeNull();
  expect(result.current.accessError).toContain('try again');
  expect(showModal).not.toHaveBeenCalled();
});

test('does not default malformed policy or status responses to paid/free access', async () => {
  apiGetAccessPolicy.mockResolvedValue({});
  apiGetProStatus.mockResolvedValue({ isPro: true });
  const { result } = await start();
  expect(result.current.canAccessFeature('dailyBread')).toBeNull();
  expect(result.current.isPro).toBe(false);
});

test('opens the current monthly package without logging into an SDK customer', async () => {
  const { result } = await start();
  await act(async () => { await result.current.presentProPaywall(); });
  expect(result.current.iapModal.package).toEqual(monthly);
  expect(client.logIn).not.toHaveBeenCalled();
});

test('identifies SDK only with server identity, before purchase, then verifies backend', async () => {
  const { result } = await start();
  client.purchasePackage.mockImplementation(async () => {
    expect(client.logIn).toHaveBeenCalledWith(ID);
    expect(sdkId).toBe(ID);
    apiGetProStatus.mockResolvedValue(status(true));
    return { customerInfo: info(true) };
  });
  const onSuccess = jest.fn();
  let outcome;
  await act(async () => { outcome = await result.current.doIapPurchase(monthly, onSuccess); });
  expect(outcome.status).toBe('purchased');
  expect(result.current.isPro).toBe(true);
  expect(onSuccess).toHaveBeenCalledTimes(1);
  expect(apiGetProStatus).toHaveBeenLastCalledWith({ revenuecatAppUserId: ID, refresh: true });
});

test('distinguishes store success from backend verification failure without telling user to rebuy', async () => {
  const { result } = await start();
  client.purchasePackage.mockImplementation(async () => {
    apiGetProStatus.mockRejectedValue(new Error('backend unavailable'));
    return { customerInfo: info(true) };
  });
  const onSuccess = jest.fn();
  let outcome;
  await act(async () => { outcome = await result.current.doIapPurchase(monthly, onSuccess); });
  expect(outcome.status).toBe('pending');
  expect(outcome.message).toContain('Do not purchase again');
  expect(onSuccess).not.toHaveBeenCalled();
  expect(result.current.isPro).toBe(false);
});

test('restores only after server identity login and grants access only after verification', async () => {
  const { result } = await start();
  client.restorePurchases.mockImplementation(async () => {
    expect(sdkId).toBe(ID);
    apiGetProStatus.mockResolvedValue(status(true));
    return info(true);
  });
  let outcome;
  await act(async () => { outcome = await result.current.doIapRestore(); });
  expect(outcome.status).toBe('restored');
  expect(result.current.isPro).toBe(true);
});

test('reports no subscription only after a verified restore with no purchase history', async () => {
  const { result } = await start();
  client.restorePurchases.mockResolvedValue(info());
  let outcome;
  await act(async () => { outcome = await result.current.doIapRestore(); });
  expect(outcome.status).toBe('none');
});

test.each([403, 409])('blocks billing on identity mismatch HTTP %s without SDK relinking', async code => {
  const { result } = await start();
  apiGetProStatus.mockRejectedValue({ status: code, code: 'SUBSCRIPTION_IDENTITY_MISMATCH' });
  await act(async () => { await result.current.doIapRestore(); });
  expect(client.logIn).not.toHaveBeenCalled();
  expect(client.restorePurchases).not.toHaveBeenCalled();
  expect(result.current.subscriptionMessage).toBeTruthy();
});

test('blocks ownership-required accounts from repeat purchase or automatic restore', async () => {
  apiGetProStatus.mockResolvedValue(status(false, { identityVerificationRequired: true }));
  const { result } = await start();
  await act(async () => {
    await result.current.presentProPaywall();
    await result.current.doIapPurchase(monthly);
    await result.current.doIapRestore();
  });
  expect(client.logIn).not.toHaveBeenCalled();
  expect(client.purchasePackage).not.toHaveBeenCalled();
  expect(client.restorePurchases).not.toHaveBeenCalled();
  expect(result.current.isPro).toBe(false);
});

test.each(['$RCAnonymousID:legacy', '42'])('does not alias purchased legacy SDK identity %s', async currentId => {
  const { result } = await start();
  sdkId = currentId;
  client.getCustomerInfo.mockResolvedValue(info(true));
  await act(async () => { await result.current.doIapPurchase(monthly); });
  expect(client.logIn).not.toHaveBeenCalled();
  expect(client.purchasePackage).not.toHaveBeenCalled();
  expect(result.current.subscriptionMessage).toContain('ownership');
});

test('a cancelled checkout produces no error and does not grant Pro', async () => {
  const { result } = await start();
  client.purchasePackage.mockRejectedValue({ userCancelled: true });
  await act(async () => { await result.current.doIapPurchase(monthly); });
  expect(showModal).not.toHaveBeenCalled();
  expect(result.current.isPro).toBe(false);
  expect(result.current.iapPurchasing).toBe(false);
});

test('shows a genuine payment failure without granting Pro', async () => {
  const { result } = await start();
  client.purchasePackage.mockRejectedValue(new Error('Payment declined'));
  await act(async () => { await result.current.doIapPurchase(monthly); });
  expect(showModal).toHaveBeenCalledWith(expect.objectContaining({ message: 'Payment declined' }));
  expect(result.current.isPro).toBe(false);
});

test('serializes duplicate purchase taps', async () => {
  const { result } = await start();
  let resolvePurchase;
  client.purchasePackage.mockReturnValue(new Promise(resolve => { resolvePurchase = resolve; }));
  let first;
  await act(async () => {
    first = result.current.doIapPurchase(monthly);
    expect((await result.current.doIapPurchase(monthly)).status).toBe('busy');
  });
  expect(client.purchasePackage).toHaveBeenCalledTimes(1);
  await act(async () => { resolvePurchase({ customerInfo: info() }); await first; });
});

test('foreground refresh checks policy and backend status with refresh true', async () => {
  const { result } = await start();
  apiGetProStatus.mockResolvedValue(status(true));
  apiGetAccessPolicy.mockResolvedValue(policy(true));
  await act(async () => { onForeground('active'); });
  expect(result.current.isPro).toBe(true);
  expect(apiGetProStatus).toHaveBeenLastCalledWith({ revenuecatAppUserId: ID, refresh: true });
  expect(apiGetAccessPolicy).toHaveBeenCalledTimes(2);
});

test('account reset clears Pro immediately and discards late status/policy responses', async () => {
  apiGetProStatus.mockResolvedValue(status(true));
  const { result } = await start();
  let resolveStatus, resolvePolicy;
  apiGetProStatus.mockReturnValue(new Promise(resolve => { resolveStatus = resolve; }));
  apiGetAccessPolicy.mockReturnValue(new Promise(resolve => { resolvePolicy = resolve; }));
  let pending;
  await act(async () => { pending = result.current.refreshSubscriptionAccess(); });
  await act(async () => { await result.current.resetRevenueCatUser(); });
  expect(result.current.isPro).toBe(false);
  await act(async () => { resolveStatus(status(true)); resolvePolicy(policy(false)); await pending; });
  expect(result.current.isPro).toBe(false);
  expect(result.current.canAccessFeature('dailyBread')).toBeNull();
});

test('a store result completing after account switching cannot grant access or call success', async () => {
  const { result } = await start();
  let resolvePurchase;
  client.purchasePackage.mockReturnValue(new Promise(resolve => { resolvePurchase = resolve; }));
  const onSuccess = jest.fn();
  let pending;
  await act(async () => { pending = result.current.doIapPurchase(monthly, onSuccess); });
  await act(async () => {
    await result.current.resetRevenueCatUser();
    apiGetSubscriptionIdentity.mockResolvedValue(identity('pou_v1_account99'));
    apiGetProStatus.mockResolvedValue(status(false, { revenuecatAppUserId: 'pou_v1_account99' }));
    await result.current.identifyRevenueCatUser('99');
  });
  await act(async () => { resolvePurchase({ customerInfo: info(true) }); await pending; });
  expect(result.current.isPro).toBe(false);
  expect(onSuccess).not.toHaveBeenCalled();
  expect(showToast).not.toHaveBeenCalled();
});
