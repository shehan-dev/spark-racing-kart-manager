import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Spark Racing Sprint Cup',
  description: 'Manage kart number assignments for racing sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

