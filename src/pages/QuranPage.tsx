import './quran.css'
import { Button } from "@/components/ui/button";
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
  PlayCircle,
  RotateCcw,
  ScanText,
  Search,
  Sun,
  Type,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

function loadStoredValue<T>(
  key: string,
  fallback: T,
  parser: (value: string) => T | null,
): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const stored = window.localStorage.getItem(key);
  if (!stored) {
    return fallback;
  }

  try {
    return parser(stored) ?? fallback;
  } catch {
    return fallback;
  }
}

function chapterLabel(chapter: QuranChapter): string {
  return `${chapter.id}. ${chapter.nameSimple} (${chapter.translatedName})`;
}

function clampPage(page: number, maxPage: number): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.min(maxPage, page));
}

function arabicScriptClass(script: QuranScript): string {
  switch (script) {
    case "text_qpc_hafs":
      return "quran-script-qpc";
    case "text_qpc_nastaleeq_hafs":
      return "quran-script-nastaleeq";
    default:
      return "quran-script-uthmani";
  }
}

export function QuranPage({ config, cache }: QuranPageProps) {
  const [chapters, setChapters] = useState<QuranChapter[]>([]);
  const [translations, setTranslations] = useState<QuranTranslationResource[]>(
    [],
  );
  const [reciters, setReciters] = useState<QuranReciter[]>([]);

  const [bootstrapLoading, setBootstrapLoading] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const [chapterId, setChapterId] = useState(() =>
    loadStoredValue("rijal:quran:chapter", config.defaultChapterId, (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }),
  );

  const [reciterId, setReciterId] = useState(() =>
    loadStoredValue("rijal:quran:reciter", config.defaultReciterId, (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }),
  );

  const [script, setScript] = useState<QuranScript>(() =>
    loadStoredValue("rijal:quran:script", config.defaultScript, (value) => {
      if (SCRIPT_OPTIONS.includes(value as QuranScript)) {
        return value as QuranScript;
      }

      return null;
    }),
  );

  const [fontScale, setFontScale] = useState(() =>
    loadStoredValue("rijal:quran:font-scale", 1.45, (value) => {
      const parsed = Number.parseFloat(value);
      return Number.isNaN(parsed) ? null : Math.max(1.1, Math.min(2.3, parsed));
    }),
  );

  const [showTransliteration, setShowTransliteration] = useState(() =>
    loadStoredValue("rijal:quran:show-transliteration", true, (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return null;
    }),
  );

  const [showTranslations, setShowTranslations] = useState(() =>
    loadStoredValue("rijal:quran:show-translations", true, (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return null;
    }),
  );

  const [lightMode, setLightMode] = useState(() =>
    loadStoredValue("rijal:quran:light-mode", false, (value) => {
      if (value === "true") return true;
      if (value === "false") return false;
      return null;
    }),
  );

  const [selectedTranslationIds, setSelectedTranslationIds] = useState<
    number[]
  >(() =>
    loadStoredValue(
      "rijal:quran:translations",
      config.defaultTranslationIds,
      (value) => {
        const parsed = JSON.parse(value) as unknown;
        if (!Array.isArray(parsed)) {
          return null;
        }

        const asNumbers = parsed
          .map((item) => Number.parseInt(String(item), 10))
          .filter((item) => Number.isFinite(item));

        return asNumbers.length > 0 ? asNumbers : null;
      },
    ),
  );

  const [translationQuery, setTranslationQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");

  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [versesLoading, setVersesLoading] = useState(false);
  const [versesError, setVersesError] = useState<string | null>(null);

  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [isReaderModeOpen, setIsReaderModeOpen] = useState(false);
  const [readerPage, setReaderPage] = useState(() =>
    loadStoredValue("rijal:quran:reader-page", 1, (value) => {
      const parsed = Number.parseInt(value, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }),
  );
  const [readerDirection, setReaderDirection] = useState<
    "next" | "prev" | null
  >(null);
  const [readerVerses, setReaderVerses] = useState<QuranPageVerse[]>([]);
  const [readerLoading, setReaderLoading] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setBootstrapLoading(true);
    void loadQuranBootstrap(config.apiBaseUrl, {
      ttlMs: quranTtlHelpers().hoursToMs(cache.bootstrapHours),
    })
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setChapters(payload.chapters);
        setTranslations(payload.translations);
        setReciters(payload.reciters);
        setBootstrapError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setBootstrapError(
          error instanceof Error
            ? error.message
            : "Failed loading Quran resources.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setBootstrapLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cache.bootstrapHours, config.apiBaseUrl]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("rijal:quran:chapter", String(chapterId));
  }, [chapterId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("rijal:quran:reciter", String(reciterId));
  }, [reciterId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("rijal:quran:script", script);
  }, [script]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("rijal:quran:font-scale", String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "rijal:quran:show-transliteration",
      String(showTransliteration),
    );
  }, [showTransliteration]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "rijal:quran:show-translations",
      String(showTranslations),
    );
  }, [showTranslations]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("rijal:quran:light-mode", String(lightMode));
  }, [lightMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "rijal:quran:translations",
      JSON.stringify(selectedTranslationIds),
    );
  }, [selectedTranslationIds]);

  const maxPage = useMemo(() => {
    if (chapters.length === 0) {
      return 604;
    }

    return chapters.reduce(
      (highest, chapter) => Math.max(highest, chapter.pages[1]),
      1,
    );
  }, [chapters]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("rijal:quran:reader-page", String(readerPage));
  }, [readerPage]);

  useEffect(() => {
    if (translations.length === 0) {
      return;
    }

    const allowedIds = new Set(
      translations.map((translation) => translation.id),
    );
    const validatedSelection = selectedTranslationIds.filter((id) =>
      allowedIds.has(id),
    );

    if (validatedSelection.length === 0) {
      const fallback = config.defaultTranslationIds.find((id) =>
        allowedIds.has(id),
      );
      if (fallback) {
        setSelectedTranslationIds([fallback]);
      } else {
        setSelectedTranslationIds([translations[0].id]);
      }
      return;
    }

    if (validatedSelection.length !== selectedTranslationIds.length) {
      setSelectedTranslationIds(validatedSelection);
    }
  }, [config.defaultTranslationIds, selectedTranslationIds, translations]);

  useEffect(() => {
    if (chapters.length === 0) {
      return;
    }

    if (!chapters.some((chapter) => chapter.id === chapterId)) {
      setChapterId(config.defaultChapterId);
    }
  }, [chapterId, chapters, config.defaultChapterId]);

  useEffect(() => {
    if (reciters.length === 0) {
      return;
    }

    if (!reciters.some((reciter) => reciter.id === reciterId)) {
      setReciterId(config.defaultReciterId);
    }
  }, [config.defaultReciterId, reciterId, reciters]);

  const translationIdsToFetch = useMemo(() => {
    const base: number[] = [];

    if (showTranslations) {
      base.push(...selectedTranslationIds);
    }

    if (showTransliteration) {
      base.push(config.transliterationResourceId);
    }

    return [...new Set(base)];
  }, [
    config.transliterationResourceId,
    selectedTranslationIds,
    showTranslations,
    showTransliteration,
  ]);

  useEffect(() => {
    let isMounted = true;
    setVersesLoading(true);

    void loadChapterVerses({
      apiBaseUrl: config.apiBaseUrl,
      chapterId,
      translationIds: translationIdsToFetch,
      ttlMs: quranTtlHelpers().daysToMs(cache.chapterVersesDays),
    })
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setVerses(payload);
        setVersesError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setVersesError(
          error instanceof Error
            ? error.message
            : "Unable to load verses right now.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setVersesLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    cache.chapterVersesDays,
    chapterId,
    config.apiBaseUrl,
    translationIdsToFetch,
  ]);

  useEffect(() => {
    let isMounted = true;

    void loadChapterAudioUrl({
      apiBaseUrl: config.apiBaseUrl,
      chapterId,
      reciterId,
      ttlMs: quranTtlHelpers().hoursToMs(cache.chapterAudioHours),
    })
      .then((result) => {
        if (isMounted) {
          setAudioUrl(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          setAudioUrl(null);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cache.chapterAudioHours, chapterId, config.apiBaseUrl, reciterId]);

  useEffect(() => {
    if (!isReaderModeOpen) {
      return;
    }

    let isMounted = true;
    const page = clampPage(readerPage, maxPage);
    if (page !== readerPage) {
      setReaderPage(page);
    }

    setReaderLoading(true);
    void loadQuranPageVerses({
      apiBaseUrl: config.apiBaseUrl,
      pageNumber: page,
      ttlMs: quranTtlHelpers().daysToMs(cache.pageVersesDays),
    })
      .then((payload) => {
        if (!isMounted) {
          return;
        }

        setReaderVerses(payload);
        setReaderError(null);
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setReaderError(
          error instanceof Error
            ? error.message
            : "Unable to load this Quran page.",
        );
      })
      .finally(() => {
        if (isMounted) {
          setReaderLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [
    cache.pageVersesDays,
    config.apiBaseUrl,
    isReaderModeOpen,
    maxPage,
    readerPage,
  ]);

  useEffect(() => {
    if (!isReaderModeOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isReaderModeOpen]);

  useEffect(() => {
    if (!isReaderModeOpen) {
      return;
    }

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setIsReaderModeOpen(false);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [isReaderModeOpen]);

  const selectedChapter = useMemo(
    () => chapters.find((chapter) => chapter.id === chapterId),
    [chapterId, chapters],
  );

  const translationMap = useMemo(() => {
    const map = new Map<number, QuranTranslationResource>();

    for (const translation of translations) {
      map.set(translation.id, translation);
    }

    return map;
  }, [translations]);

  const languageOptions = useMemo(
    () => [
      "all",
      ...new Set(translations.map((translation) => translation.languageName)),
    ],
    [translations],
  );

  const filteredTranslations = useMemo(() => {
    const query = translationQuery.trim().toLowerCase();

    return translations.filter((translation) => {
      if (
        languageFilter !== "all" &&
        translation.languageName !== languageFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return (
        translation.name.toLowerCase().includes(query) ||
        translation.authorName.toLowerCase().includes(query) ||
        translation.languageName.toLowerCase().includes(query)
      );
    });
  }, [languageFilter, translationQuery, translations]);

  const selectedTranslationResources = useMemo(
    () =>
      selectedTranslationIds
        .map((id) => translationMap.get(id))
        .filter((translation): translation is QuranTranslationResource =>
          Boolean(translation),
        ),
    [selectedTranslationIds, translationMap],
  );

  const readerChapter = useMemo(
    () =>
      chapters.find(
        (chapter) =>
          readerPage >= chapter.pages[0] && readerPage <= chapter.pages[1],
      ),
    [chapters, readerPage],
  );

  const readerPageOptions = useMemo(
    () => Array.from({ length: maxPage }, (_, index) => index + 1),
    [maxPage],
  );

  useEffect(() => {
    if (!isReaderModeOpen || !readerChapter || chapterId === readerChapter.id) {
      return;
    }

    setChapterId(readerChapter.id);
  }, [chapterId, isReaderModeOpen, readerChapter]);

  const toggleTranslation = (translationId: number): void => {
    const exists = selectedTranslationIds.includes(translationId);

    if (exists) {
      const without = selectedTranslationIds.filter(
        (id) => id !== translationId,
      );
      if (without.length > 0) {
        setSelectedTranslationIds(without);
      }
      return;
    }

    if (selectedTranslationIds.length >= config.maxSelectableTranslations) {
      return;
    }

    setSelectedTranslationIds([...selectedTranslationIds, translationId]);
  };

  const goToReaderPage = (
    nextPage: number,
    direction: "next" | "prev" | null,
  ): void => {
    setReaderDirection(direction);
    setReaderPage(clampPage(nextPage, maxPage));
  };

  const openReaderMode = (): void => {
    const startingPage = selectedChapter?.pages[0] ?? 1;
    setReaderDirection(null);
    setReaderPage(clampPage(startingPage, maxPage));
    setIsReaderModeOpen(true);
  };

  const resetQuranPreferences = (): void => {
    const defaultChapterPage =
      chapters.find((chapter) => chapter.id === config.defaultChapterId)
        ?.pages[0] ?? 1;

    setChapterId(config.defaultChapterId);
    setReciterId(config.defaultReciterId);
    setScript(config.defaultScript);
    setFontScale(1.45);
    setShowTransliteration(true);
    setShowTranslations(true);
    setLightMode(false);
    setSelectedTranslationIds(config.defaultTranslationIds);
    setTranslationQuery("");
    setLanguageFilter("all");
    setReaderPage(clampPage(defaultChapterPage, maxPage));
    setReaderDirection(null);
    setIsReaderModeOpen(false);

    if (typeof window !== "undefined") {
      const keys = Object.keys(window.localStorage).filter((key) =>
        key.startsWith("rijal:quran:"),
      );
      for (const key of keys) {
        window.localStorage.removeItem(key);
      }
    }
  };

  return (
    <main
      className={
        lightMode
          ? "page-grid quran-page quran-theme-light"
          : "page-grid quran-page"
      }
    >
      <section className="panel reveal quran-hero">
        <p className="kicker">
          <BookOpenText size={16} />
          Al-Quran
        </p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
        <p className="quran-meta">
          {selectedChapter
            ? `${selectedChapter.nameSimple} • ${selectedChapter.nameArabic}`
            : "Loading chapter info..."}
        </p>
        <p className="source-note">
          Resume point is saved locally: Surah {chapterId}, page {readerPage}.
        </p>
      </section>

      <section className="panel reveal quran-controls-panel">
        {bootstrapLoading ? (
          <p className="state-text">Loading Quran resources...</p>
        ) : null}
        {bootstrapError ? (
          <p className="state-text error">{bootstrapError}</p>
        ) : null}

        {!bootstrapLoading && !bootstrapError ? (
          <>
            <div className="quran-controls-grid">
              <label className="select-wrap" htmlFor="quran-chapter-select">
                Surah
                <select
                  id="quran-chapter-select"
                  value={chapterId}
                  onChange={(event) =>
                    setChapterId(Number.parseInt(event.target.value, 10))
                  }
                >
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapterLabel(chapter)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select-wrap" htmlFor="quran-reciter-select">
                Reciter Audio
                <select
                  id="quran-reciter-select"
                  value={reciterId}
                  onChange={(event) =>
                    setReciterId(Number.parseInt(event.target.value, 10))
                  }
                >
                  {reciters.map((reciter) => (
                    <option key={reciter.id} value={reciter.id}>
                      {reciter.reciterName}
                      {reciter.style ? ` (${reciter.style})` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select-wrap" htmlFor="quran-script-select">
                Script
                <select
                  id="quran-script-select"
                  value={script}
                  onChange={(event) =>
                    setScript(event.target.value as QuranScript)
                  }
                >
                  {SCRIPT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {scriptLabel(option)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select-wrap" htmlFor="quran-font-scale">
                Text Size ({fontScale.toFixed(2)}x)
                <input
                  id="quran-font-scale"
                  type="range"
                  min="1.1"
                  max="2.3"
                  step="0.05"
                  value={fontScale}
                  onChange={(event) =>
                    setFontScale(Number.parseFloat(event.target.value))
                  }
                />
              </label>
            </div>

            <div className="quran-toggle-row">
              <label className="tick-option">
                <input
                  type="checkbox"
                  checked={showTranslations}
                  onChange={(event) =>
                    setShowTranslations(event.target.checked)
                  }
                />
                <span>Show translations</span>
              </label>

              <label className="tick-option">
                <input
                  type="checkbox"
                  checked={showTransliteration}
                  onChange={(event) =>
                    setShowTransliteration(event.target.checked)
                  }
                />
                <span>Show transliteration</span>
              </label>

              <label className="tick-option">
                <input
                  type="checkbox"
                  checked={lightMode}
                  onChange={(event) => setLightMode(event.target.checked)}
                />
                <span>Light mode</span>
              </label>

              <Button
                type="button"
                className="icon-btn"
                onClick={openReaderMode}
                variant="outline"
                size="sm"
              >
                <ScanText size={14} />
                Arabic reader mode
              </Button>

              <Button
                type="button"
                className="icon-btn"
                onClick={resetQuranPreferences}
                variant="outline"
                size="sm"
              >
                <RotateCcw size={14} />
                Reset Quran
              </Button>

              <span className="state-text">
                {selectedTranslationIds.length}/
                {config.maxSelectableTranslations} translations selected
              </span>
            </div>

            <div className="quran-audio-wrap">
              <p className="kicker audio-kicker">
                <PlayCircle size={14} />
                Surah Audio
              </p>
              {audioUrl ? (
                <audio key={audioUrl} controls src={audioUrl} preload="none" />
              ) : (
                <p className="state-text">Audio unavailable.</p>
              )}
            </div>

            <details className="translation-picker">
              <summary>
                <Languages size={14} />
                Translation Library
              </summary>
              <div className="translation-filter-row">
                <label className="input-wrap" htmlFor="translation-search">
                  <Search size={14} />
                  <input
                    id="translation-search"
                    value={translationQuery}
                    onChange={(event) =>
                      setTranslationQuery(event.target.value)
                    }
                    placeholder="Search translation, author, or language"
                  />
                </label>

                <label
                  className="select-wrap"
                  htmlFor="translation-language-filter"
                >
                  Language
                  <select
                    id="translation-language-filter"
                    value={languageFilter}
                    onChange={(event) => setLanguageFilter(event.target.value)}
                  >
                    {languageOptions.map((language) => (
                      <option key={language} value={language}>
                        {language === "all" ? "All languages" : language}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="translation-list">
                {filteredTranslations.map((translation) => {
                  const checked = selectedTranslationIds.includes(
                    translation.id,
                  );
                  const disableNewSelection =
                    !checked &&
                    selectedTranslationIds.length >=
                      config.maxSelectableTranslations;

                  return (
                    <label
                      key={translation.id}
                      className={
                        checked
                          ? "translation-option checked"
                          : "translation-option"
                      }
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disableNewSelection}
                        onChange={() => toggleTranslation(translation.id)}
                      />
                      <span>
                        <strong>{translation.name}</strong>
                        <small>
                          {translation.languageName} • {translation.authorName}
                        </small>
                      </span>
                    </label>
                  );
                })}
              </div>
            </details>

            <div className="translation-chip-row">
              {selectedTranslationResources.map((translation) => (
                <Button
                  key={translation.id}
                  type="button"
                  className="social-pill"
                  onClick={() => toggleTranslation(translation.id)}
                  variant="outline"
                  size="sm"
                >
                  {translation.name}
                </Button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      <section className="panel reveal quran-reader-panel">
        {versesLoading ? <p className="state-text">Loading verses...</p> : null}
        {versesError ? <p className="state-text error">{versesError}</p> : null}

        <div className="verse-list">
          {verses.map((verse) => {
            const transliteration = verse.translations.find(
              (translation) =>
                translation.resourceId === config.transliterationResourceId,
            );

            return (
              <article key={verse.id} className="verse-card">
                <header className="verse-header">
                  <strong>{verse.verseKey}</strong>
                  <span>Ayah {verse.verseNumber}</span>
                </header>

                <div className="quran-arabic-line">
                  {script === "text_uthmani_tajweed" ? (
                    <p
                      className={`quran-arabic ${arabicScriptClass(script)}`}
                      style={{ fontSize: `${fontScale}rem` }}
                      dangerouslySetInnerHTML={{
                        __html: verseTextByScript(verse, script),
                      }}
                    />
                  ) : (
                    <p
                      className={`quran-arabic ${arabicScriptClass(script)}`}
                      style={{ fontSize: `${fontScale}rem` }}
                    >
                      {verseTextByScript(verse, script)}
                    </p>
                  )}
                  <span
                    className="ayah-badge"
                    aria-label={`Ayah ${verse.verseNumber}`}
                  >
                    {formatArabicAyahNumber(verse.verseNumber)}
                  </span>
                </div>

                {showTransliteration && transliteration ? (
                  <p className="quran-transliteration">
                    <Type size={14} />
                    {transliteration.text}
                  </p>
                ) : null}

                {showTranslations ? (
                  <div className="verse-translations">
                    {selectedTranslationIds.map((translationId) => {
                      const translationText = verse.translations.find(
                        (translation) =>
                          translation.resourceId === translationId,
                      );
                      const resource = translationMap.get(translationId);

                      if (!translationText || !resource) {
                        return null;
                      }

                      return (
                        <article
                          key={`${verse.id}-${translationId}`}
                          className="verse-translation-block"
                        >
                          <h4>{resource.name}</h4>
                          <p>{translationText.text}</p>
                        </article>
                      );
                    })}
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>

      {isReaderModeOpen ? (
        <div
          className="reader-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Arabic reader mode"
        >
          <div
            className="reader-overlay"
            onClick={() => setIsReaderModeOpen(false)}
            aria-hidden="true"
          />
          <section className="reader-modal-panel panel">
            <header className="reader-modal-header">
              <div>
                <p className="kicker">
                  <ScanText size={14} />
                  Quran Arabic Reader
                </p>
                <h2>
                  {readerChapter
                    ? `${readerChapter.id}. ${readerChapter.nameSimple} (${readerChapter.nameArabic})`
                    : `Quran Page ${readerPage}`}
                </h2>
              </div>
              <div className="reader-header-actions">
                <Button
                  type="button"
                  className={lightMode ? "icon-btn active" : "icon-btn"}
                  onClick={() => setLightMode((value) => !value)}
                  variant="outline"
                  size="sm"
                >
                  <Sun size={14} />
                  Light mode
                </Button>
                <Button
                  type="button"
                  className="icon-btn"
                  onClick={() => setIsReaderModeOpen(false)}
                  aria-label="Close Arabic reader mode"
                  variant="outline"
                  size="sm"
                >
                  <X size={14} />
                  Close
                </Button>
              </div>
            </header>

            <div className="reader-toolbar">
              <label className="select-wrap" htmlFor="reader-surah-select">
                Jump to Surah
                <select
                  id="reader-surah-select"
                  value={readerChapter?.id ?? chapterId}
                  onChange={(event) => {
                    const nextChapterId = Number.parseInt(
                      event.target.value,
                      10,
                    );
                    const nextChapter = chapters.find(
                      (chapter) => chapter.id === nextChapterId,
                    );
                    if (!nextChapter) {
                      return;
                    }

                    setChapterId(nextChapter.id);
                    goToReaderPage(nextChapter.pages[0], "next");
                  }}
                >
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapterLabel(chapter)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="select-wrap" htmlFor="reader-page-select">
                Jump to Page
                <select
                  id="reader-page-select"
                  value={readerPage}
                  onChange={(event) =>
                    goToReaderPage(
                      Number.parseInt(event.target.value, 10),
                      "next",
                    )
                  }
                >
                  {readerPageOptions.map((page) => (
                    <option key={page} value={page}>
                      Page {page}
                    </option>
                  ))}
                </select>
              </label>

              <div className="reader-nav-row">
                <Button
                  type="button"
                  className="icon-btn"
                  disabled={readerPage <= 1}
                  onClick={() => goToReaderPage(readerPage - 1, "prev")}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                <Button
                  type="button"
                  className="icon-btn"
                  disabled={readerPage >= maxPage}
                  onClick={() => goToReaderPage(readerPage + 1, "next")}
                  variant="outline"
                  size="sm"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>

            {readerLoading ? (
              <p className="state-text">Loading Quran page...</p>
            ) : null}
            {readerError ? (
              <p className="state-text error">{readerError}</p>
            ) : null}

            <div className="reader-page-card">
              <div
                className={
                  readerDirection === "next"
                    ? "reader-flow animate-next"
                    : readerDirection === "prev"
                      ? "reader-flow animate-prev"
                      : "reader-flow"
                }
              >
                {readerVerses.map((verse) => (
                  <span
                    key={verse.id}
                    className="reader-verse-inline"
                    style={{ fontSize: `${fontScale * 1.05}rem` }}
                  >
                    {script === "text_uthmani_tajweed" ? (
                      <span
                        className={`reader-verse-text ${arabicScriptClass(script)}`}
                        dangerouslySetInnerHTML={{
                          __html: verseTextByScript(verse, script),
                        }}
                      />
                    ) : (
                      <span
                        className={`reader-verse-text ${arabicScriptClass(script)}`}
                      >
                        {verseTextByScript(verse, script)}
                      </span>
                    )}
                    <span className="reader-ayah-no">
                      {formatArabicAyahNumber(verse.verseNumber)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            <p className="source-note">
              13-line-inspired page mode for focused Arabic reading. Use the
              controls above to jump by surah or page.
            </p>
          </section>
        </div>
      ) : null}
    </main>
  );
}
