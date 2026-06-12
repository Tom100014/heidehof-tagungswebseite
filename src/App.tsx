import React, { useEffect, Suspense } from "react";
import { lazyWithRetry } from "@/utils/lazyWithRetry";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { ClaraContextProvider } from "@/context/ClaraContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./App.css";
// NOTE: mobile.css and mobile-safe-area.css are already loaded via index.css → main.css.
// The files below are additive layers NOT covered by main.css.
import "./styles/responsive-improvements.css";
import "./styles/luxury-mobile.css";
import "./styles/mobile-forms.css";
import "./styles/form-animations.css";

import { toast } from "sonner";
import { isBrowser } from "@/utils/safeImport";

import AdminGuard from "./components/admin/AdminGuard";
import AdminLogin from "./pages/admin/AdminLogin";
import type { AdminRole } from "@/utils/admin-security";
// Lazy: admin-only overlay — returns null for all non-admin users, never needed on first paint
const SiteImageEditOverlay = lazyWithRetry(() =>
  import("./components/admin/SiteImageEditOverlay").then((m) => ({ default: m.SiteImageEditOverlay }))
);

// Eager: critical landing pages (LCP-relevant)
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
// Tagungsraeume is the primary conversion page (6.74 KB gzip) — eager to avoid Suspense flash
import Tagungsraeume from "./pages/Tagungsraeume";

// Lazy: marketing sub-pages
const Impressum = lazyWithRetry(() => import("./pages/Impressum"));
const Datenschutz = lazyWithRetry(() => import("./pages/Datenschutz"));
const AGB = lazyWithRetry(() => import("./pages/AGB"));
const Tagungspauschalen = lazyWithRetry(() => import("./pages/Tagungspauschalen"));
const AusstattungTechnik = lazyWithRetry(() => import("./pages/AusstattungTechnik"));
const OutdoorAktiv = lazyWithRetry(() => import("./pages/OutdoorAktiv"));

const Unsubscribe = lazyWithRetry(() => import("./pages/Unsubscribe"));
const Wellness = lazyWithRetry(() => import("./pages/Wellness"));
const Spa = lazyWithRetry(() => import("./pages/Spa"));
const Getraenkekarte = lazyWithRetry(() => import("./pages/Getraenkekarte"));
const Speisekarte = lazyWithRetry(() => import("./pages/Speisekarte"));
const Restaurant = lazyWithRetry(() => import("./pages/Restaurant"));
const Veranstaltungen = lazyWithRetry(() => import("./pages/Veranstaltungen"));
const EinTagBeiUns = lazyWithRetry(() => import("./pages/EinTagBeiUns"));

// Lazy: conference guest flow
const ConferenceGuests = lazyWithRetry(() => import("./pages/ConferenceGuests"));
const ConferencePersonalInfo = lazyWithRetry(() => import("./pages/ConferencePersonalInfo"));
const ConferenceMenuSelection = lazyWithRetry(() => import("./pages/ConferenceMenuSelection"));
const ConferenceOrderSummary = lazyWithRetry(() => import("./pages/ConferenceOrderSummary"));
const ConferenceMenuOrder = lazyWithRetry(() => import("./pages/ConferenceMenuOrder"));
const ConferenceMenuPreview = lazyWithRetry(() => import("./pages/ConferenceMenuPreview"));

