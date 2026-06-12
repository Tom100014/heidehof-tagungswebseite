import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumb?: AdminBreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

/**
 * Einheitlicher Page-Header für alle Admin-Seiten.
 * Wird IMMER im Content-Bereich rechts gerendert (innerhalb von HeidehofAdminLayout).
 */
export function AdminPageHeader({
  title,
  subtitle,
  breadcrumb,
  actions,
  className,
}: AdminPageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2 pb-5 border-b border-border", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {breadcrumb.map((item, i) => (
            <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="w-3 h-3 opacity-60" aria-hidden />}
              {item.href ? (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--apple))] rounded"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground/80">{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground max-w-3xl">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </header>
  );
}

export default AdminPageHeader;
