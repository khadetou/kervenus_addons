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
  selectedAttributeValueIds?: number[]
  selectedAttributeSummary?: string
  variants?: ProductVariant[]
  variantOptions?: ProductVariantOptionGroup[]
  tags: string[]
  seo?: SeoMetadata
}

export type ProductVariantAttributeValue = {
  id: number
  attributeId: number
  attributeName: string
  name: string
  displayType?: string
  htmlColor?: string
  image?: string
  priceExtra?: number
  variantIds?: number[]
}

export type ProductVariantOptionGroup = {
  id: number
  name: string
  displayType: string
  values: ProductVariantAttributeValue[]
}

export type ProductVariant = {
  id: string
  templateId?: number
  variantId: number
  name: string
  displayName: string
  defaultCode?: string
  attributeValueIds: number[]
  attributeValues: ProductVariantAttributeValue[]
  attributeSummary: string
  price: number
  compareAtPrice?: number
  currency: string
  images: string[]
  inStock: boolean
  material?: string
  color?: string
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
  seo?: SeoMetadata
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

export type SeoMetadata = {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  path?: string
}

export type CartLine = {
  lineId?: number
  product: Product
  quantity: number
}

export type CartSummary = {
  lines: CartLine[]
  subtotal: number
  delivery: number
  tax: number
  total: number
  itemCount: number
  formatted?: {
    subtotal?: string
    delivery?: string
    tax?: string
    total?: string
  }
}

export type CheckoutDeliveryMethod = {
  id: number
  name: string
  description?: string
  price: number
  price_formatted?: string
  selected?: boolean
  is_pickup?: boolean
  allows_cash_on_delivery?: boolean
  invoice_policy?: string
  available?: boolean
  message?: string
}

export type CheckoutPaymentMethod = {
  id: string
  provider_id?: number
  provider_name?: string
  provider_code?: string
  method_id?: number
  name: string
  code?: string
  flow?: "offline" | "redirect" | string
  available: boolean
  label?: string
}

export type CheckoutSettings = {
  account_on_checkout?: "optional" | "disabled" | "mandatory" | string
  guest_checkout?: boolean
  ecommerce_access?: string
  add_to_cart_action?: string
  show_line_subtotals_tax_selection?: string
  invoice_policy?: "order" | "delivery" | string
  invoice_on_confirmation?: boolean
  automatic_invoice?: boolean
  portal_payment_enabled?: boolean
  order_lines_invoice_on_order?: boolean
}

export type CheckoutState = {
  authenticated: boolean
  login_url: string
  signup_url: string
  cart: CartSummary
  customer?: CheckoutSubmitPayload["customer"]
  requires_shipping_address?: boolean
  delivery_methods: CheckoutDeliveryMethod[]
  payment_methods: CheckoutPaymentMethod[]
  coming_soon_payment_methods?: CheckoutPaymentMethod[]
  selected_delivery_method_id?: number | false
  selected_payment_method_id?: string | false
  account_on_checkout?: string
  settings?: CheckoutSettings
}

export type CheckoutSubmitPayload = {
  delivery_method_id?: number
  payment_method_id?: string
  customer: {
    first_name?: string
    last_name?: string
    name?: string
    email?: string
    phone?: string
    address?: string
    street?: string
    city?: string
  }
}

export type CheckoutOrderResult = {
  id: number
  name: string
  state: string
  amount_total: number
  amount_total_formatted?: string
  payment_method?: CheckoutPaymentMethod
  portal_url?: string
  invoice?: {
    id?: number | false
    name?: string
    state?: string
    payment_state?: string
    portal_url?: string
  }
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
  product_id?: number | false
  template_id?: number | false
  slug?: string
  image_url?: string
}

export type PortalRelatedDocument = {
  id: number
  name: string
  date?: string | null
  state?: string
  payment_state?: string
  amount_total_formatted?: string
  amount_due_formatted?: string
  href?: string
  download_url?: string
  type?: "order" | "quote" | "invoice" | string
}

export type PortalShipment = {
  id: number
  name: string
  state: string
  state_label?: string
  scheduled_date?: string | null
  date_done?: string | null
}

export type PortalUserSummary = {
  id?: number | false
  name?: string
  email?: string
  phone?: string
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
  invoice_status?: string
  payment_reference?: string
  invoice_origin?: string
  amount_total: number
  amount_total_formatted: string
  amount_due?: number
  amount_due_formatted?: string
  amount_untaxed?: number
  amount_tax?: number
  amount_untaxed_formatted?: string
  amount_tax_formatted?: string
  href?: string
  odoo_portal_url?: string
  preview_url?: string
  download_url?: string
  partner?: PortalPartner
  invoice_partner?: PortalPartner
  shipping_partner?: PortalPartner
  salesperson?: PortalUserSummary
  delivery?: {
    carrier?: string
    amount?: number
    amount_formatted?: string
  }
  delivery_status?: {
    state?: string
    label?: string
  }
  lines?: PortalDocumentLine[]
  related_invoices?: PortalRelatedDocument[]
  related_orders?: PortalRelatedDocument[]
  shipments?: PortalShipment[]
  type?: "order" | "quote" | "invoice" | string
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
