describe('Daily Bread API requests', () => {
  beforeEach(() => {
    jest.resetModules();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete global.fetch;
  });

  test('requests one exact archived article', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: 0, result: { id: 25 } }),
    });
    const { apiGetDailyDevotionalById } = require('../../services/api');

    await apiGetDailyDevotionalById(25, 'es');

    expect(global.fetch).toHaveBeenCalledWith(
      'https://shouldcallpaul.replit.app/getDailyDevotionalById',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ articleId: 25, lang: 'es' }),
      })
    );
  });

  test('requests a paginated archive page', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ error: 0, result: { items: [] } }),
    });
    const { apiGetDailyDevotionalArchive } = require('../../services/api');

    await apiGetDailyDevotionalArchive('en', 30, 60);

    expect(global.fetch).toHaveBeenCalledWith(
      'https://shouldcallpaul.replit.app/getDailyDevotionalArchive',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ lang: 'en', limit: 30, offset: 60 }),
      })
    );
  });

  test('surfaces a missing article response as an API error', async () => {
    global.fetch.mockResolvedValue({ ok: false, status: 404 });
    const { apiGetDailyDevotionalById } = require('../../services/api');

    await expect(apiGetDailyDevotionalById(999999, 'en')).rejects.toThrow(
      'API error 404 on /getDailyDevotionalById'
    );
  });
});