import { storyContent } from './story';

export type Locale = 'es' | 'en';

export const brand = {
  name: 'Artimex Bakery',
  email: 'sales@artimex.com',
  phone: '+1 562 777 0924',
  phoneHref: 'tel:+15627770924',
  address: '12764 Florence Avenue',
  city: 'Santa Fe Springs, CA 90670',
  map: 'https://www.google.com/maps/search/?api=1&query=12764+Florence+Avenue+Santa+Fe+Springs+CA+90670',
};

export const copy = {
  es: {
    title: 'Artimex Bakery — El arte de compartir',
    description: 'Descubre el universo de Artimex Bakery: pan mexicano, tradición artesanal y sabores para compartir. Conchas, bolillos y pan dulce en California.',
    skip: 'Saltar al contenido',
    nav: { collection: 'Nuestros panes', story: 'Nuestra esencia', careers: 'Empleo', contact: 'Contacto', business: 'Para tu negocio', menu: 'Abrir menú', close: 'Cerrar menú' },
    hero: { explore: 'Descubre nuestros panes', story: 'Conoce nuestra esencia', scroll: 'Un mundo por descubrir', previous: 'Escena anterior', next: 'Escena siguiente', pause: 'Pausar slider', play: 'Reanudar slider', label: 'El universo Artimex', scene: 'Escena' },
    intro: { eyebrow: 'EL SABOR DE NUESTRAS RAÍCES', first: 'Hay sabores que', second: 'siempre son hogar.', note: 'Un pan. Una mesa. Mil momentos.' },
    story: { ...storyContent.es, eyebrow: 'NUESTRA ESENCIA', link: 'Encuentra tu favorito', stamp: ['TRADICIÓN MEXICANA', 'HECHA CON CORAZÓN'] },
    collection: { eyebrow: 'NUESTROS PANES', first: 'Una colección', second: 'para compartir.', body: 'Dulces recuerdos. Nuevos favoritos. Elige el sabor de tu próximo encuentro.', all: 'Todos', sweet: 'Dulces', savory: 'Salados', details: 'Descubrir', more: 'Más de nuestra panadería', less: 'Cerrar la colección', extra: 'Más sabores, la misma esencia.', view: 'Ver detalles de', enquire: 'Consultar este producto', varieties: 'VARIEDADES', close: 'Cerrar detalles', photo: 'Imagen ilustrativa de la familia de producto', contact: 'Para conocer presentaciones y disponibilidad, consulta con nuestro equipo.' },
    business: { eyebrow: 'PARA PROFESIONALES', first: 'Tu negocio.', second: 'Nuestro pan.', body: 'Lleva la tradición de la panadería mexicana a tu mesa, tu restaurante o tu mercado. Hablemos de la selección que mejor acompaña a tu negocio.', link: 'Hablemos de tu proyecto', items: ['Restaurantes', 'Mercados', 'Distribución'], sub: 'Un nuevo capítulo empieza con una conversación.' },
    careers: { eyebrow: 'OPORTUNIDADES EN ARTIMEX', first: 'Crece con', second: 'nosotros.', body: '¿Te apasiona el oficio, la calidad y trabajar con un equipo que honra la tradición? Nos interesa conocer tu experiencia para futuras oportunidades en Artimex.', link: 'Comparte tu experiencia', subject: 'Empleo en Artimex', note: 'Futuras oportunidades', caption: 'Ayúdanos a llevar el auténtico pan mexicano aún más lejos.', resume: 'Puedes adjuntar tu CV en tu aplicación de correo.', privacy: 'Consulta nuestro aviso de privacidad', photo: 'Manos de un panadero trabajando la masa; imagen ilustrativa del oficio.' },
    location: { eyebrow: 'DE MÉXICO A CALIFORNIA', first: 'Cerca de ti.', second: 'Desde nuestras raíces.', address: 'ARTIMEX BAKERY · SANTA FE SPRINGS', directions: 'Cómo llegar', sales: 'CONVERSEMOS', contact: 'Hablemos de pan', top: 'Volver al inicio' },
    footer: { tagline: 'El arte de compartir.', concept: 'Concepto visual · Imágenes ilustrativas', rights: 'Artimex LLC' },
    contact: { eyebrow: 'EMPECEMOS ALGO BUENO', title: 'Hablemos de pan.', body: 'Cuéntanos qué necesitas. Nuestro equipo comercial te ayudará a dar el siguiente paso.', name: 'Tu nombre', email: 'Correo electrónico', company: 'Empresa', message: '¿Qué tienes en mente?', placeholder: 'Productos, presentaciones, una colaboración…', button: 'Preparar mi consulta', notice: 'Podrás revisar tu consulta y abrirla en tu correo cuando estés listo.', close: 'Cerrar contacto', ready: 'Tu consulta está lista.', readyBody: 'Si tu aplicación de correo no se abrió, copia la consulta y envíala a', copy: 'Copiar consulta', copied: 'Consulta copiada', emailButton: 'Abrir mi correo', required: 'Por favor, completa los campos obligatorios.', subject: 'Consulta de productos — Artimex Bakery', product: 'Me interesa conocer las presentaciones y la disponibilidad de: ', draft: 'Vista previa de tu consulta', back: 'Editar consulta' },
  },
  en: {
    title: 'Artimex Bakery — A Taste of Home',
    description: 'Discover the world of Artimex Bakery: authentic Mexican bread, artisan tradition and flavors made to share. Conchas, bolillos and sweet bread in California.',
    skip: 'Skip to content',
    nav: { collection: 'Our breads', story: 'Our essence', careers: 'Careers', contact: 'Contact', business: 'For your business', menu: 'Open menu', close: 'Close menu' },
    hero: { explore: 'Discover our breads', story: 'Discover our essence', scroll: 'A world to discover', previous: 'Previous scene', next: 'Next scene', pause: 'Pause slideshow', play: 'Resume slideshow', label: 'The world of Artimex', scene: 'Scene' },
    intro: { eyebrow: 'THE TASTE OF OUR ROOTS', first: 'Some flavors', second: 'always feel like home.', note: 'One loaf. One table. A thousand moments.' },
    story: { ...storyContent.en, eyebrow: 'OUR ESSENCE', link: 'Find your favorite', stamp: ['MEXICAN TRADITION', 'MADE WITH HEART'] },
    collection: { eyebrow: 'OUR BREADS', first: 'A collection', second: 'made to share.', body: 'Sweet memories. New favorites. Find a flavor for your next gathering.', all: 'All', sweet: 'Sweet', savory: 'Savory', details: 'Discover', more: 'More from our bakery', less: 'Close the collection', extra: 'More flavors. The same soul.', view: 'Discover', enquire: 'Ask about this product', varieties: 'VARIETIES', close: 'Close product details', photo: 'Illustrative product family photography', contact: 'For packaging options and availability, get in touch with our team.' },
    business: { eyebrow: 'FOR PROFESSIONALS', first: 'Your business.', second: 'Our bread.', body: 'Bring the tradition of Mexican baking to your table, restaurant or market. Let’s talk about the selection that best complements your business.', link: 'Let’s talk about your project', items: ['Restaurants', 'Markets', 'Distribution'], sub: 'A new chapter starts with a conversation.' },
    careers: { eyebrow: 'OPPORTUNITIES AT ARTIMEX', first: 'Grow with', second: 'us.', body: 'Passionate about craft, quality and working with a team that honors tradition? We would like to learn about your experience for future opportunities at Artimex.', link: 'Share your experience', subject: 'Careers at Artimex', note: 'Future opportunities', caption: 'Help us bring authentic Mexican bread even further.', resume: 'You can attach your résumé in your email application.', privacy: 'Read our privacy notice', photo: 'A baker’s hands shaping dough; an illustrative image of the craft.' },
    location: { eyebrow: 'FROM MEXICO TO CALIFORNIA', first: 'Closer to you.', second: 'True to our roots.', address: 'ARTIMEX BAKERY · SANTA FE SPRINGS', directions: 'Get directions', sales: 'LET’S CONNECT', contact: 'Let’s talk bread', top: 'Back to top' },
    footer: { tagline: 'The art of coming together.', concept: 'Visual concept · Illustrative imagery', rights: 'Artimex LLC' },
    contact: { eyebrow: 'THE START OF SOMETHING GOOD', title: 'Let’s talk bread.', body: 'Tell us what you have in mind. Our sales team will help you take the next step.', name: 'Your name', email: 'Email address', company: 'Company', message: 'What do you have in mind?', placeholder: 'Products, packaging options, a collaboration…', button: 'Prepare my inquiry', notice: 'Review your inquiry, then open it in your email application when you are ready.', close: 'Close contact', ready: 'Your inquiry is ready.', readyBody: 'If your email application did not open, copy your inquiry and send it to', copy: 'Copy inquiry', copied: 'Inquiry copied', emailButton: 'Open my email', required: 'Please complete all required fields.', subject: 'Product inquiry — Artimex Bakery', product: 'I would like to know about packaging options and availability for: ', draft: 'Preview your inquiry', back: 'Edit inquiry' },
  },
};

