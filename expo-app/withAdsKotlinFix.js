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

    const key = 'kotlin.jvm.default';
    const existing = props.find((p) => p.type === 'property' && p.key === key);
    if (existing) {
      existing.value = 'all';
    } else {
      props.push({ type: 'property', key, value: 'all' });
    }

    return config;
  });
}

module.exports = function withAndroidBuildFixes(config) {
  config = withGradleVersionPin(config);
  config = withKotlinJvmDefault(config);
  return config;
};
