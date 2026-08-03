/**
 * useIap unit tests
 *
 * Covers the three IAP-path assertions from the hook-split smoke plan:
 *   1. getIapPrice returns correctly for a loaded product
 *   2. hasEntitlement / isThemeUnlocked reflect customerInfo correctly
 *   3. doIapPurchase finds the product, calls the SDK, updates state,
 *      and handles cancel / error without crashing
 *
 * Mock strategy: jest.mock factories are hoisted by babel ABOVE variable
 * declarations, so any outer `const mockPurchases = {...}` would be undefined
 * when the factory runs. Instead, we create jest.fn() instances INSIDE the
 * factory and retrieve references via require() in beforeAll.
 */

// ── purchasesClient mock ──────────────────────────────────────────────────────
// jest.mock is hoisted before any variable assignment, so jest.fn() instances
// must be created inside the factory — NOT from an outer variable.
jest.mock('../../services/purchasesClient', () => ({
  __esModule: true,
  client: {
    getCustomerInfo:      jest.fn(),
    getProducts:          jest.fn(),
    purchaseStoreProduct: jest.fn(),
    restorePurchases:     jest.fn(),
  },
  isAvailable: true,
}));

jest.mock('../../AppModals', () => ({
  __esModule: true,
  showToast: jest.fn(),
  showModal:  jest.fn(),
}));

import { renderHook, act } from '@testing-library/react-native';
import {
  useIap,
  ENTITLEMENT_EXTENDED_PRAYER,
  ENTITLEMENT_PREMIUM_THEMES,
  PRODUCT_EXTENDED_PRAYER,
  THEME_PRODUCTS,
} from '../../hooks/useIap';

// ── Shared mock references ────────────────────────────────────────────────────
// Retrieved after module mock is applied so we get the same instances
// that useIap.js imported.

let mockClient;
let mockShowModal;

beforeAll(() => {
  mockClient   = require('../../services/purchasesClient').client;
  mockShowModal = require('../../AppModals').showModal;
});

beforeEach(() => jest.clearAllMocks());

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeCustomerInfo = (activeEntitlementKeys = []) => ({
  entitlements: {
    active: Object.fromEntries(
      activeEntitlementKeys.map(k => [k, { identifier: k }]),
    ),
  },
});

const makeProduct = (identifier, priceString) => ({ identifier, priceString });

// ── getIapPrice ───────────────────────────────────────────────────────────────

