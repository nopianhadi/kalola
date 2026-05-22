import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ViewType, NavigationAction } from '@/types';
import { ClientsPage as ClientsPageFeature } from '@/features/clients/components/ClientsPage';

import { useApp } from "@/app/AppContext";
import { useUIStore } from '@/store/uiStore';

interface ClientsProps {
    showNotification?: (message: string) => void;
    initialAction?: any;
    setInitialAction?: (val: any) => void;
    handleNavigation?: (view: ViewType, action?: NavigationAction) => void;
    addNotification?: (notif: any) => void;
}



const ClientsPage: React.FC<ClientsProps> = (props) => {
    const navigate = useNavigate();
    const {
        showNotification: contextShowNotification,
        initialAction: contextInitialAction,
        setInitialAction: contextSetInitialAction,
    } = useApp();
    const { setActiveView } = useUIStore();

    const mergedProps = {
        ...props,
        showNotification: props.showNotification || contextShowNotification,
        initialAction: props.initialAction || contextInitialAction,
        setInitialAction: props.setInitialAction || contextSetInitialAction,
        handleNavigation: props.handleNavigation || ((view: ViewType, action?: NavigationAction) => {
            setActiveView(view);
            if (action) {
                contextSetInitialAction(action);
            }
            const pathMap: Partial<Record<ViewType, string>> = {
                [ViewType.HOMEPAGE]: "/",
                [ViewType.DASHBOARD]: "/dashboard",
                [ViewType.CLIENTS]: "/clients",
                [ViewType.PROJECTS]: "/projects",
                [ViewType.TEAM]: "/team",
                [ViewType.FINANCE]: "/finance",
                [ViewType.PACKAGES]: "/packages",
                [ViewType.BOOKING]: "/booking",
                [ViewType.CALENDAR]: "/calendar",
                [ViewType.SETTINGS]: "/settings",
                [ViewType.CONTRACTS]: "/kontrak",
            };
            const newPath = pathMap[view] || `/${view.toLowerCase().replace(/ /g, "-")}`;
            navigate(newPath);
        }),
        addNotification: props.addNotification || (() => {}), // Fallback
    };

    return <ClientsPageFeature {...mergedProps as any} />;
};


export default ClientsPage;
