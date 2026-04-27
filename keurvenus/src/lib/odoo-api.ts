import { collections as fallbackCollections, products as fallbackProducts } from "@/data/site-content"
import { categoryImageFor } from "@/lib/category-media"
import type {
  CartLine,
  CartSummary,
  CheckoutOrderResult,
  CheckoutState,
  CheckoutSubmitPayload,
  Collection,
  NavigationItem,
  PortalDashboard,
  PortalDocument,
  Product,
  ProductVariant,
  ProductVariantAttributeValue,
  ProductVariantOptionGroup,
  StorefrontConfig,
  StorefrontFilters,
  StorefrontSession,
  SeoMetadata,
} from "@/lib/types"

const API_PREFIX = "/api/keurvenus/storefront"
const directOdooBase = (import.meta.env.VITE_ODOO_API_BASE_URL || "").replace(/\/$/, "")
const serverOdooBase = (
  typeof window === "undefined" ? process.env.ODOO_PROXY_TARGET || "http://127.0.0.1:8069" : ""
).replace(/\/$/, "")
const proxiedApiBase = (
  import.meta.env.VITE_ODOO_API_BASE || "/api/odoo/keurvenus/storefront"
).replace(/\/$/, "")
const webBase = (
  import.meta.env.VITE_ODOO_WEB_BASE_URL ||
  (directOdooBase ? directOdooBase : "/odoo")
).replace(/\/$/, "")

export class OdooApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "OdooApiError"
    this.status = status
  }
}

type OdooProductPayload = Record<string, any>
type OdooCollectionPayload = Record<string, any>
type OdooCartPayload = Record<string, any>
type ProductQueryOptions = {
  category?: string
  search?: string
  pageSize?: number
  attributeValues?: string[]
  tags?: string[]
  minPrice?: number
  maxPrice?: number
}

function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  if (directOdooBase) return `${directOdooBase}${API_PREFIX}${normalizedPath}`
  if (serverOdooBase) return `${serverOdooBase}${API_PREFIX}${normalizedPath}`
  return `${proxiedApiBase}${normalizedPath}`
}

function normalizeAssetUrl(value?: string | null) {
  if (!value) return ""
  if (value.startsWith("http") || value.startsWith("data:")) return value
  if (value.startsWith("/odoo/")) return value
  return `${webBase}${value.startsWith("/") ? value : `/${value}`}`
}

function normalizeOdooUrl(value?: string | null) {
  if (!value) return ""
  if (value.startsWith("http")) return value
  if (value.startsWith("/odoo/")) return value
  return `${webBase}${value.startsWith("/") ? value : `/${value}`}`
}

function cleanHtmlText(value?: string | null) {
  if (!value) return undefined
  return value.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
}

