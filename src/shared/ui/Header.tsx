import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';

interface NavItem {
  label: string;
  href?: string;
  to?: string;
  icon?: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}

interface HeaderProps {
  logo?: React.ReactNode;
  logoText?: string;
  navItems?: NavItem[];
  rightContent?: React.ReactNode;
  user?: {
    name: string;
    avatar?: string;
    role?: string;
  };
  onLogout?: () => void;
  sticky?: boolean;
  transparent?: boolean;
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({
  logo,
  logoText = 'Weddfin',
  navItems = [],
  rightContent,
  user,
  onLogout,
  sticky = true,
  transparent = false,
  className = '',
}) => {
  return (
    <header
      className={`
        ${sticky ? 'sticky top-0 z-50' : ''}
        ${transparent ? 'bg-transparent' : 'bg-brand-surface/80 backdrop-blur-md'}
        border-b border-brand-border/50
        ${className}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {logo || (
              <img 
                src="/assets/images/logos/logoIcon.svg" 
                alt={logoText} 
                className="w-8 h-8" 
              />
            )}
            <span className="text-xl font-black text-brand-text-light tracking-tight">
              {logoText}
            </span>
          </div>

          {/* Navigation */}
          {navItems.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item, index) => {
                const baseClasses = `
                  px-4 py-2 rounded-xl text-sm font-semibold
                  transition-all duration-200
                  ${item.active 
                    ? 'bg-brand-accent text-white' 
                    : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-bg'
                  }
                `;

                if (item.to) {
                  return (
                    <Link
                      key={index}
                      to={item.to}
                      className={baseClasses}
                      onClick={item.onClick}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </span>
                    </Link>
                  );
                }

                if (item.href) {
                  return (
                    <a
                      key={index}
                      href={item.href}
                      className={baseClasses}
                      onClick={item.onClick}
                    >
                      <span className="flex items-center gap-2">
                        {item.icon}
                        {item.label}
                      </span>
                    </a>
                  );
                }

                return (
                  <button
                    key={index}
                    className={baseClasses}
                    onClick={item.onClick}
                  >
                    <span className="flex items-center gap-2">
                      {item.icon}
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right Content */}
          <div className="flex items-center gap-3">
            {rightContent}
            
            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-brand-border">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-brand-text-primary">
                    {user.name}
                  </p>
                  {user.role && (
                    <p className="text-xs text-brand-text-secondary">
                      {user.role}
                    </p>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent font-bold">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                {onLogout && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onLogout}
                  >
                    Logout
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Page Header Component
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumbs?: { label: string; to?: string; href?: string }[];
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumbs,
  className = '',
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-brand-text-secondary mb-3">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.to ? (
                <Link 
                  to={crumb.to} 
                  className="hover:text-brand-accent transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : crumb.href ? (
                <a 
                  href={crumb.href} 
                  className="hover:text-brand-accent transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-brand-text-primary font-medium">
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}
      
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text-primary">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-brand-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default Header;
