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

  useEffect(() => {
    const onResize = (): void => {
      if (window.innerWidth > 700) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="site-main-nav"
            onClick={() => setMenuOpen((value) => !value)}
          >
            {menuOpen ? <X size={15} /> : <Menu size={15} />}
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <nav
          className={`site-nav ${menuOpen ? "open" : ""}`}
          id="site-main-nav"
          aria-label="Main"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? "active" : undefined)}
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <div className="site-content">{children}</div>

      <footer className="site-footer panel">
        <p>{profile.locationLabel}</p>
        <p>Made with Love ♥ by Rijal Devs © {currentYear}</p>
      </footer>
    </div>
  );
}