function mapSeo(payload?: Record<string, any> | null): SeoMetadata | undefined {
  if (!payload) return undefined
  const keywords = Array.isArray(payload.keywords)
    ? payload.keywords
    : String(payload.keywords || "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean)
  return {
    title: payload.title || undefined,
    description: payload.description || undefined,
    keywords,
    image: normalizeAssetUrl(payload.image || payload.image_url || ""),
    path: payload.path || payload.canonical_path || undefined,
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new OdooApiError(payload.error || "La requête boutique a échoué.", response.status)
  }
  return payload as T
}

function priceAmount(item: OdooProductPayload) {
  return Number(item.price?.amount ?? item.price ?? 0)
}

function currencyName(item: OdooProductPayload) {
  return item.price?.currency?.name || "XOF"
}

function compareAtAmount(item: OdooProductPayload) {
  const compareAtPrice = Number(item.price?.compare_amount || 0)
  return compareAtPrice > 0 ? compareAtPrice : undefined
}

function categoryHref(category: Pick<Collection, "slug">) {
  return `/shop?category=${encodeURIComponent(category.slug)}`
}

function mapGalleryImages(item: OdooProductPayload) {
  const galleryImages = Array.isArray(item.gallery)
    ? item.gallery.map((image: Record<string, any>) => normalizeAssetUrl(image.image_url)).filter(Boolean)
    : []
  return galleryImages.length ? galleryImages : [normalizeAssetUrl(item.image_url)].filter(Boolean)
}

function mapVariantValue(item: Record<string, any>): ProductVariantAttributeValue {
  return {
    id: Number(item.id || 0),
    attributeId: Number(item.attribute_id || item.attributeId || 0),
    attributeName: item.attribute_name || item.attributeName || "Option",
    name: item.name || "Option",
    displayType: item.display_type || item.displayType || undefined,
    htmlColor: item.html_color || item.htmlColor || undefined,
    image: normalizeAssetUrl(item.image_url || item.image || ""),
    priceExtra: Number(item.price_extra || item.priceExtra || 0),
    variantIds: Array.isArray(item.variant_ids)
      ? item.variant_ids.map((id: unknown) => Number(id)).filter(Boolean)
      : undefined,
  }
}

function mapOdooVariant(item: OdooProductPayload, fallback: Product): ProductVariant {
  const attributeValues = Array.isArray(item.attribute_values)
    ? item.attribute_values.map(mapVariantValue).filter((value) => value.id)
    : []
  const images = mapGalleryImages(item)
  const compareAtPrice = compareAtAmount(item)
  const colorValue = attributeValues.find((value) =>
    /couleur|color/i.test(value.attributeName)
  )
  const materialValue = attributeValues.find((value) =>
    /mati[eè]re|material/i.test(value.attributeName)
  )
  const variantId = Number(item.product_id ?? item.variant_id ?? item.id ?? 0)

  return {
    id: String(variantId || item.id || item.display_name || item.name),
    templateId: Number(item.template_id || fallback.templateId || 0) || undefined,
    variantId,
    name: item.name || item.display_name || fallback.name,
    displayName: item.display_name || item.name || fallback.name,
    defaultCode: item.default_code || undefined,
    attributeValueIds: Array.isArray(item.attribute_value_ids)
      ? item.attribute_value_ids.map((id: unknown) => Number(id)).filter(Boolean)
      : attributeValues.map((value) => value.id),
    attributeValues,
    attributeSummary: attributeValues.map((value) => value.name).filter(Boolean).join(" · "),
    price: priceAmount(item),
    compareAtPrice,
    currency: currencyName(item) || fallback.currency,
    images: images.length ? images : fallback.images,
    inStock: Boolean(
      item.is_combination_possible !== false &&
        (item.allow_out_of_stock_order || Number(item.free_qty || item.qty_available || 0) > 0)
    ),
    material: materialValue?.name || fallback.material,
    color: colorValue?.name || fallback.color,
  }
}

function mapVariantOptions(item: OdooProductPayload): ProductVariantOptionGroup[] {
  if (!Array.isArray(item.variant_options)) return []
  return item.variant_options
    .map((group: Record<string, any>) => ({
      id: Number(group.id || 0),
      name: group.name || "Option",
      displayType: group.display_type || group.displayType || "radio",
      values: Array.isArray(group.values)
        ? group.values.map(mapVariantValue).filter((value) => value.id)
        : [],
    }))
    .filter((group) => group.id && group.values.length)
}

export function mapOdooProduct(item: OdooProductPayload): Product {
  const templateId = Number(item.template_id ?? item.id ?? item.selected_combination?.template_id ?? 0)
  const variantId = Number(item.product_id ?? item.variant_id ?? item.selected_combination?.product_id ?? 0)
  const category = item.category?.name || item.category || "Maison"
  const collection = item.category?.parent_name || item.collection || item.ribbon || "Kër Venus"
  const categoryLinks = Array.isArray(item.categories)
    ? item.categories.map((categoryItem: Record<string, any>) => ({
        id: Number(categoryItem.id),
        slug: categoryItem.slug || String(categoryItem.id),
        name: categoryItem.name || "Categorie",
        parentId: categoryItem.parent_id ? Number(categoryItem.parent_id) : undefined,
        parentSlug: categoryItem.parent_slug || undefined,
        parentName: categoryItem.parent_name || undefined,
      }))
    : []
  const images = mapGalleryImages(item)
  const compareAtPrice = compareAtAmount(item)
  const badges = [
    item.ribbon,
    item.price?.discounted ? "Offre" : null,
    item.in_wishlist ? "Favori" : null,
  ].filter(Boolean) as string[]

  const productTags = Array.isArray(item.tags)
    ? item.tags.map((tag: Record<string, any>) => tag.name || tag.slug).filter(Boolean)
    : []
  const selectedCombination = item.selected_combination || {}

  const product: Product = {
    id: String(templateId || variantId || item.slug || item.name),
    templateId: templateId || undefined,
    variantId: variantId || undefined,
    wishId: item.wish_id ? Number(item.wish_id) : undefined,
    slug: item.slug || String(templateId || variantId),
    name: item.name || "Produit Kër Venus",
    category,
    categorySlug: item.category?.slug || categoryLinks[0]?.slug,
    categoryId: item.category?.id ? Number(item.category.id) : categoryLinks[0]?.id,
    collection,
    collectionSlug: item.category?.parent_slug || categoryLinks[0]?.parentSlug,
    categoryLinks,
    shortDescription: item.subtitle || item.shortDescription || category,
    description: item.description_plain || item.subtitle || item.description || "Sélection raffinée Kër Venus.",
    price: priceAmount(item),
    compareAtPrice,
    currency: currencyName(item),
    images: images.length ? images : fallbackProducts[0]?.images || [],
    badges: badges.length ? badges : [category],
    material: item.material || "Sélection premium",
    color: item.color || "Tons naturels",
    dimensions: item.dimensions || undefined,
    inStock: Boolean(item.allow_out_of_stock_order || Number(item.free_qty || item.qty_available || 0) > 0),
    featured: Boolean(item.featured || item.ribbon || item.price?.discounted),
    isPublished: Boolean(item.is_published ?? item.published ?? true),
    odooEditUrl: normalizeAssetUrl(item.odoo_edit_url),
    selectedAttributeValueIds: Array.isArray(selectedCombination.attribute_value_ids)
      ? selectedCombination.attribute_value_ids.map((id: unknown) => Number(id)).filter(Boolean)
      : undefined,
    selectedAttributeSummary: selectedCombination.attribute_summary || undefined,
    variantOptions: mapVariantOptions(item),
    tags: [category, collection, item.ribbon, ...productTags].filter(Boolean),
    seo: mapSeo(item.seo),
  }
  const variants = Array.isArray(item.variants)
    ? item.variants.map((variantItem: OdooProductPayload) => mapOdooVariant(variantItem, product))
    : []
  product.variants = variants

  const selectedVariant =
    variants.find((variant) => variant.variantId === variantId) ||
    variants.find((variant) => variant.variantId === Number(selectedCombination.product_id))
  if (selectedVariant) {
    product.variantId = selectedVariant.variantId
    product.selectedAttributeValueIds = selectedVariant.attributeValueIds
    product.selectedAttributeSummary = selectedVariant.attributeSummary
  }

  return product
}

function mapPortalDocument(item: PortalDocument): PortalDocument {
  return {
    ...item,
    preview_url: normalizeOdooUrl(item.preview_url),
    download_url: normalizeOdooUrl(item.download_url),
    odoo_portal_url: normalizeOdooUrl(item.odoo_portal_url),
    related_invoices: item.related_invoices?.map((invoice) => ({
      ...invoice,
      download_url: normalizeOdooUrl(invoice.download_url),
    })),
    lines: item.lines?.map((line) => ({
      ...line,
      image_url: normalizeAssetUrl(line.image_url || ""),
    })),
  }
}

function mapOdooCollection(item: OdooCollectionPayload, index: number): Collection {
  const slug = item.slug || String(item.id || index)
  const name = item.name || "Collection"
  const fallbackImage =
    normalizeAssetUrl(item.image_url) || fallbackCollections[index % fallbackCollections.length]?.image || ""

  return {
    id: String(item.id || item.slug || index),
    slug,
    name,
    description:
      item.description ||
      item.eyebrow ||
      "Une sélection Kër Venus pensée pour composer une maison élégante.",
    image: categoryImageFor(name, slug, fallbackImage),
    productCount: Number(item.product_count ?? item.count ?? 0),
    featured: Boolean(item.featured ?? index < 6),
    parentId: item.parent_id ? Number(item.parent_id) : undefined,
    parentSlug: item.parent_slug || undefined,
    parentName: item.parent_name || undefined,
    sequence: Number(item.sequence ?? index),
    depth: Number(item.depth ?? (item.parent_id ? 1 : 0)),
    seo: mapSeo(item.seo),
  }
}

function mapOdooFilters(payload: Record<string, any>): StorefrontFilters {
  const categories = Array.isArray(payload.categories)
    ? payload.categories.map(mapOdooCollection)
    : []
  const tags = Array.isArray(payload.tags)
    ? payload.tags.map((tag: Record<string, any>) => ({
        id: Number(tag.id || 0),
        slug: tag.slug || String(tag.id || tag.name),
        name: tag.name || "Tag",
        count: Number(tag.count || 0),
      }))
    : []
  const attributes = Array.isArray(payload.attributes)
    ? payload.attributes.map((attribute: Record<string, any>) => ({
        id: Number(attribute.id || 0),
        name: attribute.name || "Attribut",
        displayType: attribute.display_type || "radio",
        values: Array.isArray(attribute.values)
          ? attribute.values.map((value: Record<string, any>) => ({
              id: Number(value.id || 0),
              slug: value.slug || `${attribute.id}-${value.id}`,
              name: value.name || "Valeur",
              count: Number(value.count || 0),
              htmlColor: value.html_color || undefined,
            }))
          : [],
      }))
    : []
  return {
    categories,
    tags,
    attributes,
    price: {
      enabled: Boolean(payload.price?.enabled),
      min: Number(payload.price?.min || 0),
      max: Number(payload.price?.max || 0),
      currency: payload.price?.currency,
    },
  }
}

function mapOdooConfig(payload: Record<string, any>): StorefrontConfig {
  const config = payload.config || payload
  const paginationType =
    config.pagination_type === "infinite_scroll" ? "infinite_scroll" : "pagination"
  return {
    paginationType,
    shopPageSize: Math.max(1, Number(config.page_size || config.shop_page_size || 24)),
  }
}

function appendProductFilters(search: URLSearchParams, options: ProductQueryOptions) {
  if (options.attributeValues?.length) {
    search.set("attribute_values", options.attributeValues.join(","))
  }
  if (options.tags?.length) {
    search.set("tags", options.tags.join(","))
  }
  if (typeof options.minPrice === "number" && options.minPrice > 0) {
    search.set("min_price", String(options.minPrice))
  }
  if (typeof options.maxPrice === "number" && options.maxPrice > 0) {
    search.set("max_price", String(options.maxPrice))
  }
}

export function buildCategoryTree(collections: Collection[]) {
  const byId = new Map(collections.map((collection) => [String(collection.id), { ...collection, children: [] as Collection[] }]))
  const roots: Collection[] = []

  for (const collection of byId.values()) {
    const parentKey = collection.parentId ? String(collection.parentId) : ""
    if (parentKey && byId.has(parentKey)) {
      byId.get(parentKey)?.children?.push(collection)
    } else {
      roots.push(collection)
    }
  }

  const sortBySequence = (items: Collection[]) => {
    items.sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0) || a.name.localeCompare(b.name))
    items.forEach((item) => sortBySequence(item.children || []))
  }
  sortBySequence(roots)

  return roots
}

