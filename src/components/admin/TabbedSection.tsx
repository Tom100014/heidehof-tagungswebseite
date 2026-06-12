import { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import AdminPageHeader, { type AdminBreadcrumbItem } from "@/components/admin/AdminPageHeader";

export interface AdminTab {
  id: string;
  label: string;
  icon?: LucideIcon;
  description?: string;
  content: ReactNode;
}

interface Props {
  title: string;
  description?: string;
  tabs: AdminTab[];
  /** URL search-param key used to remember tab between reloads */
  paramKey?: string;
  defaultTab?: string;
  breadcrumb?: AdminBreadcrumbItem[];
  actions?: ReactNode;
}

/**
 * Reusable tab container for admin "hub" pages (Medien, Speisen, Clara, …).
 * - Renders the AdminPageHeader so hub pages share the same look as standalone pages.
 * - Active tab is preserved in `?tab=` so deep-links and redirects work.
 */
export const TabbedSection = ({
  title,
  description,
  tabs,
  paramKey = "tab",
  defaultTab,
  breadcrumb,
  actions,
}: Props) => {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get(paramKey);
  const initial = tabs.find((t) => t.id === fromUrl)?.id ?? defaultTab ?? tabs[0]?.id;
  const active = tabs.find((t) => t.id === initial) ?? tabs[0];

  const setActive = (id: string) => {
    const next = new URLSearchParams(params);
    next.set(paramKey, id);
    setParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        title={title}
        subtitle={description}
        breadcrumb={breadcrumb}
        actions={actions}
      />

      <div className="border-b border-border">
        <nav className="flex gap-1 overflow-x-auto -mb-px" role="tablist">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isOn = t.id === active?.id;
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isOn}
                onClick={() => setActive(t.id)}
                title={t.description}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isOn
                    ? "border-[hsl(var(--apple))] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>

      <div role="tabpanel" className="min-h-[40vh]">
        {active?.content}
      </div>
    </div>
  );
};
