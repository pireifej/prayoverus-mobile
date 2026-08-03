/**
 * usePrayers unit tests
 *
 * Covers the prayer-path assertions from the hook-split smoke plan:
 *   1. loadCommunityPrayers maps the API response and populates communityPrayers
 *   2. markAsPrayed performs an optimistic update, fires onPrayerAnimation,
 *      and calls onAmenComplete after ~900 ms
 *   3. generatePrayer opens the modal (visible:true) and calls onOpenModal
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils/storage', () => ({
  storage: {
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
  },
  STORAGE_KEYS: {
    USER_SESSION: 'userSession',
    COMMUNITY_CACHE: 'communityPrayers_cache',
    PRAY_ACTION_COUNT: '@pray_action_count',
    ONBOARDING_DONE: '@onboarding_done',
  },
}));

const mockApiGetCommunityWall = jest.fn();
const mockApiPrayFor           = jest.fn();
const mockApiGetPrayer         = jest.fn();
const mockApiGetUser           = jest.fn();

jest.mock('../../services/api', () => ({
  apiGetCommunityWall:    (...args) => mockApiGetCommunityWall(...args),
  apiGetMyRequests:       jest.fn(() => Promise.resolve([])),
  apiPrayFor:             (...args) => mockApiPrayFor(...args),
  apiGetUser:             (...args) => mockApiGetUser(...args),
  apiGetPrayer:           (...args) => mockApiGetPrayer(...args),
  apiGetDetailedPrayer:   jest.fn(() => Promise.resolve({ error: 1 })),
  apiMarkAnswered:        jest.fn(() => Promise.resolve({ error: 0 })),
  apiGetAnsweredPrayers:  jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../AppModals', () => ({
  showToast: jest.fn(),
  showModal: jest.fn(),
}));

jest.mock('../../utils/helpers', () => ({
  markdownToHtml:  text => text,
  getFaithRank:    () => ({ level: 1, name: 'Seeker' }),
  FAITH_RANKS:     [],
  isNewerVersion:  () => false,
  base64Encode:    str => Buffer.from(str).toString('base64'),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

import { renderHook, act } from '@testing-library/react-native';
import { useRef }           from 'react';
import { usePrayers }       from '../../hooks/usePrayers';

const CURRENT_USER = { id: '42', firstName: 'Jane', isGuest: false, faith_points: 10 };

const PRAYER_CARD = {
  id: 'p1',
  title: 'Prayer for healing',
  content: 'Please pray for my family',
  author: 'Sarah',
  isPublic: true,
  prayer_count: 3,
  user_has_prayed: false,
};

const API_PRAYER_ROW = {
  request_id:    'p1',
  request_title: 'Prayer for healing',
  request_text:  'Please pray for my family',
  real_name:     'Sarah',
  prayer_count:  3,
  user_has_prayed: 0,
  prayed_by_names:  [],
  prayed_by_people: [],
  timestamp:        '2026-08-01T10:00:00Z',
};

/** Renders usePrayers with a stable callbacksRef wired to a jest.fn() object. */
function renderPrayersHook(callbacks = {}) {
  const callbacksRef = { current: callbacks };
  const setCurrentUser = jest.fn();
  const { result } = renderHook(() =>
    usePrayers({
      currentUser:    CURRENT_USER,
      setCurrentUser,
      showChurchOnly: false,
      userLang:       'en',
      callbacksRef,
    }),
  );
  return { result, callbacksRef, setCurrentUser };
}

beforeEach(() => jest.clearAllMocks());

// ── loadCommunityPrayers ──────────────────────────────────────────────────────

describe('usePrayers — loadCommunityPrayers', () => {
  it('maps API rows to communityPrayers state', async () => {
    mockApiGetCommunityWall.mockResolvedValue([API_PRAYER_ROW]);

    const { result } = renderPrayersHook();

    await act(async () => {
      await result.current.loadCommunityPrayers();
    });

    expect(result.current.communityPrayers).toHaveLength(1);
    expect(result.current.communityPrayers[0]).toMatchObject({
      id:    'p1',
      title: 'Prayer for healing',
    });
  });

  it('sets communityPrayers to [] on an empty response', async () => {
    mockApiGetCommunityWall.mockResolvedValue([]);

    const { result } = renderPrayersHook();

    await act(async () => {
      await result.current.loadCommunityPrayers();
    });

    expect(result.current.communityPrayers).toEqual([]);
  });

  it('does not throw when the API call rejects', async () => {
    mockApiGetCommunityWall.mockRejectedValue(new Error('network error'));

    const { result } = renderPrayersHook();

    await expect(
      act(async () => { await result.current.loadCommunityPrayers(); })
    ).resolves.not.toThrow();
  });
});

// ── markAsPrayed ──────────────────────────────────────────────────────────────

