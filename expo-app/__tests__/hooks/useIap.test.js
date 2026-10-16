/**
 * RevenueCat Pro subscription contract.
 *
 * The app has one entitlement and reads the monthly package from the current
 * offering. No feature-specific products or entitlements belong in this test.
 */
jest.mock('../../services/purchasesClient', () => ({
  __esModule: true,
  client: {
    getCustomerInfo: jest.fn(),
    getOfferings: jest.fn(),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    getAppUserID: jest.fn().mockResolvedValue('42'),
    logIn: jest.fn(),
  },
  isAvailable: true,
}));

jest.mock('../../AppModals', () => ({
  __esModule: true,
  showToast: jest.fn(),
  showModal: jest.fn(),
}));

import { renderHook, act } from '@testing-library/react-native';
import { useIap, PRO_ENTITLEMENT } from '../../hooks/useIap';

let mockClient;
let mockShowModal;

beforeAll(() => {
  mockClient = require('../../services/purchasesClient').client;
  mockShowModal = require('../../AppModals').showModal;
});

beforeEach(() => jest.clearAllMocks());

const makeCustomerInfo = (activeEntitlements = []) => ({
  entitlements: {
    active: Object.fromEntries(
      activeEntitlements.map(identifier => [identifier, { identifier, isActive: true }]),
    ),
  },
});

const makePackage = (identifier = '$rc_monthly', priceString = '$9.99') => ({
  identifier,
  packageType: 'MONTHLY',
  product: { identifier: 'pray_over_us_pro_monthly', priceString, title: 'Pray Over Us Pro' },
});

const makeOfferings = (monthly = makePackage()) => ({
  current: { identifier: 'default', availablePackages: monthly ? [monthly] : [] },
});

async function loadDefault(result, customerInfo = makeCustomerInfo([]), monthly = makePackage()) {
  mockClient.logIn.mockResolvedValue({ customerInfo });
  await act(async () => { await result.current.identifyRevenueCatUser('42'); });
  mockClient.getCustomerInfo.mockResolvedValue(customerInfo);
  mockClient.getOfferings.mockResolvedValue(makeOfferings(monthly));
  await act(async () => { await result.current.loadIapData(); });
}

describe('useIap — Pro entitlement and offering', () => {
  it('does not grant Pro from anonymous or inactive customer data', async () => {
    const { result } = renderHook(() => useIap());
    mockClient.getCustomerInfo.mockResolvedValue(makeCustomerInfo([PRO_ENTITLEMENT]));
    mockClient.getOfferings.mockResolvedValue(makeOfferings());
    await act(async () => { await result.current.loadIapData(); });
    expect(result.current.isPro).toBe(false);
    const inactive = makeCustomerInfo([PRO_ENTITLEMENT]);
    inactive.entitlements.active[PRO_ENTITLEMENT].isActive = false;
    await loadDefault(result, inactive);
    expect(result.current.isPro).toBe(false);
  });

  it('discards a previous customer load that resolves after account switching', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result);
    let resolveOld;
    mockClient.getCustomerInfo.mockReturnValueOnce(new Promise(resolve => { resolveOld = resolve; }));
    let pending;
    await act(async () => { pending = result.current.loadIapData(); });
    mockClient.getAppUserID.mockResolvedValueOnce('99');
    mockClient.logIn.mockResolvedValueOnce({ customerInfo: makeCustomerInfo([]) });
    await act(async () => { await result.current.identifyRevenueCatUser('99'); });
    await act(async () => { resolveOld(makeCustomerInfo([PRO_ENTITLEMENT])); await pending; });
    expect(result.current.isPro).toBe(false);
  });
  it('uses the exact active Pro entitlement for isPro', async () => {
    const { result } = renderHook(() => useIap());
    expect(result.current.isPro).toBe(false);

    await loadDefault(result, makeCustomerInfo([PRO_ENTITLEMENT]));

    expect(result.current.isPro).toBe(true);
    expect(result.current.hasEntitlement(PRO_ENTITLEMENT)).toBe(true);
    expect(result.current.proPackage.packageType).toBe('MONTHLY');
  });

  it('does not unlock Pro for a different entitlement name', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result, makeCustomerInfo(['premium_themes']));

    expect(result.current.isPro).toBe(false);
    expect(result.current.hasEntitlement(PRO_ENTITLEMENT)).toBe(false);
  });

  it('loads the current offering and exposes the monthly package price', async () => {
    const monthly = makePackage('$rc_monthly', '$9.99');
    const { result } = renderHook(() => useIap());
    await loadDefault(result, makeCustomerInfo([]), monthly);

    expect(mockClient.getCustomerInfo).toHaveBeenCalledTimes(1);
    expect(mockClient.getOfferings).toHaveBeenCalledTimes(1);
    expect(result.current.iapOffering.identifier).toBe('default');
    expect(result.current.getIapPrice()).toBe('$9.99');
    expect(result.current.getIapPrice(monthly)).toBe('$9.99');
  });

  it('opens one Pro paywall using the current monthly package', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result);

    const onSuccess = jest.fn();
    await act(async () => { await result.current.presentProPaywall(onSuccess); });

    expect(result.current.iapModal).toEqual(expect.objectContaining({
      title: 'Pray Over Us Pro',
      package: result.current.proPackage,
      onSuccess,
    }));
  });

  it('shows an unavailable message when the offering has no monthly package', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result, makeCustomerInfo([]), null);

    await act(async () => { await result.current.presentProPaywall(); });

    expect(mockShowModal).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Pray Over Us Pro',
      message: expect.stringContaining('temporarily unavailable'),
    }));
  });
});

describe('useIap — purchase and restore', () => {
  it('purchases the selected monthly package and fires the success callback', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result);
    const updatedInfo = makeCustomerInfo([PRO_ENTITLEMENT]);
    mockClient.getCustomerInfo.mockResolvedValue(updatedInfo);
    mockClient.purchasePackage.mockResolvedValue({ customerInfo: updatedInfo });
    const onSuccess = jest.fn();

    await act(async () => {
      await result.current.doIapPurchase(result.current.proPackage, onSuccess);
    });

    expect(mockClient.purchasePackage).toHaveBeenCalledWith(result.current.proPackage);
    expect(result.current.isPro).toBe(true);
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(result.current.iapPurchasing).toBe(false);
  });

  it('does not show an error when the user cancels', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result);
    mockClient.purchasePackage.mockRejectedValue({ userCancelled: true });

    await act(async () => { await result.current.doIapPurchase(); });

    expect(mockShowModal).not.toHaveBeenCalled();
    expect(result.current.iapPurchasing).toBe(false);
  });

  it('shows a failure modal when RevenueCat rejects the purchase', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result);
    mockClient.purchasePackage.mockRejectedValue(new Error('Payment declined'));

    await act(async () => { await result.current.doIapPurchase(); });

    expect(mockShowModal).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Purchase failed',
      message: 'Payment declined',
    }));
    expect(result.current.iapPurchasing).toBe(false);
  });

  it('restores purchases and updates the entitlement state', async () => {
    const { result } = renderHook(() => useIap());
    await loadDefault(result);
    const restoredInfo = makeCustomerInfo([PRO_ENTITLEMENT]);
    mockClient.getCustomerInfo.mockResolvedValue(restoredInfo);
    mockClient.restorePurchases.mockResolvedValue(restoredInfo);

    await act(async () => { await result.current.doIapRestore(); });

    expect(mockClient.restorePurchases).toHaveBeenCalledTimes(1);
    expect(result.current.isPro).toBe(true);
    expect(result.current.iapPurchasing).toBe(false);
  });
});