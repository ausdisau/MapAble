export function mapMapableInvoiceToErpNext(input: {
  invoiceId: string;
  customerName: string;
  totalCents: number;
  currency?: string;
}) {
  return {
    doctype: "Sales Invoice",
    naming_series: "MAP-",
    customer: input.customerName,
    items: [
      {
        item_code: "NDIS-SUPPORT",
        qty: 1,
        rate: input.totalCents / 100,
      },
    ],
    remarks: `MapAble invoice ${input.invoiceId}`,
    currency: input.currency ?? "AUD",
  };
}
