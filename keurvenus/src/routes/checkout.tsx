import { createFileRoute } from "@tanstack/react-router"

import { OrderSummary } from "@/components/cart/order-summary"
import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const Route = createFileRoute("/checkout")({ component: CheckoutPage })

function CheckoutPage() {
  return (
    <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-luxury">
        <h1 className="font-serif text-6xl leading-none">Finaliser la commande</h1>
        <p className="mt-3 text-warm-gray">
          Renseignez vos informations pour une livraison soignée et une expérience premium jusqu’au dernier détail.
        </p>
        <form className="mt-7 grid gap-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="first-name" label="Prénom" />
            <Field id="last-name" label="Nom" />
            <Field id="email" label="E-mail" type="email" />
            <Field id="phone" label="Téléphone" />
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="address">Adresse de livraison</Label>
              <Textarea id="address" className="min-h-28 rounded-2xl border-charcoal/10 bg-ivory" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {["Mobile Money", "Carte bancaire", "Paiement à la livraison"].map((method) => (
              <button
                type="button"
                key={method}
                className="rounded-2xl border border-charcoal/10 bg-ivory p-4 text-left text-sm font-semibold transition hover:bg-white"
              >
                {method}
              </button>
            ))}
          </div>
          <Button className="h-12 rounded-full bg-charcoal px-6 text-ivory">
            Confirmer la commande
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </Button>
        </form>
      </section>
      <OrderSummary checkoutCta={false} />
    </main>
  )
}

function Field({
  id,
  label,
  type = "text",
}: {
  id: string
  label: string
  type?: string
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} className="h-12 rounded-2xl border-charcoal/10 bg-ivory" />
    </div>
  )
}