// Lazy: admin (heavy bundle, never on first paint)
const AdminConferenceOrders = lazyWithRetry(() => import("./pages/admin/AdminConferenceOrders"));
const AdminInbox = lazyWithRetry(() => import("./pages/admin/AdminInbox"));
const AdminKnowledge = lazyWithRetry(() => import("./pages/admin/AdminKnowledge"));
const AdminClaraMedia = lazyWithRetry(() => import("./pages/admin/AdminClaraMedia"));
const AdminImages = lazyWithRetry(() => import("./pages/admin/AdminImages"));
const AdminImpressionen = lazyWithRetry(() => import("./pages/admin/AdminImpressionen"));
const AdminPartners = lazyWithRetry(() => import("./pages/admin/AdminPartners"));
const AdminRooms = lazyWithRetry(() => import("./pages/admin/AdminRooms"));
const AdminSetups = lazyWithRetry(() => import("./pages/admin/AdminSetups"));
const AdminBildBearbeiten = lazyWithRetry(() => import("./pages/admin/AdminBildBearbeiten"));
const AdminMenuCards = lazyWithRetry(() => import("./pages/admin/AdminMenuCards"));
const AdminAnalytics = lazyWithRetry(() => import("./pages/admin/AdminAnalytics"));
const AdminOverview = lazyWithRetry(() => import("./pages/admin/AdminOverview"));
const AdminCommandCenter = lazyWithRetry(() => import("./pages/admin/AdminCommandCenter"));
const AdminInhalte = lazyWithRetry(() => import("./pages/admin/AdminInhalte"));
const AdminImageStudio = lazyWithRetry(() => import("./pages/admin/AdminImageStudio"));
const AdminImageKnowledge = lazyWithRetry(() => import("./pages/admin/AdminImageKnowledge"));
const AdminImagePresetEdit = lazyWithRetry(() => import("./pages/admin/AdminImagePresetEdit"));
const AdminHelp = lazyWithRetry(() => import("./pages/admin/AdminHelp"));
const AdminAuditLog = lazyWithRetry(() => import("./pages/admin/AdminAuditLog"));
const AdminClaraCockpit = lazyWithRetry(() => import("./pages/admin/AdminClaraCockpit"));
const AdminClaraConversations = lazyWithRetry(() => import("./pages/admin/AdminClaraConversations"));
const AdminKueche = lazyWithRetry(() => import("./pages/admin/AdminKueche"));
const AdminKitchenCockpit = lazyWithRetry(() => import("./pages/admin/AdminKitchenCockpit"));
const AdminConferenceMenu = lazyWithRetry(() => import("./pages/admin/AdminConferenceMenu"));
const AdminDishes = lazyWithRetry(() => import("./pages/admin/AdminDishes"));
const AdminEinstellungen = lazyWithRetry(() => import("./pages/admin/AdminEinstellungen"));
const AdminAnalyse = lazyWithRetry(() => import("./pages/admin/AdminAnalyse"));
const AdminEmailRouting = lazyWithRetry(() => import("./pages/admin/AdminEmailRouting"));
const AdminWellness = lazyWithRetry(() => import("./pages/admin/AdminWellness"));
const BeautyDashboard = lazyWithRetry(() => import("./pages/admin/beauty/BeautyDashboard"));
const DirectorCockpit = lazyWithRetry(() => import("./pages/admin/DirectorCockpit"));
const FbServiceCockpit = lazyWithRetry(() => import("./pages/admin/FbServiceCockpit"));
const FrontDeskCockpit = lazyWithRetry(() => import("./pages/admin/FrontDeskCockpit"));
const AdminTagungsPackages = lazyWithRetry(() => import("./pages/admin/AdminTagungsPackages"));
const AdminTechFeatures = lazyWithRetry(() => import("./pages/admin/AdminTechFeatures"));
const AdminGetraenkekarte = lazyWithRetry(() => import("./pages/admin/AdminGetraenkekarte"));
const AdminSpeisekarte = lazyWithRetry(() => import("./pages/admin/AdminSpeisekarte"));
const AdminSpeisekarteEdit = lazyWithRetry(() => import("./pages/admin/AdminSpeisekarteEdit"));
const AdminVeranstaltungen = lazyWithRetry(() => import("./pages/admin/AdminVeranstaltungen"));
const AdminPageVisibility = lazyWithRetry(() => import("./pages/admin/AdminPageVisibility"));
const AdminIntegrations = lazyWithRetry(() => import("./pages/admin/AdminIntegrations"));
const AdminMews = lazyWithRetry(() => import("./pages/admin/AdminMews"));
const AdminEmailTemplates = lazyWithRetry(() => import("./pages/admin/AdminEmailTemplates"));
const AdminDayJourney = lazyWithRetry(() => import("./pages/admin/AdminDayJourney"));
// Merged hub pages (Cleanup 2026-06)
const AdminMedien = lazyWithRetry(() => import("./pages/admin/AdminMedien"));
const AdminSpeisen = lazyWithRetry(() => import("./pages/admin/AdminSpeisen"));
const AdminClara = lazyWithRetry(() => import("./pages/admin/AdminClara"));
const AdminAuswertung = lazyWithRetry(() => import("./pages/admin/AdminAuswertung"));
const AdminMaximilian = lazyWithRetry(() => import("./pages/admin/AdminMaximilian"));

