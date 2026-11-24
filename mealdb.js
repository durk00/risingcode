// THEMEALDB (Nov 24, 2026): the Kitchen's second source of ideas. After the built-in list
// answers, the Kitchen also asks TheMealDB (themealdb.com), a free recipe database with
// a few hundred home dishes from many countries, each with its ingredients, amounts and
// full cooking steps.
//
// The free key ("1", for personal projects) searches one ingredient at a time, so this
// searches each thing you typed on its own, ranks the dishes by how many of your
// ingredients they use, then opens the best few to show what you have, what it assumes
// is in the pantry, what you'd still need, and how to make it. Costs nothing.
(() => {
  const API = 'https://www.themealdb.com/api/json/v1/1/';
  const MAX_INGREDIENTS = 6, CANDIDATES = 6;
  const STAPLES = ['salt', 'pepper', 'black pepper', 'oil', 'olive oil', 'vegetable oil', 'sunflower oil', 'butter', 'water', 'flour', 'plain flour', 'sugar', 'caster sugar'];

  const single = (w) => w.replace(/ies$/, 'y').replace(/oes$/, 'o').replace(/([^s])s$/, '$1');
  // What you typed, one item per comma (or "and"), cleaned up.
  function items(text) {
    return [...new Set(String(text || '').toLowerCase().split(/[,;\n]+|\band\b|&/)
      .map(s => s.replace(/[^a-z -]/g, ' ').replace(/\s+/g, ' ').replace(/^(some|a|an|the|my|few|leftover)\s+/, '').trim())
      .filter(Boolean))].slice(0, MAX_INGREDIENTS);
  }
  // TheMealDB names ingredients either way ("Egg"/"Eggs", "Potatoes"), so try both.
  // Describing words ("frozen peas", "fresh spinach") are dropped too, by also trying the last word.
  const forms = (w) => {
    const last = w.split(' ').pop();
    const f = (x) => [x, single(x), single(x) + 's'];
    return [...new Set([...f(w).slice(0, 2), ...(last !== w ? f(last).slice(0, 2) : [f(w)[2]])])];
  };
  const get = async (path) => (await fetch(API + path)).json();

  async function find(text) {
    const mine = items(text);
    if (!mine.length) return { mine, meals: [] };
    const hits = new Map();                      // meal id -> { meal, which of mine it matched }
    await Promise.all(mine.map(async (w) => {
      for (const f of forms(w)) {
        try {
          const r = await get('filter.php?i=' + encodeURIComponent(f.replace(/ /g, '_')));
          for (const m of r.meals || []) {
            const h = hits.get(m.idMeal) || { meal: m, matched: new Set() };
            h.matched.add(w); hits.set(m.idMeal, h);
          }
        } catch (e) { /* one failed lookup doesn't stop the rest */ }
      }
    }));
    const ranked = [...hits.values()].sort((a, b) => b.matched.size - a.matched.size).slice(0, CANDIDATES);
    const full = await Promise.all(ranked.map(async (h) => {
      try { const r = await get('lookup.php?i=' + h.meal.idMeal); return r.meals && r.meals[0]; } catch (e) { return null; }
    }));
    const isMine = (ing) => mine.some(w => { const a = single(w), b = single(ing.toLowerCase()); return b.includes(a) || a.includes(b); });
    const meals = full.filter(Boolean).map((m) => {
      const parts = [];
      for (let i = 1; i <= 20; i++) {
        const ing = (m['strIngredient' + i] || '').trim(); if (!ing) continue;
        parts.push({ ing, amt: (m['strMeasure' + i] || '').trim() });
      }
      const have = parts.filter(p => isMine(p.ing));
      const staple = parts.filter(p => !isMine(p.ing) && STAPLES.includes(p.ing.toLowerCase()));
      const need = parts.filter(p => !isMine(p.ing) && !STAPLES.includes(p.ing.toLowerCase()));
      return { name: m.strMeal, area: m.strArea, thumb: m.strMealThumb, video: m.strYoutube, source: m.strSource,
        steps: (m.strInstructions || '').split(/\r?\n+/).map(s => s.trim()).filter(s => s && !/^step \d+$/i.test(s)),
        parts, have, staple, need };
    }).sort((a, b) => (b.have.length - a.have.length) || (a.need.length - b.need.length)).slice(0, 3);
    return { mine, meals };
  }

  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const list = (ps) => ps.map(p => esc(p.amt ? `${p.ing} (${p.amt})` : p.ing)).join(', ');
  function render(res) {
    if (!res.meals.length) return '<p class="msg">TheMealDB has nothing with those ingredients. Try a main ingredient like chicken, beef, rice, pasta, potatoes or eggs.</p>';
    return res.meals.map(m => `<div class="card md">
      ${m.thumb ? `<img src="${esc(m.thumb)}/preview" alt="" loading="lazy" onerror="this.remove()">` : ''}
      <h2>${esc(m.name)}</h2>${m.area && m.area !== 'Unknown' ? `<p class="steps">${esc(m.area)}</p>` : ''}
      <p class="uses">Uses your: ${list(m.have) || '—'}</p>
      ${m.staple.length ? `<div class="assume">⚠ ASSUMES you have: ${list(m.staple)}</div>` : ''}
      ${m.need.length ? `<div class="need">STILL NEEDS: ${list(m.need)}</div>` : ''}
      <details><summary>HOW TO MAKE IT (${m.steps.length} STEPS)</summary><ol>${m.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      ${m.video ? `<p class="steps">Video: ${esc(m.video)}</p>` : ''}</details></div>`).join('');
  }

  const style = document.createElement('style');
  style.textContent = `
  #kitchen h3.src { font-size: 13px; color: #93a4b4; letter-spacing: 0.12em; margin: 26px 0 0; }
  #kitchen .card.md img { float: right; width: 84px; height: 84px; object-fit: cover; border-radius: 8px; margin: 0 0 8px 12px; }
  #kitchen .card.md::after { content: ""; display: block; clear: both; }
  #kitchen details { margin-top: 8px; }
  #kitchen summary { cursor: pointer; font-weight: 700; padding: 6px 0; }
  #kitchen ol { margin: 6px 0 0 1.2em; padding: 0; color: #cfe0ee; font-size: 14px; }
  #kitchen ol li { margin: 6px 0; }`;
  document.head.appendChild(style);

  window.MealDB = { find, render, items };
})();
