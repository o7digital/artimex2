// Editorial selection for the development storefront, independent of private recipes.
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
export function catalogCandidate(item, scope = 'bakery') {
  if (!item.is_report_item) return null;
  const name = normalize(item.name);
  let category = 'pastries', image = '/favicon.svg', illustrative = false;
  const photo = path => { image = path; illustrative = true; };
  if (/^(concha|conchita|conchas)\b|^w\.w white mini concha\b/.test(name)) {
    category = 'conchas';
    const flavor = /chocolat/.test(name) ? 'chocolate' : /mocha/.test(name) ? 'mocha' : /rosa|red/.test(name) ? 'fresa' : 'blanca';
    photo(`/images/breads/concha-${flavor}-750.webp`);
  } else if (/^danes\b/.test(name)) photo(`/images/breads/${/bigote/.test(name) ? 'bigote' : 'cuerno'}-danes-750.webp`);
  else if (/^feite\b/.test(name)) { if (/guayaba/.test(name)) photo('/images/breads/feite-guayaba-750.webp'); }
  else if (/^(galletas|polvoron)\b/.test(name)) { /* Use neutral branding until a product photo is supplied. */ }
  else if (/^huevo ninos\b|^nino envuelto\b/.test(name)) photo('/images/breads/nino-envuelto-750.webp');
  else if (/^fino\b/.test(name)) photo(`/images/breads/${/elote/.test(name) ? 'elote-fino' : 'pan-relleno'}-750.webp`);
  else if (/^mantecadas\b/.test(name)) photo('/images/breads/mantecadas-750.webp');
  else if (/^puerquitos\b/.test(name)) photo('/images/breads/puerquitos-750.webp');
  else if (/^empanadas?\b|^(chicken|beef) empanadas\b/.test(name)) { category = /tuna|atun|shrimp|camaron|spinach|chicken|beef/.test(name) ? 'savory' : 'pastries'; photo('/images/product-empanadas.webp'); }
  else if (/^bolillo malta\b|^frances baked telera\b/.test(name)) { category = 'savory'; photo('/images/product-bolillos.webp'); }
  else if (scope === 'all-food' && /^(tamal |guisado |salsa |marinado |adobo |pasta chile |champurrado |frijol |jamaica |cafe olla |dressing empanadas |te canela |maiz pozolero |menudo |artimex masa salada|pork head cheese sliced |panela cheese (sliced|for chilaquiles))/.test(name)) category = 'savory';
  else return null;
  return { item, category, image_url: `https://www.artimexbakery.com${image}`, image_illustrative: illustrative };
}
