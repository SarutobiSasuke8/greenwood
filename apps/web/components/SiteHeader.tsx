"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ChainStatus } from "@greenwood/core";
import { NAV } from "@/lib/site";
import { ChainPulse } from "./ChainPulse";
import { LinkIcon } from "./LinkIcon";
import { Mark } from "./Mark";

export function SiteHeader({ chain }: { chain: ChainStatus | null }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if(open && event.key === "Escape") { setOpen(false); document.querySelector<HTMLButtonElement>(".nav-toggle")?.focus(); } };
    document.addEventListener("keydown",onKey);
    return () => {
      document.removeEventListener("keydown",onKey);
    };
  }, [open]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" || pathname.startsWith("/games") : pathname.startsWith(href));

  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="page-wrap header-inner">
        <Link href="/" className="brand" aria-label="Greenwood home">
          <Mark />
          <span className="brand-text">
            <span className="brand-name">Greenwood</span>
            <span className="brand-sub">Off the beaten chain</span>
          </span>
        </Link>

        <nav className="nav-desktop" aria-label="Primary">
          <ul>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={`nav-link${isActive(item.href) ? " is-active" : ""}`} aria-current={isActive(item.href) ? "page" : undefined}>
                  <LinkIcon label={item.label}/>{item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <ChainPulse initial={chain} />
          <Link href="/about#listing" className="btn btn-primary btn-sm">
            List a game
          </Link>
          <button type="button" className="nav-toggle" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls="mobile-panel" onClick={() => setOpen((v) => !v)}>
            {open ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M4 8h16M4 16h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-panel" className="mobile-panel">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className={`mobile-link${isActive(item.href) ? " is-active" : ""}`}>
              <LinkIcon label={item.label}/>{item.label}
            </Link>
          ))}
          <div className="mobile-actions">
            <ChainPulse initial={chain} />
            <Link href="/about#listing" className="btn btn-primary">
              List a game
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
