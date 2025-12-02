import { useEffect } from 'react';

export function usePolling(callback: () => void, delayMs: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    callback();
    const id = setInterval(callback, delayMs);
    return () => clearInterval(id);
  }, [callback, delayMs, enabled]);
}
