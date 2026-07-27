import type { MapAbleRequestClient } from "../client";
import { getJson, postJson } from "../http";
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
 * Composes getJson/postJson on the shared MapAble request client.
 */
export class BillingModule {
  constructor(private readonly client: MapAbleRequestClient) {}

  /** GET /api/billing/invoices */
  listInvoices(): Promise<{ invoices: BillingInvoice[] }> {
    return getJson(this.client, "/api/billing/invoices");
  }

  /** POST /api/billing/invoices */
  createDraft(
    params: CreateInvoiceRequest
  ): Promise<{ invoice: BillingInvoice }> {
    return postJson(this.client, "/api/billing/invoices", params);
  }

  /** GET /api/billing/invoices/:invoiceId */
  getInvoice(invoiceId: string): Promise<{ invoice: BillingInvoice }> {
    return getJson(this.client, `/api/billing/invoices/${invoiceId}`);
  }

  /** POST /api/billing/invoices/:invoiceId/issue */
  issue(
    invoiceId: string,
    params: IssueInvoiceRequest = {}
  ): Promise<{ invoice: BillingInvoice }> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/issue`,
      params
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
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/send`,
      params
    );
  }

  /** POST /api/billing/invoices/:invoiceId/void */
  voidInvoice(
    invoiceId: string,
    params: VoidInvoiceRequest
  ): Promise<unknown> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/void`,
      params
    );
  }

  /** POST /api/billing/invoices/:invoiceId/approve */
  approve(
    invoiceId: string,
    params: ApproveInvoiceRequest
  ): Promise<{ invoice: BillingInvoice }> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/approve`,
      params
    );
  }

  /** POST /api/billing/invoices/:invoiceId/dispute */
  dispute(
    invoiceId: string,
    params: DisputeInvoiceRequest
  ): Promise<{ invoice: BillingInvoice }> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/dispute`,
      params
    );
  }

  /** POST /api/billing/invoices/:invoiceId/request-approval */
  requestApproval(
    invoiceId: string,
    params: RequestApprovalRequest
  ): Promise<unknown> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/request-approval`,
      params
    );
  }

  /** POST /api/billing/invoices/:invoiceId/credit-notes */
  createCreditNote(
    invoiceId: string,
    params: CreateCreditNoteRequest
  ): Promise<{ creditNote: unknown }> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/credit-notes`,
      params
    );
  }

  /** POST /api/billing/invoices/:invoiceId/validate */
  validate(invoiceId: string): Promise<{ validation: unknown }> {
    return postJson(
      this.client,
      `/api/billing/invoices/${invoiceId}/validate`
    );
  }
}
