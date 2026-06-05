import { redirect } from 'next/navigation'

export default function HomePage() {
  const landingUrl = process.env.LANDING_URL ?? 'https://catalog.mx'
  redirect(`${landingUrl}/es`)
}
