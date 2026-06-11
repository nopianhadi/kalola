import React from 'react';

// Table Container
interface TableContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  maxHeight?: string;
}

export const TableContainer: React.FC<TableContainerProps> = ({
  children,
  className = '',
  maxHeight,
  ...props
}) => {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-brand-border/50 ${className}`}
      {...props}
    >
      <div className={`overflow-x-auto ${maxHeight ? `overflow-y-auto max-h-[${maxHeight}]` : ''}`}>
        {children}
      </div>
    </div>
  );
};

// Table
interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  compact?: boolean;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  striped = false,
  hover = true,
  compact = false,
  ...props
}) => {
  return (
    <table
      className={`w-full border-collapse text-left text-sm ${className}`}
      {...props}
    >
      {children}
    </table>
  );
};

// Table Header
interface TableHeadProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead className={`bg-brand-bg border-b border-brand-border ${className}`} {...props}>
      {children}
    </thead>
  );
};

// Table Body
interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {
  children: React.ReactNode;
  className?: string;
}

export const TableBody: React.FC<TableBodyProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-brand-border/50 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

// Table Row
interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  striped?: boolean;
  selected?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  className = '',
  hover = true,
  striped = false,
  selected = false,
  ...props
}) => {
  return (
    <tr
      className={`
        ${hover ? 'hover:bg-brand-accent/[0.03] hover:shadow-[inset_3px_0_0_0_var(--color-accent)] transition-all duration-300' : ''}
        ${striped ? 'even:bg-brand-bg/[0.25]' : ''}
        ${selected ? 'bg-brand-accent/[0.06] shadow-[inset_3px_0_0_0_var(--color-accent)]' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </tr>
  );
};

// Table Header Cell
interface TableHeaderCellProps extends React.ThHTMLAttributes<HTMLTableHeaderCellElement> {
  children?: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: () => void;
}

export const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  children,
  className = '',
  sortable = false,
  sortDirection = null,
  onSort,
  ...props
}) => {
  const baseClasses = `
    px-4 py-3 
    text-xs font-semibold uppercase tracking-wider
    text-brand-text-secondary
    ${sortable ? 'cursor-pointer hover:text-brand-accent select-none' : ''}
    ${className}
  `;

  const content = (
    <>
      {children}
      {sortable && (
        <span className="ml-1 inline-flex flex-col">
          <svg
            className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-brand-accent' : 'text-brand-text-secondary/30'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <svg
            className={`w-3 h-3 -mt-1 ${sortDirection === 'desc' ? 'text-brand-accent' : 'text-brand-text-secondary/30'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </span>
      )}
    </>
  );

  if (sortable) {
    return (
      <th className={baseClasses} onClick={onSort} {...props}>
        <div className="flex items-center">
          {content}
        </div>
      </th>
    );
  }

  return (
    <th className={baseClasses} {...props}>
      {content}
    </th>
  );
};

// Table Cell
interface TableCellProps extends React.TdHTMLAttributes<HTMLTableDataCellElement> {
  children?: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  className = '',
  align = 'left',
  ...props
}) => {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  return (
    <td
      className={`
        px-4 py-3 
        text-sm text-brand-text-primary
        ${alignClasses[align]}
        ${className}
      `}
      {...props}
    >
      {children}
    </td>
  );
};

// Table Empty State
interface TableEmptyProps {
  colSpan: number;
  message?: string;
  icon?: React.ReactNode;
}

export const TableEmpty: React.FC<TableEmptyProps> = ({
  colSpan,
  message = 'Tidak ada data',
  icon,
}) => {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center">
        <div className="flex flex-col items-center text-brand-text-secondary">
          {icon && <div className="mb-3">{icon}</div>}
          <p className="text-sm">{message}</p>
        </div>
      </td>
    </tr>
  );
};

// Table Skeleton Loading
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <div className="h-4 bg-brand-border/50 rounded w-full" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Convenience export of all table components
export const TableComponents = {
  Container: TableContainer,
  Table,
  Head: TableHead,
  Body: TableBody,
  Row: TableRow,
  HeaderCell: TableHeaderCell,
  Cell: TableCell,
  Empty: TableEmpty,
  Skeleton: TableSkeleton,
};

export default TableComponents;
