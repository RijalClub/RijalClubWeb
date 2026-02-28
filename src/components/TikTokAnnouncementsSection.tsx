import { fetchJsonWithCache, fetchTextWithCache } from "@/lib/fetchCache";
import type { AnnouncementsConfig, TikTokFallbackPost } from "@/types/content";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Play,
  RefreshCw,
  X,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

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
  if (configured) return configured;
  const handle = extractHandle(accountUrl);
  if (!handle) throw new Error("Could not read TikTok handle.");
  return `https://www.tiktok.com/embed/@${handle}`;
}

function proxyUrlFromTemplate(template: string | undefined, sourceUrl: string): string {
  if (!template || template.trim().length === 0) return sourceUrl;
  return template.includes("{url}") ? template.replaceAll("{url}", encodeURIComponent(sourceUrl)) : `${template}${encodeURIComponent(sourceUrl)}`;
}

function parsePlaylistItems(html: string): TikTokPlaylistItem[] {
  const stateMatch = html.match(/<script[^>]*id="__FRONTITY_CONNECT_STATE__"[^>]*>([\s\S]*?)<\/script>/i);
  if (!stateMatch?.[1]) return [];
  let parsed: Record<string, unknown>;
  try { parsed = JSON.parse(stateMatch[1]) as Record<string, unknown>; } catch { return []; }
  const data = (parsed?.source as Record<string, unknown>)?.data as Record<string, Record<string, unknown>> | undefined;
  if (!data) return [];
  const embedEntryKey = Object.keys(data).find(key => key.startsWith("/embed/@"));
  const candidateEntries = embedEntryKey ? [data[embedEntryKey], ...Object.values(data)] : Object.values(data);
  const rawItems = candidateEntries.map((entry) => (entry as Record<string, unknown>)?.videoList || (entry as Record<string, unknown>)?.playlist && ((entry as Record<string, unknown>).playlist as Record<string, unknown>)?.list).find(entry => Array.isArray(entry));
  return rawItems ? (rawItems as Record<string, unknown>[]).filter((i) => typeof i.id === "string" || typeof i.id === "number").map((i) => ({
    id: String(i.id), desc: i.desc as string, authorUniqueId: i.authorUniqueId as string, coverUrl: i.coverUrl as string, dynamicCoverUrl: i.dynamicCoverUrl as string, originCoverUrl: i.originCoverUrl as string,
  })) : [];
}

function videoCreatedAtEpochSeconds(videoId: string): number | null {
  if (!/^\d+$/.test(videoId)) return null;
  try { return Number(BigInt(videoId) >> 32n); } catch { return null; }
}

function newestFirst(items: TikTokPlaylistItem[]): TikTokPlaylistItem[] {
  return [...items].sort((a, b) => {
    const ta = videoCreatedAtEpochSeconds(a.id) ?? 0;
    const tb = videoCreatedAtEpochSeconds(b.id) ?? 0;
    return tb - ta;
  });
}

function fallbackCards(fallback: TikTokFallbackPost[] | undefined): TikTokCard[] {
  return (fallback ?? []).map((post) => ({
    id: post.id, title: post.title || "TikTok post", description: post.description || "Open this post on TikTok.",
    thumbnailUrl: post.thumbnailUrl, videoUrl: post.url, embedId: extractEmbedId(post.url),
  }));
}

async function loadTikTokCards(announcements: AnnouncementsConfig, forceRefresh = false): Promise<TikTokCard[]> {
  const { homeFeed } = announcements;
  const count = clampCount(homeFeed.maxItems);
  const cacheMs = Math.max(60_000, homeFeed.cacheMinutes * 60_000);
  const feedUrl = profileEmbedUrl(homeFeed.accountUrl, homeFeed.embedProfileUrl);
  const feedUrlWithProxy = proxyUrlFromTemplate(homeFeed.proxyUrlTemplate, feedUrl);

  const embedHtml = await fetchTextWithCache(feedUrlWithProxy, { ttlMs: cacheMs, cacheKey: `tiktok:embed-html:${feedUrl}`, forceRefresh, allowStaleOnError: true });
  const parsedItems = parsePlaylistItems(embedHtml);
  const normalizedItems = newestFirst(parsedItems);
  const rawItems = normalizedItems.slice(0, count);
  if (rawItems.length === 0) return [];

  const handle = extractHandle(homeFeed.accountUrl);
  return Promise.all(rawItems.map(async (item) => {
    const authorHandle = item.authorUniqueId || handle || "tiktok";
    const videoUrl = `https://www.tiktok.com/@${authorHandle}/video/${item.id}`;
    const thumb = item.coverUrl || item.dynamicCoverUrl || item.originCoverUrl;
    try {
      const oembed = await fetchJsonWithCache<TikTokOEmbedResponse>(`${homeFeed.oembedEndpoint}?url=${encodeURIComponent(videoUrl)}`, { ttlMs: cacheMs, cacheKey: `tiktok:oembed:${item.id}`, forceRefresh, allowStaleOnError: true });
      return { id: item.id, title: (oembed.title || item.desc || "TikTok Update").trim(), description: (item.desc || oembed.title || "").trim(), thumbnailUrl: oembed.thumbnail_url || thumb, videoUrl, embedId: item.id, authorName: oembed.author_name || undefined };
    } catch {
      return { id: item.id, title: (item.desc || "TikTok Update").trim(), description: (item.desc || "").trim(), thumbnailUrl: thumb, videoUrl, embedId: item.id };
    }
  }));
}

