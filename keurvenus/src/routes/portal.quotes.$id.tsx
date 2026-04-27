import { createFileRoute } from "@tanstack/react-router"

import { PortalDocumentDetail } from "@/components/portal/document-detail"
import { usePortalQuote } from "@/hooks/use-portal"

export const Route = createFileRoute("/portal/quotes/$id")({
  component: PortalQuoteDetailPage,
})

function PortalQuoteDetailPage() {
  const { id } = Route.useParams()
  const quote = usePortalQuote(id)

  return (
    <PortalDocumentDetail
      document={quote.data}
      error={quote.error}
      isLoading={quote.isLoading}
      kind="quote"
    />
  )
}
