import { lazy } from "react";
import { Route } from "react-router-dom";
import { PublicLayout } from "@/layouts/PublicLayout";

const Homepage = lazy(() => import("@/pages/home/Homepage"));
const PublicPackages = lazy(() => import("@/features/public/components/PublicPackages"));
const PublicBookingForm = lazy(() => import("@/features/public/components/PublicBookingForm"));
const PublicFeedbackForm = lazy(() => import("@/features/public/components/PublicFeedbackForm"));
const SuggestionForm = lazy(() => import("@/features/public/components/SuggestionForm"));
const PublicGallery = lazy(() => import("@/features/public/components/PublicGallery"));
const PublicInvoice = lazy(() => import("@/features/public/components/PublicInvoice"));
const PublicReceipt = lazy(() => import("@/features/public/components/PublicReceipt"));
const ClientPortal = lazy(() => import("@/features/clients/components/ClientPortal"));
const FreelancerPortal = lazy(() => import("@/features/team/components/FreelancerPortal"));
const TestSignature = lazy(() => import("@/features/test/TestSignature"));
const DesignSystem = lazy(() => import("@/pages/home/DesignSystem"));

export const publicRoutes = (
    <>
        <Route element={<PublicLayout />}>
            <Route path="/public-packages/:vendorId?" element={<PublicPackages />} />
            <Route path="/p-packages/:vendorId?" element={<PublicPackages />} />
            <Route path="/public-booking/:vendorId?" element={<PublicBookingForm />} />
            <Route path="/book/:vendorId?" element={<PublicBookingForm />} />
            <Route path="/b/:vendorId?" element={<PublicBookingForm />} />
            <Route path="/feedback" element={<PublicFeedbackForm />} />
            <Route path="/suggestion-form" element={<SuggestionForm />} />
        </Route>

        <Route path="/" element={<Homepage />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/gallery/:id" element={<PublicGallery />} />
        <Route path="/g/:id" element={<PublicGallery />} />
        <Route path="/portal/invoice/:projectId" element={<PublicInvoice />} />
        <Route path="/i/:projectId" element={<PublicInvoice />} />
        <Route path="/portal/receipt/:transactionId" element={<PublicReceipt />} />
        <Route path="/r/:transactionId" element={<PublicReceipt />} />
        <Route path="/portal/:accessId" element={<ClientPortal />} />
        <Route path="/p/:accessId" element={<ClientPortal />} />
        <Route path="/freelancer-portal/:accessId" element={<FreelancerPortal />} />
        <Route path="/f/:accessId" element={<FreelancerPortal />} />
        <Route path="/test-signature" element={<TestSignature />} />
        <Route path="/design-system" element={<DesignSystem />} />
    </>
);
