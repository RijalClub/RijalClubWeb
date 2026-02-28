import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import type { ProfileConfig } from "@/types/content";
import { Menu } from "lucide-react";
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
      <header className="site-header panel">
        <Link to="/" className="brand-link" aria-label="The Rijal Club home">
          <img
            src={profile.logo}
            alt={`${profile.name} logo`}
            className="brand-logo"
          />
          <span className="hidden sm:block">
            <strong>{profile.name}</strong>
            <em>{profile.tagline}</em>
          </span>
        </Link>

        <nav className="site-nav" id="site-main-nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition-all",
                  isActive
                    ? "bg-white/15 text-white shadow-sm"
                    : "text-muted-foreground hover:bg-white/10 hover:text-white"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-white hover:bg-white/10"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="border-white/10 bg-background/95 backdrop-blur-xl text-white sm:max-w-[340px]"
          >
            <SheetHeader className="mb-8">
              <SheetTitle className="text-left font-bebas text-2xl tracking-wide text-white">
                {profile.name}
              </SheetTitle>
            </SheetHeader>
            <nav
              id="site-main-nav-mobile"
              aria-label="Main mobile"
              className="grid gap-2"
            >
              {navItems.map((item) => (
                <NavLink
                  key={`${item.to}-mobile`}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3 text-sm font-medium transition-all",
                      isActive
                        ? "border-primary/50 bg-primary/10 text-primary"
                        : "text-muted-foreground hover:border-white/10 hover:bg-white/5 hover:text-white"
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="absolute bottom-8 left-6 right-6">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                {profile.tagline}
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      <main className="site-content">{children}</main>

      <footer className="mt-12 mb-8 flex flex-col md:flex-row items-center justify-between gap-6 px-4 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
        <p className="order-2 md:order-1">Made with Love by Rijal Devs © {currentYear}</p>
        <div className="order-1 md:order-2 flex items-center gap-8">
          <p>{profile.locationLabel}</p>
          <div className="h-4 w-px bg-white/10 hidden md:block" />
          <Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link>
        </div>
      </footer>
    </div>
  );
}
