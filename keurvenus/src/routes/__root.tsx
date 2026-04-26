import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
  useLocation,
} from "@tanstack/react-router"
import { QueryClientProvider } from "@tanstack/react-query"
import { lazy, Suspense, useEffect, useState, type ReactNode } from "react"

import { AppIcon } from "@/components/icons/icon"
import { PageShell } from "@/components/layout/page-shell"
import { Button } from "@/components/ui/button"
import { CartProvider } from "@/hooks/use-cart"
import { WishlistProvider } from "@/hooks/use-wishlist"
import { createQueryClient } from "@/lib/query-client"
import appCss from "@/styles.css?url"

const LocalReactQueryDevtools = import.meta.env.DEV
  ? lazy(() =>
      import("@tanstack/react-query-devtools").then((module) => ({
        default: module.ReactQueryDevtools,
      }))
    )
  : null

const LocalTanStackDevtools = import.meta.env.DEV
  ? lazy(async () => {
      const [{ TanStackDevtools }, { TanStackRouterDevtoolsPanel }] = await Promise.all([
        import("@tanstack/react-devtools"),
        import("@tanstack/react-router-devtools"),
      ])

      return {
        default: function LocalTanStackDevtoolsPanelHost() {
          return (
            <TanStackDevtools
              config={{ position: "bottom-right" }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          )
        },
      }
    })
  : null
const ODOO_FAVICON_URL = "/odoo/odoo_debranding/favicon"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Kër Venus — Maison, décoration & art de vivre" },
      {
        name: "description",
        content:
          "Boutique premium Kër Venus pour la vaisselle, la décoration, le linge de maison et le bien-être à Dakar.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: ODOO_FAVICON_URL },
      { rel: "shortcut icon", href: ODOO_FAVICON_URL },
      { rel: "apple-touch-icon", href: ODOO_FAVICON_URL },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: StorefrontNotFound,
})

function RootComponent() {
  const [queryClient] = useState(() => createQueryClient())
  const showDevtools = useLocalDevtools()

  return (
    <QueryClientProvider client={queryClient}>
      <StorefrontHostBridge />
      <CartProvider>
        <WishlistProvider>
          <PageShell>
            <Outlet />
          </PageShell>
        </WishlistProvider>
      </CartProvider>
      {showDevtools && LocalReactQueryDevtools ? (
        <Suspense fallback={null}>
          <LocalReactQueryDevtools initialIsOpen={false} />
        </Suspense>
      ) : null}
    </QueryClientProvider>
  )
}

function useLocalDevtools() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return
    setEnabled(isLocalHostname(window.location.hostname))
  }, [])

  return enabled
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1"
}

function StorefrontHostBridge() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return

    function handleLinkClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest<HTMLAnchorElement>("a[href]")
      if (!anchor || anchor.hasAttribute("download")) return

      const targetFrame = anchor.getAttribute("target")
      if (targetFrame && targetFrame !== "_self") return

      let url: URL
      try {
        url = new URL(anchor.href)
      } catch {
        return
      }

      if (url.origin !== window.location.origin) return

      const path = `${url.pathname}${url.search}${url.hash}`
      if (!shouldSyncStorefrontPath(path)) return

      event.preventDefault()
      event.stopPropagation()
      postStorefrontNavigation(path)
    }

    document.addEventListener("click", handleLinkClick, true)
    return () => document.removeEventListener("click", handleLinkClick, true)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || window.parent === window) return

    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
    postStorefrontNavigation(path)
  }, [location.pathname, location.searchStr, location.hash])

  return null
}

function shouldSyncStorefrontPath(path: string) {
  return (
    path.startsWith("/") &&
    !path.startsWith("//") &&
    !path.startsWith("/api/") &&
    !path.startsWith("/odoo") &&
    !path.startsWith("/web/")
  )
}

function postStorefrontNavigation(path: string) {
  if (!shouldSyncStorefrontPath(path)) return

  window.parent.postMessage(
    {
      type: "keurvenus:storefront:navigate",
      path,
    },
    "*"
  )
}

function StorefrontNotFound() {
  return (
    <main className="mx-auto flex min-h-[54vh] w-[min(1120px,calc(100vw-32px))] items-center py-14 md:py-20">
      <section className="relative w-full overflow-hidden rounded-[2rem] border border-white/80 bg-white/72 p-7 shadow-luxury sm:p-10 lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(185,154,91,0.16),transparent_30%),radial-gradient(circle_at_86%_82%,rgba(17,17,17,0.07),transparent_34%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-cream px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold">
              <AppIcon icon="solar:compass-linear" className="size-4" />
              Page introuvable
            </div>
            <h1 className="mt-5 max-w-2xl font-serif text-5xl leading-[0.92] text-charcoal sm:text-6xl lg:text-7xl">
              Cette adresse ne mène plus à la boutique.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-charcoal/68">
              Le lien a peut-être changé pendant la synchronisation du catalogue. Vous pouvez revenir
              à l’accueil ou continuer dans le catalogue Kër Venus.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-charcoal px-6 text-ivory hover:bg-charcoal/90">
                <Link to="/">
                  Retour accueil
                  <AppIcon icon="solar:home-smile-linear" className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-charcoal/10 bg-white px-6">
                <Link to="/shop">
                  Voir la boutique
                  <AppIcon icon="solar:bag-4-linear" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-white/75 bg-ivory/72 p-5">
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Kër Venus</p>
            <p className="mt-3 font-serif text-3xl leading-none text-charcoal">Maison raffinée</p>
            <p className="mt-4 text-sm leading-6 text-charcoal/62">
              Vaisselle, décoration intérieure, linge de maison et bien-être sélectionnés à Dakar.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  const showDevtools = useLocalDevtools()

  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        {showDevtools && LocalTanStackDevtools ? (
          <Suspense fallback={null}>
            <LocalTanStackDevtools />
          </Suspense>
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}
