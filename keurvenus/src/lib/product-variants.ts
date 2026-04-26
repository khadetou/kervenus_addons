import { useEffect, useMemo, useState } from "react"

import type { Product, ProductVariant, ProductVariantOptionGroup } from "@/lib/types"

export function getDefaultVariant(product: Product) {
  if (!product.variants?.length) return undefined
  return (
    product.variants.find((variant) => variant.variantId === product.variantId) ||
    findVariantForSelection(product, product.selectedAttributeValueIds || []) ||
    product.variants[0]
  )
}

export function findVariantForSelection(product: Product, selectedValueIds: number[]) {
  if (!product.variants?.length || !selectedValueIds.length) return undefined
  const selected = new Set(selectedValueIds)
  return product.variants.find((variant) => {
    if (variant.attributeValueIds.length !== selected.size) return false
    return variant.attributeValueIds.every((valueId) => selected.has(valueId))
  })
}

export function hasCompatibleVariant(product: Product, selectedValueIds: number[]) {
  if (!product.variants?.length) return true
  const selected = selectedValueIds.filter(Boolean)
  if (!selected.length) return true
  return product.variants.some((variant) =>
    selected.every((valueId) => variant.attributeValueIds.includes(valueId))
  )
}

export function getVariantOptionGroups(product: Product): ProductVariantOptionGroup[] {
  if (product.variantOptions?.length) return product.variantOptions

  const groups = new Map<number, ProductVariantOptionGroup>()
  for (const variant of product.variants || []) {
    for (const value of variant.attributeValues) {
      const group = groups.get(value.attributeId) || {
        id: value.attributeId,
        name: value.attributeName,
        displayType: value.displayType || "radio",
        values: [],
      }
      if (!group.values.some((item) => item.id === value.id)) {
        group.values.push({
          ...value,
          variantIds: [variant.variantId],
        })
      } else {
        group.values = group.values.map((item) =>
          item.id === value.id
            ? {
                ...item,
                variantIds: [...new Set([...(item.variantIds || []), variant.variantId])],
              }
            : item
        )
      }
      groups.set(value.attributeId, group)
    }
  }

  return Array.from(groups.values()).filter((group) => group.values.length)
}

export function applyProductVariant(product: Product, variant?: ProductVariant): Product {
  if (!variant) return product

  return {
    ...product,
    id: `${product.templateId || product.id}:${variant.variantId}`,
    variantId: variant.variantId,
    name: product.name,
    shortDescription: variant.attributeSummary || product.shortDescription,
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    currency: variant.currency,
    images: variant.images.length ? variant.images : product.images,
    material: variant.material || product.material,
    color: variant.color || product.color,
    inStock: variant.inStock,
    selectedAttributeValueIds: variant.attributeValueIds,
    selectedAttributeSummary: variant.attributeSummary,
  }
}

export function useProductVariantSelection(product: Product) {
  const defaultVariant = useMemo(() => getDefaultVariant(product), [product])
  const [selectedValueIds, setSelectedValueIds] = useState<number[]>(
    defaultVariant?.attributeValueIds || product.selectedAttributeValueIds || []
  )

  useEffect(() => {
    setSelectedValueIds(defaultVariant?.attributeValueIds || product.selectedAttributeValueIds || [])
  }, [defaultVariant, product.id, product.selectedAttributeValueIds])

  const selectedVariant =
    findVariantForSelection(product, selectedValueIds) || defaultVariant
  const selectedProduct = applyProductVariant(product, selectedVariant)

  function selectValue(groupValueIds: number[], valueId: number) {
    const nextSelection = [
      ...selectedValueIds.filter((selectedValueId) => !groupValueIds.includes(selectedValueId)),
      valueId,
    ]
    const exactVariant = findVariantForSelection(product, nextSelection)
    setSelectedValueIds(exactVariant?.attributeValueIds || nextSelection)
  }

  function isValueAvailable(groupValueIds: number[], valueId: number) {
    const nextSelection = [
      ...selectedValueIds.filter((selectedValueId) => !groupValueIds.includes(selectedValueId)),
      valueId,
    ]
    return hasCompatibleVariant(product, nextSelection)
  }

  return {
    product: selectedProduct,
    selectedVariant,
    selectedValueIds,
    selectValue,
    isValueAvailable,
  }
}
