import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import {
  AnnouncementsSection,
  AnnouncementCard,
  AnnouncementDetailModal,
  formatAnnouncementDate,
  sortAnnouncements,
} from './AnnouncementsSection'
import type { AnnouncementItem } from '@/types/content'
import { mockAnnouncements } from '@/test/fixtures/content'

// ---------------------------------------------------------------------------
// formatAnnouncementDate
// ---------------------------------------------------------------------------
describe('formatAnnouncementDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatAnnouncementDate('2024-01-15')
    expect(result).toMatch(/15/)
    expect(result).toMatch(/Jan/)
    expect(result).toMatch(/2024/)
  })

  it('formats a full ISO datetime string', () => {
    const result = formatAnnouncementDate('2024-06-21T10:30:00Z')
    expect(result).toMatch(/21/)
    expect(result).toMatch(/Jun/)
    expect(result).toMatch(/2024/)
  })

  it('returns original string for invalid date', () => {
    const result = formatAnnouncementDate('not-a-date')
    expect(result).toBe('not-a-date')
  })

  it('handles empty string', () => {
    const result = formatAnnouncementDate('')
    // Invalid date returns empty string
    expect(result).toBe('')
  })
})

// ---------------------------------------------------------------------------
// sortAnnouncements
// ---------------------------------------------------------------------------
describe('sortAnnouncements', () => {
  it('sorts announcements newest first', () => {
    const items: AnnouncementItem[] = [
      { id: '1', type: 'text', title: 'Old', body: 'Body', publishedAt: '2024-01-01' },
      { id: '2', type: 'text', title: 'New', body: 'Body', publishedAt: '2024-01-15' },
      { id: '3', type: 'text', title: 'Mid', body: 'Body', publishedAt: '2024-01-10' },
    ]

    const sorted = sortAnnouncements(items)
    expect(sorted[0].id).toBe('2')
    expect(sorted[1].id).toBe('3')
    expect(sorted[2].id).toBe('1')
  })

  it('does not mutate the original array', () => {
    const items: AnnouncementItem[] = [
      { id: '1', type: 'text', title: 'Old', body: 'Body', publishedAt: '2024-01-01' },
      { id: '2', type: 'text', title: 'New', body: 'Body', publishedAt: '2024-01-15' },
    ]

    const sorted = sortAnnouncements(items)
    expect(items[0].id).toBe('1') // original unchanged
    expect(sorted[0].id).toBe('2')
  })

  it('handles single item', () => {
    const items: AnnouncementItem[] = [
      { id: '1', type: 'text', title: 'Only', body: 'Body', publishedAt: '2024-01-01' },
    ]
    expect(sortAnnouncements(items)).toHaveLength(1)
  })

  it('handles empty array', () => {
    expect(sortAnnouncements([])).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// AnnouncementCard
// ---------------------------------------------------------------------------
describe('AnnouncementCard', () => {
  const textItem: AnnouncementItem = {
    id: 'test-1',
    type: 'text',
    title: 'Test Title',
    body: 'Test body content',
    publishedAt: '2024-01-15',
  }

  it('renders title and body', () => {
    render(<AnnouncementCard item={textItem} />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
    expect(screen.getByText('Test body content')).toBeInTheDocument()
  })

  it('renders publication date', () => {
    render(<AnnouncementCard item={textItem} />)
    expect(screen.getByText(/Jan.*2024|2024.*Jan/)).toBeInTheDocument()
  })

  it('renders type tag', () => {
    render(<AnnouncementCard item={textItem} />)
    expect(screen.getByText('text')).toBeInTheDocument()
  })

  it('calls onOpen when clicked', async () => {
    const onOpen = vi.fn()
    render(<AnnouncementCard item={textItem} onOpen={onOpen} />)
    await userEvent.click(screen.getByRole('button'))
    expect(onOpen).toHaveBeenCalledWith(textItem)
  })

  it('calls onOpen when Enter key pressed', async () => {
    const onOpen = vi.fn()
    render(<AnnouncementCard item={textItem} onOpen={onOpen} />)
    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledWith(textItem)
  })

  it('calls onOpen when Space key pressed', () => {
    const onOpen = vi.fn()
    render(<AnnouncementCard item={textItem} onOpen={onOpen} />)
    const card = screen.getByRole('button')
    fireEvent.keyDown(card, { key: ' ' })
    expect(onOpen).toHaveBeenCalledWith(textItem)
  })

  it('does not set role=button when no onOpen', () => {
    render(<AnnouncementCard item={textItem} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('renders image media when type is image', () => {
    const imageItem: AnnouncementItem = {
      ...textItem,
      type: 'image',
      mediaUrl: '/test-image.jpg',
    }
    render(<AnnouncementCard item={imageItem} />)
    const img = screen.getByRole('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', '/test-image.jpg')
  })

  it('renders video element for video type', () => {
    const videoItem: AnnouncementItem = {
      ...textItem,
      type: 'video',
      mediaUrl: '/test-video.mp4',
    }
    const { container } = render(<AnnouncementCard item={videoItem} />)
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
  })

  it('shows multi-media indicator when item has multiple media items', () => {
    const multiMediaItem: AnnouncementItem = {
      ...textItem,
      media: [
        { type: 'image', url: '/img1.jpg' },
        { type: 'image', url: '/img2.jpg' },
        { type: 'image', url: '/img3.jpg' },
      ],
    }
    render(<AnnouncementCard item={multiMediaItem} onOpen={vi.fn()} />)
    expect(screen.getByText(/\+2 more media/)).toBeInTheDocument()
  })

  it('renders CTA link when ctaLabel and ctaUrl are present', () => {
    const ctaItem: AnnouncementItem = {
      ...textItem,
      ctaLabel: 'Watch Now',
      ctaUrl: 'https://example.com/watch',
    }
    render(
      <MemoryRouter>
        <AnnouncementCard item={ctaItem} />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: /Watch Now/ })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', 'https://example.com/watch')
  })

  it('does not render CTA when ctaLabel is missing', () => {
    const itemWithUrl: AnnouncementItem = { ...textItem, ctaUrl: 'https://example.com' }
    render(<AnnouncementCard item={itemWithUrl} />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// AnnouncementDetailModal
// ---------------------------------------------------------------------------
describe('AnnouncementDetailModal', () => {
  const item: AnnouncementItem = {
    id: 'modal-1',
    type: 'text',
    title: 'Modal Title',
    body: 'Modal body content',
    publishedAt: '2024-01-15',
  }

  it('renders null when item is null', () => {
    const { container } = render(<AnnouncementDetailModal item={null} onClose={vi.fn()} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders modal when item is provided', () => {
    render(<AnnouncementDetailModal item={item} onClose={vi.fn()} />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Modal Title')).toBeInTheDocument()
    expect(screen.getByText('Modal body content')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(<AnnouncementDetailModal item={item} onClose={onClose} />)
    await userEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when overlay is clicked', async () => {
    const onClose = vi.fn()
    const { container } = render(<AnnouncementDetailModal item={item} onClose={onClose} />)
    const overlay = container.querySelector('.content-modal-overlay')
    expect(overlay).toBeInTheDocument()
    await userEvent.click(overlay!)
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn()
    render(<AnnouncementDetailModal item={item} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('does not call onClose for non-Escape keys', () => {
    const onClose = vi.fn()
    render(<AnnouncementDetailModal item={item} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Enter' })
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders media thumbnails for multi-media items', () => {
    const multiItem: AnnouncementItem = {
      ...item,
      media: [
        { type: 'image', url: '/img1.jpg', alt: 'Image 1' },
        { type: 'image', url: '/img2.jpg', alt: 'Image 2' },
      ],
    }
    const { container } = render(<AnnouncementDetailModal item={multiItem} onClose={vi.fn()} />)
    const thumbs = container.querySelectorAll('.content-modal-thumb')
    expect(thumbs).toHaveLength(2)
  })

  it('renders CTA button when ctaLabel and ctaUrl present', () => {
    const ctaItem: AnnouncementItem = {
      ...item,
      ctaLabel: 'Open Link',
      ctaUrl: 'https://example.com',
    }
    render(<AnnouncementDetailModal item={ctaItem} onClose={vi.fn()} />)
    const link = screen.getByRole('link', { name: /Open Link/ })
    expect(link).toHaveAttribute('href', 'https://example.com')
  })

  it('renders video in modal for video media', () => {
    const videoItem: AnnouncementItem = {
      ...item,
      media: [{ type: 'video', url: '/vid.mp4', posterUrl: '/poster.jpg' }],
    }
    const { container } = render(<AnnouncementDetailModal item={videoItem} onClose={vi.fn()} />)
    const video = container.querySelector('video')
    expect(video).toBeInTheDocument()
    expect(video).toHaveAttribute('controls')
  })

  it('sets overflow hidden on body when open', () => {
    render(<AnnouncementDetailModal item={item} onClose={vi.fn()} />)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body overflow on unmount', () => {
    const { unmount } = render(<AnnouncementDetailModal item={item} onClose={vi.fn()} />)
    unmount()
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('resets media index when item changes', async () => {
    const multiItem: AnnouncementItem = {
      ...item,
      media: [
        { type: 'image', url: '/img1.jpg' },
        { type: 'image', url: '/img2.jpg' },
      ],
    }
    const { container, rerender } = render(
      <AnnouncementDetailModal item={multiItem} onClose={vi.fn()} />,
    )
    // Click on second thumbnail to change mediaIndex
    const thumbs = container.querySelectorAll('.content-modal-thumb')
    await userEvent.click(thumbs[1])

    // Change item (different id) - should reset mediaIndex to 0
    const newItem: AnnouncementItem = { ...multiItem, id: 'modal-2' }
    rerender(<AnnouncementDetailModal item={newItem} onClose={vi.fn()} />)

    await waitFor(() => {
      const activeThumbs = container.querySelectorAll('.content-modal-thumb.active')
      expect(activeThumbs[0]).toBeInTheDocument()
    })
  })
})

// ---------------------------------------------------------------------------
// AnnouncementsSection
// ---------------------------------------------------------------------------
describe('AnnouncementsSection', () => {
  it('renders section heading', () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} />
      </MemoryRouter>,
    )
    expect(screen.getByText(mockAnnouncements.heading)).toBeInTheDocument()
  })

  it('renders section description', () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} />
      </MemoryRouter>,
    )
    expect(screen.getByText(mockAnnouncements.description)).toBeInTheDocument()
  })

  it('renders announcement cards (defaults to max 3)', () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} />
      </MemoryRouter>,
    )
    // mockAnnouncements has 3 items
    expect(screen.getByText('Test Announcement 1')).toBeInTheDocument()
  })

  it('respects maxItems prop', () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} maxItems={1} />
      </MemoryRouter>,
    )
    // Only 1 item shown
    const titles = screen.getAllByRole('heading', { level: 3 })
    expect(titles.length).toBeLessThanOrEqual(1)
  })

  it('shows empty state when no items', () => {
    const emptyAnnouncements = { ...mockAnnouncements, items: [] }
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={emptyAnnouncements} />
      </MemoryRouter>,
    )
    expect(screen.getByText('No configured announcement cards.')).toBeInTheDocument()
  })

  it('shows empty state when items is undefined', () => {
    const noItems = { ...mockAnnouncements, items: undefined }
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={noItems} />
      </MemoryRouter>,
    )
    expect(screen.getByText('No configured announcement cards.')).toBeInTheDocument()
  })

  it('renders heading as link when headingLink provided', () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} headingLink="/blog" />
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: mockAnnouncements.heading })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/blog')
  })

  it('renders heading as plain text when no headingLink', () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} />
      </MemoryRouter>,
    )
    // Should be h2 not a link
    const heading = screen.getByRole('heading', { level: 2, name: mockAnnouncements.heading })
    expect(heading.tagName).toBe('H2')
    expect(heading.querySelector('a')).toBeNull()
  })

  it('opens modal when card is clicked', async () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} />
      </MemoryRouter>,
    )
    // Cards are rendered as role=button with composite names; use index
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes modal when Escape pressed', async () => {
    render(
      <MemoryRouter>
        <AnnouncementsSection announcements={mockAnnouncements} />
      </MemoryRouter>,
    )
    await userEvent.click(screen.getAllByRole('button')[0])
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
