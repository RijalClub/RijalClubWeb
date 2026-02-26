import { useAdhanAlert } from "@/components/AdhanAlertProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  formatCountdown,
  formatPrayerClock,
  type PrayerTimeline,
} from "@/lib/prayer";
import type { LinksConfig, ResourceSectionIcon } from "@/types/content";
import {
  BookOpen,
  Brain,
  ExternalLink,
  HandHeart,
  Handshake,
  Instagram,
  Link as LinkIcon,
  MessageCircle,
  Pause,
  Play,
  PlayCircle,
  Radio,
  Youtube,
  Globe,
  ArrowRight
} from "lucide-react";
import { useMemo } from "react";
import { cn } from "@/lib/utils";

interface QuickLinksSectionProps {
  links: LinksConfig;
  prayerTimeline: PrayerTimeline | null;
}

const iconMap = {
  whatsapp: MessageCircle,
  class: BookOpen,
  instagram: Instagram,
  donate: HandHeart,
  youtube: Youtube,
  tiktok: PlayCircle,
  default: LinkIcon,
};

const resourceSectionIconMap: Record<ResourceSectionIcon, typeof BookOpen> = {
  "book-open": BookOpen,
  brain: Brain,
  handshake: Handshake,
  "hand-heart": HandHeart,
  "message-circle": MessageCircle,
  "play-circle": PlayCircle,
  link: LinkIcon,
};

export function QuickLinksSection({
  links,
  prayerTimeline,
}: QuickLinksSectionProps) {
  const adhanAlert = links.adhanAlert;
  const {
    isAdhanAlertEnabled,
    setIsAdhanAlertEnabled,
    isAudioPlaying,
    toggleAudioPlayback,
    statusMessage,
    use24HourClock,
  } = useAdhanAlert();

  const groupedResources = useMemo(() => {
    const groups = new Map<string, NonNullable<LinksConfig["resources"]>>();
    for (const section of links.resourceSections ?? []) {
      groups.set(section.id, []);
    }

    for (const resource of links.resources ?? []) {
      const existing = groups.get(resource.sectionId) ?? [];
      groups.set(resource.sectionId, [...existing, resource]);
    }

    return groups;
  }, [links.resourceSections, links.resources]);

  return (
    <section className="panel p-6 flex flex-col gap-8 reveal">
      <div className="flex flex-col gap-1">
        <h2 className="font-bebas text-3xl tracking-wide text-white">{links.heading}</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">{links.description}</p>
      </div>

      <div className="grid gap-3">
        {links.quickLinks.map((link) => {
          const Icon = iconMap[link.icon as keyof typeof iconMap] ?? iconMap.default;
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300",
                link.featured 
                  ? "border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50" 
                  : "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-white/10"
              )}
            >
              <div className={cn(
                "flex items-center justify-center size-12 rounded-xl border transition-all duration-300",
                link.featured ? "border-primary/20 bg-primary/10 text-primary" : "border-white/5 bg-white/5 text-muted-foreground group-hover:text-white"
              )}>
                <Icon size={20} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{link.title}</span>
                <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{link.subtitle}</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              {link.featured && (
                <div className="absolute top-0 right-0 p-1">
                  <div className="size-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
                </div>
              )}
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        {links.socials.map((social) => (
          <a
            key={social.platform}
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-4 py-1.5 border border-white/10 bg-white/5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-white hover:bg-white/10 transition-all"
          >
            {social.platform}
          </a>
        ))}
      </div>

      {adhanAlert?.enabled && (
        <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-lime font-bold">
              <Radio size={12} className="animate-pulse" />
              {adhanAlert.title}
            </div>
            <div className="flex items-center gap-3 bg-white/5 rounded-full px-3 py-1 border border-white/5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Alerts</span>
              <Switch
                checked={isAdhanAlertEnabled}
                onCheckedChange={setIsAdhanAlertEnabled}
                className="data-[state=checked]:bg-primary scale-75"
              />
            </div>
          </div>
          
          <div className="flex flex-col gap-1">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{adhanAlert.description}</p>
            {prayerTimeline && (
              <div className="text-[11px] font-bold text-white mt-1">
                Next: <span className="text-primary">{prayerTimeline.next.name}</span> at {formatPrayerClock(prayerTimeline.next.time24, use24HourClock)} (In {formatCountdown(prayerTimeline.minutesUntilNext)})
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={toggleAudioPlayback}
              className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-bold uppercase tracking-widest h-8"
            >
              {isAudioPlaying ? <Pause size={12} className="mr-2" /> : <Play size={12} className="mr-2" />}
              {isAudioPlaying ? "Stop Adhan" : "Test Adhan"}
            </Button>
            {statusMessage && <span className="text-[9px] text-primary font-bold uppercase tracking-tighter animate-pulse">{statusMessage}</span>}
          </div>
        </div>
      )}

      {(links.resourceSections ?? []).length > 0 && (
        <div className="flex flex-col gap-6 pt-2">
          {(links.resourceSections ?? []).map((section) => {
            const items = groupedResources.get(section.id) ?? [];
            if (items.length === 0) return null;
            const Icon = resourceSectionIconMap[section.icon] ?? BookOpen;
            return (
              <div key={section.id} className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold border-b border-white/5 pb-2">
                  <Icon size={12} className="text-primary/60" />
                  {section.title}
                </div>
                <div className="grid gap-2">
                  {items.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white group-hover:text-primary transition-colors">{resource.title}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">{resource.subtitle}</span>
                      </div>
                      <div className="size-7 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-white group-hover:bg-primary/20 transition-all">
                        <ExternalLink size={12} />
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
