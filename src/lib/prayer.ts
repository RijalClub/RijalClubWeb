import { CalculationMethod, Coordinates, HighLatitudeRule, Madhab, PrayerTimes } from 'adhan'

import type { PrayerConfig, PrayerLocation, PrayerName } from '@/types/content'
import { fetchJsonWithCache, fetchTextWithCache } from '@/lib/fetchCache'

const prayerNames: PrayerName[] = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']
const DEFAULT_CACHE_TTL_MS = 10 * 60 * 1000

export interface PrayerCacheTtlMs {
  iccukMs: number
  adhanMs: number
}

const prayerNameLookup: Record<string, PrayerName> = {
  fajr: 'Fajr',
  sunrise: 'Sunrise',
  zuhr: 'Dhuhr',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
}

export interface PrayerSlot {
  name: PrayerName
  time24: string
}

export interface PrayerDaySchedule {
  date: string
  prayers: PrayerSlot[]
}

export interface PrayerTimesSnapshot {
  location: PrayerLocation
  dateLabel: string
  sourceLabel: string
  sourceUrl: string
  prayers: PrayerSlot[]
  weekSchedule?: PrayerDaySchedule[]
  fetchedAt: string
}

export interface PrayerTimeline {
  current: PrayerSlot
  next: PrayerSlot
  currentDate?: string
  nextDate?: string
  nowLabel: string
  minutesUntilNext: number
}

export interface Coordinate {
  latitude: number
  longitude: number
}

interface LondonUnifiedDay {
  date: string
  fajr?: string
  sunrise?: string
  dhuhr?: string
  asr?: string
  maghrib?: string
  magrib?: string
  isha?: string
}

interface LondonUnifiedPayload {
  days?: LondonUnifiedDay[]
}

function normalisePrayerName(raw: string): PrayerName | null {
  const key = raw.trim().toLowerCase()
  return prayerNameLookup[key] ?? null
}

function toTime24(rawTime: string): string {
  const cleaned = rawTime.replace(/[^\d:.]/g, '').replace('.', ':')
  const [hoursRaw, minutesRaw = '00'] = cleaned.split(':')

  if (!hoursRaw) {
    return '00:00'
  }

  const hours = Number.parseInt(hoursRaw, 10)
  const minutes = Number.parseInt(minutesRaw, 10)

  return `${String(Number.isNaN(hours) ? 0 : hours).padStart(2, '0')}:${String(Number.isNaN(minutes) ? 0 : minutes).padStart(2, '0')}`
}

function toMinutes(time24: string): number {
  const [hoursRaw, minutesRaw] = time24.split(':')
  const hours = Number.parseInt(hoursRaw, 10)
  const minutes = Number.parseInt(minutesRaw, 10)

  return (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes)
}

