import { useQuery } from "@tanstack/react-query"

import {
  getPortalDashboard,
  getPortalInvoice,
  getPortalInvoices,
  getPortalOrder,
  getPortalOrders,
  getPortalQuote,
  getPortalQuotes,
} from "@/lib/odoo-api"

export function usePortalDashboard() {
  return useQuery({
    queryKey: ["portal", "dashboard"],
    queryFn: getPortalDashboard,
    retry: false,
  })
}

export function usePortalOrders() {
  return useQuery({
    queryKey: ["portal", "orders"],
    queryFn: getPortalOrders,
    retry: false,
  })
}

export function usePortalOrder(id: number | string) {
  return useQuery({
    queryKey: ["portal", "orders", id],
    queryFn: () => getPortalOrder(id),
    retry: false,
    enabled: Boolean(id),
  })
}

export function usePortalQuotes() {
  return useQuery({
    queryKey: ["portal", "quotes"],
    queryFn: getPortalQuotes,
    retry: false,
  })
}

export function usePortalQuote(id: number | string) {
  return useQuery({
    queryKey: ["portal", "quotes", id],
    queryFn: () => getPortalQuote(id),
    retry: false,
    enabled: Boolean(id),
  })
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: getPortalInvoices,
    retry: false,
  })
}

export function usePortalInvoice(id: number | string) {
  return useQuery({
    queryKey: ["portal", "invoices", id],
    queryFn: () => getPortalInvoice(id),
    retry: false,
    enabled: Boolean(id),
  })
}
