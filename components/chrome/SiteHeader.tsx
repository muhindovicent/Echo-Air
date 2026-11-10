"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { navItems } from "@/lib/content";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (!menuOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const panel = panelRef.current;
    const firstFocusable = panel?.querySelector<HTMLElement>(FOCUSABLE);
    firstFocusable?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab" || !panel) return;

      const focusable = Array.from(
        panel.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [menuOpen, closeMenu]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="border-b border-bone/10 bg-obsidian/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-5 py-2 md:px-10">
          <p className="label text-ash">Concept build — not a live store</p>
          <p className="label hidden text-ash sm:block">Drop 01 / Preview</p>
        </div>
      </div>

      <div
        className={cn(
          "transition-colors duration-500",
          scrolled
            ? "border-b border-bone/10 bg-obsidian/92 backdrop-blur-md"
            : "border-b border-transparent bg-gradient-to-b from-obsidian/80 to-transparent",
        )}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 px-5 py-4 md:px-10">
          <Link
            href="#top"
            className="group flex items-center gap-3"
            aria-label="Echo & Air — back to top"
          >
            <span
              aria-hidden="true"
              className="grid h-7 w-7 place-items-center bg-acid text-obsidian transition-colors duration-300 group-hover:bg-bone"
            >
              <span className="label !tracking-wide">E</span>
            </span>
            <span className="label text-bone">Echo &amp; Air</span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-9">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="link-underline label text-bone/85 transition-colors duration-300 hover:text-acid focus-visible:text-acid"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <span className="label hidden text-ash xl:block">Est. FW26</span>
            <button
              ref={toggleRef}
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="label flex items-center gap-3 border border-bone/25 px-4 py-3 text-bone transition-colors duration-300 hover:border-acid hover:text-acid lg:hidden"
            >
              <span className="relative block h-3 w-5" aria-hidden="true">
                <span
                  className={cn(
                    "absolute left-0 block h-px w-5 bg-current transition-all duration-300",
                    menuOpen ? "top-1.5 rotate-45" : "top-0",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 block h-px w-5 bg-current transition-opacity duration-200",
                    menuOpen ? "top-1.5 opacity-0" : "top-1.5 opacity-100",
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 block h-px w-5 bg-current transition-all duration-300",
                    menuOpen ? "top-1.5 -rotate-45" : "top-3",
                  )}
                />
              </span>
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </div>

      {menuOpen ? (
        <div
          id="mobile-navigation"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          className="fixed inset-0 z-50 flex flex-col bg-bone text-obsidian lg:hidden"
        >
          <div className="flex items-center justify-between border-b border-obsidian/15 px-5 py-4">
            <span className="label">Echo &amp; Air</span>
            <button
              type="button"
              onClick={closeMenu}
              className="label border border-obsidian/25 px-4 py-3 transition-colors duration-300 hover:bg-obsidian hover:text-bone"
            >
              Close
            </button>
          </div>

          <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-5 py-10">
            <ul className="flex flex-col gap-6">
              {navItems.map((item, index) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="flex items-baseline gap-5 text-[clamp(2.25rem,11vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.03em] transition-colors duration-300 hover:text-obsidian/60"
                  >
                    <span className="label text-obsidian/45">
                      0{index + 1}
                    </span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-14 border-t border-obsidian/15 pt-8">
              <p className="label text-obsidian/50">Phase 01 — Concept preview</p>
              <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-obsidian/70">
                This build is a frontend foundation. The catalog, cart and
                checkout are not live yet, so every image on the site is
                placeholder art.
              </p>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
