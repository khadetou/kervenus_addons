import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function NewsletterSection() {
  return (
    <section className="mx-auto mt-16 w-[min(1560px,calc(100vw-32px))] rounded-[2rem] border border-white/75 bg-white/70 p-8 shadow-luxury md:p-12">
      <div className="grid gap-7 lg:grid-cols-[1fr_0.9fr] lg:items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">newsletter premium</p>
          <h2 className="mt-4 max-w-3xl font-serif text-5xl leading-none md:text-6xl">
            Recevez nos nouveautés et nos inspirations maison.
          </h2>
        </div>
        <form className="grid gap-3 sm:grid-cols-[1fr_auto]">
          <label className="sr-only" htmlFor="newsletter-email">
            Adresse e-mail
          </label>
          <Input
            id="newsletter-email"
            type="email"
            placeholder="Votre adresse e-mail"
            className="h-12 rounded-full border-charcoal/10 bg-ivory px-5"
          />
          <Button className="h-12 rounded-full bg-charcoal px-6 text-ivory">
            S’inscrire
            <AppIcon icon="solar:letter-linear" className="size-4" />
          </Button>
        </form>
      </div>
    </section>
  )
}
