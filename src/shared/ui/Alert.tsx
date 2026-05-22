import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error' | 'default';
type AlertSize = 'sm' | 'md' | 'lg';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
  variant?: AlertVariant;
  size?: AlertSize;
  icon?: React.ReactNode;
  onClose?: () => void;
  action?: React.ReactNode;
  dismissible?: boolean;
  className?: string;
}

const variantStyles: Record<AlertVariant, { bg: string; border: string; text: string; icon: string }> = {
  default: {
    bg: 'bg-brand-bg',
    border: 'border-brand-border',
    text: 'text-brand-text-primary',
    icon: 'text-brand-text-secondary',
  },
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    icon: 'text-blue-500',
  },
  success: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: 'text-green-500',
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: 'text-amber-500',
  },
  error: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: 'text-red-500',
  },
};

const sizeStyles: Record<AlertSize, string> = {
  sm: 'p-3 text-sm',
  md: 'p-4 text-sm',
  lg: 'p-5 text-base',
};

// Default icons untuk setiap variant
const defaultIcons: Record<AlertVariant, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export const Alert: React.FC<AlertProps> = ({
  title,
  children,
  variant = 'default',
  size = 'md',
  icon,
  onClose,
  action,
  dismissible = false,
  className = '',
  ...props
}) => {
  const styles = variantStyles[variant];
  const iconToShow = icon || defaultIcons[variant];

  return (
    <div
      className={`
        relative
        rounded-xl
        border
        ${styles.bg}
        ${styles.border}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 ${styles.icon}`}>
          {iconToShow}
        </div>
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className={`font-semibold mb-1 ${styles.text}`}>
              {title}
            </h3>
          )}
          <div className={`${styles.text} ${title ? 'text-opacity-90' : ''}`}>
            {children}
          </div>
          {action && (
            <div className="mt-3">
              {action}
            </div>
          )}
        </div>
        {(dismissible || onClose) && (
          <button
            onClick={onClose}
            className={`
              flex-shrink-0
              -mr-1 -mt-1
              p-1
              rounded-lg
              ${styles.text}
              hover:bg-black/5
              transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent/20
            `}
            aria-label="Tutup"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Alert Banner (full width, lebih prominent)
interface AlertBannerProps extends Omit<AlertProps, 'size'> {
  size?: 'sm' | 'md';
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  size = 'md',
  className = '',
  ...props
}) => {
  return (
    <Alert
      size={size === 'sm' ? 'sm' : 'md'}
      className={`
        rounded-none
        border-x-0 border-t-0
        ${className}
      `}
      {...props}
    />
  );
};

// Alert Stack (untuk multiple alerts)
interface AlertStackProps {
  children: React.ReactNode;
  className?: string;
}

export const AlertStack: React.FC<AlertStackProps> = ({
  children,
  className = '',
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {children}
    </div>
  );
};

// Inline Alert (untuk form validation, dll)
interface InlineAlertProps {
  children: React.ReactNode;
  variant?: 'error' | 'warning' | 'success' | 'info';
  className?: string;
}

export const InlineAlert: React.FC<InlineAlertProps> = ({
  children,
  variant = 'error',
  className = '',
}) => {
  const variantStyles = {
    error: 'text-red-600',
    warning: 'text-amber-600',
    success: 'text-green-600',
    info: 'text-blue-600',
  };

  return (
    <span className={`text-sm ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Alert;
