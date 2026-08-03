import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// ─── AsyncStorage keys ────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  USER_SESSION:        'userSession',
  COMMUNITY_CACHE:     'communityPrayers_cache',
  EULA_ACCEPTED:       '@eula_accepted',
  BLOCKED_USERS:       '@blocked_users',
  LANGUAGE_PREF:       '@language_pref',
  REVIEW_STATE:        '@review_state',
  OPEN_DATES:          '@open_dates',
  DAILY_POST_TRACKER:  '@daily_post_tracker',
  ONBOARDING_DONE:     '@onboarding_done',
  ARCHIVE_UNLOCKED:    'archiveUnlocked',
  PRAY_ACTION_COUNT:   '@pray_action_count',
  REMEMBERED_EMAIL:    'rememberedEmail',
  ROSARY_FONT_SIZE:    '@rosary_font_size',
};

// ─── SimpleStorage ────────────────────────────────────────────────────────────
// Wraps AsyncStorage (native) and localStorage (web) behind one interface.
export class SimpleStorage {
  constructor() {
    this.isWeb = Platform.OS === 'web';
  }

  async setItem(key, value) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  }

  async getItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } else {
      return await AsyncStorage.getItem(key);
    }
    return null;
  }

  async removeItem(key) {
    if (this.isWeb) {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  }
}

export const storage = new SimpleStorage();
