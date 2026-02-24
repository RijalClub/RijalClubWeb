# The Rijal Club Web

A fresh React + TypeScript + Vite site with modular JSON content.

## Stack

- React 19
- Vite 7
- TypeScript 5.9
- React Router 7
- Zod validation for runtime-safe content loading

## Run locally

```bash
npm install
npm run dev
```

## Content system

All site content is loaded from JSON files in `public/content`.

- `profile.json`
- `links.json`
- `announcements.json`
- `prayer.json`
- `store.json`
- `quran.json`
- `hadith.json`
- `contact.json`
- `cache.json`

To host content from another repo later, set:

```bash
VITE_CONTENT_BASE_URL=https://raw.githubusercontent.com/<org>/<repo>/<branch>/content
```

## Prayer times

- London defaults to London Central Mosque feed (`iccuk.org`) through proxy.
- Other locales use a timezone/geolocation-based recommended profile and AlAdhan API fallback.
- 12h/24h clock toggle is saved in local storage.
- Prayer API cache TTL values come from `cache.json`.

## Quran

- Multi-script Quran reader with translation/transliteration checkboxes.
- Full-screen Arabic page reader mode with surah/page navigation.
- Reader preferences persist in local storage.
- Quran API cache TTL values come from `cache.json`.

## Library

- Sunni hadith library page with configurable collections from `hadith.json`.
- English text is the default minimum, with transliteration/ar text shown when available from source.
- Hadith API cache TTL values come from `cache.json`.

## Store

- Store visibility is controlled by `store.json` (`isOpen`).
- Stripe fields are included in config for easy future checkout wiring.
