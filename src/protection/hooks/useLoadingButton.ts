import { useState, useCallback, useRef } from 'react';

export function useLoadingButton(
  onClickAction: () => Promise<any> | void,
  options: { delayMs?: number } = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const activeRef = useRef(false);

  const handleAction = useCallback(async (e?: React.SyntheticEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    if (activeRef.current) {
      console.warn('Action is already in progress. Prevented duplicate click.');
      return;
    }

    activeRef.current = true;
    setIsLoading(true);

    try {
      await onClickAction();
    } catch (err) {
      console.error('Error during loading action:', err);
    } finally {
      if (options.delayMs) {
        await new Promise((resolve) => setTimeout(resolve, options.delayMs));
      }
      activeRef.current = false;
      setIsLoading(false);
    }
  }, [onClickAction, options.delayMs]);

  return {
    isLoading,
    buttonProps: {
      disabled: isLoading,
      onClick: handleAction,
    }
  };
}
