import { Link } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { useNavigation } from "@/hooks/use-navigation"

export function DesktopNavigation() {
  const { data: navigation = [] } = useNavigation()

  return (
    <NavigationMenu className="hidden min-w-0 justify-center lg:flex">
      <NavigationMenuList className="gap-1 rounded-full border border-charcoal/8 bg-white/58 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.7)]">
        {navigation.map((item) => (
          <NavigationMenuItem key={item.href}>
            {item.children ? (
              <>
                <NavigationMenuTrigger className="h-10 rounded-full bg-transparent px-4 text-sm font-medium text-warm-gray transition hover:bg-white hover:text-charcoal data-open:bg-white data-open:text-charcoal data-open:shadow-soft xl:px-5">
                  {item.label}
                </NavigationMenuTrigger>
                <NavigationMenuContent className="rounded-[1.65rem] border border-white/80 bg-ivory/96 p-3 shadow-luxury backdrop-blur-2xl">
                  <div className="grid w-[min(920px,calc(100vw-48px))] gap-3 lg:grid-cols-[330px_minmax(0,1fr)]">
                    <Link
                      to={item.href}
                      className="group relative min-h-[310px] overflow-hidden rounded-[1.35rem] bg-charcoal p-6 text-ivory"
                    >
                      {item.image ? (
                        <span
                          className="absolute inset-0 bg-cover bg-center opacity-[0.48] transition duration-500 group-hover:scale-105 group-hover:opacity-60"
                          style={{ backgroundImage: `url('${item.image}')` }}
                        />
                      ) : null}
                      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(23,23,23,.22),rgba(23,23,23,.88)),linear-gradient(90deg,rgba(23,23,23,.72),rgba(23,23,23,.18))]" />
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne/80 to-transparent" />
                      <span className="relative flex h-full min-h-[262px] flex-col justify-between">
                        <span>
                          <span className="inline-flex items-center gap-2 rounded-full border border-white/16 bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne backdrop-blur">
                            <AppIcon icon={categoryIcon(item.label)} className="size-4" />
                            {item.count ? `${item.count} pièces` : "Univers"}
                          </span>
                          <span className="mt-6 block font-serif text-5xl leading-[0.94] tracking-normal text-white">
                            {item.label}
                          </span>
                          <span className="mt-4 block max-w-[260px] text-sm leading-6 text-ivory/78">
                            {item.description ||
                              "Explorez les pièces disponibles dans cet univers Kër Venus."}
                          </span>
                        </span>
                        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-semibold text-ivory transition group-hover:bg-white group-hover:text-charcoal">
                          Tout voir
                          <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                        </span>
                      </span>
                    </Link>
                    <div className="min-w-0 rounded-[1.3rem] border border-charcoal/6 bg-white/62 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,.72)]">
                      <div className="mb-2 flex items-center justify-between gap-4 px-2 py-1">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                            Sous-catégories
                          </p>
                          <p className="mt-1 text-sm text-warm-gray">
                            Accès rapide aux familles configurées dans le catalogue.
                          </p>
                        </div>
                        <Link
                          to="/shop"
                          className="hidden rounded-full border border-charcoal/8 bg-ivory px-3 py-1.5 text-xs font-semibold text-charcoal transition hover:border-gold/30 hover:text-gold xl:inline-flex"
                        >
                          Boutique
                        </Link>
                      </div>
                      <div className="grid max-h-[430px] gap-2 overflow-auto pr-1">
                        {item.children.map((child) => (
                          <NavigationMenuLink asChild key={child.href}>
                            <Link
                              to={child.href}
                              className="group flex min-h-[76px] items-start gap-3 rounded-[1.05rem] border border-charcoal/6 bg-ivory/82 p-3 text-sm text-charcoal transition hover:-translate-y-0.5 hover:border-gold/28 hover:bg-white hover:shadow-soft"
                            >
                              <span
                                className="relative mt-0.5 grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-cream text-gold"
                                aria-hidden="true"
                              >
                                {child.image ? (
                                  <span
                                    className="absolute inset-0 bg-cover bg-center opacity-28"
                                    style={{ backgroundImage: `url('${child.image}')` }}
                                  />
                                ) : null}
                                <AppIcon
                                  icon={categoryIcon(child.label)}
                                  className="relative size-5"
                                />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-start justify-between gap-3">
                                  <span className="min-w-0">
                                    <span className="block truncate font-semibold">
                                      {child.label}
                                    </span>
                                    {child.description ? (
                                      <span className="mt-1 line-clamp-1 block text-xs leading-5 text-warm-gray">
                                        {child.description}
                                      </span>
                                    ) : null}
                                  </span>
                                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-warm-gray shadow-[inset_0_0_0_1px_rgba(38,29,20,.06)]">
                                    {child.count ?? 0}
                                  </span>
                                </span>
                                {child.children?.length ? (
                                  <span className="mt-2 flex flex-wrap gap-1.5">
                                    {child.children.slice(0, 4).map((nested) => (
                                      <span
                                        key={nested.href}
                                        className="rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-warm-gray transition group-hover:bg-gold/12 group-hover:text-charcoal"
                                      >
                                        {nested.label}
                                      </span>
                                    ))}
                                  </span>
                                ) : null}
                              </span>
                              <AppIcon
                                icon="solar:arrow-right-linear"
                                className="mt-3 size-4 shrink-0 text-gold opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                              />
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </div>
                    </div>
                  </div>
                </NavigationMenuContent>
              </>
            ) : (
              <NavigationMenuLink asChild>
                <Link
                  to={item.href}
                  className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-warm-gray transition hover:bg-white hover:text-charcoal hover:shadow-soft xl:px-5"
                >
                  {item.label}
                </Link>
              </NavigationMenuLink>
            )}
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

function categoryIcon(name: string) {
  const normalized = name.toLowerCase()
  if (normalized.includes("verre") || normalized.includes("verrerie")) return "solar:wineglass-linear"
  if (normalized.includes("conservation") || normalized.includes("isotherme")) return "solar:box-linear"
  if (normalized.includes("cuisine")) return "solar:chef-hat-minimalistic-linear"
  if (normalized.includes("maison")) return "solar:home-2-linear"
  return "solar:cup-hot-linear"
}
