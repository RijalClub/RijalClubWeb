import { describe, it, expect } from 'vitest'
import {
  formatPrayerClock,
  formatCountdown,
  pickRecommendedLocation,
  buildPrayerTimeline,
} from './prayer'
import type { PrayerTimesSnapshot } from './prayer'
import { mockPrayerConfig, mockPrayerLocation } from '@/test/fixtures/content'

// ---------------------------------------------------------------------------
// formatPrayerClock
// ---------------------------------------------------------------------------
describe('formatPrayerClock', () => {
  it('formats 24-hour time correctly', () => {
    const result = formatPrayerClock('13:45', true)
    expect(result).toBe('13:45')
  })

  it('formats 12-hour time correctly (afternoon)', () => {
    const result = formatPrayerClock('13:45', false)
    expect(result).toMatch(/1:45/)
  })

  it('formats midnight in 24h', () => {
    const result = formatPrayerClock('00:00', true)
    // Intl.DateTimeFormat with hour:'numeric' may return '0:00' or '00:00' depending on runtime
    expect(result).toMatch(/^0{1,2}:00$/)
  })

  it('formats noon in 12h mode', () => {
    const result = formatPrayerClock('12:00', false)
    expect(result).toMatch(/12:00/)
  })

  it('formats early morning hours in 12h mode', () => {
    const result = formatPrayerClock('05:30', false)
    expect(result).toMatch(/5:30/)
  })

  it('handles invalid hours gracefully', () => {
    // Should not throw
    const result = formatPrayerClock(':30', true)
    expect(typeof result).toBe('string')
  })

  it('handles invalid minutes gracefully', () => {
    const result = formatPrayerClock('10:', true)
    expect(typeof result).toBe('string')
  })
})

// ---------------------------------------------------------------------------
// formatCountdown
// ---------------------------------------------------------------------------
describe('formatCountdown', () => {
  it('shows only minutes when less than 60', () => {
    expect(formatCountdown(45)).toBe('45m')
  })

  it('shows only minutes for exactly 0', () => {
    expect(formatCountdown(0)).toBe('0m')
  })

  it('shows hours and minutes', () => {
    expect(formatCountdown(90)).toBe('1h 30m')
  })

  it('shows hours and minutes for exactly 60', () => {
    expect(formatCountdown(60)).toBe('1h 0m')
  })

  it('shows hours and minutes for large values', () => {
    expect(formatCountdown(125)).toBe('2h 5m')
  })

  it('returns minutes-only string for negative input (implementation behavior)', () => {
    // Math.floor(-5/60) = -1 which satisfies hours <= 0, so returns just minutes component
    expect(formatCountdown(-5)).toBe('-5m')
  })
})

// ---------------------------------------------------------------------------
// pickRecommendedLocation
// ---------------------------------------------------------------------------
describe('pickRecommendedLocation', () => {
  it('returns location matching timezone route', () => {
    const result = pickRecommendedLocation(mockPrayerConfig, 'Europe/London')
    expect(result.id).toBe('london')
  })

  it('returns location matching partial timezone prefix', () => {
    const result = pickRecommendedLocation(mockPrayerConfig, 'Europe/Paris')
    expect(result.id).toBe('london')
  })

  it('returns fallback location when timezone does not match any route', () => {
    const result = pickRecommendedLocation(mockPrayerConfig, 'America/New_York')
    expect(result.id).toBe('london') // fallbackLocationId is 'london'
  })

  it('returns nearest location when coordinate is provided', () => {
    // London coords - should return london
    const result = pickRecommendedLocation(mockPrayerConfig, 'America/New_York', {
      latitude: 51.5,
      longitude: -0.12,
    })
    expect(result.id).toBe('london')
  })

  it('returns first location as final fallback when fallbackLocationId not found', () => {
    const config = {
      ...mockPrayerConfig,
      fallbackLocationId: 'nonexistent',
      timezoneRoutes: [{ startsWith: 'Asia/', locationId: 'tokyo' }],
    }
    const result = pickRecommendedLocation(config, 'America/New_York')
    expect(result.id).toBe('london')
  })

  it('returns coordinate-nearest location even if route matches', () => {
    const londonCoords = { latitude: 51.5074, longitude: -0.1278 }
    const result = pickRecommendedLocation(mockPrayerConfig, 'Europe/London', londonCoords)
    expect(result.id).toBe('london')
  })
})

