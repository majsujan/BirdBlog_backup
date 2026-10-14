/* BirdBlog flight prototype: edit CONFIG below to fine-tune the O position. */
(() => {
  'use strict';
  const CONFIG = {
    logoSelector: '.site-title', // existing logo wrapper; change if needed
    headerSelector: 'header',
    homeX: 0.18, // fraction of logo width: centre of the O
    homeY: 0.50, // fraction of logo height
    birdSize: 34,
    flightMs: 6000,
    pauseMs: 4000,
    startDelayMs: 1800
  };
  function init() {
    const logo = document.querySelector(CONFIG.logoSelector);
    const header = document.querySelector(CONFIG.headerSelector);
    if (!logo || !header) { console.warn('[BirdBlog] Logo/header not found; update selectors in bird-animation.js'); return; }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const bird = document.createElement('img');
    bird.id = 'bb-flight-bird'; bird.alt = ''; bird.setAttribute('aria-hidden', 'true');
    bird.src = new URL('bird-flight.svg', document.currentScript?.src || location.href).href;
    bird.style.setProperty('--bb-bird-size', `${CONFIG.birdSize}px`);
    document.body.appendChild(bird);
    const home = () => {
      const r = logo.getBoundingClientRect();
      return {x:r.left + r.width * CONFIG.homeX, y:r.top + r.height * CONFIG.homeY};
    };
    const cubic = (a,b,c,d,t) => (1-t)**3*a + 3*(1-t)**2*t*b + 3*(1-t)*t*t*c + t**3*d;
    let start = null, last = null, frame = 0;
    function position(t) {
      const p = home(), h = header.getBoundingClientRect();
      const reach = Math.min(Math.max(h.width * .48, 100), 440);
      const peak = Math.min(Math.max(h.height * .75, 60), 150);
      const x1 = Math.min(innerWidth - 24, p.x + reach);
      const y1 = Math.max(18, p.y - peak);
      // Two joined Bezier arcs: outwards/upwards, then back to the O.
      if (t < .5) {
        const u=t*2;
        return {x:cubic(p.x,p.x+reach*.1,x1-reach*.2,x1,u),
                y:cubic(p.y,p.y-peak*1.4,y1-peak*.2,y1,u)};
      }
      const u=(t-.5)*2;
      return {x:cubic(x1,x1-reach*.15,p.x+reach*.12,p.x,u),
              y:cubic(y1,y1+peak*.15,p.y-peak*.8,p.y,u)};
    }
    function tick(now) {
      if (start === null) start=now;
      const elapsed = (now-start) % (CONFIG.flightMs + CONFIG.pauseMs);
      if (elapsed < CONFIG.flightMs) {
        const t=elapsed/CONFIG.flightMs;
        const p=position(t), next=position(Math.min(t+.002,1));
        // Modest banking only; avoid spinning the bird at the turnaround.
        const angle=Math.max(-22,Math.min(22,Math.atan2(next.y-p.y,next.x-p.x)*180/Math.PI*.2));
        bird.classList.add('bb-visible');
        bird.style.transform=`translate(${p.x-CONFIG.birdSize/2}px,${p.y-CONFIG.birdSize/2}px) rotate(${angle}deg)`;
      } else {
        const p=home();
        bird.style.transform=`translate(${p.x-CONFIG.birdSize/2}px,${p.y-CONFIG.birdSize/2}px)`;
        bird.classList.remove('bb-visible');
      }
      last=now; frame=requestAnimationFrame(tick);
    }
    let delay=setTimeout(()=>{frame=requestAnimationFrame(tick);},CONFIG.startDelayMs);
    document.addEventListener('visibilitychange',()=>{
      if(document.hidden){cancelAnimationFrame(frame);clearTimeout(delay);}
      else {start=null;frame=requestAnimationFrame(tick);}
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
