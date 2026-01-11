const { withAndroidManifest } = require('@expo/config-plugins');

const withAdIdPermission = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    
    if (!manifest['uses-permission']) {
      manifest['uses-permission'] = [];
    }
    
    const adIdPermission = 'com.google.android.gms.permission.AD_ID';
    const hasAdIdPermission = manifest['uses-permission'].some(
      (perm) => perm.$?.['android:name'] === adIdPermission
    );
    
    if (!hasAdIdPermission) {
      manifest['uses-permission'].push({
        $: {
          'android:name': adIdPermission,
        },
      });
    }
    
    return config;
  });
};

module.exports = withAdIdPermission;
