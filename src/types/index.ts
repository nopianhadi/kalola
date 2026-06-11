import React from 'react';

export type NavigationAction = {
  type: string;
  id?: number | string;
  tab?: 'info' | 'project' | 'payment' | 'invoice';
};

export interface ChatMessage {
  id: number;
  sender: 'vendor' | 'client';
  text: string;
  timestamp: string; // ISO date string
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  timestamp: string; // ISO date string
  isRead: boolean;
  icon: 'lead' | 'deadline' | 'feedback' | 'payment' | 'completed' | 'comment';
  link?: {
    view: ViewType;
    action?: NavigationAction;
  };
}

export interface PromoCode {
  id: number;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  usageCount: number;
  maxUsage?: number | null;
  expiryDate?: string | null;
  createdAt: string;
}



export interface ChatTemplate {
  id: number | string;
  title: string;
  template: string;
}

export enum ViewType {
  HOMEPAGE = 'Homepage',
  DASHBOARD = 'Dashboard',
  "Calon Pengantin" = 'Calon Pengantin',
  BOOKING = 'Booking',
  CLIENTS = 'Pengelola Pengantin',
  PROJECTS = 'Proyek',
  TEAM = 'Tim / Vendor',
  FINANCE = 'Keuangan',
  CALENDAR = 'Kalender',
  CLIENT_REPORTS = 'Laporan Klien',
  PACKAGES = 'Input Package',
  PROMO_CODES = 'Kode Promo',
  ASSETS = 'Manajemen Aset',
  SOCIAL_MEDIA_PLANNER = 'Perencana Media Sosial',
  MARKETING = 'Marketing',
  GALLERY = 'Pricelist Upload',
  PORTFOLIO = 'Portfolio',
  SETTINGS = 'Pengaturan',
  CONTRACTS = 'Kontrak',
}

export interface SubStatusConfig {
  name: string;
  note: string;
}

export interface ProjectStatusConfig {
  id: number;
  name: string;
  color: string; // hex color
  // Optional default progress (0-100) for this status. Used when no sub-status progress is computed.
  defaultProgress?: number;
  subStatuses: SubStatusConfig[];
  note: string;
}

export enum PaymentStatus {
  LUNAS = 'Lunas',
  DP_TERBAYAR = 'DP Terbayar',
  BELUM_BAYAR = 'Belum Bayar'
}

export interface GalleryImage {
  id: number;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedAt: string;
}

export interface Gallery {
  id: number;
  user_id: number;
  title: string;
  region: string;
  description?: string;
  is_public: boolean;
  public_id: string;
  // Optional: custom booking link to be shown on the public gallery page
  booking_link?: string;
  images: GalleryImage[];
  created_at: string;
  updated_at?: string;
}

export interface PortfolioItem {
  id: number;
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  sort_order?: number;
  uploadedAt: string;
}

export interface Portfolio {
  id: number;
  vendor_id?: number; // Owner vendor ID (multi-tenant isolation)
  user_id?: number;   // DEPRECATED: kept for backward compatibility
  title: string;
  category?: string;
  description?: string;
  hero_image_url?: string;
  is_public: boolean;
  public_id: string;
  booking_link?: string;
  project_date?: string;
  location?: string;
  items: PortfolioItem[];
  created_at: string;
  updated_at?: string;
}

export enum ClientStatus {
  ACTIVE = 'Aktif',
  INACTIVE = 'Tidak Aktif',
  LOST = 'Hilang'
}

export enum ClientType {
  DIRECT = 'Langsung',
  VENDOR = 'Vendor',
}



export enum ContactChannel {
  WHATSAPP = 'WhatsApp',
  INSTAGRAM = 'Instagram',
  WEBSITE = 'Website',
  PHONE = 'Telepon',
  REFERRAL = 'Referensi',
  SUGGESTION_FORM = 'Form Saran',
  OTHER = 'Lainnya',
}

