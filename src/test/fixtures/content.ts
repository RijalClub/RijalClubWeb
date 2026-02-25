import type { SiteContent } from '@/lib/content'

export const mockProfile = {
  name: 'The Rijal Club',
  handle: '@rijalclub',
  tagline: 'Knowledgehood Collective',
  description: 'A brotherhood focused on knowledge and self-improvement.',
  locationLabel: 'London, UK',
  logo: '/logo.png',
  heroImage: '/hero.png',
  values: ['Faith', 'Brotherhood', 'Knowledge'],
  stats: [
    { label: 'Members', value: '200+' },
    { label: 'Events', value: '50+' },
  ],
  primaryCta: { label: 'Join WhatsApp', url: 'https://example.com/whatsapp' },
  secondaryCta: { label: 'Follow Instagram', url: 'https://example.com/instagram' },
}

export const mockLinks = {
  heading: 'Our Links',
  description: 'Find us everywhere',
  quickLinks: [
    {
      id: 'ql-whatsapp',
      title: 'WhatsApp',
      subtitle: 'Join our group',
      url: 'https://example.com/whatsapp',
      icon: 'message-circle',
      featured: true,
    },
    {
      id: 'ql-youtube',
      title: 'YouTube',
      subtitle: 'Watch our content',
      url: 'https://example.com/youtube',
      icon: 'youtube',
    },
  ],
  socials: [
    { platform: 'instagram', url: 'https://instagram.com/rijalclub' },
    { platform: 'tiktok', url: 'https://tiktok.com/@rijalclub' },
  ],
  adhanAlert: {
    enabled: true,
    title: 'Prayer Alert',
    description: 'Adhan notification',
    audioUrl: '/adhan.mp3',
    autoPlayWindowSeconds: 60,
  },
}

export const mockAnnouncements = {
  heading: 'Announcements',
  description: 'Latest from the club',
  homeFeed: {
    accountUrl: 'https://tiktok.com/@rijalclub',
    maxItems: 5,
    oembedEndpoint: 'https://www.tiktok.com/oembed',
    cacheMinutes: 30,
    fallbackPosts: [
      {
        id: 'fb-1',
        url: 'https://tiktok.com/@rijalclub/video/1',
        title: 'Fallback Post',
      },
    ],
  },
  items: [
    {
      id: 'ann-1',
      type: 'text' as const,
      title: 'Test Announcement 1',
      body: 'First announcement body',
      publishedAt: '2024-01-15',
    },
    {
      id: 'ann-2',
      type: 'image' as const,
      title: 'Image Announcement',
      body: 'Announcement with image',
      publishedAt: '2024-01-10',
      mediaUrl: '/image.jpg',
    },
    {
      id: 'ann-3',
      type: 'video' as const,
      title: 'Video Announcement',
      body: 'Announcement with video',
      publishedAt: '2024-01-05',
      media: [
        { type: 'video' as const, url: '/video.mp4', posterUrl: '/poster.jpg' },
        { type: 'image' as const, url: '/screenshot.jpg', alt: 'Screenshot' },
      ],
      ctaLabel: 'Watch More',
      ctaUrl: 'https://example.com/video',
    },
  ],
}

export const mockBlog = {
  kicker: 'Fitness & Wellness',
  title: 'The Rijal Club Blog',
  description: 'Our fitness journey and knowledge sharing',
  posts: [
    {
      id: 'post-1',
      title: 'Getting Started with Fitness',
      publishedAt: '2024-01-15',
      coverImage: '/cover1.jpg',
      coverAlt: 'Fitness cover',
      excerpt: 'How to start your fitness journey',
      tags: ['fitness', 'beginners'],
      paragraphs: ['First paragraph.', 'Second paragraph.'],
      checklist: ['Do 20 push-ups', 'Run 5km', 'Drink 2L water'],
    },
    {
      id: 'post-2',
      title: 'Nutrition Basics',
      publishedAt: '2024-01-10',
      coverImage: '/cover2.jpg',
      coverAlt: 'Nutrition cover',
      excerpt: 'Learn about proper nutrition',
      tags: ['nutrition'],
      paragraphs: ['Nutrition paragraph.'],
    },
  ],
}

