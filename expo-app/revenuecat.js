import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';

// The app has one RevenueCat entitlement and one current offering.
export const PRO_ENTITLEMENT = 'Pray Over Us Pro';
export const OFFERING_DEFAULT = 'default';

const TEST_KEY     = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const IOS_KEY      = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_KEY  = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

export function initializeRevenueCat() {
  let apiKey;
  if (__DEV__ || Platform.OS === 'web') {
    apiKey = TEST_KEY;
  } else if (Platform.OS === 'ios') {
    apiKey = IOS_KEY;
  } else {
    apiKey = ANDROID_KEY;
  }
  if (!apiKey) throw new Error('RevenueCat API key not found. Check environment variables.');
  Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey });
  console.log('[RevenueCat] Configured');
}

function useSubscriptionContext() {
  const [customerInfo, setCustomerInfo] = useState(null);
  const [offerings, setOfferings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [info, offs] = await Promise.all([
          Purchases.getCustomerInfo(),
          Purchases.getOfferings(),
        ]);
        if (mounted) { setCustomerInfo(info); setOfferings(offs); }
      } catch (e) {
        console.warn('[RevenueCat] Load error:', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    load();
    const listener = Purchases.addCustomerInfoUpdateListener((info) => {
      if (mounted) setCustomerInfo(info);
    });
    return () => { mounted = false; listener.remove?.(); };
  }, []);

  const hasEntitlement = (key) =>
    customerInfo?.entitlements?.active?.[key] !== undefined;

  const purchase = async (offeringKey) => {
    setIsPurchasing(true);
    try {
      const offering = offerings?.all?.[offeringKey || OFFERING_DEFAULT] || offerings?.current;
      if (!offering) throw new Error(`Offering "${offeringKey}" not found`);
      const pkg = offering.availablePackages[0];
      if (!pkg) throw new Error('No package available in offering');
      const { customerInfo: updated } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(updated);
      return updated;
    } finally {
      setIsPurchasing(false);
    }
  };

  const restore = async () => {
    setIsPurchasing(true);
    try {
      const updated = await Purchases.restorePurchases();
      setCustomerInfo(updated);
      return updated;
    } finally {
      setIsPurchasing(false);
    }
  };

  const getPriceString = (offeringKey) => {
    const offering = offerings?.all?.[offeringKey || OFFERING_DEFAULT] || offerings?.current;
    const pkg = offering?.availablePackages?.[0];
    return pkg?.product?.priceString ?? null;
  };

  return {
    customerInfo,
    offerings,
    isLoading,
    isPurchasing,
    hasEntitlement,
    purchase,
    restore,
    getPriceString,
    isPro: hasEntitlement(PRO_ENTITLEMENT),
  };
}

const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const value = useSubscriptionContext();
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within a SubscriptionProvider');
  return ctx;
}
