import { fetchJsonWithCache } from '@/lib/fetchCache'

interface HadithApiPayload {
  id?: number
  header?: string
  hadith_english?: string
  hadithEnglish?: string
  hadith_arabic?: string
  hadithArabic?: string
  transliteration?: string
  hadith_transliteration?: string
  book?: string
  refno?: string
  bookName?: string
  chapterName?: string
  error?: string
}

export interface HadithEntry {
  id: number
  header: string
  english: string
  arabic: string | null
  transliteration: string | null
  collectionTitle: string
  refNo: string
  bookName: string
  chapterName: string
}

const DAY = 86_400_000
const DEFAULT_HADITH_TTL_MS = DAY * 60

function cleanText(value: string | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim()
}

export async function loadHadith(params: {
  apiBaseUrl: string
  collectionSlug: string
  hadithId: number
  ttlMs?: number
}): Promise<HadithEntry> {
  const url = `${params.apiBaseUrl.replace(/\/+$/, '')}/${params.collectionSlug}/${params.hadithId}`
  const payload = await fetchJsonWithCache<HadithApiPayload>(url, {
    ttlMs: params.ttlMs ?? DEFAULT_HADITH_TTL_MS,
    cacheKey: `hadith:${params.collectionSlug}:${params.hadithId}`,
    allowStaleOnError: true,
  })

  if (payload.error) {
    throw new Error(payload.error)
  }

  const english = cleanText(payload.hadith_english ?? payload.hadithEnglish)
  if (!english) {
    throw new Error('Hadith API did not return English text for this entry.')
  }

  const header = cleanText(payload.header)
  const arabic = cleanText(payload.hadith_arabic ?? payload.hadithArabic)
  const transliteration = cleanText(payload.hadith_transliteration ?? payload.transliteration)

  return {
    id: payload.id ?? params.hadithId,
    header,
    english,
    arabic: arabic || null,
    transliteration: transliteration || null,
    collectionTitle: cleanText(payload.book) || params.collectionSlug,
    refNo: cleanText(payload.refno),
    bookName: cleanText(payload.bookName),
    chapterName: cleanText(payload.chapterName),
  }
}
