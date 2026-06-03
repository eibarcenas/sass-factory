import { Clock, MessageCircle, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Feature {
  Icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    Icon: Clock,
    title: 'Catalogo siempre activo',
    description:
      'Tu menu digital disponible 24/7. Actualiza precios y productos en segundos, sin tecnico ni app.',
  },
  {
    Icon: MessageCircle,
    title: 'Pedidos por WhatsApp',
    description:
      'Tus clientes hacen clic y te escriben directo. Sin registros, sin descargas, sin complicaciones.',
  },
  {
    Icon: ShieldCheck,
    title: 'Sin comisiones',
    description:
      'El dinero llega directo a ti. Solo cobras lo que vendes, sin porcentajes ni sorpresas.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="pb-20 px-6">
      <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
        {FEATURES.map(({ Icon, title, description }) => (
          <div
            key={title}
            className="flex flex-col gap-4 p-6 rounded-xl"
            style={{
              background: '#161616',
              border: '1px solid rgba(255,255,255,0.07)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(37,211,102,0.1)' }}
            >
              <Icon size={20} color="#25D366" strokeWidth={1.75} />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-white font-bold text-[1rem] leading-snug">{title}</h3>
              <p className="text-[0.875rem] leading-relaxed" style={{ color: '#888888' }}>
                {description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
