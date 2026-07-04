const { withDangerousMod, withGradleProperties } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

function withGradleVersionPin(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const propsPath = path.join(
        __dirname,
        'android',
        'gradle',
        'wrapper',
        'gradle-wrapper.properties'
      );

      if (fs.existsSync(propsPath)) {
        let contents = fs.readFileSync(propsPath, 'utf8');
        const before = contents.match(/distributionUrl=.+/)?.[0] || '(not found)';
        contents = contents.replace(
          /distributionUrl=.+/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.13-bin.zip'
        );
        fs.writeFileSync(propsPath, contents);
        console.log('[withGradleVersionPin] Replaced', before, '→ gradle-8.13');
      } else {
        console.warn('[withGradleVersionPin] gradle-wrapper.properties not found at', propsPath);
      }

      return config;
    },
  ]);
}

function withKotlinJvmDefault(config) {
  return withGradleProperties(config, (config) => {
    const props = config.modResults;

    const entries = [
      { key: 'android.suppressUnsupportedCompileSdk',  value: '35' },
      { key: 'android.overrideVersionCheck',           value: 'true' },
    ];

    for (const { key, value } of entries) {
      const existing = props.find((p) => p.type === 'property' && p.key === key);
      if (existing) {
        existing.value = value;
      } else {
        props.push({ type: 'property', key, value });
      }
    }

    return config;
  });
}

function withKspVersionPin(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const buildGradlePath = path.join(__dirname, 'android', 'build.gradle');

      if (!fs.existsSync(buildGradlePath)) {
        console.warn('[withKspVersionPin] android/build.gradle not found');
        return config;
      }

      let contents = fs.readFileSync(buildGradlePath, 'utf8');

      const kspPattern = /id\s+["']com\.google\.devtools\.ksp["']\s+version\s+["'][^"']+["']/;
      if (kspPattern.test(contents)) {
        contents = contents.replace(
          kspPattern,
          'id "com.google.devtools.ksp" version "2.0.21-1.0.25"'
        );
        fs.writeFileSync(buildGradlePath, contents);
        console.log('[withKspVersionPin] Pinned KSP to 1.9.24-1.0.20');
      } else {
        console.log('[withKspVersionPin] KSP plugin declaration not found, skipping');
      }

      return config;
    },
  ]);
}

function withCurrentActivityPatch(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const ktFile = path.join(
        __dirname,
        'node_modules',
        'react-native-google-mobile-ads',
        'android',
        'src',
        'main',
        'java',
        'io',
        'invertase',
        'googlemobileads',
        'ReactNativeGoogleMobileAdsFullScreenAdModule.kt'
      );

      if (!fs.existsSync(ktFile)) {
        console.warn('[withCurrentActivityPatch] Kotlin file not found:', ktFile);
        return config;
      }

      let src = fs.readFileSync(ktFile, 'utf8');

      if (src.includes('val activity = currentActivity')) {
        src = src.replaceAll(
          'val activity = currentActivity',
          'val activity = reactApplicationContext.currentActivity'
        );
        fs.writeFileSync(ktFile, src, 'utf8');
        console.log('[withCurrentActivityPatch] Patched currentActivity → reactApplicationContext.currentActivity');
      } else {
        console.log('[withCurrentActivityPatch] No patch needed (already fixed or different source)');
      }

      return config;
    },
  ]);
}

module.exports = function withAndroidBuildFixes(config) {
  config = withGradleVersionPin(config);
  config = withKotlinJvmDefault(config);
  config = withKspVersionPin(config);
  config = withCurrentActivityPatch(config);
  return config;
};
