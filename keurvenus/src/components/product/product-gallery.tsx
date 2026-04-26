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
  DialogTitle,
} from "@/components/ui/dialog"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

type ImageLayout = "landscape" | "portrait" | "square"

export function ProductGallery({ product }: { product: Product }) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [imageLayouts, setImageLayouts] = useState<Record<string, ImageLayout>>({})
  const scopeRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])
  const images = product.images.length ? product.images : [""]

  const selectedImage = images[selectedIndex] ?? images[0]
  const imageKey = images.join("|")

  const rememberImageLayout = useCallback((src: string, image: HTMLImageElement) => {
    if (!src || imageLayouts[src]) return
    const ratio = image.naturalWidth / Math.max(image.naturalHeight, 1)
    const layout = ratio > 1.12 ? "landscape" : ratio < 0.88 ? "portrait" : "square"
    setImageLayouts((current) => ({ ...current, [src]: layout }))
  }, [imageLayouts])

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

  useEffect(() => {
    setSelectedIndex(0)
    api?.scrollTo(0)
  }, [api, imageKey, product.variantId])

  useGSAP(
    () => {
      if (!scopeRef.current || prefersReducedMotion()) return
      gsap.fromTo(
        scopeRef.current.querySelectorAll("[data-gallery-reveal]"),
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.06, ease: "power3.out" }
      )
    },
    { scope: scopeRef }
  )

  return (
    <div ref={scopeRef} className="grid gap-3 lg:sticky lg:top-32 lg:self-start">
      <div
        data-gallery-reveal
        className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/74 p-2 shadow-luxury backdrop-blur"
      >
        <Carousel setApi={setApi} opts={{ align: "start", loop: images.length > 1 }}>
          <CarouselContent className="-ml-0">
            {images.map((src, index) => (
              <CarouselItem key={`${src}-${index}`} className="pl-0">
                <button
                  type="button"
                  className={cn(
                    "group relative flex w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[1.65rem] text-left",
                    "bg-[linear-gradient(180deg,rgba(255,253,249,0.96)_0%,rgba(247,240,231,0.94)_58%,rgba(238,228,215,0.9)_100%)]"
                  )}
                  aria-hidden={selectedIndex !== index}
                  aria-label={
                    selectedIndex === index ? `Agrandir ${product.name}, image ${index + 1}` : undefined
                  }
                  data-current={selectedIndex === index}
                  tabIndex={selectedIndex === index ? 0 : -1}
                  onClick={() => {
                    setSelectedIndex(index)
                    setZoomOpen(true)
                  }}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.5),transparent_38%),linear-gradient(270deg,rgba(185,154,91,0.12),transparent_36%,transparent_64%,rgba(185,154,91,0.09))]" />
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,rgba(23,23,23,0.07),transparent)]" />
                  <div className="absolute inset-x-10 top-10 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                  <div className="absolute inset-y-10 left-10 w-px bg-gradient-to-b from-transparent via-white/70 to-transparent" />
                  <div className="absolute inset-y-10 right-10 w-px bg-gradient-to-b from-transparent via-charcoal/5 to-transparent" />
                  <span
                    className={cn(
                      "relative z-10 flex h-[clamp(390px,55vh,640px)] w-full items-center justify-center p-8 sm:p-10 md:h-[clamp(500px,62vh,720px)] lg:p-12 xl:p-16",
                      imageLayouts[src] === "landscape" ? "xl:p-12" : null
                    )}
                  >
                    <img
                      src={src}
                      alt={`${product.name} image ${index + 1}`}
                      className={cn(
                        "max-h-full max-w-full object-contain opacity-100 transition duration-700 group-hover:scale-[1.015]",
                        "drop-shadow-[0_28px_56px_rgba(38,29,20,0.18)]"
                      )}
                      onLoad={(event) => rememberImageLayout(src, event.currentTarget)}
                    />
                  </span>
                  <div className="absolute left-5 top-5 flex flex-wrap gap-2">
                    {product.badges.map((badge) => (
                      <Badge key={badge} className="rounded-full border border-white/60 bg-white/86 text-charcoal shadow-soft backdrop-blur">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                  <span className="absolute bottom-5 right-5 inline-flex items-center gap-2 rounded-full bg-charcoal/78 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-ivory shadow-soft backdrop-blur transition group-hover:bg-charcoal">
                    <AppIcon icon="solar:magnifer-zoom-in-linear" className="size-4" />
                    Zoom
                  </span>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <Dialog open={zoomOpen} onOpenChange={setZoomOpen}>
        <ZoomDialog
          alt={`${product.name} image ${selectedIndex + 1}`}
          image={selectedImage}
          onNext={scrollNext}
          onPrev={scrollPrev}
          showNavigation={images.length > 1}
          title={product.name}
        />
      </Dialog>

      <div
        data-gallery-reveal
        className="flex gap-2 overflow-x-auto rounded-[1.45rem] border border-white/75 bg-white/70 p-2 shadow-soft backdrop-blur [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, index) => (
          <button
            key={`${src}-thumb-${index}`}
            ref={(node) => {
              thumbnailRefs.current[index] = node
            }}
            type="button"
            onClick={() => scrollToImage(index)}
            className={cn(
              "relative size-20 shrink-0 overflow-hidden rounded-[1rem] border p-1.5 transition md:size-24 xl:size-[104px]",
              selectedIndex === index
                ? "border-gold bg-white shadow-soft"
                : "border-white/80 bg-white/64 opacity-70 hover:border-gold/35 hover:opacity-100"
            )}
            aria-label={`Afficher l’image ${index + 1} de ${product.name}`}
            aria-current={selectedIndex === index}
          >
            <img
              src={src}
              alt=""
              className="aspect-square w-full rounded-[0.85rem] bg-[linear-gradient(180deg,#fffdf9,#f4eee6)] object-contain"
              loading="lazy"
              onLoad={(event) => rememberImageLayout(src, event.currentTarget)}
            />
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
  )
}

function ZoomDialog({
  alt,
  image,
  onNext,
  onPrev,
  showNavigation,
  title,
}: {
  alt: string
  image: string
  onNext: () => void
  onPrev: () => void
  showNavigation: boolean
  title: string
}) {
  return (
    <DialogContent
      showCloseButton={false}
      className="max-w-none overflow-hidden border border-white/25 bg-ivory/18 p-0 text-charcoal shadow-none backdrop-blur-2xl sm:max-w-none"
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <DialogDescription className="sr-only">{alt}</DialogDescription>
      <div className="relative flex h-[100dvh] w-[100dvw] items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.58),transparent_28%),radial-gradient(circle_at_80%_80%,rgba(185,154,91,0.24),transparent_34%),rgba(250,247,242,0.32)]">
        <TransformWrapper initialScale={1} minScale={1} maxScale={4} centerOnInit>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <TransformComponent wrapperClass="!h-full !w-full" contentClass="!h-full !w-full">
                <div className="flex h-full w-full items-center justify-center p-4 md:p-8">
                  <div className="rounded-[2rem] border border-white/45 bg-white/18 p-2 shadow-[0_30px_110px_rgba(38,29,20,0.18)] backdrop-blur-xl md:p-3">
                    <img
                      src={image}
                      alt={alt}
                      className="max-h-[86vh] max-w-[90vw] rounded-[1.5rem] object-contain"
                    />
                  </div>
                </div>
              </TransformComponent>

              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/45 bg-white/30 p-1.5 text-charcoal shadow-soft backdrop-blur-xl">
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
              className="absolute left-4 top-1/2 size-11 -translate-y-1/2 rounded-full border border-white/45 bg-white/30 text-charcoal shadow-soft backdrop-blur-xl hover:bg-white/50 hover:text-charcoal"
              onClick={onPrev}
              aria-label="Image précédente"
            >
              <AppIcon icon="solar:alt-arrow-left-linear" className="size-5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-lg"
              className="absolute right-4 top-1/2 size-11 -translate-y-1/2 rounded-full border border-white/45 bg-white/30 text-charcoal shadow-soft backdrop-blur-xl hover:bg-white/50 hover:text-charcoal"
              onClick={onNext}
              aria-label="Image suivante"
            >
              <AppIcon icon="solar:alt-arrow-right-linear" className="size-5" />
            </Button>
          </>
        ) : null}

        <DialogClose asChild>
          <Button
            type="button"
            variant="ghost"
            className="absolute right-5 top-5 h-10 rounded-full border border-white/45 bg-white/30 px-4 text-charcoal shadow-soft backdrop-blur-xl hover:bg-white/50 hover:text-charcoal"
          >
            Fermer
          </Button>
        </DialogClose>
      </div>
    </DialogContent>
  )
}
