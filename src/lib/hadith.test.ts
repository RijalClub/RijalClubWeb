import { describe, it, expect, vi, beforeEach } from 'vitest'
import { loadHadith } from './hadith'

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

const BASE_URL = 'https://api.hadith.gading.dev/books'

describe('loadHadith', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('loads a hadith with snake_case field names', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({
        id: 1,
        header: 'Chapter 1',
        hadith_english: 'The Prophet said: ...',
        hadith_arabic: 'قال النبي: ...',
        hadith_transliteration: 'Qala al-Nabi: ...',
        book: 'Sahih Bukhari',
        refno: 'Hadith 1',
        bookName: 'Book of Revelation',
        chapterName: 'How Revelation Started',
      }),
    )

    const result = await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'bukhari',
      hadithId: 1,
      ttlMs: 1,
    })

    expect(result.id).toBe(1)
    expect(result.header).toBe('Chapter 1')
    expect(result.english).toBe('The Prophet said: ...')
    expect(result.arabic).toBe('قال النبي: ...')
    expect(result.transliteration).toBe('Qala al-Nabi: ...')
    expect(result.collectionTitle).toBe('Sahih Bukhari')
    expect(result.refNo).toBe('Hadith 1')
    expect(result.bookName).toBe('Book of Revelation')
    expect(result.chapterName).toBe('How Revelation Started')
  })

  it('loads a hadith with camelCase field names', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({
        id: 2,
        hadithEnglish: 'Narrated by ...',
        hadithArabic: 'روى ...',
        transliteration: 'Ruwiya ...',
        book: 'Sahih Muslim',
        refno: 'Hadith 2',
        bookName: 'Book of Prayer',
        chapterName: 'On Ablution',
      }),
    )

    const result = await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'muslim',
      hadithId: 2,
      ttlMs: 1,
    })

    expect(result.english).toBe('Narrated by ...')
    expect(result.arabic).toBe('روى ...')
    expect(result.transliteration).toBe('Ruwiya ...')
  })

  it('returns null for arabic when field is empty', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({
        id: 3,
        hadith_english: 'English text',
        book: 'Test Book',
        refno: '3',
        bookName: 'Book',
        chapterName: 'Chapter',
      }),
    )

    const result = await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'test',
      hadithId: 3,
      ttlMs: 1,
    })

    expect(result.arabic).toBeNull()
    expect(result.transliteration).toBeNull()
  })

  it('throws when API returns error field', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ error: 'Hadith not found' }),
    )

    await expect(
      loadHadith({ apiBaseUrl: BASE_URL, collectionSlug: 'bukhari', hadithId: 9999, ttlMs: 1 }),
    ).rejects.toThrow('Hadith not found')
  })

  it('throws when English text is missing', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ id: 1, book: 'Test', refno: '1', bookName: 'B', chapterName: 'C' }),
    )

    await expect(
      loadHadith({ apiBaseUrl: BASE_URL, collectionSlug: 'test', hadithId: 1, ttlMs: 1 }),
    ).rejects.toThrow('Hadith API did not return English text for this entry.')
  })

  it('normalises whitespace in text fields', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({
        id: 4,
        hadith_english: '  The Prophet   said:   Do good.  ',
        hadith_arabic: '  قال   النبي   ',
        book: '  Bukhari  ',
        refno: '  4  ',
        bookName: '  Book Name  ',
        chapterName: '  Chapter Name  ',
      }),
    )

    const result = await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'bukhari',
      hadithId: 4,
      ttlMs: 1,
    })

    expect(result.english).toBe('The Prophet said: Do good.')
    expect(result.arabic).toBe('قال النبي')
    expect(result.collectionTitle).toBe('Bukhari')
    expect(result.refNo).toBe('4')
  })

  it('uses collectionSlug as fallback collectionTitle when book is missing', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({
        id: 5,
        hadith_english: 'English text',
        refno: '5',
        bookName: 'Book',
        chapterName: 'Chapter',
      }),
    )

    const result = await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'my-collection',
      hadithId: 5,
      ttlMs: 1,
    })

    expect(result.collectionTitle).toBe('my-collection')
  })

  it('uses hadithId as fallback id when payload id is missing', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({
        hadith_english: 'English text',
        book: 'Test Book',
        refno: '6',
        bookName: 'Book',
        chapterName: 'Chapter',
      }),
    )

    const result = await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'test',
      hadithId: 42,
      ttlMs: 1,
    })

    expect(result.id).toBe(42)
  })

  it('constructs the correct API URL', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ hadith_english: 'Text', book: 'B', refno: '1', bookName: 'BN', chapterName: 'C' }),
    )

    await loadHadith({
      apiBaseUrl: 'https://api.example.com/books',
      collectionSlug: 'bukhari',
      hadithId: 7,
      ttlMs: 1,
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toBe('https://api.example.com/books/bukhari/7')
  })

  it('strips trailing slash from apiBaseUrl', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ hadith_english: 'Text', book: 'B', refno: '1', bookName: 'BN', chapterName: 'C' }),
    )

    await loadHadith({
      apiBaseUrl: 'https://api.example.com/books/',
      collectionSlug: 'bukhari',
      hadithId: 8,
      ttlMs: 1,
    })

    const calledUrl = mockFetch.mock.calls[0][0] as string
    expect(calledUrl).toBe('https://api.example.com/books/bukhari/8')
  })

  it('uses default TTL when ttlMs is not provided', async () => {
    mockFetch.mockResolvedValue(
      apiResponse({ hadith_english: 'Text', book: 'B', refno: '1', bookName: 'BN', chapterName: 'C' }),
    )

    // Should not throw - default TTL is used
    await loadHadith({
      apiBaseUrl: BASE_URL,
      collectionSlug: 'bukhari',
      hadithId: 1,
    })

    expect(mockFetch).toHaveBeenCalled()
  })
})
