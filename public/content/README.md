# Content Folder

This folder drives the site UI. Update these files and refresh the website:

- `profile.json`
- `links.json`
- `announcements.json`
- `blog.json`
- `prayer.json`
- `store.json`
- `quran.json`
- `hadith.json`
- `contact.json`
- `cache.json`

## Announcements config

- `announcements.homeFeed.accountUrl` sets the TikTok account to pull from.
- `announcements.homeFeed.maxItems` controls how many cards appear on home.
- `announcements.homeFeed.excludePinnedPosts` auto-detects and skips pinned posts (no fixed count hardcoding).
- `announcements.homeFeed.proxyUrlTemplate` is used to fetch the TikTok embed profile HTML.
  - Use `{url}` in the template and it will be replaced with encoded URL.
- `announcements.homeFeed.oembedEndpoint` is used to enrich each video card.
- `announcements.homeFeed.fallbackPosts` provides safe fallback cards when fetch fails.

## Blog config

- `blog.json` drives the full `/blog` page layout and content.

## Media source

- Media is now hosted in the public repository:
  - `https://github.com/RijalClub/RijalClubWebMedia`
- Raw base URL:
  - `https://raw.githubusercontent.com/RijalClub/RijalClubWebMedia/main`
- Section-based image folders:
  - `assets/images/announcements/*`
  - `assets/images/blog/*`
  - `assets/images/store/*`
  - `assets/images/profile/*`
  - `assets/images/hadith/covers/*`
- Reference files with full URLs, for example:
  - `https://raw.githubusercontent.com/RijalClub/RijalClubWebMedia/main/assets/images/store/your-file.png`
- Store product galleries:
  - `store.products[].media` uses `{ "type": "image" | "video", "url": "...", "posterUrl"?: "...", "alt"?: "..." }`
- Recommended card and modal media ratio: `16:9` (for example `1600x900`)

## Links panel config

- `links.adhanAlert` controls the adhan mini-player block.
- `links.resourceSections` controls grouped resource headings + icons.
- `links.resources[].sectionId` assigns each resource link to a section.
- Allowed `resourceSections[].icon` values:
  - `book-open`
  - `brain`
  - `handshake`
  - `hand-heart`
  - `message-circle`
  - `play-circle`
  - `link`

## CMS/API mode

Use the CMS API as the public source:

```bash
VITE_CONTENT_BASE_URL=/api/content
VITE_CONTENT_BASE_PUBLIC_KEY=your_public_key
```

The app requests `${VITE_CONTENT_BASE_URL}/profile.json` etc, and sends
`x-content-public-key` automatically when `VITE_CONTENT_BASE_PUBLIC_KEY` is set.

This repository should stay private; only the API service should read/write it.

## Cache tuning

Use `cache.json` to tune fetch/cache behavior without code changes:

- `quran.bootstrapHours`
- `quran.chapterVersesDays`
- `quran.pageVersesDays`
- `quran.chapterAudioHours`
- `hadith.entryDays`
- `prayer.londonFeedMinutes`
- `prayer.aladhanMinutes` (legacy key, used as the adhan profile refresh interval)
