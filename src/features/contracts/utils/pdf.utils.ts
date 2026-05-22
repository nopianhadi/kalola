import { Contract, Profile, Project } from '@/types';
import React from 'react';
import ContractDocument from '@/features/contracts/components/ContractDocument';

export const handleDownloadPDF = async (selectedContract: Contract | null) => {
    if (!selectedContract) return;
    const element = document.getElementById('contract-content-to-print');
    if (!element) return;

    const opt = {
        margin: [15, 15, 20, 15] as [number, number, number, number],
        filename: `kontrak-${selectedContract.contractNumber || 'digital'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        pagebreak: { mode: ['css', 'legacy'] },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            windowWidth: 800,
        },
        jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
        const html2pdf = (await import('html2pdf.js')).default;
        html2pdf().set(opt).from(element).save();
    } catch (err) {
        console.error('Failed to generate PDF:', err);
        window.print();
    }
};

export const handleDownloadPDFWithoutTTD = async (
    selectedContract: Contract | null, 
    projects: Project[], 
    profile: Profile
) => {
    if (!selectedContract) return;
    const project = projects.find(p => String(p.id) === String(selectedContract.projectId));
    if (!project) return;

    const tempWrapper = document.createElement('div');
    tempWrapper.style.position = 'fixed';
    tempWrapper.style.left = '-99999px';
    tempWrapper.style.top = '0';
    tempWrapper.style.width = '800px';
    tempWrapper.style.background = 'white';

    document.body.appendChild(tempWrapper);

    try {
        const ReactDOM = await import('react-dom/client');
        const root = ReactDOM.createRoot(tempWrapper);
        root.render(
            React.createElement(ContractDocument, {
                id: "contract-content-to-print-no-ttd",
                contract: selectedContract,
                project: project,
                profile: profile,
                hideSignatures: true
            })
        );

        await new Promise((r) => setTimeout(r, 100));

        const element = tempWrapper.querySelector('#contract-content-to-print-no-ttd') as HTMLElement | null;
        if (!element) return;

        const opt = {
            margin: [15, 15, 20, 15] as [number, number, number, number],
            filename: `kontrak-${selectedContract.contractNumber || 'digital'}-tanpa-ttd.pdf`,
            image: { type: 'jpeg' as const, quality: 0.98 },
            pagebreak: { mode: ['css', 'legacy'] },
            html2canvas: {
                scale: 2,
                useCORS: true,
                letterRendering: true,
                windowWidth: 800,
            },
            jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
        };

        const html2pdf = (await import('html2pdf.js')).default;
        await html2pdf().set(opt).from(element).save();

        try { root.unmount(); } catch {}
    } catch (err) {
        console.error('Failed to generate PDF without TTD:', err);
        window.print();
    } finally {
        try { document.body.removeChild(tempWrapper); } catch {}
    }
};
