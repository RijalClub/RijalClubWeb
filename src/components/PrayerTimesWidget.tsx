import { CalendarDays, LocateFixed, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  buildPrayerTimeline,
  formatPrayerClock,
  formatCountdown,
  loadPrayerTimesForLocation,
  pickRecommendedLocation,
  type PrayerTimeline,
  type PrayerTimesSnapshot,
} from '@/lib/prayer'
import type { PrayerCacheConfig, PrayerConfig } from '@/types/content'

interface PrayerTimesWidgetProps {
  config: PrayerConfig
  cache: PrayerCacheConfig
  onPrayerDataChange?: (snapshot: PrayerTimesSnapshot | null, timeline: PrayerTimeline | null) => void
}

interface GeoCoordinate {
  latitude: number
  longitude: number
}

const LAST_DEVICE_COORDS_KEY = 'rijal:prayer:last-device-coords'

function loadStoredDeviceCoords(): GeoCoordinate | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const raw = window.localStorage.getItem(LAST_DEVICE_COORDS_KEY)
    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw) as unknown
    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    const latitude = Number((parsed as Record<string, unknown>).latitude)
    const longitude = Number((parsed as Record<string, unknown>).longitude)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null
    }

    return { latitude, longitude }
  } catch {
    return null
  }
}

function formatPrayerDateLabel(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return dateKey
  }

  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(parsed)
}

