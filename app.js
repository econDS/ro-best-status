import { STATS, ACTIVITIES, FORMULA_DEFAULTS, POTION_RECIPES, RUNE_RECIPES, totalPoints, costOf, successRange, optimize } from './optimizer.js';

const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = 'statforge-planner-v1';
const ALL_ONES = Object.fromEntries(STATS.map((stat) => [stat, 1]));
const ALL_ZEROES = Object.fromEntries(STATS.map((stat) => [stat, 0]));
const DEFAULTS = { level: 99, cap: 130, transcended: false, custom: false, budget: totalPoints(99, false), mode: 'current', base: ALL_ONES, bonuses: ALL_ZEROES, formula: FORMULA_DEFAULTS };
const names = { rune: 'สร้างรูน', poison: 'สร้างขวดพิษ', potion: 'ปรุงยา' };
const FORMULA_FIELDS = {
  runeSkill: { selector: '#rune-skill', label: 'Rune Mastery', min: 1, max: 10 },
  runeJob: { selector: '#rune-job', label: 'Job Level สำหรับรูน', min: 1, max: 70 },
  potionPharmacy: { selector: '#potion-pharmacy', label: 'Prepare Potion', min: 1, max: 10 },
  potionLearning: { selector: '#potion-learning', label: 'Potion Research', min: 5, max: 10 },
  potionInstruction: { selector: '#potion-instruction', label: 'Instruction Change', min: 0, max: 5 },
  potionJob: { selector: '#potion-job', label: 'Job Level สำหรับปรุงยา', min: 1, max: 70 },
};
const RUNE_STONES = [4, 8, 15, 30, 60];
const icons = {
  potion: '<path d="M9 3h6M10 3v6l-5 8a3 3 0 0 0 3 4h8a3 3 0 0 0 3-4l-5-8V3M7 15h10M10 18h1"/>',
  poison: '<path d="M8 4h8M9 4v4l-3 3v9h12v-9l-3-3V4M9 8h6M9 13l6 5M15 13l-6 5"/><circle cx="12" cy="15.5" r="3.8"/>',
  rune: '<path d="m12 2 8 5v10l-8 5-8-5V7Z"/><path d="M10 6v12M10 6l6 4-6 3M10 13l5 5"/>',
};
const formatNumber = new Intl.NumberFormat('en-US');
const number = (value) => formatNumber.format(value);
const percent = (value) => value.toFixed(2);
let revision = 0;
let timer;

function populateRecipes(selector, recipes) {
  $(selector).replaceChildren(...recipes.map((recipe) => {
    const option = document.createElement('option');
    option.value = recipe.id;
    option.textContent = recipe.label;
    return option;
  }));
}
populateRecipes('#rune-recipe', RUNE_RECIPES);
populateRecipes('#potion-recipe', POTION_RECIPES);

function cleanFormula(source) {
  const formula = { ...FORMULA_DEFAULTS };
  if (!source || typeof source !== 'object' || Array.isArray(source)) return formula;
  Object.entries(FORMULA_FIELDS).forEach(([key, field]) => {
    if (Number.isSafeInteger(source[key]) && source[key] >= field.min && source[key] <= field.max) formula[key] = source[key];
  });
  if (RUNE_STONES.includes(source.runeStone)) formula.runeStone = source.runeStone;
  if (RUNE_RECIPES.some((recipe) => recipe.id === source.runeRecipe)) formula.runeRecipe = source.runeRecipe;
  if (POTION_RECIPES.some((recipe) => recipe.id === source.potionRecipe)) formula.potionRecipe = source.potionRecipe;
  const rune = RUNE_RECIPES.find((recipe) => recipe.id === formula.runeRecipe);
  formula.runeSkill = Math.max(formula.runeSkill, rune.minSkill);
  return formula;
}

function formatRange(min, max, digits = 2) {
  return Math.abs(max - min) < 0.0000001 ? min.toFixed(digits) : `${min.toFixed(digits)}–${max.toFixed(digits)}`;
}

