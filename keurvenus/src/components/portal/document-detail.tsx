import { Link } from "@tanstack/react-router"
import type { ReactNode } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { PortalDocument, PortalDocumentLine } from "@/lib/types"
import { cn } from "@/lib/utils"

type DocumentKind = "order" | "quote" | "invoice"

const actionButtonClass =
  "h-11 rounded-full px-5 font-semibold shadow-[0_16px_32px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5"
const primaryActionClass =
  "border border-champagne/30 bg-champagne text-charcoal hover:bg-gold hover:text-charcoal"
const darkActionClass =
  "border border-white/10 bg-white/12 text-ivory shadow-none hover:border-champagne/40 hover:bg-white/18 hover:text-ivory"
const lightActionClass =
  "border border-charcoal/10 bg-white text-charcoal shadow-soft hover:border-gold/35 hover:bg-champagne/70"

const kindCopy: Record<DocumentKind, { eyebrow: string; title: string; backHash: string; icon: string }> = {
  order: {
    eyebrow: "commande client",
    title: "Commande",
    backHash: "orders",
    icon: "solar:bag-4-linear",
  },
  quote: {
    eyebrow: "devis client",
    title: "Devis",
    backHash: "quotes",
    icon: "solar:document-text-linear",
  },
  invoice: {
    eyebrow: "facture client",
    title: "Facture",
    backHash: "invoices",
    icon: "solar:bill-list-linear",
  },
}

