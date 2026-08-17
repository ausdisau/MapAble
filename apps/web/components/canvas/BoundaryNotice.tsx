import React from "react";

import { boundaryNotice } from "@/lib/canvas/canvas-data";
import { mapablePublicPageContainerClass } from "@/lib/marketing/public-page-styles";

export function BoundaryNotice() {
  return (
    <aside
      className="border-b border-amber-200 bg-amber-50"
      role="note"
      aria-labelledby="boundary-notice-heading"
    >
      <div className={`${mapablePublicPageContainerClass} py-8`}>
        <h2
          id="boundary-notice-heading"
          className="text-sm font-black uppercase tracking-wider text-amber-900"
        >
          Important boundaries
        </h2>
        <p className="mt-2 max-w-4xl text-sm leading-7 text-amber-950">
          {boundaryNotice.body}
        </p>
        <p className="mt-3 text-sm font-bold text-amber-950">
          {boundaryNotice.emergency}
        </p>
      </div>
    </aside>
  );
}
