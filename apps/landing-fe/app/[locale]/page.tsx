import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import BusinessStrip from '@/components/BusinessStrip'
import Features from '@/components/Features'
import HowItWorks from '@/components/HowItWorks'
import CtaBlock from '@/components/CtaBlock'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="bg-[#FAF9F6] text-zinc-900">
      <Nav />
      <main>
        <Hero />
        <BusinessStrip />
        <Features />
        <HowItWorks />
        <CtaBlock />
      </main>
      <Footer />
    </div>
  )
}