function addMinutes(time24: string, delta: number): string {
  const minutesPerDay = 24 * 60
  const adjusted = (toMinutes(time24) + delta + minutesPerDay) % minutesPerDay
  const hours = Math.floor(adjusted / 60)
  const minutes = adjusted % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function stripTags(raw: string): string {
  return raw.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
}

function extractParagraphs(html: string, containerId: string): string[] {
  const pattern = new RegExp(`<div id="${containerId}">([\\s\\S]*?)<\\/div>`, 'i')
  const match = html.match(pattern)

  if (!match) {
    return []
  }

  return [...match[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((item) => stripTags(item[1]))
    .filter(Boolean)
}

function getNowMinutesInTimezone(timezone: string, now: Date): number {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(now)

  const hours = Number.parseInt(formatted.find((part) => part.type === 'hour')?.value ?? '0', 10)
  const minutes = Number.parseInt(formatted.find((part) => part.type === 'minute')?.value ?? '0', 10)

  return hours * 60 + minutes
}

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

function getLocalDateKey(now: Date): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function parseDateKey(dateKey: string): { year: number; month: number; day: number } | null {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split('-')
  const year = Number.parseInt(yearRaw, 10)
  const month = Number.parseInt(monthRaw, 10)
  const day = Number.parseInt(dayRaw, 10)

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  return { year, month, day }
}

function addDaysToDateKey(dateKey: string, offsetDays: number): string {
  const parsed = parseDateKey(dateKey)
  if (!parsed) {
    return dateKey
  }

  const base = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day))
  base.setUTCDate(base.getUTCDate() + offsetDays)

  return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}-${String(base.getUTCDate()).padStart(2, '0')}`
}

function toTime24InTimezone(value: Date, timezone: string): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return '00:00'
  }

  const parts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  }).formatToParts(value)

  const hours = parts.find((part) => part.type === 'hour')?.value
  const minutes = parts.find((part) => part.type === 'minute')?.value

  if (!hours || !minutes) {
    return '00:00'
  }

  return `${hours}:${minutes}`
}

const adhanCalculationFactories = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  Karachi: CalculationMethod.Karachi,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Dubai: CalculationMethod.Dubai,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Kuwait: CalculationMethod.Kuwait,
  Qatar: CalculationMethod.Qatar,
  Singapore: CalculationMethod.Singapore,
  Tehran: CalculationMethod.Tehran,
  Turkey: CalculationMethod.Turkey,
  Other: CalculationMethod.Other,
} as const

function resolveAdhanHighLatitudeRule(location: PrayerLocation, coordinates: Coordinates) {
  switch (location.adhanHighLatitudeRule ?? 'recommended') {
    case 'middleofthenight':
      return HighLatitudeRule.MiddleOfTheNight
    case 'seventhofthenight':
      return HighLatitudeRule.SeventhOfTheNight
    case 'twilightangle':
      return HighLatitudeRule.TwilightAngle
    case 'recommended':
    default:
      return HighLatitudeRule.recommended(coordinates)
  }
}

function getNowLabelInTimezone(timezone: string, now: Date, use24Hour: boolean): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: !use24Hour,
    timeZone: timezone,
  }).format(now)
}

export function formatPrayerClock(time24: string, use24Hour: boolean): string {
  const [hoursRaw, minutesRaw] = time24.split(':')
  const hours = Number.parseInt(hoursRaw, 10)
  const minutes = Number.parseInt(minutesRaw, 10)

  const baseDate = new Date(2024, 0, 1, Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)

  return new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24Hour,
  }).format(baseDate)
}

function haversineDistanceKm(a: Coordinate, b: Coordinate): number {
  const toRadians = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const latDelta = toRadians(b.latitude - a.latitude)
  const lonDelta = toRadians(b.longitude - a.longitude)

  const calc =
    Math.sin(latDelta / 2) * Math.sin(latDelta / 2) +
    Math.cos(toRadians(a.latitude)) * Math.cos(toRadians(b.latitude)) * Math.sin(lonDelta / 2) * Math.sin(lonDelta / 2)

  const angle = 2 * Math.atan2(Math.sqrt(calc), Math.sqrt(1 - calc))

  return earthRadiusKm * angle
}

function nearestLocation(locations: PrayerLocation[], coordinate: Coordinate): PrayerLocation {
  let winner = locations[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (const location of locations) {
    const distance = haversineDistanceKm(coordinate, {
      latitude: location.latitude,
      longitude: location.longitude,
    })

    if (distance < bestDistance) {
      bestDistance = distance
      winner = location
    }
  }

  return winner
}

function buildIccukFeedRequest(location: PrayerLocation, now = new Date()): { url: string; dateKey: string } {
  const dateKey = getDateKeyInTimezone(location.timezone, now)

  if (!location.proxyUrlTemplate) {
    return {
      url: location.officialSourceUrl,
      dateKey,
    }
  }

  return {
    url: location.proxyUrlTemplate
      .replaceAll('{url}', encodeURIComponent(location.officialSourceUrl))
      .replaceAll('{date}', dateKey),
    dateKey,
  }
}

export function pickRecommendedLocation(config: PrayerConfig, timezone: string, coordinate?: Coordinate): PrayerLocation {
  if (coordinate) {
    return nearestLocation(config.locations, coordinate)
  }

  for (const route of config.timezoneRoutes) {
    if (timezone.startsWith(route.startsWith)) {
      const match = config.locations.find((location) => location.id === route.locationId)
      if (match) {
        return match
      }
    }
  }

  return (
    config.locations.find((location) => location.id === config.fallbackLocationId) ??
    config.locations[0]
  )
}

async function loadIccukTimes(location: PrayerLocation, ttlMs: number): Promise<PrayerTimesSnapshot> {
  const request = buildIccukFeedRequest(location)

  const html = await fetchTextWithCache(request.url, {
    ttlMs,
    cacheKey: `prayer:iccuk:${location.id}:${request.dateKey}`,
    allowStaleOnError: true,
    headers: {
      Accept: 'text/html,application/xhtml+xml',
    },
  })
  const names = extractParagraphs(html, 'adWrapPrayTimesCol1')
  const rawTimes = extractParagraphs(html, 'adWrapPrayTimesCol2')

  const mapped = names
    .map((name, index) => {
      const normalisedName = normalisePrayerName(name)
      const rawTime = rawTimes[index]

      if (!normalisedName || !rawTime) {
        return null
      }

      return {
        name: normalisedName,
        time24: toTime24(rawTime),
      }
    })
    .filter((entry): entry is PrayerSlot => Boolean(entry))

  if (mapped.length < prayerNames.length - 1) {
    throw new Error('Official mosque feed returned an unexpected prayer format')
  }

  const dateMatch = html.match(/<p class="prayerSubTitle"><font[^>]*>([^<]+)<\/font><\/p>/i)

  return {
    location,
    dateLabel: dateMatch?.[1]?.trim() ?? 'Today',
    sourceLabel: location.officialSourceLabel,
    sourceUrl: location.officialSourceUrl,
    prayers: mapped,
    fetchedAt: new Date().toISOString(),
  }
}

function pickLondonDayByLocalDate(days: LondonUnifiedDay[], now: Date): LondonUnifiedDay | null {
  if (!days.length) {
    return null
  }

  const dateKey = getLocalDateKey(now)
  const exact = days.find((day) => day.date === dateKey)
  if (exact) {
    return exact
  }

  const upcoming = days
    .filter((day) => day.date >= dateKey)
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  return upcoming ?? days[0]
}

function requiredTime(day: LondonUnifiedDay, prayer: PrayerName): string {
  switch (prayer) {
    case 'Fajr':
      return day.fajr ?? ''
    case 'Sunrise':
      return day.sunrise ?? ''
    case 'Dhuhr':
      return day.dhuhr ?? ''
    case 'Asr':
      return day.asr ?? ''
    case 'Maghrib':
      return day.maghrib ?? day.magrib ?? ''
    case 'Isha':
      return day.isha ?? ''
    default:
      return ''
  }
}

function buildLondonDayPrayers(day: LondonUnifiedDay, location: PrayerLocation): PrayerSlot[] {
  return prayerNames.map((name) => {
    const raw = requiredTime(day, name)
    const offset = location.adjustments?.[name] ?? 0

    return {
      name,
      time24: addMinutes(toTime24(raw), offset),
    }
  })
}

async function loadLondonUnified7dTimes(location: PrayerLocation, ttlMs: number): Promise<PrayerTimesSnapshot> {
  const payload = await fetchJsonWithCache<LondonUnifiedPayload>(location.officialSourceUrl, {
    ttlMs,
    cacheKey: `prayer:london-unified:${location.id}`,
    allowStaleOnError: true,
  })

  const days = payload.days ?? []
  const selectedDay = pickLondonDayByLocalDate(days, new Date())

  if (!selectedDay) {
    throw new Error('London 7-day feed returned no prayer days')
  }

  const weekSchedule = days
    .filter((day) => typeof day.date === 'string' && day.date.trim().length > 0)
    .map((day) => ({
      date: day.date,
      prayers: buildLondonDayPrayers(day, location),
    }))
    .filter((day) => !day.prayers.some((slot) => slot.time24 === '00:00'))

  const prayers = buildLondonDayPrayers(selectedDay, location)

  if (prayers.some((slot) => slot.time24 === '00:00')) {
    throw new Error('London 7-day feed returned incomplete prayer times')
  }

  return {
    location,
    dateLabel: selectedDay.date,
    sourceLabel: location.officialSourceLabel,
    sourceUrl: location.officialSourceUrl,
    prayers,
    weekSchedule: weekSchedule.length > 0 ? weekSchedule : undefined,
    fetchedAt: new Date().toISOString(),
  }
}

function buildAdhanDayPrayers(location: PrayerLocation, dateKey: string, coordinateOverride?: Coordinate): PrayerSlot[] {
  const parsed = parseDateKey(dateKey)
  if (!parsed) {
    return prayerNames.map((name) => ({ name, time24: '00:00' }))
  }

  const coordinates = new Coordinates(
    coordinateOverride?.latitude ?? location.latitude,
    coordinateOverride?.longitude ?? location.longitude,
  )
  const method = location.adhanMethod ?? 'MuslimWorldLeague'
  const params = adhanCalculationFactories[method]()
  params.madhab = location.adhanMadhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi
  params.highLatitudeRule = resolveAdhanHighLatitudeRule(location, coordinates)

  const prayerTimes = new PrayerTimes(coordinates, new Date(parsed.year, parsed.month - 1, parsed.day), params)
  const timeByPrayer: Record<PrayerName, Date> = {
    Fajr: prayerTimes.fajr,
    Sunrise: prayerTimes.sunrise,
    Dhuhr: prayerTimes.dhuhr,
    Asr: prayerTimes.asr,
    Maghrib: prayerTimes.maghrib,
    Isha: prayerTimes.isha,
  }

  return prayerNames.map((name) => {
    const base = toTime24InTimezone(timeByPrayer[name], location.timezone)
    const offset = location.adjustments?.[name] ?? 0

    return {
      name,
      time24: base === '00:00' ? base : addMinutes(base, offset),
    }
  })
}

async function loadAdhanTimes(location: PrayerLocation, coordinateOverride?: Coordinate): Promise<PrayerTimesSnapshot> {
  const now = new Date()
  const todayKey = getDateKeyInTimezone(location.timezone, now)
  const targetDates = Array.from({ length: 7 }, (_, index) => addDaysToDateKey(todayKey, index))

  const weekSchedule: PrayerDaySchedule[] = []
  for (const dateKey of targetDates) {
    const prayers = buildAdhanDayPrayers(location, dateKey, coordinateOverride)
    if (prayers.some((slot) => slot.time24 === '00:00')) {
      continue
    }

    weekSchedule.push({
      date: dateKey,
      prayers,
    })
  }

  if (weekSchedule.length === 0) {
    throw new Error('Adhan calculation returned incomplete schedule data')
  }

  const selectedDay = weekSchedule.find((day) => day.date === todayKey) ?? weekSchedule[0]

  return {
    location,
    dateLabel: selectedDay.date,
    sourceLabel: location.officialSourceLabel,
    sourceUrl: location.officialSourceUrl,
    prayers: selectedDay.prayers,
    weekSchedule,
    fetchedAt: new Date().toISOString(),
  }
}

export async function loadPrayerTimesForLocation(
  location: PrayerLocation,
  cacheTtlMs?: Partial<PrayerCacheTtlMs>,
  coordinateOverride?: Coordinate,
): Promise<PrayerTimesSnapshot> {
  const iccukMs = cacheTtlMs?.iccukMs ?? DEFAULT_CACHE_TTL_MS

  if (location.provider === 'iccuk_html') {
    return loadIccukTimes(location, iccukMs)
  }

  if (location.provider === 'london_unified_7d') {
    return loadLondonUnified7dTimes(location, iccukMs)
  }

  return loadAdhanTimes(location, coordinateOverride)
}

export function buildPrayerTimeline(snapshot: PrayerTimesSnapshot, use24Hour: boolean, now = new Date()): PrayerTimeline {
  const nowMinutes = getNowMinutesInTimezone(snapshot.location.timezone, now)

  const toSlotsWithMinutes = (prayers: PrayerSlot[]) =>
    prayers
      .map((slot) => ({
        ...slot,
        minutes: toMinutes(slot.time24),
      }))
      .sort((a, b) => a.minutes - b.minutes)

  const daysBetween = (fromDate: string, toDate: string): number => {
    const from = Date.parse(`${fromDate}T00:00:00Z`)
    const to = Date.parse(`${toDate}T00:00:00Z`)

    if (Number.isNaN(from) || Number.isNaN(to)) {
      return 0
    }

    return Math.round((to - from) / (24 * 60 * 60 * 1000))
  }

  const weekSchedule = snapshot.weekSchedule
    ?.filter((day) => Array.isArray(day.prayers) && day.prayers.length > 0)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  if (weekSchedule && weekSchedule.length > 0) {
    const todayKey = getDateKeyInTimezone(snapshot.location.timezone, now)
    const todayIndex = weekSchedule.findIndex((day) => day.date === todayKey)

    if (todayIndex >= 0) {
      const today = weekSchedule[todayIndex]
      const todaySlots = toSlotsWithMinutes(today.prayers)

      if (todaySlots.length > 0) {
        const todayNext = todaySlots.find((slot) => slot.minutes > nowMinutes)
        const todayCurrent = [...todaySlots].reverse().find((slot) => slot.minutes <= nowMinutes)

        const currentSlot = (() => {
          if (todayCurrent) {
            return todayCurrent
          }

          const previousDay = weekSchedule[todayIndex - 1]
          if (!previousDay) {
            return todaySlots[todaySlots.length - 1]
          }

          const previousSlots = toSlotsWithMinutes(previousDay.prayers)
          return previousSlots[previousSlots.length - 1] ?? todaySlots[todaySlots.length - 1]
        })()

        if (todayNext) {
          return {
            current: { name: currentSlot.name, time24: currentSlot.time24 },
            next: { name: todayNext.name, time24: todayNext.time24 },
            currentDate: today.date,
            nextDate: today.date,
            nowLabel: getNowLabelInTimezone(snapshot.location.timezone, now, use24Hour),
            minutesUntilNext: todayNext.minutes - nowMinutes,
          }
        }

        const nextDay = weekSchedule[todayIndex + 1] ?? weekSchedule[0]
        const nextDaySlots = toSlotsWithMinutes(nextDay.prayers)
        const nextDayFirst = nextDaySlots[0] ?? todaySlots[0]
        const rawDayGap = daysBetween(todayKey, nextDay.date)
        const dayGap = rawDayGap > 0 ? rawDayGap : 1

        return {
          current: { name: currentSlot.name, time24: currentSlot.time24 },
          next: { name: nextDayFirst.name, time24: nextDayFirst.time24 },
          currentDate: today.date,
          nextDate: nextDay.date,
          nowLabel: getNowLabelInTimezone(snapshot.location.timezone, now, use24Hour),
          minutesUntilNext: dayGap * 24 * 60 - nowMinutes + nextDayFirst.minutes,
        }
      }
    }
  }

  const withMinutes = toSlotsWithMinutes(snapshot.prayers)
  const next = withMinutes.find((slot) => slot.minutes > nowMinutes) ?? withMinutes[0]
  const current =
    [...withMinutes].reverse().find((slot) => slot.minutes <= nowMinutes) ?? withMinutes[withMinutes.length - 1]

  const minutesUntilNext =
    next.minutes > nowMinutes ? next.minutes - nowMinutes : 24 * 60 - nowMinutes + next.minutes

  return {
    current: { name: current.name, time24: current.time24 },
    next: { name: next.name, time24: next.time24 },
    currentDate: snapshot.dateLabel,
    nextDate: snapshot.dateLabel,
    nowLabel: getNowLabelInTimezone(snapshot.location.timezone, now, use24Hour),
    minutesUntilNext,
  }
}

export function formatCountdown(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours <= 0) {
    return `${minutes}m`
  }

  return `${hours}h ${minutes}m`
}
