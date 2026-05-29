import { useCallback, useSyncExternalStore } from "react";

const getServerSnapshot = () => false;

/**
 * Returns true when `query` currently matches. SSR-safe (defaults to false on
 * the server / first paint, then syncs after mount via useSyncExternalStore).
 */
export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query],
  );

  const getSnapshot = useCallback(
    () => window.matchMedia(query).matches,
    [query],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
