import { createFileRoute } from "@tanstack/react-router"

import { ProductCard } from "@/components/product/product-card"
import { useCollection } from "@/hooks/use-collections"
import { useProducts } from "@/hooks/use-products"

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

  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <section
        className="grid min-h-[460px] content-end rounded-[2rem] bg-cover bg-center p-8 text-ivory shadow-luxury"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(23,23,23,.72), rgba(23,23,23,.16)), url('${collection.image}')`,
        }}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-champagne">collection</p>
        <h1 className="mt-3 max-w-3xl font-serif text-6xl leading-none">
          {collection.name}
        </h1>
        <p className="mt-4 max-w-2xl text-ivory/80">{collection.description}</p>
      </section>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </main>
  )
}
