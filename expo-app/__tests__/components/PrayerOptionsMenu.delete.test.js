import React from 'react';
import { Modal, TouchableOpacity } from 'react-native';
import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import PrayerOptionsMenu from '../../components/PrayerOptionsMenu';
import { apiGetPrayerByRequestId } from '../../services/api';
import { showModal, showToast } from '../../AppModals';

jest.mock('../../services/api', () => ({
  apiGetPrayerByRequestId: jest.fn(),
}));

jest.mock('../../AppModals', () => ({
  showModal: jest.fn(),
  showToast: jest.fn(),
}));

const prayer = {
  id: 101,
  user_id: 42,
  title: 'Prayer for my father',
  content: 'Please pray for my father.',
  prayer_count: 0,
};

const prayedPrayer = { ...prayer, prayer_count: 3 };

const openDeleteConfirmation = (screen) => {
  fireEvent.press(screen.getByText('⋮'));
  fireEvent.press(screen.getByText('Delete'));
};

const getDeleteModal = (screen) => {
  const modals = screen.UNSAFE_getAllByType(Modal);
  return modals[modals.length - 1];
};

describe('PrayerOptionsMenu delete confirmation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    apiGetPrayerByRequestId.mockResolvedValue({ error: 1 });
  });

  it('does not call delete before confirmation and closes without changes on cancel', () => {
    const onDelete = jest.fn();
    const screen = render(
      <PrayerOptionsMenu prayer={prayer} currentUserId={42} onDelete={onDelete} />
    );

    openDeleteConfirmation(screen);

    expect(onDelete).not.toHaveBeenCalled();
    expect(getDeleteModal(screen).props.visible).toBe(true);

    fireEvent.press(screen.getAllByText('Cancel').at(-1));

    expect(onDelete).not.toHaveBeenCalled();
    expect(getDeleteModal(screen).props.visible).toBe(false);
  });

  it('shows no prayer warning when the request has no prayers', () => {
    const screen = render(
      <PrayerOptionsMenu prayer={prayer} currentUserId={42} onDelete={jest.fn()} />
    );

    openDeleteConfirmation(screen);

    expect(screen.queryByText(/people may have already prayed/i)).toBeNull();
  });

  it('shows the counted prayer warning when the request has prayers', () => {
    const screen = render(
      <PrayerOptionsMenu prayer={prayedPrayer} currentUserId={42} onDelete={jest.fn()} />
    );

    openDeleteConfirmation(screen);

    expect(screen.getByText('3 people may have already prayed for this request.')).toBeTruthy();
  });

  it('disables both buttons while deletion is processing', async () => {
    let resolveDelete;
    const onDelete = jest.fn(() => new Promise(resolve => { resolveDelete = resolve; }));
    const screen = render(
      <PrayerOptionsMenu prayer={prayer} currentUserId={42} onDelete={onDelete} />
    );

    openDeleteConfirmation(screen);
    fireEvent.press(screen.getByText('Remove request'));

    expect(onDelete).toHaveBeenCalledWith(prayer);
    expect(screen.getByText('Removing…')).toBeTruthy();
    const disabledButtons = screen
      .UNSAFE_getAllByType(TouchableOpacity)
      .filter(button => button.props.disabled === true);
    expect(disabledButtons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ props: expect.objectContaining({ accessibilityLabel: 'Cancel' }) }),
        expect.objectContaining({ props: expect.objectContaining({ accessibilityLabel: 'Remove request' }) }),
      ])
    );

    await act(async () => {
      resolveDelete(true);
    });
  });

  it('closes only after a successful delete callback', async () => {
    const onDelete = jest.fn().mockResolvedValue(true);
    const screen = render(
      <PrayerOptionsMenu prayer={prayer} currentUserId={42} onDelete={onDelete} />
    );

    openDeleteConfirmation(screen);
    fireEvent.press(screen.getByText('Remove request'));

    await waitFor(() => {
      expect(getDeleteModal(screen).props.visible).toBe(false);
    });
  });

  it('keeps the confirmation open when the delete callback reports failure', async () => {
    const onDelete = jest.fn().mockResolvedValue(false);
    const screen = render(
      <PrayerOptionsMenu prayer={prayer} currentUserId={42} onDelete={onDelete} />
    );

    openDeleteConfirmation(screen);
    fireEvent.press(screen.getByText('Remove request'));

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(prayer));
    expect(getDeleteModal(screen).props.visible).toBe(true);
    expect(showModal).not.toHaveBeenCalled();
    expect(showToast).not.toHaveBeenCalled();
  });
});