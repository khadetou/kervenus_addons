const CATEGORY_VISUALS = [
  {
    patterns: ["art de la table", "table"],
    image: "/assets/landing/hero-table-signature.webp",
    position: "center 48%",
  },
  {
    patterns: ["cuisine & conservation", "conservation", "isotherme"],
    image: "/assets/landing/story-chauffe-plats.webp",
    position: "center 38%",
  },
  {
    patterns: ["cuisine"],
    image: "/assets/landing/hero-kitchen-essentials.webp",
    position: "center 46%",
  },
  {
    patterns: ["maison"],
    image: "/assets/landing/editorial-homeware-portrait.webp",
    position: "center 42%",
  },
  {
    patterns: ["verrerie", "verre"],
    image: "/assets/landing/hero-carafe-table.webp",
    position: "center 48%",
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
