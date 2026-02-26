import {
  loadPrayerTimesForLocation,
  pickRecommendedLocation,
  type PrayerTimesSnapshot,
} from "@/lib/prayer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import type {
  AdhanMadhab,
  LinksConfig,
  PrayerCacheConfig,
  PrayerConfig,
} from "@/types/content";
import { Pause, Play, Radio, Volume2, VolumeX, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation } from "react-router-dom";

const ADHAN_ALERT_ENABLED_KEY = "rijal:adhan-alert:enabled";
const ADHAN_ALERT_LAST_PLAYED_KEY = "rijal:adhan-alert:last-played";
const ADHAN_ALERT_MUTED_KEY = "rijal:adhan-alert:muted";
const PRAYER_CLOCK_24_KEY = "rijal:prayer:clock24";

const LAST_DEVICE_COORDS_KEY = "rijal:prayer:last-device-coords";
const SELECTED_LOCATION_KEY = "rijal:prayer:selected-location-id";
const USE_DEVICE_COORDS_KEY = "rijal:prayer:use-device-coords";
const MADHAB_OVERRIDES_KEY = "rijal:prayer:madhab-overrides:v1";

interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

interface DuePrayer {
  date: string;
  prayer: {
    name: string;
    time24: string;
  };
}

interface NextPrayerTrigger {
  delayMs: number;
}

interface AdhanAlertContextValue {
  isAdhanAlertEnabled: boolean;
  setIsAdhanAlertEnabled: (enabled: boolean) => void;
  isAudioPlaying: boolean;
  isMuted: boolean;
  toggleAudioPlayback: () => void;
  toggleMuted: () => void;
  statusMessage: string | null;
  use24HourClock: boolean;
  setExternalPrayerSnapshot: (snapshot: PrayerTimesSnapshot | null) => void;
}

interface AdhanAlertProviderProps {
  links: LinksConfig;
  prayerConfig: PrayerConfig;
  prayerCache: PrayerCacheConfig;
  children: ReactNode;
}

const AdhanAlertContext = createContext<AdhanAlertContextValue | null>(null);

function loadStoredDeviceCoords(): GeoCoordinate | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(LAST_DEVICE_COORDS_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const latitude = Number((parsed as Record<string, unknown>).latitude);
    const longitude = Number((parsed as Record<string, unknown>).longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  } catch {
    return null;
  }
}

function loadStoredMadhabOverrides(): Record<string, AdhanMadhab> {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(MADHAB_OVERRIDES_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return {};
    }

    const result: Record<string, AdhanMadhab> = {};
    for (const [locationId, value] of Object.entries(
      parsed as Record<string, unknown>,
    )) {
      if (
        (value === "shafi" || value === "hanafi") &&
        locationId.trim().length > 0
      ) {
        result[locationId] = value;
      }
    }

    return result;
  } catch {
    return {};
  }
}

function getDateKeyInTimezone(timezone: string, now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";

  return `${year}-${month}-${day}`;
}

function getNowSecondsInTimezone(timezone: string, now: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(now);

  const hours = Number.parseInt(
    parts.find((part) => part.type === "hour")?.value ?? "0",
    10,
  );
  const minutes = Number.parseInt(
    parts.find((part) => part.type === "minute")?.value ?? "0",
    10,
  );
  const seconds = Number.parseInt(
    parts.find((part) => part.type === "second")?.value ?? "0",
    10,
  );

  return hours * 3600 + minutes * 60 + seconds;
}

function parsePrayerSeconds(time24: string): number {
  const [hoursRaw, minutesRaw] = time24.split(":");
  const hours = Number.parseInt(hoursRaw, 10);
  const minutes = Number.parseInt(minutesRaw, 10);

  return (
    (Number.isNaN(hours) ? 0 : hours) * 3600 +
    (Number.isNaN(minutes) ? 0 : minutes) * 60
  );
}

