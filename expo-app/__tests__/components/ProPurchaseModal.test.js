import React from 'react';
import { Alert, Linking, Modal, PanResponder, StyleSheet } from 'react-native';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';
import { act, fireEvent, render } from '@testing-library/react-native';
import ProPurchaseModal from '../../components/ProPurchaseModal';

const makeIap = (overrides = {}) => ({
    iapModal: { title: 'Pray Over Us Pro', description: 'Premium features', package: { identifier: '$rc_monthly' } },
    iapPurchasing: false,
    doIapPurchase: jest.fn(), doIapRestore: jest.fn(), setIapModal: jest.fn(),
    getIapPrice: jest.fn(() => '$9.99'),
    ...overrides,
});

afterEach(() => jest.restoreAllMocks());

test('the shared paywall displays the store price and supports buy, restore and dismiss', () => {
  const iap = makeIap();
  const screen = render(<ProPurchaseModal iap={iap} />);
  expect(screen.getByText('Subscribe — $9.99 / month')).toBeTruthy();
  fireEvent.press(screen.getByTestId('pro-subscribe'));
  expect(iap.doIapPurchase).toHaveBeenCalledWith(iap.iapModal.package, undefined);
  fireEvent.press(screen.getByTestId('pro-restore'));
  expect(iap.doIapRestore).toHaveBeenCalledTimes(1);
  fireEvent.press(screen.getByTestId('pro-dismiss'));
  expect(iap.setIapModal).toHaveBeenCalledWith(null);
});

test.each(['pro-close', 'pro-backdrop', 'pro-dismiss'])('%s dismisses without needing a hardware Back button', (target) => {
  const iap = makeIap();
  const screen = render(<ProPurchaseModal iap={iap} />);
  fireEvent.press(screen.getByTestId(target, { includeHiddenElements: true }));
  expect(iap.setIapModal).toHaveBeenCalledTimes(1);
  expect(iap.setIapModal).toHaveBeenCalledWith(null);
  expect(iap.doIapPurchase).not.toHaveBeenCalled();
});

test('supports Android Back and the accessibility escape gesture', () => {
  const iap = makeIap();
  const screen = render(<ProPurchaseModal iap={iap} />);
  screen.UNSAFE_getByType(Modal).props.onRequestClose();
  screen.getByTestId('pro-sheet').props.onAccessibilityEscape();
  expect(iap.setIapModal).toHaveBeenCalledTimes(2);
});

test('a swipe down dismisses, but upward, horizontal and short gestures do not', () => {
  const spy = jest.spyOn(PanResponder, 'create');
  const iap = makeIap();
  render(<ProPurchaseModal iap={iap} />);
  const gestures = spy.mock.calls.at(-1)[0];
  expect(gestures.onMoveShouldSetPanResponderCapture(null, { dy: 90, dx: 1 })).toBe(true);
  expect(gestures.onMoveShouldSetPanResponderCapture(null, { dy: -90, dx: 1 })).toBe(false);
  expect(gestures.onMoveShouldSetPanResponderCapture(null, { dy: 20, dx: 90 })).toBe(false);
  expect(gestures.onMoveShouldSetPanResponderCapture(null, { dy: 5, dx: 1 })).toBe(false);
  gestures.onPanResponderRelease(null, { dy: 90, vy: 0.2 });
  expect(iap.setIapModal).toHaveBeenCalledWith(null);
});

test('scrolling content does not accidentally dismiss the sheet', () => {
  const spy = jest.spyOn(PanResponder, 'create');
  const iap = makeIap();
  const screen = render(<ProPurchaseModal iap={iap} />);
  fireEvent.scroll(screen.getByTestId('pro-sheet-content'), { nativeEvent: { contentOffset: { y: 60 } } });
  const gestures = spy.mock.calls.at(-1)[0];
  expect(gestures.onMoveShouldSetPanResponderCapture(null, { dy: 90, dx: 1 })).toBe(false);
  expect(iap.setIapModal).not.toHaveBeenCalled();
});

