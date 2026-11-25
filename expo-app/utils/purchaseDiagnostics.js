// Explicit allowlist: never expose receipts, transaction tokens, signatures,
// subscriber attributes, or the raw CustomerInfo / HTTP response.
const text = value => typeof value === 'string' ? value.slice(0, 256) : null;
const date = value => {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return null;
  return new Date(value).toISOString();
};

export function summarizePurchaseInfo(info) {
  const entitlements = Object.values(info?.entitlements?.all || {});
  const subscriptions = info?.subscriptionsByProductIdentifier || {};
  const products = [...new Set([
    ...(info?.allPurchasedProductIdentifiers || []),
    ...Object.keys(subscriptions),
    ...entitlements.map(item => item.productIdentifier),
    ...(info?.nonSubscriptionTransactions || []).map(item => item.productIdentifier),
  ].filter(value => typeof value === 'string'))];
  return {
    originalAppUserId: text(info?.originalAppUserId),
    requestDate: date(info?.requestDate),
    products: products.map(product => {
      const detail = subscriptions[product]
        || entitlements.find(item => item.productIdentifier === product);
      const expiration = detail?.expiresDate ?? detail?.expirationDate
        ?? info?.allExpirationDates?.[product];
      const active = typeof detail?.isActive === 'boolean' ? detail.isActive
        : Array.isArray(info?.activeSubscriptions)
          ? info.activeSubscriptions.includes(product) : null;
      return {
        product: text(product),
        environment: detail?.isSandbox === true ? 'Sandbox / test'
          : detail?.isSandbox === false ? 'Production' : 'Not reported by SDK',
        store: text(detail?.store),
        expiration: date(expiration),
        active,
      };
    }),
  };
}

export function summarizeBackendStatus(status) {
  return {
    state: 'success',
    checkedAt: new Date().toISOString(),
    isPro: status.isPro,
    identityVerificationRequired: status.identityVerificationRequired,
    reason: typeof status.reason === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(status.reason)
      ? status.reason : null,
  };
}
