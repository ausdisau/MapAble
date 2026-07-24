"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

type MapErrorBoundaryProps = {
  children: ReactNode;
  /** Accessible list/fallback UI when the map module fails. */
  fallback: ReactNode;
  onError?: (error: Error) => void;
};

type MapErrorBoundaryState = {
  hasError: boolean;
};

/**
 * Isolates map-library / tile failures so search remains usable as a list.
 * Does not log PII or raw map payloads.
 */
export class MapErrorBoundary extends Component<
  MapErrorBoundaryProps,
  MapErrorBoundaryState
> {
  state: MapErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    this.props.onError?.(error);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
        >
          <p className="font-semibold">Map unavailable</p>
          <p className="mt-1 leading-6">
            The interactive map could not load. You can keep browsing results in
            the list view below.
          </p>
          <div className="mt-4">{this.props.fallback}</div>
          <button
            type="button"
            className="mt-4 min-h-11 rounded-xl border-2 border-[#0C1833] bg-white px-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40"
            onClick={() => this.setState({ hasError: false })}
          >
            Try map again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
