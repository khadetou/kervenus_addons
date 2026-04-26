import { Link } from "@tanstack/react-router"

import { Card } from "@/components/ui/card"
import { useCollections } from "@/hooks/use-collections"

export function CollectionGrid() {
  const { data: collections = [] } = useCollections()

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {collections.map((collection) => (
        <Card
          key={collection.id}
          className="overflow-hidden rounded-[2rem] border-white/75 bg-white/70 p-0 shadow-soft"
        >
          <Link to="/collections/$slug" params={{ slug: collection.slug }} className="block">
            <div className="min-h-[360px] bg-cover bg-center p-5 text-ivory" style={{ backgroundImage: `linear-gradient(180deg, rgba(23,23,23,.08), rgba(23,23,23,.68)), url('${collection.image}')` }}>
              <span className="rounded-full bg-white/16 px-3 py-1 text-xs uppercase tracking-[0.18em] backdrop-blur">
                {collection.productCount} pièces
              </span>
              <div className="mt-56">
                <h2 className="font-serif text-4xl leading-none">{collection.name}</h2>
                <p className="mt-3 text-sm leading-6 text-ivory/80">{collection.description}</p>
              </div>
            </div>
          </Link>
        </Card>
      ))}
    </div>
  )
}
