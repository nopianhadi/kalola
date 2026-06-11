import React from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useApp } from "@/app/AppContext";
import { ViewType } from "@/types";
import { MainLayout } from "@/layouts/MainLayout";

const LAST_ROUTE_STORAGE_KEY = "vena-lastRoute";

const AccessDenied: React.FC = () => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6 md:p-8 animate-fade-in">
        <div className="w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center mb-4 sm:mb-6">
            <img src="/assets/images/backgrounds/errorimg.svg" alt="Akses Ditolak" className="w-full h-full object-contain" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-2 sm:mb-3">Akses Ditolak</h2>
        <p className="text-brand-text-secondary mb-4 max-w-md leading-relaxed">
            Anda tidak memiliki izin untuk mengakses halaman ini. <br />
            <span className="text-sm">Hubungi Admin jika membutuhkan akses.</span>
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
            <Link
                to="/prospek"
                className="px-5 py-2.5 bg-brand-accent text-white rounded-xl font-semibold text-sm hover:bg-brand-accent/90 transition-colors shadow-lg shadow-brand-accent/20"
            >
                Kembali ke Beranda
            </Link>
        </div>
    </div>
);

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredPermissions?: ViewType[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermissions }) => {
    const { isAuthenticated, currentUser } = useApp();
    const location = useLocation();

    React.useEffect(() => {
        if (!isAuthenticated) {
            window.localStorage.setItem(LAST_ROUTE_STORAGE_KEY, location.pathname + location.search);
        }
    }, [isAuthenticated, location]);

    if (!isAuthenticated || !currentUser) {
        return <Navigate to="/login" replace />;
    }

    if (requiredPermissions && requiredPermissions.length > 0) {
        const hasPermission = currentUser?.role === "Admin" || requiredPermissions.some(p => currentUser?.permissions?.includes(p));
        if (!hasPermission) return <AccessDenied />;
    }

    return <MainLayout>{children}</MainLayout>;
};
