import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProfileConfig } from "@/types/content";
import { Menu, X } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

interface SiteShellProps {
  profile: ProfileConfig;
  showStore: boolean;
  children: ReactNode;
}

export function SiteShell({ profile, showStore, children }: SiteShellProps) {
  const currentYear = new Date().getFullYear();
  const routeLocation = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = useMemo(
    () => [
      { to: "/", label: "Home", end: true },
      { to: "/blog", label: "Blog" },
      { to: "/quran", label: "Quran" },
      { to: "/library", label: "Library" },
      ...(showStore ? [{ to: "/store", label: "Store" }] : []),
      { to: "/contact", label: "Contact" },
    ],
    [showStore],
  );

  useEffect(() => {
    setMenuOpen(false);
  }, [routeLocation.pathname]);

  return (
    <div className="site-shell">
      <div className="ambient ambient-1" aria-hidden="true" />
      <div className="ambient ambient-2" aria-hidden="true" />

      <header className="site-header panel">
        <div className="site-header-top">
          <Link to="/" className="brand-link" aria-label="The Rijal Club home">
            <img
              src={profile.logo}
              alt={`${profile.name} logo`}
              className="brand-logo"
            />
            <span>
              <strong>{profile.name}</strong>
              <em>{profile.tagline}</em>
            </span>
          </Link>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="icon-btn menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-main-nav-mobile"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="size-4" />
            Menu
          </Button>
        </div>

        <nav className="site-nav" id="site-main-nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent
          side="right"
          className="border-white/10 bg-slate-950/95 text-white sm:max-w-[340px]"
        >
          <SheetHeader>
            <SheetTitle className="text-left text-white">
              {profile.name}
            </SheetTitle>
          </SheetHeader>
          <nav
            id="site-main-nav-mobile"
            aria-label="Main mobile"
            className="mt-6 grid gap-2"
          >
            {navItems.map((item) => (
              <NavLink
                key={`${item.to}-mobile`}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-white",
                    isActive &&
                      "border-emerald-300/50 bg-emerald-300/15 text-emerald-100",
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button
            type="button"
            variant="outline"
            className="mt-6 w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
            onClick={() => setMenuOpen(false)}
          >
            <X className="size-4" />
            Close
          </Button>
        </SheetContent>
      </Sheet>

      <div className="site-content">{children}</div>

      <footer className="site-footer panel">
        <p>{profile.locationLabel}</p>
        <p>Made with Love by Rijal Devs © {currentYear}</p>
      </footer>
    </div>
  );
}
