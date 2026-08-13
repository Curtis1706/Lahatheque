"use client";

import { cn } from "@/lib/utils";
import Link, { LinkProps } from "next/link";
import React, { useState, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <motion.div
      className={cn(
        "h-screen sticky top-0 px-4 py-6 hidden md:flex md:flex-col bg-navy-dark text-white w-[260px] flex-shrink-0 border-r border-navy-hover z-50",
        className
      )}
      animate={{
        width: animate ? (open ? "260px" : "70px") : "260px",
      }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  props?: LinkProps;
}) => {
  const { open, animate } = useSidebar();
  const pathname = usePathname();
  const isButton = link.href === "#";

  // Vérifier si le lien correspond exactement ou est une sous-page active
  const isActive =
    !isButton &&
    (pathname === link.href ||
      (link.href !== "/" &&
        pathname.startsWith(link.href) &&
        (pathname.length === link.href.length || pathname[link.href.length] === "/")));

  const content = (
    <>
      <div
        className={cn(
          "transition-colors flex-shrink-0",
          isActive ? "text-gold font-bold" : "text-white/70 group-hover/sidebar:text-gold"
        )}
      >
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-sm transition duration-150 whitespace-pre inline-block !p-0 !m-0 font-medium",
          isActive
            ? "text-gold font-bold"
            : "text-white/80 group-hover/sidebar:text-white"
        )}
      >
        {link.label}
      </motion.span>
    </>
  );

  const commonClasses = cn(
    "flex items-center justify-start gap-4 group/sidebar py-2.5 px-3 rounded-xl transition-all w-full text-left relative",
    isActive
      ? "bg-gold/10 text-gold font-bold shadow-xs"
      : "hover:bg-navy-hover/50 text-white/80",
    className
  );

  if (isButton) {
    return (
      <button
        type="button"
        onClick={onClick as any}
        className={commonClasses}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={link.href}
      onClick={onClick}
      className={commonClasses}
      {...(props as any)}
    >
      {content}
    </Link>
  );
};
