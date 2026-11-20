'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

type FoodCat = 'appetizers' | 'seafood' | 'pasta' | 'white-meat' | 'steaks' | 'vegetarian' | 'costa-rica' | 'desserts'

const CDN = 'https://assets.cdn.filesafe.space/ftiLAicHGn0i3cqS3Rye/media/'

interface FoodItem {
  name: string
  price: string
  desc?: string
  badge?: { text: string; type: string }
  photo?: string
  photoPosition?: string
  variants?: { label: string; price: string }[]
}

interface ModalState {
  name: string
  price: string
  desc?: string
  photo: string
  photoPosition?: string
  suggestions: FoodItem[]
  allSectionItems: FoodItem[]
  variants?: { label: string; price: string }[]
}

// ─── EN DATA ────────────────────────────────────────────────────────────────

const enFood = {
  appetizers: [
    { name: 'Octopus Ceviche', price: '₡10,500', desc: 'Tender octopus in lime with avocado, soy and sesame. With crispy patacones.', photo: CDN + '6a34a6b66a6dd1b69a1915cb.jpg' },
    { name: 'Tuna Tartare', price: '₡10,000', desc: 'Diced fresh tuna with avocado and cucumber in a spicy soy-sesame dressing. With crunchy crostini.', photo: CDN + '6a37034c1c5d711b35ba7063.jpg' },
    { name: 'Fish Ceviche', price: '₡7,000', desc: 'Zesty fish ceviche in lime with sweet pepper and cilantro. With crispy yuca, sweet potato and plantain chips.', photo: CDN + '69c5f674146bc59c7debd350.jpg' },
    { name: 'Green Salad', price: '₡5,500', desc: 'Crisp greens with avocado, hearts of palm, sweet corn and strawberry, with house Italian dressing.' },
    { name: 'Stuffed Avocado', price: '₡8,500', desc: 'Fresh avocado filled with juicy shrimp, on a bed of crisp fresh vegetables.', photo: CDN + '6a14883f7c135509c8864378.jpg' },
    { name: 'Passion Fruit Ceviche', price: '₡8,500', desc: 'Fresh tuna in lime and passion fruit, with avocado, teriyaki and sesame. With crispy yuca, sweet potato and plantain chips.', photo: CDN + '69c194d5eb06d8b53fe532fc.jpg', photoPosition: '70% center' },
    { name: 'Caribbean Seafood Soup', price: '₡8,000', desc: 'Creamy seafood soup in coconut broth with a gentle kick of panameño chili. With rice.', photo: CDN + '69c5f6dc7794bf5d9b4fe34b.jpg' },
  ] as FoodItem[],
  seafood: [
    { name: 'Salmon Special', price: '₡22,500', desc: 'Salmon and jumbo shrimp in coconut milk with a sweet-and-tangy strawberry sauce, with rice and mixed vegetables.', photo: '/dishes/salmon-special.jpg' },
    { name: 'Malibu Shrimp Special', price: '₡21,500', desc: 'Jumbo shrimp in our creamy Malibu coconut-rum sauce, with pineapple rice and salad.', photo: '/dishes/malibu-shrimp-special.jpg' },
    { name: 'Grilled Octopus', price: '₡19,500', desc: 'Tender grilled octopus in teriyaki glaze with silky sweet potato purée and salad.', photo: CDN + '69b9175087f0f2768356c731.jpg' },
    { name: 'Catch of the Day with Passion Fruit Sauce', price: '₡15,000', desc: 'With sweet-and-tangy passion fruit sauce, silky sweet potato purée and mixed vegetables.' },
    { name: 'Teriyaki Tuna', price: '₡14,500', desc: 'Sesame-seared premium tuna in teriyaki glaze, with creamy mashed potato and mixed vegetables.', photo: CDN + '69d85b05d7871cddf7ea19e0.webp' },
    { name: 'Trout', price: '₡12,500', desc: 'Roasted trout fillet with shrimp in a light creamy garlic sauce, over rice.', photo: CDN + '6a34a54bde4900e889a955ab.jpg' },
  ] as FoodItem[],
  seafoodNote: 'Responsibly sourced fish and seafood, from sea and river to your table. Catch of the Day subject to availability.',
  pasta: [
    { name: 'Salmon Fettuccine', price: '₡10,500', desc: 'Fettuccine with salmon, mushrooms and cherry tomato in a creamy white wine and parmesan sauce. With crunchy crostini.' },
    { name: 'Spaghetti Pura Vida', price: '₡9,500', desc: 'Spaghetti with shrimp in pomodoro sauce, topped with avocado and fresh basil. With crunchy crostini.', photo: CDN + '69c194d5c1e996220ba4333f.jpg' },
    { name: 'Rigatoni Aurora', price: '₡9,500', desc: 'Rigatoni with shrimp, mushrooms and cherry tomato in a creamy aurora sauce. With crunchy crostini.', photo: CDN + '69c194d5b0fe813a7003ff83.jpg' },
    { name: 'Fettuccine Aglio e Olio', price: '₡9,500', desc: 'Fettuccine in garlic and olive oil with grilled chicken, mushrooms, cherry tomato and fresh basil. With crunchy crostini.', photo: CDN + '69d7378a3dd00cb232c432a1.jpg' },
  ] as FoodItem[],
  whiteMeat: [
    { name: 'BBQ Ribs', price: '₡12,000', desc: 'Tender pork ribs in our house BBQ sauce with pineapple, refried beans, crispy patacones, pico de gallo and salad.', photo: CDN + '69b91750269d6516ffc77360.jpg' },
    { name: 'Cahuita Chicken', price: '₡9,500', desc: 'Grilled chicken breast in a creamy Cahuita coconut sauce, with mashed potato and mixed vegetables.', photo: CDN + '6a148ca3e05851175c7f83db.jpg' },
    { name: 'Nanku Chicken', price: '₡9,500', desc: 'Grilled chicken breast in a sweet-and-tangy tamarind glaze, with silky sweet potato purée and mixed vegetables.' },
  ] as FoodItem[],
  steaks: [
    { name: 'Churrasco', price: '₡16,000', desc: '350 g grilled churrasco, simple and full of flavor.', photo: CDN + '6a34a5e26a6dd1b69a190855.jpg' },
    { name: 'Rib Eye', price: '₡19,500', desc: '350 g grilled Rib Eye: juicy, richly marbled and full of flavor.', photo: CDN + '69c5fbd8146bc51f9eec8ca7.jpg' },
    { name: 'New York', price: '₡19,500', desc: '350 g grilled New York strip: firm, deeply savory and beefy.', photo: CDN + '69c194d5fa8b2122095a9294.jpg' },
  ] as FoodItem[],
  steakNote: 'All cuts are served with rosemary potatoes, fried sweet ripe plantain, jalapeño and house chimichurri.',
  vegetarian: [
    { name: 'Parmesan Eggplant', price: '₡8,500', desc: 'Eggplant in pomodoro sauce with capers and basil, gratinated with mozzarella. With fresh salad and crunchy crostini.', photo: CDN + '6a37000cf2131051b815bea8.jpg' },
    { name: 'Vegetable Mountain', price: '₡7,500', desc: 'Tower of zucchini, eggplant and tomato over mushroom pomodoro, with blue cheese cream and watercress. With crunchy crostini.' },
    { name: 'Vegetarian Hamburger', price: '₡7,000', desc: 'House-made patty of sautéed mushrooms and vegetables on brioche, with tomato, lettuce and chimichurri. With potato wedges.' },
    { name: 'Mushroom Bruschetta', price: '₡7,000', desc: 'Mushrooms and tomato in pomodoro sauce with fresh basil and melted mozzarella over crunchy crostini.' },
  ] as FoodItem[],
  costaRica: [
    { name: 'Beef Casado', price: '₡10,500', desc: 'Classic Costa Rican casado with grilled beef, rice, beans, picadillo, fresh cheese, sweet ripe plantain and salad.' },
    { name: 'Chicharrones', price: '₡10,000', desc: 'Pork chicharrones (250 g) with yuca, patacones, creamy refried beans, pico de gallo and salad.', photo: CDN + '69c194d5c1e996eb22a43340.jpg' },
    { name: 'Chicken or Fish Casado', price: '₡8,000', desc: 'Classic casado with grilled chicken breast or tilapia, rice, beans, picadillo, fresh cheese, sweet ripe plantain and salad.' },
    { name: 'Nanku Sandwich', price: '₡8,000', desc: 'Beef sandwich with bacon, melted mozzarella and fresh vegetables on toasted bread. With fries.' },
    { name: 'Chicken or Beef Nachos', price: '₡7,000', desc: 'Crispy tortilla chips with refried beans, melted mozzarella and natilla (Costa Rican sour cream), topped with chicken or beef, avocado and pico de gallo.', photo: CDN + '69b91750269d65241dc77361.jpg' },
    { name: 'Rice and Beans', price: '₡9,500', desc: 'Tender Caribbean chicken in a creamy coconut-thyme sauce, over rice and beans, with sweet ripe plantain and salad.', photo: CDN + '69c5f94c5ebd497c7c77bc60.jpg' },
    { name: 'Arenal Hamburger', price: '₡8,500', desc: 'Juicy 180 g beef burger on brioche with melted cheese, bacon, caramelized onion, fresh vegetables and bacon dressing. With fries and house sauce.', photo: CDN + '69c5f94d9619ac299c9a439d.png' },
    { name: 'Rice with Chicken', price: '₡7,500', desc: 'Sautéed rice with shredded chicken, vegetables and a touch of Lizano sauce. With fresh salad and fries.', photo: CDN + '69c5f94c7794bf5a7b5031c0.jpg' },
    { name: 'Mixed Nachos', price: '₡7,500', desc: 'Crispy tortilla chips with refried beans, melted mozzarella and natilla (Costa Rican sour cream), topped with chicken, beef, avocado and pico de gallo.' },
  ] as FoodItem[],
  desserts: [
    { name: 'Brownie with Ice Cream', price: '₡5,000', desc: 'Warm brownie with creamy vanilla ice cream that melts on contact.', photo: CDN + '69c5f94c7794bf69985031bf.jpg' },
    { name: 'Coconut Flan', price: '₡5,000', desc: 'Silky, creamy coconut flan with shredded coconut.', photo: CDN + '69d85ba09c84d38e9e925485.jpg' },
    { name: 'Cheesecake', price: '₡5,000', desc: 'A slice of smooth, creamy cheesecake.', photo: CDN + '69d85cf8019dc508d3de6c98.png' },
    { name: 'Flambéed Banana', price: '₡5,000', desc: 'Banana flambéed with brandy in an orange-cinnamon caramel, with creamy vanilla ice cream and strawberry.' },
  ] as FoodItem[],
  notes: [
    'Our restaurant prepares locally sourced produce, seafood, and meat cuts from nearby farmland, delivering you delicious and healthy farm-to-table meals.',
    'Taxes included.',
    'If you have a food allergy or special dietary requirements, please inform a member of staff or ask for more information.',
  ],
  topNotes: ['Farm-to-table', 'Locally sourced', 'Prices include taxes', 'Notify us of any allergies'],
  cats: [
    { id: 'appetizers' as FoodCat, label: 'Appetizers' },
    { id: 'seafood' as FoodCat, label: 'Sea & River' },
    { id: 'pasta' as FoodCat, label: 'Pasta' },
    { id: 'white-meat' as FoodCat, label: 'White Meat' },
    { id: 'steaks' as FoodCat, label: 'Steaks' },
    { id: 'vegetarian' as FoodCat, label: 'Vegetarian' },
    { id: 'costa-rica' as FoodCat, label: 'Costa Rica' },
    { id: 'desserts' as FoodCat, label: 'Desserts' },
  ],
}

