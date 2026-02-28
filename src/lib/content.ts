import type {
  AnnouncementsConfig,
  BlogConfig,
  CacheConfig,
  ContactConfig,
  LibraryConfig,
  LinksConfig,
  PrayerConfig,
  ProfileConfig,
  QuranConfig,
  StoreConfig,
} from "@/types/content";
import { z } from "zod";

const rawContentBaseUrl = import.meta.env.VITE_CONTENT_BASE_URL;
const contentBaseUrl = (
  rawContentBaseUrl?.trim().replace(/^['"]|['"]$/g, "") || "/api/content"
).replace(/\/+$/, "");
const rawContentBasePublicKey = import.meta.env.VITE_CONTENT_BASE_PUBLIC_KEY;
const contentBasePublicKey =
  rawContentBasePublicKey?.trim().replace(/^['"]|['"]$/g, "") || "";

function contentFileUrl(fileName: string): string {
  return `${contentBaseUrl}/${fileName.replace(/^\/+/, "")}`;
}

const ctaSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

const urlOrAbsolutePathSchema = z.string().refine(
  (value) => {
    if (value.startsWith("/")) {
      return true;
    }

    return z.string().url().safeParse(value).success;
  },
  {
    message: "Expected a URL or an absolute path (starting with /)",
  },
);

const profileSchema = z.object({
  name: z.string().min(1),
  handle: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  locationLabel: z.string().min(1),
  logo: z.string().min(1),
  heroImage: z.string().min(1),
  values: z.array(z.string().min(1)).min(1),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
      }),
    )
    .min(1),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
});

const linksSchema = z.object({
  heading: z.string().min(1),
  description: z.string().min(1),
  quickLinks: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        subtitle: z.string().min(1),
        url: z.string().url(),
        icon: z.string().min(1),
        featured: z.boolean().optional(),
      }),
    )
    .min(1),
  socials: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .min(1),
  adhanAlert: z
    .object({
      enabled: z.boolean(),
      title: z.string().min(1),
      description: z.string().min(1),
      audioUrl: urlOrAbsolutePathSchema,
      autoPlayWindowSeconds: z.number().int().min(1).max(300),
    })
    .optional(),
  resources: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        subtitle: z.string().min(1),
        url: z.string().url(),
        sectionId: z.string().min(1),
      }),
    )
    .optional(),
  resourceSections: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        icon: z.enum([
          "book-open",
          "brain",
          "handshake",
          "hand-heart",
          "message-circle",
          "play-circle",
          "link",
        ]),
        description: z.string().min(1).optional(),
      }),
    )
    .optional(),
});

const announcementItemSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["text", "image", "video"]),
  title: z.string().min(1),
  body: z.string().min(1),
  publishedAt: z.string().min(1),
  mediaUrl: z.string().min(1).optional(),
  posterUrl: z.string().min(1).optional(),
  media: z
    .array(
      z.object({
        type: z.enum(["image", "video"]),
        url: urlOrAbsolutePathSchema,
        posterUrl: urlOrAbsolutePathSchema.optional(),
        alt: z.string().min(1).optional(),
      }),
    )
    .optional(),
  ctaLabel: z.string().min(1).optional(),
  ctaUrl: z.string().url().optional(),
});

const announcementsSchema = z.object({
  heading: z.string().min(1),
  description: z.string().min(1),
  homeFeed: z.object({
    accountUrl: z.string().url(),
    maxItems: z.number().int().min(1).max(12),
    excludePinnedPosts: z.boolean().optional(),
    oembedEndpoint: z.string().url(),
    embedProfileUrl: z.string().url().optional(),
    proxyUrlTemplate: z.string().min(1).optional(),
    cacheMinutes: z.number().positive().max(1440),
    fallbackPosts: z
      .array(
        z.object({
          id: z.string().min(1),
          url: z.string().url(),
          title: z.string().min(1).optional(),
          description: z.string().min(1).optional(),
          thumbnailUrl: urlOrAbsolutePathSchema.optional(),
        }),
      )
      .optional(),
  }),
  items: z.array(announcementItemSchema).optional(),
});

const blogSchema = z.object({
  kicker: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  posts: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        publishedAt: z.string().min(1),
        coverImage: urlOrAbsolutePathSchema,
        coverAlt: z.string().min(1),
        excerpt: z.string().min(1),
        tags: z.array(z.string().min(1)).min(1),
        paragraphs: z.array(z.string().min(1)).min(1),
        checklist: z.array(z.string().min(1)).optional(),
        html: z.string().min(1).optional(),
      }),
    )
    .min(1),
});

const prayerLocationSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  timezone: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  provider: z.enum(["london_unified_7d", "adhan"]),
  officialSourceLabel: z.string().min(1),
  officialSourceUrl: z.string().url(),
  adhanMethod: z
    .enum([
      "MuslimWorldLeague",
      "Egyptian",
      "Karachi",
      "UmmAlQura",
      "Dubai",
      "MoonsightingCommittee",
      "NorthAmerica",
      "Kuwait",
      "Qatar",
      "Singapore",
      "Tehran",
      "Turkey",
      "Other",
    ])
    .optional(),
  adhanMadhab: z.enum(["shafi", "hanafi"]).optional(),
  adhanHighLatitudeRule: z
    .enum([
      "recommended",
      "middleofthenight",
      "seventhofthenight",
      "twilightangle",
    ])
    .optional(),
  adjustments: z
    .object({
      Fajr: z.number().int().optional(),
      Sunrise: z.number().int().optional(),
      Dhuhr: z.number().int().optional(),
      Asr: z.number().int().optional(),
      Maghrib: z.number().int().optional(),
      Isha: z.number().int().optional(),
    })
    .partial()
    .optional(),
});

