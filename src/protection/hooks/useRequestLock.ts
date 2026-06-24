import { useState, useCallback, useRef } from 'react';

export function useRequestLock() {
  const locks = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState({});

  const acquireLock = useCallback((key: string): boolean => {
    if (locks.current.has(key)) {
      return false;
    }
    locks.current.add(key);
    forceUpdate({});
    return true;
  }, []);

  const releaseLock = useCallback((key: string) => {
    locks.current.delete(key);
    forceUpdate({});
  }, []);

  const isLocked = useCallback((key: string): boolean => {
    return locks.current.has(key);
  }, []);

  return { acquireLock, releaseLock, isLocked };
}
