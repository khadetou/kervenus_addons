import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { formatPrice } from "@/lib/format"
import type { CartLine } from "@/lib/types"

export function CartItem({ line }: { line: CartLine }) {
  const { decreaseQuantity, increaseQuantity, removeProduct } = useCart()

  return (
    <article className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 rounded-[1.5rem] border border-charcoal/10 bg-white/80 p-2.5 shadow-[0_18px_45px_rgba(23,23,23,0.06)] sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-4 sm:rounded-3xl sm:p-3">
      <img
        src={line.product.images[0]}
        alt={line.product.name}
        className="h-20 w-full rounded-[1.15rem] bg-ivory object-contain p-1 sm:h-24 sm:rounded-2xl"
        loading="lazy"
      />
      <div className="min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="line-clamp-1 font-serif text-lg leading-none sm:text-xl">
              {line.product.name}
            </h3>
            <p className="mt-1 line-clamp-1 text-xs text-warm-gray">
              {line.product.shortDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={() => removeProduct(line.product.id)}
            className="shrink-0 text-warm-gray hover:text-charcoal"
            aria-label={`Retirer ${line.product.name}`}
          >
            <AppIcon icon="solar:close-circle-linear" className="size-5" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 sm:mt-4 sm:gap-3">
          <div className="flex shrink-0 items-center rounded-full border border-charcoal/10 bg-ivory">
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
          <strong className="ml-auto min-w-fit text-right text-[13px] sm:text-sm">
            {formatPrice(line.product.price * line.quantity)}
          </strong>
        </div>
      </div>
    </article>
  )
}
