import { useQuery } from "@tanstack/react-query"

import { getNavigation, navigation } from "@/data/navigation"
import { getOdooNavigation } from "@/lib/odoo-api"

export function useNavigation() {
  return useQuery({
    queryKey: ["navigation"],
    queryFn: async () => getOdooNavigation().catch(() => getNavigation()),
    initialData: navigation,
  })
}
