"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.25;

export type PanZoomState = {
  scale: number;
  translateX: number;
  translateY: number;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function useFloorPlanPanZoom(containerRef: React.RefObject<HTMLElement | null>) {
  const [state, setState] = useState<PanZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
  });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  const clampTranslate = useCallback(
    (scale: number, tx: number, ty: number) => {
      const el = containerRef.current;
      if (!el) return { translateX: tx, translateY: ty };
      const maxOffset = Math.max(el.clientWidth, el.clientHeight) * (scale - 1) * 0.5 + 80;
      return {
        translateX: Math.max(-maxOffset, Math.min(maxOffset, tx)),
        translateY: Math.max(-maxOffset, Math.min(maxOffset, ty)),
      };
    },
    [containerRef],
  );

  const setScale = useCallback(
    (nextScale: number) => {
      const scale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextScale));
      setState((prev) => {
        const clamped = clampTranslate(scale, prev.translateX, prev.translateY);
        return { scale, ...clamped };
      });
    },
    [clampTranslate],
  );

  const zoomIn = useCallback(() => setScale(state.scale + ZOOM_STEP), [setScale, state.scale]);
  const zoomOut = useCallback(() => setScale(state.scale - ZOOM_STEP), [setScale, state.scale]);

  const fitToScreen = useCallback(() => {
    setState({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const resetView = useCallback(() => {
    setState({ scale: 1, translateX: 0, translateY: 0 });
  }, []);

  const panBy = useCallback(
    (dx: number, dy: number) => {
      setState((prev) => {
        const clamped = clampTranslate(
          prev.scale,
          prev.translateX + dx,
          prev.translateY + dy,
        );
        return { scale: prev.scale, ...clamped };
      });
    },
    [clampTranslate],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      isPanning.current = true;
      panStart.current = {
        x: e.clientX,
        y: e.clientY,
        tx: state.translateX,
        ty: state.translateY,
      };
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [state.translateX, state.translateY],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isPanning.current) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      const clamped = clampTranslate(
        state.scale,
        panStart.current.tx + dx,
        panStart.current.ty + dy,
      );
      setState((prev) => ({ ...prev, ...clamped }));
    },
    [clampTranslate, state.scale],
  );

  const handlePointerUp = useCallback(() => {
    isPanning.current = false;
  }, []);

  const transformStyle = {
    transform: `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`,
    transformOrigin: "center center",
    transition: prefersReducedMotion() ? "none" : undefined,
  };

  const zoomPercent = Math.round(state.scale * 100);

  return {
    state,
    transformStyle,
    zoomPercent,
    zoomIn,
    zoomOut,
    fitToScreen,
    resetView,
    panBy,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    MIN_ZOOM,
    MAX_ZOOM,
  };
}
