import type { InfiniteData } from "@tanstack/react-query"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { getProductBySlug, products } from "@/data/products"
import { getOdooProductBySlug } from "@/lib/odoo-api"
import type { Product } from "@/lib/types"

type ProductPageData = {
  items?: Product[]
}

export function useProduct(slug: string, initialProduct?: Product | null) {
  const queryClient = useQueryClient()
  const fallbackProduct = products.find((product) => product.slug === slug)

  return useQuery({
    queryKey: ["products", slug],
    queryFn: async () => getOdooProductBySlug(slug).catch(() => getProductBySlug(slug)),
    initialData: () =>
      findCachedProduct(queryClient.getQueriesData({ queryKey: ["products"] }), slug) ??
      initialProduct ??
      fallbackProduct,
  })
}

function findCachedProduct(
  queryEntries: Array<[unknown, unknown]>,
  slug: string
): Product | undefined {
  for (const [, data] of queryEntries) {
    const product = findProductInQueryData(data, slug)
    if (product) return product
  }
  return undefined
}

function findProductInQueryData(data: unknown, slug: string): Product | undefined {
  if (!data) return undefined
  if (Array.isArray(data)) {
    return findProductInList(data, slug)
  }

  if (typeof data !== "object") return undefined
  if ((data as Product).slug === slug) return data as Product

  const pageData = data as ProductPageData
  if (Array.isArray(pageData.items)) {
    return findProductInList(pageData.items, slug)
  }

  const infiniteData = data as InfiniteData<ProductPageData>
  if (Array.isArray(infiniteData.pages)) {
    for (const page of infiniteData.pages) {
      const product = Array.isArray(page.items) ? findProductInList(page.items, slug) : undefined
      if (product) return product
    }
  }

  return undefined
}

function findProductInList(list: unknown[], slug: string): Product | undefined {
  return list.find((item): item is Product => {
    if (!item || typeof item !== "object") return false
    return (item as Product).slug === slug
  })
}
