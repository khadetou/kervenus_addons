import { Link } from "@tanstack/react-router"

import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { PortalDocument } from "@/lib/types"
import { cn } from "@/lib/utils"

type DocumentKind = "order" | "quote" | "invoice"

const listActionClass =
  "rounded-full font-semibold shadow-soft transition hover:-translate-y-0.5"
const listPrimaryActionClass =
  "bg-charcoal text-ivory hover:bg-gold hover:text-charcoal"
const listSecondaryActionClass =
  "border-charcoal/10 bg-white text-charcoal hover:border-gold/35 hover:bg-champagne/70"

const copyByKind: Record<
  DocumentKind,
  {
    eyebrow: string
    title: string
    description: string
    empty: string
    icon: string
    backHash: string
  }
> = {
  order: {
    eyebrow: "achats validés",
    title: "Commandes",
    description: "Suivez vos commandes confirmées, leur livraison et les factures liées.",
    empty: "Aucune commande validée pour le moment.",
    icon: "solar:bag-4-linear",
    backHash: "orders",
  },
  quote: {
    eyebrow: "propositions",
    title: "Devis",
    description: "Retrouvez vos devis et propositions commerciales synchronisés avec Odoo.",
    empty: "Aucun devis en cours pour le moment.",
    icon: "solar:document-text-linear",
    backHash: "quotes",
  },
  invoice: {
    eyebrow: "documents à suivre",
    title: "Factures",
    description: "Consultez vos factures, montants dus, échéances et téléchargements.",
    empty: "Aucune facture disponible pour le moment.",
    icon: "solar:bill-list-linear",
    backHash: "invoices",
  },
}

