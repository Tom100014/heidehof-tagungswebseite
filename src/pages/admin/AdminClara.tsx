import { Sparkles, MessageSquare, Brain, Image } from "lucide-react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { TabbedSection } from "@/components/admin/TabbedSection";
import AdminClaraCockpit from "./AdminClaraCockpit";
import AdminClaraConversations from "./AdminClaraConversations";
import AdminKnowledge from "./AdminKnowledge";
import AdminClaraMedia from "./AdminClaraMedia";

const AdminClara = () => (
  <HeidehofAdminLayout title="Clara">
    <TabbedSection
      title="Clara"
      description="Cockpit, Gäste-Gespräche, Wissensdatenbank und Medien für die KI-Assistentin."
      breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Inhalte & Karten" }, { label: "Clara" }]}
      tabs={[
        { id: "cockpit",    label: "Cockpit",   icon: Sparkles,      content: <AdminClaraCockpit /> },
        { id: "gespraeche", label: "Gespräche", icon: MessageSquare, content: <AdminClaraConversations /> },
        { id: "wissen",     label: "Wissen",    icon: Brain,         content: <AdminKnowledge /> },
        { id: "medien",     label: "Medien",    icon: Image,         content: <AdminClaraMedia /> },
      ]}
    />
  </HeidehofAdminLayout>
);

export default AdminClara;
