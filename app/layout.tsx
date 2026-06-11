import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SDF Clothing — Admin',
  description: 'Internal invoice & client management',
  robots: 'noindex, nofollow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
