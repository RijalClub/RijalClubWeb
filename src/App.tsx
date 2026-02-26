import { AdhanAlertProvider } from "@/components/AdhanAlertProvider";
import { SiteShell } from "@/components/SiteShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { type SiteContent } from "@/lib/content";
import { HomePage } from "@/pages/HomePage";
import { LoaderCircle } from "lucide-react";
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
  const [progress, setProgress] = useState(14);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 94) {
          return value;
        }

        const increment = Math.max(1, Math.round((100 - value) * 0.12));
        return Math.min(94, value + increment);
      });
    }, 260);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="status-screen">
      <Card className="status-card panel status-loading-card border-white/10 bg-black/40">
        <CardHeader>
          <CardTitle>Loading The Rijal Club</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0">
          <div className="loading-visual" aria-hidden="true">
            <span className="loading-ring" />
            <LoaderCircle className="loading-spinner" />
          </div>
          <div className="loading-progress-wrap">
            <Progress value={progress} className="loading-progress" />
            <p className="source-note loading-progress-meta">
              {Math.round(progress)}% loaded
            </p>
          </div>
          <p>
            Pulling profile, links, announcements, prayer times, Quran, library,
            contact, store, and cache config.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="status-screen">
      <Card className="status-card panel border-rose-500/30 bg-black/45">
        <CardHeader>
          <CardTitle>Config load error</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 pt-0">
          <p>{message}</p>
          <Button type="button" onClick={() => window.location.reload()}>
            Reload
          </Button>
        </CardContent>
      </Card>
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
        <SiteShell profile={content.profile} showStore={content.store.isOpen}>
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
                element={<LibraryPage config={content.hadith} />}
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