const AdminLeadAgent = lazyWithRetry(() => import("./pages/admin/AdminLeadAgent"));
const LeadsLayout = lazyWithRetry(() => import("./pages/admin/leads/LeadsLayout"));
const LeadsDashboard = lazyWithRetry(() => import("./pages/admin/leads/LeadsDashboard"));
const LeadsCampaigns = lazyWithRetry(() => import("./pages/admin/leads/LeadsCampaigns"));
const LeadsList = lazyWithRetry(() => import("./pages/admin/leads/LeadsList"));
const LeadsOutbox = lazyWithRetry(() => import("./pages/admin/leads/LeadsOutbox"));
const LeadsTemplates = lazyWithRetry(() => import("./pages/admin/leads/LeadsTemplates"));
const LeadsAutomation = lazyWithRetry(() => import("./pages/admin/leads/LeadsAutomation"));
const LeadsHistory = lazyWithRetry(() => import("./pages/admin/leads/LeadsHistory"));
const LeadsPipeline = lazyWithRetry(() => import("./pages/admin/leads/LeadsPipeline"));
const LeadsSequences = lazyWithRetry(() => import("./pages/admin/leads/LeadsSequences"));

import { OfflineIndicator } from "./components/pwa/OfflineIndicator";
// Static import: ClaraFloatingBubble is already in the main bundle via 11 static
// imports elsewhere — lazy() here was a no-op that only added Suspense overhead.
import { ClaraFloatingBubble as ClaraWidget } from "./components/clara/ClaraFloatingBubble";
import { MaximilianWidget } from "./components/maximilian/MaximilianWidget";
import { ClaraMediaOverlay } from "./components/clara/ClaraMediaOverlay";
import { FloatingCartButton } from "./components/cart/FloatingCartButton";
import { CartDrawer } from "./components/cart/CartDrawer";
const HeidehofPageOverlay = lazyWithRetry(() => import("./components/clara/HeidehofPageOverlay"));
import { SkipLink } from "./components/site/SkipLink";
import { ScrollProgress } from "./components/site/ScrollProgress";
import { SnapScrollManager } from "./components/site/SnapScrollManager";



const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Seite wird geladen"
    className="min-h-screen flex items-center justify-center bg-background"
  >
    <div className="w-8 h-8 rounded-full border-2 border-gold/20 border-t-gold animate-spin" />
  </div>
);

import { useClaraTourBridge } from "./hooks/useClaraTourBridge";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    if (isBrowser) window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function ClaraTourBridge() {
  useClaraTourBridge();
  return null;
}

const FULL_ADMIN_ROLES: AdminRole[] = ["admin", "director"];
const ALL_ADMIN_ROLES: AdminRole[] = ["admin", "director", "service", "kitchen", "conference"];
const SERVICE_ROLES: AdminRole[] = ["admin", "director", "service"];
const KITCHEN_ROLES: AdminRole[] = ["admin", "director", "kitchen"];
const CONFERENCE_ROLES: AdminRole[] = ["admin", "director", "conference"];

