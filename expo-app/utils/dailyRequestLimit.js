export function dailyRequestDate(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export function storedDailyRequestCount(raw, today = dailyRequestDate()) {
  try {
    const record = JSON.parse(raw);
    return record?.date === today && Number.isSafeInteger(record.count) && record.count >= 0 ? record.count : 0;
  } catch (_) {
    // The backend remains authoritative if a local UI hint is corrupt.
    return 0;
  }
}
