import { useState, useCallback, useRef } from 'react';

export function useAsyncAction<Args extends any[], Return>(
  apiFn: (...args: Args) => Promise<Return>,
  options: {
    onError?: (err: any) => void;
    onSuccess?: (res: Return) => void;
  } = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const isExecuting = useRef(false);

  const execute = useCallback(
    async (...args: Args): Promise<Return | undefined> => {
      if (isExecuting.current) {
        console.warn('Action currently processing. Duplicate click blocked.');
        return;
      }

      isExecuting.current = true;
      setIsLoading(true);

      try {
        const result = await apiFn(...args);
        options.onSuccess?.(result);
        return result;
      } catch (err) {
        options.onError?.(err);
        throw err;
      } finally {
        isExecuting.current = false;
        setIsLoading(false);
      }
    },
    [apiFn, options]
  );

  return { execute, isLoading };
}
