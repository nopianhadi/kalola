import React from "react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
    title: string;
    description?: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title, description }) => (
    <div className="flex flex-col items-center justify-center h-full text-center p-4 sm:p-6 md:p-8 animate-fade-in">
        <div className="w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center mb-4 sm:mb-6 bg-brand-accent/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent">
                <path d="M12 2.75a9.25 9.25 0 109.25 9.25H12v-9.25z" />
                <path d="M12.75 2.75a9.25 9.25 0 11-10 10" />
            </svg>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-brand-text-light mb-2">{title}</h2>
        {description && (
            <p className="text-brand-text-secondary mb-6 max-w-md">{description}</p>
        )}
        <Link
            to="/dashboard"
            className="px-5 py-2.5 bg-brand-accent text-white rounded-xl font-semibold text-sm hover:bg-brand-accent/90 transition-colors shadow-lg shadow-brand-accent/20"
        >
            Kembali ke Dashboard
        </Link>
    </div>
);

export default PlaceholderPage;
