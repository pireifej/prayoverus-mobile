// Accept web links and custom-scheme links used by email and app sharing.
// Only return a destination; never fetch or navigate to arbitrary nested URLs.
export function parsePrayerRequestLink(value, depth = 0) {
  if (typeof value !== 'string' || depth > 2) return null;
  const match = value.match(/[?&#](?:requestId|request_id|prayerId|prayer_id)=([1-9]\d*)(?=[&#]|$)/i)
    || value.match(/(?:^|\/)(?:requests?|prayers?|testimon(?:y|ial))(?:\/|=)([1-9]\d*)(?=[/?#]|$)/i);
  if (match) {
    const id = Number(match[1]);
    return Number.isSafeInteger(id) ? id : null;
  }
  const nested = value.match(/[?&#](?:url|link|deep_link_id)=([^&#]+)/i);
  if (nested) {
    try { return parsePrayerRequestLink(decodeURIComponent(nested[1]), depth + 1); } catch (_) { return null; }
  }
  return null;
}
