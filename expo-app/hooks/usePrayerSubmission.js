import { useEffect, useRef, useState } from 'react';

export const isDailyLimitSubmissionError = (error) =>
  error?.status === 403 && error?.response?.error === 'DAILY_LIMIT_REACHED';

/**
 * A synchronous lock covers rapid taps before React can disable the button.
 * A form generation also prevents an old attempt updating a closed/new form.
 * Quota metadata is deliberately not interpreted as a submission failure.
 */
export function usePrayerSubmission(formKey) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const attemptRef = useRef(null);
  const generationRef = useRef(0);
  const completedRef = useRef(false);
  const currentFormKeyRef = useRef(formKey);
  currentFormKeyRef.current = formKey;

  useEffect(() => {
    generationRef.current += 1;
    completedRef.current = false;
    setError(null);
    return () => { generationRef.current += 1; };
  }, [formKey]);

  const runSubmission = async (submit, { onSuccess, onFailure } = {}) => {
    if (formKey !== currentFormKeyRef.current || attemptRef.current || completedRef.current) return false;
    const attempt = { generation: generationRef.current };
    attemptRef.current = attempt;
    setIsSubmitting(true);
    setError(null);
    try {
      let result;
      try {
        result = await submit();
      } catch (failure) {
        if (attempt.generation !== generationRef.current) return false;
        setError(failure);
        onFailure?.(failure);
        return false;
      }
      if (attempt.generation !== generationRef.current) return false;
      completedRef.current = true;
      setError(null);
      // Keep UI completion separate from the submit catch: a refresh failure
      // must never turn an already-created prayer into a failed submission.
      onSuccess?.(result);
      return true;
    } finally {
      if (attemptRef.current === attempt) {
        attemptRef.current = null;
        setIsSubmitting(false);
      }
    }
  };

  return {
    runSubmission,
    isSubmitting,
    error,
    dailyLimitReached: isDailyLimitSubmissionError(error),
  };
}