export function buildNavigationFromCategories(collections: Collection[]): NavigationItem[] {
  const roots = buildCategoryTree(collections)
  const featuredRoots = roots.slice(0, 6)

  return [
    ...featuredRoots.map((category) => ({
      label: category.name,
      href: categoryHref(category),
      featured: true,
      count: category.productCount,
      description: category.description,
      image: category.image,
      children: (category.children || [])
        .slice(0, 8)
        .map((child) => ({
          label: child.name,
          href: categoryHref(child),
          count: child.productCount,
          description: child.description,
          image: child.image,
          children: (child.children || [])
            .slice(0, 6)
            .map((nested) => ({
              label: nested.name,
              href: categoryHref(nested),
              count: nested.productCount,
              description: nested.description,
              image: nested.image,
            })),
        })),
    })),
    ...(featuredRoots.length
      ? []
      : [
          {
            label: "Boutique",
            href: "/shop",
            featured: true,
          },
        ]),
    { label: "À propos", href: "/about" },
    { label: "Contact", href: "/contact" },
  ]
}

export function mapOdooCart(cart: OdooCartPayload | null | undefined): CartSummary {
  if (!cart) {
    return { lines: [], subtotal: 0, delivery: 0, tax: 0, total: 0, itemCount: 0 }
  }
  const lines = (cart.lines || []).map((line: Record<string, any>) => ({
    lineId: Number(line.id),
    quantity: Number(line.quantity || 0),
    product: mapOdooProduct({
      id: line.template_id,
      template_id: line.template_id,
      product_id: line.product_id,
      slug: line.slug,
      name: line.name,
      subtitle: (line.variant_values || []).join(" · "),
      image_url: line.image_url,
      price: line.price || { amount: line.price_unit, currency: cart.currency },
      category: "Kër Venus",
      allow_out_of_stock_order: true,
      free_qty: 1,
    }),
  }))

  return {
    lines,
    subtotal: Number(cart.amount_untaxed ?? cart.amount_total ?? 0),
    delivery: Number(cart.amount_delivery ?? 0),
    tax: Number(cart.amount_tax ?? 0),
    total: Number(cart.amount_total ?? cart.amount_untaxed ?? 0),
    itemCount: Number(cart.items_count ?? lines.reduce((total: number, line: CartLine) => total + line.quantity, 0)),
    formatted: {
      subtotal: cleanHtmlText(cart.amount_untaxed_formatted),
      delivery: cleanHtmlText(cart.amount_delivery_formatted),
      tax: cleanHtmlText(cart.amount_tax_formatted),
      total: cleanHtmlText(cart.amount_total_formatted),
    },
  }
}

