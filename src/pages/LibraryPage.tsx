import { BookMarked, FileText, SquareArrowOutUpRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { HadithCollectionConfig, HadithConfig } from '@/types/content'

interface LibraryPageProps {
  config: HadithConfig
}

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

  const [collectionId, setCollectionId] = useState(() =>
    loadStoredString('rijal:library:collection', defaultCollection.id),
  )

  const selectedCollection = useMemo(
    () => config.collections.find((collection) => collection.id === collectionId) ?? defaultCollection,
    [collectionId, config.collections, defaultCollection],
  )

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.setItem('rijal:library:collection', selectedCollection.id)
  }, [selectedCollection.id])

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
          <p>Pick a collection to open its embedded PDF.</p>
        </div>
        <div className="library-collection-grid">
          {config.collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              className={collection.id === selectedCollection.id ? 'library-collection active' : 'library-collection'}
              onClick={() => setCollectionId(collection.id)}
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
        {selectedCollection.pdfUrl ? (
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
    </main>
  )
}
