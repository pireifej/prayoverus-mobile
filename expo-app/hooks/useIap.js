/**
 * useIap — owns all in-app purchase state and RevenueCat SDK calls.
 *
 * Extracted from App.js so that a crash in the RevenueCat SDK never brings
 * down the rest of the app. SDK bootstrap lives in services/purchasesClient.js
 * so it can be mocked independently in tests.
 */
import { useState } from 'react';
import { showToast, showModal } from '../AppModals';
import { client as Purchases, isAvailable as rcAvailable } from '../services/purchasesClient';

// ── RevenueCat constants ─────────────────────────────────────────────────────

export const PRO_ENTITLEMENT = 'Pray Over Us Pro';

const selectMonthlyPackage = (offering) => {
  const packages = offering?.availablePackages || [];
  return offering?.monthly
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
  const [iapPurchasing, setIapPurchasing]     = useState(false);
  const [iapModal, setIapModal]               = useState(null);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const hasEntitlement = (key) =>
    iapCustomerInfo?.entitlements?.active?.[key] !== undefined;

  // Keep this check explicit: every paid feature uses the same RevenueCat
  // entitlement and there are no per-feature purchase flags anymore.
  const isPro = iapCustomerInfo?.entitlements?.active?.[PRO_ENTITLEMENT] !== undefined;

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
    try {
      const [info, offerings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings
          ? Purchases.getOfferings()
          : Promise.resolve({ current: null }),
      ]);
      const offering = offerings?.current || null;
      const monthly = selectMonthlyPackage(offering);
      setIapCustomerInfo(info);
      setIapOffering(offering);
      setProPackage(monthly);
      setIapProducts((offering?.availablePackages || []).map(pkg => pkg.product).filter(Boolean));
      return { info, offering, proPackage: monthly };
    } catch (e) {
      console.warn('[IAP] load error:', e?.message);
      return null;
    }
  };

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
    if (!rcAvailable || !Purchases) {
      showToast('Purchases are not available on this device.', '⚠️');
      return;
    }
    setIapPurchasing(true);
    try {
      const packageToPurchase = purchasePackage?.product ? purchasePackage : proPackage;
      if (!packageToPurchase) throw new Error('Pro subscription not found — check your RevenueCat offering setup.');
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      setIapCustomerInfo(customerInfo);
      setIapModal(null);
      const callback = onSuccess || iapModal?.onSuccess;
      if (callback) {
        callback();
      } else {
        showToast('Welcome to Pray Over Us Pro.', '🙌');
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
    setIapProducts,
    iapOffering,
    proPackage,
    iapPurchasing,
    iapModal,
    setIapModal,
    // computed
    isPro,
    // functions
    hasEntitlement,
    getIapPrice,
    loadIapData,
    presentProPaywall,
    doIapPurchase,
    doIapRestore,
  };
}
