(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Navegación ---------- */
  const ICONS = {
    inicio: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
    introduccion: 'M4 5h6a2 2 0 012 2v12a2 2 0 00-2-2H4zM20 5h-6a2 2 0 00-2 2v12a2 2 0 012-2h6z',
    mapa: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
    descriptiva: 'M5 20V10M12 20V4M19 20v-8',
    inferencial: 'M18 5H6l6 7-6 7h12',
    regresion: 'M3 17l6-6 4 4 8-9M15 6h6v6',
    ml: 'M7 7h10v10H7zM10 3v4M14 3v4M10 17v4M14 17v4M3 10h4M3 14h4M17 10h4M17 14h4',
    mas: 'M5 12h.01M12 12h.01M19 12h.01'
  };
  const links = $$('[data-route]');
  const views = { inicio: 1, introduccion: 1 };
  const side = $('#side'), burger = $('#burger');
  const moreBtn = $('#more-btn'), moreList = $('#more-list');
  const icon = p => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${p}"/></svg>`;
  links.forEach(a => { const p = ICONS[a.dataset.route]; if (p) a.insertAdjacentHTML('afterbegin', icon(p)); });
  moreBtn.insertAdjacentHTML('afterbegin', icon(ICONS.mas));

  const setMore = o => { moreList.hidden = !o; moreBtn.setAttribute('aria-expanded', o); };
  const setSide = o => { side.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); };

  function route() {
    const id = (location.hash || '#inicio').slice(1);
    const link = links.find(a => a.dataset.route === id);
    const known = id in views;
    $$('.view').forEach(v => (v.hidden = true));
    document.getElementById(known ? id : 'construccion').hidden = false;
    if (!known) $('#c-nombre').textContent = link ? link.textContent.trim() : 'Esta sección';
    links.forEach(a => a.removeAttribute('aria-current'));
    if (link) link.setAttribute('aria-current', 'page');
    moreBtn.classList.toggle('on', !!link && moreList.contains(link));
    if (link && moreList.contains(link)) setMore(true);
    setSide(false);
    window.scrollTo({ top: 0, behavior: 'instant' });
    watch();
  }
  window.addEventListener('hashchange', route);
  burger.addEventListener('click', () => setSide(!side.classList.contains('open')));
  moreBtn.addEventListener('click', () => setMore(moreList.hidden));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setSide(false); });
  $$('[data-go]').forEach(b => b.addEventListener('click', () =>
    document.getElementById(b.dataset.go).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' })));

  /* ---------- Diálogos ---------- */
  const aviso = $('#aviso'), fuentes = $('#fuentes');
  try { if (!sessionStorage.getItem('aviso') && aviso.showModal) aviso.showModal(); } catch (e) {}
  $('#aviso-ok').addEventListener('click', () => { aviso.close(); try { sessionStorage.setItem('aviso', '1'); } catch (e) {} });
  $('#ver-fuentes').addEventListener('click', () => fuentes.showModal());
  $('#fuentes-ok').addEventListener('click', () => fuentes.close());

  /* ---------- Revelado al hacer scroll + progreso ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('on');
    if (e.target.id === 'mapa-box') e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: .15 });
  function watch() { $$('.rv:not(.on), #mapa-box:not(.in)').forEach(el => io.observe(el)); }
  const prog = $('#prog');
  addEventListener('scroll', () => {
    const h = document.documentElement;
    prog.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`;
  }, { passive: true });

  /* ---------- Hero: título por palabras, paralaje y luz ---------- */
  const h1 = $('#titulo');
  h1.setAttribute('aria-label', h1.textContent);
  h1.innerHTML = h1.textContent.split(' ').map((w, i) =>
    `<span class="w" aria-hidden="true"><span style="--i:${i}">${w}</span></span>`).join(' ');
  const hero = $('#hero'), bg = $('#bg');
  hero.addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    hero.style.setProperty('--mx', e.clientX - r.left + 'px');
    hero.style.setProperty('--my', e.clientY - r.top + 'px');
    if (!reduce) bg.style.transform = `translate(${-((e.clientX - r.left) / r.width - .5) * 36}px,${-((e.clientY - r.top) / r.height - .5) * 24}px)`;
  });

  /* ---------- Inclinación 3D de Misión y Visión ---------- */
  $$('.tilt').forEach(c => {
    c.addEventListener('pointermove', e => {
      if (reduce) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg) translateZ(8px)`;
    });
    c.addEventListener('pointerleave', () => (c.style.transform = ''));
  });

  /* ---------- Fondo: red de partículas ---------- */
  const cv = $('#fx'), c2 = cv.getContext('2d');
  const dpr = Math.min(devicePixelRatio || 1, 2);
  let CW, CH, dots = [], mx = -999, my = -999;
  function fit() {
    CW = innerWidth; CH = innerHeight;
    cv.width = CW * dpr; cv.height = CH * dpr; c2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(80, Math.round(CW * CH / 20000));
    dots = Array.from({ length: n }, () => ({ x: Math.random() * CW, y: Math.random() * CH, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.5 + .6 }));
  }
  function frame() {
    c2.clearRect(0, 0, CW, CH);
    for (const d of dots) {
      if (!reduce) { d.x += d.vx; d.y += d.vy; if (d.x < 0 || d.x > CW) d.vx *= -1; if (d.y < 0 || d.y > CH) d.vy *= -1; }
    }
    for (let i = 0; i < dots.length; i++) {
      const a = dots[i];
      c2.fillStyle = 'rgba(142,182,155,.55)';
      c2.beginPath(); c2.arc(a.x, a.y, a.r, 0, 6.283); c2.fill();
      for (let j = i + 1; j < dots.length; j++) {
        const b = dots[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 140) { c2.strokeStyle = `rgba(142,182,155,${(1 - d / 140) * .22})`; c2.beginPath(); c2.moveTo(a.x, a.y); c2.lineTo(b.x, b.y); c2.stroke(); }
      }
      const dm = Math.hypot(a.x - mx, a.y - my);
      if (dm < 190) { c2.strokeStyle = `rgba(218,241,222,${(1 - dm / 190) * .5})`; c2.beginPath(); c2.moveTo(a.x, a.y); c2.lineTo(mx, my); c2.stroke(); }
    }
    if (!reduce && !document.hidden) requestAnimationFrame(frame);
  }
  fit(); frame();
  addEventListener('resize', () => { fit(); if (reduce) frame(); });
  addEventListener('pointermove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reduce) frame(); });

  /* ---------- Mapa interactivo de Ecuador ---------- */
  const K = 110, LON0 = -81.2, LAT0 = 1.7;
  const P = ([lo, la]) => [(lo - LON0) * K, (LAT0 - la) * K];
  const D = a => a.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');
  const ZP = a => D(a.map(P)) + 'Z';

  // Contorno, zonas y trazados esquemáticos [lon, lat]. Reemplazar por datos reales (GeoJSON) cuando se tengan.
  const paisLL = [[-78.87,1.45],[-78.4,1.2],[-77.9,.85],[-77.5,.55],[-77,.35],[-76.2,.2],[-75.3,-.1],[-75.3,-.9],[-75.6,-1.6],[-76.4,-2.5],[-77.6,-3],[-78.2,-3.4],[-78.4,-4.1],[-78.7,-4.5],[-79,-4.95],[-79.5,-4.6],[-80.2,-4.4],[-80.45,-4.2],[-80.3,-3.55],[-79.95,-3.3],[-79.85,-2.5],[-80.3,-2.7],[-80.9,-2.2],[-80.85,-1.7],[-80.75,-1],[-80.5,-.4],[-80.05,.05],[-80.05,.55],[-79.8,.95],[-79.2,1.1]];
  const WE = [[-78.9,1.6],[-79,0],[-79.45,-1.5],[-79.6,-3],[-79.8,-5.2]];
  const EE = [[-77.7,1.6],[-77.7,0],[-78,-1.5],[-78.4,-3],[-78.6,-5.2]];
  const costa = [[-81.4,1.7], ...WE, [-81.4,-5.2]];
  const sierra = [...WE, ...[...EE].reverse()];
  const oriente = [...EE, [-74.8,-5.2], [-74.8,1.7]];
  const andes = [[-77.9,.8],[-78.1,-.4],[-78.7,-1.7],[-79,-3],[-79.3,-4.3]].map(P);
  const montes = [[-77.95,.6],[-78.5,-1],[-78.75,-1.8],[-78.9,-2.5],[-79.1,-3.2],[-79.2,-3.9]].map(P);

  const PIPES = {
    sote: {
      t: 'SOTE', s: 'Sistema de Oleoducto Transecuatoriano',
      p: 'Opera desde 1972. Lleva el crudo del Oriente hasta la costa de Esmeraldas, cruzando la cordillera de los Andes.',
      pts: [[-76.9,.08],[-77.35,-.08],[-77.9,-.46],[-78.15,-.4],[-78.5,-.3],[-78.95,-.2],[-79.17,-.25],[-79.45,.2],[-79.66,.97]].map(P),
      alts: [300,700,1900,4060,2800,3600,550,120,5],
      names: ['Lago Agrio','Lumbaqui','Baeza','Papallacta','Quito','Cordillera Occidental','Santo Domingo','Quinindé','Esmeraldas']
    },
    ocp: {
      t: 'OCP', s: 'Oleoducto de Crudos Pesados',
      p: 'Opera desde 2003. Transporta crudo pesado con un trazado propio que también termina en la costa de Esmeraldas.',
      pts: [[-76.9,.1],[-77.5,.02],[-77.95,-.35],[-78.25,-.2],[-78.55,0],[-78.9,.02],[-79.3,.35],[-79.6,.7],[-79.72,.99]].map(P)
    }
  };
  Object.values(PIPES).forEach(p => {
    p.cum = [0];
    for (let i = 1; i < p.pts.length; i++) p.cum.push(p.cum[i - 1] + Math.hypot(p.pts[i][0] - p.pts[i - 1][0], p.pts[i][1] - p.pts[i - 1][1]));
    p.total = p.cum[p.cum.length - 1];
  });
  const posAt = (p, t) => {
    const L = t * p.total; let i = 1;
    while (i < p.cum.length - 1 && p.cum[i] < L) i++;
    const f = (L - p.cum[i - 1]) / (p.cum[i] - p.cum[i - 1]);
    return { i, f, x: p.pts[i - 1][0] + (p.pts[i][0] - p.pts[i - 1][0]) * f, y: p.pts[i - 1][1] + (p.pts[i][1] - p.pts[i - 1][1]) * f };
  };

  const EST = [
    ['Lago Agrio', [-76.9,.09], 'Inicio del trazado en el Oriente amazónico, donde se reúne el crudo de la región.', 14, 'start', 4],
    ['Baeza', [-77.9,-.46], 'Comienza el ascenso fuerte hacia la cordillera oriental.', 14, 'start', 4],
    ['Papallacta', [-78.15,-.4], 'Punto más alto del recorrido, cerca de 4 060 m según el perfil esquemático.', 0, 'middle', -30],
    ['Quito', [-78.5,-.3], 'El trazado pasa cerca de la capital antes de cruzar la cordillera occidental.', -10, 'end', 26],
    ['Santo Domingo', [-79.17,-.25], 'Descenso hacia la llanura costera.', -14, 'end', 4],
    ['Esmeraldas', [-79.66,.97], 'Terminal marítimo donde el crudo se embarca hacia los mercados.', -14, 'end', 4]
  ].map(e => ({ n: e[0], xy: P(e[1]), txt: e[2], dx: e[3], an: e[4], dy: e[5] }));
  const SIDX = { 'Lago Agrio': 0, Baeza: 2, Papallacta: 3, Quito: 4, 'Santo Domingo': 6, Esmeraldas: 8 };

  const CIU = [['Guayaquil',[-79.9,-2.2]],['Cuenca',[-79,-2.9]],['Ibarra',[-78.12,.35]]].map(([n,l]) => [n, ...P(l)]);
  const grat = [];
  for (let lo = -81; lo <= -75; lo++) {
    const x = (lo - LON0) * K;
    grat.push(`<path class="grat" d="M${x},-14V762"/><text class="tick" x="${x}" y="-18" text-anchor="middle">${-lo}°O</text>`);
  }
  for (let la = 1; la >= -5; la--) {
    const y = (LAT0 - la) * K;
    grat.push(`<path class="grat" d="M-60,${y}H700"/><text class="tick" x="-20" y="${y + 3}" text-anchor="end">${Math.abs(la)}°${la > 0 ? 'N' : la < 0 ? 'S' : ''}</text>`);
  }

  $('#mapa-box').innerHTML = `
  <span class="etiqueta">Ecuador continental, vista esquemática</span>
  <div class="barrido" aria-hidden="true"></div>
  <svg viewBox="-70 -30 790 812" role="group" aria-label="Mapa esquemático de Ecuador con los trazados del SOTE y del OCP">
    <defs>
      <filter id="bl"><feGaussianBlur stdDeviation="14"/></filter>
      <pattern id="pt" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#235347" opacity=".55"/></pattern>
      <linearGradient id="oc" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#235347" stop-opacity=".5"/><stop offset="1" stop-color="#235347" stop-opacity="0"/></linearGradient>
      <clipPath id="cp"><path d="${D(paisLL.map(P))}Z"/></clipPath>
    </defs>
    <rect x="-70" y="-30" width="790" height="812" fill="url(#pt)"/>
    <rect x="-70" y="-30" width="260" height="812" fill="url(#oc)"/>
    ${grat.join('')}
    <path class="pais" pathLength="1" d="${D(paisLL.map(P))}Z"/>
    <g clip-path="url(#cp)" class="zonas">
      <path class="zona-costa" d="${ZP(costa)}"/><path class="zona-sierra" d="${ZP(sierra)}"/><path class="zona-oriente" d="${ZP(oriente)}"/>
      <path class="andes" d="${D(andes)}" filter="url(#bl)"/>
    </g>
    ${montes.map(([x, y]) => `<path class="monte" d="M${x - 11},${y + 7}l11,-17l7,10l5,-6l9,13"/>`).join('')}
    <text class="zona-t" x="72" y="352">Costa</text>
    ${CIU.map(([n, x, y]) => `<g class="ciu"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3"/><text x="${(x + 7).toFixed(1)}" y="${(y + 4).toFixed(1)}">${n}</text></g>`).join('')}
    <text class="zona-t" x="345" y="590" transform="rotate(72 345 590)">Sierra</text>
    <text class="zona-t" x="470" y="600">Oriente</text>
    <text x="42" y="170" class="mar" text-anchor="middle" transform="rotate(-90 42 170)">Océano Pacífico</text>
    <text x="300" y="30" class="mar">Colombia</text>
    <text x="520" y="725" class="mar">Perú</text>
    <g class="rosa" transform="translate(640,52)"><circle r="24"/><path d="M0,-20L6,0L0,-5L-6,0Z" class="n"/><path d="M0,20L6,0L0,5L-6,0Z"/><text y="-30" text-anchor="middle">N</text></g>
    ${Object.entries(PIPES).map(([id, p]) => `
    <g class="pipe" id="${id}" data-id="${id}">
      <path class="halo" d="${D(p.pts)}"/>
      <path class="tubo" pathLength="1" d="${D(p.pts)}"/>
      <path class="flujo" pathLength="1" d="${D(p.pts)}"/>
      <path class="hit" d="${D(p.pts)}"/>
      <circle class="gota" data-p="${id}" data-o="0" r="4.5"/><circle class="gota" data-p="${id}" data-o=".5" r="4.5"/>
    </g>`).join('')}
    ${[EST[0], EST[5]].map(e => `<circle class="onda" cx="${e.xy[0].toFixed(1)}" cy="${e.xy[1].toFixed(1)}" r="16"/>`).join('')}
    ${EST.map((e, i) => {
      const w = e.n.length * 7.4 + 16;
      const x0 = e.an === 'start' ? e.dx - 8 : e.an === 'end' ? e.dx - w + 8 : e.dx - w / 2;
      return `
    <g transform="translate(${e.xy[0].toFixed(1)},${e.xy[1].toFixed(1)})">
      <g class="est" tabindex="0" role="button" aria-label="${e.n}" data-i="${i}" style="--k:${i}">
        <circle class="anillo" r="7"/>
        <rect class="pill" x="${x0.toFixed(1)}" y="${e.dy - 14}" width="${w.toFixed(1)}" height="22" rx="11"/>
        <circle class="nodo" r="5"/>
        <text x="${e.dx}" y="${e.dy + 1}" text-anchor="${e.an}">${e.n}</text>
      </g>
    </g>`;
    }).join('')}
    <circle class="marca" id="marca" r="8"/>
  </svg>
  <ul class="leyenda"><li><i class="l sote"></i>SOTE</li><li><i class="l ocp"></i>OCP</li><li><i class="e"></i>Estación</li><li><i class="g"></i>Crudo en movimiento</li></ul>`;

  const tit = $('#p-tit'), sub = $('#p-sub'), txt = $('#p-txt');
  const modoBtns = $$('[data-modo]');
  const pipes = $$('.pipe'), ests = $$('.est');
  const swap = () => [tit, sub, txt].forEach(n => { n.classList.remove('swap'); void n.offsetWidth; n.classList.add('swap'); });

  function modo(m) {
    modoBtns.forEach(b => b.setAttribute('aria-pressed', b.dataset.modo === m));
    pipes.forEach(p => p.classList.toggle('dim', m !== 'todos' && p.dataset.id !== m));
    ests.forEach(e => e.classList.remove('sel'));
    if (m === 'todos') {
      tit.textContent = 'Dos rutas, un mismo destino'; sub.textContent = 'SOTE y OCP';
      txt.textContent = 'Ambos llevan el crudo del Oriente amazónico hasta la costa de Esmeraldas.';
    } else {
      tit.textContent = PIPES[m].t; sub.textContent = PIPES[m].s; txt.textContent = PIPES[m].p;
    }
    swap();
  }
  modoBtns.forEach(b => b.addEventListener('click', () => modo(b.dataset.modo)));
  pipes.forEach(p => p.addEventListener('click', () => modo(p.dataset.id)));

  function estacion(i) {
    ests.forEach(e => e.classList.toggle('sel', +e.dataset.i === i));
    tit.textContent = EST[i].n; sub.textContent = 'Estación del recorrido'; txt.textContent = EST[i].txt;
    swap();
    const idx = SIDX[EST[i].n];
    if (idx !== undefined) { stop(); rec.value = S.cum[idx] / S.total * 1000; mover(rec.value / 1000); }
  }
  ests.forEach(e => {
    e.addEventListener('click', () => estacion(+e.dataset.i));
    e.addEventListener('keydown', k => { if (k.key === 'Enter' || k.key === ' ') { k.preventDefault(); estacion(+e.dataset.i); } });
  });

  /* Gotas de crudo que recorren cada oleoducto */
  const gotas = $$('.gota');
  const moverGotas = now => gotas.forEach(g => {
    const q = posAt(PIPES[g.dataset.p], ((now / 11000) + +g.dataset.o) % 1);
    g.setAttribute('cx', q.x.toFixed(1)); g.setAttribute('cy', q.y.toFixed(1));
  });
  if (reduce) moverGotas(0);
  else { const bucle = now => { moverGotas(now); requestAnimationFrame(bucle); }; requestAnimationFrame(bucle); }

  /* Recorrido esquemático del SOTE + perfil de altitud sincronizado */
  const S = PIPES.sote;
  const rec = $('#rec'), marca = $('#marca'), alt = $('#alt'), lugar = $('#lugar');
  const pf = $('#perfil'), PB = 100;
  const px = S.cum.map(c => 8 + (c / S.total) * 384);
  const py = S.alts.map(a => PB - (a / 4100) * 80);
  pf.innerHTML = `<path class="pa" d="M8,${PB}${px.map((x, i) => `L${x.toFixed(1)},${py[i].toFixed(1)}`).join('')}L392,${PB}Z"/>
    <path class="pl" d="${D(px.map((x, i) => [x, py[i]]))}"/>
    <line class="pg" id="pg" y1="10" y2="${PB}"/><circle class="pm" id="pm" r="5"/>
    <text x="8" y="115">Lago Agrio</text><text x="392" y="115" text-anchor="end">Esmeraldas</text>
    <text x="${px[3].toFixed(1)}" y="${(py[3] - 7).toFixed(1)}" text-anchor="middle">Papallacta</text>`;
  const pg = $('#pg'), pm = $('#pm');
  function mover(t) {
    const q = posAt(S, t), i = q.i;
    const a = Math.round((S.alts[i - 1] + (S.alts[i] - S.alts[i - 1]) * q.f) / 10) * 10;
    marca.setAttribute('cx', q.x.toFixed(1)); marca.setAttribute('cy', q.y.toFixed(1));
    alt.textContent = `≈ ${a.toLocaleString('es-EC')} m`;
    lugar.textContent = S.names[q.f < .5 ? i - 1 : i];
    const X = 8 + t * 384, Y = PB - (a / 4100) * 80;
    pg.setAttribute('x1', X); pg.setAttribute('x2', X); pm.setAttribute('cx', X.toFixed(1)); pm.setAttribute('cy', Y.toFixed(1));
  }
  rec.addEventListener('input', () => { stop(); mover(rec.value / 1000); });
  mover(0);

  const play = $('#play');
  let raf = 0;
  function stop() { cancelAnimationFrame(raf); raf = 0; play.textContent = 'Reproducir recorrido'; }
  play.addEventListener('click', () => {
    if (raf) return stop();
    play.textContent = 'Pausar recorrido';
    if (+rec.value >= 1000) rec.value = 0;
    let last = performance.now();
    const paso = now => {
      rec.value = Math.min(1000, +rec.value + (now - last) * 0.07);
      last = now;
      mover(rec.value / 1000);
      if (+rec.value >= 1000) return stop();
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
  });

  route();
})();