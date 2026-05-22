import React, { forwardRef } from 'react';

type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost' | 'primary';
type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
type CardRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  radius?: CardRadius;
  hover?: boolean;
  interactive?: boolean;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-brand-surface border border-brand-border/50',
  elevated: 'bg-brand-surface border border-brand-border/30 shadow-lg shadow-brand-border/10',
  outlined: 'bg-transparent border-2 border-brand-border',
  ghost: 'bg-transparent border border-transparent hover:border-brand-border/30',
  primary: 'bg-brand-accent/5 border border-brand-accent/20',
};

const paddingStyles: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4 sm:p-5',
  lg: 'p-5 sm:p-6',
  xl: 'p-6 sm:p-8',
};

const radiusStyles: Record<CardRadius, string> = {
  none: 'rounded-none',
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  '2xl': 'rounded-[2rem]',
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({
    variant = 'default',
    padding = 'md',
    radius = 'xl',
    hover = false,
    interactive = false,
    fullWidth = false,
    className = '',
    children,
    ...props
  }, ref) => {
    const classes = `
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${radiusStyles[radius]}
      ${hover ? 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300' : ''}
      ${interactive ? 'cursor-pointer hover:border-brand-accent/30 active:scale-[0.99] transition-all duration-200' : ''}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `.trim();

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  heading,
  subtitle,
  action,
  icon,
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`flex items-start justify-between gap-4 ${className}`} {...props}>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {heading && (
            <h3 className="text-lg font-bold text-brand-text-primary truncate">
              {heading}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-brand-text-secondary mt-0.5">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

// Card Content Component
interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const CardContent: React.FC<CardContentProps> = ({
  className = '',
  children,
  ...props
}) => {
  return (
    <div className={`text-brand-text-secondary ${className}`} {...props}>
      {children}
    </div>
  );
};

// Card Footer Component
interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  align?: 'start' | 'center' | 'end' | 'between';
}

export const CardFooter: React.FC<CardFooterProps> = ({
  className = '',
  align = 'between',
  children,
  ...props
}) => {
  const alignStyles = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  };

  return (
    <div className={`flex items-center gap-3 pt-4 border-t border-brand-border/30 ${alignStyles[align]} ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;
