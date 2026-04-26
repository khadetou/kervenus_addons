import { ProductCard } from "@/components/product/product-card"
import { useProducts } from "@/hooks/use-products"

export function RelatedProducts({
  currentSlug,
  collection,
}: {
  currentSlug: string
  collection: string
}) {
  const { data: products = [] } = useProducts()
  const related = products
    .filter((product) => product.slug !== currentSlug && product.collection === collection)
    .slice(0, 4)

  return (
    <section className="mx-auto mt-16 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">sélection</p>
          <h2 className="font-serif text-4xl md:text-5xl">Vous aimerez aussi</h2>
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {related.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
