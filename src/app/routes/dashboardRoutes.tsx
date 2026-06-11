import { lazy } from "react";
import { Route, Navigate } from "react-router-dom";
import { ViewType } from "@/types";
import { ProtectedRoute } from "./ProtectedRoute";
import { RedirectWithParams } from "./RedirectWithParams";
import { useApp } from "@/app/AppContext";

const Booking = lazy(() => import("@/pages/booking/BookingPage"));
const Clients = lazy(() => import("@/pages/clients/ClientsPage"));
const ClientDetailPage = lazy(() => import("@/pages/clients/ClientDetailPage"));
const ClientEditPage = lazy(() => import("@/pages/clients/ClientEditPage"));
const ProjectDetailPage = lazy(() => import("@/pages/projects/ProjectDetailPage"));
const ProjectEditPage = lazy(() => import("@/pages/projects/ProjectEditPage"));
// Note: using default export as suggested for Freelancers/TeamPage if possible, but keeping .then if needed. 
// However, the user suggested using default export. We will assume TeamPage has a default export or we can still use .then for now.
const Freelancers = lazy(() => import("@/pages/team/TeamPage").then((m) => ({ default: m.Freelancers || m.default })));
const TeamDetailPage = lazy(() => import("@/pages/team/TeamDetailPage"));
const TeamEditPage = lazy(() => import("@/pages/team/TeamEditPage"));
const Finance = lazy(() => import("@/pages/finance/FinancePage"));
const Packages = lazy(() => import("@/features/packages/Packages"));
const PackageEditPage = lazy(() => import("@/pages/packages/PackageEditPage"));
const Contracts = lazy(() => import("@/pages/contracts/ContractsPage"));
const ContractDetailPage = lazy(() => import("@/pages/contracts/ContractDetailPage"));
const Settings = lazy(() => import("@/pages/settings/SettingsPage"));
const CalendarView = lazy(() => import("@/features/projects/components/CalendarView").then((m) => ({ default: m.CalendarView || m.default })));
const ClientReports = lazy(() => import("@/features/clients/components/ClientKPI"));
const LeadsPage = lazy(() => import("@/pages/leads/LeadsPage"));
const GalleryUpload = lazy(() => import("@/features/public/components/GalleryUpload"));
const PortfolioManager = lazy(() => import("@/features/public/components/PortfolioManager"));
const PromoCodes = lazy(() => import("@/features/promo/PromoCodes"));

const GalleryRouteWrapper = () => {
    const { currentUser, showNotification } = useApp();
    if (!currentUser) return null;
    return <GalleryUpload userProfile={currentUser as any} showNotification={showNotification} />;
};

const PortfolioRouteWrapper = () => {
    const { currentUser, showNotification } = useApp();
    // currentUser should always be non-null here because ProtectedRoute guards this,
    // but if for some reason it's null, redirect to login instead of infinite spinner.
    if (!currentUser) return <Navigate to="/login" replace />;
    return <PortfolioManager userProfile={currentUser as any} showNotification={showNotification} />;
};

