import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { SiteShell } from './SiteShell'
import { mockProfile } from '@/test/fixtures/content'

function renderShell(showStore: boolean, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteShell profile={mockProfile} showStore={showStore}>
        <div data-testid="child-content">Page Content</div>
      </SiteShell>
    </MemoryRouter>,
  )
}

describe('SiteShell', () => {
  it('renders children', () => {
    renderShell(true)
    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Page Content')).toBeInTheDocument()
  })

  it('renders brand link with profile name', () => {
    renderShell(true)
    expect(screen.getByText(mockProfile.name)).toBeInTheDocument()
  })

  it('renders tagline in header', () => {
    renderShell(true)
    expect(screen.getByText(mockProfile.tagline)).toBeInTheDocument()
  })

  it('renders brand logo with alt text', () => {
    renderShell(true)
    const logo = screen.getByRole('img', { name: `${mockProfile.name} logo` })
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', mockProfile.logo)
  })

  it('renders Home navigation link', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })

  it('renders Blog navigation link', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: /blog/i })).toBeInTheDocument()
  })

  it('renders Quran navigation link', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: /quran/i })).toBeInTheDocument()
  })

  it('renders Library navigation link', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: /library/i })).toBeInTheDocument()
  })

  it('renders Contact navigation link', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: /contact/i })).toBeInTheDocument()
  })

  it('renders Store link when showStore is true', () => {
    renderShell(true)
    expect(screen.getByRole('link', { name: /store/i })).toBeInTheDocument()
  })

  it('hides Store link when showStore is false', () => {
    renderShell(false)
    expect(screen.queryByRole('link', { name: /store/i })).not.toBeInTheDocument()
  })

  it('renders footer with location label', () => {
    renderShell(true)
    expect(screen.getByText(mockProfile.locationLabel)).toBeInTheDocument()
  })

  it('renders footer with current year', () => {
    renderShell(true)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(new RegExp(String(currentYear)))).toBeInTheDocument()
  })

  it('renders footer with "Made with Love" text', () => {
    renderShell(true)
    expect(screen.getByText(/Made with Love/)).toBeInTheDocument()
  })

  it('has aria-label on brand link', () => {
    renderShell(true)
    const brandLink = screen.getByLabelText('The Rijal Club home')
    expect(brandLink).toBeInTheDocument()
  })

  it('nav has aria-label Main', () => {
    renderShell(true)
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toBeInTheDocument()
  })

  it('renders ambient decorative elements as aria-hidden', () => {
    const { container } = renderShell(true)
    const ambients = container.querySelectorAll('[aria-hidden="true"]')
    // ambient-1, ambient-2
    expect(ambients.length).toBeGreaterThanOrEqual(2)
  })
})
