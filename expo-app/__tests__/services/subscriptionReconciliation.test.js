jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(), setItemAsync: jest.fn(), deleteItemAsync: jest.fn(),
}));
import * as SecureStore from 'expo-secure-store';
import {
  performReconciliation, reconciliationStore, validateReconciliation,
  repairErrorMessage,
} from '../../services/subscriptionReconciliation';

const target = 'pou_v1_synthetic';
const transition = () => ({
  authorizationId: '12345678-1234-4234-8234-123456789abc',
  action: 'switch_without_restore',
  fromAppUserId: 'synthetic-legacy',
  toAppUserId: target,
  expectedOriginalAppUserId: '$RCAnonymousID:synthetic',
  expiresAt: new Date(Date.now() + 60000).toISOString(),
});
let sdk, save, complete, currentId;
beforeEach(() => {
  jest.clearAllMocks();
  currentId = 'synthetic-legacy';
  sdk = {
    getAppUserID: jest.fn(async () => currentId),
    getCustomerInfo: jest.fn(async () => ({ originalAppUserId: '$RCAnonymousID:synthetic' })),
    logIn: jest.fn(async id => { currentId = id; }),
    logOut: jest.fn(), restorePurchases: jest.fn(), syncPurchases: jest.fn(), purchasePackage: jest.fn(),
  };
  save = jest.fn().mockResolvedValue(undefined);
  complete = jest.fn().mockResolvedValue({ completed: true, revenuecatAppUserId: target });
});
const run = (offer, overrides = {}) => performReconciliation({
  userId: 'synthetic-user', identity: { revenuecatAppUserId: target, identityReconciliation: offer },
  sdk, save, complete, current: () => true, confirmed: true, ...overrides,
});
test('persists confirmed consent before an identified-to-identified switch and completes with only its handle', async () => {
  const offer = transition();
  sdk.logIn.mockImplementation(async id => {
    expect(save).toHaveBeenCalledWith('synthetic-user', offer);
    currentId = id;
  });
  await run(offer);
  expect(sdk.logIn).toHaveBeenCalledWith(target);
  expect(complete).toHaveBeenCalledWith({ authorizationId: offer.authorizationId });
  for (const method of ['logOut', 'restorePurchases', 'syncPurchases', 'purchasePackage']) {
    expect(sdk[method]).not.toHaveBeenCalled();
  }
});
test.each([
  { action: 'restore' }, { toAppUserId: 'pou_v1_other' },
  { fromAppUserId: '$RCAnonymousID:unexpected' }, { fromAppUserId: 'pou_v1_other' },
  { authorizationId: 'invalid' }, { expiresAt: 'bad date' },
  { expiresAt: '2000-01-01T00:00:00Z' }, { expectedOriginalAppUserId: 'identified' },
])('rejects unsafe offers before any SDK change: %j', async change => {
  await expect(run({ ...transition(), ...change })).rejects.toThrow();
  expect(sdk.logIn).not.toHaveBeenCalled();
  expect(complete).not.toHaveBeenCalled();
});
test('requires explicit confirmation, source current identity and exact original identity', async () => {
  await expect(run(transition(), { confirmed: false })).rejects.toThrow();
  currentId = '$RCAnonymousID:unexpected';
  await expect(run(transition())).rejects.toThrow();
  currentId = 'synthetic-legacy';
  sdk.getCustomerInfo.mockResolvedValue({ originalAppUserId: '$RCAnonymousID:other' });
  await expect(run(transition())).rejects.toThrow();
  expect(sdk.logIn).not.toHaveBeenCalled();
});
test('does not switch if secure persistence fails', async () => {
  save.mockRejectedValue(new Error('storage unavailable'));
  await expect(run(transition())).rejects.toThrow();
  expect(sdk.logIn).not.toHaveBeenCalled();
});
test('stops if the app account changes during the SDK read or durable write', async () => {
  let active = true;
  sdk.getCustomerInfo.mockImplementation(async () => {
    active = false;
    return { originalAppUserId: '$RCAnonymousID:synthetic' };
  });
  await expect(run(transition(), { current: () => active })).rejects.toThrow();
  expect(sdk.logIn).not.toHaveBeenCalled();
  active = true;
  sdk.getCustomerInfo.mockResolvedValue({ originalAppUserId: '$RCAnonymousID:synthetic' });
  save.mockImplementation(async () => { active = false; });
  await expect(run(transition(), { current: () => active })).rejects.toThrow();
  expect(sdk.logIn).not.toHaveBeenCalled();
});
test('does not complete if SDK login returns without switching, or account changes after login', async () => {
  sdk.logIn.mockResolvedValue({});
  await expect(run(transition())).rejects.toThrow();
  expect(complete).not.toHaveBeenCalled();
  let active = true;
  sdk.logIn.mockImplementation(async () => { currentId = target; active = false; });
  await expect(run(transition(), { current: () => active })).rejects.toThrow();
  expect(complete).not.toHaveBeenCalled();
});
test('resumes after interruption at the saved target without another login or requiring the old original ID', async () => {
  currentId = target;
  await run(undefined, { pending: transition(), confirmed: false });
  expect(sdk.getCustomerInfo).not.toHaveBeenCalled();
  expect(sdk.logIn).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledTimes(1);
});
test('target without saved consent, changed approval, expired journal and unexpected SDK ID fail closed', async () => {
  const offer = transition();
  currentId = target;
  await expect(run(offer)).rejects.toThrow();
  await expect(run({ ...offer, authorizationId: '22345678-1234-4234-8234-123456789abc' },
    { pending: offer })).rejects.toThrow();
  await expect(run(undefined, { pending: { ...offer, expiresAt: '2000-01-01T00:00:00Z' } })).rejects.toThrow();
  currentId = 'other-customer';
  await expect(run(offer, { pending: offer })).rejects.toThrow();
  expect(sdk.logIn).not.toHaveBeenCalled();
  expect(complete).not.toHaveBeenCalled();
});
test('completion timeout retries the same operation without repeating SDK login', async () => {
  const offer = transition();
  complete.mockRejectedValueOnce(new Error('timeout'));
  await expect(run(offer)).rejects.toThrow('timeout');
  await run(undefined, { pending: offer });
  expect(sdk.logIn).toHaveBeenCalledTimes(1);
  expect(complete).toHaveBeenNthCalledWith(1, { authorizationId: offer.authorizationId });
  expect(complete).toHaveBeenNthCalledWith(2, { authorizationId: offer.authorizationId });
});
test.each([
  { completed: false, revenuecatAppUserId: target },
  { completed: true, revenuecatAppUserId: 'pou_v1_other' },
])('rejects invalid completion response %j', async response => {
  complete.mockResolvedValue(response);
  await expect(run(transition())).rejects.toThrow();
});
test('expiry is rechecked after a delayed secure write', async () => {
  const offer = transition();
  save.mockImplementation(async () => {
    jest.spyOn(Date, 'now').mockReturnValue(Date.parse(offer.expiresAt) + 1);
  });
  try {
    await expect(run(offer)).rejects.toThrow('SUBSCRIPTION_RECONCILIATION_EXPIRED');
    expect(sdk.logIn).not.toHaveBeenCalled();
  } finally { jest.restoreAllMocks(); }
});
test('secure journal is account-bound, contains no customer info, and clears only its owner', async () => {
  const offer = transition();
  await reconciliationStore.save('synthetic-user', offer);
  const record = SecureStore.setItemAsync.mock.calls[0][1];
  expect(JSON.parse(record)).toEqual({
    version: 1, userId: 'synthetic-user', confirmed: true, transition: offer,
  });
  SecureStore.getItemAsync.mockResolvedValue(record);
  expect(await reconciliationStore.read('synthetic-user')).toEqual(offer);
  await reconciliationStore.clear('other-user');
  expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
  await reconciliationStore.clear('synthetic-user');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(1);
  await reconciliationStore.read('other-user');
  expect(SecureStore.deleteItemAsync).toHaveBeenCalledTimes(2);
});
test('malformed or unconfirmed journal stops instead of being treated as absent', async () => {
  SecureStore.getItemAsync.mockResolvedValue('{bad');
  await expect(reconciliationStore.read('synthetic-user')).rejects.toThrow();
  SecureStore.getItemAsync.mockResolvedValue(JSON.stringify({ userId: 'synthetic-user', version: 1 }));
  await expect(reconciliationStore.read('synthetic-user')).rejects.toThrow();
});
test('maps operational failures to safe support/retry messages, not raw provider data', () => {
  expect(repairErrorMessage({ code: 'SUBSCRIPTION_RECONCILIATION_EXPIRED' })).toContain('expired');
  expect(repairErrorMessage({ code: 'SUBSCRIPTION_RECONCILIATION_REVIEW_REQUIRED' })).toContain('support review');
  expect(repairErrorMessage({ status: 401 })).toContain('Sign in');
  expect(repairErrorMessage(new Error('sensitive provider body'))).not.toContain('sensitive');
  expect(() => validateReconciliation(null, target)).toThrow();
});
