import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  MediaAsset,
  ProfileConfig,
  StoreConfig,
  StoreProduct,
} from "@/types/content";
import { Images, ShoppingBag, X, Play, ShoppingCart, Info, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface StorePageProps {
  store: StoreConfig;
  profile: ProfileConfig;
}

interface CheckoutResponse {
  checkoutUrl?: string;
}

function storeMedia(product: StoreProduct): MediaAsset[] {
  if (product.media && product.media.length > 0) return product.media;
  return [{ type: "image", url: product.image, alt: product.title }];
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(price);
}

export function StorePage({ store, profile }: StorePageProps) {
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);

  const activeMedia = activeProduct ? storeMedia(activeProduct) : [];

  const startCheckout = async (product: StoreProduct) => {
    if (!store.isOpen || !product.enabled) return;
    setErrorMessage(null);
    if (product.checkoutUrl) { window.open(product.checkoutUrl, "_blank", "noopener,noreferrer"); return; }
    if (!store.stripe.enabled || !store.stripe.checkoutEndpoint) { setErrorMessage("Stripe checkout is not configured yet."); return; }

    setBusyProductId(product.id);
    try {
      const response = await fetch(store.stripe.checkoutEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id, stripePriceId: product.stripePriceId, publishableKey: store.stripe.publishableKey, successUrl: store.stripe.successUrl, cancelUrl: store.stripe.cancelUrl }),
      });
      if (!response.ok) throw new Error(`Checkout failed: ${response.status}`);
      const payload = await response.json() as CheckoutResponse;
      if (!payload.checkoutUrl) throw new Error("No checkout URL returned");
      window.location.href = payload.checkoutUrl;
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Checkout error.");
    } finally { setBusyProductId(null); }
  };

  useEffect(() => { if (activeProduct) setMediaIndex(0); }, [activeProduct?.id]);
  useEffect(() => {
    if (!activeProduct) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setActiveProduct(null);
    window.addEventListener("keydown", onEsc);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onEsc); };
  }, [activeProduct]);

  return (
    <main className="page-grid reveal">
      <section className="panel p-8 md:p-12 flex flex-col gap-6">
        <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
          <ShoppingBag size={14} />
          Official Merchandise
        </div>
        <h1 className="font-bebas text-5xl md:text-7xl text-white tracking-wide leading-none">{store.title}</h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">{store.description}</p>
        
        <div className="flex flex-wrap items-center gap-4 mt-4">
          <Badge className={cn("rounded-full px-4 py-1.5 text-xs font-bold", store.isOpen ? "bg-primary/10 text-primary border-primary/20" : "bg-destructive/10 text-destructive border-destructive/20")}>
            {store.isOpen ? "Store is accepting orders" : store.closedMessage}
          </Badge>
          {!store.isOpen && (
            <Button asChild variant="outline" className="rounded-full border-white/10 text-white hover:bg-white/5">
              <a href={profile.secondaryCta.url} target="_blank" rel="noopener noreferrer">Notify Me</a>
            </Button>
          )}
        </div>
      </section>

      {errorMessage && <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">{errorMessage}</div>}

      <section className="panel p-6 md:p-8 flex flex-col gap-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {store.products.map((product) => {
            const media = storeMedia(product);
            const primary = media[0];
            return (
              <article
                key={product.id}
                className={cn(
                  "group relative flex flex-col gap-4 p-4 rounded-3xl border transition-all duration-500 cursor-pointer",
                  product.enabled ? "border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-primary/30" : "opacity-50 grayscale pointer-events-none border-dashed border-white/10"
                )}
                onClick={() => setActiveProduct(product)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  {primary?.type === "video" ? (
                    <video muted playsInline preload="metadata" poster={primary.posterUrl} className="absolute inset-0 size-full object-cover">
                      <source src={primary.url} />
                    </video>
                  ) : (
                    <img src={primary?.url} alt={product.title} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  )}
                  
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {product.badge && <Badge className="rounded-full bg-primary text-primary-foreground border-none text-[10px] font-bold shadow-lg">{product.badge}</Badge>}
                    {media.length > 1 && (
                      <Badge className="rounded-full bg-black/60 backdrop-blur-md border-white/10 text-[10px] font-bold">
                        <Images size={10} className="mr-1.5" /> +{media.length - 1}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 px-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{product.title}</h3>
                    <span className="text-primary font-bebas text-lg tracking-wide">{formatPrice(product.price, product.currency)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{product.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {activeProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => setActiveProduct(null)} />
          <div className="relative w-full max-w-5xl max-h-full overflow-hidden panel flex flex-col md:flex-row shadow-3xl">
            <div className="w-full md:w-1/2 flex flex-col gap-4 bg-black/20 p-6">
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black">
                {activeMedia[mediaIndex].type === "video" ? (
                  <video controls autoPlay muted playsInline preload="metadata" key={activeMedia[mediaIndex].url} className="size-full object-cover">
                    <source src={activeMedia[mediaIndex].url} />
                  </video>
                ) : (
                  <img src={activeMedia[mediaIndex].url} alt={activeProduct.title} className="size-full object-cover animate-in fade-in zoom-in-95 duration-500" />
                )}
              </div>
              {activeMedia.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {activeMedia.map((m, i) => (
                    <button
                      key={i}
                      onClick={() => setMediaIndex(i)}
                      className={cn(
                        "relative flex-none size-20 rounded-xl overflow-hidden border-2 transition-all",
                        i === mediaIndex ? "border-primary shadow-lg shadow-primary/20" : "border-white/10 hover:border-white/30"
                      )}
                    >
                      <img src={m.type === "video" ? m.posterUrl : m.url} className="size-full object-cover" alt="" />
                      {m.type === "video" && <div className="absolute inset-0 flex items-center justify-center bg-black/40"><Play size={16} fill="white" /></div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex-1 p-8 flex flex-col justify-between overflow-y-auto">
              <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-2">
                    <Badge variant="outline" className="w-fit rounded-full border-primary/30 text-primary uppercase tracking-widest text-[10px] font-bold">Product Details</Badge>
                    <h2 className="text-3xl font-bold text-white">{activeProduct.title}</h2>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-full bg-white/5 hover:bg-white/10 text-white" onClick={() => setActiveProduct(null)}>
                    <X size={20} />
                  </Button>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div className="text-primary font-bebas text-4xl tracking-wider">{formatPrice(activeProduct.price, activeProduct.currency)}</div>
                  <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{activeProduct.description}</p>
                </div>

                {activeProduct.badge && (
                  <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                    <Info size={18} className="text-primary" />
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{activeProduct.badge}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw size={14} />
                  <span className="text-[10px] uppercase font-bold tracking-widest">Secure Checkout Enabled</span>
                </div>
                <Button 
                  size="lg" 
                  disabled={!store.isOpen || !activeProduct.enabled || busyProductId === activeProduct.id}
                  onClick={() => startCheckout(activeProduct)}
                  className="w-full md:w-auto rounded-full bg-primary text-primary-foreground font-bold px-10 hover:shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
                >
                  {busyProductId === activeProduct.id ? <RefreshCw className="animate-spin mr-2" size={18} /> : <ShoppingCart className="mr-2" size={18} />}
                  {busyProductId === activeProduct.id ? "Processing..." : "Secure Buy Now"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
