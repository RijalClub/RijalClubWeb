import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LibraryPage } from './LibraryPage'
import { mockHadithConfig } from '@/test/fixtures/content'

describe('LibraryPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('rendering', () => {
    it('renders Library kicker', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      expect(screen.getByText('Library')).toBeInTheDocument()
    })

    it('renders hadith config title as h1', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      expect(screen.getByRole('heading', { level: 1, name: mockHadithConfig.title })).toBeInTheDocument()
    })

    it('renders hadith config description', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      expect(screen.getByText(mockHadithConfig.description)).toBeInTheDocument()
    })

    it('renders "Sunni Collections" heading', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      expect(screen.getByText('Sunni Collections')).toBeInTheDocument()
    })

    it('renders each collection as a button', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      for (const collection of mockHadithConfig.collections) {
        expect(screen.getByRole('button', { name: new RegExp(collection.title) })).toBeInTheDocument()
      }
    })

    it('renders collection titles', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      for (const collection of mockHadithConfig.collections) {
        expect(screen.getAllByText(collection.title).length).toBeGreaterThan(0)
      }
    })

    it('renders collection subtitles', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      for (const collection of mockHadithConfig.collections) {
        expect(screen.getByText(collection.subtitle)).toBeInTheDocument()
      }
    })

    it('renders collection descriptions', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      for (const collection of mockHadithConfig.collections) {
        expect(screen.getByText(collection.description)).toBeInTheDocument()
      }
    })

    it('renders cover image when coverImage is provided', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      const bukhariCollection = mockHadithConfig.collections[0]
      if (bukhariCollection.coverImage) {
        const img = screen.getByRole('img', { name: `${bukhariCollection.title} cover` })
        expect(img).toHaveAttribute('src', bukhariCollection.coverImage)
      }
    })

    it('renders placeholder when no coverImage', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      // Muslim collection has no coverImage - title appears in both the button and the placeholder span
      const muslimCollection = mockHadithConfig.collections[1]
      expect(screen.getAllByText(muslimCollection.title).length).toBeGreaterThan(0)
    })
  })

  describe('default collection selection', () => {
    it('defaults to defaultCollectionId', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      const bukhariBtn = screen.getByRole('button', { name: /Sahih Bukhari/i })
      expect(bukhariBtn).toHaveClass('active')
    })

    it('falls back to first collection when defaultCollectionId not found', () => {
      const config = { ...mockHadithConfig, defaultCollectionId: 'nonexistent' }
      render(<LibraryPage config={config} />)
      const firstBtn = screen.getAllByRole('button')[0]
      expect(firstBtn).toHaveClass('active')
    })
  })

  describe('collection switching', () => {
    it('switches to selected collection on click', async () => {
      render(<LibraryPage config={mockHadithConfig} />)
      const muslimBtn = screen.getByRole('button', { name: /Sahih Muslim/i })
      await userEvent.click(muslimBtn)
      expect(muslimBtn).toHaveClass('active')
    })

    it('deactivates previous collection on switch', async () => {
      render(<LibraryPage config={mockHadithConfig} />)
      const bukhariBtn = screen.getByRole('button', { name: /Sahih Bukhari/i })
      const muslimBtn = screen.getByRole('button', { name: /Sahih Muslim/i })

      expect(bukhariBtn).toHaveClass('active')

      await userEvent.click(muslimBtn)

      expect(muslimBtn).toHaveClass('active')
      expect(bukhariBtn).not.toHaveClass('active')
    })

    it('saves selection to localStorage on switch', async () => {
      render(<LibraryPage config={mockHadithConfig} />)
      await userEvent.click(screen.getByRole('button', { name: /Sahih Muslim/i }))

      await waitFor(() => {
        expect(localStorage.getItem('rijal:library:collection')).toBe('muslim')
      })
    })

    it('restores selection from localStorage on mount', () => {
      localStorage.setItem('rijal:library:collection', 'muslim')
      render(<LibraryPage config={mockHadithConfig} />)
      const muslimBtn = screen.getByRole('button', { name: /Sahih Muslim/i })
      expect(muslimBtn).toHaveClass('active')
    })
  })

  describe('PDF viewer', () => {
    it('renders iframe with PDF URL for default collection', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      const iframe = screen.getByTitle(/Sahih Bukhari PDF/i)
      expect(iframe).toBeInTheDocument()
      expect(iframe).toHaveAttribute('src', mockHadithConfig.collections[0].pdfUrl)
    })

    it('shows PDF link with correct href', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      const link = screen.getByRole('link', { name: /Open in new tab/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', mockHadithConfig.collections[0].pdfUrl)
      expect(link).toHaveAttribute('target', '_blank')
    })

    it('shows "PDF not available" message when no pdfUrl', async () => {
      render(<LibraryPage config={mockHadithConfig} />)
      // Switch to Muslim which has no pdfUrl
      await userEvent.click(screen.getByRole('button', { name: /Sahih Muslim/i }))

      await waitFor(() => {
        expect(screen.getByText(/PDF not available for this collection yet/i)).toBeInTheDocument()
      })
    })

    it('renders PDF kicker with collection title', () => {
      render(<LibraryPage config={mockHadithConfig} />)
      expect(screen.getByText(/Sahih Bukhari PDF/)).toBeInTheDocument()
    })
  })
})
