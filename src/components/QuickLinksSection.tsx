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
import { useEffect, useMemo, useRef, useState } from 'react'

import { formatCountdown, formatPrayerClock, type PrayerTimeline, type PrayerTimesSnapshot } from '@/lib/prayer'
import type { LinksConfig, ResourceSectionIcon } from '@/types/content'

interface QuickLinksSectionProps {
  links: LinksConfig
  prayerSnapshot: PrayerTimesSnapshot | null
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

const ADHAN_ALERT_ENABLED_KEY = 'rijal:adhan-alert:enabled'
const ADHAN_ALERT_LAST_PLAYED_KEY = 'rijal:adhan-alert:last-played'
const PRAYER_CLOCK_24_KEY = 'rijal:prayer:clock24'

function getDateKeyInTimezone(timezone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone,
  }).formatToParts(now)

  const year = parts.find((part) => part.type === 'year')?.value ?? '1970'
  const month = parts.find((part) => part.type === 'month')?.value ?? '01'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

function getNowSecondsInTimezone(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(now)

  const hours = Number.parseInt(parts.find((part) => part.type === 'hour')?.value ?? '0', 10)
  const minutes = Number.parseInt(parts.find((part) => part.type === 'minute')?.value ?? '0', 10)
  const seconds = Number.parseInt(parts.find((part) => part.type === 'second')?.value ?? '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

function parsePrayerSeconds(time24: string): number {
  const [hoursRaw, minutesRaw] = time24.split(':')
  const hours = Number.parseInt(hoursRaw, 10)
  const minutes = Number.parseInt(minutesRaw, 10)

  return (Number.isNaN(hours) ? 0 : hours) * 3600 + (Number.isNaN(minutes) ? 0 : minutes) * 60
}

function findDuePrayer(snapshot: PrayerTimesSnapshot, windowSeconds: number, now = new Date()) {
  const todayKey = getDateKeyInTimezone(snapshot.location.timezone, now)
  const todaySchedule = snapshot.weekSchedule?.find((day) => day.date === todayKey)
  if (!todaySchedule) {
    return null
  }

  const nowSeconds = getNowSecondsInTimezone(snapshot.location.timezone, now)
  const due = todaySchedule.prayers.find((prayer) => {
    const delta = nowSeconds - parsePrayerSeconds(prayer.time24)
    return delta >= 0 && delta <= windowSeconds
  })

  if (!due) {
    return null
  }

  return {
    date: todaySchedule.date,
    prayer: due,
  }
}

export function QuickLinksSection({ links, prayerSnapshot, prayerTimeline }: QuickLinksSectionProps) {
  const adhanAlert = links.adhanAlert
  const [clockTick, setClockTick] = useState(0)
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [use24HourClock, setUse24HourClock] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem(PRAYER_CLOCK_24_KEY) === 'true'
  })
  const [isAdhanAlertEnabled, setIsAdhanAlertEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return adhanAlert?.enabled ?? true
    }

    const stored = window.localStorage.getItem(ADHAN_ALERT_ENABLED_KEY)
    if (!stored) {
      return adhanAlert?.enabled ?? true
    }

    return stored === 'true'
  })

  const duePrayer = useMemo(() => {
    if (!adhanAlert?.enabled || !prayerSnapshot || !isAdhanAlertEnabled) {
      return null
    }

    return findDuePrayer(prayerSnapshot, adhanAlert.autoPlayWindowSeconds)
  }, [adhanAlert, clockTick, isAdhanAlertEnabled, prayerSnapshot])

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

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick((value) => value + 1), 10_000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    setUse24HourClock(window.localStorage.getItem(PRAYER_CLOCK_24_KEY) === 'true')
  }, [clockTick])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem(ADHAN_ALERT_ENABLED_KEY, String(isAdhanAlertEnabled))
  }, [isAdhanAlertEnabled])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const onPlay = (): void => setIsAudioPlaying(true)
    const onPause = (): void => setIsAudioPlaying(false)
    const onEnded = (): void => setIsAudioPlaying(false)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [])

  useEffect(() => {
    if (!adhanAlert?.enabled || !duePrayer || !isAdhanAlertEnabled) {
      return
    }

    const audio = audioRef.current
    if (!audio) {
      return
    }

    const marker = `${prayerSnapshot?.location.id}:${duePrayer.date}:${duePrayer.prayer.name}`
    if (typeof window !== 'undefined' && window.localStorage.getItem(ADHAN_ALERT_LAST_PLAYED_KEY) === marker) {
      return
    }

    audio.currentTime = 0
    void audio
      .play()
      .then(() => {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(ADHAN_ALERT_LAST_PLAYED_KEY, marker)
        }
        setStatusMessage(`Adhan started for ${duePrayer.prayer.name}.`)
      })
      .catch(() => {
        setStatusMessage('Autoplay is blocked by browser. Tap play once to allow audio alerts.')
      })
  }, [adhanAlert?.enabled, duePrayer, isAdhanAlertEnabled, prayerSnapshot?.location.id])

  const handleManualAudioToggle = (): void => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (isAudioPlaying) {
      audio.pause()
      setStatusMessage('Adhan audio paused.')
      return
    }

    audio.currentTime = 0
    void audio
      .play()
      .then(() => {
        setStatusMessage('Adhan audio playing.')
      })
      .catch(() => {
        setStatusMessage('Audio could not start. Check browser sound/autoplay permissions.')
      })
  }

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
            <button type="button" className="icon-btn" onClick={handleManualAudioToggle}>
              {isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isAudioPlaying ? 'Pause adhan' : 'Play adhan'}
            </button>
            <small className="source-note">Auto-play window: {adhanAlert.autoPlayWindowSeconds}s from each prayer start.</small>
          </div>
          {statusMessage ? <p className="source-note">{statusMessage}</p> : null}
          <audio ref={audioRef} src={adhanAlert.audioUrl} preload="none" />
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
