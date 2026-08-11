/**
 * Jest setup — runs after the test framework is installed (setupFilesAfterEnv).
 *
 * Globally mocks Animated.loop so that any test file that renders <App />
 * (or any component that starts an Animated.loop) does not leak infinite
 * requestAnimationFrame loops into Jest's fake-timer queue.
 *
 * Without this mock, a test that forgets to spy on Animated.loop will cause
 * Jest to stall or emit "open handles" warnings because the loop keeps
 * scheduling rAF callbacks even after the test completes.
 */

import { Animated } from 'react-native';

beforeEach(() => {
  jest
    .spyOn(Animated, 'loop')
    .mockReturnValue({ start: jest.fn(), stop: jest.fn(), reset: jest.fn() });
});

afterEach(() => {
  jest.restoreAllMocks();
});