describe('usePrayers — markAsPrayed (Amen flow)', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  async function setupWithPrayer() {
    const onPrayerAnimation = jest.fn();
    const onAmenComplete    = jest.fn();
    const onBadgeCelebration = jest.fn();

    mockApiGetCommunityWall.mockResolvedValue([API_PRAYER_ROW]);
    mockApiPrayFor.mockResolvedValue({ error: 0 });
    mockApiGetUser.mockResolvedValue([]);

    const { result, callbacksRef } = renderPrayersHook({ onPrayerAnimation, onBadgeCelebration });

    // Load the community feed so there is a prayer in state
    await act(async () => {
      await result.current.loadCommunityPrayers();
    });

    // Open the prayer modal (simulates tapping a prayer card)
    act(() => {
      result.current.setPrayerModal({
        visible: true,
        prayer:  PRAYER_CARD,
        generatedPrayer: 'Heavenly Father...',
        loading: false,
      });
    });

    return { result, onPrayerAnimation, onAmenComplete };
  }

  it('calls onPrayerAnimation synchronously when Amen is tapped', async () => {
    const { result, onPrayerAnimation, onAmenComplete } = await setupWithPrayer();

    act(() => {
      result.current.markAsPrayed({ onAmenComplete });
    });

    expect(onPrayerAnimation).toHaveBeenCalledTimes(1);
  });

  it('performs an optimistic prayer_count increment on the community feed', async () => {
    const { result, onAmenComplete } = await setupWithPrayer();
    const before = result.current.communityPrayers.find(p => p.id === 'p1')?.prayer_count ?? 0;

    act(() => {
      result.current.markAsPrayed({ onAmenComplete });
    });

    const after = result.current.communityPrayers.find(p => p.id === 'p1')?.prayer_count;
    expect(after).toBe(before + 1);
  });

  it('calls onAmenComplete after ~900 ms so App.js can close the modal', async () => {
    const { result, onAmenComplete } = await setupWithPrayer();

    act(() => {
      result.current.markAsPrayed({ onAmenComplete });
    });

    expect(onAmenComplete).not.toHaveBeenCalled(); // not yet

    act(() => { jest.advanceTimersByTime(900); });

    expect(onAmenComplete).toHaveBeenCalledTimes(1);
  });

  it('marks the prayer as user_has_prayed in the feed', async () => {
    const { result, onAmenComplete } = await setupWithPrayer();

    act(() => {
      result.current.markAsPrayed({ onAmenComplete });
    });

    const updated = result.current.communityPrayers.find(p => p.id === 'p1');
    expect(updated?.user_has_prayed).toBe(true);
    expect(updated?.prayedFor).toBe(true);
  });
});

// ── generatePrayer ────────────────────────────────────────────────────────────

describe('usePrayers — generatePrayer (modal open)', () => {
  it('sets prayerModal.visible to true and calls onOpenModal', async () => {
    mockApiGetPrayer.mockResolvedValue({
      error: 0,
      prayerText: 'Heavenly Father, we lift up Sarah...',
      isExtended: false,
    });

    const onOpenModal = jest.fn();
    const { result }  = renderPrayersHook();

    await act(async () => {
      await result.current.generatePrayer(PRAYER_CARD, { onOpenModal });
    });

    expect(result.current.prayerModal.visible).toBe(true);
    expect(result.current.prayerModal.prayer).toMatchObject({ id: 'p1' });
    expect(onOpenModal).toHaveBeenCalledTimes(1);
  });

  it('populates generatedPrayer text after the API call resolves', async () => {
    mockApiGetPrayer.mockResolvedValue({
      error: 0,
      prayerText: 'Lord, bless Sarah in her time of need.',
      isExtended: false,
    });

    const { result } = renderPrayersHook();

    await act(async () => {
      await result.current.generatePrayer(PRAYER_CARD);
    });

    expect(result.current.prayerModal.loading).toBe(false);
    expect(result.current.prayerModal.generatedPrayer).toContain('Lord, bless Sarah');
  });

  it('falls back to a default prayer when the API returns no text', async () => {
    mockApiGetPrayer.mockResolvedValue({ error: 1 });

    const { result } = renderPrayersHook();

    await act(async () => {
      await result.current.generatePrayer(PRAYER_CARD);
    });

    expect(result.current.prayerModal.generatedPrayer).toMatch(/Heavenly Father/);
    expect(result.current.prayerModal.loading).toBe(false);
  });

  it('does not open the modal for a guest user', async () => {
    const onGuestPrompt = jest.fn();
    const callbacksRef  = { current: { onGuestPrompt } };
    const { result }    = renderHook(() =>
      usePrayers({
        currentUser:    { ...CURRENT_USER, isGuest: true },
        setCurrentUser: jest.fn(),
        showChurchOnly: false,
        userLang:       'en',
        callbacksRef,
      }),
    );

    await act(async () => {
      await result.current.generatePrayer(PRAYER_CARD);
    });

    expect(result.current.prayerModal.visible).toBe(false);
    expect(onGuestPrompt).toHaveBeenCalledTimes(1);
  });
});
