'use client'

import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const sentinel = document.getElementById('nav-sentinel')
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'border-b border-white/[0.08]' : ''
      }`}
      style={scrolled ? { background: 'rgba(10,10,10,0.88)', backdropFilter: 'blur(12px)' } : {}}
    >
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center">
        <span className="text-white font-extrabold text-lg tracking-tight select-none">
          catalog.mx
        </span>
      </div>
    </nav>
  )
}
