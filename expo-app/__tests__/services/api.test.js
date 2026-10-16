jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue('signed-session'),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('../../services/purchasesClient', () => ({
  client: {
    getAppUserID: jest.fn().mockResolvedValue('rc-user-123'),
  },
}));

import {
  apiGoogleLogin,
  apiSocialLogin,
  apiHeaders,
  setApiAccessFailureHandler,
  setApiAuthFailureHandler,
} from '../../services/api';

describe('protected API requests', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ error: 0, result: [] }),
    });
    setApiAuthFailureHandler(null);
    setApiAccessFailureHandler(null);
  });

  it('preserves Basic auth and adds the signed session header', async () => {
    const headers = await apiHeaders();

    expect(headers.Authorization).toMatch(/^Basic /);
    expect(headers['x-user-session-token']).toBe('signed-session');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('sends provider access tokens instead of profile-derived passwords', async () => {
    await apiGoogleLogin({ access_token: 'google-provider-token' });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      access_token: 'google-provider-token',
      revenuecatAppUserId: 'rc-user-123',
    });

    await apiSocialLogin({ provider: 'facebook', access_token: 'facebook-provider-token' });
    expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toMatchObject({
      provider: 'facebook',
      access_token: 'facebook-provider-token',
    });
  });

  it('notifies the app about session and Pro access failures', async () => {
    const authFailure = jest.fn();
    const accessFailure = jest.fn();
    setApiAuthFailureHandler(authFailure);
    setApiAccessFailureHandler(accessFailure);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'USER_SESSION_REQUIRED' }),
    });
    await expect(apiGoogleLogin({ access_token: 'token' })).rejects.toMatchObject({
      status: 401,
      code: 'USER_SESSION_REQUIRED',
    });
    expect(authFailure).toHaveBeenCalledTimes(1);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      json: async () => ({ error: 'PRO_REQUIRED' }),
    });
    await expect(apiGoogleLogin({ access_token: 'token' })).rejects.toMatchObject({
      status: 403,
      code: 'PRO_REQUIRED',
    });
    expect(accessFailure).toHaveBeenCalledTimes(1);
  });
});

describe('posting access responses', () => {
  it('recognizes an access code even when a legacy numeric error flag is present', async () => {
    const { apiCreatePrayer } = require('../../services/api');
    const handler = jest.fn();
    setApiAccessFailureHandler(handler);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 403,
      json: async () => ({ error: 1, code: 'DAILY_LIMIT_REACHED', message: 'One free request per day.' }),
    });
    await expect(apiCreatePrayer({})).rejects.toMatchObject({
      code: 'DAILY_LIMIT_REACHED', accessFailureHandled: true,
    });
    expect(handler).toHaveBeenCalledTimes(1);
    setApiAccessFailureHandler(null);
  });

  it('does not present an unknown forbidden response as proof a purchase is required', async () => {
    const { apiCreatePrayer } = require('../../services/api');
    const handler = jest.fn();
    setApiAccessFailureHandler(handler);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 403, json: async () => { throw new Error('Not JSON'); },
    });
    await expect(apiCreatePrayer({})).rejects.toMatchObject({
      status: 403, message: expect.stringContaining('Posting access could not be verified'),
    });
    expect(handler).not.toHaveBeenCalled();
    setApiAccessFailureHandler(null);
  });
});