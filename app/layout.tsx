import type React from "react"
import type { Metadata } from "next"
import { Space_Mono, Libre_Franklin } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
})

const libreFranklin = Libre_Franklin({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-libre-franklin",
})

export const metadata: Metadata = {
  title: "Passion Seed",
  description: "Discover and nurture your passions",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${libreFranklin.variable} ${spaceMono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}


import './globals.css'