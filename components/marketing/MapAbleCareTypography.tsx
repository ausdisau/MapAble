"use client";

import React, { type CSSProperties } from "react";

export function MapAbleCareTypography() {
  return null;
}

export function WavyText({
  text,
  className = "",
}: {
  text: string;
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label={text}
      className={`mapable-display ${className}`}
    >
      {text.split(" ").map((word, wordIndex, words) => {
        const y = ["0em", "-0.045em", "0.025em", "-0.03em", "0.04em"][
          wordIndex % 5
        ];
        const r = ["-1.8deg", "1.15deg", "-0.75deg", "1.6deg", "-1.1deg"][
          wordIndex % 5
        ];
        return (
          <React.Fragment key={`${word}-${wordIndex}`}>
            <span
              aria-hidden="true"
              className="mapable-wavy-word"
              style={
                {
                  "--wave-y": y,
                  "--wave-r": r,
                } as CSSProperties
              }
            >
              {word}
            </span>
            {wordIndex < words.length - 1 ? " " : null}
          </React.Fragment>
        );
      })}
    </span>
  );
}

/** @deprecated Use MapAbleCareTypography — kept for homepage re-exports. */
export function MapAbleCareMarketingTypography() {
  return <MapAbleCareTypography />;
}
