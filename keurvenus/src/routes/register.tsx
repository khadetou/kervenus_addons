import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { type ComponentProps, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStorefrontConfig } from "@/hooks/use-products"
import { signupWithOdoo } from "@/lib/odoo-api"

export const Route = createFileRoute("/register")({ component: RegisterPage })

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>

function getRedirectTo() {
  if (typeof window === "undefined") return "/portal"
  return new URLSearchParams(window.location.search).get("redirect") || "/portal"
}

function RegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const redirectTo = getRedirectTo()
  const [showPassword, setShowPassword] = useState(false)
  const { data: storefrontConfig } = useStorefrontConfig()
  const authMode = storefrontConfig?.authMode ?? "email_password"
  const usesPhoneAuth = authMode === "phone_password"
  const signup = useMutation({
    mutationFn: signupWithOdoo,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["session"] })
      queryClient.invalidateQueries({ queryKey: ["portal"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      const target = result.redirect_url || redirectTo
      if (target === "/portal") {
        navigate({ to: "/portal" })
      } else {
        window.location.href = target
      }
    },
  })

  const handleSubmit: FormSubmitHandler = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    signup.mutate({
      name: String(formData.get("name") ?? ""),
      login: String(formData.get(usesPhoneAuth ? "phone" : "email") ?? ""),
      phone: usesPhoneAuth ? String(formData.get("phone") ?? "") : undefined,
      password: String(formData.get("password") ?? ""),
      confirm_password: usesPhoneAuth
        ? String(formData.get("password") ?? "")
        : String(formData.get("confirm_password") ?? ""),
      redirect: redirectTo,
    })
  }

  return (
    <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[2.3rem] border border-white/75 bg-white/72 p-7 shadow-luxury md:p-9">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">nouveau compte</p>
        <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
          Entrez dans l’univers Kër Venus.
        </h1>
        <p className="mt-4 max-w-2xl text-warm-gray">
          Créez votre accès client pour suivre vos commandes, retrouver vos
          factures et garder vos favoris synchronisés dans la boutique.
        </p>

        <Card className="mt-8 rounded-[2rem] border-white/75 bg-ivory/80 p-0 shadow-soft">
          <CardHeader className="gap-4 p-5 md:flex-row md:items-center">
            <div className="grid size-12 place-items-center rounded-full bg-gold/15 text-gold">
              <AppIcon icon="solar:user-plus-rounded-linear" className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">
                inscription sécurisée
              </p>
              <CardTitle className="font-serif text-3xl">Créer mon compte</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form onSubmit={handleSubmit} className="grid gap-5">
              <div className="grid gap-2">
                <Label htmlFor="name">Nom complet</Label>
                <div className="relative">
                  <AppIcon
                    icon="solar:user-rounded-linear"
                    className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gold"
                  />
                  <Input
                    id="name"
                    name="name"
                    autoComplete="name"
                    placeholder="Votre nom"
                    className="h-13 rounded-full border-charcoal/10 bg-white pl-12"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={usesPhoneAuth ? "phone" : "email"}>
                  {usesPhoneAuth ? "Telephone" : "Email"}
                </Label>
                <div className="relative">
                  <AppIcon
                    icon={usesPhoneAuth ? "solar:phone-linear" : "solar:letter-linear"}
                    className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gold"
                  />
                  <Input
                    id={usesPhoneAuth ? "phone" : "email"}
                    name={usesPhoneAuth ? "phone" : "email"}
                    type={usesPhoneAuth ? "tel" : "email"}
                    autoComplete="username"
                    placeholder={usesPhoneAuth ? "77 000 00 00" : "nom@email.com"}
                    className="h-13 rounded-full border-charcoal/10 bg-white pl-12"
                    required
                  />
                </div>
              </div>
              <div className={usesPhoneAuth ? "grid gap-2" : "grid gap-2 md:grid-cols-2"}>
                <div className="grid gap-2">
                  <Label htmlFor="password">Mot de passe</Label>
                  <div className="relative">
                    <AppIcon
                      icon="solar:lock-password-linear"
                      className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gold"
                    />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="8 caractères minimum"
                      className="h-13 rounded-full border-charcoal/10 bg-white pl-12 pr-12"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-warm-gray transition hover:bg-cream hover:text-charcoal"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                      aria-pressed={showPassword}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <AppIcon
                        icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"}
                        className="size-5"
                      />
                    </button>
                  </div>
                </div>
                {usesPhoneAuth ? null : (
                  <div className="grid gap-2">
                    <Label htmlFor="confirm_password">Confirmation</Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirmer"
                      className="h-13 rounded-full border-charcoal/10 bg-white px-5"
                      required
                    />
                  </div>
                )}
              </div>
              <Button
                type="submit"
                className="h-12 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
                disabled={signup.isPending}
                aria-busy={signup.isPending}
              >
                {signup.isPending ? "Création..." : "Créer mon compte"}
                <AppIcon icon="solar:arrow-right-linear" className="size-4" />
              </Button>
              {signup.error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {signup.error.message}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <aside className="rounded-[2.3rem] border border-white/75 bg-charcoal p-7 text-ivory shadow-luxury">
        <AppIcon icon="solar:shield-check-linear" className="size-9 text-gold" />
        <h2 className="mt-5 font-serif text-4xl leading-none">Votre espace reste dans la boutique.</h2>
        <div className="mt-6 grid gap-4 text-sm leading-6 text-ivory/72">
          <span className="inline-flex gap-3">
            <AppIcon icon="solar:bag-4-linear" className="mt-1 size-5 shrink-0 text-gold" />
            Commandes, devis et factures synchronisés.
          </span>
          <span className="inline-flex gap-3">
            <AppIcon icon="solar:heart-linear" className="mt-1 size-5 shrink-0 text-gold" />
            Favoris sauvegardés entre vos appareils.
          </span>
        </div>
        <Button
          asChild
          variant="outline"
          className="mt-8 h-12 rounded-full border-white/20 bg-white/10 text-ivory hover:bg-white/15"
        >
          <Link to="/login" search={{ redirect: redirectTo } as never}>
            J’ai déjà un compte
          </Link>
        </Button>
      </aside>
    </main>
  )
}
