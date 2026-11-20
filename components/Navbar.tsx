'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

interface NavbarProps {
  lang?: 'en' | 'es'
  activePage?: string
}

export default function Navbar({ lang = 'en', activePage }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawerOpen])

  const base = lang === 'es' ? '/es' : ''
  const altLangLabel = lang === 'es' ? 'EN' : 'ES'

  const subPageMap: Record<string, string> = {
    'Menu': '/menu', 'Menú': '/menu',
    'About': '/about', 'Nosotros': '/about',
    'Live Music': '/live-music', 'Música en Vivo': '/live-music',
  }
  const subPath = activePage ? (subPageMap[activePage] ?? '') : ''
  const altLang = lang === 'es' ? subPath || '/' : `/es${subPath}`

  const links =
    lang === 'es'
      ? [
          { href: `/es/#experience`, label: 'Experiencia' },
          { href: `${base}/menu`, label: 'Menú' },
          { href: `${base}/live-music`, label: 'Música en Vivo' },
          { href: `${base}/about`, label: 'Nosotros' },
          { href: `/es/#reservations`, label: 'Reservaciones' },
        ]
      : [
          { href: '/#experience', label: 'Experience' },
          { href: '/menu', label: 'Menu' },
          { href: '/live-music', label: 'Live Music' },
          { href: '/about', label: 'About' },
          { href: '/#reservations', label: 'Reservations' },
        ]

  const reserveHref = lang === 'es' ? '/es/#reservations' : '/#reservations'
  const reserveLabel = lang === 'es' ? 'Reservar' : 'Reserve'
  const reserveTableLabel = lang === 'es' ? 'Reservar Mesa' : 'Reserve a Table'

  return (
    <>
      <nav id="navbar" className={`navbar ${scrolled ? 'solid' : 'transparent'}`}>
        <div className="container">
          <div className="navbar-inner">
            <Link href={lang === 'es' ? '/es' : '/'} className="navbar-logo">
              <Image
                src="https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69b8ed2f269d65a9c8c24a19.png"
                alt="Nanku Logo"
                width={120}
                height={40}
                priority
              />
            </Link>

            <div className="navbar-links">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={activePage === link.label ? 'active' : ''}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="navbar-right">
              <Link href={reserveHref} className="btn-reserve-nav">
                {reserveLabel}
              </Link>
              <Link href={altLang} className="nav-lang-link">
                {altLangLabel}
              </Link>
              <button
                id="hamburger"
                className="hamburger"
                aria-label="Open menu"
                onClick={() => setDrawerOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  viewBox="0 0 24 24"
                >
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      <div
        id="mobileOverlay"
        className={`mobile-overlay ${drawerOpen ? 'open' : ''}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) setDrawerOpen(false)
        }}
      >
        <div className="mobile-drawer">
          <div className="drawer-header">
            <span className="drawer-title">NANKU</span>
            <button
              id="drawerClose"
              className="drawer-close"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="drawer-links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDrawerOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="drawer-footer">
            <Link href={reserveHref} onClick={() => setDrawerOpen(false)}>
              {reserveTableLabel}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
