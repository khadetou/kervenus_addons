import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"

import { PortalDocumentListPage } from "@/components/portal/document-list"
import { usePortalInvoices } from "@/hooks/use-portal"

export const Route = createFileRoute("/portal/invoices")({
  component: PortalInvoicesPage,
})

function PortalInvoicesPage() {
  const location = useLocation()
  const isInvoicesList = location.pathname.replace(/\/$/, "") === "/portal/invoices"

  return isInvoicesList ? <PortalInvoicesList /> : <Outlet />
}

function PortalInvoicesList() {
  const invoices = usePortalInvoices()

  return (
    <PortalDocumentListPage
      documents={invoices.data}
      error={invoices.error}
      isLoading={invoices.isLoading}
      kind="invoice"
    />
  )
}
