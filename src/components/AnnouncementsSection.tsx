import { ExternalLink, Images, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { AnnouncementItem, AnnouncementsConfig, MediaAsset } from '@/types/content'

interface AnnouncementsSectionProps {
  announcements: AnnouncementsConfig
  maxItems?: number
  headingLink?: string
}

interface AnnouncementCardProps {
  item: AnnouncementItem
  onOpen?: (item: AnnouncementItem) => void
}

interface AnnouncementDetailModalProps {
  item: AnnouncementItem | null
  onClose: () => void
}

export function formatAnnouncementDate(dateString: string): string {
  const date = new Date(dateString)

  if (Number.isNaN(date.getTime())) {
    return dateString
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function sortAnnouncements(items: AnnouncementItem[]): AnnouncementItem[] {
  return items.slice().sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
}

function announcementMedia(item: AnnouncementItem): MediaAsset[] {
  if (item.media && item.media.length > 0) {
    return item.media
  }

  if (item.mediaUrl) {
    return [
      {
        type: item.type === 'video' ? 'video' : 'image',
        url: item.mediaUrl,
        posterUrl: item.posterUrl,
        alt: item.title,
      },
    ]
  }

  return []
}

function AnnouncementMediaCard({ media, title }: { media: MediaAsset; title: string }) {
  if (media.type === 'video') {
    return (
      <div className="announcement-media">
        <video muted playsInline preload="metadata" poster={media.posterUrl}>
          <source src={media.url} />
          Your browser does not support embedded videos.
        </video>
      </div>
    )
  }

  return (
    <div className="announcement-media">
      <img src={media.url} alt={media.alt || title} loading="lazy" />
    </div>
  )
}

function AnnouncementMediaModal({ media, title }: { media: MediaAsset; title: string }) {
  if (media.type === 'video') {
    return (
      <div className="content-modal-media">
        <video controls playsInline preload="metadata" poster={media.posterUrl}>
          <source src={media.url} />
          Your browser does not support embedded videos.
        </video>
      </div>
    )
  }

  return (
    <div className="content-modal-media">
      <img src={media.url} alt={media.alt || title} loading="lazy" />
    </div>
  )
}

export function AnnouncementCard({ item, onOpen }: AnnouncementCardProps) {
  const mediaItems = announcementMedia(item)
  const primaryMedia = mediaItems[0]

  const cardClassName = [
    'announcement-card',
    onOpen ? 'clickable' : '',
    mediaItems.length > 0 ? 'has-media' : '',
    mediaItems.length > 1 ? 'has-multi-media' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const openCard = (): void => {
    if (onOpen) {
      onOpen(item)
    }
  }

  return (
    <article
      className={cardClassName}
      onClick={openCard}
      onKeyDown={(event) => {
        if (!onOpen) {
          return
        }

        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openCard()
        }
      }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
    >
      <div className="announcement-meta">
        <span>{formatAnnouncementDate(item.publishedAt)}</span>
        <span className="tag">{item.type}</span>
      </div>
      <h3>{item.title}</h3>
      <p>{item.body}</p>

      {primaryMedia ? <AnnouncementMediaCard media={primaryMedia} title={item.title} /> : null}
      {mediaItems.length > 1 ? (
        <p className="content-card-more">
          <Images size={13} />
          +{mediaItems.length - 1} more media
        </p>
      ) : null}

      {item.ctaLabel && item.ctaUrl ? (
        <a
          href={item.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-link"
          onClick={(event) => event.stopPropagation()}
        >
          {item.ctaLabel}
          <ExternalLink size={13} />
        </a>
      ) : null}
    </article>
  )
}

export function AnnouncementDetailModal({ item, onClose }: AnnouncementDetailModalProps) {
  const [mediaIndex, setMediaIndex] = useState(0)

  useEffect(() => {
    if (!item) {
      return
    }

    setMediaIndex(0)
  }, [item?.id])

  useEffect(() => {
    if (!item) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onEscape)
    }
  }, [item, onClose])

  if (!item) {
    return null
  }

  const mediaItems = announcementMedia(item)
  const selectedMedia = mediaItems[mediaIndex] ?? null

  return (
    <div className="content-modal" role="dialog" aria-modal="true" aria-label={item.title}>
      <div className="content-modal-overlay" onClick={onClose} aria-hidden="true" />
      <section className="content-modal-panel panel">
        <header className="content-modal-header">
          <div>
            <p className="kicker">{formatAnnouncementDate(item.publishedAt)}</p>
            <h3>{item.title}</h3>
          </div>
          <button type="button" className="icon-btn" onClick={onClose}>
            <X size={14} />
            Close
          </button>
        </header>

        <p className="content-modal-copy">{item.body}</p>

        {selectedMedia ? <AnnouncementMediaModal media={selectedMedia} title={item.title} /> : null}

        {mediaItems.length > 1 ? (
          <div className="content-modal-thumbs">
            {mediaItems.map((media, index) => (
              <button
                key={`${item.id}-media-${index}`}
                type="button"
                className={index === mediaIndex ? 'content-modal-thumb active' : 'content-modal-thumb'}
                onClick={() => setMediaIndex(index)}
              >
                {media.type === 'video' ? (
                  <video muted playsInline preload="metadata" poster={media.posterUrl}>
                    <source src={media.url} />
                  </video>
                ) : (
                  <img src={media.url} alt={media.alt || `${item.title} media ${index + 1}`} loading="lazy" />
                )}
              </button>
            ))}
          </div>
        ) : null}

        <div className="content-modal-actions">
          {item.ctaLabel && item.ctaUrl ? (
            <a href={item.ctaUrl} target="_blank" rel="noopener noreferrer" className="btn btn-solid">
              {item.ctaLabel}
              <ExternalLink size={13} />
            </a>
          ) : null}
          <p className="source-note">Recommended media ratio: 16:9 (for example 1600x900).</p>
        </div>
      </section>
    </div>
  )
}

export function AnnouncementsSection({ announcements, maxItems = 3, headingLink }: AnnouncementsSectionProps) {
  const [activeItem, setActiveItem] = useState<AnnouncementItem | null>(null)
  const items = sortAnnouncements(announcements.items).slice(0, Math.max(1, maxItems))

  return (
    <>
      <section className="panel reveal announcements-panel">
        <div className="section-heading">
          {headingLink ? (
            <h2>
              <Link to={headingLink} className="section-heading-link">
                {announcements.heading}
              </Link>
            </h2>
          ) : (
            <h2>{announcements.heading}</h2>
          )}
          <p>{announcements.description}</p>
        </div>

        <div className="announcement-grid">
          {items.map((item) => (
            <AnnouncementCard key={item.id} item={item} onOpen={setActiveItem} />
          ))}
        </div>
      </section>

      <AnnouncementDetailModal item={activeItem} onClose={() => setActiveItem(null)} />
    </>
  )
}