function rangeMarkup(min, max) {
  return Math.abs(max - min) < 0.0000001
    ? `${percent(min)}<small>%</small>`
    : `<span>${percent(min)}<span class="range-dash">–</span></span><span>${percent(max)}<small>%</small></span>`;
}

function statInputs(target, type, values) {
  $(target).innerHTML = STATS.map((stat) => `<label class="stat-field" for="${type}-${stat}">${stat}<input id="${type}-${stat}" name="${type}-${stat}" type="number" inputmode="${type === 'base' ? 'numeric' : 'decimal'}" min="${type === 'base' ? 1 : -999}" max="${type === 'base' ? 130 : 999}" step="${type === 'base' ? 1 : 'any'}" value="${values[stat]}" aria-label="${type === 'base' ? 'สเตตัสปัจจุบัน' : 'โบนัส'} ${stat}"></label>`).join('');
}
statInputs('#base-stats', 'base', ALL_ONES);
statInputs('#bonus-stats', 'bonus', ALL_ZEROES);

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return DEFAULTS;
    const cleanStats = (source, fallback) => Object.fromEntries(STATS.map((stat) => [stat, typeof source?.[stat] === 'number' && Number.isFinite(source[stat]) ? source[stat] : fallback]));
    return {
      level: Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= 200 ? saved.level : 99,
      cap: saved.cap === 99 ? 99 : 130,
      transcended: saved.transcended === true,
      custom: saved.custom === true,
      budget: Number.isSafeInteger(saved.budget) && saved.budget >= 0 && saved.budget <= 1000000 ? saved.budget : totalPoints(99, false),
      mode: saved.mode === 'reset' ? 'reset' : 'current',
      base: cleanStats(saved.base, 1),
      bonuses: cleanStats(saved.bonuses, 0),
      formula: cleanFormula(saved.formula),
    };
  } catch { return DEFAULTS; }
}

function applySettings(settings) {
  $('#level').value = settings.level;
  $('#cap').value = settings.cap;
  $('#transcended').checked = settings.transcended;
  $('#custom-budget-enabled').checked = settings.custom;
  $('#custom-budget').value = settings.budget;
  $(`input[name="mode"][value="${settings.mode}"]`).checked = true;
  STATS.forEach((stat) => {
    $(`#base-${stat}`).value = settings.base[stat];
    $(`#bonus-${stat}`).value = settings.bonuses[stat];
  });
  const formula = cleanFormula(settings.formula);
  if (settings.cap === 99) formula.potionJob = Math.min(formula.potionJob, 50);
  Object.entries(FORMULA_FIELDS).forEach(([key, field]) => { $(field.selector).value = formula[key]; });
  $('#rune-stone').value = formula.runeStone;
  $('#rune-recipe').value = formula.runeRecipe;
  $('#potion-recipe').value = formula.potionRecipe;
  syncControls();
}

function syncControls() {
  const cap = Number($('#cap').value);
  const thirdClass = cap === 130;
  $('#level').min = thirdClass ? '99' : '1';
  $('#level').max = thirdClass ? '200' : '99';
  $('#potion-job').max = thirdClass ? '70' : '50';
  $('#level-hint').textContent = thirdClass ? 'Class 3: เลเวล 99–200 ตามโมเดลต้นทาง' : 'Class 2: เลเวล 1–99 ตามโมเดลต้นทาง';
  STATS.forEach((stat) => { $(`#base-${stat}`).max = String(cap); });
  $('#custom-budget-field').hidden = !$('#custom-budget-enabled').checked;
  $('#custom-budget').disabled = !$('#custom-budget-enabled').checked;
  const rune = RUNE_RECIPES.find((recipe) => recipe.id === $('#rune-recipe').value);
  $('#rune-skill').min = String(rune?.minSkill ?? 1);
  $('#rune-source-conflict').hidden = rune?.id !== 'lux-anima';
  $('#rune-recipe-hint').textContent = rune ? `ต้องมี Rune Mastery ≥ ${rune.minSkill} · หักค่าความยาก ${rune.penalty} pp` : 'กรุณาเลือกชนิดรูน';
  const potion = POTION_RECIPES.find((recipe) => recipe.id === $('#potion-recipe').value);
  $('#potion-recipe-hint').textContent = potion ? `Potion_Rate: ${formatRange(potion.min, potion.max, 0)} pp · แหล่งข้อมูลระบุว่าสูตรมีข้อโต้แย้ง` : 'กรุณาเลือกไอเท็มปรุงยา';
  $('#mode-hint').textContent = $('input[name="mode"]:checked').value === 'reset'
    ? 'จัดสรรแต้มใหม่ทั้งหมด โดยเริ่มทุกสเตตัสจาก 1'
    : 'รักษาทุกค่าที่อัปแล้ว และจัดสรรแต้มที่เหลือ';
}

