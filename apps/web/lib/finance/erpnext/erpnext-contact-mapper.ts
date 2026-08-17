export function mapProviderToErpNextContact(input: {
  organisationId: string;
  name: string;
  email?: string;
}) {
  return {
    doctype: "Customer",
    customer_name: input.name,
    customer_type: "Company",
    mapable_organisation_id: input.organisationId,
    email_id: input.email,
  };
}
