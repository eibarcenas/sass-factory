import LiveCatalogPreview from './LiveCatalogPreview'
import GoogleSignInButton from './GoogleSignInButton'

const AVATAR_SEEDS = ['mx-biz-1', 'mx-biz-2', 'mx-biz-3', 'mx-biz-4']

export default function HeroSection() {
  return (
    <section className="min-h-[100dvh] flex items-center pt-16 relative">
      <div
        id="nav-sentinel"
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-[1200px] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-10 items-center py-16 lg:py-0">

        {/* Left column */}
        <div className="flex flex-col gap-7 text-center lg:text-left items-center lg:items-start">

          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[0.8rem] font-medium select-none"
            style={{
              border: '1px solid rgba(37,211,102,0.4)',
              background: 'rgba(37,211,102,0.08)',
              color: '#25D366',
            }}
          >
            <span aria-hidden="true">&#9889;</span>
            <span>Para negocios locales en Mexico</span>
          </div>

          {/* Headline */}
          <h1
            className="text-white font-black leading-[1.05] tracking-[-0.03em]"
            style={{ fontSize: 'clamp(3rem, 6vw, 5.5rem)' }}
          >
            Tu catalogo en{' '}
            <span style={{ color: '#25D366' }}>WhatsApp</span>
            <br />
            en 5 minutos
          </h1>

          {/* Subheadline */}
          <p
            className="text-[1.1rem] leading-relaxed max-w-[480px]"
            style={{ color: '#888888' }}
          >
            Comparte el link de tu catalogo digital. Tus clientes eligen lo que quieren y te mandan el pedido por WhatsApp, ya con todos los detalles.
          </p>

          {/* Direct Google auth - no modal */}
          <div className="flex flex-col items-center lg:items-start gap-2">
            <GoogleSignInButton size="large" />
            <span className="text-[0.8rem]" style={{ color: '#888888' }}>
              Sin tarjeta de credito &middot; Listo en 5 min
            </span>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2" aria-hidden="true">
              {AVATAR_SEEDS.map((seed) => (
                <img
                  key={seed}
                  src={`https://picsum.photos/seed/${seed}/40/40`}
                  alt=""
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover"
                  style={{ border: '2px solid #0A0A0A' }}
                />
              ))}
            </div>
            <span className="text-sm" style={{ color: '#888888' }}>
              150+ negocios activos en Mexico
            </span>
          </div>
        </div>

        {/* Right column */}
        <div className="flex justify-center lg:justify-end">
          <LiveCatalogPreview />
        </div>

      </div>
    </section>
  )
}
