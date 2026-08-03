import { base64Encode } from '../utils/helpers';

// ─── API Configuration ────────────────────────────────────────────────────────
export const API_BASE = 'https://shouldcallpaul.replit.app';

const AUTH_CREDENTIALS = 'shouldcallpaul_admin:rA$b2p&!x9P#sYc';

export const apiHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS),
});

// ─── Generic helper ───────────────────────────────────────────────────────────
const post = async (path, body) => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  return res.json();
};

// ─── Auth / User ──────────────────────────────────────────────────────────────
export const apiGetUser         = (userId)   => post('/getUser',          { userId: String(userId) });
export const apiUpdateUser      = (payload)  => post('/updateUser',        payload);
export const apiDeleteUser      = (userId)   => post('/deleteUser',        { userId });
export const apiChangePassword  = (payload)  => post('/changePassword',    payload);
export const apiChangeEmail     = (payload)  => post('/updateEmail',       payload);
export const apiBlockUser       = (blockerId, blockedId) => post('/blockUser', { blockerId, blockedId });

// ─── Prayers ──────────────────────────────────────────────────────────────────
export const apiGetMyRequests    = (userId)   => post('/getMyRequests',              { userId });
export const apiCreatePrayer     = (payload)  => post('/createRequestAndPrayer',     payload);
export const apiEditPrayer       = (payload)  => post('/editRequest',                payload);
export const apiDeletePrayer     = (requestId, userId) => post('/deleteRequestById', { requestId, userId });
export const apiPrayFor          = (payload)  => post('/prayFor',                    payload);
export const apiMarkAnswered     = (payload)  => post('/markPrayerAnswered',         payload);
export const apiGetAnsweredPrayers = (userId, lang) => post('/getAnsweredPrayers',   { userId: String(userId), lang });
export const apiCheckContent     = (payload)  => post('/checkPrayerContent',         payload);
export const apiReportContent    = (payload)  => post('/reportContent',              payload);

// ─── Generated Prayers ────────────────────────────────────────────────────────
export const apiGetPrayer = (requestId, lang) =>
  post('/getPrayer', { requestId, lang });
export const apiGetPrayerByRequestId = (requestId) =>
  post('/getPrayerByRequestId', { requestId });
export const apiGetDetailedPrayer = (requestId, lang) =>
  post('/getDetailedPrayerByRequestId', { requestId, lang });

// ─── Community / Churches ────────────────────────────────────────────────────
export const apiGetCommunityWall   = (payload) => post('/getCommunityWall',   payload);
export const apiGetAllChurches     = ()         => post('/getAllChurches',     {});
export const apiGetUsersByChurch   = (churchId) => post('/getUsersByChurch',  { churchId });

// ─── Badges ───────────────────────────────────────────────────────────────────
export const apiGetBadgeDefinitions = () =>
  fetch(`${API_BASE}/getBadgeDefinitions`).then(r => r.json());
export const apiGetUserBadges = (userId) =>
  fetch(`${API_BASE}/getUserBadges?userId=${userId}`, {
    headers: { 'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS) },
  }).then(r => r.json());

// ─── Daily Devotional ─────────────────────────────────────────────────────────
export const apiGetDailyDevotional = (lang) => post('/getDailyDevotional', { lang });

// ─── App Version ─────────────────────────────────────────────────────────────
export const apiGetAppVersion = () =>
  fetch(`${API_BASE}/api/app-version`, { headers: apiHeaders() }).then(r => r.json());

// ─── Help / Contact ───────────────────────────────────────────────────────────
export const apiSubmitHelp = (payload) => post('/contact', payload);

// ─── Profile Picture ─────────────────────────────────────────────────────────
export const apiUploadProfilePicture = async (formData) => {
  const res = await fetch(`${API_BASE}/uploadProfilePicture`, {
    method: 'POST',
    headers: { 'Authorization': 'Basic ' + base64Encode(AUTH_CREDENTIALS) },
    body: formData,
  });
  return res.json();
};
