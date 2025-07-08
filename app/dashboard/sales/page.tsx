import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getSales, getSaleDetails } from "@/lib/actions"
import { Eye } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default async function SalesPage() {
  const sales = await getSales()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
          <p className="text-muted-foreground">View all past sales transactions.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
          <CardDescription>A record of all completed sales.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No sales found.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.sale_id}>
                    <TableCell className="font-mono text-xs">{sale.sale_id.substring(0, 8)}...</TableCell>
                    <TableCell>{(sale.Customers as any)?.name || "N/A"}</TableCell>
                    <TableCell>{new Date(sale.sale_date).toLocaleString()}</TableCell>
                    <TableCell className="text-right">${sale.total_amount.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View Details</span>
                          </Button>
                        </DialogTrigger>
                        <SaleDetailsDialog saleId={sale.sale_id} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

async function SaleDetailsDialog({ saleId }: { saleId: string }) {
  const sale = await getSaleDetails(saleId)

  if (!sale) {
    return (
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sale Details</DialogTitle>
        </DialogHeader>
        <p>Sale not found.</p>
      </DialogContent>
    )
  }

  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader>
        <DialogTitle>Sale Details (ID: {sale.sale_id.substring(0, 8)}...)</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          <p className="font-medium">Customer:</p>
          <p>{(sale.Customers as any)?.name || "N/A"}</p>
          <p className="font-medium">Date:</p>
          <p>{new Date(sale.sale_date).toLocaleString()}</p>
          <p className="font-medium">Total Amount:</p>
          <p>${sale.total_amount.toFixed(2)}</p>
        </div>

        <h3 className="text-lg font-semibold mt-4">Items:</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Subtotal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(sale.SaleItems as any[]).map((item) => (
              <TableRow key={item.sale_item_id}>
                <TableCell>{(item.Products as any)?.name || "N/A"}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">${item.unit_price.toFixed(2)}</TableCell>
                <TableCell className="text-right">${(item.quantity * item.unit_price).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </DialogContent>
  )
}
