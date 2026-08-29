import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Share, Clipboard, StyleSheet, ActivityIndicator } from 'react-native';
import { showToast, showModal } from '../AppModals';
import { apiGetPrayerByRequestId } from '../services/api';
import t from '../i18n';

export default function PrayerOptionsMenu({
  prayer,
  currentUserId,
  onEdit,
  onDelete,
  onResolvePrayerCount,
  onMarkAnswered,
  onShare,
  onReport,
  onBlock,
  isProfileSection = false,
}) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [isCopyingPrayer, setIsCopyingPrayer] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resolvedPrayerCount, setResolvedPrayerCount] = useState(
    prayer?.prayer_count === null || prayer?.prayer_count === undefined
      ? null
      : Number(prayer.prayer_count) || 0
  );
  const [isResolvingDeleteCount, setIsResolvingDeleteCount] = useState(false);
  const [deleteCountError, setDeleteCountError] = useState(false);

  const isOwner =
    prayer.user_id &&
    currentUserId &&
    prayer.user_id.toString() === currentUserId.toString();
  const prayerCount = resolvedPrayerCount ?? 0;

  useEffect(() => {
    if (prayer?.prayer_count !== null && prayer?.prayer_count !== undefined) {
      setResolvedPrayerCount(Number(prayer.prayer_count) || 0);
    }
  }, [prayer?.prayer_count]);

  const resolveDeleteCount = async () => {
    if (resolvedPrayerCount !== null) return;
    if (!onResolvePrayerCount) {
      setDeleteCountError(true);
      return;
    }
    setIsResolvingDeleteCount(true);
    setDeleteCountError(false);
    try {
      const count = await onResolvePrayerCount(prayer);
      setResolvedPrayerCount(Number(count) || 0);
    } catch (error) {
      console.log('Error loading prayer count:', error?.message);
      setDeleteCountError(true);
    } finally {
      setIsResolvingDeleteCount(false);
    }
  };

  const openDeleteConfirmation = async () => {
    setMenuVisible(false);
    setDeleteConfirmVisible(true);
    await resolveDeleteCount();
  };

  const handleShare = async () => {
    setMenuVisible(false);
    const shareUrl = `https://prayoverus.com/index.html?requestId=${prayer.id}`;
    try {
      await Share.share({
        message: `🙏 Please pray for this intention:\n\n${shareUrl}`,
        url: shareUrl,
        title: 'Share Prayer Request',
      });
    } catch (error) {
      if (error.message !== 'User did not share') console.log('Share error:', error);
    }
  };

  const handleCopyRequestText = () => {
    setMenuVisible(false);
    const textToCopy = prayer.title
      ? `${prayer.title}\n\n${prayer.content}`
      : prayer.content;
    Clipboard.setString(textToCopy);
    showToast(t('copiedRequest'), '📋');
  };

  const handleCopyPrayerText = async () => {
    setIsCopyingPrayer(true);
    try {
      const data = await apiGetPrayerByRequestId(prayer.id);
      if (data.error === 0 && data.prayerText) {
        Clipboard.setString(data.prayerText.replace(/<[^>]*>/g, ''));
        setMenuVisible(false);
        showToast(t('copiedPrayer'), '📋');
      } else {
        setMenuVisible(false);
        showModal({ icon: '⚠️', title: t('errorTitle'), message: t('couldNotFetchPrayer') });
      }
    } catch (error) {
      console.log('Error fetching prayer text:', error);
      setMenuVisible(false);
      showModal({ icon: '⚠️', title: t('errorTitle'), message: t('couldNotFetchPrayer') });
    } finally {
      setIsCopyingPrayer(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (isDeleting || !onDelete) return;

    setIsDeleting(true);
    try {
      const didDelete = await onDelete({ ...prayer, prayer_count: resolvedPrayerCount });
      if (didDelete === true) {
        setDeleteConfirmVisible(false);
      }
    } catch (error) {
      // The parent normally handles and displays delete errors. Keep the
      // request visible and the confirmation available if an unexpected
      // callback error escapes.
      console.log('Error deleting prayer:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setMenuVisible(true)}
        data-testid={`button-options-${prayer.id}`}
      >
        <Text style={styles.menuDots}>⋮</Text>
      </TouchableOpacity>

      {/* Options Sheet */}
      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <View style={styles.menuHeader}>
              <Text style={styles.menuTitle}>Options</Text>
            </View>

            <TouchableOpacity style={styles.menuItem} onPress={handleShare} data-testid={`button-share-${prayer.id}`}>
              <Text style={styles.menuIcon}>🔗</Text>
              <Text style={styles.menuItemText}>{t('sharePrayerMenu')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleCopyRequestText} data-testid={`button-copy-request-${prayer.id}`}>
              <Text style={styles.menuIcon}>📋</Text>
              <Text style={styles.menuItemText}>{t('copyRequestText')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleCopyPrayerText} disabled={isCopyingPrayer} data-testid={`button-copy-prayer-${prayer.id}`}>
              <Text style={styles.menuIcon}>{isCopyingPrayer ? '⏳' : '🙏'}</Text>
              <Text style={styles.menuItemText}>{isCopyingPrayer ? t('loadingPrayers') : t('copyPrayerText')}</Text>
            </TouchableOpacity>

            {isOwner && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); if (onEdit) onEdit(prayer); }} data-testid={`button-edit-${prayer.id}`}>
                <Text style={styles.menuIcon}>✏️</Text>
                <Text style={styles.menuItemText}>{t('edit') || 'Edit'}</Text>
              </TouchableOpacity>
            )}

            {isOwner && !prayer.is_answered && (
              <TouchableOpacity style={styles.menuItem} onPress={() => { setMenuVisible(false); if (onMarkAnswered) onMarkAnswered(prayer); }} data-testid={`button-answered-${prayer.id}`}>
                <Text style={styles.menuIcon}>🙌</Text>
                <Text style={[styles.menuItemText, { color: '#16a34a' }]}>{t('prayerAnsweredMenu')}</Text>
              </TouchableOpacity>
            )}

            {isOwner && (
              <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={openDeleteConfirmation} data-testid={`button-delete-${prayer.id}`}>
                <Text style={styles.menuIcon}>🗑️</Text>
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>{t('deleteMenuItem')}</Text>
              </TouchableOpacity>
            )}

            {!isOwner && onReport && (
              <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => { setMenuVisible(false); onReport(prayer); }} data-testid={`button-report-${prayer.id}`}>
                <Text style={styles.menuIcon}>🚩</Text>
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Report Content</Text>
              </TouchableOpacity>
            )}

            {!isOwner && onBlock && (
              <TouchableOpacity style={[styles.menuItem, styles.menuItemDanger]} onPress={() => { setMenuVisible(false); onBlock(prayer); }} data-testid={`button-block-${prayer.id}`}>
                <Text style={styles.menuIcon}>🚫</Text>
                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>Block User</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity style={[styles.menuItem, styles.menuItemCancel]} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuItemTextCancel}>{t('cancelMenuItem')}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          if (!isDeleting) setDeleteConfirmVisible(false);
        }}
      >
        <View style={styles.modalOverlay} accessibilityViewIsModal>
          <View style={styles.deleteConfirmContainer}>
            <Text style={styles.deleteConfirmIcon}>🗑️</Text>
            <Text style={styles.deleteConfirmTitle} accessibilityRole="header">
              {t('deletePrayerTitle')}
            </Text>
            <Text style={styles.deleteConfirmMessage}>{t('deleteConfirmMsg')}</Text>
            {isResolvingDeleteCount ? (
              <View style={styles.prayerWarning} accessibilityRole="alert">
                <ActivityIndicator size="small" color="#92400e" />
                <Text style={styles.prayerWarningText}>{t('checkingPrayerActivity')}</Text>
              </View>
            ) : deleteCountError ? (
              <View style={styles.prayerWarning} accessibilityRole="alert">
                <Text style={styles.prayerWarningIcon}>⚠️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.prayerWarningText}>{t('couldNotCheckPrayerActivity')}</Text>
                  <TouchableOpacity onPress={resolveDeleteCount} accessibilityRole="button" testID={`button-retry-prayer-count-${prayer.id}`}>
                    <Text style={styles.retryCountText}>{t('retry')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : prayerCount > 0 && (
              <View
                style={styles.prayerWarning}
                accessibilityRole="alert"
                accessibilityLiveRegion="assertive"
              >
                <Text style={styles.prayerWarningIcon}>⚠️</Text>
                <Text style={styles.prayerWarningText}>
                  {prayerCount === 1
                    ? t('deletePrayerWarningSingular')
                    : t('deletePrayerWarningPlural')(prayerCount)}
                </Text>
              </View>
            )}
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, isDeleting && styles.deleteButtonDisabled]}
                disabled={isDeleting}
                onPress={() => setDeleteConfirmVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={t('cancelMenuItem')}
                testID={`button-cancel-delete-${prayer.id}`}
              >
                <Text style={styles.cancelButtonText}>{t('cancelMenuItem')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, (isDeleting || isResolvingDeleteCount || resolvedPrayerCount === null) && styles.deleteButtonDisabled]}
                disabled={isDeleting || isResolvingDeleteCount || resolvedPrayerCount === null}
                onPress={handleConfirmDelete}
                accessibilityRole="button"
                accessibilityLabel={t('removePrayerButton')}
                testID={`button-confirm-delete-${prayer.id}`}
              >
                {isDeleting ? (
                  <>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={styles.deleteButtonText}>Removing…</Text>
                  </>
                ) : (
                  <Text style={styles.deleteButtonText}>{t('removePrayerButton')}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:            { position: 'absolute', top: 8, right: 8, zIndex: 10 },
  menuButton:           { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.05)', justifyContent: 'center', alignItems: 'center' },
  menuDots:             { fontSize: 20, fontWeight: 'bold', color: '#666' },
  modalOverlay:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  menuContainer:        { backgroundColor: 'white', borderRadius: 16, width: '80%', maxWidth: 300, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 8 },
  menuHeader:           { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  menuTitle:            { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'center' },
  menuItem:             { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  menuIcon:             { fontSize: 18, marginRight: 12 },
  menuItemText:         { fontSize: 16, color: '#333' },
  menuItemDanger:       { borderBottomWidth: 0 },
  menuItemTextDanger:   { color: '#dc3545' },
  menuItemCancel:       { backgroundColor: '#f8f9fa', justifyContent: 'center', borderBottomWidth: 0 },
  menuItemTextCancel:   { fontSize: 16, color: '#666', textAlign: 'center', width: '100%' },
  deleteConfirmContainer: { backgroundColor: 'white', borderRadius: 20, width: '100%', maxWidth: 360, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 10 },
  deleteConfirmIcon:    { fontSize: 48, marginBottom: 16 },
  deleteConfirmTitle:   { fontSize: 20, fontWeight: '700', color: '#1a1a1a', marginBottom: 12, textAlign: 'center' },
  deleteConfirmMessage: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 18 },
  prayerWarning:       { width: '100%', flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fffbeb', borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 22 },
  prayerWarningIcon:   { fontSize: 20, lineHeight: 24, marginRight: 9 },
  prayerWarningText:   { flex: 1, color: '#92400e', fontSize: 15, fontWeight: '800', lineHeight: 22 },
  retryCountText:      { color: '#92400e', fontSize: 14, fontWeight: '800', textDecorationLine: 'underline', marginTop: 6 },
  deleteConfirmButtons: { width: '100%', gap: 12 },
  cancelButton:         { width: '100%', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 2, borderColor: '#e0e0e0', alignItems: 'center' },
  cancelButtonText:     { fontSize: 16, fontWeight: '600', color: '#666' },
  deleteButton:         { width: '100%', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12, backgroundColor: '#dc3545', borderWidth: 2, borderColor: '#dc3545', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  deleteButtonText:     { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  deleteButtonDisabled: { opacity: 0.6 },
});
