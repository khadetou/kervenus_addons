import { useQuery } from "@tanstack/react-query"

import { getLookbook, lookbook } from "@/data/lookbook"

export function useLookbook() {
  return useQuery({
    queryKey: ["lookbook"],
    queryFn: getLookbook,
    initialData: lookbook,
  })
}
