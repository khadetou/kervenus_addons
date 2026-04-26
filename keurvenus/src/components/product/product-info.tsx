import { useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { ProductTabs } from "@/components/product/product-tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useCart } from "@/hooks/use-cart"
import { usePublishProduct } from "@/hooks/use-products"
import { useSession } from "@/hooks/use-session"
import { useWishlist } from "@/hooks/use-wishlist"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

export function ProductInfo({ product }: { product: Product }) {
  const { addProduct } = useCart()
  const { data: session } = useSession()
  const publishProduct = usePublishProduct()
  const { isFavorite, toggleProduct } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const favorite = isFavorite(product.id)
  const isInternalUser = Boolean(session?.is_internal_user || session?.user?.is_internal_user)
  const isUnpublished = product.isPublished === false

  function decreaseQuantity() {
    setQuantity((current) => Math.max(1, current - 1))
  }

  function increaseQuantity() {
    setQuantity((current) => current + 1)
  }

  return (
    <div className="rounded-[2rem] border border-white/75 bg-white/72 p-5 shadow-luxury md:p-7 xl:p-8">
      {isInternalUser ? (
        <div className="mb-5 overflow-hidden rounded-[1.15rem] border border-white/10 bg-charcoal text-ivory shadow-soft">
          <div className="flex flex-col gap-2 p-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  isUnpublished ? "bg-amber-400/18 text-amber-200" : "bg-emerald-400/18 text-emerald-200"
                )}
              >
                <AppIcon
                  icon={isUnpublished ? "solar:eye-closed-linear" : "solar:eye-linear"}
                  className="size-4"
                />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-champagne">
                  Mode edition
                </p>
                <p className="truncate text-xs text-ivory/72 sm:max-w-[340px]">
                  {isUnpublished
                    ? "Visible en aperçu interne, non publié."
                    : "Produit publié sur la boutique."}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
              {product.odooEditUrl ? (
                <Button
                  asChild
                  type="button"
                  className="h-9 rounded-full bg-white/10 px-4 text-xs text-ivory hover:bg-white/16"
                >
                  <a href={product.odooEditUrl} target="_top">
                    <AppIcon icon="solar:widget-add-linear" className="size-4" />
                    Backoffice
                  </a>
                </Button>
              ) : null}
              <Button
                type="button"
                className={cn(
                  "h-9 rounded-full px-4 text-xs",
                  isUnpublished
                    ? "bg-ivory text-charcoal hover:bg-white"
                    : "bg-white/10 text-ivory hover:bg-white/16"
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
                  className="size-4"
                />
                {isUnpublished ? "Publier" : "Masquer"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {isUnpublished ? (
            <Badge className="rounded-full bg-charcoal text-ivory">
              Non publié
            </Badge>
          ) : null}
          {product.badges.map((badge) => (
            <Badge key={badge} className="rounded-full bg-gold/15 text-charcoal">
              {badge}
            </Badge>
          ))}
        </div>
        <button
          type="button"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border transition hover:-translate-y-0.5",
            favorite
              ? "border-gold/40 bg-gold text-charcoal shadow-soft"
              : "border-charcoal/10 bg-white/70 text-warm-gray hover:bg-white hover:text-gold"
          )}
          onClick={() => toggleProduct(product)}
          aria-pressed={favorite}
          aria-label={
            favorite
              ? `Retirer ${product.name} des favoris`
              : `Ajouter ${product.name} aux favoris`
          }
        >
          <AppIcon icon="solar:heart-linear" className="size-5" />
        </button>
      </div>
      <p className="mt-6 text-xs uppercase tracking-[0.24em] text-gold">
        {product.category} · {product.collection}
      </p>
      <h1 className="mt-3 max-w-3xl break-words font-serif text-[clamp(2.8rem,4.6vw,4.7rem)] leading-[0.95]">
        {product.name}
      </h1>
      <p className="mt-3 text-lg font-medium text-warm-gray">
        {product.shortDescription}
      </p>
      <p className="mt-5 max-w-2xl text-base leading-8 text-warm-gray">
        {product.description}
      </p>

      <div className="mt-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="flex items-center gap-2 text-sm text-warm-gray">
          <AppIcon icon="solar:star-bold" className="size-4 text-gold" />
          <span>4.9</span>
          <span>· 0 avis</span>
          <span>· {product.inStock ? "Disponible" : "Sur commande"}</span>
        </div>
        <div className="flex flex-wrap items-end gap-3 xl:text-right">
          <p className="text-3xl font-semibold xl:text-4xl">
            {formatPrice(product.price, product.currency)}
          </p>
        {product.compareAtPrice && (
            <p className="pb-1 text-lg text-warm-gray line-through">
              {formatPrice(product.compareAtPrice, product.currency)}
            </p>
        )}
        </div>
      </div>

      <div className="mt-8 inline-flex h-12 items-center gap-2 rounded-full border border-charcoal/10 bg-white/82 p-1 shadow-soft">
        <Button
          type="button"
          variant="ghost"
          className="grid size-10 place-items-center rounded-full border border-charcoal/10 bg-white p-0 text-xl font-light leading-none text-warm-gray hover:bg-cream hover:text-charcoal disabled:opacity-45"
          onClick={decreaseQuantity}
          disabled={quantity === 1}
          aria-label="Diminuer la quantité"
        >
          <span aria-hidden="true">−</span>
        </Button>
        <span className="min-w-7 text-center text-base font-medium text-charcoal" aria-live="polite">
          {quantity}
        </span>
        <Button
          type="button"
          variant="ghost"
          className="grid size-10 place-items-center rounded-full border border-charcoal/10 bg-white p-0 text-xl font-light leading-none text-warm-gray hover:bg-cream hover:text-charcoal"
          onClick={increaseQuantity}
          aria-label="Augmenter la quantité"
        >
          <span aria-hidden="true">+</span>
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <Button
          className="h-12 rounded-full bg-charcoal px-8 text-ivory hover:bg-charcoal/90"
          onClick={() => addProduct(product, quantity)}
        >
          Ajouter au panier
          <AppIcon icon="solar:bag-4-linear" className="size-4" />
        </Button>
        <Button
          variant="outline"
          className="h-12 rounded-full border-charcoal/10 bg-white px-8 hover:border-gold/30 hover:bg-cream"
        >
          Acheter maintenant
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <ProductFact label="Matière" value={product.material} icon="solar:leaf-linear" />
        <ProductFact label="Couleur" value={product.color} icon="solar:palette-round-linear" />
        <ProductFact
          label="Stock"
          value={product.inStock ? "Disponible" : "Sur commande"}
          icon="solar:check-circle-linear"
        />
      </div>

      <div className="mt-6 grid gap-3">
        <ProductBenefit
          title="Livraison premium"
          description="Livraison rapide à Dakar et options de retrait selon disponibilité."
          icon="solar:box-linear"
        />
        <ProductBenefit
          title="Paiement sécurisé"
          description="Commande sécurisée et accompagnement client pour chaque achat."
          icon="solar:shield-check-linear"
        />
        <ProductBenefit
          title="Sélection Kër Venus"
          description="Pièce choisie pour sa matière, sa présence visuelle et sa longévité."
          icon="solar:magic-stick-3-linear"
        />
      </div>

      <ProductTabs product={product} />
    </div>
  )
}

function ProductFact({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div className="rounded-[1.2rem] border border-charcoal/5 bg-white/70 p-4">
      <AppIcon icon={icon} className="size-5 text-gold" />
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-warm-gray">{label}</p>
      <p className="mt-1 line-clamp-1 text-sm font-semibold text-charcoal">{value}</p>
    </div>
  )
}

function ProductBenefit({
  description,
  icon,
  title,
}: {
  description: string
  icon: string
  title: string
}) {
  return (
    <div className="flex gap-4 rounded-[1.2rem] border border-gold/10 bg-cream/70 p-4">
      <AppIcon icon={icon} className="mt-0.5 size-5 shrink-0 text-gold" />
      <div>
        <p className="font-semibold text-charcoal">{title}</p>
        <p className="mt-1 text-sm leading-6 text-warm-gray">{description}</p>
      </div>
    </div>
  )
}