function App() {
  useEffect(() => {
    if (!isBrowser) return;
    
    // Detect if running inside iframe and add CSS helper class
    if (window.self !== window.top) {
      document.body.classList.add("clara-embedded");
    }

    const handleOffline = () => {
      if (!navigator.onLine) {
        toast.error("Keine Internetverbindung", {
          description: "Bitte stellen Sie sicher, dass Sie mit dem Internet verbunden sind.",
        });
      }
    };
    window.addEventListener("offline", handleOffline);
    return () => window.removeEventListener("offline", handleOffline);
  }, []);

  return (
    <HelmetProvider>
      <ErrorBoundary>
        <ClaraContextProvider>
        <div className="min-h-screen bg-background relative">
          <SkipLink />
          <ScrollProgress />
          <ScrollToTop />
          <SnapScrollManager />
          <ClaraTourBridge />
          <Suspense fallback={null}><SiteImageEditOverlay /></Suspense>
          <main id="main-content">
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/impressum" element={<Impressum />} />
              <Route path="/datenschutz" element={<Datenschutz />} />
              <Route path="/agb" element={<AGB />} />
              <Route path="/tagungsraeume" element={<Tagungsraeume />} />
              <Route path="/tagungspauschalen" element={<Tagungspauschalen />} />
              <Route path="/ausstattung-technik" element={<AusstattungTechnik />} />
              <Route path="/outdoor-aktiv" element={<OutdoorAktiv />} />
              <Route path="/anfrage" element={<Navigate to="/tagungsraeume" replace />} />
              <Route path="/wellness" element={<Wellness />} />
              <Route path="/spa" element={<Spa />} />
              <Route path="/getraenkekarte" element={<Getraenkekarte />} />
              <Route path="/speisekarte" element={<Speisekarte />} />
              <Route path="/restaurant" element={<Restaurant />} />
              <Route path="/veranstaltungen" element={<Veranstaltungen />} />
              <Route path="/ein-tag-bei-uns" element={<EinTagBeiUns />} />

              <Route path="/menue-bestellung" element={<ConferenceMenuPreview />} />
              <Route path="/menue-bestellung/full" element={<ConferenceMenuOrder />} />
              <Route path="/conference-guests" element={<ConferenceGuests />} />
              <Route path="/conference-guests/personal-info" element={<ConferencePersonalInfo />} />
              <Route path="/conference-guests/menu-selection" element={<ConferenceMenuSelection />} />
              <Route path="/conference-guests/order-summary" element={<ConferenceOrderSummary />} />

              <Route path="/admin/reset-password" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminGuard allowedRoles={ALL_ADMIN_ROLES}><AdminCommandCenter /></AdminGuard>} />
              <Route path="/admin/service" element={<AdminGuard allowedRoles={SERVICE_ROLES}><AdminOverview initialTab="service" /></AdminGuard>} />
              <Route path="/admin/restaurant" element={<Navigate to="/admin/service" replace />} />
              <Route path="/admin/bar" element={<Navigate to="/admin/service" replace />} />
              <Route path="/admin/keller" element={<Navigate to="/admin/service" replace />} />
              <Route path="/admin/tagung" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminOverview initialTab="leads" /></AdminGuard>} />
              <Route path="/admin/direktion" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><DirectorCockpit /></AdminGuard>} />
              <Route path="/admin/cockpit" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><DirectorCockpit /></AdminGuard>} />
              <Route path="/admin/fb-service" element={<AdminGuard allowedRoles={SERVICE_ROLES}><FbServiceCockpit /></AdminGuard>} />
              <Route path="/admin/front-desk" element={<AdminGuard allowedRoles={SERVICE_ROLES}><FrontDeskCockpit /></AdminGuard>} />
              <Route path="/admin/kueche" element={<AdminGuard allowedRoles={KITCHEN_ROLES}><AdminKueche /></AdminGuard>} />
              <Route path="/admin/einstellungen" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminEinstellungen /></AdminGuard>} />
              {/* Legacy-Pfad: alte /admin/settings-Links auf die Einstellungen umleiten */}
              <Route path="/admin/settings" element={<Navigate to="/admin/einstellungen" replace />} />
              {/* === Merged hub pages === */}
              <Route path="/admin/medien"     element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminMedien /></AdminGuard>} />
              <Route path="/admin/speisen"    element={<AdminGuard allowedRoles={["admin","director","service","kitchen"]}><AdminSpeisen /></AdminGuard>} />
              <Route path="/admin/clara"      element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminClara /></AdminGuard>} />
              <Route path="/admin/auswertung" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminAuswertung /></AdminGuard>} />
              <Route path="/admin/maximilian" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminMaximilian /></AdminGuard>} />

              {/* === Legacy routes → redirects into new hubs === */}
              <Route path="/admin/analyse"               element={<Navigate to="/admin/auswertung?tab=ki" replace />} />
              <Route path="/admin/analytics"             element={<Navigate to="/admin/auswertung?tab=analytics" replace />} />
              <Route path="/admin/knowledge"             element={<Navigate to="/admin/clara?tab=wissen" replace />} />
              <Route path="/admin/clara-media"           element={<Navigate to="/admin/clara?tab=medien" replace />} />
              <Route path="/admin/clara-cockpit"         element={<Navigate to="/admin/clara?tab=cockpit" replace />} />
              <Route path="/admin/clara-konversationen"  element={<Navigate to="/admin/clara?tab=gespraeche" replace />} />
              <Route path="/admin/images"                element={<Navigate to="/admin/medien?tab=bilder" replace />} />
              <Route path="/admin/bild-bearbeiten"       element={<Navigate to="/admin/medien?tab=bearbeiten" replace />} />
              <Route path="/admin/impressionen"          element={<Navigate to="/admin/medien?tab=impressionen" replace />} />
              <Route path="/admin/image-studio"          element={<Navigate to="/admin/medien?tab=generieren" replace />} />
              <Route path="/admin/image-prompts"         element={<Navigate to="/admin/medien?tab=prompts" replace />} />
              <Route path="/admin/dishes"                element={<Navigate to="/admin/speisen?tab=gerichte" replace />} />
              <Route path="/admin/conference-menu"       element={<Navigate to="/admin/speisen?tab=tagungsmenu" replace />} />
              <Route path="/admin/menu-cards"            element={<Navigate to="/admin/speisen?tab=druckkarten" replace />} />
              <Route path="/admin/speisekarte"           element={<Navigate to="/admin/speisen?tab=karte" replace />} />

              {/* === Remaining standalone routes === */}
              <Route path="/admin/email-routing" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminEmailRouting /></AdminGuard>} />
              <Route path="/admin/inbox" element={<AdminGuard allowedRoles={["admin","director","service","conference"]}><AdminInbox /></AdminGuard>} />
              <Route path="/admin/rooms" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminRooms /></AdminGuard>} />
              <Route path="/admin/setups" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminSetups /></AdminGuard>} />
              <Route path="/admin/partners" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminPartners /></AdminGuard>} />
              <Route path="/admin/inhalte" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminInhalte /></AdminGuard>} />
              <Route path="/admin/conference-orders" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminConferenceOrders /></AdminGuard>} />
              <Route path="/admin/kitchen" element={<AdminGuard allowedRoles={KITCHEN_ROLES}><AdminKitchenCockpit /></AdminGuard>} />
              <Route path="/admin/image-prompts/neu" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminImagePresetEdit /></AdminGuard>} />
              <Route path="/admin/image-prompts/:id" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminImagePresetEdit /></AdminGuard>} />
              <Route path="/admin/hilfe" element={<AdminGuard allowedRoles={ALL_ADMIN_ROLES}><AdminHelp /></AdminGuard>} />
              <Route path="/admin/aktivitaet" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminAuditLog /></AdminGuard>} />


              <Route path="/admin/wellness" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminWellness /></AdminGuard>} />
              <Route path="/admin/beauty" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><BeautyDashboard /></AdminGuard>} />
              <Route path="/admin/tagungspauschalen" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminTagungsPackages /></AdminGuard>} />
              <Route path="/admin/tagungstechnik" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminTechFeatures /></AdminGuard>} />
              <Route path="/admin/getraenkekarte" element={<AdminGuard allowedRoles={SERVICE_ROLES}><AdminGetraenkekarte /></AdminGuard>} />
              {/* /admin/speisekarte redirectet auf /admin/speisen?tab=karte (siehe oben). Edit-Subroute bleibt. */}
              <Route path="/admin/speisekarte/:id/edit" element={<AdminGuard allowedRoles={["admin", "director", "service", "kitchen"]}><AdminSpeisekarteEdit /></AdminGuard>} />
              <Route path="/admin/veranstaltungen" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminVeranstaltungen /></AdminGuard>} />
              <Route path="/admin/seiten-sichtbarkeit" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminPageVisibility /></AdminGuard>} />
              <Route path="/admin/integrations" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminIntegrations /></AdminGuard>} />
              <Route path="/admin/mews" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminMews /></AdminGuard>} />
              <Route path="/admin/email-templates" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminEmailTemplates /></AdminGuard>} />
              <Route path="/admin/ein-tag" element={<AdminGuard allowedRoles={FULL_ADMIN_ROLES}><AdminDayJourney /></AdminGuard>} />
              
              <Route path="/admin/lead-agent" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><AdminLeadAgent /></AdminGuard>} />
              <Route path="/admin/leads" element={<AdminGuard allowedRoles={CONFERENCE_ROLES}><LeadsLayout /></AdminGuard>}>
                <Route index element={<LeadsDashboard />} />
                <Route path="pipeline" element={<LeadsPipeline />} />
                <Route path="campaigns" element={<LeadsCampaigns />} />
                <Route path="list" element={<LeadsList />} />
                <Route path="outbox" element={<LeadsOutbox />} />
                <Route path="templates" element={<LeadsTemplates />} />
                <Route path="sequences" element={<LeadsSequences />} />
                <Route path="automation" element={<LeadsAutomation />} />
                <Route path="history" element={<LeadsHistory />} />
              </Route>

              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          </main>
          
          <OfflineIndicator />
          <ClaraWidget />
          <MaximilianWidget />
          <FloatingCartButton />
          <CartDrawer />
          <Suspense fallback={null}><HeidehofPageOverlay /></Suspense>
          <ClaraMediaOverlay />
        </div>
        </ClaraContextProvider>
      </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
