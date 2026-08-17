import { requireApiAdmin } from "@/lib/api/auth-handler";
import { jsonOk } from "@/lib/api/response";
import { phase2Config } from "@/lib/config/phase2";
import { getStorageBackend } from "@/lib/storage/document-storage-service";

export async function GET() {
  const user = await requireApiAdmin();
  if (user instanceof Response) return user;

  const backend = getStorageBackend();
  return jsonOk({
    service: "storage",
    status: "healthy",
    backend,
    mode: phase2Config.documentStorageMode,
    maxUploadMb: phase2Config.documentMaxUploadMb,
    timestamp: new Date().toISOString(),
  });
}
