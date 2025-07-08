"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

// --- Customer Actions ---
export async function getCustomers() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("customers").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Error fetching customers:", error)
    return []
  }
  return data || []
}

export async function createCustomer(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const name = formData.get("name") as string
  const email = formData.get("email") as string | null
  const phone = formData.get("phone") as string | null

  // Handle empty strings as null
  const emailValue = email && email.trim() !== "" ? email : null
  const phoneValue = phone && phone.trim() !== "" ? phone : null

  const { error } = await supabase.from("customers").insert({
    name: name.trim(),
    email: emailValue,
    phone: phoneValue,
  })

  if (error) {
    console.error("Error creating customer:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/customers")
  return { success: true, message: "Customer created successfully." }
}

export async function updateCustomer(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const customer_id = formData.get("customer_id") as string
  const name = formData.get("name") as string
  const email = formData.get("email") as string | null
  const phone = formData.get("phone") as string | null

  // Handle empty strings as null
  const emailValue = email && email.trim() !== "" ? email : null
  const phoneValue = phone && phone.trim() !== "" ? phone : null

  const { error } = await supabase
    .from("customers")
    .update({
      name: name.trim(),
      email: emailValue,
      phone: phoneValue,
    })
    .eq("customer_id", customer_id)

  if (error) {
    console.error("Error updating customer:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/customers")
  return { success: true, message: "Customer updated successfully." }
}

export async function deleteCustomer(customer_id: string) {
  const supabase = await createServerSupabaseClient()

  // Check if customer has any sales
  const { data: salesData, error: salesError } = await supabase
    .from("sales")
    .select("sale_id")
    .eq("customer_id", customer_id)
    .limit(1)

  if (salesError) {
    console.error("Error checking customer sales:", salesError)
    return { success: false, message: "Error checking customer sales." }
  }

  if (salesData && salesData.length > 0) {
    return { success: false, message: "Cannot delete customer with existing sales." }
  }

  const { error } = await supabase.from("customers").delete().eq("customer_id", customer_id)
  if (error) {
    console.error("Error deleting customer:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/customers")
  return { success: true, message: "Customer deleted successfully." }
}

// --- Product Actions ---
export async function getProducts() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("products").select("*").order("name", { ascending: true })
  if (error) {
    console.error("Error fetching products:", error)
    return []
  }
  return data || []
}

export async function createProduct(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const price = Number.parseFloat(formData.get("price") as string)
  const stock_quantity = Number.parseInt(formData.get("stock_quantity") as string)

  if (isNaN(price) || price < 0) {
    return { success: false, message: "Invalid price value." }
  }

  if (isNaN(stock_quantity) || stock_quantity < 0) {
    return { success: false, message: "Invalid stock quantity value." }
  }

  const descriptionValue = description && description.trim() !== "" ? description.trim() : null

  const { error } = await supabase.from("products").insert({
    name: name.trim(),
    description: descriptionValue,
    price,
    stock_quantity,
  })

  if (error) {
    console.error("Error creating product:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/products")
  return { success: true, message: "Product created successfully." }
}

export async function updateProduct(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const product_id = formData.get("product_id") as string
  const name = formData.get("name") as string
  const description = formData.get("description") as string | null
  const price = Number.parseFloat(formData.get("price") as string)
  const stock_quantity = Number.parseInt(formData.get("stock_quantity") as string)

  if (isNaN(price) || price < 0) {
    return { success: false, message: "Invalid price value." }
  }

  if (isNaN(stock_quantity) || stock_quantity < 0) {
    return { success: false, message: "Invalid stock quantity value." }
  }

  const descriptionValue = description && description.trim() !== "" ? description.trim() : null

  const { error } = await supabase
    .from("products")
    .update({
      name: name.trim(),
      description: descriptionValue,
      price,
      stock_quantity,
    })
    .eq("product_id", product_id)

  if (error) {
    console.error("Error updating product:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/products")
  return { success: true, message: "Product updated successfully." }
}

export async function deleteProduct(product_id: string) {
  const supabase = await createServerSupabaseClient()

  // Check if product has any sale items
  const { data: saleItemsData, error: saleItemsError } = await supabase
    .from("sale_items")
    .select("sale_item_id")
    .eq("product_id", product_id)
    .limit(1)

  if (saleItemsError) {
    console.error("Error checking product sales:", saleItemsError)
    return { success: false, message: "Error checking product sales." }
  }

  if (saleItemsData && saleItemsData.length > 0) {
    return { success: false, message: "Cannot delete product with existing sales." }
  }

  const { error } = await supabase.from("products").delete().eq("product_id", product_id)
  if (error) {
    console.error("Error deleting product:", error)
    return { success: false, message: error.message }
  }

  revalidatePath("/dashboard/products")
  return { success: true, message: "Product deleted successfully." }
}

// --- Sales Actions ---
export async function getSales() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customers (
        name
      )
    `)
    .order("sale_date", { ascending: false })

  if (error) {
    console.error("Error fetching sales:", error)
    return []
  }
  return data || []
}

export async function getSaleDetails(sale_id: string) {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("sales")
    .select(`
      *,
      customers (
        name
      ),
      sale_items (
        *,
        products (
          name,
          price
        )
      )
    `)
    .eq("sale_id", sale_id)
    .single()

  if (error) {
    console.error("Error fetching sale details:", error)
    return null
  }
  return data
}

export async function createSale(customer_id: string, total_amount: number, items: any[]) {
  const supabase = await createServerSupabaseClient()

  try {
    // Start a transaction by creating the sale first
    const { data: saleData, error: saleError } = await supabase
      .from("sales")
      .insert({ customer_id, total_amount })
      .select()
      .single()

    if (saleError) {
      console.error("Error creating sale:", saleError)
      return { success: false, message: saleError.message }
    }

    const sale_id = saleData.sale_id

    // Prepare sale items
    const saleItemsToInsert = items.map((item) => ({
      sale_id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))

    // Insert sale items
    const { error: itemsError } = await supabase.from("sale_items").insert(saleItemsToInsert)

    if (itemsError) {
      console.error("Error creating sale items:", itemsError)
      // Rollback sale if sale items fail
      await supabase.from("sales").delete().eq("sale_id", sale_id)
      return { success: false, message: itemsError.message }
    }

    // Update product stock quantities using the function
    for (const item of items) {
      const { error: stockError } = await supabase.rpc("decrement_product_stock", {
        p_product_id: item.product_id,
        p_quantity: item.quantity,
      })

      if (stockError) {
        console.error("Error updating stock:", stockError)
        // In a real application, you might want to rollback the entire transaction
        // For now, we'll continue but log the error
      }
    }

    revalidatePath("/dashboard/sales")
    revalidatePath("/dashboard/pos")
    revalidatePath("/dashboard/products")
    return { success: true, message: "Sale created successfully." }
  } catch (error) {
    console.error("Unexpected error creating sale:", error)
    return { success: false, message: "An unexpected error occurred." }
  }
}

// --- Dashboard Stats ---
export async function getDashboardStats() {
  const supabase = await createServerSupabaseClient()

  try {
    // Get total customers
    const { count: totalCustomers } = await supabase.from("customers").select("*", { count: "exact", head: true })

    // Get total products
    const { count: totalProducts } = await supabase.from("products").select("*", { count: "exact", head: true })

    // Get total sales today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { data: todaySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("sale_date", today.toISOString())
      .lt("sale_date", tomorrow.toISOString())

    const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

    // Get low stock products count
    const { count: lowStockCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .lte("stock_quantity", 10)

    return {
      totalCustomers: totalCustomers || 0,
      totalProducts: totalProducts || 0,
      todayRevenue,
      lowStockCount: lowStockCount || 0,
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalCustomers: 0,
      totalProducts: 0,
      todayRevenue: 0,
      lowStockCount: 0,
    }
  }
}