// ─── ES DATA ────────────────────────────────────────────────────────────────

const esFood = {
  appetizers: [
    { name: 'Ceviche de Pulpo', price: '₡10,500', desc: 'Pulpo tierno en limón, con aguacate y un toque de soya y sésamo. Con patacones crocantes.', photo: CDN + '6a34a6b66a6dd1b69a1915cb.jpg' },
    { name: 'Tartar de Atún', price: '₡10,000', desc: 'Atún fresco en cubos con aguacate y pepino, en un aderezo picante de soya y sésamo. Con crostini crocantes.', photo: CDN + '6a37034c1c5d711b35ba7063.jpg' },
    { name: 'Ceviche de Pescado', price: '₡7,000', desc: 'Ceviche fresco y cítrico de pescado marinado en limón, con chile dulce y culantro. Con chips crocantes de yuca, camote y plátano.', photo: CDN + '69c5f674146bc59c7debd350.jpg' },
    { name: 'Ensalada Verde', price: '₡5,500', desc: 'Lechugas frescas y crujientes con aguacate, palmito, maíz dulce y fresa, con aderezo italiano de la casa.' },
    { name: 'Aguacate Relleno', price: '₡8,500', desc: 'Aguacate fresco relleno de camarones jugosos, sobre una cama crujiente de vegetales frescos.', photo: CDN + '6a14883f7c135509c8864378.jpg' },
    { name: 'Ceviche Maracuyá', price: '₡8,500', desc: 'Atún fresco marinado en limón y maracuyá, con aguacate y un toque de teriyaki y sésamo. Con chips crocantes de yuca, camote y plátano.', photo: CDN + '69c194d5eb06d8b53fe532fc.jpg', photoPosition: '70% center' },
    { name: 'Sopa Caribeña', price: '₡8,000', desc: 'Sopa cremosa de mariscos en caldo de coco, con un toque picante de chile panameño. Con arroz.', photo: CDN + '69c5f6dc7794bf5d9b4fe34b.jpg' },
  ] as FoodItem[],
  seafood: [
    { name: 'Especial de Salmón', price: '₡22,500', desc: 'Salmón y camarones jumbo en leche de coco con una salsa agridulce de fresa, con arroz y vegetales mixtos.', photo: '/dishes/salmon-special.jpg' },
    { name: 'Especial Camarones Malibu', price: '₡21,500', desc: 'Camarones jumbo en nuestra cremosa salsa Malibu de coco y ron, con arroz con piña y ensalada.', photo: '/dishes/malibu-shrimp-special.jpg' },
    { name: 'Pulpo a la Parrilla', price: '₡19,500', desc: 'Pulpo tierno a la parrilla con glaseado de teriyaki, puré de camote sedoso y ensalada.', photo: CDN + '69b9175087f0f2768356c731.jpg' },
    { name: 'Pesca del Día con Salsa de Maracuyá', price: '₡15,000', desc: 'Servido con salsa agridulce de maracuyá, puré de camote sedoso y vegetales mixtos.' },
    { name: 'Atún Teriyaki', price: '₡14,500', desc: 'Atún premium sellado con ajonjolí y glaseado de teriyaki, con puré de papa cremoso y vegetales mixtos.', photo: CDN + '69d85b05d7871cddf7ea19e0.webp' },
    { name: 'Trucha', price: '₡12,500', desc: 'Filete de trucha asado con camarones, en una ligera salsa cremosa de ajo, sobre arroz.', photo: CDN + '6a34a54bde4900e889a955ab.jpg' },
  ] as FoodItem[],
  seafoodNote: 'Productos de pesca y acuicultura responsables, del mar y el río a la mesa. Pesca del Día según disponibilidad.',
  pasta: [
    { name: 'Fettuccine con Salmón', price: '₡10,500', desc: 'Fettuccine con salmón, hongos y tomate cherry en una cremosa salsa de vino blanco y parmesano. Con crostini crocantes.' },
    { name: 'Spaghetti Pura Vida', price: '₡9,500', desc: 'Spaghetti con camarones en salsa pomodoro, coronado con aguacate y albahaca fresca. Con crostini crocantes.', photo: CDN + '69c194d5c1e996220ba4333f.jpg' },
    { name: 'Rigatoni Aurora', price: '₡9,500', desc: 'Rigatoni con camarones en una cremosa salsa aurora, con hongos y tomate cherry. Con crostini crocantes.', photo: CDN + '69c194d5b0fe813a7003ff83.jpg' },
    { name: 'Fettuccine Aglio e Olio', price: '₡9,500', desc: 'Fettuccine al ajo y aceite de oliva con pollo a la parrilla, hongos, tomate cherry y albahaca fresca. Con crostini crocantes.', photo: CDN + '69d7378a3dd00cb232c432a1.jpg' },
  ] as FoodItem[],
  whiteMeat: [
    { name: 'Costilla BBQ', price: '₡12,000', desc: 'Costilla de cerdo tierna, glaseada en nuestra salsa BBQ con piña, con frijoles molidos, patacones crocantes, pico de gallo y ensalada.', photo: CDN + '69b91750269d6516ffc77360.jpg' },
    { name: 'Pollo Cahuita', price: '₡9,500', desc: 'Pechuga de pollo a la parrilla en cremosa salsa Cahuita de coco, con puré de papa suave y vegetales mixtos.', photo: CDN + '6a148ca3e05851175c7f83db.jpg' },
    { name: 'Pollo Nanku', price: '₡9,500', desc: 'Pechuga de pollo a la parrilla, bañada en una salsa agridulce de tamarindo, con puré de camote sedoso y vegetales mixtos.' },
  ] as FoodItem[],
  steaks: [
    { name: 'Churrasco', price: '₡16,000', desc: 'Churrasco de 350 g a la parrilla, sencillo y lleno de sabor.', photo: CDN + '6a34a5e26a6dd1b69a190855.jpg' },
    { name: 'Rib Eye', price: '₡19,500', desc: 'Rib Eye de 350 g a la parrilla: jugoso, bien marmoleado y de sabor intenso.', photo: CDN + '69c5fbd8146bc51f9eec8ca7.jpg' },
    { name: 'New York', price: '₡19,500', desc: 'New York de 350 g a la parrilla: firme, de sabor profundo y bien carnoso.', photo: CDN + '69c194d5fa8b2122095a9294.jpg' },
  ] as FoodItem[],
  steakNote: 'Todos los cortes se sirven con papas al romero, plátano maduro frito y dulce, chile jalapeño y chimichurri de la casa.',
  vegetarian: [
    { name: 'Berenjena Parmesana', price: '₡8,500', desc: 'Berenjena en salsa pomodoro con alcaparras y albahaca, gratinada con mozzarella derretida. Con ensalada fresca y crostini crocantes.', photo: CDN + '6a37000cf2131051b815bea8.jpg' },
    { name: 'Montaña de Vegetales', price: '₡7,500', desc: 'Colorida torre de zuquini, berenjena y tomate sobre salsa pomodoro de hongos, con crema de queso azul y berro chino. Con crostini crocantes.' },
    { name: 'Hamburguesa Vegetariana', price: '₡7,000', desc: 'Hamburguesa vegetariana casera de hongos salteados y vegetales, en pan brioche, con tomate, lechuga y chimichurri. Con papas en gajos.' },
    { name: 'Bruschetta de Hongos', price: '₡7,000', desc: 'Hongos y tomate en salsa pomodoro con albahaca fresca y mozzarella derretida sobre crostini crocantes.' },
  ] as FoodItem[],
  costaRica: [
    { name: 'Casado de Carne', price: '₡10,500', desc: 'El casado tico con carne de res a la parrilla, arroz, frijoles, picadillo, queso fresco, plátano maduro y ensalada. Puro sabor de Costa Rica.' },
    { name: 'Chicharrones', price: '₡10,000', desc: 'Chicharrones de cerdo (250 g) con yuca, patacones, frijoles molidos cremosos, pico de gallo y ensalada.', photo: CDN + '69c194d5c1e996eb22a43340.jpg' },
    { name: 'Casado de Pollo o Pescado', price: '₡8,000', desc: 'El casado tico con pechuga de pollo a la parrilla o tilapia, a tu elección, arroz, frijoles, picadillo, queso fresco, plátano maduro y ensalada.' },
    { name: 'Sándwich Nanku', price: '₡8,000', desc: 'Sándwich de carne con tocineta, mozzarella derretida y vegetales frescos, en pan tostado. Con papas fritas.' },
    { name: 'Nachos de Pollo o Carne', price: '₡7,000', desc: 'Tortillas crocantes con frijoles molidos, mozzarella derretida y natilla cremosa, cubiertas con pollo o carne a tu elección, aguacate y pico de gallo fresco.', photo: CDN + '69b91750269d65241dc77361.jpg' },
    { name: 'Rice and Beans', price: '₡9,500', desc: 'Pollo caribeño tierno en cremosa salsa de coco con tomillo, sobre arroz y frijoles, con plátano maduro y ensalada.', photo: CDN + '69c5f94c5ebd497c7c77bc60.jpg' },
    { name: 'Hamburguesa Arenal', price: '₡8,500', desc: 'Hamburguesa jugosa de res (180 g) en pan brioche suave, con queso derretido, tocineta, cebolla caramelizada, vegetales frescos y aderezo de bacon. Acompañada de papas fritas y salsa de la casa.', photo: CDN + '69c5f94d9619ac299c9a439d.png' },
    { name: 'Arroz con Pollo', price: '₡7,500', desc: 'Arroz salteado con pollo desmenuzado y vegetales, con el toque de la salsa Lizano. Con ensalada fresca y papas fritas.', photo: CDN + '69c5f94c7794bf5a7b5031c0.jpg' },
    { name: 'Nachos Mixtos', price: '₡7,500', desc: 'Tortillas crocantes con frijoles molidos, mozzarella derretida y natilla cremosa, cubiertas con pollo y carne, aguacate y pico de gallo fresco.' },
  ] as FoodItem[],
  desserts: [
    { name: 'Brownie con Helado', price: '₡5,000', desc: 'Brownie tibio con helado de vainilla cremoso que se derrite al contacto.', photo: CDN + '69c5f94c7794bf69985031bf.jpg' },
    { name: 'Flan de Coco', price: '₡5,000', desc: 'Flan de coco sedoso y cremoso, con coco rallado.', photo: CDN + '69d85ba09c84d38e9e925485.jpg' },
    { name: 'Cheesecake', price: '₡5,000', desc: 'Rebanada de cheesecake cremoso y suave.', photo: CDN + '69d85cf8019dc508d3de6c98.png' },
    { name: 'Banana Flambeada', price: '₡5,000', desc: 'Banano flambeado con brandy en caramelo de naranja y canela, con helado de vainilla cremoso y fresa.' },
  ] as FoodItem[],
  notes: [
    'Nuestro restaurante prepara ingredientes de origen local, mariscos y cortes de carne de granjas cercanas, ofreciéndole comida deliciosa y saludable del campo a la mesa.',
    'Impuestos incluidos.',
    'Si tiene alguna alergia alimentaria o requisitos dietéticos especiales, por favor informe a un miembro del personal.',
  ],
  topNotes: ['Del campo a la mesa', 'Ingredientes locales', 'Precios incluyen impuestos', 'Avísenos sobre alergias'],
  cats: [
    { id: 'appetizers' as FoodCat, label: 'Entradas' },
    { id: 'seafood' as FoodCat, label: 'Mar y Río' },
    { id: 'pasta' as FoodCat, label: 'Pasta' },
    { id: 'white-meat' as FoodCat, label: 'Carnes Blancas' },
    { id: 'steaks' as FoodCat, label: 'Carnes' },
    { id: 'vegetarian' as FoodCat, label: 'Vegetariano' },
    { id: 'costa-rica' as FoodCat, label: 'Costa Rica' },
    { id: 'desserts' as FoodCat, label: 'Postres' },
  ],
}

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────

