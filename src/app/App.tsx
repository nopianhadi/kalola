import React from "react";
import { AppProviders } from "@/app/AppProviders";
import { AppRoutes } from "@/app/AppRoutes";

const App: React.FC = () => {
    return (
        <AppProviders>
            <AppRoutes />
        </AppProviders>
    );
};

export default App;
