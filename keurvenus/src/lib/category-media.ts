const CATEGORY_VISUALS = [
  {
    patterns: [
      "poubelles a pedale",
      "poubelles à pédale",
      "poubelles-a-pedale",
      "poubelle",
      "poubelles",
    ],
    image: "/assets/landing/banner-maison-poubelles.png",
    position: "center 52%",
  },
  {
    patterns: [
      "batterie de cuisine",
      "batteries de cuisine",
      "batterie-de-cuisine",
      "batteries-de-cuisine",
      "batterie-cuisine",
      "batteries-cuisine",
    ],
    image: "/assets/landing/banner-cuisine.png",
    position: "center 48%",
  },
  {
    patterns: ["art de la table", "art-de-la-table", "table"],
    image: "/assets/landing/banner-art-table.png",
    position: "center 48%",
  },
  {
    patterns: [
      "cuisine & conservation",
      "cuisine et conservation",
      "cuisine-conservation",
      "cuisine-et-conservation",
      "conservation",
      "isotherme",
      "boite",
      "boîte",
      "lunch",
      "glaciere",
      "glacière",
    ],
    image: "/assets/landing/banner-conservation.png",
    position: "center 50%",
  },
  {
    patterns: ["cuisine"],
    image: "/assets/landing/banner-cuisine.png",
    position: "center 48%",
  },
  {
    patterns: ["maison"],
    image: "/assets/landing/banner-maison-poubelles.png",
    position: "center 52%",
  },
  {
    patterns: [
      "verrerie",
      "verre",
      "verres",
      "verres-tasses",
      "tasse",
      "tasses",
      "carafe",
      "carafes",
    ],
    image: "/assets/landing/banner-verrerie.png",
    position: "center 50%",
  },
]

function categoryKey(name = "", slug = "") {
  return `${name} ${slug}`.toLowerCase()
}

function categoryVisual(name = "", slug = "") {
  const key = categoryKey(name, slug)
  return CATEGORY_VISUALS.find((visual) =>
    visual.patterns.some((pattern) => key.includes(pattern))
  )
}

export function categoryImageFor(name: string, slug: string, fallback = "") {
  return categoryVisual(name, slug)?.image || fallback
}

export function categoryImagePosition(name: string, slug: string) {
  return categoryVisual(name, slug)?.position || "center"
}