export enum LeadSource {
  FRIENDS_FAMILY = 'Friends/Family',
  INSTAGRAM = 'Instagram',
  TIKTOK = 'TikTok',
  ADS = 'Ads',
}

export enum LeadStatus {
  NEW = 'Baru',
  CONTACTED = 'Dihubungi',
  CONVERTED = 'Konversi',
  LOST = 'Hilang',
}

export interface Lead {
  id: number;
  name: string;
  city?: string;
  whatsapp: string;
  source: LeadSource | string;
  status: LeadStatus | string;
  notes?: string;
  clientId?: number;
  createdAt: string;
  updatedAt: string;
}

export enum CardType {
  PRABAYAR = 'Prabayar',
  KREDIT = 'Kredit',
  DEBIT = 'Debit',
  TUNAI = 'Tunai'
}

export enum PerformanceNoteType {
  PRAISE = 'Pujian',
  CONCERN = 'Perhatian',
  LATE_DEADLINE = 'Keterlambatan Deadline',
  GENERAL = 'Umum',
}

export enum SatisfactionLevel {
  VERY_SATISFIED = 'Sangat Puas',
  SATISFIED = 'Puas',
  NEUTRAL = 'Biasa Saja',
  UNSATISFIED = 'Tidak Puas',
}






export interface PerformanceNote {
  id: number;
  date: string; // ISO date string
  note: string;
  type: PerformanceNoteType;
}

export interface User {
  id: number;
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  role: 'Admin' | 'Member' | 'Kasir';
  permissions?: ViewType[];
  restrictedCards?: number[]; // IDs of cards that user cannot access
}



export interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  since: string;
  instagram?: string;
  status: ClientStatus;
  clientType: ClientType;
  lastContact: string; // ISO Date String
  portalAccessId: string;
  address?: string;
  avatar?: string | null; // base64 foto profil
}

export interface PhysicalItem {
  name: string;
  price: number;
}

// Optional per-duration pricing for packages
export interface DurationOption {
  label: string; // e.g., '2 Jam', '4 Jam', '8 Jam', 'Full Day'
  price: number;
  default?: boolean; // optional flag for default selection/display
  // Optional: per-option details (overrides package-level when set)
  photographers?: string;
  videographers?: string;
  processingTime?: string;
  digitalItems?: string[];
  physicalItems?: PhysicalItem[];
}

export interface Package {
  id: number;
  name: string;
  price: number;
  category: string;
  // Optional: operational region for this package
  region?: Region;
  physicalItems: PhysicalItem[];
  digitalItems: string[];
  processingTime: string;
  defaultPrintingCost?: number;
  defaultTransportCost?: number;
  photographers?: string;
  videographers?: string;
  coverImage?: string; // base64 image string
  // Optional: flexible duration-based pricing options
  durationOptions?: DurationOption[];
}

// Supported regions for packages and public booking links
export type Region = string; // allow custom region values; REGIONS below are suggestions
export const REGIONS: { value: Region; label: string }[] = [
  { value: 'bandung', label: 'Bandung' },
  { value: 'jabodetabek', label: 'Jabodetabek' },
  { value: 'banten', label: 'Banten' },
];

export interface AddOn {
  id: number;
  name: string;
  price: number;
  region?: Region; // optional region scoping for add-ons
}

export enum TeamMemberCategory {
  TEAM = 'Tim',
  VENDOR = 'Vendor'
}

export interface TeamMember {
  id: number;
  name: string;
  role: string; // Fotografer, Videografer, Editor etc.
  email: string;
  phone: string;
  standardFee: number;
  noRek?: string;
  bankName?: string;
  specialization?: string;
  location?: string;
  emergencyContact?: string;

  rating: number; // 1-5 star rating
  performanceNotes: PerformanceNote[];
  portalAccessId: string;
  category: 'Tim' | 'Vendor';
  avatar?: string | null; // base64 foto profil
}

