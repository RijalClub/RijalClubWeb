import { useState } from 'react'

import { HeroSection } from '@/components/HeroSection'
import { PrayerTimesWidget } from '@/components/PrayerTimesWidget'
import { QuickLinksSection } from '@/components/QuickLinksSection'
import { TikTokAnnouncementsSection } from '@/components/TikTokAnnouncementsSection'
import type { PrayerTimeline, PrayerTimesSnapshot } from '@/lib/prayer'
import { StorePreview } from '@/components/StorePreview'
import type { SiteContent } from '@/lib/content'

interface HomePageProps {
  content: SiteContent
}

export function HomePage({ content }: HomePageProps) {
  const [prayerSnapshot, setPrayerSnapshot] = useState<PrayerTimesSnapshot | null>(null)
  const [prayerTimeline, setPrayerTimeline] = useState<PrayerTimeline | null>(null)

  return (
    <main className="page-grid">
      <HeroSection profile={content.profile} />

      <div className="split-grid">
        <PrayerTimesWidget
          config={content.prayer}
          cache={content.cache.prayer}
          onPrayerDataChange={(snapshot, timeline) => {
            setPrayerSnapshot(snapshot)
            setPrayerTimeline(timeline)
          }}
        />
        <QuickLinksSection links={content.links} prayerSnapshot={prayerSnapshot} prayerTimeline={prayerTimeline} />
      </div>

      <TikTokAnnouncementsSection announcements={content.announcements} headingLink="/blog" />
      {content.store.isOpen ? <StorePreview store={content.store} /> : null}
    </main>
  )
}
