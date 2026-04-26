export type LandingImage = {
  src: string
  alt: string
}

export type LandingStory = LandingImage & {
  eyebrow: string
  title: string
  description: string
  categorySlug: string
  cta: string
}

export const landingHeroImages: LandingImage[] = [
  {
    src: "/assets/landing/hero-carafe-table.webp",
    alt: "Carafe transparente et verres Kër Venus sur une table lumineuse",
  },
  {
    src: "/assets/landing/hero-table-signature.webp",
    alt: "Table raffinée avec carafe, verres et vaisselle Kër Venus",
  },
  {
    src: "/assets/landing/hero-kitchen-essentials.webp",
    alt: "Essentiels cuisine et conservation dans un intérieur lumineux",
  },
]

export const landingEditorialImage: LandingImage = {
  src: "/assets/landing/editorial-homeware-portrait.webp",
  alt: "Composition verticale de vaisselle, carafe et verres Kër Venus",
}

export const landingStoryBanners: LandingStory[] = [
  {
    src: "/assets/landing/story-carafes-thermos.webp",
    alt: "Thermos, carafes et service à thé Kër Venus dans une scène de petit-déjeuner",
    eyebrow: "Service chaud",
    title: "Carafes, thermos et pauses qui durent.",
    description:
      "Une sélection inspirée des bouteilles thermos, carafes isothermes et services à café du catalogue.",
    categorySlug: "carafes-thermos-3",
    cta: "Voir les carafes",
  },
  {
    src: "/assets/landing/story-lunch-coolers.webp",
    alt: "Boîtes à lunch et glacière rouge Kër Venus sur un plan de cuisine lumineux",
    eyebrow: "Conservation",
    title: "Lunch boxes et glacières pour les journées mobiles.",
    description:
      "Des formats pratiques, nets et chaleureux pour transporter, conserver et servir avec élégance.",
    categorySlug: "boites-a-lunch-15",
    cta: "Voir les boîtes",
  },
  {
    src: "/assets/landing/story-chauffe-plats.webp",
    alt: "Chauffe-plats, cocottes et bols inox Kër Venus prêts pour recevoir",
    eyebrow: "Recevoir",
    title: "Chauffe-plats, cocottes et tables généreuses.",
    description:
      "Une ambiance construite autour des chauffe-plats, bols isothermes, inox et finitions dorées du catalogue.",
    categorySlug: "isotherme-chauffe-plats-17",
    cta: "Voir les chauffe-plats",
  },
  {
    src: "/assets/landing/story-condiments-portrait.webp",
    alt: "Bols à condiments vert émeraude et détails dorés Kër Venus",
    eyebrow: "Détails table",
    title: "Petites pièces, grande présence.",
    description:
      "Bols à condiments, service à thé et détails dorés pour finir une table avec caractère.",
    categorySlug: "condiments-sauces-4",
    cta: "Voir les détails",
  },
]

export const landingCategoryImages: LandingImage[] = [
  landingStoryBanners[0],
  landingStoryBanners[1],
  landingStoryBanners[2],
  landingStoryBanners[3],
  landingHeroImages[1],
  landingHeroImages[2],
  landingEditorialImage,
  landingHeroImages[0],
]

export function landingImageForIndex(index: number) {
  return landingCategoryImages[index % landingCategoryImages.length]
}
