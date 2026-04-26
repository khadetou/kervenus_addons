import { Link } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Card } from "@/components/ui/card"
import { useCollections } from "@/hooks/use-collections"
import { categoryImageFor, categoryImagePosition } from "@/lib/category-media"
import { landingImageForIndex, landingStoryBanners } from "@/lib/landing-assets"
import { buildCategoryTree } from "@/lib/odoo-api"

export function CategoryShowcase() {
  const { data: collections = [] } = useCollections()
  const odooCategories = buildCategoryTree(collections)
    .filter((category) => category.productCount > 0)
    .slice(0, 5)
  const categories = odooCategories.length
    ? odooCategories
    : landingStoryBanners.map((story, index) => ({
        id: story.categorySlug,
        slug: story.categorySlug,
        name: story.eyebrow,
        description: story.description,
        image: story.src,
        productCount: 1,
        featured: index < 3,
      }))

  return (
    <section className="mx-auto mt-14 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">univers</p>
          <h2 className="font-serif text-5xl leading-none md:text-6xl">Explorez par univers</h2>
        </div>
        <p className="max-w-md text-sm leading-7 text-warm-gray">
          Les familles sont synchronisées avec les catégories publiées:
          table, cuisine, conservation, maison et verrerie.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {categories.map((category, index) => {
          const landingImage = landingImageForIndex(index)
          const image = categoryImageFor(category.name, category.slug, category.image || landingImage.src)
          return (
            <Card
              key={`${category.id}-${category.slug}-${index}`}
              className="group overflow-hidden rounded-[1.8rem] border-white/75 bg-white/70 p-0 shadow-soft transition duration-300 hover:-translate-y-1 hover:shadow-luxury"
            >
              <Link
                to="/shop"
                search={{ category: category.slug }}
                className="relative grid min-h-[330px] content-end overflow-hidden p-6 text-ivory"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(23,23,23,.08), rgba(23,23,23,.62)), url('${image}')`,
                  backgroundSize: "cover",
                  backgroundPosition: categoryImagePosition(category.name, category.slug),
                }}
              >
                <span className="absolute left-5 top-5 grid size-11 place-items-center rounded-full bg-white/18 backdrop-blur transition group-hover:bg-white/26">
                  <AppIcon icon={categoryIcon(category.name)} className="size-5" />
                </span>
                <span className="text-xs uppercase tracking-[0.2em] text-champagne">
                  {category.productCount} pièce{category.productCount > 1 ? "s" : ""}
                </span>
                <strong className="mt-2 font-serif text-3xl leading-none">{category.name}</strong>
              </Link>
            </Card>
          )
        })}
      </div>
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