export function PortalDocumentListPage({
  documents,
  error,
  isLoading,
  kind,
}: {
  documents?: PortalDocument[]
  error?: Error | null
  isLoading: boolean
  kind: DocumentKind
}) {
  const copy = copyByKind[kind]
  const items = documents || []
  const total = items.reduce((sum, item) => sum + (item.amount_total || 0), 0)

  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <Button asChild variant="ghost" className="mb-4 h-10 rounded-full border border-charcoal/8 bg-white/54 px-4 text-warm-gray shadow-soft hover:-translate-y-0.5 hover:bg-white hover:text-charcoal">
        <Link to="/portal" hash={copy.backHash}>
          <AppIcon icon="solar:arrow-left-linear" className="size-4" />
          Espace client
        </Link>
      </Button>

      <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <article className="rounded-[2.2rem] border border-white/75 bg-white/74 p-6 shadow-luxury md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gold">{copy.eyebrow}</p>
              <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">{copy.title}</h1>
              <p className="mt-4 max-w-2xl text-warm-gray">{copy.description}</p>
            </div>
            <span className="grid size-14 place-items-center rounded-full bg-gold/14 text-gold">
              <AppIcon icon={copy.icon} className="size-6" />
            </span>
          </div>
        </article>

        <aside className="rounded-[2.2rem] border border-white/75 bg-charcoal p-6 text-ivory shadow-luxury">
          <p className="text-xs uppercase tracking-[0.24em] text-champagne">résumé</p>
          <div className="mt-5 grid gap-4">
            <SummaryMetric label="Documents" value={String(items.length)} />
            <SummaryMetric label="Volume total" value={formatCompactMoney(total)} />
          </div>
        </aside>
      </section>

      <section className="mt-6 rounded-[2rem] border border-white/75 bg-white/70 p-3 shadow-soft md:p-4">
        {isLoading ? <ListSkeleton /> : error ? <ErrorState /> : items.length ? <DocumentTable documents={items} kind={kind} /> : (
          <div className="grid min-h-72 place-items-center rounded-[1.55rem] border border-dashed border-charcoal/15 bg-ivory/60 p-8 text-center">
            <div>
              <AppIcon icon="solar:folder-open-linear" className="mx-auto size-10 text-gold" />
              <h2 className="mt-4 font-serif text-4xl leading-none">{copy.empty}</h2>
              <Button asChild className={cn("mt-6 h-11 px-7", listActionClass, listPrimaryActionClass)}>
                <Link to="/shop">
                  Découvrir la boutique
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function DocumentTable({ documents, kind }: { documents: PortalDocument[]; kind: DocumentKind }) {
  return (
    <div className="overflow-hidden rounded-[1.55rem] border border-charcoal/8 bg-white">
      <div className="hidden grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_auto] gap-4 border-b border-charcoal/8 bg-ivory/60 px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-warm-gray lg:grid">
        <span>Document</span>
        <span>Date</span>
        <span>Statut</span>
        <span className="text-right">Total</span>
        <span className="text-right">Action</span>
      </div>
      <div className="divide-y divide-charcoal/8">
        {documents.map((document) => (
          <DocumentRow key={`${kind}-${document.id}`} document={document} kind={kind} />
        ))}
      </div>
    </div>
  )
}

function DocumentRow({ document, kind }: { document: PortalDocument; kind: DocumentKind }) {
  const date = document.date_order || document.invoice_date || document.date
  const href =
    kind === "invoice"
      ? `/portal/invoices/${document.id}`
      : kind === "quote"
        ? `/portal/quotes/${document.id}`
        : `/portal/orders/${document.id}`
  const status = statusLabel(document, kind)

  return (
    <article className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.7fr_0.7fr_0.8fr_auto] lg:items-center lg:px-5">
      <div className="min-w-0">
        <Badge className="rounded-full bg-gold/14 text-charcoal">{kindLabel(kind)}</Badge>
        <h2 className="mt-2 truncate font-serif text-3xl leading-none">{document.name}</h2>
        {document.payment_reference || document.invoice_origin ? (
          <p className="mt-2 truncate text-sm text-warm-gray">{document.payment_reference || document.invoice_origin}</p>
        ) : null}
      </div>
      <div className="text-sm text-warm-gray">
        {date ? new Intl.DateTimeFormat("fr-SN").format(new Date(date)) : "Non renseignée"}
      </div>
      <div>
        <span className="inline-flex items-center gap-2 rounded-full border border-charcoal/8 bg-ivory px-3 py-1.5 text-xs font-semibold text-charcoal">
          <span className="size-1.5 rounded-full bg-gold" />
          {status}
        </span>
      </div>
      <div className="text-lg font-bold lg:text-right">{document.amount_total_formatted}</div>
      <div className="flex flex-wrap gap-2 lg:justify-end">
        {kind === "invoice" && document.download_url ? (
          <Button asChild variant="outline" size="sm" className={cn("h-8 px-3", listActionClass, listSecondaryActionClass)}>
            <a href={document.download_url}>
              <AppIcon icon="solar:download-minimalistic-linear" className="size-4" />
              PDF
            </a>
          </Button>
        ) : null}
        <Button asChild size="sm" className={cn("h-8 px-4", listActionClass, listPrimaryActionClass)}>
          <Link to={href}>
            Ouvrir
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </Link>
        </Button>
      </div>
    </article>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/8 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/48">{label}</p>
      <p className="mt-2 font-serif text-3xl leading-none text-ivory">{value}</p>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-3">
      {[1, 2, 3].map((item) => (
        <Skeleton key={item} className="h-24 rounded-[1.4rem] bg-white/65" />
      ))}
    </div>
  )
}

function ErrorState() {
  return (
    <div className="grid min-h-64 place-items-center rounded-[1.55rem] border border-dashed border-charcoal/15 bg-ivory/60 p-8 text-center">
      <div>
        <AppIcon icon="solar:cloud-cross-linear" className="mx-auto size-10 text-gold" />
        <h2 className="mt-4 font-serif text-4xl leading-none">Impossible de charger ces documents.</h2>
        <p className="mt-3 text-warm-gray">Vérifiez votre session client puis réessayez.</p>
      </div>
    </div>
  )
}

function kindLabel(kind: DocumentKind) {
  if (kind === "invoice") return "Facture"
  if (kind === "quote") return "Devis"
  return "Commande"
}

function statusLabel(document: PortalDocument, kind: DocumentKind) {
  if (kind === "invoice") {
    if (document.payment_state === "paid") return "Payée"
    if (document.payment_state === "partial") return "Partielle"
    if (document.payment_state === "in_payment") return "En paiement"
    return "À payer"
  }
  if (kind === "order") return document.delivery_status?.label || "Confirmée"
  if (document.state === "sent") return "Envoyé"
  return "Brouillon"
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("fr-SN", {
    maximumFractionDigits: 0,
    style: "currency",
    currency: "XOF",
    currencyDisplay: "code",
  })
    .format(value)
    .replace("XOF", "CFA")
}