function parseInput(selector, name, min, max, integer = true) {
  const input = $(selector);
  const value = Number(input.value);
  if (!input.value.trim() || !Number.isFinite(value) || (integer && !Number.isSafeInteger(value)) || value < min || value > max) {
    input.setAttribute('aria-invalid', 'true');
    input.closest('details')?.setAttribute('open', '');
    throw new Error(`${name} ต้องเป็น${integer ? 'จำนวนเต็ม' : 'ตัวเลข'}ระหว่าง ${number(min)}–${number(max)}`);
  }
  return value;
}

function readFormula() {
  const formula = Object.fromEntries(Object.entries(FORMULA_FIELDS).map(([key, field]) => [key, parseInput(field.selector, field.label, field.min, key === 'potionJob' && Number($('#cap').value) === 99 ? 50 : field.max)]));
  formula.runeStone = Number($('#rune-stone').value);
  formula.runeRecipe = $('#rune-recipe').value;
  formula.potionRecipe = $('#potion-recipe').value;
  const rune = RUNE_RECIPES.find((recipe) => recipe.id === formula.runeRecipe);
  if (!RUNE_STONES.includes(formula.runeStone) || !rune || !POTION_RECIPES.some((recipe) => recipe.id === formula.potionRecipe)) {
    $('#formula-details').open = true;
    throw new Error('กรุณาเลือกหิน รูน และไอเท็มปรุงยาจากตัวเลือกที่มี');
  }
  if (formula.runeSkill < rune.minSkill) {
    $('#rune-skill').setAttribute('aria-invalid', 'true');
    $('#formula-details').open = true;
    throw new Error(`${rune.label} ต้องมี Rune Mastery อย่างน้อย ${rune.minSkill}`);
  }
  return formula;
}

function readSettings() {
  document.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute('aria-invalid'));
  const cap = Number($('#cap').value);
  if (![99, 130].includes(cap)) throw new Error('กรุณาเลือกเพดานสเตตัส 99 หรือ 130');
  const level = parseInput('#level', `Base Level สำหรับ Class ${cap === 130 ? 3 : 2}`, cap === 130 ? 99 : 1, cap === 130 ? 200 : 99);
  const transcended = $('#transcended').checked;
  const custom = $('#custom-budget-enabled').checked;
  const budget = custom ? parseInput('#custom-budget', 'แต้มรวมทั้งหมด', 0, 1000000) : totalPoints(level, transcended);
  const base = Object.fromEntries(STATS.map((stat) => [stat, parseInput(`#base-${stat}`, stat, 1, cap)]));
  const bonuses = Object.fromEntries(STATS.map((stat) => [stat, parseInput(`#bonus-${stat}`, `โบนัส ${stat}`, -999, 999, false)]));
  const formula = readFormula();
  const spent = costOf(base);
  if (spent > budget) throw new Error(`สเตตัสปัจจุบันใช้ ${number(spent)} แต้ม แต่มีงบ ${number(budget)} แต้ม กรุณาลดสเตตัสหรือปรับแต้มรวม`);
  return { level, cap, transcended, custom, budget, mode: $('input[name="mode"]:checked').value, base, bonuses, formula, spent };
}

