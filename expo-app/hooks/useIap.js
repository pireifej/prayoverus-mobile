/**
 * RevenueCat handles the store transaction; only the verified backend status
 * grants account access. Content policy is independent from membership.
 */
import { useEffect, useRef, useState } from 'react';
import { AppState, Linking, Platform } from 'react-native';
import { showToast, showModal } from '../AppModals';
import { client as Purchases, isAvailable as rcAvailable } from '../services/purchasesClient';
import { getUserSessionToken, setRevenueCatAppUserId } from '../services/userSession';
import { apiGetSubscriptionIdentity, apiGetProStatus, apiGetAccessPolicy, apiCompleteSubscriptionReconciliation } from '../services/api';
import {
  reconciliationStore, validateReconciliation, sameReconciliation,
  performReconciliation, repairErrorMessage, REPAIR_MESSAGE,
} from '../services/subscriptionReconciliation';
import {
  PRO_ENTITLEMENT, validateIdentity, validateProStatus, validateAccessPolicy,
  featureAccess, hasPurchaseHistory, OWNERSHIP_MESSAGE, VERIFICATION_MESSAGE,
} from '../utils/subscriptionAccess';
import { summarizePurchaseInfo, summarizeBackendStatus } from '../utils/purchaseDiagnostics';

export { PRO_ENTITLEMENT };

const selectMonthlyPackage = offering => {
  const packages = offering?.availablePackages || [];
  return offering?.monthly
    || packages.find(pkg => pkg.identifier === 'monthly' || pkg.product?.identifier === 'monthly')
    || packages.find(pkg => pkg.packageType === 'MONTHLY')
    || packages.find(pkg => /monthly/i.test(pkg.identifier || pkg.product?.identifier || ''))
    || null;
};

