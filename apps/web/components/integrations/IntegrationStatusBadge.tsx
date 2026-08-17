import { Badge } from "@/components/ui/badge";

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  enabled: "default",
  degraded: "secondary",
  error: "destructive",
  disabled: "outline",
};

export function IntegrationStatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <Badge variant={statusVariant[status] ?? "outline"}>
      {status.replace("_", " ")}
    </Badge>
  );
}
