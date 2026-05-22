import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "@/app/AppContext";
import ErrorBoundary from "@/shared/ui/ErrorBoundary";

import { publicRoutes } from "./routes/publicRoutes";
import { dashboardRoutes } from "./routes/dashboardRoutes";

const LAST_ROUTE_STORAGE_KEY = "vena-lastRoute";

const Login = lazy(() => import("@/pages/auth/LoginPage"));

const PageLoader = () => (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF9F6]">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1A1A1A] mx-auto mb-4"></div>
            <p className="text-[#4A4A4A] font-medium tracking-widest uppercase text-[10px]">Memuat...</p>
        </div>
    </div>
);

export const AppRoutes: React.FC = () => {
    const { isAuthenticated, setIsAuthenticated, setCurrentUser } = useApp();
    const navigate = useNavigate();

    const handleLoginSuccess = (u: any) => {
        setIsAuthenticated(true);
        setCurrentUser(u);
        const lastRoute = window.localStorage.getItem(LAST_ROUTE_STORAGE_KEY);
        navigate(lastRoute || "/dashboard", { replace: true });
    };

    return (
        <ErrorBoundary fallback={<div>Gagal memuat komponen.</div>}>
            <Suspense fallback={<PageLoader />}>
                <Routes>
                    {/* Public Routes */}
                    {publicRoutes}

                    {/* Authentication Route */}
                    <Route path="/login" element={
                        isAuthenticated ? <Navigate to="/dashboard" replace /> : 
                        <Login onLoginSuccess={handleLoginSuccess} />
                    } />

                    {/* Protected Dashboard Routes */}
                    {dashboardRoutes}

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
        </ErrorBoundary>
    );
};
