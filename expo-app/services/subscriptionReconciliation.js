import * as SecureStore from 'expo-secure-store';

const KEY = 'prayoverus.subscription_reconciliation';
let storageQueue = Promise.resolve();
const queue = task => {
  const next = storageQueue.catch(() => {}).then(task);
  storageQueue = next.catch(() => {});
  return next;
};

export const REPAIR_MESSAGE =
  'Purchase setup is not complete. Purchases and restores are paused. Retry setup, or contact support if review is required.';

const stop = () => { throw new Error('SUBSCRIPTION_RECONCILIATION_REVIEW_REQUIRED'); };
const isIdentifiedSource = id => typeof id === 'string' && id.length > 0
  && !id.startsWith('$RCAnonymousID:') && !id.startsWith('pou_v1_');

// Only the authenticated backend can offer a transition. This validation is
// deliberately stricter than the normal identity contract and fails closed.
export function validateReconciliation(value, target, now = Date.now()) {
  if (!value || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.authorizationId || '')
    || value.action !== 'switch_without_restore'
    || !isIdentifiedSource(value.fromAppUserId)
    || typeof target !== 'string' || !target.startsWith('pou_v1_')
    || value.toAppUserId !== target || value.fromAppUserId === target
    || typeof value.expectedOriginalAppUserId !== 'string'
    || !value.expectedOriginalAppUserId.startsWith('$RCAnonymousID:')
    || !Number.isFinite(Date.parse(value.expiresAt))) stop();
  if (Date.parse(value.expiresAt) <= now) {
    throw new Error('SUBSCRIPTION_RECONCILIATION_EXPIRED');
  }
  return {
    authorizationId: value.authorizationId, action: value.action,
    fromAppUserId: value.fromAppUserId, toAppUserId: target,
    expectedOriginalAppUserId: value.expectedOriginalAppUserId,
    expiresAt: value.expiresAt,
  };
}

export const sameReconciliation = (left, right) => [
  'authorizationId', 'action', 'fromAppUserId', 'toAppUserId',
  'expectedOriginalAppUserId', 'expiresAt',
].every(key => left?.[key] === right?.[key]);

// A single device journal, not an entitlement store. Never store CustomerInfo,
// receipts, session tokens or payment information here. Serialize clearing and
// writes so an old account cannot erase a newer account's journal.
export const reconciliationStore = {
  read: userId => queue(async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return null;
    let record;
    try { record = JSON.parse(raw); } catch (_) { stop(); }
    if (record?.userId !== String(userId)) {
      await SecureStore.deleteItemAsync(KEY);
      return null;
    }
    if (record.version !== 1 || record.confirmed !== true || !record.transition) stop();
    return record.transition;
  }),
  save: (userId, transition) => queue(() => SecureStore.setItemAsync(KEY, JSON.stringify({
    version: 1, userId: String(userId), confirmed: true, transition,
  }))),
  clear: userId => queue(async () => {
    const raw = await SecureStore.getItemAsync(KEY);
    if (!raw) return;
    let record;
    try { record = JSON.parse(raw); } catch (_) { await SecureStore.deleteItemAsync(KEY); return; }
    if (record.userId === String(userId)) await SecureStore.deleteItemAsync(KEY);
  }),
};

export function repairErrorMessage(error) {
  const code = error?.code || error?.message;
  if (code === 'SUBSCRIPTION_RECONCILIATION_EXPIRED') {
    return 'The purchase setup approval expired. Contact support for a fresh review. Do not purchase or restore.';
  }
  if (['USER_SESSION_REQUIRED', 'USER_ID_MISMATCH'].includes(code) || error?.status === 401) {
    return 'Sign in to the same app account before retrying purchase setup. Purchases and restores remain paused.';
  }
  if ([
    'SUBSCRIPTION_RECONCILIATION_REVIEW_REQUIRED', 'SUBSCRIPTION_RECONCILIATION_CONFLICT',
    'SUBSCRIPTION_RECONCILIATION_NOT_AUTHORIZED', 'SUBSCRIPTION_RECONCILIATION_INVALID_INPUT',
  ].includes(code)) {
    return 'Purchase setup needs a new support review. Nothing was restored or purchased. Do not purchase or restore.';
  }
  return REPAIR_MESSAGE;
}

/**
 * Called only following confirmation, or to resume that securely saved consent.
 * SDK work runs inside the caller's shared billing mutex and SDK queue.
 * The backend rechecks provider evidence; local diagnostics never authorize it.
 */
export async function performReconciliation({
  userId, identity, pending, confirmed, sdk, current, save, complete,
}) {
  const check = () => { if (!current()) stop(); };
  check();
  const offered = identity.identityReconciliation;
  const transition = validateReconciliation(pending || offered, identity.revenuecatAppUserId);
  if (offered) {
    const fresh = validateReconciliation(offered, identity.revenuecatAppUserId);
    if (!sameReconciliation(transition, fresh)) stop();
  }
  const sdkId = await sdk.getAppUserID();
  check();
  if (pending && sdkId === transition.toAppUserId) {
    // Interrupted after login: do not log in again or inspect the old source.
  } else {
    if (!offered || !confirmed || sdkId !== transition.fromAppUserId) stop();
    const info = await sdk.getCustomerInfo();
    check();
    if (info?.originalAppUserId !== transition.expectedOriginalAppUserId) stop();
    if (await sdk.getAppUserID() !== transition.fromAppUserId) stop();
    check();
    validateReconciliation(transition, identity.revenuecatAppUserId);
    // Persist BEFORE logIn. If persistence fails there is no SDK mutation.
    await save(userId, transition);
    check();
    validateReconciliation(transition, identity.revenuecatAppUserId);
    await sdk.logIn(transition.toAppUserId);
    check();
  }
  if (await sdk.getAppUserID() !== transition.toAppUserId) stop();
  check();
  validateReconciliation(transition, identity.revenuecatAppUserId);
  const result = await complete({ authorizationId: transition.authorizationId });
  check();
  if (result?.completed !== true || result.revenuecatAppUserId !== transition.toAppUserId) stop();
  return transition;
}
