import { isErpnextEnabled } from "@/lib/finance/erpnext/erpnext-client";

export function ERPNextSyncPanel() {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="font-semibold">ERPNext back-office</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Optional sync only. MapAble Billing Hub remains source of truth.
      </p>
      <p className="mt-2 text-sm">Status: {isErpnextEnabled() ? "enabled" : "disabled"}</p>
    </section>
  );
}
