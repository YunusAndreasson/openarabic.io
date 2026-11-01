// The home page's motion: pinned stages played by the scroll, and things that arrive as they reach
// the screen. All of it adds to a page that already reads without it (`.play` on the root, set in
// Base.astro, turns the played layout on). The stop maths follows qamar360's lib/play.ts.

const HOLD = 0.55;

/** Scroll (0-1) to a place between 0 and stops - 1: each stop holds still, then eases to the next. */
function placeAt(scroll: number, stops: number): number {
  const at = Math.min(0.99999, Math.max(0, scroll)) * stops;
  const stop = Math.floor(at);
  const local = at - stop;
  if (stop === stops - 1 || local <= HOLD) return stop;
  const k = (local - HOLD) / (1 - HOLD);
  return stop + k * k * (3 - 2 * k);
}

const stages = [...document.querySelectorAll<HTMLElement>('[data-stage]')];

function play() {
  const viewport = innerHeight;
  for (const stage of stages) {
    const { top, height } = stage.getBoundingClientRect();
    if (top > viewport || top + height < 0) continue;
    const t = placeAt(-top / (height - viewport), Number(stage.dataset.stops));
    stage.style.setProperty('--t', t.toFixed(4));
    stage.dataset.stop = String(Math.round(t));
  }
}

if (document.documentElement.classList.contains('play')) {
  let queued = false;
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      play();
    });
  };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);
  play();

  const arrive = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        arrive.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -12% 0px' },
  );
  for (const element of document.querySelectorAll('.reveal, .develop')) arrive.observe(element);
}
