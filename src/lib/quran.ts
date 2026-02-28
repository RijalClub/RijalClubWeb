import type { QuranScript } from '@/types/content'
import { fetchJsonWithCache } from '@/lib/fetchCache'

export interface QuranChapter {
  id: number
  nameSimple: string
  nameArabic: string
  versesCount: number
  translatedName: string
  revelationPlace: string
  pages: [number, number]
}

export interface QuranTranslationResource {
  id: number
  name: string
  authorName: string
  languageName: string
  slug?: string
}

export interface QuranReciter {
  id: number
  reciterName: string
  style?: string | null
}

export interface QuranVerseTranslation {
  resourceId: number
  text: string
}

export interface QuranVerse {
  id: number
  verseNumber: number
  verseKey: string
  textUthmani: string
  textUthmaniTajweed: string
  textUthmaniSimple: string
  textQpcHafs: string
  textQpcNastaleeqHafs: string
  textIndopak: string
  textImlaei: string
  textImlaeiSimple: string
  translations: QuranVerseTranslation[]
}

export interface QuranPageVerse {
  id: number
  verseNumber: number
  verseKey: string
  chapterId: number
  pageNumber: number
  juzNumber: number
  textUthmani: string
  textUthmaniTajweed: string
  textUthmaniSimple: string
  textQpcHafs: string
  textQpcNastaleeqHafs: string
  textIndopak: string
  textImlaei: string
  textImlaeiSimple: string
}

interface ChaptersResponse {
  chapters: Array<{
    id: number
    name_simple: string
    name_arabic: string
    verses_count: number
    revelation_place: string
    pages: number[]
    translated_name: {
      name: string
    }
  }>
}

interface TranslationsResponse {
  translations: Array<{
    id: number
    name: string
    author_name: string
    language_name: string
    slug?: string
  }>
}

interface RecitationsResponse {
  recitations: Array<{
    id: number
    reciter_name: string
    style?: string | null
  }>
}

interface VersesResponse {
  verses: Array<{
    id: number
    verse_number: number
    verse_key: string
    text_uthmani: string
    text_uthmani_tajweed: string
    text_uthmani_simple: string
    text_qpc_hafs: string
    text_qpc_nastaleeq_hafs: string
    text_indopak: string
    text_imlaei: string
    text_imlaei_simple: string
    translations?: Array<{
      resource_id: number
      text: string
    }>
  }>
}

interface PageVersesResponse {
  verses: Array<{
    id: number
    verse_number: number
    verse_key: string
    chapter_id: number
    page_number: number
    juz_number: number
    text_uthmani: string
    text_uthmani_tajweed: string
    text_uthmani_simple: string
    text_qpc_hafs: string
    text_qpc_nastaleeq_hafs: string
    text_indopak: string
    text_imlaei: string
    text_imlaei_simple: string
  }>
}

interface ChapterRecitationResponse {
  audio_file?: {
    audio_url?: string
  }
}

const DAY = 86_400_000
const HOUR = 3_600_000
const DEFAULT_BOOTSTRAP_TTL_MS = DAY * 7
const DEFAULT_CHAPTER_VERSES_TTL_MS = DAY * 30
const DEFAULT_PAGE_VERSES_TTL_MS = DAY * 30
const DEFAULT_CHAPTER_AUDIO_TTL_MS = DAY * 7

async function fetchQuranApi<T>(url: string, ttlMs: number): Promise<T> {
  return fetchJsonWithCache<T>(url, {
    ttlMs,
    cacheKey: `quran:${url}`,
    allowStaleOnError: true,
  })
}

export function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()
}

export function scriptLabel(script: QuranScript): string {
  switch (script) {
    case 'text_uthmani':
      return 'Uthmani'
    case 'text_uthmani_tajweed':
      return 'Uthmani (Tajweed)'
    case 'text_uthmani_simple':
      return 'Uthmani (Simple)'
    case 'text_qpc_hafs':
      return 'Madani (QPC Hafs)'
    case 'text_qpc_nastaleeq_hafs':
      return 'Nastaleeq (QPC Hafs)'
    case 'text_indopak':
      return 'IndoPak'
    case 'text_imlaei':
      return 'Imlaei'
    case 'text_imlaei_simple':
      return 'Imlaei (Simple)'
    default:
      return 'Uthmani'
  }
}

