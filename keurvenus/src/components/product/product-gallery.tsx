import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
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

function imageFeatherMaskStyle(layout?: ImageLayout): CSSProperties {
  const horizontal =
    layout === "portrait"
      ? "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.06) 8%, #000 28%, #000 72%, rgba(0,0,0,0.06) 92%, transparent 100%)"
      : "linear-gradient(to right, transparent 0%, #000 9%, #000 91%, transparent 100%)"
  const vertical =
    layout === "landscape"
      ? "linear-gradient(to bottom, transparent 0%, #000 10%, #000 90%, transparent 100%)"
      : layout === "portrait"
        ? "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.08) 9%, #000 20%, #000 84%, rgba(0,0,0,0.08) 94%, transparent 100%)"
        : "linear-gradient(to bottom, transparent 0%, #000 7%, #000 93%, transparent 100%)"

  return {
    WebkitMaskImage: `${horizontal}, ${vertical}`,
    WebkitMaskComposite: "source-in",
    maskComposite: "intersect",
    maskImage: `${horizontal}, ${vertical}`,
  }
}

export function ProductGallery({ product }: { product: Product }) {
  const [api, setApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [imageLayouts, setImageLayouts] = useState<Record<string, ImageLayout>>({})
  const scopeRef = useRef<HTMLDivElement>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])
  const images = product.images.length ? product.images : [""]

  const selectedImage = images[selectedIndex] ?? images[0]

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
        className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/68 shadow-luxury"
      >
        <Carousel setApi={setApi} opts={{ align: "start", loop: images.length > 1 }}>
          <CarouselContent className="-ml-0">
            {images.map((src, index) => (
              <CarouselItem key={`${src}-${index}`} className="pl-0">
                <button
                  type="button"
                  className={cn(
                    "group relative flex w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-[2rem] text-left",
                    "bg-[linear-gradient(135deg,rgba(250,247,242,0.88),rgba(232,222,209,0.66))]"
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
                  {src ? (
                    <>
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-[1.08] object-cover opacity-22 blur-2xl saturate-125 transition duration-700 group-hover:scale-[1.12] group-hover:opacity-28"
                      />
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full scale-[1.01] object-cover opacity-80 saturate-105 transition duration-700 group-hover:scale-[1.025] group-hover:opacity-85"
                      />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(250,247,242,0.02),rgba(250,247,242,0.16)_58%,rgba(250,247,242,0.44)_100%),linear-gradient(135deg,rgba(255,255,255,0.18),rgba(185,154,91,0.06))]" />
                    </>
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 flex h-[clamp(330px,62vh,720px)] w-full items-center justify-center p-0 md:h-[clamp(440px,66vh,780px)]",
                      imageLayouts[src] === "portrait" ? "md:p-8 xl:p-10" : null
                    )}
                  >
                    <img
                      src={src}
                      alt={`${product.name} image ${index + 1}`}
                      className={cn(
                        "h-full w-full object-contain transition duration-700 group-hover:scale-[1.008]",
                        imageLayouts[src] === "portrait" ? "opacity-[0.18] sm:opacity-[0.68]" : "opacity-95",
                        imageLayouts[src] === "portrait"
                          ? "drop-shadow-[0_22px_45px_rgba(38,29,20,0.14)]"
                          : null
                      )}
                      style={imageFeatherMaskStyle(imageLayouts[src])}
                      onLoad={(event) => rememberImageLayout(src, event.currentTarget)}
                    />
                  </span>
                  <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                    {product.badges.map((badge) => (
                      <Badge key={badge} className="rounded-full bg-ivory/92 text-charcoal">
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
        className="flex gap-2 overflow-x-auto rounded-[1.45rem] border border-white/75 bg-white/64 p-2 shadow-soft [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
              "relative size-20 shrink-0 overflow-hidden rounded-[1rem] border p-1 transition md:size-24 xl:size-[104px]",
              selectedIndex === index
                ? "border-gold bg-white shadow-soft"
                : "border-white/80 bg-white/60 opacity-65 hover:opacity-100"
            )}
            aria-label={`Afficher l’image ${index + 1} de ${product.name}`}
            aria-current={selectedIndex === index}
          >
            <img
              src={src}
              alt=""
              className="aspect-square w-full rounded-[0.9rem] bg-cream object-contain"
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
