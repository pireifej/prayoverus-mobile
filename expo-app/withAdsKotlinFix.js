const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAdsKotlinFix(config) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const patch = `
allprojects {
  tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
    kotlinOptions {
      freeCompilerArgs += ["-Xskip-metadata-version-check"]
    }
  }
}
`;
    if (!contents.includes('withAdsKotlinFix')) {
      config.modResults.contents = contents + '\n// withAdsKotlinFix\n' + patch;
    }
    return config;
  });
};
