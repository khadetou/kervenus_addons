import { createFileRoute } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { BenefitsSection } from "@/components/sections/benefits-section"
import { BrandStory } from "@/components/sections/brand-story"
import { getOdooSeo } from "@/lib/odoo-api"
import { applySeoMetadata, seoHead } from "@/lib/seo"

export const Route = createFileRoute("/about")({
  loader: async () => getOdooSeo("/about").catch(() => undefined),
  head: ({ loaderData }) =>
    seoHead(applySeoMetadata({
      title: "À propos | Kër Venus",
      description:
        "Découvrez l'univers Kër Venus: une boutique maison à Dakar pensée pour la vaisselle, la décoration et les objets du quotidien raffinés.",
      path: "/about",
      image: "/assets/landing/banner-maison-poubelles.png",
      keywords: [
        "Kër Venus Dakar",
        "boutique maison Dakar",
        "décoration intérieure Dakar",
        "vaisselle Dakar",
        "verrerie Dakar",
      ],
    }, loaderData)),
  component: AboutPage,
})

function AboutPage() {
  return (
    <main className="mt-10 overflow-hidden">
      <section className="mx-auto grid w-[min(1560px,calc(100vw-32px))] overflow-hidden rounded-[2.2rem] border border-white/75 bg-charcoal text-ivory shadow-luxury lg:grid-cols-[0.95fr_1.05fr]">
        <div className="relative z-10 flex min-h-[560px] flex-col justify-between p-8 md:p-12 lg:p-14">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-champagne/24 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.22em] text-champagne backdrop-blur">
              <AppIcon icon="solar:home-smile-angle-linear" className="size-4" />
              à propos
            </p>
            <h1 className="mt-8 max-w-4xl font-serif text-5xl leading-[0.96] md:text-7xl xl:text-8xl">
              Kër Venus, l’art de rendre la maison précieuse.
            </h1>
          </div>
          <p className="mt-8 max-w-xl text-base leading-8 text-ivory/78">
            Une boutique pensée à Dakar pour une maison belle, utile et douce:
            verrerie, cuisine, table, rangement et objets du quotidien choisis
            avec une exigence de présence.
          </p>
        </div>
        <div className="relative min-h-[520px] overflow-hidden bg-cream">
          <img
            src="/assets/landing/banner-art-table.png"
            alt="Table Kër Venus avec verrerie, assiettes et finitions dorées"
            className="h-full min-h-[520px] w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,23,23,.22),rgba(23,23,23,0)_36%),linear-gradient(180deg,rgba(23,23,23,0),rgba(23,23,23,.18))]" />
          <div className="absolute bottom-6 left-6 right-6 grid gap-3 sm:grid-cols-3">
            {["Verrerie", "Cuisine", "Maison"].map((label) => (
              <div key={label} className="rounded-2xl border border-white/24 bg-charcoal/40 px-4 py-3 text-sm font-medium text-ivory backdrop-blur-md">
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto mt-6 grid w-[min(1560px,calc(100vw-32px))] gap-5 md:grid-cols-3">
        {[
          ["Verrerie", "/assets/landing/banner-verrerie.png"],
          ["Batteries de cuisine", "/assets/landing/banner-cuisine.png"],
          ["Rangement maison", "/assets/landing/banner-maison-poubelles.png"],
        ].map(([label, image]) => (
          <article key={label} className="group overflow-hidden rounded-[1.8rem] border border-white/75 bg-white/70 shadow-soft">
            <img
              src={image}
              alt={`${label} Kër Venus`}
              className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">sélection</p>
              <h2 className="mt-2 font-serif text-3xl leading-none">{label}</h2>
            </div>
          </article>
        ))}
      </section>
      <BrandStory />
      <BenefitsSection />
    </main>
  )
}
