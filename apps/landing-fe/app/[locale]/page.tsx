import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import PricingSection from '@/components/PricingSection'
import WhatsAppFAB from '@/components/WhatsAppFAB'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <Footer />
      <WhatsAppFAB />
    </div>
  )
}
