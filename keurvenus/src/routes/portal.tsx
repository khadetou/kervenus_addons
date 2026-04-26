import { Link, createFileRoute } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  usePortalDashboard,
  usePortalInvoices,
  usePortalOrders,
  usePortalQuotes,
} from "@/hooks/use-portal"
import { useSession } from "@/hooks/use-session"
import { OdooApiError } from "@/lib/odoo-api"
import type { PortalDocument } from "@/lib/types"

export const Route = createFileRoute("/portal")({ component: PortalPage })

function PortalPage() {
  const [activeTab, setActiveTab] = useState("orders")
  const session = useSession()
  const dashboard = usePortalDashboard()
  const orders = usePortalOrders()
  const quotes = usePortalQuotes()
  const invoices = usePortalInvoices()
  const isUnauthorized =
    session.data?.authenticated === false ||
    (dashboard.error instanceof OdooApiError && dashboard.error.status === 401)

  useEffect(() => {
    const syncHash = () => {
      const hash = window.location.hash.replace("#", "")
      if (["orders", "quotes", "invoices"].includes(hash)) setActiveTab(hash)
    }
    syncHash()
    window.addEventListener("hashchange", syncHash)
    return () => window.removeEventListener("hashchange", syncHash)
  }, [])

  if (session.isError && !session.data) {
    return (
      <PortalShell>
        <EmptyPortal
          icon="solar:server-square-cloud-linear"
          title="Backoffice indisponible"
          description="Le portail Kër Venus attend la connexion au backoffice. Vérifiez que le serveur tourne et que l’adresse de synchronisation pointe vers le bon domaine."
          actionLabel="Retour boutique"
          actionHref="/shop"
        />
      </PortalShell>
    )
  }

  if (isUnauthorized) {
    return (
      <PortalShell>
        <EmptyPortal
          icon="solar:user-rounded-linear"
          title="Connectez-vous à votre espace client"
          description="Retrouvez vos commandes, devis, factures, adresses et favoris synchronisés avec le backoffice Kër Venus."
          actionLabel="Se connecter"
          actionHref="/login"
        />
      </PortalShell>
    )
  }

  const counters = dashboard.data?.counters
  const portalTabs = [
    {
      value: "orders",
      label: "Commandes",
      icon: "solar:bag-4-linear",
      count: counters?.orders ?? 0,
      description: "Achats validés",
    },
    {
      value: "quotes",
      label: "Devis",
      icon: "solar:document-text-linear",
      count: counters?.quotes ?? 0,
      description: "Propositions",
    },
    {
      value: "invoices",
      label: "Factures",
      icon: "solar:bill-list-linear",
      count: counters?.invoices ?? 0,
      description: "Documents à suivre",
    },
  ]

  function handleTabChange(value: string) {
    setActiveTab(value)
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${value}`)
  }

  return (
    <PortalShell>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2.2rem] border border-white/75 bg-white/72 p-6 shadow-luxury md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            espace client
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
            Bonjour {dashboard.data?.profile.name || session.data?.user?.name || "Kër Venus"}.
          </h1>
          <p className="mt-4 max-w-2xl text-warm-gray">
            Toutes vos pièces administratives sont reliées au backoffice:
            commandes validées, devis, factures, adresses et wishlist.
          </p>
        </div>
        <aside className="rounded-[2.2rem] border border-white/75 bg-charcoal p-6 text-ivory shadow-luxury">
          <p className="text-xs uppercase tracking-[0.24em] text-champagne">profil</p>
          <h2 className="mt-3 font-serif text-4xl leading-none">
            {dashboard.data?.profile.partner.name || session.data?.user?.name}
          </h2>
          <div className="mt-5 grid gap-3 text-sm text-ivory/72">
            <span className="inline-flex items-center gap-2">
              <AppIcon icon="solar:letter-linear" className="size-4 text-gold" />
              {dashboard.data?.profile.partner.email || session.data?.user?.login}
            </span>
            <span className="inline-flex items-center gap-2">
              <AppIcon icon="solar:phone-linear" className="size-4 text-gold" />
              {dashboard.data?.profile.partner.phone || "Téléphone à compléter"}
            </span>
            <span className="inline-flex items-center gap-2">
              <AppIcon icon="solar:map-point-linear" className="size-4 text-gold" />
              {dashboard.data?.profile.partner.city || "Adresse à compléter"}
            </span>
          </div>
        </aside>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <CounterCard icon="solar:document-text-linear" label="Devis" value={counters?.quotes} />
        <CounterCard icon="solar:bag-4-linear" label="Commandes" value={counters?.orders} />
        <CounterCard icon="solar:bill-list-linear" label="Factures" value={counters?.invoices} />
        <CounterCard icon="solar:danger-circle-linear" label="Échéances" value={counters?.overdue_invoices} />
        <CounterCard icon="solar:heart-linear" label="Favoris" value={counters?.wishlist} />
      </section>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6" id="orders">
        <TabsList className="grid h-auto w-full grid-cols-1 gap-2 rounded-[1.6rem] border border-white/80 bg-white/72 p-2 shadow-soft backdrop-blur sm:grid-cols-3">
          {portalTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              id={tab.value}
              className="group h-auto justify-start rounded-[1.15rem] border border-transparent bg-ivory/65 px-3.5 py-3 text-left text-charcoal/68 shadow-none hover:border-gold/15 hover:bg-white data-active:border-charcoal data-active:bg-charcoal data-active:text-ivory data-active:shadow-soft"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-gold shadow-[inset_0_0_0_1px_rgba(32,27,24,0.06)] group-data-active:bg-white/10 group-data-active:text-champagne group-data-active:shadow-none">
                <AppIcon icon={tab.icon} className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{tab.label}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-charcoal group-data-active:bg-white/12 group-data-active:text-ivory">
                    {tab.count}
                  </span>
                </span>
                <span className="mt-1 block truncate text-[11px] uppercase tracking-[0.16em] text-warm-gray group-data-active:text-ivory/56">
                  {tab.description}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="orders" className="mt-5">
          <DocumentGrid
            documents={orders.data || dashboard.data?.recent_orders || []}
            emptyLabel="Aucune commande validée pour le moment."
            isLoading={orders.isLoading}
            type="order"
          />
        </TabsContent>
        <TabsContent value="quotes" className="mt-5">
          <DocumentGrid
            documents={quotes.data || dashboard.data?.recent_quotes || []}
            emptyLabel="Aucun devis en cours pour le moment."
            isLoading={quotes.isLoading}
            type="quote"
          />
        </TabsContent>
        <TabsContent value="invoices" className="mt-5">
          <DocumentGrid
            documents={invoices.data || dashboard.data?.recent_invoices || []}
            emptyLabel="Aucune facture disponible pour le moment."
            isLoading={invoices.isLoading}
            type="invoice"
          />
        </TabsContent>
      </Tabs>
    </PortalShell>
  )
}

function PortalShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">{children}</main>
}

function CounterCard({ icon, label, value = 0 }: { icon: string; label: string; value?: number }) {
  return (
    <Card className="rounded-[1.5rem] border-white/75 bg-white/72 shadow-soft">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <AppIcon icon={icon} className="size-6 text-gold" />
          <span className="font-serif text-4xl leading-none">{value}</span>
        </div>
        <p className="mt-4 text-xs uppercase tracking-[0.22em] text-warm-gray">{label}</p>
      </CardContent>
    </Card>
  )
}

function DocumentGrid({
  documents,
  emptyLabel,
  isLoading,
  type,
}: {
  documents: PortalDocument[]
  emptyLabel: string
  isLoading: boolean
  type: "order" | "quote" | "invoice"
}) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-48 animate-pulse rounded-[1.7rem] bg-white/60" />
        ))}
      </div>
    )
  }

  if (!documents.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-charcoal/15 bg-white/60 p-8 text-center">
        <p className="font-serif text-3xl">{emptyLabel}</p>
        <Button asChild className="mt-5 rounded-full bg-charcoal text-ivory">
          <Link to="/shop">Découvrir la boutique</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <DocumentCard key={`${type}-${document.id}`} document={document} type={type} />
      ))}
    </div>
  )
}

function DocumentCard({ document, type }: { document: PortalDocument; type: string }) {
  const date = document.date_order || document.invoice_date || document.date
  const status = document.payment_state || document.state

  return (
    <article className="rounded-[1.7rem] border border-white/75 bg-white/72 p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Badge className="rounded-full bg-gold/15 text-charcoal">
            {type === "invoice" ? "Facture" : type === "quote" ? "Devis" : "Commande"}
          </Badge>
          <h3 className="mt-4 font-serif text-3xl leading-none">{document.name}</h3>
          <p className="mt-2 text-sm text-warm-gray">
            {date ? new Intl.DateTimeFormat("fr-SN").format(new Date(date)) : "Date non renseignée"}
          </p>
        </div>
        <span className="rounded-full border border-charcoal/10 bg-ivory px-3 py-1 text-xs capitalize text-warm-gray">
          {status}
        </span>
      </div>
      <Separator className="my-5 bg-charcoal/8" />
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-warm-gray">Total</p>
          <p className="mt-1 text-xl font-semibold">{document.amount_total_formatted}</p>
        </div>
        <Button
          asChild
          variant="outline"
          className="rounded-full border-charcoal/10 bg-white hover:bg-cream"
        >
          <a href={document.href || `/odoo/my/${type}s/${document.id}`}>
            Ouvrir
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </a>
        </Button>
      </div>
    </article>
  )
}

function EmptyPortal({
  actionHref,
  actionLabel,
  description,
  external,
  icon,
  title,
}: {
  actionHref: string
  actionLabel: string
  description: string
  external?: boolean
  icon: string
  title: string
}) {
  return (
    <section className="grid min-h-[560px] place-items-center rounded-[2.3rem] border border-white/75 bg-white/70 p-8 text-center shadow-luxury">
      <div className="max-w-xl">
        <AppIcon icon={icon} className="mx-auto size-12 text-gold" />
        <h1 className="mt-5 font-serif text-5xl leading-none md:text-6xl">{title}</h1>
        <p className="mt-4 text-warm-gray">{description}</p>
        {external ? (
          <Button asChild className="mt-7 rounded-full bg-charcoal px-7 text-ivory">
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        ) : (
          <Button asChild className="mt-7 rounded-full bg-charcoal px-7 text-ivory">
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        )}
      </div>
    </section>
  )
}
