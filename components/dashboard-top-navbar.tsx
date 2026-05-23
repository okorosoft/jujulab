"use client";

import { useState, useMemo, memo, useEffect } from "react";
import { useUser, SignOutButton } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import NextLink from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Home,
  FileText,
  BarChart3,
  TrendingUp,
  Settings,
  ChevronDown,
  Archive,
  History,
  Image as ImageIcon
} from "lucide-react";

interface DashboardTopNavbarProps {
  className?: string;
}

// Logo component with fallback
function TopNavbarLogo() {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="text-xl font-bold text-black" style={{ fontFamily: 'Rubik, sans-serif', fontOpticalSizing: 'auto', fontWeight: 700 }}>
        <span className="text-black">By</span>Pass<span className="text-black">AI</span>
      </div>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="ByLearn Logo"
      width={100}
      height={24}
      className="h-6 w-auto"
      onError={() => setImageError(true)}
      priority
    />
  );
}

function DashboardTopNavbar({ className = "" }: DashboardTopNavbarProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user } = useUser();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Memoize navigation items to prevent recalculation
  const navigationItems = useMemo(() => [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      isActive: pathname === "/dashboard"
    },
    {
      name: "AI Humanize",
      href: "/dashboard/ai-humanize",
      icon: FileText,
      isActive: pathname === "/dashboard/ai-humanize"
    },
    {
      name: "AI Detector",
      href: "/dashboard/ai-detector",
      icon: BarChart3,
      isActive: pathname === "/dashboard/ai-detector"
    },
    {
      name: "AI Image Detection",
      href: "/dashboard/ai-image-detection",
      icon: ImageIcon,
      isActive: pathname === "/dashboard/ai-image-detection"
    },
    {
      name: "Documents",
      href: "/dashboard/documents",
      icon: Archive,
      isActive: pathname === "/dashboard/documents"
    },
  ], [pathname]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${className}`}>
      <div className={`max-w-7xl mx-auto px-6 transition-all duration-300 ${isScrolled ? 'py-4' : ''
        }`}>
        <div className={`flex items-center justify-between h-24 py-4 transition-all duration-300 rounded-2xl ${isScrolled
            ? 'bg-black/80 backdrop-blur-xl shadow-2xl px-6'
            : ''
          }`}>

          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 bg-white rounded-full px-3 py-2">
              <TopNavbarLogo />
              <span className="text-sm font-light text-black tracking-wide hidden sm:block" style={{ fontFamily: 'Rubik, sans-serif', fontOpticalSizing: 'auto', fontWeight: 300 }}>
                ByLearn
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <NextLink
                  key={item.name}
                  href={item.href}
                  className={`relative flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${item.isActive
                      ? 'bg-black text-white shadow-sm'
                      : 'text-neutral-600 hover:bg-black hover:text-white'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.name}</span>

                  {/* Active indicator - pill shape */}
                  {item.isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 bg-black rounded-full shadow-sm -z-10"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </NextLink>
              );
            })}
          </div>

          {/* Right Section - Settings, Profile */}
          <div className="flex items-center space-x-3">

            {/* Settings */}
            <div className="flex items-center bg-white rounded-full p-1 shadow-sm">
              <NextLink href="/dashboard/profile">
                <button className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center hover:bg-neutral-200 transition-colors">
                  <Settings className="w-4 h-4 text-neutral-600" />
                </button>
              </NextLink>
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 hover:bg-white/50 rounded-lg p-1 transition-colors"
              >
                {/* User Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                  {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                </div>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsProfileOpen(false)}
                  />

                  {/* Dropdown */}
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-neutral-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-200 to-orange-300 flex items-center justify-center">
                          {user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-neutral-900 text-sm">
                            {user?.firstName || 'User'}
                          </div>
                          <div className="text-xs text-neutral-500 truncate">
                            {user?.emailAddresses[0]?.emailAddress}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <NextLink
                        href="/dashboard/profile"
                        className="flex items-center space-x-3 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 rounded-lg transition-colors"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span>Profile Settings</span>
                      </NextLink>

                      <div className="border-t border-neutral-200 my-1"></div>

                      <SignOutButton>
                        <button className="w-full flex items-center space-x-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          <span>Sign Out</span>
                        </button>
                      </SignOutButton>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Export memoized component to prevent unnecessary re-renders
export default memo(DashboardTopNavbar);
