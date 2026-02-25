import { BookMarked, FileText, SquareArrowOutUpRight, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { HadithCollectionConfig, HadithConfig } from '@/types/content'

interface LibraryPageProps {
  config: HadithConfig
}

const MOBILE_TABLET_QUERY = '(max-width: 1024px)'

function loadStoredString(key: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback
  }

  return window.localStorage.getItem(key) ?? fallback
}

function fallbackCollection(config: HadithConfig): HadithCollectionConfig {
  return config.collections.find((collection) => collection.id === config.defaultCollectionId) ?? config.collections[0]
}

export function LibraryPage({ config }: LibraryPageProps) {
  const defaultCollection = useMemo(() => fallbackCollection(config), [config])
  const [isCompactScreen, setIsCompactScreen] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }

    return window.matchMedia(MOBILE_TABLET_QUERY).matches
  })

  const [collectionId, setCollectionId] = useState(() =>
    loadStoredString('rijal:library:collection', defaultCollection.id),
  )
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false)

  const selectedCollection = useMemo(
    () => config.collections.find((collection) => collection.id === collectionId) ?? defaultCollection,
    [collectionId, config.collections, defaultCollection],
  )
  const selectCollection = (collection: HadithCollectionConfig): void => {
    setCollectionId(collection.id)

    if (!isCompactScreen) {
      return
    }

    if (collection.pdfUrl) {
      setIsPdfModalOpen(true)
      return
    }

    setIsPdfModalOpen(false)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('rijal:library:collection', selectedCollection.id)
  }, [selectedCollection.id])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return
    }

    const mediaQuery = window.matchMedia(MOBILE_TABLET_QUERY)
    const onChange = (event: MediaQueryListEvent): void => {
      setIsCompactScreen(event.matches)
    }

    setIsCompactScreen(mediaQuery.matches)
    mediaQuery.addEventListener('change', onChange)

    return () => {
      mediaQuery.removeEventListener('change', onChange)
    }
  }, [])

  useEffect(() => {
    if (!isCompactScreen && isPdfModalOpen) {
      setIsPdfModalOpen(false)
    }
  }, [isCompactScreen, isPdfModalOpen])

  useEffect(() => {
    if (!isPdfModalOpen || typeof document === 'undefined') {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        setIsPdfModalOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isPdfModalOpen])

  return (
    <main className="page-grid library-page">
      <section className="panel reveal library-hero">
        <p className="kicker">
          <BookMarked size={16} />
          Library
        </p>
        <h1>{config.title}</h1>
        <p>{config.description}</p>
      </section>

      <section className="panel reveal library-collections-panel">
        <div className="section-heading">
          <h2>Sunni Collections</h2>
          <p>
            {isCompactScreen
              ? 'Tap a collection cover to open the fullscreen PDF reader.'
              : 'Pick a collection to open its embedded PDF.'}
          </p>
        </div>
        <div className="library-collection-grid">
          {config.collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={collection.id === selectedCollection.id ? 'library-collection active' : 'library-collection'}
              onClick={() => selectCollection(collection)}
            >
              {collection.coverImage ? (
                <img src={collection.coverImage} alt={`${collection.title} cover`} loading="lazy" />
              ) : (
                <div className="library-cover-placeholder">
                  <span>{collection.title}</span>
                </div>
              )}
              <div className="library-collection-body">
                <strong>{collection.title}</strong>
                <small>{collection.subtitle}</small>
                <p>{collection.description}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="panel reveal library-reader-panel">
        {isCompactScreen ? (
          <article className="library-pdf-card">
            <header className="library-pdf-header">
              <p className="kicker">
                <FileText size={14} />
                Mobile/Tablet Reader
              </p>
              {selectedCollection.pdfUrl ? (
                <div className="library-link-row">
                  <a href={selectedCollection.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-link">
                    Open {selectedCollection.title} in new tab
                    <SquareArrowOutUpRight size={12} />
                  </a>
                </div>
              ) : null}
            </header>
            <p className="source-note">Tap a collection cover above to open the fullscreen reader.</p>
            {!selectedCollection.pdfUrl ? <p className="state-text">PDF not available for this collection yet.</p> : null}
          </article>
        ) : selectedCollection.pdfUrl ? (
          <article className="library-pdf-card">
            <header className="library-pdf-header">
              <p className="kicker">
                <FileText size={14} />
                {selectedCollection.title} PDF
              </p>
              <div className="library-link-row">
                <a href={selectedCollection.pdfUrl} target="_blank" rel="noopener noreferrer" className="inline-link">
                  Open in new tab
                  <SquareArrowOutUpRight size={12} />
                </a>
              </div>
            </header>
            <iframe
              src={selectedCollection.pdfUrl}
              title={`${selectedCollection.title} PDF`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </article>
        ) : (
          <article className="library-pdf-card">
            <p className="state-text">PDF not available for this collection yet.</p>
          </article>
        )}
      </section>

      {isCompactScreen && isPdfModalOpen && selectedCollection.pdfUrl ? (
        <div className="library-pdf-modal" role="dialog" aria-modal="true" aria-label={`${selectedCollection.title} PDF reader`}>
          <div className="library-pdf-modal-overlay" onClick={() => setIsPdfModalOpen(false)} aria-hidden="true" />
          <section className="library-pdf-modal-panel panel">
            <header className="library-pdf-modal-header">
              <p className="kicker">
                <FileText size={14} />
                {selectedCollection.title}
              </p>
              <button type="button" className="icon-btn" onClick={() => setIsPdfModalOpen(false)} aria-label="Close PDF reader">
                <X size={15} />
                Close
              </button>
            </header>
            <iframe
              src={selectedCollection.pdfUrl}
              title={`${selectedCollection.title} fullscreen PDF`}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="library-pdf-modal-frame"
            />
          </section>
        </div>
      ) : null}
    </main>
  )
}
