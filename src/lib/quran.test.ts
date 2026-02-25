import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  stripHtml,
  scriptLabel,
  verseTextByScript,
  formatArabicAyahNumber,
  quranTtlHelpers,
  loadQuranBootstrap,
  loadChapterVerses,
  loadChapterAudioUrl,
  loadQuranPageVerses,
} from './quran'
import type { QuranScript } from '@/types/content'

// ---------------------------------------------------------------------------
// stripHtml
// ---------------------------------------------------------------------------
describe('stripHtml', () => {
  it('removes simple tags', () => {
    expect(stripHtml('<p>Hello world</p>')).toBe('Hello world')
  })

  it('removes br tags and inserts newline', () => {
    expect(stripHtml('Line 1<br/>Line 2')).toBe('Line 1\nLine 2')
  })

  it('removes br tags with various formats', () => {
    expect(stripHtml('Line 1<br>Line 2<br />Line 3')).toBe('Line 1\nLine 2\nLine 3')
  })

  it('decodes &quot; entity', () => {
    expect(stripHtml('He said &quot;hello&quot;')).toBe('He said "hello"')
  })

  it('decodes &amp; entity', () => {
    expect(stripHtml('Fish &amp; chips')).toBe('Fish & chips')
  })

  it('decodes &#39; entity', () => {
    expect(stripHtml("It&#39;s fine")).toBe("It's fine")
  })

  it('decodes &lt; and &gt; entities', () => {
    expect(stripHtml('&lt;div&gt;')).toBe('<div>')
  })

  it('trims whitespace', () => {
    expect(stripHtml('  hello  ')).toBe('hello')
  })

  it('handles nested tags', () => {
    expect(stripHtml('<div><span>text</span></div>')).toBe('text')
  })

  it('returns empty string for empty input', () => {
    expect(stripHtml('')).toBe('')
  })

  it('handles input with no HTML', () => {
    expect(stripHtml('Plain text')).toBe('Plain text')
  })

  it('handles self-closing tags', () => {
    expect(stripHtml('<img src="test.jpg" alt="test" /> some text')).toBe('some text')
  })
})

// ---------------------------------------------------------------------------
// scriptLabel
// ---------------------------------------------------------------------------
describe('scriptLabel', () => {
  const cases: Array<[QuranScript, string]> = [
    ['text_uthmani', 'Uthmani'],
    ['text_uthmani_tajweed', 'Uthmani (Tajweed)'],
    ['text_uthmani_simple', 'Uthmani (Simple)'],
    ['text_qpc_hafs', 'Madani (QPC Hafs)'],
    ['text_qpc_nastaleeq_hafs', 'Nastaleeq (QPC Hafs)'],
    ['text_indopak', 'IndoPak'],
    ['text_imlaei', 'Imlaei'],
    ['text_imlaei_simple', 'Imlaei (Simple)'],
  ]

  for (const [script, label] of cases) {
    it(`returns "${label}" for script "${script}"`, () => {
      expect(scriptLabel(script)).toBe(label)
    })
  }

  it('returns "Uthmani" as default for unknown script', () => {
    // TypeScript will complain but we test the runtime default
    expect(scriptLabel('unknown_script' as QuranScript)).toBe('Uthmani')
  })
})

