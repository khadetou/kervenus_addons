import { AppIcon } from "@/components/icons/icon"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/format"
import { getVariantOptionGroups } from "@/lib/product-variants"
import { cn } from "@/lib/utils"
import type { Product, ProductVariant, ProductVariantAttributeValue } from "@/lib/types"

type ProductVariantSelectorProps = {
  product: Product
  selectedVariant?: ProductVariant
  selectedValueIds: number[]
  onSelectValue: (groupValueIds: number[], valueId: number) => void
  isValueAvailable: (groupValueIds: number[], valueId: number) => boolean
}

export function ProductVariantSelector({
  product,
  selectedVariant,
  selectedValueIds,
  onSelectValue,
  isValueAvailable,
}: ProductVariantSelectorProps) {
  const optionGroups = getVariantOptionGroups(product)
  if (!optionGroups.length || !product.variants?.length) return null

  return (
    <Card className="mt-7 rounded-[1.55rem] border-charcoal/6 bg-ivory/74 p-0 shadow-soft">
      <CardContent className="p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/76 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              <AppIcon icon="solar:tuning-3-linear" className="size-4" />
              Options
            </div>
            <p className="mt-3 font-serif text-2xl leading-none text-charcoal">
              Choisissez votre variante
            </p>
          </div>
          {selectedVariant ? (
            <Badge className="w-fit rounded-full bg-charcoal px-3 py-1.5 text-ivory">
              {formatPrice(selectedVariant.price, selectedVariant.currency)}
            </Badge>
          ) : null}
        </div>

        <Separator className="my-4 bg-charcoal/8" />

        <div className="grid gap-5">
          {optionGroups.map((group) => {
            const groupValueIds = group.values.map((value) => value.id)
            const selectedValue = group.values.find((value) => selectedValueIds.includes(value.id))

            return (
              <section key={group.id} className="grid gap-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-warm-gray">
                      {group.name}
                    </p>
                    {selectedValue ? (
                      <p className="mt-1 text-sm font-medium text-charcoal">
                        {selectedValue.name}
                      </p>
                    ) : null}
                  </div>
                  <span className="text-xs text-warm-gray">
                    {group.values.length} option{group.values.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {group.values.map((value) => {
                    const selected = selectedValueIds.includes(value.id)
                    const available = isValueAvailable(groupValueIds, value.id)

                    return (
                      <VariantValueButton
                        key={value.id}
                        displayType={group.displayType}
                        value={value}
                        selected={selected}
                        disabled={!available}
                        onClick={() => onSelectValue(groupValueIds, value.id)}
                      />
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {selectedVariant?.attributeSummary ? (
          <div className="mt-5 rounded-[1.15rem] border border-gold/14 bg-white/65 p-3">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold/12 text-gold">
                <AppIcon icon="solar:check-circle-linear" className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  Variante sélectionnée
                </p>
                <p className="mt-1 text-sm font-medium text-charcoal">
                  {selectedVariant.attributeSummary}
                </p>
                {selectedVariant.defaultCode ? (
                  <p className="mt-1 text-xs text-warm-gray">
                    Réf. {selectedVariant.defaultCode}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

function VariantValueButton({
  disabled,
  displayType,
  onClick,
  selected,
  value,
}: {
  disabled: boolean
  displayType: string
  onClick: () => void
  selected: boolean
  value: ProductVariantAttributeValue
}) {
  const visualDisplay = displayType === "color" || displayType === "image"

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "h-auto min-h-11 rounded-full border-charcoal/10 bg-white/72 px-3 py-2 text-charcoal shadow-[inset_0_1px_0_rgba(255,255,255,0.68)] transition hover:-translate-y-0.5 hover:border-gold/35 hover:bg-white",
        selected && "border-charcoal bg-charcoal text-ivory hover:bg-charcoal hover:text-ivory",
        disabled && "opacity-35"
      )}
    >
      {visualDisplay ? (
        <span
          className={cn(
            "grid size-7 shrink-0 place-items-center overflow-hidden rounded-full border",
            selected ? "border-white/30 bg-white/12" : "border-charcoal/10 bg-cream"
          )}
        >
          {value.image ? (
            <img src={value.image} alt="" className="h-full w-full object-cover" />
          ) : (
            <span
              className="size-5 rounded-full border border-charcoal/10"
              style={{ background: value.htmlColor || value.name }}
            />
          )}
        </span>
      ) : null}
      <span className="max-w-[12rem] truncate text-sm font-medium">{value.name}</span>
      {value.priceExtra ? (
        <span className={cn("text-xs", selected ? "text-ivory/68" : "text-warm-gray")}>
          +{value.priceExtra}
        </span>
      ) : null}
    </Button>
  )
}
