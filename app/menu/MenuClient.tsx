'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'

type Panel = 'food' | 'drinks'
type FoodCat = 'appetizers' | 'seafood' | 'pasta' | 'white-meat' | 'steaks' | 'vegetarian' | 'costa-rica' | 'desserts'
type DrinksCat = 'licores' | 'bebidas' | 'cervezas' | 'tiki' | 'cocteles' | 'vinos'

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
    { name: 'Salmon Special', price: '₡22,500', desc: 'Salmon and jumbo shrimp in coconut milk with a sweet-and-tangy strawberry sauce, with rice and mixed vegetables.' },
    { name: 'Malibu Shrimp Special', price: '₡21,500', desc: 'Jumbo shrimp in our creamy Malibu coconut-rum sauce, with pineapple rice and salad.' },
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
  panelFood: 'Food Menu',
  panelDrinks: 'Drinks Menu',
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
    { name: 'Especial de Salmón', price: '₡22,500', desc: 'Salmón y camarones jumbo en leche de coco con una salsa agridulce de fresa, con arroz y vegetales mixtos.' },
    { name: 'Especial Camarones Malibu', price: '₡21,500', desc: 'Camarones jumbo en nuestra cremosa salsa Malibu de coco y ron, con arroz con piña y ensalada.' },
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
  panelFood: 'Comida',
  panelDrinks: 'Bebidas',
}

const drinksCats: { id: DrinksCat; label: string }[] = [
  { id: 'tiki', label: 'Tiki Cocktails' },
  { id: 'cocteles', label: 'Cocktails' },
  { id: 'vinos', label: 'Wines' },
  { id: 'licores', label: 'Licores' },
  { id: 'cervezas', label: 'Beer' },
  { id: 'bebidas', label: 'Soft Drinks' },
]

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

function DPriceRow({ name, price }: { name: string; price: string }) {
  return (
    <div className="nm-dprice-row">
      <span className="nm-dprice-name">{name}</span>
      <span className="nm-dprice-dots"></span>
      <span className="nm-dprice-val">{price}</span>
    </div>
  )
}

function WineRow({ name, detail, price }: { name: string; detail: string; price: string }) {
  return (
    <div className="nm-wine-row">
      <div className="nm-wine-info">
        <span className="nm-wine-name">{name}</span>
        <span className="nm-wine-detail">{detail}</span>
      </div>
      <span className="nm-wine-dots"></span>
      <span className="nm-wine-price">{price}</span>
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

function DrinksHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="nm-drinks-header">
      <span className="nm-drinks-ornament">✦ &nbsp; ✦ &nbsp; ✦</span>
      <h2 className="nm-drinks-title">{title}</h2>
      <div className="nm-drinks-divider">
        <span className="nm-ddiv-line"></span>
        <span className="nm-ddiv-gem">◆</span>
        <span className="nm-ddiv-line"></span>
      </div>
      {subtitle && <p className="nm-drinks-subtitle">{subtitle}</p>}
    </div>
  )
}

