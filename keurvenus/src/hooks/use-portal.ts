import { useQuery } from "@tanstack/react-query"

import {
  getPortalDashboard,
  getPortalInvoices,
  getPortalOrders,
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

export function usePortalQuotes() {
  return useQuery({
    queryKey: ["portal", "quotes"],
    queryFn: getPortalQuotes,
    retry: false,
  })
}

export function usePortalInvoices() {
  return useQuery({
    queryKey: ["portal", "invoices"],
    queryFn: getPortalInvoices,
    retry: false,
  })
}
