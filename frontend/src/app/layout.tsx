import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Providers } from "./providers"
import "@/styles/global.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "SplitEase",
  description: "Split expenses with friends and family",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}