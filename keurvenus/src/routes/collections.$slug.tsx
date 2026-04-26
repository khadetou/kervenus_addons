import { createFileRoute } from "@tanstack/react-router"

import { ProductCard } from "@/components/product/product-card"
import { useCollection } from "@/hooks/use-collections"
import { useProducts } from "@/hooks/use-products"
import { categoryImageFor, categoryImagePosition } from "@/lib/category-media"

export const Route = createFileRoute("/collections/$slug")({
  component: CollectionPage,
})

function CollectionPage() {
  const { slug } = Route.useParams()
  const { data: collection } = useCollection(slug)
  const { data: products = [] } = useProducts({
    category: collection?.slug,
    pageSize: 96,
  })

  if (!collection) {
    return <main className="p-10">Collection introuvable.</main>
  }

  const heroImage = categoryImageFor(collection.name, collection.slug, collection.image)

  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <section
        className="relative grid min-h-[430px] overflow-hidden rounded-[2rem] bg-charcoal p-6 text-ivory shadow-luxury sm:p-8 lg:min-h-[500px] lg:p-10"
        style={{
          backgroundImage: `url('${heroImage}')`,
          backgroundPosition: categoryImagePosition(collection.name, collection.slug),
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,.78),rgba(23,23,23,.38)_48%,rgba(23,23,23,.12)),linear-gradient(180deg,rgba(23,23,23,.04),rgba(23,23,23,.52))]" />
        <div className="relative z-10 mt-auto max-w-3xl">
          <p className="text-xs uppercase tracking-[0.22em] text-champagne">Boutique</p>
          <h1 className="mt-3 font-serif text-5xl leading-none sm:text-6xl lg:text-7xl">
            {collection.name}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/82 sm:text-base">
            {collection.description}
          </p>
        </div>
      </section>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  )
}