export function useIap() {
  const [iapCustomerInfo, setIapCustomerInfo] = useState(null);
  const [iapProducts, setIapProducts] = useState([]);
  const [iapOffering, setIapOffering] = useState(null);
  const [proPackage, setProPackage] = useState(null);
  const [revenuecatAppUserId, setRevenuecatAppUserId] = useState(null);
  const [iapLoading, setIapLoading] = useState(false);
  const [iapPurchasing, setIapPurchasing] = useState(false);
  const [iapModal, setIapModal] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);
  const [accessPolicy, setAccessPolicy] = useState(null);
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState('');
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [purchaseDiagnostics, setPurchaseDiagnostics] = useState(null);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [backendDiagnostic, setBackendDiagnostic] = useState(null);
  const [reconciliation, setReconciliation] = useState(null);
  const repairRef = useRef(null);
  const reconcilingRef = useRef(false);
  const diagnosticRequestRef = useRef(0);
  const accountRef = useRef(null);
  const epochRef = useRef(0);
  const statusRequestRef = useRef(0);
  const policyRequestRef = useRef(0);
  const sdkQueue = useRef(Promise.resolve());
  const billingAttemptRef = useRef(false);
  const statusRef = useRef(null);
  const packageRef = useRef(null);
  const mounted = useRef(true);
  const isCurrent = account => mounted.current && !!account && accountRef.current === account;
  const enqueueSdk = task => {
    const next = sdkQueue.current.catch(() => {}).then(task);
    sdkQueue.current = next.catch(() => {});
    return next;
  };

  const isPro = backendStatus?.isPro === true && backendStatus?.identityVerificationRequired === false;
  const canAccessFeature = feature => featureAccess(accessPolicy, isPro, feature);
  const hasEntitlement = key => key === PRO_ENTITLEMENT && isPro;
  const getIapPrice = (pkg = proPackage) => typeof pkg === 'string'
    ? iapProducts.find(product => product.identifier === pkg)?.priceString ?? null
    : pkg?.product?.priceString ?? null;

  const clearAccountState = () => {
    repairRef.current = null;
    setReconciliation(null);
    ++diagnosticRequestRef.current;
    setPurchaseDiagnostics(null);
    setDiagnosticsLoading(false);
    setBackendDiagnostic(null);
    statusRef.current = null;
    packageRef.current = null;
    setRevenueCatAppUserId(null);
    setBackendStatus(null);
    setAccessPolicy(null);
    setAccessError('');
    setSubscriptionMessage('');
    setIapCustomerInfo(null);
    setIapOffering(null);
    setIapProducts([]);
    setProPackage(null);
    setRevenuecatAppUserId(null);
    setIapModal(null);
    setIapLoading(false);
    setAccessLoading(false);
    // Do not clear the billing mutex until an outstanding native transaction
    // actually settles, even if the app account changes.
  };

  const loadIapData = async () => {
    if (!rcAvailable || !Purchases) return null;
    const epoch = epochRef.current;
    setIapLoading(true);
    let timeout;
    try {
      const [info, offerings, sdkId] = await Promise.race([
        Promise.all([Purchases.getCustomerInfo(), Purchases.getOfferings(), Purchases.getAppUserID()]),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Store lookup timed out')), 15000);
        }),
      ]);
      if (!mounted.current || epoch !== epochRef.current) return null;
      const offering = offerings?.current || null;
      const monthly = selectMonthlyPackage(offering);
      const ownedInfo = sdkId === accountRef.current?.identity?.revenuecatAppUserId ? info : null;
      setIapCustomerInfo(ownedInfo);
      setIapOffering(offering);
      setProPackage(monthly);
      packageRef.current = monthly;
      setIapProducts((offering?.availablePackages || []).map(pkg => pkg.product).filter(Boolean));
      // SDK data is diagnostic/catalog data only, never proof of account Pro.
      return { info: ownedInfo, offering, proPackage: monthly };
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timeout);
      if (mounted.current && epoch === epochRef.current) setIapLoading(false);
    }
  };

  const refreshAccessPolicy = async () => {
    const account = accountRef.current;
    if (!isCurrent(account)) return null;
    const request = ++policyRequestRef.current;
    setAccessLoading(true);
    try {
      const policy = validateAccessPolicy(await apiGetAccessPolicy());
      if (!isCurrent(account) || request !== policyRequestRef.current) return null;
      setAccessPolicy(policy);
      setAccessError('');
      return policy;
    } catch (_) {
      if (isCurrent(account) && request === policyRequestRef.current) {
        setAccessPolicy(null);
        setAccessError('Content access could not be checked. Please try again.');
      }
      return null;
    } finally {
      if (isCurrent(account) && request === policyRequestRef.current) setAccessLoading(false);
    }
  };

  const refreshProStatus = async () => {
    const account = accountRef.current;
    if (!isCurrent(account) || reconcilingRef.current) return null;
    const request = ++statusRequestRef.current;
    try {
      if (!(await getUserSessionToken())) throw new Error('Session missing');
      // Request {} exactly: never disclose an anonymous/previous SDK identity.
      const identity = validateIdentity(await apiGetSubscriptionIdentity());
      if (!isCurrent(account) || request !== statusRequestRef.current) return null;
      account.identity = identity;
      // A malformed/expired offer is a block, never permission to use normal
      // billing. A saved transition also blocks billing until verified complete.
      if (!account.repairLoaded) {
        try {
          account.pendingRepair = await reconciliationStore.read(account.userId);
          if (!isCurrent(account) || request !== statusRequestRef.current) return null;
          account.repairLoaded = true;
        } catch (_) {
          if (!isCurrent(account) || request !== statusRequestRef.current) return null;
          repairRef.current = { error: REPAIR_MESSAGE };
          setReconciliation(repairRef.current);
          throw new Error(REPAIR_MESSAGE);
        }
      }
      if (identity.identityReconciliation || account.pendingRepair) {
        try {
          const transition = validateReconciliation(
            account.pendingRepair || identity.identityReconciliation, identity.revenuecatAppUserId,
          );
          if (identity.identityReconciliation && !sameReconciliation(transition,
            validateReconciliation(identity.identityReconciliation, identity.revenuecatAppUserId))) {
            throw new Error('SUBSCRIPTION_RECONCILIATION_CONFLICT');
          }
          repairRef.current = { transition, pending: !!account.pendingRepair };
        } catch (error) {
          repairRef.current = { error: repairErrorMessage(error) };
        }
        setReconciliation(repairRef.current);
      } else {
        repairRef.current = null;
        setReconciliation(null);
      }
      setRevenuecatAppUserId(identity.revenuecatAppUserId);
      const status = validateProStatus(await apiGetProStatus({
        revenuecatAppUserId: identity.revenuecatAppUserId, refresh: true,
      }), identity);
      if (!isCurrent(account) || request !== statusRequestRef.current) return null;
      statusRef.current = status;
      setBackendStatus(status);
      setBackendDiagnostic(summarizeBackendStatus(status));
      setSubscriptionMessage(status.identityVerificationRequired ? OWNERSHIP_MESSAGE : '');
      return status;
    } catch (error) {
      if (isCurrent(account) && request === statusRequestRef.current) {
        statusRef.current = null;
        setBackendStatus(null);
        setBackendDiagnostic({
          state: 'error', checkedAt: new Date().toISOString(),
          message: error?.code === 'SUBSCRIPTION_IDENTITY_MISMATCH'
            ? 'SUBSCRIPTION_IDENTITY_MISMATCH' : 'Membership check failed; flags unavailable.',
        });
        setSubscriptionMessage(error?.code === 'SUBSCRIPTION_IDENTITY_MISMATCH'
          ? OWNERSHIP_MESSAGE : VERIFICATION_MESSAGE);
      }
      return null;
    }
  };

  const refreshPurchaseDiagnostics = async () => {
    const account = accountRef.current;
    if (!isCurrent(account) || billingAttemptRef.current) return;
    const request = ++diagnosticRequestRef.current;
    const current = () => isCurrent(account) && request === diagnosticRequestRef.current;
    setDiagnosticsLoading(true);
    setPurchaseDiagnostics(null);
    let timeout;
    let finished = false;
    try {
      if (!rcAvailable || !Purchases) throw new Error('unavailable');
      const snapshot = await Promise.race([
        (async () => {
          if (finished || !current() || billingAttemptRef.current) throw new Error('busy');
          const sdkId = await Purchases.getAppUserID();
          if (!current()) return null;
          const info = await Purchases.getCustomerInfo();
          if (!info || finished || !current()) throw new Error('unavailable');
          const afterId = await Purchases.getAppUserID();
          if (sdkId !== afterId || billingAttemptRef.current) throw new Error('identity changed');
          return {
            state: 'success', sdkId,
            checkedAt: new Date().toISOString(),
            ...summarizePurchaseInfo(info),
          };
        })(),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('timeout')), 10000);
        }),
      ]);
      if (current()) setPurchaseDiagnostics(snapshot);
    } catch (_) {
      if (current()) setPurchaseDiagnostics({
        state: 'error',
        message: 'Could not read device purchase information. Wait for any store action to finish, then try again.',
      });
    } finally {
      finished = true;
      clearTimeout(timeout);
      if (current()) setDiagnosticsLoading(false);
    }
  };

  const refreshSubscriptionAccess = async () => Promise.all([
    refreshAccessPolicy(), refreshProStatus(), loadIapData(),
  ]);

  const identifyRevenueCatUser = async userId => {
    if (!userId) return null;
    const previous = accountRef.current;
    // Only establish the app account here. SDK logIn is delayed until a
    // user-initiated billing action passes the ownership preflight.
    const account = { userId: String(userId), epoch: ++epochRef.current, identity: null };
    accountRef.current = account;
    clearAccountState();
    if (previous && previous.userId !== account.userId) {
      await reconciliationStore.clear(previous.userId);
      if (!isCurrent(account)) return null;
    }
    if (!(await getUserSessionToken()) || !isCurrent(account)) {
      if (isCurrent(account)) setSubscriptionMessage('Please sign in again to verify membership.');
      return null;
    }
    await refreshSubscriptionAccess();
    return isCurrent(account) ? account.identity : null;
  };

  const resetRevenueCatUser = async () => {
    const previous = accountRef.current;
    ++epochRef.current;
    accountRef.current = null;
    clearAccountState();
    if (previous) {
      try { await reconciliationStore.clear(previous.userId); } catch (_) { /* Future reads fail closed. */ }
    }
    // No automatic SDK logout: it creates anonymous customers and can race an
    // in-flight transaction. Identity is checked before the next billing action.
  };

  const latestRefresh = useRef(refreshSubscriptionAccess);
  latestRefresh.current = refreshSubscriptionAccess;
  useEffect(() => {
    mounted.current = true;
    const listener = AppState.addEventListener('change', state => {
      if (state === 'active' && accountRef.current && !billingAttemptRef.current) {
        void latestRefresh.current();
      }
    });
    return () => {
      mounted.current = false;
      ++epochRef.current;
      listener?.remove();
    };
  }, []);

  const explain = message => showModal({
    title: 'Pray Over Us Pro', message,
  });

  const runIdentityReconciliation = async expectedTransition => {
    if (billingAttemptRef.current) return;
    const account = accountRef.current;
    if (!isCurrent(account) || !rcAvailable || !Purchases) return;
    billingAttemptRef.current = true;
    reconcilingRef.current = true;
    ++statusRequestRef.current;
    statusRef.current = null;
    setBackendStatus(null);
    setIapPurchasing(true);
    setIapModal(null);
    try {
      if (!(await getUserSessionToken()) || !isCurrent(account)) throw new Error('USER_SESSION_REQUIRED');
      // Never act on the earlier UI offer: refetch from the signed session.
      const identity = validateIdentity(await apiGetSubscriptionIdentity());
      if (!isCurrent(account)) return;
      const pending = await reconciliationStore.read(account.userId);
      if (!isCurrent(account)) return;
      const transition = validateReconciliation(pending || identity.identityReconciliation, identity.revenuecatAppUserId);
      if (!sameReconciliation(transition, expectedTransition)) throw new Error('SUBSCRIPTION_RECONCILIATION_CONFLICT');
      repairRef.current = { transition, pending: !!pending };
      setReconciliation(repairRef.current);
      await enqueueSdk(() => performReconciliation({
        userId: account.userId, identity, pending, confirmed: true, sdk: Purchases,
        current: () => isCurrent(account),
        save: async (userId, value) => {
          if (!isCurrent(account)) throw new Error('USER_ID_MISMATCH');
          await reconciliationStore.save(userId, value);
          if (isCurrent(account)) account.pendingRepair = value;
          else await reconciliationStore.clear(userId);
        },
        complete: apiCompleteSubscriptionReconciliation,
      }));
      if (!isCurrent(account)) return;
      // Leave the journal and billing block in place until a fresh identity and
      // status both confirm the destination mapping.
      const verifiedIdentity = validateIdentity(await apiGetSubscriptionIdentity());
      if (!isCurrent(account)) return;
      if (verifiedIdentity.revenuecatAppUserId !== transition.toAppUserId
        || verifiedIdentity.identityReconciliation) throw new Error('SUBSCRIPTION_RECONCILIATION_CONFLICT');
      const verified = validateProStatus(await apiGetProStatus({
        revenuecatAppUserId: transition.toAppUserId, refresh: true,
      }), verifiedIdentity);
      if (!isCurrent(account)) return;
      if (verified.identityVerificationRequired) throw new Error('SUBSCRIPTION_RECONCILIATION_REVIEW_REQUIRED');
      if (await Purchases.getAppUserID() !== transition.toAppUserId) throw new Error('SUBSCRIPTION_RECONCILIATION_CONFLICT');
      if (!isCurrent(account)) return;
      await reconciliationStore.clear(account.userId);
      if (!isCurrent(account)) return;
      account.pendingRepair = null;
      account.identity = verifiedIdentity;
      account.repairLoaded = true;
      // Invalidate any refresh begun before reconciliation.
      ++statusRequestRef.current;
      repairRef.current = null;
      setReconciliation(null);
      statusRef.current = verified;
      setBackendStatus(verified);
      setBackendDiagnostic(summarizeBackendStatus(verified));
      setRevenuecatAppUserId(transition.toAppUserId);
      setRevenueCatAppUserId(transition.toAppUserId);
      setSubscriptionMessage('');
      setPurchaseDiagnostics(null);
      setIapCustomerInfo(null);
      showModal({
        title: 'Purchase setup complete',
        message: verified.isPro
          ? 'Your account is verified and Pro is active.'
          : 'Your account is ready. No purchase was made or restored. Your previous test subscription has not been moved. You can now view the monthly plan.',
      });
    } catch (error) {
      if (isCurrent(account)) {
        const message = repairErrorMessage(error);
        repairRef.current = { ...repairRef.current, pending: !!account.pendingRepair, error: message };
        setReconciliation(repairRef.current);
        setSubscriptionMessage(message);
        statusRef.current = null;
        setBackendStatus(null);
        showModal({ title: 'Purchase setup paused', message });
      }
    } finally {
      reconcilingRef.current = false;
      billingAttemptRef.current = false;
      if (mounted.current) setIapPurchasing(false);
    }
  };

  const presentIdentityReconciliation = () => {
    const account = accountRef.current;
    const repair = repairRef.current;
    if (!isCurrent(account) || billingAttemptRef.current) return;
    if (!repair?.transition) { explain(repair?.error || OWNERSHIP_MESSAGE); return; }
    const transition = repair.transition;
    // Saved consent resumes completion, but never silently on app launch.
    if (repair.pending) { void runIdentityReconciliation(transition); return; }
    showModal({
      title: 'Fix purchase setup?',
      message: 'Support approved switching this app account to its verified purchase identity. Your expired test purchase stays on the old identity. This will not buy, restore, or transfer anything.',
      buttons: [
        { label: 'Not now' },
        { label: 'Continue setup', onPress: () => {
          if (isCurrent(account)) void runIdentityReconciliation(transition);
        } },
      ],
    });
  };

  const prepareBilling = async account => {
    if (!isCurrent(account) || !rcAvailable || !Purchases) {
      throw new Error('Store billing or your signed-in account is unavailable. Please sign in and try again.');
    }
    const status = await refreshProStatus();
    if (!isCurrent(account)) return false;
    if (repairRef.current) throw new Error(REPAIR_MESSAGE);
    if (!status) throw new Error(VERIFICATION_MESSAGE);
    if (status.identityVerificationRequired) throw new Error(OWNERSHIP_MESSAGE);
    const expected = account.identity.revenuecatAppUserId;
    return enqueueSdk(async () => {
      if (!isCurrent(account)) return false;
      const existing = await Purchases.getAppUserID();
      if (!isCurrent(account)) return false;
      if (existing !== expected) {
        const info = await Purchases.getCustomerInfo();
        if (!isCurrent(account)) return false;
        // Never automatically alias, relink, or transfer a customer that has
        // purchases. Backend ownership verification is a separate operation.
        if (hasPurchaseHistory(info)) {
          setSubscriptionMessage(OWNERSHIP_MESSAGE);
          throw new Error(OWNERSHIP_MESSAGE);
        }
        await Purchases.logIn(expected);
      }
      if (!isCurrent(account)) return false;
      if (await Purchases.getAppUserID() !== expected) throw new Error(OWNERSHIP_MESSAGE);
      if (!isCurrent(account)) return false;
      setRevenueCatAppUserId(expected);
      return true;
    });
  };

  const presentProPaywall = async onSuccess => {
    const account = accountRef.current;
    if (!isCurrent(account)) { explain('Please sign in to check your membership.'); return false; }
    const status = await refreshProStatus();
    if (!isCurrent(account)) return false;
    if (repairRef.current) { explain(REPAIR_MESSAGE); return false; }
    if (!status || status.identityVerificationRequired) {
      explain(status?.identityVerificationRequired ? OWNERSHIP_MESSAGE : VERIFICATION_MESSAGE);
      return false;
    }
    if (status.isPro) {
      if (typeof onSuccess === 'function') {
        onSuccess();
        return true;
      }
      explain('Your Pray Over Us Pro membership is already active.');
      return false;
    }
    let monthly = packageRef.current;
    if (!monthly) monthly = (await loadIapData())?.proPackage;
    if (!isCurrent(account)) return false;
    if (!monthly) {
      explain('We couldn’t load the monthly plan. Check your store connection and try again.');
      return false;
    }
    setIapModal({
      package: monthly, title: 'Pray Over Us Pro',
      description: 'Unlimited prayer requests, Deepen Prayer, and premium themes.'
        + (accessPolicy?.dailyBread?.requiresPro || accessPolicy?.prayerWalk?.requiresPro
          ? ' Plus full Daily Bread readings and Prayer Walk audio.'
          : accessPolicy
            ? ' Daily Bread and Prayer Walk are currently available to all signed-in members.'
            : ''),
      onSuccess,
    });
    return true;
  };

  const runBilling = async (restore, purchasePackage, onSuccess) => {
    if (billingAttemptRef.current) return { status: 'busy' };
    billingAttemptRef.current = true;
    setIapPurchasing(true);
    const account = accountRef.current;
    let storeCompleted = false;
    try {
      if (!(await prepareBilling(account)) || !isCurrent(account)) return { status: 'cancelled' };
      if (!restore && statusRef.current?.isPro) {
        explain('Your Pray Over Us Pro membership is already active.');
        return { status: 'active' };
      }
      // Serialize native operations, including the account check immediately
      // before entering the store UI. An old account may not start a purchase.
      const info = await enqueueSdk(async () => {
        if (!isCurrent(account)) return null;
        const expected = account.identity.revenuecatAppUserId;
        if (await Purchases.getAppUserID() !== expected) throw new Error(OWNERSHIP_MESSAGE);
        if (!isCurrent(account)) return null;
        if (restore) return Purchases.restorePurchases();
        const existingInfo = await Purchases.getCustomerInfo();
        if (!isCurrent(account)) return null;
        if (existingInfo?.entitlements?.active?.[PRO_ENTITLEMENT]?.isActive === true) {
          throw new Error(VERIFICATION_MESSAGE);
        }
        const pkg = purchasePackage?.product ? purchasePackage : packageRef.current;
        if (!pkg) throw new Error('The monthly plan is unavailable. Please try again.');
        return (await Purchases.purchasePackage(pkg)).customerInfo;
      });
      if (!isCurrent(account)) return { status: 'cancelled' };
      if (!info) throw new Error('The store did not return a purchase result.');
      storeCompleted = true;
      setIapCustomerInfo(info);
      const verified = await refreshProStatus();
      if (!isCurrent(account)) return { status: 'cancelled' };
      setIapModal(null);
      if (verified?.isPro && !verified.identityVerificationRequired) {
        const message = restore ? 'Your Pro membership was restored and verified.' : 'Your Pro membership is active.';
        showToast(message, '✓');
        const callback = onSuccess || (restore ? null : iapModal?.onSuccess);
        if (typeof callback === 'function') callback();
        return { status: restore ? 'restored' : 'purchased', message };
      }
      if (verified?.identityVerificationRequired) throw new Error(OWNERSHIP_MESSAGE);
      // A successful store transaction is not the same as verified Pro.
      const message = restore && verified && !hasPurchaseHistory(info)
        ? 'No active Pray Over Us Pro subscription was found for this store account.'
        : 'The store finished, but Pro access is not verified yet. Do not purchase again. Retry verification from Profile or contact support.';
      setSubscriptionMessage(message);
      if (!(restore && verified && !hasPurchaseHistory(info))) explain(message);
      return { status: restore && verified && !hasPurchaseHistory(info) ? 'none' : 'pending', message };
    } catch (error) {
      if (!isCurrent(account)) return { status: 'cancelled' };
      if (error?.userCancelled) return { status: 'cancelled' };
      setIapModal(null);
      const message = storeCompleted
        ? `${VERIFICATION_MESSAGE} Account ownership may need support verification.`
        : error?.message || VERIFICATION_MESSAGE;
      setSubscriptionMessage(message);
      showModal({ title: storeCompleted ? 'Verification pending' : restore ? 'Restore unavailable' : 'Purchase unavailable', message });
      return { status: storeCompleted ? 'pending' : 'error', message };
    } finally {
      billingAttemptRef.current = false;
      if (mounted.current) setIapPurchasing(false);
    }
  };

  const openManageSubscriptions = async () => {
    try {
      await Linking.openURL(Platform.OS === 'ios'
        ? 'https://apps.apple.com/account/subscriptions'
        : 'https://play.google.com/store/account/subscriptions');
    } catch (_) {
      explain('Open your App Store or Google Play account settings, then Subscriptions, to manage or cancel your plan.');
    }
  };

  return {
    rcAvailable, iapCustomerInfo, setIapCustomerInfo, iapProducts, setIapProducts,
    iapOffering, proPackage, revenuecatAppUserId, iapPurchasing, iapLoading,
    iapModal, setIapModal, isPro, hasEntitlement, getIapPrice, loadIapData,
    identifyRevenueCatUser, resetRevenueCatUser, refreshProStatus,
    refreshAccessPolicy, refreshSubscriptionAccess, canAccessFeature,
    accessPolicy, accessLoading, accessError, subscriptionMessage,
    purchaseDiagnostics, diagnosticsLoading, backendDiagnostic, refreshPurchaseDiagnostics,
    reconciliation, presentIdentityReconciliation,
    openManageSubscriptions,
    presentProPaywall,
    doIapPurchase: (pkg, onSuccess) => runBilling(false, pkg, onSuccess),
    doIapRestore: () => runBilling(true),
  };
}