export function PrayerTimesWidget({ config, cache, onPrayerDataChange }: PrayerTimesWidgetProps) {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC', [])
  const storedCoords = useMemo(() => loadStoredDeviceCoords(), [])

  const defaultLocation = useMemo(
    () => pickRecommendedLocation(config, timezone, storedCoords ?? undefined),
    [config, timezone, storedCoords],
  )

  const [selectedLocationId, setSelectedLocationId] = useState(() => defaultLocation.id)
  const [snapshot, setSnapshot] = useState<PrayerTimesSnapshot | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [clockTick, setClockTick] = useState(0)
  const [selectedWeekDate, setSelectedWeekDate] = useState<string | null>(null)
  const [deviceCoords, setDeviceCoords] = useState<GeoCoordinate | null>(storedCoords)
  const [useDeviceCoords, setUseDeviceCoords] = useState(Boolean(storedCoords))
  const [use24Hour, setUse24Hour] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }

    return window.localStorage.getItem('rijal:prayer:clock24') === 'true'
  })

  const selectedLocation = useMemo(
    () =>
      config.locations.find((location) => location.id === selectedLocationId) ??
      defaultLocation,
    [config.locations, defaultLocation, selectedLocationId],
  )

  const adhanCoordinateOverride = useMemo(() => {
    if (!useDeviceCoords || !deviceCoords) {
      return undefined
    }

    return {
      latitude: deviceCoords.latitude,
      longitude: deviceCoords.longitude,
    }
  }, [deviceCoords, useDeviceCoords])

  const reloadTimes = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await loadPrayerTimesForLocation(selectedLocation, {
        iccukMs: Math.max(1, cache.londonFeedMinutes) * 60_000,
        adhanMs: Math.max(1, cache.aladhanMinutes) * 60_000,
      }, adhanCoordinateOverride)
      setSnapshot(result)
      setErrorMessage(null)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load prayer times right now.')
    } finally {
      setIsLoading(false)
    }
  }, [adhanCoordinateOverride, cache.aladhanMinutes, cache.londonFeedMinutes, selectedLocation])

  useEffect(() => {
    void reloadTimes()

    const interval = window.setInterval(() => {
      void reloadTimes()
    }, config.refreshMinutes * 60_000)

    return () => window.clearInterval(interval)
  }, [config.refreshMinutes, reloadTimes])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setClockTick((value) => value + 1)
    }, 30_000)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('rijal:prayer:clock24', String(use24Hour))
  }, [use24Hour])

  useEffect(() => {
    if (typeof window === 'undefined' || !deviceCoords) {
      return
    }

    window.localStorage.setItem(LAST_DEVICE_COORDS_KEY, JSON.stringify(deviceCoords))
  }, [deviceCoords])

  const timeline = useMemo(() => {
    if (!snapshot) {
      return null
    }

    return buildPrayerTimeline(snapshot, use24Hour)
  }, [snapshot, clockTick, use24Hour])

  useEffect(() => {
    if (!onPrayerDataChange) {
      return
    }

    onPrayerDataChange(snapshot, timeline)
  }, [onPrayerDataChange, snapshot, timeline])

  const weekSchedule = snapshot?.weekSchedule ?? []

  useEffect(() => {
    if (weekSchedule.length === 0) {
      setSelectedWeekDate(null)
      return
    }

    setSelectedWeekDate((current) => {
      if (current && weekSchedule.some((day) => day.date === current)) {
        return current
      }

      const defaultDate = weekSchedule.find((day) => day.date === timeline?.nextDate)?.date
        ?? weekSchedule.find((day) => day.date === snapshot?.dateLabel)?.date
      return defaultDate ?? weekSchedule[0].date
    })
  }, [snapshot?.dateLabel, timeline?.nextDate, weekSchedule])

  const selectedWeekDay = useMemo(() => {
    if (weekSchedule.length === 0 || !selectedWeekDate) {
      return null
    }

    return weekSchedule.find((day) => day.date === selectedWeekDate) ?? weekSchedule[0]
  }, [selectedWeekDate, weekSchedule])

  const displayedPrayers = selectedWeekDay?.prayers ?? snapshot?.prayers ?? []
  const displayedDate = selectedWeekDay?.date ?? snapshot?.dateLabel

  const handleUseLocation = (): void => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not available in this browser.')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }

        const nearest = pickRecommendedLocation(config, timezone, {
          latitude: coords.latitude,
          longitude: coords.longitude,
        })

        setDeviceCoords(coords)
        setUseDeviceCoords(true)
        setSelectedLocationId(nearest.id)
        setErrorMessage(null)
        setIsLocating(false)
      },
      () => {
        setErrorMessage('Could not access your location. Using timezone-based fallback instead.')
        setIsLocating(false)
      },
      {
        timeout: 8_000,
      },
    )
  }

  return (
    <section className="panel reveal prayer-panel">
      <div className="section-heading prayer-heading">
        <h2>{config.widgetTitle}</h2>
        <div className="prayer-controls">
          <button type="button" className="icon-btn" onClick={() => void reloadTimes()} aria-label="Refresh prayer times">
            <RefreshCw size={14} />
          </button>
          <button type="button" className="icon-btn" onClick={handleUseLocation} disabled={isLocating}>
            <LocateFixed size={14} />
            {isLocating ? 'Locating…' : 'Use location'}
          </button>
          <div className="clock-toggle" role="group" aria-label="Time format">
            <button
              type="button"
              className={use24Hour ? 'clock-toggle-btn' : 'clock-toggle-btn active'}
              onClick={() => setUse24Hour(false)}
            >
              AM/PM
            </button>
            <button
              type="button"
              className={use24Hour ? 'clock-toggle-btn active' : 'clock-toggle-btn'}
              onClick={() => setUse24Hour(true)}
            >
              24h
            </button>
          </div>
        </div>
      </div>

      <label className="select-wrap" htmlFor="prayer-location-select">
        Mosque/profile
        <select
          id="prayer-location-select"
          value={selectedLocation.id}
          onChange={(event) => {
            setSelectedLocationId(event.target.value)
            setUseDeviceCoords(false)
          }}
        >
          {config.locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.label}
            </option>
          ))}
        </select>
      </label>

      {isLoading ? <p className="state-text">Loading prayer times…</p> : null}
      {errorMessage ? <p className="state-text error">{errorMessage}</p> : null}

      {snapshot ? (
        <>
          <p className="source-note">
            Source: <a href={snapshot.sourceUrl}>{snapshot.sourceLabel}</a>
          </p>
          <p className="source-note">Date: {snapshot.dateLabel}</p>

          {timeline ? (
            <div className="prayer-callout">
              <p>
                Now: <strong>{timeline.current.name}</strong> ({formatPrayerClock(timeline.current.time24, use24Hour)})
              </p>
              <p>
                Next: <strong>{timeline.next.name}</strong> ({formatPrayerClock(timeline.next.time24, use24Hour)}) in{' '}
                <strong>{formatCountdown(timeline.minutesUntilNext)}</strong>
              </p>
              <small>{timeline.nowLabel}</small>
            </div>
          ) : null}

          {weekSchedule.length > 1 ? (
            <div className="prayer-week-panel">
              <p className="kicker">
                <CalendarDays size={14} />
                7-Day Outlook
              </p>
              <div className="prayer-week-tabs">
                {weekSchedule.map((day) => (
                  <button
                    key={day.date}
                    type="button"
                    className={day.date === selectedWeekDay?.date ? 'prayer-week-chip active' : 'prayer-week-chip'}
                    onClick={() => setSelectedWeekDate(day.date)}
                  >
                    {formatPrayerDateLabel(day.date)}
                  </button>
                ))}
              </div>
              {selectedWeekDay ? (
                <p className="source-note">
                  Viewing: {formatPrayerDateLabel(selectedWeekDay.date)} ({selectedWeekDay.date})
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="prayer-grid">
            {displayedPrayers.map((prayer) => (
              <article
                key={prayer.name}
                className={
                  timeline?.nextDate === displayedDate &&
                  timeline?.next.name === prayer.name &&
                  timeline?.next.time24 === prayer.time24
                    ? 'prayer-row highlight'
                    : 'prayer-row'
                }
              >
                <span>{prayer.name}</span>
                <strong>{formatPrayerClock(prayer.time24, use24Hour)}</strong>
              </article>
            ))}
          </div>
        </>
      ) : null}

      <ul className="notes-list">
        {config.notes.map((note) => (
          <li key={note}>{note}</li>
        ))}
      </ul>
    </section>
  )
}
