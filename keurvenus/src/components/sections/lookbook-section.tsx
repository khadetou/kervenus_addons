import { Link } from "@tanstack/react-router"
import { useMemo, useRef } from "react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useFeaturedProducts } from "@/hooks/use-products"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { landingHeroImages } from "@/lib/landing-assets"

export function LookbookSection() {
  const { data: products = [] } = useFeaturedProducts()
  const items = useMemo(
    () => {
      const productItems = products
        .filter((product) => product.images[0])
        .slice(0, 3)
        .map((product, index) => ({
          id: product.id,
          title: product.name,
          subtitle: product.shortDescription || product.description,
          image: landingHeroImages[index % landingHeroImages.length]?.src || product.images[0],
          mood: product.category,
          slug: product.slug,
        }))

      return [
        ...productItems,
        {
          id: "lookbook-table-signature",
          title: "Table signature",
          subtitle: "Une composition lumineuse autour de la verrerie et des pièces à recevoir.",
          image: landingHeroImages[1]?.src,
          mood: "Verrerie",
          slug: "",
        },
        {
          id: "lookbook-essentiels",
          title: "Essentiels du quotidien",
          subtitle: "Cuisine, conservation et textures naturelles dans un esprit maison calme.",
          image: landingHeroImages[2]?.src,
          mood: "Cuisine",
          slug: "",
        },
      ]
        .filter((item) => item.image)
        .slice(0, 3)
    },
    [products]
  )
  const ref = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      if (!ref.current || prefersReducedMotion()) return
      const targets = Array.from(ref.current.querySelectorAll("[data-lookbook]"))
      if (!targets.length) return
      gsap.from(targets, {
        opacity: 0,
        y: 24,
        duration: 0.6,
        stagger: 0.08,
        ease: "power2.out",
      })
    },
    { scope: ref }
  )

  if (!items.length) return null

  return (
    <section ref={ref} className="mx-auto mt-16 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">images produits</p>
        <h2 className="font-serif text-5xl leading-none">Ralentir. Recevoir. Ressentir.</h2>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <Card
            data-lookbook
            key={item.id}
            className="overflow-hidden rounded-[2rem] border-white/75 bg-white/70 p-0 shadow-soft"
          >
            <Link
              to={item.slug ? "/shop/$slug" : "/shop"}
              params={item.slug ? { slug: item.slug } : undefined}
              className="block"
            >
              <div
                className="relative min-h-[410px] bg-cover bg-center p-5 text-ivory"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(23,23,23,.08), rgba(23,23,23,.68)), url('${item.image}')`,
                }}
              >
                <Badge className="rounded-full bg-ivory/90 text-charcoal">{item.mood}</Badge>
                <div className="absolute inset-x-5 bottom-5">
                  <h3 className="font-serif text-4xl leading-none">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-ivory/82">{item.subtitle}</p>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  )
}
