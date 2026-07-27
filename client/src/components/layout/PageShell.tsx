import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageShellProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  /** Optional hero/banner rendered full-width above the title block */
  banner?: React.ReactNode;
}

export function PageShell({
  title,
  description,
  icon: Icon,
  actions,
  breadcrumbs,
  children,
  className,
  contentClassName,
  banner,
}: PageShellProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-content px-4 md:px-6 py-6 md:py-8 animate-fade-in",
        className,
      )}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-3">
          <ol className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.label} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-foreground transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-foreground font-medium">{crumb.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {banner && <div className="mb-6">{banner}</div>}

      <header className="flex items-start justify-between gap-4 flex-wrap mb-6 md:mb-8">
        <div className="flex items-start gap-3 min-w-0">
          {Icon && (
            <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-h1" data-testid="text-page-title">
              {title}
            </h1>
            {description && (
              <p className="text-sm md:text-base text-muted-foreground mt-1.5 max-w-prose">
                {description}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </header>

      <div className={cn("space-y-section-gap", contentClassName)}>{children}</div>
    </div>
  );
}
