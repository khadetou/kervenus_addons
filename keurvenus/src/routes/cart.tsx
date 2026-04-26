import { Link, createFileRoute } from "@tanstack/react-router"

import { CartItem } from "@/components/cart/cart-item"
import { OrderSummary } from "@/components/cart/order-summary"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"

export const Route = createFileRoute("/cart")({ component: CartPage })

function CartPage() {
  const { lines } = useCart()

  return (
    <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-luxury">
        <h1 className="font-serif text-6xl leading-none">Votre panier</h1>
        <p className="mt-3 text-warm-gray">
          Des pièces complémentaires pour prolonger l’expérience Kër Venus dans toute la maison.
        </p>
        <div className="mt-7 grid gap-4">
          {lines.length ? (
            lines.map((line) => <CartItem key={line.product.id} line={line} />)
          ) : (
            <div className="rounded-[2rem] border border-dashed border-charcoal/15 bg-ivory p-8 text-center">
              <p className="font-serif text-3xl">Votre panier est encore vide.</p>
              <Button asChild className="mt-5 rounded-full bg-charcoal text-ivory">
                <Link to="/shop">Découvrir la boutique</Link>
              </Button>
            </div>
          )}
        </div>
      </section>
      <OrderSummary />
    </main>
  )
}
