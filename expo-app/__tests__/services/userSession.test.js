jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

let SecureStore, clearUserSessionToken, extractUserSessionToken,
  getUserSessionToken, setUserSessionToken, USER_SESSION_TOKEN_KEY;

describe('user session token storage', () => {
  beforeEach(() => {
    jest.resetModules();
    SecureStore = require('expo-secure-store');
    ({ clearUserSessionToken, extractUserSessionToken, getUserSessionToken,
      setUserSessionToken, USER_SESSION_TOKEN_KEY } = require('../../services/userSession'));
    SecureStore.getItemAsync.mockResolvedValue(null);
    SecureStore.setItemAsync.mockResolvedValue(undefined);
    SecureStore.deleteItemAsync.mockResolvedValue(undefined);
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

  it('a pending cold read cannot restore a token cleared during logout', async () => {
    let resolveRead;
    SecureStore.getItemAsync.mockReturnValue(new Promise(resolve => { resolveRead = resolve; }));
    const pending = getUserSessionToken();
    await new Promise(resolve => setImmediate(resolve));
    const cleanup = clearUserSessionToken();
    resolveRead('previous-account-token');
    await cleanup;
    await expect(pending).resolves.toBeNull();
    await expect(getUserSessionToken()).resolves.toBeNull();
  });

  it('serializes old logout cleanup before writing the next account token', async () => {
    await setUserSessionToken('old-token');
    const cleanup = clearUserSessionToken();
    const login = setUserSessionToken('next-account-token');
    await Promise.all([cleanup, login]);
    await expect(getUserSessionToken()).resolves.toBe('next-account-token');
    expect(SecureStore.deleteItemAsync.mock.invocationCallOrder[0])
      .toBeLessThan(SecureStore.setItemAsync.mock.invocationCallOrder[1]);
  });
});