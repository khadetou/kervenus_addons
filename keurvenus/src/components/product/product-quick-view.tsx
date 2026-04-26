import { Link } from "@tanstack/react-router"
import { useCallback, useEffect, useRef, useState } from "react"
import { TransformComponent, TransformWrapper } from "react-zoom-pan-pinch"

import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

export function ProductQuickView({ product }: { product: Product }) {
  const [open, setOpen] = useState(false)
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])
  const { addProduct, openCart } = useCart()
  const { isFavorite, toggleProduct } = useWishlist()

  const images = product.images.length ? product.images : [""]
  const selectedImage = images[selectedIndex] ?? images[0]
  const favorite = isFavorite(product.id)

  const scrollToImage = useCallback(
    (index: number) => {
      setSelectedIndex(index)
      api?.scrollTo(index)
      thumbnailRefs.current[index]?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      })
    },
    [api]
  )

  const scrollPrev = useCallback(() => {
    const nextIndex = selectedIndex === 0 ? images.length - 1 : selectedIndex - 1
    scrollToImage(nextIndex)
  }, [images.length, scrollToImage, selectedIndex])

  const scrollNext = useCallback(() => {
    const nextIndex = selectedIndex === images.length - 1 ? 0 : selectedIndex + 1
    scrollToImage(nextIndex)
  }, [images.length, scrollToImage, selectedIndex])

  useEffect(() => {
    if (!api) return

    const sync = () => {
      const index = api.selectedScrollSnap()
      setSelectedIndex(index)
      thumbnailRefs.current[index]?.scrollIntoView({
        behavior: prefersReducedMotion() ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      })
    }

    sync()
    api.on("select", sync)
    api.on("reInit", sync)

    return () => {
      api.off("select", sync)
      api.off("reInit", sync)
    }
  }, [api])

  useGSAP(
    () => {
      if (!open || !contentRef.current || prefersReducedMotion()) return
      gsap.fromTo(
        contentRef.current.querySelectorAll("[data-quick-view]"),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.5, stagger: 0.055, ease: "power3.out" }
      )
    },
    { scope: contentRef, dependencies: [open, selectedIndex] }
  )

  function handleAddToCart() {
    addProduct(product)
    openCart()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-full border-charcoal/10 bg-white text-charcoal hover:border-gold/25 hover:bg-cream"
        >
          <AppIcon icon="solar:magnifer-linear" className="size-4" />
          Aperçu
        </Button>
      </DialogTrigger>
      <DialogContent
        ref={contentRef}
        showCloseButton={false}
        className="max-h-[calc(100vh-2rem)] w-[min(1120px,calc(100vw-24px))] overflow-hidden rounded-[2rem] border border-white/85 bg-ivory p-0 shadow-[0_30px_100px_rgba(22,16,12,.24)] sm:max-w-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
          <DialogDescription>{product.shortDescription}</DialogDescription>
        </DialogHeader>

        <div className="grid max-h-[calc(100vh-2rem)] overflow-y-auto lg:grid-cols-[1.04fr_0.96fr]">
          <div className="relative bg-cream p-3 md:p-4 lg:min-h-[420px]">
            <div data-quick-view className="lg:sticky lg:top-3">
              <div className="relative overflow-hidden rounded-[1.65rem] bg-white shadow-soft">
                <Carousel setApi={setApi} opts={{ align: "start", loop: images.length > 1 }}>
                  <CarouselContent className="-ml-0">
                    {images.map((image, index) => (
                      <CarouselItem key={`${image}-quick-${index}`} className="pl-0">
                        <button
                          type="button"
                          className="group relative block w-full cursor-zoom-in overflow-hidden text-left"
                          aria-hidden={selectedIndex !== index}
                          aria-label={
                            selectedIndex === index
                              ? `Agrandir ${product.name}, image ${index + 1}`
                              : undefined
                          }
                          data-current={selectedIndex === index}
                          tabIndex={selectedIndex === index ? 0 : -1}
                          onClick={() => {
                            setSelectedIndex(index)
                            setZoomOpen(true)
                          }}
                        >
                          <img
                            src={image}
                            alt={`${product.name} image ${index + 1}`}
                            className="aspect-square h-full w-full object-cover transition duration-700 group-hover:scale-[1.025] md:aspect-[5/6] lg:aspect-[4/5]"
                          />
                          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                            {product.badges.map((badge) => (
                              <Badge
                                key={badge}
                                className="rounded-full bg-ivory/92 text-charcoal"
                              >
                                {badge}
                              </Badge>
                            ))}
                          </div>
                          <span className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-charcoal/72 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory backdrop-blur transition group-hover:bg-charcoal">
                            <AppIcon icon="solar:magnifer-zoom-in-linear" className="size-4" />
                            Zoom
                          </span>
                        </button>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto rounded-[1.35rem] border border-white/70 bg-white/45 p-2 shadow-soft [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {images.map((image, index) => (
                  <button
                    key={`${image}-${index}`}
                    ref={(node) => {
                      thumbnailRefs.current[index] = node
                    }}
                    type="button"
                    onClick={() => scrollToImage(index)}
                    className={cn(
                      "relative size-20 shrink-0 overflow-hidden rounded-[1rem] border bg-white p-1 transition md:size-24",
                      selectedIndex === index
                        ? "border-gold shadow-soft"
                        : "border-white/80 opacity-65 hover:border-gold/35 hover:opacity-100"
                    )}
                    aria-label={`Voir l’image ${index + 1} de ${product.name}`}
                    aria-current={selectedIndex === index}
                  >
                    <img src={image} alt="" className="aspect-square w-full rounded-xl object-cover" />
                    <span
                      className={cn(
                        "absolute inset-x-3 bottom-2 h-0.5 rounded-full bg-gold transition",
                        selectedIndex === index ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative p-5 pt-7 md:p-8 lg:p-10">
            <DialogClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-4 top-4 rounded-full text-warm-gray hover:bg-white"
                aria-label="Fermer l’aperçu"
              >
                <AppIcon icon="solar:close-circle-linear" className="size-5" />
              </Button>
            </DialogClose>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className={cn(
                "absolute right-16 top-4 rounded-full transition hover:bg-white",
                favorite ? "bg-gold text-charcoal" : "text-warm-gray"
              )}
              onClick={() => toggleProduct(product)}
              aria-pressed={favorite}
              aria-label={
                favorite
                  ? `Retirer ${product.name} des favoris`
                  : `Ajouter ${product.name} aux favoris`
              }
            >
              <AppIcon icon="solar:heart-linear" className="size-5" />
            </Button>

            <div data-quick-view className="pr-10">
              <p className="text-xs uppercase tracking-[0.22em] text-gold">
                {product.category} · {product.collection}
              </p>
              <h3 className="mt-4 font-serif text-4xl leading-[0.95] text-charcoal md:text-6xl">
                {product.name}
              </h3>
              <p className="mt-5 max-w-xl text-base leading-8 text-warm-gray">
                {product.description}
              </p>
            </div>

            <div data-quick-view className="mt-7 flex flex-wrap items-end gap-3">
              <p className="text-3xl font-semibold text-charcoal">
                {formatPrice(product.price, product.currency)}
              </p>
              {product.compareAtPrice ? (
                <p className="pb-1 text-base text-warm-gray line-through">
                  {formatPrice(product.compareAtPrice, product.currency)}
                </p>
              ) : null}
            </div>

            <div data-quick-view className="mt-7 grid gap-3 sm:grid-cols-3">
              <ProductFact label="Matière" value={product.material} icon="solar:leaf-linear" />
              <ProductFact label="Couleur" value={product.color} icon="solar:palette-round-linear" />
              <ProductFact
                label="Stock"
                value={product.inStock ? "Disponible" : "Sur commande"}
                icon="solar:check-circle-linear"
              />
            </div>

            <div data-quick-view className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Button
                className="h-12 rounded-full bg-charcoal px-7 text-ivory hover:bg-charcoal/90"
                onClick={handleAddToCart}
              >
                Ajouter au panier
                <AppIcon icon="solar:bag-4-linear" className="size-4" />
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-charcoal/10 bg-white px-6 hover:border-gold/30 hover:bg-cream"
              >
                <Link to="/shop/$slug" params={{ slug: product.slug }}>
                  Voir la fiche
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Link>
              </Button>
            </div>

            <Tabs data-quick-view defaultValue="details" className="mt-8">
              <TabsList className="grid h-auto w-full grid-cols-3 rounded-full bg-white/72 p-1">
                <TabsTrigger value="details" className="rounded-full">
                  Détails
                </TabsTrigger>
                <TabsTrigger value="care" className="rounded-full">
                  Entretien
                </TabsTrigger>
                <TabsTrigger value="delivery" className="rounded-full">
                  Livraison
                </TabsTrigger>
              </TabsList>
              <TabsContent
                value="details"
                className="mt-3 rounded-[1.35rem] border border-charcoal/5 bg-white/70 p-5 text-sm leading-7 text-warm-gray"
              >
                {product.shortDescription}
                {product.dimensions ? ` · Dimensions: ${product.dimensions}` : ""}
              </TabsContent>
              <TabsContent
                value="care"
                className="mt-3 rounded-[1.35rem] border border-charcoal/5 bg-white/70 p-5 text-sm leading-7 text-warm-gray"
              >
                {product.material}. Nettoyer avec un chiffon doux et éviter les produits
                abrasifs pour préserver la finition.
              </TabsContent>
              <TabsContent
                value="delivery"
                className="mt-3 rounded-[1.35rem] border border-charcoal/5 bg-white/70 p-5 text-sm leading-7 text-warm-gray"
              >
                Livraison disponible à Dakar avec confirmation personnalisée avant
                expédition.
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {zoomOpen ? (
          <QuickZoomOverlay
            alt={`${product.name} image ${selectedIndex + 1}`}
            image={selectedImage}
            onClose={() => setZoomOpen(false)}
            onNext={scrollNext}
            onPrev={scrollPrev}
            showNavigation={images.length > 1}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function QuickZoomOverlay({
  alt,
  image,
  onClose,
  onNext,
  onPrev,
  showNavigation,
}: {
  alt: string
  image: string
  onClose: () => void
  onNext: () => void
  onPrev: () => void
  showNavigation: boolean
}) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center overflow-hidden rounded-[2rem] bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.64),transparent_30%),radial-gradient(circle_at_80%_80%,rgba(185,154,91,0.22),transparent_36%),rgba(250,247,242,0.55)] backdrop-blur-2xl">
      <TransformWrapper initialScale={1} minScale={1} maxScale={4} centerOnInit>
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-full !w-full">
              <div className="flex h-full w-full items-center justify-center p-4 md:p-8">
                <div className="rounded-[2rem] border border-white/45 bg-white/22 p-2 shadow-[0_30px_110px_rgba(38,29,20,0.2)] backdrop-blur-xl md:p-3">
                  <img
                    src={image}
                    alt={alt}
                    className="max-h-[78vh] max-w-[86vw] rounded-[1.5rem] object-contain lg:max-w-[940px]"
                  />
                </div>
              </div>
            </TransformComponent>

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/45 bg-white/34 p-1.5 text-charcoal shadow-soft backdrop-blur-xl">
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="rounded-full text-charcoal hover:bg-white/45 hover:text-charcoal"
                onClick={() => zoomOut()}
                aria-label="Zoom arrière"
              >
                <AppIcon icon="solar:magnifer-zoom-out-linear" className="size-5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-9 rounded-full px-4 text-charcoal hover:bg-white/45 hover:text-charcoal"
                onClick={() => resetTransform()}
              >
                Réinitialiser
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-lg"
                className="rounded-full text-charcoal hover:bg-white/45 hover:text-charcoal"
                onClick={() => zoomIn()}
                aria-label="Zoom avant"
              >
                <AppIcon icon="solar:magnifer-zoom-in-linear" className="size-5" />
              </Button>
            </div>
          </>
        )}
      </TransformWrapper>

      {showNavigation ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="absolute left-4 top-1/2 size-11 -translate-y-1/2 rounded-full border border-white/45 bg-white/34 text-charcoal shadow-soft backdrop-blur-xl hover:bg-white/50 hover:text-charcoal"
            onClick={onPrev}
            aria-label="Image précédente"
          >
            <AppIcon icon="solar:alt-arrow-left-linear" className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="absolute right-4 top-1/2 size-11 -translate-y-1/2 rounded-full border border-white/45 bg-white/34 text-charcoal shadow-soft backdrop-blur-xl hover:bg-white/50 hover:text-charcoal"
            onClick={onNext}
            aria-label="Image suivante"
          >
            <AppIcon icon="solar:alt-arrow-right-linear" className="size-5" />
          </Button>
        </>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        className="absolute right-5 top-5 h-10 rounded-full border border-white/45 bg-white/34 px-4 text-charcoal shadow-soft backdrop-blur-xl hover:bg-white/50 hover:text-charcoal"
        onClick={onClose}
      >
        Fermer
      </Button>
    </div>
  )
}

function ProductFact({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
  return (
    <div className="rounded-[1.2rem] border border-charcoal/5 bg-white/70 p-4">
      <AppIcon icon={icon} className="size-5 text-gold" />
      <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-warm-gray">{label}</p>
      <p className="mt-1 line-clamp-1 text-sm font-semibold text-charcoal">{value}</p>
    </div>
  )
}
