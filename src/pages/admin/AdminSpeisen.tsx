import { UtensilsCrossed, BookOpen, FileText, ClipboardList } from "lucide-react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { TabbedSection } from "@/components/admin/TabbedSection";
import AdminSpeisekarte from "./AdminSpeisekarte";
import AdminDishes from "./AdminDishes";
import AdminConferenceMenu from "./AdminConferenceMenu";
import AdminMenuCards from "./AdminMenuCards";

const AdminSpeisen = () => (
  <HeidehofAdminLayout title="Speisen">
    <TabbedSection
      title="Speisen"
      description="À-la-carte-Karte, einzelne Gerichte, Tagungsmenüs und Druck-PDFs."
      breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Inhalte & Karten" }, { label: "Speisen" }]}
      tabs={[
        { id: "karte",        label: "À-la-carte",     icon: BookOpen,        content: <AdminSpeisekarte /> },
        { id: "gerichte",     label: "Gerichte",       icon: UtensilsCrossed, content: <AdminDishes /> },
        { id: "tagungsmenu",  label: "Tagungsmenüs",   icon: ClipboardList,   content: <AdminConferenceMenu /> },
        { id: "druckkarten",  label: "Druck-PDFs",     icon: FileText,        content: <AdminMenuCards /> },
      ]}
    />
  </HeidehofAdminLayout>
);

export default AdminSpeisen;
