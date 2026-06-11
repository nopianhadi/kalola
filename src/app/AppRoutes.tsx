import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "@/app/AppContext";
import ErrorBoundary from "@/shared/ui/ErrorBoundary";

import { publicRoutes } from "./routes/publicRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";

const LAST_ROUTE_STORAGE_KEY = "vena-lastRoute";

const Login = lazy(() => import("@/pages/auth/LoginPage"));
const Signup = lazy(() => import("@/pages/auth/SignupPage"));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A] mx-auto mb-4"></div>
            <p className="text-[#4A4A4A] font-medium tracking-widest uppercase text-[10px]">Memuat...</p>
        </div>
    </div>
);

export const AppRoutes: React.FC = () => {
    const { isAuthenticated, currentUser, setIsAuthenticated, setCurrentUser } = useApp();
    const navigate = useNavigate();
    const isLoggedIn = isAuthenticated && !!currentUser;

    const handleLoginSuccess = (u: any) => {
        setIsAuthenticated(true);
        setCurrentUser(u);
        const lastRoute = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
        navigate(lastRoute || "/prospek", { replace: true });
    };

    return (
        <ErrorBoundary fallback={<div>Gagal memuat komponen.</div>}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    {publicRoutes}

                    {/* Authentication Routes */}
                    <Route path="/login" element={
                        isLoggedIn ? <Navigate to="/prospek" replace /> :
                        <Login onLoginSuccess={handleLoginSuccess} />
                    } />
                    <Route path="/signup" element={
                        isLoggedIn ? <Navigate to="/prospek" replace /> :
                        <Signup onSignupSuccess={handleLoginSuccess} />
                    } />
                    <Route path="/register" element={<Navigate to="/signup" replace />} />

                    {/* Protected Dashboard Routes */}
                    {dashboardRoutes}

                    {/* Root & Dashboard redirect to Leads */}
                    <Route path="/" element={isLoggedIn ? <Navigate to="/prospek" replace /> : <Navigate to="/login" replace />} />
                    <Route path="/dashboard" element={<Navigate to="/prospek" replace />} />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
};
