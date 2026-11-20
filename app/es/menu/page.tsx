import type { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import MenuClient from '@/app/menu/MenuClient'

export const metadata: Metadata = {
  title: 'Menú — Carnes y Mariscos',
  description:
    'Explora el menú completo de Nanku Tropical Bar & Steakhouse — cocina de campo a mesa, carnes premium, mariscos y más en La Fortuna, Costa Rica.',
  alternates: {
    canonical: 'https://www.restaurantenanku.net/es/menu',
    languages: {
      'en': 'https://www.restaurantenanku.net/menu',
      'es': 'https://www.restaurantenanku.net/es/menu',
      'x-default': 'https://www.restaurantenanku.net/menu',
    },
  },
}

export default function MenuPageES() {
  return (
    <>
      <Navbar lang="es" activePage="Menu" />

      {/* MENU HERO */}
      <div className="menu-hero">
        <div className="menu-hero-glow"></div>
        <div className="menu-hero-inner">
          <span className="section-label">Nanku</span>
          <h1 className="menu-hero-title">Nuestro Menú</h1>
          <div className="divider-line" style={{ margin: '0 auto 1.25rem' }}></div>
          <p className="menu-hero-sub">Ingredientes frescos de origen local, todos los precios incluyen impuestos.</p>
        </div>
      </div>

      <Suspense><MenuClient lang="es" /></Suspense>

      <Footer lang="es" />
      <WhatsAppButton />
    </>
  )
}
