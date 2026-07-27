import type { MapAbleRequestClient } from "../client";
import type {
  ApproveInvoiceRequest,
  BillingInvoice,
  CreateCreditNoteRequest,
  CreateInvoiceRequest,
  DisputeInvoiceRequest,
  IssueInvoiceRequest,
  RequestApprovalRequest,
  SendInvoiceRequest,
  VoidInvoiceRequest,
} from "../types";

/**
 * Billing invoices module — mirrors `/api/billing/invoices*` route cluster.
 * Uses the shared MapAble request client (Bearer + isomorphic fetch).
 */
export class BillingModule {
  constructor(private readonly client: MapAbleRequestClient) {}

  /** GET /api/billing/invoices */
  listInvoices(): Promise<{ invoices: BillingInvoice[] }> {
    return this.client.request<{ invoices: BillingInvoice[] }>(
      "/api/billing/invoices"
    );
  }

  /** POST /api/billing/invoices */
  createDraft(
    params: CreateInvoiceRequest
  ): Promise<{ invoice: BillingInvoice }> {
    return this.client.request<{ invoice: BillingInvoice }>(
      "/api/billing/invoices",
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** GET /api/billing/invoices/:invoiceId */
  getInvoice(invoiceId: string): Promise<{ invoice: BillingInvoice }> {
    return this.client.request<{ invoice: BillingInvoice }>(
      `/api/billing/invoices/${invoiceId}`
    );
  }

  /** POST /api/billing/invoices/:invoiceId/issue */
  issue(
    invoiceId: string,
    params: IssueInvoiceRequest = {}
  ): Promise<{ invoice: BillingInvoice }> {
    return this.client.request<{ invoice: BillingInvoice }>(
      `/api/billing/invoices/${invoiceId}/issue`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/send */
  send(
    invoiceId: string,
    params: SendInvoiceRequest = {}
  ): Promise<{
    invoice: BillingInvoice;
    delivery: unknown;
    transition: unknown;
  }> {
    return this.client.request(
      `/api/billing/invoices/${invoiceId}/send`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/void */
  voidInvoice(
    invoiceId: string,
    params: VoidInvoiceRequest
  ): Promise<unknown> {
    return this.client.request(
      `/api/billing/invoices/${invoiceId}/void`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/approve */
  approve(
    invoiceId: string,
    params: ApproveInvoiceRequest
  ): Promise<{ invoice: BillingInvoice }> {
    return this.client.request<{ invoice: BillingInvoice }>(
      `/api/billing/invoices/${invoiceId}/approve`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/dispute */
  dispute(
    invoiceId: string,
    params: DisputeInvoiceRequest
  ): Promise<{ invoice: BillingInvoice }> {
    return this.client.request<{ invoice: BillingInvoice }>(
      `/api/billing/invoices/${invoiceId}/dispute`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/request-approval */
  requestApproval(
    invoiceId: string,
    params: RequestApprovalRequest
  ): Promise<unknown> {
    return this.client.request(
      `/api/billing/invoices/${invoiceId}/request-approval`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/credit-notes */
  createCreditNote(
    invoiceId: string,
    params: CreateCreditNoteRequest
  ): Promise<{ creditNote: unknown }> {
    return this.client.request<{ creditNote: unknown }>(
      `/api/billing/invoices/${invoiceId}/credit-notes`,
      {
        method: "POST",
        body: JSON.stringify(params),
      }
    );
  }

  /** POST /api/billing/invoices/:invoiceId/validate */
  validate(invoiceId: string): Promise<{ validation: unknown }> {
    return this.client.request<{ validation: unknown }>(
      `/api/billing/invoices/${invoiceId}/validate`,
      { method: "POST" }
    );
  }
}