describe('useIap — getIapPrice', () => {
  it('returns the priceString when the product is in iapProducts', async () => {
    mockClient.getCustomerInfo.mockResolvedValue(makeCustomerInfo([]));
    mockClient.getProducts.mockResolvedValue([
      makeProduct(PRODUCT_EXTENDED_PRAYER, '$1.99'),
    ]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(result.current.getIapPrice(PRODUCT_EXTENDED_PRAYER)).toBe('$1.99');
  });

  it('returns null before any products are loaded', () => {
    const { result } = renderHook(() => useIap());
    expect(result.current.getIapPrice(PRODUCT_EXTENDED_PRAYER)).toBeNull();
  });

  it('returns null when the loaded list does not include the queried id', async () => {
    mockClient.getCustomerInfo.mockResolvedValue(makeCustomerInfo([]));
    mockClient.getProducts.mockResolvedValue([makeProduct('other_product', '$0.99')]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(result.current.getIapPrice(PRODUCT_EXTENDED_PRAYER)).toBeNull();
  });
});

// ── hasEntitlement / isThemeUnlocked ─────────────────────────────────────────

describe('useIap — hasEntitlement / isThemeUnlocked', () => {
  it('hasEntitlement returns false when no customerInfo is loaded', () => {
    const { result } = renderHook(() => useIap());
    expect(result.current.hasEntitlement(ENTITLEMENT_EXTENDED_PRAYER)).toBe(false);
  });

  it('hasEntitlement returns true after loading an active entitlement', async () => {
    mockClient.getCustomerInfo.mockResolvedValue(
      makeCustomerInfo([ENTITLEMENT_EXTENDED_PRAYER]),
    );
    mockClient.getProducts.mockResolvedValue([]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(result.current.hasEntitlement(ENTITLEMENT_EXTENDED_PRAYER)).toBe(true);
    expect(result.current.iapExtendedPrayerUnlocked).toBe(true);
  });

  it('hasEntitlement returns false for a key that is not in the active set', async () => {
    mockClient.getCustomerInfo.mockResolvedValue(
      makeCustomerInfo([ENTITLEMENT_EXTENDED_PRAYER]),
    );
    mockClient.getProducts.mockResolvedValue([]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(result.current.hasEntitlement(ENTITLEMENT_PREMIUM_THEMES)).toBe(false);
  });

  it('isThemeUnlocked returns true with the legacy all-themes entitlement', async () => {
    mockClient.getCustomerInfo.mockResolvedValue(
      makeCustomerInfo([ENTITLEMENT_PREMIUM_THEMES]),
    );
    mockClient.getProducts.mockResolvedValue([]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(result.current.isThemeUnlocked('golden')).toBe(true);
    expect(result.current.isThemeUnlocked('midnight')).toBe(true);
    expect(result.current.iapThemesUnlocked).toBe(true);
  });

  it('isThemeUnlocked is true only for the purchased theme (per-theme entitlement)', async () => {
    mockClient.getCustomerInfo.mockResolvedValue(
      makeCustomerInfo([THEME_PRODUCTS.golden]),
    );
    mockClient.getProducts.mockResolvedValue([]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(result.current.isThemeUnlocked('golden')).toBe(true);
    expect(result.current.isThemeUnlocked('midnight')).toBe(false);
    expect(result.current.isThemeUnlocked('rose')).toBe(false);
  });
});

// ── loadIapData ───────────────────────────────────────────────────────────────

describe('useIap — loadIapData', () => {
  it('calls getCustomerInfo and getProducts, then stores both results', async () => {
    const expectedInfo     = makeCustomerInfo([ENTITLEMENT_EXTENDED_PRAYER]);
    const expectedProducts = [makeProduct(PRODUCT_EXTENDED_PRAYER, '$1.99')];

    mockClient.getCustomerInfo.mockResolvedValue(expectedInfo);
    mockClient.getProducts.mockResolvedValue(expectedProducts);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });

    expect(mockClient.getCustomerInfo).toHaveBeenCalledTimes(1);
    expect(mockClient.getProducts).toHaveBeenCalledTimes(1);
    expect(result.current.iapCustomerInfo).toEqual(expectedInfo);
    expect(result.current.iapProducts).toEqual(expectedProducts);
  });

  it('does not crash when the SDK rejects', async () => {
    mockClient.getCustomerInfo.mockRejectedValue(new Error('network error'));
    mockClient.getProducts.mockRejectedValue(new Error('network error'));

    const { result } = renderHook(() => useIap());

    await expect(
      act(async () => { await result.current.loadIapData(); })
    ).resolves.not.toThrow();

    expect(result.current.iapCustomerInfo).toBeNull();
    expect(result.current.iapProducts).toEqual([]);
  });
});

// ── doIapPurchase ─────────────────────────────────────────────────────────────

describe('useIap — doIapPurchase', () => {
  /** Pre-loads one product into the hook state. */
  async function seedProduct(result, identifier = PRODUCT_EXTENDED_PRAYER, priceString = '$1.99') {
    mockClient.getCustomerInfo.mockResolvedValue(makeCustomerInfo([]));
    mockClient.getProducts.mockResolvedValue([makeProduct(identifier, priceString)]);
    await act(async () => { await result.current.loadIapData(); });
    jest.clearAllMocks(); // reset call counts so purchase-path assertions are clean
  }

  it('calls purchaseStoreProduct with the correct product object', async () => {
    const { result } = renderHook(() => useIap());
    await seedProduct(result);

    mockClient.purchaseStoreProduct.mockResolvedValue({
      customerInfo: makeCustomerInfo([ENTITLEMENT_EXTENDED_PRAYER]),
    });

    await act(async () => {
      await result.current.doIapPurchase(PRODUCT_EXTENDED_PRAYER, jest.fn());
    });

    expect(mockClient.purchaseStoreProduct).toHaveBeenCalledWith(
      makeProduct(PRODUCT_EXTENDED_PRAYER, '$1.99'),
    );
  });

  it('updates customerInfo, closes the modal, and fires onSuccess after purchase', async () => {
    const { result } = renderHook(() => useIap());
    await seedProduct(result);

    const updatedInfo = makeCustomerInfo([ENTITLEMENT_EXTENDED_PRAYER]);
    mockClient.purchaseStoreProduct.mockResolvedValue({ customerInfo: updatedInfo });

    act(() => {
      result.current.setIapModal({ productId: PRODUCT_EXTENDED_PRAYER, title: 'Extended Prayer' });
    });
    expect(result.current.iapModal).not.toBeNull();

    const onSuccess = jest.fn();
    await act(async () => {
      await result.current.doIapPurchase(PRODUCT_EXTENDED_PRAYER, onSuccess);
    });

    expect(result.current.iapModal).toBeNull();                   // modal dismissed
    expect(onSuccess).toHaveBeenCalledTimes(1);                   // success callback fired
    expect(result.current.iapExtendedPrayerUnlocked).toBe(true); // entitlement reflected
    expect(result.current.iapPurchasing).toBe(false);            // not stuck in loading state
  });

  it('does not crash and leaves iapPurchasing=false when the user cancels', async () => {
    const { result } = renderHook(() => useIap());
    await seedProduct(result);

    mockClient.purchaseStoreProduct.mockRejectedValue({ userCancelled: true });

    await act(async () => {
      await result.current.doIapPurchase(PRODUCT_EXTENDED_PRAYER);
    });

    expect(result.current.iapPurchasing).toBe(false);
  });

  it('shows a failure modal on a non-cancel SDK error', async () => {
    const { result } = renderHook(() => useIap());
    await seedProduct(result);

    mockClient.purchaseStoreProduct.mockRejectedValue(new Error('Payment declined'));

    await act(async () => {
      await result.current.doIapPurchase(PRODUCT_EXTENDED_PRAYER);
    });

    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Purchase failed' }),
    );
    expect(result.current.iapPurchasing).toBe(false);
  });

  it('shows "Product not found" when no matching product is in iapProducts', async () => {
    // loadIapData returns empty product list
    mockClient.getCustomerInfo.mockResolvedValue(makeCustomerInfo([]));
    mockClient.getProducts.mockResolvedValue([]);

    const { result } = renderHook(() => useIap());

    await act(async () => { await result.current.loadIapData(); });
    jest.clearAllMocks();

    await act(async () => {
      await result.current.doIapPurchase(PRODUCT_EXTENDED_PRAYER);
    });

    expect(mockShowModal).toHaveBeenCalledWith(
      expect.objectContaining({
        title:   'Purchase failed',
        message: expect.stringContaining('Product not found'),
      }),
    );
  });
});
