"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily:
            "Outfit, Plus Jakarta Sans, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#ffffff",
          color: "#0C1833",
        }}
      >
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            role="alert"
            style={{
              maxWidth: "32rem",
              width: "100%",
              border: "1px solid #fecaca",
              borderRadius: "1rem",
              padding: "1.5rem",
            }}
          >
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#b91c1c" }}>
              Something went wrong
            </p>
            <h1 style={{ margin: "0.5rem 0 0", fontSize: "1.5rem" }}>
              This page could not be loaded.
            </h1>
            <p style={{ marginTop: "0.75rem", fontSize: "0.875rem", lineHeight: 1.6, color: "#475569" }}>
              Try again, or visit the Help Centre. No sensitive participant information is shown
              in this error state.
            </p>
            {error.digest ? (
              <p style={{ marginTop: "0.75rem", fontSize: "0.75rem", color: "#64748b" }}>
                Error reference: {error.digest}
              </p>
            ) : null}
            <div style={{ marginTop: "1.5rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={reset}
                style={{
                  minHeight: "2.75rem",
                  borderRadius: "0.75rem",
                  border: "none",
                  background: "#005B7F",
                  color: "#fff",
                  padding: "0 1.25rem",
                  fontWeight: 800,
                }}
              >
                Try again
              </button>
              <a
                href="/help"
                style={{
                  minHeight: "2.75rem",
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: "0.75rem",
                  border: "1px solid #cbd5e1",
                  padding: "0 1.25rem",
                  fontWeight: 800,
                  textDecoration: "none",
                  color: "#0C1833",
                }}
              >
                Visit Help Centre
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
