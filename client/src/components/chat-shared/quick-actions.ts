import { Bus, Flag, Search, Phone, UserCog, ArrowRight, Calendar, CreditCard, PieChart } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

export interface QuickActionDef {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  color: string;
}

export const QUICK_ACTION_CONFIG: Record<string, QuickActionDef> = {
  book_transport: { label: "Book Transport", icon: Bus, color: "bg-[#1B6EB5]/10 text-[#1B6EB5] border-[#1B6EB5]/30" },
  report_barrier: { label: "Report Barrier", icon: Flag, color: "bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400" },
  view_workers: { label: "View Workers", icon: Search, color: "bg-[#2EAA6E]/10 text-[#2EAA6E] border-[#2EAA6E]/30" },
  escalate: { label: "Get Human Help", icon: Phone, color: "bg-red-500/10 text-red-600 border-red-500/30 dark:text-red-400" },
  edit_profile: { label: "Edit Profile", icon: UserCog, color: "bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400" },
  view_pricing: { label: "View Pricing", icon: ArrowRight, color: "bg-[#E6A817]/10 text-[#E6A817] border-[#E6A817]/30" },
  view_shifts: { label: "View Shifts", icon: Calendar, color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30 dark:text-indigo-400" },
  pay_invoice: { label: "Pay Invoice", icon: CreditCard, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400" },
  check_budget: { label: "Check Budget", icon: PieChart, color: "bg-[#E6A817]/10 text-[#E6A817] border-[#E6A817]/30" },
};

export interface QuickActionContext {
  navigate: (path: string) => void;
  setInput: (value: string) => void;
  focusInput: () => void;
  onReportBarrier?: () => void;
  onEditProfile?: () => void;
}

export function handleQuickAction(action: string, ctx: QuickActionContext): void {
  switch (action) {
    case "book_transport":
      ctx.navigate("/transport");
      break;
    case "report_barrier":
      ctx.onReportBarrier?.();
      break;
    case "escalate":
      ctx.setInput("I need to speak with a human support person");
      ctx.focusInput();
      break;
    case "edit_profile":
      ctx.onEditProfile?.();
      break;
    case "view_workers":
      ctx.navigate("/care");
      break;
    case "view_pricing":
      ctx.navigate("/pricing");
      break;
    case "view_shifts":
      ctx.navigate("/care");
      break;
    case "pay_invoice":
      ctx.navigate("/invoices");
      break;
    case "check_budget":
      ctx.navigate("/budget");
      break;
  }
}

export const CONFIDENCE_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  high: { label: "High confidence", variant: "default" },
  medium: { label: "Medium — limited data", variant: "secondary" },
  low: { label: "Low — community reports only", variant: "outline" },
  general: { label: "General guidance", variant: "outline" },
};
