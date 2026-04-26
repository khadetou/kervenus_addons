import type { ReactNode } from "react"

import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory text-charcoal">
      <AnnouncementBar />
      <SiteHeader />
      {children}
      <SiteFooter />
    </div>
  )
}
