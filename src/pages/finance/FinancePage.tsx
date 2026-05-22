import React from 'react';
import { FinancePage } from '@/features/finance/FinancePage';
import { FinanceProps } from '@/features/finance/types/finance.types';

/**
 * Finance Page Entry Point
 * 
 * This file has been refactored into a modular feature-based architecture.
 * The core logic and components are now located in src/features/finance/.
 */
const Finance: React.FC<FinanceProps> = (props) => {
    return <FinancePage {...props} />;
};

export default Finance;
