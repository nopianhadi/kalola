import { Client, Project, Transaction, PaymentStatus, Profile, Package, Card, PromoCode, NavigationAction, ViewType, AssignedTeamMember } from '@/types';

export interface BillingChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    client: ExtendedClient | null;
    projects: Project[];
    userProfile: Profile;
    showNotification: (message: string) => void;
}

export interface ClientFormProps {
    isOpen: boolean;
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    onClose: () => void;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onSubmit: (e: React.FormEvent) => void;
    packages: Package[];
    addOns: any[];
    cards: Card[];
    promoCodes: PromoCode[];
    mode: 'add' | 'edit';
    userProfile: Profile;
    inline?: boolean;
    assignedTeam?: AssignedTeamMember[];
}

export interface ClientDetailModalProps {
    isOpen: boolean;
    client: ExtendedClient | null;
    projects: Project[];
    transactions: Transaction[];
    packages: Package[];
    onClose: () => void;
    onEditClient: (client: Client) => void;
    onDeleteClient: (clientId: string) => void;
    onViewReceipt: (transaction: Transaction) => void;
    onViewInvoice: (project: Project) => void;
    handleNavigation: (view: ViewType, action?: NavigationAction) => void;
    onRecordPayment: (projectId: string, amount: number, destinationCardId: string) => void;
    cards: Card[];
    onSharePortal: (client: Client) => void;
    onDeleteProject: (projectId: string) => void;
    showNotification: (message: string) => void;
    setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
    setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
    setCards: React.Dispatch<React.SetStateAction<Card[]>>;
    userProfile: Profile;
}

export interface ClientStats {
    activeClients: number;
    mostFrequentLocation: string;
    totalReceivables: string;
    totalClients: number;
}

export interface ExtendedClient extends Client {
    projects: Project[];
    totalProjectValue: number;
    balanceDue: number;
    PackageTerbaru: string;
    overallPaymentStatus: PaymentStatus | null;
    mostRecentProject: Project | null;
}
