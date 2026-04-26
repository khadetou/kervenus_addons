import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  addOdooWishlistItem,
  getOdooWishlist,
  removeOdooWishlistItem,
} from "@/lib/odoo-api"
import type { Product } from "@/lib/types"

type WishlistContextValue = {
  count: number
  isWishlistOpen: boolean
  products: Product[]
  addProduct: (product: Product) => void
  closeWishlist: () => void
  isFavorite: (productId: string) => boolean
  openWishlist: () => void
  removeProduct: (productId: string) => void
  setWishlistOpen: (open: boolean) => void
  toggleProduct: (product: Product) => void
}

const WISHLIST_STORAGE_KEY = "keurvenus:wishlist"

const WishlistContext = createContext<WishlistContextValue | null>(null)

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>([])
  const [isWishlistOpen, setWishlistOpen] = useState(false)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(WISHLIST_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as Product[]
        setProducts(Array.isArray(parsed) ? parsed : [])
      }
    } catch {
      setProducts([])
    } finally {
      setIsHydrated(true)
    }

    void getOdooWishlist()
      .then((items) => {
        if (items.length) setProducts(items)
      })
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!isHydrated) return
    window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(products))
  }, [isHydrated, products])

  const addProduct = useCallback((product: Product) => {
    setProducts((current) => {
      if (current.some((item) => item.id === product.id)) return current
      return [product, ...current]
    })
    void addOdooWishlistItem(product)
      .then((item) => {
        setProducts((current) =>
          current.map((productItem) => (productItem.id === item.id ? item : productItem))
        )
      })
      .catch(() => undefined)
  }, [])

  const removeProduct = useCallback((productId: string) => {
    setProducts((current) => {
      const product = current.find((item) => item.id === productId)
      if (product?.wishId) {
        void removeOdooWishlistItem(product.wishId).catch(() => undefined)
      }
      return current.filter((product) => product.id !== productId)
    })
  }, [])

  const toggleProduct = useCallback((product: Product) => {
    setProducts((current) => {
      const existing = current.find((item) => item.id === product.id)
      if (existing) {
        if (existing.wishId) {
          void removeOdooWishlistItem(existing.wishId).catch(() => undefined)
        }
        return current.filter((item) => item.id !== product.id)
      }

      void addOdooWishlistItem(product)
        .then((item) => {
          setProducts((latest) =>
            latest.map((productItem) => (productItem.id === item.id ? item : productItem))
          )
        })
        .catch(() => undefined)
      return [product, ...current]
    })
  }, [])

  const isFavorite = useCallback(
    (productId: string) => products.some((product) => product.id === productId),
    [products]
  )

  const openWishlist = useCallback(() => setWishlistOpen(true), [])
  const closeWishlist = useCallback(() => setWishlistOpen(false), [])

  const value = useMemo(
    () => ({
      addProduct,
      closeWishlist,
      count: products.length,
      isFavorite,
      isWishlistOpen,
      openWishlist,
      products,
      removeProduct,
      setWishlistOpen,
      toggleProduct,
    }),
    [
      addProduct,
      closeWishlist,
      isFavorite,
      isWishlistOpen,
      openWishlist,
      products,
      removeProduct,
      toggleProduct,
    ]
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlist() {
  const context = useContext(WishlistContext)

  if (!context) {
    throw new Error("useWishlist must be used within WishlistProvider")
  }

  return context
}