interface VerseScriptFields {
  textUthmani: string
  textUthmaniTajweed: string
  textUthmaniSimple: string
  textQpcHafs: string
  textQpcNastaleeqHafs: string
  textIndopak: string
  textImlaei: string
  textImlaeiSimple: string
}

function stripPrivateUseChars(input: string): string {
  // Some IndoPak payloads include private-use placeholders (U+E000-U+F8FF) that render as square boxes.
  return input.replace(/[\uE000-\uF8FF]/g, '')
}

function stripTajweedEndMarker(input: string): string {
  return input.replace(/<span class=end>[^<]*<\/span>\s*$/u, '')
}

function stripTrailingArabicDigits(input: string): string {
  return input.replace(/[\u00A0\s]*[٠-٩]+\s*$/u, '').trim()
}

export function verseTextByScript(verse: VerseScriptFields, script: QuranScript): string {
  switch (script) {
    case 'text_uthmani_tajweed':
      return stripTajweedEndMarker(verse.textUthmaniTajweed || verse.textUthmani)
    case 'text_uthmani_simple':
      return verse.textUthmaniSimple || verse.textUthmani
    case 'text_qpc_hafs':
      return stripTrailingArabicDigits(verse.textQpcHafs || verse.textUthmani)
    case 'text_qpc_nastaleeq_hafs':
      return stripTrailingArabicDigits(verse.textQpcNastaleeqHafs || verse.textUthmani)
    case 'text_indopak':
      return stripPrivateUseChars(verse.textIndopak || verse.textUthmani)
    case 'text_imlaei':
      return verse.textImlaei || verse.textUthmani
    case 'text_imlaei_simple':
      return verse.textImlaeiSimple || verse.textImlaei || verse.textUthmani
    case 'text_uthmani':
    default:
      return verse.textUthmani
  }
}

export async function loadQuranBootstrap(apiBaseUrl: string, options?: { ttlMs?: number }): Promise<{
  chapters: QuranChapter[]
  translations: QuranTranslationResource[]
  reciters: QuranReciter[]
}> {
  const ttlMs = options?.ttlMs ?? DEFAULT_BOOTSTRAP_TTL_MS

  const [chaptersPayload, translationsPayload, recitationsPayload] = await Promise.all([
    fetchQuranApi<ChaptersResponse>(`${apiBaseUrl}/chapters?language=en`, ttlMs),
    fetchQuranApi<TranslationsResponse>(`${apiBaseUrl}/resources/translations?per_page=500`, ttlMs),
    fetchQuranApi<RecitationsResponse>(`${apiBaseUrl}/resources/recitations?language=en`, ttlMs),
  ])

  const chapters = chaptersPayload.chapters.map((chapter) => {
    const pageStart = chapter.pages?.[0] ?? 1
    const pageEnd = chapter.pages?.[1] ?? pageStart

    return {
      id: chapter.id,
      nameSimple: chapter.name_simple,
      nameArabic: chapter.name_arabic,
      versesCount: chapter.verses_count,
      translatedName: chapter.translated_name.name,
      revelationPlace: chapter.revelation_place,
      pages: [pageStart, pageEnd] as [number, number],
    }
  })

  const translations = translationsPayload.translations
    .map((translation) => ({
      id: translation.id,
      name: translation.name,
      authorName: translation.author_name,
      languageName: translation.language_name,
      slug: translation.slug,
    }))
    .sort((a, b) => {
      const languageCompare = a.languageName.localeCompare(b.languageName)
      if (languageCompare !== 0) {
        return languageCompare
      }

      return a.name.localeCompare(b.name)
    })

  const reciters = recitationsPayload.recitations
    .map((reciter) => ({
      id: reciter.id,
      reciterName: reciter.reciter_name,
      style: reciter.style,
    }))
    .sort((a, b) => a.reciterName.localeCompare(b.reciterName))

  return {
    chapters,
    translations,
    reciters,
  }
}

