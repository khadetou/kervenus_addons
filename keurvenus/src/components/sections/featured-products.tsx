import { ProductCard } from "@/components/product/product-card"
import { useFeaturedProducts } from "@/hooks/use-products"

export function FeaturedProducts() {
  const { data: products = [] } = useFeaturedProducts()

  return (
    <section className="mx-auto mt-16 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">best sellers</p>
          <h2 className="font-serif text-5xl leading-none">Produits populaires</h2>
          <p className="mt-3 max-w-2xl text-warm-gray">
            Une sélection directement synchronisée avec les produits publiés.
          </p>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