function findDuePrayer(
  snapshot: PrayerTimesSnapshot,
  windowSeconds: number,
  now = new Date(),
): DuePrayer | null {
  const todayKey = getDateKeyInTimezone(snapshot.location.timezone, now);
  const todaySchedule = snapshot.weekSchedule?.find(
    (day) => day.date === todayKey,
  );
  if (!todaySchedule) {
    return null;
  }

  const nowSeconds = getNowSecondsInTimezone(snapshot.location.timezone, now);
  const due = todaySchedule.prayers.find((prayer) => {
    const delta = nowSeconds - parsePrayerSeconds(prayer.time24);
    return delta >= 0 && delta <= windowSeconds;
  });

  if (!due) {
    return null;
  }

  return {
    date: todaySchedule.date,
    prayer: due,
  };
}

function parseTimezoneOffsetMinutes(value: string): number | null {
  if (value === "GMT" || value === "UTC") {
    return 0;
  }

  const match = value.match(/^GMT([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number.parseInt(match[2], 10);
  const minutes = Number.parseInt(match[3] ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return sign * (hours * 60 + minutes);
}

function getTimezoneOffsetMinutes(
  timezone: string,
  instant: Date,
): number | null {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
    timeZoneName: "shortOffset",
  }).formatToParts(instant);

  const zoneName = parts.find((part) => part.type === "timeZoneName")?.value;
  if (!zoneName) {
    return null;
  }

  return parseTimezoneOffsetMinutes(zoneName);
}

function getPrayerTimestampMs(
  timezone: string,
  dateKey: string,
  time24: string,
): number | null {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const [hoursRaw, minutesRaw] = time24.split(":");
  const year = Number.parseInt(yearRaw ?? "", 10);
  const month = Number.parseInt(monthRaw ?? "", 10);
  const day = Number.parseInt(dayRaw ?? "", 10);
  const hours = Number.parseInt(hoursRaw ?? "", 10);
  const minutes = Number.parseInt(minutesRaw ?? "", 10);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes)
  ) {
    return null;
  }

  const naiveUtcMs = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  let resolvedMs = naiveUtcMs;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const offsetMinutes = getTimezoneOffsetMinutes(
      timezone,
      new Date(resolvedMs),
    );
    if (offsetMinutes == null) {
      return null;
    }

    const adjustedMs = naiveUtcMs - offsetMinutes * 60_000;
    if (adjustedMs === resolvedMs) {
      break;
    }

    resolvedMs = adjustedMs;
  }

  return resolvedMs;
}

function findNextPrayerTrigger(
  snapshot: PrayerTimesSnapshot,
  now = new Date(),
): NextPrayerTrigger | null {
  let next: NextPrayerTrigger | null = null;

  for (const day of snapshot.weekSchedule ?? []) {
    for (const prayer of day.prayers) {
      const timestampMs = getPrayerTimestampMs(
        snapshot.location.timezone,
        day.date,
        prayer.time24,
      );
      if (timestampMs == null) {
        continue;
      }

      const delayMs = timestampMs - now.getTime();
      if (delayMs < 0) {
        continue;
      }

      if (!next || delayMs < next.delayMs) {
        next = { delayMs };
      }
    }
  }

  return next;
}

export function useAdhanAlert() {
  const context = useContext(AdhanAlertContext);
  if (!context) {
    throw new Error("useAdhanAlert must be used within AdhanAlertProvider");
  }

  return context;
}

