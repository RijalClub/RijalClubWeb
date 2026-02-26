import { useAdhanAlert } from "@/components/AdhanAlertProvider";
import { HeroSection } from "@/components/HeroSection";
import { PrayerTimesWidget } from "@/components/PrayerTimesWidget";
import { QuickLinksSection } from "@/components/QuickLinksSection";
import { StorePreview } from "@/components/StorePreview";
import { TikTokAnnouncementsSection } from "@/components/TikTokAnnouncementsSection";
import type { SiteContent } from "@/lib/content";
import type { PrayerTimeline } from "@/lib/prayer";
import { useState } from "react";

interface HomePageProps {
  content: SiteContent;
}

export function HomePage({ content }: HomePageProps) {
  const [prayerTimeline, setPrayerTimeline] = useState<PrayerTimeline | null>(
    null,
  );
  const { setExternalPrayerSnapshot } = useAdhanAlert();

  return (
    <main className="page-grid">
      <HeroSection profile={content.profile} />
      <div className="split-grid">
        <PrayerTimesWidget
          config={content.prayer}
          cache={content.cache.prayer}
          onPrayerDataChange={(snapshot, timeline) => {
            setExternalPrayerSnapshot(snapshot);
            setPrayerTimeline(timeline);
          }}
        />
        <QuickLinksSection
          links={content.links}
          prayerTimeline={prayerTimeline}
        />
      </div>
      <TikTokAnnouncementsSection
        announcements={content.announcements}
        headingLink="/blog"
      />
      {content.store.isOpen ? <StorePreview store={content.store} /> : null}
    </main>
  );
}
