import { Link, createFileRoute } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/lib/types"

export const Route = createFileRoute("/wishlist")({ component: WishlistPage })

function WishlistPage() {
  const { products, removeProduct } = useWishlist()
  const { addProduct } = useCart()
  const total = products.reduce((sum, product) => sum + product.price, 0)

  function addAllToCart() {
    products.forEach((product) => addProduct(product))
  }

  return (
    <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-luxury">
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-gold">
              sélection sauvegardée
            </p>
            <h1 className="mt-3 font-serif text-6xl leading-none">Vos favoris</h1>
            <p className="mt-3 max-w-2xl text-warm-gray">
              Retrouvez les pièces que vous aimez, comparez les matières et ajoutez vos
              coups de cœur au panier quand votre sélection est prête.
            </p>
          </div>
          <Badge className="w-fit rounded-full bg-charcoal px-4 py-2 text-ivory">
            {products.length} favori{products.length > 1 ? "s" : ""}
          </Badge>
        </div>

        <div className="mt-7 grid gap-4">
          {products.length ? (
            products.map((product) => (
              <WishlistLine
                key={product.id}
                onAddToCart={() => addProduct(product)}
                onRemove={() => removeProduct(product.id)}
                product={product}
              />
            ))
          ) : (
            <div className="rounded-[2rem] border border-dashed border-charcoal/15 bg-ivory p-8 text-center">
              <AppIcon icon="solar:heart-linear" className="mx-auto size-10 text-gold" />
              <p className="mt-4 font-serif text-3xl">Votre wishlist est encore vide.</p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-warm-gray">
                Ajoutez des produits aux favoris depuis la boutique pour les retrouver ici.
              </p>
              <Button asChild className="mt-5 rounded-full bg-charcoal text-ivory">
                <Link to="/shop">Découvrir la boutique</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      <aside className="h-max rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-luxury lg:sticky lg:top-36">
        <h2 className="font-serif text-4xl leading-none">Résumé</h2>
        <div className="mt-6 grid gap-4 text-sm">
          <div className="flex justify-between">
            <span className="text-warm-gray">Pièces sauvegardées</span>
            <span>{products.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-warm-gray">Valeur estimée</span>
            <span>{formatPrice(total)}</span>
          </div>
          <Separator />
          <div className="rounded-[1.25rem] bg-cream/70 p-4 text-sm leading-6 text-warm-gray">
            Les favoris sont sauvegardés sur cet appareil pour préparer votre sélection.
          </div>
        </div>

        <Button
          type="button"
          className="mt-6 h-12 w-full rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
          disabled={!products.length}
          onClick={addAllToCart}
        >
          Tout ajouter au panier
          <AppIcon icon="solar:bag-4-linear" className="size-4" />
        </Button>
        <Button
          asChild
          variant="outline"
          className="mt-3 h-12 w-full rounded-full border-charcoal/10 bg-white hover:bg-cream"
        >
          <Link to="/shop">
            Continuer la boutique
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </Link>
        </Button>
      </aside>
    </main>
  )
}

function WishlistLine({
  onAddToCart,
  onRemove,
  product,
}: {
  onAddToCart: () => void
  onRemove: () => void
  product: Product
}) {
  return (
    <article className="grid gap-4 rounded-3xl border border-charcoal/10 bg-white/70 p-3 sm:grid-cols-[132px_1fr]">
      <Link to="/shop/$slug" params={{ slug: product.slug }}>
        <img
          src={product.images[0]}
          alt={product.name}
          className="aspect-square w-full rounded-2xl object-cover sm:h-32"
          loading="lazy"
        />
      </Link>
      <div className="flex min-w-0 flex-col gap-4 py-1">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge
              variant="outline"
              className="rounded-full border-charcoal/10 bg-cream px-3 text-[11px]"
            >
              {product.collection}
            </Badge>
            <Link
              to="/shop/$slug"
              params={{ slug: product.slug }}
              className="mt-3 block font-serif text-3xl leading-none hover:text-gold"
            >
              {product.name}
            </Link>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-warm-gray">
              {product.shortDescription}
            </p>
          </div>
          <button
            type="button"
            onClick={onRemove}
            className="grid size-10 shrink-0 place-items-center rounded-full border border-charcoal/10 bg-white/70 text-warm-gray hover:bg-cream hover:text-charcoal"
            aria-label={`Retirer ${product.name} des favoris`}
          >
            <AppIcon icon="solar:close-circle-linear" className="size-5" />
          </button>
        </div>
        <div className="mt-auto flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <strong>{formatPrice(product.price, product.currency)}</strong>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-charcoal/10 bg-white px-4 hover:bg-cream"
              onClick={onRemove}
            >
              Retirer
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full bg-charcoal px-4 text-ivory hover:bg-charcoal/90"
              onClick={onAddToCart}
            >
              Ajouter au panier
              <AppIcon icon="solar:bag-4-linear" className="size-4" />
            </Button>
          </div>
        </div>
      </div>
    </article>
  )
}
