import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/format"
import type { CartLine } from "@/lib/types"

export function CartItem({ line }: { line: CartLine }) {
  const { decreaseQuantity, increaseQuantity, removeProduct } = useCart()

  return (
    <article className="grid grid-cols-[88px_1fr] gap-4 rounded-3xl border border-charcoal/10 bg-white/70 p-3">
      <img
        src={line.product.images[0]}
        alt={line.product.name}
        className="h-24 w-full rounded-2xl object-cover"
        loading="lazy"
      />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-xl leading-none">{line.product.name}</h3>
            <p className="mt-1 text-xs text-warm-gray">{line.product.shortDescription}</p>
          </div>
          <button
            type="button"
            onClick={() => removeProduct(line.product.id)}
            className="text-warm-gray hover:text-charcoal"
            aria-label={`Retirer ${line.product.name}`}
          >
            <AppIcon icon="solar:close-circle-linear" className="size-5" />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center rounded-full border border-charcoal/10 bg-ivory">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => decreaseQuantity(line.product.id)}
            >
              -
            </Button>
            <span className="w-8 text-center text-sm font-semibold">{line.quantity}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              onClick={() => increaseQuantity(line.product.id)}
            >
              +
            </Button>
          </div>
          <strong className="text-sm">{formatPrice(line.product.price * line.quantity)}</strong>
        </div>
      </div>
    </article>
  )
}
