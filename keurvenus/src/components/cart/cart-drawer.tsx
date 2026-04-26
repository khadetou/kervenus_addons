import { Link } from "@tanstack/react-router"
import { useRef } from "react"

import { CartItem } from "@/components/cart/cart-item"
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
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { formatPrice } from "@/lib/format"

export function CartDrawer() {
  const { closeCart, isCartOpen, lines, setCartOpen, subtotal } = useCart()
  const listRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      if (!isCartOpen || !listRef.current || prefersReducedMotion()) return
      const targets = Array.from(listRef.current.querySelectorAll("[data-cart-line]"))
      if (!targets.length) return
      gsap.from(targets, {
        opacity: 0,
        y: 14,
        duration: 0.35,
        stagger: 0.06,
        ease: "power2.out",
      })
    },
    { scope: listRef, dependencies: [isCartOpen, lines.length] }
  )

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-[94vw] max-w-md border-l border-white/70 bg-ivory p-0">
        <SheetHeader className="border-b border-charcoal/10 p-5 text-left">
          <SheetTitle className="font-serif text-3xl">Panier Kër Venus</SheetTitle>
          <SheetDescription className="text-sm text-warm-gray">
            Vos pièces sélectionnées pour la maison.
          </SheetDescription>
        </SheetHeader>
        <div ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5">
          {lines.length === 0 ? (
            <div className="grid place-items-center rounded-[2rem] border border-dashed border-charcoal/15 bg-white/60 p-8 text-center">
              <AppIcon icon="solar:bag-4-linear" className="size-10 text-gold" />
              <h3 className="mt-4 font-serif text-2xl">Votre panier est vide.</h3>
              <p className="mt-2 text-sm text-warm-gray">
                Découvrez les nouveautés et composez une maison plus élégante.
              </p>
              <Button asChild className="mt-5 rounded-full bg-charcoal text-ivory">
                <Link to="/shop" onClick={closeCart}>
                  Explorer la boutique
                </Link>
              </Button>
            </div>
          ) : (
            lines.map((line) => (
              <div data-cart-line key={line.product.id}>
                <CartItem line={line} />
              </div>
            ))
          )}
        </div>
        <div className="border-t border-charcoal/10 bg-white/60 p-5">
          <div className="mb-4 flex items-center justify-between font-semibold">
            <span>Sous-total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" className="h-11 rounded-full border-charcoal/10">
              <Link to="/cart" onClick={closeCart}>
                Voir panier
              </Link>
            </Button>
            <Button asChild className="h-11 rounded-full bg-gold text-charcoal hover:bg-gold/85">
              <Link to="/checkout" onClick={closeCart}>
                Checkout
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
