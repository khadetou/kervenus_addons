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
  addOdooCartLine,
  getOdooCart,
  updateOdooCartLine,
} from "@/lib/odoo-api"
import { useSession } from "@/hooks/use-session"
import type { CartLine, Product } from "@/lib/types"

type CartContextValue = {
  lines: CartLine[]
  isCartOpen: boolean
  subtotal: number
  itemCount: number
  addProduct: (product: Product, quantity?: number) => void
  removeProduct: (productId: string) => void
  increaseQuantity: (productId: string) => void
  decreaseQuantity: (productId: string) => void
  clearCart: () => void
  refreshCart: () => void
  openCart: () => void
  closeCart: () => void
  setCartOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [isCartOpen, setCartOpen] = useState(false)
  const session = useSession()

  const refreshCart = useCallback(() => {
    void getOdooCart()
      .then((cart) => setLines(cart.lines))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    let isMounted = true
    void getOdooCart()
      .then((cart) => {
        if (isMounted) setLines(cart.lines)
      })
      .catch(() => undefined)

    return () => {
      isMounted = false
    }
  }, [session.data?.authenticated])

  const addProduct = useCallback((product: Product, quantity = 1) => {
    setLines((current) => {
      const existing = current.find((line) => line.product.id === product.id)

      if (existing) {
        return current.map((line) =>
          line.product.id === product.id
            ? { ...line, quantity: line.quantity + quantity }
            : line
        )
      }

      return [...current, { product, quantity }]
    })
    setCartOpen(true)
    void addOdooCartLine(product, quantity)
      .then((cart) => setLines(cart.lines))
      .catch(() => undefined)
  }, [])

  const removeProduct = useCallback((productId: string) => {
    setLines((current) => {
      const line = current.find((item) => item.product.id === productId)
      if (line?.lineId) {
        void updateOdooCartLine(line.lineId, 0)
          .then((cart) => setLines(cart.lines))
          .catch(() => undefined)
      }
      return current.filter((item) => item.product.id !== productId)
    })
  }, [])

  const increaseQuantity = useCallback((productId: string) => {
    setLines((current) => {
      const next = current.map((line) =>
        line.product.id === productId ? { ...line, quantity: line.quantity + 1 } : line
      )
      const line = next.find((item) => item.product.id === productId)
      if (line?.lineId) {
        void updateOdooCartLine(line.lineId, line.quantity)
          .then((cart) => setLines(cart.lines))
          .catch(() => undefined)
      }
      return next
    })
  }, [])

  const decreaseQuantity = useCallback((productId: string) => {
    setLines((current) => {
      const next = current
        .map((line) =>
          line.product.id === productId
            ? { ...line, quantity: Math.max(0, line.quantity - 1) }
            : line
        )
        .filter((line) => line.quantity > 0)
      const previousLine = current.find((item) => item.product.id === productId)
      const nextLine = next.find((item) => item.product.id === productId)
      if (previousLine?.lineId) {
        void updateOdooCartLine(previousLine.lineId, nextLine?.quantity ?? 0)
          .then((cart) => setLines(cart.lines))
          .catch(() => undefined)
      }
      return next
    })
  }, [])

  const clearCart = useCallback(() => {
    setLines((current) => {
      current.forEach((line) => {
        if (line.lineId) {
          void updateOdooCartLine(line.lineId, 0).catch(() => undefined)
        }
      })
      return []
    })
  }, [])
  const openCart = useCallback(() => setCartOpen(true), [])
  const closeCart = useCallback(() => setCartOpen(false), [])

  const value = useMemo(() => {
    const subtotal = lines.reduce(
      (total, line) => total + line.product.price * line.quantity,
      0
    )
    const itemCount = lines.reduce((total, line) => total + line.quantity, 0)

    return {
      lines,
      isCartOpen,
      subtotal,
      itemCount,
      addProduct,
      removeProduct,
      increaseQuantity,
      decreaseQuantity,
      clearCart,
      refreshCart,
      openCart,
      closeCart,
      setCartOpen,
    }
  }, [
    addProduct,
    clearCart,
    closeCart,
    decreaseQuantity,
    increaseQuantity,
    isCartOpen,
    lines,
    openCart,
    refreshCart,
    removeProduct,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error("useCart must be used within CartProvider")
  }

  return context
}
