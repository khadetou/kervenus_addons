import { createFileRoute } from "@tanstack/react-router"

import { PortalDocumentDetail } from "@/components/portal/document-detail"
import { usePortalOrder } from "@/hooks/use-portal"

export const Route = createFileRoute("/portal/orders/$id")({
  component: PortalOrderDetailPage,
})

function PortalOrderDetailPage() {
  const { id } = Route.useParams()
  const order = usePortalOrder(id)

  return (
    <PortalDocumentDetail
      document={order.data}
      error={order.error}
      isLoading={order.isLoading}
      kind="order"
    />
  )
}
