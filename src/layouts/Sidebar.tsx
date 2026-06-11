import React, { useMemo, useEffect } from 'react';
import { ViewType, User, Profile } from '@/types';
import { NAV_ITEMS, LogOutIcon } from '@/constants';
import { AvatarDisplay } from '@/shared/ui/AvatarUpload';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  profile: Profile;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = React.memo(({ activeView, setActiveView, isOpen, setIsOpen, currentUser, profile, onLogout }) => {
  const navGroupConfig = useMemo(() => ([
    {
      id: 'pengantin-pipeline',
      title: 'Alur Pengantin',
      description: 'Dari leads hingga booking.',
      views: [
        ViewType["Calon Pengantin"],
        ViewType.BOOKING,
        ViewType.CALENDAR,
      ],
    },
    {
      id: 'manajemen-pengantin',
      title: 'Manajemen Pengantin',
      description: 'Database dan progress acara pernikahan.',
      views: [
        ViewType.CLIENTS,
        ViewType.PROJECTS,
        ViewType.CONTRACTS,
      ],
    },
    {
      id: 'layanan-produk',
      title: 'Paket & Pricelist',
      description: 'Kelola Package, Add-on, dan Promo.',
      views: [
        ViewType.PACKAGES,
        ViewType.PROMO_CODES,
      ],
    },
    {
      id: 'portfolio',
      title: 'Portfolio',
      description: 'Kelola portfolio proyek per project.',
      views: [
        ViewType.PORTFOLIO,
      ],
    },
    {
      id: 'keuangan',
      title: 'Keuangan',
      description: 'Kelola catatan keuangan.',
      views: [ViewType.FINANCE],
    },
    {
      id: 'vendor',
      title: 'Tim & Vendor',
      description: 'Kelola tim dan Vendor.',
      views: [ViewType.TEAM],
    },
    {
      id: 'testimoni',
      title: 'Testimoni',
      description: 'Testimoni Pengantin.',
      views: [ViewType.CLIENT_REPORTS],
    },
    {
      id: 'pengaturan',
      title: 'Pengaturan',
      description: 'Pengaturan Vendor Kamu.',
      views: [ViewType.SETTINGS],
    },
  ]), []);

  const visibleNavItems = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin') {
      return NAV_ITEMS;
    }
    // Member role
    const memberPermissions = new Set(currentUser.permissions || []);
    return NAV_ITEMS.filter(item => memberPermissions.has(item.view));
  }, [currentUser]);

  const groupedNavItems = useMemo(() => {
    const itemMap = new Map(visibleNavItems.map(item => [item.view, item]));
    const grouped = navGroupConfig
      .map(group => ({
        ...group,
        items: group.views
          .map(view => itemMap.get(view))
          .filter((item): item is (typeof NAV_ITEMS)[number] => Boolean(item)),
      }))
      .filter(group => group.items.length > 0);

    const assignedViews = new Set(grouped.flatMap(group => group.items.map(item => item.view)));
    const ungroupedItems = visibleNavItems.filter(item => !assignedViews.has(item.view));

    if (ungroupedItems.length > 0) {
      grouped.push({
        id: 'lainnya',
        title: 'Menu Lainnya',
        description: 'Menu tambahan yang tetap bisa diakses sesuai hak pengguna.',
        views: [],
        items: ungroupedItems,
      });
    }

    return grouped;
  }, [navGroupConfig, visibleNavItems]);

  const navAnimationIndexMap = useMemo(
    () => new Map(visibleNavItems.map((item, index) => [item.view, index])),
    [visibleNavItems]
  );

  // Handle scroll lock when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && window.innerWidth < 1280) { // Only lock for mobile sidebar
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      {/* Enhanced Backdrop with better blur */}
      <div
        className={`
          fixed inset-0 
          bg-black/50 
          backdrop-blur-sm
          z-30 
          xl:hidden 
          transition-all duration-300 ease-out
          ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}
        `}
        onClick={() => setIsOpen(false)}
      />

      {/* Enhanced Sidebar Container */}
      <aside
        id="sidebar"
        className={`
          fixed xl:fixed 
          inset-y-0 left-0 
          w-72 sm:w-80 xl:w-64
          bg-white
          flex-col flex-shrink-0 flex 
          z-40 
          transform transition-all duration-300 ease-out
          xl:translate-x-0
          border-r border-white/20
          shadow-2xl xl:shadow-[1px_0_0_rgba(0,0,0,0.02)]
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        style={{
          paddingTop: 'var(--safe-area-inset-top, 0px)',
          paddingBottom: 'var(--safe-area-inset-bottom, 0px)',
          paddingLeft: 'var(--safe-area-inset-left, 0px)',
        }}
      >
        {/* Enhanced Header with Logo */}
        <div className="
          h-16 sm:h-20 
          flex items-center 
          px-4 sm:px-6 
          border-b border-brand-border/30
          bg-transparent
        ">
          <div className="flex items-center gap-3">
            {/* Logo/Brand Icon */}
            <div className="
              w-10 h-10 
              rounded-xl 
              bg-brand-surface
              flex items-center justify-center
              shadow-sm
              overflow-hidden
            ">
              {profile?.logoBase64 ? (
                <img src={profile.logoBase64} alt={profile.companyName || "Company Logo"} className="w-full h-full object-cover" />
              ) : (
                <img src="/assets/images/logos/logoIcon.svg" alt="Weddfin Logo" className="w-8 h-8 object-contain" />
              )}
            </div>

            {/* Brand Text with Enhanced Typography */}
            <span className="
              text-lg sm:text-xl 
              font-extrabold 
              text-brand-text-light
              select-none
              tracking-tight
              truncate
              max-w-[150px]
            ">
              {profile?.companyName || 'weddfin'}
            </span>
          </div>
        </div>

        {/* Enhanced Navigation with Better Scrolling */}
        <nav className="
          flex-1 
          px-3 sm:px-4 
          py-4 sm:py-6 
          overflow-y-auto 
          overscroll-contain
        "
          style={{ WebkitOverflowScrolling: 'touch' }}>
          <div className="space-y-5">
            {groupedNavItems.map((group) => (
              <section key={group.id}>
                <div className="px-3 sm:px-4 mb-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary/70">
                    {group.title}
                  </p>
                </div>

                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item.view}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setActiveView(item.view);
                          setIsOpen(false); // Auto-close on mobile
                        }}
                        className={`
                          flex items-center 
                          px-3 sm:px-4 
                          py-3 sm:py-3.5 
                          my-1 
                          text-sm font-semibold 
                          rounded-xl 
                          transition-all duration-200
                          group
                          relative
                          overflow-hidden
                          min-h-[48px]
                          ${activeView === item.view
                            ? 'bg-gradient-to-r from-brand-accent to-indigo-600 text-white shadow-lg shadow-brand-accent/20 border-t border-white/10'
                            : 'text-brand-text-primary hover:bg-brand-input/60 active:bg-brand-input/80'
                          }
                        `}
                        style={{
                          animationDelay: `${(navAnimationIndexMap.get(item.view) ?? 0) * 50}ms`,
                          animationName: isOpen ? 'slideInLeft' : 'none',
                          animationDuration: '0.3s',
                          animationTimingFunction: 'ease-out',
                          animationFillMode: 'forwards'
                        }}
                      >
                        {/* Background shimmer effect for active item */}
                        {activeView === item.view && (
                          <div className="
                            absolute inset-0 
                            bg-gradient-to-r 
                            from-transparent 
                            via-white/10 
                            to-transparent 
                            -translate-x-full 
                            group-hover:translate-x-full 
                            transition-transform duration-1000
                          " />
                        )}

                        {/* Enhanced Icon Container */}
                        <div className="
                          w-6 sm:w-7 
                          mr-3 sm:mr-4 
                          flex-shrink-0 
                          flex items-center justify-center
                          relative
                        ">
                          <item.icon className={`
                            w-5 h-5 sm:w-6 sm:h-6
                            transition-all duration-200
                            ${activeView !== item.view ? 'text-brand-text-secondary group-hover:text-brand-text-primary' : 'text-white'}
                          `} />
                        </div>

                        {/* Enhanced Label */}
                        <span className="
                          flex-1 
                          truncate
                          relative
                          leading-tight
                        ">
                          {item.label}
                        </span>

                        {/* Active indicator */}
                        {activeView === item.view && (
                          <div className="
                            w-1.5 h-6 
                            bg-white/30 
                            rounded-full
                            flex-shrink-0
                          " />
                        )}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        </nav>

        {/* Enhanced Footer Section */}
        <div className="
          px-4 sm:px-6 
          py-4 sm:py-6 
          flex-shrink-0 
          border-t border-brand-border/30
          bg-transparent
        ">
          {/* Enhanced User Profile */}
          {currentUser && (
            <div className="
              flex items-center 
              gap-3 
              p-3
              rounded-xl
              bg-brand-input/50
              border border-brand-border/30
            ">
              <div className="
                w-10 h-10 sm:w-11 sm:h-11 
                rounded-full 
                overflow-hidden
                flex-shrink-0
              ">
                <AvatarDisplay
                  avatarBase64={profile?.avatar ?? null}
                  name={profile?.fullName || currentUser.fullName || 'User'}
                  size="sm"
                  variant="team"
                  className="!rounded-full w-full h-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="
                  font-semibold 
                  text-sm
                  text-brand-text-light
                  truncate
                  leading-tight
                ">
                  {profile?.fullName || currentUser.fullName}
                </p>
                <p className="
                  text-[11px] 
                  text-brand-text-secondary
                  truncate
                  leading-tight
                  mt-0.5
                ">
                  {currentUser.role}
                </p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="
                  p-2 rounded-lg
                  text-brand-text-secondary hover:text-brand-danger hover:bg-red-500/10
                  transition-colors duration-200
                  flex-shrink-0
                "
                title="Keluar"
                aria-label="Keluar"
              >
                <LogOutIcon className="w-4 h-4 text-brand-text-secondary hover:text-brand-danger" />
              </button>
            </div>
          )}
        </div>
      </aside>

      <style>{`
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        /* Enhanced scrollbar for navigation */
        nav::-webkit-scrollbar {
          width: 6px;
        }
        
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        
        nav::-webkit-scrollbar-thumb {
          background: var(--color-border);
          border-radius: 3px;
        }
        
        nav::-webkit-scrollbar-thumb:hover {
          background: var(--color-text-secondary);
        }
        
        /* iOS momentum scrolling */
        @supports (-webkit-touch-callout: none) {
          nav {
            -webkit-overflow-scrolling: touch;
          }
        }
      `}</style>
    </>
  );
});

export default Sidebar;
