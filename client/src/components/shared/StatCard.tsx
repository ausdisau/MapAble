import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type StatCardColor =
  | "primary"
  | "blue"
  | "green"
  | "teal"
  | "gold"
  | "amber"
  | "orange"
  | "purple";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: string;
  color?: StatCardColor;
  className?: string;
}

const colorMap: Record<StatCardColor, { icon: string; bg: string }> = {
  primary: { icon: "text-primary", bg: "bg-primary/10" },
  blue: { icon: "text-brand-blue", bg: "bg-brand-blue/10" },
  green: { icon: "text-brand-teal", bg: "bg-brand-teal/10" },
  teal: { icon: "text-brand-teal", bg: "bg-brand-teal/15" },
  gold: { icon: "text-brand-gold", bg: "bg-brand-gold/10" },
  amber: { icon: "text-brand-gold", bg: "bg-brand-gold/10" },
  orange: { icon: "text-brand-orange", bg: "bg-brand-orange/10" },
  purple: { icon: "text-chart-4", bg: "bg-chart-4/10" },
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = "primary",
  className,
}: StatCardProps) {
  const colorStyle = colorMap[color] || colorMap.primary;

  return (
    <Card className={cn("p-4 hover-elevate", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p
            className="text-2xl font-bold mt-1 tracking-tight"
            data-testid={`text-stat-${title.toLowerCase().replace(/\s/g, "-")}`}
          >
            {value}
          </p>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          {trend && <p className="text-xs font-semibold text-success mt-1">{trend}</p>}
        </div>
        <div className={cn("w-11 h-11 rounded-md flex items-center justify-center", colorStyle.bg)}>
          <Icon className={cn("w-5 h-5", colorStyle.icon)} />
        </div>
      </div>
    </Card>
  );
}
