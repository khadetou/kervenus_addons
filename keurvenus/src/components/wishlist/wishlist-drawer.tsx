import { Link } from "@tanstack/react-router"
import { useRef } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/types"

export function WishlistDrawer() {
  const {
    closeWishlist,
    isWishlistOpen,
    products,
    removeProduct,
    setWishlistOpen,
  } = useWishlist()
  const { addProduct } = useCart()
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!isWishlistOpen || !listRef.current || prefersReducedMotion()) return
      const targets = Array.from(listRef.current.querySelectorAll("[data-wishlist-line]"))
      if (!targets.length) return
      gsap.from(targets, {
        opacity: 0,
        y: 14,
        duration: 0.35,
        stagger: 0.055,
        ease: "power2.out",
      })
    },
    { scope: listRef, dependencies: [isWishlistOpen, products.length] }
  )

  function moveToCart(product: Product) {
    addProduct(product)
    removeProduct(product.id)
  }

  return (
    <Sheet open={isWishlistOpen} onOpenChange={setWishlistOpen}>
      <SheetContent className="w-[94vw] max-w-md overflow-hidden border-l border-white/70 bg-ivory p-0">
        <SheetHeader className="border-b border-charcoal/10 p-5 text-left">
          <SheetTitle className="font-serif text-3xl">Favoris Kër Venus</SheetTitle>
          <SheetDescription className="text-sm text-warm-gray">
            Vos pièces sauvegardées pour composer une maison raffinée.
          </SheetDescription>
        </SheetHeader>

        <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
          {products.length === 0 ? (
            <div className="grid place-items-center rounded-[2rem] border border-dashed border-charcoal/15 bg-white/60 p-8 text-center">
              <AppIcon icon="solar:heart-linear" className="size-10 text-gold" />
              <h3 className="mt-4 font-serif text-2xl">Aucun favori pour le moment.</h3>
              <p className="mt-2 text-sm leading-6 text-warm-gray">
                Touchez le cœur sur une pièce pour la retrouver ici.
              </p>
              <Button asChild className="mt-5 rounded-full bg-charcoal text-ivory">
                <Link to="/shop" onClick={closeWishlist}>
                  Explorer la boutique
                </Link>
              </Button>
            </div>
          ) : (
            products.map((product) => (
              <article
                data-wishlist-line
                key={product.id}
                className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-[1.5rem] border border-charcoal/10 bg-white/80 p-2.5 shadow-[0_18px_45px_rgba(23,23,23,0.06)] sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4 sm:rounded-3xl sm:p-3"
              >
                <Link to="/shop/$slug" params={{ slug: product.slug }} onClick={closeWishlist}>
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-20 w-full rounded-[1.15rem] bg-ivory object-contain p-1 sm:h-24 sm:rounded-2xl"
                    loading="lazy"
                  />
                </Link>
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to="/shop/$slug"
                        params={{ slug: product.slug }}
                        onClick={closeWishlist}
                      className="line-clamp-1 font-serif text-lg leading-none hover:text-gold sm:text-xl"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-warm-gray">
                        {product.shortDescription}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeProduct(product.id)}
                      className="shrink-0 text-warm-gray hover:text-charcoal"
                      aria-label={`Retirer ${product.name} des favoris`}
                    >
                      <AppIcon icon="solar:close-circle-linear" className="size-5" />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
                    <strong className="min-w-fit text-[13px] sm:text-sm">
                      {formatPrice(product.price, product.currency)}
                    </strong>
                    <Button
                      type="button"
                      size="sm"
                      className="ml-auto h-8 rounded-full bg-charcoal px-3 text-xs text-ivory hover:bg-charcoal/90 sm:h-9 sm:px-4 sm:text-[0.8rem]"
                      onClick={() => moveToCart(product)}
                    >
                      Ajouter
                      <AppIcon icon="solar:bag-4-linear" className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
        {products.length ? (
          <div className="border-t border-charcoal/10 bg-white/60 p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <Button asChild className="h-11 w-full rounded-full bg-charcoal text-ivory hover:bg-charcoal/90">
              <Link to="/wishlist" onClick={closeWishlist}>
                Voir tous les favoris
                <AppIcon icon="solar:arrow-right-linear" className="size-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