export interface AssignedTeamMember {
  memberId: number;
  name: string;
  role: string;
  fee: number; // The fee for THIS project
  category?: 'Tim' | 'Vendor';
  subJob?: string;
  avatar?: string | null; // base64 foto profil dari team member
}

export interface PrintingItem {
  id: number;
  type: 'Cetak Album' | 'Cetak Foto' | 'Flashdisk' | 'Custom';
  customName?: string;
  details: string;
  cost: number;
  paid?: boolean;
  // Optional granular payment flag used by UI; preferred over boolean 'paid'
  paymentStatus?: 'Paid' | 'Unpaid';
}

export interface TransportItem {
  id: number;
  description: string; // e.g., 'Transport ke Bandung', 'Parkir', 'Tol'
  cost: number;
  paymentStatus?: 'Paid' | 'Unpaid';
  paymentType?: 'card' | 'pocket'; // Tipe pembayaran: kartu atau kantong
  cardId?: number; // Kartu yang digunakan untuk pembayaran
  pocketId?: number; // Kantong yang digunakan untuk pembayaran
  paidAt?: string; // Tanggal pembayaran
  notes?: string; // Catatan tambahan
}

export enum BookingStatus {
  BARU = 'Baru',
  TERKONFIRMASI = 'Terkonfirmasi',
  DITOLAK = 'Ditolak',
}

export interface StatusHistoryEntry {
  type: 'status' | 'sub-status';
  name: string;
  value: string | boolean;
  timestamp: string;
}

