/**
 * Jest global setup — runs before any module is evaluated.
 *
 * Sets RevenueCat env vars so that the module-level SDK bootstrap in
 * hooks/useIap.js finds a key and marks rcAvailable = true.
 * In the Jest environment __DEV__ is true, so RC_TEST_KEY is the one read.
 */
process.env.EXPO_PUBLIC_REVENUECAT_TEST_API_KEY = 'test-key-jest';
process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY  = 'test-key-jest';
