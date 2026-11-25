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
    });
    expect(JSON.parse(global.fetch.mock.calls[0][1].body).revenuecatAppUserId).toBeUndefined();

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

describe('subscription API contract', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });
  it('completes reconciliation with only the authorization handle and signed session', async () => {
    const { apiCompleteSubscriptionReconciliation } = require('../../services/api');
    await apiCompleteSubscriptionReconciliation({
      authorizationId: 'synthetic-authorization', fromAppUserId: 'not-sent', isPro: true,
    });
    const [url, request] = global.fetch.mock.calls[0];
    expect(url).toContain('/api/subscriptions/identity-reconciliation/complete');
    expect(JSON.parse(request.body)).toEqual({ authorizationId: 'synthetic-authorization' });
    expect(request.headers['x-user-session-token']).toBeTruthy();
    expect(request.headers.Authorization).toMatch(/^Basic /);
  });
  it('sends an empty identity body, exact explicit status payload, and GET policy', async () => {
    const { apiGetSubscriptionIdentity, apiGetProStatus, apiGetAccessPolicy } = require('../../services/api');
    await apiGetSubscriptionIdentity();
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({});
    await apiGetProStatus({ revenuecatAppUserId: 'server-issued', refresh: true });
    expect(JSON.parse(global.fetch.mock.calls[1][1].body)).toEqual({ revenuecatAppUserId: 'server-issued', refresh: true });
    await apiGetAccessPolicy();
    expect(global.fetch.mock.calls[2][1].method).toBe('GET');
    expect(global.fetch.mock.calls[2][1].body).toBeUndefined();
  });
  it('separates viewed member from the authenticated viewer', async () => {
    const { apiGetPrayedFor } = require('../../services/api');
    await apiGetPrayedFor('target', 'viewer', 'es');
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toEqual({
      targetUserId: 'target', userId: 'viewer', lang: 'es',
    });
  });
  it('ignores an old session failure after a new account signs in', async () => {
    const { apiGetProStatus } = require('../../services/api');
    const { setUserSessionToken } = require('../../services/userSession');
    const handler = jest.fn();
    setApiAuthFailureHandler(handler);
    let respond;
    global.fetch.mockImplementationOnce(() => new Promise(resolve => { respond = resolve; }));
    const pending = apiGetProStatus();
    await new Promise(resolve => setImmediate(resolve));
    await setUserSessionToken('next-account-session');
    respond({ ok: false, status: 401, json: async () => ({ error: 'USER_SESSION_REQUIRED' }) });
    await expect(pending).rejects.toMatchObject({ status: 401 });
    expect(handler).not.toHaveBeenCalled();
    setApiAuthFailureHandler(null);
    await setUserSessionToken('signed-session');
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
      code: 'DAILY_LIMIT_REACHED', status: 403,
    });
    expect(handler).not.toHaveBeenCalled();
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

  it('does not guess the daily-limit code from a forbidden response message', async () => {
    const { apiCreatePrayer } = require('../../services/api');
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 403,
      json: async () => ({ message: 'Daily quota could not be verified' }),
    });
    await expect(apiCreatePrayer({})).rejects.toMatchObject({ status: 403, code: undefined });
  });

  it('leaves exact daily-limit failures with the posting form instead of a global popup', async () => {
    const { apiCreatePrayer } = require('../../services/api');
    const handler = jest.fn();
    setApiAccessFailureHandler(handler);
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 403,
      json: async () => ({ error: 'DAILY_LIMIT_REACHED' }),
    });
    await expect(apiCreatePrayer({})).rejects.toMatchObject({
      status: 403, response: { error: 'DAILY_LIMIT_REACHED' },
    });
    expect(handler).not.toHaveBeenCalled();
    setApiAccessFailureHandler(null);
  });

  it('does not turn a successful response with zero remaining into an access failure', async () => {
    const { apiCreatePrayer } = require('../../services/api');
    const handler = jest.fn();
    setApiAccessFailureHandler(handler);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ success: true, remaining: 0 }),
    });
    await expect(apiCreatePrayer({})).resolves.toMatchObject({ success: true, remaining: 0 });
    expect(handler).not.toHaveBeenCalled();
    setApiAccessFailureHandler(null);
  });
});