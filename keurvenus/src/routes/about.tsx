import { createFileRoute } from "@tanstack/react-router"

import { BenefitsSection } from "@/components/sections/benefits-section"
import { BrandStory } from "@/components/sections/brand-story"

export const Route = createFileRoute("/about")({ component: AboutPage })

function AboutPage() {
  return (
    <main className="mt-10">
      <section className="mx-auto grid w-[min(1560px,calc(100vw-32px))] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] bg-charcoal p-8 text-ivory md:p-12">
          <p className="text-xs uppercase tracking-[0.22em] text-champagne">à propos</p>
          <h1 className="mt-4 font-serif text-6xl leading-none md:text-8xl">
            Kër Venus, l’art de rendre la maison précieuse.
          </h1>
        </div>
        <img
          src="https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1400&q=80"
          alt="Intérieur élégant Kër Venus"
          className="min-h-[520px] rounded-[2rem] object-cover shadow-luxury"
        />
      </section>
      <BrandStory />
      <BenefitsSection />
    </main>
  )
}
