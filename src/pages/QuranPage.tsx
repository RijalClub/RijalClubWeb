import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  formatArabicAyahNumber,
  loadChapterAudioUrl,
  loadChapterVerses,
  loadQuranBootstrap,
  loadQuranPageVerses,
  quranTtlHelpers,
  scriptLabel,
  verseTextByScript,
  type QuranChapter,
  type QuranPageVerse,
  type QuranReciter,
  type QuranTranslationResource,
  type QuranVerse,
} from "@/lib/quran";
import type {
  QuranCacheConfig,
  QuranConfig,
  QuranScript,
} from "@/types/content";
import {
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Languages,
  RefreshCw,
  RotateCcw,
  ScanText,
  Search,
  Sun,
  Type,
  X,
  Settings2,
  Volume2,
  Maximize2
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import './quran.css'

interface QuranPageProps {
  config: QuranConfig;
  cache: QuranCacheConfig;
}

const SCRIPT_OPTIONS: QuranScript[] = [
  "text_uthmani",
  "text_qpc_hafs",
  "text_qpc_nastaleeq_hafs",
  "text_uthmani_tajweed",
  "text_uthmani_simple",
  "text_indopak",
  "text_imlaei",
  "text_imlaei_simple",
];

function loadStoredValue<T>(key: string, fallback: T, parser: (value: string) => T | null): T {
  if (typeof window === "undefined") return fallback;
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;
  try { return parser(stored) ?? fallback; } catch { return fallback; }
}

function chapterLabel(chapter: QuranChapter): string {
  return `${chapter.id}. ${chapter.nameSimple} (${chapter.translatedName})`;
}

function clampPage(page: number, maxPage: number): number {
  return !Number.isFinite(page) ? 1 : Math.max(1, Math.min(maxPage, page));
}

function arabicScriptClass(script: QuranScript): string {
  switch (script) {
    case "text_qpc_hafs": return "quran-script-qpc";
    case "text_qpc_nastaleeq_hafs": return "quran-script-nastaleeq";
    default: return "quran-script-uthmani";
  }
}

export function QuranPage({ config, cache }: QuranPageProps) {
  const [chapters, setChapters] = useState<QuranChapter[]>([]);
  const [translations, setTranslations] = useState<QuranTranslationResource[]>([]);
  const [reciters, setReciters] = useState<QuranReciter[]>([]);
  const [_bootstrapLoading, setBootstrapLoading] = useState(true);
  const [_bootstrapError, setBootstrapError] = useState<string | null>(null);

  const [chapterId, setChapterId] = useState(() => loadStoredValue("rijal:quran:chapter", config.defaultChapterId, v => Number.parseInt(v, 10)));
  const [reciterId, setReciterId] = useState(() => loadStoredValue("rijal:quran:reciter", config.defaultReciterId, v => Number.parseInt(v, 10)));
  const [script, setScript] = useState<QuranScript>(() => loadStoredValue("rijal:quran:script", config.defaultScript, v => SCRIPT_OPTIONS.includes(v as QuranScript) ? v as QuranScript : null));
  const [fontScale, setFontScale] = useState(() => loadStoredValue("rijal:quran:font-scale", 1.45, v => Math.max(1.1, Math.min(2.3, Number.parseFloat(v)))));
  const [showTransliteration, setShowTransliteration] = useState(() => loadStoredValue("rijal:quran:show-transliteration", true, v => v === "true"));
  const [showTranslations, setShowTranslations] = useState(() => loadStoredValue("rijal:quran:show-translations", true, v => v === "true"));
  const [lightMode, setLightMode] = useState(() => loadStoredValue("rijal:quran:light-mode", false, v => v === "true"));
  const [selectedTranslationIds, setSelectedTranslationIds] = useState<number[]>(() => loadStoredValue("rijal:quran:translations", config.defaultTranslationIds, v => JSON.parse(v)));
  
  const [translationQuery, setTranslationQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [_versesError, setVersesError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isReaderModeOpen, setIsReaderModeOpen] = useState(false);
  const [readerPage, setReaderPage] = useState(() => loadStoredValue("rijal:quran:reader-page", 1, v => Number.parseInt(v, 10)));
  const [readerDirection, setReaderDirection] = useState<"next" | "prev" | null>(null);
  const [readerVerses, setReaderVerses] = useState<QuranPageVerse[]>([]);
  const [readerLoading, setReaderLoading] = useState(false);
  const [_readerError, setReaderError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setBootstrapLoading(true);
    loadQuranBootstrap(config.apiBaseUrl, { ttlMs: quranTtlHelpers().hoursToMs(cache.bootstrapHours) })
      .then(p => { if (isMounted) { setChapters(p.chapters); setTranslations(p.translations); setReciters(p.reciters); setBootstrapError(null); } })
      .catch(err => { if (isMounted) setBootstrapError(err instanceof Error ? err.message : "Load failed."); })
      .finally(() => { if (isMounted) setBootstrapLoading(false); });
    return () => { isMounted = false; };
  }, [cache.bootstrapHours, config.apiBaseUrl]);

  useEffect(() => { if (typeof window !== "undefined") {
    window.localStorage.setItem("rijal:quran:chapter", String(chapterId));
    window.localStorage.setItem("rijal:quran:reciter", String(reciterId));
    window.localStorage.setItem("rijal:quran:script", script);
    window.localStorage.setItem("rijal:quran:font-scale", String(fontScale));
    window.localStorage.setItem("rijal:quran:show-transliteration", String(showTransliteration));
    window.localStorage.setItem("rijal:quran:show-translations", String(showTranslations));
    window.localStorage.setItem("rijal:quran:light-mode", String(lightMode));
    window.localStorage.setItem("rijal:quran:translations", JSON.stringify(selectedTranslationIds));
    window.localStorage.setItem("rijal:quran:reader-page", String(readerPage));
  }}, [chapterId, reciterId, script, fontScale, showTransliteration, showTranslations, lightMode, selectedTranslationIds, readerPage]);

  const maxPage = useMemo(() => chapters.length === 0 ? 604 : chapters.reduce((h, c) => Math.max(h, c.pages[1]), 1), [chapters]);
  const selectedChapter = useMemo(() => chapters.find(c => c.id === chapterId), [chapterId, chapters]);
  const readerChapter = useMemo(() => chapters.find(c => readerPage >= c.pages[0] && readerPage <= c.pages[1]), [chapters, readerPage]);
  const translationMap = useMemo(() => {
    const map = new Map<number, QuranTranslationResource>();
    for (const t of translations) map.set(t.id, t);
    return map;
  }, [translations]);

  const languageOptions = useMemo(() => ["all", ...new Set(translations.map(t => t.languageName))], [translations]);
  const filteredTranslations = useMemo(() => {
    const query = translationQuery.trim().toLowerCase();
    return translations.filter(t => (languageFilter === "all" || t.languageName === languageFilter) && (!query || t.name.toLowerCase().includes(query) || t.authorName.toLowerCase().includes(query)));
  }, [languageFilter, translationQuery, translations]);

  const translationIdsToFetch = useMemo(() => {
    const base = showTranslations ? [...selectedTranslationIds] : [];
    if (showTransliteration) base.push(config.transliterationResourceId);
    return [...new Set(base)];
  }, [config.transliterationResourceId, selectedTranslationIds, showTranslations, showTransliteration]);

  useEffect(() => {
    let isMounted = true;
    setVersesLoading(true);
    loadChapterVerses({ apiBaseUrl: config.apiBaseUrl, chapterId, translationIds: translationIdsToFetch, ttlMs: quranTtlHelpers().daysToMs(cache.chapterVersesDays) })
      .then(p => { if (isMounted) { setVerses(p); setVersesError(null); } })
      .catch(err => { if (isMounted) setVersesError(err instanceof Error ? err.message : "Verses failed."); })
      .finally(() => { if (isMounted) setVersesLoading(false); });
    return () => { isMounted = false; };
  }, [cache.chapterVersesDays, chapterId, config.apiBaseUrl, translationIdsToFetch]);

  useEffect(() => {
    let isMounted = true;
    loadChapterAudioUrl({ apiBaseUrl: config.apiBaseUrl, chapterId, reciterId, ttlMs: quranTtlHelpers().hoursToMs(cache.chapterAudioHours) })
      .then(res => isMounted && setAudioUrl(res))
      .catch(() => isMounted && setAudioUrl(null));
    return () => { isMounted = false; };
  }, [cache.chapterAudioHours, chapterId, config.apiBaseUrl, reciterId]);

  useEffect(() => {
    if (!isReaderModeOpen) return;
    let isMounted = true;
    const page = clampPage(readerPage, maxPage);
    setReaderLoading(true);
    loadQuranPageVerses({ apiBaseUrl: config.apiBaseUrl, pageNumber: page, ttlMs: quranTtlHelpers().daysToMs(cache.pageVersesDays) })
      .then(p => { if (isMounted) { setReaderVerses(p); setReaderError(null); } })
      .catch(err => { if (isMounted) setReaderError(err instanceof Error ? err.message : "Page failed."); })
      .finally(() => { if (isMounted) setReaderLoading(false); });
    return () => { isMounted = false; };
  }, [cache.pageVersesDays, config.apiBaseUrl, isReaderModeOpen, maxPage, readerPage]);

  useEffect(() => {
    if (isReaderModeOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isReaderModeOpen]);

  const toggleTranslation = (id: number) => {
    const exists = selectedTranslationIds.includes(id);
    if (exists) {
      if (selectedTranslationIds.length > 1) setSelectedTranslationIds(selectedTranslationIds.filter(i => i !== id));
    } else if (selectedTranslationIds.length < config.maxSelectableTranslations) {
      setSelectedTranslationIds([...selectedTranslationIds, id]);
    }
  };

  const openReaderMode = () => {
    setReaderPage(clampPage(selectedChapter?.pages[0] ?? 1, maxPage));
    setIsReaderModeOpen(true);
  };

  const goToReaderPage = (nextPage: number, direction: "next" | "prev" | null) => {
    setReaderDirection(direction);
    setReaderPage(clampPage(nextPage, maxPage));
  };

  return (
    <main className={cn("page-grid", lightMode && "quran-theme-light")}>
      <section className="panel p-8 md:p-12 flex flex-col gap-6 reveal">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
          <BookOpenText size={14} />
          Holy Quran Experience
        </div>
        <h1 className="font-bebas text-5xl md:text-7xl text-white tracking-wide leading-none">{config.title}</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">{config.description}</p>
        
        {selectedChapter && (
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-bold">
              Surah {selectedChapter.nameSimple}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-muted-foreground px-4 py-1.5 text-sm font-arabic">
              {selectedChapter.nameArabic}
            </Badge>
            <Badge variant="outline" className="border-white/10 text-muted-foreground px-4 py-1.5 text-sm">
              {selectedChapter.revelationPlace} • {selectedChapter.versesCount} Ayahs
            </Badge>
          </div>
        )}
      </section>

      <section className="panel p-6 flex flex-col gap-6 reveal">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
            <Settings2 size={14} className="text-primary" />
            Reading Settings
          </div>
          <Button variant="ghost" size="sm" onClick={() => {
            setChapterId(config.defaultChapterId);
            setReciterId(config.defaultReciterId);
            setScript(config.defaultScript);
            setFontScale(1.45);
          }} className="text-[10px] uppercase font-bold text-muted-foreground hover:text-white transition-colors">
            <RotateCcw size={12} className="mr-1.5" /> Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_0.8fr] gap-3">
          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Surah</label>
            <Select value={String(chapterId)} onValueChange={v => setChapterId(Number.parseInt(v, 10))}>
              <SelectTrigger className="w-full min-w-0 rounded-xl border-white/10 bg-white/5 text-xs text-white h-11">
                <SelectValue placeholder="Select Surah" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 text-white max-h-[300px]">
                {chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>{chapterLabel(c)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Audio Reciter</label>
            <Select value={String(reciterId)} onValueChange={v => setReciterId(Number.parseInt(v, 10))}>
              <SelectTrigger className="w-full min-w-0 rounded-xl border-white/10 bg-white/5 text-xs text-white h-11">
                <SelectValue placeholder="Select Reciter" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 text-white max-h-[300px]">
                {reciters.map(r => <SelectItem key={r.id} value={String(r.id)}>{r.reciterName}{r.style ? ` (${r.style})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Arabic Script</label>
            <Select value={script} onValueChange={v => setScript(v as QuranScript)}>
              <SelectTrigger className="w-full min-w-0 rounded-xl border-white/10 bg-white/5 text-xs text-white h-11">
                <SelectValue placeholder="Select Script" />
              </SelectTrigger>
              <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 text-white">
                {SCRIPT_OPTIONS.map(o => <SelectItem key={o} value={o}>{scriptLabel(o)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Text Size</label>
              <span className="text-[10px] font-bold text-primary">{fontScale.toFixed(2)}x</span>
            </div>
            <div className="h-11 flex items-center px-2 bg-white/5 rounded-xl border border-white/10">
              <Slider
                min={1.1} max={2.3} step={0.05}
                value={[fontScale]}
                onValueChange={([v]) => setFontScale(v)}
                className="w-full"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Translations</span>
            <Switch checked={showTranslations} onCheckedChange={setShowTranslations} className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Transliteration</span>
            <Switch checked={showTransliteration} onCheckedChange={setShowTransliteration} className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Light Mode</span>
            <Switch checked={lightMode} onCheckedChange={setLightMode} className="scale-75 data-[state=checked]:bg-primary" />
          </div>
          <div className="flex-1" />
          <Button onClick={openReaderMode} className="rounded-full bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5">
            <ScanText size={16} className="mr-2" /> Arabic Reader Mode
          </Button>
        </div>

        {audioUrl && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
            <div className="flex items-center gap-3 min-w-[200px]">
              <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Volume2 size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Now Streaming</span>
                <span className="text-xs font-bold text-white truncate max-w-[150px]">{selectedChapter?.nameSimple}</span>
              </div>
            </div>
            <audio key={audioUrl} controls src={audioUrl} className="flex-1 h-10 filter invert opacity-80" />
          </div>
        )}

        <details className="group border border-white/10 bg-white/[0.02] rounded-2xl overflow-hidden transition-all duration-300">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 list-none">
            <div className="flex items-center gap-3">
              <Languages size={18} className="text-primary" />
              <span className="text-sm font-bold text-white uppercase tracking-widest">Translation Library</span>
              <Badge variant="outline" className="ml-2 border-primary/20 text-primary">{selectedTranslationIds.length}/{config.maxSelectableTranslations}</Badge>
            </div>
            <ChevronRight size={18} className="text-muted-foreground transition-transform group-open:rotate-90" />
          </summary>
          <div className="p-6 flex flex-col gap-6 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input 
                  className="w-full h-11 pl-10 pr-4 bg-white/5 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-primary/50 text-white placeholder:text-muted-foreground"
                  placeholder="Search translations..."
                  value={translationQuery}
                  onChange={e => setTranslationQuery(e.target.value)}
                />
              </div>
              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-xs text-white">
                  <SelectValue placeholder="Language Filter" />
                </SelectTrigger>
                <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 text-white max-h-[300px]">
                  {languageOptions.map(l => <SelectItem key={l} value={l}>{l === "all" ? "All Languages" : l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-premium">
              {filteredTranslations.map(t => (
                <div 
                  key={t.id} 
                  onClick={() => toggleTranslation(t.id)}
                  className={cn(
                    "p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3",
                    selectedTranslationIds.includes(t.id) ? "border-primary/50 bg-primary/10" : "border-white/5 bg-white/[0.02] hover:bg-white/5"
                  )}
                >
                  <Switch checked={selectedTranslationIds.includes(t.id)} className="scale-75 pointer-events-none" />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white">{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t.languageName} • {t.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      </section>

      <section className="flex flex-col gap-6 reveal">
        {versesLoading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <RefreshCw className="size-8 text-primary animate-spin" />
            <p className="text-muted-foreground font-medium animate-pulse">Loading revelation...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {verses.map((verse) => (
              <article key={verse.id} className="panel p-8 md:p-12 flex flex-col gap-10 hover:border-primary/20 transition-all duration-500 group">
                <header className="flex items-center justify-between border-b border-white/5 pb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold text-primary tracking-[0.2em]">{verse.verseKey}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">Revelation {verse.verseNumber}</span>
                  </div>
                  <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-white/20 group-hover:text-primary transition-colors border border-white/10">
                    <ScanText size={18} />
                  </div>
                </header>

                <div className="flex flex-col gap-8 text-right" dir="rtl">
                  {script === "text_uthmani_tajweed" ? (
                    <p 
                      className={cn("text-white leading-[2.5] quran-arabic", arabicScriptClass(script))}
                      style={{ fontSize: `${fontScale * 1.5}rem` }}
                      dangerouslySetInnerHTML={{ __html: verseTextByScript(verse, script) }}
                    />
                  ) : (
                    <p 
                      className={cn("text-white leading-[2.5] quran-arabic", arabicScriptClass(script))}
                      style={{ fontSize: `${fontScale * 1.5}rem` }}
                    >
                      {verseTextByScript(verse, script)}
                      <span className="ayah-badge mr-4">{formatArabicAyahNumber(verse.verseNumber)}</span>
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-8 pt-4">
                  {showTransliteration && (
                    <div className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 italic text-sky">
                      <Type size={18} className="shrink-0 mt-1 opacity-50" />
                      <p className="text-base leading-relaxed">{verse.translations.find(t => t.resourceId === config.transliterationResourceId)?.text}</p>
                    </div>
                  )}

                  {showTranslations && (
                    <div className="grid gap-6">
                      {selectedTranslationIds.map(tId => {
                        const tText = verse.translations.find(t => t.resourceId === tId);
                        const res = translationMap.get(tId);
                        if (!tText || !res) return null;
                        return (
                          <div key={tId} className="flex flex-col gap-3 p-6 rounded-2xl bg-white/5 border border-white/10">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{res.name}</span>
                            <p className="text-white/90 text-lg leading-relaxed">{tText.text}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isReaderModeOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background" onClick={() => setIsReaderModeOpen(false)} />
          <div className={cn("relative w-full max-w-6xl max-h-full flex flex-col panel border-primary/20 shadow-4xl", lightMode && "bg-white text-slate-900")}>
            <header className="p-6 md:p-8 flex items-center justify-between border-b border-black/10">
              <div className="flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <ScanText size={24} />
                </div>
                <div className="flex flex-col">
                  <h2 className="font-bebas text-2xl md:text-3xl tracking-wide text-white group-light:text-slate-900">
                    {readerChapter ? `${readerChapter.nameSimple} (${readerChapter.nameArabic})` : `Page ${readerPage}`}
                  </h2>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Arabic Reader Mode</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => setLightMode(!lightMode)} className="rounded-full hover:bg-black/5">
                  <Sun size={20} className={lightMode ? "text-primary" : "text-white"} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setIsReaderModeOpen(false)} className="rounded-full hover:bg-black/5">
                  <X size={24} className={lightMode ? "text-slate-900" : "text-white"} />
                </Button>
              </div>
            </header>

            <div className="p-4 md:p-6 bg-black/5 border-b border-black/10 flex flex-wrap items-center gap-4">
              <Select value={String(readerChapter?.id)} onValueChange={v => {
                const c = chapters.find(x => x.id === Number.parseInt(v, 10));
                if (c) { 
                  setChapterId(c.id); 
                  goToReaderPage(c.pages[0], "next"); 
                }
              }}>
                <SelectTrigger className="w-[180px] rounded-xl border-black/10 bg-white/10">
                  <SelectValue placeholder="Surah" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">{chapters.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nameSimple}</SelectItem>)}</SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon-sm" className="rounded-lg" disabled={readerPage <= 1} onClick={() => goToReaderPage(readerPage - 1, "prev")}>
                  <ChevronLeft size={16} />
                </Button>
                <div className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold border border-black/10 min-w-[100px] text-center">
                  Page {readerPage} / {maxPage}
                </div>
                <Button variant="outline" size="icon-sm" className="rounded-lg" disabled={readerPage >= maxPage} onClick={() => goToReaderPage(readerPage + 1, "next")}>
                  <ChevronRight size={16} />
                </Button>
              </div>
              
              <div className="flex-1" />
              <div className="flex items-center gap-4 px-4 h-11 bg-black/5 rounded-xl border border-black/5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Zoom</span>
                <Slider min={1.1} max={2.3} step={0.1} value={[fontScale]} onValueChange={([v]) => setFontScale(v)} className="w-32" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 md:p-20 scrollbar-premium">
              {readerLoading ? (
                <div className="size-full flex items-center justify-center animate-pulse"><RefreshCw className="animate-spin size-12 text-primary" /></div>
              ) : (
                <div className={cn("max-w-4xl mx-auto text-right leading-[3] transition-all duration-500", readerDirection === "next" ? "animate-in slide-in-from-right-10 fade-in" : "animate-in slide-in-from-left-10 fade-in")} dir="rtl">
                  {readerVerses.map(v => (
                    <span key={v.id}>
                      {script === "text_uthmani_tajweed" ? (
                        <span
                          className={cn("quran-arabic", arabicScriptClass(script))}
                          style={{ fontSize: `${fontScale * 1.8}rem`, lineHeight: 3 }}
                          dangerouslySetInnerHTML={{ __html: verseTextByScript(v, script) }}
                        />
                      ) : (
                        <span
                          className={cn("quran-arabic", arabicScriptClass(script))}
                          style={{ fontSize: `${fontScale * 1.8}rem`, lineHeight: 3 }}
                        >
                          {verseTextByScript(v, script)}
                        </span>
                      )}
                      <span className="reader-ayah-no mx-1">{formatArabicAyahNumber(v.verseNumber)}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <footer className="p-6 bg-black/5 border-t border-black/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              <span>{readerChapter?.translatedName} • {readerChapter?.revelationPlace}</span>
              <div className="flex items-center gap-2">
                <Maximize2 size={12} className="text-primary" />
                Immersive 13-Line Inspired Page Mode
              </div>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
