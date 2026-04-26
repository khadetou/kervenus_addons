import { AppIcon } from "@/components/icons/icon"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useSiteContent } from "@/hooks/use-site-content"

export function ContactSection() {
  const { data } = useSiteContent()

  return (
    <section className="mx-auto grid w-[min(1320px,calc(100vw-32px))] gap-5 lg:grid-cols-[1fr_0.8fr]">
      <form className="rounded-[2rem] border border-white/75 bg-white/70 p-6 shadow-luxury md:p-8">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" className="h-12 rounded-2xl border-charcoal/10 bg-ivory" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" className="h-12 rounded-2xl border-charcoal/10 bg-ivory" />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" className="min-h-36 rounded-2xl border-charcoal/10 bg-ivory" />
          </div>
        </div>
        <Button className="mt-5 h-12 rounded-full bg-charcoal px-6 text-ivory">
          Envoyer
          <AppIcon icon="solar:arrow-right-linear" className="size-4" />
        </Button>
      </form>
      <aside className="grid gap-5">
        <div className="rounded-[2rem] bg-charcoal p-7 text-ivory shadow-luxury">
          <h2 className="font-serif text-4xl leading-none">Nous contacter</h2>
          <div className="mt-6 grid gap-4 text-sm text-ivory/75">
            <p className="inline-flex items-center gap-3">
              <AppIcon icon="solar:map-point-linear" className="size-5 text-gold" />
              {data?.location}
            </p>
            <p className="inline-flex items-center gap-3">
              <AppIcon icon="solar:phone-linear" className="size-5 text-gold" />
              {data?.contactPhone}
            </p>
            <p className="inline-flex items-center gap-3">
              <AppIcon icon="solar:letter-linear" className="size-5 text-gold" />
              {data?.contactEmail}
            </p>
          </div>
          <Button className="mt-7 h-12 rounded-full bg-gold px-6 text-charcoal hover:bg-gold/85">
            WhatsApp
          </Button>
        </div>
        <Accordion type="single" collapsible className="rounded-[2rem] bg-white/70 p-5 shadow-soft">
          {["Livraison à Dakar", "Conseil personnalisé", "Retours"].map((item) => (
            <AccordionItem value={item} key={item}>
              <AccordionTrigger>{item}</AccordionTrigger>
              <AccordionContent className="text-warm-gray">
                Notre équipe confirme les détails avec vous pour garder une expérience simple et soignée.
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </aside>
    </section>
  )
}
