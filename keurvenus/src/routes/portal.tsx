import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router"
import { useEffect, useState, type ReactNode } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

type PortalTab = "orders" | "quotes" | "invoices"
type DocumentKind = "order" | "quote" | "invoice"

function PortalPage() {
  const location = useLocation()
  const isPortalIndex = location.pathname.replace(/\/$/, "") === "/portal"

  return isPortalIndex ? <PortalIndex /> : <Outlet />
}

function PortalIndex() {
  const [activeTab, setActiveTab] = useState<PortalTab>("orders")
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
      if (hash === "orders" || hash === "quotes" || hash === "invoices") setActiveTab(hash)
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
  const documentData = {
    orders: {
      documents: orders.data || dashboard.data?.recent_orders || [],
      emptyLabel: "Aucune commande validée pour le moment.",
      isLoading: orders.isLoading,
      type: "order" as const,
    },
    quotes: {
      documents: quotes.data || dashboard.data?.recent_quotes || [],
      emptyLabel: "Aucun devis en cours pour le moment.",
      isLoading: quotes.isLoading,
      type: "quote" as const,
    },
    invoices: {
      documents: invoices.data || dashboard.data?.recent_invoices || [],
      emptyLabel: "Aucune facture disponible pour le moment.",
      isLoading: invoices.isLoading,
      type: "invoice" as const,
    },
  }
  const activeDocuments = documentData[activeTab].documents
  const activeTotal = activeDocuments.reduce((sum, document) => sum + (document.amount_total || 0), 0)
  const activeLabel = portalTabs.find((tab) => tab.value === activeTab)?.label || "Documents"

  function handleTabChange(value: string) {
    if (value !== "orders" && value !== "quotes" && value !== "invoices") return
    setActiveTab(value)
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${value}`)
  }

  return (
    <PortalShell>
      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="rounded-[2.2rem] border border-white/75 bg-white/72 p-6 text-charcoal shadow-luxury md:p-8">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            espace client
          </p>
          <h1 className="mt-3 font-serif text-5xl leading-none md:text-6xl xl:text-7xl">
            Bonjour {dashboard.data?.profile.name || session.data?.user?.name || "Kër Venus"}.
          </h1>
          <p className="mt-4 max-w-3xl text-warm-gray">
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
          <div className="mt-6 grid grid-cols-2 gap-2">
            <ProfileShortcut icon="solar:danger-circle-linear" label="Échéances" value={counters?.overdue_invoices ?? 0} />
            <ProfileShortcut icon="solar:heart-linear" label="Favoris" value={counters?.wishlist ?? 0} />
          </div>
        </aside>
      </section>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-6" id="orders">
        <TabsList className="grid !h-auto w-full grid-cols-1 items-stretch gap-2 rounded-[1.6rem] border border-white/80 bg-white/72 p-2 text-charcoal shadow-soft backdrop-blur md:grid-cols-3">
          {portalTabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              id={tab.value}
              className="group !h-auto min-h-[5.25rem] justify-start rounded-[1.15rem] border border-transparent bg-ivory/65 px-4 py-3 text-left text-charcoal shadow-none hover:border-gold/15 hover:bg-white data-[state=active]:!border-charcoal data-[state=active]:!bg-charcoal data-[state=active]:!text-ivory data-[state=active]:shadow-soft"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-gold shadow-[inset_0_0_0_1px_rgba(32,27,24,0.06)] group-data-[state=active]:bg-white/10 group-data-[state=active]:text-champagne group-data-[state=active]:shadow-none">
                <AppIcon icon={tab.icon} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-base font-semibold">{tab.label}</span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-charcoal group-data-[state=active]:bg-white/12 group-data-[state=active]:text-ivory">
                    {tab.count}
                  </span>
                </span>
                <span className="mt-1 block truncate text-[11px] uppercase tracking-[0.16em] text-warm-gray group-data-[state=active]:text-ivory/56">
                  {tab.description}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <TabsContent value="orders" className="m-0">
              <DocumentGrid {...documentData.orders} />
            </TabsContent>
            <TabsContent value="quotes" className="m-0">
              <DocumentGrid {...documentData.quotes} />
            </TabsContent>
            <TabsContent value="invoices" className="m-0">
              <DocumentGrid {...documentData.invoices} />
            </TabsContent>
          </div>
          <PortalDocumentSummary
            count={activeDocuments.length}
            label={activeLabel}
            total={activeTotal}
            overdueCount={counters?.overdue_invoices ?? 0}
            wishlistCount={counters?.wishlist ?? 0}
          />
        </div>
      </Tabs>
    </PortalShell>
  )
}

function PortalShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">{children}</main>
}

function ProfileShortcut({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="rounded-[1.1rem] border border-white/10 bg-white/8 p-3">
      <div className="flex items-center justify-between gap-3">
        <AppIcon icon={icon} className="size-4 text-champagne" />
        <span className="font-serif text-2xl leading-none">{value}</span>
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-[0.18em] text-ivory/48">{label}</p>
    </div>
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
      <div className="grid gap-3 rounded-[2rem] border border-white/75 bg-white/70 p-3 text-charcoal shadow-soft">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-28 animate-pulse rounded-[1.45rem] bg-ivory/75" />
        ))}
      </div>
    )
  }

  if (!documents.length) {
    return (
      <div className="rounded-[2rem] border border-dashed border-charcoal/15 bg-white/60 p-8 text-center text-charcoal">
        <p className="font-serif text-3xl">{emptyLabel}</p>
        <Button asChild className="mt-5 rounded-full bg-charcoal text-ivory">
          <Link to="/shop">Découvrir la boutique</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-3 rounded-[2rem] border border-white/75 bg-white/70 p-3 text-charcoal shadow-soft">
      {documents.map((document) => (
        <DocumentCard key={`${type}-${document.id}`} document={document} type={type} />
      ))}
    </div>
  )
}

function DocumentCard({ document, type }: { document: PortalDocument; type: DocumentKind }) {
  const date = document.date_order || document.invoice_date || document.date
  const detailHref =
    type === "invoice"
      ? `/portal/invoices/${document.id}`
      : type === "quote"
        ? `/portal/quotes/${document.id}`
        : `/portal/orders/${document.id}`
  const status = statusLabel(document, type)
  const reference = document.payment_reference || document.invoice_origin

  return (
    <article className="grid gap-4 rounded-[1.55rem] border border-charcoal/8 bg-white/82 p-4 text-charcoal shadow-[0_18px_42px_rgba(32,27,24,0.06)] transition hover:-translate-y-0.5 hover:border-gold/22 hover:bg-white md:grid-cols-[minmax(0,1.2fr)_0.75fr_0.7fr_auto] md:items-center">
      <div className="min-w-0">
        <Badge className="rounded-full bg-gold/14 text-charcoal">
          {type === "invoice" ? "Facture" : type === "quote" ? "Devis" : "Commande"}
        </Badge>
        <h3 className="mt-3 truncate font-serif text-3xl leading-none">{document.name}</h3>
        {reference ? <p className="mt-2 truncate text-sm text-warm-gray">{reference}</p> : null}
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-warm-gray">Date</p>
        <p className="mt-1 text-sm font-medium">
          {date ? new Intl.DateTimeFormat("fr-SN").format(new Date(date)) : "Non renseignée"}
        </p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-warm-gray">Statut</p>
        <span className="mt-1 inline-flex items-center gap-2 rounded-full border border-charcoal/8 bg-ivory px-3 py-1.5 text-xs font-semibold text-charcoal">
          <span className="size-1.5 rounded-full bg-gold" />
          {status}
        </span>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-3 md:justify-end">
        <div className="md:text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-warm-gray">Total</p>
          <p className="mt-1 text-xl font-bold">{document.amount_total_formatted}</p>
        </div>
        <div className="flex gap-2">
          {document.download_url ? (
            <Button asChild variant="outline" className="h-9 rounded-full border-charcoal/10 bg-white px-3 text-charcoal hover:border-gold/35 hover:bg-champagne/70">
              <a href={document.download_url} aria-label={`Télécharger ${document.name}`}>
                <AppIcon icon="solar:download-minimalistic-linear" className="size-4" />
                PDF
              </a>
            </Button>
          ) : null}
          <Button
            asChild
            className="h-9 rounded-full bg-charcoal px-4 text-ivory shadow-soft hover:bg-gold hover:text-charcoal"
          >
            <Link to={detailHref}>
              Ouvrir
              <AppIcon icon="solar:arrow-right-linear" className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </article>
  )
}

function PortalDocumentSummary({
  count,
  label,
  overdueCount,
  total,
  wishlistCount,
}: {
  count: number
  label: string
  overdueCount: number
  total: number
  wishlistCount: number
}) {
  return (
    <aside className="h-fit rounded-[2rem] border border-white/75 bg-charcoal p-5 text-ivory shadow-luxury xl:sticky xl:top-28">
      <p className="text-xs uppercase tracking-[0.24em] text-champagne">vue active</p>
      <h2 className="mt-3 font-serif text-4xl leading-none">{label}</h2>
      <div className="mt-5 grid gap-3">
        <SummaryBlock label="Documents" value={String(count)} />
        <SummaryBlock label="Volume total" value={formatCompactMoney(total)} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <SummaryMini icon="solar:danger-circle-linear" label="Échéances" value={overdueCount} />
        <SummaryMini icon="solar:heart-linear" label="Favoris" value={wishlistCount} />
      </div>
      <Button asChild className="mt-5 h-11 w-full rounded-full bg-champagne text-charcoal hover:bg-gold">
        <Link to="/shop">
          Continuer vos achats
          <AppIcon icon="solar:arrow-right-linear" className="size-4" />
        </Link>
      </Button>
    </aside>
  )
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/48">{label}</p>
      <p className="mt-2 font-serif text-3xl leading-none text-ivory">{value}</p>
    </div>
  )
}

function SummaryMini({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="rounded-[1rem] border border-white/10 bg-white/8 p-3">
      <AppIcon icon={icon} className="size-4 text-champagne" />
      <p className="mt-2 font-serif text-2xl leading-none">{value}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-ivory/48">{label}</p>
    </div>
  )
}

function statusLabel(document: PortalDocument, type: DocumentKind) {
  if (type === "invoice") {
    if (document.payment_state === "paid") return "Payée"
    if (document.payment_state === "partial") return "Partielle"
    if (document.payment_state === "in_payment") return "En paiement"
    return "À payer"
  }
  if (type === "order") return document.delivery_status?.label || "Confirmée"
  if (document.state === "sent") return "Envoyé"
  return "Brouillon"
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("fr-SN", {
    currency: "XOF",
    currencyDisplay: "code",
    maximumFractionDigits: 0,
    style: "currency",
  })
    .format(value)
    .replace("XOF", "CFA")
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
    <section className="grid min-h-[560px] place-items-center rounded-[2.3rem] border border-white/75 bg-white/70 p-8 text-center text-charcoal shadow-luxury">
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
