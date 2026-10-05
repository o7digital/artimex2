const storageKey = 'artimex-language-position';
const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-language-link]'));
const sections = Array.from(document.querySelectorAll<HTMLElement>('main section[id], #site-footer'));
const readingOffset = () => (document.querySelector('header')?.getBoundingClientRect().bottom || 0) + 24;

// Use the section being read, even when the URL still points to an earlier section.
const currentPosition = (link?: HTMLAnchorElement) => {
  const offset = readingOffset();
  const section = link?.closest<HTMLElement>('#site-footer') || [...sections].reverse().find(element => element.getBoundingClientRect().top <= offset);
  return {
    section: section?.id || 'top',
    progress: section ? Math.max(0, Math.min(1, (offset - section.getBoundingClientRect().top) / section.offsetHeight)) : 0,
  };
};

const updateLinks = () => {
  links.forEach(link => {
    const { section } = currentPosition(link);
    const url = new URL(link.href);
    url.hash = section === 'top' ? '' : section;
    link.href = url.href;
  });
};

let scheduled = false;
window.addEventListener('scroll', () => {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; updateLinks(); });
}, { passive: true });
window.addEventListener('resize', updateLinks);
window.addEventListener('hashchange', updateLinks);
updateLinks();

links.forEach(link => link.addEventListener('click', event => {
  updateLinks();
  if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
  // The hash also keeps the right section when opening the language in a new tab.
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({ destination: link.href, ...currentPosition(link) }));
  } catch { /* Anchor navigation still works when browser storage is unavailable. */ }
}));

const restorePosition = async () => {
  let saved: { destination: string; section: string; progress: number };
  try {
    const value = sessionStorage.getItem(storageKey);
    sessionStorage.removeItem(storageKey);
    if (!value) return;
    saved = JSON.parse(value);
  } catch { return; }
  if (saved.destination !== location.href || !Number.isFinite(saved.progress)) return;
  const section = document.getElementById(saved.section);
  if (!section) return;
  await document.fonts.ready;
  requestAnimationFrame(() => {
    const top = window.scrollY + section.getBoundingClientRect().top;
    window.scrollTo({ top: Math.max(0, top + saved.progress * section.offsetHeight - readingOffset()), behavior: 'instant' });
    updateLinks();
  });
};

if (document.readyState === 'complete') void restorePosition();
else window.addEventListener('load', () => { void restorePosition(); }, { once: true });
