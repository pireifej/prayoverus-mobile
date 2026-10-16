import { dailyRequestDate, storedDailyRequestCount } from '../../utils/dailyRequestLimit';

test('counts use the local calendar date rather than UTC midnight', () => {
  expect(dailyRequestDate(new Date(2026, 9, 16, 23, 30))).toBe('2026-10-16');
});

test('only a valid count for the current day contributes to the UI gate', () => {
  expect(storedDailyRequestCount('{"date":"2026-10-16","count":1}', '2026-10-16')).toBe(1);
  for (const raw of [null, 'broken', 'null', '{"date":"2026-10-15","count":1}', '{"date":"2026-10-16","count":"1"}']) {
    expect(storedDailyRequestCount(raw, '2026-10-16')).toBe(0);
  }
});