function MenuCard({ item, onOpen }: { item: FoodItem; onOpen?: (item: FoodItem) => void }) {
  const clickable = !!item.photo && !!onOpen
  return (
    <div
      className={`nm-card${clickable ? ' nm-card-clickable' : ''}`}
      onClick={clickable ? () => onOpen!(item) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onOpen!(item) : undefined}
    >
      <div className="nm-card-body">
        <div className="nm-card-top">
          <h3 className="nm-card-name">
            {item.name}
            {item.badge && <span className={`nm-badge nm-badge-${item.badge.type}`}>{item.badge.text}</span>}
          </h3>
          <span className="nm-card-price">{item.price}</span>
        </div>
        {item.desc && <p className="nm-card-desc">{item.desc}</p>}
      </div>
    </div>
  )
}

function PriceRow({ item, onOpen }: { item: FoodItem; onOpen?: (item: FoodItem) => void }) {
  const clickable = !!item.photo && !!onOpen
  return (
    <div
      className={`nm-price-row${clickable ? ' nm-card-clickable' : ''}`}
      onClick={clickable ? () => onOpen!(item) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? (e) => e.key === 'Enter' && onOpen!(item) : undefined}
    >
      <span className="nm-price-name">{item.name}</span>
      <span className="nm-price-dots"></span>
      <span className="nm-price-val">{item.price}</span>
    </div>
  )
}

