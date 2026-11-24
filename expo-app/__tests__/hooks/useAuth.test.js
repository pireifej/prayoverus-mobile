/**
 * useAuth unit tests
 *
 * Covers the auth-path assertions from the hook-split smoke plan:
 *   1. Cold-launch reads a valid cached session → currentUser is populated
 *   2. Corrupt cached JSON is discarded safely → app falls through to login
 *   3. Cached session missing required fields is discarded → app falls through to login
 *   4. handleLogin stores the user and sets currentUser
 *   5. handleLogout clears storage and nulls currentUser
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockStorageData = {};

jest.mock('../../utils/storage', () => {
  const STORAGE_KEYS = {
    USER_SESSION: 'userSession',
    ONBOARDING_DONE: '@onboarding_done',
    COMMUNITY_CACHE: 'communityPrayers_cache',
    PRAY_ACTION_COUNT: '@pray_action_count',
    EULA_ACCEPTED: '@eula_accepted',
    BLOCKED_USERS: '@blocked_users',
    LANGUAGE_PREF: '@language_pref',
    REVIEW_STATE: '@review_state',
    OPEN_DATES: '@open_dates',
    DAILY_POST_TRACKER: '@daily_post_tracker',
    ARCHIVE_UNLOCKED: 'archiveUnlocked',
    REMEMBERED_EMAIL: 'rememberedEmail',
    ROSARY_FONT_SIZE: '@rosary_font_size',
  };
  const storage = {
    setItem: jest.fn((key, value) => { mockStorageData[key] = value; return Promise.resolve(); }),
    getItem: jest.fn(key => Promise.resolve(mockStorageData[key] ?? null)),
    removeItem: jest.fn(key => { delete mockStorageData[key]; return Promise.resolve(); }),
    multiRemove: jest.fn(keys => { keys.forEach(k => delete mockStorageData[k]); return Promise.resolve(); }),
  };
  return { storage, STORAGE_KEYS };
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../NotificationService', () => ({
  __esModule: true,
  default: {
    setupNotifications: jest.fn(() => Promise.resolve(true)),
    cleanup: jest.fn(),
  },
}));

jest.mock('../../services/api', () => ({
  apiGetUser: jest.fn(() => Promise.resolve([])),
}));
jest.mock('../../services/userSession', () => ({
  getUserSessionToken: jest.fn().mockResolvedValue('secure-session'),
  setUserSessionToken: jest.fn().mockResolvedValue('secure-session'),
  clearUserSessionToken: jest.fn().mockResolvedValue(),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../../hooks/useAuth';
import { storage, STORAGE_KEYS } from '../../utils/storage';
import { getUserSessionToken, setUserSessionToken, clearUserSessionToken } from '../../services/userSession';

const VALID_USER = {
  id: '42',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  churchId: '1',
  user_session_token: 'secure-session',
};

beforeEach(() => {
  // Clear in-memory store and reset mocks before each test
  Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]);
  jest.clearAllMocks();
  getUserSessionToken.mockResolvedValue('secure-session');
});

describe('useAuth — cold-launch session restore', () => {
  it('sets currentUser when a valid session is cached', async () => {
    mockStorageData[STORAGE_KEYS.USER_SESSION] = JSON.stringify(VALID_USER);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.checkStoredAuth();
    });

    expect(result.current.currentUser).toMatchObject({
      id: VALID_USER.id,
      firstName: VALID_USER.firstName,
    });
    expect(result.current.isCheckingAuth).toBe(false);
  });

  it('leaves currentUser null when no session is cached', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.checkStoredAuth();
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.isCheckingAuth).toBe(false);
  });

  it('discards corrupt JSON and leaves currentUser null', async () => {
    mockStorageData[STORAGE_KEYS.USER_SESSION] = 'NOT_VALID_JSON{{{{';

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.checkStoredAuth();
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.isCheckingAuth).toBe(false);
    // Corrupt record must be removed so the app doesn't loop on next launch
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_SESSION);
  });

  it('discards a session object that is missing the required id field', async () => {
    mockStorageData[STORAGE_KEYS.USER_SESSION] = JSON.stringify({ firstName: 'NoId' });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.checkStoredAuth();
    });

    expect(result.current.currentUser).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_SESSION);
  });
});

describe('useAuth — handleLogin', () => {
  it('sets currentUser and persists session to storage', async () => {
    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.handleLogin(VALID_USER);
    });

    expect(result.current.currentUser).toMatchObject({ id: VALID_USER.id });
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.USER_SESSION,
      JSON.stringify(Object.fromEntries(Object.entries(VALID_USER).filter(([key]) => key !== 'user_session_token'))),
    );
    expect(result.current.currentUser.user_session_token).toBeUndefined();
    expect(setUserSessionToken).toHaveBeenCalledWith('secure-session');
  });

  it('rejects a login response without a signed session', async () => {
    const { result } = renderHook(() => useAuth());
    let accepted;
    await act(async () => { accepted = await result.current.handleLogin({ id: '42' }); });
    expect(accepted).toBe(false);
    expect(result.current.currentUser).toBeNull();
    expect(clearUserSessionToken).toHaveBeenCalled();
  });
});

test('strips legacy profile credentials while retaining a valid secure session', async () => {
  mockStorageData[STORAGE_KEYS.USER_SESSION] = JSON.stringify(VALID_USER);
  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.checkStoredAuth(); });
  expect(result.current.currentUser.id).toBe('42');
  expect(JSON.parse(mockStorageData[STORAGE_KEYS.USER_SESSION]).user_session_token).toBeUndefined();
  expect(result.current.currentUser.user_session_token).toBeUndefined();
});

test('does not recover a missing secure session from an insecure legacy token', async () => {
  getUserSessionToken.mockResolvedValue(null);
  mockStorageData[STORAGE_KEYS.USER_SESSION] = JSON.stringify(VALID_USER);
  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.checkStoredAuth(); });
  expect(result.current.currentUser).toBeNull();
  expect(setUserSessionToken).not.toHaveBeenCalled();
});

describe('useAuth — handleLogout', () => {
  it('sets currentUser to null and clears all user-specific keys from storage', async () => {
    mockStorageData[STORAGE_KEYS.USER_SESSION] = JSON.stringify(VALID_USER);
    mockStorageData[STORAGE_KEYS.COMMUNITY_CACHE] = '[]';
    mockStorageData[STORAGE_KEYS.BLOCKED_USERS] = '[]';
    const { result } = renderHook(() => useAuth());

    // Seed currentUser
    await act(async () => {
      await result.current.handleLogin(VALID_USER);
    });

    expect(result.current.currentUser).not.toBeNull();

    await act(async () => {
      result.current.handleLogout();
    });

    expect(result.current.currentUser).toBeNull();
    // multiRemove must be called with all user-specific keys so shared devices
    // don't expose one person's data to the next user of the app.
    expect(storage.multiRemove).toHaveBeenCalledWith(
      expect.arrayContaining([
        STORAGE_KEYS.USER_SESSION,
        STORAGE_KEYS.COMMUNITY_CACHE,
        STORAGE_KEYS.BLOCKED_USERS,
        STORAGE_KEYS.DAILY_POST_TRACKER,
        STORAGE_KEYS.REVIEW_STATE,
        STORAGE_KEYS.OPEN_DATES,
        STORAGE_KEYS.PRAY_ACTION_COUNT,
        STORAGE_KEYS.REMEMBERED_EMAIL,
        // Must be cleared so the next user on a shared device cannot inherit archive access.
        STORAGE_KEYS.ARCHIVE_UNLOCKED,
      ]),
    );
  });

  it('calls onBeforeLogout if provided so other hooks can reset their state first', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin(VALID_USER);
    });

    const onBeforeLogout = jest.fn();

    await act(async () => {
      result.current.handleLogout({ onBeforeLogout });
    });

    expect(onBeforeLogout).toHaveBeenCalledTimes(1);
    expect(result.current.currentUser).toBeNull();
  });
});

test('ignores an old profile refresh that resolves after an account change', async () => {
  const { apiGetUser } = require('../../services/api');
  const { result } = renderHook(() => useAuth());
  await act(async () => { await result.current.handleLogin(VALID_USER); });
  let resolveProfile;
  apiGetUser.mockReturnValueOnce(new Promise(resolve => { resolveProfile = resolve; }));
  let pending;
  await act(async () => { pending = result.current.refreshUserProfile(); });
  await act(async () => {
    result.current.handleLogout();
    await result.current.handleLogin({ ...VALID_USER, id: '99', user_session_token: 'other-session' });
  });
  await act(async () => { resolveProfile([{ real_name: 'Old account' }]); await pending; });
  expect(result.current.currentUser.id).toBe('99');
  expect(JSON.parse(mockStorageData[STORAGE_KEYS.USER_SESSION]).id).toBe('99');
});
