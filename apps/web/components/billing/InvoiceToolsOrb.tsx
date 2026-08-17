"use client";

import { FileText, RefreshCw, Send, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Floating invoice tools (Replit OrbInvoiceWidget port).
 * Routes to MapAble Billing Centre + Xero sync — not a separate Orb billing product.
 */
export function InvoiceToolsOrb() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-8 right-6 z-50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#005B7F] text-white shadow-lg transition hover:bg-[#004766] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#F8C51C]/50"
        aria-expanded={open}
        aria-controls="invoice-tools-orb-panel"
        aria-label={open ? "Close invoice tools" : "Open invoice tools"}
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <FileText className="h-6 w-6" aria-hidden />}
      </button>

      {open ? (
        <div
          id="invoice-tools-orb-panel"
          className="absolute bottom-16 right-0 w-64 space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl"
          role="dialog"
          aria-label="Invoice tools"
        >
          <h3 className="mapable-display text-base font-black text-[#0C1833]">
            Invoice tools
          </h3>
          <nav className="flex flex-col gap-2 text-sm font-bold text-[#005B7F]">
            <Link
              href="/billing/invoices"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
            >
              <Send className="h-4 w-4" aria-hidden />
              Send invoice
            </Link>
            <Link
              href="/billing/integrations"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Sync with Xero
            </Link>
            <Link
              href="/billing/invoices"
              className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F6FBFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F8C51C]"
            >
              <FileText className="h-4 w-4" aria-hidden />
              Preview invoices
            </Link>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