export interface WeddingDayChecklist {
  id: number;
  projectId: number;
  category: string;
  itemName: string;
  isCompleted: boolean;
  assignedTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChecklistTemplate {
  category: string;
  items: string[];
}

export interface Project {
  id: number;
  projectName: string;
  clientName: string;
  clientId: number;
  clientAvatar?: string | null; // base64 foto profil dari client
  projectType: string;
  packageName: string;
  packageId: number;
  addOns: AddOn[];
  date: string;
  deadlineDate?: string;
  location: string;
  progress: number; // 0-100
  status: string;
  activeSubStatuses?: string[];
  totalCost: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  team: AssignedTeamMember[];
  notes?: string;
  accommodation?: string;
  driveLink?: string;
  clientDriveLink?: string;
  finalDriveLink?: string;
  startTime?: string;
  endTime?: string;
  image?: string; // Optional cover image URL
  color?: string; // Custom defined color for the event
  statusHistory?: StatusHistoryEntry[];
  promoCodeId?: number;
  discountAmount?: number;
  dpProofUrl?: string;
  printingDetails?: PrintingItem[];
  printingCost?: number;
  transportCost?: number;
  transportPaid?: boolean;
  transportNote?: string;
  printingCardId?: number;
  transportCardId?: number;
  // New: Detailed transport items tracking
  transportDetails?: TransportItem[];
  transportUsed?: boolean; // Apakah transport digunakan atau tidak
  // Additional operational costs captured per project (JSONB in DB)
  customCosts?: CustomCost[];
  isEditingConfirmedByClient?: boolean;
  isPrintingConfirmedByClient?: boolean;
  isDeliveryConfirmedByClient?: boolean;
  confirmedSubStatuses?: string[];
  clientSubStatusNotes?: Record<string, string>;
  subStatusConfirmationSentAt?: Record<string, string>; // e.g. { 'Seleksi Foto': '2023-10-27T10:00:00Z' }
  completedDigitalItems?: string[];
  invoiceSignature?: string;
  customSubStatuses?: SubStatusConfig[];
  bookingStatus?: BookingStatus;
  rejectionReason?: string;
  chatHistory?: ChatMessage[];
  // Explicit duration selection and per-unit price persisted at project level
  durationSelection?: string; // e.g., '4 Jam' - label from Package.durationOptions
  unitPrice?: number; // unit price used for package at time of booking
  address?: string; // specific venue address
  weddingDayChecklist?: WeddingDayChecklist[];
}

// Custom operational cost item
export interface CustomCost {
  id: number;
  description: string;
  amount: number;
}

export interface Contract {
  id: number;
  contractNumber: string;
  clientId: number;
  projectId: number;
  signingDate: string;
  signingLocation: string;
  serviceTitle?: string; // e.g. "JASA CORPORATE / EVENT"
  clientName1: string;
  clientAddress1: string;
  clientPhone1: string;
  clientName2?: string;
  clientAddress2?: string;
  clientPhone2?: string;
  shootingDuration: string;
  guaranteedPhotos: string;
  albumDetails: string;
  digitalFilesFormat: string;
  otherItems: string;
  personnelCount: string;
  deliveryTimeframe: string;
  dpDate: string;
  finalPaymentDate: string;
  cancellationPolicy: string;
  jurisdiction: string;
  pasal1Content?: string;
  pasal2Content?: string;
  pasal3Content?: string;
  pasal4Content?: string;
  pasal5Content?: string;
  closingText?: string;
  vendorSignature?: string;
  clientSignature?: string;
  includeMeterai?: boolean;
  meteraiPlacement?: 'client' | 'both';
  createdAt: string;
}

export enum TransactionType {
  INCOME = 'Pemasukan',
  EXPENSE = 'Pengeluaran'
}

export interface Transaction {
  id: number;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  projectId?: number;
  category: string;
  method: 'Transfer Bank' | 'Tunai' | 'E-Wallet' | 'Sistem' | 'Kartu';
  pocketId?: number;
  cardId?: number;
  printingItemId?: number;
  vendorSignature?: string;
}

export enum PocketType {
  SAVING = 'Nabung & Bayar',
  LOCKED = 'Terkunci',
  SHARED = 'Bersama',
  EXPENSE = 'Anggaran Pengeluaran'

}

export interface FinancialPocket {
  id: number;
  name: string;
  description: string;
  icon: 'piggy-bank' | 'lock' | 'users' | 'clipboard-list' | 'star';
  type: PocketType;
  amount: number;
  goalAmount?: number; // for SAVING and EXPENSE type
  lockEndDate?: string; // for LOCKED type
  members?: TeamMember[]; // for SHARED type
  sourceCardId?: number; // Links this pocket to a physical card
}

export interface Card {
  id: number;
  cardHolderName: string;
  bankName: string; // e.g., 'WBank', 'VISA'
  cardType: CardType;
  lastFourDigits: string; // e.g., "3090"
  expiryDate?: string; // MM/YY e.g., "09/24"
  balance: number;
  colorGradient: string; // tailwind gradient class e.g. 'from-blue-500 to-sky-400'
}

export interface NotificationSettings {
  newProject: boolean;
  paymentConfirmation: boolean;
  deadlineReminder: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
}

export interface TimelineStep {
  id: string;
  t: string; // title (matching existing usage)
  d: string; // description (matching existing usage)
}

export interface PublicPageConfig {
  template: 'classic' | 'modern' | 'gallery';
  title: string;
  introduction: string;
  galleryImages: string[]; // Array of base64 image strings or Supabase Storage URLs
  timeline?: TimelineStep[]; // Optional customizable timeline steps
}

export interface Profile {
  id: number;
  adminUserId: number;
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  website: string;
  instagram?: string;
  address: string;
  bankAccount: string;
  authorizedSigner: string;
  idNumber?: string;
  bio: string;
  incomeCategories: string[];
  expenseCategories: string[];
  projectTypes: string[];
  eventTypes: string[];
  assetCategories: string[];
  sopCategories: string[];
  packageCategories: string[];
  projectStatusConfig: ProjectStatusConfig[];
  notificationSettings: NotificationSettings;
  securitySettings: SecuritySettings;
  briefingTemplate: string;
  termsAndConditions?: string;
  /** URL Cloudinary atau base64 string (legacy). Kolom DB: logo_base64 */
  logoBase64?: string;
  /** URL Cloudinary atau base64 string (legacy). Kolom DB: signature_base64 */
  signatureBase64?: string;
  brandColor?: string;
  publicPageConfig: PublicPageConfig;
  packageShareTemplate?: string;
  bookingFormTemplate?: string;
  chatTemplates?: ChatTemplate[];
  billingTemplates?: ChatTemplate[];
  invoiceShareTemplate?: string;
  receiptShareTemplate?: string;
  expenseShareTemplate?: string;
  portalShareTemplate?: string;
  contractShareTemplate?: string;
  billingShareTemplate?: string;
  checklistTemplates?: ChecklistTemplate[];
  contractTemplate?: string;
  contractPasal1Defaults?: string;
  contractPasal2Defaults?: string;
  contractPasal3Defaults?: string;
  contractPasal4Defaults?: string;
  contractPasal5Defaults?: string;
  contractClosingDefaults?: string;
  signature?: string;
  role?: 'Admin' | 'Member' | 'Kasir';
  permissions?: ViewType[];
  customRegions?: string[];
  avatar?: string | null; // base64 foto profil admin
}

export interface TeamProjectPayment {
  id: number;
  projectId: number;
  teamMemberName: string;
  teamMemberId: number;
  date: string;
  status: PaymentStatus;
  fee: number;
  amountPaid?: number;
}

export interface TeamPaymentRecord {
  id: number;
  recordNumber: string;
  teamMemberId: number;
  teamMemberName: string;
  teamMemberRole: string;
  date: string; // Changed from paymentDate to match service
  totalAmount: number;
  projectPaymentIds: number[]; // Added to match service
  items: {
    projectId: number;
    projectName: string;
    amount: number;
    projectDate: string;
  }[];
  vendorSignature?: string;
  recipientSignature?: string;
  sourceType?: 'card' | 'pocket';
  sourceId?: number;
  sourceName?: string;
  notes?: string;
}


export interface ClientFeedback {
  id: number;
  clientName: string;
  satisfaction: SatisfactionLevel;
  rating: number; // 1-5
  feedback: string;
  date: string; // ISO date string
}


export interface VendorData {
  clients: Client[];
  projects: Project[];
  teamMembers: TeamMember[];
  transactions: Transaction[];
  teamProjectPayments: TeamProjectPayment[];
  teamPaymentRecords: TeamPaymentRecord[];
  pockets: FinancialPocket[];
  profile: Profile;

