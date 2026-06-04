import Navbar from '@/components/Navbar'
import HeroSection from '@/components/HeroSection'
import FeaturesSection from '@/components/FeaturesSection'
import PricingSection from '@/components/PricingSection'
import WhatsAppFAB from '@/components/WhatsAppFAB'

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />

      {/* Footer */}
      <footer className="px-6 py-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1200px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-white font-extrabold tracking-tight">catalog.mx</span>
          <span className="text-xs order-last sm:order-none" style={{ color: '#555555' }}>
            &copy; 2025 catalog.mx. Todos los derechos reservados. Operado en Mexico.
          </span>
        </div>
      </footer>

      <WhatsAppFAB />
    </div>
  )
}