function DSub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="nm-dsub">
      <div className="nm-dsub-title">{title}</div>
      <div className="nm-dprice-grid">{children}</div>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function MenuClient({ lang = 'en' }: { lang?: 'en' | 'es' }) {
  const [panel, setPanel] = useState<Panel>('food')
  const [foodCat, setFoodCat] = useState<FoodCat>('appetizers')
  const [drinksCat, setDrinksCat] = useState<DrinksCat>('tiki')

  const searchParams = useSearchParams()
  useEffect(() => {
    setPanel(searchParams.get('tab') === 'drinks' ? 'drinks' : 'food')
  }, [searchParams])
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
        <div className="nm-main-row">
          <button className={`nm-main-btn${panel === 'food' ? ' active' : ''}`} onClick={() => setPanel('food')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2M18 2c0 0 3 0 3 6s-3 6-3 6" />
            </svg>
            {d.panelFood}
          </button>
          <button className={`nm-main-btn${panel === 'drinks' ? ' active' : ''}`} onClick={() => setPanel('drinks')}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 22h8M12 11v11M20 7H4l2 9h12z" /><path d="M4 7c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4" />
            </svg>
            {d.panelDrinks}
          </button>
        </div>
        <div className="nm-cats-row">
          {panel === 'food' && (
            <div className="nm-cats-inner">
              {d.cats.map((c) => (
                <button key={c.id} className={`nm-cat-btn${foodCat === c.id ? ' active' : ''}`}
                  onClick={() => { setFoodCat(c.id); scrollToSection(c.id) }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {panel === 'drinks' && (
            <div className="nm-cats-inner">
              {drinksCats.map((c) => (
                <button key={c.id} className={`nm-cat-btn${drinksCat === c.id ? ' active' : ''}`}
                  onClick={() => { setDrinksCat(c.id); scrollToSection(c.id) }}>
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FOOD PANEL */}
      {panel === 'food' && (
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
      )}

      {/* DRINKS PANEL */}
      {panel === 'drinks' && (
        <div className="nm-drinks-sections">
          <section className="nm-drinks-section" id="tiki">
            <DrinksHeader title="Tiki Cocktails" subtitle={lang === 'es'
              ? 'Escápate al trópico con nuestras vibrantes creaciones tiki — mezclas exóticas y audaces perfectamente equilibradas para transportarte al paraíso del sabor.'
              : 'Escape to the tropics with our vibrant tiki creations — bold, exotic blends perfectly balanced to transport you to flavor paradise.'} />
            {(() => {
              const tikisEn: FoodItem[] = [
                { name: 'Pura Vida', price: '₡8,000', desc: 'The spirit of Costa Rica in a glass. White rum and vodka meet gin and pineapple juice, while lime and starfruit add irresistible tropical freshness.', photo: CDN + '69ee79140d66f2a6656398cc.png' },
                { name: 'Nanku', price: '₡8,000', desc: 'Our signature tiki. Dark and white rum united in perfect harmony with lime, cinnamon syrup, and the sweet kiss of mango.', photo: CDN + '69ee744905d4199001c71026.png' },
                { name: 'Julia', price: '₡8,000', desc: 'Caribbean elegance. Aged rum and pineapple dance with ginger syrup and lime, crowned with the aromatic touch of cranberry juice.', photo: CDN + '69ee777f717d5dd4e12d8ee5.png' },
                { name: 'A Cachete', price: '₡8,000', desc: 'Pure tropical power. Aged rum and watermelon juice lead this exotic escape, elevated with lime, pineapple, cinnamon, Malibu, and mysterious blue curaçao.', photo: CDN + '69ee77ea05d4199001c7c357.png' },
                { name: 'Tuanis', price: '₡8,000', desc: 'Simply "tuanis" (awesome). The refreshing combination of white and dark rum, lime and Jamaica syrup, with the vibrant touch of ginger.', photo: CDN + '69ee76d2b0e5e2bb7ff40bd3.png' },
                { name: 'Jack Sparrow', price: '₡8,000', desc: 'Adventure in every sip. Campari and Jack Daniel\'s meet passion fruit and ginger syrup, sailing on a sea of orange juice.', photo: CDN + '69ee78aa05d4199001c7e731.png' },
                { name: 'Mai Tai', price: '₡8,000', desc: 'The timeless classic. Rum, Cointreau, lime, and sugar, crowned with exotic horchata syrup.', photo: CDN + '69ee762e0d66f2a665630ced.png' },
              ]
              const tikisEs: FoodItem[] = [
                { name: 'Pura Vida', price: '₡8,000', desc: 'El espíritu de Costa Rica en un vaso. Ron blanco y vodka se encuentran con ginebra y jugo de piña, mientras que el limón y el carambolo añaden una frescura tropical irresistible.', photo: CDN + '69ee79140d66f2a6656398cc.png' },
                { name: 'Nanku', price: '₡8,000', desc: 'Nuestro tiki insignia. Ron oscuro y blanco unidos en perfecta armonía con limón, jarabe de canela y el dulce beso del mango.', photo: CDN + '69ee744905d4199001c71026.png' },
                { name: 'Julia', price: '₡8,000', desc: 'Elegancia caribeña. Ron añejo y piña bailan con jarabe de jengibre y limón, coronados con el toque aromático del jugo de arándano.', photo: CDN + '69ee777f717d5dd4e12d8ee5.png' },
                { name: 'A Cachete', price: '₡8,000', desc: 'Puro poder tropical. Ron añejo y jugo de sandía lideran esta escapada exótica, elevada con limón, piña, canela, Malibu y el misterioso curaçao azul.', photo: CDN + '69ee77ea05d4199001c7c357.png' },
                { name: 'Tuanis', price: '₡8,000', desc: 'Simplemente "tuanis" (genial). La refrescante combinación de ron blanco y oscuro, limón y jarabe de Jamaica, con el toque vibrante del jengibre.', photo: CDN + '69ee76d2b0e5e2bb7ff40bd3.png' },
                { name: 'Jack Sparrow', price: '₡8,000', desc: 'Aventura en cada sorbo. Campari y Jack Daniel\'s se encuentran con maracuyá y jarabe de jengibre, navegando en un mar de jugo de naranja.', photo: CDN + '69ee78aa05d4199001c7e731.png' },
                { name: 'Mai Tai', price: '₡8,000', desc: 'El clásico atemporal. Ron, Cointreau, limón y azúcar, coronado con el exótico jarabe de horchata.', photo: CDN + '69ee762e0d66f2a665630ced.png' },
              ]
              const tikis = lang === 'es' ? tikisEs : tikisEn
              return (
                <div className="nm-cktl-grid">
                  {tikis.map((c) => c.photo ? (
                    <div key={c.name}
                      className="nm-cktl-card nm-cktl-card--photo nm-card-clickable"
                      onClick={() => openModal(c, tikis.filter(t => t.name !== c.name && !!t.photo).slice(0, 4))}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && openModal(c, tikis.filter(t => t.name !== c.name && !!t.photo).slice(0, 4))}
                    >
                      <div className="nm-cktl-photo-wrap">
                        <Image src={c.photo} alt={c.name} width={800} height={1000} style={{ width: '100%', height: 'auto', display: 'block' }} />
                        <div className="nm-cktl-photo-overlay">
                          <h3 className="nm-cktl-name">{c.name}</h3>
                        </div>
                      </div>
                      <div className="nm-cktl-body">
                        <span className="nm-cktl-price">{c.price}</span>
                        <p className="nm-cktl-desc">{c.desc}</p>
                      </div>
                    </div>
                  ) : (
                    <div key={c.name} className="nm-cktl-card">
                      <div className="nm-cktl-top">
                        <h3 className="nm-cktl-name">{c.name}</h3>
                        <span className="nm-cktl-price">{c.price}</span>
                      </div>
                      <p className="nm-cktl-desc">{c.desc}</p>
                    </div>
                  ))}
                </div>
              )
            })()}
          </section>

          <section className="nm-drinks-section" id="cocteles">
            <DrinksHeader title="Cócteles / Cocktails" />

            <div className="nm-dsub">
              <div className="nm-dsub-title">Los Sours</div>
              <div className="nm-cktl-grid">
                {[
                  { name: 'Guaro Sour Clásico', price: '₡3,500', desc: 'Guaro, limón, jarabe simple.' },
                  { name: 'Guaro Sour Arándanos', price: '₡4,500', desc: 'Guaro, arándanos, limón, sirope de moras.' },
                  { name: 'Whiskey Sour', price: '₡4,500', desc: 'Clara de huevo, limón, jarabe simple, Ezra Brooks Bourbon.' },
                ].map((c) => (
                  <div key={c.name} className="nm-cktl-card">
                    <div className="nm-cktl-top">
                      <h3 className="nm-cktl-name">{c.name}</h3>
                      <span className="nm-cktl-price">{c.price}</span>
                    </div>
                    <p className="nm-cktl-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="nm-dsub">
              <div className="nm-dsub-title">Margaritas</div>
              <div className="nm-cktl-grid">
                {[
                  { name: 'Margarita Clásica', price: '₡4,000', desc: 'Tequila Jarana Blanco, triple sec, limón, jarabe simple.' },
                  { name: 'Wild Passion Margarita', price: '₡4,500', desc: 'Infusión de tequila y jalapeño, triple sec, maracuyá y jarabe simple.' },
                  { name: 'Margarita de Mango', price: '₡4,000', desc: 'Tequila Jarana Blanco, triple sec, mango, limón.' },
                ].map((c) => (
                  <div key={c.name} className="nm-cktl-card">
                    <div className="nm-cktl-top">
                      <h3 className="nm-cktl-name">{c.name}</h3>
                      <span className="nm-cktl-price">{c.price}</span>
                    </div>
                    <p className="nm-cktl-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="nm-dsub">
              <div className="nm-dsub-title">With a Twist</div>
              <div className="nm-cktl-grid">
                {[
                  { name: 'Tom Collins de Fresa y Tomillo', price: '₡4,000', desc: 'Ginebra Master\'s, limón, jarabe de fresa y tomillo, soda.' },
                  { name: 'Gin Tonic de Mandarina', price: '₡4,500', desc: 'Ginebra Martin Miller\'s, rosas persas, jugo de mandarina, agua tónica.' },
                  { name: 'Mula Tica', price: '₡4,500', desc: 'Guaro Cacique, limón, cerveza de jengibre.' },
                ].map((c) => (
                  <div key={c.name} className="nm-cktl-card">
                    <div className="nm-cktl-top">
                      <h3 className="nm-cktl-name">{c.name}</h3>
                      <span className="nm-cktl-price">{c.price}</span>
                    </div>
                    <p className="nm-cktl-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="nm-dsub">
              <div className="nm-dsub-title">Los Clásicos / The Classics</div>
              <div className="nm-cktl-grid">
                {[
                  { name: 'Mojito', price: '₡4,500', desc: 'Hierba buena fresca, limón, jarabe de hierba buena, ron blanco.' },
                  { name: 'Piña Colada', price: '₡4,500', desc: 'Piña fresca, crema de coco, leche de coco, ron blanco.' },
                  { name: 'Old Fashioned', price: '₡4,500', desc: 'Azúcar, amargos de angostura, Ezra Brooks Bourbon, cherry.' },
                  { name: 'Negroni', price: '₡4,500', desc: 'Campari, Vermouth Rosso, Ginebra.' },
                  { name: 'Aperol Spritz', price: '₡4,500', desc: 'Aperol, soda, vino espumante.' },
                  { name: 'Long Island', price: '₡4,500', desc: 'Ron blanco, Vodka, Tequila, triple sec, ginebra, limón, azúcar, cola.' },
                ].map((c) => (
                  <div key={c.name} className="nm-cktl-card">
                    <div className="nm-cktl-top">
                      <h3 className="nm-cktl-name">{c.name}</h3>
                      <span className="nm-cktl-price">{c.price}</span>
                    </div>
                    <p className="nm-cktl-desc">{c.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="nm-drinks-section" id="vinos">
            <DrinksHeader title="Vinos / Wines" />

            <DSub title="Vino Espumoso / Sparkling Wine">
              <WineRow name="Lunneta Prosecco DOC" detail="Veneto, Italia · Glera" price="₡19,500" />
            </DSub>

            <DSub title="Vinos Blancos / White Wine">
              <WineRow name="Legaris DO Rueda" detail="España · Verdejo" price="₡19,000" />
              <WineRow name="Cavit Valdobbiadene DOC" detail="Italia · Pinot Grigio" price="₡19,500" />
              <WineRow name="Santa Rita Medalla Real Reserva" detail="DO Valle de Casa Blanca, Chile · Sauvignon Blanc" price="₡17,000" />
              <WineRow name="Carmen Premier Reserva" detail="DO Valle de Casa Blanca, Chile · Chardonnay" price="₡18,500" />
              <WineRow name="Santa Rita Medalla Real Reserva" detail="DO Valle de Limari, Chile · Chardonnay" price="₡17,000" />
              <WineRow name="Carmen Gran Reserva" detail="DO Valle de Limari, Chile · Chardonnay" price="₡20,000" />
            </DSub>

            <DSub title="Vino Rosado / Rosé Wine">
              <WineRow name="Domaines Paul Mass Jardin de Roses" detail="AOC Languedoc, Francia · Garnacha, Cinsaul & Syrah" price="₡20,000" />
            </DSub>

            <DSub title="Vinos Tintos / Red Wine">
              <WineRow name="Cavit Red Blend, Trentino DOC" detail="Italia · Merlot, Cabernet & Teroldego" price="₡17,000" />
              <WineRow name="Care Nouveau Blend, DO Cariñena" detail="España · Tempranillo, Garnacha & Cabernet Sauvignon" price="₡19,500" />
              <WineRow name="Domaines Paul Reserva, IGT Pays d'Oc" detail="Francia · Pinot Noir" price="₡19,500" />
              <WineRow name="Santa Rita Medalla Real Reserva" detail="DO Valle del Maipo, Chile · Cabernet Sauvignon" price="₡17,000" />
              <WineRow name="Carmen Series Vintage Gran Reserva" detail="DO Alto Jahuel, Chile · Cabernet Sauvignon" price="₡21,500" />
              <WineRow name="Legaris Crianza, DO Ribera del Duero" detail="España · Tempranillo" price="₡24,500" />
              <WineRow name="Doña Paula Estate" detail="Valle de Uco, Argentina · Malbec" price="₡22,000" />
              <WineRow name="Norton Altura" detail="Valle de Uco, Argentina · Malbec" price="₡26,500" />
            </DSub>

            <DSub title="Vino de la Casa / House Wine · Copa / Glass">
              <DPriceRow name="Doña Paula Malbec, Argentina" price="₡4,500" />
              <DPriceRow name="Carmen Merlot, Chile" price="₡4,500" />
              <DPriceRow name="Carmen Cabernet Sauvignon, Chile" price="₡4,500" />
              <DPriceRow name="Carmen Sauvignon Blanc, Chile" price="₡4,500" />
              <DPriceRow name="Principato Pinot Grigio, Italia" price="₡4,500" />
              <DPriceRow name="Carmen Chardonnay, Chile" price="₡4,500" />
            </DSub>
          </section>

          <section className="nm-drinks-section" id="licores">
            <DrinksHeader title="Licores / Liqueur" />
            <DSub title="Whiskey">
              <DPriceRow name="Macallan 12 años" price="₡10,500" />
              <DPriceRow name="Glen Fiddich 12 años" price="₡5,500" />
              <DPriceRow name="Old Parr 12 años" price="₡4,000" />
              <DPriceRow name="Old Parr 18 años" price="₡7,200" />
              <DPriceRow name="Buchanan's 12 años" price="₡4,000" />
              <DPriceRow name="Buchanan's 18 años" price="₡7,200" />
              <DPriceRow name="Crown Royal" price="₡4,000" />
              <DPriceRow name="Maker's Mark" price="₡4,000" />
              <DPriceRow name="Jameson" price="₡4,000" />
              <DPriceRow name="Jack Daniel's" price="₡4,000" />
              <DPriceRow name="Jim Beam" price="₡4,000" />
              <DPriceRow name="Chivas Regal 12 años" price="₡4,000" />
              <DPriceRow name="Chivas Regal 18 años" price="₡7,200" />
            </DSub>
            <DSub title="Tequilas">
              <DPriceRow name="Patrón Reposado" price="₡5,500" />
              <DPriceRow name="Patrón Añejo" price="₡6,500" />
              <DPriceRow name="Patrón Silver" price="₡5,500" />
              <DPriceRow name="Don Julio 70" price="₡9,000" />
              <DPriceRow name="Don Julio Reposado" price="₡5,500" />
              <DPriceRow name="Don Julio Añejo" price="₡7,000" />
              <DPriceRow name="1800 Silver" price="₡4,000" />
              <DPriceRow name="1800 Reposado" price="₡4,000" />
              <DPriceRow name="1800 Añejo" price="₡5,300" />
              <DPriceRow name="Montes Lobos" price="₡5,500" />
            </DSub>
            <DSub title="Ginebras / Gin">
              <DPriceRow name="Bombay" price="₡4,400" />
              <DPriceRow name="Hendrick's" price="₡4,400" />
              <DPriceRow name="Tanqueray" price="₡3,500" />
              <DPriceRow name="Beefeater" price="₡3,500" />
              <DPriceRow name="Martin Miller's" price="₡4,400" />
              <DPriceRow name="Tanqueray Ten" price="₡4,400" />
              <DPriceRow name="Bulldog" price="₡4,400" />
            </DSub>
            <DSub title="Vodka">
              <DPriceRow name="Absolut" price="₡3,500" />
              <DPriceRow name="Stolichnaya" price="₡3,000" />
              <DPriceRow name="Grey Goose" price="₡4,500" />
              <DPriceRow name="Tito's" price="₡3,500" />
              <DPriceRow name="Ketel One" price="₡4,000" />
              <DPriceRow name="Cîroc" price="₡4,500" />
            </DSub>
            <DSub title="Aperitivo & Digestivo">
              <DPriceRow name="Jägermeister" price="₡2,500" />
              <DPriceRow name="Licor 43" price="₡2,500" />
              <DPriceRow name="Cointreau" price="₡4,000" />
              <DPriceRow name="Grand Marnier" price="₡4,500" />
              <DPriceRow name="Café Rica" price="₡3,500" />
              <DPriceRow name="Disaronno" price="₡3,500" />
              <DPriceRow name="Frangelico" price="₡3,500" />
              <DPriceRow name="Baileys" price="₡3,500" />
              <DPriceRow name="Midori" price="₡3,000" />
              <DPriceRow name="Fireball" price="₡3,500" />
            </DSub>
            <DSub title="Coñac / Cognac">
              <DPriceRow name="Courvoisier VS" price="₡5,000" />
              <DPriceRow name="Courvoisier VSOP" price="₡7,000" />
              <DPriceRow name="Hennessy VSOP" price="₡10,000" />
            </DSub>
            <DSub title="Rones / Rum">
              <DPriceRow name="Capitán Morgan" price="₡2,500" />
              <DPriceRow name="Centenario 7 años" price="₡3,500" />
              <DPriceRow name="Flor de Caña 7 años" price="₡3,000" />
              <DPriceRow name="Flor de Caña 12 años" price="₡4,300" />
              <DPriceRow name="Flor de Caña 18 años" price="₡5,500" />
              <DPriceRow name="Centenario 20 años" price="₡5,500" />
              <DPriceRow name="Zacapa 23 años" price="₡5,900" />
              <DPriceRow name="Cachaça" price="₡2,500" />
              <DPriceRow name="Cacique" price="₡2,000" />
              <DPriceRow name="Appleton Estate" price="₡4,000" />
            </DSub>
          </section>

          <section className="nm-drinks-section" id="cervezas">
            <DrinksHeader title="Cervezas / Beer" />
            <DSub title="Artesanal Local en Sifón / Local Craft on Draft">
              <DPriceRow name="Indómito IPA 7.6%" price="₡4,500" />
              <DPriceRow name="Libertas Golden Ale 4.3%" price="₡4,500" />
              <DPriceRow name="Segua Red Ale 4.8%" price="₡4,500" />
              <DPriceRow name="Nanku Premium Lager 4.3%" price="₡4,500" />
              <DPriceRow name="Passion de Maracuyá" price="₡4,500" />
            </DSub>
            <DSub title="Artesanal Local en Botella / Local Craft on Bottle">
              <DPriceRow name="Mama Candela" price="₡4,500" />
            </DSub>
            <DSub title="Cerveza sin Gluten / Gluten-Free Beer">
              <DPriceRow name="Daura Damm" price="₡3,000" />
            </DSub>
            <DSub title="Las Lager">
              <DPriceRow name="Imperial" price="₡1,900" />
              <DPriceRow name="Imperial Silver" price="₡1,900" />
              <DPriceRow name="Imperial Light" price="₡1,900" />
              <DPriceRow name="Imperial Ultra" price="₡1,900" />
              <DPriceRow name="Pilsen" price="₡1,900" />
              <DPriceRow name="Bavaria Gold" price="₡2,200" />
              <DPriceRow name="Bavaria Light" price="₡2,200" />
            </DSub>
            <DSub title="Importadas / Imported">
              <DPriceRow name="Heineken" price="₡2,200" />
              <DPriceRow name="Corona" price="₡2,200" />
              <DPriceRow name="Sol" price="₡2,200" />
            </DSub>
          </section>

          <section className="nm-drinks-section" id="bebidas">
            <DrinksHeader title="Gaseosas & Aguas / Soft Drinks & Water" />
            <DSub title="Agua / Water">
              <DPriceRow name="Agua con gas grande / Large Sparkling Water" price="₡3,500" />
              <DPriceRow name="Agua con gas pequeña / Small Sparkling Water" price="₡2,200" />
              <DPriceRow name="Agua grande / Large Water" price="₡3,500" />
              <DPriceRow name="Agua pequeña / Small Water" price="₡1,500" />
            </DSub>
            <DSub title="Gaseosas / Soft Drinks">
              <DPriceRow name="Coca Cola / Coke" price="₡1,800" />
              <DPriceRow name="Coca Cola Cero / Coke Zero" price="₡1,800" />
              <DPriceRow name="Ginger Ale" price="₡1,800" />
              <DPriceRow name="Fresco" price="₡1,800" />
              <DPriceRow name="Fanta Naranja / Orange Fanta" price="₡1,800" />
              <DPriceRow name="Fanta Uva / Grape Fanta" price="₡1,800" />
              <DPriceRow name="Fanta Kolita / Red Fanta" price="₡1,800" />
              <DPriceRow name="Sprite" price="₡1,800" />
            </DSub>
            <div className="nm-dsub">
              <div className="nm-dsub-title">Batidos de Frutas / Fruit Smoothies</div>
              <p className="nm-batidos-note">Sabores / Flavors: Mango · Mora/Blackberry · Fresa/Strawberry · Banano · Guanábana/Soursop · Maracuyá/Passion Fruit · Piña/Pineapple</p>
              <div className="nm-dprice-grid">
                <DPriceRow name="1 Fruta / 1 Fruit" price="₡1,500" />
                <DPriceRow name="2 Frutas / 2 Fruits" price="₡2,000" />
                <DPriceRow name="Mixto / Mixed" price="₡2,500" />
              </div>
            </div>
            <DSub title="Limonadas / Lemonade">
              <DPriceRow name="Limonada / Lemonade" price="₡1,500" />
              <DPriceRow name="Limonada con Hierba Buena / Lemonade with Mint" price="₡2,000" />
              <DPriceRow name="Limonada con Gengibre / Ginger Lemonade" price="₡2,000" />
            </DSub>
          </section>

        </div>
      )}

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