export function AdhanAlertProvider({
  links,
  prayerConfig,
  prayerCache,
  children,
}: AdhanAlertProviderProps) {
  const routeLocation = useLocation();
  const adhanAlert = links.adhanAlert;
  const [prayerSnapshot, setPrayerSnapshot] =
    useState<PrayerTimesSnapshot | null>(null);
  const [clockTick, setClockTick] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [use24HourClock, setUse24HourClock] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(PRAYER_CLOCK_24_KEY) === "true";
  });

  const [isAdhanAlertEnabled, setIsAdhanAlertEnabled] = useState<boolean>(
    () => {
      if (typeof window === "undefined") {
        return adhanAlert?.enabled ?? true;
      }

      const stored = window.localStorage.getItem(ADHAN_ALERT_ENABLED_KEY);
      if (!stored) {
        return adhanAlert?.enabled ?? true;
      }

      return stored === "true";
    },
  );

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return window.localStorage.getItem(ADHAN_ALERT_MUTED_KEY) === "true";
  });
  const [dismissedDueMarker, setDismissedDueMarker] = useState<string | null>(
    null,
  );

  const duePrayer = useMemo(() => {
    if (!adhanAlert?.enabled || !prayerSnapshot || !isAdhanAlertEnabled) {
      return null;
    }

    return findDuePrayer(prayerSnapshot, adhanAlert.autoPlayWindowSeconds);
  }, [
    adhanAlert?.autoPlayWindowSeconds,
    adhanAlert?.enabled,
    clockTick,
    isAdhanAlertEnabled,
    prayerSnapshot,
  ]);
  const activeDueMarker = useMemo(() => {
    if (!duePrayer || !prayerSnapshot?.location.id) {
      return null;
    }

    return `${prayerSnapshot.location.id}:${duePrayer.date}:${duePrayer.prayer.name}`;
  }, [duePrayer, prayerSnapshot?.location.id]);

  const setExternalPrayerSnapshot = useCallback(
    (snapshot: PrayerTimesSnapshot | null) => {
      if (!snapshot) {
        return;
      }

      setPrayerSnapshot(snapshot);
      setClockTick((value) => value + 1);
    },
    [],
  );

  const reloadPrayerSnapshot =
    useCallback(async (): Promise<PrayerTimesSnapshot> => {
      const timezone =
        Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      const storedCoords = loadStoredDeviceCoords();
      const useDeviceCoords =
        typeof window !== "undefined" &&
        window.localStorage.getItem(USE_DEVICE_COORDS_KEY) === "true";
      const coordinateOverride =
        useDeviceCoords && storedCoords ? storedCoords : undefined;

      const fallbackLocation = pickRecommendedLocation(
        prayerConfig,
        timezone,
        coordinateOverride,
      );

      const selectedLocationId =
        typeof window === "undefined"
          ? null
          : window.localStorage.getItem(SELECTED_LOCATION_KEY);
      const selectedLocation =
        prayerConfig.locations.find(
          (location) => location.id === selectedLocationId,
        ) ?? fallbackLocation;

      const madhabOverrides = loadStoredMadhabOverrides();
      const selectedMadhab: AdhanMadhab =
        madhabOverrides[selectedLocation.id] ??
        selectedLocation.adhanMadhab ??
        "shafi";

      return loadPrayerTimesForLocation(selectedLocation, {
        cacheTtlMs: {
          feedMs: Math.max(1, prayerCache.londonFeedMinutes) * 60_000,
          adhanMs: Math.max(1, prayerCache.aladhanMinutes) * 60_000,
        },
        coordinateOverride,
        adhanMadhabOverride: selectedMadhab,
      });
    }, [
      prayerCache.aladhanMinutes,
      prayerCache.londonFeedMinutes,
      prayerConfig,
    ]);

  useEffect(() => {
    if (!adhanAlert?.enabled) {
      return;
    }

    let disposed = false;
    let running = false;

    const runReload = async (): Promise<void> => {
      if (running) {
        return;
      }

      running = true;
      try {
        const snapshot = await reloadPrayerSnapshot();
        if (!disposed) {
          setPrayerSnapshot(snapshot);
          setClockTick((value) => value + 1);
        }
      } catch {
        if (!disposed) {
          setStatusMessage(
            "Unable to refresh prayer schedule. Retrying shortly.",
          );
        }
      } finally {
        running = false;
      }
    };

    const onFocus = (): void => {
      void runReload();
      setClockTick((value) => value + 1);
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        void runReload();
        setClockTick((value) => value + 1);
      }
    };

    void runReload();

    const refreshMs = Math.max(1, prayerConfig.refreshMinutes) * 60_000;
    const interval = window.setInterval(() => {
      void runReload();
    }, refreshMs);

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [adhanAlert?.enabled, prayerConfig.refreshMinutes, reloadPrayerSnapshot]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncPreferences = (): void => {
      setUse24HourClock(
        window.localStorage.getItem(PRAYER_CLOCK_24_KEY) === "true",
      );
      setIsAdhanAlertEnabled(
        window.localStorage.getItem(ADHAN_ALERT_ENABLED_KEY) !== "false",
      );
      setIsMuted(window.localStorage.getItem(ADHAN_ALERT_MUTED_KEY) === "true");
    };

    const onVisibilityChange = (): void => {
      if (document.visibilityState === "visible") {
        syncPreferences();
      }
    };

    syncPreferences();
    window.addEventListener("storage", syncPreferences);
    window.addEventListener("focus", syncPreferences);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("storage", syncPreferences);
      window.removeEventListener("focus", syncPreferences);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      ADHAN_ALERT_ENABLED_KEY,
      String(isAdhanAlertEnabled),
    );
  }, [isAdhanAlertEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(ADHAN_ALERT_MUTED_KEY, String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.muted = isMuted;
  }, [isMuted]);

  useEffect(() => {
    if (!adhanAlert?.enabled || !prayerSnapshot || !isAdhanAlertEnabled) {
      return;
    }

    const nextPrayer = findNextPrayerTrigger(prayerSnapshot);
    if (!nextPrayer) {
      return;
    }

    const guardMs = Math.max(
      1_500,
      Math.min(5_000, adhanAlert.autoPlayWindowSeconds * 1_000),
    );
    const delayMs = Math.max(0, nextPrayer.delayMs);
    const notifyTick = (): void => setClockTick((value) => value + 1);

    const exactTimer = window.setTimeout(notifyTick, delayMs);
    const guardTimer = window.setTimeout(notifyTick, delayMs + guardMs);

    return () => {
      window.clearTimeout(exactTimer);
      window.clearTimeout(guardTimer);
    };
  }, [
    adhanAlert?.autoPlayWindowSeconds,
    adhanAlert?.enabled,
    clockTick,
    isAdhanAlertEnabled,
    prayerSnapshot,
  ]);

  useEffect(() => {
    if (!adhanAlert?.enabled || !prayerSnapshot || !duePrayer) {
      return;
    }

    const prayerStartMs = getPrayerTimestampMs(
      prayerSnapshot.location.timezone,
      duePrayer.date,
      duePrayer.prayer.time24,
    );
    if (prayerStartMs == null) {
      return;
    }

    const windowEndMs =
      prayerStartMs + adhanAlert.autoPlayWindowSeconds * 1_000;
    const delayMs = windowEndMs - Date.now() + 250;
    if (delayMs <= 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setClockTick((value) => value + 1);
    }, delayMs);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [
    adhanAlert?.autoPlayWindowSeconds,
    adhanAlert?.enabled,
    duePrayer,
    prayerSnapshot,
  ]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const onPlay = (): void => setIsAudioPlaying(true);
    const onPause = (): void => setIsAudioPlaying(false);
    const onEnded = (): void => setIsAudioPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  useEffect(() => {
    if (!adhanAlert?.enabled || !duePrayer || !isAdhanAlertEnabled) {
      return;
    }

    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (dismissedDueMarker && dismissedDueMarker === activeDueMarker) {
      return;
    }

    if (
      typeof window !== "undefined" &&
      activeDueMarker &&
      window.localStorage.getItem(ADHAN_ALERT_LAST_PLAYED_KEY) ===
        activeDueMarker
    ) {
      return;
    }

    audio.currentTime = 0;
    audio.muted = isMuted;

    void audio
      .play()
      .then(() => {
        if (typeof window !== "undefined" && activeDueMarker) {
          window.localStorage.setItem(
            ADHAN_ALERT_LAST_PLAYED_KEY,
            activeDueMarker,
          );
        }
        setStatusMessage(`Adhan started for ${duePrayer.prayer.name}.`);
      })
      .catch(() => {
        setStatusMessage(
          "Autoplay could not start. Browser autoplay rules or unsupported audio format may block it.",
        );
      });
  }, [
    activeDueMarker,
    adhanAlert?.enabled,
    dismissedDueMarker,
    duePrayer,
    isAdhanAlertEnabled,
    isMuted,
    prayerSnapshot?.location.id,
  ]);

  const toggleAudioPlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (isAudioPlaying) {
      audio.pause();
      setStatusMessage("Adhan audio paused.");
      return;
    }

    audio.currentTime = 0;
    audio.muted = isMuted;
    void audio
      .play()
      .then(() => {
        setStatusMessage("Adhan audio playing.");
      })
      .catch(() => {
        setStatusMessage(
          "Audio could not start. Check browser sound/autoplay permissions.",
        );
      });
  }, [isAudioPlaying, isMuted]);

  const toggleMuted = useCallback(() => {
    setIsMuted((current) => {
      const next = !current;
      setStatusMessage(next ? "Adhan muted." : "Adhan unmuted.");
      return next;
    });
  }, []);
  const dismissCurrentAdhanMoment = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    if (activeDueMarker) {
      setDismissedDueMarker(activeDueMarker);
    }
    setStatusMessage("Adhan dismissed for this prayer.");
  }, [activeDueMarker]);

  const contextValue = useMemo<AdhanAlertContextValue>(
    () => ({
      isAdhanAlertEnabled,
      setIsAdhanAlertEnabled,
      isAudioPlaying,
      isMuted,
      toggleAudioPlayback,
      toggleMuted,
      statusMessage,
      use24HourClock,
      setExternalPrayerSnapshot,
    }),
    [
      isAdhanAlertEnabled,
      isAudioPlaying,
      isMuted,
      setExternalPrayerSnapshot,
      statusMessage,
      toggleAudioPlayback,
      toggleMuted,
      use24HourClock,
    ],
  );

  const showMiniPlayer =
    Boolean(adhanAlert?.enabled) &&
    routeLocation.pathname !== "/" &&
    (isAudioPlaying ||
      (Boolean(activeDueMarker) && dismissedDueMarker !== activeDueMarker));

  return (
    <AdhanAlertContext.Provider value={contextValue}>
      {children}

      {adhanAlert?.enabled ? (
        <audio ref={audioRef} src={adhanAlert.audioUrl} preload="none" />
      ) : null}

      {showMiniPlayer ? (
        <section
          className="adhan-mini-player panel"
          aria-label="Adhan mini player"
        >
          <header className="adhan-mini-header">
            <p className="kicker">
              <Radio size={13} />
              {adhanAlert?.title ?? "Adhan Alert"}
            </p>
            <div className="adhan-mini-top-actions">
              <label className="tick-option switch-row">
                <Switch
                  checked={isAdhanAlertEnabled}
                  onCheckedChange={setIsAdhanAlertEnabled}
                />
                <span>Alert on</span>
              </label>
              <Button
                type="button"
                className="icon-btn"
                onClick={dismissCurrentAdhanMoment}
                aria-label="Dismiss current adhan"
                variant="outline"
                size="sm"
              >
                <X size={14} />
                Close
              </Button>
            </div>
          </header>
          <div className="adhan-mini-actions">
            <Button
              type="button"
              className="icon-btn"
              onClick={toggleAudioPlayback}
              variant="outline"
              size="sm"
            >
              {isAudioPlaying ? <Pause size={14} /> : <Play size={14} />}
              {isAudioPlaying ? "Pause" : "Play"}
            </Button>
            <Button
              type="button"
              className={`icon-btn ${isMuted ? "active" : ""}`}
              onClick={toggleMuted}
              variant="outline"
              size="sm"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              {isMuted ? "Muted" : "Mute"}
            </Button>
          </div>
          {statusMessage ? (
            <p className="source-note adhan-mini-status">{statusMessage}</p>
          ) : null}
        </section>
      ) : null}
    </AdhanAlertContext.Provider>
  );
}
