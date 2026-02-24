export type PrayerName = 'Fajr' | 'Sunrise' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'

export interface StatItem {
  label: string
  value: string
}

export interface CtaLink {
  label: string
  url: string
}

export interface ProfileConfig {
  name: string
  handle: string
  tagline: string
  description: string
  locationLabel: string
  logo: string
  heroImage: string
  values: string[]
  stats: StatItem[]
  primaryCta: CtaLink
  secondaryCta: CtaLink
}

export interface LinkItem {
  id: string
  title: string
  subtitle: string
  url: string
  icon: string
  featured?: boolean
}

export interface SocialLink {
  platform: string
  url: string
}

export type ResourceSectionIcon =
  | 'book-open'
  | 'brain'
  | 'handshake'
  | 'hand-heart'
  | 'message-circle'
  | 'play-circle'
  | 'link'

export interface ResourceSectionConfig {
  id: string
  title: string
  icon: ResourceSectionIcon
  description?: string
}

export interface ResourceLink {
  id: string
  title: string
  subtitle: string
  url: string
  sectionId: string
}

export interface AdhanAlertConfig {
  enabled: boolean
  title: string
  description: string
  audioUrl: string
  autoPlayWindowSeconds: number
}

export interface LinksConfig {
  heading: string
  description: string
  quickLinks: LinkItem[]
  socials: SocialLink[]
  adhanAlert?: AdhanAlertConfig
  resourceSections?: ResourceSectionConfig[]
  resources?: ResourceLink[]
}

export type AnnouncementType = 'text' | 'image' | 'video'

export type MediaAssetType = 'image' | 'video'

export interface MediaAsset {
  type: MediaAssetType
  url: string
  posterUrl?: string
  alt?: string
}

export interface AnnouncementItem {
  id: string
  type: AnnouncementType
  title: string
  body: string
  publishedAt: string
  mediaUrl?: string
  posterUrl?: string
  media?: MediaAsset[]
  ctaLabel?: string
  ctaUrl?: string
}

export interface AnnouncementsConfig {
  heading: string
  description: string
  items: AnnouncementItem[]
}

export type PrayerProvider = 'iccuk_html' | 'london_unified_7d' | 'adhan'

export type AdhanMethod =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'Karachi'
  | 'UmmAlQura'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'NorthAmerica'
  | 'Kuwait'
  | 'Qatar'
  | 'Singapore'
  | 'Tehran'
  | 'Turkey'
  | 'Other'

export type AdhanMadhab = 'shafi' | 'hanafi'

export type AdhanHighLatitudeRule = 'recommended' | 'middleofthenight' | 'seventhofthenight' | 'twilightangle'

export interface PrayerLocation {
  id: string
  label: string
  city: string
  country: string
  timezone: string
  latitude: number
  longitude: number
  provider: PrayerProvider
  officialSourceLabel: string
  officialSourceUrl: string
  proxyUrlTemplate?: string
  adhanMethod?: AdhanMethod
  adhanMadhab?: AdhanMadhab
  adhanHighLatitudeRule?: AdhanHighLatitudeRule
  adjustments?: Partial<Record<PrayerName, number>>
}

export interface PrayerTimezoneRoute {
  startsWith: string
  locationId: string
}

export interface PrayerConfig {
  widgetTitle: string
  refreshMinutes: number
  fallbackLocationId: string
  timezoneRoutes: PrayerTimezoneRoute[]
  notes: string[]
  locations: PrayerLocation[]
}

export interface StoreStripeConfig {
  enabled: boolean
  checkoutEndpoint?: string
  successUrl?: string
  cancelUrl?: string
}

export interface StoreProduct {
  id: string
  title: string
  description: string
  badge?: string
  price: number
  currency: string
  image: string
  media?: MediaAsset[]
  enabled: boolean
  checkoutUrl?: string
  stripePriceId?: string
}

export interface StoreConfig {
  title: string
  description: string
  isOpen: boolean
  closedMessage: string
  stripe: StoreStripeConfig
  products: StoreProduct[]
}

export type QuranScript =
  | 'text_uthmani'
  | 'text_uthmani_tajweed'
  | 'text_uthmani_simple'
  | 'text_qpc_hafs'
  | 'text_qpc_nastaleeq_hafs'
  | 'text_indopak'
  | 'text_imlaei'
  | 'text_imlaei_simple'

export interface QuranConfig {
  title: string
  description: string
  apiBaseUrl: string
  defaultChapterId: number
  defaultReciterId: number
  defaultScript: QuranScript
  defaultTranslationIds: number[]
  transliterationResourceId: number
  maxSelectableTranslations: number
}

export interface HadithCollectionConfig {
  id: string
  title: string
  subtitle: string
  description: string
  sourceSlug: string
  totalHadith: number
  coverImage?: string
  referenceUrl: string
  pdfUrl?: string
}

export interface HadithConfig {
  title: string
  description: string
  apiBaseUrl: string
  defaultCollectionId: string
  defaultHadithId: number
  collections: HadithCollectionConfig[]
}

export interface ContactConfig {
  title: string
  description: string
  statusText: string
}

export interface QuranCacheConfig {
  bootstrapHours: number
  chapterVersesDays: number
  pageVersesDays: number
  chapterAudioHours: number
}

export interface HadithCacheConfig {
  entryDays: number
}

export interface PrayerCacheConfig {
  londonFeedMinutes: number
  aladhanMinutes: number
}

export interface CacheConfig {
  quran: QuranCacheConfig
  hadith: HadithCacheConfig
  prayer: PrayerCacheConfig
}