export const dashboardRoutes = (
    <>
        {/* Calon Pengantin (Leads) */}
        <Route path="/prospek" element={<ProtectedRoute requiredPermissions={[ViewType["Calon Pengantin"]]}><LeadsPage /></ProtectedRoute>} />

        {/* Booking */}
        <Route path="/booking" element={<ProtectedRoute requiredPermissions={[ViewType.BOOKING]}><Booking /></ProtectedRoute>} />

        {/* Clients */}
        <Route path="/clients" element={<ProtectedRoute requiredPermissions={[ViewType.CLIENTS]}><Clients /></ProtectedRoute>} />
        <Route path="/clients/:id" element={<ProtectedRoute requiredPermissions={[ViewType.CLIENTS]}><ClientDetailPage /></ProtectedRoute>} />
        <Route path="/clients/edit/:id" element={<ProtectedRoute requiredPermissions={[ViewType.CLIENTS]}><ClientEditPage /></ProtectedRoute>} />
        <Route path="/clients/new" element={<ProtectedRoute requiredPermissions={[ViewType.CLIENTS]}><ClientEditPage /></ProtectedRoute>} />
        {/* Client Aliases -> Redirect */}
        <Route path="/client" element={<Navigate to="/clients" replace />} />
        <Route path="/client/:id" element={<RedirectWithParams to="/clients/:id" />} />
        <Route path="/client/:id/edit" element={<RedirectWithParams to="/clients/edit/:id" />} />
        <Route path="/client/add" element={<Navigate to="/clients/new" replace />} />

        {/* Projects — list view redirect ke clients sementara; detail/edit/new tetap aktif */}
        <Route path="/projects" element={<ProtectedRoute requiredPermissions={[ViewType.PROJECTS]}><Navigate to="/clients" replace /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute requiredPermissions={[ViewType.PROJECTS]}><ProjectDetailPage /></ProtectedRoute>} />
        <Route path="/projects/edit/:id" element={<ProtectedRoute requiredPermissions={[ViewType.PROJECTS]}><ProjectEditPage /></ProtectedRoute>} />
        <Route path="/projects/new" element={<ProtectedRoute requiredPermissions={[ViewType.PROJECTS]}><ProjectEditPage /></ProtectedRoute>} />
        {/* Project Aliases -> Redirect */}
        <Route path="/project" element={<Navigate to="/projects" replace />} />
        <Route path="/project/:id" element={<RedirectWithParams to="/projects/:id" />} />
        <Route path="/project/:id/edit" element={<RedirectWithParams to="/projects/edit/:id" />} />
        <Route path="/project/add" element={<Navigate to="/projects/new" replace />} />

        {/* Team */}
        <Route path="/team" element={<ProtectedRoute requiredPermissions={[ViewType.TEAM]}><Freelancers /></ProtectedRoute>} />
        <Route path="/team/:id" element={<ProtectedRoute requiredPermissions={[ViewType.TEAM]}><TeamDetailPage /></ProtectedRoute>} />
        <Route path="/team/new" element={<ProtectedRoute requiredPermissions={[ViewType.TEAM]}><TeamEditPage /></ProtectedRoute>} />
        <Route path="/team/edit/:id" element={<ProtectedRoute requiredPermissions={[ViewType.TEAM]}><TeamEditPage /></ProtectedRoute>} />
        {/* Team Aliases -> Redirect */}
        <Route path="/member" element={<Navigate to="/team" replace />} />
        <Route path="/member/:id" element={<RedirectWithParams to="/team/:id" />} />
        <Route path="/member/add" element={<Navigate to="/team/new" replace />} />
        <Route path="/member/:id/edit" element={<RedirectWithParams to="/team/edit/:id" />} />

        {/* Finance */}
        <Route path="/finance" element={<ProtectedRoute requiredPermissions={[ViewType.FINANCE]}><Finance /></ProtectedRoute>} />

        {/* Packages */}
        <Route path="/packages" element={<ProtectedRoute requiredPermissions={[ViewType.PACKAGES]}><Packages /></ProtectedRoute>} />
        <Route path="/packages/add-ons" element={<ProtectedRoute requiredPermissions={[ViewType.PACKAGES]}><Packages /></ProtectedRoute>} />
        <Route path="/packages/new" element={<ProtectedRoute requiredPermissions={[ViewType.PACKAGES]}><PackageEditPage /></ProtectedRoute>} />
        <Route path="/packages/edit/:id" element={<ProtectedRoute requiredPermissions={[ViewType.PACKAGES]}><PackageEditPage /></ProtectedRoute>} />
        {/* Package Aliases -> Redirect */}
        <Route path="/package" element={<Navigate to="/packages" replace />} />
        <Route path="/package/add-ons" element={<Navigate to="/packages/add-ons" replace />} />
        <Route path="/package/add" element={<Navigate to="/packages/new" replace />} />
        <Route path="/package/:id/edit" element={<RedirectWithParams to="/packages/edit/:id" />} />

        {/* Contracts */}
        <Route path="/kontrak" element={<ProtectedRoute requiredPermissions={[ViewType.CONTRACTS]}><Contracts /></ProtectedRoute>} />
        <Route path="/kontrak/:id" element={<ProtectedRoute requiredPermissions={[ViewType.CONTRACTS]}><ContractDetailPage /></ProtectedRoute>} />
        {/* Contract Aliases -> Redirect */}
        <Route path="/contract" element={<Navigate to="/kontrak" replace />} />
        <Route path="/contract/:id" element={<RedirectWithParams to="/kontrak/:id" />} />

        {/* Other Features */}
        <Route path="/settings" element={<ProtectedRoute requiredPermissions={[ViewType.SETTINGS]}><Settings /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute requiredPermissions={[ViewType.CALENDAR]}><CalendarView /></ProtectedRoute>} />
        <Route path="/client-reports" element={<ProtectedRoute requiredPermissions={[ViewType.CLIENT_REPORTS]}><ClientReports /></ProtectedRoute>} />
        
        {/* Promo Codes & Gallery */}
        <Route path="/promo-codes" element={<ProtectedRoute requiredPermissions={[ViewType.PROMO_CODES]}><PromoCodes /></ProtectedRoute>} />
        <Route path="/promo-code" element={<Navigate to="/promo-codes" replace />} />
        <Route path="/gallery" element={<ProtectedRoute requiredPermissions={[ViewType.GALLERY]}><GalleryRouteWrapper /></ProtectedRoute>} />
        <Route path="/admin-portfolio" element={<ProtectedRoute requiredPermissions={[ViewType.PORTFOLIO]}><PortfolioRouteWrapper /></ProtectedRoute>} />
    </>
);
