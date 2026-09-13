import * as SecureStore from 'expo-secure-store';

export const USER_SESSION_TOKEN_KEY = 'prayoverus.user_session_token';

let cachedToken;
let loadPromise;
let revenuecatAppUserId = null;

/**
 * Keeps the signed backend session in Keychain (iOS) / Keystore (Android).
 * The in-memory cache avoids a secure-storage read for every API request.
 */
export const getUserSessionToken = async () => {
  if (cachedToken !== undefined) return cachedToken;
  if (!loadPromise) {
    loadPromise = SecureStore.getItemAsync(USER_SESSION_TOKEN_KEY)
      .then(token => {
        cachedToken = token || null;
        return cachedToken;
      })
      .catch(() => {
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
  await SecureStore.setItemAsync(USER_SESSION_TOKEN_KEY, normalized);
  cachedToken = normalized;
  loadPromise = Promise.resolve(normalized);
  return normalized;
};

export const clearUserSessionToken = async () => {
  try {
    await SecureStore.deleteItemAsync(USER_SESSION_TOKEN_KEY);
  } finally {
    cachedToken = undefined;
    loadPromise = null;
  }
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