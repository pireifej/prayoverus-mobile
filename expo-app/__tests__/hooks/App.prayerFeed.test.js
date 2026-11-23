/**
 * App.js — community prayer feed render test
 *
 * Mounts App with mocked hooks (useAuth returns a logged-in user,
 * usePrayers returns sample community prayers, useIap returns defaults)
 * and asserts that prayer card titles and content reach the render tree.
 *
 * This test guards against App.js refactors that silently disconnect the
 * hook-supplied communityPrayers array from the JSX that renders the feed.
 *
 * ── What is NOT tested here ──────────────────────────────────────────────────
 *   • usePrayers unit logic (see __tests__/hooks/usePrayers.test.js)
 *   • prayerCallbacksRef wiring (see __tests__/hooks/App.callbackWiring.test.js)
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Fixtures ───────────────────────────────────────────────────────────────────
const MOCK_USER = {
  id: 42,
  firstName: 'Jane',
  email: 'jane@example.com',
  faith_points: 10,
  faith_rank: null,
  isGuest: false,
};
const mockLoadUserPrayers = jest.fn();
const mockLoadCommunityPrayers = jest.fn();

const MOCK_COMMUNITY_PRAYERS = [
  {
    id: 101,
    title: 'Prayer for my father',
    content: 'Please pray for my father who is in the hospital.',
    author: 'Maria',
    isPublic: true,
    prayedFor: false,
    user_has_prayed: false,
    // prayer_count: 0 keeps the badge hidden so the i18n plural-function path
    // (t('prayerCountPlural')(n)) is never reached; the badge only renders when > 0.
    prayer_count: 0,
    prayed_by_names: [],
    prayed_by_people: [],
    timestamp: '2026-08-09T10:00:00Z',
    date: '8/9/2026',
    user_id: 99,
  },
  {
    id: 102,
    title: 'Guidance in difficult times',
    content: 'Seeking strength through a challenging season at work.',
    author: 'John',
    isPublic: true,
    prayedFor: false,
    user_has_prayed: false,
    prayer_count: 0,
    prayed_by_names: [],
    prayed_by_people: [],
    timestamp: '2026-08-09T09:00:00Z',
    date: '8/9/2026',
    user_id: 88,
  },
];

// ── Mock: hooks ───────────────────────────────────────────────────────────────
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    currentUser: MOCK_USER,
    setCurrentUser: jest.fn(),
    isCheckingAuth: false,      // boot check is done — skip loading screen
    eulaAccepted: true,         // EULA accepted — skip EULA screen
    setEulaAccepted: jest.fn(),
    showOnboarding: false,      // onboarding done — skip carousel
    setShowOnboarding: jest.fn(),
    checkStoredAuth: jest.fn(),
    saveUserToStorage: jest.fn(),
    clearUserFromStorage: jest.fn(),
    handleLogin: jest.fn(),
    handleLogout: jest.fn(),
    refreshUserProfile: jest.fn(),
  }),
}));

jest.mock('../../hooks/usePrayers', () => ({
  usePrayers: () => ({
    prayers: [],
    setPrayers: jest.fn(),
    communityPrayers: MOCK_COMMUNITY_PRAYERS,
    setCommunityPrayers: jest.fn(),
    refreshingCommunity: false,
    displayedCount: 12,
    setDisplayedCount: jest.fn(),
    PRAYERS_PAGE_SIZE: 12,
    prayerModal: { visible: false, prayer: null, generatedPrayer: '', loading: false },
    setPrayerModal: jest.fn(),
    amenReady: false,
    setAmenReady: jest.fn(),
    amenTimerRef: { current: null },
    extendedPrayer: null,
    setExtendedPrayer: jest.fn(),
    loadingExtendedPrayer: false,
    setLoadingExtendedPrayer: jest.fn(),
    answeredPrayers: [],
    answeredModal: { visible: false, prayer: null, text: '', isLoading: false },
    setAnsweredModal: jest.fn(),
    loadingAnswered: false,
    loadCommunityPrayers: mockLoadCommunityPrayers,
    onRefreshCommunity: jest.fn(),
    loadUserPrayers: mockLoadUserPrayers,
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
    iapCustomerInfo: null,
    iapProducts: [],
    iapPurchasing: false,
    iapModal: null,
    setIapModal: jest.fn(),
    iapExtendedPrayerUnlocked: false,
    iapThemesUnlocked: false,
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

jest.mock('../../AppModals', () => ({
  showToast: jest.fn(),
  showModal: jest.fn(),
}));

jest.mock('../../services/api', () => ({
  apiCheckContent: jest.fn(() => Promise.resolve({ flagged: false })),
  apiCreatePrayer: jest.fn(() => Promise.resolve({ success: true, remaining: 0 })),
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
import { act, render, cleanup, fireEvent, within } from '@testing-library/react-native';
import { apiCreatePrayer, apiCheckContent } from '../../services/api';
import { showModal } from '../../AppModals';
import { getUnspokenPrayerCopy } from '../../utils/unspokenPrayer';

// App must be imported AFTER all jest.mock() calls are hoisted
let App;
beforeAll(() => {
  App = require('../../App').default;
});

beforeEach(() => {
  jest.clearAllMocks();
  apiCreatePrayer.mockResolvedValue({ success: true, remaining: 0 });
  apiCheckContent.mockResolvedValue({ flagged: false });
  mockLoadUserPrayers.mockResolvedValue(undefined);
  mockLoadCommunityPrayers.mockResolvedValue(undefined);
  // Animated.loop in App.js creates infinite requestAnimationFrame loops that
  // prevent Jest from exiting. Replace .loop with a no-op for this suite.
  jest.spyOn(Animated, 'loop').mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
});

describe('App.js — prayer submission completion', () => {
  const openForm = async () => {
    const screen = render(<App />);
    await act(async () => {});
    fireEvent.press(screen.getByLabelText('New prayer request'));
    fireEvent.changeText(screen.getByPlaceholderText('shareWithCommunity'), 'Please pray for my family.');
    return screen;
  };

  it('closes a successful final free post without waiting for quota/feed refreshes', async () => {
    let resolvePost, rejectRefresh;
    apiCreatePrayer.mockImplementationOnce(() => new Promise(resolve => { resolvePost = resolve; }));
    mockLoadUserPrayers.mockImplementationOnce(() => new Promise((_, reject) => { rejectRefresh = reject; }));
    const screen = await openForm();
    await act(async () => { fireEvent.press(screen.getByTestId('button-submit-prayer')); });
    expect(apiCreatePrayer).toHaveBeenCalledTimes(1);
    await act(async () => { resolvePost({ success: true, remaining: 0 }); });
    expect(screen.queryByPlaceholderText('shareWithCommunity')).toBeNull();
    expect(showModal).not.toHaveBeenCalled();
    await act(async () => {
      rejectRefresh(Object.assign(new Error('Delayed quota failure'), {
        status: 403, response: { error: 'DAILY_LIMIT_REACHED' },
      }));
    });
    expect(screen.queryByPlaceholderText('shareWithCommunity')).toBeNull();
    expect(showModal).not.toHaveBeenCalled();
  }, 15000);

  it('prefills the unspoken option in the composer without posting until reviewed', async () => {
    const unspokenCopy = getUnspokenPrayerCopy('en');
    const screen = render(<App />);
    await act(async () => {});
    fireEvent.press(screen.getByLabelText('New prayer request'));
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));

    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe(unspokenCopy.message);
    expect(screen.queryByTestId('optional-title-input')).toBeNull();
    fireEvent.press(screen.getByTestId('button-add-optional-title'));
    expect(screen.getByTestId('optional-title-input').props.value).toBe(unspokenCopy.title);
    expect(apiCreatePrayer).not.toHaveBeenCalled();

    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('');
  });

  it('toggles the optional title field without losing its draft', async () => {
    const screen = await openForm();

    expect(screen.getByTestId('button-add-optional-title')).toBeTruthy();
    fireEvent.press(screen.getByTestId('button-add-optional-title'));
    expect(screen.getByTestId('optional-title-input')).toBeTruthy();
    fireEvent.changeText(screen.getByTestId('optional-title-input'), 'Prayer for my family');
    fireEvent.press(screen.getByTestId('button-add-optional-title'));
    expect(screen.queryByTestId('optional-title-input')).toBeNull();
    expect(screen.getByTestId('button-add-optional-title').props.accessibilityState.selected).toBe(false);
    fireEvent.press(screen.getByTestId('button-add-optional-title'));
    expect(screen.getByTestId('optional-title-input').props.value).toBe('Prayer for my family');
    expect(screen.queryByText('hideTitle')).toBeNull();
  });

  it('restores the prior body and title after switching unspoken off', async () => {
    const screen = await openForm();
    fireEvent.press(screen.getByTestId('button-add-optional-title'));
    fireEvent.changeText(screen.getByTestId('optional-title-input'), 'My original title');
    fireEvent.changeText(screen.getByPlaceholderText('shareWithCommunity'), 'My original draft');
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    const confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    act(() => confirmation.buttons.find(button => button.label === 'unspokenIntentReplaceText').onPress());
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe(getUnspokenPrayerCopy('en').message);
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('My original draft');
    expect(screen.getByTestId('optional-title-input').props.value).toBe('My original title');
  });

  it('keeps edits made to the generated unspoken message when deselected', async () => {
    const screen = await openForm();
    fireEvent.changeText(screen.getByPlaceholderText('shareWithCommunity'), '');
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    fireEvent.changeText(screen.getByPlaceholderText('shareWithCommunity'), 'Edited private intention');
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('Edited private intention');
    expect(screen.getByTestId('checkbox-unspoken-prayer').props.accessibilityState.checked).toBe(false);
  });

  it('does not restore an old draft after clearing the form', async () => {
    const screen = await openForm();
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    const confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    act(() => confirmation.buttons.find(button => button.label === 'unspokenIntentReplaceText').onPress());
    fireEvent.press(screen.getByText('Clear'));
    const clearConfirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    act(() => clearConfirmation.buttons.find(button => button.label === 'Yes, Clear').onPress());
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('');
  });

  it('retains the original draft when reopening an unspoken draft', async () => {
    const screen = await openForm();
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    const confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    act(() => confirmation.buttons.find(button => button.label === 'unspokenIntentReplaceText').onPress());
    fireEvent.press(screen.getByText('cancelBack'));
    fireEvent.press(screen.getByLabelText('New prayer request'));
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('Please pray for my family.');
  });

  it('groups optional tools and reveals unspoken guidance only when selected', async () => {
    const screen = await openForm();
    const tools = within(screen.getByTestId('composer-tools'));
    expect(tools.getByTestId('button-add-optional-title')).toBeTruthy();
    expect(tools.getByTestId('checkbox-unspoken-prayer')).toBeTruthy();
    expect(tools.getByLabelText('addPhoto')).toBeTruthy();
    expect(screen.queryByText('unspokenIntentHelper')).toBeNull();
    expect(screen.getByTestId('composer-audience')).toBeTruthy();
    expect(screen.queryByTestId('admin-test-post')).toBeNull();

    fireEvent.changeText(screen.getByPlaceholderText('shareWithCommunity'), '');
    fireEvent.press(tools.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.getByText('unspokenIntentHelper')).toBeTruthy();
    expect(screen.getByTestId('checkbox-unspoken-prayer').props.accessibilityState.checked).toBe(true);
    fireEvent.press(screen.getByTestId('checkbox-unspoken-prayer'));
    expect(screen.queryByText('unspokenIntentHelper')).toBeNull();
  });

  it('keeps the admin test-post control separate and preserves its submission flags', async () => {
    const originalEmail = MOCK_USER.email;
    MOCK_USER.email = 'pireifej@gmail.com';
    try {
      const screen = await openForm();
      expect(within(screen.getByTestId('composer-tools')).queryByTestId('admin-test-post')).toBeNull();
      fireEvent.press(screen.getByTestId('admin-test-post'));
      await act(async () => { fireEvent.press(screen.getByTestId('button-submit-prayer')); });
      expect(apiCreatePrayer).toHaveBeenCalledWith(expect.objectContaining({
        isTest: true,
        sendEmail: 'false',
      }));
    } finally {
      MOCK_USER.email = originalEmail;
    }
  });

  it('lets church members choose their audience from the author header', async () => {
    const originalChurch = MOCK_USER.churchName;
    MOCK_USER.churchName = 'Community Church';
    try {
      const screen = await openForm();
      fireEvent.press(screen.getByLabelText('audienceLabel: audienceEveryone'));
      const picker = showModal.mock.calls[showModal.mock.calls.length - 1][0];
      act(() => picker.buttons.find(button => button.label === 'Community Church').onPress());
      expect(screen.getByLabelText('audienceLabel: Community Church')).toBeTruthy();
      fireEvent.press(screen.getByLabelText('audienceLabel: Community Church'));
      const secondPicker = showModal.mock.calls[showModal.mock.calls.length - 1][0];
      act(() => secondPicker.buttons.find(button => button.label === 'audienceEveryone').onPress());
      expect(screen.getByLabelText('audienceLabel: audienceEveryone')).toBeTruthy();
    } finally {
      if (originalChurch === undefined) delete MOCK_USER.churchName;
      else MOCK_USER.churchName = originalChurch;
    }
  });

  it('confirms and posts the home unspoken shortcut through the standard request flow', async () => {
    const unspokenCopy = getUnspokenPrayerCopy('en');
    const screen = render(<App />);
    await act(async () => {});

    fireEvent.press(screen.getByTestId('button-unspoken-prayer-quick'));
    expect(apiCreatePrayer).not.toHaveBeenCalled();
    expect(screen.queryByPlaceholderText('shareWithCommunity')).toBeNull();

    const confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    expect(confirmation.title).toBe('unspokenIntentConfirmTitle');
    expect(confirmation.message).toContain(unspokenCopy.message);
    const postButton = confirmation.buttons.find(button => button.label === 'unspokenIntentConfirmPost');
    expect(postButton).toBeTruthy();

    await act(async () => { await postButton.onPress(); });

    expect(apiCreatePrayer).toHaveBeenCalledWith(expect.objectContaining({
      requestText: unspokenCopy.message,
      requestTitle: unspokenCopy.title,
    }));
    expect(screen.queryByPlaceholderText('shareWithCommunity')).toBeNull();
  });

  it('allows each separately confirmed home unspoken action to submit', async () => {
    const screen = render(<App />);
    await act(async () => {});

    for (let attempt = 0; attempt < 2; attempt += 1) {
      fireEvent.press(screen.getByTestId('button-unspoken-prayer-quick'));
      const confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
      const postButton = confirmation.buttons.find(button => button.label === 'unspokenIntentConfirmPost');
      await act(async () => { await postButton.onPress(); });
    }

    expect(apiCreatePrayer).toHaveBeenCalledTimes(2);
  });

  it('reuses the unspoken idempotency key after a failed attempt', async () => {
    apiCreatePrayer.mockRejectedValueOnce(new Error('Network unavailable'));
    const screen = render(<App />);
    await act(async () => {});

    fireEvent.press(screen.getByTestId('button-unspoken-prayer-quick'));
    let confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    await act(async () => {
      await confirmation.buttons.find(button => button.label === 'unspokenIntentConfirmPost').onPress();
    });
    const firstKey = apiCreatePrayer.mock.calls[0][0].idempotencyKey;

    fireEvent.press(screen.getByTestId('button-unspoken-prayer-quick'));
    confirmation = showModal.mock.calls[showModal.mock.calls.length - 1][0];
    await act(async () => {
      await confirmation.buttons.find(button => button.label === 'unspokenIntentConfirmPost').onPress();
    });

    expect(apiCreatePrayer).toHaveBeenCalledTimes(2);
    expect(apiCreatePrayer.mock.calls[1][0].idempotencyKey).toBe(firstKey);
  });

  it('shows an exact submission limit error, then clears it when a retry succeeds', async () => {
    apiCreatePrayer.mockRejectedValueOnce(Object.assign(new Error('Daily limit reached'), {
      status: 403, response: { error: 'DAILY_LIMIT_REACHED' },
    }));
    const screen = await openForm();
    await act(async () => { fireEvent.press(screen.getByTestId('button-submit-prayer')); });
    expect(showModal).toHaveBeenCalledWith(expect.objectContaining({ title: 'Daily free limit reached' }));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('Please pray for my family.');
    await act(async () => { fireEvent.press(screen.getByTestId('button-submit-prayer')); });
    expect(apiCreatePrayer).toHaveBeenCalledTimes(2);
    expect(screen.queryByPlaceholderText('shareWithCommunity')).toBeNull();
    expect(showModal).toHaveBeenCalledTimes(1);
    fireEvent.press(screen.getByLabelText('New prayer request'));
    expect(screen.getByPlaceholderText('shareWithCommunity').props.value).toBe('');
    expect(screen.queryByText("You've reached today's free request limit. Upgrade to Pro for unlimited daily posts.")).toBeNull();
  });

  it('closes the form after a successful crisis-dialog submission too', async () => {
    apiCheckContent.mockResolvedValueOnce({ type: 'crisis' });
    const screen = await openForm();
    await act(async () => { fireEvent.press(screen.getByTestId('button-submit-prayer')); });
    const dialog = showModal.mock.calls[0][0];
    await act(async () => {
      await dialog.buttons.find(button => button.label === 'Post my original prayer').onPress();
    });
    expect(apiCreatePrayer).toHaveBeenCalledTimes(1);
    expect(screen.queryByPlaceholderText('shareWithCommunity')).toBeNull();
  });
});

afterEach(async () => {
  await act(async () => { cleanup(); });
  jest.restoreAllMocks();
});

describe('App.js — community prayer feed rendering', () => {
  it('renders prayer card titles from communityPrayers on the home screen', async () => {
    const { getByText } = render(<App />);
    await act(async () => {});

    // Both prayer card titles must appear in the render tree.
    // If App.js ever stops passing communityPrayers to the JSX that builds the
    // feed, getByText will throw and the test fails loudly.
    expect(getByText('Prayer for my father')).toBeTruthy();
    expect(getByText('Guidance in difficult times')).toBeTruthy();
  });

  it('renders prayer card content from communityPrayers on the home screen', async () => {
    const { getByText } = render(<App />);
    await act(async () => {});

    expect(getByText('Please pray for my father who is in the hospital.')).toBeTruthy();
    expect(getByText('Seeking strength through a challenging season at work.')).toBeTruthy();
  });

  it('renders both prayer cards when multiple prayers are supplied', async () => {
    const { getAllByText } = render(<App />);
    await act(async () => {});

    // Each card title is unique — finding both confirms two cards rendered.
    // The prayer_count badge for prayer 101 also renders 'prayerCountPlural'
    // (mocked as the key string), but the titles are the clearest signal.
    const titles = [
      'Prayer for my father',
      'Guidance in difficult times',
    ];
    for (const title of titles) {
      const nodes = getAllByText(title);
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('does not render an empty-feed message when prayers are present', async () => {
    const { queryByText } = render(<App />);
    await act(async () => {});

    // 'emptyFeed' is the i18n key rendered when the list is empty;
    // the mock returns the key as-is. It must NOT appear when prayers exist.
    expect(queryByText('emptyFeed')).toBeNull();
  });
});
