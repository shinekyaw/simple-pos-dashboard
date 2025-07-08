"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Minus, XCircle, DollarSign, ShoppingCart } from "lucide-react"
import { getProducts, getCustomers, createSale } from "@/lib/actions"
import { toast } from "@/components/ui/use-toast"

interface Product {
  product_id: string
  name: string
  price: number
  stock_quantity: number
}

interface Customer {
  customer_id: string
  name: string
}

interface CartItem extends Product {
  quantity: number
  subtotal: number
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingSale, setProcessingSale] = useState(false)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [productsData, customersData] = await Promise.all([getProducts(), getCustomers()])
      setProducts(productsData)
      setCustomers(customersData)

      // Set "Walk-in Customer" as default if it exists
      const walkInCustomer = customersData.find((c: any) => c.name === "Walk-in Customer")
      if (walkInCustomer) {
        setSelectedCustomerId(walkInCustomer.customer_id)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products
    return products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [products, searchTerm])

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.product_id === product.product_id)
      if (existingItem) {
        if (existingItem.quantity < product.stock_quantity) {
          return prevCart.map((item) =>
            item.product_id === product.product_id
              ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
              : item,
          )
        } else {
          toast({
            title: "Out of Stock",
            description: `Cannot add more ${product.name}. Maximum stock reached.`,
            variant: "destructive",
          })
          return prevCart
        }
      } else {
        return [...prevCart, { ...product, quantity: 1, subtotal: product.price }]
      }
    })
  }

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product_id === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) return null // Remove if quantity is 0 or less
            if (newQuantity > item.stock_quantity) {
              toast({
                title: "Out of Stock",
                description: `Cannot add more ${item.name}. Maximum stock reached.`,
                variant: "destructive",
              })
              return item
            }
            return { ...item, quantity: newQuantity, subtotal: newQuantity * item.price }
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.product_id !== productId))
  }

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0)
  }, [cart])

  const handleProcessSale = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before processing the sale.",
        variant: "destructive",
      })
      return
    }
    if (!selectedCustomerId) {
      toast({
        title: "No Customer Selected",
        description: "Please select a customer for this sale.",
        variant: "destructive",
      })
      return
    }

    setProcessingSale(true)
    const saleItems = cart.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.price,
    }))

    const result = await createSale(selectedCustomerId, totalAmount, saleItems)

    if (result.success) {
      toast({
        title: "Sale Processed",
        description: result.message,
        variant: "default",
      })
      setCart([]) // Clear cart
      // Re-fetch products to update stock quantities in the UI
      const productsData = await getProducts()
      setProducts(productsData)
    } else {
      toast({
        title: "Sale Failed",
        description: result.message,
        variant: "destructive",
      })
    }
    setProcessingSale(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading POS data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Process new sales and manage transactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Search & List */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Products</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search products..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead className="text-right">Add</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => (
                    <TableRow key={product.product_id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>${product.price.toFixed(2)}</TableCell>
                      <TableCell>{product.stock_quantity}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addToCart(product)}
                          disabled={product.stock_quantity <= 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Cart & Checkout */}
        <Card>
          <CardHeader>
            <CardTitle>Cart</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customer-select">Customer</Label>
              <Select value={selectedCustomerId || ""} onValueChange={setSelectedCustomerId}>
                <SelectTrigger id="customer-select">
                  <SelectValue placeholder="Select a customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.customer_id} value={customer.customer_id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                  <TableHead className="text-right">Remove</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Cart is empty.
                    </TableCell>
                  </TableRow>
                ) : (
                  cart.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="flex items-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateCartQuantity(item.product_id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span>{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => updateCartQuantity(item.product_id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product_id)}>
                          <XCircle className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            <div className="flex justify-between items-center font-bold text-lg border-t pt-4">
              <span>Total:</span>
              <span>${totalAmount.toFixed(2)}</span>
            </div>

            <Button className="w-full" onClick={handleProcessSale} disabled={cart.length === 0 || processingSale}>
              {processingSale ? (
                <>
                  <ShoppingCart className="mr-2 h-4 w-4 animate-pulse" /> Processing...
                </>
              ) : (
                <>
                  <DollarSign className="mr-2 h-4 w-4" /> Process Sale
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
