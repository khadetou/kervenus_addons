import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import type { Product } from "@/lib/types"

export function ProductTabs({ product }: { product: Product }) {
  return (
    <Tabs defaultValue="description" className="mt-8">
      <TabsList className="grid h-auto w-full grid-cols-3 rounded-full bg-white/70 p-1">
        <TabsTrigger value="description" className="rounded-full">
          Description
        </TabsTrigger>
        <TabsTrigger value="care" className="rounded-full">
          Matière
        </TabsTrigger>
        <TabsTrigger value="delivery" className="rounded-full">
          Livraison
        </TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="rounded-[1.5rem] bg-white/70 p-5 text-warm-gray">
        {product.description}
      </TabsContent>
      <TabsContent value="care" className="rounded-[1.5rem] bg-white/70 p-5 text-warm-gray">
        {product.material}. Nettoyer avec un chiffon doux et éviter les produits abrasifs.
      </TabsContent>
      <TabsContent value="delivery" className="rounded-[1.5rem] bg-white/70 p-5 text-warm-gray">
        Livraison disponible à Dakar. Confirmation personnalisée avant expédition.
      </TabsContent>
    </Tabs>
  )
}
