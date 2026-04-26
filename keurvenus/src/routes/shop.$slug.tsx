import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"

import { ProductGallery } from "@/components/product/product-gallery"
import { ProductInfo } from "@/components/product/product-info"
import { RelatedProducts } from "@/components/product/related-products"
import { Skeleton } from "@/components/ui/skeleton"
import { useProduct } from "@/hooks/use-product"

export const Route = createFileRoute("/shop/$slug")({ component: ProductPage })

function ProductPage() {
  const { slug } = Route.useParams()
  const { data: product, isError, isPending } = useProduct(slug)

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
  }, [slug])

  if (isPending) {
    return <ProductPageSkeleton />
  }

  if (isError || !product) {
    return (
      <main className="mx-auto mt-16 w-[min(1120px,calc(100vw-32px))] rounded-[2rem] bg-white/70 p-8 text-center">
        <h1 className="font-serif text-5xl">Produit introuvable</h1>
      </main>
    )
  }

  return (
    <main>
      <section className="mx-auto mt-10 grid w-[min(1640px,calc(100vw-32px))] items-start gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:gap-8">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </section>
      <RelatedProducts currentSlug={product.slug} collection={product.collection} />
    </main>
  )
}

function ProductPageSkeleton() {
  return (
    <main>
      <section
        aria-label="Chargement du produit"
        className="mx-auto mt-10 grid w-[min(1640px,calc(100vw-32px))] items-start gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] xl:gap-8"
      >
        <div className="rounded-[2rem] border border-white/80 bg-white/70 p-3 shadow-luxury backdrop-blur">
          <Skeleton className="aspect-[4/3] min-h-[520px] rounded-[1.55rem] bg-charcoal/10" />
          <div className="mt-4 flex gap-3 overflow-hidden rounded-[1.4rem] border border-charcoal/6 bg-white/65 p-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                className="size-20 shrink-0 rounded-2xl bg-charcoal/10"
              />
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/72 p-7 shadow-luxury backdrop-blur">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-6 w-28 rounded-full bg-charcoal/10" />
            <Skeleton className="size-11 rounded-full bg-charcoal/10" />
          </div>
          <Skeleton className="mt-10 h-4 w-44 rounded-full bg-gold/20" />
          <Skeleton className="mt-5 h-16 w-[88%] rounded-2xl bg-charcoal/10" />
          <Skeleton className="mt-3 h-16 w-[68%] rounded-2xl bg-charcoal/10" />
          <Skeleton className="mt-7 h-5 w-56 rounded-full bg-charcoal/10" />
          <div className="mt-8 flex items-end justify-between gap-5">
            <Skeleton className="h-7 w-40 rounded-full bg-charcoal/10" />
            <Skeleton className="h-12 w-44 rounded-full bg-charcoal/10" />
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-12 rounded-full bg-charcoal/10" />
            <Skeleton className="h-12 rounded-full bg-charcoal/10" />
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-24 rounded-[1.2rem] bg-charcoal/10"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
