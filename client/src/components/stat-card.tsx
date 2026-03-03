import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  color?: string;
}

export function StatCard({ title, value, description, icon: Icon, trend, color = "primary" }: StatCardProps) {
  const colorMap: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    blue: "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
    green: "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400",
    purple: "bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400",
  };

  return (
    <Card className="p-4 hover-elevate">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl font-black mt-1 tracking-tight" data-testid={`text-stat-${title.toLowerCase().replace(/\s/g, "-")}`}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {trend && (
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-md flex items-center justify-center ${colorMap[color] || colorMap.primary}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
