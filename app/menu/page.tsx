import type { Metadata } from 'next'
import { Suspense } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import WhatsAppButton from '@/components/WhatsAppButton'
import MenuClient from './MenuClient'

export const metadata: Metadata = {
  title: 'Menu — Steaks, Seafood & Cocktails',
  description:
    'Explore the full menu at Nanku Tropical Bar & Steakhouse — farm-to-table cuisine, premium cocktails, seafood and more in La Fortuna, Costa Rica.',
  alternates: {
    canonical: 'https://www.restaurantenanku.net/menu',
    languages: {
      'en': 'https://www.restaurantenanku.net/menu',
      'es': 'https://www.restaurantenanku.net/es/menu',
      'x-default': 'https://www.restaurantenanku.net/menu',
    },
  },
}

const menuJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Menu',
  name: 'Nanku Tropical Bar & Steakhouse Menu',
  url: 'https://www.restaurantenanku.net/menu',
  inLanguage: 'en',
  hasMenuSection: [
    { '@type': 'MenuSection', name: 'Appetizers', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Tuna Tartare', description: 'Diced fresh tuna with avocado and cucumber in a spicy soy-sesame dressing. With crunchy crostini.', offers: { '@type': 'Offer', price: '10000', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'Octopus Ceviche', description: 'Tender octopus in lime with avocado, soy and sesame. With crispy patacones.', offers: { '@type': 'Offer', price: '10500', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'Sea & River', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Salmon Special', description: 'Salmon and jumbo shrimp in coconut milk with a sweet-and-tangy strawberry sauce, with rice and mixed vegetables.', offers: { '@type': 'Offer', price: '22500', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'Malibu Shrimp Special', description: 'Jumbo shrimp in our creamy Malibu coconut-rum sauce, with pineapple rice and salad.', offers: { '@type': 'Offer', price: '21500', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'Grilled Octopus', description: 'Tender grilled octopus in teriyaki glaze with silky sweet potato purée and salad.', offers: { '@type': 'Offer', price: '19500', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'Teriyaki Tuna', description: 'Sesame-seared premium tuna in teriyaki glaze, with creamy mashed potato and mixed vegetables.', offers: { '@type': 'Offer', price: '14500', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'Pasta', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Salmon Fettuccine', description: 'Fettuccine with salmon, mushrooms and cherry tomato in a creamy white wine and parmesan sauce. With crunchy crostini.', offers: { '@type': 'Offer', price: '10500', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'White Meat', hasMenuItem: [
      { '@type': 'MenuItem', name: 'BBQ Ribs', description: 'Tender pork ribs in our house BBQ sauce with pineapple, refried beans, crispy patacones, pico de gallo and salad.', offers: { '@type': 'Offer', price: '12000', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'Steaks', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Churrasco', description: '350 g grilled churrasco, simple and full of flavor.', offers: { '@type': 'Offer', price: '16000', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'Rib Eye', description: '350 g grilled Rib Eye: juicy, richly marbled and full of flavor.', offers: { '@type': 'Offer', price: '19500', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'New York', description: '350 g grilled New York strip: firm, deeply savory and beefy.', offers: { '@type': 'Offer', price: '19500', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'Vegetarian', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Parmesan Eggplant', description: 'Eggplant in pomodoro sauce with capers and basil, gratinated with mozzarella. With fresh salad and crunchy crostini.', suitableForDiet: 'https://schema.org/VegetarianDiet', offers: { '@type': 'Offer', price: '8500', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'Costa Rica', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Beef Casado', description: 'Classic Costa Rican casado with grilled beef, rice, beans, picadillo, fresh cheese, sweet ripe plantain and salad.', offers: { '@type': 'Offer', price: '10500', priceCurrency: 'CRC' } },
      { '@type': 'MenuItem', name: 'Chicken or Fish Casado', description: 'Classic casado with grilled chicken breast or tilapia, rice, beans, picadillo, fresh cheese, sweet ripe plantain and salad.', offers: { '@type': 'Offer', price: '8000', priceCurrency: 'CRC' } },
    ] },
    { '@type': 'MenuSection', name: 'Desserts', hasMenuItem: [
      { '@type': 'MenuItem', name: 'Brownie with Ice Cream', description: 'Warm brownie with creamy vanilla ice cream that melts on contact.', offers: { '@type': 'Offer', price: '5000', priceCurrency: 'CRC' } },
    ] },
  ],
}

export default function MenuPage({ searchParams }: { searchParams: { tab?: string } }) {
  const isDrinks = searchParams?.tab === 'drinks'
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(menuJsonLd) }}
      />
      <Navbar lang="en" activePage="Menu" />

      {/* MENU HERO */}
      <div className="menu-hero">
        <div className="menu-hero-glow"></div>
        <div className="menu-hero-inner">
          <span className="section-label">Nanku</span>
          <h1 className="menu-hero-title">{isDrinks ? 'Our Drinks Menu' : 'Our Menu'}</h1>
          <div className="divider-line" style={{ margin: '0 auto 1.25rem' }}></div>
          <p className="menu-hero-sub">Farm-to-table freshness, locally sourced ingredients, all prices include taxes.</p>
        </div>
      </div>

      <Suspense><MenuClient /></Suspense>

      <Footer lang="en" />
      <WhatsAppButton />
    </>
  )
}
