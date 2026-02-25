import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { SiteShell } from '@/components/SiteShell'
import { AdhanAlertProvider } from '@/components/AdhanAlertProvider'
import { BlogPage } from '@/pages/BlogPage'
import { loadSiteContent, type SiteContent } from '@/lib/content'
import { ContactPage } from '@/pages/ContactPage'
import { HomePage } from '@/pages/HomePage'
import { LibraryPage } from '@/pages/LibraryPage'
import { QuranPage } from '@/pages/QuranPage'
import { StorePage } from '@/pages/StorePage'

function LoadingScreen() {
  return (
    <div className="status-screen">
      <div className="status-card panel">
        <h1>Loading The Rijal Club</h1>
        <p>Pulling profile, links, announcements, prayer times, Quran, library, contact, store, and cache config.</p>
      </div>
    </div>
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="status-screen">
      <div className="status-card panel">
        <h1>Config load error</h1>
        <p>{message}</p>
        <button type="button" className="btn btn-solid" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [content, setContent] = useState<SiteContent | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    void loadSiteContent()
      .then((result) => {
        if (isMounted) {
          setContent(result)
          setErrorMessage(null)
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unexpected error while loading content.')
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  if (errorMessage) {
    return <ErrorScreen message={errorMessage} />
  }

  if (!content) {
    return <LoadingScreen />
  }

  return (
    <BrowserRouter>
      <AdhanAlertProvider links={content.links} prayerConfig={content.prayer} prayerCache={content.cache.prayer}>
        <SiteShell profile={content.profile} showStore={content.store.isOpen}>
          <Routes>
            <Route path="/" element={<HomePage content={content} />} />
            <Route path="/blog" element={<BlogPage blog={content.blog} />} />
            <Route path="/announcements" element={<Navigate to="/blog" replace />} />
            <Route path="/quran" element={<QuranPage config={content.quran} cache={content.cache.quran} />} />
            <Route path="/library" element={<LibraryPage config={content.hadith} />} />
            <Route
              path="/store"
              element={content.store.isOpen ? <StorePage store={content.store} profile={content.profile} /> : <Navigate to="/" replace />}
            />
            <Route path="/contact" element={<ContactPage config={content.contact} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SiteShell>
      </AdhanAlertProvider>
    </BrowserRouter>
  )
}