function mapOdooCheckout(payload: Record<string, any>): CheckoutState {
  const deliveryMethods = Array.isArray(payload.delivery_methods) ? payload.delivery_methods : []
  const paymentMethods = Array.isArray(payload.payment_methods) ? payload.payment_methods : []
  const comingSoonPaymentMethods = Array.isArray(payload.coming_soon_payment_methods)
    ? payload.coming_soon_payment_methods
    : []

  return {
    authenticated: Boolean(payload.authenticated),
    login_url: payload.login_url || "/login?redirect=/checkout",
    signup_url: payload.signup_url || "/register?redirect=/checkout",
    cart: mapOdooCart(payload.cart),
    delivery_methods: deliveryMethods.map((method: Record<string, any>) => ({
      ...method,
      id: Number(method.id),
      name: cleanHtmlText(method.name) || method.name,
      description: cleanHtmlText(method.description) || "",
      price: Number(method.price || 0),
      price_formatted: cleanHtmlText(method.price_formatted),
      message: cleanHtmlText(method.message) || "",
    })),
    payment_methods: paymentMethods.map((method: Record<string, any>) => ({
      ...method,
      id: String(method.id),
      provider_name: cleanHtmlText(method.provider_name) || method.provider_name,
      name: cleanHtmlText(method.name) || method.name,
      label: cleanHtmlText(method.label) || method.label,
      available: method.available !== false,
    })),
    coming_soon_payment_methods: comingSoonPaymentMethods.map((method: Record<string, any>) => ({
      ...method,
      id: String(method.id),
      name: cleanHtmlText(method.name) || method.name,
      label: cleanHtmlText(method.label) || method.label,
      available: method.available === true,
    })),
    selected_delivery_method_id: payload.selected_delivery_method_id || false,
    selected_payment_method_id: payload.selected_payment_method_id || false,
    account_on_checkout: payload.account_on_checkout,
    settings: payload.settings || {},
  }
}

