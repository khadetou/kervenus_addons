import { Link } from "@tanstack/react-router"
import { useRef } from "react"

import { CartDrawer } from "@/components/cart/cart-drawer"
import { AppIcon } from "@/components/icons/icon"
import { DesktopNavigation } from "@/components/layout/desktop-navigation"
import { MobileDrawer } from "@/components/layout/mobile-drawer"
import { SearchDialog } from "@/components/layout/search-dialog"
import { UserPortalDropdown } from "@/components/layout/user-portal-dropdown"
import { WishlistDrawer } from "@/components/wishlist/wishlist-drawer"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"

export function SiteHeader() {
  const headerRef = useRef<HTMLElement>(null)
  const { itemCount, openCart } = useCart()
  const { count: wishlistCount, openWishlist } = useWishlist()

  useGSAP(
    () => {
      if (!headerRef.current || prefersReducedMotion()) return
      gsap.from(headerRef.current, {
        y: -18,
        opacity: 0,
        duration: 0.65,
        ease: "power3.out",
      })
    },
    { scope: headerRef }
  )

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-3 z-40 mx-auto mt-3 w-[min(1760px,calc(100vw-24px))] rounded-[1.8rem] border border-white/80 bg-ivory/86 px-3 py-3 shadow-[0_22px_70px_rgba(38,29,20,0.12)] backdrop-blur-2xl md:px-4 lg:px-5"
      >
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/45 to-transparent" />
        <div className="hidden items-center justify-between border-b border-charcoal/7 pb-2.5 text-[10px] uppercase tracking-[0.24em] text-warm-gray xl:flex">
          <div className="flex items-center gap-6">
            <span className="inline-flex items-center gap-2">
              <AppIcon icon="solar:map-point-linear" className="size-4 text-gold" />
              Livraison disponible à Dakar
            </span>
            <span className="inline-flex items-center gap-2">
              <AppIcon icon="solar:leaf-linear" className="size-4 text-gold" />
              Sélection maison raffinée
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/about" className="transition hover:text-charcoal">
              L’esprit Keur Venus
            </Link>
            <Link to="/contact" className="transition hover:text-charcoal">
              Conseil personnalisé
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 xl:pt-3">
          <Link
            to="/"
            className="group flex min-w-0 items-center rounded-full"
            aria-label="Keur Venus accueil"
          >
            <img src="/LOGO.svg" alt="Keur Venus" className="h-auto w-36 md:w-44 xl:w-48" />
          </Link>
          <DesktopNavigation />
          <div className="flex items-center justify-end gap-2">
            <SearchDialog />
            <SearchDialog variant="icon" className="md:hidden" />
            <Button
              type="button"
              onClick={openWishlist}
              variant="outline"
              size="icon-lg"
              className="relative rounded-full border-charcoal/10 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white md:hidden"
              aria-label="Ouvrir les favoris"
            >
              <AppIcon icon="solar:heart-linear" className="size-5" />
              {wishlistCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-charcoal">
                  {wishlistCount}
                </span>
              )}
            </Button>
            <div className="hidden items-center gap-1 rounded-full border border-charcoal/8 bg-white/54 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] md:flex">
              <UserPortalDropdown />
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="relative rounded-full text-charcoal transition hover:-translate-y-0.5 hover:bg-white hover:text-gold"
                aria-label="Favoris"
                onClick={openWishlist}
              >
                <AppIcon icon="solar:heart-linear" className="size-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-charcoal">
                    {wishlistCount}
                  </span>
                )}
              </Button>
              <Button
                type="button"
                onClick={openCart}
                variant="ghost"
                size="icon-lg"
                className="relative rounded-full text-charcoal transition hover:-translate-y-0.5 hover:bg-charcoal hover:text-ivory"
                aria-label="Ouvrir le panier"
              >
                <AppIcon icon="solar:bag-4-linear" className="size-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-charcoal">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
            <Button
              type="button"
              onClick={openCart}
              variant="outline"
              size="icon-lg"
              className="relative rounded-full border-charcoal/10 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white md:hidden"
              aria-label="Ouvrir le panier"
            >
              <AppIcon icon="solar:bag-4-linear" className="size-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-gold text-[11px] font-bold text-charcoal">
                  {itemCount}
                </span>
              )}
            </Button>
            <MobileDrawer />
          </div>
        </div>
      </header>
      <CartDrawer />
      <WishlistDrawer />
    </>
  )
}
