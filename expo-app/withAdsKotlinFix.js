const { withDangerousMod } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withGradleVersionPin(config) {
  return withDangerousMod(config, [
    'android',
    (config) => {
      const wrapperDir = path.join(
        config.modResults.projectRoot,
        'android',
        'gradle',
        'wrapper'
      );
      const propsPath = path.join(wrapperDir, 'gradle-wrapper.properties');

      if (fs.existsSync(propsPath)) {
        let contents = fs.readFileSync(propsPath, 'utf8');
        contents = contents.replace(
          /distributionUrl=.+/,
          'distributionUrl=https\\://services.gradle.org/distributions/gradle-8.10.2-bin.zip'
        );
        fs.writeFileSync(propsPath, contents);
        console.log('[withGradleVersionPin] Pinned Gradle to 8.10.2');
      } else {
        console.warn('[withGradleVersionPin] gradle-wrapper.properties not found at', propsPath);
      }

      return config;
    },
  ]);
};
