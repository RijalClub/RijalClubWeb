import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LibraryCategoryConfig, LibraryConfig, LibraryItemConfig } from "@/types/content";
import { BookMarked, FileText, ExternalLink, X, ChevronRight, ChevronLeft, Eye, BookOpen, Hash } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import './library.css';

interface LibraryPageProps {
  config: LibraryConfig;
}

const COMPACT_QUERY = "(max-width: 1024px)";

function loadStoredString(key: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  return window.localStorage.getItem(key) ?? fallback;
}

function findItemAcrossCategories(
  categories: LibraryCategoryConfig[],
  categoryId: string,
  itemId: string,
): { category: LibraryCategoryConfig; item: LibraryItemConfig } | null {
  const cat = categories.find(c => c.id === categoryId);
  if (cat) {
    const item = cat.items.find(i => i.id === itemId);
    if (item) return { category: cat, item };
  }
  for (const c of categories) {
    const item = c.items.find(i => i.id === itemId);
    if (item) return { category: c, item };
  }
  return null;
}

/* ─── Book Card ─── */
function BookCard({
  item,
  isSelected,
  onSelect,
}: {
  item: LibraryItemConfig;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "library-book group relative flex flex-col gap-3 text-left transition-all duration-500",
        isSelected ? "library-book--active" : "hover:-translate-y-1.5"
      )}
    >
      {/* Cover */}
      <div className={cn(
        "relative aspect-[3/4] rounded-2xl overflow-hidden border-2 transition-all duration-500",
        isSelected
          ? "border-primary shadow-[0_8px_32px_rgba(var(--color-primary-rgb,34,197,94),0.25)]"
          : "border-white/5 shadow-xl group-hover:border-white/20 group-hover:shadow-2xl"
      )}>
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.title}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 flex flex-col items-center justify-center p-4 text-center gap-3">
            <FileText size={32} className="text-white/20" />
            <span className="font-bebas text-base leading-tight text-white/40">{item.title}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 flex items-end justify-center pb-5",
          isSelected ? "opacity-0" : "group-hover:opacity-100"
        )}>
          <div className="size-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-2xl scale-75 group-hover:scale-100 transition-transform duration-500">
            <Eye size={18} />
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 size-6 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
            <BookOpen size={12} />
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex flex-col gap-0.5 px-0.5">
        <span className={cn(
          "text-sm font-bold transition-colors truncate",
          isSelected ? "text-primary" : "text-white group-hover:text-primary"
        )}>
          {item.title}
        </span>
        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest truncate">
          {item.subtitle}
        </span>
      </div>
    </button>
  );
}

