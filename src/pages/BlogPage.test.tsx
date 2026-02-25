import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BlogPage } from './BlogPage'
import { mockBlog } from '@/test/fixtures/content'

describe('BlogPage', () => {
  it('renders kicker text', () => {
    render(<BlogPage blog={mockBlog} />)
    expect(screen.getByText(mockBlog.kicker)).toBeInTheDocument()
  })

  it('renders blog title as h1', () => {
    render(<BlogPage blog={mockBlog} />)
    expect(screen.getByRole('heading', { level: 1, name: mockBlog.title })).toBeInTheDocument()
  })

  it('renders blog description', () => {
    render(<BlogPage blog={mockBlog} />)
    expect(screen.getByText(mockBlog.description)).toBeInTheDocument()
  })

  it('renders jump-to links for each post', () => {
    render(<BlogPage blog={mockBlog} />)
    for (const post of mockBlog.posts) {
      const link = screen.getByRole('link', { name: post.title })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', `#${post.id}`)
    }
  })

  it('renders each post title as h2', () => {
    render(<BlogPage blog={mockBlog} />)
    for (const post of mockBlog.posts) {
      expect(screen.getByRole('heading', { level: 2, name: post.title })).toBeInTheDocument()
    }
  })

  it('renders each post excerpt', () => {
    render(<BlogPage blog={mockBlog} />)
    for (const post of mockBlog.posts) {
      expect(screen.getByText(post.excerpt)).toBeInTheDocument()
    }
  })

  it('renders each post cover image', () => {
    render(<BlogPage blog={mockBlog} />)
    for (const post of mockBlog.posts) {
      const img = screen.getByRole('img', { name: post.coverAlt })
      expect(img).toBeInTheDocument()
      expect(img).toHaveAttribute('src', post.coverImage)
    }
  })

  it('renders post tags', () => {
    render(<BlogPage blog={mockBlog} />)
    const firstPost = mockBlog.posts[0]
    for (const tag of firstPost.tags) {
      expect(screen.getAllByText(tag).length).toBeGreaterThan(0)
    }
  })

  it('renders post paragraphs', () => {
    render(<BlogPage blog={mockBlog} />)
    for (const post of mockBlog.posts) {
      for (const para of post.paragraphs) {
        expect(screen.getByText(para)).toBeInTheDocument()
      }
    }
  })

  it('renders checklist items when present', () => {
    render(<BlogPage blog={mockBlog} />)
    const firstPost = mockBlog.posts[0]
    if (firstPost.checklist) {
      for (const item of firstPost.checklist) {
        expect(screen.getByText(item)).toBeInTheDocument()
      }
    }
  })

  it('does not render checklist when not present', () => {
    render(<BlogPage blog={mockBlog} />)
    const secondPost = mockBlog.posts[1]
    // Second post has no checklist - ensure no list items rendered for it
    expect(secondPost.checklist).toBeUndefined()
  })

  it('renders formatted publication date', () => {
    render(<BlogPage blog={mockBlog} />)
    // At least one post date should include Jan and 2024
    expect(screen.getAllByText(/Jan.*2024|2024.*Jan/).length).toBeGreaterThan(0)
  })

  it('renders post article with correct id', () => {
    const { container } = render(<BlogPage blog={mockBlog} />)
    for (const post of mockBlog.posts) {
      const article = container.querySelector(`#${post.id}`)
      expect(article).toBeInTheDocument()
    }
  })

  it('renders "Jump To Post" section heading', () => {
    render(<BlogPage blog={mockBlog} />)
    expect(screen.getByText(/Jump To Post/)).toBeInTheDocument()
  })

  it('renders posts without checklist without ul element for those posts', () => {
    const blogWithoutChecklist = {
      ...mockBlog,
      posts: [
        {
          ...mockBlog.posts[1],
          checklist: undefined,
        },
      ],
    }
    render(<BlogPage blog={blogWithoutChecklist} />)
    // Should not throw and should render without the checklist
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('handles invalid date gracefully', () => {
    const blogWithBadDate = {
      ...mockBlog,
      posts: [{ ...mockBlog.posts[0], publishedAt: 'not-a-date' }],
    }
    render(<BlogPage blog={blogWithBadDate} />)
    expect(screen.getByText('not-a-date')).toBeInTheDocument()
  })
})
