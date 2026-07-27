/**
 * Centralised quick-action extraction and confidence derivation. Kept verbatim
 * from the original engine so the client receives identical quick-action keys
 * and confidence labels. Modules declare the quick actions they relate to for
 * documentation, but the canonical derivation stays here for parity.
 */
export function extractQuickActions(content: string, toolsUsed: string[]): string[] {
  const actions: string[] = [];

  if (/transport|trip|travel|journey|ride/i.test(content)) {
    actions.push("book_transport");
  }
  if (/barrier|blocked|broken|out of order|closed/i.test(content)) {
    actions.push("report_barrier");
  }
  if (/worker|carer|support/i.test(content) && toolsUsed.includes("search_transport_workers")) {
    actions.push("view_workers");
  }
  if (/help|stuck|emergency|unsafe/i.test(content)) {
    actions.push("escalate");
  }
  if (/profile|preference|mobility|access need/i.test(content)) {
    actions.push("edit_profile");
  }
  if (/pric|cost|rate/i.test(content) && !toolsUsed.includes("get_budget_summary")) {
    actions.push("view_pricing");
  }
  if (toolsUsed.includes("get_upcoming_shifts") || toolsUsed.includes("book_shift") || /shift|schedule/i.test(content)) {
    actions.push("view_shifts");
  }
  if (toolsUsed.includes("get_pending_invoices") || /invoice|payment|pay|owe/i.test(content)) {
    actions.push("pay_invoice");
  }
  if (toolsUsed.includes("get_budget_summary") || /budget|allocation|ndis.*fund/i.test(content)) {
    actions.push("check_budget");
  }
  if (toolsUsed.includes("search_grocery_products") || toolsUsed.includes("navigate_to_groceries") || /grocer|shopping list|food delivery/i.test(content)) {
    actions.push("view_groceries");
  }
  if (toolsUsed.includes("get_grocery_orders")) {
    actions.push("view_grocery_orders");
  }

  return Array.from(new Set(actions));
}

export function determineConfidence(toolsUsed: string[]): string {
  if (toolsUsed.includes("get_transport_pricing") || toolsUsed.includes("search_transport_workers")) {
    return "high";
  }
  if (toolsUsed.includes("get_upcoming_shifts") || toolsUsed.includes("get_pending_invoices") || toolsUsed.includes("get_budget_summary")) {
    return "high";
  }
  if (toolsUsed.includes("book_shift")) {
    return "high";
  }
  if (toolsUsed.includes("check_barrier_reports")) {
    return "medium";
  }
  if (toolsUsed.includes("get_ndis_plan_goals")) {
    return "medium";
  }
  if (toolsUsed.length === 0) {
    return "general";
  }
  return "medium";
}