export const slides = {
  es: [
    { image: 'hero-bread', kicker: 'PAN MEXICANO · ALMA ARTESANAL', first: 'El arte de', second: 'compartir.', body: 'El sabor de nuestras raíces.\nEl placer de estar juntos.', label: 'Nuestros panes', href: '#collection' },
    { image: 'hero-conchas', kicker: 'PEQUEÑOS PLACERES · GRANDES RECUERDOS', first: 'Un dulce', second: 'reencuentro.', body: 'Conchas, café y una buena conversación.\nA veces, eso es todo.', label: 'El lado dulce', href: '#collection' },
    { image: 'hero-hands', kicker: 'TRADICIÓN MEXICANA · HECHA CON CORAZÓN', first: 'Pan con', second: 'alma.', body: 'Manos que crean. Sabores que unen.\nAsí empieza nuestra historia.', label: 'Nuestra esencia', href: '#story' },
  ],
  en: [
    { image: 'hero-bread', kicker: 'MEXICAN BREAD · ARTISAN SOUL', first: 'A taste of', second: 'home.', body: 'The flavor of our roots.\nThe joy of coming together.', label: 'Our breads', href: '#collection' },
    { image: 'hero-conchas', kicker: 'SMALL PLEASURES · BEAUTIFUL MEMORIES', first: 'A little', second: 'sweetness.', body: 'Conchas, coffee and good conversation.\nSometimes, that’s everything.', label: 'The sweet side', href: '#collection' },
    { image: 'hero-hands', kicker: 'MEXICAN TRADITION · MADE WITH HEART', first: 'Made with', second: 'heart.', body: 'Hands that create. Flavors that connect.\nThis is where our story begins.', label: 'Our essence', href: '#story' },
  ],
};

