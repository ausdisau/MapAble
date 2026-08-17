const ALLOWED = [
  "support_ticket_created",
  "policy_review_due",
  "provider_profile_incomplete",
  "training_expiry_reminder",
  "document_upload_received",
  "newsletter_signup",
  "low_risk_admin_reminder",
];

export function N8nWorkflowTable() {
  return (
    <table className="min-w-full text-sm">
      <caption className="sr-only">Allowed n8n automation events</caption>
      <thead>
        <tr>
          <th scope="col" className="px-3 py-2 text-left">
            Event
          </th>
        </tr>
      </thead>
      <tbody>
        {ALLOWED.map((e) => (
          <tr key={e} className="border-t">
            <td className="px-3 py-2">{e}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
