import { AppIcon } from "@/components/icons/icon"
import { useSiteContent } from "@/hooks/use-site-content"

export function AnnouncementBar() {
  const { data } = useSiteContent()

  return (
    <div className="bg-charcoal px-3 py-2 text-center text-[10px] font-semibold uppercase leading-5 tracking-[0.12em] text-ivory sm:text-xs sm:tracking-[0.18em]">
      <span className="mx-auto inline-flex max-w-[min(760px,calc(100vw-24px))] items-center justify-center gap-2">
        <AppIcon icon="solar:stars-minimalistic-linear" className="size-4 text-gold" />
        {data?.announcement ?? "Nouvelle collection Maison Élégante"}
      </span>
    </div>
  )
}
