import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/app/lib/utils";

const badgeVariants = cva(
  "whitespace-nowrap inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black transition-colors focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 hover-elevate",
  {
    variants: {
      variant: {
        default:
          "border-[#005B7F]/20 bg-[#005B7F]/10 text-[#005B7F] shadow-xs",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-xs",
        outline: "text-foreground border [border-color:var(--badge-outline)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  variant: "default" | "secondary" | "destructive" | "outline";
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
