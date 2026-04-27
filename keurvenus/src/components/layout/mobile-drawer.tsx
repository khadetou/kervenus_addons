import { Link } from "@tanstack/react-router"
import { useRef, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useCart } from "@/hooks/use-cart"
import { useNavigation } from "@/hooks/use-navigation"
import { gsap, prefersReducedMotion, useGSAP } from "@/lib/animations"

export function MobileDrawer() {
  const { data: navigation = [] } = useNavigation()
  const { itemCount } = useCart()
  const contentRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  useGSAP(
    () => {
      if (!contentRef.current || prefersReducedMotion()) return
      const targets = Array.from(contentRef.current.querySelectorAll("[data-drawer-item]"))
      if (!targets.length) return
      gsap.from(targets, {
        opacity: 0,
        x: 18,
        duration: 0.45,
        stagger: 0.05,
        ease: "power2.out",
      })
    },
    { scope: contentRef }
  )

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="rounded-full border-charcoal/10 bg-white/70 lg:hidden"
        aria-label="Ouvrir le menu"
        onClick={() => setOpen(true)}
      >
        <AppIcon icon="solar:menu-dots-bold" className="size-4" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="w-[92vw] max-w-md border-l border-white/70 bg-ivory p-0">
        <div ref={contentRef} className="flex h-full flex-col">
          <SheetHeader className="border-b border-charcoal/10 p-5 text-left">
            <SheetTitle className="font-serif text-3xl">Kër Venus</SheetTitle>
            <SheetDescription className="text-sm text-warm-gray">
              Maison, table et élégance douce.
            </SheetDescription>
          </SheetHeader>
          <div className="grid gap-5 p-5">
            <label data-drawer-item className="relative block">
              <AppIcon
                icon="solar:magnifer-linear"
                className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-warm-gray"
              />
              <Input
                className="h-12 rounded-full border-charcoal/10 bg-white pl-11"
                placeholder="Rechercher dans la boutique..."
              />
            </label>
            <Accordion type="single" collapsible className="grid gap-2">
              {navigation.map((item) =>
                item.children ? (
                  <AccordionItem
                    value={item.href}
                    key={item.href}
                    data-drawer-item
                    className="rounded-2xl border border-charcoal/10 bg-white/70 px-4"
                  >
                    <AccordionTrigger className="text-sm font-semibold">
                      {item.label}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-2 pb-3">
                        {item.children.map((child) => (
                          <div key={child.href} className="rounded-xl bg-ivory/70 p-2">
                            <Link
                              to={child.href}
                              onClick={() => setOpen(false)}
                              className="flex items-center justify-between rounded-lg px-2 py-2 text-sm font-semibold text-charcoal hover:bg-cream"
                            >
                              <span>{child.label}</span>
                              {child.count !== undefined ? (
                                <span className="rounded-full bg-white px-2 py-0.5 text-xs text-warm-gray">
                                  {child.count}
                                </span>
                              ) : null}
                            </Link>
                            {child.children?.length ? (
                              <div className="mt-1 grid gap-1 pl-3">
                                {child.children.map((nested) => (
                                  <Link
                                    key={nested.href}
                                    to={nested.href}
                                    onClick={() => setOpen(false)}
                                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-warm-gray hover:bg-cream"
                                  >
                                    {nested.label}
                                  </Link>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ) : (
                  <Link
                    data-drawer-item
                    key={item.href}
                    to={item.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-2xl border border-charcoal/10 bg-white/70 px-4 py-4 text-sm font-semibold"
                  >
                    {item.label}
                    <AppIcon icon="solar:arrow-right-linear" className="size-4 text-gold" />
                  </Link>
                )
              )}
            </Accordion>
            <Link
              data-drawer-item
              to="/cart"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-2xl bg-charcoal px-4 py-4 text-sm font-semibold text-ivory"
            >
              Panier
              <span>{itemCount} article{itemCount > 1 ? "s" : ""}</span>
            </Link>
            <Link
              data-drawer-item
              to="/portal"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-2xl border border-gold/20 bg-white/80 px-4 py-4 text-sm font-semibold text-charcoal"
            >
              Espace client
              <AppIcon icon="solar:user-rounded-linear" className="size-4 text-gold" />
            </Link>
          </div>
          <div className="mt-auto p-5">
            <Button asChild className="h-12 w-full rounded-full bg-gold text-charcoal hover:bg-gold/85">
              <Link
                to="/collections/$slug"
                params={{ slug: "maison-elegante" }}
                onClick={() => setOpen(false)}
              >
                Découvrir la collection
              </Link>
            </Button>
          </div>
        </div>
      </SheetContent>
      </Sheet>
    </>
  )
}
