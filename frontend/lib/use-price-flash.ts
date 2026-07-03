'use client';

import { useEffect, useRef, useState } from 'react';

/** Tracks a numeric value and returns a transient CSS class ('flash-up' /
 * 'flash-down') for ~700ms whenever it changes, so price cells can flash
 * green/red on tick updates like a real trading terminal. */
export function usePriceFlash(value: number | null | undefined): string {
  const prevRef = useRef<number | null | undefined>(value);
  const [flashClass, setFlashClass] = useState('');

  useEffect(() => {
    const prev = prevRef.current;
    if (value != null && prev != null && value !== prev) {
      setFlashClass(value > prev ? 'flash-up' : 'flash-down');
      const timer = setTimeout(() => setFlashClass(''), 700);
      prevRef.current = value;
      return () => clearTimeout(timer);
    }
    prevRef.current = value;
  }, [value]);

  return flashClass;
}
