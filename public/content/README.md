# Content Folder

This folder drives the site UI. Update these files and refresh the website:

- `profile.json`
- `links.json`
- `announcements.json`
- `prayer.json`
- `store.json`
- `quran.json`
- `hadith.json`
- `contact.json`
- `cache.json`

## Announcements media

- Put local images in `assets/images`
- Put local videos in `assets/videos`
- Put local PDFs in `assets/pdfs`
- Reference them like `/content/assets/images/your-file.png`
- Optional gallery format:
  - `announcements.items[].media` as an array of `{ "type": "image" | "video", "url": "...", "posterUrl"?: "...", "alt"?: "..." }`
  - `store.products[].media` supports the same format
- Card and modal media are optimized for `16:9` uploads (for example `1600x900`)

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
