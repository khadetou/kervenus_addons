import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"

import { PortalDocumentListPage } from "@/components/portal/document-list"
import { usePortalOrders } from "@/hooks/use-portal"

export const Route = createFileRoute("/portal/orders")({
  component: PortalOrdersPage,
})

function PortalOrdersPage() {
  const location = useLocation()
  const isOrdersList = location.pathname.replace(/\/$/, "") === "/portal/orders"

  return isOrdersList ? <PortalOrdersList /> : <Outlet />
}

function PortalOrdersList() {
  const orders = usePortalOrders()

  return (
    <PortalDocumentListPage
      documents={orders.data}
      error={orders.error}
      isLoading={orders.isLoading}
      kind="order"
    />
  )
}
