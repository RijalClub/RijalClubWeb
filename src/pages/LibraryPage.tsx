import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { HadithCollectionConfig, HadithConfig } from "@/types/content";
import { BookMarked, FileText, ExternalLink, X, BookOpen, ChevronRight, Eye } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import './library.css';

interface LibraryPageProps {
  config: HadithConfig;
}

const MOBILE_TABLET_QUERY = "(max-width: 1024px)";

function loadStoredString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function fallbackCollection(config: HadithConfig): HadithCollectionConfig {
  return config.collections.find(c => c.id === config.defaultCollectionId) ?? config.collections[0];
}

export function LibraryPage({ config }: LibraryPageProps) {
  const defaultCollection = useMemo(() => fallbackCollection(config), [config]);
  const [isCompactScreen, setIsCompactScreen] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(MOBILE_TABLET_QUERY).matches;
  });

  const [collectionId, setCollectionId] = useState(() => loadStoredString("rijal:library:collection", defaultCollection.id));
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const selectedCollection = useMemo(() => config.collections.find(c => c.id === collectionId) ?? defaultCollection, [collectionId, config.collections, defaultCollection]);

  const selectCollection = (collection: HadithCollectionConfig) => {
    setCollectionId(collection.id);
    if (isCompactScreen && collection.pdfUrl) setIsPdfModalOpen(true);
  };

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("rijal:library:collection", selectedCollection.id);
  }, [selectedCollection.id]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(MOBILE_TABLET_QUERY);
    const cb = (e: MediaQueryListEvent) => setIsCompactScreen(e.matches);
    setIsCompactScreen(mq.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  useEffect(() => {
    if (!isPdfModalOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setIsPdfModalOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onEsc); };
  }, [isPdfModalOpen]);

  return (
    <main className="page-grid reveal">
      <section className="panel p-8 md:p-12 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
          <BookMarked size={14} />
          Knowledge Archive
        </div>
        <h1 className="font-bebas text-5xl md:text-7xl text-white tracking-wide leading-none">{config.title}</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">{config.description}</p>
      </section>

      <div className="grid lg:grid-cols-[1fr_auto] gap-8">
        <section className="panel p-6 md:p-8 flex flex-col gap-8">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <BookOpen size={18} className="text-primary" />
              <h2 className="font-bebas text-2xl tracking-wide text-white uppercase">Collections</h2>
            </div>
            <Badge variant="outline" className="border-white/10 text-muted-foreground">{config.collections.length} Volumes</Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6">
            {config.collections.map((collection) => (
              <button
                key={collection.id}
                onClick={() => selectCollection(collection)}
                className={cn(
                  "group relative flex flex-col gap-4 text-left transition-all duration-500",
                  collection.id === selectedCollection.id ? "scale-[1.02]" : "hover:-translate-y-1"
                )}
              >
                <div className={cn(
                  "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-500 shadow-xl",
                  collection.id === selectedCollection.id 
                    ? "border-primary shadow-primary/20" 
                    : "border-white/5 group-hover:border-white/20"
                )}>
                  {collection.coverImage ? (
                    <img src={collection.coverImage} alt={collection.title} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 flex flex-col items-center justify-center p-6 text-center gap-4">
                      <FileText size={40} className="text-white/10" />
                      <span className="font-bebas text-lg leading-tight text-white/40">{collection.title}</span>
                    </div>
                  )}
                  <div className={cn(
                    "absolute inset-0 bg-primary/20 opacity-0 transition-opacity duration-300 flex items-center justify-center",
                    collection.id === selectedCollection.id ? "opacity-10" : "group-hover:opacity-100"
                  )}>
                    <div className="size-12 rounded-full bg-white text-primary flex items-center justify-center shadow-2xl scale-0 group-hover:scale-100 transition-transform duration-500">
                      <Eye size={20} />
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-1 px-1">
                  <span className={cn(
                    "text-sm font-bold transition-colors",
                    collection.id === selectedCollection.id ? "text-primary" : "text-white group-hover:text-primary"
                  )}>
                    {collection.title}
                  </span>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">{collection.subtitle}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="hidden lg:flex w-[400px] flex-col gap-6">
          <div className="panel p-6 flex flex-col gap-6 h-fit sticky top-24">
            <Badge variant="outline" className="w-fit border-primary/30 text-primary uppercase tracking-widest text-[10px] font-bold">Selection Details</Badge>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-bold text-white">{selectedCollection.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{selectedCollection.description}</p>
            </div>
            
            <div className="grid gap-3 pt-4 border-t border-white/5">
              <Button asChild className="rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                <a href={selectedCollection.pdfUrl} target="_blank" rel="noopener noreferrer">
                  Open PDF Reader
                  <ExternalLink size={16} className="ml-2" />
                </a>
              </Button>
              <Button variant="outline" className="rounded-xl border-white/10 text-white hover:bg-white/5">
                Download Volume
              </Button>
            </div>
          </div>
        </section>
      </div>

      <section className="panel p-6 md:p-10 flex flex-col gap-8 reveal overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-primary">
              <FileText size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-white leading-tight">{selectedCollection.title} Reader</h2>
              <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Embedded PDF Viewer</span>
            </div>
          </div>
          {selectedCollection.pdfUrl && (
            <Button asChild variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full px-6">
              <a href={selectedCollection.pdfUrl} target="_blank" rel="noopener noreferrer">
                External View <ChevronRight size={16} className="ml-1" />
              </a>
            </Button>
          )}
        </div>

        <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-black/20 group">
          {selectedCollection.pdfUrl ? (
            <iframe
              src={selectedCollection.pdfUrl}
              title={selectedCollection.title}
              className="size-full border-0"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <FileText size={48} className="opacity-10" />
              <p className="text-sm font-medium">Digital volume unavailable for this collection</p>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-2xl" />
        </div>
      </section>

      {isPdfModalOpen && selectedCollection.pdfUrl && (
        <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" />
          <header className="relative z-10 p-6 flex items-center justify-between border-b border-white/5">
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-white">{selectedCollection.title}</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Immersive Mobile Reader</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-white" onClick={() => setIsPdfModalOpen(false)}>
              <X size={24} />
            </Button>
          </header>
          <div className="relative z-10 flex-1 overflow-hidden">
            <iframe
              src={selectedCollection.pdfUrl}
              className="size-full border-0"
              title="Mobile PDF Reader"
            />
          </div>
        </div>
      )}
    </main>
  );
}
