import { storyContent } from './story';

export type Locale = 'es' | 'en';

export const brand = {
  name: 'Artimex Bakery',
  email: 'sales@artimex.com',
  phone: '+1 562 777 0924',
  phoneHref: 'tel:+15627770924',
  fax: '562-777-9607',
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

const breadPhotos = [
  { id: "concha-chocolate", name: "Concha Chocolate", type: "sweet", image: "/fotos/concha chocolate.jpg", description: { es: "Concha con cubierta de chocolate.", en: "Concha with a chocolate topping." } },
  { id: "concha-blanca", name: "Concha blanca", type: "sweet", image: "/fotos/El Gallo Giro Mexican_concha_white.jpg", description: { es: "Concha con cubierta blanca de azúcar.", en: "Concha with a white sugar topping." } },
  { id: "concha-mocha", name: "Concha mocha", type: "sweet", image: "/fotos/El Gallo Giro Mexican_Concha_mocha.jpg", description: { es: "Concha mocha para acompañar tu café.", en: "A mocha concha to enjoy with your coffee." } },
  { id: "mantecadas", name: "Mantecadas", type: "sweet", image: "/fotos/mantecadas.jpg", description: { es: "Mantecadas para acompañar el café o compartir en la mesa.", en: "Mantecadas to enjoy with coffee or share around the table." } },
  { id: "concha-fresa", name: "Concha de fresa", type: "sweet", image: "/fotos/El Gallo Giro Mexican_Concha_strawberry.jpg", description: { es: "Concha de fresa para un momento dulce.", en: "A strawberry concha for a sweet moment." } },
  { id: "puerquitos", name: "Puerquitos", type: "sweet", image: "/fotos/El Gallo Giro Mexican_Puerquitos.jpg", description: { es: "Un favorito de la panadería mexicana en forma de puerquito.", en: "A Mexican bakery favorite shaped like a little pig." } },
  { id: "bigote-danes", name: "Bigote danés", type: "sweet", image: "/fotos/El Gallo Giro Mexican_Bigote-Danes.jpg", description: { es: "Pan dulce danés en su característica forma de bigote.", en: "A Danish sweet pastry with its distinctive mustache shape." } },
  { id: "cuerno-danes", name: "Cuerno danés", type: "sweet", image: "/fotos/El Gallo Giro Mexican_Cuerno-Danes.jpg", description: { es: "Pan dulce danés en forma de cuerno.", en: "A horn-shaped Danish sweet pastry." } },
  { id: "feite-guayaba", name: "Feite de guayaba", type: "sweet", image: "/fotos/El Gallo Giro Mexican_Feite-Guayaba.jpg", description: { es: "Feite de guayaba para disfrutar y compartir.", en: "A guava feite pastry to enjoy and share." } },
] as const;

export const products = {
  es: breadPhotos.map(({ description, ...bread }) => ({ ...bread, description: description.es, kind: bread.type === 'sweet' ? 'PAN DULCE' : 'PAN SALADO' })),
  en: breadPhotos.map(({ description, ...bread }) => ({ ...bread, description: description.en, kind: bread.type === 'sweet' ? 'SWEET BREAD' : 'SAVORY BREAD' })),
};

export const extraFamilies = ['Pan fino', 'Danés', 'Feite', 'Polvorones', 'Puerquitos', 'Galletas', 'Guayabas', 'Pan de huevo'];
