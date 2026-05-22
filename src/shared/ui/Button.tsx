import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Link, LinkProps } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsButton = ButtonBaseProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  as?: 'button';
  to?: never;
  href?: never;
};

type ButtonAsLink = ButtonBaseProps & Omit<LinkProps, 'className'> & {
  as: 'link';
  to: string;
  href?: never;
};

type ButtonAsAnchor = ButtonBaseProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
  as: 'a';
  href: string;
  to?: never;
};

type ButtonProps = ButtonAsButton | ButtonAsLink | ButtonAsAnchor;

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-brand-accent text-white 
    hover:bg-brand-accent/90 
    active:bg-brand-accent/80 
    focus:ring-2 focus:ring-brand-accent/30 
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-brand-surface text-brand-text-primary 
    border border-brand-border 
    hover:bg-brand-bg hover:border-brand-accent/30 
    active:bg-brand-bg/80 
    focus:ring-2 focus:ring-brand-accent/20 
    shadow-sm
  `,
  ghost: `
    bg-transparent text-brand-text-secondary 
    hover:bg-brand-surface hover:text-brand-text-primary 
    active:bg-brand-border/50 
    focus:ring-2 focus:ring-brand-accent/20
  `,
  danger: `
    bg-red-600 text-white 
    hover:bg-red-700 
    active:bg-red-800 
    focus:ring-2 focus:ring-red-500/30 
    shadow-sm hover:shadow-md
  `,
  success: `
    bg-green-600 text-white 
    hover:bg-green-700 
    active:bg-green-800 
    focus:ring-2 focus:ring-green-500/30 
    shadow-sm hover:shadow-md
  `,
  warning: `
    bg-amber-500 text-white 
    hover:bg-amber-600 
    active:bg-amber-700 
    focus:ring-2 focus:ring-amber-500/30 
    shadow-sm hover:shadow-md
  `,
  outline: `
    bg-transparent text-brand-accent 
    border border-brand-accent 
    hover:bg-brand-accent/5 
    active:bg-brand-accent/10 
    focus:ring-2 focus:ring-brand-accent/20
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs gap-1 min-h-[28px]',
  sm: 'px-3 py-2 text-sm gap-1.5 min-h-[36px]',
  md: 'px-4 py-2.5 text-sm gap-2 min-h-[44px]',
  lg: 'px-5 py-3 text-base gap-2 min-h-[48px]',
  xl: 'px-6 py-4 text-lg gap-3 min-h-[56px]',
};

const baseStyles = `
  inline-flex items-center justify-center
  font-semibold
  rounded-xl
  transition-all duration-200 ease-out
  focus:outline-none
  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
  active:scale-[0.98]
  select-none
  whitespace-nowrap
`;

const LoadingSpinner = ({ size }: { size: ButtonSize }) => {
  const spinnerSize = size === 'xs' || size === 'sm' ? 'w-3 h-3' : size === 'lg' || size === 'xl' ? 'w-5 h-5' : 'w-4 h-4';
  return (
    <svg className={`animate-spin ${spinnerSize}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (props, ref) => {
    const {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className = '',
      children,
      as = 'button',
      ...rest
    } = props;

    const classes = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`;

    const content = (
      <>
        {isLoading && <LoadingSpinner size={size} />}
        {!isLoading && leftIcon}
        <span>{children}</span>
        {!isLoading && rightIcon}
      </>
    );

    if (as === 'link') {
      const { to, ...linkRest } = rest as ButtonAsLink;
      return (
        <Link to={to} className={classes} {...linkRest} ref={ref as React.Ref<HTMLAnchorElement>}>
          {content}
        </Link>
      );
    }

    if (as === 'a') {
      const { href, ...anchorRest } = rest as ButtonAsAnchor;
      return (
        <a href={href} className={classes} {...anchorRest} ref={ref as React.Ref<HTMLAnchorElement>}>
          {content}
        </a>
      );
    }

    return (
      <button
        className={classes}
        disabled={isLoading || (rest as ButtonAsButton).disabled}
        {...(rest as ButtonAsButton)}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
