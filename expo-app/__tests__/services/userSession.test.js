jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

import * as SecureStore from 'expo-secure-store';
import {
  clearUserSessionToken,
  extractUserSessionToken,
  getUserSessionToken,
  setUserSessionToken,
  USER_SESSION_TOKEN_KEY,
} from '../../services/userSession';

describe('user session token storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
    return clearUserSessionToken();
  });

  it('hydrates and caches the secure token', async () => {
    SecureStore.getItemAsync.mockResolvedValue('signed-session');

    await expect(getUserSessionToken()).resolves.toBe('signed-session');
    await expect(getUserSessionToken()).resolves.toBe('signed-session');
    expect(SecureStore.getItemAsync).toHaveBeenCalledTimes(1);
  });

  it('stores and deletes the token without using AsyncStorage', async () => {
    await setUserSessionToken(' signed-session ');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith(
      USER_SESSION_TOKEN_KEY,
      'signed-session',
    );
    await expect(getUserSessionToken()).resolves.toBe('signed-session');

    await clearUserSessionToken();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith(USER_SESSION_TOKEN_KEY);
    await expect(getUserSessionToken()).resolves.toBeNull();
  });

  it('accepts both supported backend response shapes', () => {
    expect(extractUserSessionToken({ user_session_token: 'top-level' })).toBe('top-level');
    expect(extractUserSessionToken({
      result: [{ user_session_token: 'nested' }],
    })).toBe('nested');
    expect(extractUserSessionToken({ result: [] })).toBeNull();
  });
});