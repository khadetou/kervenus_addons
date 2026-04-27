import { useEffect, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLogout, useSession } from "@/hooks/use-session"

const portalItems = [
  { label: "Mon portail", href: "/portal", icon: "solar:user-rounded-linear" },
  { label: "Commandes", href: "/portal/orders", icon: "solar:bag-4-linear" },
  { label: "Devis", href: "/portal/quotes", icon: "solar:document-text-linear" },
  { label: "Factures", href: "/portal/invoices", icon: "solar:bill-list-linear" },
  { label: "Favoris", href: "/wishlist", icon: "solar:heart-linear" },
]

function getInitials(name?: string | null) {
  const cleanName = name?.trim()
  if (!cleanName) return "KV"

  const parts = cleanName.split(/\s+/).filter(Boolean)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}

export function UserPortalDropdown() {
  const { data: session } = useSession()
  const logout = useLogout()
  const isAuthenticated = Boolean(session?.authenticated)
  const avatarUrl = session?.user?.avatar_url
  const initials = getInitials(session?.user?.name)
  const [avatarFailed, setAvatarFailed] = useState(false)

  useEffect(() => {
    setAvatarFailed(false)
  }, [avatarUrl])

  if (!isAuthenticated) {
    return (
      <Button
        asChild
        variant="ghost"
        size="icon-lg"
        className="rounded-full text-charcoal transition hover:-translate-y-0.5 hover:bg-white hover:text-gold"
        aria-label="Se connecter"
      >
        <a href="/login">
          <AppIcon icon="solar:user-rounded-linear" className="size-5" />
        </a>
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-lg"
          className="rounded-full text-charcoal transition hover:-translate-y-0.5 hover:bg-white hover:text-gold"
          aria-label="Ouvrir le menu client"
        >
          {avatarUrl && !avatarFailed ? (
            <img
              src={avatarUrl}
              alt={session?.user?.name || "Compte"}
              className="size-8 rounded-full object-cover ring-1 ring-charcoal/10"
              onError={() => setAvatarFailed(true)}
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-charcoal font-serif text-[0.7rem] font-semibold tracking-[0.08em] text-ivory">
              {initials}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 rounded-[1.35rem] border-white/75 bg-ivory/96 p-2 shadow-luxury backdrop-blur-xl"
      >
        <DropdownMenuLabel className="rounded-2xl bg-white/70 p-4">
          <span className="block text-[11px] uppercase tracking-[0.2em] text-gold">
            Espace client
          </span>
          <span className="mt-1 block truncate font-serif text-2xl text-charcoal">
            {session?.user?.name}
          </span>
          <span className="mt-1 block truncate text-xs font-normal text-warm-gray">
            {session?.user?.login}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-2 bg-charcoal/8" />
        {portalItems.map((item) => (
          <DropdownMenuItem key={item.href} asChild className="rounded-xl p-0">
            <a
              href={item.href}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm"
            >
              <AppIcon icon={item.icon} className="size-4 text-gold" />
              {item.label}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="my-2 bg-charcoal/8" />
        <DropdownMenuItem
          className="rounded-xl px-3 py-2.5 text-sm text-warm-gray focus:text-charcoal"
          onClick={() => logout.mutate()}
        >
          <AppIcon icon="solar:logout-2-linear" className="size-4 text-gold" />
          Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
