import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Gallery from '@/components/Gallery'
import ReservationForm from '@/components/ReservationForm'
import ReviewsScroll from '@/components/ReviewsScroll'
import CookieConsent from '@/components/CookieConsent'
import WhatsAppButton from '@/components/WhatsAppButton'
import { createClient } from '@/lib/supabase/server'
import LiveScheduleGrid from '@/components/LiveScheduleGrid'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Nanku Tropical Bar & Steakhouse | La Fortuna, Costa Rica',
  alternates: {
    canonical: 'https://www.restaurantenanku.net',
    languages: {
      'en': 'https://www.restaurantenanku.net',
      'es': 'https://www.restaurantenanku.net/es',
      'x-default': 'https://www.restaurantenanku.net',
    },
  },
}

type SchedDay = {
  id: string; day_of_week: string; is_active: boolean
  event_label: string; start_time: string; sort_order: number
  event_detail: string | null
  artist?: { name: string; label: string; photo?: string | null; bio?: string | null; bio_es?: string | null } | null
}

export default async function HomePage() {
  let schedule: SchedDay[] = []
  try {
    const sb = createClient()
    const { data } = await sb
      .from('live_music_schedule')
      .select('*, artist:artists(name, label, photo, bio, bio_es)')
      .order('sort_order')
    schedule = data ?? []
  } catch { /* show static fallback below */ }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Nanku Tropical Bar & Steakhouse',
    description: 'Premium steaks, handcrafted tropical cocktails & live music under the stars. Located in La Fortuna, Costa Rica — near Arenal Volcano.',
    url: 'https://www.restaurantenanku.net',
    telephone: '+50624790707',
    email: 'info@restaurantenanku.net',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Street 142',
      addressLocality: 'La Fortuna de San Carlos',
      addressRegion: 'Alajuela',
      addressCountry: 'CR',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 10.471579,
      longitude: -84.643259,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
        opens: '12:00',
        closes: '22:00',
      },
    ],
    servesCuisine: ['Steakhouse', 'Seafood', 'Tropical', 'Costa Rican', 'International'],
    priceRange: '$$',
    acceptsReservations: 'True',
    menu: 'https://www.restaurantenanku.net/menu',
    image: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a36fff11c5d711b35b9bb38.jpg',
    sameAs: [
      'https://www.instagram.com/restaurantenanku/',
      'https://www.tripadvisor.com/Restaurant_Review-g309226-d7273982-Reviews-Restaurante_Nanku-La_Fortuna_de_San_Carlos_Arenal_Volcano_National_Park_Province_.html',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar lang="en" />

      {/* HERO */}
      <section className="hero noise-overlay">
        <div className="hero-bg"></div>
        <div className="hero-overlay-1"></div>
        <div className="hero-overlay-2"></div>
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="hero-brand">Welcome to Nanku</div>
          <h1 className="hero-title">
            La Fortuna <span>Steakhouse</span>
            <br />
            &amp; Tropical Bar
          </h1>
          <p className="hero-tagline">
            Where the jungle comes alive at night — premium steaks, handcrafted tropical cocktails &amp; live music under the stars
          </p>
          <div className="hero-location">La Fortuna, Costa Rica — Near Arenal Volcano</div>
          <div className="hero-btns">
            <a href="#reservations" className="btn-orange">Reserve Your Table</a>
            <a href="#dishes" className="btn-outline-white">View Menu</a>
            <a
              href="https://wa.me/50624790707?text=Hi!%20I'd%20like%20to%20make%20a%20reservation%20at%20Nanku%20Tropical%20Bar%20%26%20Steakhouse."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
        <a href="#experience" className="hero-scroll bounce-arrow" aria-label="Scroll down">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </a>
      </section>

      {/* EXPERIENCE */}
      <section id="experience" className="experience-section">
        <div className="experience-bg"></div>
        <div className="experience-line"></div>
        <div className="container">
          <div className="experience-header fade-up">
            <span className="section-label">Discover What Awaits</span>
            <h2 className="section-title" style={{ fontSize: 'clamp(2.5rem,7vw,4.5rem)' }}>
              The Nanku<br />
              <span className="experience-title-gradient">Experience</span>
            </h2>
            <p className="font-lato" style={{ color: '#B0B0B0', fontWeight: 300, fontSize: '1.125rem', maxWidth: '640px', margin: '0 auto', lineHeight: 1.7 }}>
              More than a meal — an evening woven from fire, rhythm, and the untamed beauty of Costa Rica&apos;s volcanic heartland.
            </p>
            <div className="experience-divider">
              <div className="line"></div>
              <div className="dot"></div>
              <div className="line"></div>
            </div>
          </div>

          <div className="exp-cards">
            {/* 01 Live Music */}
            <div className="exp-card fade-up">
              <div className="exp-card-inner">
                <div className="exp-img-side">
                  <div className="exp-img-frame"></div>
                  <div className="exp-img-wrap">
                    <Image src="https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a370022f2131051b815bfbc.jpg" alt="Live band performing on stage at Nanku in La Fortuna" width={800} height={600} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                    <div className="exp-img-gradient" style={{ background: 'linear-gradient(to right,rgba(17,17,17,0.7) 0%,transparent 50%),linear-gradient(to top,rgba(17,17,17,0.5) 0%,transparent 40%)' }}></div>
                  </div>
                </div>
                <div className="exp-text-side">
                  <div className="exp-icon-wrap">
                    <div className="exp-icon" style={{ background: 'linear-gradient(135deg,rgba(232,117,26,0.15),rgba(232,117,26,0.08))', border: '1px solid rgba(232,117,26,0.3)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#E8751A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>
                    </div>
                  </div>
                  <span className="exp-subtitle" style={{ color: '#F5A623' }}>Feel the Rhythm</span>
                  <h3 className="exp-title">Live Music</h3>
                  <div className="exp-bar" style={{ background: 'linear-gradient(to right,#E8751A,transparent)' }}></div>
                  <p className="exp-desc">Every Monday &amp; Saturday, the jungle comes alive with talented local artists performing tropical and Latin beats under the stars.</p>
                  <Link href="/live-music" className="exp-cta">
                    <span style={{ color: '#E8751A' }}>Discover more</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#E8751A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* 02 Signature Cocktails */}
            <div className="exp-card fade-up">
              <div className="exp-card-inner reverse">
                <div className="exp-img-side">
                  <div className="exp-img-frame"></div>
                  <div className="exp-img-wrap" style={{ aspectRatio: '3/4' }}>
                    <Image src="https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a3700511c5d711b35b9c0ce.jpg" alt="Handcrafted tropical cocktail at Nanku, La Fortuna" width={800} height={600} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
                    <div className="exp-img-gradient" style={{ background: 'linear-gradient(to left,rgba(17,17,17,0.7) 0%,transparent 50%),linear-gradient(to top,rgba(17,17,17,0.5) 0%,transparent 40%)' }}></div>
                  </div>
                </div>
                <div className="exp-text-side">
                  <div className="exp-icon-wrap">
                    <div className="exp-icon" style={{ background: 'linear-gradient(135deg,rgba(245,166,35,0.15),rgba(245,166,35,0.08))', border: '1px solid rgba(245,166,35,0.3)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#F5A623" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M8 22h8" /><path d="M7 10h10" /><path d="M12 22V10" /><path d="M12 10C12 4 8 2 8 2h8S12 4 12 10z" /></svg>
                    </div>
                  </div>
                  <span className="exp-subtitle" style={{ color: '#E8751A' }}>Crafted with Passion</span>
                  <h3 className="exp-title">Signature Cocktails</h3>
                  <div className="exp-bar" style={{ background: 'linear-gradient(to right,#F5A623,transparent)' }}></div>
                  <p className="exp-desc">Handcrafted tropical cocktails blending local spirits with fresh exotic fruits, aromatic herbs, and a touch of Costa Rican magic.</p>
                  <Link href="/menu?tab=drinks" className="exp-cta">
                    <span style={{ color: '#F5A623' }}>Discover more</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#F5A623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* 03 Premium Steaks */}
            <div className="exp-card fade-up">
              <div className="exp-card-inner">
                <div className="exp-img-side">
                  <div className="exp-img-frame"></div>
                  <div className="exp-img-wrap">
                    <Image src="https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a36fff11c5d711b35b9bb38.jpg" alt="Premium steak grilled over open flame at Nanku steakhouse" width={800} height={600} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 35%' }} />
                    <div className="exp-img-gradient" style={{ background: 'linear-gradient(to right,rgba(17,17,17,0.7) 0%,transparent 50%),linear-gradient(to top,rgba(17,17,17,0.5) 0%,transparent 40%)' }}></div>
                  </div>
                </div>
                <div className="exp-text-side">
                  <div className="exp-icon-wrap">
                    <div className="exp-icon" style={{ background: 'linear-gradient(135deg,rgba(232,117,26,0.15),rgba(232,117,26,0.08))', border: '1px solid rgba(232,117,26,0.3)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#E8751A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9.5 6.5c-2 1.5-3.5 4-3.5 7 0 2.5 1 4.5 2.5 6" /><path d="M14.5 6.5c2 1.5 3.5 4 3.5 7 0 2.5-1 4.5-2.5 6" /><line x1="12" y1="2" x2="12" y2="22" /></svg>
                    </div>
                  </div>
                  <span className="exp-subtitle" style={{ color: '#D4A853' }}>Fire &amp; Flavor</span>
                  <h3 className="exp-title">Premium Steaks</h3>
                  <div className="exp-bar" style={{ background: 'linear-gradient(to right,#E8751A,transparent)' }}></div>
                  <p className="exp-desc">Choice cuts cooked to perfection over open flame, sourced from the finest local farms and seasoned with our signature blends.</p>
                  <Link href="/menu" className="exp-cta">
                    <span style={{ color: '#E8751A' }}>Discover more</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#E8751A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* 04 Tropical Atmosphere */}
            <div className="exp-card fade-up">
              <div className="exp-card-inner reverse">
                <div className="exp-img-side">
                  <div className="exp-img-frame"></div>
                  <div className="exp-img-wrap">
                    <Image src="https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a31b0666dd61c546ae0760a.jpg" alt="Tropical jungle dining atmosphere at Nanku, near Arenal Volcano" width={800} height={600} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="exp-img-gradient" style={{ background: 'linear-gradient(to left,rgba(17,17,17,0.7) 0%,transparent 50%),linear-gradient(to top,rgba(17,17,17,0.5) 0%,transparent 40%)' }}></div>
                  </div>
                </div>
                <div className="exp-text-side">
                  <div className="exp-icon-wrap">
                    <div className="exp-icon" style={{ background: 'linear-gradient(135deg,rgba(45,90,39,0.15),rgba(45,90,39,0.08))', border: '1px solid rgba(45,90,39,0.3)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" fill="none" stroke="#2D5A27" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 8a5 5 0 0 0-10 0c0 3 2 5.5 5 7 3-1.5 5-4 5-7z" /><line x1="12" y1="22" x2="12" y2="15" /></svg>
                    </div>
                  </div>
                  <span className="exp-subtitle" style={{ color: '#F5A623' }}>Dine in Paradise</span>
                  <h3 className="exp-title">Tropical Atmosphere</h3>
                  <div className="exp-bar" style={{ background: 'linear-gradient(to right,#2D5A27,transparent)' }}></div>
                  <p className="exp-desc">Immerse yourself in lush jungle flora, open skies, and the gentle warmth of volcano country — just minutes from Arenal.</p>
                  <Link href="/about" className="exp-cta">
                    <span style={{ color: '#2D5A27' }}>Discover more</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="#2D5A27" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="exp-bottom fade-up">
            <div className="line" style={{ background: 'linear-gradient(to right,transparent,rgba(255,255,255,0.1))' }}></div>
            <div className="dot"></div>
            <span>Est. La Fortuna, Costa Rica</span>
            <div className="dot"></div>
            <div className="line" style={{ background: 'linear-gradient(to left,transparent,rgba(255,255,255,0.1))' }}></div>
          </div>
        </div>
      </section>

      {/* DISHES */}
      <section id="dishes" className="dishes-section">
        <div className="dishes-bg"></div>
        <div className="container">
          <div className="dishes-header fade-up">
            <span className="section-label">Culinary Highlights</span>
            <h2 className="section-title">Signature Dishes</h2>
            <div className="section-divider"></div>
          </div>
          <div className="dishes-grid">
            {[
              { img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69c5fbd8146bc51f9eec8ca7.jpg', name: 'Rib Eye', price: '₡19,500', desc: '350 g grilled Rib Eye: juicy, richly marbled and full of flavor.', badge: { text: "Chef's Choice", color: 'orange' }, href: '/menu#steaks' },
              { img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69b9175087f0f2768356c731.jpg', name: 'Grilled Octopus', price: '₡19,500', desc: 'Tender grilled octopus in teriyaki glaze with silky sweet potato purée and salad.', href: '/menu#seafood' },
              { img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a37034c1c5d711b35ba7063.jpg', name: 'Tuna Tartare', price: '₡10,000', desc: 'Diced fresh tuna with avocado and cucumber in a spicy soy-sesame dressing. With crunchy crostini.', badge: { text: 'Fan Favorite', color: 'orange' }, href: '/menu#appetizers' },
              { img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69b91750269d6516ffc77360.jpg', name: 'BBQ Ribs', price: '₡12,000', desc: 'Tender pork ribs in our house BBQ sauce with pineapple, refried beans, crispy patacones, pico de gallo and salad.', href: '/menu#white-meat' },
              { img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/6a37000cf2131051b815bea8.jpg', name: 'Parmesan Eggplant', price: '₡8,500', desc: 'Eggplant in pomodoro sauce with capers and basil, gratinated with mozzarella. With fresh salad and crunchy crostini.', badge: { text: 'Vegetarian', color: 'green' }, href: '/menu#vegetarian' },
              { img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69c5f94c7794bf69985031bf.jpg', name: 'Brownie with Ice Cream', price: '₡5,000', desc: 'Warm brownie with creamy vanilla ice cream that melts on contact.', badge: { text: 'Premium', color: 'orange' }, href: '/menu#desserts' },
            ].map((dish) => (
              <Link key={dish.name} href={dish.href} className="dish-card fade-up">
                <div className="dish-img-wrap">
                  <Image src={dish.img} alt={`${dish.name} at Nanku Tropical Bar & Steakhouse, La Fortuna`} width={400} height={300} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div className="dish-img-gradient"></div>
                  {dish.badge && (
                    <span className={`dish-badge ${dish.badge.color}`}>{dish.badge.text}</span>
                  )}
                </div>
                <div className="dish-body">
                  <div className="dish-row">
                    <h3 className="dish-name">{dish.name}</h3>
                    <span className="dish-price">{dish.price}</span>
                  </div>
                  <p className="dish-desc">{dish.desc}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="dishes-cta fade-up">
            <Link href="/menu" className="btn-outline-orange">View Full Menu →</Link>
          </div>
        </div>
      </section>

      {/* COCKTAILS */}
      <section id="cocktails" className="cocktails-section">
        <div className="cocktails-bg"></div>
        <div className="container">
          <div className="cocktails-header fade-up">
            <span className="section-label">Behind the Bar</span>
            <h2 className="section-title">Signature Cocktails</h2>
            <div className="section-divider"></div>
            <p className="cocktails-desc">Every glass tells a story of the jungle. Handcrafted with fresh local ingredients and premium spirits.</p>
          </div>
          <div className="cocktails-grid">
            {[
              {
                img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69c734203204cc754642fc04.jpg',
                title: 'Craft Margaritas',
                desc: 'Elevated twists on the classic, using premium mezcal and tequila with locally sourced tropical fruits and house-made syrups.',
                drinks: ['Margarita Clásica', 'Wild Passion Margarita', 'Margarita de Mango'],
                highlight: false,
              },
              {
                img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69c7341f899abb6360f61a32.jpg',
                title: 'Tiki Paradise',
                desc: 'Transport yourself to the tropics with rum-forward concoctions layered with coconut, passion fruit, and fresh pineapple.',
                drinks: ['Pura Vida', 'Julia', 'A Cachete'],
                highlight: true,
              },
              {
                img: 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/69c734202e89d8e97f5f1526.jpg',
                title: 'The Classics',
                desc: 'Timeless cocktails crafted with precision — the perfect companions for a relaxed evening under the jungle sky.',
                drinks: ['Mojito', 'Piña Colada', 'Old Fashioned', 'Negroni'],
                highlight: false,
              },
            ].map((c) => {
              const card = (
                <div key={c.title} className="cocktail-card fade-up">
                  <div className="cocktail-img-wrap">
                    <Image src={c.img} alt={`${c.title} at Nanku, La Fortuna`} width={800} height={600} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div className="cocktail-img-gradient"></div>
                    <div className="cocktail-img-title"><h3>{c.title}</h3></div>
                  </div>
                  <div className="cocktail-body">
                    <p>{c.desc}</p>
                    <ul className="cocktail-drinks">
                      {c.drinks.map((d) => (
                        <li key={d} className="cocktail-drink">
                          <span className="cocktail-drink-dot"></span>{d}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
              return c.highlight
                ? <div key={c.title} className="cocktail-highlight-wrap fade-up">{card}</div>
                : card
            })}
          </div>
          <div className="cocktails-cta fade-up">
            <Link href="/menu?tab=drinks" className="btn-outline-orange">See Drinks Menu →</Link>
          </div>
        </div>
      </section>

      {/* LIVE MUSIC */}
      <section id="music" className="lm-schedule">
        <div className="lm-schedule-glow"></div>
        <div className="lm-schedule-container">
          <div className="lm-schedule-header fade-up">
            <div className="lm-schedule-label">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8751A" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="section-label" style={{ margin: 0 }}>Live Music</span>
            </div>
            <h2 className="lm-schedule-title">When to Catch Live Music</h2>
            <div className="divider-line" style={{ margin: '0 auto 1.25rem' }}></div>
          </div>
          <LiveScheduleGrid schedule={schedule} lang="en" />
          <p className="lm-schedule-note fade-up">Schedule may vary. Follow us on Instagram for weekly updates.</p>
          <div className="music-cta fade-up" style={{ marginTop: '2.5rem' }}>
            <a href="#reservations" className="btn-orange" style={{ display: 'inline-block' }}>Reserve for Music Night</a>
            <Link href="/live-music" className="btn-outline-orange" style={{ display: 'inline-flex' }}>Full Live Music Page →</Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section id="gallery" className="gallery-section">
        <div className="container">
          <div className="gallery-header fade-up">
            <span className="section-label">Inside Nanku</span>
            <h2 className="section-title">Gallery</h2>
            <div className="section-divider"></div>
          </div>
          <Gallery />
        </div>
      </section>

      {/* REVIEWS */}
      <section id="reviews" className="reviews-section">
        <div className="reviews-bg"></div>
        <ReviewsScroll />
      </section>

      {/* RESERVATIONS */}
      <section id="reservations" className="reservations-section noise-overlay">
        <div className="reservations-texture"></div>
        <div className="container-sm" style={{ position: 'relative', zIndex: 10 }}>
          <div className="reservations-header fade-up">
            <h2>Reserve Your Table</h2>
            <p>Book your experience at Nanku. We&apos;ll confirm your reservation within 2 hours.</p>
          </div>
          <div className="reservations-form-card fade-up">
            <ReservationForm />
          </div>
        </div>
      </section>

      {/* MAP */}
      <section id="location" className="map-section">
        <div className="container">
          <div className="map-header fade-up">
            <span className="section-label">Find Us</span>
            <h2 className="section-title">Location &amp; Directions</h2>
            <div className="section-divider"></div>
          </div>
          <div className="map-grid">
            <div className="map-wrap fade-up">
              <iframe
                title="Nanku Location - La Fortuna, Costa Rica"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d245.2105386900293!2d-84.64325924605953!3d10.471579485684078!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8fa00c88c43ff4a3%3A0xb63077c441cc27ec!2sRestaurante%20Nanku!5e0!3m2!1ses-419!2scr!4v1773737597015!5m2!1ses-419!2scr"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
            <div className="fade-up">
              <div className="map-info-card">
                <div className="map-info-addr">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="#E8751A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0, marginTop: '2px' }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                  <div>
                    <div className="map-info-addr-label">Address</div>
                    <div className="map-info-addr-val">La Fortuna Town,<br />Street 142, San Carlos<br />Costa Rica</div>
                  </div>
                </div>
                <div className="map-hours">
                  <div className="map-hours-title">Hours</div>
                  <div className="map-hours-row"><span className="map-hours-day">Monday – Sunday</span><span className="map-hours-time">12:00 PM – 10:00 PM</span></div>
                </div>
                <a href="https://maps.google.com/?q=Restaurante+Nanku+La+Fortuna+Costa+Rica" target="_blank" rel="noopener noreferrer" className="map-directions">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11" /></svg>
                  Get Directions
                </a>
              </div>
              <div className="map-volcano">
                <div className="map-volcano-title">Near Arenal Volcano</div>
                <div className="map-volcano-desc">We&apos;re in the heart of La Fortuna — about 10 minutes from La Fortuna Waterfall and 30 minutes from Arenal Volcano National Park.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer lang="en" />
      <WhatsAppButton />
      <CookieConsent />
    </>
  )
}
