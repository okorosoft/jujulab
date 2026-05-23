"use client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import React, { useState } from "react";
import Image from "next/image";

export const Navbar = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "fixed left-0 right-0 top-0 z-50 flex w-full items-center justify-center",
        className
      )}
      {...props}
    />
  );
});
Navbar.displayName = "Navbar";

export const NavBody = React.forwardRef<
  HTMLDivElement,
  Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'>
>(({ className, ...props }, ref) => {
  const { scrollY } = useScroll();
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 50);
  });

  return (
    <motion.div
      ref={ref}
      initial={{ y: 0 }}
      animate={{ y: 0 }}
      className={cn(
        "mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8 mx-4 mt-4 rounded-2xl backdrop-blur-xl border border-white/10",
        className
      )}
      style={{
        backgroundColor: isScrolled
          ? "rgba(255, 255, 255, 0.05)"
          : "rgba(255, 255, 255, 0.03)",
        boxShadow: isScrolled
          ? "0 8px 32px 0 rgba(0, 0, 0, 0.37)"
          : "0 4px 16px 0 rgba(0, 0, 0, 0.2)",
      }}
      {...(props as any)}
    />
  );
});
NavBody.displayName = "NavBody";

export const NavbarLogo = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      <span className="text-2xl font-black tracking-tight">
        <span className="text-white">Juju</span>
        <span className="text-blue-400">Lab.ai</span>
      </span>
    </div>
  );
});

NavbarLogo.displayName = "NavbarLogo";

interface NavItemsProps extends React.HTMLAttributes<HTMLDivElement> {
  items: { name: string; link: string }[];
}

export const NavItems = React.forwardRef<HTMLDivElement, NavItemsProps>(
  ({ className, items, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("hidden items-center gap-8 md:flex", className)}
        {...props}
      >
        {items.map((item, idx) => (
          <a
            key={`nav-link-${idx}`}
            href={item.link}
            className="relative text-sm font-medium text-white transition-colors hover:text-gray-300"
          >
            {item.name}
          </a>
        ))}
      </div>
    );
  }
);
NavItems.displayName = "NavItems";

interface NavbarButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const NavbarButton = React.forwardRef<
  HTMLButtonElement,
  NavbarButtonProps
>(({ className, variant = "primary", ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200",
        variant === "primary"
          ? "bg-white text-black hover:bg-gray-100"
          : "bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
});
NavbarButton.displayName = "NavbarButton";

export const MobileNav = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("flex w-full items-center md:hidden", className)}
      {...props}
    />
  );
});
MobileNav.displayName = "MobileNav";

export const MobileNavHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex w-full items-center justify-between",
        className
      )}
      {...props}
    />
  );
});
MobileNavHeader.displayName = "MobileNavHeader";

interface MobileNavToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isOpen: boolean;
}

export const MobileNavToggle = React.forwardRef<
  HTMLButtonElement,
  MobileNavToggleProps
>(({ className, isOpen, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white transition-colors hover:bg-white/20",
        className
      )}
      {...props}
    >
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
});
MobileNavToggle.displayName = "MobileNavToggle";

interface MobileNavMenuProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onAnimationStart' | 'onAnimationEnd' | 'onAnimationIteration'> {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileNavMenu = React.forwardRef<HTMLDivElement, MobileNavMenuProps>(
  ({ className, isOpen, onClose, children, ...props }, ref) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 z-40 bg-black/80 backdrop-blur-xl"
              onClick={onClose}
            />
            <motion.div
              ref={ref}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "fixed left-0 right-0 top-16 z-50 flex flex-col gap-4 border-b border-white/10 bg-black/90 backdrop-blur-xl p-6",
                className
              )}
              {...(props as any)}
            >
              {children}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    );
  }
);
MobileNavMenu.displayName = "MobileNavMenu";

