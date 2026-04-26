import { Link } from "@tanstack/react-router"
import { useRef } from "react"

import { AppIcon } from "@/components/icons/icon"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ProductQuickView } from "@/components/product/product-quick-view"
import { useCart } from "@/hooks/use-cart"
import { usePublishProduct } from "@/hooks/use-products"
import { useSession } from "@/hooks/use-session"
import { useWishlist } from "@/hooks/use-wishlist"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

export function ProductCard({ product }: { product: Product }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const { addProduct } = useCart()
  const { data: session } = useSession()
  const publishProduct = usePublishProduct()
  const { isFavorite, toggleProduct } = useWishlist()
  const favorite = isFavorite(product.id)
  const isInternalUser = Boolean(session?.is_internal_user || session?.user?.is_internal_user)
  const isUnpublished = product.isPublished === false

  useGSAP(
    () => {
      if (!cardRef.current || prefersReducedMotion()) return
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 18,
        duration: 0.52,
        ease: "power2.out",
        scrollTrigger: undefined,
      })
    },
    { scope: cardRef }
  )

  return (
    <Card
      ref={cardRef}
      className={cn(
        "group flex h-full w-full overflow-hidden rounded-[1.55rem] border-white/75 bg-white/76 p-3 shadow-soft transition duration-300 hover:-translate-y-1 hover:border-gold/20 hover:bg-white hover:shadow-luxury",
        isUnpublished && "border-dashed border-charcoal/18 bg-white/52"
      )}
    >
      <div className="flex min-h-0 w-full flex-col">
        <AspectRatio
          ratio={4 / 5}
          className="overflow-hidden rounded-[1.2rem] bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.95),rgba(246,239,229,0.72)_48%,rgba(238,229,215,0.92))]"
        >
          <Link
            to="/shop/$slug"
            params={{ slug: product.slug }}
            className="absolute inset-0 grid place-items-center px-6 pb-14 pt-10"
          >
            <img
              src={product.images[0]}
              alt={product.name}
              className={cn(
                "max-h-[88%] max-w-[88%] object-contain drop-shadow-[0_18px_28px_rgba(23,23,23,0.13)] transition duration-700 group-hover:scale-[1.02]",
                isUnpublished && "opacity-45 grayscale-[20%]"
              )}
              loading="lazy"
            />
          </Link>
          <button
            type="button"
            className={cn(
              "absolute right-3 top-3 grid size-9 place-items-center rounded-full shadow-soft backdrop-blur transition hover:bg-white",
              favorite ? "bg-gold text-charcoal" : "bg-white/82 text-charcoal"
            )}
            onClick={() => toggleProduct(product)}
            aria-pressed={favorite}
            aria-label={
              favorite
                ? `Retirer ${product.name} des favoris`
                : `Ajouter ${product.name} aux favoris`
            }
          >
            <AppIcon icon="solar:heart-linear" className="size-4" />
          </button>
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            {isUnpublished ? (
              <Badge className="rounded-full bg-charcoal/86 px-2.5 text-[11px] text-ivory backdrop-blur">
                Non publié
              </Badge>
            ) : null}
            {product.badges.slice(0, 2).map((badge) => (
              <Badge
                key={badge}
                className="rounded-full bg-ivory/92 px-2.5 text-[11px] text-charcoal"
              >
                {badge}
              </Badge>
            ))}
          </div>
          {isInternalUser ? (
            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-2 rounded-full border border-white/70 bg-white/82 p-1.5 shadow-soft backdrop-blur-xl">
              <span className="flex min-w-0 items-center gap-2 pl-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-charcoal/70">
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isUnpublished ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
                {isUnpublished ? "Brouillon" : "Publié"}
              </span>
              <Button
                type="button"
                size="sm"
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  isUnpublished
                    ? "bg-charcoal text-ivory hover:bg-charcoal/90"
                    : "bg-cream text-charcoal hover:bg-white"
                )}
                disabled={publishProduct.isPending}
                onClick={() =>
                  publishProduct.mutate({
                    product,
                    published: isUnpublished,
                  })
                }
              >
                <AppIcon
                  icon={isUnpublished ? "solar:upload-minimalistic-linear" : "solar:eye-closed-linear"}
                  className="size-3.5"
                />
                {isUnpublished ? "Publier" : "Masquer"}
              </Button>
            </div>
          ) : null}
        </AspectRatio>

        <CardContent className="flex flex-1 flex-col px-1 pb-1 pt-4">
          <div className="min-w-0">
            <div className="mb-2 flex min-h-7 items-center justify-between gap-3">
              <Badge
                variant="outline"
                className="line-clamp-1 w-fit rounded-full border-charcoal/10 bg-cream px-3 text-[11px]"
              >
                {product.collection}
              </Badge>
              <div className="shrink-0 text-sm font-semibold text-charcoal">
                {formatPrice(product.price, product.currency)}
              </div>
            </div>
            <Link
              to="/shop/$slug"
              params={{ slug: product.slug }}
              className="line-clamp-1 font-serif text-[1.55rem] leading-none hover:text-gold"
            >
              {product.name}
            </Link>
            <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-6 text-warm-gray">
              {product.shortDescription}
            </p>
          </div>

          <div className="mt-auto flex items-center gap-2 pt-4">
            <ProductQuickView product={product} />
            <Button
              type="button"
              size="icon-lg"
              className="size-11 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
              onClick={() => addProduct(product)}
              aria-label={`Ajouter ${product.name} au panier`}
            >
              <AppIcon icon="solar:bag-4-linear" className="size-4" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