export const mockPrayerLocation = {
  id: 'london',
  label: 'London Central Mosque',
  city: 'London',
  country: 'UK',
  timezone: 'Europe/London',
  latitude: 51.5074,
  longitude: -0.1278,
  provider: 'adhan' as const,
  officialSourceLabel: 'London Central Mosque',
  officialSourceUrl: 'https://iccuk.org/prayer-times',
  adhanMethod: 'MuslimWorldLeague' as const,
  adhanMadhab: 'shafi' as const,
}

export const mockPrayerConfig = {
  widgetTitle: 'Prayer Times',
  refreshMinutes: 10,
  fallbackLocationId: 'london',
  timezoneRoutes: [
    { startsWith: 'Europe/London', locationId: 'london' },
    { startsWith: 'Europe/', locationId: 'london' },
  ],
  notes: ['Times are approximate.', 'Consult your local mosque.'],
  locations: [mockPrayerLocation],
}

export const mockStoreConfig = {
  title: 'Rijal Club Store',
  description: 'Official merchandise',
  isOpen: true,
  closedMessage: 'Store coming soon',
  stripe: {
    enabled: false,
  },
  products: [
    {
      id: 'prod-tshirt',
      title: 'Rijal T-Shirt',
      description: 'High-quality cotton t-shirt',
      badge: 'New',
      price: 25.0,
      currency: 'GBP',
      image: '/tshirt.jpg',
      media: [
        { type: 'image' as const, url: '/tshirt-front.jpg', alt: 'Front view' },
        { type: 'image' as const, url: '/tshirt-back.jpg', alt: 'Back view' },
      ],
      enabled: true,
      checkoutUrl: 'https://example.com/checkout/tshirt',
    },
    {
      id: 'prod-hoodie',
      title: 'Rijal Hoodie',
      description: 'Premium hoodie for cold days',
      price: 45.0,
      currency: 'GBP',
      image: '/hoodie.jpg',
      enabled: false,
    },
  ],
}

export const mockQuranConfig = {
  title: 'The Noble Quran',
  description: 'Read the Quran in multiple scripts',
  apiBaseUrl: 'https://api.quran.com/api/v4',
  defaultChapterId: 1,
  defaultReciterId: 7,
  defaultScript: 'text_uthmani' as const,
  defaultTranslationIds: [131],
  transliterationResourceId: 57,
  maxSelectableTranslations: 4,
}

export const mockHadithConfig = {
  title: 'Hadith Library',
  description: 'Authentic hadith collections',
  apiBaseUrl: 'https://api.hadith.gading.dev/books',
  defaultCollectionId: 'bukhari',
  defaultHadithId: 1,
  collections: [
    {
      id: 'bukhari',
      title: 'Sahih Bukhari',
      subtitle: 'Most Authentic',
      description: 'Compiled by Imam Muhammad al-Bukhari',
      sourceSlug: 'bukhari',
      totalHadith: 7563,
      coverImage: '/bukhari-cover.jpg',
      referenceUrl: 'https://sunnah.com/bukhari',
      pdfUrl: '/bukhari.pdf',
    },
    {
      id: 'muslim',
      title: 'Sahih Muslim',
      subtitle: 'Second Most Authentic',
      description: 'Compiled by Imam Muslim ibn al-Hajjaj',
      sourceSlug: 'muslim',
      totalHadith: 3033,
      referenceUrl: 'https://sunnah.com/muslim',
    },
  ],
}

export const mockContactConfig = {
  title: 'Contact Us',
  description: 'Reach out to the Rijal Club team',
  statusText: 'We usually respond within 24 hours',
}

export const mockCacheConfig = {
  quran: {
    bootstrapHours: 168,
    chapterVersesDays: 30,
    pageVersesDays: 30,
    chapterAudioHours: 168,
  },
  hadith: {
    entryDays: 60,
  },
  prayer: {
    londonFeedMinutes: 60,
    aladhanMinutes: 30,
  },
}

export const mockSiteContent: SiteContent = {
  profile: mockProfile,
  links: mockLinks,
  announcements: mockAnnouncements,
  blog: mockBlog,
  prayer: mockPrayerConfig,
  store: mockStoreConfig,
  quran: mockQuranConfig,
  hadith: mockHadithConfig,
  contact: mockContactConfig,
  cache: mockCacheConfig,
}
