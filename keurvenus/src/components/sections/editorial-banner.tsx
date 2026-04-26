import { Link } from "@tanstack/react-router"
import { useRef } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { useFeaturedProducts } from "@/hooks/use-products"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { landingEditorialImage } from "@/lib/landing-assets"

export function EditorialBanner() {
  const ref = useRef<HTMLElement>(null)
  const imageRef = useRef<HTMLDivElement>(null)
  const { data: products = [] } = useFeaturedProducts()
  const featuredProduct = products.find((product) => product.images[0])
  const image = landingEditorialImage.src || featuredProduct?.images[0]

  useGSAP(
    () => {
      if (!imageRef.current || prefersReducedMotion()) return
      gsap.to(imageRef.current, {
        yPercent: -5,
        ease: "none",
        scrollTrigger: undefined,
      })
    },
    { scope: ref }
  )

  return (
    <section
      ref={ref}
      className="mx-auto mt-16 grid w-[min(1560px,calc(100vw-32px))] overflow-hidden rounded-[2rem] border border-white/75 bg-charcoal text-ivory shadow-luxury lg:grid-cols-[0.95fr_1.05fr]"
    >
      <div className="p-8 md:p-12">
        <p className="text-xs uppercase tracking-[0.22em] text-champagne">édition maison</p>
        <h2 className="mt-5 font-serif text-5xl leading-none md:text-7xl">
          Offrez à votre intérieur une présence calme et précieuse.
        </h2>
        <p className="mt-6 max-w-xl text-ivory/75 leading-8">
          Pièces choisies pour celles et ceux qui aiment recevoir, créer une
          atmosphère et faire de la maison un espace de beauté quotidienne.
        </p>
        <Button
          asChild
          className="mt-8 h-12 rounded-full bg-gold px-6 text-charcoal hover:bg-gold/85"
        >
          {featuredProduct ? (
            <Link to="/shop/$slug" params={{ slug: featuredProduct.slug }}>
              Voir l’édition
              <AppIcon icon="solar:arrow-right-linear" className="size-4" />
            </Link>
          ) : (
            <Link to="/shop">
              Voir l’édition
              <AppIcon icon="solar:arrow-right-linear" className="size-4" />
            </Link>
          )}
        </Button>
      </div>
      <div
        ref={imageRef}
        className="min-h-[440px] bg-cream bg-cover bg-center"
        style={
          image
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(23,23,23,.04), rgba(23,23,23,.24)), url('${image}')`,
              }
            : undefined
        }
      >
        {featuredProduct ? (
          <div className="flex h-full min-h-[440px] items-end p-6">
            <Link
              to="/shop/$slug"
              params={{ slug: featuredProduct.slug }}
              className="rounded-full bg-charcoal/76 px-4 py-2 text-sm font-semibold text-ivory backdrop-blur transition hover:bg-charcoal"
            >
              {featuredProduct.name}
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
