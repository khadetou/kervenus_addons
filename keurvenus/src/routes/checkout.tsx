import { Link, createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { type ComponentProps, type ReactNode, useEffect, useState } from "react"

import { OrderSummary } from "@/components/cart/order-summary"
import { AppIcon } from "@/components/icons/icon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCart } from "@/hooks/use-cart"
import { useSession } from "@/hooks/use-session"
import { OdooApiError, getOdooCheckout, saveOdooCheckoutCustomer, submitOdooCheckout } from "@/lib/odoo-api"
import { formatPrice } from "@/lib/format"
import type {
  CheckoutDeliveryMethod,
  CheckoutOrderResult,
  CheckoutPaymentMethod,
  CheckoutState,
  CheckoutSubmitPayload,
  PortalPartner,
} from "@/lib/types"

export const Route = createFileRoute("/checkout")({ component: CheckoutPage })

type FormSubmitHandler = NonNullable<ComponentProps<"form">["onSubmit"]>
type CheckoutStep = "details" | "options"
type CustomerDraft = CheckoutSubmitPayload["customer"]

function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const session = useSession()
  const { refreshCart } = useCart()
  const authenticated = Boolean(session.data?.authenticated)
  const checkout = useQuery({
    queryKey: ["checkout"],
    queryFn: getOdooCheckout,
    enabled: authenticated,
    retry: false,
  })
  const [deliveryId, setDeliveryId] = useState<number | undefined>()
  const [paymentId, setPaymentId] = useState<string | undefined>()
  const [detailsManuallyOpened, setDetailsManuallyOpened] = useState(false)
  const [customer, setCustomer] = useState<CustomerDraft>({ city: "Dakar" })
  const [savedCustomer, setSavedCustomer] = useState<CustomerDraft | null>(null)
  const [orderResult, setOrderResult] = useState<CheckoutOrderResult | null>(null)

  useEffect(() => {
    if (!checkout.data) return
    const selectedDelivery =
      checkout.data.selected_delivery_method_id ||
      checkout.data.delivery_methods.find((method) => method.available !== false)?.id
    const selectedPayment =
      checkout.data.selected_payment_method_id ||
      checkout.data.payment_methods.find((method) => method.available)?.id
    setDeliveryId(selectedDelivery || undefined)
    setPaymentId(selectedPayment || undefined)
  }, [checkout.data])

  useEffect(() => {
    const sourceCustomer = checkout.data?.customer || customerFromSession(session.data?.user?.partner)
    if (!sourceCustomer) return

    const normalizedCustomer = normalizeCustomerDraft(sourceCustomer)

    setCustomer((current) => mergeCustomerDrafts(current, normalizedCustomer))
  }, [checkout.data, session.data?.user?.partner])

  const checkoutMutation = useMutation({
    mutationFn: submitOdooCheckout,
    onSuccess: (order) => {
      setOrderResult(order)
      refreshCart()
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      queryClient.invalidateQueries({ queryKey: ["checkout"] })
      queryClient.invalidateQueries({ queryKey: ["portal"] })
    },
  })
  const customerMutation = useMutation({
    mutationFn: saveOdooCheckoutCustomer,
    onSuccess: (savedCustomer) => {
      const normalizedCustomer = normalizeCustomerDraft(savedCustomer)
      setCustomer(normalizedCustomer)
      setSavedCustomer(normalizedCustomer)
      queryClient.invalidateQueries({ queryKey: ["session"] })
      queryClient.invalidateQueries({ queryKey: ["checkout"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
      setDetailsManuallyOpened(false)
      window.scrollTo({ top: 0, behavior: "smooth" })
    },
  })

  useEffect(() => {
    if (session.isFetched && !authenticated) {
      navigate({ to: "/login", search: { redirect: "/checkout" } as never, replace: true })
    }
  }, [authenticated, navigate, session.isFetched])

  useEffect(() => {
    if (checkout.error instanceof OdooApiError && checkout.error.status === 401) {
      navigate({ to: "/login", search: { redirect: "/checkout" } as never, replace: true })
    }
  }, [checkout.error, navigate])

  const handleSubmit: FormSubmitHandler = (event) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (activeStep === "details") {
      const nextCustomer = normalizeCustomerDraft(readCustomerForm(form))
      setCustomer(nextCustomer)
      customerMutation.mutate(nextCustomer)
      return
    }
    const payload: CheckoutSubmitPayload = {
      delivery_method_id: deliveryId,
      payment_method_id: paymentId,
      customer: activeCustomer,
    }
    checkoutMutation.mutate(payload)
  }

  if (orderResult) {
    return <OrderCreated order={orderResult} />
  }

  if (session.isLoading) {
    return <AuthRedirecting />
  }

  if (!authenticated) {
    return <AuthRedirecting />
  }

  const cart = checkout.data?.cart
  const hasItems = Boolean(cart?.lines.length)
  const requiresShippingAddress =
    checkout.data?.requires_shipping_address ?? Boolean(checkout.data?.delivery_methods.length)
  const persistedCustomer = savedCustomer || normalizeOptionalCustomer(checkout.data?.customer || customerFromSession(session.data?.user?.partner))
  const hasPersistedCustomer = Boolean(
    persistedCustomer && isCheckoutCustomerComplete(persistedCustomer, requiresShippingAddress)
  )
  const activeStep: CheckoutStep = detailsManuallyOpened || !hasPersistedCustomer ? "details" : "options"
  const editableCustomer = persistedCustomer ? mergeCustomerDrafts(customer, persistedCustomer) : customer
  const activeCustomer = persistedCustomer || editableCustomer
  const currentStepIndex = activeStep === "details" ? 1 : 2

  return (
    <main className="mx-auto mt-3 grid w-[min(1280px,calc(100vw-20px))] max-w-full gap-4 overflow-x-hidden pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:w-[min(1280px,calc(100vw-32px))] md:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:pb-14">
      <section className="max-w-full overflow-hidden rounded-[1.45rem] border border-white/75 bg-white/82 p-4 shadow-luxury backdrop-blur md:rounded-[2.2rem] md:p-8">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">commande sécurisée</p>
            <h1 className="mt-2 font-serif text-[2.45rem] leading-none md:mt-3 md:text-7xl">
              {activeStep === "details" ? "Commander" : "Livraison & paiement"}
            </h1>
            <p className="mt-3 hidden max-w-2xl text-sm leading-6 text-warm-gray sm:block md:mt-4 md:text-base">
              {activeStep === "details"
                ? "Confirmez vos coordonnées avant de choisir la livraison et le paiement."
                : "Les livraisons, retraits et paiements affichés viennent directement du backoffice Odoo."}
            </p>
          </div>
          <CheckoutProgress current={currentStepIndex} />
        </div>

        {!hasItems && !checkout.isLoading ? (
          <div className="mt-8 rounded-[1.6rem] border border-dashed border-charcoal/15 bg-ivory/80 p-8 text-center">
            <AppIcon icon="solar:bag-4-linear" className="mx-auto size-10 text-gold" />
            <h2 className="mt-4 font-serif text-4xl leading-none">Votre panier est vide.</h2>
            <Button asChild className="mt-6 h-12 rounded-full bg-charcoal px-7 text-ivory">
              <Link to="/shop">Retour à la boutique</Link>
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-5 md:mt-8 md:gap-7">
            {activeStep === "details" ? (
              <>
                <CustomerFields customer={editableCustomer} onChange={setCustomer} />
                {customerMutation.error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {customerMutation.error.message}
                  </p>
                ) : null}
                <Button
                  type="submit"
                  className="hidden h-12 rounded-full bg-charcoal px-8 text-ivory hover:bg-charcoal/90 lg:inline-flex"
                  disabled={customerMutation.isPending}
                  aria-busy={customerMutation.isPending}
                >
                  {customerMutation.isPending ? "Enregistrement..." : "Continuer vers la livraison"}
                  <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <CustomerPreview
                  customer={activeCustomer}
                  onEdit={() => {
                    setDetailsManuallyOpened(true)
                  }}
                />
                <OptionSection
                  title="Mode de livraison"
                  icon="solar:delivery-linear"
                  emptyLabel="Aucun mode de livraison publié dans Odoo."
                >
                  {checkout.data?.delivery_methods.map((method) => (
                    <DeliveryOption
                      key={method.id}
                      method={method}
                      selected={deliveryId === method.id}
                      onSelect={() => setDeliveryId(method.id)}
                    />
                  ))}
                </OptionSection>
                <OptionSection
                  title="Moyen de paiement"
                  icon="solar:card-linear"
                  emptyLabel="Aucun moyen de paiement actif dans Odoo."
                >
                  {checkout.data?.payment_methods.map((method) => (
                    <PaymentOption
                      key={method.id}
                      method={method}
                      selected={paymentId === method.id}
                      onSelect={() => setPaymentId(method.id)}
                    />
                  ))}
                  {checkout.data?.coming_soon_payment_methods?.map((method) => (
                    <PaymentOption key={method.id} method={method} selected={false} />
                  ))}
                </OptionSection>

                {checkoutMutation.error ? (
                  <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {checkoutMutation.error.message}
                  </p>
                ) : null}

                <div className="hidden gap-3 lg:grid lg:grid-cols-[auto_1fr]">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full border-charcoal/10 bg-white px-7 hover:bg-cream"
                    onClick={() => {
                      setDetailsManuallyOpened(true)
                    }}
                  >
                    Retour
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 rounded-full bg-charcoal px-8 text-ivory hover:bg-charcoal/90"
                    disabled={
                      checkout.isLoading ||
                      checkoutMutation.isPending ||
                      !hasItems ||
                      !paymentId ||
                      Boolean(checkout.data?.delivery_methods.length && !deliveryId)
                    }
                  >
                    {checkoutMutation.isPending ? "Création de la commande..." : "Commander"}
                    <AppIcon icon="solar:arrow-right-linear" className="size-4" />
                  </Button>
                </div>
              </>
            )}
            <MobileCheckoutAction
              activeStep={activeStep}
              cart={cart}
              customerPending={customerMutation.isPending}
              checkoutPending={checkoutMutation.isPending}
              disabled={
                activeStep === "options" &&
                (checkout.isLoading ||
                  !hasItems ||
                  !paymentId ||
                  Boolean(checkout.data?.delivery_methods.length && !deliveryId))
              }
              onBack={() => {
                setDetailsManuallyOpened(true)
              }}
            />
          </form>
        )}
      </section>
      <CheckoutSummary checkout={checkout.data} />
    </main>
  )
}

function readCustomerForm(form: FormData): CustomerDraft {
  return normalizeCustomerDraft({
    first_name: String(form.get("first_name") || ""),
    last_name: String(form.get("last_name") || ""),
    email: String(form.get("email") || ""),
    phone: String(form.get("phone") || ""),
    address: String(form.get("address") || ""),
    city: String(form.get("city") || "Dakar"),
  })
}

function customerFromSession(partner?: PortalPartner | null): CustomerDraft | null {
  if (!partner) return null
  const address = [partner.street, partner.street2].filter(Boolean).join("\n")
  return {
    name: partner.name || "",
    email: partner.email || "",
    phone: partner.phone || "",
    address,
    city: partner.city || "Dakar",
  }
}

function normalizeCustomerDraft(customer: CustomerDraft): CustomerDraft {
  const fullName = String(customer.name || "").trim()
  const firstName = String(customer.first_name || "").trim()
  const lastName = String(customer.last_name || "").trim()
  const splitName = fullName && !firstName ? fullName.split(" ") : []
  return {
    ...customer,
    first_name: firstName || splitName[0] || "",
    last_name: lastName || splitName.slice(1).join(" "),
    name: fullName || [firstName, lastName].filter(Boolean).join(" "),
    email: String(customer.email || "").trim(),
    phone: String(customer.phone || "").trim(),
    address: String(customer.address || customer.street || "").trim(),
    street: String(customer.street || customer.address || "").trim(),
    city: String(customer.city || "Dakar").trim() || "Dakar",
  }
}

function normalizeOptionalCustomer(customer?: CustomerDraft | null): CustomerDraft | null {
  return customer ? normalizeCustomerDraft(customer) : null
}

function mergeCustomerDrafts(current: CustomerDraft, incoming: CustomerDraft): CustomerDraft {
  return normalizeCustomerDraft({
    first_name: current.first_name || incoming.first_name || "",
    last_name: current.last_name || incoming.last_name || "",
    name: current.name || incoming.name || "",
    email: current.email || incoming.email || "",
    phone: current.phone || incoming.phone || "",
    address: current.address || incoming.address || incoming.street || "",
    street: current.street || incoming.street || incoming.address || "",
    city: current.city || incoming.city || "Dakar",
  })
}

function isCheckoutCustomerComplete(customer: CustomerDraft, requiresShippingAddress: boolean) {
  const normalized = normalizeCustomerDraft(customer)
  const hasName = Boolean(normalized.name || normalized.first_name || normalized.last_name)
  return Boolean(
    hasName &&
      normalized.email &&
      normalized.phone &&
      (!requiresShippingAddress || normalized.address || normalized.street)
  )
}

function CustomerFields({
  customer,
  onChange,
}: {
  customer: CustomerDraft
  onChange: (customer: CustomerDraft) => void
}) {
  const update = (key: keyof CustomerDraft, value: string) => {
    onChange({ ...customer, [key]: value })
  }
  return (
    <div className="grid gap-3 md:grid-cols-2 md:gap-4">
      <Field id="first_name" label="Prénom" value={customer.first_name || ""} onChange={(value) => update("first_name", value)} required />
      <Field id="last_name" label="Nom" value={customer.last_name || ""} onChange={(value) => update("last_name", value)} required />
      <Field id="email" label="E-mail" type="email" value={customer.email || ""} onChange={(value) => update("email", value)} required />
      <Field id="phone" label="Téléphone" value={customer.phone || ""} onChange={(value) => update("phone", value)} required />
      <Field id="city" label="Ville" value={customer.city || "Dakar"} onChange={(value) => update("city", value)} />
      <div className="grid gap-2 md:col-span-2">
        <Label htmlFor="address">Adresse de livraison</Label>
        <Textarea
          id="address"
          name="address"
          value={customer.address || ""}
          onChange={(event) => update("address", event.target.value)}
          className="min-h-28 rounded-[1.15rem] border-charcoal/10 bg-ivory/80 shadow-[inset_0_1px_0_rgba(255,255,255,.65)] md:min-h-32 md:rounded-2xl"
          required
        />
      </div>
    </div>
  )
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
}: {
  id: string
  label: string
  type?: string
  value?: string
  onChange?: (value: string) => void
  required?: boolean
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
        className="h-12 rounded-[1.15rem] border-charcoal/10 bg-ivory/80 text-base shadow-[inset_0_1px_0_rgba(255,255,255,.65)] md:rounded-2xl"
      />
    </div>
  )
}

