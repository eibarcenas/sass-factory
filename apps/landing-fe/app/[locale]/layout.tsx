import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import '../globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'catalog.mx — Tu catálogo digital en WhatsApp',
  description:
    'Comparte el link de tu catalogo digital. Tus clientes eligen lo que quieren y te mandan el pedido por WhatsApp, ya con todos los detalles.',
  openGraph: {
    title: 'catalog.mx — Tu catálogo digital en WhatsApp',
    description: 'Crea tu catalogo en 5 minutos y recibe pedidos por WhatsApp.',
    siteName: 'catalog.mx',
  },
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound()
  }

  return (
    <html lang={locale} className={inter.variable}>
      <body className="bg-[#0A0A0A] text-white min-h-screen antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
