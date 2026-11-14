import { useState, useEffect } from 'react';

/**
 * useDebounce Hook
 * Debounces any value changes by a specified delay in milliseconds.
 * Prevents rapid re-computations or heavy re-filtering during continuous user keystrokes.
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
