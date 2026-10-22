import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProfileProCard from '../../components/ProfileProCard';

const baseProps = {
  isPro: false,
  price: '$9.99',
  upgradeLoading: false,
  restoreLoading: false,
  actionMessage: '',
  onUpgrade: jest.fn(),
  onRestore: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

test('shows a clear monthly Pro offer and wires both purchase actions', () => {
  const screen = render(<ProfileProCard {...baseProps} />);
  expect(screen.getByTestId('profile-pro-section')).toBeTruthy();
  expect(screen.getByTestId('profile-pro-banner')).toBeTruthy();
  expect(screen.getByTestId('profile-pro-section').props.accessibilityLabel).toBe('Pray Over Us Pro membership');
  expect(screen.getByText('MONTHLY · $9.99')).toBeTruthy();
  expect(screen.getByText('Unlimited prayer requests, full Daily Bread readings and audio, and guided Prayer Walk.')).toBeTruthy();

  fireEvent.press(screen.getByTestId('profile-upgrade-pro'));
  fireEvent.press(screen.getByTestId('profile-restore-purchases'));
  expect(baseProps.onUpgrade).toHaveBeenCalledTimes(1);
  expect(baseProps.onRestore).toHaveBeenCalledTimes(1);
});

test('keeps the live localized price in the separated membership banner', () => {
  const screen = render(<ProfileProCard {...baseProps} price="€7,49" />);
  expect(screen.getByTestId('profile-pro-banner')).toBeTruthy();
  expect(screen.getByText('MONTHLY · €7,49')).toBeTruthy();
});

test('shows feedback during plan loading and when billing cannot be verified', () => {
  const screen = render(
    <ProfileProCard {...baseProps} upgradeLoading actionMessage="Check your connection and try again." />
  );
  expect(screen.getByText('Checking monthly plan…')).toBeTruthy();
  expect(screen.getByTestId('profile-billing-message')).toHaveTextContent('Check your connection and try again.');
  expect(screen.getByTestId('profile-upgrade-pro').props.accessibilityState.disabled).toBe(true);
});

test('shows restore progress and active Pro status', () => {
  const screen = render(<ProfileProCard {...baseProps} isPro restoreLoading />);
  expect(screen.getByTestId('profile-pro-section')).toBeTruthy();
  expect(screen.getByText('YOUR SUBSCRIPTION IS ACTIVE')).toBeTruthy();
  expect(screen.queryByTestId('profile-upgrade-pro')).toBeNull();
  expect(screen.getByText('Checking purchases…')).toBeTruthy();
});
