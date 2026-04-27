import { Link, useNavigate } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useCollections } from "@/hooks/use-collections"
import { useProducts } from "@/hooks/use-products"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"
import { formatPrice } from "@/lib/format"
import { cn } from "@/lib/utils"

type SearchDialogProps = {
  variant?: "bar" | "icon"
  className?: string
}

const popularSearches = ["Carafe", "Verres", "Pots à épices", "Services de table", "Glacières"]

export function SearchDialog({ variant = "bar", className }: SearchDialogProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const normalizedQuery = query.trim()
  const { data: products = [] } = useProducts({
    search: normalizedQuery || undefined,
    pageSize: normalizedQuery ? 8 : 96,
  })
  const { data: collections = [] } = useCollections()

  const productResults = useMemo(() => {
    const list = normalizedQuery ? products : products.filter((product) => product.featured)
    return list.slice(0, 4)
  }, [normalizedQuery, products])

  const collectionResults = useMemo(() => {
    const searchTerm = normalizedQuery.toLowerCase()
    const list = normalizedQuery
      ? collections.filter((collection) =>
          `${collection.name} ${collection.description}`.toLowerCase().includes(searchTerm)
        )
      : collections.filter((collection) => collection.featured)

    return list.slice(0, 3)
  }, [collections, normalizedQuery])

  function submitSearch() {
    setOpen(false)
    void navigate({
      to: "/shop",
      search: normalizedQuery ? { q: normalizedQuery } : {},
    })
  }

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => inputRef.current?.focus(), 90)
    return () => window.clearTimeout(timer)
  }, [open])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() !== "k" || (!event.metaKey && !event.ctrlKey)) {
        return
      }

      event.preventDefault()
      setOpen(true)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useGSAP(
    () => {
      if (!open || !contentRef.current || prefersReducedMotion()) return
      gsap.fromTo(
        contentRef.current.querySelectorAll("[data-search-reveal]"),
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.48, stagger: 0.055, ease: "power3.out" }
      )
    },
    { scope: contentRef, dependencies: [open, query] }
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className={cn(
              "rounded-full border-charcoal/10 bg-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] transition hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white",
              className
            )}
            aria-label="Ouvrir la recherche"
          >
            <AppIcon icon="solar:magnifer-linear" className="size-5" />
          </Button>
        ) : (
          <button
            type="button"
            className={cn(
              "hidden h-12 w-48 items-center gap-3 rounded-full border border-charcoal/10 bg-white/68 px-2.5 text-left text-sm font-medium text-warm-gray shadow-[inset_0_1px_0_rgba(255,255,255,0.66)] transition hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white hover:shadow-soft xl:flex xl:w-60 2xl:w-80",
              className
            )}
            aria-label="Ouvrir la recherche"
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,.7)]">
              <AppIcon icon="solar:magnifer-linear" className="size-4" />
            </span>
            <span className="truncate">Rechercher une assiette, un plaid...</span>
            <span className="ml-auto hidden rounded-full bg-cream px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold 2xl:inline">
              ⌘K
            </span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent
        ref={contentRef}
        showCloseButton={false}
        className="top-8 max-h-[calc(100vh-4rem)] w-[min(1320px,calc(100vw-32px))] translate-y-0 overflow-hidden rounded-[2rem] border border-white/85 bg-ivory/98 p-0 shadow-[0_30px_100px_rgba(22,16,12,.24)] ring-white/70 data-open:slide-in-from-top-4 sm:max-w-none"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Recherche produit Keur Venus</DialogTitle>
          <DialogDescription>
            Rechercher des produits, collections et inspirations Keur Venus.
          </DialogDescription>
        </DialogHeader>

        <div className="grid border-b border-charcoal/8 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:gap-4 md:p-6">
          <div data-search-reveal className="relative">
            <AppIcon
              icon="solar:magnifer-linear"
              className="absolute left-5 top-1/2 size-5 -translate-y-1/2 text-gold"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submitSearch()
                }
              }}
              className="h-16 rounded-full border-charcoal/10 bg-white pl-14 pr-5 text-base shadow-soft focus-visible:ring-gold md:text-lg"
              placeholder="Rechercher une assiette, un plaid, une bougie..."
            />
          </div>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="mt-3 h-12 rounded-full px-4 text-xs uppercase tracking-[0.16em] text-warm-gray hover:bg-white md:mt-0"
            >
              <AppIcon icon="solar:close-circle-linear" className="size-4" />
              Fermer
            </Button>
          </DialogClose>
        </div>

        <div className="grid max-h-[calc(100vh-14rem)] gap-0 overflow-y-auto lg:grid-cols-[1fr_360px]">
          <div className="p-4 md:p-6">
            <div data-search-reveal className="flex flex-wrap gap-2">
              {popularSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="rounded-full border border-charcoal/8 bg-white/82 px-4 py-2 text-sm font-semibold text-charcoal transition hover:-translate-y-0.5 hover:border-gold/30 hover:bg-white"
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="mt-6 grid gap-3">
              {productResults.map((product) => (
                <DialogClose asChild key={product.id}>
                  <Link
                    to="/shop/$slug"
                    params={{ slug: product.slug }}
                    data-search-reveal
                    className="group grid grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-4 rounded-[1.4rem] border border-charcoal/7 bg-white/72 p-3 transition hover:-translate-y-0.5 hover:border-gold/25 hover:bg-white hover:shadow-soft"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="aspect-square rounded-[1rem] object-cover"
                      loading="lazy"
                    />
                    <span className="min-w-0">
                      <span className="block font-serif text-2xl leading-none text-charcoal transition group-hover:text-gold">
                        {product.name}
                      </span>
                      <span className="mt-1 line-clamp-1 block text-sm text-warm-gray">
                        {product.shortDescription}
                      </span>
                      <span className="mt-2 inline-flex rounded-full bg-cream px-3 py-1 text-xs font-semibold text-warm-gray">
                        {product.category}
                      </span>
                    </span>
                    <span className="hidden text-right text-sm font-bold text-charcoal sm:block">
                      {formatPrice(product.price, product.currency)}
                    </span>
                  </Link>
                </DialogClose>
              ))}
            </div>
          </div>

          <aside className="border-t border-charcoal/8 bg-white/42 p-4 md:p-6 lg:border-l lg:border-t-0">
            <div data-search-reveal>
              <p className="text-xs uppercase tracking-[0.22em] text-gold">Collections</p>
              <div className="mt-4 grid gap-2">
                {collectionResults.map((collection) => (
                  <DialogClose asChild key={collection.id}>
                    <Link
                      to="/shop"
                      search={{ category: collection.slug }}
                      className="rounded-[1.2rem] border border-charcoal/7 bg-ivory/80 p-4 transition hover:border-gold/25 hover:bg-white"
                    >
                      <span className="block font-serif text-2xl leading-none">
                        {collection.name}
                      </span>
                      <span className="mt-2 line-clamp-2 block text-sm leading-6 text-warm-gray">
                        {collection.description}
                      </span>
                    </Link>
                  </DialogClose>
                ))}
              </div>
            </div>

            <Separator className="my-6 bg-charcoal/8" />

            <div data-search-reveal className="rounded-[1.35rem] bg-charcoal p-5 text-ivory">
              <p className="text-xs uppercase tracking-[0.18em] text-champagne">
                Recherche boutique
              </p>
              <p className="mt-3 text-sm leading-7 text-ivory/72">
                Commencez à taper pour faire remonter les produits et ouvrir les fiches en un
                geste.
              </p>
              <DialogClose asChild>
                <Button asChild className="mt-5 h-11 rounded-full bg-gold px-5 text-charcoal">
                  <Link to="/shop" search={normalizedQuery ? { q: normalizedQuery } : {}}>
                    Voir les résultats
                    <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                  </Link>
                </Button>
              </DialogClose>
            </div>
          </aside>
        </div>
      </DialogContent>
    </Dialog>
  )
}
