import { createFileRoute } from "@tanstack/react-router"

import { proxyToOdoo } from "@/lib/server/odoo-proxy"

export const Route = createFileRoute("/odoo/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "root"),
      POST: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "root"),
      PUT: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "root"),
      PATCH: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "root"),
      DELETE: async ({ request, params }) =>
        proxyToOdoo(request, params._splat ?? "", "root"),
    },
  },
})
