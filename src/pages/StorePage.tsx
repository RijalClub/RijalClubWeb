import type {
  MediaAsset,
  ProfileConfig,
  StoreConfig,
  StoreProduct,
} from "@/types/content";
import { Images, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";

interface StorePageProps {
  store: StoreConfig;
  profile: ProfileConfig;
}

interface CheckoutResponse {
  checkoutUrl?: string;
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

export function StorePage({ store, profile }: StorePageProps) {
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const activeMedia = activeProduct ? storeMedia(activeProduct) : [];
  const selectedMedia = activeMedia[mediaIndex];

  const startCheckout = async (product: StoreProduct): Promise<void> => {
    if (!store.isOpen || !product.enabled) {
      return;
    }

    setErrorMessage(null);

    if (product.checkoutUrl) {
      window.open(product.checkoutUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (!store.stripe.enabled || !store.stripe.checkoutEndpoint) {
      setErrorMessage(
        "Stripe checkout is not configured yet. Add checkoutUrl or checkoutEndpoint in store.json.",
      );
      return;
    }

    setBusyProductId(product.id);

    try {
      const response = await fetch(store.stripe.checkoutEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          stripePriceId: product.stripePriceId,
          publishableKey: store.stripe.publishableKey,
          successUrl: store.stripe.successUrl,
          cancelUrl: store.stripe.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error(`Checkout failed with status ${response.status}`);
      }

      const payload = (await response.json()) as CheckoutResponse;

      if (!payload.checkoutUrl) {
        throw new Error("Checkout endpoint did not return checkoutUrl");
      }

      window.location.href = payload.checkoutUrl;
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to start checkout.",
      );
    } finally {
      setBusyProductId(null);
    }
  };

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
      <main className="page-grid">
        <section className="panel reveal store-hero">
          <p className="kicker">
            <ShoppingBag size={16} />
            Merchandise
          </p>
          <h1>{store.title}</h1>
          <p>{store.description}</p>
          <p
            className={
              store.isOpen ? "store-status open" : "store-status closed"
            }
          >
            {store.isOpen ? "Store is open" : store.closedMessage}
          </p>
          {!store.isOpen ? (
            <a
              href={profile.secondaryCta.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Stay Updated
            </a>
          ) : null}
        </section>

        {errorMessage ? (
          <p className="state-text error">{errorMessage}</p>
        ) : null}

        <section className="panel reveal">
          <div className="store-grid">
            {store.products.map((product) => {
              const mediaItems = storeMedia(product);
              const primaryMedia = mediaItems[0];
              const cardClassName = [
                "store-card",
                product.enabled ? "" : "disabled",
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
                  <div className="store-card-body">
                    <div className="store-card-header">
                      <h3>{product.title}</h3>
                      {product.badge ? (
                        <span className="tag">{product.badge}</span>
                      ) : null}
                    </div>
                    <p>{product.description}</p>
                    <strong>
                      {formatPrice(product.price, product.currency)}
                    </strong>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

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
                <p className="kicker">
                  Merchandise
                  {activeProduct.badge ? ` • ${activeProduct.badge}` : ""}
                </p>
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
              <button
                type="button"
                className="btn btn-solid"
                disabled={
                  !store.isOpen ||
                  !activeProduct.enabled ||
                  busyProductId === activeProduct.id
                }
                onClick={() => {
                  void startCheckout(activeProduct);
                }}
              >
                {busyProductId === activeProduct.id ? "Loading..." : "Buy Now"}
              </button>
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
