import { buildDailyBreadShareUrl } from './dailyBread';

export const getNotificationDestination = (data = {}) => {
  if (data.type === 'dailyBread') {
    const parsedId = Number.parseInt(data.articleId, 10);
    return {
      type: 'dailyBread',
      articleId: Number.isInteger(parsedId) && parsedId > 0 ? parsedId : null,
      lang: data.lang === 'es' ? 'es' : 'en',
    };
  }

  const requestId = data.requestId || data.prayerId;
  if (requestId) {
    return { type: 'prayer', requestId: String(requestId) };
  }

  return { type: 'fallback' };
};

export const buildPendingDailyBreadUrl = (destination) => (
  destination?.articleId
    ? buildDailyBreadShareUrl({
      id: destination.articleId,
      lang: destination.lang,
    })
    : 'https://prayoverus.com/download.html?open=dailybread'
);