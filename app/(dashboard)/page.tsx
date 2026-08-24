'use client';

import { useUser, UserButton } from '@clerk/nextjs';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ResumeGenerator from './components/ResumeGenerator';
import ResumeAnalyzer from './components/ResumeAnalyzer';
import CareerRoadmap from './components/CareerRoadmap';
import AICoach from './components/AICoach';

const FEATURES = [
  { id: 'resume-generator', label: 'Resume Generator', icon: '📄' },
  { id: 'resume-analyzer', label: 'Resume Analyzer', icon: '🔍' },
  { id: 'career-roadmap', label: 'Career Roadmap', icon: '🗺️' },
  { id: 'ai-coach', label: 'AI Career Coach', icon: '🤖' },
] as const;

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState<string>('resume-generator');
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);

  // Set default sidebar state based on window size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarExpanded(false);
      } else {
        setSidebarExpanded(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/auth/sign-in');
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#fafafa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'resume-generator':
        return <ResumeGenerator />;
      case 'resume-analyzer':
        return <ResumeAnalyzer />;
      case 'career-roadmap':
        return <CareerRoadmap />;
      case 'ai-coach':
        return <AICoach />;
      default:
        return <ResumeGenerator />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-gray-900 font-sans">
      {/* ── SIDEBAR (Claude-Style) ── */}
      <aside
        style={{ width: sidebarExpanded ? '260px' : '80px' }}
        className="h-full bg-[#0d0d0d] border-r border-white/[0.06] flex flex-col justify-between transition-all duration-300 ease-in-out shrink-0 z-40"
      >
        <div>
          {/* Logo / Branding Area */}
          <div className="flex items-center h-16 px-4 border-b border-white/[0.06] overflow-hidden">
            {/* Hamburger inside sidebar header */}
            <button
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              className="p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 hover:shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all duration-200"
              aria-label={sidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {sidebarExpanded && (
              <div className="flex items-center gap-2.5 ml-3 animate-fadeIn">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400 flex items-center justify-center text-white font-extrabold text-sm shadow-md">
                  AI
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-white font-bold text-sm tracking-tight">AI Career</span>
                  <span className="text-[9px] text-white/40 font-medium tracking-wide">COACH</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5">
            {sidebarExpanded && (
              <p className="text-[10px] font-semibold tracking-[0.12em] text-white/20 uppercase px-3 mb-2 mt-4 animate-fadeIn">
                FEATURES
              </p>
            )}

            <ul className="space-y-1">
              {FEATURES.map((item) => {
                const isActive = activeFeature === item.id;
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => setActiveFeature(item.id)}
                      className={`
                        w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-sm font-medium
                        transition-all duration-200 group relative
                        ${isActive
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                          : 'text-white/60 hover:text-white hover:bg-white/[0.06]'
                        }
                      `}
                    >
                      {/* Icon */}
                      <span className="text-xl leading-none flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                        {item.icon}
                      </span>
                      {/* Label (Visible only when expanded) */}
                      {sidebarExpanded && (
                        <span className="truncate animate-fadeIn">{item.label}</span>
                      )}
                      {/* Active indicator dot when collapsed */}
                      {isActive && !sidebarExpanded && (
                        <span className="absolute right-2.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.06] overflow-hidden text-center">
          {sidebarExpanded ? (
            <span className="text-[10px] text-white/30 font-medium tracking-wide animate-fadeIn">
              AI Career Coach v2.5
            </span>
          ) : (
            <span className="text-[11px] text-white/30 font-bold">v2.5</span>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm flex-shrink-0">
          <div className="h-16 px-6 flex items-center justify-between">
            {/* Left Header Branding */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                AI
              </div>
              <span className="text-base font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent">
                AI Career Coach
              </span>
            </div>

            {/* Right Profile Info */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 hidden sm:inline">
                Hello, {user.firstName || user.username || 'User'} 👋
              </span>
              <UserButton />
            </div>
          </div>
        </header>

        {/* Scrollable Panel Area with Fade-in animation */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50">
          <div key={activeFeature} className="max-w-7xl mx-auto animate-fadeIn duration-200">
            {renderActiveFeature()}
          </div>
        </main>
      </div>
    </div>
  );
}
