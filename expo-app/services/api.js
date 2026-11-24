import { getUserSessionToken } from './userSession';

// ─── API Configuration ────────────────────────────────────────────────────────
export const API_BASE = 'https://shouldcallpaul.replit.app';

// Loaded from the EXPO_PUBLIC_API_AUTH environment secret at build time.
// The secret value must be the base64-encoded "user:pass" string — it is
// used directly in the Authorization header without re-encoding.
// Never hardcode credentials here — the bundle is recoverable from the IPA/APK.
const AUTH_CREDENTIALS = process.env.EXPO_PUBLIC_API_AUTH ?? '';

let authFailureHandler = null;
let accessFailureHandler = null;

export class ApiError extends Error {
  constructor(message, { status, code, response } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.response = response;
  }
}

export const setApiAuthFailureHandler = (handler) => {
  authFailureHandler = typeof handler === 'function' ? handler : null;
  return () => { authFailureHandler = null; };
};

export const setApiAccessFailureHandler = (handler) => {
  accessFailureHandler = typeof handler === 'function' ? handler : null;
  return () => { accessFailureHandler = null; };
};

const notifyAuthFailure = (error) => {
  if (
    error.status === 401
    || error.code === 'USER_SESSION_REQUIRED'
    || error.code === 'USER_ID_MISMATCH'
  ) {
    authFailureHandler?.(error);
  }
  // Daily-limit errors belong to the attempted submission's form lifecycle,
  // not a global handler that can reopen an error after a successful post.
  if (error.status === 403 && error.code === 'PRO_REQUIRED') {
    if (accessFailureHandler) {
      error.accessFailureHandled = true;
      accessFailureHandler(error);
    }
  }
};

const notifyRequestFailure = async (error, headers) => {
  // An old account's delayed 401/403 must not log out or open a paywall for
  // the next account. Callers still receive the error for their own lifecycle.
  const currentToken = await getUserSessionToken();
  if ((headers['x-user-session-token'] || null) !== currentToken) return;
  notifyAuthFailure(error);
};

const createApiError = (status, path, response) => {
  // Do not let legacy numeric `error: 1` hide the real access error code.
  const candidates = [
    response?.error?.code, response?.code, response?.error_code, response?.errorCode,
    typeof response?.error === 'string' ? response.error : null,
  ];
  let code = candidates.find(value => typeof value === 'string' && /^[A-Z][A-Z_]+$/.test(value));
  let message = response?.message || response?.error?.message;
  if (!message && status === 403 && path === '/createRequestAndPrayer') {
    message = 'Posting access could not be verified. Please sign in again, or restore purchases if you have Pro.';
  }
  return new ApiError(message || `API error ${status} on ${path}`, { status, code, response });
};

export const apiHeaders = async ({ json = true } = {}) => {
  const headers = {
    'Accept': 'application/json',
    'Authorization': 'Basic ' + AUTH_CREDENTIALS,
  };
  if (json) headers['Content-Type'] = 'application/json';
  const sessionToken = await getUserSessionToken();
  if (sessionToken) headers['x-user-session-token'] = sessionToken;
  return headers;
};

// ─── Generic helpers ──────────────────────────────────────────────────────────
const post = async (path, body, signal) => {
  // Account identity comes from the verified session. Never attach the SDK's
  // possibly anonymous/previous-account ID to unrelated or identity requests.
  const headers = await apiHeaders();
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
    ...(signal ? { signal } : {}),
  });
  let response;
  try { response = await res.json(); } catch (_) { response = null; }
  if (!res.ok) {
    const error = createApiError(res.status, path, response);
    await notifyRequestFailure(error, headers);
    throw error;
  }
  return response;
};

const readErrorResponse = async (res, path, headers) => {
  let response;
  try { response = await res.json(); } catch (_) { response = null; }
  const error = createApiError(res.status, path, response);
  await notifyRequestFailure(error, headers);
  throw error;
};

