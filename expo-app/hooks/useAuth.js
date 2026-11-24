/**
 * useAuth — owns all user-session state and auth-related storage/API calls.
 *
 * Extracted from App.js so that a bug in auth logic never crashes the entire
 * render tree. App.js composes this hook and uses the returned values for
 * routing decisions and passing user context to other hooks.
 */
import { useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../NotificationService';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { apiGetUser } from '../services/api';
import {
  clearUserSessionToken,
  getUserSessionToken,
  setUserSessionToken,
} from '../services/userSession';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  // defaults true so the EULA screen only shows when we confirm it was never accepted
  const [eulaAccepted, setEulaAccepted] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const cleanupRef = useRef(Promise.resolve());
  const sessionEpoch = useRef(0);
  const profileWrites = useRef(Promise.resolve());
  const activeUserId = useRef(null);
  activeUserId.current = currentUser?.id || null;

  // ── Storage helpers ─────────────────────────────────────────────────────────

  const saveUserToStorage = async (userData) => {
    const epoch = sessionEpoch.current;
    try {
      const { user_session_token: _credential, ...profile } = userData;
      const write = profileWrites.current.catch(() => {}).then(() => {
        if (epoch === sessionEpoch.current) {
          return storage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(profile));
        }
      });
      profileWrites.current = write.catch(() => {});
      await write;
    } catch (error) {
      console.warn('[Storage] Error saving user session:', error.message);
    }
  };

  const clearUserFromStorage = () => {
    ++sessionEpoch.current;
    const cleanup = (async () => {
      // Attach a rejection handler immediately; cache cleanup may take longer
      // than secure-store cleanup. Surface a secure-store failure afterward.
      const tokenCleanup = clearUserSessionToken().then(() => null, error => error);
      try {
        const removal = profileWrites.current.catch(() => {}).then(() => storage.multiRemove([
          STORAGE_KEYS.USER_SESSION,
          STORAGE_KEYS.COMMUNITY_CACHE,
          STORAGE_KEYS.DAILY_POST_TRACKER,
          STORAGE_KEYS.BLOCKED_USERS,
          STORAGE_KEYS.REVIEW_STATE,
          STORAGE_KEYS.OPEN_DATES,
          STORAGE_KEYS.PRAY_ACTION_COUNT,
          STORAGE_KEYS.REMEMBERED_EMAIL,
          // Never let another account inherit an ad-reward archive unlock.
          STORAGE_KEYS.ARCHIVE_UNLOCKED,
        ]));
        profileWrites.current = removal.catch(() => {});
        await removal;
      } catch (error) {
        console.warn('[Storage] Error clearing user data on logout:', error.message);
      } finally {
        const failure = await tokenCleanup;
        if (failure) throw failure;
      }
    })();
    cleanupRef.current = cleanup.catch(() => {});
    return cleanup;
  };

  // ── Boot: read cached session ───────────────────────────────────────────────

  const checkStoredAuth = async () => {
    const epoch = sessionEpoch.current;
    console.log('[Boot] Reading cached session...');
    try {
      // Hydrate the Keychain/Keystore-backed token before any background
      // profile or feature request can run.
      const secureToken = await getUserSessionToken();
      const userData = await storage.getItem(STORAGE_KEYS.USER_SESSION);
      if (epoch !== sessionEpoch.current) return;
      if (userData) {
        let parsedUserData;
        try {
          parsedUserData = JSON.parse(userData);
        } catch (parseErr) {
          console.warn('[Boot] Session JSON corrupt — clearing and forcing re-login:', parseErr.message);
          await storage.removeItem(STORAGE_KEYS.USER_SESSION);
          return; // falls through to finally → setIsCheckingAuth(false) → login screen
        }
        // Validate minimum required fields before trusting the session
        if (!parsedUserData || !parsedUserData.id) {
          console.warn('[Boot] Session missing required fields — clearing');
          await storage.removeItem(STORAGE_KEYS.USER_SESSION);
          return;
        }
        // Never recover credentials from the insecure legacy profile copy.
        // Strip it even when the secure session is still valid.
        if ('user_session_token' in parsedUserData) {
          const { user_session_token: _legacyToken, ...profile } = parsedUserData;
          parsedUserData = profile;
          await saveUserToStorage(profile);
        }
        if (!secureToken) {
          await clearUserFromStorage();
          return;
        }
        if (epoch !== sessionEpoch.current) return;
        console.log('[Boot] Session found for user', parsedUserData.id, '—', parsedUserData.firstName);
        setCurrentUser(parsedUserData);

        // Re-register push notification token on every launch (token can rotate between sessions).
        // Delayed 2 s so it doesn't compete with boot-path storage I/O.
        setTimeout(() => {
          if (epoch !== sessionEpoch.current) return;
          NotificationService.setupNotifications(parsedUserData.id)
            .catch(e => console.warn('[Boot] Push token renewal error:', e?.message));
        }, 2000);

        // Refresh profile from server to get latest data (church, faith rank, etc.)
        setTimeout(async () => {
          if (epoch !== sessionEpoch.current) return;
          try {
            console.log('[Boot] Background profile refresh starting...');
            const data = await apiGetUser(parsedUserData.id);
            if (epoch !== sessionEpoch.current) return;
            const userArray = Array.isArray(data) ? data : (data.result || []);
            if (userArray.length > 0) {
              const user = userArray[0];
              const refreshedUser = {
                ...parsedUserData,
                firstName: user.real_name || parsedUserData.firstName,
                lastName: user.last_name || parsedUserData.lastName,
                churchId: user.church_id || parsedUserData.churchId,
                churchName: user.church_name || parsedUserData.churchName,
                title: user.user_title,
                about: user.user_about,
                picture: user.picture || user.profile_picture_url || parsedUserData.picture,
                faith_points: user.faith_points || 0,
                faith_rank: user.faith_rank || null,
                prayer_count: parseInt(user.prayer_count, 10) || 0,
                request_count: parseInt(user.request_count, 10) || 0,
                rosary_count: parseInt(user.rosary_count, 10) || parsedUserData.rosary_count || 0,
                auth_provider: user.auth_provider || parsedUserData.auth_provider || 'email',
                has_password: user.has_password ?? parsedUserData.has_password ?? true,
              };
              console.log('[Boot] Profile refreshed from server. Church:', refreshedUser.churchName, 'Faith pts:', refreshedUser.faith_points);
              setCurrentUser(refreshedUser);
              await saveUserToStorage(refreshedUser);
            }
          } catch (e) {
            console.warn('[Boot] Background profile refresh failed:', e.message);
          }
        }, 0);
      } else {
        console.log('[Boot] No cached session — redirecting to login');
      }
    } catch (error) {
      console.warn('[Boot] Error reading session storage:', error.message);
    } finally {
      try {
        const onboardingDone = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_DONE);
        if (!onboardingDone) setShowOnboarding(true);
      } catch (_) {}
      console.log('[Boot] Auth check complete — app ready');
      setIsCheckingAuth(false);
    }
  };

  // ── Auth actions ────────────────────────────────────────────────────────────

  const handleLogin = async (userData) => {
    await cleanupRef.current;
    if (currentUser?.id && userData?.id && String(currentUser.id) !== String(userData.id)) {
      await clearUserFromStorage();
    }
    const sessionToken = userData?.user_session_token;
    const epoch = ++sessionEpoch.current;
    if (typeof sessionToken === 'string' && sessionToken.trim() && userData?.id) {
      await setUserSessionToken(sessionToken);
    } else {
      // Never let a previous account's signed session authenticate this one.
      await clearUserFromStorage();
      setCurrentUser(null);
      return false;
    }
    if (epoch !== sessionEpoch.current) return false;
    const { user_session_token: _credential, ...profile } = userData;
    setCurrentUser(profile);
    await saveUserToStorage(profile);

    // Set up push notifications for the logged-in user
    if (userData?.id) {
      NotificationService.setupNotifications(userData.id)
        .catch(error => console.warn('[Notifications] Setup failed:', error?.message));
    }
    return true;
  };

  /**
   * handleLogout — resets auth state and clears storage.
   * @param {Object} [opts]
   * @param {Function} [opts.onBeforeLogout] - called before user is set to null so
   *   the caller can clear prayer / community state from other hooks first.
   */
  const handleLogout = ({ onBeforeLogout } = {}) => {
    console.log('🚪 Logout initiated');
    try {
      activeUserId.current = null;
      try { NotificationService.cleanup(); } catch (e) {
        console.log('Notification cleanup error (non-blocking):', e);
      }

      if (onBeforeLogout) onBeforeLogout();

      // Clear storage (async, fire-and-forget)
      clearUserFromStorage().catch(err => console.log('Storage clear error:', err));

      // Set user to null LAST to trigger re-render with login screen
      setCurrentUser(null);
      console.log('✅ Logout complete');
    } catch (error) {
      console.log('❌ Logout error:', error);
      setCurrentUser(null); // force logout even on error
    }
  };

  /**
   * refreshUserProfile — re-fetches the user record from the server and persists
   * the updated data to AsyncStorage.
   */
  const refreshUserProfile = async (userOverride) => {
    const user = userOverride || currentUser;
    const epoch = sessionEpoch.current;
    if (String(user?.id) !== String(activeUserId.current)) return;
    if (!user?.id) {
      console.log('No user ID available for refreshing profile');
      return;
    }
    try {
      console.log('🔄 Refreshing user profile data');
      const data = await apiGetUser(user.id.toString());
      if (epoch !== sessionEpoch.current) return;
      const userArray = Array.isArray(data) ? data : (data.result || []);
      if (userArray.length > 0) {
        const u = userArray[0];
        const updatedUser = {
          ...user,
          firstName: u.real_name,
          lastName: u.last_name,
          churchId: u.church_id,
          churchName: u.church_name,
          title: u.user_title,
          about: u.user_about,
          picture: u.picture || u.profile_picture_url,
          faith_points: u.faith_points || user.faith_points || 0,
          faith_rank: u.faith_rank || user.faith_rank || null,
          prayer_count: parseInt(u.prayer_count, 10) || user.prayer_count || 0,
          request_count: parseInt(u.request_count, 10) || user.request_count || 0,
          rosary_count: parseInt(u.rosary_count, 10) || user.rosary_count || 0,
        };
        console.log('✅ User profile refreshed. First:', u.real_name, 'Church:', u.church_name);
        setCurrentUser(updatedUser);
        await saveUserToStorage(updatedUser);
        return updatedUser;
      }
    } catch (error) {
      console.log('Error refreshing user profile:', error.message);
    }
  };

  return {
    // state
    currentUser,
    setCurrentUser,
    isCheckingAuth,
    eulaAccepted,
    setEulaAccepted,
    showOnboarding,
    setShowOnboarding,
    // functions
    checkStoredAuth,
    saveUserToStorage,
    clearUserFromStorage,
    handleLogin,
    handleLogout,
    refreshUserProfile,
  };
}
