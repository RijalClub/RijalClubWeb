import { CalendarDays, Filter, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  AnnouncementCard,
  AnnouncementDetailModal,
  sortAnnouncements,
} from '@/components/AnnouncementsSection'
import type { AnnouncementsConfig, AnnouncementType } from '@/types/content'

interface AnnouncementsPageProps {
  announcements: AnnouncementsConfig
}

type TypeFilter = 'all' | AnnouncementType

type SortFilter = 'latest' | 'oldest'

function yearOf(dateString: string): string {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return String(date.getFullYear())
}

export function AnnouncementsPage({ announcements }: AnnouncementsPageProps) {
  const [activeItem, setActiveItem] = useState<AnnouncementsConfig['items'][number] | null>(null)
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [yearFilter, setYearFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortFilter>('latest')

  const yearOptions = useMemo(() => {
    const years = new Set(announcements.items.map((item) => yearOf(item.publishedAt)))
    return ['all', ...Array.from(years).sort((a, b) => (a < b ? 1 : -1))]
  }, [announcements.items])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()

    const base = announcements.items.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) {
        return false
      }

      if (yearFilter !== 'all' && yearOf(item.publishedAt) !== yearFilter) {
        return false
      }

      if (!q) {
        return true
      }

      return item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)
    })

    const sorted = sortAnnouncements(base)
    if (sortBy === 'oldest') {
      return sorted.reverse()
    }

    return sorted
  }, [announcements.items, query, sortBy, typeFilter, yearFilter])

  useEffect(() => {
    // Ensure page can scroll even if a previous modal left body overflow locked.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'auto'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const resetFilters = (): void => {
    setQuery('')
    setTypeFilter('all')
    setYearFilter('all')
    setSortBy('latest')
  }

  return (
    <main className="page-grid announcements-page">
      <section className="panel reveal announcements-page-hero">
        <p className="kicker">
          <CalendarDays size={16} />
          Announcements
        </p>
        <h1>{announcements.heading}</h1>
        <p>{announcements.description}</p>
      </section>

      <section className="panel reveal announcements-page-controls">
        <div className="announcements-controls-grid">
          <label className="input-wrap" htmlFor="announcement-search">
            <Search size={14} />
            <input
              id="announcement-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title or description"
            />
          </label>

          <label className="select-wrap" htmlFor="announcement-type-filter">
            <Filter size={14} />
            <select
              id="announcement-type-filter"
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value as TypeFilter)}
            >
              <option value="all">All types</option>
              <option value="text">Text</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>

          <label className="select-wrap" htmlFor="announcement-year-filter">
            Year
            <select
              id="announcement-year-filter"
              value={yearFilter}
              onChange={(event) => setYearFilter(event.target.value)}
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year === 'all' ? 'All years' : year}
                </option>
              ))}
            </select>
          </label>

          <label className="select-wrap" htmlFor="announcement-sort-filter">
            Sort
            <select
              id="announcement-sort-filter"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortFilter)}
            >
              <option value="latest">Latest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </label>
        </div>

        <div className="announcements-summary-row">
          <p className="state-text">
            Showing {filteredItems.length} of {announcements.items.length} announcement(s)
          </p>
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Reset Filters
          </button>
        </div>
      </section>

      <section className="panel reveal announcements-page-results">
        {filteredItems.length === 0 ? (
          <p className="state-text">No announcements match your filters.</p>
        ) : (
          <div className="announcement-grid">
            {filteredItems.map((item) => (
              <AnnouncementCard key={item.id} item={item} onOpen={setActiveItem} />
            ))}
          </div>
        )}
      </section>

      <AnnouncementDetailModal item={activeItem} onClose={() => setActiveItem(null)} />
    </main>
  )
}
