import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import {
  listPublishedInvestmentModels,
  runTransportInvestmentModel,
} from "@/lib/transport/investment-modelling/investment-model-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  return jsonOk({ models: await listPublishedInvestmentModels() });
}

export async function POST(req: Request) {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;
  const body = await req.json();
  const model = await runTransportInvestmentModel(body);
  return jsonOk({ model }, 201);
}