// ---------------------------------------------------------------------------
// verseTextByScript
// ---------------------------------------------------------------------------
describe('verseTextByScript', () => {
  const mockVerse = {
    textUthmani: 'uthmani-text',
    textUthmaniTajweed: 'tajweed-text<span class=end>end</span>',
    textUthmaniSimple: 'uthmani-simple-text',
    textQpcHafs: 'qpc-hafs-text١',
    textQpcNastaleeqHafs: 'nastaleeq-text٢',
    textIndopak: 'indopak-text\uE001chars',
    textImlaei: 'imlaei-text',
    textImlaeiSimple: 'imlaei-simple-text',
  }

  it('returns uthmani text for text_uthmani', () => {
    expect(verseTextByScript(mockVerse, 'text_uthmani')).toBe('uthmani-text')
  })

  it('strips tajweed end marker for text_uthmani_tajweed', () => {
    expect(verseTextByScript(mockVerse, 'text_uthmani_tajweed')).toBe('tajweed-text')
  })

  it('falls back to uthmani when tajweed text is empty', () => {
    const verse = { ...mockVerse, textUthmaniTajweed: '' }
    expect(verseTextByScript(verse, 'text_uthmani_tajweed')).toBe('uthmani-text')
  })

  it('returns uthmani simple text for text_uthmani_simple', () => {
    expect(verseTextByScript(mockVerse, 'text_uthmani_simple')).toBe('uthmani-simple-text')
  })

  it('falls back to uthmani when simple text is empty', () => {
    const verse = { ...mockVerse, textUthmaniSimple: '' }
    expect(verseTextByScript(verse, 'text_uthmani_simple')).toBe('uthmani-text')
  })

  it('strips trailing Arabic digits for text_qpc_hafs', () => {
    expect(verseTextByScript(mockVerse, 'text_qpc_hafs')).toBe('qpc-hafs-text')
  })

  it('strips trailing Arabic digits for text_qpc_nastaleeq_hafs', () => {
    expect(verseTextByScript(mockVerse, 'text_qpc_nastaleeq_hafs')).toBe('nastaleeq-text')
  })

  it('strips private-use characters for text_indopak', () => {
    expect(verseTextByScript(mockVerse, 'text_indopak')).toBe('indopak-textchars')
  })

  it('returns imlaei text for text_imlaei', () => {
    expect(verseTextByScript(mockVerse, 'text_imlaei')).toBe('imlaei-text')
  })

  it('returns imlaei simple text for text_imlaei_simple', () => {
    expect(verseTextByScript(mockVerse, 'text_imlaei_simple')).toBe('imlaei-simple-text')
  })

  it('falls back to imlaei when imlaei-simple is empty', () => {
    const verse = { ...mockVerse, textImlaeiSimple: '' }
    expect(verseTextByScript(verse, 'text_imlaei_simple')).toBe('imlaei-text')
  })

  it('falls back to uthmani when both imlaei variants are empty', () => {
    const verse = { ...mockVerse, textImlaeiSimple: '', textImlaei: '' }
    expect(verseTextByScript(verse, 'text_imlaei_simple')).toBe('uthmani-text')
  })

  it('falls back to uthmani for text_indopak when empty', () => {
    const verse = { ...mockVerse, textIndopak: '' }
    expect(verseTextByScript(verse, 'text_indopak')).toBe('uthmani-text')
  })

  it('falls back to uthmani for text_qpc_hafs when empty', () => {
    const verse = { ...mockVerse, textQpcHafs: '' }
    expect(verseTextByScript(verse, 'text_qpc_hafs')).toBe('uthmani-text')
  })

  it('falls back to uthmani for text_qpc_nastaleeq_hafs when empty', () => {
    const verse = { ...mockVerse, textQpcNastaleeqHafs: '' }
    expect(verseTextByScript(verse, 'text_qpc_nastaleeq_hafs')).toBe('uthmani-text')
  })

  it('returns uthmani text as default for unknown script', () => {
    expect(verseTextByScript(mockVerse, 'unknown_script' as QuranScript)).toBe('uthmani-text')
  })
})

// ---------------------------------------------------------------------------
// formatArabicAyahNumber
// ---------------------------------------------------------------------------
describe('formatArabicAyahNumber', () => {
  it('converts single digit', () => {
    expect(formatArabicAyahNumber(1)).toBe('١')
  })

  it('converts multi-digit number', () => {
    expect(formatArabicAyahNumber(123)).toBe('١٢٣')
  })

  it('converts zero (treated as 1 via Math.max)', () => {
    expect(formatArabicAyahNumber(0)).toBe('١')
  })

  it('converts negative (treated as 1 via Math.max)', () => {
    expect(formatArabicAyahNumber(-5)).toBe('١')
  })

  it('converts 10', () => {
    expect(formatArabicAyahNumber(10)).toBe('١٠')
  })

  it('converts 286 (longest surah)', () => {
    expect(formatArabicAyahNumber(286)).toBe('٢٨٦')
  })
})

