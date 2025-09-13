'use client';

import { useState, useEffect, useCallback } from 'react';

// A custom hook to manage state with local storage.
// It's been updated to be more resilient to server-side rendering (SSR) environments
// where `window` is not available.

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  // Check if running on the client-side before using this hook.
  const isClient = typeof window !== 'undefined';

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (!isClient) {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    if (!isClient) {
      console.warn(`Attempted to set localStorage key “${key}” on the server.`);
      return;
    }
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  }, [key, storedValue, isClient]);

  // This effect synchronizes the state with localStorage when the component mounts on the client.
  useEffect(() => {
    if (isClient) {
      try {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        }
      } catch (error) {
        console.error(error);
      }
    }
  }, [key, isClient]);


  return [storedValue, setValue];
}
