/**
 * useIap — owns all in-app purchase state and RevenueCat SDK calls.
 *
 * Extracted from App.js so that a crash in the RevenueCat SDK never brings
 * down the rest of the app. SDK bootstrap lives in services/purchasesClient.js
 * so it can be mocked independently in tests.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { showToast, showModal } from '../AppModals';
import { client as Purchases, isAvailable as rcAvailable } from '../services/purchasesClient';
import {
  getUserSessionToken,
  setRevenueCatAppUserId as cacheRevenueCatAppUserId,
} from '../services/userSession';
import { apiGetProStatus } from '../services/api';

// ── RevenueCat constants ─────────────────────────────────────────────────────

export const PRO_ENTITLEMENT = 'Pray Over Us Pro';

const selectMonthlyPackage = (offering) => {
  const packages = offering?.availablePackages || [];
  return offering?.monthly
    || packages.find(pkg => pkg.identifier === 'monthly' || pkg.product?.identifier === 'monthly')
    || packages.find(pkg => pkg.packageType === 'MONTHLY')
    || packages.find(pkg => /monthly/i.test(pkg.identifier || pkg.product?.identifier || ''))
    || null;
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useIap() {
  const [iapCustomerInfo, setIapCustomerInfo] = useState(null);
  const [iapProducts, setIapProducts]         = useState([]);
  const [iapOffering, setIapOffering]         = useState(null);
  const [proPackage, setProPackage]           = useState(null);
  const [revenuecatAppUserId, setRevenuecatAppUserId] = useState(null);
  const [iapLoading, setIapLoading]           = useState(false);
  const [iapPurchasing, setIapPurchasing]     = useState(false);
  const [iapModal, setIapModal]               = useState(null);
  const [identifiedUserId, setIdentifiedUserId] = useState(null);
  const identityEpoch = useRef(0);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const hasEntitlement = (key) =>
    !!identifiedUserId && iapCustomerInfo?.entitlements?.active?.[key]?.isActive === true;

  // Keep this check explicit: every paid feature uses the same RevenueCat
  // entitlement and there are no per-feature purchase flags anymore.
  const isPro = !!identifiedUserId
    && iapCustomerInfo?.entitlements?.active?.[PRO_ENTITLEMENT]?.isActive === true;

  const getIapPrice = (packageOrId = proPackage) => {
    if (packageOrId?.product?.priceString) return packageOrId.product.priceString;
    if (typeof packageOrId === 'string') {
      return iapProducts.find(p => p.identifier === packageOrId)?.priceString ?? null;
    }
    return proPackage?.product?.priceString ?? null;
  };

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadIapData = async () => {
    if (!rcAvailable || !Purchases) return null;
    const epoch = identityEpoch.current;
    setIapLoading(true);
    try {
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings
          ? Purchases.getOfferings()
          : Promise.resolve({ current: null }),
      ]);
      const offering = offerings?.current?.identifier === 'default'
        ? offerings.current
        : offerings?.all?.default || offerings?.current || null;
      const monthly = selectMonthlyPackage(offering);
      const appUserId = await Purchases.getAppUserID?.();
      if (epoch !== identityEpoch.current) return null;
      setIapCustomerInfo(info);
      setIapOffering(offering);
      setProPackage(monthly);
      setRevenuecatAppUserId(appUserId || null);
      cacheRevenueCatAppUserId(appUserId || null);
      setIapProducts((offering?.availablePackages || []).map(pkg => pkg.product).filter(Boolean));
      return { info, offering, proPackage: monthly, revenuecatAppUserId: appUserId || null };
    } catch (e) {
      console.warn('[IAP] load error:', e?.message);
      return null;
    } finally {
      setIapLoading(false);
    }
  };

  const identifyRevenueCatUser = async (userId) => {
    if (!rcAvailable || !Purchases || !userId) return null;
    const epoch = ++identityEpoch.current;
    setIdentifiedUserId(null);
    setIapCustomerInfo(null);
    cacheRevenueCatAppUserId(null);
    try {
      const result = await Purchases.logIn?.(String(userId));
      const info = result?.customerInfo || result;
      const appUserId = await Purchases.getAppUserID?.();
      if (epoch !== identityEpoch.current || String(appUserId) !== String(userId)) return null;
      if (info?.entitlements) setIapCustomerInfo(info);
      setIdentifiedUserId(String(userId));
      setRevenuecatAppUserId(appUserId || null);
      cacheRevenueCatAppUserId(appUserId || null);
      return info || null;
    } catch (e) {
      console.warn('[IAP] RevenueCat user identification failed:', e?.message);
      return null;
    }
  };

  const resetRevenueCatUser = async () => {
    const epoch = ++identityEpoch.current;
    setIdentifiedUserId(null);
    setIapCustomerInfo(null);
    setIapModal(null);
    if (!rcAvailable || !Purchases) return;
    try {
      await Purchases.logOut?.();
    } catch (e) {
      console.warn('[IAP] RevenueCat logout failed:', e?.message);
    } finally {
      if (epoch === identityEpoch.current) {
        setIapCustomerInfo(null);
        setRevenuecatAppUserId(null);
        cacheRevenueCatAppUserId(null);
      }
    }
  };

  const refreshProStatus = async () => {
    const appUserId = revenuecatAppUserId || await Purchases?.getAppUserID?.();
    if (!appUserId || !(await getUserSessionToken())) return null;
    try {
      return await apiGetProStatus({ revenuecatAppUserId: appUserId });
    } catch (e) {
      // The client-side entitlement remains RevenueCat's source of truth.
      if (e?.code !== 'PRO_REQUIRED') {
        console.warn('[IAP] backend Pro status refresh failed:', e?.message);
      }
      return null;
    }
  };

  const loadIapDataRef = useRef(loadIapData);
  loadIapDataRef.current = loadIapData;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextState => {
      if (nextState === 'active') loadIapDataRef.current?.();
    });
    return () => subscription?.remove();
  }, []);

  const presentProPaywall = async (onSuccess) => {
    let monthly = proPackage;
    if (!monthly) {
      const loaded = await loadIapData();
      monthly = loaded?.proPackage || null;
    }

    if (!monthly) {
      showModal({
        icon: '🕊️',
        title: 'Pray Over Us Pro',
        message: rcAvailable
          ? 'The Pro subscription is temporarily unavailable. Please try again in a moment.'
          : 'Pro subscriptions will be available in the next app update.',
      });
      return false;
    }

    setIapModal({
      package: monthly,
      title: 'Pray Over Us Pro',
      description: 'Unlock unlimited prayer requests, Deepen Prayer, premium themes, full Daily Bread devotionals, and Prayer Walk audio.',
      onSuccess,
    });
    return true;
  };

  // ── Purchase / restore ─────────────────────────────────────────────────────

  const doIapPurchase = async (purchasePackage = proPackage, onSuccess) => {
    const epoch = identityEpoch.current;
    if (!rcAvailable || !Purchases) {
      showToast('Purchases are not available on this device.', '⚠️');
      return;
    }
    setIapPurchasing(true);
    try {
      const packageToPurchase = purchasePackage?.product ? purchasePackage : proPackage;
      if (!packageToPurchase) throw new Error('Pro subscription not found — check your RevenueCat offering setup.');
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      if (epoch !== identityEpoch.current) return;
      setIapCustomerInfo(customerInfo);
      await loadIapData();
      await refreshProStatus();
      setIapModal(null);
      const callback = onSuccess || iapModal?.onSuccess;
      if (callback) {
        callback();
      } else {
        showToast('Welcome to Pray Over Us Pro.', '🙌');
      }
    } catch (e) {
      if (!e?.userCancelled) {
        setIapModal(null);
        showModal({ icon: '😔', title: 'Purchase failed', message: e?.message ?? 'Please try again.' });
      }
    } finally {
      setIapPurchasing(false);
    }
  };

  const doIapRestore = async () => {
    if (!rcAvailable || !Purchases) return;
    const epoch = identityEpoch.current;
    setIapPurchasing(true);
    try {
      const info = await Purchases.restorePurchases();
      if (epoch !== identityEpoch.current) return;
      setIapCustomerInfo(info);
      await loadIapData();
      await refreshProStatus();
      showToast('Your purchases have been restored.', '✅');
      setIapModal(null);
    } catch (e) {
      setIapModal(null);
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
    setIapProducts,
    iapOffering,
    proPackage,
    revenuecatAppUserId,
    iapPurchasing,
    iapLoading,
    iapModal,
    setIapModal,
    // computed
    isPro,
    // functions
    hasEntitlement,
    getIapPrice,
    loadIapData,
    identifyRevenueCatUser,
    resetRevenueCatUser,
    refreshProStatus,
    presentProPaywall,
    doIapPurchase,
    doIapRestore,
  };
}
