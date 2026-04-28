import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { type ComponentProps, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useStorefrontConfig } from "@/hooks/use-products"
import { useLogin, useSession } from "@/hooks/use-session"
import { getOdooResetPasswordUrl, getOdooSignupUrl } from "@/lib/odoo-api"

export const Route = createFileRoute("/login")({ component: LoginPage })

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>

function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const { data: session } = useSession()
  const { data: storefrontConfig } = useStorefrontConfig()
  const login = useLogin()
  const authMode = storefrontConfig?.authMode ?? "email_password"
  const usesPhoneAuth = authMode === "phone_password"
  const redirectTo =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("redirect") || "/portal"
      : "/portal"
  const signupUrl = getOdooSignupUrl(redirectTo)
  const resetPasswordUrl = getOdooResetPasswordUrl(redirectTo)

  const handleSubmit: FormSubmitHandler = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    login.mutate(
      {
        login: String(formData.get(usesPhoneAuth ? "phone" : "email") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
      {
        onSuccess: () => {
          if (redirectTo === "/portal") {
            navigate({ to: "/portal" })
          } else {
            window.location.href = redirectTo
          }
        },
      }
    )
  }

  if (session?.authenticated && session.user) {
    return (
      <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-[2.3rem] border border-white/75 bg-white/72 p-7 shadow-luxury md:p-9">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">session active</p>
          <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
            Votre espace client est ouvert.
          </h1>
          <p className="mt-4 max-w-2xl text-warm-gray">
            Vous êtes connecté au portail Kër Venus. Continuez vers vos commandes,
            devis et factures synchronisés.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild className="h-12 rounded-full bg-charcoal px-7 text-ivory">
              <Link to={redirectTo === "/checkout" ? "/checkout" : "/portal"}>
                {redirectTo === "/checkout" ? "Continuer la commande" : "Ouvrir le portail"}
                <AppIcon icon="solar:arrow-right-linear" className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 rounded-full border-charcoal/10 bg-white px-7">
              <Link to="/">Retour accueil</Link>
            </Button>
          </div>
        </section>
        <aside className="rounded-[2.3rem] border border-white/75 bg-charcoal p-7 text-ivory shadow-luxury">
          <AppIcon icon="solar:shield-check-linear" className="size-9 text-gold" />
          <h2 className="mt-5 font-serif text-4xl leading-none">{session.user.name}</h2>
          <p className="mt-3 text-sm text-ivory/70">{session.user.login}</p>
        </aside>
      </main>
    )
  }

  return (
    <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[2.3rem] border border-white/75 bg-white/72 p-7 shadow-luxury md:p-9">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">accès client</p>
        <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
          Connectez-vous à votre maison Kër Venus.
        </h1>
        <p className="mt-4 max-w-2xl text-warm-gray">
          Accédez à vos commandes, devis, factures et favoris sans quitter la
          boutique. La session est validée en arrière-plan.
        </p>

        <Card className="mt-8 rounded-[2rem] border-white/75 bg-ivory/80 p-0 shadow-soft">
          <CardHeader className="gap-4 p-5 md:flex-row md:items-center">
            <div className="grid size-12 place-items-center rounded-full bg-gold/15 text-gold">
              <AppIcon icon="solar:lock-password-linear" className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">
                connexion sécurisée
              </p>
              <CardTitle className="font-serif text-3xl">Espace client</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <form onSubmit={handleSubmit} className="grid gap-5">
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
                    autoComplete="current-password"
                    placeholder="Mot de passe"
                    className="h-13 rounded-full border-charcoal/10 bg-white pl-12 pr-14"
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {usesPhoneAuth ? <span /> : (
                  <a
                    href={resetPasswordUrl}
                    className="inline-flex items-center gap-2 text-sm font-medium text-warm-gray transition hover:text-charcoal"
                  >
                    <AppIcon icon="solar:restart-circle-linear" className="size-4 text-gold" />
                    Mot de passe oublié ?
                  </a>
                )}
                <a
                  href={signupUrl}
                  className="inline-flex items-center gap-2 text-sm font-medium text-charcoal transition hover:text-gold"
                >
                  Créer un compte
                  <AppIcon icon="solar:user-plus-rounded-linear" className="size-4" />
                </a>
              </div>
              <Button
                type="submit"
                className="h-12 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
                disabled={login.isPending}
                aria-busy={login.isPending}
              >
                {login.isPending ? "Connexion..." : "Continuer"}
                <AppIcon icon="solar:arrow-right-linear" className="size-4" />
              </Button>
              {login.error ? (
                <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {login.error.message}
                </p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      </section>

      <aside className="rounded-[2.3rem] border border-white/75 bg-charcoal p-7 text-ivory shadow-luxury">
        <p className="text-xs uppercase tracking-[0.24em] text-champagne">
          portail Kër Venus
        </p>
        <h2 className="mt-4 font-serif text-4xl leading-none">
          Tout reste dans la boutique.
        </h2>
        <div className="mt-6 grid gap-4 text-sm leading-6 text-ivory/72">
          <span className="inline-flex gap-3">
            <AppIcon icon="solar:bill-list-linear" className="mt-1 size-5 shrink-0 text-gold" />
            Factures et commandes synchronisées.
          </span>
          <span className="inline-flex gap-3">
            <AppIcon icon="solar:heart-linear" className="mt-1 size-5 shrink-0 text-gold" />
            Favoris et panier synchronisés avec la session.
          </span>
          <span className="inline-flex gap-3">
            <AppIcon icon="solar:shield-check-linear" className="mt-1 size-5 shrink-0 text-gold" />
            Parcours boutique fluide.
          </span>
        </div>
        <div className="mt-8 grid gap-3">
          <Button asChild className="h-12 rounded-full bg-champagne text-charcoal hover:bg-gold">
            <a href={signupUrl}>
              Créer un compte
              <AppIcon icon="solar:arrow-right-linear" className="size-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-white/20 bg-white/10 text-ivory hover:bg-white/15"
          >
            {usesPhoneAuth ? <Link to="/contact">Besoin d’aide</Link> : <a href={resetPasswordUrl}>Mot de passe oublié</a>}
          </Button>
        </div>
      </aside>
    </main>
  )
}
