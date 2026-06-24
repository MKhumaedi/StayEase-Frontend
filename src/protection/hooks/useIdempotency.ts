import { useState, useCallback, useRef } from 'react';

function generateUUID(): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function useIdempotency() {
  const [currentKey, setCurrentKey] = useState<string>(generateUUID());
  const usedKeysRef = useRef<Set<string>>(new Set());

  const rotateKey = useCallback(() => {
    const nextKey = generateUUID();
    setCurrentKey(nextKey);
    return nextKey;
  }, []);

  const markUsed = useCallback((key: string) => {
    usedKeysRef.current.add(key);
  }, []);

  const hasBeenUsed = useCallback((key: string): boolean => {
    return usedKeysRef.current.has(key);
  }, []);

  return {
    idempotencyKey: currentKey,
    rotateKey,
    markUsed,
    hasBeenUsed
  };
}
