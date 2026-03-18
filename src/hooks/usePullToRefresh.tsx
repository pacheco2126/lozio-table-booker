import { useEffect, useRef, useState, useCallback } from "react";

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const THRESHOLD = 80;

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 || (containerRef.current && containerRef.current.scrollTop === 0)) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!pulling) return;
    const currentY = e.touches[0].clientY;
    const diff = Math.max(0, currentY - startY.current);
    setPullDistance(Math.min(diff * 0.5, THRESHOLD * 1.5));
  }, [pulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      await onRefresh();
      setRefreshing(false);
    }
    setPulling(false);
    setPullDistance(0);
  }, [pullDistance, refreshing, onRefresh]);

  useEffect(() => {
    const el = containerRef.current || document;
    el.addEventListener("touchstart", handleTouchStart as EventListener, { passive: true });
    el.addEventListener("touchmove", handleTouchMove as EventListener, { passive: true });
    el.addEventListener("touchend", handleTouchEnd as EventListener);
    return () => {
      el.removeEventListener("touchstart", handleTouchStart as EventListener);
      el.removeEventListener("touchmove", handleTouchMove as EventListener);
      el.removeEventListener("touchend", handleTouchEnd as EventListener);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, pullDistance, refreshing };
}