export function PortalDocumentDetail({
  document,
  error,
  isLoading,
  kind,
}: {
  document?: PortalDocument
  error?: Error | null
  isLoading: boolean
  kind: DocumentKind
}) {
  const copy = kindCopy[kind]

  if (isLoading) {
    return (
      <PortalDocumentShell backHash={copy.backHash}>
        <Skeleton className="h-[560px] rounded-[2.2rem] bg-white/65" />
      </PortalDocumentShell>
    )
  }

  if (error || !document) {
    return (
      <PortalDocumentShell backHash={copy.backHash}>
        <section className="grid min-h-[460px] place-items-center rounded-[2.2rem] border border-white/75 bg-white/72 p-8 text-center shadow-luxury">
          <div className="max-w-xl">
            <AppIcon icon="solar:document-add-linear" className="mx-auto size-12 text-gold" />
            <h1 className="mt-5 font-serif text-5xl leading-none">Document introuvable</h1>
            <p className="mt-4 text-warm-gray">
              Ce document n’est pas disponible dans votre espace client ou n’appartient pas à votre compte.
            </p>
            <Button asChild className={cn("mt-7", actionButtonClass, "bg-charcoal px-7 text-ivory hover:bg-gold hover:text-charcoal")}>
              <Link to="/portal" hash={copy.backHash}>
                Retour au portail
              </Link>
            </Button>
          </div>
        </section>
      </PortalDocumentShell>
    )
  }

  const date = document.date_order || document.invoice_date || document.date
  const formattedDate = date ? new Intl.DateTimeFormat("fr-SN").format(new Date(date)) : "Date non renseignée"
  const status = statusLabel(document, kind)
  const billingPartner = document.invoice_partner || document.partner
  const shippingPartner = document.shipping_partner || document.partner
  const relatedInvoices = document.related_invoices || []
  const relatedOrders = document.related_orders || []
  const shipments = document.shipments || []

  return (
    <PortalDocumentShell backHash={copy.backHash}>
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <article className="rounded-[2.2rem] border border-white/75 bg-white/76 p-6 shadow-luxury md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-gold">{copy.eyebrow}</p>
              <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
                {copy.title} {document.name}
              </h1>
              <p className="mt-4 text-warm-gray">
                Document synchronisé avec le backoffice Kër Venus, consultable directement depuis la boutique.
              </p>
            </div>
            <Badge className="h-8 rounded-full bg-gold/15 px-3 text-charcoal">
              {status}
            </Badge>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <InfoTile icon="solar:calendar-linear" label="Date" value={formattedDate} />
            <InfoTile icon={copy.icon} label="Référence" value={document.name} />
            <InfoTile icon="solar:wallet-money-linear" label="Total" value={document.amount_total_formatted} strong />
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <AddressPanel
              icon="solar:bill-list-linear"
              label={kind === "invoice" ? "Client facturé" : "Facturation"}
              partner={billingPartner}
            />
            <AddressPanel
              icon="solar:delivery-linear"
              label={kind === "invoice" ? "Source" : "Livraison"}
              partner={kind === "invoice" ? undefined : shippingPartner}
              fallback={kind === "invoice" ? document.invoice_origin || document.payment_reference || "Aucune source liée" : undefined}
            />
          </div>

          {relatedInvoices.length || relatedOrders.length || shipments.length ? (
            <>
              <Separator className="my-7 bg-charcoal/8" />
              <div className="grid gap-3 md:grid-cols-2">
                {relatedInvoices.length ? (
                  <LinkedPanel title="Factures liées" icon="solar:bill-list-linear">
                    {relatedInvoices.map((invoice) => (
                      <LinkedDocumentRow key={invoice.id} href={invoice.href || `/portal/invoices/${invoice.id}`} name={invoice.name} meta={invoice.payment_state || invoice.state || ""} value={invoice.amount_due_formatted || invoice.amount_total_formatted || ""} />
                    ))}
                  </LinkedPanel>
                ) : null}
                {relatedOrders.length ? (
                  <LinkedPanel title="Commandes liées" icon="solar:bag-4-linear">
                    {relatedOrders.map((order) => (
                      <LinkedDocumentRow key={order.id} href={order.href || "/portal"} name={order.name} meta={order.state || ""} value={order.amount_total_formatted || ""} />
                    ))}
                  </LinkedPanel>
                ) : null}
                {shipments.length ? (
                  <LinkedPanel title="Bons de livraison" icon="solar:box-linear">
                    {shipments.map((shipment) => (
                      <LinkedDocumentRow key={shipment.id} name={shipment.name} meta={shipment.state_label || shipment.state} value={shipment.date_done || shipment.scheduled_date || ""} />
                    ))}
                  </LinkedPanel>
                ) : null}
              </div>
            </>
          ) : null}

          {document.preview_url ? (
            <>
              <Separator className="my-7 bg-charcoal/8" />
              <DocumentPreview
                downloadUrl={document.download_url}
                kindLabel={copy.title.toLowerCase()}
                name={document.name}
                previewUrl={document.preview_url}
              />
            </>
          ) : null}

          <Separator className="my-7 bg-charcoal/8" />

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">produits</p>
              <h2 className="font-serif text-3xl leading-none">Détail des lignes</h2>
            </div>
            {document.lines?.length ? (
              <Badge className="rounded-full bg-ivory text-charcoal">{document.lines.length} ligne{document.lines.length > 1 ? "s" : ""}</Badge>
            ) : null}
          </div>
          <div className="grid gap-3">
            {(document.lines || []).map((line) => (
              <DocumentLineItem key={line.id} line={line} />
            ))}
          </div>
        </article>

        <aside className="h-fit rounded-[2.2rem] border border-white/75 bg-charcoal p-6 text-ivory shadow-luxury">
          <p className="text-xs uppercase tracking-[0.24em] text-champagne">résumé</p>
          <h2 className="mt-3 font-serif text-4xl leading-none">{document.amount_total_formatted}</h2>
          <div className="mt-6 grid gap-3 text-sm">
            <SummaryRow label="Sous-total" value={document.amount_untaxed_formatted || document.amount_total_formatted} />
            <SummaryRow label="Taxes" value={document.amount_tax_formatted || "0 FCFA"} />
            {document.delivery?.carrier ? (
              <SummaryRow label={document.delivery.carrier} value={document.delivery.amount_formatted || "0 FCFA"} />
            ) : null}
            {document.amount_due_formatted ? (
              <SummaryRow label={kind === "invoice" ? "Reste à payer" : "Solde facturé"} value={document.amount_due_formatted} />
            ) : null}
            <Separator className="my-2 bg-white/12" />
            <SummaryRow label="Total" value={document.amount_total_formatted} strong />
          </div>
          <div className="mt-6 grid gap-3 rounded-[1.2rem] border border-white/10 bg-white/8 p-4 text-sm text-ivory/72">
            {document.payment_reference ? (
              <SummaryRow label="Référence" value={document.payment_reference} />
            ) : null}
            {document.salesperson?.name ? (
              <SummaryRow label="Conseiller" value={document.salesperson.name} />
            ) : null}
            {kind === "order" && document.delivery_status?.label ? (
              <SummaryRow label="Livraison" value={document.delivery_status.label} />
            ) : null}
          </div>
          <div className="mt-7 grid gap-3">
            {kind === "invoice" && document.payment_state !== "paid" ? (
              <Button className={cn(actionButtonClass, primaryActionClass, "justify-between")}>
                <span className="inline-flex items-center gap-2">
                  <AppIcon icon="solar:card-transfer-linear" className="size-4" />
                  Payer bientôt
                </span>
                <AppIcon icon="solar:arrow-right-linear" className="size-4" />
              </Button>
            ) : null}
            {document.download_url ? (
              <Button asChild variant="outline" className={cn(actionButtonClass, darkActionClass, "justify-between")}>
                <a href={document.download_url}>
                  <span className="inline-flex items-center gap-2">
                    <AppIcon icon="solar:download-minimalistic-linear" className="size-4" />
                    Télécharger PDF
                  </span>
                  <AppIcon icon="solar:arrow-right-up-linear" className="size-4" />
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline" className={cn(actionButtonClass, "border-white/10 bg-transparent text-ivory/78 shadow-none hover:bg-white/8 hover:text-ivory")}>
              <Link to="/portal" hash={copy.backHash}>
                <AppIcon icon="solar:arrow-left-linear" className="size-4" />
                Retour au portail
              </Link>
            </Button>
          </div>
        </aside>
      </section>
    </PortalDocumentShell>
  )
}

function PortalDocumentShell({ backHash, children }: { backHash: string; children: ReactNode }) {
  return (
    <main className="mx-auto mt-10 w-[min(1560px,calc(100vw-32px))]">
      <Button asChild variant="ghost" className="mb-4 h-10 rounded-full border border-charcoal/8 bg-white/54 px-4 text-warm-gray shadow-soft hover:-translate-y-0.5 hover:bg-white hover:text-charcoal">
        <Link to="/portal" hash={backHash}>
          <AppIcon icon="solar:arrow-left-linear" className="size-4" />
          Portail
        </Link>
      </Button>
      {children}
    </main>
  )
}

function InfoTile({ icon, label, strong, value }: { icon: string; label: string; strong?: boolean; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-charcoal/8 bg-ivory/70 p-4">
      <AppIcon icon={icon} className="size-5 text-gold" />
      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-warm-gray">{label}</p>
      <p className={strong ? "mt-1 text-lg font-bold" : "mt-1 text-sm font-semibold"}>{value}</p>
    </div>
  )
}

function SummaryRow({ label, strong, value }: { label: string; strong?: boolean; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ivory/68">{label}</span>
      <span className={strong ? "font-bold text-ivory" : "font-medium text-ivory"}>{value}</span>
    </div>
  )
}

function AddressPanel({
  fallback,
  icon,
  label,
  partner,
}: {
  fallback?: string
  icon: string
  label: string
  partner?: PortalDocument["partner"]
}) {
  const address = [
    partner?.street,
    partner?.street2,
    partner?.city,
    partner?.country_name,
  ].filter(Boolean).join(", ")

  return (
    <section className="rounded-[1.35rem] border border-charcoal/8 bg-ivory/60 p-4">
      <div className="flex items-center gap-2">
        <AppIcon icon={icon} className="size-5 text-gold" />
        <p className="text-[11px] uppercase tracking-[0.18em] text-warm-gray">{label}</p>
      </div>
      <h3 className="mt-3 font-semibold">{partner?.name || fallback || "Non renseigné"}</h3>
      {partner ? (
        <div className="mt-2 grid gap-1 text-sm text-warm-gray">
          {address ? <p>{address}</p> : null}
          {partner.phone ? <p>{partner.phone}</p> : null}
          {partner.email ? <p>{partner.email}</p> : null}
        </div>
      ) : null}
    </section>
  )
}

function LinkedPanel({ children, icon, title }: { children: ReactNode; icon: string; title: string }) {
  return (
    <section className="rounded-[1.35rem] border border-charcoal/8 bg-white/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AppIcon icon={icon} className="size-5 text-gold" />
        <h3 className="font-serif text-2xl leading-none">{title}</h3>
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

function LinkedDocumentRow({
  href,
  meta,
  name,
  value,
}: {
  href?: string
  meta?: string
  name: string
  value?: string
}) {
  const content = (
    <>
      <span className="min-w-0">
        <span className="block truncate font-semibold">{name}</span>
        {meta ? <span className="block text-xs text-warm-gray">{meta}</span> : null}
      </span>
      {value ? <span className="shrink-0 text-sm font-semibold">{value}</span> : null}
    </>
  )

  if (href) {
    return (
      <Link to={href} className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-ivory/70 px-3 py-2 text-sm transition hover:-translate-y-0.5 hover:border-gold/20 hover:bg-gold/12">
        {content}
      </Link>
    )
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-ivory/70 px-3 py-2 text-sm">
      {content}
    </div>
  )
}

function DocumentPreview({
  downloadUrl,
  kindLabel,
  name,
  previewUrl,
}: {
  downloadUrl?: string
  kindLabel: string
  name: string
  previewUrl: string
}) {
  return (
    <section className="overflow-hidden rounded-[1.55rem] border border-charcoal/8 bg-ivory shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal/8 bg-white/76 px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-gold/14 text-gold">
            <AppIcon icon="solar:file-text-linear" className="size-5" />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gold">aperçu {kindLabel}</p>
            <h2 className="font-serif text-2xl leading-none">{name}</h2>
          </div>
        </div>
        {downloadUrl ? (
          <Button asChild size="sm" variant="outline" className={cn("h-9 rounded-full px-4", lightActionClass)}>
            <a href={downloadUrl}>
              <AppIcon icon="solar:download-minimalistic-linear" className="size-4" />
              Télécharger
            </a>
          </Button>
        ) : null}
      </div>
      <iframe
        title={`Aperçu ${kindLabel} ${name}`}
        src={previewUrl}
        className="h-[720px] w-full bg-white"
      />
    </section>
  )
}

function DocumentLineItem({ line }: { line: PortalDocumentLine }) {
  const name = cleanLineName(line.name)
  const initials = lineInitials(name)

  return (
    <article className="grid grid-cols-[76px_minmax(0,1fr)] gap-4 rounded-[1.55rem] border border-charcoal/8 bg-white/80 p-3 shadow-soft sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center">
      {line.image_url ? (
        <img
          src={line.image_url}
          alt={name}
          className="size-[76px] rounded-[1.15rem] bg-ivory object-contain p-2 sm:size-[92px]"
          loading="lazy"
        />
      ) : (
        <div className="grid size-[76px] place-items-center rounded-[1.15rem] bg-charcoal font-serif text-xl font-semibold text-ivory sm:size-[92px]">
          {initials}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="line-clamp-2 font-serif text-2xl leading-none">{name}</h3>
        <p className="mt-2 text-sm text-warm-gray">
          Quantité {niceQuantity(line.quantity)} · {line.price_unit_formatted || ""}
        </p>
      </div>
      <p className="col-span-2 text-right text-base font-bold sm:col-span-1">
        {line.subtotal_formatted}
      </p>
    </article>
  )
}

function statusLabel(document: PortalDocument, kind: DocumentKind) {
  if (kind === "invoice") {
    if (document.payment_state === "paid") return "Payée"
    if (document.payment_state === "partial") return "Partielle"
    if (document.payment_state === "in_payment") return "En paiement"
    return "En attente de paiement"
  }
  if (kind === "order") return document.delivery_status?.label || "Commande confirmée"
  if (document.state === "sent") return "Devis envoyé"
  return "Brouillon"
}

function cleanLineName(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function lineInitials(value: string) {
  const words = value.replace(/\[[^\]]+\]/g, "").split(/\s+/).filter(Boolean)
  return (words[0]?.[0] || "K").concat(words[1]?.[0] || "V").toUpperCase()
}

function niceQuantity(value?: number) {
  if (!value) return "0"
  return Number.isInteger(value) ? String(value) : value.toLocaleString("fr-SN")
}
