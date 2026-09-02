"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * SSR-safe localStorage hook. Always guards `typeof window !== 'undefined'`
 * before touching localStorage so it never breaks during server rendering.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);
  const keyRef = useRef(key);
  keyRef.current = key;

  // Read once on mount (client only).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      // ignore corrupt / unavailable storage
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(keyRef.current, JSON.stringify(resolved));
        } catch {
          // storage full / unavailable — keep in-memory value
        }
      }
      return resolved;
    });
  }, []);

  return [value, set, hydrated];
}
