import { Link } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/format"

export function OrderSummary({ checkoutCta = true }: { checkoutCta?: boolean }) {
  const { subtotal, itemCount } = useCart()
  const delivery = subtotal > 0 ? 2500 : 0
  const total = subtotal + delivery

  return (
    <aside className="rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-luxury">
      <h2 className="font-serif text-4xl leading-none">Résumé</h2>
      <div className="mt-6 grid gap-4 text-sm">
        <div className="flex justify-between">
          <span className="text-warm-gray">Articles</span>
          <span>{itemCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-gray">Sous-total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-warm-gray">Livraison locale</span>
          <span>{delivery ? formatPrice(delivery) : "À calculer"}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
      {checkoutCta && (
        <Button asChild className="mt-6 h-12 w-full rounded-full bg-charcoal text-ivory hover:bg-charcoal/90">
          <Link to="/checkout">
            Commander
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </Link>
        </Button>
      )}
      <div className="mt-6 grid gap-3 text-sm text-warm-gray">
        <p className="inline-flex items-center gap-2">
          <AppIcon icon="solar:gift-linear" className="size-5 text-gold" />
          Présentation soignée
        </p>
        <p className="inline-flex items-center gap-2">
          <AppIcon icon="solar:shield-check-linear" className="size-5 text-gold" />
          Paiement sécurisé
        </p>
      </div>
    </aside>
  )
}