// ---------------------------------------------------------------------------
// quranTtlHelpers
// ---------------------------------------------------------------------------
describe('quranTtlHelpers', () => {
  it('converts hours to milliseconds', () => {
    const { hoursToMs } = quranTtlHelpers()
    expect(hoursToMs(1)).toBe(3_600_000)
    expect(hoursToMs(24)).toBe(86_400_000)
  })

  it('converts days to milliseconds', () => {
    const { daysToMs } = quranTtlHelpers()
    expect(daysToMs(1)).toBe(86_400_000)
    expect(daysToMs(7)).toBe(604_800_000)
  })

  it('returns minimum of 1 hour for 0 hours', () => {
    const { hoursToMs } = quranTtlHelpers()
    expect(hoursToMs(0)).toBe(3_600_000)
  })

  it('returns minimum of 1 day for 0 days', () => {
    const { daysToMs } = quranTtlHelpers()
    expect(daysToMs(0)).toBe(86_400_000)
  })
})

// ---------------------------------------------------------------------------
// async API functions (mocked)
// ---------------------------------------------------------------------------
// NOTE: fetchCache.ts uses a module-level memoryCache. To prevent cross-test
// cache collisions we generate a unique base URL per test using a counter.

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

function apiResponse(data: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as Response
}

let urlCounter = 0
function uniqueUrl(path = '') {
  return `https://api.quran.com/api/v4/test-${++urlCounter}${path}`
}

describe('loadQuranBootstrap', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('loads and transforms chapters, translations, and reciters', async () => {
    const base = uniqueUrl()
    mockFetch.mockImplementation((url: string) => {
      if ((url as string).includes('/chapters')) {
        return Promise.resolve(
          apiResponse({
            chapters: [
              {
                id: 1,
                name_simple: 'Al-Fatihah',
                name_arabic: 'الفاتحة',
                verses_count: 7,
                pages: [1, 1],
                translated_name: { name: 'The Opener' },
              },
            ],
          }),
        )
      }
      if ((url as string).includes('/translations')) {
        return Promise.resolve(
          apiResponse({
            translations: [
              { id: 131, name: 'Sahih International', author_name: 'SI', language_name: 'english' },
            ],
          }),
        )
      }
      if ((url as string).includes('/recitations')) {
        return Promise.resolve(
          apiResponse({
            recitations: [{ id: 7, reciter_name: 'Mishary Rashid Alafasy', style: null }],
          }),
        )
      }
      return Promise.resolve(apiResponse({}))
    })

    const result = await loadQuranBootstrap(base)

    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].nameSimple).toBe('Al-Fatihah')
    expect(result.chapters[0].versesCount).toBe(7)
    expect(result.chapters[0].pages).toEqual([1, 1])
    expect(result.translations).toHaveLength(1)
    expect(result.translations[0].name).toBe('Sahih International')
    expect(result.reciters).toHaveLength(1)
    expect(result.reciters[0].reciterName).toBe('Mishary Rashid Alafasy')
  })

  it('sorts translations by language then name', async () => {
    const base = uniqueUrl()
    mockFetch.mockImplementation((url: string) => {
      if ((url as string).includes('/translations')) {
        return Promise.resolve(
          apiResponse({
            translations: [
              { id: 2, name: 'B Translation', author_name: 'Author B', language_name: 'english' },
              { id: 1, name: 'A Translation', author_name: 'Author A', language_name: 'arabic' },
              { id: 3, name: 'C Translation', author_name: 'Author C', language_name: 'english' },
            ],
          }),
        )
      }
      if ((url as string).includes('/chapters')) {
        return Promise.resolve(apiResponse({ chapters: [] }))
      }
      if ((url as string).includes('/recitations')) {
        return Promise.resolve(apiResponse({ recitations: [] }))
      }
      return Promise.resolve(apiResponse({}))
    })

    const result = await loadQuranBootstrap(base)
    // arabic comes before english alphabetically
    expect(result.translations[0].languageName).toBe('arabic')
  })
})

