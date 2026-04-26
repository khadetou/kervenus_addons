import { useQuery } from "@tanstack/react-query"

import { getSiteContent, siteContent } from "@/data/site-content"

export function useSiteContent() {
  return useQuery({
    queryKey: ["site-content"],
    queryFn: getSiteContent,
    initialData: siteContent,
  })
}