/* ─── Category Section ─── */
function CategorySection({
  category,
  selectedItemId,
  onSelect,
  isCompact,
}: {
  category: LibraryCategoryConfig;
  selectedItemId: string;
  onSelect: (item: LibraryItemConfig) => void;
  isCompact: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", checkScroll); ro.disconnect(); };
  }, [checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="library-category">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <BookMarked size={16} />
          </div>
          <div className="flex flex-col">
            <h2 className="font-bebas text-xl md:text-2xl tracking-wide text-white uppercase leading-none">{category.title}</h2>
            {category.description && (
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5 hidden sm:block">{category.description}</p>
            )}
          </div>
        </div>
        <Badge variant="outline" className="border-white/10 text-muted-foreground text-xs">
          {category.items.length} Volumes
        </Badge>
      </div>

      {/* Books — carousel on desktop, grid on mobile */}
      {isCompact ? (
        <div className="library-grid">
          {category.items.map((item) => (
            <BookCard
              key={item.id}
              item={item}
              isSelected={item.id === selectedItemId}
              onSelect={() => onSelect(item)}
            />
          ))}
        </div>
      ) : (
        <div className="relative group/carousel">
          {canScrollLeft && (
            <button onClick={() => scroll("left")} className="carousel-nav-btn carousel-nav-left" aria-label="Scroll left">
              <ChevronLeft size={20} />
            </button>
          )}

          <div ref={scrollRef} className="carousel-scroll">
            {category.items.map((item) => (
              <BookCard
                key={item.id}
                item={item}
                isSelected={item.id === selectedItemId}
                onSelect={() => onSelect(item)}
              />
            ))}
          </div>

          {canScrollRight && (
            <button onClick={() => scroll("right")} className="carousel-nav-btn carousel-nav-right" aria-label="Scroll right">
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      )}
    </section>
  );
}

/* ─── Selection Detail Panel ─── */
function SelectionPanel({
  item,
  isCompact,
  onOpenPdf,
}: {
  item: LibraryItemConfig;
  isCompact: boolean;
  onOpenPdf: () => void;
}) {
  return (
    <div className="library-detail-panel">
      <div className="library-detail-inner">
        {/* Cover thumbnail + info */}
        <div className="flex gap-5">
          {item.coverImage && (
            <div className="library-detail-cover">
              <img src={item.coverImage} alt={item.title} className="size-full object-cover" />
            </div>
          )}
          <div className="flex flex-col gap-2 min-w-0 flex-1">
            <Badge variant="outline" className="w-fit border-primary/30 text-primary uppercase tracking-widest text-[9px] font-bold px-2.5 py-0.5">
              Selected
            </Badge>
            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{item.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 mt-1">
              {item.entryCount && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Hash size={12} className="text-primary/60" />
                  <span>{item.entryCount.toLocaleString()} entries</span>
                </div>
              )}
              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-primary/70 hover:text-primary transition-colors"
                >
                  <ExternalLink size={11} />
                  <span>API Source</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {item.pdfUrl && (
          <div className="flex gap-3 mt-1">
            {isCompact ? (
              <Button onClick={onOpenPdf} className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all h-11">
                <BookOpen size={16} className="mr-2" />
                Open Reader
              </Button>
            ) : (
              <>
                <Button asChild className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all h-11">
                  <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <BookOpen size={16} className="mr-2" />
                    Open PDF Reader
                  </a>
                </Button>
                <Button asChild variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 h-11 px-4">
                  <a href={item.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={16} />
                  </a>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */
export function LibraryPage({ config }: LibraryPageProps) {
  const [isCompact, setIsCompact] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia(COMPACT_QUERY).matches;
  });

  const [selectedCategoryId, setSelectedCategoryId] = useState(() =>
    loadStoredString("rijal:library:category", config.defaultCategoryId),
  );
  const [selectedItemId, setSelectedItemId] = useState(() =>
    loadStoredString("rijal:library:item", config.defaultItemId),
  );
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const selection = useMemo(
    () => findItemAcrossCategories(config.categories, selectedCategoryId, selectedItemId),
    [config.categories, selectedCategoryId, selectedItemId],
  );

  const selectedItem = selection?.item ?? config.categories[0]?.items[0];
  const selectedCategory = selection?.category ?? config.categories[0];

  const selectItem = (item: LibraryItemConfig, category?: LibraryCategoryConfig) => {
    setSelectedItemId(item.id);
    if (category) setSelectedCategoryId(category.id);
  };

  const openMobilePdf = () => {
    if (selectedItem?.pdfUrl) setIsPdfModalOpen(true);
  };

  // Persist selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("rijal:library:category", selectedCategory?.id ?? "");
      window.localStorage.setItem("rijal:library:item", selectedItem?.id ?? "");
    }
  }, [selectedCategory?.id, selectedItem?.id]);

  // Media query listener
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(COMPACT_QUERY);
    const cb = (e: MediaQueryListEvent) => setIsCompact(e.matches);
    setIsCompact(mq.matches);
    mq.addEventListener("change", cb);
    return () => mq.removeEventListener("change", cb);
  }, []);

  // Body scroll lock for PDF modal
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
      {/* ── Hero ── */}
      <section className="library-hero">
        <div className="library-hero-bg" />
        <div className="relative z-[1] flex flex-col gap-4 p-6 sm:p-8 md:p-10">
          <div className="kicker">
            <BookMarked size={14} />
            Knowledge Archive
          </div>
          <h1 className="font-bebas text-5xl sm:text-6xl md:text-7xl text-white tracking-wide leading-none">
            {config.title}
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed">
            {config.description}
          </p>
        </div>
      </section>

      {/* ── Categories + Detail ── */}
      {config.categories.map((category) => (
        <div key={category.id} className="library-section">
          <CategorySection
            category={category}
            selectedItemId={selectedItem?.id ?? ""}
            onSelect={(item) => selectItem(item, category)}
            isCompact={isCompact}
          />

          {/* Inline detail panel — appears below the category it belongs to */}
          {selectedItem && selectedCategory?.id === category.id && (
            <SelectionPanel
              item={selectedItem}
              isCompact={isCompact}
              onOpenPdf={openMobilePdf}
            />
          )}
        </div>
      ))}

      {/* ── Desktop embedded PDF reader ── */}
      {!isCompact && selectedItem?.pdfUrl && (
        <section className="panel p-6 md:p-8 flex flex-col gap-6 reveal overflow-hidden">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="size-11 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <FileText size={20} />
              </div>
              <div className="flex flex-col">
                <h2 className="text-lg font-bold text-white leading-tight">{selectedItem.title} Reader</h2>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Embedded PDF Viewer</span>
              </div>
            </div>
            <Button asChild variant="ghost" className="text-primary hover:text-primary/80 hover:bg-primary/5 rounded-full px-5 text-xs">
              <a href={selectedItem.pdfUrl} target="_blank" rel="noopener noreferrer">
                External View <ChevronRight size={14} className="ml-1" />
              </a>
            </Button>
          </div>

          <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden border border-white/10 bg-black/30">
            <iframe
              src={selectedItem.pdfUrl}
              title={selectedItem.title}
              className="size-full border-0"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {/* ── Mobile PDF modal ── */}
      {isPdfModalOpen && selectedItem?.pdfUrl && (
        <div className="fixed inset-0 z-[200] flex flex-col animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background" />
          <header className="relative z-10 p-4 sm:p-5 flex items-center justify-between border-b border-white/5 bg-background">
            <div className="flex flex-col min-w-0 mr-4">
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{selectedItem.title}</h3>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Immersive Reader</span>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full bg-white/5 text-white shrink-0" onClick={() => setIsPdfModalOpen(false)}>
              <X size={22} />
            </Button>
          </header>
          <div className="relative z-10 flex-1 overflow-hidden">
            <iframe
              src={selectedItem.pdfUrl}
              className="size-full border-0"
              title="Mobile PDF Reader"
            />
          </div>
        </div>
      )}
    </main>
  );
}