export function TikTokAnnouncementsSection({ announcements, headingLink = "/blog" }: TikTokAnnouncementsSectionProps) {
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
    loadTikTokCards(announcements, refreshNonce > 0)
      .then(res => isMounted && setCards(res))
      .catch(err => {
        if (!isMounted) return;
        setCards(fallbackCards(announcements.homeFeed.fallbackPosts));
        setError(err instanceof Error ? err.message : "Feed load error.");
      })
      .finally(() => isMounted && setIsLoading(false));
    return () => { isMounted = false; };
  }, [announcements, refreshNonce]);

  const displayCards = useMemo(() => {
    const base = cards.slice(0, targetCount);
    while (base.length < targetCount) base.push({ id: `placeholder-${base.length}`, title: "Upcoming Post", description: "Stay tuned for more updates.", videoUrl: "", isPlaceholder: true });
    return base;
  }, [cards, targetCount]);

  const onSlide = (direction: "prev" | "next") => {
    const container = trackRef.current;
    if (!container) return;
    const step = (container.querySelector<HTMLElement>(".tiktok-card")?.offsetWidth || 300) + 16;
    container.scrollBy({ left: direction === "next" ? step : -step, behavior: "smooth" });
  };

  return (
    <>
      <section className="panel p-6 md:p-8 flex flex-col gap-8 reveal overflow-visible">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-bebas text-4xl tracking-wide text-white">
              <Link to={headingLink} className="hover:text-primary transition-colors">
                {announcements.heading}
              </Link>
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">{announcements.description}</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="rounded-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase" onClick={() => setRefreshNonce(v => v + 1)}>
              <RefreshCw size={14} className={cn("mr-1.5", isLoading && "animate-spin")} />
              Refresh
            </Button>
            <div className="flex items-center gap-1 ml-2">
              <Button variant="ghost" size="icon-sm" className="rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={() => onSlide("prev")}>
                <ChevronLeft size={16} />
              </Button>
              <Button variant="ghost" size="icon-sm" className="rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={() => onSlide("next")}>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory" ref={trackRef}>
            {displayCards.map((card) => {
              const clickable = !card.isPlaceholder;
              return (
                <article
                  key={card.id}
                  className={cn(
                    "flex-none w-[280px] md:w-[320px] snap-start group flex flex-col gap-4 p-4 rounded-3xl border transition-all duration-500",
                    clickable 
                      ? "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-primary/30 cursor-pointer" 
                      : "border-dashed border-white/10 bg-transparent opacity-50"
                  )}
                  onClick={() => clickable && setActiveCard(card)}
                >
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-white/10">
                    {card.thumbnailUrl ? (
                      <img src={card.thumbnailUrl} alt={card.title} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                        <Video size={40} className="text-white/10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {clickable && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-4 group-hover:translate-y-0">
                        <div className="size-14 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-2xl shadow-primary/40">
                          <Play size={24} fill="currentColor" className="ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5 px-1">
                    <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{card.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{card.description}</p>
                    {card.authorName && <span className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">@{card.authorName}</span>}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="absolute -left-6 top-0 bottom-0 w-12 bg-gradient-to-r from-background to-transparent pointer-events-none z-10 hidden md:block" />
          <div className="absolute -right-6 top-0 bottom-0 w-12 bg-gradient-to-l from-background to-transparent pointer-events-none z-10 hidden md:block" />
        </div>

        {error && <p className="text-[11px] text-destructive font-medium uppercase tracking-wider text-center">{error}</p>}
      </section>

      {activeCard && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setActiveCard(null)} />
          <div className="relative w-full max-w-5xl max-h-full overflow-hidden panel flex flex-col md:flex-row shadow-3xl">
            <div className="w-full md:w-[400px] aspect-[9/16] bg-black">
              {activeCard.embedId ? (
                <iframe
                  src={`https://www.tiktok.com/embed/v2/${activeCard.embedId}`}
                  className="size-full border-0"
                  title={activeCard.title}
                  allowFullScreen
                />
              ) : (
                <img src={activeCard.thumbnailUrl} alt={activeCard.title} className="size-full object-cover" />
              )}
            </div>
            <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
              <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit rounded-full border-primary/30 text-primary uppercase tracking-widest text-[10px] font-bold">TikTok Update</Badge>
                    <h2 className="text-2xl font-bold text-white">{activeCard.title}</h2>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={() => setActiveCard(null)}>
                    <X size={20} />
                  </Button>
                </div>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{activeCard.description}</p>
              </div>
              
              <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold mb-1">Source Information</span>
                  <p className="text-[11px] text-white/60">Auto-loaded from TikTok profile oEmbed API</p>
                </div>
                <Button asChild size="lg" className="rounded-full bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <a href={activeCard.videoUrl} target="_blank" rel="noopener noreferrer">
                    View on TikTok
                    <ExternalLink size={16} className="ml-2" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
