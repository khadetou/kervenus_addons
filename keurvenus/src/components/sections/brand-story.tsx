import { useSiteContent } from "@/hooks/use-site-content"

export function BrandStory() {
  const { data } = useSiteContent()

  return (
    <section className="mx-auto mt-16 grid w-[min(1560px,calc(100vw-32px))] gap-5 lg:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-[2rem] bg-cream p-8 md:p-10">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">signature</p>
        <h2 className="mt-4 font-serif text-5xl leading-none md:text-6xl">
          Une marque pensée pour les intérieurs qui ont du goût.
        </h2>
      </div>
      <div className="rounded-[2rem] border border-white/75 bg-white/70 p-8 shadow-soft md:p-10">
        <p className="text-lg leading-9 text-warm-gray">{data?.story}</p>
        <blockquote className="mt-7 border-l-2 border-gold pl-5 font-serif text-3xl leading-tight">
          “Elles ne remplissent pas l’espace, elles le révèlent.”
        </blockquote>
      </div>
    </section>
  )
}
