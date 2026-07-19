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
  let letterIndex = 0;
  return (
    <span
      role="img"
      aria-label={text}
      className={`mapable-display ${className}`}
    >
      {text.split(" ").map((word, wordIndex) => (
        <span
          key={`${word}-${wordIndex}`}
          aria-hidden="true"
          className="mapable-wavy-word"
        >
          {word.split("").map((letter) => {
            const y = ["0em", "-0.045em", "0.025em", "-0.03em", "0.04em"][
              letterIndex % 5
            ];
            const r = ["-1.8deg", "1.15deg", "-0.75deg", "1.6deg", "-1.1deg"][
              letterIndex % 5
            ];
            letterIndex += 1;
            return (
              <span
                key={`${letter}-${letterIndex}`}
                className="mapable-wavy-letter"
                style={
                  {
                    "--wave-y": y,
                    "--wave-r": r,
                  } as CSSProperties
                }
              >
                {letter}
              </span>
            );
          })}
        </span>
      ))}
    </span>
  );
}

/** @deprecated Use MapAbleCareTypography — kept for homepage re-exports. */
export function MapAbleCareMarketingTypography() {
  return <MapAbleCareTypography />;
}
