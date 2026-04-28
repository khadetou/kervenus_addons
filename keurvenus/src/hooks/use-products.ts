import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getProducts, products } from "@/data/products"
import {
  getOdooFeaturedProducts,
  getOdooProducts,
  getOdooProductsPage,
  getOdooShopFilters,
  getOdooStorefrontConfig,
  publishOdooProduct,
} from "@/lib/odoo-api"
import type { Product } from "@/lib/types"

type ProductFilterOptions = {
  category?: string
  search?: string
  pageSize?: number
  attributeValues?: string[]
  tags?: string[]
  minPrice?: number
  maxPrice?: number
}

export function useProducts(options: ProductFilterOptions = {}) {
  const hasServerFilter = Boolean(
    options.category ||
      options.search ||
      options.attributeValues?.length ||
      options.tags?.length ||
      options.minPrice ||
      options.maxPrice
  )
  return useQuery({
    queryKey: [
      "products",
      "list",
      options.category || "all",
      options.search || "",
      options.pageSize || 96,
      options.attributeValues?.join(",") || "",
      options.tags?.join(",") || "",
      options.minPrice || 0,
      options.maxPrice || 0,
    ],
    queryFn: async () =>
      getOdooProducts(options).catch(async () => {
        const fallback = await getProducts()
        return filterFallbackProducts(fallback, options).slice(0, options.pageSize ?? 96)
      }),
    initialData: hasServerFilter ? undefined : products,
    placeholderData: hasServerFilter ? (previousData) => previousData : undefined,
  })
}

export function useProductsPage(
  page = 1,
  pageSize = 24,
  options: ProductFilterOptions = {},
  queryOptions: { enabled?: boolean } = {}
) {
  return useQuery({
    queryKey: [
      "products",
      "page",
      page,
      pageSize,
      options.category || "all",
      options.search || "",
      options.attributeValues?.join(",") || "",
      options.tags?.join(",") || "",
      options.minPrice || 0,
      options.maxPrice || 0,
    ],
    queryFn: async () =>
      getOdooProductsPage(page, pageSize, options).catch(() => {
        const start = (page - 1) * pageSize
        const filtered = products.filter((product) => {
          const matchesCategory = !options.category || product.categorySlug === options.category
          const matchesSearch = !options.search || `${product.name} ${product.shortDescription} ${product.collection}`
            .toLowerCase()
            .includes(options.search.toLowerCase())
          return matchesCategory && matchesSearch
        })
        const items = filtered.slice(start, start + pageSize)
        return {
          items,
          page,
          pageSize,
          total: filtered.length,
          hasMore: start + pageSize < filtered.length,
        }
      }),
    placeholderData: (previousData) => previousData,
    enabled: queryOptions.enabled ?? true,
  })
}

export function useProductsInfinite(
  pageSize = 24,
  options: ProductFilterOptions = {},
  queryOptions: { enabled?: boolean } = {}
) {
  return useInfiniteQuery({
    queryKey: [
      "products",
      "infinite",
      pageSize,
      options.category || "all",
      options.search || "",
      options.attributeValues?.join(",") || "",
      options.tags?.join(",") || "",
      options.minPrice || 0,
      options.maxPrice || 0,
    ],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) =>
      getOdooProductsPage(Number(pageParam), pageSize, options).catch(() => {
        const page = Number(pageParam) || 1
        const start = (page - 1) * pageSize
        const filtered = filterFallbackProducts(products, options)
        const items = filtered.slice(start, start + pageSize)
        return {
          items,
          page,
          pageSize,
          total: filtered.length,
          hasMore: start + pageSize < filtered.length,
        }
      }),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: queryOptions.enabled ?? true,
  })
}

export function useShopFilters(options: { category?: string; search?: string } = {}) {
  return useQuery({
    queryKey: ["products", "filters", options.category || "all", options.search || ""],
    queryFn: async () => getOdooShopFilters(options),
    placeholderData: (previousData) => previousData,
  })
}

export function useStorefrontConfig() {
  return useQuery({
    queryKey: ["storefront", "config"],
    queryFn: async () =>
      getOdooStorefrontConfig().catch(() => ({
        paginationType: "pagination" as const,
        shopPageSize: 24,
        authMode: "email_password" as const,
        signupEnabled: true,
      })),
    placeholderData: (previousData) => previousData,
  })
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => getOdooFeaturedProducts().catch(() => []),
    placeholderData: (previousData) => previousData,
  })
}

export function usePublishProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ product, published }: { product: Product; published: boolean }) =>
      publishOdooProduct(product, published),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

function filterFallbackProducts(
  list: Product[],
  options: { category?: string; search?: string }
) {
  const search = options.search?.trim().toLowerCase()
  return list.filter((product) => {
    const matchesCategory = !options.category || product.categorySlug === options.category
    const matchesSearch =
      !search ||
      [
        product.name,
        product.category,
        product.collection,
        product.shortDescription,
        product.description,
        ...product.tags,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search)
    return matchesCategory && matchesSearch
  })
}
