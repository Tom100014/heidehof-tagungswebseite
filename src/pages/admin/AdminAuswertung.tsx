import { Brain, BarChart3 } from "lucide-react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { TabbedSection } from "@/components/admin/TabbedSection";
import AdminAnalyse from "./AdminAnalyse";
import AdminAnalytics from "./AdminAnalytics";

const AdminAuswertung = () => (
  <HeidehofAdminLayout title="Auswertung">
    <TabbedSection
      title="Auswertung"
      description="KI-gestützte Analyse und Web-Analytics in einer Ansicht."
      breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "System" }, { label: "Auswertung" }]}
      tabs={[
        { id: "ki",        label: "KI-Analyse",    icon: Brain,     content: <AdminAnalyse /> },
        { id: "analytics", label: "Web-Analytics", icon: BarChart3, content: <AdminAnalytics /> },
      ]}
    />
  </HeidehofAdminLayout>
);

export default AdminAuswertung;
