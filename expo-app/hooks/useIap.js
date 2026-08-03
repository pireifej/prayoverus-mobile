/**
 * useIap — owns all in-app purchase state and RevenueCat SDK calls.
 *
 * Extracted from App.js so that a crash in the RevenueCat SDK never brings
 * down the rest of the app. The module-level SDK initialization (previously
 * inline in App.js) now lives here so all IAP concerns are co-located.
 */
import { useState } from 'react';
import { Platform } from 'react-native';
import { showToast, showModal } from '../AppModals';

// ── RevenueCat constants ─────────────────────────────────────────────────────

export const ENTITLEMENT_EXTENDED_PRAYER = 'extended_prayer';
export const ENTITLEMENT_PREMIUM_THEMES  = 'premium_themes'; // legacy — unlocks all themes
export const PRODUCT_EXTENDED_PRAYER     = 'extended_prayer_single';
export const PRODUCT_PREMIUM_THEMES      = 'premium_themes'; // legacy

// Per-theme products & entitlements — same IDs on both Apple and Google Play
export const THEME_PRODUCTS = {
  golden:   'theme_golden',
  amethyst: 'theme_amethyst',
  rose:     'theme_rose',
  forest:   'theme_forest',
  midnight: 'theme_midnight',
};

// ── RevenueCat SDK bootstrap (safe to call at module load time) ──────────────
// Kept here instead of App.js module-level so all IAP code is co-located.

let rcAvailable = false;
let Purchases = null;

const RC_TEST_KEY    = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const RC_IOS_KEY     = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

try {
  Purchases = require('react-native-purchases').default;
  if (RC_TEST_KEY || RC_IOS_KEY || RC_ANDROID_KEY) {
    const key =
      (__DEV__ || Platform.OS === 'web')
        ? RC_TEST_KEY
        : Platform.OS === 'ios'
          ? RC_IOS_KEY || RC_TEST_KEY
          : RC_ANDROID_KEY || RC_TEST_KEY;
    if (key) {
      // Only enable verbose logging in dev — DEBUG level causes extra native traffic in
      // production and is one known trigger for iOS crashes on re-configure.
      if (__DEV__) Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      // configure() is safe to call on every launch per RevenueCat docs.
      try {
        Purchases.configure({ apiKey: key });
        rcAvailable = true;
      } catch (configErr) {
        console.warn('[IAP] configure() threw — SDK may already be initialized:', configErr?.message);
        // SDK was already initialized by the native layer (app resumed from suspended state).
        // It is still usable; mark as available.
        rcAvailable = true;
      }
    }
  }
} catch (e) {
  console.warn('[IAP] react-native-purchases not available:', e?.message);
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useIap() {
  const [iapCustomerInfo, setIapCustomerInfo] = useState(null);
  const [iapProducts, setIapProducts]         = useState([]);
  const [iapPurchasing, setIapPurchasing]     = useState(false);
  const [iapModal, setIapModal]               = useState(null); // { productId, title, description } | null

  // ── Helpers ────────────────────────────────────────────────────────────────

  const hasEntitlement = (key) =>
    iapCustomerInfo?.entitlements?.active?.[key] !== undefined;

  const iapExtendedPrayerUnlocked = hasEntitlement(ENTITLEMENT_EXTENDED_PRAYER);
  const iapThemesUnlocked         = hasEntitlement(ENTITLEMENT_PREMIUM_THEMES);

  /** Returns true if a specific theme is unlocked (legacy all-unlock OR per-theme purchase). */
  const isThemeUnlocked = (themeKey) =>
    iapThemesUnlocked || hasEntitlement(THEME_PRODUCTS[themeKey] || '');

  const getIapPrice = (productId) =>
    iapProducts.find(p => p.identifier === productId)?.priceString ?? null;

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadIapData = async () => {
    if (!rcAvailable || !Purchases) return;
    try {
      const allProductIds = [
        PRODUCT_EXTENDED_PRAYER,
        PRODUCT_PREMIUM_THEMES,
        ...Object.values(THEME_PRODUCTS),
      ];
      const [info, prods] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getProducts(allProductIds),
      ]);
      setIapCustomerInfo(info);
      setIapProducts(prods);
    } catch (e) {
      console.warn('[IAP] load error:', e?.message);
    }
  };

  // ── Purchase / restore ─────────────────────────────────────────────────────

  const doIapPurchase = async (productId, onSuccess) => {
    if (!rcAvailable || !Purchases) return;
    setIapPurchasing(true);
    try {
      const product = iapProducts.find(p => p.identifier === productId);
      if (!product) throw new Error('Product not found — check your App Store / Play Store setup.');
      const { customerInfo } = await Purchases.purchaseStoreProduct(product);
      setIapCustomerInfo(customerInfo);
      setIapModal(null);
      if (onSuccess) {
        onSuccess();
      } else {
        showToast('Thank you — enjoy your new feature.', '🙌');
      }
    } catch (e) {
      if (!e?.userCancelled) {
        showModal({ icon: '😔', title: 'Purchase failed', message: e?.message ?? 'Please try again.' });
      }
    } finally {
      setIapPurchasing(false);
    }
  };

  const doIapRestore = async () => {
    if (!rcAvailable || !Purchases) return;
    setIapPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      setIapCustomerInfo(info);
      showToast('Your purchases have been restored.', '✅');
      setIapModal(null);
    } catch (e) {
      showModal({ icon: '😔', title: 'Restore failed', message: e?.message ?? 'Please try again.' });
    } finally {
      setIapPurchasing(false);
    }
  };

  return {
    // state
    rcAvailable, // true if RevenueCat SDK loaded and configured
    iapCustomerInfo,
    setIapCustomerInfo,
    iapProducts,
    iapPurchasing,
    iapModal,
    setIapModal,
    // computed
    iapExtendedPrayerUnlocked,
    iapThemesUnlocked,
    // functions
    hasEntitlement,
    isThemeUnlocked,
    getIapPrice,
    loadIapData,
    doIapPurchase,
    doIapRestore,
  };
}
