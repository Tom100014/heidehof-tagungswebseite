import { NavLink, Outlet } from "react-router-dom";
import { Gauge, Megaphone, Users, Send, Mail, Clock, History, KanbanSquare, Workflow } from "lucide-react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/admin/leads", label: "Übersicht", icon: Gauge, end: true },
  { to: "/admin/leads/pipeline", label: "Pipeline", icon: KanbanSquare },
  { to: "/admin/leads/campaigns", label: "Kampagnen", icon: Megaphone },
  { to: "/admin/leads/list", label: "Leads", icon: Users },
  { to: "/admin/leads/outbox", label: "Versand-Center", icon: Send },
  { to: "/admin/leads/templates", label: "E-Mail-Vorlagen", icon: Mail },
  { to: "/admin/leads/sequences", label: "Sequenzen", icon: Workflow },
  { to: "/admin/leads/automation", label: "Automatisierung", icon: Clock },
  { to: "/admin/leads/history", label: "Verlauf", icon: History },
];

const LeadsLayout = () => (
  <HeidehofAdminLayout title="Lead-Generierung">
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TABS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-all backdrop-blur-md border",
                isActive
                                    ? "bg-foreground/10 text-foreground border-foreground/30 shadow-sm"
                                    : "bg-transparent text-muted-foreground border-border hover:bg-muted/50 hover:text-foreground"
              )
            }
          >
            <Icon className="w-4 h-4" /> {label}
          </NavLink>
        ))}
      </div>
      <Outlet />
    </div>
  </HeidehofAdminLayout>
);

export default LeadsLayout;
