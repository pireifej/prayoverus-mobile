import * as SecureStore from 'expo-secure-store';

export const USER_SESSION_TOKEN_KEY = 'prayoverus.user_session_token';

let cachedToken;
let loadPromise;
let revenuecatAppUserId = null;
let tokenRevision = 0;
let storageQueue = Promise.resolve();
const queueStorage = operation => {
  const next = storageQueue.catch(() => {}).then(operation);
  storageQueue = next.catch(() => {});
  return next;
};

/**
 * Keeps the signed backend session in Keychain (iOS) / Keystore (Android).
 * The in-memory cache avoids a secure-storage read for every API request.
 */
export const getUserSessionToken = async () => {
  if (cachedToken !== undefined) return cachedToken;
  if (!loadPromise) {
    const revision = tokenRevision;
    loadPromise = queueStorage(() => SecureStore.getItemAsync(USER_SESSION_TOKEN_KEY))
      .then(token => {
        if (revision !== tokenRevision) return getUserSessionToken();
        cachedToken = token || null;
        return cachedToken;
      })
      .catch(() => {
        if (revision !== tokenRevision) return getUserSessionToken();
        cachedToken = null;
        return null;
      });
  }
  return loadPromise;
};

export const setUserSessionToken = async (token) => {
  const normalized = typeof token === 'string' ? token.trim() : '';
  if (!normalized) {
    await clearUserSessionToken();
    return null;
  }
  const revision = ++tokenRevision;
  cachedToken = undefined;
  loadPromise = queueStorage(() => SecureStore.setItemAsync(USER_SESSION_TOKEN_KEY, normalized))
    .then(() => {
      if (revision === tokenRevision) cachedToken = normalized;
      return normalized;
    });
  await loadPromise;
  return normalized;
};

export const clearUserSessionToken = async () => {
  ++tokenRevision;
  cachedToken = null;
  loadPromise = null;
  await queueStorage(() => SecureStore.deleteItemAsync(USER_SESSION_TOKEN_KEY));
};

export const extractUserSessionToken = (response) =>
  response?.user_session_token
  || response?.result?.[0]?.user_session_token
  || null;

export const setRevenueCatAppUserId = (appUserId) => {
  revenuecatAppUserId = appUserId ? String(appUserId) : null;
  return revenuecatAppUserId;
};

export const getRevenueCatAppUserId = () => revenuecatAppUserId;