import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HomePage } from './HomePage'
import { mockSiteContent } from '@/test/fixtures/content'

// Mock complex child components that have external dependencies
vi.mock('@/components/PrayerTimesWidget', () => ({
  PrayerTimesWidget: ({ onPrayerDataChange }: { onPrayerDataChange: () => void }) => {
    void onPrayerDataChange
    return <div data-testid="prayer-widget">Prayer Widget</div>
  },
}))

vi.mock('@/components/QuickLinksSection', () => ({
  QuickLinksSection: () => <div data-testid="quick-links">Quick Links</div>,
}))

vi.mock('@/components/TikTokAnnouncementsSection', () => ({
  TikTokAnnouncementsSection: () => <div data-testid="tiktok-section">TikTok Section</div>,
}))

vi.mock('@/components/StorePreview', () => ({
  StorePreview: () => <div data-testid="store-preview">Store Preview</div>,
}))

function renderHomePage(overrides: Partial<typeof mockSiteContent> = {}) {
  const content = { ...mockSiteContent, ...overrides }
  return render(
    <MemoryRouter>
      <HomePage content={content} />
    </MemoryRouter>,
  )
}

describe('HomePage', () => {
  it('renders HeroSection with profile name', () => {
    renderHomePage()
    expect(screen.getByRole('heading', { level: 1, name: mockSiteContent.profile.name })).toBeInTheDocument()
  })

  it('renders PrayerTimesWidget', () => {
    renderHomePage()
    expect(screen.getByTestId('prayer-widget')).toBeInTheDocument()
  })

  it('renders QuickLinksSection', () => {
    renderHomePage()
    expect(screen.getByTestId('quick-links')).toBeInTheDocument()
  })

  it('renders TikTokAnnouncementsSection', () => {
    renderHomePage()
    expect(screen.getByTestId('tiktok-section')).toBeInTheDocument()
  })

  it('renders StorePreview when store is open', () => {
    renderHomePage()
    expect(screen.getByTestId('store-preview')).toBeInTheDocument()
  })

  it('does not render StorePreview when store is closed', () => {
    renderHomePage({ store: { ...mockSiteContent.store, isOpen: false } })
    expect(screen.queryByTestId('store-preview')).not.toBeInTheDocument()
  })

  it('renders profile values in HeroSection', () => {
    renderHomePage()
    for (const value of mockSiteContent.profile.values) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('renders profile stats', () => {
    renderHomePage()
    for (const stat of mockSiteContent.profile.stats) {
      expect(screen.getByText(stat.label)).toBeInTheDocument()
    }
  })
})
