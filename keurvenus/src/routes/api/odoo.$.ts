import { createFileRoute } from "@tanstack/react-router"

import { proxyToOdoo } from "@/lib/server/odoo-proxy"

export const Route = createFileRoute("/api/odoo/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "api"),
      POST: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "api"),
      PUT: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "api"),
      PATCH: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "api"),
      DELETE: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "api"),
    },
  },
})
