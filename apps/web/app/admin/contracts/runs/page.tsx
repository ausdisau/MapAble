import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ContractRunsPage() {
  await requireAdmin();
  const runs = await prisma.smartContractRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { smartContract: { select: { code: true, name: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Contract runs</h1>
      <table className="w-full text-left text-sm">
        <caption className="sr-only">Recent smart contract evaluation runs</caption>
        <thead>
          <tr>
            <th scope="col">Contract</th>
            <th scope="col">Result</th>
            <th scope="col">Entity</th>
            <th scope="col">When</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => (
            <tr key={r.id} className="border-t">
              <td>{r.smartContract.code}</td>
              <td>{r.result}</td>
              <td>
                {r.entityType} {r.entityId.slice(0, 8)}
              </td>
              <td>{r.createdAt.toLocaleString("en-AU")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