const fetchWithApi = async (path, options = {}) => {
  const { headers: extraHeaders = {}, body, ...rest } = options;
  const isJson = typeof body === 'string' || body == null;
  const headers = { ...(await apiHeaders({ json: isJson })), ...extraHeaders };
  const res = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    ...(body !== undefined ? { body } : {}),
  });
  if (!res.ok) await readErrorResponse(res, path, headers);
  return res;
};


// ─── Auth / User ──────────────────────────────────────────────────────────────
export const apiRequestPasswordReset = (email)                  => post('/requestPasswordReset', { email });
export const apiResetPassword        = (token, newPassword)     => post('/resetPassword',        { token, newPassword });
export const apiGoogleToken          = (code, codeVerifier, redirectUri) =>
  post('/auth/google/token', { code, codeVerifier: codeVerifier || undefined, redirectUri });
export const apiGoogleLogin          = (payload)                => post('/googleLogin',           payload);
export const apiSocialLogin          = (payload)                => post('/socialLogin',           payload);
export const apiCreateUser           = (payload)                => post('/createUser',            payload);
export const apiGetRequestById       = (requestId, userId, tz, lang) =>
  post('/getRequestById', { requestId, userId, tz, lang });
export const apiGetUser         = (userId)   => post('/getUser',          { userId: String(userId) });
export const apiUpdateUser      = (payload)  => post('/updateUser',        payload);
export const apiDeleteUser      = (userId)   => post('/deleteUser',        { userId, confirmPhrase: 'DELETE MY ACCOUNT' });
export const apiChangePassword  = (payload)  => post('/changePassword',    payload);
export const apiChangeEmail     = (payload)  => post('/updateEmail',       payload);
export const apiBlockUser       = (blockerId, blockedId) => post('/blockUser', { blockerId, blockedId });

// ─── Prayers ──────────────────────────────────────────────────────────────────
export const apiGetMyRequests    = (userId, lang, tz) => post('/getMyRequests', { userId, lang, tz });
export const apiCreatePrayer     = (payload)  => post('/createRequestAndPrayer',     payload);
export const apiEditPrayer       = (payload)  => post('/editRequest',                payload);
export const apiDeletePrayer     = (requestId, userId) => post('/deleteRequestById', { request_id: requestId, userId });
export const apiPrayFor          = (payload)  => post('/prayFor',                    payload);
export const apiMarkAnswered     = (payload)  => post('/markPrayerAnswered',         payload);
export const apiGetAnsweredPrayers = (userId, lang) => post('/getAnsweredPrayers',   { userId, lang });
export const apiReportContent    = (payload)  => post('/reportContent',              payload);
export const apiGetPrayer        = (requestId, lang) => post('/getPrayer',           { requestId, lang });
export const apiGetUserRequests  = (targetUserId, userId, lang) => post('/getUserRequests', { targetUserId, userId, lang });
export const apiGetPrayedFor     = (targetUserId, userId, lang) =>
  post('/getPrayedFor', { targetUserId, userId, lang });

// ─── Generated Prayers ────────────────────────────────────────────────────────
export const apiGetPrayerByRequestId = (requestId, lang) =>
  post('/getPrayerByRequestId', { requestId, lang });
export const apiGetDetailedPrayer = (requestId, lang) =>
  post('/getDetailedPrayerByRequestId', { requestId, lang });

// ─── Community / Churches ────────────────────────────────────────────────────
export const apiGetCommunityWall   = (payload) => post('/getCommunityWall',   payload);
export const apiGetAllChurches     = () =>
  fetchWithApi('/getAllChurches').then(r => r.json());
export const apiGetUsersByChurch   = (churchId) => post('/getUsersByChurch',  { churchId });

// ─── Badges ───────────────────────────────────────────────────────────────────
export const apiGetBadgeDefinitions = () =>
  fetchWithApi('/getBadgeDefinitions').then(r => r.json());
