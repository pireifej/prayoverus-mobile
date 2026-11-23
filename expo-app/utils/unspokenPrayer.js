const UNSPOKEN_PRAYER_COPY = {
  en: {
    title: 'Private Prayer Intention',
    message: 'Please pray for a private intention. Details are known to God.',
  },
  es: {
    title: 'Intención de oración privada',
    message: 'Por favor, ora por una intención privada. Dios conoce los detalles.',
  },
};

export const getUnspokenPrayerCopy = (language = 'en') =>
  UNSPOKEN_PRAYER_COPY[language] || UNSPOKEN_PRAYER_COPY.en;
