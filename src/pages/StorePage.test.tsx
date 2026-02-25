import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StorePage } from './StorePage'
import { mockStoreConfig, mockProfile } from '@/test/fixtures/content'

const mockWindowOpen = vi.fn()
vi.stubGlobal('open', mockWindowOpen)

describe('StorePage', () => {
  beforeEach(() => {
    mockWindowOpen.mockReset()
    // Reset body overflow to prevent bleed from tests that open modals without closing them
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('renders store title as h1', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      expect(screen.getByRole('heading', { level: 1, name: mockStoreConfig.title })).toBeInTheDocument()
    })

    it('renders store description', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      expect(screen.getByText(mockStoreConfig.description)).toBeInTheDocument()
    })

    it('renders Merchandise kicker', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      expect(screen.getByText(/Merchandise/)).toBeInTheDocument()
    })

    it('renders "Store is open" status when isOpen is true', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      expect(screen.getByText('Store is open')).toBeInTheDocument()
    })

    it('renders closed message when isOpen is false', () => {
      const closedStore = { ...mockStoreConfig, isOpen: false }
      render(<StorePage store={closedStore} profile={mockProfile} />)
      expect(screen.getByText(mockStoreConfig.closedMessage)).toBeInTheDocument()
    })

    it('renders Stay Updated link when store is closed', () => {
      const closedStore = { ...mockStoreConfig, isOpen: false }
      render(<StorePage store={closedStore} profile={mockProfile} />)
      const link = screen.getByRole('link', { name: /Stay Updated/i })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', mockProfile.secondaryCta.url)
    })

    it('does not render Stay Updated link when store is open', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      expect(screen.queryByRole('link', { name: /Stay Updated/i })).not.toBeInTheDocument()
    })

    it('renders each product as a card', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      for (const product of mockStoreConfig.products) {
        expect(screen.getByText(product.title)).toBeInTheDocument()
      }
    })

    it('renders product descriptions', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      for (const product of mockStoreConfig.products) {
        expect(screen.getByText(product.description)).toBeInTheDocument()
      }
    })

    it('renders formatted product prices', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      // £25.00 for T-Shirt
      expect(screen.getByText(/£25/)).toBeInTheDocument()
    })

    it('renders product badge when badge is present', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const hoodie = mockStoreConfig.products[1]
      if (hoodie.badge) {
        expect(screen.getByText(hoodie.badge)).toBeInTheDocument()
      }
    })

    it('renders product image', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      const imgs = screen.getAllByRole('img')
      const productImg = imgs.find((img) => img.getAttribute('src') === tshirt.media?.[0].url)
      expect(productImg).toBeInTheDocument()
    })
  })

  describe('product modal', () => {
    it('opens modal when product card is clicked', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      await userEvent.click(screen.getByRole('button', { name: new RegExp(tshirt.title) }))
      expect(screen.getByRole('dialog', { name: tshirt.title })).toBeInTheDocument()
    })

    it('opens modal when Enter key pressed on product card', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      const card = screen.getByRole('button', { name: new RegExp(tshirt.title) })
      fireEvent.keyDown(card, { key: 'Enter' })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('opens modal when Space key pressed on product card', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      const card = screen.getByRole('button', { name: new RegExp(tshirt.title) })
      fireEvent.keyDown(card, { key: ' ' })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('closes modal when close button clicked', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await userEvent.click(screen.getByRole('button', { name: /close/i }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal when Escape key pressed', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))

      fireEvent.keyDown(window, { key: 'Escape' })
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('closes modal when overlay clicked', async () => {
      const { container } = render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      const overlay = container.querySelector('.content-modal-overlay')
      await userEvent.click(overlay!)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('shows product details in modal', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      await userEvent.click(screen.getByRole('button', { name: new RegExp(tshirt.title) }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getAllByText(tshirt.title).length).toBeGreaterThan(0)
      expect(screen.getAllByText(tshirt.description).length).toBeGreaterThan(0)
    })

    it('shows multi-media thumbnails when product has multiple media', async () => {
      const { container } = render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))

      // T-Shirt has 2 media items
      const tshirt = mockStoreConfig.products[0]
      if (tshirt.media && tshirt.media.length > 1) {
        const thumbs = container.querySelectorAll('.content-modal-thumb')
        expect(thumbs.length).toBeGreaterThan(0)
      }
    })

    it('shows badge in modal when product has badge', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      await userEvent.click(screen.getByRole('button', { name: new RegExp(tshirt.title) }))

      if (tshirt.badge) {
        expect(screen.getAllByText(new RegExp(tshirt.badge)).length).toBeGreaterThan(0)
      }
    })

    it('sets body overflow to hidden when modal is open', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('restores body overflow when modal closes', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))
      await userEvent.click(screen.getByRole('button', { name: /close/i }))

      await waitFor(() => {
        expect(document.body.style.overflow).not.toBe('hidden')
      })
    })
  })

  describe('checkout', () => {
    it('opens external checkout URL in new tab', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      const tshirt = mockStoreConfig.products[0]
      await userEvent.click(screen.getByRole('button', { name: new RegExp(tshirt.title) }))

      const buyButton = screen.getByRole('button', { name: /Buy Now/i })
      await userEvent.click(buyButton)

      expect(mockWindowOpen).toHaveBeenCalledWith(tshirt.checkoutUrl, '_blank', 'noopener,noreferrer')
    })

    it('disables Buy Now for disabled products', async () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      // Hoodie is disabled
      const hoodie = mockStoreConfig.products[1]
      await userEvent.click(screen.getByRole('button', { name: new RegExp(hoodie.title) }))

      const buyButton = screen.getByRole('button', { name: /Buy Now/i })
      expect(buyButton).toBeDisabled()
    })

    it('shows error when stripe not configured and no checkoutUrl', async () => {
      const storeNoCheckout = {
        ...mockStoreConfig,
        stripe: { enabled: false },
        products: [
          {
            ...mockStoreConfig.products[0],
            checkoutUrl: undefined,
          },
        ],
      }

      render(<StorePage store={storeNoCheckout} profile={mockProfile} />)
      await userEvent.click(screen.getByRole('button', { name: /Rijal T-Shirt/ }))
      await userEvent.click(screen.getByRole('button', { name: /Buy Now/i }))

      await waitFor(() => {
        expect(screen.getByText(/Stripe checkout is not configured/i)).toBeInTheDocument()
      })
    })
  })

  describe('multi-media indicator', () => {
    it('shows +N more media on product card when product has multiple media', () => {
      render(<StorePage store={mockStoreConfig} profile={mockProfile} />)
      // T-Shirt has 2 media items
      expect(screen.getByText(/\+1 more media/)).toBeInTheDocument()
    })
  })
})
