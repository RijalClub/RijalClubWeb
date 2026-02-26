import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  buildPrayerTimeline,
  formatCountdown,
  formatPrayerClock,
  loadPrayerTimesForLocation,
  pickRecommendedLocation,
  type PrayerTimeline,
  type PrayerTimesSnapshot,
} from "@/lib/prayer";
import type {
  AdhanMadhab,
  PrayerCacheConfig,
  PrayerConfig,
} from "@/types/content";
import { 
  CalendarDays, 
  LocateFixed, 
  RefreshCw, 
  RotateCcw, 
  Clock,
  MapPin,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface PrayerTimesWidgetProps {
  config: PrayerConfig;
  cache: PrayerCacheConfig;
  onPrayerDataChange?: (
    snapshot: PrayerTimesSnapshot | null,
    timeline: PrayerTimeline | null,
  ) => void;
}

interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

const LAST_DEVICE_COORDS_KEY = "rijal:prayer:last-device-coords";
const SELECTED_LOCATION_KEY = "rijal:prayer:selected-location-id";
const USE_DEVICE_COORDS_KEY = "rijal:prayer:use-device-coords";
const CLOCK_24_KEY = "rijal:prayer:clock24";
const MADHAB_OVERRIDES_KEY = "rijal:prayer:madhab-overrides:v1";

function loadStoredDeviceCoords(): GeoCoordinate | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LAST_DEVICE_COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { latitude: Number(parsed.latitude), longitude: Number(parsed.longitude) };
  } catch { return null; }
}

