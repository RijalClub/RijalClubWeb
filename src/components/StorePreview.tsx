import type { MediaAsset, StoreConfig, StoreProduct } from "@/types/content";
import { ExternalLink, Images, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface StorePreviewProps {
  store: StoreConfig;
}

function storeMedia(product: StoreProduct): MediaAsset[] {
  if (product.media && product.media.length > 0) {
    return product.media;
  }

  return [{ type: "image", url: product.image, alt: product.title }];
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(price);
}

export function StorePreview({ store }: StorePreviewProps) {
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const previewProducts = store.products
    .filter((product) => product.enabled)
    .slice(0, 3);

  const activeMedia = activeProduct ? storeMedia(activeProduct) : [];
  const selectedMedia = activeMedia[mediaIndex];

  useEffect(() => {
    if (!activeProduct) {
      return;
    }

    setMediaIndex(0);
  }, [activeProduct?.id]);

  useEffect(() => {
    if (!activeProduct) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setActiveProduct(null);
      }
    };

    window.addEventListener("keydown", onEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onEscape);
    };
  }, [activeProduct]);

  return (
    <>
      <section className="panel reveal store-preview-panel">
        <div className="section-heading">
          <h2>
            <Link to="/store" className="section-heading-link">
              {store.title}
            </Link>
          </h2>
          <p>{store.description}</p>
        </div>

        {!store.isOpen ? (
          <p className="state-text">{store.closedMessage}</p>
        ) : null}

        <div className="store-grid">
          {previewProducts.map((product) => {
            const mediaItems = storeMedia(product);
            const primaryMedia = mediaItems[0];
            const cardClassName = [
              "store-card",
              "clickable",
              mediaItems.length > 0 ? "has-media" : "",
              mediaItems.length > 1 ? "has-multi-media" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <article
                key={product.id}
                className={cardClassName}
                onClick={() => setActiveProduct(product)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActiveProduct(product);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                {primaryMedia ? (
                  primaryMedia.type === "video" ? (
                    <video
                      muted
                      playsInline
                      preload="metadata"
                      poster={primaryMedia.posterUrl}
                    >
                      <source src={primaryMedia.url} />
                      Your browser does not support embedded videos.
                    </video>
                  ) : (
                    <img
                      src={primaryMedia.url}
                      alt={primaryMedia.alt || product.title}
                      loading="lazy"
                    />
                  )
                ) : null}
                {mediaItems.length > 1 ? (
                  <p className="content-card-more">
                    <Images size={13} />+{mediaItems.length - 1} more media
                  </p>
                ) : null}
                <h3>{product.title}</h3>
                <p>{product.description}</p>
                <strong>{formatPrice(product.price, product.currency)}</strong>
              </article>
            );
          })}
        </div>

        <div className="store-action-row">
          <Link to="/store" className="btn btn-solid">
            Open Store Page
          </Link>
        </div>
      </section>

      {activeProduct ? (
        <div
          className="content-modal"
          role="dialog"
          aria-modal="true"
          aria-label={activeProduct.title}
        >
          <div
            className="content-modal-overlay"
            onClick={() => setActiveProduct(null)}
            aria-hidden="true"
          />
          <section className="content-modal-panel panel">
            <header className="content-modal-header">
              <div>
                <p className="kicker">Merchandise</p>
                <h3>{activeProduct.title}</h3>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setActiveProduct(null)}
              >
                <X size={14} />
                Close
              </button>
            </header>

            <p className="content-modal-copy">{activeProduct.description}</p>
            <p className="source-note">
              Price: {formatPrice(activeProduct.price, activeProduct.currency)}
            </p>

            {selectedMedia ? (
              <div className="content-modal-media">
                {selectedMedia.type === "video" ? (
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    poster={selectedMedia.posterUrl}
                  >
                    <source src={selectedMedia.url} />
                    Your browser does not support embedded videos.
                  </video>
                ) : (
                  <img
                    src={selectedMedia.url}
                    alt={selectedMedia.alt || activeProduct.title}
                    loading="lazy"
                  />
                )}
              </div>
            ) : null}

            {activeMedia.length > 1 ? (
              <div className="content-modal-thumbs">
                {activeMedia.map((media, index) => (
                  <button
                    key={`${activeProduct.id}-media-${index}`}
                    type="button"
                    className={
                      index === mediaIndex
                        ? "content-modal-thumb active"
                        : "content-modal-thumb"
                    }
                    onClick={() => setMediaIndex(index)}
                  >
                    {media.type === "video" ? (
                      <video
                        muted
                        playsInline
                        preload="metadata"
                        poster={media.posterUrl}
                      >
                        <source src={media.url} />
                      </video>
                    ) : (
                      <img
                        src={media.url}
                        alt={
                          media.alt ||
                          `${activeProduct.title} media ${index + 1}`
                        }
                        loading="lazy"
                      />
                    )}
                  </button>
                ))}
              </div>
            ) : null}

            <div className="content-modal-actions">
              <Link
                to="/store"
                className="btn btn-solid"
                onClick={() => setActiveProduct(null)}
              >
                Go To Store
                <ExternalLink size={13} />
              </Link>
              <p className="source-note">
                Recommended media ratio: 16:9 (for example 1600x900).
              </p>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