function availability(activity, settings) {
  if (settings.cap === 130) return null;
  if (activity.id === 'rune') return { title: 'สำหรับโปรไฟล์ Class 3', text: 'โมเดลรูนใช้โปรไฟล์เพดานสเตตัส 130<br>เปลี่ยนโปรไฟล์เพื่อเริ่มวางแผนสร้างรูน', action: 'class3', label: 'เปลี่ยนเป็น Class 3', stats: ['DEX', 'LUK'] };
  if (activity.id === 'poison' && !settings.transcended) return { title: 'Assassin Cross ต้องจุติ', text: 'สูตร Class 2 อ้างอิงตัวละครที่จุติแล้ว<br>เปิดการจุติเพื่อคำนวณด้วยงบที่ถูกต้อง', action: 'rebirth', label: 'เลือกผ่านการจุติแล้ว', stats: ['DEX', 'LUK'] };
  if (activity.id === 'potion' && settings.transcended) return { title: 'Alchemist ในโมเดลไม่จุติ', text: 'สำหรับสูตรตัวละครที่จุติแล้ว<br>เลือก Genetic ใน Class 3', action: 'class3', label: 'เปลี่ยนเป็น Class 3', stats: ['INT', 'DEX', 'LUK'] };
  return null;
}

function subtitle(activity, settings) {
  const skill = { rune: 'Rune Mastery', poison: 'Create Deadly Poison', potion: 'Prepare Potion' }[activity.id];
  const job = settings.cap === 130
    ? { rune: 'Rune Knight', poison: 'Guillotine Cross', potion: 'Genetic' }[activity.id]
    : { rune: 'Rune Knight', poison: 'Assassin Cross', potion: 'Alchemist' }[activity.id];
  return `${job}<span class="activity-skill">${skill}</span>`;
}

function modelLabel(activity) {
  return activity.id === 'potion' ? 'สูตรปรุงยามีข้อโต้แย้ง · ค่าดิบตามช่วงไอเท็ม' : 'ค่าดิบตาม iRO Wiki · อาจเกิน 100%';
}

function cardHeader(activity, settings) {
  return `<div class="card-head"><div class="activity-icon">${`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[activity.id]}</svg>`}</div><h3 class="activity-name" id="activity-${activity.id}">${names[activity.id]}</h3><p class="activity-subtitle">${subtitle(activity, settings)}</p></div>`;
}

function lockedCard(activity, settings, unavailable) {
  return `<article class="result-card ${activity.id} locked" aria-labelledby="activity-${activity.id}">${cardHeader(activity, settings)}<div class="locked-body"><div class="lock-symbol" aria-hidden="true">◇</div><h4>${unavailable.title}</h4><p>${unavailable.text}</p><button type="button" class="unlock-button" data-action="${unavailable.action}">${unavailable.label} <span aria-hidden="true">↗</span></button><div class="locked-stats" aria-hidden="true">${unavailable.stats.map((stat) => `<span>${stat}</span>`).join('')}</div></div></article>`;
}

