import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import PurchaseDiagnostics from '../../components/PurchaseDiagnostics';

test('is collapsed until opened and only reads on explicit button press', () => {
  const onRead = jest.fn();
  const screen = render(<PurchaseDiagnostics onRead={onRead} />);
  expect(screen.queryByTestId('purchase-diagnostics-details')).toBeNull();
  fireEvent.press(screen.getByTestId('toggle-purchase-diagnostics'));
  expect(onRead).not.toHaveBeenCalled();
  expect(screen.getByText('Backend status: Not checked in this session')).toBeTruthy();
  fireEvent.press(screen.getByTestId('read-purchase-diagnostics'));
  expect(onRead).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('toggle-purchase-diagnostics'));
  expect(screen.queryByTestId('purchase-diagnostics-details')).toBeNull();
});

test('distinguishes SDK identity from server identity and displays expired test history', () => {
  const screen = render(<PurchaseDiagnostics serverId="pou_v1_verified"
    backend={{ state: 'success', isPro: false, identityVerificationRequired: true, reason: 'account_binding_required' }}
    sdk={{ state: 'success', sdkId: '353', products: [{
      product: 'monthly', environment: 'Sandbox / test', active: false,
      expiration: '2026-10-22T17:17:49.000Z',
    }] }} />);
  fireEvent.press(screen.getByTestId('toggle-purchase-diagnostics'));
  expect(screen.getByText('Device SDK RevenueCat ID: 353')).toBeTruthy();
  expect(screen.getByText('Backend-issued RevenueCat ID: pou_v1_verified')).toBeTruthy();
  expect(screen.getByText('SDK ID matches backend ID: false')).toBeTruthy();
  expect(screen.getByText('Backend identityVerificationRequired: true')).toBeTruthy();
  expect(screen.getByText('Environment: Sandbox / test')).toBeTruthy();
  expect(screen.getByText('Expiration (UTC): 2026-10-22T17:17:49.000Z')).toBeTruthy();
});

test.each([{ loading: true }, { billingBusy: true }])('prevents overlapping reads during busy states %p', props => {
  const onRead = jest.fn();
  const screen = render(<PurchaseDiagnostics {...props} onRead={onRead} />);
  fireEvent.press(screen.getByTestId('toggle-purchase-diagnostics'));
  fireEvent.press(screen.getByTestId('read-purchase-diagnostics'));
  expect(onRead).not.toHaveBeenCalled();
});

test('shows read failures without claiming the account has no purchases', () => {
  const screen = render(<PurchaseDiagnostics sdk={{ state: 'error', message: 'Could not read device purchase information.' }} />);
  fireEvent.press(screen.getByTestId('toggle-purchase-diagnostics'));
  expect(screen.getByText('Could not read device purchase information.')).toBeTruthy();
  expect(screen.queryByText('No purchase history reported by SDK.')).toBeNull();
});