function mapOdooCheckoutOrderResult(order: Record<string, any>): CheckoutOrderResult {
  const paymentMethod = order.payment_method
    ? {
        ...order.payment_method,
        id: String(order.payment_method.id),
        provider_name: cleanHtmlText(order.payment_method.provider_name) || order.payment_method.provider_name,
        name: cleanHtmlText(order.payment_method.name) || order.payment_method.name,
        label: cleanHtmlText(order.payment_method.label) || order.payment_method.label,
        available: order.payment_method.available !== false,
      }
    : undefined
  return {
    ...order,
    id: Number(order.id || 0),
    name: String(order.name || ""),
    state: String(order.state || ""),
    amount_total: Number(order.amount_total || 0),
    amount_total_formatted: cleanHtmlText(order.amount_total_formatted),
    payment_method: paymentMethod,
    invoice: order.invoice
      ? {
          ...order.invoice,
          name: cleanHtmlText(order.invoice.name) || order.invoice.name,
          state: cleanHtmlText(order.invoice.state) || order.invoice.state,
          payment_state: cleanHtmlText(order.invoice.payment_state) || order.invoice.payment_state,
        }
      : undefined,
  }
}

export async function getOdooSession() {
  return (await requestJson<{ session: StorefrontSession }>("/session")).session
}