function SectionBanner({ src, title, tall }: { src: string; title: string; tall?: boolean }) {
  return (
    <div className={`nm-banner${tall ? ' nm-banner-tall' : ''}`}>
      <Image src={src} alt={title} fill style={{ objectFit: 'cover' }} loading="lazy" />
      <div className="nm-banner-overlay">
        <h2 className="nm-banner-title">{title}</h2>
      </div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function MenuClient({ lang = 'en' }: { lang?: 'en' | 'es' }) {
  const [foodCat, setFoodCat] = useState<FoodCat>('appetizers')

  const [modal, setModal] = useState<ModalState | null>(null)

  const d = lang === 'es' ? esFood : enFood

  const openModal = (item: FoodItem, sectionItems: FoodItem[]) =>
    setModal({
      name: item.name,
      price: item.price,
      desc: item.desc,
      photo: item.photo!,
      photoPosition: item.photoPosition,
      suggestions: sectionItems.filter(s => s.name !== item.name && s.photo).slice(0, 4),
      allSectionItems: sectionItems,
      variants: item.variants,
    })

  const suggestLabel = lang === 'es' ? 'Platillos que te podrían gustar' : 'You might also like'

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  const banners = {
    appetizers: 'https://assets.cdn.filesafe.space/0M6K8lmvNdLqq7S28Bmn/media/69ba21d29ab5e21035712b06.jpg',
    seafood: CDN + '69b9175087f0f2768356c731.jpg',
    pasta: CDN + '69c194d5c1e996220ba4333f.jpg',
    whiteMeat: CDN + '69b91750269d6516ffc77360.jpg',
    steaks: CDN + '69c5fbd8146bc51f9eec8ca7.jpg',
    vegetarian: CDN + '6a37000cf2131051b815bea8.jpg',
    costaRica: CDN + '69c5f94c5ebd497c7c77bc60.jpg',
    desserts: CDN + '69c5f94c7794bf69985031bf.jpg',
  }

  const catTitles: Record<FoodCat, string> = {
    'appetizers': d.cats[0].label,
    'seafood': d.cats[1].label,
    'pasta': d.cats[2].label,
    'white-meat': d.cats[3].label,
    'steaks': d.cats[4].label,
    'vegetarian': d.cats[5].label,
    'costa-rica': d.cats[6].label,
    'desserts': d.cats[7].label,
  }

  return (
    <>
      {/* Photo Modal */}
      {modal && (
        <div className="nm-modal-backdrop" onClick={() => setModal(null)}>
          <div className="nm-modal" onClick={(e) => e.stopPropagation()}>
            <button className="nm-modal-close" onClick={() => setModal(null)} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="nm-modal-columns">
              {/* Left — Photo */}
              <div
                className="nm-modal-photo"
                style={modal.name === 'Cheesecake' ?{ width: '80%' } : undefined}
              >
                <Image src={modal.photo} alt={modal.name} fill style={{ objectFit: 'contain', objectPosition: modal.photoPosition ?? 'center' }} />
              </div>

              {/* Right — Info + Suggestions + Reserve */}
              <div className="nm-modal-info">
                <h3 className="nm-modal-name">{modal.name}</h3>
                {modal.variants ? (
                  <div className="nm-modal-variants">
                    {modal.variants.map(v => (
                      <div key={v.label} className="nm-modal-variant-row">
                        <span className="nm-modal-variant-label">{v.label}</span>
                        <span className="nm-modal-variant-price">{v.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="nm-modal-price">{modal.price}</span>
                )}
                {modal.desc && <p className="nm-modal-desc">{modal.desc}</p>}

                {modal.suggestions.length > 0 && (
                  <div className="nm-modal-sugg">
                    <p className="nm-modal-sugg-title">{suggestLabel}</p>
                    <div className="nm-modal-sugg-row">
                      {modal.suggestions.map((s) => (
                        <button
                          key={s.name}
                          className="nm-modal-sugg-card"
                          onClick={() => setModal({
                            name: s.name,
                            price: s.price,
                            desc: s.desc,
                            photo: s.photo ?? modal.photo,
                            suggestions: modal.allSectionItems.filter(x => x.name !== s.name && x.photo).slice(0, 4),
                            allSectionItems: modal.allSectionItems,
                          })}
                        >
                          {s.photo && (
                            <div className="nm-modal-sugg-img">
                              <Image src={s.photo} alt={s.name} fill style={{ objectFit: 'cover' }} />
                            </div>
                          )}
                          <div className="nm-modal-sugg-text">
                            <span className="nm-modal-sugg-name">{s.name}</span>
                            <span className="nm-modal-sugg-price">{s.price}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nm-modal-reserve">
                  <Link
                    href={lang === 'es' ? '/es#reservations' : '/#reservations'}
                    className="nm-modal-reserve-btn"
                    onClick={() => setModal(null)}
                  >
                    {lang === 'es' ? 'Reservar una Mesa' : 'Reserve a Table'}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Nav */}
      <div className="nm-sticky-nav">
        <div className="nm-cats-row">
          <div className="nm-cats-inner">
            {d.cats.map((c) => (
              <button key={c.id} className={`nm-cat-btn${foodCat === c.id ? ' active' : ''}`}
                onClick={() => { setFoodCat(c.id); scrollToSection(c.id) }}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FOOD PANEL */}
      <>
        <div className="nm-notes">
          <div className="nm-notes-inner">
            {d.topNotes.map((n) => <span key={n}>{n}</span>)}
          </div>
        </div>
        <div className="nm-food-sections">

          <section className="nm-food-section" id="appetizers">
            <SectionBanner src={banners.appetizers} title={catTitles['appetizers']} />
            <div className="nm-grid">
              {d.appetizers.map((item) => (
                <MenuCard key={item.name} item={item}
                  onOpen={item.photo ? (i) => openModal(i, d.appetizers) : undefined} />
              ))}
            </div>
          </section>

          <section className="nm-food-section" id="seafood">
            <SectionBanner src={banners.seafood} title={catTitles['seafood']} tall />
            <div className="nm-grid">
              {d.seafood.map((item) => (
                <MenuCard key={item.name} item={item}
                  onOpen={item.photo ? (i) => openModal(i, d.seafood) : undefined} />
              ))}
            </div>
            <p className="nm-steak-note">{d.seafoodNote}</p>
          </section>

          <section className="nm-food-section" id="pasta">
            <SectionBanner src={banners.pasta} title={catTitles['pasta']} />
            <div className="nm-grid">
              {d.pasta.map((item) => (
                <MenuCard key={item.name} item={item}
                  onOpen={item.photo ? (i) => openModal(i, d.pasta) : undefined} />
              ))}
            </div>
          </section>

          <section className="nm-food-section" id="white-meat">
            <SectionBanner src={banners.whiteMeat} title={catTitles['white-meat']} />
            <div className="nm-grid">
              {d.whiteMeat.map((item) => (
                <MenuCard key={item.name} item={item}
                  onOpen={item.photo ? (i) => openModal(i, d.whiteMeat) : undefined} />
              ))}
            </div>
          </section>

          <section className="nm-food-section" id="steaks">
            <SectionBanner src={banners.steaks} title={catTitles['steaks']} tall />
            <div className="nm-steak-grid">
              {d.steaks.map((s) => (
                <PriceRow key={s.name} item={s}
                  onOpen={s.photo ? (i) => openModal(i, d.steaks) : undefined} />
              ))}
            </div>
            <p className="nm-steak-note">{d.steakNote}</p>
          </section>

          <section className="nm-food-section" id="vegetarian">
            <SectionBanner src={banners.vegetarian} title={catTitles['vegetarian']} />
            <div className="nm-grid">
              {d.vegetarian.map((item) => (
                <MenuCard key={item.name} item={item}
                  onOpen={item.photo ? (i) => openModal(i, d.vegetarian) : undefined} />
              ))}
            </div>
          </section>

          <section className="nm-food-section" id="costa-rica">
            <SectionBanner src={banners.costaRica} title={catTitles['costa-rica']} tall />
            <div className="nm-grid">
              {d.costaRica.map((item) => (
                <MenuCard key={item.name} item={item}
                  onOpen={item.photo ? (i) => openModal(i, d.costaRica) : undefined} />
              ))}
            </div>
          </section>

          <section className="nm-food-section" id="desserts">
            <SectionBanner src={banners.desserts} title={catTitles['desserts']} />
            <div className="nm-dessert-grid">
              {d.desserts.map((item) => (
                <div key={item.name}
                  className={`nm-dessert-item${item.photo ? ' nm-card-clickable' : ''}`}
                  onClick={item.photo ? () => openModal(item, d.desserts) : undefined}
                  role={item.photo ? 'button' : undefined}
                  tabIndex={item.photo ? 0 : undefined}
                >
                  <span className="nm-dessert-name">{item.name}</span>
                  <span className="nm-dessert-price">{item.price}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="nm-food-notes">
            {d.notes.map((n) => (
              <div key={n} className="nm-food-note">
                <span className="nm-fn-icon">✦</span>
                <span>{n}</span>
              </div>
            ))}
          </div>
        </div>
      </>

      {/* Mobile sticky reserve CTA */}
      <div className="nm-sticky-reserve">
        <a
          href={`https://wa.me/50624790707?text=${encodeURIComponent(
            lang === 'es'
              ? 'Hola! Quisiera reservar una mesa en Nanku.'
              : "Hi! I'd like to reserve a table at Nanku."
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="nm-sticky-reserve-btn"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          {lang === 'es' ? 'Reservar Mesa' : 'Reserve a Table'}
        </a>
      </div>
    </>
  )
}