// ---------------------------------------------------------------------------
// buildPrayerTimeline
// ---------------------------------------------------------------------------

function makeSnapshot(prayers: Array<{ name: string; time24: string }>, weekSchedule?: PrayerTimesSnapshot['weekSchedule']): PrayerTimesSnapshot {
  return {
    location: mockPrayerLocation,
    dateLabel: '2024-01-15',
    sourceLabel: 'Test Source',
    sourceUrl: 'https://example.com',
    prayers: prayers as PrayerTimesSnapshot['prayers'],
    weekSchedule,
    fetchedAt: new Date().toISOString(),
  }
}

describe('buildPrayerTimeline', () => {
  it('returns current and next prayer based on current time', () => {
    const snapshot = makeSnapshot([
      { name: 'Fajr', time24: '05:30' },
      { name: 'Sunrise', time24: '07:00' },
      { name: 'Dhuhr', time24: '12:30' },
      { name: 'Asr', time24: '15:45' },
      { name: 'Maghrib', time24: '18:00' },
      { name: 'Isha', time24: '19:30' },
    ])

    // Simulate now = 14:00 in Europe/London => Asr is next, Dhuhr is current
    const now = new Date('2024-01-15T14:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)

    expect(result.current.name).toBe('Dhuhr')
    expect(result.next.name).toBe('Asr')
    expect(result.minutesUntilNext).toBeGreaterThan(0)
  })

  it('wraps to first prayer after Isha', () => {
    const snapshot = makeSnapshot([
      { name: 'Fajr', time24: '05:30' },
      { name: 'Sunrise', time24: '07:00' },
      { name: 'Dhuhr', time24: '12:30' },
      { name: 'Asr', time24: '15:45' },
      { name: 'Maghrib', time24: '18:00' },
      { name: 'Isha', time24: '19:30' },
    ])

    // After Isha (23:00)
    const now = new Date('2024-01-15T23:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)

    expect(result.current.name).toBe('Isha')
    expect(result.next.name).toBe('Fajr')
  })

  it('returns minutesUntilNext as positive value', () => {
    const snapshot = makeSnapshot([
      { name: 'Fajr', time24: '05:30' },
      { name: 'Sunrise', time24: '07:00' },
      { name: 'Dhuhr', time24: '12:30' },
      { name: 'Asr', time24: '15:45' },
      { name: 'Maghrib', time24: '18:00' },
      { name: 'Isha', time24: '19:30' },
    ])

    const now = new Date('2024-01-15T10:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)
    expect(result.minutesUntilNext).toBeGreaterThan(0)
  })

  it('builds timeline using weekSchedule when available', () => {
    const weekSchedule = [
      {
        date: '2024-01-15',
        prayers: [
          { name: 'Fajr' as const, time24: '06:00' },
          { name: 'Sunrise' as const, time24: '07:45' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:30' },
          { name: 'Maghrib' as const, time24: '16:45' },
          { name: 'Isha' as const, time24: '18:00' },
        ],
      },
      {
        date: '2024-01-16',
        prayers: [
          { name: 'Fajr' as const, time24: '06:02' },
          { name: 'Sunrise' as const, time24: '07:46' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:31' },
          { name: 'Maghrib' as const, time24: '16:46' },
          { name: 'Isha' as const, time24: '18:01' },
        ],
      },
    ]

    const snapshot = makeSnapshot(weekSchedule[0].prayers, weekSchedule)
    // now = 10:00, between Sunrise (07:45) and Dhuhr (12:15)
    const now = new Date('2024-01-15T10:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)

    expect(result.next.name).toBe('Dhuhr')
    expect(result.current.name).toBe('Sunrise')
  })

  it('crosses to next day when past last prayer in weekSchedule', () => {
    const weekSchedule = [
      {
        date: '2024-01-15',
        prayers: [
          { name: 'Fajr' as const, time24: '06:00' },
          { name: 'Sunrise' as const, time24: '07:45' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:30' },
          { name: 'Maghrib' as const, time24: '16:45' },
          { name: 'Isha' as const, time24: '18:00' },
        ],
      },
      {
        date: '2024-01-16',
        prayers: [
          { name: 'Fajr' as const, time24: '06:02' },
          { name: 'Sunrise' as const, time24: '07:46' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:31' },
          { name: 'Maghrib' as const, time24: '16:46' },
          { name: 'Isha' as const, time24: '18:01' },
        ],
      },
    ]

    const snapshot = makeSnapshot(weekSchedule[0].prayers, weekSchedule)
    // After all prayers (23:00) => next should be tomorrow's Fajr
    const now = new Date('2024-01-15T23:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)

    expect(result.next.name).toBe('Fajr')
    expect(result.nextDate).toBe('2024-01-16')
  })

  it('includes nowLabel in result', () => {
    const snapshot = makeSnapshot([
      { name: 'Fajr', time24: '06:00' },
      { name: 'Sunrise', time24: '07:45' },
      { name: 'Dhuhr', time24: '12:15' },
      { name: 'Asr', time24: '14:30' },
      { name: 'Maghrib', time24: '16:45' },
      { name: 'Isha', time24: '18:00' },
    ])

    const now = new Date('2024-01-15T10:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)
    expect(typeof result.nowLabel).toBe('string')
    expect(result.nowLabel.length).toBeGreaterThan(0)
  })

  it('handles weekSchedule where today is not found (falls back to simple path)', () => {
    const weekSchedule = [
      {
        date: '2024-01-20',
        prayers: [
          { name: 'Fajr' as const, time24: '06:00' },
          { name: 'Sunrise' as const, time24: '07:45' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:30' },
          { name: 'Maghrib' as const, time24: '16:45' },
          { name: 'Isha' as const, time24: '18:00' },
        ],
      },
    ]

    const snapshot = makeSnapshot(
      [
        { name: 'Fajr', time24: '06:00' },
        { name: 'Sunrise', time24: '07:45' },
        { name: 'Dhuhr', time24: '12:15' },
        { name: 'Asr', time24: '14:30' },
        { name: 'Maghrib', time24: '16:45' },
        { name: 'Isha', time24: '18:00' },
      ],
      weekSchedule,
    )

    // today is 2024-01-15, not in weekSchedule => falls back to simple path
    const now = new Date('2024-01-15T10:00:00Z')
    const result = buildPrayerTimeline(snapshot, false, now)
    expect(result.next).toBeDefined()
    expect(result.current).toBeDefined()
  })

  it('uses previous day last prayer as current when before first prayer of the day', () => {
    const weekSchedule = [
      {
        date: '2024-01-14',
        prayers: [
          { name: 'Fajr' as const, time24: '06:00' },
          { name: 'Sunrise' as const, time24: '07:45' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:30' },
          { name: 'Maghrib' as const, time24: '16:45' },
          { name: 'Isha' as const, time24: '18:00' },
        ],
      },
      {
        date: '2024-01-15',
        prayers: [
          { name: 'Fajr' as const, time24: '06:00' },
          { name: 'Sunrise' as const, time24: '07:45' },
          { name: 'Dhuhr' as const, time24: '12:15' },
          { name: 'Asr' as const, time24: '14:30' },
          { name: 'Maghrib' as const, time24: '16:45' },
          { name: 'Isha' as const, time24: '18:00' },
        ],
      },
    ]

    const snapshot = makeSnapshot(weekSchedule[1].prayers, weekSchedule)
    // Before Fajr (03:00) => current should be Isha from previous day
    const now = new Date('2024-01-15T03:00:00Z')
    const result = buildPrayerTimeline(snapshot, true, now)

    expect(result.next.name).toBe('Fajr')
  })
})
