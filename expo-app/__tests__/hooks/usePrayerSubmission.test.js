import { act, renderHook } from '@testing-library/react-native';
import { usePrayerSubmission } from '../../hooks/usePrayerSubmission';

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

const limitError = () => Object.assign(new Error('Daily limit reached'), {
  status: 403,
  code: 'DAILY_LIMIT_REACHED',
  response: { error: 'DAILY_LIMIT_REACHED' },
});

describe('prayer submission lifecycle', () => {
  it('accepts a successful final free post even when remaining allowance is zero', async () => {
    const { result } = renderHook(() => usePrayerSubmission('42:newPrayer'));
    const closeForm = jest.fn();
    const showFailure = jest.fn();
    await act(async () => {
      expect(await result.current.runSubmission(
        async () => ({ success: true, remaining: 0, quota: { remaining: 0 } }),
        { onSuccess: closeForm, onFailure: showFailure },
      )).toBe(true);
    });
    expect(closeForm).toHaveBeenCalledTimes(1);
    expect(showFailure).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.dailyLimitReached).toBe(false);
  });

  it('locks synchronously against rapid duplicate taps and late dialog callbacks', async () => {
    const request = deferred();
    const submit = jest.fn(() => request.promise);
    const { result } = renderHook(() => usePrayerSubmission('42:newPrayer'));
    let first;
    await act(async () => {
      first = result.current.runSubmission(submit);
      expect(await result.current.runSubmission(submit)).toBe(false);
    });
    expect(result.current.isSubmitting).toBe(true);
    expect(submit).toHaveBeenCalledTimes(1);
    await act(async () => {
      request.resolve({ success: true });
      await first;
      expect(await result.current.runSubmission(submit)).toBe(false);
    });
    expect(submit).toHaveBeenCalledTimes(1);
    expect(result.current.isSubmitting).toBe(false);
  });

  it('clears a previous error on retry and on success', async () => {
    const { result } = renderHook(() => usePrayerSubmission('42:newPrayer'));
    await act(async () => {
      await result.current.runSubmission(async () => { throw limitError(); });
    });
    expect(result.current.dailyLimitReached).toBe(true);
    const request = deferred();
    let retry;
    await act(async () => {
      retry = result.current.runSubmission(() => request.promise);
    });
    expect(result.current.error).toBeNull();
    await act(async () => {
      request.resolve({ success: true, remaining: 0 });
      await retry;
    });
    expect(result.current.error).toBeNull();
    expect(result.current.dailyLimitReached).toBe(false);
  });

  it.each([
    { status: 403, response: { message: 'Daily free limit reached' } },
    { status: 403, code: 'DAILY_LIMIT_REACHED', response: { error: 1, code: 'DAILY_LIMIT_REACHED' } },
    { status: 401, response: { error: 'DAILY_LIMIT_REACHED' } },
    { status: 500, response: { error: 'DAILY_LIMIT_REACHED' } },
    { status: 403, response: { error: 'PRO_REQUIRED' } },
  ])('does not infer a daily-limit error from $status / $response', async (failure) => {
    const { result } = renderHook(() => usePrayerSubmission('42:newPrayer'));
    await act(async () => {
      await result.current.runSubmission(async () => { throw failure; });
    });
    expect(result.current.dailyLimitReached).toBe(false);
  });

  it('shows the error only for the exact HTTP 403 error contract', async () => {
    const { result } = renderHook(() => usePrayerSubmission('42:newPrayer'));
    const onFailure = jest.fn();
    await act(async () => {
      await result.current.runSubmission(async () => { throw limitError(); }, { onFailure });
    });
    expect(result.current.dailyLimitReached).toBe(true);
    expect(onFailure).toHaveBeenCalledTimes(1);
  });

  it('ignores an old failure after the form has closed or changed accounts', async () => {
    const request = deferred();
    const onFailure = jest.fn();
    const { result, rerender } = renderHook(({ formKey }) => usePrayerSubmission(formKey), {
      initialProps: { formKey: '42:newPrayer' },
    });
    let pending;
    await act(async () => {
      pending = result.current.runSubmission(() => request.promise, { onFailure });
    });
    rerender({ formKey: '43:home' });
    await act(async () => {
      request.reject(limitError());
      await pending;
    });
    expect(onFailure).not.toHaveBeenCalled();
    expect(result.current.error).toBeNull();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('allows a new request after closing and reopening the form', async () => {
    const submit = jest.fn().mockResolvedValue({ success: true });
    const { result, rerender } = renderHook(({ formKey }) => usePrayerSubmission(formKey), {
      initialProps: { formKey: '42:newPrayer' },
    });
    await act(async () => { await result.current.runSubmission(submit); });
    rerender({ formKey: '42:home' });
    rerender({ formKey: '42:newPrayer' });
    await act(async () => { await result.current.runSubmission(submit); });
    expect(submit).toHaveBeenCalledTimes(2);
  });
});
