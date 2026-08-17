import { requireAdmin } from "@/lib/auth/guards";
import { getOperatorDispatchBoard } from "@/lib/transport/operator-dispatch/operator-dispatch-service";

export default async function OperatorDispatchPage() {
  await requireAdmin();
  const data = await getOperatorDispatchBoard();
  const boards =
    "boards" in data && Array.isArray(data.boards) ? data.boards : [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Operator dispatch</h1>
      <p className="text-muted-foreground">
        Assign, reassign, delay and cancel handling for transport operations.
      </p>
      <ul className="space-y-3">
        {boards.map(({ board, transport }) => (
          <li key={board.id} className="rounded-lg border p-4">
            <p className="font-medium">{transport.pickupAddress}</p>
            <p className="text-sm">Status: {transport.status}</p>
            <p className="text-sm">Driver: {board.assignedDriverId ?? "unassigned"}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
