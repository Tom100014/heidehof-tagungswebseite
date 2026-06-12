import { Image, Wand2, Palette, FileImage, ImageIcon } from "lucide-react";
import HeidehofAdminLayout from "@/components/admin/HeidehofAdminLayout";
import { TabbedSection } from "@/components/admin/TabbedSection";
import AdminImages from "./AdminImages";
import AdminBildBearbeiten from "./AdminBildBearbeiten";
import AdminImpressionen from "./AdminImpressionen";
import AdminImageStudio from "./AdminImageStudio";
import AdminImageKnowledge from "./AdminImageKnowledge";

const AdminMedien = () => (
  <HeidehofAdminLayout title="Medien">
    <TabbedSection
      title="Medien"
      description="Alle Bilder, Bearbeitungen, KI-Generierung und Impressionen an einem Ort."
      breadcrumb={[{ label: "Admin", href: "/admin" }, { label: "Inhalte & Karten" }, { label: "Medien" }]}
      tabs={[
        { id: "bilder",       label: "Bilder",        icon: ImageIcon,  content: <AdminImages /> },
        { id: "bearbeiten",   label: "Bearbeiten",    icon: Wand2,      content: <AdminBildBearbeiten /> },
        { id: "generieren",   label: "KI-Generieren", icon: Palette,    content: <AdminImageStudio /> },
        { id: "prompts",      label: "Bild-Prompts",  icon: FileImage,  content: <AdminImageKnowledge /> },
        { id: "impressionen", label: "Impressionen",  icon: Image,      content: <AdminImpressionen /> },
      ]}
    />
  </HeidehofAdminLayout>
);

export default AdminMedien;
