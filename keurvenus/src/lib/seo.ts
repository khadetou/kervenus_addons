import type { Product } from "@/lib/types"

const SITE_NAME = "Kër Venus"
const SITE_URL = (import.meta.env.VITE_SITE_URL || "https://www.keurvenus.sn").replace(/\/$/, "")
const DEFAULT_IMAGE = `${SITE_URL}/LOGO.svg`
const DEFAULT_KEYWORDS = [
  "Kër Venus",
  "boutique maison Dakar",
  "vaisselle Dakar",
  "verrerie Dakar",
  "cuisine Dakar",
  "maison Dakar",
  "décoration intérieure Dakar",
]

const CATEGORY_SEO_TARGETS = [
  {
    patterns: ["batteries-de-cuisine", "batterie de cuisine", "batteries de cuisine"],
    name: "Batteries de cuisine",
    title: "Batteries de cuisine à Dakar | Marmites, casseroles et faitouts Kër Venus",
    description:
      "Achetez vos batteries de cuisine à Dakar chez Kër Venus: marmites, casseroles, faitouts, ustensiles et essentiels de cuisson pour une cuisine élégante.",
    keywords: [
      "batterie de cuisine Dakar",
      "batteries de cuisine Dakar",
      "marmites Dakar",
      "casseroles Dakar",
      "faitouts Dakar",
      "ustensiles de cuisine Dakar",
    ],
  },
  {
    patterns: ["verrerie", "verres", "tasses", "carafes"],
    name: "Verrerie",
    title: "Verrerie à Dakar | Verres, tasses et carafes Kër Venus",
    description:
      "Découvrez la verrerie Kër Venus à Dakar: verres, tasses, carafes, pichets et pièces de table pour recevoir avec élégance.",
    keywords: [
      "verrerie Dakar",
      "verres Dakar",
      "tasses Dakar",
      "carafes Dakar",
      "pichets Dakar",
      "art de la table Dakar",
    ],
  },
  {
    patterns: ["cuisine-conservation", "conservation", "boites-a-lunch", "glacieres", "isotherme"],
    name: "Cuisine et conservation",
    title: "Cuisine et conservation à Dakar | Lunch box, glacières et isothermes",
    description:
      "Sélection cuisine et conservation à Dakar: boîtes à lunch, glacières, contenants isothermes et accessoires pratiques Kër Venus.",
    keywords: [
      "conservation cuisine Dakar",
      "lunch box Dakar",
      "glacières Dakar",
      "boîtes à lunch Dakar",
      "isotherme Dakar",
      "accessoires cuisine Dakar",
    ],
  },
  {
    patterns: ["cuisine", "ustensiles", "rangement-organisation"],
    name: "Cuisine",
    title: "Cuisine à Dakar | Accessoires, rangement et ustensiles Kër Venus",
    description:
      "Équipez votre cuisine à Dakar avec Kër Venus: accessoires de cuisine, rangement, organisation, ustensiles et pièces pratiques au style raffiné.",
    keywords: [
      "cuisine Dakar",
      "accessoires cuisine Dakar",
      "ustensiles cuisine Dakar",
      "rangement cuisine Dakar",
      "organisation cuisine Dakar",
      "boutique cuisine Dakar",
    ],
  },
  {
    patterns: ["maison", "poubelles", "rangement"],
    name: "Maison",
    title: "Maison à Dakar | Décoration, rangement et accessoires Kër Venus",
    description:
      "Découvrez l’univers maison Kër Venus à Dakar: décoration intérieure, rangement, poubelles à pédale et accessoires pour un quotidien plus élégant.",
    keywords: [
      "maison Dakar",
      "accessoires maison Dakar",
      "décoration intérieure Dakar",
      "rangement maison Dakar",
      "poubelles à pédale Dakar",
      "boutique maison Dakar",
    ],
  },
]

type SeoOptions = {
  title: string
  description: string
  path?: string
  image?: string
  type?: "website" | "product"
  noindex?: boolean
  keywords?: string[]
  structuredData?: Record<string, unknown>
}

export function storefrontUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function absoluteAssetUrl(value?: string) {
  if (!value) return DEFAULT_IMAGE
  if (/^https?:\/\//i.test(value)) return value
  return storefrontUrl(value)
}

export function cleanSeoText(value?: string, maxLength = 155) {
  const text = (value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trim()}…`
}

export function seoHead({
  title,
  description,
  path = "/",
  image,
  type = "website",
  noindex = false,
  keywords,
  structuredData,
}: SeoOptions) {
  const canonical = storefrontUrl(path)
  const previewImage = absoluteAssetUrl(image)
  const seoKeywords = uniqueKeywords([...(keywords || []), ...DEFAULT_KEYWORDS])
  const meta: Array<Record<string, unknown>> = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: seoKeywords.join(", ") },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "fr_SN" },
    { property: "og:type", content: type },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: canonical },
    { property: "og:image", content: previewImage },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: previewImage },
  ]

  if (noindex) {
    meta.push({ name: "robots", content: "noindex, follow" })
  }
  if (structuredData) {
    meta.push({ "script:ld+json": structuredData })
  }

  return {
    meta,
    links: [{ rel: "canonical", href: canonical }],
  }
}

export function categorySeoFor(category?: {
  name?: string
  slug?: string
  description?: string
  image?: string
}) {
  const key = `${category?.name || ""} ${category?.slug || ""}`.toLowerCase()
  const target = CATEGORY_SEO_TARGETS.find((item) =>
    item.patterns.some((pattern) => key.includes(pattern))
  )
  const categoryName = category?.name || "Boutique"
  const path = category?.slug ? `/shop?category=${encodeURIComponent(category.slug)}` : "/shop"

  if (target) {
    const name = category?.name || target.name
    return {
      name,
      title: target.title,
      description: target.description,
      keywords: target.keywords,
      path,
      image: category?.image,
      structuredData: collectionStructuredData(name, target.description, path),
    }
  }

  const description =
    cleanSeoText(category?.description, 150) ||
    `Découvrez la sélection ${categoryName} Kër Venus à Dakar: pièces maison, vaisselle, cuisine et décoration intérieure.`

  return {
    name: categoryName,
    title: `${categoryName} à Dakar | Boutique Kër Venus`,
    description,
    keywords: [`${categoryName} Dakar`, `acheter ${categoryName} Dakar`, "Kër Venus Dakar"],
    path,
    image: category?.image,
    structuredData: collectionStructuredData(categoryName, description, path),
  }
}

export function shopStructuredData() {
  return collectionStructuredData(
    "Boutique Kër Venus",
    "Vaisselle, verrerie, cuisine, maison et décoration intérieure à Dakar.",
    "/shop"
  )
}

export function productStructuredData(product: Product) {
  const url = storefrontUrl(`/shop/${product.slug}`)
  const image = product.images.map(absoluteAssetUrl).filter(Boolean)

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: cleanSeoText(product.description || product.shortDescription, 500),
    image: image.length ? image : [DEFAULT_IMAGE],
    sku: product.variantId ? String(product.variantId) : product.id,
    brand: {
      "@type": "Brand",
      name: SITE_NAME,
    },
    category: product.category,
    url,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.currency || "XOF",
      price: product.price,
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  }
}

export function organizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_IMAGE,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dakar",
      addressCountry: "SN",
    },
  }
}

function collectionStructuredData(name: string, description: string, path: string) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description,
    url: storefrontUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: DEFAULT_IMAGE,
    },
  }
}

function uniqueKeywords(values: string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean))
  )
}
