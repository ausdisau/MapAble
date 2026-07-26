import { requireAdmin } from "@/lib/auth/guards";
import { getSocialImpactDashboard } from "@/lib/research/social-impact/impact-service";

export default async function SocialImpactPage() {
  await requireAdmin();
  const data = await getSocialImpactDashboard();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Social impact</h1>
      <table className="w-full text-sm">
        <caption className="sr-only">Social impact outcomes</caption>
        <thead>
          <tr>
            <th scope="col">Outcome</th>
            <th scope="col">Value</th>
            <th scope="col">Suppressed</th>
          </tr>
        </thead>
        <tbody>
          {data.outcomes.map((o, i) => (
            <tr key={i} className="border-t">
              <td>{o.outcomeKey}</td>
              <td>{o.suppressed ? "Suppressed" : o.value}</td>
              <td>{o.suppressed ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