test('keeps purchase, restore, and all dismissal controls locked during a transaction', () => {
  const spy = jest.spyOn(PanResponder, 'create');
  const iap = makeIap({ iapPurchasing: true });
  const screen = render(<ProPurchaseModal iap={iap} />);
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  for (const target of ['pro-close', 'pro-backdrop', 'pro-dismiss', 'pro-subscribe', 'pro-restore', 'pro-privacy-policy', 'pro-terms-of-use']) {
    fireEvent.press(screen.getByTestId(target, { includeHiddenElements: true }));
  }
  screen.UNSAFE_getByType(Modal).props.onRequestClose();
  screen.getByTestId('pro-sheet').props.onAccessibilityEscape();
  const gestures = spy.mock.calls.at(-1)[0];
  expect(gestures.onMoveShouldSetPanResponderCapture(null, { dy: 100, dx: 0 })).toBe(false);
  gestures.onPanResponderRelease(null, { dy: 100, vy: 1 });
  expect(iap.setIapModal).not.toHaveBeenCalled();
  expect(iap.doIapPurchase).not.toHaveBeenCalled();
  expect(iap.doIapRestore).not.toHaveBeenCalled();
  expect(openURL).not.toHaveBeenCalled();
});

test.each([
  ['privacy-policy', 'Privacy Policy', 'https://prayoverus.com/tos.html?mode=privacy'],
  ['terms-of-use', 'Terms of Use', 'https://prayoverus.com/tos.html?mode=terms'],
])('opens the approved %s URL without dismissing or purchasing', async (id, label, url) => {
  const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  const iap = makeIap();
  const screen = render(<ProPurchaseModal iap={iap} />);
  expect(screen.getByRole('link', { name: label })).toBeTruthy();
  await act(async () => { fireEvent.press(screen.getByTestId(`pro-${id}`)); });
  expect(openURL).toHaveBeenCalledWith(url);
  expect(iap.setIapModal).not.toHaveBeenCalled();
  expect(iap.doIapPurchase).not.toHaveBeenCalled();
});

test('shows a readable fallback URL if the browser cannot open a legal page', async () => {
  jest.spyOn(Linking, 'openURL').mockRejectedValueOnce(new Error('Browser unavailable'));
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  const iap = makeIap();
  const screen = render(<ProPurchaseModal iap={iap} />);
  await act(async () => { fireEvent.press(screen.getByTestId('pro-privacy-policy')); });
  expect(alert).toHaveBeenCalledWith('Unable to open Privacy Policy',
    'Please try again or visit:\nhttps://prayoverus.com/tos.html?mode=privacy');
  expect(iap.doIapPurchase).not.toHaveBeenCalled();
});

test('fits a small phone with large text and keeps its close button outside scrollable content', () => {
  jest.spyOn(require('react-native'), 'useWindowDimensions').mockReturnValue({
    height: 480, width: 320, fontScale: 2, scale: 1,
  });
  const screen = render(
    <SafeAreaInsetsContext.Provider value={{ top: 44, bottom: 34, left: 0, right: 0 }}>
      <ProPurchaseModal iap={makeIap()} />
    </SafeAreaInsetsContext.Provider>,
  );
  const sheetStyle = StyleSheet.flatten(screen.getByTestId('pro-sheet').props.style);
  expect(sheetStyle.height).toBe(420);
  expect(sheetStyle.paddingBottom).toBeGreaterThanOrEqual(54);
  expect(screen.getByLabelText('Close Pro subscription')).toBeTruthy();
  expect(screen.getByTestId('pro-sheet-content').findAll(node => node.props.testID === 'pro-close')).toHaveLength(0);
});

test('does not expose the sheet when no package is open', () => {
  const screen = render(<ProPurchaseModal iap={makeIap({ iapModal: null })} />);
  expect(screen.queryByTestId('pro-close')).toBeNull();
  expect(screen.queryByTestId('pro-privacy-policy')).toBeNull();
  expect(screen.queryByTestId('pro-terms-of-use')).toBeNull();
});
