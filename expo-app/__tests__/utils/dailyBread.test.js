import {
  buildDailyBreadShareUrl,
  createLatestRequestGate,
  normalizeDailyBread,
  parseDailyBreadUrl,
  readDailyBreadArchivePage,
} from '../../utils/dailyBread';

describe('Daily Bread links and API data', () => {
  test('builds a permanent article URL with its language', () => {
    expect(buildDailyBreadShareUrl({ id: 42, lang: 'es' })).toBe(
      'https://prayoverus.com/daily-bread.php?id=42&lang=es'
    );
  });

  test('does not create a misleading today link without an article ID', () => {
    expect(buildDailyBreadShareUrl({ title: 'Cached article' }, 'en')).toBeNull();
  });

  test('parses canonical links regardless of query parameter order', () => {
    expect(parseDailyBreadUrl('https://prayoverus.com/daily-bread.php?lang=es&id=42')).toEqual({
      articleId: 42,
      lang: 'es',
      legacy: false,
    });
  });

  test('recognizes the legacy today link', () => {
    expect(parseDailyBreadUrl('https://prayoverus.com/download.html?open=dailybread')).toEqual({
      articleId: null,
      lang: 'en',
      legacy: true,
    });
  });

  test('preserves the backend ID while normalizing an article', () => {
    expect(normalizeDailyBread({
      id: 17,
      lang: 'en',
      title: 'Hope',
      article_body: 'Body',
      bible_verse: 'Verse',
      verse_reference: 'John 1',
      image_url: 'https://example.com/hope.jpg',
      created_at: '2026-08-01 08:00:00',
    })).toMatchObject({
      id: 17,
      lang: 'en',
      title: 'Hope',
      content: 'Body',
      bibleVerse: 'Verse',
      verseReference: 'John 1',
      imageURL: 'https://example.com/hope.jpg',
    });
  });

  test('reads a paginated archive and ignores invalid entries', () => {
    expect(readDailyBreadArchivePage({
      error: 0,
      result: {
        items: [
          { id: 3, lang: 'en', title: 'Newest', date: '2026-08-03' },
          { id: null, lang: 'en', title: 'Invalid', date: '2026-08-02' },
        ],
        offset: 0,
        limit: 30,
        has_more: true,
        total: 45,
      },
    })).toMatchObject({
      items: [{ id: 3, title: 'Newest' }],
      offset: 0,
      limit: 30,
      hasMore: true,
      total: 45,
      nextOffset: 30,
    });
  });

  test('turns an empty or failed archive payload into an empty page', () => {
    expect(readDailyBreadArchivePage({ error: 1 })).toEqual({
      items: [],
      hasMore: false,
      offset: 0,
      limit: 0,
      total: null,
      nextOffset: null,
    });
  });

  test('advances archive pagination using the server page size', () => {
    expect(readDailyBreadArchivePage({
      error: 0,
      result: {
        items: [{ id: 8, title: 'Only valid item' }, { id: null, title: 'Filtered item' }],
        offset: 30,
        limit: 30,
        has_more: true,
      },
    }).nextOffset).toBe(60);
  });

  test('invalidates stale exact article requests', () => {
    const gate = createLatestRequestGate();
    const firstLink = gate.start();
    const secondLink = gate.start();

    expect(gate.isCurrent(firstLink)).toBe(false);
    expect(gate.isCurrent(secondLink)).toBe(true);

    gate.invalidate();
    expect(gate.isCurrent(secondLink)).toBe(false);
  });
});