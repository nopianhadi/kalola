import { ViewType } from "@/types";

export interface PrivateRoute {
  path: string;
  view: ViewType;
  label: string;
}

export const privateRoutes: PrivateRoute[] = [
  { path: "prospek", view: ViewType["Calon Pengantin"], label: "Leads" },
  { path: "booking", view: ViewType.BOOKING, label: "Booking" },
  { path: "clients", view: ViewType.CLIENTS, label: "Clients" },
  { path: "projects", view: ViewType.PROJECTS, label: "Projects" },
  { path: "team", view: ViewType.TEAM, label: "Tim / Vendor" },
  { path: "finance", view: ViewType.FINANCE, label: "Keuangan" },
  { path: "calendar", view: ViewType.CALENDAR, label: "Kalender" },
  { path: "packages", view: ViewType.PACKAGES, label: "Paket" },
  { path: "promo-codes", view: ViewType.PROMO_CODES, label: "Promo" },
  { path: "client-reports", view: ViewType.CLIENT_REPORTS, label: "Laporan Klien" },
  { path: "settings", view: ViewType.SETTINGS, label: "Pengaturan" },
  { path: "gallery", view: ViewType.GALLERY, label: "Galeri" },
];
