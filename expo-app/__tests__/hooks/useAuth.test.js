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

// ── Tests ─────────────────────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react-native';
import { useAuth } from '../../hooks/useAuth';
import { storage, STORAGE_KEYS } from '../../utils/storage';

const VALID_USER = {
  id: '42',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  churchId: '1',
};

beforeEach(() => {
  // Clear in-memory store and reset mocks before each test
  Object.keys(mockStorageData).forEach(k => delete mockStorageData[k]);
  jest.clearAllMocks();
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
      JSON.stringify(VALID_USER),
    );
  });
});

describe('useAuth — handleLogout', () => {
  it('sets currentUser to null and removes the session from storage', async () => {
    mockStorageData[STORAGE_KEYS.USER_SESSION] = JSON.stringify(VALID_USER);
    const { result } = renderHook(() => useAuth());

    // Seed currentUser
    await act(async () => {
      await result.current.handleLogin(VALID_USER);
    });

    expect(result.current.currentUser).not.toBeNull();

    act(() => {
      result.current.handleLogout();
    });

    expect(result.current.currentUser).toBeNull();
    expect(storage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.USER_SESSION);
  });

  it('calls onBeforeLogout if provided so other hooks can reset their state first', async () => {
    const { result } = renderHook(() => useAuth());
    await act(async () => {
      await result.current.handleLogin(VALID_USER);
    });

    const onBeforeLogout = jest.fn();

    act(() => {
      result.current.handleLogout({ onBeforeLogout });
    });

    expect(onBeforeLogout).toHaveBeenCalledTimes(1);
    expect(result.current.currentUser).toBeNull();
  });
});
