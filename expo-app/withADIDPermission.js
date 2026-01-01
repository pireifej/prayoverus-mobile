const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withADIDPermission(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    const AD_ID_PERMISSION = "com.google.android.gms.permission.AD_ID";
    
    if (!androidManifest["uses-permission"]) {
      androidManifest["uses-permission"] = [];
    }

    const hasPermission = androidManifest["uses-permission"].some(
      (perm) => perm.$["android:name"] === AD_ID_PERMISSION
    );

    if (!hasPermission) {
      androidManifest["uses-permission"].push({
        $: { "android:name": AD_ID_PERMISSION },
      });
    }

    return config;
  });
};
