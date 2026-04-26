import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useMemo, useRef, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { ProductCard } from "@/components/product/product-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { useProductsInfinite, useProductsPage, useShopFilters, useStorefrontConfig } from "@/hooks/use-products"
import { useSession } from "@/hooks/use-session"
import type { StorefrontAttributeFilter, StorefrontPriceFilter } from "@/lib/types"

type ShopSearch = {
  category?: string
  q?: string
  page?: number
}

export const Route = createFileRoute("/shop/")({
  validateSearch: (search): ShopSearch => {
    const result: ShopSearch = {}
    if (typeof search.category === "string") result.category = search.category
    if (typeof search.q === "string") result.q = search.q
    if (typeof search.page === "number") result.page = search.page
    if (typeof search.page === "string") {
      const page = Number(search.page)
      if (Number.isFinite(page) && page > 0) result.page = page
    }
    return result
  },
  component: ShopPage,
})

const allCategoriesValue = "Tous"

function ShopPage() {
  const routeSearch = Route.useSearch()
  const { data: storefrontConfig } = useStorefrontConfig()
  const pageSize = storefrontConfig?.shopPageSize ?? 24
  const paginationType = storefrontConfig?.paginationType ?? "pagination"
  const isInfiniteScroll = paginationType === "infinite_scroll"
  const [page, setPage] = useState(routeSearch.page || 1)
  const [category, setCategory] = useState(routeSearch.category || allCategoriesValue)
  const [search, setSearch] = useState(routeSearch.q || "")
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<string[]>([])
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const selectedCategory = category === allCategoriesValue ? undefined : category
  const activeMinPrice = Number(minPrice) > 0 ? Number(minPrice) : undefined
  const activeMaxPrice = Number(maxPrice) > 0 ? Number(maxPrice) : undefined
  const productQueryOptions = {
    category: selectedCategory,
    search: search || undefined,
    attributeValues: selectedAttributeValues,
    minPrice: activeMinPrice,
    maxPrice: activeMaxPrice,
  }
  const paginatedProductsQuery = useProductsPage(page, pageSize, productQueryOptions, {
    enabled: !isInfiniteScroll,
  })
  const infiniteProductsQuery = useProductsInfinite(pageSize, productQueryOptions, {
    enabled: isInfiniteScroll,
  })
  const { data: filters } = useShopFilters({
    category: selectedCategory,
    search: search || undefined,
  })
  const { data: session } = useSession()
  const loadMoreRef = useRef<HTMLDivElement | null>(null)
  const productPage = paginatedProductsQuery.data
  const infinitePages = infiniteProductsQuery.data?.pages || []
  const products = isInfiniteScroll
    ? infinitePages.flatMap((pageData) => pageData.items)
    : productPage?.items ?? []
  const [sort, setSort] = useState("Éditorial")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const totalProducts = isInfiniteScroll
    ? infinitePages[0]?.total ?? products.length
    : productPage?.total ?? products.length
  const totalPages = Math.max(1, Math.ceil(totalProducts / pageSize))
  const hasMoreInfiniteProducts = Boolean(infiniteProductsQuery.hasNextPage)
  const isLoadingProducts = isInfiniteScroll
    ? infiniteProductsQuery.isLoading
    : paginatedProductsQuery.isLoading
  const isInternalUser = Boolean(session?.is_internal_user || session?.user?.is_internal_user)
  const unpublishedOnPage = products.filter((product) => product.isPublished === false).length

  const categoryOptions = useMemo(() => {
    return (filters?.categories || [])
      .filter((item) => item.productCount > 0)
      .sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.name.localeCompare(b.name))
  }, [filters?.categories])

  const activeCategory = categoryOptions.find((item) => item.slug === category)

  const filtered = useMemo(() => {
    const list = products

    if (sort === "Prix croissant") return [...list].sort((a, b) => a.price - b.price)
    if (sort === "Prix décroissant") return [...list].sort((a, b) => b.price - a.price)
    return list
  }, [products, sort])

  const hasPriceFilter = Boolean(activeMinPrice || activeMaxPrice)
  const hasActiveFilters =
    search.length > 0 ||
    selectedAttributeValues.length > 0 ||
    hasPriceFilter
  const activeFilterCount = [
    search.length > 0,
    selectedAttributeValues.length > 0,
    hasPriceFilter,
  ].filter(Boolean).length

  useEffect(() => {
    setCategory(routeSearch.category || allCategoriesValue)
    setSearch(routeSearch.q || "")
    setPage(routeSearch.page || 1)
  }, [routeSearch.category, routeSearch.page, routeSearch.q])

  useEffect(() => {
    setPage(1)
  }, [category, search, selectedAttributeValues, minPrice, maxPrice])

  useEffect(() => {
    if (!isInfiniteScroll) return
    const node = loadMoreRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          infiniteProductsQuery.hasNextPage &&
          !infiniteProductsQuery.isFetchingNextPage
        ) {
          void infiniteProductsQuery.fetchNextPage()
        }
      },
      { rootMargin: "520px 0px" }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [
    infiniteProductsQuery.fetchNextPage,
    infiniteProductsQuery.hasNextPage,
    infiniteProductsQuery.isFetchingNextPage,
    isInfiniteScroll,
  ])

  function resetFilters() {
    setSelectedAttributeValues([])
    setMinPrice("")
    setMaxPrice("")
    setSearch("")
    setSort("Éditorial")
  }

  function toggleAttributeValue(value: string) {
    setSelectedAttributeValues((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
    )
  }

  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <section
        className="grid min-h-[380px] content-end rounded-[2rem] bg-cover bg-center p-8 text-ivory shadow-luxury"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(23,23,23,.72), rgba(23,23,23,.18)), url('https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80')",
        }}
      >
        <p className="text-xs uppercase tracking-[0.22em] text-champagne">boutique</p>
        <h1 className="mt-3 max-w-3xl font-serif text-6xl leading-none">
          {activeCategory ? activeCategory.name : "Découvrez toute la collection Kër Venus."}
        </h1>
        {activeCategory ? (
          <p className="mt-4 max-w-2xl text-sm leading-7 text-ivory/82">
            {activeCategory.description}
          </p>
        ) : null}
      </section>
      {isInternalUser ? (
        <section className="mt-5 rounded-[1.45rem] border border-charcoal/8 bg-charcoal p-3 text-ivory shadow-luxury">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-white/10 text-champagne">
                <AppIcon icon="solar:settings-minimalistic-linear" className="size-5" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-champagne">
                  Mode édition
                </p>
                <p className="text-sm text-ivory/72">
                  Les produits non publiés sont atténués. Utilisez les contrôles sur chaque carte.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-white/10 px-3 text-ivory">
                {unpublishedOnPage} brouillon{unpublishedOnPage > 1 ? "s" : ""} sur cette page
              </Badge>
              <Badge className="rounded-full bg-white/10 px-3 text-ivory">
                {totalProducts} produit{totalProducts > 1 ? "s" : ""}
              </Badge>
              <Badge className="rounded-full bg-white/10 px-3 text-ivory">
                {isInfiniteScroll ? "Scroll infini" : "Pagination"}
              </Badge>
            </div>
          </div>
        </section>
      ) : null}
      <section className="mt-8 grid gap-7 lg:grid-cols-[340px_1fr]">
        <aside className="hidden h-max rounded-[2rem] border border-white/80 bg-white/72 p-4 shadow-luxury backdrop-blur md:p-5 lg:sticky lg:top-36 lg:block">
          <FilterPanel
            attributeGroups={filters?.attributes || []}
            filteredCount={filtered.length}
            hasActiveFilters={hasActiveFilters}
            maxPrice={maxPrice}
            minPrice={minPrice}
            onMaxPriceChange={setMaxPrice}
            onMinPriceChange={setMinPrice}
            onReset={resetFilters}
            onSearchChange={setSearch}
            onToggleAttributeValue={toggleAttributeValue}
            priceFilter={filters?.price}
            search={search}
            selectedAttributeValues={selectedAttributeValues}
          />
        </aside>

        <div>
          <div className="mb-5 rounded-[1.6rem] border border-white/75 bg-white/60 p-3 shadow-soft backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-gold">
                  {filtered.length} produit{filtered.length > 1 ? "s" : ""} affiché
                  {filtered.length > 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-warm-gray">
                  {isInfiniteScroll
                    ? `${products.length} chargé${products.length > 1 ? "s" : ""} sur ${totalProducts}`
                    : `Page ${page} sur ${totalPages} · ${totalProducts} produit${totalProducts > 1 ? "s" : ""} au catalogue`}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant="outline" className="rounded-full border-charcoal/10 bg-ivory">
                    {activeCategory?.name || "Tous les univers"}
                  </Badge>
                  {selectedAttributeValues.length ? (
                    <Badge variant="outline" className="rounded-full border-charcoal/10 bg-ivory">
                      {selectedAttributeValues.length} attribut{selectedAttributeValues.length > 1 ? "s" : ""}
                    </Badge>
                  ) : null}
                  {hasPriceFilter ? (
                    <Badge variant="outline" className="rounded-full border-charcoal/10 bg-ivory">
                      Prix filtré
                    </Badge>
                  ) : null}
                  {search ? (
                    <Badge variant="outline" className="rounded-full border-charcoal/10 bg-ivory">
                      “{search}”
                    </Badge>
                  ) : null}
                </div>
              </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:justify-end">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full border-charcoal/10 bg-white/80 px-5 lg:hidden"
                >
                  <AppIcon icon="solar:filter-linear" className="size-4" />
                  Filtres
                  {activeFilterCount ? (
                    <Badge className="ml-1 rounded-full bg-charcoal px-2 text-ivory">
                      {activeFilterCount}
                    </Badge>
                  ) : null}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="!w-[min(430px,calc(100vw-18px))] overflow-hidden border-white/75 bg-ivory/92 p-0 shadow-luxury backdrop-blur-2xl sm:!max-w-[430px] lg:hidden"
              >
                <SheetHeader className="border-b border-charcoal/8 px-5 py-5">
                  <SheetTitle className="font-serif text-4xl leading-none">
                    Filtres
                  </SheetTitle>
                  <SheetDescription>
                    Affinez la boutique par variantes, prix et recherche.
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <FilterPanel
                    attributeGroups={filters?.attributes || []}
                    filteredCount={filtered.length}
                    hasActiveFilters={hasActiveFilters}
                    maxPrice={maxPrice}
                    minPrice={minPrice}
                    onMaxPriceChange={setMaxPrice}
                    onMinPriceChange={setMinPrice}
                    onReset={resetFilters}
                    onSearchChange={setSearch}
                    onToggleAttributeValue={toggleAttributeValue}
                    priceFilter={filters?.price}
                    search={search}
                    selectedAttributeValues={selectedAttributeValues}
                    compact
                  />
                </div>
                <SheetFooter className="border-t border-charcoal/8 bg-white/50 p-4">
                  <div className="grid grid-cols-[auto_1fr] gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 rounded-full border-charcoal/10 bg-white px-4"
                      onClick={resetFilters}
                      disabled={!hasActiveFilters}
                    >
                      Reset
                    </Button>
                    <SheetClose asChild>
                      <Button className="h-11 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90">
                        Voir {filtered.length} produit{filtered.length > 1 ? "s" : ""}
                      </Button>
                    </SheetClose>
                  </div>
                </SheetFooter>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 rounded-full border-charcoal/10 bg-white/80 px-5"
                >
                  <AppIcon icon="solar:sort-linear" className="size-4" />
                  Trier: {sort}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="rounded-[1rem] border-white/75 bg-ivory p-2 shadow-luxury">
                {["Éditorial", "Prix croissant", "Prix décroissant"].map((option) => (
                  <DropdownMenuItem
                    key={option}
                    className="rounded-xl px-3 py-2"
                    onClick={() => setSort(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
            </div>
          </div>
          <Separator className="mb-5 bg-charcoal/8" />
          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {!isLoadingProducts && !filtered.length ? (
            <div className="rounded-[2rem] border border-white/75 bg-white/70 p-10 text-center shadow-soft">
              <p className="font-serif text-4xl">Aucune pièce trouvée.</p>
              <p className="mx-auto mt-3 max-w-md text-warm-gray">
                Essayez un autre univers, ajustez les filtres ou videz la recherche.
              </p>
              <Button
                type="button"
                className="mt-6 h-11 rounded-full bg-charcoal px-6 text-ivory"
                onClick={resetFilters}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : null}
          {isInfiniteScroll ? (
            <div
              ref={loadMoreRef}
              className="mt-8 flex flex-col items-center gap-3 rounded-[1.45rem] border border-white/75 bg-white/62 p-4 text-center shadow-soft backdrop-blur"
            >
              {hasMoreInfiniteProducts ? (
                <>
                  <p className="text-sm text-warm-gray">
                    {infiniteProductsQuery.isFetchingNextPage
                      ? "Chargement des prochaines pièces..."
                      : "Les prochaines pièces se chargent automatiquement."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 rounded-full border-charcoal/10 bg-white px-5"
                    disabled={infiniteProductsQuery.isFetchingNextPage}
                    onClick={() => void infiniteProductsQuery.fetchNextPage()}
                  >
                    <AppIcon icon="solar:refresh-linear" className="size-4" />
                    Charger plus
                  </Button>
                </>
              ) : (
                <p className="text-sm text-warm-gray">
                  Toute la sélection est chargée.
                </p>
              )}
            </div>
          ) : totalPages > 1 ? (
            <nav
              className="mt-8 flex flex-col gap-3 rounded-[1.45rem] border border-white/75 bg-white/62 p-3 shadow-soft backdrop-blur sm:flex-row sm:items-center sm:justify-between"
              aria-label="Pagination boutique"
            >
              <p className="px-2 text-sm text-warm-gray">
                Produits {(page - 1) * pageSize + 1} à{" "}
                {Math.min(page * pageSize, totalProducts)} sur {totalProducts}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="size-10 rounded-full border-charcoal/10 bg-white p-0"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  aria-label="Page précédente"
                >
                  <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => {
                  const start = Math.min(
                    Math.max(page - 2, 1),
                    Math.max(totalPages - 4, 1)
                  )
                  const pageNumber = start + index
                  if (pageNumber > totalPages) return null
                  return (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={pageNumber === page ? "default" : "outline"}
                      className={`size-10 rounded-full p-0 ${
                        pageNumber === page
                          ? "bg-charcoal text-ivory"
                          : "border-charcoal/10 bg-white"
                      }`}
                      onClick={() => setPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  )
                })}
                <Button
                  type="button"
                  variant="outline"
                  className="size-10 rounded-full border-charcoal/10 bg-white p-0"
                  disabled={page >= totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  aria-label="Page suivante"
                >
                  <AppIcon icon="solar:alt-arrow-right-linear" className="size-4" />
                </Button>
              </div>
            </nav>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function FilterPanel({
  attributeGroups,
  compact = false,
  filteredCount,
  hasActiveFilters,
  maxPrice,
  minPrice,
  onMaxPriceChange,
  onMinPriceChange,
  onReset,
  onSearchChange,
  onToggleAttributeValue,
  priceFilter,
  search,
  selectedAttributeValues,
}: {
  attributeGroups: StorefrontAttributeFilter[]
  compact?: boolean
  filteredCount: number
  hasActiveFilters: boolean
  maxPrice: string
  minPrice: string
  onMaxPriceChange: (value: string) => void
  onMinPriceChange: (value: string) => void
  onReset: () => void
  onSearchChange: (value: string) => void
  onToggleAttributeValue: (value: string) => void
  priceFilter?: StorefrontPriceFilter
  search: string
  selectedAttributeValues: string[]
}) {
  const hasPriceFilter =
    Boolean(priceFilter?.enabled) && (priceFilter?.max || 0) > (priceFilter?.min || 0)
  const visibleAttributeGroups = attributeGroups
    .map((group) => ({
      ...group,
      values: group.values.filter((value) => value.count > 0),
    }))
    .filter((group) => group.values.length > 0)

  return (
    <>
      <div className="rounded-[1.6rem] border border-charcoal/5 bg-ivory/78 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,.78)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">
              sélection
            </p>
            <h2 className="mt-2 font-serif text-4xl leading-none">Filtres</h2>
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs text-warm-gray"
                onClick={onReset}
              >
                Reset
              </Button>
            ) : null}
            <Badge className="rounded-full bg-charcoal px-3 text-ivory">
              {filteredCount}
            </Badge>
          </div>
        </div>

        <label className="relative mt-5 block">
          <AppIcon
            icon="solar:magnifer-linear"
            className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gold"
          />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Rechercher une pièce..."
            className="h-12 rounded-full border-charcoal/10 bg-white/86 pl-10 shadow-soft"
          />
        </label>
      </div>

      {hasPriceFilter ? (
        <PriceRangeFilter
          maxPrice={maxPrice}
          minPrice={minPrice}
          onMaxPriceChange={onMaxPriceChange}
          onMinPriceChange={onMinPriceChange}
          priceFilter={priceFilter!}
        />
      ) : null}

      {visibleAttributeGroups.map((group) => (
        <div
          key={group.id}
          className="mt-5 overflow-hidden rounded-[1.6rem] border border-charcoal/5 bg-white/66 shadow-[inset_0_1px_0_rgba(255,255,255,.72)]"
        >
          <div className="flex items-center justify-between border-b border-charcoal/6 px-4 py-3">
            <p className="text-xs uppercase tracking-[0.2em] text-warm-gray">
              {group.name}
            </p>
            <span className="rounded-full bg-ivory px-2.5 py-1 text-xs font-semibold text-warm-gray">
              {group.values.length}
            </span>
          </div>
          <div className="grid gap-2 p-3">
            {group.values.map((item) => {
              const selected = selectedAttributeValues.includes(item.slug)
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => onToggleAttributeValue(item.slug)}
                  className={`grid min-h-12 grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[1rem] border px-3 py-2 text-left text-sm font-semibold transition ${
                    selected
                      ? "border-charcoal bg-charcoal text-ivory shadow-soft"
                      : "border-charcoal/8 bg-ivory/68 text-charcoal hover:border-gold/30 hover:bg-white"
                  }`}
                >
                  {item.htmlColor ? (
                    <span
                      className="size-4 rounded-full border border-charcoal/10 shadow-sm"
                      style={{ backgroundColor: item.htmlColor }}
                    />
                  ) : (
                    <span
                      className={`grid size-8 place-items-center rounded-full ${
                        selected ? "bg-white/10 text-champagne" : "bg-white text-gold"
                      }`}
                    >
                      <AppIcon icon="solar:tag-linear" className="size-4" />
                    </span>
                  )}
                  <span className="min-w-0 truncate">{item.name}</span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      selected ? "bg-white/10 text-ivory" : "bg-white text-warm-gray"
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {compact ? null : (
        <div className="mt-5 rounded-[1.6rem] border border-charcoal/8 bg-charcoal p-5 text-ivory shadow-soft">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-champagne">
              <AppIcon icon="solar:tuning-2-linear" className="size-5" />
            </span>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-champagne">
                Filtres configurés
              </p>
              <p className="mt-3 text-sm leading-7 text-ivory/72">
                Le panneau reprend les prix et variantes réellement disponibles dans le backoffice.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function PriceRangeFilter({
  maxPrice,
  minPrice,
  onMaxPriceChange,
  onMinPriceChange,
  priceFilter,
}: {
  maxPrice: string
  minPrice: string
  onMaxPriceChange: (value: string) => void
  onMinPriceChange: (value: string) => void
  priceFilter: StorefrontPriceFilter
}) {
  const lowerBound = Math.floor(priceFilter.min || 0)
  const upperBound = Math.ceil(priceFilter.max || 0)
  const step = getPriceStep(lowerBound, upperBound)
  const priceSymbol = priceFilter.currency?.symbol || "CFA"
  const selectedMin = clampPriceValue(Number(minPrice), lowerBound, upperBound, lowerBound)
  const selectedMax = clampPriceValue(Number(maxPrice), lowerBound, upperBound, upperBound)
  const rangeValue: [number, number] =
    selectedMin <= selectedMax ? [selectedMin, selectedMax] : [selectedMax, selectedMin]
  const isCustomRange = rangeValue[0] > lowerBound || rangeValue[1] < upperBound

  function updateRange([nextMin, nextMax]: number[]) {
    const boundedMin = clampPriceValue(nextMin, lowerBound, upperBound, lowerBound)
    const boundedMax = clampPriceValue(nextMax, lowerBound, upperBound, upperBound)
    onMinPriceChange(String(Math.min(boundedMin, boundedMax)))
    onMaxPriceChange(String(Math.max(boundedMin, boundedMax)))
  }

  function updateInput(kind: "min" | "max", value: string) {
    if (value === "") {
      if (kind === "min") onMinPriceChange("")
      else onMaxPriceChange("")
      return
    }
    const nextValue = Number(value)
    if (!Number.isFinite(nextValue)) return
    const bounded = clampPriceValue(nextValue, lowerBound, upperBound, kind === "min" ? lowerBound : upperBound)
    if (kind === "min") onMinPriceChange(String(Math.min(bounded, rangeValue[1])))
    else onMaxPriceChange(String(Math.max(bounded, rangeValue[0])))
  }

  return (
    <div className="mt-5 overflow-hidden rounded-[1.6rem] border border-charcoal/5 bg-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,.75)]">
      <div className="flex items-center justify-between border-b border-charcoal/6 px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-warm-gray">Prix</p>
          <p className="mt-1 text-sm font-semibold text-charcoal">
            {formatFilterPrice(rangeValue[0])} - {formatFilterPrice(rangeValue[1])} {priceSymbol}
          </p>
        </div>
        {isCustomRange ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs text-warm-gray"
            onClick={() => {
              onMinPriceChange("")
              onMaxPriceChange("")
            }}
          >
            Reset
          </Button>
        ) : null}
      </div>

      <div className="p-4">
        <div className="rounded-[1.2rem] border border-charcoal/6 bg-ivory/72 px-4 py-5">
          <Slider
            min={lowerBound}
            max={upperBound}
            step={step}
            minStepsBetweenThumbs={1}
            value={rangeValue}
            onValueChange={updateRange}
            className="[&_[data-slot=slider-range]]:bg-gold [&_[data-slot=slider-thumb]]:size-5 [&_[data-slot=slider-thumb]]:border-charcoal [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-charcoal/10"
            aria-label="Plage de prix"
          />
          <div className="mt-4 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.12em] text-warm-gray">
            <span>{formatFilterPrice(lowerBound)}</span>
            <span>{formatFilterPrice(upperBound)} {priceSymbol}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
              Min
            </span>
            <Input
              inputMode="numeric"
              min={lowerBound}
              max={upperBound}
              step={step}
              type="number"
              value={minPrice}
              onChange={(event) => updateInput("min", event.target.value)}
              placeholder={`${lowerBound}`}
              className="h-12 rounded-full border-charcoal/10 bg-ivory/80 px-4 text-base shadow-soft"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-warm-gray">
              Max
            </span>
            <Input
              inputMode="numeric"
              min={lowerBound}
              max={upperBound}
              step={step}
              type="number"
              value={maxPrice}
              onChange={(event) => updateInput("max", event.target.value)}
              placeholder={`${upperBound}`}
              className="h-12 rounded-full border-charcoal/10 bg-ivory/80 px-4 text-base shadow-soft"
            />
          </label>
        </div>
      </div>
    </div>
  )
}

function clampPriceValue(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function getPriceStep(min: number, max: number) {
  const range = Math.max(1, max - min)
  if (range >= 100000) return 5000
  if (range >= 20000) return 1000
  if (range >= 5000) return 500
  if (range >= 1000) return 100
  return 50
}

function formatFilterPrice(value: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(value)
}
