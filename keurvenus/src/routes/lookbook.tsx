import { Link, createFileRoute } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { useLookbook } from "@/hooks/use-lookbook"
import { seoHead } from "@/lib/seo"

export const Route = createFileRoute("/lookbook")({
  head: () =>
    seoHead({
      title: "Lookbook maison | Kër Venus",
      description:
        "Inspirez vos ambiances maison avec le lookbook Kër Venus: idées de table, décoration, cuisine et art de vivre.",
      path: "/lookbook",
    }),
  component: LookbookPage,
})

function LookbookPage() {
  const { data: items = [] } = useLookbook()

  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-8 max-w-4xl">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">lookbook</p>
        <h1 className="mt-3 font-serif text-6xl leading-none md:text-8xl">
          Inspiration maison, mood par mood.
        </h1>
      </div>
      <div className="grid gap-6">
        {items.map((item, index) => (
          <section
            key={item.id}
            className="grid overflow-hidden rounded-[2rem] border border-white/75 bg-white/70 shadow-luxury lg:grid-cols-2"
          >
            <img
              src={item.image}
              alt={item.title}
              className={`h-full min-h-[430px] w-full object-cover ${index % 2 ? "lg:order-2" : ""}`}
              loading="lazy"
            />
            <div className="self-center p-8 md:p-12">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">{item.mood}</p>
              <h2 className="mt-4 font-serif text-5xl leading-none">{item.title}</h2>
              <p className="mt-5 text-lg leading-8 text-warm-gray">{item.subtitle}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {item.products.map((product) => (
                  <span key={product} className="rounded-full bg-cream px-4 py-2 text-sm">
                    {product}
                  </span>
                ))}
              </div>
              <Button asChild className="mt-8 h-12 rounded-full bg-charcoal px-6 text-ivory">
                <Link to="/shop">
                  Shopper le mood
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Link>
              </Button>
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
