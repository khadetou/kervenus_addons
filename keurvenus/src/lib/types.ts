export type Product = {
  id: string
  templateId?: number
  variantId?: number
  wishId?: number
  slug: string
  name: string
  category: string
  categorySlug?: string
  categoryId?: number
  collection: string
  collectionSlug?: string
  categoryLinks?: StorefrontCategoryLink[]
  shortDescription: string
  description: string
  price: number
  compareAtPrice?: number
  currency: string
  images: string[]
  badges: string[]
  material: string
  color: string
  dimensions?: string
  inStock: boolean
  featured: boolean
  isPublished?: boolean
  odooEditUrl?: string
  tags: string[]
}

export type StorefrontCategoryLink = {
  id: number
  slug: string
  name: string
  parentId?: number
  parentSlug?: string
  parentName?: string
}

export type Collection = {
  id: string
  slug: string
  name: string
  description: string
  image: string
  productCount: number
  featured: boolean
  parentId?: number
  parentSlug?: string
  parentName?: string
  sequence?: number
  depth?: number
  children?: Collection[]
}

export type StorefrontFilterOption = {
  id: number | string
  slug: string
  name: string
  count: number
  htmlColor?: string
}

export type StorefrontAttributeFilter = {
  id: number
  name: string
  displayType: string
  values: StorefrontFilterOption[]
}

export type StorefrontPriceFilter = {
  enabled: boolean
  min: number
  max: number
  currency?: {
    id: number
    name: string
    symbol: string
    position: string
  }
}

export type StorefrontFilters = {
  categories: Collection[]
  tags: StorefrontFilterOption[]
  attributes: StorefrontAttributeFilter[]
  price: StorefrontPriceFilter
}

export type StorefrontPaginationType = "pagination" | "infinite_scroll"

export type StorefrontConfig = {
  paginationType: StorefrontPaginationType
  shopPageSize: number
}

export type LookbookItem = {
  id: string
  title: string
  subtitle: string
  image: string
  products: string[]
  mood: string
}

export type NavigationItem = {
  label: string
  href: string
  children?: NavigationItem[]
  featured?: boolean
  count?: number
  description?: string
  image?: string
}

export type SiteContent = {
  announcement: string
  heroTitle: string
  heroSubtitle: string
  story: string
  contactEmail: string
  contactPhone: string
  location: string
}

export type CartLine = {
  lineId?: number
  product: Product
  quantity: number
}

export type PortalLink = {
  key: string
  label: string
  href: string
}

export type PortalPartner = {
  id: number
  name: string
  email?: string | null
  phone?: string | null
  street?: string | null
  street2?: string | null
  zip?: string | null
  city?: string | null
  state_id?: number | null
  country_id?: number | null
  country_name?: string | null
}

export type StorefrontSession = {
  authenticated: boolean
  user: null | {
    id: number
    name: string
    login: string
    is_internal_user?: boolean
    avatar_url?: string
    partner: PortalPartner
  }
  cart_count: number
  wishlist_count: number
  account_on_checkout?: string
  payment_url: string
  portal_url: string
  portal_links?: PortalLink[]
  odoo_base_url?: string
  backoffice_url?: string
  is_internal_user?: boolean
  signup_enabled: boolean
}

export type MoneyPayload = {
  amount: number
  formatted: string
  currency?: {
    id: number
    name: string
    symbol: string
    position: string
  }
}

export type PortalDocumentLine = {
  id: number
  name: string
  quantity?: number
  price_unit?: number
  subtotal?: number
  price_unit_formatted?: string
  subtotal_formatted?: string
}

export type PortalDocument = {
  id: number
  name: string
  date?: string | null
  date_order?: string | null
  invoice_date?: string | null
  due_date?: string | null
  state: string
  payment_state?: string
  amount_total: number
  amount_total_formatted: string
  href?: string
  lines?: PortalDocumentLine[]
}

export type PortalDashboard = {
  session: StorefrontSession
  profile: {
    name: string
    login: string
    partner: PortalPartner
  }
  counters: {
    quotes: number
    orders: number
    invoices: number
    overdue_invoices: number
    wishlist: number
    addresses: number
  }
  recent_quotes: PortalDocument[]
  recent_orders: PortalDocument[]
  recent_invoices: PortalDocument[]
}
