/**
 * App.js — EULA gate smoke test
 *
 * Verifies that when `eulaAccepted` is false (and no user is logged in),
 * App.js renders the EULA/Terms screen and blocks all navigation to the main
 * app UI.
 *
 * ── Why this test exists ────────────────────────────────────────────────────
 *   The IS_TESTING guard in App.js (line ~631) skips the AsyncStorage EULA
 *   check during every Jest run, meaning no test normally exercises the path
 *   where eulaAccepted === false.  We force that state by controlling the
 *   useAuth mock directly.
 *
 * ── Section under test ──────────────────────────────────────────────────────
 *   App.js — search for "Show EULA before login if not yet accepted"
 *   Condition: `if (!eulaAccepted && !currentUser)`
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Mock: hooks ───────────────────────────────────────────────────────────────

// useAuth is overridden per-test via mockUseAuthImpl below.
let mockUseAuthImpl = null;

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuthImpl(),
}));

jest.mock('../../hooks/usePrayers', () => ({
  usePrayers: () => ({
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
import { act, render, cleanup, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// App must be imported AFTER all jest.mock() calls are hoisted
let App;
beforeAll(() => {
  App = require('../../App').default;
});

/** Returns a baseline useAuth stub with the given overrides applied. */
function makeAuthStub(overrides = {}) {
  return {
    currentUser: null,
    setCurrentUser: jest.fn(),
    isCheckingAuth: false,
    eulaAccepted: true,
    setEulaAccepted: jest.fn(),
    showOnboarding: false,
    setShowOnboarding: jest.fn(),
    checkStoredAuth: jest.fn(),
    saveUserToStorage: jest.fn(),
    clearUserFromStorage: jest.fn(),
    handleLogin: jest.fn(),
    handleLogout: jest.fn(),
    refreshUserProfile: jest.fn(),
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  // Default: EULA already accepted, no user — renders login screen
  mockUseAuthImpl = () => makeAuthStub();
});

afterEach(async () => {
  await act(async () => { cleanup(); });
  jest.restoreAllMocks();
});

describe('App.js — EULA gate', () => {
  it('shows the EULA/Terms screen when eulaAccepted is false and no user is logged in', async () => {
    // Force the EULA-not-accepted state that IS_TESTING normally bypasses.
    mockUseAuthImpl = () => makeAuthStub({ eulaAccepted: false, currentUser: null });

    const { getByText, queryByText } = render(<App />);
    await act(async () => {});

    // EULA screen headline must be visible
    expect(getByText('🙏 Welcome to Pray Over Us')).toBeTruthy();

    // The "I Agree" button must be present
    expect(getByText('✓ I Agree — Continue')).toBeTruthy();

    // The home bottom-nav labels must NOT appear — the main app is blocked
    expect(queryByText('home')).toBeNull();
    expect(queryByText('community')).toBeNull();
  });

  it('does NOT show the EULA screen when eulaAccepted is true', async () => {
    // Default stub: eulaAccepted === true
    mockUseAuthImpl = () => makeAuthStub({ eulaAccepted: true, currentUser: null });

    const { queryByText } = render(<App />);
    await act(async () => {});

    // EULA headline must not appear
    expect(queryByText('🙏 Welcome to Pray Over Us')).toBeNull();
    expect(queryByText('✓ I Agree — Continue')).toBeNull();
  });

  it('does NOT show the EULA screen when a user is already logged in, even if eulaAccepted is false', async () => {
    // A logged-in user bypasses the EULA check (`!eulaAccepted && !currentUser`)
    mockUseAuthImpl = () => makeAuthStub({
      eulaAccepted: false,
      currentUser: { id: 1, firstName: 'Tester', email: 'test@example.com' },
    });

    const { queryByText } = render(<App />);
    await act(async () => {});

    // The EULA gate condition is `!eulaAccepted && !currentUser`, so a logged-in
    // user should never see this screen.
    expect(queryByText('🙏 Welcome to Pray Over Us')).toBeNull();
    expect(queryByText('✓ I Agree — Continue')).toBeNull();
  });

  it('pressing "I Agree — Continue" calls setEulaAccepted(true) and persists the key to AsyncStorage', async () => {
    const setEulaAccepted = jest.fn();

    mockUseAuthImpl = () => makeAuthStub({ eulaAccepted: false, currentUser: null, setEulaAccepted });

    const { getByText } = render(<App />);
    await act(async () => {});

    // Button must be present
    const agreeButton = getByText('✓ I Agree — Continue');
    expect(agreeButton).toBeTruthy();

    // Press it
    await act(async () => {
      fireEvent.press(agreeButton);
    });

    // setEulaAccepted must have been called with true
    expect(setEulaAccepted).toHaveBeenCalledWith(true);

    // AsyncStorage.setItem must have been called with the EULA_ACCEPTED key
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@eula_accepted', '1');
  });
});
