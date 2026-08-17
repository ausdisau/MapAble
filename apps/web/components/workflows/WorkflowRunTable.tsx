export function WorkflowRunTable({
  runs,
}: {
  runs: Array<{
    id: string;
    workflowKey: string;
    status: string;
    startedAt: Date;
    entityType: string | null;
    entityId: string | null;
  }>;
}) {
  return (
    <table className="min-w-full text-sm">
      <caption className="sr-only">Workflow runs</caption>
      <thead>
        <tr className="text-left">
          <th scope="col" className="px-3 py-2">
            Workflow
          </th>
          <th scope="col" className="px-3 py-2">
            Status
          </th>
          <th scope="col" className="px-3 py-2">
            Entity
          </th>
          <th scope="col" className="px-3 py-2">
            Started
          </th>
        </tr>
      </thead>
      <tbody>
        {runs.map((r) => (
          <tr key={r.id} className="border-t">
            <td className="px-3 py-2">{r.workflowKey}</td>
            <td className="px-3 py-2">{r.status}</td>
            <td className="px-3 py-2">
              {r.entityType ? `${r.entityType}:${r.entityId}` : "—"}
            </td>
            <td className="px-3 py-2">{r.startedAt.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
