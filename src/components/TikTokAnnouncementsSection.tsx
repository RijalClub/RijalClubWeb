import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PlayCircle,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { fetchJsonWithCache, fetchTextWithCache } from "@/lib/fetchCache";
import type { AnnouncementsConfig, TikTokFallbackPost } from "@/types/content";

interface TikTokAnnouncementsSectionProps {
  announcements: AnnouncementsConfig;
  headingLink?: string;
}

interface TikTokPlaylistItem {
  id: string;
  desc?: string;
  authorUniqueId?: string;
  coverUrl?: string;
  dynamicCoverUrl?: string;
  originCoverUrl?: string;
}

interface TikTokOEmbedResponse {
  title?: string | null;
  author_name?: string | null;
  thumbnail_url?: string | null;
}

interface TikTokCard {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  videoUrl: string;
  embedId?: string;
  authorName?: string;
  isPlaceholder?: boolean;
}

function clampCount(value: number): number {
  return Math.min(12, Math.max(1, Math.floor(value)));
}

function extractHandle(accountUrl: string): string | null {
  const match = accountUrl.match(/tiktok\.com\/@([^/?#]+)/i);
  return match?.[1] ?? null;
}

function extractEmbedId(videoUrl: string): string | undefined {
  const match = videoUrl.match(/\/video\/(\d+)/);
  return match?.[1];
}

function profileEmbedUrl(accountUrl: string, configured?: string): string {
  if (configured) {
    return configured;
  }

  const handle = extractHandle(accountUrl);
  if (!handle) {
    throw new Error("Could not read TikTok handle from accountUrl.");
  }

  return `https://www.tiktok.com/embed/@${handle}`;
}

function proxyUrlFromTemplate(
  template: string | undefined,
  sourceUrl: string,
): string {
  if (!template || template.trim().length === 0) {
    return sourceUrl;
  }

  if (template.includes("{url}")) {
    return template.replaceAll("{url}", encodeURIComponent(sourceUrl));
  }

  return `${template}${encodeURIComponent(sourceUrl)}`;
}

function parsePlaylistItems(html: string): TikTokPlaylistItem[] {
  const stateMatch = html.match(
    /<script[^>]*id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!stateMatch?.[1]) {
    return [];
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(stateMatch[1]);
  } catch {
    return [];
  }

  if (typeof parsed !== "object" || parsed === null) {
    return [];
  }

  const source = (parsed as { source?: { data?: Record<string, unknown> } })
    .source;
  const data = source?.data;
  if (!data) {
    return [];
  }

  const embedEntryKey = Object.keys(data).find((key) =>
    key.startsWith("/embed/@"),
  );
  const candidateEntries = embedEntryKey
    ? [data[embedEntryKey], ...Object.values(data)]
    : Object.values(data);

  const rawItems = candidateEntries
    .map((entry) => {
      if (typeof entry !== "object" || entry === null) {
        return null;
      }

      const typedEntry = entry as {
        playlist?: { list?: unknown[] };
        videoList?: unknown[];
      };

      if (Array.isArray(typedEntry.videoList)) {
        return typedEntry.videoList;
      }

      if (Array.isArray(typedEntry.playlist?.list)) {
        return typedEntry.playlist.list;
      }

      return null;
    })
    .find((entry): entry is unknown[] => Array.isArray(entry));

  if (!rawItems) {
    return [];
  }

  return rawItems
    .filter((item): item is TikTokPlaylistItem => {
      if (typeof item !== "object" || item === null) {
        return false;
      }

      const maybeId = (item as { id?: unknown }).id;
      return typeof maybeId === "string" || typeof maybeId === "number";
    })
    .map((item) => {
      const rawItem = item as TikTokPlaylistItem & { id: string | number };
      return {
        id: String(rawItem.id),
        desc: rawItem.desc,
        authorUniqueId: rawItem.authorUniqueId,
        coverUrl: rawItem.coverUrl,
        dynamicCoverUrl: rawItem.dynamicCoverUrl,
        originCoverUrl: rawItem.originCoverUrl,
      };
    });
}

function videoCreatedAtEpochSeconds(videoId: string): number | null {
  if (!/^\d+$/.test(videoId)) {
    return null;
  }

  try {
    const timestamp = Number(BigInt(videoId) >> 32n);
    if (!Number.isFinite(timestamp) || timestamp <= 0) {
      return null;
    }

    return timestamp;
  } catch {
    return null;
  }
}

function inferPinnedPrefixCount(items: TikTokPlaylistItem[]): number {
  if (items.length < 2) {
    return 0;
  }

  const timestamps = items.map((item) => videoCreatedAtEpochSeconds(item.id));
  if (timestamps.some((value) => value === null)) {
    return 0;
  }

  const numeric = timestamps as number[];
  const maxPinned = Math.min(3, numeric.length - 1);

  const isDescending = (values: number[]): boolean => {
    for (let index = 0; index < values.length - 1; index += 1) {
      if (values[index] < values[index + 1]) {
        return false;
      }
    }

    return true;
  };

  for (let pinnedCount = 1; pinnedCount <= maxPinned; pinnedCount += 1) {
    const suffix = numeric.slice(pinnedCount);
    if (suffix.length === 0 || !isDescending(suffix)) {
      continue;
    }

    const firstOrganicTimestamp = suffix[0];
    const prefix = numeric.slice(0, pinnedCount);
    const allPrefixNotNewer = prefix.every(
      (timestamp) => timestamp <= firstOrganicTimestamp,
    );
    const anyPrefixOlder = prefix.some(
      (timestamp) => timestamp < firstOrganicTimestamp,
    );

    if (allPrefixNotNewer && anyPrefixOlder) {
      return pinnedCount;
    }
  }

  return 0;
}

function newestFirst(items: TikTokPlaylistItem[]): TikTokPlaylistItem[] {
  return items
    .map((item, index) => ({
      item,
      index,
      createdAt: videoCreatedAtEpochSeconds(item.id),
    }))
    .sort((left, right) => {
      if (
        left.createdAt !== null &&
        right.createdAt !== null &&
        left.createdAt !== right.createdAt
      ) {
        return right.createdAt - left.createdAt;
      }

      if (left.createdAt !== null && right.createdAt === null) {
        return -1;
      }

      if (left.createdAt === null && right.createdAt !== null) {
        return 1;
      }

      return left.index - right.index;
    })
    .map((entry) => entry.item);
}

function fallbackCards(
  fallback: TikTokFallbackPost[] | undefined,
): TikTokCard[] {
  return (fallback ?? []).map((post) => ({
    id: post.id,
    title: post.title || "TikTok post",
    description: post.description || "Open this post on TikTok.",
    thumbnailUrl: post.thumbnailUrl,
    videoUrl: post.url,
    embedId: extractEmbedId(post.url),
  }));
}

async function loadTikTokCards(
  announcements: AnnouncementsConfig,
  forceRefresh = false,
): Promise<TikTokCard[]> {
  const { homeFeed } = announcements;
  const count = clampCount(homeFeed.maxItems);
  const excludePinnedPosts = homeFeed.excludePinnedPosts !== false;
  const cacheMs = Math.max(60_000, homeFeed.cacheMinutes * 60_000);

  const feedUrl = profileEmbedUrl(
    homeFeed.accountUrl,
    homeFeed.embedProfileUrl,
  );
  const feedUrlWithProxy = proxyUrlFromTemplate(
    homeFeed.proxyUrlTemplate,
    feedUrl,
  );

  const embedHtml = await fetchTextWithCache(feedUrlWithProxy, {
    ttlMs: cacheMs,
    cacheKey: `tiktok:embed-html:${feedUrl}`,
    forceRefresh,
    allowStaleOnError: true,
  });

  const parsedItems = parsePlaylistItems(embedHtml);
  const pinnedPrefixCount = excludePinnedPosts
    ? inferPinnedPrefixCount(parsedItems)
    : 0;
  const normalizedItems = newestFirst(parsedItems.slice(pinnedPrefixCount));
  const rawItems = normalizedItems.slice(0, count);
  if (rawItems.length === 0) {
    return [];
  }

  const handle = extractHandle(homeFeed.accountUrl);

  const cards = await Promise.all(
    rawItems.map(async (item) => {
      const authorHandle = item.authorUniqueId || handle || "tiktok";
      const videoUrl = `https://www.tiktok.com/@${authorHandle}/video/${item.id}`;
      const thumbnailFromPlaylist =
        item.coverUrl || item.dynamicCoverUrl || item.originCoverUrl;

      try {
        const oembedUrl = `${homeFeed.oembedEndpoint}?${new URLSearchParams({ url: videoUrl }).toString()}`;
        const oembed = await fetchJsonWithCache<TikTokOEmbedResponse>(
          oembedUrl,
          {
            ttlMs: cacheMs,
            cacheKey: `tiktok:oembed:${item.id}`,
            forceRefresh,
            allowStaleOnError: true,
          },
        );

        return {
          id: item.id,
          title: (oembed.title || item.desc || "TikTok post").trim(),
          description: (
            item.desc ||
            oembed.title ||
            "Latest update from TikTok."
          ).trim(),
          thumbnailUrl: oembed.thumbnail_url || thumbnailFromPlaylist,
          videoUrl,
          embedId: item.id,
          authorName: oembed.author_name || undefined,
        } satisfies TikTokCard;
      } catch {
        return {
          id: item.id,
          title: (item.desc || "TikTok post").trim(),
          description: (item.desc || "Latest update from TikTok.").trim(),
          thumbnailUrl: thumbnailFromPlaylist,
          videoUrl,
          embedId: item.id,
        } satisfies TikTokCard;
      }
    }),
  );

  return cards;
}

export function TikTokAnnouncementsSection({
  announcements,
  headingLink = "/blog",
}: TikTokAnnouncementsSectionProps) {
  const [cards, setCards] = useState<TikTokCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCard, setActiveCard] = useState<TikTokCard | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);

  const targetCount = clampCount(announcements.homeFeed.maxItems);

  useEffect(() => {
    let isMounted = true;

    setIsLoading(true);
    setError(null);

    void loadTikTokCards(announcements, refreshNonce > 0)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setCards(result);
      })
      .catch((loadError: unknown) => {
        if (!isMounted) {
          return;
        }

        setCards(fallbackCards(announcements.homeFeed.fallbackPosts));
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load TikTok feed right now.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [announcements, refreshNonce]);

  useEffect(() => {
    if (!activeCard) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setActiveCard(null);
      }
    };

    window.addEventListener("keydown", onEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [activeCard]);

  const displayCards = useMemo(() => {
    const base = cards.slice(0, targetCount);

    while (base.length < targetCount) {
      base.push({
        id: `placeholder-${base.length}`,
        title: "No post yet",
        description:
          "This slot stays empty until a new TikTok post is available.",
        videoUrl: "",
        isPlaceholder: true,
      });
    }

    return base;
  }, [cards, targetCount]);

  const onSlide = (direction: "prev" | "next"): void => {
    const container = trackRef.current;
    if (!container) {
      return;
    }

    const firstCard = container.querySelector<HTMLElement>(".tiktok-card");
    const fallbackStep = Math.max(container.clientWidth * 0.84, 220);
    const step = firstCard ? firstCard.offsetWidth + 12 : fallbackStep;
    const left = direction === "next" ? step : -step;

    container.scrollBy({
      left,
      behavior: "smooth",
    });
  };

  return (
    <>
      <section className="panel reveal announcements-panel">
        <div className="section-heading">
          <h2>
            <Link to={headingLink} className="section-heading-link">
              {announcements.heading}
            </Link>
          </h2>
          <p>{announcements.description}</p>
        </div>

        <div className="tiktok-carousel-shell">
          <div className="tiktok-carousel-actions">
            <p className="state-text">
              Showing up to {targetCount} latest post
              {targetCount > 1 ? "s" : ""} from TikTok
            </p>
            <div className="tiktok-carousel-nav">
              <button
                type="button"
                className="icon-btn"
                onClick={() => setRefreshNonce((value) => value + 1)}
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onSlide("prev")}
                aria-label="Previous posts"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                className="icon-btn"
                onClick={() => onSlide("next")}
                aria-label="Next posts"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {error ? (
            <p className="state-text error">Feed warning: {error}</p>
          ) : null}

          <div className="tiktok-carousel-track" ref={trackRef}>
            {displayCards.map((card) => {
              const clickable = !card.isPlaceholder;

              return (
                <article
                  key={card.id}
                  className={
                    clickable
                      ? "tiktok-card clickable"
                      : "tiktok-card placeholder"
                  }
                  onClick={() => {
                    if (clickable) {
                      setActiveCard(card);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!clickable) {
                      return;
                    }

                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setActiveCard(card);
                    }
                  }}
                  role={clickable ? "button" : undefined}
                  tabIndex={clickable ? 0 : undefined}
                >
                  <div className="tiktok-card-media">
                    {card.thumbnailUrl ? (
                      <img
                        src={card.thumbnailUrl}
                        alt={card.title}
                        loading="lazy"
                      />
                    ) : (
                      <div className="tiktok-card-empty" />
                    )}
                    {clickable ? (
                      <span className="tiktok-card-play">
                        <PlayCircle size={26} />
                      </span>
                    ) : null}
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.description}</p>
                  {card.authorName ? <small>@{card.authorName}</small> : null}
                </article>
              );
            })}
          </div>

          {isLoading ? (
            <p className="state-text">Loading TikTok updates...</p>
          ) : null}
        </div>
      </section>

      {activeCard ? (
        <div
          className="content-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activeCard.title}
        >
          <div
            className="content-modal-overlay"
            onClick={() => setActiveCard(null)}
            aria-hidden="true"
          />
          <section className="content-modal-panel panel">
            <header className="content-modal-header">
              <div>
                <p className="kicker">TikTok Update</p>
                <h3>{activeCard.title}</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setActiveCard(null)}
              >
                <X size={14} />
                Close
              </button>
            </header>

            <p className="content-modal-copy">{activeCard.description}</p>

            {activeCard.embedId ? (
              <div className="tiktok-modal-embed">
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${activeCard.embedId}`}
                  title={activeCard.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : activeCard.thumbnailUrl ? (
              <div className="content-modal-media">
                <img
                  src={activeCard.thumbnailUrl}
                  alt={activeCard.title}
                  loading="lazy"
                />
              </div>
            ) : null}

            <div className="content-modal-actions">
              <a
                href={activeCard.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-solid"
              >
                Open On TikTok
                <ExternalLink size={13} />
              </a>
              <p className="source-note">
                Auto-loaded from TikTok profile + oEmbed.
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