export async function loadChapterVerses(params: {
  apiBaseUrl: string
  chapterId: number
  translationIds: number[]
  ttlMs?: number
}): Promise<QuranVerse[]> {
  const uniqueTranslationIds = [...new Set(params.translationIds)]
  const search = new URLSearchParams({
    language: 'en',
    per_page: '300',
    fields: 'text_uthmani,text_uthmani_tajweed,text_uthmani_simple,text_qpc_hafs,text_qpc_nastaleeq_hafs,text_indopak,text_imlaei,text_imlaei_simple',
    words: 'false',
  })

  if (uniqueTranslationIds.length > 0) {
    search.set('translations', uniqueTranslationIds.join(','))
  }

  const payload = await fetchQuranApi<VersesResponse>(
    `${params.apiBaseUrl}/verses/by_chapter/${params.chapterId}?${search.toString()}`,
    params.ttlMs ?? DEFAULT_CHAPTER_VERSES_TTL_MS,
  )

  return payload.verses.map((verse) => ({
    id: verse.id,
    verseNumber: verse.verse_number,
    verseKey: verse.verse_key,
    textUthmani: verse.text_uthmani,
    textUthmaniTajweed: verse.text_uthmani_tajweed,
    textUthmaniSimple: verse.text_uthmani_simple,
    textQpcHafs: verse.text_qpc_hafs,
    textQpcNastaleeqHafs: verse.text_qpc_nastaleeq_hafs,
    textIndopak: verse.text_indopak,
    textImlaei: verse.text_imlaei,
    textImlaeiSimple: verse.text_imlaei_simple,
    translations:
      verse.translations?.map((translation) => ({
        resourceId: translation.resource_id,
        text: stripHtml(translation.text),
      })) ?? [],
  }))
}

export async function loadChapterAudioUrl(params: {
  apiBaseUrl: string
  chapterId: number
  reciterId: number
  ttlMs?: number
}): Promise<string | null> {
  const payload = await fetchQuranApi<ChapterRecitationResponse>(
    `${params.apiBaseUrl}/chapter_recitations/${params.reciterId}/${params.chapterId}`,
    params.ttlMs ?? DEFAULT_CHAPTER_AUDIO_TTL_MS,
  )

  return payload.audio_file?.audio_url ?? null
}

export async function loadQuranPageVerses(params: {
  apiBaseUrl: string
  pageNumber: number
  ttlMs?: number
}): Promise<QuranPageVerse[]> {
  const search = new URLSearchParams({
    language: 'en',
    words: 'false',
    per_page: '50',
    fields: 'text_uthmani,text_uthmani_tajweed,text_uthmani_simple,text_qpc_hafs,text_qpc_nastaleeq_hafs,text_indopak,text_imlaei,text_imlaei_simple,chapter_id,juz_number',
  })

  const payload = await fetchQuranApi<PageVersesResponse>(
    `${params.apiBaseUrl}/verses/by_page/${params.pageNumber}?${search.toString()}`,
    params.ttlMs ?? DEFAULT_PAGE_VERSES_TTL_MS,
  )

  return payload.verses.map((verse) => ({
    id: verse.id,
    verseNumber: verse.verse_number,
    verseKey: verse.verse_key,
    chapterId: verse.chapter_id,
    pageNumber: verse.page_number,
    juzNumber: verse.juz_number,
    textUthmani: verse.text_uthmani,
    textUthmaniTajweed: verse.text_uthmani_tajweed,
    textUthmaniSimple: verse.text_uthmani_simple,
    textQpcHafs: verse.text_qpc_hafs,
    textQpcNastaleeqHafs: verse.text_qpc_nastaleeq_hafs,
    textIndopak: verse.text_indopak,
    textImlaei: verse.text_imlaei,
    textImlaeiSimple: verse.text_imlaei_simple,
  }))
}

const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']

export function formatArabicAyahNumber(value: number): string {
  return String(Math.max(1, value))
    .split('')
    .map((char) => {
      const numeric = Number.parseInt(char, 10)
      return Number.isNaN(numeric) ? char : arabicIndicDigits[numeric]
    })
    .join('')
}

export function quranTtlHelpers() {
  return {
    hoursToMs(hours: number): number {
      return Math.max(1, hours) * HOUR
    },
    daysToMs(days: number): number {
      return Math.max(1, days) * DAY
    },
  }
}
