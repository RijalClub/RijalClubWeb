import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

import type { ProfileConfig } from '@/types/content'

interface SiteShellProps {
  profile: ProfileConfig
  children: ReactNode
}

export function SiteShell({ profile, children }: SiteShellProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="site-shell">
      <div className="ambient ambient-1" aria-hidden="true" />
      <div className="ambient ambient-2" aria-hidden="true" />
      <header className="site-header panel">
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

        <nav className="site-nav" aria-label="Main">
          <NavLink
            to="/"
            end
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Home
          </NavLink>
          <NavLink
            to="/announcements"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Announcements
          </NavLink>
          <NavLink
            to="/quran"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Quran
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Library
          </NavLink>
          <NavLink
            to="/store"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Store
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            Contact
          </NavLink>
        </nav>
      </header>

      <div className="site-content">{children}</div>

      <footer className="site-footer panel">
        <p>{profile.locationLabel}</p>
        <p>Made with Love ♥ by Rijal Devs © {currentYear}</p>
      </footer>
    </div>
  )
}
