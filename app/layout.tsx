
"use client"
import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/lib/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { ProtectedRoute } from "@/components/protected-route"
import { DashboardLayout } from "@/components/dashboard-layout"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {


  const pathname = usePathname();
  if (pathname === "/login") {
    return (
      <html lang="en">
        <body className={inter.className}>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </body>
      </html>
    );
  }
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ProtectedRoute>
            <DashboardLayout>{children}</DashboardLayout>
          </ProtectedRoute>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