  cards: Card[];
  clientFeedback: ClientFeedback[];
  notifications: Notification[];
  promoCodes: PromoCode[];
  packages: Package[];
  addOns: AddOn[];
}

// --- Component Prop Interfaces ---

export interface PublicBookingFormProps {
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  setPockets: React.Dispatch<React.SetStateAction<FinancialPocket[]>>;
  setPromoCodes: React.Dispatch<React.SetStateAction<PromoCode[]>>;
  showNotification: (message: string) => void;
  userProfile: Profile;
  packages: Package[];
  addOns: AddOn[];
  cards: Card[];
  pockets: FinancialPocket[];
  promoCodes: PromoCode[];
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
}


export interface ClientPortalProps {
  accessId: string;
  clients: Client[];
  projects: Project[];
  transactions: Transaction[];
  setClientFeedback: React.Dispatch<React.SetStateAction<ClientFeedback[]>>;
  showNotification: (message: string) => void;
  userProfile: Profile;
  packages: Package[];
  onClientSubStatusConfirmation: (projectId: string, subStatusName: string, note: string) => void;
  teamMembers: TeamMember[];
}

export interface FreelancerPortalProps {
  accessId: string;
  teamMembers: TeamMember[];
  projects: Project[];
  teamProjectPayments: TeamProjectPayment[];
  teamPaymentRecords: TeamPaymentRecord[];

  showNotification: (message: string) => void;

  userProfile: Profile;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
}