export async function logoutOdoo() {
  return requestJson<{ ok: boolean; session: StorefrontSession }>("/session/logout", {
    method: "POST",
    body: JSON.stringify({}),
  })
}

export async function loginWithOdoo(login: string, password: string) {
  const payload = await requestJson<{ session: StorefrontSession }>("/session/login", {
    method: "POST",
    body: JSON.stringify({ login, password }),
  })
  return payload.session
}

export async function signupWithOdoo(data: {
  name: string
  login: string
  password: string
  confirm_password: string
  redirect?: string
}) {
  return requestJson<{ ok: boolean; redirect_url?: string }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function requestOdooPasswordReset(login: string) {
  return requestJson<{ ok: boolean; message?: string }>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ login }),
  })
}

export async function confirmOdooPasswordReset(data: {
  token: string
  password: string
  confirm_password: string
}) {
  return requestJson<{ ok: boolean; message?: string }>("/auth/reset-password/confirm", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getOdooProducts(options: ProductQueryOptions = {}) {
  const search = new URLSearchParams({
    page_size: String(options.pageSize ?? 96),
  })
  if (options.category) search.set("category", options.category)
  if (options.search) search.set("search", options.search)
  appendProductFilters(search, options)
  const payload = await requestJson<{ items: OdooProductPayload[] }>(`/products?${search.toString()}`)
  return payload.items.map(mapOdooProduct)
}

export async function getOdooProductsPage(
  page = 1,
  pageSize = 24,
  options: ProductQueryOptions = {}
) {
  const search = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  })
  if (options.category) search.set("category", options.category)
  if (options.search) search.set("search", options.search)
  appendProductFilters(search, options)
  const payload = await requestJson<{
    items: OdooProductPayload[]
    page?: number
    page_size?: number
    total?: number
    has_more?: boolean
    config?: Record<string, any>
  }>(`/products?${search.toString()}`)

  return {
    items: payload.items.map(mapOdooProduct),
    page: Number(payload.page ?? page),
    pageSize: Number(payload.page_size ?? pageSize),
    total: Number(payload.total ?? payload.items.length),
    hasMore: Boolean(payload.has_more),
    config: payload.config ? mapOdooConfig(payload.config) : undefined,
  }
}

export async function getOdooStorefrontConfig() {
  const payload = await requestJson<Record<string, any>>("/config")
  return mapOdooConfig(payload)
}

export async function getOdooSeo(path = "/") {
  const search = new URLSearchParams({ path })
  const payload = await requestJson<{ seo?: Record<string, any> }>(`/seo?${search.toString()}`)
  return mapSeo(payload.seo)
}

export async function getOdooShopFilters(options: { category?: string; search?: string } = {}) {
  const search = new URLSearchParams()
  if (options.category) search.set("category", options.category)
  if (options.search) search.set("search", options.search)
  const payload = await requestJson<Record<string, any>>(`/filters?${search.toString()}`)
  return mapOdooFilters(payload)
}

export async function getOdooFeaturedProducts() {
  const payload = await requestJson<{ featured_products?: OdooProductPayload[] }>("/home")
  return (payload.featured_products || []).map((item) => ({ ...mapOdooProduct(item), featured: true }))
}

export async function getOdooProductBySlug(slug: string) {
  const payload = await requestJson<{ item: OdooProductPayload }>(`/products/${slug}`)
  return mapOdooProduct(payload.item)
}

export async function publishOdooProduct(product: Product, published: boolean) {
  const payload = await requestJson<{ item: OdooProductPayload }>(
    `/products/${product.slug}/publish`,
    {
      method: "POST",
      body: JSON.stringify({ published }),
    }
  )
  return mapOdooProduct(payload.item)
}

export async function getOdooCollections() {
  const payload = await requestJson<{ items: OdooCollectionPayload[] }>("/categories")
  return payload.items.map(mapOdooCollection)
}

export async function getOdooNavigation() {
  const collections = await getOdooCollections()
  return buildNavigationFromCategories(collections)
}

