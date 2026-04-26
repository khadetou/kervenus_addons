import { AppIcon } from "@/components/icons/icon"

const benefits = [
  ["solar:star-linear", "Sélection raffinée", "Des pièces choisies pour leur présence et leur usage."],
  ["solar:leaf-linear", "Qualité durable", "Matières sensibles, finitions sobres et entretien simple."],
  ["solar:map-point-linear", "Livraison locale", "Livraison disponible à Dakar avec confirmation personnalisée."],
  ["solar:letter-linear", "Conseil personnalisé", "Un accompagnement doux pour composer votre univers."],
]

export function BenefitsSection() {
  return (
    <section className="mx-auto mt-16 grid w-[min(1560px,calc(100vw-32px))] gap-4 md:grid-cols-2 xl:grid-cols-4">
      {benefits.map(([icon, title, copy]) => (
        <div key={title} className="rounded-[1.6rem] border border-white/75 bg-white/70 p-6 shadow-soft">
          <AppIcon icon={icon} className="size-7 text-gold" />
          <h3 className="mt-5 font-serif text-3xl leading-none">{title}</h3>
          <p className="mt-3 text-sm leading-6 text-warm-gray">{copy}</p>
        </div>
      ))}
    </section>
  )
}
