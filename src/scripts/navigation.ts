import { motion } from '../config/motion';

let dispose: (() => void) | undefined;

/** One viewport band for the shared desktop/mobile section links; no scroll listener. */
export function initNavigation() {
  dispose?.();
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-section-link]'));
  const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section'));
  const sectionId = (section: HTMLElement) => (section.matches('.hero') ? 'top' : section.id);
  const nav = document.querySelector<HTMLElement>('.desktop-nav');
  const spotlight = nav?.querySelector<HTMLElement>('.nav-spotlight');
  const visible = new Set<HTMLElement>();
  const signal = new AbortController();
  let observer: IntersectionObserver | undefined;
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  let anchorTimer: ReturnType<typeof setTimeout> | undefined;
  let pendingAnchor: string | undefined;
  let activeId: string | undefined;
  let placementFrame = 0;
  let readyFrame = 0;

  const positionSpotlight = (snap = false) => {
    const active = nav?.querySelector<HTMLElement>('[aria-current="location"]');
    if (!spotlight || !nav) return;
    if (!active || !nav.offsetWidth) {
      spotlight.dataset.visible = 'false';
      spotlight.dataset.ready = 'false';
      return;
    }
    // Geometry is read only on selection, font readiness and resize, never per scroll frame.
    const x = active.offsetLeft + active.offsetWidth / 2 - spotlight.offsetWidth / 2;
    if (snap || spotlight.dataset.visible !== 'true') {
      cancelAnimationFrame(placementFrame);
      cancelAnimationFrame(readyFrame);
      spotlight.dataset.ready = 'false';
      // Two finite frames establish geometry before enabling transitions. No layout flush.
      placementFrame = requestAnimationFrame(() => {
        readyFrame = requestAnimationFrame(() => {
          spotlight.dataset.ready = 'true';
        });
      });
    }
    spotlight.style.setProperty('--spotlight-x', `${x}px`);
    spotlight.dataset.visible = 'true';
  };
  const select = (id: string) => {
    if (activeId === id) return;
    activeId = id;
    for (const link of links) {
      if (link.hash === `#${id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    positionSpotlight();
  };
  const updateFromViewport = () => {
    clearTimeout(settleTimer);
    if (pendingAnchor) {
      // Home's hero can already intersect above About before an upward anchor scroll starts.
      // Keep its selection locked until the document reaches the actual top.
      const arrived =
        pendingAnchor === 'top'
          ? window.scrollY <= 2
          : Array.from(visible).some((section) => sectionId(section) === pendingAnchor);
      if (arrived) {
        pendingAnchor = undefined;
        clearTimeout(anchorTimer);
      } else return;
    }
    const current = sections.filter((section) => visible.has(section)).at(-1);
    if (current)
      settleTimer = setTimeout(() => select(sectionId(current)), motion.navigation.settle);
  };
  const releaseAnchor = () => {
    if (!pendingAnchor) return;
    pendingAnchor = undefined;
    clearTimeout(anchorTimer);
    updateFromViewport();
  };
  const followAnchor = (id: string) => {
    clearTimeout(settleTimer);
    clearTimeout(anchorTimer);
    select(id);
    pendingAnchor = sections.some((section) => sectionId(section) === id) ? id : undefined;
    // Native smooth scrolling can cross other sections before reaching the clicked anchor.
    if (pendingAnchor) anchorTimer = setTimeout(releaseAnchor, motion.navigation.anchorTimeout);
  };
  followAnchor(location.hash.slice(1) || 'top');
  for (const link of links)
    link.addEventListener(
      'click',
      (event) => {
        if (
          event.button === 0 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          !event.altKey
        )
          followAnchor(link.hash.slice(1));
      },
      { signal: signal.signal },
    );
  window.addEventListener('hashchange', () => followAnchor(location.hash.slice(1) || 'top'), {
    signal: signal.signal,
  });
  for (const type of ['wheel', 'touchmove'])
    window.addEventListener(type, releaseAnchor, { passive: true, signal: signal.signal });
  window.addEventListener(
    'keydown',
    (event) => {
      if (['PageUp', 'PageDown', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key))
        releaseAnchor();
    },
    { signal: signal.signal },
  );

  const observe = () => {
    observer?.disconnect();
    visible.clear();
    const top = Math.min(140, Math.round(window.innerHeight * 0.25));
    const bottom = Math.round(window.innerHeight * 0.65);
    try {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) visible.add(entry.target as HTMLElement);
            else visible.delete(entry.target as HTMLElement);
          }
          updateFromViewport();
        },
        { rootMargin: `-${top}px 0px -${bottom}px 0px`, threshold: 0 },
      );
      sections.forEach((section) => observer?.observe(section));
    } catch {
      // Direct clicks and hash navigation still update the highlight without observers.
    }
    positionSpotlight(true);
  };
  observe();
  void document.fonts.ready.then(() => {
    if (!signal.signal.aborted) positionSpotlight(true);
  });
  document.fonts.addEventListener('loadingdone', () => positionSpotlight(true), {
    signal: signal.signal,
  });
  const geometry = new ResizeObserver(() => positionSpotlight(true));
  if (nav) geometry.observe(nav);
  window.addEventListener(
    'resize',
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(observe, motion.navigation.resize);
    },
    { signal: signal.signal },
  );
  dispose = () => {
    signal.abort();
    observer?.disconnect();
    geometry.disconnect();
    cancelAnimationFrame(placementFrame);
    cancelAnimationFrame(readyFrame);
    clearTimeout(resizeTimer);
    clearTimeout(settleTimer);
    clearTimeout(anchorTimer);
  };
}

window.addEventListener('pagehide', () => dispose?.());
window.addEventListener('pageshow', (event) => {
  if (event.persisted) initNavigation();
});