export async function getOdooCollectionBySlug(slug: string) {
  const collections = await getOdooCollections()
  return collections.find((collection) => collection.slug === slug) ?? null
}

export async function getOdooCart() {
  const payload = await requestJson<{ cart: OdooCartPayload }>("/cart")
  return mapOdooCart(payload.cart)
}

export async function addOdooCartLine(product: Product, quantity = 1) {
  if (!product.variantId) throw new OdooApiError("Product variant is not available.", 400)
  const payload = await requestJson<{ cart: OdooCartPayload }>("/cart/add", {
    method: "POST",
    body: JSON.stringify({
      product_id: product.variantId,
      product_template_id: product.templateId,
      quantity,
    }),
  })
  return mapOdooCart(payload.cart)
}

export async function updateOdooCartLine(lineId: number, quantity: number) {
  const payload = await requestJson<{ cart: OdooCartPayload }>("/cart/update", {
    method: "POST",
    body: JSON.stringify({ line_id: lineId, quantity }),
  })
  return mapOdooCart(payload.cart)
}

export async function getOdooCheckout() {
  const payload = await requestJson<{ checkout: Record<string, any> }>("/checkout")
  return mapOdooCheckout(payload.checkout)
}

export async function submitOdooCheckout(data: CheckoutSubmitPayload) {
  const payload = await requestJson<{ order: Record<string, any> }>("/checkout/submit", {
    method: "POST",
    body: JSON.stringify(data),
  })
  return mapOdooCheckoutOrderResult(payload.order)
}

export async function getOdooWishlist() {
  const payload = await requestJson<{ items: OdooProductPayload[] }>("/wishlist")
  return payload.items.map(mapOdooProduct)
}

export async function addOdooWishlistItem(product: Product) {
  if (!product.variantId) throw new OdooApiError("Product variant is not available.", 400)
  const payload = await requestJson<{ item: OdooProductPayload }>("/wishlist/add", {
    method: "POST",
    body: JSON.stringify({ product_id: product.variantId }),
  })
  return mapOdooProduct(payload.item)
}

export async function removeOdooWishlistItem(wishId: number) {
  return requestJson<{ ok: boolean }>("/wishlist/remove", {
    method: "POST",
    body: JSON.stringify({ wish_id: wishId }),
  })
}

export async function getPortalDashboard() {
  const payload = await requestJson<PortalDashboard>("/portal")
  return {
    ...payload,
    recent_quotes: payload.recent_quotes.map(mapPortalDocument),
    recent_orders: payload.recent_orders.map(mapPortalDocument),
    recent_invoices: payload.recent_invoices.map(mapPortalDocument),
  }
}

export async function getPortalOrders() {
  const payload = await requestJson<{ items: PortalDocument[] }>("/portal/orders?page_size=12")
  return payload.items.map(mapPortalDocument)
}

export async function getPortalOrder(id: number | string) {
  const payload = await requestJson<{ item: PortalDocument }>(`/portal/orders/${id}`)
  return mapPortalDocument(payload.item)
}

export async function getPortalQuotes() {
  const payload = await requestJson<{ items: PortalDocument[] }>("/portal/quotes?page_size=12")
  return payload.items.map(mapPortalDocument)
}

export async function getPortalQuote(id: number | string) {
  const payload = await requestJson<{ item: PortalDocument }>(`/portal/quotes/${id}`)
  return mapPortalDocument(payload.item)
}

export async function getPortalInvoices() {
  const payload = await requestJson<{ items: PortalDocument[] }>("/portal/invoices?page_size=12")
  return payload.items.map(mapPortalDocument)
}

export async function getPortalInvoice(id: number | string) {
  const payload = await requestJson<{ item: PortalDocument }>(`/portal/invoices/${id}`)
  return mapPortalDocument(payload.item)
}

export function getOdooLoginUrl(redirect = "/portal") {
  const target = encodeURIComponent(redirect)
  return `${webBase}/web/login?redirect=${target}`
}

export function getOdooSignupUrl(redirect = "/portal") {
  const target = encodeURIComponent(redirect)
  return `/register?redirect=${target}`
}

export function getOdooResetPasswordUrl(redirect = "/portal") {
  const target = encodeURIComponent(redirect)
  return `/reset-password?redirect=${target}`
}
