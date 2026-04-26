import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ProductCard } from "@/components/product/product-card"
import { useFeaturedProducts } from "@/hooks/use-products"

export function ProductCarousel() {
  const { data: products = [], isLoading } = useFeaturedProducts()

  if (!isLoading && products.length === 0) {
    return null
  }

  return (
    <section className="mx-auto mt-16 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">sélection du moment</p>
        <h2 className="font-serif text-5xl leading-none">Premium picks</h2>
      </div>
      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <CarouselContent className="-ml-5">
          {isLoading
            ? Array.from({ length: 4 }).map((_, index) => (
                <CarouselItem
                  key={index}
                  className="flex basis-full pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <div className="h-[31rem] w-full animate-pulse rounded-[1.55rem] border border-white/75 bg-white/70 shadow-soft">
                    <div className="m-3 aspect-square rounded-[1.2rem] bg-cream" />
                    <div className="space-y-3 px-4 pt-2">
                      <div className="h-5 w-1/3 rounded-full bg-cream" />
                      <div className="h-8 w-2/3 rounded-full bg-cream" />
                      <div className="h-4 w-4/5 rounded-full bg-cream" />
                    </div>
                  </div>
                </CarouselItem>
              ))
            : products.map((product) => (
                <CarouselItem
                  key={product.id}
                  className="flex basis-full pl-5 sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
                >
                  <ProductCard product={product} />
                </CarouselItem>
              ))}
        </CarouselContent>
        <CarouselPrevious className="left-3 bg-white/90" />
        <CarouselNext className="right-3 bg-white/90" />
      </Carousel>
    </section>
  )
}
