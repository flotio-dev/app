import { useState, useEffect } from "react";

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      setIsReady(true);
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item) as T);
      }
    } catch {
      // Ignore read errors
    } finally {
      setIsReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!isReady || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore write errors
    }
  }, [key, storedValue, isReady]);

  return [storedValue, setStoredValue];
}

export default useLocalStorage;
