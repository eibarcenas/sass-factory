import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: 'catalog.mx - Tu catalogo digital en WhatsApp',
  description:
    'Crea tu menu digital, comparte el link y recibe pedidos directo en WhatsApp. Sin app, sin comisiones.',
  openGraph: {
    title: 'catalog.mx - Tu catalogo digital en WhatsApp',
    description: 'Crea tu catalogo en 5 minutos y recibe pedidos por WhatsApp.',
    siteName: 'catalog.mx',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  )
}
