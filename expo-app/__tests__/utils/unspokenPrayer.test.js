import { getUnspokenPrayerCopy } from '../../utils/unspokenPrayer';

describe('getUnspokenPrayerCopy', () => {
  it('returns the English private-intention copy by default', () => {
    expect(getUnspokenPrayerCopy()).toEqual({
      title: 'Private Prayer Intention',
      message: 'Please pray for a private intention. Details are known to God.',
    });
  });

  it('provides Spanish copy and falls back to English for unknown languages', () => {
    expect(getUnspokenPrayerCopy('es').message).toBe(
      'Por favor, ora por una intención privada. Dios conoce los detalles.'
    );
    expect(getUnspokenPrayerCopy('fr')).toEqual(getUnspokenPrayerCopy('en'));
  });
});
