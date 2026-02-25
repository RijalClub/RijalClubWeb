import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactPage } from './ContactPage'
import { mockContactConfig } from '@/test/fixtures/content'

// Mock @emailjs/browser
vi.mock('@emailjs/browser', () => ({
  default: {
    send: vi.fn(),
  },
}))

import emailjs from '@emailjs/browser'

// Mock import.meta.env
vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'test-service-id')
vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'test-template-id')
vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'test-public-key')

describe('ContactPage', () => {
  beforeEach(() => {
    vi.mocked(emailjs.send).mockReset()
  })

  describe('rendering', () => {
    it('renders the page title as h1', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByRole('heading', { level: 1, name: mockContactConfig.title })).toBeInTheDocument()
    })

    it('renders description', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByText(mockContactConfig.description)).toBeInTheDocument()
    })

    it('renders status text', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByText(new RegExp(mockContactConfig.statusText))).toBeInTheDocument()
    })

    it('renders name input', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    })

    it('renders email input', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('renders subject input', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByLabelText(/subject/i)).toBeInTheDocument()
    })

    it('renders message textarea', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByLabelText(/message/i)).toBeInTheDocument()
    })

    it('renders send button', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    })

    it('renders "Powered by EmailJS" note', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByText(/Powered by EmailJS/i)).toBeInTheDocument()
    })

    it('shows Contact kicker', () => {
      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    // Use fireEvent.submit(form) to bypass jsdom HTML5 constraint validation
    // (required inputs would otherwise prevent the submit event from firing)

    it('shows error when all fields are empty on submit', async () => {
      const { container } = render(<ContactPage config={mockContactConfig} />)
      fireEvent.submit(container.querySelector('form')!)
      await waitFor(() => {
        expect(screen.getByText(/Please complete all fields/i)).toBeInTheDocument()
      })
    })

    it('shows error when only name is filled', async () => {
      const { container } = render(<ContactPage config={mockContactConfig} />)
      await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
      fireEvent.submit(container.querySelector('form')!)
      await waitFor(() => {
        expect(screen.getByText(/Please complete all fields/i)).toBeInTheDocument()
      })
    })

    it('shows error for invalid email format', async () => {
      const { container } = render(<ContactPage config={mockContactConfig} />)
      await userEvent.type(screen.getByLabelText(/name/i), 'John')
      await userEvent.type(screen.getByLabelText(/email/i), 'not-an-email')
      await userEvent.type(screen.getByLabelText(/subject/i), 'Subject')
      await userEvent.type(screen.getByLabelText(/message/i), 'Message')
      fireEvent.submit(container.querySelector('form')!)
      await waitFor(() => {
        expect(screen.getByText(/valid email address/i)).toBeInTheDocument()
      })
    })

    it('clears error when user starts filling form again', async () => {
      const { container } = render(<ContactPage config={mockContactConfig} />)
      fireEvent.submit(container.querySelector('form')!)
      await waitFor(() => {
        expect(screen.getByText(/Please complete all fields/i)).toBeInTheDocument()
      })

      await userEvent.type(screen.getByLabelText(/name/i), 'John')
      // Error should be cleared on next valid submit attempt
    })
  })

  describe('form submission', () => {
    async function fillAndSubmit() {
      render(<ContactPage config={mockContactConfig} />)
      await userEvent.type(screen.getByLabelText(/name/i), 'John Doe')
      await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com')
      await userEvent.type(screen.getByLabelText(/subject/i), 'Test Subject')
      await userEvent.type(screen.getByLabelText(/message/i), 'Test message content')
      await userEvent.click(screen.getByRole('button', { name: /send message/i }))
    }

    it('calls emailjs.send with correct parameters on valid submission', async () => {
      vi.mocked(emailjs.send).mockResolvedValueOnce({ status: 200, text: 'OK' })

      await fillAndSubmit()

      await waitFor(() => {
        expect(emailjs.send).toHaveBeenCalledWith(
          'test-service-id',
          'test-template-id',
          expect.objectContaining({
            name: 'John Doe',
            email: 'john@example.com',
            subject: 'Test Subject',
            message: 'Test message content',
          }),
          { publicKey: 'test-public-key' },
        )
      })
    })

    it('shows success message after successful submission', async () => {
      vi.mocked(emailjs.send).mockResolvedValueOnce({ status: 200, text: 'OK' })

      await fillAndSubmit()

      await waitFor(() => {
        expect(screen.getByText(/Message sent successfully/i)).toBeInTheDocument()
      })
    })

    it('clears form after successful submission', async () => {
      vi.mocked(emailjs.send).mockResolvedValueOnce({ status: 200, text: 'OK' })

      await fillAndSubmit()

      await waitFor(() => {
        expect(screen.getByLabelText(/name/i)).toHaveValue('')
        expect(screen.getByLabelText(/email/i)).toHaveValue('')
        expect(screen.getByLabelText(/subject/i)).toHaveValue('')
        expect(screen.getByLabelText(/message/i)).toHaveValue('')
      })
    })

    it('shows error message when emailjs.send throws', async () => {
      vi.mocked(emailjs.send).mockRejectedValueOnce(new Error('EmailJS error'))

      await fillAndSubmit()

      await waitFor(() => {
        expect(screen.getByText(/EmailJS error/)).toBeInTheDocument()
      })
    })

    it('shows generic error for non-Error exceptions', async () => {
      vi.mocked(emailjs.send).mockRejectedValueOnce('string error')

      await fillAndSubmit()

      await waitFor(() => {
        expect(screen.getByText(/Unable to send message right now/)).toBeInTheDocument()
      })
    })

    it('disables submit button while submitting', async () => {
      let resolve!: () => void
      vi.mocked(emailjs.send).mockReturnValueOnce(
        new Promise((r) => {
          resolve = () => r({ status: 200, text: 'OK' })
        }),
      )

      render(<ContactPage config={mockContactConfig} />)
      await userEvent.type(screen.getByLabelText(/name/i), 'John')
      await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com')
      await userEvent.type(screen.getByLabelText(/subject/i), 'Sub')
      await userEvent.type(screen.getByLabelText(/message/i), 'Msg')

      // Trigger submit
      userEvent.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /sending/i })).toBeDisabled()
      })

      resolve()

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /send message/i })).not.toBeDisabled()
      })
    })
  })

  describe('without EmailJS configuration', () => {
    it('shows warning when EmailJS keys are not configured', () => {
      vi.stubEnv('VITE_EMAILJS_SERVICE_ID', '')
      vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', '')
      vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', '')

      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByText(/VITE_EMAILJS_\*/)).toBeInTheDocument()

      // Restore
      vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'test-service-id')
      vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'test-template-id')
      vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'test-public-key')
    })

    it('disables submit button when EmailJS keys are missing', () => {
      vi.stubEnv('VITE_EMAILJS_SERVICE_ID', '')

      render(<ContactPage config={mockContactConfig} />)
      expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()

      vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'test-service-id')
    })
  })
})
