import { createFileRoute } from "@tanstack/react-router"

import { ContactSection } from "@/components/sections/contact-section"

export const Route = createFileRoute("/contact")({ component: ContactPage })

function ContactPage() {
  return (
    <main className="mt-10">
      <div className="mx-auto mb-8 w-[min(1320px,calc(100vw-32px))]">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">contact</p>
        <h1 className="mt-3 max-w-3xl font-serif text-6xl leading-none md:text-7xl">
          Une question, une commande, une envie d’ambiance?
        </h1>
      </div>
      <ContactSection />
    </main>
  )
}
