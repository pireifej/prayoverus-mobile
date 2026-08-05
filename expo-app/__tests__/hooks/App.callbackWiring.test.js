/**
 * App.js — prayerCallbacksRef wiring smoke test
 *
 * Verifies that App.js populates prayerCallbacksRef.current with every
 * callback that usePrayers reads via cbRef.current.*  If a refactor removes
 * or renames one of these keys in App.js, this test fails loudly instead of
 * the feature silently doing nothing at runtime.
 *
 * ── Section under test ──────────────────────────────────────────────────────
 *   App.js — search for "Wire UI callbacks into the prayers hook ref"
 *   prayerCallbacksRef.current = { onBadgeCelebration, onLevelUp,
 *     onPrayerAnimation, onPlaySound, onReview, onGuestPrompt }
 *
 *   Note: onAmenComplete is wired inline (passed directly to _markAsPrayed),
 *   not via the ref — see the markAsPrayed wrapper just below that section.
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Capture prayerCallbacksRef ─────────────────────────────────────────────
// usePrayers is mocked to intercept the callbacksRef argument App.js passes.
// After App renders (which assigns prayerCallbacksRef.current = {...} inline),
// capturedCallbacksRef.current holds the exact object App wired.
let capturedCallbacksRef = null;

// ── Mock: hooks ───────────────────────────────────────────────────────────────
jest.mock('../../hooks/usePrayers', () => ({
  usePrayers: (params) => {
    capturedCallbacksRef = params.callbacksRef;
    return {
      prayers: [], setPrayers: jest.fn(),
      communityPrayers: [], setCommunityPrayers: jest.fn(),
      refreshingCommunity: false,
      displayedCount: 12, setDisplayedCount: jest.fn(),
      PRAYERS_PAGE_SIZE: 12,
      prayerModal: { visible: false, prayer: null, generatedPrayer: '', loading: false },
      setPrayerModal: jest.fn(),
      amenReady: false, setAmenReady: jest.fn(),
      amenTimerRef: { current: null },
      extendedPrayer: null, setExtendedPrayer: jest.fn(),
      loadingExtendedPrayer: false, setLoadingExtendedPrayer: jest.fn(),
      answeredPrayers: [],
      answeredModal: { visible: false, prayer: null, text: '', isLoading: false },
      setAnsweredModal: jest.fn(),
      loadingAnswered: false,
      loadCommunityPrayers: jest.fn(),
      onRefreshCommunity: jest.fn(),
      loadUserPrayers: jest.fn(),
      prayForRequest: jest.fn(),
      markAsPrayed: jest.fn(),
      recordSwipePrayer: jest.fn(),
      generatePrayer: jest.fn(),
      clearPrayerModal: jest.fn(),
      fetchExtendedPrayer: jest.fn(),
      loadAnsweredPrayers: jest.fn(),
      submitTestimony: jest.fn(),
    };
  },
}));

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: null, setCurrentUser: jest.fn(),
    isCheckingAuth: false,
    eulaAccepted: true, setEulaAccepted: jest.fn(),
    showOnboarding: false, setShowOnboarding: jest.fn(),
    checkStoredAuth: jest.fn(),
    saveUserToStorage: jest.fn(),
    clearUserFromStorage: jest.fn(),
    handleLogin: jest.fn(),
    handleLogout: jest.fn(),
    refreshUserProfile: jest.fn(),
  }),
}));

jest.mock('../../hooks/useIap', () => ({
  useIap: () => ({
    rcAvailable: false,
    iapCustomerInfo: null, iapProducts: [], iapPurchasing: false,
    iapModal: { visible: false }, setIapModal: jest.fn(),
    iapExtendedPrayerUnlocked: false, iapThemesUnlocked: false,
    hasEntitlement: jest.fn(() => false),
    isThemeUnlocked: jest.fn(() => false),
    getIapPrice: jest.fn(() => null),
    loadIapData: jest.fn(),
    doIapPurchase: jest.fn(),
    doIapRestore: jest.fn(),
  }),
  ENTITLEMENT_EXTENDED_PRAYER: 'extended_prayer',
  ENTITLEMENT_PREMIUM_THEMES: 'premium_themes',
  PRODUCT_EXTENDED_PRAYER: 'extended_prayer_product',
  THEME_PRODUCTS: [],
}));

// ── Mock: storage / async-storage ─────────────────────────────────────────────
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
  },
  STORAGE_KEYS: {
    USER_SESSION: 'userSession',
    COMMUNITY_CACHE: 'communityPrayers_cache',
    DAILY_POST_TRACKER: '@daily_post_tracker',
    BLOCKED_USERS: '@blocked_users',
    REVIEW_STATE: '@review_state',
    OPEN_DATES: '@open_dates',
    EULA_ACCEPTED: '@eula_accepted',
    LANGUAGE_PREF: '@language_pref',
    ONBOARDING_DONE: '@onboarding_done',
    PRAY_ACTION_COUNT: '@pray_action_count',
    ARCHIVE_UNLOCKED: 'archiveUnlocked',
    REMEMBERED_EMAIL: 'rememberedEmail',
    ROSARY_FONT_SIZE: '@rosary_font_size',
    PREMIUM_BG_THEME: '@premium_bg_theme',
    PRAYER_LAYOUT: '@prayer_layout',
    PRAYER_BG_INDEX: '@prayer_bg_index',
    PRAYER_SOUND: '@prayer_sound',
    DAILY_POST_COUNT_KEY: '@daily_post_count',
  },
}));

// ── Mock: Expo modules ────────────────────────────────────────────────────────
jest.mock('expo-av', () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(() =>
        Promise.resolve({ sound: { playAsync: jest.fn(), unloadAsync: jest.fn() } })
      ),
    },
    setAudioModeAsync: jest.fn(() => Promise.resolve()),
  },
}));
jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { LinearGradient: (props) => React.createElement(View, props) };
});
jest.mock('expo-store-review', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(false)),
  requestReview: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-updates', () => ({
  channel: 'test',
  useUpdates: jest.fn(() => ({})),
  checkForUpdateAsync: jest.fn(() => Promise.resolve({ isAvailable: false })),
  fetchUpdateAsync: jest.fn(() => Promise.resolve()),
  reloadAsync: jest.fn(() => Promise.resolve()),
}));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  removeNotificationSubscription: jest.fn(),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getExpoPushTokenAsync: jest.fn(() => Promise.resolve({ data: 'test-token' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  // Required for cold-start notification check in App.js (search "getLastNotificationResponseAsync")
  getLastNotificationResponseAsync: jest.fn(() => Promise.resolve(null)),
}));

// ── Mock: local screens & components ─────────────────────────────────────────
jest.mock('../../UserAuth', () => ({
  LoginScreen: () => null,
  ForgotPasswordScreen: () => null,
  ResetPasswordScreen: () => null,
}));
jest.mock('../../NotificationService', () => ({
  __esModule: true,
  default: { setupNotifications: jest.fn(() => Promise.resolve(true)), cleanup: jest.fn() },
}));
jest.mock('../../PrayerDetailScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../RosaryScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../GroupRosaryScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../DailyBreadScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../PrayerWalkScreen', () => ({ __esModule: true, default: () => null }));
jest.mock('../../OnboardingCarousel', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/HtmlText', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/PrayerHandsLoader', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/AnimatedButton', () => ({ __esModule: true, default: () => null }));
jest.mock('../../components/PrayerOptionsMenu', () => ({ __esModule: true, default: () => null }));

// ── Mock: utilities & API ─────────────────────────────────────────────────────
jest.mock('../../AppModals', () => ({ showToast: jest.fn(), showModal: jest.fn() }));

jest.mock('../../utils', () => ({
  getRelativeTime: jest.fn(() => 'now'),
  Avatar: () => null,
  RELIGIOUS_EMOJIS: [],
  resolveAvatarUri: jest.fn(u => u),
}));

jest.mock('../../utils/helpers', () => ({
  getFaithRank: jest.fn(() => ({ level: 1, name: 'Seeker' })),
  FAITH_RANKS: [],
  isNewerVersion: jest.fn(() => false),
  markdownToHtml: jest.fn(t => t),
  translateRank: jest.fn(r => r),
}));

jest.mock('../../i18n', () => {
  const t = jest.fn(key => key);
  t.__esModule = true;
  t.default = t;
  t.lang = 'en';
  t.setLang = jest.fn();
  t.translateRank = jest.fn(r => r);
  return t;
});

jest.mock('../../services/api', () => ({
  apiHeaders: jest.fn(() => ({})),
  apiGetDailyDevotional: jest.fn(() => Promise.resolve({ error: 1 })),
  apiGetPrayerByRequestId: jest.fn(() => Promise.resolve({ error: 1 })),
  apiGetBadgeDefinitions: jest.fn(() => Promise.resolve({ error: 0, badges: [] })),
  apiGetUserBadges: jest.fn(() => Promise.resolve([])),
  apiGetAppVersion: jest.fn(() => Promise.resolve({ error: 1 })),
  apiReportContent: jest.fn(() => Promise.resolve({ error: 0 })),
  apiBlockUser: jest.fn(() => Promise.resolve({ error: 0 })),
  apiGetUserRequests: jest.fn(() => Promise.resolve([])),
  apiGetPrayedFor: jest.fn(() => Promise.resolve([])),
  apiEditPrayer: jest.fn(() => Promise.resolve({ error: 0 })),
  apiDeletePrayer: jest.fn(() => Promise.resolve({ error: 0 })),
  apiGetAllChurches: jest.fn(() => Promise.resolve([])),
  apiGetUsersByChurch: jest.fn(() => Promise.resolve([])),
  apiUpdateUser: jest.fn(() => Promise.resolve({ error: 0 })),
  apiUploadProfilePicture: jest.fn(() => Promise.resolve({ error: 0 })),
  apiChangePassword: jest.fn(() => Promise.resolve({ error: 0 })),
  apiChangeEmail: jest.fn(() => Promise.resolve({ error: 0 })),
  apiDeleteUser: jest.fn(() => Promise.resolve({ error: 0 })),
  apiSubmitHelp: jest.fn(() => Promise.resolve({ error: 0 })),
  apiCheckContent: jest.fn(() => Promise.resolve({ error: 0 })),
  apiCreatePrayer: jest.fn(() => Promise.resolve({ error: 0 })),
  apiCreatePrayerWithImage: jest.fn(() => Promise.resolve({ error: 0 })),
  apiEditPrayerWithImage: jest.fn(() => Promise.resolve({ error: 0 })),
  apiGetCommunityWall: jest.fn(() => Promise.resolve([])),
  apiGetMyRequests: jest.fn(() => Promise.resolve([])),
  apiPrayFor: jest.fn(() => Promise.resolve({ error: 0 })),
  apiGetUser: jest.fn(() => Promise.resolve([])),
  apiGetPrayer: jest.fn(() => Promise.resolve({ error: 1 })),
  apiGetDetailedPrayer: jest.fn(() => Promise.resolve({ error: 1 })),
  apiMarkAnswered: jest.fn(() => Promise.resolve({ error: 0 })),
  apiGetAnsweredPrayers: jest.fn(() => Promise.resolve([])),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import React from 'react';
import { Animated } from 'react-native';
import { act, render, cleanup } from '@testing-library/react-native';

// App must be imported AFTER all jest.mock() calls are hoisted
let App;
beforeAll(() => {
  App = require('../../App').default;
});

beforeEach(() => {
  capturedCallbacksRef = null;
  jest.clearAllMocks();

  // Animated.loop in App.js creates infinite requestAnimationFrame loops that
  // prevent Jest from exiting.  Replace .loop with a no-op for this suite.
  jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
});

afterEach(async () => {
  // Flush any pending React state updates, then clean up rendered trees.
  await act(async () => {
    cleanup();
  });
  jest.restoreAllMocks();
});

describe('App.js — prayerCallbacksRef wiring', () => {
  /**
   * REQUIRED CALLBACKS
   * These keys are read by usePrayers via cbRef.current.* and must all be
   * assigned as functions before any user interaction reaches the hook.
   *
   * ── Where to look in App.js ──────────────────────────────────────────────
   *   Search: "Wire UI callbacks into the prayers hook ref"
   *   Line:   prayerCallbacksRef.current = { onBadgeCelebration, ... }
   * ────────────────────────────────────────────────────────────────────────
   */
  const REQUIRED_CALLBACKS = [
    'onPrayerAnimation',  // triggerPrayerAnimation — shows confetti / hands anim
    'onLevelUp',          // (rank) => setShowLevelUp(rank) — faith rank celebration
    'onBadgeCelebration', // showBadgeCelebration — badge earned modal
    'onGuestPrompt',      // showGuestPrompt — nudge guests to sign up
    'onReview',           // maybeRequestReview — App Store / Play Store review prompt
    'onPlaySound',        // playHeavenlyChime — plays the prayer confirmation sound
  ];

  it('populates prayerCallbacksRef.current with all required callbacks after render', async () => {
    // render() already wraps the initial render in a synchronous act(); flush
    // pending async effects afterwards with a separate await act(async () => {}).
    render(<App />);
    await act(async () => {});

    // usePrayers received a callbacksRef whose .current was populated inline
    // by App.js on the first render pass (before effects fire).
    expect(capturedCallbacksRef).not.toBeNull();
    expect(capturedCallbacksRef.current).not.toBeNull();

    for (const key of REQUIRED_CALLBACKS) {
      expect(typeof capturedCallbacksRef.current[key]).toBe('function');
    }
  });

  it('re-populates callbacks with fresh closures on every re-render', async () => {
    const { rerender } = render(<App />);
    await act(async () => {});

    // Record the function references from the first render
    const firstFns = REQUIRED_CALLBACKS.map(key => capturedCallbacksRef.current[key]);

    act(() => { rerender(<App />); });
    await act(async () => {});

    // After re-render, all required callbacks must still be functions
    for (const key of REQUIRED_CALLBACKS) {
      expect(typeof capturedCallbacksRef.current[key]).toBe('function');
    }

    // App.js replaces the callback object on each render with fresh closures
    const secondFns = REQUIRED_CALLBACKS.map(key => capturedCallbacksRef.current[key]);
    expect(firstFns).not.toEqual(secondFns);
  });

  it('does not accidentally wire onAmenComplete via the ref (it is passed inline)', async () => {
    // onAmenComplete is intentionally NOT in the ref — App.js passes it
    // directly as a parameter to _markAsPrayed().  If it ever appears here
    // the architecture changed and this comment should be updated.
    render(<App />);
    await act(async () => {});

    expect(capturedCallbacksRef.current).not.toHaveProperty('onAmenComplete');
  });
});
