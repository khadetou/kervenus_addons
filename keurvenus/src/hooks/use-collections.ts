import { useQuery } from "@tanstack/react-query"

import { collections, getCollectionBySlug, getCollections } from "@/data/collections"
import { getOdooCollectionBySlug, getOdooCollections } from "@/lib/odoo-api"

export function useCollections() {
  return useQuery({
    queryKey: ["collections"],
    queryFn: async () => getOdooCollections().catch(() => getCollections()),
    placeholderData: (previousData) => previousData,
  })
}

export function useCollection(slug: string) {
  return useQuery({
    queryKey: ["collections", slug],
    queryFn: async () =>
      getOdooCollectionBySlug(slug).catch(() => getCollectionBySlug(slug)),
    initialData:
      collections.find((collection) => collection.slug === slug) ?? null,
  })
}
