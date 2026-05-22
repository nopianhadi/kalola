import React from 'react';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
type AvatarVariant = 'circle' | 'rounded' | 'square';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  variant?: AvatarVariant;
  status?: 'online' | 'offline' | 'away' | 'busy';
  className?: string;
}

const sizeStyles: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-20 h-20 text-xl',
};

const variantStyles: Record<AvatarVariant, string> = {
  circle: 'rounded-full',
  rounded: 'rounded-xl',
  square: 'rounded-none',
};

const statusStyles = {
  online: 'bg-green-500',
  offline: 'bg-gray-400',
  away: 'bg-amber-500',
  busy: 'bg-red-500',
};

const statusSizeStyles: Record<AvatarSize, string> = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
  '2xl': 'w-5 h-5',
};

// Generate background color berdasarkan nama (konsisten)
const getColorFromName = (name: string): string => {
  const colors = [
    'bg-red-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-yellow-500',
    'bg-lime-500',
    'bg-green-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-sky-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-fuchsia-500',
    'bg-pink-500',
    'bg-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Get initials dari nama
const getInitials = (name: string): string => {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  name = '',
  size = 'md',
  variant = 'circle',
  status,
  className = '',
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  const showImage = src && !imageError;
  const initials = getInitials(name);
  const bgColor = getColorFromName(name || 'Anonymous');

  return (
    <div className="relative inline-block" {...props}>
      <div
        className={`
          ${sizeStyles[size]}
          ${variantStyles[variant]}
          ${showImage ? '' : `${bgColor} text-white font-semibold`}
          flex items-center justify-center
          overflow-hidden
          ${className}
        `}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
      
      {status && (
        <span
          className={`
            absolute
            ${statusSizeStyles[size]}
            ${statusStyles[status]}
            rounded-full
            border-2
            border-white
            ${size === 'xs' || size === 'sm' ? '-bottom-0.5 -right-0.5' : '-bottom-0.5 -right-0.5'}
          `}
        />
      )}
    </div>
  );
};

// Avatar Group (stacked avatars)
interface AvatarGroupProps {
  avatars: { src?: string; name: string; alt?: string }[];
  max?: number;
  size?: AvatarSize;
  variant?: AvatarVariant;
  className?: string;
  stacked?: boolean;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  avatars,
  max = 4,
  size = 'md',
  variant = 'circle',
  className = '',
  stacked = true,
}) => {
  const visibleAvatars = avatars.slice(0, max);
  const remainingCount = avatars.length - max;

  const sizeOverlap = {
    xs: stacked ? '-ml-1' : 'ml-1',
    sm: stacked ? '-ml-2' : 'ml-2',
    md: stacked ? '-ml-3' : 'ml-3',
    lg: stacked ? '-ml-3' : 'ml-3',
    xl: stacked ? '-ml-4' : 'ml-4',
    '2xl': stacked ? '-ml-4' : 'ml-4',
  };

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((avatar, index) => (
        <div
          key={index}
          className={`${index > 0 ? sizeOverlap[size] : ''} ${stacked ? 'ring-2 ring-white' : ''}`}
        >
          <Avatar
            src={avatar.src}
            name={avatar.name}
            alt={avatar.alt}
            size={size}
            variant={variant}
          />
        </div>
      ))}
      {remainingCount > 0 && (
        <div className={`${sizeOverlap[size]} ${stacked ? 'ring-2 ring-white' : ''}`}>
          <div
            className={`
              ${sizeStyles[size]}
              ${variantStyles[variant]}
              bg-brand-bg text-brand-text-secondary
              flex items-center justify-center
              font-semibold
              border-2 border-dashed border-brand-border
            `}
          >
            +{remainingCount}
          </div>
        </div>
      )}
    </div>
  );
};

// Avatar dengan informasi (nama, role, dll)
interface AvatarWithInfoProps extends AvatarProps {
  title: string;
  subtitle?: string;
  layout?: 'horizontal' | 'vertical';
}

export const AvatarWithInfo: React.FC<AvatarWithInfoProps> = ({
  title,
  subtitle,
  layout = 'horizontal',
  size = 'md',
  ...avatarProps
}) => {
  if (layout === 'vertical') {
    return (
      <div className="flex flex-col items-center text-center">
        <Avatar size={size} {...avatarProps} />
        <div className="mt-2">
          <p className="font-semibold text-brand-text-primary text-sm">{title}</p>
          {subtitle && (
            <p className="text-xs text-brand-text-secondary">{subtitle}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar size={size} {...avatarProps} />
      <div>
        <p className="font-semibold text-brand-text-primary text-sm">{title}</p>
        {subtitle && (
          <p className="text-xs text-brand-text-secondary">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default Avatar;
