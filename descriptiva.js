(() => {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = window.DATOS, N = D.N, T = D.tramos;
  const fmt = n => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f');
  const dec = (x, d = 1) => x.toFixed(d).replace('.', ',');
  const pad = n => String(n).padStart(5, '0');
  const COL = ['#DAF1DE', '#C3E3CB', '#ACD5B8', '#95C6A4', '#7DB08F', '#5F9A7A', '#478265', '#336B52'];

  /* Organización de los 10 000 puntos: agrupados por tramo (cada tramo ocupa un rango contiguo) */
  const porTramo = T.map(() => []);
  for (let i = 0; i < N; i++) porTramo[+D.mapa[i]].push(i + 1);
  const orden = porTramo.flat();
  const kDeId = new Int32Array(N + 1);
  orden.forEach((id, k) => (kDeId[id] = k));
  const ini = [], fin = [];
  let acc = 0;
  T.forEach((t, i) => { ini[i] = acc; acc += porTramo[i].length; fin[i] = acc; });
  const tramoDeK = k => ini.findIndex((a, i) => k >= a && k < fin[i]);

  const mk = cv => ({ cv, reveal: 0, filtro: 'todos', hover: -1, sel: -1, modo: null, muestra: null, raf: 0, t0: 0 });
  const A = mk($('#pob')), B = mk($('#mue'));
  A.sel = kDeId[248];

  function pintar(st, now) {
    const cv = st.cv, ctx = cv.getContext('2d'), W = cv.width, P = W / 100;
    ctx.clearRect(0, 0, W, W);
    const lim = Math.floor(st.reveal * N);
    const pulso = st.modo === 'pob' ? 1 + .28 * Math.sin(now / 260) : 1;
    const r = P * .32 * pulso;
    const dibuja = (t, flag) => {
      const a = ini[t], b = Math.min(fin[t], lim);
      ctx.beginPath();
      for (let k = a; k < b; k++) {
        if (st.muestra && (st.muestra[k] === 1) !== flag) continue;
        const x = (k % 100 + .5) * P, y = (Math.floor(k / 100) + .5) * P;
        ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.2832);
      }
      ctx.fill();
    };
    T.forEach((tr, t) => {
      const fuera = st.filtro !== 'todos' && tr.o !== st.filtro;
      ctx.fillStyle = COL[t];
      ctx.globalAlpha = fuera ? .1 : st.muestra ? .3 : .9;
      dibuja(t, false);
    });
    if (st.muestra) {
      ctx.fillStyle = '#ffffff'; ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 8; ctx.globalAlpha = 1;
      T.forEach((tr, t) => { if (st.filtro === 'todos' || tr.o === st.filtro) dibuja(t, true); });
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
    const anillo = (k, rad, grueso) => {
      if (k < 0 || k >= lim) return;
      const x = (k % 100 + .5) * P, y = (Math.floor(k / 100) + .5) * P;
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = grueso;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 6.2832); ctx.stroke();
      return [x, y];
    };
    if (st === A) {
      if (st.modo === 'ind') {
        const c = anillo(st.sel, P * (1.8 + .5 * Math.sin(now / 200)), 2);
        if (c) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0], 0); ctx.lineTo(c[0], W); ctx.moveTo(0, c[1]); ctx.lineTo(W, c[1]); ctx.stroke(); }
      }
      if (st.hover >= 0) anillo(st.hover, P * 1.5, 2);
      else if (st.sel >= 0 && st.modo !== 'ind') anillo(st.sel, P * 1.3, 1.5);
    }
  }

  function pedir(st) {
    if (st.raf) return;
    st.raf = requestAnimationFrame(now => {
      st.raf = 0;
      if (st.reveal < 1) st.reveal = reduce ? 1 : Math.min(1, (now - st.t0) / 2200);
      pintar(st, now);
      if (st.reveal < 1 || st.modo) pedir(st);
    });
  }
  [A, B].forEach(st => {
    st.t0 = performance.now(); pintar(st, 0);
    new IntersectionObserver((es, ob) => es.forEach(e => {
      if (e.isIntersecting) { st.t0 = performance.now(); st.reveal = reduce ? 1 : 0.001; pedir(st); ob.disconnect(); }
    }), { threshold: .2 }).observe(st.cv);
  });

  /* Población: interacción con el lienzo */
  const info = $('#pob-info'), infoIni = info.textContent;
  const kDe = (e, st) => {
    const r = st.cv.getBoundingClientRect();
    const c = Math.floor((e.clientX - r.left) / r.width * 100), f = Math.floor((e.clientY - r.top) / r.height * 100);
    const k = f * 100 + c;
    return c < 0 || c > 99 || f < 0 || k >= N || k >= st.reveal * N ? -1 : k;
  };
  const ficha = k => {
    const id = orden[k], t = T[tramoDeK(k)];
    return `<i>x</i><sub>${id}</sub> · EC-PIPE-${pad(id)} · ${t.o} · ${t.n} · ${t.km} km`;
  };
  A.cv.addEventListener('pointermove', e => {
    const k = kDe(e, A);
    if (k < 0 || (A.filtro !== 'todos' && T[tramoDeK(k)].o !== A.filtro)) { if (A.hover !== -1) { A.hover = -1; pedir(A); } return; }
    A.hover = k; info.innerHTML = ficha(k); pedir(A);
  });
  A.cv.addEventListener('pointerleave', () => { A.hover = -1; info.innerHTML = A.sel >= 0 ? ficha(A.sel) : infoIni; pedir(A); });
  A.cv.addEventListener('click', e => {
    const k = kDe(e, A);
    if (k >= 0) { A.sel = k; info.innerHTML = ficha(k); pedir(A); }
  });
  $$('[data-f]').forEach(b => b.addEventListener('click', () => {
    A.filtro = b.dataset.f;
    $$('[data-f]').forEach(x => x.setAttribute('aria-pressed', x === b));
    pedir(A);
  }));
  $$('.def').forEach(d => {
    const on = () => { A.modo = d.dataset.modo; pedir(A); };
    const off = () => { A.modo = null; pedir(A); };
    d.addEventListener('pointerenter', on); d.addEventListener('pointerleave', off);
    d.addEventListener('focus', on); d.addEventListener('blur', off);
  });

  /* Tamaño de muestra */
  const Zs = { 90: 1.645, 95: 1.96, 99: 2.576 };
  let conf = 95, err = 5, n = 370, asig = [];
  const filas = $('#asig');
  filas.innerHTML = T.map((t, i) => `
    <div class="fila">
      <span class="tr"><em class="${t.o.toLowerCase()}">${t.o}</em>${t.n}</span>
      <span class="Nh">${fmt(porTramo[i].length)}</span>
      <span class="bar"><i style="--c:${COL[i]}"></i></span>
      <span class="nh">0</span>
    </div>`).join('');
  const rows = $$('#asig .fila');

  function calcular() {
    const Z = Zs[conf], e = err / 100;
    const n0 = Z * Z * .25 / (e * e);
    n = Math.ceil(n0 / (1 + (n0 - 1) / N));
    $('#paso1').innerHTML = `<i>n</i><sub>0</sub> = <i>Z</i>² · <i>p</i> · <i>q</i> / <i>e</i>² = (${dec(Z, 3)})² · 0,5 · 0,5 / (${dec(e, 3)})² = ${dec(n0)}`;
    $('#paso2').innerHTML = `<i>n</i> = <i>n</i><sub>0</sub> / (1 + (<i>n</i><sub>0</sub> − 1) / <i>N</i>) = ${dec(n0)} / (1 + ${dec(n0 - 1)} / ${fmt(N)}) → ${fmt(n)}`;
    $('#n-val').textContent = fmt(n);
    // afijación proporcional con el método del mayor resto
    const base = T.map(t => n * t.c / N);
    asig = base.map(Math.floor);
    let resto = n - asig.reduce((a, b) => a + b, 0);
    base.map((b, i) => [b - Math.floor(b), i]).sort((a, b) => b[0] - a[0]).slice(0, resto).forEach(([, i]) => asig[i]++);
    const max = Math.max(...asig);
    rows.forEach((f, i) => {
      f.querySelector('.nh').textContent = fmt(asig[i]);
      f.querySelector('.bar i').style.width = (asig[i] / max * 100) + '%';
    });
    B.muestra = null; B.reveal = Math.max(B.reveal, 1e-3); pedir(B);
    $('#sort-estado').textContent = 'Aún no se ha sorteado.'; $('#sort-ids').textContent = '';
    $('#bajar').disabled = true;
  }
  $$('[data-z]').forEach(b => b.addEventListener('click', () => {
    conf = +b.dataset.z; $$('[data-z]').forEach(x => x.setAttribute('aria-pressed', x === b)); calcular();
  }));
  $('#err').addEventListener('input', e => { err = +e.target.value; $('#err-v').textContent = dec(err, err % 1 ? 1 : 0); calcular(); });
  calcular();

  /* Sorteo reproducible (semilla) */
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  let elegidos = [];
  $('#sortear').addEventListener('click', () => {
    const semilla = Math.max(1, Math.min(999999, +$('#semilla').value || 1));
    const rnd = mulberry(semilla);
    elegidos = [];
    const flags = new Uint8Array(N);
    T.forEach((t, i) => {
      const ids = porTramo[i].slice();
      for (let j = 0; j < asig[i]; j++) {            // mezcla parcial de Fisher-Yates, sin reemplazo
        const r = j + Math.floor(rnd() * (ids.length - j));
        [ids[j], ids[r]] = [ids[r], ids[j]];
        elegidos.push([ids[j], i]); flags[kDeId[ids[j]]] = 1;
      }
    });
    elegidos.sort((a, b) => a[0] - b[0]);
    B.muestra = flags; pedir(B);
    $('#sort-estado').textContent = `Muestra extraída: n = ${fmt(elegidos.length)} de ${fmt(N)} registros (semilla ${semilla}).`;
    $('#sort-ids').textContent = 'Primeros IDs: ' + elegidos.slice(0, 6).map(([id]) => 'EC-PIPE-' + pad(id)).join(', ') + ' …';
    $('#bajar').disabled = false;
  });
  $('#bajar').addEventListener('click', () => {
    const csv = 'ID_registro,Oleoducto,Tramo\n' + elegidos.map(([id, i]) => `EC-PIPE-${pad(id)},${T[i].o},${T[i].n}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'muestra_ids.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
})();
