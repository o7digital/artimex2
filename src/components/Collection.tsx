import { useRef, useState } from 'react';
import { copy, extraFamilies, products, type Locale } from '../data/content';

function Arrow() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>; }
function Close() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg>; }

export default function Collection({ locale }: { locale: Locale }) {
  const t = copy[locale].collection;
  const items = products[locale];
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const product = items[selected];
  const openProduct = (i: number, button: HTMLButtonElement) => {
    setSelected(i); trigger.current = button;
    dialog.current?.showModal(); document.body.classList.add('dialog-open');
  };
  const onClose = () => { if (!document.querySelector('dialog[open]')) { document.body.classList.remove('dialog-open'); trigger.current?.focus(); } };
  const enquire = () => {
    dialog.current?.close();
    window.dispatchEvent(new CustomEvent('artimex:contact', { detail: { product: product.name } }));
  };

  return <div className="collection-content">
    <div className="collection-toolbar">
      <div className="collection-filters" role="group" aria-label={locale === 'es' ? 'Filtrar panes' : 'Filter breads'}>
        {[['all', t.all], ['sweet', t.sweet], ['savory', t.savory]].map(([id, name]) => <button key={id} onClick={() => setFilter(id)} aria-pressed={filter === id} className={filter === id ? 'is-active' : ''}>{name}</button>)}
      </div>
      <span className="collection-small-note">ARTISAN MEXICAN BAKERY</span>
    </div>
    <div className="product-grid">
      {items.map((item, i) => <article key={item.id} className="product-card" hidden={filter !== 'all' && item.type !== filter}>
        <button className="product-image-button" onClick={(event) => openProduct(i, event.currentTarget)} aria-label={`${t.view} ${item.name}`}>
          <img src={item.image} srcSet={`${item.thumbnail} 375w, ${item.image} 750w`} sizes="(max-width: 700px) 86vw, (max-width: 1000px) 29vw, 28vw" alt={item.name} width="750" height="450" loading="lazy" decoding="async" />
          <span className="product-view"><span>{t.details}</span><Arrow /></span>
          <span className="product-index">{String(i + 1).padStart(2, '0')}</span>
        </button>
        <div className="product-info"><div><p className="eyebrow">{item.kind}</p><h3>{item.name}</h3></div><button className="product-arrow" onClick={(event) => openProduct(i, event.currentTarget)} aria-label={`${t.view} ${item.name}`}><Arrow /></button></div>
      </article>)}
    </div>
    <div className="more-collection"><button className="text-link" aria-expanded={expanded} aria-controls="extra-families" onClick={() => setExpanded(!expanded)}>{expanded ? t.less : t.more}<span className={expanded ? 'extra-plus is-open' : 'extra-plus'}>+</span></button></div>
    <div className="extra-families" id="extra-families" hidden={!expanded}>
      <h3>{t.extra}</h3><div className="family-list">{extraFamilies.map((name, i) => <button key={name} onClick={() => window.dispatchEvent(new CustomEvent('artimex:bread', { detail: { product: name } }))}>{name}<Arrow /><span>{String(i + 4).padStart(2, '0')}</span></button>)}</div>
    </div>
    <dialog className="product-dialog" ref={dialog} onClose={onClose} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button className="dialog-close" aria-label={t.close} onClick={() => dialog.current?.close()}><Close /></button>
      <div className="product-dialog-image"><img src={product.image} alt={product.name} width="750" height="450" /></div>
      <div className="product-dialog-copy"><p className="eyebrow">{product.kind}</p><h2>{product.name}</h2><p>{product.description}</p><p className="product-contact-note">{t.contact}</p><button className="button button-dark" onClick={enquire}>{t.enquire}<Arrow /></button></div>
    </dialog>
  </div>;
}
