'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';

const NAV_ITEMS = [
  { icon: '📄', label: 'Resume Generator', href: '/resume-generator' },
  { icon: '🔍', label: 'Resume Analyzer', href: '/resume-analyzer' },
  { icon: '🗺️', label: 'Career Roadmap', href: '/career-roadmap' },
  { icon: '🤖', label: 'AI Career Coach', href: '/ai-coach' },
] as const;

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on outside click (mobile overlay)
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <>
      {/* Mobile overlay backdrop */}
      <div
        ref={overlayRef}
        onClick={handleOverlayClick}
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-[260px] z-50 flex flex-col
          bg-[#0f1117] border-r border-white/[0.06]
          transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Main sidebar"
      >
        {/* Logo / Branding */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/[0.06]">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-base shadow-lg shadow-blue-500/30 flex-shrink-0">
            AI
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-white font-bold text-[15px] tracking-tight">AI Career</span>
            <span className="text-[11px] text-white/40 font-medium tracking-wide">COACH</span>
          </div>
          {/* Close button on mobile */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close sidebar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {/* Dashboard link */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm font-medium
              transition-all duration-200 group
              ${pathname === '/dashboard' || pathname === '/'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
              }
            `}
          >
            <span className="text-base leading-none">🏠</span>
            <span>Dashboard</span>
            {(pathname === '/dashboard' || pathname === '/') && (
              <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
            )}
          </Link>

          {/* Section Header */}
          <p className="text-[10px] font-semibold tracking-[0.12em] text-white/25 uppercase px-3 mb-2 mt-5">
            Features
          </p>

          {/* Feature Links */}
          <ul className="space-y-1">
            {NAV_ITEMS.map(({ icon, label, href }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-200 group relative
                      ${isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                        : 'text-white/60 hover:text-white hover:bg-white/[0.08]'
                      }
                    `}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <span className="text-base leading-none">{icon}</span>
                    <span>{label}</span>
                    {isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 px-2">
            <span className="text-[11px] text-white/25 font-medium">AI Career Coach v1.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ── Hamburger button – exported separately so layout can render it ── */
export function HamburgerButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
      aria-label="Open sidebar"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
  );
}
