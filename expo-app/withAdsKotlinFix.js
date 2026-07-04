const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withAdsKotlinFix(config) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const patch = `
subprojects {
  afterEvaluate { project ->
    if (project.name == 'react-native-google-mobile-ads') {
      tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
          languageVersion = "1.9"
          apiVersion = "1.9"
        }
      }
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
