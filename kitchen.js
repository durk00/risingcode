// KITCHEN (Nov 24, 2026): a fourth scene, one swipe left from Weather Details (swipe right
// to go back). "Use my ingredients": one box, one button. Type what's in the house, get a
// few meal ideas back.
//
// How it works, plainly: there is no server or AI behind this page, so the ideas come from
// a built-in list of about 25 plain recipes below, matched against what you type. Each idea
// says what of yours it uses, which pantry staples it ASSUMES you have (flagged in a box,
// since you didn't list them), and anything else it still needs. Add recipes to RECIPES.
(() => {
  // Assumed to be in every kitchen. Shown flagged on a result unless you listed them yourself.
  const STAPLES = ['salt', 'pepper', 'oil', 'butter', 'flour', 'sugar', 'water'];
  // Words that mean the same ingredient.
  const SYN = { eggs: 'egg', potatoes: 'potato', tomatoes: 'tomato', onions: 'onion', carrots: 'carrot', beans: 'bean', mushrooms: 'mushroom', peppers: 'bell pepper', 'bell peppers': 'bell pepper', 'green pepper': 'bell pepper', 'red pepper': 'bell pepper', 'ground beef': 'beef', hamburger: 'beef', 'chicken breast': 'chicken', 'chicken thigh': 'chicken', 'chicken breasts': 'chicken', 'chicken thighs': 'chicken', noodles: 'pasta', spaghetti: 'pasta', macaroni: 'pasta', penne: 'pasta', tortillas: 'tortilla', apples: 'apple', bananas: 'banana', lemons: 'lemon', oats: 'oat', oatmeal: 'oat', sausages: 'sausage', 'black pepper': 'pepper', 'cooking oil': 'oil', 'olive oil': 'oil', 'vegetable oil': 'oil', 'cheddar': 'cheese', 'mozzarella': 'cheese', 'parmesan': 'cheese', 'garlic clove': 'garlic', 'garlic cloves': 'garlic', 'canned tuna': 'tuna', 'black beans': 'bean', 'pinto beans': 'bean', 'kidney beans': 'bean', 'white rice': 'rice', 'brown rice': 'rice', 'loaf of bread': 'bread', 'slices of bread': 'bread' };
  // core: what the dish is built on (an array inside means "any one of these").
  // nice: extras it uses if you have them. staples: what it assumes. steps: one line.
  const R = (name, core, nice, staples, steps) => ({ name, core, nice, staples, steps });
  const VEG = ['broccoli', 'carrot', 'cabbage', 'bell pepper', 'mushroom', 'spinach', 'onion', 'tomato'];
  const RECIPES = [
    R('Cheese omelet', ['egg'], ['cheese', 'spinach', 'mushroom', 'onion', 'bell pepper'], ['butter', 'salt', 'pepper'], 'Beat the eggs, cook in butter over medium heat, add the fillings, fold.'),
    R('Fried rice', ['rice', 'egg'], ['carrot', 'onion', 'chicken', 'broccoli'], ['oil', 'salt'], 'Stir-fry chopped extras in oil, add cold cooked rice, push aside and scramble the eggs in, mix.'),
    R('Pasta with tomato sauce', ['pasta', 'tomato'], ['garlic', 'onion', 'cheese'], ['oil', 'salt'], 'Simmer chopped tomato with garlic and onion in oil 15 minutes, toss with boiled pasta.'),
    R('Garlic butter pasta', ['pasta', 'garlic'], ['cheese'], ['butter', 'salt', 'pepper'], 'Boil the pasta, melt butter with sliced garlic, toss together, top with cheese.'),
    R('Chicken and rice skillet', ['chicken', 'rice'], ['onion', 'broccoli', 'carrot'], ['oil', 'salt', 'pepper', 'water'], 'Brown the chicken pieces in oil, add rice, extras and twice as much water, cover and cook 20 minutes.'),
    R('Chicken noodle-style soup', ['chicken', 'carrot', 'onion'], ['pasta', 'rice', 'potato'], ['salt', 'pepper', 'water'], 'Simmer chicken, carrot and onion in water 25 minutes, shred the chicken, add pasta or rice at the end.'),
    R('Roasted potatoes', ['potato'], ['onion', 'garlic'], ['oil', 'salt', 'pepper'], 'Cut into chunks, toss with oil and salt, roast at 425°F for 35 to 40 minutes.'),
    R('Mashed potatoes', ['potato', 'milk'], ['cheese', 'garlic'], ['butter', 'salt'], 'Boil chunks until soft, drain, mash with butter and warm milk.'),
    R('Quesadillas', ['tortilla', 'cheese'], ['chicken', 'bean', 'bell pepper', 'onion'], ['oil'], 'Fill half a tortilla with cheese and extras, fold, cook in a little oil 2 to 3 minutes a side.'),
    R('Bean and rice bowl', ['bean', 'rice'], ['cheese', 'tomato', 'onion', 'tortilla'], ['oil', 'salt'], 'Warm the beans with chopped onion in oil, spoon over rice, add cheese and tomato.'),
    R('Grilled cheese', ['bread', 'cheese'], ['tomato'], ['butter'], 'Butter the outsides of the bread, add cheese, toast in a pan until golden on both sides.'),
    R('French toast', ['bread', 'egg'], ['milk', 'banana', 'apple'], ['butter', 'sugar'], 'Beat egg with milk, soak the bread, fry in butter until golden.'),
    R('Egg salad sandwich', ['egg', 'bread'], ['onion'], ['salt', 'pepper'], 'Hard-boil the eggs 10 minutes, chop, season, pile on bread.'),
    R('Pancakes', ['egg', 'milk'], ['banana', 'apple'], ['flour', 'sugar', 'oil', 'salt'], 'Whisk 1 cup flour, 1 egg, 1 cup milk, a spoon of sugar and a pinch of salt; fry ladlefuls in oil. (Baking powder helps but is not required.)'),
    R('Tuna pasta', ['tuna', 'pasta'], ['tomato', 'onion', 'lemon', 'cheese'], ['oil', 'salt', 'pepper'], 'Boil the pasta, stir in drained tuna and a little oil, add tomato or lemon.'),
    R('Sausage and peppers', ['sausage', 'bell pepper'], ['onion', 'potato', 'rice'], ['oil', 'salt'], 'Brown sliced sausage in oil, add sliced peppers and onion, cook until soft.'),
    R('Sausage and cabbage skillet', ['sausage', 'cabbage'], ['onion', 'potato'], ['oil', 'salt', 'pepper'], 'Brown sliced sausage, add shredded cabbage and onion, cook covered until soft.'),
    R('Beef and potato hash', ['beef', 'potato'], ['onion', 'egg'], ['oil', 'salt', 'pepper'], 'Fry diced potato in oil until crisp, add the beef and onion, cook through; top with an egg.'),
    R('Pasta with meat sauce', ['beef', 'pasta'], ['tomato', 'onion', 'garlic', 'cheese'], ['oil', 'salt', 'pepper'], 'Brown the beef with onion and garlic, add chopped tomato and simmer 20 minutes, serve over pasta.'),
    R('Lemon chicken', ['chicken', 'lemon'], ['garlic', 'potato', 'rice'], ['oil', 'salt', 'pepper'], 'Brown seasoned chicken in oil, squeeze lemon over it, cover and cook until done.'),
    R('Vegetable rice bowl', ['rice', VEG], ['egg', 'cheese', 'bean'], ['oil', 'salt'], 'Sauté whatever vegetables you have in oil until tender, serve over rice, top with an egg or cheese.'),
    R('Vegetable soup', [VEG, 'potato'], ['carrot', 'onion', 'pasta', 'rice', 'bean'], ['salt', 'pepper', 'water', 'oil'], 'Sauté chopped vegetables a few minutes, add water, simmer 25 minutes until soft.'),
    R('Oatmeal with fruit', ['oat'], ['banana', 'apple', 'milk'], ['water', 'sugar', 'salt'], 'Simmer oats in water or milk 5 minutes, top with sliced fruit.'),
    R('Tomato soup and toast', ['tomato', 'bread'], ['onion', 'garlic', 'cheese'], ['butter', 'salt', 'pepper', 'water'], 'Simmer chopped tomato and onion in water 20 minutes, blend or mash, serve with buttered toast.'),
    R('Garlic mushrooms on toast', ['mushroom', 'bread'], ['garlic', 'egg'], ['butter', 'salt', 'pepper'], 'Fry sliced mushrooms and garlic in butter until brown, pile on toasted bread.'),
  ];

  const norm = (s) => { s = s.toLowerCase().replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ').trim(); if (SYN[s]) return SYN[s]; return s.replace(/^(some|a|an|the|my|few)\s+/, '').replace(/(ies)$/, 'y').replace(/([^s])s$/, '$1'); };
  function parse(text) {
    const out = new Set();
    for (const part of String(text || '').split(/[,;\n]+|\band\b|&/i)) {
      const t = norm(part); if (!t) continue;
      out.add(SYN[t] || t);
      // "leftover chicken breast": also try each word-pair/word so extra words don't hide a match
      const w = t.split(' ');
      for (let n = Math.min(2, w.length); n >= 1; n--) for (let i = 0; i + n <= w.length; i++) { const g = w.slice(i, i + n).join(' '); const v = SYN[g] || norm(g); out.add(v); }
    }
    return out;
  }
  const hasCore = (have, c) => Array.isArray(c) ? c.find((x) => have.has(x)) : (have.has(c) ? c : null);
  const label = (c) => Array.isArray(c) ? 'any vegetable (' + c.slice(0, 4).join(', ') + '…)' : c;
  function suggest(text, max) {
    const have = parse(text);
    if (!have.size) return { items: [], listed: [] };
    const found = [];
    for (const r of RECIPES) {
      const used = [], missing = [];
      for (const c of r.core) { const m = hasCore(have, c); if (m) used.push(m); else missing.push(label(c)); }
      if (!used.length || missing.length > 1) continue;
      const extras = r.nice.filter((n) => have.has(n) && !used.includes(n));
      const assumed = r.staples.filter((s) => !have.has(s));
      found.push({ name: r.name, steps: r.steps, uses: used.concat(extras), missing, assumed, score: (missing.length ? 0 : 100) + used.length * 10 + extras.length * 3 - (missing.length ? 5 : 0) });
    }
    found.sort((a, b) => b.score - a.score);
    return { items: found.slice(0, max || 3), listed: [...have] };
  }

  const css = `
  #kitchen { position: fixed; inset: 0; z-index: 5; display: none; background: #0b1016; color: #e8eef4; overflow-y: auto;
    font: 500 16px/1.45 ui-monospace, Menlo, monospace; letter-spacing: 0.03em;
    padding: calc(28px + env(safe-area-inset-top, 0px)) max(24px, env(safe-area-inset-right, 0px)) 48px max(24px, env(safe-area-inset-left, 0px)); }
  #kitchen.show { display: block; }
  #kitchen .wrap { max-width: 720px; margin: 0 auto; }
  #kitchen .back { margin-bottom: 14px; padding: 10px 16px; font-size: 15px; }
  #kitchen h1 { font-size: 22px; font-weight: 800; letter-spacing: 0.08em; margin: 0 0 4px; }
  #kitchen p.sub { color: #93a4b4; font-size: 13px; margin: 0 0 18px; }
  #kitchen .row { display: flex; gap: 10px; }
  #kitchen input { flex: 1; min-width: 0; padding: 14px 14px; border-radius: 10px; border: 2px solid #93a4b4; background: #121a23; color: #e8eef4; font: 600 16px ui-monospace, monospace; }
  #kitchen button { padding: 14px 20px; border-radius: 10px; border: 2px solid #ffffff; background: #1e2a37; color: #ffffff; font: 700 16px ui-monospace, monospace; cursor: pointer; }
  #kitchen .card { margin-top: 14px; padding: 14px 16px; border-radius: 10px; background: #121a23; border: 2px solid #243241; }
  #kitchen .card h2 { font-size: 18px; margin: 0 0 6px; }
  #kitchen .card p { margin: 4px 0; }
  #kitchen .uses { color: #cfe0ee; }
  /* Assumptions are marked by a box, a ⚠ and the words "ASSUMES", not by color alone. */
  #kitchen .assume { border: 2px dashed #e8eef4; border-radius: 8px; padding: 6px 10px; margin: 8px 0; font-weight: 700; }
  #kitchen .need { border-left: 4px solid #e8eef4; padding-left: 10px; margin: 8px 0; font-weight: 700; }
  #kitchen .steps { color: #93a4b4; font-size: 14px; }
  #kitchen .msg { margin-top: 16px; color: #93a4b4; }`;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
  const el = document.createElement('div'); el.id = 'kitchen'; el.setAttribute('aria-hidden', 'true');
  el.innerHTML = `<div class="wrap"><button type="button" class="back" aria-label="Back to weather details">← Back</button><h1>KITCHEN</h1>
    <p class="sub">Use my ingredients: list what you have, separated by commas.</p>
    <form class="row" autocomplete="off"><input id="kitchen-in" type="text" placeholder="eggs, rice, spinach…" aria-label="Ingredients you have"><button type="submit">Find meals</button></form>
    <div id="kitchen-out" aria-live="polite"></div></div>`;
  document.body.appendChild(el);
  const out = el.querySelector('#kitchen-out'), input = el.querySelector('input');
  const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  el.querySelector('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const { items, listed } = suggest(input.value, 3);
    if (!listed.length) { out.innerHTML = '<p class="msg">Type a few ingredients first.</p>'; return; }
    if (!items.length) { out.innerHTML = '<p class="msg">No match in the built-in list for those. Try adding a main ingredient like eggs, rice, pasta, potatoes, chicken or bread.</p>'; return; }
    out.innerHTML = items.map((m) => `<div class="card"><h2>${esc(m.name)}</h2>
      <p class="uses">Uses your: ${esc(m.uses.join(', '))}</p>
      ${m.assumed.length ? `<div class="assume">⚠ ASSUMES you have (you didn’t list these): ${esc(m.assumed.join(', '))}</div>` : ''}
      ${m.missing.length ? `<div class="need">STILL NEEDS: ${esc(m.missing.join(', '))}</div>` : ''}
      <p class="steps">${esc(m.steps)}</p></div>`).join('') +
      '<p class="msg">Ideas come from a short built-in recipe list, not from AI or the web, so treat them as starting points.</p>';
  });
  el.addEventListener('click', (e) => { e.stopPropagation(); if (e.target.closest('.back') && window.Kitchen && Kitchen.onBack) Kitchen.onBack(); });     // Kitchen taps never reach the scenes
  window.Kitchen = { onBack: null, show(on) { el.classList.toggle('show', !!on); el.setAttribute('aria-hidden', on ? 'false' : 'true'); if (!on) input.blur(); }, suggest, RECIPES, STAPLES };
})();
