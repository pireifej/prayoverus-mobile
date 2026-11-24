jest.mock('expo-av', () => ({
  Audio: { setAudioModeAsync: jest.fn().mockResolvedValue(), Sound: { createAsync: jest.fn() } },
}));
jest.mock('expo-file-system/legacy', () => ({
  cacheDirectory: 'cache/', getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn().mockResolvedValue(null), setItem: jest.fn().mockResolvedValue(),
}));
jest.mock('../../services/api', () => ({
  apiReadDailyBread: jest.fn().mockResolvedValue({}), apiGetDailyBreadAudio: jest.fn(),
}));
jest.mock('expo-linear-gradient', () => ({ LinearGradient: require('react-native').View }));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DailyBreadScreen from '../../DailyBreadScreen';
import ContentAccessNotice from '../../components/ContentAccessNotice';
import { apiReadDailyBread, apiGetDailyBreadAudio } from '../../services/api';

const devotional = {
  id: 10, date: '2026-11-24', title: 'Hope', content: 'First sentence. Second sentence. The complete reading.',
};
const props = { devotional, userId: 42, isPro: false, onBack: jest.fn(), onOpenProPaywall: jest.fn() };
let sound;
beforeEach(() => {
  jest.clearAllMocks();
  sound = { unloadAsync: jest.fn().mockResolvedValue(), playAsync: jest.fn().mockResolvedValue() };
  Audio.Sound.createAsync.mockResolvedValue({ sound });
});

test('free users get the full reading, cached audio, archive, and rewards when policy permits', async () => {
  const onLoadArchive = jest.fn();
  const screen = render(<DailyBreadScreen {...props} contentAccess onLoadArchive={onLoadArchive} />);
  await act(async () => {});
  expect(screen.getByText(devotional.content)).toBeTruthy();
  expect(screen.queryByText('Read Full Article with Pro')).toBeNull();
  await act(async () => { fireEvent.press(screen.getByText('🔊 Listen')); });
  expect(Audio.Sound.createAsync).toHaveBeenCalled();
  expect(sound.playAsync).toHaveBeenCalled();
  expect(apiGetDailyBreadAudio).not.toHaveBeenCalled();
  expect(props.onOpenProPaywall).not.toHaveBeenCalled();
  expect(apiReadDailyBread).toHaveBeenCalledWith(42, 10);
  fireEvent.press(screen.getByText('📅 Archive'));
  expect(onLoadArchive).toHaveBeenCalled();
  const key = AsyncStorage.setItem.mock.calls[0][0];
  expect(key).toMatch(/^readDailyBread_42_/);
});

test('paid policy gates the full reading and even cached playback for a free account', async () => {
  const screen = render(<DailyBreadScreen {...props} contentAccess={false} />);
  await act(async () => {});
  await act(async () => { fireEvent.press(screen.getByText('🔒 Read Full Article with Pro')); });
  expect(props.onOpenProPaywall).toHaveBeenCalledTimes(1);
  expect(Audio.Sound.createAsync).not.toHaveBeenCalled();
  expect(apiReadDailyBread).not.toHaveBeenCalled();
});

test('changing policy stops existing playback', async () => {
  const screen = render(<DailyBreadScreen {...props} contentAccess />);
  await act(async () => { fireEvent.press(screen.getByText('🔊 Listen')); });
  screen.rerender(<DailyBreadScreen {...props} contentAccess={false} />);
  expect(sound.unloadAsync).toHaveBeenCalled();
});

test('switching app accounts uses distinct reward markers', async () => {
  const screen = render(<DailyBreadScreen {...props} contentAccess />);
  await act(async () => {});
  screen.rerender(<DailyBreadScreen {...props} userId={99} contentAccess />);
  await act(async () => {});
  const keys = AsyncStorage.setItem.mock.calls.map(call => call[0]);
  expect(keys.some(key => key.startsWith('readDailyBread_42_'))).toBe(true);
  expect(keys.some(key => key.startsWith('readDailyBread_99_'))).toBe(true);
});

test('unknown content access offers retry and back, not a purchase', () => {
  const onRetry = jest.fn(), onBack = jest.fn();
  const screen = render(<ContentAccessNotice error="Cannot check access" onRetry={onRetry} onBack={onBack} />);
  fireEvent.press(screen.getByText('Retry access check'));
  fireEvent.press(screen.getByText('Back'));
  expect(onRetry).toHaveBeenCalledTimes(1);
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Upgrade to Pro')).toBeNull();
});
