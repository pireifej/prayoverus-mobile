/**
 * usePrayers — owns all prayer data state and prayer-related API/storage calls.
 *
 * Extracted from App.js so that a bug in prayer loading never crashes unrelated
 * parts of the app (auth, IAP, etc.).
 *
 * UI side-effects (animations, sounds, modals) are expressed as callbacks so
 * the hook stays pure data — no Animated.Value or native module calls inside.
 *
 * Callbacks are read via a ref (callbacksRef) so App.js can define them AFTER
 * the hook call without React TDZ issues; all callbacks are up-to-date by the
 * time any user-interaction handler actually invokes them.
 */
import { useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/storage';
import { markdownToHtml, getFaithRank } from '../utils/helpers';
import { showToast, showModal } from '../AppModals';
import {
  apiGetCommunityWall,
  apiGetMyRequests,
  apiPrayFor,
  apiGetUser,
  apiGetPrayer,
  apiGetDetailedPrayer,
  apiMarkAnswered,
  apiGetAnsweredPrayers,
} from '../services/api';

const PRAYERS_PAGE_SIZE = 12;

/**
 * @param {Object} params
 * @param {Object|null}   params.currentUser
 * @param {Function}      params.setCurrentUser
 * @param {boolean}       params.showChurchOnly
 * @param {string}        params.userLang
 * @param {React.MutableRefObject} params.callbacksRef  - ref to callbacks obj;
 *   updated by App.js on every render, read lazily so no TDZ issues.
 *   Shape: { onBadgeCelebration, onLevelUp, onPrayerAnimation,
 *            onPlaySound, onReview, onGuestPrompt }
 */
export function usePrayers({
  currentUser,
  setCurrentUser,
  showChurchOnly,
  userLang,
  callbacksRef,
}) {
  // Stable no-op ref fallback so callers never need to null-check callbacksRef
  const _defaultRef = useRef({});
  const cbRef = callbacksRef || _defaultRef;

  // ── Prayer feed state ───────────────────────────────────────────────────────
  const [prayers, setPrayers] = useState([]);
  const [communityPrayers, setCommunityPrayers] = useState([]);
  const [refreshingCommunity, setRefreshingCommunity] = useState(false);
  const [displayedCount, setDisplayedCount] = useState(PRAYERS_PAGE_SIZE);

  // ── Prayer modal state (generatePrayer populates this) ─────────────────────
  const [prayerModal, setPrayerModal] = useState({
    visible: false,
    prayer: null,
    generatedPrayer: '',
    loading: false,
  });
  const [amenReady, setAmenReady] = useState(false);
  const amenTimerRef = useRef(null);

  // ── Extended (AI) prayer state ──────────────────────────────────────────────
  const [extendedPrayer, setExtendedPrayer] = useState(null);
  const [loadingExtendedPrayer, setLoadingExtendedPrayer] = useState(false);

  // ── Answered prayers state ──────────────────────────────────────────────────
  const [answeredPrayers, setAnsweredPrayers] = useState([]);
  const [answeredModal, setAnsweredModal] = useState({
    visible: false,
    prayer: null,
    text: '',
    isLoading: false,
  });
  const [loadingAnswered, setLoadingAnswered] = useState(false);

  // Rate-limit: track recent pray-taps to suppress faith-point spam
  const recentPrayerTimesRef = useRef([]);

  // ── Community prayer loading ────────────────────────────────────────────────

  const loadCommunityPrayers = async (showRefreshIndicator = false) => {
    console.log('🔄 loadCommunityPrayers called - User ID:', currentUser?.id, 'Church Filter:', showChurchOnly);
    try {
      if (showRefreshIndicator) setRefreshingCommunity(true);

      const userId = currentUser?.isGuest ? '0' : currentUser?.id;
      if (!userId) {
        console.log('⚠️ No user ID available, skipping community load');
        return;
      }

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const requestPayload = {
        userId: userId.toString(),
        tz: timezone,
        filterByChurch: currentUser?.isGuest ? false : showChurchOnly,
        lang: userLang,
      };

      const data = await apiGetCommunityWall(requestPayload);
      const prayerCount = Array.isArray(data) ? data.length : (data.result?.length || 0);
      console.log('📱 Community API Response: Loaded', prayerCount, 'prayers');

      const prayersArray = Array.isArray(data) ? data : [];
      if (prayersArray.length > 0) {
        const mapped = prayersArray.map(request => ({
          id: request.request_id,
          title: request.request_title || request.prayer_title || 'Prayer Request',
          content: request.request_text,
          author: request.real_name || request.user_name || 'Anonymous',
          isPublic: true,
          prayedFor: false,
          timestamp: request.timestamp,
          date: request.timestamp ? new Date(request.timestamp).toLocaleDateString() : 'No date',
          category: request.category_name,
          prayer_title: request.prayer_title,
          other_person: request.other_person,
          picture: request.request_picture,
          user_id: request.user_id,
          fk_prayer_id: request.fk_prayer_id,
          allow_comments: request.allow_comments,
          use_alias: request.use_alias,
          prayer_count: request.prayer_count || 0,
          prayed_by_names: request.prayed_by_names || [],
          prayed_by_people: request.prayed_by_people || [],
          user_has_prayed: request.user_has_prayed || false,
          church_id: request.church_id,
        }));

        console.log('📱 Parsed community prayers:', mapped.length, 'items');
        setCommunityPrayers(mapped);
        setDisplayedCount(PRAYERS_PAGE_SIZE);
        AsyncStorage.setItem(STORAGE_KEYS.COMMUNITY_CACHE, JSON.stringify(mapped)).catch(() => {});
      } else {
        console.log('📱 No community prayers found in response');
        setCommunityPrayers([]);
      }
    } catch (error) {
      console.error('❌ Failed to load community prayers:', error.message);
      showModal({ icon: '⚠️', title: 'Load Error', message: `Could not load community prayers: ${error.message}` });
      // Fallback sample data so the feed isn't blank
      setCommunityPrayers([
        { id: 1, title: 'Prayer for healing', content: "Please pray for my grandmother's recovery", author: 'Sarah', isPublic: true, prayedFor: false, date: 'Today' },
        { id: 2, title: 'Job search guidance', content: 'Seeking divine guidance in finding new employment', author: 'Michael', isPublic: true, prayedFor: false, date: 'Today' },
      ]);
    } finally {
      if (showRefreshIndicator) setRefreshingCommunity(false);
    }
  };

  const onRefreshCommunity = async () => {
    await loadCommunityPrayers(true);
  };

  // ── User prayer loading ─────────────────────────────────────────────────────

  const loadUserPrayers = async () => {
    if (!currentUser?.id) {
      console.log('No user ID available for loading prayers');
      return;
    }
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York';
      const data = await apiGetMyRequests(currentUser.id.toString(), userLang, timezone);
      const prayerCount = Array.isArray(data) ? data.length : (data.result?.length || 0);
      console.log('📱 User Prayers API Response: Loaded', prayerCount, 'prayers');

      const prayersArray = Array.isArray(data) ? data : (data.result || []);
      if (prayersArray.length > 0) {
        const userPrayers = prayersArray.map(request => ({
          id: request.request_id,
          title: request.request_title || 'Prayer Request',
          content: request.request_text,
          author: request.real_name || request.user_name || 'You',
          date: request.timestamp ? new Date(request.timestamp).toLocaleDateString() : 'No date',
          isPublic: request.fk_user_id === null,
          prayedFor: false,
          timestamp: request.timestamp,
          category: request.category_name,
          prayer_title: request.prayer_title,
          other_person: request.other_person,
          picture: request.request_picture,
          user_id: request.user_id || currentUser?.id,
          fk_prayer_id: request.fk_prayer_id,
          allow_comments: request.allow_comments,
          use_alias: request.use_alias,
          is_answered: !!(request.is_answered || request.answered || request.prayer_answered),
          active: request.active ?? 1,
        }));
        console.log('📱 Parsed prayers:', userPrayers.length, 'items');
        setPrayers(userPrayers);
      } else {
        console.log('📱 No prayers found in response');
        setPrayers([]);
      }
    } catch (error) {
      setPrayers([]);
    }
  };

  // ── Prayer actions ──────────────────────────────────────────────────────────

  /**
   * prayForRequest — used by Prayer Walk (no modal, no animation).
   */
  const prayForRequest = async (prayerId) => {
    if (currentUser?.isGuest) { cbRef.current.onGuestPrompt?.(); return; }
    try {
      const data = await apiPrayFor({ userId: currentUser?.id, requestId: prayerId });
      if (data?.new_badge) cbRef.current.onBadgeCelebration?.(data.new_badge);
    } catch (e) {
      console.log('prayForRequest error:', e.message);
    }
    setCommunityPrayers(prev =>
      prev.map(p => p.id === prayerId
        ? { ...p, user_has_prayed: true, prayer_count: (p.prayer_count || 0) + 1 }
        : p
      )
    );
    if (currentUser && setCurrentUser) {
      setCurrentUser(u => ({ ...u, faith_points: (u.faith_points || 0) + 1 }));
    }
    // Trigger review every 5th prayer action
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.PRAY_ACTION_COUNT);
      const count = (raw ? parseInt(raw, 10) : 0) + 1;
      await AsyncStorage.setItem(STORAGE_KEYS.PRAY_ACTION_COUNT, String(count));
      if (count % 5 === 0) cbRef.current.onReview?.();
    } catch (_) {}
  };

  /**
   * markAsPrayed — called when the user taps "Amen" in the prayer modal.
   *
   * Data work: optimistic community update + fire-and-forget apiPrayFor +
   * background faith-point refresh.
   *
   * UI work: delegated to callbacks so this hook stays animation-free.
   *
   * @param {Object} [opts]
   * @param {Function} [opts.onAmenComplete] - called after local state is updated
   *   so App.js can trigger the animation and close the modal.
   */
  const markAsPrayed = ({ onAmenComplete } = {}) => {
    const prayer = prayerModal.prayer;
    if (!prayer) return;

    // Silent faith point cap: track recent prayer times, suppress points if > 10 in 10 min
    const now = Date.now();
    recentPrayerTimesRef.current = recentPrayerTimesRef.current.filter(t => now - t < 10 * 60 * 1000);
    const withinCap = recentPrayerTimesRef.current.length < 10;
    recentPrayerTimesRef.current.push(now);

    // Optimistic local state update immediately
    setCommunityPrayers(prevPrayers =>
      prevPrayers.map(p =>
        p.id === prayer.id
          ? {
              ...p,
              prayedFor: true,
              user_has_prayed: true,
              prayer_count: (p.prayer_count || 0) + 1,
              prayed_by_names: [
                ...(p.prayed_by_names || []),
                currentUser?.firstName || currentUser?.email || 'You',
              ],
              prayed_by_people: [
                ...(p.prayed_by_people || []),
                {
                  name: currentUser?.firstName || currentUser?.email || 'You',
                  picture: currentUser?.picture || null,
                  faith_points: currentUser?.faith_points || 0,
                },
              ],
            }
          : p
      )
    );

    // Fire API — fire-and-forget, don't await
    const prayPayload = { userId: currentUser?.id, requestId: prayer.id };
    apiPrayFor(prayPayload)
      .then(data => { if (data?.new_badge) cbRef.current.onBadgeCelebration?.(data.new_badge); })
      .catch(e => console.log('prayFor error:', e.message));

    // Refresh faith points in background (skip if over rapid-prayer cap)
    if (currentUser && withinCap && setCurrentUser) {
      const oldPoints = currentUser.faith_points || 0;
      const oldRank = getFaithRank(oldPoints, currentUser.faith_rank);
      setTimeout(async () => {
        try {
          const data = await apiGetUser(currentUser.id);
          const userArray = Array.isArray(data) ? data : (data.result || []);
          if (userArray.length > 0) {
            const u = userArray[0];
            const newRank = getFaithRank(u.faith_points || 0, u.faith_rank || null);
            setCurrentUser(prev => ({
              ...prev,
              faith_points: u.faith_points || 0,
              faith_rank: u.faith_rank || null,
            }));
            if (newRank.level > oldRank.level) {
              cbRef.current.onLevelUp?.(newRank);
              cbRef.current.onPlaySound?.();
            }
          }
        } catch (e) { console.log('Error refreshing faith points:', e.message); }
      }, 2000);
    }

    // Delegate animation trigger to App.js via callback ref
    cbRef.current.onPrayerAnimation?.();
    if (onAmenComplete) {
      setTimeout(() => onAmenComplete(), 900);
    }
  };

  /**
   * recordSwipePrayer — records a prayer that was triggered by swiping right.
   * Fire-and-forget: UI already updated by the swipe handler in App.js.
   */
  const recordSwipePrayer = async (prayer) => {
    try {
      await apiPrayFor({ userId: currentUser?.id, requestId: prayer.id });
      console.log('Prayer recorded via swipe for request:', prayer.id);
    } catch (error) {
      console.log('Failed to record swipe prayer:', error.message);
    }
  };

  // ── Prayer generation ───────────────────────────────────────────────────────

  /**
   * generatePrayer — fetches the AI-generated prayer for a request and
   * populates prayerModal state.
   *
   * @param {Object} prayerRequest - the prayer card object
   * @param {Object} [opts]
   * @param {Function} [opts.onOpenModal] - called after state is set so App.js
   *   can trigger the slide-up animation.
   * @param {Function} [opts.onSetBgIndex] - called with a random index so App.js
   *   can set the prayer background image.
   */
  const generatePrayer = async (prayerRequest, { onOpenModal, onSetBgIndex } = {}) => {
    if (currentUser?.isGuest) { cbRef.current.onGuestPrompt?.(); return; }
    try {
      if (onSetBgIndex) onSetBgIndex();

      setPrayerModal({
        visible: true,
        prayer: prayerRequest,
        generatedPrayer: '',
        loading: true,
      });
      setAmenReady(false);
      clearTimeout(amenTimerRef.current);
      amenTimerRef.current = setTimeout(() => setAmenReady(true), 5000);

      // Let App.js trigger the slide-up animation now that state is set
      if (onOpenModal) onOpenModal();

      // Single call — backend returns extended prayer if exists, standard otherwise
      const data = await apiGetPrayer(prayerRequest.id, userLang).catch(() => null);
      let prayerText = null;

      if (data?.error === 0 && data?.prayerText) {
        prayerText = markdownToHtml(data.prayerText);
        if (data.isExtended) setExtendedPrayer(prayerText);
      }

      // Fallback for very old requests with no prayer at all
      if (!prayerText) {
        prayerText = userLang === 'es'
          ? `Padre Celestial, te encomendamos a ${prayerRequest.author} a Tu amoroso cuidado y pedimos Tu bendición sobre esta petición de oración.\n\nOtorga a ${prayerRequest.author} Tu paz, guía y fortaleza en esta situación. Que Tu voluntad se cumpla en su vida según Tu perfecto plan.\n\nPor Cristo Nuestro Señor. Amén.`
          : `Heavenly Father, we lift up ${prayerRequest.author} to Your loving care and ask for Your blessing upon their prayer request.\n\nGrant ${prayerRequest.author} Your peace, guidance, and strength in this situation. May Your will be accomplished in their life according to Your perfect plan.\n\nThrough Christ our Lord. Amen.`;
      }

      setPrayerModal(prev => ({ ...prev, generatedPrayer: prayerText, loading: false }));
    } catch (error) {
      console.error('Error generating prayer:', error);
      const errorMsg = userLang === 'es'
        ? 'Lo sentimos, no podemos generar una oración en este momento. Por favor tómate un momento para orar con tu corazón por esta petición.'
        : 'We apologize, but we are unable to generate a prayer at this time. Please take a moment to offer your own heartfelt prayer for this request.';
      setPrayerModal(prev => ({ ...prev, loading: false, generatedPrayer: errorMsg }));
    }
  };

  /**
   * clearPrayerModal — resets prayerModal to its closed state.
   * Called by App.js at the END of the close animation.
   */
  const clearPrayerModal = () => {
    setPrayerModal({ visible: false, prayer: null, generatedPrayer: '', loading: false });
    setAmenReady(false);
    clearTimeout(amenTimerRef.current);
    setExtendedPrayer(null);
    setLoadingExtendedPrayer(false);
  };

  /**
   * fetchExtendedPrayer — requests the long-form AI prayer for the current modal.
   */
  const fetchExtendedPrayer = async (prayerId, { silent = false } = {}) => {
    if (!prayerId) return;
    if (!silent) setLoadingExtendedPrayer(true);
    setExtendedPrayer('generating');
    try {
      const data = await apiGetDetailedPrayer(prayerId, userLang);
      if (data.error === 0 && data.result) {
        const extText = markdownToHtml(data.result);
        setExtendedPrayer(extText);
        setPrayerModal(prev => ({ ...prev, generatedPrayer: extText }));
      } else if (!silent) {
        showModal({ icon: '🙏', title: 'Extended Prayer', message: 'Could not load the extended prayer. Please try again.' });
      }
    } catch (e) {
      console.log('[ExtendedPrayer] error:', e.message);
      if (!silent) showModal({ icon: '⚠️', title: 'Error', message: 'Could not load the extended prayer.' });
    } finally {
      if (!silent) setLoadingExtendedPrayer(false);
    }
  };

  // ── Answered prayers ────────────────────────────────────────────────────────

  const loadAnsweredPrayers = async () => {
    if (!currentUser?.id) return;
    setLoadingAnswered(true);
    try {
      const data = await apiGetAnsweredPrayers(currentUser.id, userLang);
      const arr = Array.isArray(data) ? data : (data.result || []);
      setAnsweredPrayers(arr.map(r => ({
        id: r.request_id,
        title: r.request_title || 'Prayer Request',
        content: r.request_text || '',
        date: r.timestamp ? new Date(r.timestamp).toLocaleDateString() : '',
        answered_message: r.answered_message || '',
        answeredAt: r.answered_at || '',
      })));
    } catch (e) {
      console.log('Error loading answered prayers:', e);
    } finally {
      setLoadingAnswered(false);
    }
  };

  /**
   * submitTestimony — submits the answered prayer testimony.
   *
   * @param {Object} [opts]
   * @param {Function} [opts.onPlaySound]  - play celebration sound
   * @param {Function} [opts.onReview]     - prompt for store review
   */
  const submitTestimony = () => {
    if (!answeredModal.prayer || !answeredModal.text.trim() || answeredModal.isLoading) return;

    const prayerId = answeredModal.prayer.id;
    const answeredMessage = answeredModal.text.trim();

    // Optimistic update
    setAnsweredModal({ visible: false, prayer: null, text: '', isLoading: false });
    setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, is_answered: true } : p));
    setCommunityPrayers(prev => prev.filter(p => p.id !== prayerId));
    cbRef.current.onPlaySound?.();
    showToast('Your testimony has been shared! 🙌 Notifying everyone who prayed for you...', '🙌');

    apiMarkAnswered({
      request_id: prayerId,
      user_id: currentUser?.id,
      answered_message: answeredMessage,
    })
      .then(data => {
        console.log('📥 markPrayerAnswered response:', JSON.stringify(data));
        const isSuccess = data.error === 0 || data.success === true || (data.result && !String(data.result).toLowerCase().includes('fail'));
        if (isSuccess) {
          const notified = data.notified || data.pushCount || 0;
          setTimeout(() => cbRef.current.onReview?.(), 3000);
          if (data.new_badge) cbRef.current.onBadgeCelebration?.(data.new_badge);
          if (notified > 0) {
            const peopleWord = notified === 1 ? 'person' : 'people';
            const verbWord = notified === 1 ? 'has' : 'have';
            showToast(`${notified} ${peopleWord} who prayed for you ${verbWord} been notified.`, '🔔');
          }
        } else {
          const errMsg = data.result || data.message || data.error || 'Failed to share testimony';
          setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, is_answered: false } : p));
          showModal({ icon: '⚠️', title: 'Could not share testimony', message: String(errMsg) });
        }
      })
      .catch(e => {
        console.log('📥 markPrayerAnswered error:', e?.message);
        setPrayers(prev => prev.map(p => p.id === prayerId ? { ...p, is_answered: false } : p));
        showModal({ icon: '📶', title: 'Error', message: 'Could not reach the server. Your testimony may not have been saved — please try again.' });
      });
  };

  return {
    // prayer feed
    prayers,
    setPrayers,
    communityPrayers,
    setCommunityPrayers,
    refreshingCommunity,
    displayedCount,
    setDisplayedCount,
    PRAYERS_PAGE_SIZE,
    // prayer modal
    prayerModal,
    setPrayerModal,
    amenReady,
    setAmenReady,
    amenTimerRef,
    extendedPrayer,
    setExtendedPrayer,
    loadingExtendedPrayer,
    setLoadingExtendedPrayer,
    // answered
    answeredPrayers,
    setAnsweredPrayers,
    answeredModal,
    setAnsweredModal,
    loadingAnswered,
    // functions
    loadCommunityPrayers,
    onRefreshCommunity,
    loadUserPrayers,
    prayForRequest,
    markAsPrayed,
    recordSwipePrayer,
    generatePrayer,
    clearPrayerModal,
    fetchExtendedPrayer,
    loadAnsweredPrayers,
    submitTestimony,
  };
}
