import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { getOdooSession, loginWithOdoo, logoutOdoo } from "@/lib/odoo-api"

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: getOdooSession,
    retry: false,
    staleTime: 60_000,
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutOdoo,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["session"] })
      queryClient.invalidateQueries({ queryKey: ["portal"] })
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      queryClient.invalidateQueries({ queryKey: ["navigation"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ login, password }: { login: string; password: string }) =>
      loginWithOdoo(login, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] })
      queryClient.invalidateQueries({ queryKey: ["portal"] })
      queryClient.invalidateQueries({ queryKey: ["products"] })
      queryClient.invalidateQueries({ queryKey: ["collections"] })
      queryClient.invalidateQueries({ queryKey: ["navigation"] })
      queryClient.invalidateQueries({ queryKey: ["cart"] })
    },
  })
}
