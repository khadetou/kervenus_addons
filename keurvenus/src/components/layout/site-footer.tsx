import { Link } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Separator } from "@/components/ui/separator"
import { useCollections } from "@/hooks/use-collections"
import { buildCategoryTree } from "@/lib/odoo-api"

export function SiteFooter() {
  const { data: collections = [] } = useCollections()
  const categories = buildCategoryTree(collections).filter((category) => category.productCount > 0)
  const groups = [
    {
      title: "Boutique",
      links: categories.slice(0, 5).map((category) => ({
        label: category.name,
        href: `/shop?category=${encodeURIComponent(category.slug)}`,
      })),
    },
    {
      title: "Categories",
      links: categories.flatMap((category) => category.children || []).filter((category) => category.productCount > 0).slice(0, 5).map((category) => ({
        label: category.name,
        href: `/shop?category=${encodeURIComponent(category.slug)}`,
      })),
    },
    {
      title: "Service client",
      links: ["Livraison", "Retours", "Conseil personnalisé", "FAQ"].map((label) => ({
        label,
        href: label === "Conseil personnalisé" ? "/contact" : "/shop",
      })),
    },
    {
      title: "Kër Venus",
      links: [
        { label: "À propos", href: "/about" },
        { label: "Lookbook", href: "/lookbook" },
        { label: "Contact", href: "/contact" },
        { label: "Dakar", href: "/contact" },
      ],
    },
  ]

  return (
    <footer className="mt-20 bg-charcoal px-4 py-14 text-ivory">
      <div className="mx-auto grid w-[min(1560px,100%)] gap-10 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <img src="/LOGO.svg" alt="Kër Venus" className="w-40 invert" />
          <p className="mt-5 max-w-md text-sm leading-7 text-ivory/70">
            Vaisselle, décoration intérieure, linge de maison et bien-être. Une
            signature maison pensée pour sublimer le quotidien avec douceur et
            élégance.
          </p>
          <div className="mt-6 flex gap-3 text-sm text-ivory/70">
            <span className="inline-flex items-center gap-2">
              <AppIcon icon="solar:map-point-linear" className="size-4 text-gold" />
              Dakar, Sénégal
            </span>
          </div>
        </div>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-champagne">
                {group.title}
              </h3>
              <ul className="mt-4 grid gap-3 text-sm text-ivory/70">
                {(group.links.length ? group.links : [{ label: "Catalogue", href: "/shop" }]).map((link, index) => (
                  <li key={`${group.title}-${link.href}-${index}`}>
                    <Link to={link.href} className="hover:text-ivory">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-10 w-[min(1560px,100%)]">
        <Separator className="bg-white/10" />
        <div className="mt-6 flex flex-col gap-3 text-xs text-ivory/55 md:flex-row md:items-center md:justify-between">
          <p>© 2026 Kër Venus. Boutique lifestyle premium.</p>
          <p>TanStack Start, shadcn/ui, Iconify et GSAP.</p>
        </div>
      </div>
    </footer>
  )
}
