const base = require('./app.json');

const variant = process.env.APP_VARIANT;
const isPreview = variant === 'preview';
const isDev = variant === 'development';

const appName = isPreview ? 'PrayOverUs (Preview)' : isDev ? 'PrayOverUs (Dev)' : 'PrayOverUs';
const androidPackage = isPreview || isDev
  ? `com.pireifej.prayoverus.${variant}`
  : 'com.pireifej.prayoverus';
const iosBundleId = isPreview || isDev
  ? `com.pireifej.prayoverus.${variant}`
  : 'com.pireifej.prayoverus';

module.exports = {
  ...base.expo,
  name: appName,
  android: {
    ...base.expo.android,
    package: androidPackage,
  },
  ios: {
    ...base.expo.ios,
    bundleIdentifier: iosBundleId,
  },
};
