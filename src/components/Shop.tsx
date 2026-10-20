import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import { type Locale } from '../data/content';
import { cartKey, cartLines, createPreviewDraft, sanitizeCart, shopProducts, type Cart, type CustomerType } from '../data/commerce';
import { shopCopy } from '../data/shopCopy';
import '../styles/shop.css';

function Arrow() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>; }
function Bag() { return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M5 7h14l1 14H4L5 7ZM8 8V6a4 4 0 0 1 8 0v2" /></svg>; }
const readCart = (type: CustomerType): Cart => { try { return sanitizeCart(JSON.parse(localStorage.getItem(cartKey(type)) || '{}')); } catch { return {}; } };

export default function Shop({ locale }: { locale: Locale }) {
  const t = shopCopy[locale];
  const [customerType, setCustomerType] = useState<CustomerType>('personal');
  const [cart, setCart] = useState<Cart>({});
  const [ready, setReady] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('pickup');
  const [draft, setDraft] = useState<ReturnType<typeof createPreviewDraft> | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const checkoutTrigger = useRef<HTMLButtonElement>(null);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const business = customerType === 'business';
  const quantityLabel = (quantity: number) => business ? (quantity === 1 ? t.caseUnit : t.cases) : (quantity === 1 ? t.item : t.items);
  const money = (cents: number) => new Intl.NumberFormat(locale === 'es' ? 'es-US' : 'en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
  const lines = cartLines(cart, customerType, locale);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);
  const units = lines.reduce((sum, line) => sum + line.quantity * line.unitsPerPack, 0);
  const subtotal = lines.reduce((sum, line) => sum + line.quantity * line.demoPriceCents, 0);
  const query = search.trim().toLocaleLowerCase(locale);
  const visibleProducts = shopProducts(locale).filter(product => (filter === 'all' || (filter === 'conchas' ? product.id.startsWith('concha-') : !product.id.startsWith('concha-'))) && `${product.name} ${product.description}`.toLocaleLowerCase(locale).includes(query));

  useEffect(() => {
    const type = new URLSearchParams(location.search).get('customer') === 'business' ? 'business' : 'personal';
    setCustomerType(type); setCart(readCart(type)); setReady(true);
    const restore = () => { const next = new URLSearchParams(location.search).get('customer') === 'business' ? 'business' : 'personal'; setCustomerType(next); setCart(readCart(next)); };
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(cartKey(customerType), JSON.stringify(cart)); } catch { /* The current cart still works when storage is unavailable. */ }
    document.querySelectorAll<HTMLAnchorElement>('[data-shop-language]').forEach(link => { const url = new URL(link.href); url.searchParams.set('customer', customerType); link.href = url.href; });
  }, [cart, customerType, ready]);
  useEffect(() => { if (draft) reviewHeading.current?.focus(); }, [draft]);

  const switchType = (type: CustomerType) => {
    if (type === customerType) return;
    setCustomerType(type); setCart(readCart(type)); setStatus('');
    const url = new URL(location.href); url.searchParams.set('customer', type); history.pushState(null, '', url);
  };
  const changeQuantity = (id: string, delta: number) => {
    setCart(current => { const next = Math.max(0, Math.min(99, (current[id] || 0) + delta)); const result = { ...current }; if (next) result[id] = next; else delete result[id]; return result; });
    setStatus('');
  };
  const openCheckout = () => { setDraft(null); setFulfillment('pickup'); dialog.current?.showModal(); document.body.classList.add('dialog-open'); };
  const closeCheckout = () => { document.body.classList.remove('dialog-open'); checkoutTrigger.current?.focus(); };
  const previewOrder = (event: SyntheticEvent<HTMLFormElement>) => { event.preventDefault(); setDraft(createPreviewDraft(cart, customerType, locale, fulfillment)); };

  return <div className="shop-experience">
    <section className="shop-intro" aria-labelledby="shop-title">
      <div><p className="eyebrow">ARTIMEX · {locale === 'es' ? 'COMPRA EN LÍNEA' : 'PURCHASE ONLINE'}</p><h1 id="shop-title">{t.title}<br /><em>{t.italic}</em></h1><p className="shop-intro-copy">{t.intro}</p></div>
      <figure><img src="/images/breads/concha-chocolate-750.webp" width="750" height="450" alt={locale === 'es' ? 'Concha de chocolate Artimex' : 'Artimex chocolate concha'} fetchPriority="high" /><figcaption>{locale === 'es' ? 'Tradición mexicana. Momentos para compartir.' : 'Mexican roots. Moments worth sharing.'}</figcaption></figure>
    </section>
    <aside className="shop-preview"><span className="preview-dot" aria-hidden="true" /><div><strong>{t.preview}</strong><p>{t.previewNote}</p></div></aside>
    <section className="shop-mode" aria-label={t.modeLabel}>
      <div className="shop-mode-buttons" role="group" aria-label={t.modeLabel}>{(['personal', 'business'] as const).map(type => <button key={type} type="button" disabled={!ready} aria-pressed={customerType === type} onClick={() => switchType(type)}>{type === 'personal' ? t.personal : t.business}<Arrow /></button>)}</div>
      <p>{business ? t.businessNote : t.personalNote}</p>
      <a className="shop-bag-shortcut" href="#shop-bag"><Bag /><span>{t.viewBag} ({count})</span></a>
    </section>
    <div className="shop-layout">
      <section className="shop-catalog" aria-labelledby="shop-catalog-title">
        <div className="shop-catalog-heading"><h2 id="shop-catalog-title">{t.catalog}</h2><label className="shop-search"><span className="sr-only">{t.search}</span><input type="search" value={search} placeholder={t.search} onChange={event => setSearch(event.target.value)} /></label></div>
        <div className="shop-filters" role="group" aria-label={t.catalog}>{[['all', t.all], ['conchas', t.conchas], ['pastries', t.pastries]].map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
        <div className="shop-products">{visibleProducts.map(product => <article className="shop-product" key={product.id}>
          <div className="shop-product-photo"><img src={product.image} srcSet={`${product.thumbnail} 375w, ${product.image} 750w`} sizes="(max-width:700px) 43vw, (max-width:1100px) 42vw, 27vw" alt={product.name} width="750" height="450" loading="lazy" /><span className="eyebrow">{business ? '12 / ' + (locale === 'es' ? 'CARTÓN' : 'CASE') : 'PAN DULCE'}</span></div>
          <div className="shop-product-copy"><h3>{product.name}</h3><p className="shop-product-description">{product.description}</p><div className="shop-product-price"><strong>{business ? t.accountPrice : money(product.demoPriceCents)}</strong><span>{business ? t.case : t.piece}</span></div>
          <button className="shop-add" type="button" disabled={!ready || (cart[product.id] || 0) >= 99} onClick={() => { changeQuantity(product.id, 1); setStatus(`${product.name}: ${t.added}`); }} aria-label={`${business ? t.addCase : t.add}: ${product.name}`}>{business ? t.addCase : t.add}<span aria-hidden="true">+</span></button></div>
        </article>)}</div>
        {!visibleProducts.length && <div className="shop-no-results"><p>{t.noResults}</p><button className="text-link" onClick={() => { setSearch(''); setFilter('all'); }}>{t.reset}</button></div>}
        <p className="sr-only" role="status">{status}</p>
      </section>
      <aside className="shop-bag" id="shop-bag" aria-labelledby="shop-bag-title">
        <div className="shop-bag-heading"><Bag /><h2 id="shop-bag-title">{t.bag}</h2><span className="shop-count" aria-live="polite" aria-atomic="true">{count} {quantityLabel(count)}</span></div>
        {!count ? <div className="shop-empty"><span aria-hidden="true">✳</span><h3>{t.empty}</h3><p>{t.emptyNote}</p></div> : <>
          <ul className="shop-cart-lines">{lines.map(line => <li key={line.id}>
            <img src={line.thumbnail} alt="" width="68" height="55" /><div className="shop-cart-line"><h3>{line.name}</h3><p>{business ? t.case : money(line.demoPriceCents * line.quantity)}</p><div className="shop-quantity"><button type="button" aria-label={`${t.decrease} ${line.name}`} onClick={() => changeQuantity(line.id, -1)}>−</button><output aria-label={line.name}>{line.quantity}</output><button type="button" aria-label={`${t.increase} ${line.name}`} disabled={line.quantity >= 99} onClick={() => changeQuantity(line.id, 1)}>+</button><button className="shop-remove" type="button" aria-label={`${t.remove} ${line.name}`} onClick={() => setCart(current => { const result = { ...current }; delete result[line.id]; return result; })}>{t.remove}</button></div></div>
          </li>)}</ul>
          <div className="shop-cart-summary"><div><span>{business ? t.accountPrice : t.subtotal}</span><strong>{business ? t.quote : money(subtotal)}</strong></div>{business && <p>{units} {t.units}</p>}<p>{business ? t.businessTotalNote : t.totalNote}</p></div>
          <button ref={checkoutTrigger} className="button button-dark shop-checkout" type="button" onClick={openCheckout}>{t.review}<Arrow /></button>
          <button className="shop-clear" type="button" onClick={() => { setCart({}); setStatus(''); }}>{t.clear}</button>
        </>}
      </aside>
    </div>
    <dialog ref={dialog} className="shop-dialog" aria-labelledby="shop-checkout-title" onClose={closeCheckout} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button type="button" className="shop-dialog-close" aria-label={t.close} onClick={() => dialog.current?.close()}>×</button>
      {draft ? <div className="shop-preview-result"><p className="eyebrow">{t.preview}</p><h2 id="shop-checkout-title" ref={reviewHeading} tabIndex={-1}>{t.complete}</h2><p>{t.completeNote}</p><h3>{t.reviewTitle}</h3><ul>{lines.map(line => <li key={line.id}><span>{line.name}</span><span>{line.quantity} {quantityLabel(line.quantity)}</span></li>)}</ul><dl><div><dt>{t.fulfillment}</dt><dd>{fulfillment === 'pickup' ? t.pickup : t.delivery}</dd></div><div><dt>{business ? t.accountPrice : t.subtotal}</dt><dd>{business ? t.quote : money(subtotal)}</dd></div><div><dt>{t.payment}</dt><dd>{t.unavailable}</dd></div></dl><button className="button button-dark" onClick={() => dialog.current?.close()}>{t.next}<Arrow /></button></div> : <>
        <p className="eyebrow">{business ? t.business : t.personal} · {t.preview}</p><h2 id="shop-checkout-title">{t.review}</h2><p className="shop-checkout-intro">{t.checkoutIntro}</p>
        <form className="shop-checkout-form" onSubmit={previewOrder}>
          <div className="shop-form-row"><label>{t.name}<input name="name" autoComplete="off" placeholder="Alex Rivera" required maxLength={120} /></label><label>{t.email}<input name="email" type="email" autoComplete="off" placeholder="alex@example.com" required maxLength={254} /></label></div>
          {business && <div className="shop-form-row"><label>{t.company}<input name="company" placeholder="Café Example" required maxLength={160} /></label><label>{t.account}<input name="account" placeholder="ART-0000" maxLength={80} /></label></div>}
          <fieldset><legend>{t.fulfillment}</legend><div className="shop-fulfillment">{(['pickup', 'delivery'] as const).map(value => <label key={value}><input type="radio" name="fulfillment" value={value} checked={fulfillment === value} onChange={() => setFulfillment(value)} />{value === 'pickup' ? t.pickup : t.delivery}</label>)}</div></fieldset>
          {fulfillment === 'delivery' && <label>{t.address}<textarea name="address" required maxLength={500} rows={2} /></label>}
          <label>{t.note}<textarea name="notes" rows={2} maxLength={1000} /></label>
          <div className="shop-form-total"><span>{count} {quantityLabel(count)}</span><strong>{business ? t.quote : `${t.subtotal}: ${money(subtotal)}`}</strong></div>
          <p className="shop-form-note">{business ? t.businessTotalNote : t.totalNote}</p>
          <button className="button button-dark" type="submit">{t.submit}<Arrow /></button><button type="button" className="shop-form-back" onClick={() => dialog.current?.close()}>{t.back}</button>
        </form>
      </>}
    </dialog>
  </div>;
}
