import React from 'react';

type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'success' 
  | 'warning' 
  | 'danger' 
  | 'info'
  | 'outline';

type BadgeSize = 'xs' | 'sm' | 'md' | 'lg';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  pulse?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-slate-600 text-white border-slate-600',
  primary: 'bg-brand-accent text-white border-brand-accent',
  success: 'bg-green-600 text-white border-green-600',
  warning: 'bg-amber-500 text-white border-amber-500',
  danger: 'bg-red-600 text-white border-red-600',
  info: 'bg-blue-600 text-white border-blue-600',
  outline: 'bg-slate-100 text-slate-700 border-slate-300',
};

const sizeStyles: Record<BadgeSize, string> = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  dot = false,
  pulse = false,
  icon,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        font-semibold
        rounded-full
        border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {dot && (
        <span 
          className={`
            w-1.5 h-1.5 rounded-full
            ${variant === 'primary' ? 'bg-brand-accent' : 
              variant === 'success' ? 'bg-green-500' :
              variant === 'warning' ? 'bg-amber-500' :
              variant === 'danger' ? 'bg-red-500' :
              variant === 'info' ? 'bg-blue-500' :
              'bg-brand-text-secondary'}
            ${pulse ? 'animate-pulse' : ''}
          `}
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
};

// Status Badge dengan ikon bawaan
interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'cancelled' | 'warning';
}

const statusConfig = {
  active: { variant: 'success' as const, label: 'Aktif', dot: true },
  inactive: { variant: 'default' as const, label: 'Nonaktif', dot: true },
  pending: { variant: 'warning' as const, label: 'Menunggu', dot: true },
  completed: { variant: 'success' as const, label: 'Selesai', dot: false },
  cancelled: { variant: 'danger' as const, label: 'Dibatalkan', dot: false },
  warning: { variant: 'warning' as const, label: 'Perhatian', dot: true },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  children,
  ...props
}) => {
  const config = statusConfig[status];
  return (
    <Badge 
      variant={config.variant} 
      dot={config.dot}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};

// Count Badge (untuk notifikasi, keranjang, dll)
interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  max?: number;
  variant?: 'primary' | 'danger' | 'default';
  size?: 'sm' | 'md';
  className?: string;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  variant = 'danger',
  size = 'sm',
  className = '',
  ...props
}) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count;
  
  const variantStyles = {
    primary: 'bg-brand-accent text-white',
    danger: 'bg-red-500 text-white',
    default: 'bg-brand-text-secondary text-white',
  };

  const sizeStyles = {
    sm: 'min-w-[18px] h-[18px] text-[10px]',
    md: 'min-w-[22px] h-[22px] text-xs',
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-bold
        rounded-full
        px-1
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      {...props}
    >
      {displayCount}
    </span>
  );
};

export default Badge;
