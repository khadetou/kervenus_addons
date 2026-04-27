import { Outlet, createFileRoute, useLocation } from "@tanstack/react-router"

import { PortalDocumentListPage } from "@/components/portal/document-list"
import { usePortalQuotes } from "@/hooks/use-portal"

export const Route = createFileRoute("/portal/quotes")({
  component: PortalQuotesPage,
})

function PortalQuotesPage() {
  const location = useLocation()
  const isQuotesList = location.pathname.replace(/\/$/, "") === "/portal/quotes"

  return isQuotesList ? <PortalQuotesList /> : <Outlet />
}

function PortalQuotesList() {
  const quotes = usePortalQuotes()

  return (
    <PortalDocumentListPage
      documents={quotes.data}
      error={quotes.error}
      isLoading={quotes.isLoading}
      kind="quote"
    />
  )
}