function activeCard(activity, settings, result, elapsed) {
  const current = successRange(activity.id, settings.base, settings.bonuses, settings.formula);
  const improvement = Math.abs(result.rate - current.min) < 0.0000001 ? 0 : result.rate - current.min;
  const isRange = Math.abs(result.rateMax - result.rate) >= 0.0000001;
  const clamp = (value) => Math.max(0, Math.min(100, value));
  const statMarkup = STATS.map((stat) => {
    const delta = result.stats[stat] - settings.base[stat];
    return `<div class="allocated-stat ${activity.weights[stat] ? 'relevant' : ''}"><dt>${stat}</dt><dd>${result.stats[stat]}${delta !== 0 ? `<small aria-label="${delta > 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(delta)}">${delta > 0 ? '+' : '−'}${Math.abs(delta)}</small>` : ''}</dd></div>`;
  }).join('');
  return `<article class="result-card ${activity.id}" aria-labelledby="activity-${activity.id}">${cardHeader(activity, settings)}<div class="rate-body"><div class="comparison-label"><span>ค่าปัจจุบัน</span><span class="current-rate">${formatRange(current.min, current.max)}%</span></div><p class="recommended-label">ค่าสูตรดิบสูงสุดในงบนี้</p><div class="big-rate${isRange ? ' is-range' : ''}">${rangeMarkup(result.rate, result.rateMax)}</div><div class="rate-improvement">${improvement > 0 ? '↗ +' : improvement < 0 ? '↘ ' : '→ '}${percent(improvement)} pp<span class="thai-label">${improvement === 0 ? 'สูงสุดแล้วในงบนี้' : 'จุดเปอร์เซ็นต์'}</span></div><div class="meter" aria-hidden="true"><span class="meter-best" style="width:${clamp(result.rate)}%"></span><span class="meter-current" style="width:${clamp(current.min)}%"></span></div><p class="raw-label">${modelLabel(activity)}</p></div><div class="allocation"><div class="allocation-heading">สเตตัสแนะนำ <span>BASE</span></div><dl class="allocation-grid">${statMarkup}</dl><div class="card-points"><div>แต้มที่ใช้ทั้งหมด<strong>${number(result.spent)}</strong></div><div>แต้มเหลือ<strong>${number(result.remaining)}</strong></div></div></div><div class="card-timing">Exact DP <span>${elapsed < 0.1 ? '< 0.1' : elapsed.toFixed(1)} ms</span></div></article>`;
}

function blankCards(settings) {
  return ACTIVITIES.map((activity) => {
    const unavailable = availability(activity, settings);
    if (unavailable) return lockedCard(activity, settings, unavailable);
    return `<article class="result-card ${activity.id}" aria-labelledby="activity-${activity.id}">${cardHeader(activity, settings)}<div class="rate-body"><div class="comparison-label"><span>ค่าปัจจุบัน</span><span class="current-rate">—</span></div><p class="recommended-label">ค่าสูตรดิบสูงสุดในงบนี้</p><div class="big-rate">—<small>%</small></div><div class="rate-improvement">รอข้อมูลที่ถูกต้อง</div><div class="meter"></div><p class="raw-label">${modelLabel(activity)}</p></div><div class="allocation"><div class="allocation-heading">สเตตัสแนะนำ <span>BASE</span></div><dl class="allocation-grid">${STATS.map((stat) => `<div class="allocated-stat"><dt>${stat}</dt><dd>—</dd></div>`).join('')}</dl><div class="card-points"><div>แต้มที่ใช้ทั้งหมด<strong>—</strong></div><div>แต้มเหลือ<strong>—</strong></div></div></div><div class="card-timing">Exact DP <span>— ms</span></div></article>`;
  }).join('');
}

function safeSettingsForBlank() {
  return { cap: Number($('#cap').value) === 99 ? 99 : 130, transcended: $('#transcended').checked };
}

function setStatus(label, state = '') {
  $('#result-status').className = `result-status ${state}`;
  $('#result-status').innerHTML = '<i aria-hidden="true"></i>';
  $('#result-status').append(document.createTextNode(label));
}

function clearResults() {
  $('#result-cards').innerHTML = blankCards(safeSettingsForBlank());
  $('#budget-display').innerHTML = '—<small>POINTS</small>';
  $('#spent-display').textContent = 'ใช้แล้ว —';
  $('#calculation-info').textContent = 'กรอกข้อมูลให้ครบเพื่อคำนวณ';
  $('#results-panel').classList.add('is-stale');
}

