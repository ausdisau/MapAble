/**
 * @vitest-environment jsdom
 */
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AccessibleDataTable } from "@/components/billing/AccessibleDataTable";
import { BillingCopilotPanel } from "@/components/billing/BillingCopilotPanel";
import { FinanceKpiGrid } from "@/components/billing/FinanceKpiGrid";
import { InvoiceStatusBadge } from "@/components/billing/InvoiceStatusBadge";

describe("billing accessibility", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders KPI grid with accessible terms", () => {
    render(
      <FinanceKpiGrid
        items={[
          {
            id: "draft",
            label: "Draft invoice value",
            value: 1000,
            kind: "money",
            statusLabel: "Draft",
          },
        ]}
      />
    );
    expect(screen.getByText(/draft invoice value/i)).toBeTruthy();
    expect(screen.getByRole("heading", { name: /finance overview/i })).toBeTruthy();
  });

  it("status badge includes plain language text", () => {
    render(<InvoiceStatusBadge status="policy_review_required" />);
    expect(
      screen.getByRole("status", { name: /needs pricing policy review/i })
    ).toBeTruthy();
  });

  it("data table has caption and column headers", () => {
    render(
      <AccessibleDataTable
        caption="Demo invoices"
        columns={[
          { id: "number", header: "Invoice", cell: (row) => row.number },
          { id: "status", header: "Status", cell: (row) => row.status },
        ]}
        rows={[{ id: "1", number: "MAP-1", status: "Draft" }]}
      />
    );
    expect(screen.getByText("Demo invoices")).toBeTruthy();
    expect(screen.getByText("Invoice")).toBeTruthy();
  });

  it("copilot requires edit and acknowledgment before confirm", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <BillingCopilotPanel
        suggestion={{
          id: "s1",
          kind: "explain_status",
          title: "Explain status",
          body: "This invoice is in draft.",
          citations: [
            {
              entityType: "BillingInvoice",
              entityId: "inv1",
              label: "Invoice",
            },
          ],
          uncertainty: "medium",
          editable: true,
          requiresHumanConfirmation: true,
        }}
        onConfirm={onConfirm}
      />
    );

    const confirm = screen.getByRole("button", {
      name: /confirm suggestion/i,
    }) as HTMLButtonElement;
    expect(confirm.disabled).toBe(true);

    const textarea = screen.getByLabelText(/editable draft/i);
    await user.type(textarea, " Reviewed.");
    const checkbox = screen.getByRole("checkbox");
    await user.click(checkbox);
    expect(confirm.disabled).toBe(false);
    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith("s1");
  });
});
