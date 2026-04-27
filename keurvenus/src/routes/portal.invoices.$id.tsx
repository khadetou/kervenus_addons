import { createFileRoute } from "@tanstack/react-router"

import { PortalDocumentDetail } from "@/components/portal/document-detail"
import { usePortalInvoice } from "@/hooks/use-portal"

export const Route = createFileRoute("/portal/invoices/$id")({
  component: PortalInvoiceDetailPage,
})

function PortalInvoiceDetailPage() {
  const { id } = Route.useParams()
  const invoice = usePortalInvoice(id)

  return (
    <PortalDocumentDetail
      document={invoice.data}
      error={invoice.error}
      isLoading={invoice.isLoading}
      kind="invoice"
    />
  )
}
