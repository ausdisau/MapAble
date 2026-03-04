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
  const colorMap: Record<string, { icon: string; bg: string }> = {
    primary: {
      icon: "text-primary",
      bg: "bg-primary/10",
    },
    blue: {
      icon: "text-[#1B6EB5] dark:text-blue-400",
      bg: "bg-[#1B6EB5]/10 dark:bg-blue-950/40",
    },
    green: {
      icon: "text-[#2EAA6E] dark:text-emerald-400",
      bg: "bg-[#2EAA6E]/10 dark:bg-emerald-950/40",
    },
    teal: {
      icon: "text-[#2EAA6E]",
      bg: "bg-[#2EAA6E]/15 dark:bg-[#2EAA6E]/20",
    },
    purple: {
      icon: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-100 dark:bg-violet-950/40",
    },
    amber: {
      icon: "text-[#E6A817] dark:text-amber-400",
      bg: "bg-[#E6A817]/10 dark:bg-amber-950/40",
    },
  };

  const colorStyle = colorMap[color] || colorMap.primary;

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
            <p className="text-xs font-semibold text-[#2EAA6E] mt-1">{trend}</p>
          )}
        </div>
        <div className={`w-11 h-11 rounded-md flex items-center justify-center ${colorStyle.bg}`}>
          <Icon className={`w-5 h-5 ${colorStyle.icon}`} />
        </div>
      </div>
    </Card>
  );
}
