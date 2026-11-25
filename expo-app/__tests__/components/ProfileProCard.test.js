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
  expect(screen.getByText('YOUR PRO MEMBERSHIP IS ACTIVE')).toBeTruthy();
  expect(screen.queryByTestId('profile-upgrade-pro')).toBeNull();
  expect(screen.getByText('Checking purchases…')).toBeTruthy();
});

test('blocks billing while ownership is unresolved but permits verification and management', () => {
  const onVerify = jest.fn();
  const onManage = jest.fn();
  const screen = render(<ProfileProCard {...baseProps} billingBlocked
    onVerify={onVerify} onManage={onManage} actionMessage="Account ownership needs verification." />);
  fireEvent.press(screen.getByTestId('profile-upgrade-pro'));
  fireEvent.press(screen.getByTestId('profile-restore-purchases'));
  expect(baseProps.onUpgrade).not.toHaveBeenCalled();
  expect(baseProps.onRestore).not.toHaveBeenCalled();
  fireEvent.press(screen.getByTestId('profile-verify-membership'));
  fireEvent.press(screen.getByTestId('profile-manage-subscription'));
  expect(onVerify).toHaveBeenCalledTimes(1);
  expect(onManage).toHaveBeenCalledTimes(1);
});

test('offers the approved repair with billing disabled and blocks repeated actions during setup', () => {
  const onRepair = jest.fn();
  const onVerify = jest.fn();
  const props = { ...baseProps, onRepair, onVerify, reconciliation: { transition: {} } };
  const screen = render(<ProfileProCard {...props} />);
  expect(screen.getByText('Fix purchase setup')).toBeTruthy();
  fireEvent.press(screen.getByTestId('profile-repair-purchases'));
  fireEvent.press(screen.getByTestId('profile-upgrade-pro'));
  fireEvent.press(screen.getByTestId('profile-restore-purchases'));
  expect(onRepair).toHaveBeenCalledTimes(1);
  expect(baseProps.onUpgrade).not.toHaveBeenCalled();
  expect(baseProps.onRestore).not.toHaveBeenCalled();
  screen.rerender(<ProfileProCard {...props} repairLoading />);
  fireEvent.press(screen.getByTestId('profile-repair-purchases'));
  fireEvent.press(screen.getByTestId('profile-verify-membership'));
  expect(onRepair).toHaveBeenCalledTimes(1);
  expect(onVerify).not.toHaveBeenCalled();
});

test('shows retry for saved consent and review message without repair for invalid approvals', () => {
  const screen = render(<ProfileProCard {...baseProps} reconciliation={{ pending: true, transition: {} }} />);
  expect(screen.getByText('Retry purchase setup')).toBeTruthy();
  screen.rerender(<ProfileProCard {...baseProps} reconciliation={{ error: 'Contact support for a fresh review.' }} />);
  expect(screen.getByText('Contact support for a fresh review.')).toBeTruthy();
  expect(screen.queryByTestId('profile-repair-purchases')).toBeNull();
});
