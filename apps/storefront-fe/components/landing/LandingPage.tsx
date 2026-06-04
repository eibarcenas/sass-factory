import Navbar from './Navbar'
import HeroSection from './HeroSection'
import FeaturesSection from './FeaturesSection'
import PricingSection from './PricingSection'
import WhatsAppFAB from './WhatsAppFAB'

export default function LandingPage() {
  return (
    <div className="bg-[#0A0A0A] text-white min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PricingSection />

      {/* Legal / T&C */}
      <section
        className="py-16 px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">

          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-[1.1rem]">Terminos clave</h3>
            <ul className="flex flex-col gap-3">
              {[
                'Sin contrato de permanencia. Cancela en cualquier momento desde tu cuenta.',
                'Tu catalogo y datos son tuyos. Nunca los vendemos ni compartimos con terceros.',
                'Sin comisiones por pedido. Pagas solo la suscripcion mensual o anual.',
                'Los pedidos llegan directo a tu WhatsApp. Nosotros no intervenimos en la venta.',
                'Servicio disponible en Mexico. Precios en pesos mexicanos (MXN), IVA incluido.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm" style={{ color: '#888888' }}>
                  <span
                    className="w-1 h-1 rounded-full mt-2 shrink-0"
                    style={{ background: '#25D366' }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="text-white font-bold text-[1.1rem]">Tienes dudas?</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
              Escríbenos por WhatsApp y te ayudamos a configurar tu catálogo. Respondemos en menos de 24 horas en días hábiles.
            </p>
            <a
              href="https://wa.me/521XXXXXXXXXX"
              className="inline-flex items-center gap-2 text-sm font-semibold"
              style={{ color: '#25D366' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Contactar por WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="px-6 py-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
      >
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
