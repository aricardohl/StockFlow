'use client';

import { useEffect, useRef } from 'react';

/**
 * Llama a `callback` cada `intervalMs` ms mientras `active` sea true.
 * Limpia el intervalo automáticamente al desmontar o cuando active=false.
 */
export function usePolling(callback: () => void, intervalMs: number, active: boolean) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, active]);
}