describe('loadChapterVerses', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('loads and transforms chapter verses', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(
      apiResponse({
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: '1:1',
            text_uthmani: 'بِسْمِ',
            text_uthmani_tajweed: 'بِسْمِ<span class=end>end</span>',
            text_uthmani_simple: 'بسم',
            text_qpc_hafs: 'بسم١',
            text_qpc_nastaleeq_hafs: 'بسم',
            text_indopak: 'بسم',
            text_imlaei: 'بسم',
            text_imlaei_simple: 'بسم',
            translations: [{ resource_id: 131, text: '<p>In the name of Allah</p>' }],
          },
        ],
      }),
    )

    const result = await loadChapterVerses({
      apiBaseUrl: base,
      chapterId: 1,
      translationIds: [131],
      ttlMs: 60_000,
    })

    expect(result).toHaveLength(1)
    expect(result[0].verseKey).toBe('1:1')
    expect(result[0].verseNumber).toBe(1)
    expect(result[0].translations[0].text).toBe('In the name of Allah')
  })

  it('handles verses without translations', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(
      apiResponse({
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: '1:1',
            text_uthmani: 'بِسْمِ',
            text_uthmani_tajweed: '',
            text_uthmani_simple: '',
            text_qpc_hafs: '',
            text_qpc_nastaleeq_hafs: '',
            text_indopak: '',
            text_imlaei: '',
            text_imlaei_simple: '',
          },
        ],
      }),
    )

    const result = await loadChapterVerses({
      apiBaseUrl: base,
      chapterId: 2,
      translationIds: [],
      ttlMs: 60_000,
    })

    expect(result[0].translations).toEqual([])
  })

  it('deduplicates translation IDs', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(apiResponse({ verses: [] }))

    await loadChapterVerses({
      apiBaseUrl: base,
      chapterId: 3,
      translationIds: [131, 131, 131],
      ttlMs: 60_000,
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    const params = new URL(calledUrl).searchParams
    expect(params.get('translations')).toBe('131')
  })
})

describe('loadChapterAudioUrl', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('returns audio URL when available', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(
      apiResponse({ audio_file: { audio_url: 'https://cdn.example.com/audio.mp3' } }),
    )

    const url = await loadChapterAudioUrl({ apiBaseUrl: base, chapterId: 1, reciterId: 7, ttlMs: 60_000 })
    expect(url).toBe('https://cdn.example.com/audio.mp3')
  })

  it('returns null when audio_file is missing', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(apiResponse({}))

    const url = await loadChapterAudioUrl({ apiBaseUrl: base, chapterId: 2, reciterId: 7, ttlMs: 60_000 })
    expect(url).toBeNull()
  })

  it('returns null when audio_url is missing', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(apiResponse({ audio_file: {} }))

    const url = await loadChapterAudioUrl({ apiBaseUrl: base, chapterId: 3, reciterId: 7, ttlMs: 60_000 })
    expect(url).toBeNull()
  })
})

describe('loadQuranPageVerses', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('loads and transforms page verses', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(
      apiResponse({
        verses: [
          {
            id: 1,
            verse_number: 1,
            verse_key: '1:1',
            chapter_id: 1,
            page_number: 1,
            juz_number: 1,
            text_uthmani: 'بِسْمِ',
            text_uthmani_tajweed: '',
            text_uthmani_simple: '',
            text_qpc_hafs: '',
            text_qpc_nastaleeq_hafs: '',
            text_indopak: '',
            text_imlaei: '',
            text_imlaei_simple: '',
          },
        ],
      }),
    )

    const result = await loadQuranPageVerses({ apiBaseUrl: base, pageNumber: 1, ttlMs: 60_000 })

    expect(result).toHaveLength(1)
    expect(result[0].chapterId).toBe(1)
    expect(result[0].pageNumber).toBe(1)
    expect(result[0].juzNumber).toBe(1)
    expect(result[0].verseKey).toBe('1:1')
  })

  it('calls the correct page API endpoint', async () => {
    const base = uniqueUrl()
    mockFetch.mockResolvedValue(apiResponse({ verses: [] }))

    await loadQuranPageVerses({ apiBaseUrl: base, pageNumber: 5, ttlMs: 60_000 })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toContain('/verses/by_page/5')
  })
})
