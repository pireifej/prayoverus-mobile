import {
  buildPendingDailyBreadUrl,
  getNotificationDestination,
} from '../../utils/notifications';
import { parseDailyBreadUrl } from '../../utils/dailyBread';

describe('notification destinations', () => {
  test.each(['foreground tap', 'cold-start tap'])(
    'routes a stable Daily Bread payload on %s',
    () => {
      expect(getNotificationDestination({
        type: 'dailyBread',
        articleId: 22,
        lang: 'es',
      })).toEqual({
        type: 'dailyBread',
        articleId: 22,
        lang: 'es',
      });
    }
  );

  test('routes an older Daily Bread notification to today', () => {
    expect(getNotificationDestination({ type: 'dailyBread' })).toEqual({
      type: 'dailyBread',
      articleId: null,
      lang: 'en',
    });
  });

  test.each(['foreground signed-out tap', 'cold-start auth-loading tap'])(
    'restores the exact Daily Bread article after auth for a %s',
    () => {
      const destination = getNotificationDestination({
        type: 'dailyBread',
        articleId: 22,
        lang: 'es',
      });
      const pendingUrl = buildPendingDailyBreadUrl(destination);

      expect(parseDailyBreadUrl(pendingUrl)).toEqual({
        articleId: 22,
        lang: 'es',
        legacy: false,
      });
    }
  );

  test.each([
    [{ requestId: 42 }, '42'],
    [{ type: 'prayer_support', prayerId: 51 }, '51'],
  ])('routes prayer payload %p to its request', (payload, requestId) => {
    expect(getNotificationDestination(payload)).toEqual({
      type: 'prayer',
      requestId,
    });
  });
});