const prayerSchema = z.object({
  widgetTitle: z.string().min(1),
  refreshMinutes: z.number().int().positive(),
  fallbackLocationId: z.string().min(1),
  timezoneRoutes: z
    .array(
      z.object({
        startsWith: z.string().min(1),
        locationId: z.string().min(1),
      }),
    )
    .min(1),
  notes: z.array(z.string().min(1)).min(1),
  locations: z.array(prayerLocationSchema).min(1),
});

const storeSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  isOpen: z.boolean(),
  closedMessage: z.string().min(1),
  stripe: z.object({
    enabled: z.boolean(),
    publishableKey: z.string().min(1).optional(),
    checkoutEndpoint: z.string().url().optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  }),
  products: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1),
        badge: z.string().min(1).optional(),
        price: z.number().nonnegative(),
        currency: z.string().min(1),
        image: z.string().min(1),
        media: z
          .array(
            z.object({
              type: z.enum(["image", "video"]),
              url: urlOrAbsolutePathSchema,
              posterUrl: urlOrAbsolutePathSchema.optional(),
              alt: z.string().min(1).optional(),
            }),
          )
          .optional(),
        enabled: z.boolean(),
        checkoutUrl: z.string().url().optional(),
        stripePriceId: z.string().min(1).optional(),
      }),
    )
    .min(1),
});

const quranSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  apiBaseUrl: z.string().url(),
  defaultChapterId: z.number().int().min(1).max(114),
  defaultReciterId: z.number().int().positive(),
  defaultScript: z.enum([
    "text_uthmani",
    "text_uthmani_tajweed",
    "text_uthmani_simple",
    "text_qpc_hafs",
    "text_qpc_nastaleeq_hafs",
    "text_indopak",
    "text_imlaei",
    "text_imlaei_simple",
  ]),
  defaultTranslationIds: z.array(z.number().int().positive()).min(1),
  transliterationResourceId: z.number().int().positive(),
  maxSelectableTranslations: z.number().int().min(1).max(8),
});

const libraryItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  coverImage: urlOrAbsolutePathSchema.optional(),
  pdfUrl: urlOrAbsolutePathSchema.optional(),
  sourceUrl: z.string().url().optional(),
  entryCount: z.number().int().positive().optional(),
});

const librarySchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  defaultCategoryId: z.string().min(1),
  defaultItemId: z.string().min(1),
  categories: z
    .array(
      z.object({
        id: z.string().min(1),
        title: z.string().min(1),
        description: z.string().min(1).optional(),
        items: z.array(libraryItemSchema).min(1),
      }),
    )
    .min(1),
});

const contactSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  statusText: z.string().min(1),
});

const cacheSchema = z.preprocess(
  (raw) => {
    // Backward compat: accept legacy "hadith" key as "library"
    if (raw && typeof raw === "object" && !("library" in raw) && "hadith" in raw) {
      const { hadith, ...rest } = raw as Record<string, unknown>;
      return { ...rest, library: hadith };
    }
    return raw;
  },
  z.object({
    quran: z.object({
      bootstrapHours: z.number().positive(),
      chapterVersesDays: z.number().positive(),
      pageVersesDays: z.number().positive(),
      chapterAudioHours: z.number().positive(),
    }),
    library: z.object({
      entryDays: z.number().positive(),
    }),
    prayer: z.object({
      londonFeedMinutes: z.number().positive(),
      aladhanMinutes: z.number().positive(),
    }),
  }),
);

const configCache = new Map<string, Promise<unknown>>();

async function fetchConfig<T>(
  fileName: string,
  schema: z.ZodSchema<T>,
): Promise<T> {
  const fileUrl = contentFileUrl(fileName);

  if (!configCache.has(fileUrl)) {
    configCache.set(
      fileUrl,
      fetch(fileUrl, {
        cache: "no-cache",
        headers: contentBasePublicKey
          ? { "x-content-public-key": contentBasePublicKey }
          : undefined,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(
              `Failed loading ${fileName}: ${response.status} ${response.statusText}`,
            );
          }

          return response.json();
        })
        .then((data) => {
          try {
            return schema.parse(data);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const issue = error.issues[0];
              const path = issue?.path?.join(".") || "root";
              throw new Error(
                `Invalid ${fileName} at "${path}": ${issue?.message ?? "schema mismatch"}`,
                {
                  cause: error,
                },
              );
            }
            throw error;
          }
        }),
    );
  }

  return (await configCache.get(fileUrl)) as T;
}

export interface SiteContent {
  profile: ProfileConfig;
  links: LinksConfig;
  announcements: AnnouncementsConfig;
  blog: BlogConfig;
  prayer: PrayerConfig;
  store: StoreConfig;
  quran: QuranConfig;
  library: LibraryConfig;
  contact: ContactConfig;
  cache: CacheConfig;
}

export async function loadSiteContent(): Promise<SiteContent> {
  const [
    profile,
    links,
    announcements,
    blog,
    prayer,
    store,
    quran,
    library,
    contact,
    cache,
  ] = await Promise.all([
    fetchConfig("profile.json", profileSchema),
    fetchConfig("links.json", linksSchema),
    fetchConfig("announcements.json", announcementsSchema),
    fetchConfig("blog.json", blogSchema),
    fetchConfig("prayer.json", prayerSchema),
    fetchConfig("store.json", storeSchema),
    fetchConfig("quran.json", quranSchema),
    fetchConfig("library.json", librarySchema),
    fetchConfig("contact.json", contactSchema),
    fetchConfig("cache.json", cacheSchema),
  ]);

  return {
    profile,
    links,
    announcements,
    blog,
    prayer,
    store,
    quran,
    library,
    contact,
    cache,
  };
}
