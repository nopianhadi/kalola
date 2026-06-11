import React, { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

type InputSize = 'xs' | 'sm' | 'md' | 'lg';
type InputVariant = 'default' | 'filled' | 'outlined' | 'ghost';

// Text Input Props
interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'className'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
  containerClassName?: string;
}

const sizeStyles: Record<InputSize, string> = {
  xs: 'px-2.5 py-1.5 text-xs h-8',
  sm: 'px-3 py-2 text-sm h-9',
  md: 'px-4 py-2.5 text-sm h-11',
  lg: 'px-4 py-3 text-base h-12',
};

const variantStyles: Record<InputVariant, string> = {
  default: `
    bg-white/60 backdrop-blur-sm border border-brand-border/80
    focus:bg-white focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15
    hover:border-brand-accent/40 hover:bg-white/80
    shadow-[inset_0_1px_2px_rgba(0,0,0,0.01),0_1px_3px_rgba(0,0,0,0.02)]
  `,
  filled: `
    bg-brand-bg/50 border border-brand-border/20
    focus:bg-white focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15
    hover:bg-white/60 hover:border-brand-accent/30
  `,
  outlined: `
    bg-transparent border-2 border-brand-border/80
    focus:border-brand-accent focus:ring-4 focus:ring-brand-accent/15
    hover:border-brand-accent/60
  `,
  ghost: `
    bg-transparent border-0 border-b-2 border-brand-border/80 rounded-none px-0
    focus:border-brand-accent focus:ring-0
    hover:border-brand-accent/60
  `,
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    helperText,
    error,
    size = 'md',
    variant = 'default',
    leftIcon,
    rightIcon,
    fullWidth = true,
    className = '',
    containerClassName = '',
    disabled,
    ...props
  }, ref) => {
    const hasError = !!error;
    
    const inputClasses = `
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed bg-brand-bg' : ''}
      ${leftIcon ? 'pl-10' : ''}
      ${rightIcon ? 'pr-10' : ''}
      ${variant !== 'ghost' ? 'rounded-xl' : ''}
      w-full
      text-brand-text-primary
      placeholder:text-brand-text-secondary/50
      transition-all duration-200
      focus:outline-none
      ${className}
    `.trim();

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-semibold text-brand-text-primary mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none flex items-center justify-center w-5 h-5 [&>svg]:w-full [&>svg]:h-full">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={inputClasses}
            disabled={disabled}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-secondary pointer-events-none flex items-center justify-center w-5 h-5 [&>svg]:w-full [&>svg]:h-full">
              {rightIcon}
            </div>
          )}
        </div>
        {(helperText || error) && (
          <p className={`mt-1.5 text-sm ${hasError ? 'text-red-500' : 'text-brand-text-secondary'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea Component
interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'className'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  fullWidth?: boolean;
  className?: string;
  containerClassName?: string;
  rows?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({
    label,
    helperText,
    error,
    size = 'md',
    variant = 'default',
    fullWidth = true,
    className = '',
    containerClassName = '',
    disabled,
    rows = 4,
    ...props
  }, ref) => {
    const hasError = !!error;
    
    const textareaClasses = `
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed bg-brand-bg' : ''}
      ${variant !== 'ghost' ? 'rounded-xl' : ''}
      w-full
      text-brand-text-primary
      placeholder:text-brand-text-secondary/50
      transition-all duration-200
      focus:outline-none
      resize-y
      min-h-[100px]
      ${className}
    `.trim();

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-semibold text-brand-text-primary mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          rows={rows}
          className={textareaClasses}
          disabled={disabled}
          {...props}
        />
        {(helperText || error) && (
          <p className={`mt-1.5 text-sm ${hasError ? 'text-red-500' : 'text-brand-text-secondary'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select Component
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'className' | 'children'> {
  label?: string;
  helperText?: string;
  error?: string;
  size?: InputSize;
  variant?: InputVariant;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  className?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({
    label,
    helperText,
    error,
    size = 'md',
    variant = 'default',
    options,
    placeholder,
    fullWidth = true,
    className = '',
    containerClassName = '',
    disabled,
    ...props
  }, ref) => {
    const hasError = !!error;
    
    const selectClasses = `
      ${sizeStyles[size]}
      ${variantStyles[variant]}
      ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
      ${disabled ? 'opacity-50 cursor-not-allowed bg-brand-bg' : ''}
      ${variant !== 'ghost' ? 'rounded-xl' : ''}
      w-full
      text-brand-text-primary
      transition-all duration-200
      focus:outline-none
      appearance-none
      bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")]
      bg-[position:right_0.5rem_center]
      bg-[length:1.5em_1.5em]
      bg-no-repeat
      pr-10
      ${className}
    `.trim();

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${containerClassName}`}>
        {label && (
          <label className="block text-sm font-semibold text-brand-text-primary mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={selectClasses}
          disabled={disabled}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        {(helperText || error) && (
          <p className={`mt-1.5 text-sm ${hasError ? 'text-red-500' : 'text-brand-text-secondary'}`}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Input;
