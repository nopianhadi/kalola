import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@/types";
import { useUIStore } from "@/store/uiStore";
import { useNotifications } from "@/hooks/useNotifications";
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates";
import { getAuthToken, clearAuthStorage } from "@/lib/apiClient";
import { AppContext, AppContextType } from "./AppContext";

function readStoredAuth(): { isAuthenticated: boolean; currentUser: User | null } {
  try {
    const isAuthenticated = JSON.parse(window.localStorage.getItem("vena-isAuthenticated") || "false") === true;
    const currentUser = JSON.parse(window.localStorage.getItem("vena-currentUser") || "null") as User | null;
    const token = getAuthToken();
    if (isAuthenticated && currentUser && token) {
      return { isAuthenticated: true, currentUser };
    }
    if (isAuthenticated || currentUser || token) {
      clearAuthStorage();
    }
    return { isAuthenticated: false, currentUser: null };
  } catch {
    clearAuthStorage();
    return { isAuthenticated: false, currentUser: null };
  }
}

/**
 * Inner effects — rendered inside AppContext.Provider so useApp() works.
 * Handles SSE real-time updates (auth-gated inside the hook).
 */
const AppEffects: React.FC = () => {
  useRealtimeUpdates();
  return null;
};

/**
 * Bridges useNotifications (which needs useApp) back up into context handlers.
 * Must render inside AppContext.Provider.
 */
const NotificationsBridge: React.FC<{
  onReady: (markAsRead: (id: number) => void, markAllAsRead: () => void) => void;
}> = ({ onReady }) => {
  const { handleMarkAsRead, handleMarkAllAsRead } = useNotifications();

  useEffect(() => {
    onReady(handleMarkAsRead, handleMarkAllAsRead);
  }, [handleMarkAsRead, handleMarkAllAsRead, onReady]);

  return null;
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  // Auth State — validasi token + user agar tidak stuck redirect/loading setelah reload
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => readStoredAuth().isAuthenticated);
  const [currentUser, setCurrentUser] = useState<User | null>(() => readStoredAuth().currentUser);

  useEffect(() => {
    window.localStorage.setItem("vena-isAuthenticated", JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    window.localStorage.setItem("vena-currentUser", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    const onAuthExpired = () => {
      setIsAuthenticated(false);
      setCurrentUser(null);
      navigate("/login");
    };
    window.addEventListener("vena:auth-expired", onAuthExpired);
    return () => window.removeEventListener("vena:auth-expired", onAuthExpired);
  }, [navigate]);

  const uiStore = useUIStore();
  const activeView = uiStore.activeView;
  const setActiveView = uiStore.setActiveView;
  const notification = uiStore.notification;
  const showNotification = uiStore.showNotification;
  const isSidebarOpen = uiStore.isSidebarOpen;
  const setIsSidebarOpen = uiStore.setIsSidebarOpen;
  const isSearchOpen = uiStore.isSearchOpen;
  const setIsSearchOpen = uiStore.setIsSearchOpen;
  const initialAction = uiStore.initialAction;
  const setInitialAction = uiStore.setInitialAction;

  // Stable refs for notification handlers (updated via NotificationsBridge)
  const markAsReadRef = useRef<(id: number) => void>(() => {});
  const markAllAsReadRef = useRef<() => void>(() => {});

  const handleMarkAsRead = useCallback((id: string) => markAsReadRef.current(Number(id)), []);
  const handleMarkAllAsRead = useCallback(() => markAllAsReadRef.current(), []);

  const handleNotificationsReady = useCallback(
    (markAsRead: (id: number) => void, markAllAsRead: () => void) => {
      markAsReadRef.current = markAsRead;
      markAllAsReadRef.current = markAllAsRead;
    },
    []
  );

  const handleLogout = useCallback(async () => {
    try {
      setIsAuthenticated(false);
      setCurrentUser(null);
      clearAuthStorage();
      navigate("/login");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
    }
  }, [navigate]);

  // Theme — always light
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    try {
      window.localStorage.setItem("theme", "light");
    } catch (error) {
      console.warn("[Theme] Failed to set theme in localStorage:", error);
    }
  }, []);

  const value: AppContextType = useMemo(() => ({
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    setCurrentUser,
    vendorId: currentUser?.id ?? null,
    activeView,
    setActiveView,
    isSidebarOpen,
    setIsSidebarOpen,
    isSearchOpen,
    setIsSearchOpen,
    notification,
    showNotification,
    handleLogout,
    initialAction,
    setInitialAction,
    handleMarkAsRead,
    handleMarkAllAsRead,
  }), [
    isAuthenticated,
    setIsAuthenticated,
    currentUser,
    setCurrentUser,
    activeView,
    setActiveView,
    isSidebarOpen,
    setIsSidebarOpen,
    isSearchOpen,
    setIsSearchOpen,
    notification,
    showNotification,
    handleLogout,
    initialAction,
    setInitialAction,
    handleMarkAsRead,
    handleMarkAllAsRead,
  ]);

  return (
    <AppContext.Provider value={value}>
      {/* These must be inside Provider so useApp() works inside them */}
      <AppEffects />
      <NotificationsBridge onReady={handleNotificationsReady} />
      {children}
    </AppContext.Provider>
  );
};
