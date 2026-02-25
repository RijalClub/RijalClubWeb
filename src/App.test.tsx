import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { mockSiteContent } from '@/test/fixtures/content'

// Mock all child components that make external calls
vi.mock('@/lib/content', () => ({
  loadSiteContent: vi.fn(),
}))

vi.mock('@/components/PrayerTimesWidget', () => ({
  PrayerTimesWidget: () => <div data-testid="prayer-widget">Prayer Widget</div>,
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

import { loadSiteContent } from '@/lib/content'

describe('App', () => {
  beforeEach(() => {
    vi.mocked(loadSiteContent).mockReset()
  })

  it('shows loading screen initially', () => {
    vi.mocked(loadSiteContent).mockReturnValue(new Promise(() => undefined))
    render(<App />)
    expect(screen.getByText(/Loading The Rijal Club/i)).toBeInTheDocument()
  })

  it('shows loading screen description while loading', () => {
    vi.mocked(loadSiteContent).mockReturnValue(new Promise(() => undefined))
    render(<App />)
    expect(screen.getByText(/Pulling profile/i)).toBeInTheDocument()
  })

  it('shows error screen when content load fails', async () => {
    vi.mocked(loadSiteContent).mockRejectedValue(new Error('Failed to fetch config'))
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Config load error/i)).toBeInTheDocument()
      expect(screen.getByText(/Failed to fetch config/)).toBeInTheDocument()
    })
  })

  it('shows generic error for non-Error exceptions', async () => {
    vi.mocked(loadSiteContent).mockRejectedValue('string error')
    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Unexpected error/i)).toBeInTheDocument()
    })
  })

  it('shows reload button on error screen', async () => {
    vi.mocked(loadSiteContent).mockRejectedValue(new Error('Network error'))
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reload/i })).toBeInTheDocument()
    })
  })

  it('renders main app when content loads successfully', async () => {
    vi.mocked(loadSiteContent).mockResolvedValue(mockSiteContent)
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('navigation', { name: 'Main' })).toBeInTheDocument()
    })
  })

  it('renders profile name in header when loaded', async () => {
    vi.mocked(loadSiteContent).mockResolvedValue(mockSiteContent)
    render(<App />)

    await waitFor(() => {
      // Profile name appears in both the brand link (<strong>) and the hero <h1>
      expect(screen.getAllByText(mockSiteContent.profile.name).length).toBeGreaterThan(0)
    })
  })

  it('shows Store nav link when store is open', async () => {
    vi.mocked(loadSiteContent).mockResolvedValue(mockSiteContent)
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('link', { name: /store/i })).toBeInTheDocument()
    })
  })

  it('hides Store nav link when store is closed', async () => {
    const contentWithClosedStore = {
      ...mockSiteContent,
      store: { ...mockSiteContent.store, isOpen: false },
    }
    vi.mocked(loadSiteContent).mockResolvedValue(contentWithClosedStore)
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByRole('link', { name: /store/i })).not.toBeInTheDocument()
    })
  })

  it('renders home page at / route', async () => {
    vi.mocked(loadSiteContent).mockResolvedValue(mockSiteContent)
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: mockSiteContent.profile.name })).toBeInTheDocument()
    })
  })

  it('does not show loading screen after content is loaded', async () => {
    vi.mocked(loadSiteContent).mockResolvedValue(mockSiteContent)
    render(<App />)

    await waitFor(() => {
      expect(screen.queryByText(/Loading The Rijal Club/i)).not.toBeInTheDocument()
    })
  })

  it('reload button triggers page reload', async () => {
    const reloadSpy = vi.fn()
    Object.defineProperty(window, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    })

    vi.mocked(loadSiteContent).mockRejectedValue(new Error('Load failed'))
    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Reload/i })).toBeInTheDocument()
    })

    await userEvent.click(screen.getByRole('button', { name: /Reload/i }))
    expect(reloadSpy).toHaveBeenCalled()
  })
})