export const apiGetUserBadges = (userId) =>
  fetchWithApi(`/getUserBadges?userId=${userId}`).then(r => r.json());

// ─── Daily Devotional ─────────────────────────────────────────────────────────
export const apiGetDailyDevotional = (lang) => post('/getDailyDevotional', { lang });

export const apiGetDailyDevotionalById = (articleId, lang) =>
  post('/getDailyDevotionalById', { articleId, lang });

export const apiGetDailyDevotionalArchive = (lang, limit = 30, offset = 0) =>
  post('/getDailyDevotionalArchive', { lang, limit, offset });

export const apiReadDailyBread = (userId, devotionalId) =>
  post('/readDailyBread', { userId, devotionalId });

// Returns the raw Response so callers can call .blob() for binary audio data.
// Caller MUST check res.ok before consuming the body.
export const apiGetDailyBreadAudio = async (payload) => {
  const res = await fetchWithApi('/getDailyBreadAudio', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res;
};

// ─── App Version ─────────────────────────────────────────────────────────────
export const apiGetAppVersion = () =>
  fetchWithApi('/api/app-version').then(r => r.json());

// ─── Auth endpoints (used from UserAuth.js) ───────────────────────────────────
export const apiLogin = (email, password) => post('/login', { email, password });
export const apiAppleLogin = (payload) => post('/appleLogin', payload);
const subscriptionRequest = async request => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try { return await request(controller.signal); }
  finally { clearTimeout(timeout); }
};
export const apiGetProStatus = (payload = {}) =>
  subscriptionRequest(signal => post('/api/subscriptions/pro-status', payload, signal));
export const apiGetSubscriptionIdentity = () =>
  subscriptionRequest(signal => post('/api/subscriptions/identity', {}, signal));
export const apiGetAccessPolicy = () => subscriptionRequest(signal =>
  fetchWithApi('/api/subscriptions/access-policy', { method: 'GET', signal }).then(r => r.json()));

// ─── Push Notifications ──────────────────────────────────────────────────────
export const apiRegisterFCMToken = (userId, fcmToken) =>
  post('/registerFCMToken', { userId: String(userId), fcmToken });

// ─── Prayer Audio ─────────────────────────────────────────────────────────────
// Returns raw Response so callers can call .blob() for binary audio data.
// Caller MUST check res.ok before consuming the body.
export const apiGetPrayerAudio = async (requestId, text) => {
  const res = await fetchWithApi('/getPrayerAudio', {
    method: 'POST',
    body: JSON.stringify({ requestId, text }),
  });
  return res;
};

// ─── Help / Contact ───────────────────────────────────────────────────────────
export const apiSubmitHelp = (payload) => post('/contact', payload);

// ─── Content Check (supports optional AbortController signal for timeout) ────
export const apiCheckContent = async (payload, signal) => {
  const res = await fetchWithApi('/checkPrayerContent', {
    method: 'POST',
    body: JSON.stringify(payload),
    ...(signal ? { signal } : {}),
  });
  return res.json();
};

// ─── Profile Picture ─────────────────────────────────────────────────────────
export const apiUploadProfilePicture = async (formData) => {
  const res = await fetchWithApi('/uploadProfilePicture', {
    method: 'POST',
    body: formData,
  });
  return res.json();
};

// ─── Multipart Prayer Create (with image) ────────────────────────────────────
export const apiCreatePrayerWithImage = async (formData, idempotencyKey) => {
  const res = await fetchWithApi('/createRequestAndPrayer', {
    method: 'POST',
    headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {},
    body: formData,
  });
  return res.json();
};

// ─── Multipart Prayer Edit (with image) ──────────────────────────────────────
export const apiEditPrayerWithImage = async (formData) => {
  const res = await fetchWithApi('/editRequest', {
    method: 'POST',
    body: formData,
  });
  return res.json();
};
