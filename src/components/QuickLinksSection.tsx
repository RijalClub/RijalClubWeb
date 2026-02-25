import {
  BookOpen,
  Brain,
  Handshake,
  Pause,
  Play,
  ExternalLink,
  HandHeart,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  PlayCircle,
  Radio,
  Youtube,
} from 'lucide-react'
import { useMemo } from 'react'

import { formatCountdown, formatPrayerClock, type PrayerTimeline } from '@/lib/prayer'
import type { LinksConfig, ResourceSectionIcon } from '@/types/content'
import { useAdhanAlert } from '@/components/AdhanAlertProvider'

interface QuickLinksSectionProps {
  links: LinksConfig
  prayerTimeline: PrayerTimeline | null
}

const iconMap = {
  whatsapp: MessageCircle,
  class: BookOpen,
  instagram: Instagram,
  donate: HandHeart,
  youtube: Youtube,
  tiktok: PlayCircle,
  default: LinkIcon,
}

const resourceSectionIconMap: Record<ResourceSectionIcon, typeof BookOpen> = {
  'book-open': BookOpen,
  brain: Brain,
  handshake: Handshake,
  'hand-heart': HandHeart,
  'message-circle': MessageCircle,
  'play-circle': PlayCircle,
  link: LinkIcon,
}

export function QuickLinksSection({ links, prayerTimeline }: QuickLinksSectionProps) {
  const adhanAlert = links.adhanAlert
  const {
    isAdhanAlertEnabled,
    setIsAdhanAlertEnabled,
    isAudioPlaying,
    toggleAudioPlayback,
    statusMessage,
    use24HourClock,
  } = useAdhanAlert()

  const groupedResources = useMemo(() => {
    const groups = new Map<string, NonNullable<LinksConfig['resources']>>()
    for (const section of links.resourceSections ?? []) {
      groups.set(section.id, [])
    }

    for (const resource of links.resources ?? []) {
      const existing = groups.get(resource.sectionId) ?? []
      groups.set(resource.sectionId, [...existing, resource])
    }

    return groups
  }, [links.resourceSections, links.resources])

  return (
    <section className="panel reveal link-panel">
      <div className="section-heading">
        <h2>{links.heading}</h2>
        <p>{links.description}</p>
      </div>

      <div className="quick-links-grid">
        {links.quickLinks.map((link) => {
          const Icon = iconMap[link.icon as keyof typeof iconMap] ?? iconMap.default

          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={link.featured ? 'quick-link featured' : 'quick-link'}
            >
              <span className="quick-link-icon">
                <Icon size={18} />
              </span>
              <span className="quick-link-content">
                <strong>{link.title}</strong>
                <small>{link.subtitle}</small>
              </span>
              <ExternalLink size={16} />
            </a>
          )
        })}
      </div>

      <div className="social-strip">
        {links.socials.map((social) => (
          <a key={social.platform} href={social.url} target="_blank" rel="noopener noreferrer" className="social-pill">
            {social.platform}
          </a>
        ))}
      </div>

      {adhanAlert?.enabled ? (
        <section className="adhan-alert-card">
          <header className="adhan-alert-header">
            <p className="kicker">
              <Radio size={14} />
              {adhanAlert.title}
            </p>
            <label className="tick-option">
              <input
                type="checkbox"
                checked={isAdhanAlertEnabled}
                onChange={(event) => setIsAdhanAlertEnabled(event.target.checked)}
              />
              <span>Alert on</span>
            </label>
          </header>
          <p className="source-note">{adhanAlert.description}</p>
          {prayerTimeline ? (
            <p className="source-note">
              Next: <strong>{prayerTimeline.next.name}</strong> at {formatPrayerClock(prayerTimeline.next.time24, use24HourClock)} in{' '}
              <strong>{formatCountdown(prayerTimeline.minutesUntilNext)}</strong>
            </p>
          ) : null}
          <div className="adhan-alert-actions">
            <button type="button" className="icon-btn" onClick={toggleAudioPlayback}>
              {isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isAudioPlaying ? 'Pause adhan' : 'Play adhan'}
            </button>
            <small className="source-note">Auto-play window: {adhanAlert.autoPlayWindowSeconds}s from each prayer start.</small>
          </div>
          {statusMessage ? <p className="source-note">{statusMessage}</p> : null}
        </section>
      ) : null}

      {links.resources && links.resources.length > 0 ? (
        <section className="resource-sections">
          {(links.resourceSections ?? []).map((section) => {
            const items = groupedResources.get(section.id) ?? []
            if (items.length === 0) {
              return null
            }

            const Icon = resourceSectionIconMap[section.icon] ?? BookOpen
            return (
              <article key={section.id} className="resource-group">
                <p className="kicker">
                  <Icon size={14} />
                  {section.title}
                </p>
                {section.description ? <p className="source-note">{section.description}</p> : null}
                <div className="resource-grid">
                  {items.map((resource) => (
                    <a key={resource.id} href={resource.url} target="_blank" rel="noopener noreferrer" className="resource-link">
                      <span>
                        <strong>{resource.title}</strong>
                        <small>{resource.subtitle}</small>
                      </span>
                      <ExternalLink size={15} />
                    </a>
                  ))}
                </div>
              </article>
            )
          })}
        </section>
      ) : null}
    </section>
  )
}
