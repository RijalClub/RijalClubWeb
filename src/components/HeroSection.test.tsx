import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HeroSection } from './HeroSection'
import { mockProfile } from '@/test/fixtures/content'

describe('HeroSection', () => {
  it('renders profile name as h1', () => {
    render(<HeroSection profile={mockProfile} />)
    expect(screen.getByRole('heading', { level: 1, name: mockProfile.name })).toBeInTheDocument()
  })

  it('renders handle/tagline', () => {
    render(<HeroSection profile={mockProfile} />)
    expect(screen.getByText(mockProfile.handle)).toBeInTheDocument()
  })

  it('renders description', () => {
    render(<HeroSection profile={mockProfile} />)
    expect(screen.getByText(mockProfile.description)).toBeInTheDocument()
  })

  it('renders all value chips', () => {
    render(<HeroSection profile={mockProfile} />)
    for (const value of mockProfile.values) {
      expect(screen.getByText(value)).toBeInTheDocument()
    }
  })

  it('renders all stats', () => {
    render(<HeroSection profile={mockProfile} />)
    for (const stat of mockProfile.stats) {
      expect(screen.getByText(stat.label)).toBeInTheDocument()
      expect(screen.getByText(stat.value)).toBeInTheDocument()
    }
  })

  it('renders primary CTA with correct URL and label', () => {
    render(<HeroSection profile={mockProfile} />)
    const primaryCta = screen.getByRole('link', { name: new RegExp(mockProfile.primaryCta.label) })
    expect(primaryCta).toBeInTheDocument()
    expect(primaryCta).toHaveAttribute('href', mockProfile.primaryCta.url)
    expect(primaryCta).toHaveAttribute('target', '_blank')
    expect(primaryCta).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders secondary CTA with correct URL and label', () => {
    render(<HeroSection profile={mockProfile} />)
    const secondaryCta = screen.getByRole('link', { name: mockProfile.secondaryCta.label })
    expect(secondaryCta).toBeInTheDocument()
    expect(secondaryCta).toHaveAttribute('href', mockProfile.secondaryCta.url)
    expect(secondaryCta).toHaveAttribute('target', '_blank')
  })

  it('renders hero image', () => {
    render(<HeroSection profile={mockProfile} />)
    const img = screen.getByRole('img', { name: 'Rijal Club hero' })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', mockProfile.heroImage)
  })

  it('renders Knowledgehood Collective kicker', () => {
    render(<HeroSection profile={mockProfile} />)
    expect(screen.getByText(/Knowledgehood Collective/)).toBeInTheDocument()
  })

  it('renders multiple values as distinct chips', () => {
    const profile = {
      ...mockProfile,
      values: ['Faith', 'Brotherhood', 'Knowledge', 'Action'],
    }
    const { container } = render(<HeroSection profile={profile} />)
    const chips = container.querySelectorAll('.value-chips span')
    expect(chips).toHaveLength(4)
  })
})
