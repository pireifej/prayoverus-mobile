import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import PrayerDetailScreen from '../../PrayerDetailScreen';

const mockApiGetRequestById = jest.fn();

jest.mock('../../services/api', () => ({
  apiHeaders: {},
  apiGetRequestById: (...args) => mockApiGetRequestById(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('1')),
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../utils', () => ({
  getRelativeTime: jest.fn(() => 'Today'),
  resolveAvatarUri: jest.fn(() => null),
  Avatar: () => null,
}));

jest.mock('../../utils/helpers', () => ({
  getFaithRank: jest.fn(() => ({ level: 1, title: 'Faithful', icon: '🛡️' })),
  FAITH_RANKS: [],
}));

const detailResponse = {
  error: 0,
  request: {
    request_id: 501,
    request_title: 'A prayer I shared',
    request_text: 'Please keep praying.',
    real_name: 'Jane',
    user_id: 42,
    timestamp: '2026-08-29T12:00:00Z',
    prayer_count: 2,
    is_answered: false,
  },
};

describe('PrayerDetailScreen testimony action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockApiGetRequestById.mockResolvedValue(detailResponse);
  });

  it('lets the owner add a testimony from an unanswered request detail', async () => {
    const onMarkAnswered = jest.fn();
    const screen = render(
      <PrayerDetailScreen
        requestId={501}
        prayerIds={[501]}
        currentIndex={0}
        userId={42}
        onClose={jest.fn()}
        onPray={jest.fn()}
        onMarkAnswered={onMarkAnswered}
      />
    );

    const button = await waitFor(() => screen.getByTestId('button-add-testimony'));
    fireEvent.press(button);

    expect(onMarkAnswered).toHaveBeenCalledWith(
      expect.objectContaining({ id: 501, user_id: 42, is_answered: false })
    );
  });

  it('does not show the testimony action to a different user', async () => {
    const screen = render(
      <PrayerDetailScreen
        requestId={501}
        prayerIds={[501]}
        currentIndex={0}
        userId={99}
        onClose={jest.fn()}
        onPray={jest.fn()}
        onMarkAnswered={jest.fn()}
      />
    );

    await waitFor(() => screen.getByText('A prayer I shared'));
    expect(screen.queryByTestId('button-add-testimony')).toBeNull();
  });
});