const CATALOG_ITEMS = [
  { name: 'Taco al Pastor', price: '$25' },
  { name: 'Burrito Grande',  price: '$55' },
  { name: 'Quesadilla',      price: '$40' },
]

export default function PhoneMockup() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Green glow */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '260px',
          height: '380px',
          background: 'radial-gradient(ellipse, rgba(37,211,102,0.18) 0%, transparent 70%)',
          filter: 'blur(36px)',
          zIndex: 0,
        }}
        aria-hidden="true"
      />

      {/* Phone frame */}
      <div
        className="relative flex flex-col overflow-hidden"
        style={{
          width: '280px',
          height: '560px',
          borderRadius: '40px',
          background: '#0D0D0D',
          border: '2px solid rgba(255,255,255,0.1)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04) inset, 0 32px 64px rgba(0,0,0,0.6)',
          zIndex: 1,
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-3 pb-1 shrink-0">
          <span className="text-white text-[11px] font-semibold">9:41</span>
          <div
            className="w-[72px] h-[22px] rounded-full"
            style={{ background: '#0D0D0D', border: '1px solid rgba(255,255,255,0.15)' }}
            aria-hidden="true"
          />
          <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
            <rect x="0" y="3" width="2" height="7" rx="1" fill="white" opacity="0.4" />
            <rect x="3" y="2" width="2" height="8" rx="1" fill="white" opacity="0.6" />
            <rect x="6" y="1" width="2" height="9" rx="1" fill="white" opacity="0.8" />
            <rect x="9" y="0" width="2" height="10" rx="1" fill="white" />
          </svg>
        </div>

        {/* WhatsApp-style header */}
        <div
          className="flex items-center gap-3 px-4 py-3 shrink-0"
          style={{ background: '#1A2E22' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold text-sm text-white"
            style={{ background: '#25D366' }}
          >
            T
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-[12px] leading-tight truncate">
              Taqueria Los Alamos
            </p>
            <p className="text-[10px] leading-tight" style={{ color: '#25D366' }}>
              catalog.mx/taqueria
            </p>
          </div>
        </div>

        {/* Chat area */}
        <div
          className="flex-1 overflow-hidden px-3 py-3 flex flex-col gap-2"
          style={{ background: '#0B1D12' }}
        >
          <p
            className="text-[9px] text-center font-medium self-center px-2 py-0.5 rounded-full"
            style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.05)' }}
          >
            Hoy, 9:41 AM
          </p>

          {/* Business catalog message */}
          <div
            className="rounded-xl p-3 self-start max-w-[92%]"
            style={{ background: '#1A2E22', border: '1px solid rgba(37,211,102,0.12)' }}
          >
            <p className="text-[10px] font-bold mb-2" style={{ color: '#25D366' }}>
              Menu del dia
            </p>
            <div className="space-y-1.5 mb-2">
              {CATALOG_ITEMS.map((item, i) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between gap-3"
                  style={
                    i < CATALOG_ITEMS.length - 1
                      ? { borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '4px' }
                      : {}
                  }
                >
                  <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {item.name}
                  </span>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: '#25D366' }}>
                    {item.price}
                  </span>
                </div>
              ))}
            </div>
            <button
              className="w-full py-1.5 rounded-full text-black text-[10px] font-bold"
              style={{ background: '#25D366' }}
              tabIndex={-1}
              aria-hidden="true"
            >
              Pedir por WhatsApp
            </button>
          </div>

          {/* Customer selects an item — pre-filled message */}
          <div
            className="rounded-xl px-3 py-2 self-end max-w-[82%]"
            style={{ background: '#1A3D2A' }}
          >
            <p className="text-[10px] leading-snug" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Hola! Quiero pedir:{'\n'}
              <span className="font-bold" style={{ color: '#25D366' }}>2x Taco al Pastor</span>
              {' '}y{' '}
              <span className="font-bold" style={{ color: '#25D366' }}>1x Quesadilla</span>
            </p>
          </div>

          {/* Business quick reply */}
          <div
            className="rounded-xl px-3 py-2 self-start max-w-[85%]"
            style={{ background: '#1A2E22', border: '1px solid rgba(37,211,102,0.1)' }}
          >
            <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>
              Perfecto! Total $90. Listo en 15 min, te avisamos.
            </p>
          </div>
        </div>

        {/* Input bar */}
        <div
          className="flex items-center gap-2 px-3 py-3 shrink-0"
          style={{
            background: '#0D1A12',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            className="flex-1 rounded-full px-3 py-1.5"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Mensaje...
            </span>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
            style={{ background: '#25D366' }}
            aria-hidden="true"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="black" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
