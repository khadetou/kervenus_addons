import { createFileRoute } from "@tanstack/react-router"

import { CollectionGrid } from "@/components/sections/collection-grid"
import { getOdooSeo } from "@/lib/odoo-api"
import { applySeoMetadata, seoHead } from "@/lib/seo"

export const Route = createFileRoute("/collections/")({
  loader: async () => getOdooSeo("/collections").catch(() => undefined),
  head: ({ loaderData }) =>
    seoHead(applySeoMetadata({
      title: "Collections maison | Kër Venus",
      description:
        "Parcourez les collections Kër Venus pour trouver des univers maison prêts à habiter: table, cuisine, verrerie, rangement et décoration.",
      path: "/collections",
      image: "/assets/landing/banner-conservation.png",
    }, loaderData)),
  component: CollectionsPage,
})

function CollectionsPage() {
  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <div className="mb-8 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">collections</p>
        <h1 className="mt-3 font-serif text-6xl leading-none md:text-7xl">
          Des univers prêts à habiter.
        </h1>
      </div>
      <CollectionGrid />
    </main>
  )
}
