import { AdhanAlertProvider } from "@/components/AdhanAlertProvider";
import { SiteShell } from "@/components/SiteShell";
import { type SiteContent } from "@/lib/content";
import { HomePage } from "@/pages/HomePage";
import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { contentPreload } from "./main";

const BlogPage = lazy(() =>
  import("@/pages/BlogPage").then((m) => ({ default: m.BlogPage })),
);
const ContactPage = lazy(() =>
  import("@/pages/ContactPage").then((m) => ({ default: m.ContactPage })),
);
const LibraryPage = lazy(() =>
  import("@/pages/LibraryPage").then((m) => ({ default: m.LibraryPage })),
);
const QuranPage = lazy(() =>
  import("@/pages/QuranPage").then((m) => ({ default: m.QuranPage })),
);
const StorePage = lazy(() =>
  import("@/pages/StorePage").then((m) => ({ default: m.StorePage })),
);

function LoadingScreen() {
  return (
    <div className="status-screen">
      <div className="status-card panel">
        <h1>Loading The Rijal Club</h1>
        <p>
          Pulling profile, links, announcements, prayer times, Quran, library,
          contact, store, and cache config.
        </p>
      </div>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="status-screen">
      <div className="status-card panel">
        <h1>Config load error</h1>
        <p>{message}</p>
        <button
          type="button"
          className="btn btn-solid"
          onClick={() => window.location.reload()}
        >
          Reload
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void contentPreload
      .then((result) => {
        if (isMounted) {
          setContent(result);
          setErrorMessage(null);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unexpected error while loading content.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (errorMessage) {
    return <ErrorScreen message={errorMessage} />;
  }

  if (!content) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <AdhanAlertProvider
        links={content.links}
        prayerConfig={content.prayer}
        prayerCache={content.cache.prayer}
      >
        <SiteShell
          profile={content.profile}
          showStore={content.store.isOpen}
          showLibrary={Boolean(content.hadith)}
        >
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<HomePage content={content} />} />
              <Route path="/blog" element={<BlogPage blog={content.blog} />} />
              <Route
                path="/announcements"
                element={<Navigate to="/blog" replace />}
              />
              <Route
                path="/quran"
                element={
                  <QuranPage
                    config={content.quran}
                    cache={content.cache.quran}
                  />
                }
              />
              <Route
                path="/library"
                element={
                  content.hadith ? (
                    <LibraryPage config={content.hadith} />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/store"
                element={
                  content.store.isOpen ? (
                    <StorePage
                      store={content.store}
                      profile={content.profile}
                    />
                  ) : (
                    <Navigate to="/" replace />
                  )
                }
              />
              <Route
                path="/contact"
                element={<ContactPage config={content.contact} />}
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </SiteShell>
      </AdhanAlertProvider>
    </BrowserRouter>
  );
}
