import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { useFeaturedProducts } from "@/hooks/use-products"
import { useSiteContent } from "@/hooks/use-site-content"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { landingHeroImages } from "@/lib/landing-assets"

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const { data } = useSiteContent()
  const { data: featuredProducts = [] } = useFeaturedProducts()
  const heroSlides = useMemo(() => {
    const productSlides = featuredProducts
      .filter((product) => product.images[0])
      .slice(0, 3)
      .map((product, index) => ({
        eyebrow: product.collection || product.category,
        title: product.name,
        subtitle: product.description || product.shortDescription,
        image: landingHeroImages[index % landingHeroImages.length]?.src || product.images[0],
        mood: [product.material, product.color].filter(Boolean).join(" · ") || product.category,
        primary: "Voir le produit",
        secondary: product.category ? `Explorer ${product.category}` : "Voir la boutique",
        productSlug: product.slug,
        categorySlug: product.categorySlug,
        icon: categoryIcon(product.category),
        tags: [product.category, product.collection, product.material].filter(Boolean).slice(0, 3),
      }))

    const editorialSlides = [
      {
        eyebrow: "Art de la table",
        title: "Une table lumineuse, pensée pour recevoir.",
        subtitle:
          "Carafes, verres et pièces de service composent une sélection douce et raffinée pour les moments partagés.",
        image: landingHeroImages[1]?.src || "",
        mood: "Table · Verrerie · Réception",
        primary: "Explorer la boutique",
        secondary: "Voir les verres",
        productSlug: "",
        categorySlug: "verrerie-23",
        icon: "solar:wineglass-linear",
        tags: ["Verrerie", "Table", "Maison"],
      },
      {
        eyebrow: "Essentiels maison",
        title: "Des objets utiles, avec la grâce en plus.",
        subtitle:
          "Une mise en scène inspirée des produits Kër Venus pour sublimer la cuisine, la conservation et le quotidien.",
        image: landingHeroImages[2]?.src || "",
        mood: "Cuisine · Conservation · Naturel",
        primary: "Voir les nouveautés",
        secondary: "Explorer cuisine",
        productSlug: "",
        categorySlug: "cuisine-conservation-14",
        icon: "solar:box-linear",
        tags: ["Cuisine", "Rangement", "Essentiels"],
      },
    ]

    if (productSlides.length) return [...productSlides, ...editorialSlides].slice(0, 3)

    return [
      {
        eyebrow: "Collection Maison Élégante",
        title: data?.heroTitle || "Kër Venus",
        subtitle:
          data?.heroSubtitle ||
          "Découvrez une sélection raffinée pour sublimer chaque espace.",
        image: landingHeroImages[0]?.src || "",
        mood: "Maison · Table · Verrerie",
        primary: "Découvrir la boutique",
        secondary: "Voir les univers",
        productSlug: "",
        categorySlug: "",
        icon: "solar:home-2-linear",
        tags: ["Table", "Maison", "Verrerie"],
      },
    ]
  }, [data?.heroSubtitle, data?.heroTitle, featuredProducts])

  const animateSlide = useCallback(() => {
    const section = sectionRef.current
    if (!section || prefersReducedMotion()) return
    const active = section.querySelector<HTMLElement>(`[data-slide="${current}"]`)
    if (!active) return

    const image = active.querySelector("[data-hero-image]")
    const items = active.querySelectorAll("[data-hero-item]")

    gsap.fromTo(
      image,
      { scale: 1.035 },
      { scale: 1, duration: 1.45, ease: "power3.out" }
    )
    gsap.fromTo(
      items,
      { autoAlpha: 0, y: 28 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.82,
        stagger: 0.08,
        ease: "power3.out",
      }
    )
  }, [current])

  useEffect(() => {
    if (!api) return

    const sync = () => setCurrent(api.selectedScrollSnap())
    sync()
    api.on("select", sync)
    api.on("reInit", sync)

    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api])

  useEffect(() => {
    if (!api || prefersReducedMotion()) return
    const timer = window.setInterval(() => api.scrollNext(), 6800)
    return () => window.clearInterval(timer)
  }, [api])

  useGSAP(animateSlide, { scope: sectionRef, dependencies: [animateSlide] })

  return (
    <section
      ref={sectionRef}
      className="mx-auto mt-5 w-[min(1760px,calc(100vw-32px))] overflow-hidden rounded-[2.4rem] border border-white/70 bg-charcoal text-ivory shadow-luxury"
      aria-label="Keur Venus collections mises en avant"
    >
      <Carousel setApi={setApi} opts={{ align: "start", loop: true }}>
        <CarouselContent className="-ml-0">
          {heroSlides.map((slide, index) => (
            <CarouselItem key={`${slide.productSlug || slide.categorySlug || slide.eyebrow}-${index}`} data-slide={index} className="pl-0">
              <div className="relative grid min-h-[720px] overflow-hidden lg:min-h-[760px]">
                <div
                  data-hero-image
                  className="absolute inset-0 bg-charcoal bg-cover bg-center"
                  style={
                    slide.image ? { backgroundImage: `url('${slide.image}')` } : undefined
                  }
                />
                <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,.82),rgba(23,23,23,.46)_42%,rgba(23,23,23,.14)_78%),linear-gradient(180deg,rgba(23,23,23,.1),rgba(23,23,23,.55))]" />
                <div className="relative z-10 grid items-end gap-10 p-6 sm:p-8 md:p-12 lg:grid-cols-[minmax(0,0.95fr)_420px] lg:p-16 xl:grid-cols-[minmax(0,0.95fr)_480px] xl:p-20">
                  <div className="max-w-5xl pb-10 lg:pb-0">
                    <div
                      data-hero-item
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-2 text-xs uppercase tracking-[0.22em] text-ivory/88 backdrop-blur"
                    >
                      <AppIcon icon={slide.icon} className="size-4 text-champagne" />
                      {slide.eyebrow}
                    </div>
                    <h1
                      data-hero-item
                      className="mt-7 max-w-5xl font-serif text-5xl leading-[0.92] text-white sm:text-6xl md:text-7xl xl:text-8xl"
                    >
                      {slide.title}
                    </h1>
                    <p
                      data-hero-item
                      className="mt-6 max-w-3xl text-base leading-8 text-ivory/82 md:text-lg xl:text-xl"
                    >
                      {slide.subtitle}
                    </p>
                    <div data-hero-item className="mt-9 flex flex-col gap-3 sm:flex-row">
                      <Button
                        asChild
                        className="h-12 rounded-full bg-gold px-7 text-charcoal shadow-[0_16px_36px_rgba(185,154,91,0.26)] hover:bg-champagne"
                      >
                        {slide.productSlug ? (
                          <Link to="/shop/$slug" params={{ slug: slide.productSlug }}>
                            {slide.primary}
                            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                          </Link>
                        ) : (
                          <Link to="/shop">
                            {slide.primary}
                            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                          </Link>
                        )}
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="h-12 rounded-full border-white/30 bg-white/10 px-7 text-ivory backdrop-blur hover:bg-white/18"
                      >
                        {slide.categorySlug ? (
                          <Link to="/shop" search={{ category: slide.categorySlug }}>
                            {slide.secondary}
                          </Link>
                        ) : (
                          <Link to="/shop">{slide.secondary}</Link>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div
                    data-hero-item
                    className="hidden self-end rounded-[1.8rem] border border-white/18 bg-white/12 p-5 shadow-[0_20px_80px_rgba(0,0,0,.18)] backdrop-blur-xl lg:block"
                  >
                    <div className="flex items-center justify-between gap-5 border-b border-white/15 pb-5">
                      <span className="text-xs uppercase tracking-[0.22em] text-champagne">
                        Mood
                      </span>
                      <span className="text-sm text-ivory/70">
                        {String(index + 1).padStart(2, "0")} / {heroSlides.length}
                      </span>
                    </div>
                    <p className="mt-5 font-serif text-3xl leading-tight text-white">
                      {slide.mood}
                    </p>
                    <div className="mt-8 grid grid-cols-3 gap-3 text-center">
                      {slide.tags.map((label, tagIndex) => (
                        <div
                          key={`${label}-${tagIndex}`}
                          className="rounded-2xl border border-white/12 bg-white/10 px-3 py-4"
                        >
                          <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/58">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <div className="absolute bottom-6 right-6 z-20 hidden items-center gap-3 md:bottom-8 md:right-8 md:flex">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-11 rounded-full border-white/30 bg-white/12 text-white backdrop-blur hover:bg-white/22"
            onClick={() => api?.scrollPrev()}
            aria-label="Previous slide"
          >
            <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-11 rounded-full border-white/30 bg-white/12 text-white backdrop-blur hover:bg-white/22"
            onClick={() => api?.scrollNext()}
            aria-label="Next slide"
          >
            <AppIcon icon="solar:alt-arrow-right-linear" className="size-4" />
          </Button>
        </div>

        <div className="absolute bottom-7 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 md:bottom-10 md:left-12 md:translate-x-0">
          {heroSlides.map((slide, index) => (
            <button
              key={`${slide.productSlug || slide.categorySlug || slide.eyebrow}-${index}`}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all ${
                current === index ? "w-10 bg-champagne" : "w-5 bg-white/35 hover:bg-white/60"
              }`}
              aria-label={`Afficher ${slide.eyebrow}`}
              aria-current={current === index}
            />
          ))}
        </div>
      </Carousel>
    </section>
  )
}

function categoryIcon(name: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes("verre") || normalized.includes("verrerie")) return "solar:wineglass-linear"
  if (normalized.includes("conservation") || normalized.includes("isotherme")) return "solar:box-linear"
  if (normalized.includes("cuisine")) return "solar:chef-hat-minimalistic-linear"
  if (normalized.includes("maison")) return "solar:home-2-linear"
  return "solar:cup-hot-linear"
}
