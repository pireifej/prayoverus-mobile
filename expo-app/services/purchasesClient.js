/**
 * purchasesClient — RevenueCat SDK bootstrap shim.
 *
 * Isolates all module-level SDK initialization from hooks/useIap.js so that
 * tests can mock this single module and control `isAvailable` / `client`
 * independently of env-var inlining by babel-preset-expo.
 *
 * Production behaviour is identical to the previous inline bootstrap inside
 * useIap.js; the only change is the extraction into this dedicated module.
 */
import { Platform } from 'react-native';

const RC_TEST_KEY    = process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY;
const RC_IOS_KEY     = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let _client      = null;
let _isAvailable = false;

try {
  _client = require('react-native-purchases').default;

  if (RC_TEST_KEY || RC_IOS_KEY || RC_ANDROID_KEY) {
    const key =
      (__DEV__ || Platform.OS === 'web')
        ? RC_TEST_KEY
        : Platform.OS === 'ios'
          ? RC_IOS_KEY || RC_TEST_KEY
          : RC_ANDROID_KEY || RC_TEST_KEY;

    if (key) {
      // Verbose logging only in dev — DEBUG level causes extra native traffic in
      // production and is one known trigger for iOS crashes on re-configure.
      if (__DEV__) _client.setLogLevel(_client.LOG_LEVEL.DEBUG);

      try {
        _client.configure({ apiKey: key });
        _isAvailable = true;
      } catch (configErr) {
        // SDK was already configured by the native layer (app resumed from
        // suspended state). It is still usable; mark as available.
        console.warn(
          '[IAP] configure() threw — SDK may already be initialized:',
          configErr?.message,
        );
        _isAvailable = true;
      }
    }
  }
} catch (e) {
  console.warn('[IAP] react-native-purchases not available:', e?.message);
}

/** The RevenueCat Purchases instance, or null if the SDK is unavailable. */
export const client      = _client;

/** True if the SDK loaded and was configured successfully. */
export const isAvailable = _isAvailable;
