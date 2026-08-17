import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  captureProviderBenchmark,
  getProviderBenchmarkDashboard,
} from "@/lib/provider/benchmarking/benchmark-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk(await getProviderBenchmarkDashboard());
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const snapshot = await captureProviderBenchmark(body);
  return jsonOk({ snapshot }, 201);
}