function loadStoredMadhabOverrides(): Record<string, AdhanMadhab> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(MADHAB_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function formatPrayerDateLabel(dateKey: string): string {
  const parsed = new Date(`${dateKey}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? dateKey : 
    new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "2-digit", month: "short" }).format(parsed);
}

export function PrayerTimesWidget({ config, cache, onPrayerDataChange }: PrayerTimesWidgetProps) {
  const timezone = useMemo(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC", []);
  const storedCoords = useMemo(() => loadStoredDeviceCoords(), []);
  const defaultLocation = useMemo(() => pickRecommendedLocation(config, timezone, storedCoords ?? undefined), [config, timezone, storedCoords]);

  const [selectedLocationId, setSelectedLocationId] = useState(() => {
    if (typeof window === "undefined") return defaultLocation.id;
    const stored = window.localStorage.getItem(SELECTED_LOCATION_KEY);
    return stored && config.locations.some(l => l.id === stored) ? stored : defaultLocation.id;
  });

  const [snapshot, setSnapshot] = useState<PrayerTimesSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [selectedWeekDate, setSelectedWeekDate] = useState<string | null>(null);
  const [deviceCoords, setDeviceCoords] = useState<GeoCoordinate | null>(storedCoords);
  const [useDeviceCoords, setUseDeviceCoords] = useState<boolean>(() => {
    if (typeof window === "undefined") return Boolean(storedCoords);
    const stored = window.localStorage.getItem(USE_DEVICE_COORDS_KEY);
    return stored ? stored === "true" : Boolean(storedCoords);
  });
  const [use24Hour, setUse24Hour] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(CLOCK_24_KEY) === "true";
  });
  const [madhabOverrides, setMadhabOverrides] = useState<Record<string, AdhanMadhab>>(() => loadStoredMadhabOverrides());
  const [geoRetrigger, setGeoRetrigger] = useState(0);

  const selectedLocation = useMemo(() => config.locations.find(l => l.id === selectedLocationId) ?? defaultLocation, [config.locations, defaultLocation, selectedLocationId]);
  const selectedMadhab = useMemo<AdhanMadhab>(() => madhabOverrides[selectedLocation.id] ?? selectedLocation.adhanMadhab ?? "shafi", [madhabOverrides, selectedLocation]);
  const adhanCoordinateOverride = useMemo(() => (useDeviceCoords && deviceCoords) ? { latitude: deviceCoords.latitude, longitude: deviceCoords.longitude } : undefined, [deviceCoords, useDeviceCoords]);

  const reloadTimes = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await loadPrayerTimesForLocation(selectedLocation, {
        cacheTtlMs: { feedMs: cache.londonFeedMinutes * 60_000, adhanMs: cache.aladhanMinutes * 60_000 },
        coordinateOverride: adhanCoordinateOverride,
        adhanMadhabOverride: selectedMadhab,
      });
      setSnapshot(result);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load prayer times.");
    } finally { setIsLoading(false); }
  }, [adhanCoordinateOverride, cache, selectedLocation, selectedMadhab]);

  useEffect(() => {
    reloadTimes();
    const interval = window.setInterval(reloadTimes, config.refreshMinutes * 60_000);
    return () => window.clearInterval(interval);
  }, [config.refreshMinutes, reloadTimes]);

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick(v => v + 1), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(CLOCK_24_KEY, String(use24Hour)); }, [use24Hour]);
  useEffect(() => { if (typeof window !== "undefined" && deviceCoords) window.localStorage.setItem(LAST_DEVICE_COORDS_KEY, JSON.stringify(deviceCoords)); }, [deviceCoords]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(USE_DEVICE_COORDS_KEY, String(useDeviceCoords)); }, [useDeviceCoords]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(SELECTED_LOCATION_KEY, selectedLocationId); }, [selectedLocationId]);
  useEffect(() => { if (typeof window !== "undefined") window.localStorage.setItem(MADHAB_OVERRIDES_KEY, JSON.stringify(madhabOverrides)); }, [madhabOverrides]);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setDeviceCoords(coords);
        if (window.localStorage.getItem(SELECTED_LOCATION_KEY) === null) {
          const nearest = pickRecommendedLocation(config, timezone, coords);
          setSelectedLocationId(nearest.id);
        }
        setUseDeviceCoords(true);
      },
      () => {},
      { timeout: 8000 }
    );
  }, [config, timezone, geoRetrigger]);

  const timeline = useMemo(() => snapshot ? buildPrayerTimeline(snapshot, use24Hour) : null, [snapshot, clockTick, use24Hour]);
  useEffect(() => { if (onPrayerDataChange) onPrayerDataChange(snapshot, timeline); }, [onPrayerDataChange, snapshot, timeline]);

  const weekSchedule = snapshot?.weekSchedule ?? [];
  useEffect(() => {
    if (weekSchedule.length === 0) { setSelectedWeekDate(null); return; }
    setSelectedWeekDate(current => {
      const defaultDate = weekSchedule.find(d => d.date === timeline?.nextDate)?.date ?? weekSchedule.find(d => d.date === snapshot?.dateLabel)?.date;
      return (current && weekSchedule.some(d => d.date === current)) ? current : (defaultDate ?? weekSchedule[0].date);
    });
  }, [snapshot?.dateLabel, timeline?.nextDate, weekSchedule]);

  const selectedWeekDay = useMemo(() => weekSchedule.find(d => d.date === selectedWeekDate) ?? weekSchedule[0], [selectedWeekDate, weekSchedule]);
  const displayedPrayers = selectedWeekDay?.prayers ?? snapshot?.prayers ?? [];
  const displayedDate = selectedWeekDay?.date ?? snapshot?.dateLabel;

  const handleUseLocation = () => {
    if (!navigator.geolocation) { setErrorMessage("Geolocation not available."); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeviceCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUseDeviceCoords(true);
        setErrorMessage(null);
        setIsLocating(false);
      },
      () => { setErrorMessage("Location access failed."); setIsLocating(false); },
      { timeout: 8000 }
    );
  };

  const handleResetPreferences = () => {
    setSelectedWeekDate(null); setUse24Hour(false); setUseDeviceCoords(false); setDeviceCoords(null); setMadhabOverrides({}); setErrorMessage(null);
    if (typeof window !== "undefined") {
      [SELECTED_LOCATION_KEY, USE_DEVICE_COORDS_KEY, LAST_DEVICE_COORDS_KEY, CLOCK_24_KEY, MADHAB_OVERRIDES_KEY].forEach(k => window.localStorage.removeItem(k));
    }
    setSelectedLocationId(pickRecommendedLocation(config, timezone).id);
    setGeoRetrigger(v => v + 1);
  };

  return (
    <section className="panel p-6 flex flex-col gap-6 reveal">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-bebas text-3xl tracking-wide text-white flex items-center gap-2">
            <Clock className="text-primary size-6" />
            {config.widgetTitle}
          </h2>
          {snapshot && (
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
              <MapPin size={10} />
              {selectedLocation.label} • {snapshot.dateLabel}
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" className="rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={() => reloadTimes()}>
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase" onClick={handleUseLocation} disabled={isLocating}>
            <LocateFixed size={14} className="mr-1.5" />
            {isLocating ? "Locating..." : "Auto"}
          </Button>
          <div className="flex p-0.5 rounded-full bg-white/5 border border-white/5">
            <Button 
              variant="ghost" size="xs" 
              className={cn("rounded-full text-[10px] font-bold px-3", !use24Hour ? "bg-white/15 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
              onClick={() => setUse24Hour(false)}
            >AM/PM</Button>
            <Button 
              variant="ghost" size="xs" 
              className={cn("rounded-full text-[10px] font-bold px-3", use24Hour ? "bg-white/15 text-white shadow-sm" : "text-muted-foreground hover:text-white")}
              onClick={() => setUse24Hour(true)}
            >24H</Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold ml-1">Location Profile</label>
          <Select value={selectedLocationId} onValueChange={(v) => { setSelectedLocationId(v); setUseDeviceCoords(false); }}>
            <SelectTrigger className="rounded-xl border-white/10 bg-white/5 text-xs text-white h-10 focus:ring-primary/20">
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent className="bg-background/95 backdrop-blur-xl border-white/10 text-white">
              {config.locations.map(l => <SelectItem key={l.id} value={l.id}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Calculation Madhab</label>
            <button onClick={handleResetPreferences} className="text-[9px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors flex items-center gap-1 font-bold">
              <RotateCcw size={8} /> Reset
            </button>
          </div>
          <div className="flex p-1 rounded-xl bg-white/5 border border-white/10 h-10">
            {["shafi", "hanafi"].map(m => (
              <button
                key={m}
                className={cn(
                  "flex-1 rounded-lg text-[10px] font-bold uppercase transition-all",
                  selectedMadhab === m ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-white"
                )}
                onClick={() => setMadhabOverrides(curr => ({ ...curr, [selectedLocation.id]: m as AdhanMadhab }))}
              >{m}</button>
            ))}
          </div>
        </div>
      </div>

      {errorMessage && <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-[11px] font-medium">{errorMessage}</div>}

      {snapshot && (
        <div className="flex flex-col gap-6">
          {timeline && (
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="rounded-full border-primary/30 text-primary bg-primary/10 text-[10px] font-bold uppercase tracking-wider">
                  Upcoming
                </Badge>
                <div className="text-white font-bebas text-2xl tracking-wide">
                  {formatCountdown(timeline.minutesUntilNext)}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Next Prayer</span>
                  <span className="text-white font-bold text-lg">{timeline.next.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">Time</span>
                  <div className="text-primary font-bold">{formatPrayerClock(timeline.next.time24, use24Hour)}</div>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground italic border-t border-primary/10 pt-2">
                Currently: <span className="text-primary font-medium">{timeline.current.name}</span> • {timeline.nowLabel}
              </div>
            </div>
          )}

          {weekSchedule.length > 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                  <CalendarDays size={12} className="text-primary" />
                  7-Day Outlook
                </div>
                {selectedWeekDay && (
                  <span className="text-[9px] uppercase tracking-widest text-primary font-bold">
                    {formatPrayerDateLabel(selectedWeekDay.date)}
                  </span>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {weekSchedule.map(day => (
                  <button
                    key={day.date}
                    onClick={() => setSelectedWeekDate(day.date)}
                    className={cn(
                      "flex flex-col items-center justify-center min-w-[54px] aspect-square rounded-xl border transition-all",
                      day.date === selectedWeekDay?.date 
                        ? "border-primary/50 bg-primary/10 text-primary" 
                        : "border-white/5 bg-white/5 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    <span className="text-[8px] uppercase font-bold tracking-tighter">{new Intl.DateTimeFormat("en-GB", { weekday: "short" }).format(new Date(`${day.date}T12:00:00`))}</span>
                    <span className="text-sm font-bold">{new Intl.DateTimeFormat("en-GB", { day: "numeric" }).format(new Date(`${day.date}T12:00:00`))}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-2">
            {displayedPrayers.map((prayer) => {
              const isNext = timeline?.nextDate === displayedDate && timeline?.next.name === prayer.name && timeline?.next.time24 === prayer.time24;
              return (
                <div
                  key={prayer.name}
                  className={cn(
                    "group flex items-center justify-between p-3.5 rounded-xl border transition-all duration-300",
                    isNext 
                      ? "border-primary/40 bg-primary/10 shadow-sm shadow-primary/5" 
                      : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "size-2 rounded-full transition-all duration-500",
                      isNext ? "bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" : "bg-white/10 group-hover:bg-white/20"
                    )} />
                    <span className={cn("text-sm font-bold transition-colors", isNext ? "text-white" : "text-muted-foreground group-hover:text-white")}>
                      {prayer.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-sm font-bebas tracking-wider", isNext ? "text-primary text-lg" : "text-white/80")}>
                      {formatPrayerClock(prayer.time24, use24Hour)}
                    </span>
                    {isNext && <ChevronRight size={14} className="text-primary animate-bounce-x" />}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              <a href={snapshot.sourceUrl} target="_blank" rel="noopener" className="flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-white transition-colors uppercase tracking-widest font-bold">
                Source: {snapshot.sourceLabel} <ExternalLink size={10} />
              </a>
            </div>
            <ul className="flex flex-col gap-1">
              {config.notes.map((note) => (
                <li key={note} className="text-[10px] text-muted-foreground leading-relaxed flex gap-2">
                  <span className="text-primary/60">•</span> {note}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
