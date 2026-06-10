"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Menu, X, Search, MapPin, ArrowRight } from "lucide-react";
import { NAV, type NavLink } from "@/lib/navigation";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EASE_OUT_EXPO } from "@/lib/motion";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-500",
        scrolled
          ? "border-b border-steel/50 bg-abyss/70 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      )}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-6 px-5 py-3 lg:px-8">
        <Logo />

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavItem
              key={item.label}
              item={item}
              open={openMenu === item.label}
              onOpen={() => setOpenMenu(item.mega ? item.label : null)}
            />
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden items-center gap-2 lg:flex">
          <Button href="/tracking" variant="ghost" size="sm">
            <MapPin className="h-4 w-4" />
            Track
          </Button>
          <Button href="/quote" variant="primary" size="sm">
            Get Quote
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          className="grid h-11 w-11 place-items-center rounded-full glass text-foam lg:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mega-menu panel */}
      <AnimatePresence>
        {openMenu && (
          <MegaPanel
            item={NAV.find((n) => n.label === openMenu)!}
            onClose={() => setOpenMenu(null)}
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && <MobileMenu onClose={() => setMobileOpen(false)} />}
      </AnimatePresence>
    </header>
  );
}

function NavItem({
  item,
  open,
  onOpen,
}: {
  item: NavLink;
  open: boolean;
  onOpen: () => void;
}) {
  if (!item.mega) {
    return (
      <Link
        href={item.href}
        className="rounded-full px-3.5 py-2 text-sm font-medium text-mist transition-colors hover:text-foam"
      >
        {item.label}
      </Link>
    );
  }
  return (
    <button
      onMouseEnter={onOpen}
      onFocus={onOpen}
      className={cn(
        "flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
        open ? "text-foam" : "text-mist hover:text-foam"
      )}
    >
      {item.label}
      <ChevronDown
        className={cn(
          "h-3.5 w-3.5 transition-transform duration-300",
          open && "rotate-180 text-cyan"
        )}
      />
    </button>
  );
}

function MegaPanel({ item, onClose }: { item: NavLink; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
      className="absolute inset-x-0 top-full"
    >
      <div className="mx-auto max-w-7xl px-5 pb-4 lg:px-8">
        <div className="glass overflow-hidden rounded-3xl p-6 shadow-2xl">
          <div className="grid gap-8 md:grid-cols-[1fr_1fr_0.8fr]">
            {item.mega!.map((group) => (
              <div key={group.heading}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-cyan/80">
                  {group.heading}
                </p>
                <ul className="space-y-1">
                  {group.items.map((sub) => {
                    const Icon = sub.icon;
                    return (
                      <li key={sub.label}>
                        <Link
                          href={sub.href}
                          onClick={onClose}
                          className="group flex gap-3 rounded-2xl p-2.5 transition-colors hover:bg-steel/40"
                        >
                          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-steel/60 text-cyan transition-colors group-hover:bg-cyan group-hover:text-white">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span>
                            <span className="block text-sm font-medium text-foam">
                              {sub.label}
                            </span>
                            <span className="block text-xs leading-snug text-mist">
                              {sub.description}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}

            {item.featured && (
              <Link
                href={item.featured.href}
                onClick={onClose}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-cyan/20 bg-gradient-to-br from-navy to-abyss p-5"
              >
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan/20 blur-2xl transition-all group-hover:bg-cyan/30" />
                <div>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-cyan">
                    Differentiator
                  </span>
                  <h4
                    className="mt-2 text-lg font-semibold text-foam"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.featured.title}
                  </h4>
                  <p className="mt-1 text-xs leading-relaxed text-mist">
                    {item.featured.blurb}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan">
                  Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function MobileMenu({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 lg:hidden"
    >
      <div className="absolute inset-0 bg-[#0b1b2b]/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 280 }}
        className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-deep p-5"
      >
        <div className="flex items-center justify-between">
          <Logo />
          <button
            className="grid h-11 w-11 place-items-center rounded-full glass text-foam"
            aria-label="Close menu"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-steel/40 px-4 py-3 text-mist">
          <Search className="h-4 w-4" />
          <span className="text-sm">Track, quote, or search…</span>
        </div>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <details key={item.label} className="group rounded-2xl">
              <summary className="flex cursor-pointer items-center justify-between rounded-2xl px-3 py-3 text-base font-medium text-foam marker:content-['']">
                <Link href={item.href} onClick={onClose}>
                  {item.label}
                </Link>
                {item.mega && (
                  <ChevronDown className="h-4 w-4 text-mist transition-transform group-open:rotate-180" />
                )}
              </summary>
              {item.mega && (
                <div className="space-y-0.5 pb-2 pl-3">
                  {item.mega.flatMap((g) => g.items).map((sub) => (
                    <Link
                      key={sub.label}
                      href={sub.href}
                      onClick={onClose}
                      className="block rounded-xl px-3 py-2 text-sm text-mist hover:bg-steel/40 hover:text-foam"
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              )}
            </details>
          ))}
        </nav>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button href="/tracking" variant="outline" size="md">
            Track
          </Button>
          <Button href="/quote" variant="primary" size="md">
            Get Quote
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
