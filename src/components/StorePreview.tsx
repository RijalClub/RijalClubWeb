import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { MediaAsset, StoreConfig, StoreProduct } from "@/types/content";
import { ExternalLink, Images, X, ShoppingBag, ArrowRight, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface StorePreviewProps {
  store: StoreConfig;
}

function storeMedia(product: StoreProduct): MediaAsset[] {
  if (product.media && product.media.length > 0) return product.media;
  return [{ type: "image", url: product.image, alt: product.title }];
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 2 }).format(price);
}

export function StorePreview({ store }: StorePreviewProps) {
  const [activeProduct, setActiveProduct] = useState<StoreProduct | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const previewProducts = store.products.filter(p => p.enabled).slice(0, 3);
  const activeMedia = activeProduct ? storeMedia(activeProduct) : [];

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
    <>
      <section className="panel p-6 md:p-8 flex flex-col gap-8 reveal">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="font-bebas text-4xl tracking-wide text-white">
              <Link to="/store" className="hover:text-primary transition-colors flex items-center gap-3">
                <ShoppingBag className="text-primary size-8" />
                {store.title}
              </Link>
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">{store.description}</p>
          </div>
          <Button asChild variant="ghost" size="sm" className="rounded-full bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-widest group">
            <Link to="/store">
              Full Store <ArrowRight size={14} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {!store.isOpen && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">
            {store.closedMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {previewProducts.map((product) => {
            const media = storeMedia(product);
            const primary = media[0];
            return (
              <article
                key={product.id}
                className="group relative flex flex-col gap-4 p-4 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/5 hover:border-primary/30 transition-all duration-500 cursor-pointer"
                onClick={() => setActiveProduct(product)}
              >
                <div className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  {primary?.type === "video" ? (
                    <video muted playsInline preload="metadata" poster={primary.posterUrl} className="absolute inset-0 size-full object-cover">
                      <source src={primary.url} />
                    </video>
                  ) : (
                    <img src={primary?.url} alt={primary?.alt || product.title} className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                  )}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-300" />
                  
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {media.length > 1 && (
                      <Badge className="rounded-full bg-black/60 backdrop-blur-md border-white/10 text-[10px] font-bold">
                        <Images size={10} className="mr-1.5" /> +{media.length - 1}
                      </Badge>
                    )}
                    {primary?.type === "video" && (
                      <Badge className="rounded-full bg-primary/90 text-primary-foreground border-none text-[10px] font-bold">
                        <Play size={10} fill="currentColor" className="mr-1.5" /> VIDEO
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
                    <Badge variant="outline" className="w-fit rounded-full border-primary/30 text-primary uppercase tracking-widest text-[10px] font-bold">Product Showcase</Badge>
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
              </div>
              
              <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold">Standard shipping rates apply at checkout</p>
                <Button asChild size="lg" className="w-full md:w-auto rounded-full bg-primary text-primary-foreground font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
                  <Link to="/store" onClick={() => setActiveProduct(null)}>
                    Check availability
                    <ExternalLink size={16} className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
