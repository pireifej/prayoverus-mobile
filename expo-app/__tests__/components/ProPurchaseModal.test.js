import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import ProPurchaseModal from '../../components/ProPurchaseModal';

test('the shared paywall displays the store price and supports buy, restore and dismiss', () => {
  const iap = {
    iapModal: { title: 'Pray Over Us Pro', description: 'Premium features', package: { identifier: '$rc_monthly' } },
    iapPurchasing: false,
    doIapPurchase: jest.fn(), doIapRestore: jest.fn(), setIapModal: jest.fn(),
    getIapPrice: jest.fn(() => '$9.99'),
  };
  const screen = render(<ProPurchaseModal iap={iap} />);
  expect(screen.getByText('Subscribe — $9.99 / month')).toBeTruthy();
  fireEvent.press(screen.getByTestId('pro-subscribe'));
  expect(iap.doIapPurchase).toHaveBeenCalledWith(iap.iapModal.package, undefined);
  fireEvent.press(screen.getByTestId('pro-restore'));
  expect(iap.doIapRestore).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('pro-dismiss'));
  expect(iap.setIapModal).toHaveBeenCalledWith(null);
});