export const products = {
  es: [
    { id: 'conchas', name: 'Conchas', type: 'sweet', kind: 'DULCES RECUERDOS', description: 'La concha es un clásico de la panadería mexicana. Su cubierta dibuja una delicada concha de azúcar sobre un pan suave. Un favorito para acompañar el café y compartir en la mesa.', varieties: ['Chocolate', 'Blanca', 'Amarilla', 'Rosa'], image: 'product-conchas' },
    { id: 'bolillos', name: 'Bolillos', type: 'savory', kind: 'EL PAN DE CADA DÍA', description: 'Una corteza dorada y un interior suave. Bolillos y teleras forman parte de la mesa mexicana y son la base de muchos de sus encuentros más sabrosos.', varieties: ['Bolillo', 'Telera', 'Francés bolillo relleno', 'Bolillo integral'], image: 'product-bolillos' },
    { id: 'empanadas', name: 'Empanadas', type: 'sweet', kind: 'UN CORAZÓN DULCE', description: 'Un delicado pan dulce que envuelve un relleno de fruta. Su forma de media luna y su borde característico hacen de la empanada un pequeño placer para compartir.', varieties: ['Selección de rellenos de fruta'], image: 'product-empanadas' },
  ],
  en: [
    { id: 'conchas', name: 'Conchas', type: 'sweet', kind: 'SWEET MEMORIES', description: 'A classic of Mexican baking. A delicate shell of sugar rests on soft bread, making the concha a favorite to enjoy over coffee and around the table.', varieties: ['Chocolate', 'White', 'Yellow', 'Pink'], image: 'product-conchas' },
    { id: 'bolillos', name: 'Bolillos', type: 'savory', kind: 'OUR EVERYDAY BREAD', description: 'A golden crust and a soft center. Bolillos and teleras have a place at the Mexican table, bringing people together over some of its most delicious meals.', varieties: ['Bolillo', 'Telera', 'French stuffed bolillo', 'Whole wheat bolillo'], image: 'product-bolillos' },
    { id: 'empanadas', name: 'Empanadas', type: 'sweet', kind: 'A SWEET HEART', description: 'A delicately sweet bread wrapped around a fruit filling. Its familiar crescent shape and crimped edges make the empanada a little pleasure to share.', varieties: ['A selection of fruit fillings'], image: 'product-empanadas' },
  ],
};

export const extraFamilies = ['Pan fino', 'Danés', 'Feite', 'Polvorones', 'Puerquitos', 'Galletas', 'Guayabas', 'Pan de huevo'];
