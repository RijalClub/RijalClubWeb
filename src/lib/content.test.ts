import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Valid fixture data for each config file
const validProfile = {
  name: 'Test Club',
  handle: '@test',
  tagline: 'Test Tagline',
  description: 'Test Description',
  locationLabel: 'London, UK',
  logo: '/logo.png',
  heroImage: '/hero.png',
  values: ['Value 1'],
  stats: [{ label: 'Members', value: '100' }],
  primaryCta: { label: 'Join', url: 'https://example.com/join' },
  secondaryCta: { label: 'Learn', url: 'https://example.com/learn' },
}

const validLinks = {
  heading: 'Links',
  description: 'Our links',
  quickLinks: [
    { id: 'ql-1', title: 'Link 1', subtitle: 'Sub', url: 'https://example.com', icon: 'link' },
  ],
  socials: [{ platform: 'instagram', url: 'https://instagram.com/test' }],
}

const validAnnouncements = {
  heading: 'Announcements',
  description: 'News',
  homeFeed: {
    accountUrl: 'https://tiktok.com/@test',
    maxItems: 5,
    oembedEndpoint: 'https://www.tiktok.com/oembed',
    cacheMinutes: 30,
  },
}

const validBlog = {
  kicker: 'Fitness',
  title: 'Blog',
  description: 'Our blog',
  posts: [
    {
      id: 'post-1',
      title: 'Post 1',
      publishedAt: '2024-01-01',
      coverImage: '/cover.jpg',
      coverAlt: 'Cover',
      excerpt: 'Excerpt',
      tags: ['tag1'],
      paragraphs: ['Paragraph 1'],
    },
  ],
}

const validPrayer = {
  widgetTitle: 'Prayer Times',
  refreshMinutes: 10,
  fallbackLocationId: 'london',
  timezoneRoutes: [{ startsWith: 'Europe/', locationId: 'london' }],
  notes: ['Note 1'],
  locations: [
    {
      id: 'london',
      label: 'London',
      city: 'London',
      country: 'UK',
      timezone: 'Europe/London',
      latitude: 51.5074,
      longitude: -0.1278,
      provider: 'adhan',
      officialSourceLabel: 'London Mosque',
      officialSourceUrl: 'https://example.com/prayer',
    },
  ],
}

const validStore = {
  title: 'Store',
  description: 'Buy stuff',
  isOpen: false,
  closedMessage: 'Coming soon',
  stripe: { enabled: false },
  products: [
    {
      id: 'prod-1',
      title: 'T-Shirt',
      description: 'A t-shirt',
      price: 25,
      currency: 'GBP',
      image: '/tshirt.jpg',
      enabled: true,
    },
  ],
}

const validQuran = {
  title: 'Quran',
  description: 'Read Quran',
  apiBaseUrl: 'https://api.quran.com/api/v4',
  defaultChapterId: 1,
  defaultReciterId: 7,
  defaultScript: 'text_uthmani',
  defaultTranslationIds: [131],
  transliterationResourceId: 57,
  maxSelectableTranslations: 4,
}

const validHadith = {
  title: 'Hadith',
  description: 'Hadith library',
  apiBaseUrl: 'https://api.hadith.gading.dev/books',
  defaultCollectionId: 'bukhari',
  defaultHadithId: 1,
  collections: [
    {
      id: 'bukhari',
      title: 'Sahih Bukhari',
      subtitle: 'Most Authentic',
      description: 'Collection description',
      sourceSlug: 'bukhari',
      totalHadith: 7563,
      referenceUrl: 'https://sunnah.com/bukhari',
    },
  ],
}

const validContact = {
  title: 'Contact',
  description: 'Get in touch',
  statusText: 'Open',
}

const validCache = {
  quran: { bootstrapHours: 24, chapterVersesDays: 7, pageVersesDays: 7, chapterAudioHours: 24 },
  hadith: { entryDays: 30 },
  prayer: { londonFeedMinutes: 60, aladhanMinutes: 30 },
}

const allValidConfigs: Record<string, unknown> = {
  'profile.json': validProfile,
  'links.json': validLinks,
  'announcements.json': validAnnouncements,
  'blog.json': validBlog,
  'prayer.json': validPrayer,
  'store.json': validStore,
  'quran.json': validQuran,
  'hadith.json': validHadith,
  'contact.json': validContact,
  'cache.json': validCache,
}

function mockFetchSuccess(): void {
  mockFetch.mockImplementation((url: string) => {
    const fileName = (url as string).split('/').pop() ?? ''
    const data = allValidConfigs[fileName]
    if (data) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      } as Response)
    }
    return Promise.resolve({ ok: false, status: 404 } as Response)
  })
}

describe('loadSiteContent', () => {
  // Reset modules before each test so the module-level configCache is cleared.
  // Tests must use dynamic imports to get the fresh module instance.
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
    mockFetch.mockReset()
  })

  it('successfully loads all site content', async () => {
    mockFetchSuccess()

    const { loadSiteContent } = await import('./content')
    const content = await loadSiteContent()

    expect(content.profile.name).toBe('Test Club')
    expect(content.links.heading).toBe('Links')
    expect(content.announcements.heading).toBe('Announcements')
    expect(content.blog.kicker).toBe('Fitness')
    expect(content.prayer.widgetTitle).toBe('Prayer Times')
    expect(content.store.isOpen).toBe(false)
    expect(content.quran.defaultChapterId).toBe(1)
    expect(content.hadith.defaultCollectionId).toBe('bukhari')
    expect(content.contact.title).toBe('Contact')
    expect(content.cache.quran.bootstrapHours).toBe(24)
  })

  it('throws descriptive error on HTTP failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response)

    const { loadSiteContent } = await import('./content')
    await expect(loadSiteContent()).rejects.toThrow('Failed loading')
    await expect(loadSiteContent()).rejects.toThrow('404')
  })

  it('throws descriptive error on schema validation failure', async () => {
    mockFetch.mockImplementation((url: string) => {
      const fileName = (url as string).split('/').pop() ?? ''
      // Return invalid data for profile.json (empty name fails validation)
      if (fileName === 'profile.json') {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ name: '' }),
        } as Response)
      }
      const data = allValidConfigs[fileName]
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      } as Response)
    })

    const { loadSiteContent } = await import('./content')
    await expect(loadSiteContent()).rejects.toThrow('profile.json')
  })
})