function calculate() {
  clearTimeout(timer);
  const thisRevision = ++revision;
  syncControls();
  $('#form-error').hidden = true;
  clearResults();
  let settings;
  try { settings = readSettings(); }
  catch (error) {
    $('#form-error').textContent = error.message;
    $('#form-error').hidden = false;
    $('#results-panel').setAttribute('aria-busy', 'false');
    $('#calculate').disabled = false;
    setStatus('ตรวจสอบข้อมูล', 'error');
    return;
  }
  $('#budget-display').innerHTML = `${number(settings.budget)}<small>POINTS</small>`;
  $('#budget-source').textContent = settings.custom ? 'กำหนดเอง · แต้มทั้งหมด' : `เลเวล ${settings.level}${settings.transcended ? ' · จุติแล้ว' : ' · ไม่จุติ'}`;
  $('#spent-display').textContent = `ใช้แล้ว ${number(settings.spent)}`;
  setStatus('กำลังคำนวณ', 'pending');
  $('#results-panel').setAttribute('aria-busy', 'true');
  $('#calculate').disabled = true;
  // Let the browser paint the pending state before running the bounded exact DP.
  timer = setTimeout(() => {
    if (thisRevision !== revision) return;
    try {
      const baseline = settings.mode === 'reset' ? ALL_ONES : settings.base;
      const started = performance.now();
      let operations = 0;
      let count = 0;
      const cards = ACTIVITIES.map((activity) => {
        const unavailable = availability(activity, settings);
        if (unavailable) return lockedCard(activity, settings, unavailable);
        const itemStart = performance.now();
        const result = optimize({ activity: activity.id, budget: settings.budget, cap: settings.cap, base: baseline, bonuses: settings.bonuses, formula: settings.formula });
        const elapsed = performance.now() - itemStart;
        operations += result.operations;
        count++;
        return activeCard(activity, settings, result, elapsed);
      });
      const elapsed = performance.now() - started;
      $('#result-cards').innerHTML = cards.join('');
      $('#results-panel').classList.remove('is-stale');
      $('#calculation-info').textContent = `${count} กิจกรรม · ${elapsed < 0.1 ? '< 0.1' : elapsed.toFixed(1)} ms · ${number(operations)} ขั้นตอน DP`;
      setStatus(settings.mode === 'reset' ? 'จัดสรรใหม่ทั้งหมด' : 'คำนวณแล้ว');
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch { /* Storage may be unavailable; the calculator still works. */ }
    } catch (error) {
      clearResults();
      $('#form-error').textContent = `คำนวณไม่สำเร็จ: ${error.message}`;
      $('#form-error').hidden = false;
      setStatus('ตรวจสอบข้อมูล', 'error');
    } finally {
      $('#calculate').disabled = false;
      $('#results-panel').setAttribute('aria-busy', 'false');
    }
  }, 20);
}

function scheduleCalculation() {
  revision++;
  clearTimeout(timer);
  syncControls();
  clearResults();
  $('#form-error').hidden = true;
  setStatus('กำลังอัปเดต', 'pending');
  $('#results-panel').setAttribute('aria-busy', 'true');
  $('#calculate').disabled = false;
  timer = setTimeout(calculate, 200);
}

$('#planner-form').addEventListener('submit', (event) => { event.preventDefault(); calculate(); });
$('#planner-form').addEventListener('input', (event) => {
  if (event.target.id === 'cap') {
    const level = Number($('#level').value);
    if (event.target.value === '99' && level > 99) $('#level').value = '99';
    if (event.target.value === '99' && Number($('#potion-job').value) > 50) $('#potion-job').value = '50';
    if (event.target.value === '130' && level < 99) $('#level').value = '99';
  }
  scheduleCalculation();
});
$('#clear-stats').addEventListener('click', () => {
  STATS.forEach((stat) => { $(`#base-${stat}`).value = '1'; });
  calculate();
});
$('#reset-settings').addEventListener('click', () => { applySettings(DEFAULTS); calculate(); });
$('#result-cards').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  if (button.dataset.action === 'class3') {
    $('#cap').value = '130';
    if (Number($('#level').value) < 99) $('#level').value = '99';
    $('#cap').focus();
  }
  if (button.dataset.action === 'rebirth') { $('#transcended').checked = true; $('#transcended').focus(); }
  calculate();
});

applySettings(loadSaved());
calculate();
