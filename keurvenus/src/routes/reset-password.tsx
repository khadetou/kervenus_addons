import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation } from "@tanstack/react-query"
import { type ComponentProps, useState } from "react"

import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { confirmOdooPasswordReset, requestOdooPasswordReset } from "@/lib/odoo-api"

export const Route = createFileRoute("/reset-password")({ component: ResetPasswordPage })

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>

function getQueryValue(name: string, fallback = "") {
  if (typeof window === "undefined") return fallback
  return new URLSearchParams(window.location.search).get(name) || fallback
}

function ResetPasswordPage() {
  const navigate = useNavigate()
  const token = getQueryValue("token")
  const redirectTo = getQueryValue("redirect", "/portal")
  const [showPassword, setShowPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const requestReset = useMutation({
    mutationFn: requestOdooPasswordReset,
    onSuccess: (result) => {
      setSuccessMessage(
        result.message || "Si un compte existe pour cette adresse, un lien de réinitialisation a été envoyé."
      )
    },
  })
  const confirmReset = useMutation({
    mutationFn: confirmOdooPasswordReset,
    onSuccess: () => {
      setSuccessMessage("Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.")
    },
  })

  const handleRequestSubmit: FormSubmitHandler = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    requestReset.mutate(String(formData.get("email") ?? ""))
  }

  const handleConfirmSubmit: FormSubmitHandler = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    confirmReset.mutate({
      token,
      password: String(formData.get("password") ?? ""),
      confirm_password: String(formData.get("confirm_password") ?? ""),
    })
  }

  return (
    <main className="mx-auto mt-10 grid w-[min(1320px,calc(100vw-32px))] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section className="rounded-[2.3rem] border border-white/75 bg-white/72 p-7 shadow-luxury md:p-9">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">accès client</p>
        <h1 className="mt-3 font-serif text-5xl leading-none md:text-7xl">
          Réinitialiser mon accès.
        </h1>
        <p className="mt-4 max-w-2xl text-warm-gray">
          Recevez un lien sécurisé ou choisissez un nouveau mot de passe avec
          votre clé de réinitialisation Kër Venus.
        </p>

        <Card className="mt-8 rounded-[2rem] border-white/75 bg-ivory/80 p-0 shadow-soft">
          <CardHeader className="gap-4 p-5 md:flex-row md:items-center">
            <div className="grid size-12 place-items-center rounded-full bg-gold/15 text-gold">
              <AppIcon icon="solar:restart-circle-linear" className="size-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gold">
                sécurité du compte
              </p>
              <CardTitle className="font-serif text-3xl">
                {token ? "Nouveau mot de passe" : "Mot de passe oublié"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {successMessage ? (
              <div className="grid gap-5">
                <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {successMessage}
                </p>
                <Button
                  className="h-12 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
                  onClick={() => navigate({ to: "/login", search: { redirect: redirectTo } as never })}
                >
                  Retour à la connexion
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Button>
              </div>
            ) : token ? (
              <form onSubmit={handleConfirmSubmit} className="grid gap-5">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label htmlFor="password">Nouveau mot de passe</Label>
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
                </div>
                <Button
                  type="submit"
                  className="h-12 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
                  disabled={confirmReset.isPending}
                  aria-busy={confirmReset.isPending}
                >
                  {confirmReset.isPending ? "Mise à jour..." : "Enregistrer le mot de passe"}
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Button>
                {confirmReset.error ? <ErrorMessage message={confirmReset.error.message} /> : null}
              </form>
            ) : (
              <form onSubmit={handleRequestSubmit} className="grid gap-5">
                <div className="grid gap-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <div className="relative">
                    <AppIcon
                      icon="solar:letter-linear"
                      className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gold"
                    />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      placeholder="nom@email.com"
                      className="h-13 rounded-full border-charcoal/10 bg-white pl-12"
                      required
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 rounded-full bg-charcoal text-ivory hover:bg-charcoal/90"
                  disabled={requestReset.isPending}
                  aria-busy={requestReset.isPending}
                >
                  {requestReset.isPending ? "Envoi..." : "Envoyer le lien"}
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Button>
                {requestReset.error ? <ErrorMessage message={requestReset.error.message} /> : null}
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      <aside className="rounded-[2.3rem] border border-white/75 bg-charcoal p-7 text-ivory shadow-luxury">
        <AppIcon icon="solar:shield-check-linear" className="size-9 text-gold" />
        <h2 className="mt-5 font-serif text-4xl leading-none">Confiance et sérénité.</h2>
        <p className="mt-4 text-sm leading-6 text-ivory/72">
          Votre accès client reste relié à Odoo, mais l’expérience visuelle reste
          entièrement dans la boutique Kër Venus.
        </p>
        <div className="mt-8 grid gap-3">
          <Button asChild className="h-12 rounded-full bg-champagne text-charcoal hover:bg-gold">
            <Link to="/login" search={{ redirect: redirectTo } as never}>
              Retour à la connexion
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-white/20 bg-white/10 text-ivory hover:bg-white/15"
          >
            <Link to="/register" search={{ redirect: redirectTo } as never}>
              Créer un compte
            </Link>
          </Button>
        </div>
      </aside>
    </main>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {message}
    </p>
  )
}
