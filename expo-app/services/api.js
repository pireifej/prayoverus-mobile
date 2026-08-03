import { base64Encode } from '../utils/helpers';

// ─── API Configuration ────────────────────────────────────────────────────────
export const API_BASE = 'https://shouldcallpaul.replit.app';

const AUTH_CREDENTIALS = 'shouldcallpaul_admin:rA$b2p&!x9P#sYc';

export const apiHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS),
});

// ─── Generic helpers ──────────────────────────────────────────────────────────
const post = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
};

// Public POST — no Authorization header (for unauthenticated endpoints)
const postPublic = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on ${path}`);
  return res.json();
};

// ─── Auth / User ──────────────────────────────────────────────────────────────
export const apiRequestPasswordReset = (email)                  => post('/requestPasswordReset', { email });
export const apiResetPassword        = (token, newPassword)     => post('/resetPassword',        { token, newPassword });
export const apiGoogleToken          = (code, codeVerifier, redirectUri) =>
  post('/auth/google/token', { code, codeVerifier: codeVerifier || undefined, redirectUri });
export const apiGoogleLogin          = (payload)                => post('/googleLogin',           payload);
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
export const apiGetPrayedFor     = (userId, lang) => post('/getPrayedFor',           { userId, lang });

// ─── Generated Prayers ────────────────────────────────────────────────────────
export const apiGetPrayerByRequestId = (requestId, lang) =>
  post('/getPrayerByRequestId', { requestId, lang });
export const apiGetDetailedPrayer = (requestId, lang) =>
  post('/getDetailedPrayerByRequestId', { requestId, lang });

// ─── Community / Churches ────────────────────────────────────────────────────
export const apiGetCommunityWall   = (payload) => post('/getCommunityWall',   payload);
export const apiGetAllChurches     = () =>
  fetch(`${API_BASE}/getAllChurches`, {
    headers: { 'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS) },
  }).then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); });
export const apiGetUsersByChurch   = (churchId) => post('/getUsersByChurch',  { churchId });

// ─── Badges ───────────────────────────────────────────────────────────────────
export const apiGetBadgeDefinitions = () =>
  fetch(`${API_BASE}/getBadgeDefinitions`)
    .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); });
export const apiGetUserBadges = (userId) =>
  fetch(`${API_BASE}/getUserBadges?userId=${userId}`, {
    headers: { 'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS) },
  }).then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); });

// ─── Daily Devotional ─────────────────────────────────────────────────────────
export const apiGetDailyDevotional = (lang) => post('/getDailyDevotional', { lang });

export const apiReadDailyBread = (userId, devotionalId) =>
  post('/readDailyBread', { userId, devotionalId });

// Returns the raw Response so callers can call .blob() for binary audio data.
// Caller MUST check res.ok before consuming the body.
export const apiGetDailyBreadAudio = async (payload) => {
  const res = await fetch(`${API_BASE}/getDailyBreadAudio`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Audio API error ${res.status} on /getDailyBreadAudio`);
  return res;
};

// ─── App Version ─────────────────────────────────────────────────────────────
export const apiGetAppVersion = () =>
  fetch(`${API_BASE}/api/app-version`, { headers: apiHeaders() })
    .then(r => { if (!r.ok) throw new Error(`API error ${r.status}`); return r.json(); });

// ─── Auth endpoints (used from UserAuth.js) ───────────────────────────────────
export const apiLogin = (email, password) => post('/login', { email, password });
export const apiAppleLogin = (payload) => post('/appleLogin', payload);

// ─── Push Notifications ──────────────────────────────────────────────────────
export const apiRegisterFCMToken = (userId, fcmToken) =>
  post('/registerFCMToken', { userId: String(userId), fcmToken });

// ─── Prayer Audio ─────────────────────────────────────────────────────────────
// Returns raw Response so callers can call .blob() for binary audio data.
// Caller MUST check res.ok before consuming the body.
export const apiGetPrayerAudio = async (requestId, text) => {
  const res = await fetch(`${API_BASE}/getPrayerAudio`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify({ requestId, text }),
  });
  if (!res.ok) throw new Error(`Audio API error ${res.status} on /getPrayerAudio`);
  return res;
};

// ─── Help / Contact ───────────────────────────────────────────────────────────
export const apiSubmitHelp = (payload) => post('/contact', payload);

// ─── Content Check (supports optional AbortController signal for timeout) ────
export const apiCheckContent = async (payload, signal) => {
  const res = await fetch(`${API_BASE}/checkPrayerContent`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(payload),
    ...(signal ? { signal } : {}),
  });
  if (!res.ok) throw new Error(`API error ${res.status} on /checkPrayerContent`);
  return res.json();
};

// ─── Profile Picture ─────────────────────────────────────────────────────────
export const apiUploadProfilePicture = async (formData) => {
  const res = await fetch(`${API_BASE}/uploadProfilePicture`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS) },
    body: formData,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on /uploadProfilePicture`);
  return res.json();
};

// ─── Multipart Prayer Create (with image) ────────────────────────────────────
export const apiCreatePrayerWithImage = async (formData, idempotencyKey) => {
  const res = await fetch(`${API_BASE}/createRequestAndPrayer`, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS),
      ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
    },
    body: formData,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on /createRequestAndPrayer`);
  return res.json();
};

// ─── Multipart Prayer Edit (with image) ──────────────────────────────────────
export const apiEditPrayerWithImage = async (formData) => {
  const res = await fetch(`${API_BASE}/editRequest`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS),
    },
    body: formData,
  });
  if (!res.ok) throw new Error(`API error ${res.status} on /editRequest`);
  return res.json();
};
