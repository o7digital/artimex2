import { useEffect, useRef, useState } from 'react';
import { copy, slides, type Locale } from '../data/content';

function Arrow({ previous = false }: { previous?: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" style={previous ? { transform: 'rotate(180deg)' } : undefined}><path d="M4 12h15M13 5l7 7-7 7" /></svg>;
}

export default function Hero({ locale }: { locale: Locale }) {
  const t = copy[locale].hero;
  const scenes = slides[locale];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hidden, setHidden] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const stopped = paused || focused || reduced || hidden;
  const scene = scenes[index];
  const move = (direction: number) => setIndex((i) => (i + direction + scenes.length) % scenes.length);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    const visibility = () => setHidden(document.hidden);
    update();
    visibility();
    media.addEventListener('change', update);
    document.addEventListener('visibilitychange', visibility);
    return () => { media.removeEventListener('change', update); document.removeEventListener('visibilitychange', visibility); };
  }, []);

  useEffect(() => {
    if (stopped) return;
    const timer = window.setTimeout(() => move(1), 7500);
    return () => window.clearTimeout(timer);
  }, [index, stopped]);

  return <section className={`hero ${stopped ? 'is-paused' : ''}`} id="top" aria-label={t.label} aria-roledescription="carousel" tabIndex={0}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setFocused(false); }}
    onKeyDown={(event) => { if (event.key === 'ArrowRight') { event.preventDefault(); move(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); move(-1); } }}
    onTouchStart={(event) => { touchStart.current = { x: event.changedTouches[0].clientX, y: event.changedTouches[0].clientY }; }}
    onTouchEnd={(event) => { const start = touchStart.current; touchStart.current = null; if (!start) return; const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y; if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx > 0 ? -1 : 1); }}>
    <div className="hero-scenes" aria-hidden="true">
      {scenes.map((item, i) => <div key={item.image} className={`hero-scene ${i === index ? 'is-active' : ''}`}>
        <picture>
          <source media="(max-width: 650px)" srcSet={`/images/${item.image}-mobile.webp`} />
          <img src={`/images/${item.image}.webp`} alt="" width="1672" height="941" loading={i === 0 ? 'eager' : 'lazy'} fetchPriority={i === 0 ? 'high' : 'low'} decoding="async" />
        </picture>
      </div>)}
    </div>
    <div className="hero-shade" />
    <div className="hero-copy" key={index} aria-live={paused ? 'polite' : 'off'}>
      <p className="eyebrow hero-eyebrow"><span />{scene.kicker}</p>
      <h1>{scene.first}<br /><em>{scene.second}</em></h1>
      <p className="hero-description">{scene.body}</p>
      <a className="button button-ivory" href={scene.href}>{index === 2 ? t.story : t.explore}<Arrow /></a>
    </div>
    <a className="hero-scroll-down" href="#essence" aria-label={locale === 'es' ? 'Bajar y descubrir Artimex' : 'Scroll down to discover Artimex'}>
      <svg width="36" height="24" viewBox="0 0 28 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 4 11 10L25 4" /></svg>
    </a>
    <div className="hero-bottom">
      <a className="scroll-cue" href="#essence"><span className="scroll-line" /><span>{t.scroll}</span></a>
      <div className="scene-nav" role="group" aria-label={t.label}>
        {scenes.map((item, i) => <button key={item.image} className={`scene-tab ${i === index ? 'is-active' : ''}`} onClick={() => setIndex(i)} aria-label={`${t.scene} ${i + 1}: ${item.label}`} aria-pressed={i === index}>
          <span className="scene-number">{String(i + 1).padStart(2, '0')}</span><span className="scene-label">{item.label}</span><span className="scene-track"><span key={i === index ? `active-${index}-${stopped}` : 'idle'} /></span>
        </button>)}
      </div>
      <div className="hero-controls">
        <span className="hero-count"><span>{String(index + 1).padStart(2, '0')}</span><span className="count-divider" />03</span>
        <button className="circle-button pause-button" aria-label={paused ? t.play : t.pause} aria-pressed={paused} onClick={() => { setPaused(!paused); if (paused) setFocused(false); }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true">{paused ? <path d="m5 3 8 5-8 5Z" /> : <path d="M5 3v10M11 3v10" />}</svg>
        </button>
        <button className="circle-button" aria-label={t.previous} onClick={() => move(-1)}><Arrow previous /></button>
        <button className="circle-button" aria-label={t.next} onClick={() => move(1)}><Arrow /></button>
      </div>
    </div>
    <span className="hero-side-note" aria-hidden="true">ARTISAN MEXICAN BAKERY</span>
  </section>;
}