function CheckoutProgress({ current }: { current: number }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-full border border-charcoal/8 bg-ivory/72 p-1.5 text-xs font-semibold text-charcoal shadow-soft md:min-w-64 md:grid-cols-1 md:gap-2 md:rounded-[1.35rem] md:p-2 md:text-sm">
      {[
        ["1", "Coordonnées"],
        ["2", "Livraison & paiement"],
      ].map(([index, label]) => {
        const active = Number(index) === current
        return (
          <span
            key={index}
            className={`flex min-w-0 items-center justify-center gap-1.5 rounded-full px-2 py-2 md:justify-start md:gap-2 md:px-3 ${
              active ? "bg-charcoal text-ivory" : "text-warm-gray"
            }`}
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-full text-[11px] md:size-6 md:text-xs ${active ? "bg-white/12" : "bg-white"}`}>
              {index}
            </span>
            <span className="truncate">{label}</span>
          </span>
        )
      })}
    </div>
  )
}

function CustomerPreview({ customer, onEdit }: { customer: CustomerDraft; onEdit: () => void }) {
  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ")
  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-charcoal/8 bg-ivory/74 p-3.5 md:rounded-[1.6rem] md:p-4">
      <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold md:text-xs md:tracking-[0.2em]">coordonnées</p>
          <h2 className="mt-1.5 truncate font-serif text-2xl leading-none md:mt-2 md:text-3xl">{fullName || "Client Kër Venus"}</h2>
          <p className="mt-2 truncate text-xs text-warm-gray md:text-sm">{customer.email} · {customer.phone}</p>
          <p className="mt-1 line-clamp-1 text-sm text-warm-gray">{customer.address || customer.city}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full shrink-0 rounded-full border-charcoal/10 bg-white px-4 text-sm hover:bg-cream sm:w-auto md:px-5"
          onClick={onEdit}
        >
          Modifier
        </Button>
      </div>
    </section>
  )
}

function OptionSection({
  title,
  icon,
  emptyLabel,
  children,
}: {
  title: string
  icon: string
  emptyLabel: string
  children: ReactNode
}) {
  const hasChildren = Boolean(children && (!Array.isArray(children) || children.some(Boolean)))
  return (
    <section className="max-w-full overflow-hidden rounded-[1.35rem] border border-charcoal/8 bg-ivory/74 p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,.68)] md:rounded-[1.8rem] md:p-5">
      <div className="mb-3 flex items-center gap-2.5 md:mb-4 md:gap-3">
        <span className="grid size-9 place-items-center rounded-full bg-gold/14 text-gold md:size-10">
          <AppIcon icon={icon} className="size-[18px] md:size-5" />
        </span>
        <h2 className="font-serif text-[1.7rem] leading-none md:text-3xl">{title}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {hasChildren ? children : (
          <p className="rounded-2xl border border-dashed border-charcoal/12 bg-white/70 p-4 text-sm text-warm-gray md:col-span-2">
            {emptyLabel}
          </p>
        )}
      </div>
    </section>
  )
}

function DeliveryOption({
  method,
  selected,
  onSelect,
}: {
  method: CheckoutDeliveryMethod
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={method.available === false}
      className={`group min-h-[112px] w-full max-w-full overflow-hidden rounded-[1.15rem] border p-3.5 text-left transition active:scale-[0.99] md:min-h-[142px] md:rounded-[1.45rem] md:p-4 ${
        selected
          ? "border-charcoal bg-charcoal text-ivory shadow-soft"
          : "border-charcoal/10 bg-white/82 text-charcoal hover:-translate-y-0.5 hover:border-gold/35 hover:bg-white hover:shadow-soft"
      } ${method.available === false ? "opacity-55" : ""}`}
    >
      <span className="flex h-full flex-col justify-between gap-4 md:gap-5">
        <span className="flex items-start justify-between gap-3 md:gap-4">
          <span className="min-w-0">
            <span className="block text-sm font-semibold leading-tight md:text-base">{method.name}</span>
            <span className={`mt-1.5 block max-w-full break-words text-xs leading-5 md:mt-2 md:max-w-[22rem] md:text-sm ${selected ? "text-ivory/68" : "text-warm-gray"}`}>
              {method.is_pickup ? "Retrait en boutique" : method.description || "Méthode configurée dans Odoo"}
            </span>
          </span>
          <span className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold md:px-3.5 md:py-2 md:text-xs ${selected ? "bg-white/12 text-ivory" : "bg-cream text-charcoal"}`}>
            {method.price_formatted || formatPrice(method.price)}
          </span>
        </span>
        <span className={`flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] md:text-xs md:tracking-[0.16em] ${selected ? "text-champagne" : "text-gold"}`}>
          <AppIcon icon={selected ? "solar:check-circle-bold" : "solar:map-point-wave-linear"} className="size-4" />
          {selected
            ? "Sélectionné"
            : method.available === false
              ? "Indisponible"
              : method.allows_cash_on_delivery
                ? "Paiement sur site accepté"
                : "Choisir"}
        </span>
      </span>
    </button>
  )
}

function PaymentOption({
  method,
  selected,
  onSelect,
}: {
  method: CheckoutPaymentMethod
  selected: boolean
  onSelect?: () => void
}) {
  const disabled = !method.available || !onSelect
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={`group min-h-[82px] w-full max-w-full overflow-hidden rounded-[1.15rem] border p-3.5 text-left transition active:scale-[0.99] md:min-h-[96px] md:rounded-[1.35rem] md:p-4 ${
        selected
          ? "border-charcoal bg-charcoal text-ivory shadow-soft"
          : "border-charcoal/10 bg-white/82 text-charcoal hover:-translate-y-0.5 hover:border-gold/35 hover:bg-white hover:shadow-soft"
      } ${disabled ? "opacity-55" : ""}`}
    >
      <span className="flex h-full items-center justify-between gap-4">
        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold md:text-base">{method.name}</span>
          <span className={`mt-1 block truncate text-xs md:text-sm ${selected ? "text-ivory/68" : "text-warm-gray"}`}>
            {method.provider_name || method.label || "Bientôt disponible"}
          </span>
        </span>
        <span className={`grid size-8 shrink-0 place-items-center rounded-full md:size-9 ${selected ? "bg-white/12" : "bg-cream"}`}>
          <AppIcon
            icon={method.available ? "solar:check-circle-linear" : "solar:clock-circle-linear"}
            className="size-5 text-gold"
          />
        </span>
      </span>
    </button>
  )
}

function CheckoutSummary({ checkout }: { checkout?: CheckoutState }) {
  const cart = checkout?.cart

  if (!cart?.lines.length) return <OrderSummary checkoutCta={false} />

  return (
    <aside className="hidden h-fit overflow-hidden rounded-[2rem] border border-white/75 bg-white/76 p-5 shadow-luxury backdrop-blur lg:sticky lg:top-36 lg:block">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-serif text-4xl leading-none">Résumé</h2>
        <span className="rounded-full bg-ivory px-3 py-1 text-xs font-semibold text-charcoal">
          {cart.itemCount} article{cart.itemCount > 1 ? "s" : ""}
        </span>
      </div>
      <div className="mt-6 grid gap-3">
        {cart.lines.map((line) => (
          <div
            key={line.lineId || line.product.id}
            className="grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-3 rounded-[1.35rem] bg-ivory/80 p-2"
          >
            <img src={line.product.images[0]} alt="" className="size-16 rounded-xl object-contain" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{line.product.name}</p>
              <p className="text-xs text-warm-gray">Qté {line.quantity}</p>
            </div>
            <p className="whitespace-nowrap text-sm font-bold">{formatPrice(line.product.price * line.quantity)}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-3 border-t border-charcoal/10 pt-5 text-sm">
        <SummaryRow label="Sous-total" value={cart.formatted?.subtotal || formatPrice(cart.subtotal)} />
        <SummaryRow label="Livraison" value={cart.formatted?.delivery || formatPrice(cart.delivery)} />
        <SummaryRow label="Taxes" value={cart.formatted?.tax || formatPrice(cart.tax)} />
        <SummaryRow label="Total" value={cart.formatted?.total || formatPrice(cart.total)} strong />
      </div>
    </aside>
  )
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-bold" : ""}`}>
      <span className="text-warm-gray">{label}</span>
      <span className="whitespace-nowrap text-right">{value}</span>
    </div>
  )
}

function MobileCheckoutAction({
  activeStep,
  cart,
  customerPending,
  checkoutPending,
  disabled,
  onBack,
}: {
  activeStep: CheckoutStep
  cart?: CheckoutState["cart"]
  customerPending: boolean
  checkoutPending: boolean
  disabled: boolean
  onBack: () => void
}) {
  const total = cart?.formatted?.total || formatPrice(cart?.total || 0)
  const itemCount = cart?.itemCount || 0
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-charcoal/10 bg-ivory/92 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-[0_-18px_50px_rgba(38,29,20,0.14)] backdrop-blur-2xl lg:hidden">
      <div className="mx-auto grid max-w-md gap-2">
        <div className="flex items-center justify-between gap-3 px-1">
          <span className="text-xs font-medium text-warm-gray">
            {itemCount} article{itemCount > 1 ? "s" : ""}
          </span>
          <span className="font-semibold text-charcoal">{total}</span>
        </div>
        <div className={activeStep === "options" ? "grid grid-cols-[44px_1fr] gap-2" : "grid"}>
          {activeStep === "options" ? (
            <Button
              type="button"
              variant="outline"
              aria-label="Retour aux coordonnées"
              className="h-12 rounded-full border-charcoal/10 bg-white p-0 hover:bg-cream"
              onClick={onBack}
            >
              <AppIcon icon="solar:arrow-left-linear" className="size-5" />
            </Button>
          ) : null}
          <Button
            type="submit"
            className="h-12 rounded-full bg-charcoal text-ivory shadow-soft hover:bg-charcoal/90"
            disabled={customerPending || checkoutPending || disabled}
            aria-busy={customerPending || checkoutPending}
          >
            {activeStep === "details"
              ? customerPending
                ? "Enregistrement..."
                : "Continuer"
              : checkoutPending
                ? "Création..."
                : "Commander"}
            <AppIcon icon="solar:arrow-right-linear" className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function AuthRedirecting() {
  return (
    <main className="mx-auto mt-10 grid w-[min(1180px,calc(100vw-32px))] gap-6 lg:grid-cols-[1fr_360px]">
      <section className="rounded-[2.3rem] border border-white/75 bg-white/72 p-8 shadow-luxury">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">connexion requise</p>
        <h1 className="mt-4 font-serif text-5xl leading-none md:text-7xl">
          Connectez-vous pour finaliser la commande.
        </h1>
        <p className="mt-4 max-w-2xl text-warm-gray">
          Vous allez être redirigé vers l'accès client. Après connexion ou création de compte,
          vous reviendrez automatiquement à votre commande.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="h-12 rounded-full bg-charcoal px-7 text-ivory">
            <Link to="/login" search={{ redirect: "/checkout" } as never}>
              Se connecter
              <AppIcon icon="solar:arrow-right-linear" className="size-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-12 rounded-full border-charcoal/10 bg-white px-7">
            <Link to="/register" search={{ redirect: "/checkout" } as never}>Créer un compte</Link>
          </Button>
        </div>
      </section>
      <aside className="rounded-[2.3rem] border border-white/75 bg-charcoal p-7 text-ivory shadow-luxury">
        <AppIcon icon="solar:shield-check-linear" className="size-9 text-gold" />
        <h2 className="mt-5 font-serif text-4xl leading-none">Pourquoi un compte ?</h2>
        <p className="mt-4 text-sm leading-7 text-ivory/70">
          Odoo rattache la commande, les factures et le suivi de livraison à votre partenaire client.
        </p>
      </aside>
    </main>
  )
}

function OrderCreated({ order }: { order: CheckoutOrderResult }) {
  const invoiceLabel = order.invoice?.name || "À générer"
  const paymentLabel = order.payment_method?.name || "À confirmer"
  const totalLabel = order.amount_total_formatted || formatPrice(order.amount_total)
  return (
    <main className="mx-auto mt-10 w-[min(1080px,calc(100vw-32px))] pb-14">
      <section className="overflow-hidden rounded-[2.4rem] border border-white/75 bg-white/76 p-6 text-center shadow-luxury backdrop-blur md:p-10">
        <div className="mx-auto grid size-20 place-items-center rounded-full bg-emerald-500/12 text-emerald-700 shadow-[inset_0_0_0_1px_rgba(5,150,105,.12)]">
          <AppIcon icon="solar:check-circle-bold" className="size-10" />
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.24em] text-gold">commande créée</p>
        <h1 className="mt-3 break-words font-serif text-5xl leading-none text-charcoal md:text-7xl">
          {order.name}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-warm-gray">
          Votre bon de commande est confirmé dans Odoo. La facture reste non payée jusqu'à validation du règlement.
        </p>
        <div className="mx-auto mt-8 grid max-w-2xl gap-3 rounded-[1.8rem] border border-charcoal/8 bg-ivory/80 p-3 text-left md:p-4">
          <OrderResultRow icon="solar:wallet-money-linear" label="Total" value={totalLabel} strong />
          <OrderResultRow icon="solar:card-linear" label="Paiement choisi" value={paymentLabel} />
          <OrderResultRow icon="solar:bill-list-linear" label="Facture" value={invoiceLabel} />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="h-12 rounded-full bg-charcoal px-7 text-ivory">
            <Link to="/portal">Voir mes commandes</Link>
          </Button>
          {order.portal_url ? (
            <Button asChild variant="outline" className="h-12 rounded-full border-charcoal/10 bg-white px-7">
              <a href={order.portal_url}>Ouvrir le bon de commande</a>
            </Button>
          ) : null}
        </div>
      </section>
    </main>
  )
}

function OrderResultRow({
  icon,
  label,
  value,
  strong,
}: {
  icon: string
  label: string
  value: string
  strong?: boolean
}) {
  return (
    <div className="grid gap-3 rounded-[1.25rem] bg-white/72 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
      <span className="grid size-10 place-items-center rounded-full bg-gold/12 text-gold">
        <AppIcon icon={icon} className="size-5" />
      </span>
      <span className="text-sm font-medium text-warm-gray">{label}</span>
      <span className={`min-w-0 break-words text-left text-charcoal sm:text-right ${strong ? "text-lg font-bold" : "font-semibold"}`}>
        {value}
      </span>
    </div>
  )
}
