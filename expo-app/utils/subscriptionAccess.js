export const PRO_ENTITLEMENT = 'Pray Over Us Pro';

export function validateIdentity(value) {
  if (typeof value?.revenuecatAppUserId !== 'string' || !value.revenuecatAppUserId.trim()
    || value.entitlement !== PRO_ENTITLEMENT || typeof value.requiresSdkLogin !== 'boolean') {
    throw new Error('Invalid subscription identity response');
  }
  return value;
}

export function validateProStatus(value, identity) {
  if (typeof value?.isPro !== 'boolean' || typeof value.identityVerificationRequired !== 'boolean'
    || value.entitlement !== PRO_ENTITLEMENT
    || value.revenuecatAppUserId !== identity.revenuecatAppUserId) {
    throw new Error('Invalid subscription status response');
  }
  return value;
}

export function validateAccessPolicy(value) {
  if (typeof value?.contentPaywallEnabled !== 'boolean'
    || typeof value.dailyBread?.requiresPro !== 'boolean'
    || typeof value.prayerWalk?.requiresPro !== 'boolean'
    || value.extendedPrayer?.requiresPro !== true) {
    throw new Error('Invalid content access policy');
  }
  return value;
}

// Never use an unknown policy as proof either that payment is required or
// that restricted content is free. The UI offers retry instead.
export function featureAccess(policy, isPro, feature) {
  if (feature === 'extendedPrayer') return isPro === true;
  if (!policy || !policy[feature]) return null;
  return !policy[feature].requiresPro || isPro === true;
}

export function hasPurchaseHistory(info) {
  return Object.keys(info?.entitlements?.active || {}).length > 0
    || (info?.allPurchasedProductIdentifiers || []).length > 0
    || (info?.nonSubscriptionTransactions || []).length > 0;
}

export const OWNERSHIP_MESSAGE =
  'Your existing purchase needs account ownership verification. No purchase has been moved. Please contact support before purchasing again or restoring.';
export const VERIFICATION_MESSAGE =
  'We couldn’t verify your membership. Check your connection and try again. Do not purchase again if you have already paid.';
