const DAILY_BREAD_URL = 'https://prayoverus.com/daily-bread.php';

const toPositiveInteger = (value) => {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const normalizeLanguage = (value, fallback = 'en') =>
  value === 'es' || value === 'en' ? value : fallback;

export const normalizeDailyBread = (raw) => {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: toPositiveInteger(raw.id),
    lang: normalizeLanguage(raw.lang),
    title: raw.title || '',
    content: raw.article_body ?? raw.content ?? '',
    bibleVerse: raw.bible_verse ?? raw.bibleVerse ?? '',
    verseReference: raw.verse_reference ?? raw.verseReference ?? '',
    prayer: raw.prayer || '',
    imageURL: raw.image_url ?? raw.imageURL ?? '',
    theme: raw.theme || '',
    date: raw.date || raw.created_at || raw.createdAt || '',
    createdAt: raw.created_at ?? raw.createdAt ?? '',
  };
};

export const buildDailyBreadShareUrl = (devotional, fallbackLang = 'en') => {
  const articleId = toPositiveInteger(devotional?.id);
  if (!articleId) return null;
  const lang = normalizeLanguage(devotional?.lang, normalizeLanguage(fallbackLang));
  return `${DAILY_BREAD_URL}?id=${articleId}&lang=${lang}`;
};

const readQueryParam = (url, name) => {
  const match = String(url).match(new RegExp(`[?&]${name}=([^&#]+)`, 'i'));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  } catch (_) {
    return match[1];
  }
};

export const parseDailyBreadUrl = (url) => {
  const value = String(url || '');
  const isCanonical = /(?:^|\/)daily-bread\.php(?:[?#]|$)/i.test(value);
  const isLegacy = /[?&]open=dailybread(?:[&#]|$)/i.test(value);
  if (!isCanonical && !isLegacy) return null;

  return {
    articleId: toPositiveInteger(readQueryParam(value, 'id')),
    lang: normalizeLanguage(readQueryParam(value, 'lang')),
    legacy: isLegacy && !isCanonical,
  };
};

export const readDailyBreadArchivePage = (data) => {
  const result = data?.result;
  const rawItems = Array.isArray(result?.items)
    ? result.items
    : Array.isArray(result)
      ? result
      : [];
  const items = rawItems
    .map(normalizeDailyBread)
    .filter(item => item?.id && item.title);

  return {
    items,
    hasMore: Boolean(result?.has_more),
    offset: Number.isInteger(result?.offset) ? result.offset : 0,
    limit: Number.isInteger(result?.limit) ? result.limit : items.length,
    total: Number.isInteger(result?.total) ? result.total : null,
    nextOffset: Boolean(result?.has_more)
      ? (Number.isInteger(result?.offset) ? result.offset : 0)
        + (Number.isInteger(result?.limit) && result.limit > 0 ? result.limit : rawItems.length)
      : null,
  };
};

export const createLatestRequestGate = () => {
  let currentToken = 0;
  return {
    start: () => {
      currentToken += 1;
      return currentToken;
    },
    isCurrent: token => token === currentToken,
    invalidate: () => {
      currentToken += 1;
    },
  };
};
