import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function AuthFormCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card variant="gradient" className="shadow-md">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-6">{children}</CardContent>
      {footer ? (
        <CardFooter className="justify-center border-t border-border/40 bg-muted/20 py-4 text-sm text-muted-foreground">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function AuthOAuthDivider({ label }: { label: string }) {
  return (
    <div className="relative text-center text-xs text-muted-foreground">
      <span className="relative z-10 bg-card px-2">{label}</span>
      <span
        className="absolute left-0 right-0 top-1/2 border-t border-border/60"
        aria-hidden
      />
    </div>
  );
}
