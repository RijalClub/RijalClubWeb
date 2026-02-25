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

## Media folders

- Put local images in `assets/images`
- Put local videos in `assets/videos`
- Put local PDFs in `assets/pdfs`
- Reference local files like `/content/assets/images/your-file.png`
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

## Remote content repo mode

Set `VITE_CONTENT_BASE_URL` to your GitHub raw content URL.

Example:

```bash
VITE_CONTENT_BASE_URL=https://raw.githubusercontent.com/your-org/rijal-content/main/content
```

The app will request `${VITE_CONTENT_BASE_URL}/profile.json`, etc.

## Cache tuning

Use `cache.json` to tune fetch/cache behavior without code changes:

- `quran.bootstrapHours`
- `quran.chapterVersesDays`
- `quran.pageVersesDays`
- `quran.chapterAudioHours`
- `hadith.entryDays`
- `prayer.londonFeedMinutes`
- `prayer.aladhanMinutes` (legacy key, used as the adhan profile refresh interval)
