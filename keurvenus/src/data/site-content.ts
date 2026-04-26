import type {
  Collection,
  LookbookItem,
  NavigationItem,
  Product,
  SiteContent,
} from "@/lib/types"

const image = (id: string, width = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`

export const navigation: NavigationItem[] = [
  {
    label: "Art de la table",
    href: "/shop?category=art-de-la-table-1",
    featured: true,
    count: 65,
    children: [
      { label: "Bols & saladiers", href: "/shop?category=bols-saladiers-2" },
      { label: "Carafes & thermos", href: "/shop?category=carafes-thermos-3" },
      { label: "Couverts", href: "/shop?category=couverts-5" },
      { label: "Services de table", href: "/shop?category=services-de-table-8" },
    ],
  },
  {
    label: "Cuisine",
    href: "/shop?category=cuisine-10",
    featured: true,
    count: 12,
    children: [
      { label: "Batteries de cuisine", href: "/shop?category=batteries-de-cuisine-11" },
      { label: "Couteaux & ustensiles", href: "/shop?category=couteaux-ustensiles-12" },
      { label: "Rangement", href: "/shop?category=rangement-organisationn-13" },
    ],
  },
  {
    label: "Cuisine & conservation",
    href: "/shop?category=cuisine-conservation-14",
    featured: true,
    count: 18,
    children: [
      { label: "Boîtes à lunch", href: "/shop?category=boites-a-lunch-15" },
      { label: "Glacières", href: "/shop?category=glacieres-isothermes-16" },
      { label: "Isotherme & chauffe-plats", href: "/shop?category=isotherme-chauffe-plats-17" },
    ],
  },
  {
    label: "Maison",
    href: "/shop?category=maison-18",
    featured: true,
    count: 2,
    children: [{ label: "Poubelles à pédale", href: "/shop?category=poubelles-a-pedale-19" }],
  },
  {
    label: "Verrerie",
    href: "/shop?category=verrerie-23",
    featured: true,
    count: 16,
    children: [
      { label: "Pichets", href: "/shop?category=pichets-24" },
      { label: "Verres & tasses", href: "/shop?category=verres-tasses-25" },
    ],
  },
  { label: "À propos", href: "/about" },
  { label: "Contact", href: "/contact" },
]

export const collections: Collection[] = [
  {
    id: "collection-maison-elegante",
    slug: "maison-elegante",
    name: "Maison Élégante",
    description:
      "Une signature douce pour composer des espaces calmes, chaleureux et précieux.",
    image: image("photo-1524758631624-e2822e304c36", 1400),
    productCount: 24,
    featured: true,
  },
  {
    id: "collection-table-signature",
    slug: "table-signature",
    name: "Table Signature",
    description:
      "Services, mugs, plateaux et détails de table pour recevoir avec assurance.",
    image: image("photo-1495474472287-4d71bcdd2085", 1400),
    productCount: 18,
    featured: true,
  },
  {
    id: "collection-douceur-naturelle",
    slug: "douceur-naturelle",
    name: "Douceur Naturelle",
    description:
      "Textiles, fibres et couleurs apaisées pour une maison plus sensible.",
    image: image("photo-1517705008128-361805f42e86", 1400),
    productCount: 14,
    featured: true,
  },
  {
    id: "collection-ambiance-spa",
    slug: "ambiance-spa",
    name: "Ambiance Spa",
    description:
      "Senteurs, bougies et accessoires bien-être pour ralentir le quotidien.",
    image: image("photo-1515377905703-c4788e51af15", 1200),
    productCount: 9,
    featured: false,
  },
  {
    id: "collection-essentiels",
    slug: "essentiels-du-quotidien",
    name: "Essentiels du quotidien",
    description:
      "Objets utiles, raffinés et faciles à intégrer dans toutes les pièces.",
    image: image("photo-1616046229478-9901c5536a45", 1200),
    productCount: 16,
    featured: false,
  },
  {
    id: "collection-cadeaux-raffines",
    slug: "cadeaux-raffines",
    name: "Cadeaux raffinés",
    description:
      "Des attentions choisies pour offrir une expérience maison élégante.",
    image: image("photo-1602872030219-ad2b9f9f3df2", 1200),
    productCount: 11,
    featured: false,
  },
]

export const products: Product[] = [
  {
    id: "prod-service-aurora",
    slug: "service-aurora",
    name: "Service Aurora",
    category: "Vaisselle",
    collection: "Table Signature",
    shortDescription: "Assiettes & bols en céramique sable",
    description:
      "Un service de table à la finition mate, pensé pour installer une ambiance calme et lumineuse lors des repas du quotidien comme des dîners plus habillés.",
    price: 69000,
    compareAtPrice: 82000,
    currency: "XOF",
    images: [
      image("photo-1578749556568-bc2c40e68b61", 1600),
      image("photo-1495474472287-4d71bcdd2085", 1200),
      image("photo-1610701596061-2ecf227e85b2", 1200),
    ],
    badges: ["Nouveau", "Signature"],
    material: "Céramique émaillée",
    color: "Sable mat",
    dimensions: "24 pièces",
    inStock: true,
    featured: true,
    tags: ["Best-sellers", "Art de table", "Nouveautés"],
  },
  {
    id: "prod-linen-calm",
    slug: "collection-linen-calm",
    name: "Collection Linen Calm",
    category: "Linge de maison",
    collection: "Douceur Naturelle",
    shortDescription: "Serviettes premium & texture naturelle",
    description:
      "Un lot de linge de table au toucher doux, avec une texture subtile et une couleur ivoire facile à marier.",
    price: 32000,
    currency: "XOF",
    images: [image("photo-1610701596061-2ecf227e85b2", 1400)],
    badges: ["Best-seller"],
    material: "Lin et coton",
    color: "Ivoire",
    dimensions: "Lot de 4",
    inStock: true,
    featured: true,
    tags: ["Best-sellers", "Linge de maison"],
  },
  {
    id: "prod-vase-terre-lumiere",
    slug: "vase-terre-lumiere",
    name: "Vase Terre Lumière",
    category: "Décoration",
    collection: "Maison Élégante",
    shortDescription: "Objet décoratif aux lignes sculpturales",
    description:
      "Une pièce décorative éditoriale, silencieuse et expressive, parfaite sur une console, une table basse ou une étagère.",
    price: 24500,
    currency: "XOF",
    images: [image("photo-1616627547584-bf28cee262db", 1400)],
    badges: ["Édition limitée"],
    material: "Grès texturé",
    color: "Terre claire",
    inStock: true,
    featured: true,
    tags: ["Décoration", "Nouveautés"],
  },
  {
    id: "prod-mugs-aura",
    slug: "mugs-aura-beige",
    name: "Mugs Aura Beige",
    category: "Vaisselle",
    collection: "Essentiels du quotidien",
    shortDescription: "Duo de mugs finition mate",
    description:
      "Deux mugs au profil doux et contemporain, pensés pour le café, le thé et les rituels calmes du matin.",
    price: 13500,
    currency: "XOF",
    images: [image("photo-1590794056226-79ef3a8147e1", 1400)],
    badges: ["Table"],
    material: "Céramique",
    color: "Beige",
    dimensions: "Duo",
    inStock: true,
    featured: true,
    tags: ["Art de table"],
  },
  {
    id: "prod-bougie-soft-gold",
    slug: "bougie-soft-gold",
    name: "Bougie Soft Gold",
    category: "Bien-être",
    collection: "Ambiance Spa",
    shortDescription: "Senteur douce et chaude pour le salon",
    description:
      "Une bougie parfumée aux notes enveloppantes, conçue pour apporter une lumière douce et une atmosphère réconfortante.",
    price: 16000,
    currency: "XOF",
    images: [image("photo-1602872030219-ad2b9f9f3df2", 1400)],
    badges: ["Bien-être"],
    material: "Cire végétale",
    color: "Champagne",
    dimensions: "220g",
    inStock: true,
    featured: false,
    tags: ["Bien-être", "Cadeaux"],
  },
  {
    id: "prod-coussin-sable",
    slug: "coussin-sable",
    name: "Coussin Sable",
    category: "Décoration",
    collection: "Douceur Naturelle",
    shortDescription: "Texture douce pour un salon apaisé",
    description:
      "Un coussin texturé qui ajoute de la profondeur sans bruit visuel, idéal pour adoucir un canapé ou un fauteuil.",
    price: 18500,
    currency: "XOF",
    images: [image("photo-1523413651479-597eb2da0ad6", 1400)],
    badges: ["Déco"],
    material: "Coton bouclé",
    color: "Sable",
    dimensions: "45 x 45 cm",
    inStock: true,
    featured: false,
    tags: ["Décoration"],
  },
  {
    id: "prod-plateau-arches",
    slug: "plateau-arches",
    name: "Plateau Arches",
    category: "Art de table",
    collection: "Table Signature",
    shortDescription: "Plateau de service en bois noble",
    description:
      "Un plateau aux courbes sobres pour servir, présenter ou composer un coin café élégant.",
    price: 21000,
    currency: "XOF",
    images: [image("photo-1495474472287-4d71bcdd2085", 1400)],
    badges: ["Cuisine"],
    material: "Bois naturel",
    color: "Noyer clair",
    inStock: true,
    featured: false,
    tags: ["Art de table", "Rangement"],
  },
  {
    id: "prod-plaid-ivory",
    slug: "plaid-ivory-flow",
    name: "Plaid Ivory Flow",
    category: "Linge de maison",
    collection: "Maison Élégante",
    shortDescription: "Jeté de canapé aux tons naturels",
    description:
      "Un plaid généreux, fluide et lumineux pour rendre la pièce plus accueillante sans la charger.",
    price: 28000,
    currency: "XOF",
    images: [image("photo-1517705008128-361805f42e86", 1400)],
    badges: ["Maison douce"],
    material: "Coton tissé",
    color: "Ivoire",
    dimensions: "130 x 170 cm",
    inStock: true,
    featured: false,
    tags: ["Linge de maison"],
  },
  {
    id: "prod-diffuseur-quiet-home",
    slug: "diffuseur-quiet-home",
    name: "Diffuseur Quiet Home",
    category: "Bien-être",
    collection: "Cadeaux raffinés",
    shortDescription: "Objet bien-être à la présence discrète",
    description:
      "Un diffuseur sobre qui installe une fragrance légère et une présence visuelle très douce.",
    price: 31500,
    currency: "XOF",
    images: [image("photo-1515377905703-c4788e51af15", 1400)],
    badges: ["Édition"],
    material: "Verre dépoli",
    color: "Blanc chaud",
    inStock: true,
    featured: false,
    tags: ["Cadeaux", "Bien-être"],
  },
]

export const lookbook: LookbookItem[] = [
  {
    id: "lookbook-table-douce",
    title: "Recevoir en douceur",
    subtitle: "Vaisselle sable, linge ivoire et lumière basse pour une table qui respire.",
    image: image("photo-1495474472287-4d71bcdd2085", 1500),
    products: ["Service Aurora", "Collection Linen Calm", "Plateau Arches"],
    mood: "Table calme",
  },
  {
    id: "lookbook-salon-apaisant",
    title: "Salon apaisant",
    subtitle: "Textures naturelles, coussins discrets et objets sculpturaux.",
    image: image("photo-1524758631624-e2822e304c36", 1500),
    products: ["Coussin Sable", "Vase Terre Lumière", "Plaid Ivory Flow"],
    mood: "Élégance douce",
  },
  {
    id: "lookbook-rituel-maison",
    title: "Rituel maison",
    subtitle: "Une ambiance spa à domicile, parfumée, simple et chaleureuse.",
    image: image("photo-1515377905703-c4788e51af15", 1500),
    products: ["Bougie Soft Gold", "Diffuseur Quiet Home"],
    mood: "Bien-être",
  },
]

export const siteContent: SiteContent = {
  announcement: "Nouvelle collection Maison Élégante — Livraison disponible à Dakar",
  heroTitle: "L’élégance intemporelle pour votre intérieur.",
  heroSubtitle:
    "Découvrez une sélection raffinée de vaisselle, décoration, linge de maison et accessoires bien-être pour sublimer chaque espace.",
  story:
    "Kër Venus compose une boutique où la table, le textile et la décoration deviennent une expérience d’élégance douce. Chaque objet est choisi pour sa matière, sa présence visuelle et sa capacité à transformer les gestes du quotidien.",
  contactEmail: "contact@keurvenus.com",
  contactPhone: "+221 77 000 00 00",
  location: "Dakar, Sénégal",
}

export async function getNavigation() {
  return navigation
}

export async function getProducts() {
  return products
}

export async function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) ?? null
}

export async function getFeaturedProducts() {
  return products.filter((product) => product.featured)
}

export async function getCollections() {
  return collections
}

export async function getCollectionBySlug(slug: string) {
  return collections.find((collection) => collection.slug === slug) ?? null
}

export async function getLookbook() {
  return lookbook
}

export async function getSiteContent() {
  return siteContent
}
