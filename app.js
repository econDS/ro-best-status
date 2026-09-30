import { STATS, ACTIVITIES, FORMULA_DEFAULTS, POTION_RECIPES, RUNE_RECIPES, totalPoints, costOf, successRange, optimize } from './optimizer.js';
import { JOB_PROFILES, DEFAULT_PROFILES, resolveProfile, combineBonuses } from './job-profiles.js';

const $ = (selector) => document.querySelector(selector);
const STORAGE_KEY = 'statforge-planner-v2';
const LEGACY_STORAGE_KEY = 'statforge-planner-v1';
const ALL_ONES = Object.fromEntries(STATS.map((stat) => [stat, 1]));
const ALL_ZEROES = Object.fromEntries(STATS.map((stat) => [stat, 0]));
const DEFAULTS = { schema: 2, level: 99, transcended: false, custom: false, budget: totalPoints(99, false), mode: 'current', base: ALL_ONES, bonuses: ALL_ZEROES, formula: FORMULA_DEFAULTS, profiles: DEFAULT_PROFILES, migrationPending: false };
const names = { rune: 'สร้างรูน', poison: 'สร้างขวดพิษ', potion: 'ปรุงยา' };
const FORMULA_FIELDS = {
  runeSkill: { selector: '#rune-skill', label: 'Rune Mastery', min: 1, max: 10 },
  potionPharmacy: { selector: '#potion-pharmacy', label: 'Prepare Potion', min: 1, max: 10 },
  potionLearning: { selector: '#potion-learning', label: 'Potion Research', min: 5, max: 10 },
  potionInstruction: { selector: '#potion-instruction', label: 'Instruction Change', min: 0, max: 5 },
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
let migrationPending = false;
let lastSettings = null;
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
const profileFor = (id) => JOB_PROFILES.find((profile) => profile.id === id);

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
  $(target).innerHTML = STATS.map((stat) => `<label class="stat-field" for="${type}-${stat}">${stat}<input id="${type}-${stat}" name="${type}-${stat}" type="number" inputmode="${type === 'base' ? 'numeric' : 'decimal'}" min="${type === 'base' ? 1 : -999}" max="${type === 'base' ? 130 : 999}" step="${type === 'base' ? 1 : 'any'}" value="${values[stat]}" aria-label="${type === 'base' ? 'สเตตัสปัจจุบัน' : 'โบนัสอุปกรณ์ / บัฟ ไม่รวม Job Bonus'} ${stat}"></label>`).join('');
}
statInputs('#base-stats', 'base', ALL_ONES);
statInputs('#bonus-stats', 'bonus', ALL_ZEROES);

function populateProfiles() {
  $('#profile-controls').innerHTML = ACTIVITIES.map((activity) => `<fieldset class="profile-control ${activity.id}"><legend>${names[activity.id]}</legend><div class="profile-fields"><label for="class-${activity.id}">อาชีพ<select id="class-${activity.id}" name="class-${activity.id}" form="planner-form" aria-describedby="profile-${activity.id}-hint">${JOB_PROFILES.filter((profile) => profile.activity === activity.id).map((profile) => `<option value="${profile.id}">${escapeHTML(profile.name)}</option>`).join('')}</select></label><label for="job-${activity.id}">Job Level<input id="job-${activity.id}" name="job-${activity.id}" form="planner-form" type="number" inputmode="numeric" min="1" step="1" aria-describedby="profile-${activity.id}-hint profile-${activity.id}-change"></label></div><p class="profile-hint" id="profile-${activity.id}-hint"></p><p class="profile-change" id="profile-${activity.id}-change" role="status" hidden></p><details class="profile-source"><summary>ข้อมูล Job Bonus</summary><p id="profile-${activity.id}-source"></p></details></fieldset>`).join('');
}
populateProfiles();

function cleanProfiles(source, legacy) {
  return Object.fromEntries(ACTIVITIES.map(({id}) => {
    let requested = source?.[id];
    if (legacy) {
      let classId = DEFAULT_PROFILES[id].classId;
      if (legacy.cap === 99 && id === 'poison') classId = 'assassin-cross';
      if (legacy.cap === 99 && id === 'potion') classId = legacy.transcended ? 'creator' : 'alchemist';
      const oldJob = id === 'rune' ? legacy.formula?.runeJob : id === 'potion' ? legacy.formula?.potionJob : undefined;
      requested = {classId, jobLevel: oldJob ?? DEFAULT_PROFILES[id].jobLevel};
    }
    const profile = JOB_PROFILES.find((candidate) => candidate.id === requested?.classId && candidate.activity === id) ?? profileFor(DEFAULT_PROFILES[id].classId);
    const job = Number.isInteger(requested?.jobLevel) ? requested.jobLevel : DEFAULT_PROFILES[id].jobLevel;
    return [id, {classId: profile.id, jobLevel: Math.min(profile.maxJob, Math.max(1, job))}];
  }));
}

function saveSettings(settings) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({...settings, schema: 2, migrationPending})); }
  catch { /* The calculator also works when browser storage is unavailable. */ }
}

function loadSaved() {
  try {
    const current = localStorage.getItem(STORAGE_KEY);
    const legacy = current === null ? JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY)) : null;
    const saved = current !== null ? JSON.parse(current) : legacy;
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return DEFAULTS;
    const isLegacy = Boolean(legacy);
    const cleanStats = (source, fallback) => Object.fromEntries(STATS.map((stat) => [stat, typeof source?.[stat] === 'number' && Number.isFinite(source[stat]) ? source[stat] : fallback]));
    const settings = {
      schema: 2,
      level: Number.isInteger(saved.level) && saved.level >= 1 && saved.level <= 200 ? saved.level : 99,
      transcended: saved.transcended === true,
      custom: saved.custom === true,
      budget: Number.isSafeInteger(saved.budget) && saved.budget >= 0 && saved.budget <= 1000000 ? saved.budget : totalPoints(99, false),
      mode: saved.mode === 'reset' ? 'reset' : 'current',
      base: cleanStats(saved.base, 1),
      bonuses: isLegacy ? {...ALL_ZEROES} : cleanStats(saved.bonuses, 0),
      formula: cleanFormula(saved.formula),
      profiles: cleanProfiles(saved.profiles, isLegacy ? saved : null),
      migrationPending: isLegacy || saved.migrationPending === true,
      migrationPreviousBonuses: isLegacy ? cleanStats(saved.bonuses, 0) : saved.migrationPreviousBonuses,
    };
    migrationPending = settings.migrationPending;
    // Save the migration immediately, even if a preserved value needs correction.
    // Never subtract a guessed Job Bonus from the ambiguous legacy bonus values.
    if (isLegacy) saveSettings(settings);
    return settings;
  } catch { return DEFAULTS; }
}

function applySettings(settings) {
  migrationPending = settings.migrationPending === true;
  lastSettings = settings;
  $('#migration-notice').hidden = !migrationPending;
  const oldBonuses = $('#migration-old-values');
  oldBonuses.hidden = !settings.migrationPreviousBonuses;
  oldBonuses.textContent = settings.migrationPreviousBonuses ? `โบนัสเดิม (อาจรวม Job Bonus): ${STATS.map((stat) => `${stat} ${number(settings.migrationPreviousBonuses[stat] ?? 0)}`).join(' · ')}` : '';
  $('#level').value = settings.level;
  $('#transcended').checked = settings.transcended;
  $('#custom-budget-enabled').checked = settings.custom;
  $('#custom-budget').value = settings.budget;
  $(`input[name="mode"][value="${settings.mode}"]`).checked = true;
  STATS.forEach((stat) => {
    $(`#base-${stat}`).value = settings.base[stat];
    $(`#bonus-${stat}`).value = settings.bonuses[stat];
  });
  const profiles = cleanProfiles(settings.profiles);
  ACTIVITIES.forEach(({id}) => {
    $(`#class-${id}`).value = profiles[id].classId;
    $(`#job-${id}`).value = profiles[id].jobLevel;
    $(`#profile-${id}-change`).hidden = true;
  });
  const formula = cleanFormula(settings.formula);
  Object.entries(FORMULA_FIELDS).forEach(([key, field]) => { $(field.selector).value = formula[key]; });
  $('#rune-stone').value = formula.runeStone;
  $('#rune-recipe').value = formula.runeRecipe;
  $('#potion-recipe').value = formula.potionRecipe;
  syncControls();
}

function syncControls() {
  $('#custom-budget-field').hidden = !$('#custom-budget-enabled').checked;
  $('#custom-budget').disabled = !$('#custom-budget-enabled').checked;
  ACTIVITIES.forEach(({id}) => {
    const profile = profileFor($(`#class-${id}`).value);
    if (!profile) return;
    $(`#job-${id}`).max = String(profile.maxJob);
    $(`#profile-${id}-hint`).textContent = `Base ${profile.minBase}–${profile.maxBase} · เพดาน ${profile.cap} · Job 1–${profile.maxJob}`;
    const source = $(`#profile-${id}-source`);
    source.replaceChildren(document.createTextNode(profile.sourceNote || 'Job Bonus คิดจากอาชีพปัจจุบัน ไม่บวกสะสมจากอาชีพก่อนหน้า'));
    if (profile.sourceUrl?.startsWith('https://')) {
      const link = document.createElement('a');
      link.href = profile.sourceUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = ' แหล่งข้อมูล ↗';
      source.append(link);
    }
  });
  const rune = RUNE_RECIPES.find((recipe) => recipe.id === $('#rune-recipe').value);
  $('#rune-skill').min = String(rune?.minSkill ?? 1);
  $('#rune-source-conflict').hidden = rune?.id !== 'lux-anima';
  $('#rune-recipe-hint').textContent = rune ? `ต้องมี Rune Mastery ≥ ${rune.minSkill} · หักค่าความยาก ${rune.penalty} pp` : 'กรุณาเลือกชนิดรูน';
  const potion = POTION_RECIPES.find((recipe) => recipe.id === $('#potion-recipe').value);
  $('#potion-recipe-hint').textContent = potion ? `Potion_Rate: ${formatRange(potion.min, potion.max, 0)} pp · แหล่งข้อมูลระบุว่าสูตรมีข้อโต้แย้ง` : 'กรุณาเลือกไอเท็มปรุงยา';
  $('#mode-hint').textContent = $('input[name="mode"]:checked').value === 'reset'
    ? 'จัดสรรแต้มใหม่ทั้งหมดจาก 1 · ค่าปัจจุบันยังต้องอยู่ในเพดานและงบของอาชีพที่เลือก'
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
  const formula = {...FORMULA_DEFAULTS};
  const errors = {};
  for (const id of ['rune', 'potion']) {
    try {
      Object.entries(FORMULA_FIELDS).filter(([key]) => key.startsWith(id)).forEach(([key, field]) => {
        formula[key] = parseInput(field.selector, field.label, field.min, field.max);
      });
      if (id === 'rune') {
        formula.runeStone = Number($('#rune-stone').value);
        formula.runeRecipe = $('#rune-recipe').value;
        const rune = RUNE_RECIPES.find((recipe) => recipe.id === formula.runeRecipe);
        if (!RUNE_STONES.includes(formula.runeStone) || !rune) throw new Error('กรุณาเลือกหินและชนิดรูนจากตัวเลือกที่มี');
        if (formula.runeSkill < rune.minSkill) {
          $('#rune-skill').setAttribute('aria-invalid', 'true');
          throw new Error(`${rune.label} ต้องมี Rune Mastery อย่างน้อย ${rune.minSkill}`);
        }
      } else {
        formula.potionRecipe = $('#potion-recipe').value;
        if (!POTION_RECIPES.some((recipe) => recipe.id === formula.potionRecipe)) throw new Error('กรุณาเลือกไอเท็มปรุงยาจากตัวเลือกที่มี');
      }
    } catch (error) {
      $('#formula-details').open = true;
      errors[id] = error.message;
    }
  }
  return {formula, errors};
}

function readSettings() {
  document.querySelectorAll('[aria-invalid="true"]').forEach((input) => input.removeAttribute('aria-invalid'));
  const level = parseInput('#level', 'Base Level', 1, 200);
  const transcended = $('#transcended').checked;
  const custom = $('#custom-budget-enabled').checked;
  const budget = custom ? parseInput('#custom-budget', 'แต้มรวมทั้งหมด', 0, 1000000) : totalPoints(level, transcended);
  const base = Object.fromEntries(STATS.map((stat) => [stat, parseInput(`#base-${stat}`, stat, 1, 130)]));
  const bonuses = Object.fromEntries(STATS.map((stat) => [stat, parseInput(`#bonus-${stat}`, `โบนัสอุปกรณ์ / บัฟ ${stat}`, -999, 999, false)]));
  const {formula, errors} = readFormula();
  const profiles = Object.fromEntries(ACTIVITIES.map(({id}) => {
    const classId = $(`#class-${id}`).value;
    const profile = profileFor(classId);
    let jobLevel;
    try {
      if (!profile || profile.activity !== id) throw new Error('กรุณาเลือกอาชีพที่รองรับกิจกรรมนี้');
      jobLevel = parseInput(`#job-${id}`, `${profile.name}: Job Level`, 1, profile.maxJob);
    } catch (error) { errors[id] = error.message; }
    return [id, {classId, jobLevel}];
  }));
  // These are the only Job Level sources for the crafting formulas.
  formula.runeJob = profiles.rune.jobLevel;
  formula.potionJob = profiles.potion.jobLevel;
  return {schema: 2, level, transcended, custom, budget, mode: $('input[name="mode"]:checked').value, base, bonuses, formula, profiles, errors, spent: costOf(base), migrationPending, migrationPreviousBonuses: lastSettings?.migrationPreviousBonuses};
}

function subtitle(activity, settings) {
  const skill = {rune: 'Rune Mastery', poison: 'Create Deadly Poison', potion: 'Prepare Potion'}[activity.id];
  const selection = settings.profiles[activity.id];
  const profile = profileFor(selection.classId);
  return `${escapeHTML(profile?.name ?? '')} · Job ${Number.isInteger(selection.jobLevel) ? selection.jobLevel : '—'}<span class="activity-skill">${skill}</span>`;
}

function profileContext(activity, settings, resolved) {
  const profile = resolved?.profile ?? profileFor(settings.profiles[activity.id].classId);
  if (!profile) return '';
  const isTranscended = resolved?.transcended ?? (profile.forceTrans === null ? settings.transcended : profile.forceTrans);
  let budget = resolved?.budget;
  if (budget === undefined && Number.isInteger(settings.level) && settings.level >= 1 && settings.level <= 200) {
    budget = settings.custom ? settings.budget : totalPoints(settings.level, isTranscended);
  }
  return `<div class="profile-context"><span>เพดาน Base <strong>${profile.cap}</strong></span><span>งบ <strong>${Number.isFinite(budget) ? number(budget) : '—'}</strong> แต้ม</span><small>${isTranscended ? 'จุติแล้ว' : 'ไม่จุติ'}${profile.forceTrans === null ? ' · ตามค่าร่วม' : ' · ตามอาชีพ'}${settings.custom ? ' · กำหนดงบเอง' : ''}</small></div>`;
}

function modelLabel(activity) {
  return activity.id === 'potion' ? 'สูตรปรุงยามีข้อโต้แย้ง · ค่าดิบตามช่วงไอเท็ม' : 'ค่าดิบตาม iRO Wiki · อาจเกิน 100%';
}

function cardHeader(activity, settings, resolved) {
  return `<div class="card-head"><div class="activity-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[activity.id]}</svg></div><h3 class="activity-name" id="activity-${activity.id}">${names[activity.id]}</h3><p class="activity-subtitle">${subtitle(activity, settings)}</p>${profileContext(activity, settings, resolved)}</div>`;
}

function lockedCard(activity, settings, message) {
  return `<article class="result-card ${activity.id} locked" aria-labelledby="activity-${activity.id}" data-activity="${activity.id}" data-state="invalid">${cardHeader(activity, settings)}<div class="locked-body"><div class="lock-symbol" aria-hidden="true">◇</div><h4>ตรวจสอบค่าของกิจกรรมนี้</h4><p class="card-error" role="status">${escapeHTML(message)}</p><p>ปรับอาชีพ / Job Level หรือค่าร่วมด้านซ้าย<br>กิจกรรมอื่นยังคำนวณได้ตามปกติ</p><button type="button" class="unlock-button" data-focus="class-${activity.id}">ไปที่การตั้งค่าอาชีพ ↑</button></div></article>`;
}

function bonusBreakdown(activity, settings, result, resolved) {
  return `<div class="bonus-breakdown"><p>Base + Job + อุปกรณ์ / บัฟ = Total</p><table aria-label="องค์ประกอบสเตตัสที่ใช้ในสูตร ${names[activity.id]}"><thead><tr><th scope="col">STAT</th><th scope="col">Base</th><th scope="col">Job</th><th scope="col">อุปกรณ์<br>/ บัฟ</th><th scope="col">Total</th></tr></thead><tbody>${['DEX', 'LUK', 'INT'].map((stat) => `<tr class="${activity.weights[stat] ? 'relevant' : ''}" data-stat="${stat}"><th scope="row">${stat}</th><td data-part="base">${number(result.stats[stat])}</td><td data-part="job">${number(resolved.jobBonuses[stat])}</td><td data-part="gear">${number(settings.bonuses[stat])}</td><td data-part="total">${number(result.stats[stat] + resolved.jobBonuses[stat] + settings.bonuses[stat])}</td></tr>`).join('')}</tbody></table><span>Job Bonus อัตโนมัติ · Total ใช้ในสูตร</span><div class="bonus-source-note${resolved.bonusCaution ? ' is-caution' : ''}"${resolved.bonusCaution ? ' role="note"' : ''}>${escapeHTML(resolved.bonusSourceNote || '')} <a href="${escapeHTML(resolved.bonusSourceUrl || resolved.profile.sourceUrl)}" target="_blank" rel="noopener noreferrer">แหล่งข้อมูล ↗</a></div></div>`;
}

function activeCard(activity, settings, result, elapsed, resolved, combinedBonuses) {
  const current = successRange(activity.id, settings.base, combinedBonuses, settings.formula);
  const improvement = Math.abs(result.rate - current.min) < 0.0000001 ? 0 : result.rate - current.min;
  const isRange = Math.abs(result.rateMax - result.rate) >= 0.0000001;
  const clamp = (value) => Math.max(0, Math.min(100, value));
  const statMarkup = STATS.map((stat) => {
    const delta = result.stats[stat] - settings.base[stat];
    return `<div class="allocated-stat ${activity.weights[stat] ? 'relevant' : ''}"><dt>${stat}</dt><dd>${result.stats[stat]}${delta !== 0 ? `<small aria-label="${delta > 0 ? 'เพิ่ม' : 'ลด'} ${Math.abs(delta)}">${delta > 0 ? '+' : '−'}${Math.abs(delta)}</small>` : ''}</dd></div>`;
  }).join('');
  return `<article class="result-card ${activity.id}" aria-labelledby="activity-${activity.id}" data-activity="${activity.id}" data-state="ready">${cardHeader(activity, settings, resolved)}<div class="rate-body"><div class="comparison-label"><span>ค่าปัจจุบัน</span><span class="current-rate">${formatRange(current.min, current.max)}%</span></div><p class="recommended-label">ค่าสูตรดิบสูงสุดในงบนี้</p><div class="big-rate${isRange ? ' is-range' : ''}">${rangeMarkup(result.rate, result.rateMax)}</div><div class="rate-improvement">${improvement > 0 ? '↗ +' : improvement < 0 ? '↘ ' : '→ '}${percent(improvement)} pp<span class="thai-label">${improvement === 0 ? 'สูงสุดแล้วในงบนี้' : 'จุดเปอร์เซ็นต์'}</span></div><div class="meter" aria-hidden="true"><span class="meter-best" style="width:${clamp(result.rate)}%"></span><span class="meter-current" style="width:${clamp(current.min)}%"></span></div><p class="raw-label">${modelLabel(activity)}</p></div><div class="allocation"><div class="allocation-heading">สเตตัสแนะนำ <span>BASE</span></div><dl class="allocation-grid">${statMarkup}</dl>${bonusBreakdown(activity, settings, result, resolved)}<div class="card-points"><div>แต้มที่ใช้ทั้งหมด<strong>${number(result.spent)}</strong></div><div>แต้มเหลือ<strong>${number(result.remaining)}</strong></div></div></div><div class="card-timing">Exact DP <span>${elapsed < 0.1 ? '< 0.1' : elapsed.toFixed(1)} ms</span></div></article>`;
}

function blankCards(settings) {
  return ACTIVITIES.map((activity) => `<article class="result-card ${activity.id}" aria-labelledby="activity-${activity.id}" data-activity="${activity.id}" data-state="pending">${cardHeader(activity, settings)}<div class="rate-body"><div class="comparison-label"><span>ค่าปัจจุบัน</span><span class="current-rate">—</span></div><p class="recommended-label">ค่าสูตรดิบสูงสุดในงบนี้</p><div class="big-rate">—<small>%</small></div><div class="rate-improvement">รอข้อมูลที่ถูกต้อง</div><div class="meter"></div><p class="raw-label">${modelLabel(activity)}</p></div><div class="allocation"><div class="allocation-heading">สเตตัสแนะนำ <span>BASE</span></div><dl class="allocation-grid">${STATS.map((stat) => `<div class="allocated-stat"><dt>${stat}</dt><dd>—</dd></div>`).join('')}</dl><div class="card-points"><div>แต้มที่ใช้ทั้งหมด<strong>—</strong></div><div>แต้มเหลือ<strong>—</strong></div></div></div><div class="card-timing">Exact DP <span>— ms</span></div></article>`).join('');
}

function safeSettingsForBlank() {
  return {
    level: Number($('#level').value), transcended: $('#transcended').checked,
    custom: $('#custom-budget-enabled').checked, budget: Number($('#custom-budget').value),
    profiles: Object.fromEntries(ACTIVITIES.map(({id}) => [id, {classId: $(`#class-${id}`).value, jobLevel: $(`#job-${id}`).value.trim() ? Number($(`#job-${id}`).value) : undefined}])),
  };
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
  $('#budget-source').textContent = settings.custom ? 'กำหนดเอง · ใช้ทุกกิจกรรม' : `เลเวล ${settings.level} · ดูงบตามอาชีพในการ์ด`;
  lastSettings = settings;
  saveSettings(settings);
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
        try {
          if (settings.errors[activity.id]) throw new Error(settings.errors[activity.id]);
          const selection = settings.profiles[activity.id];
          const resolved = resolveProfile({activity: activity.id, ...selection, level: settings.level, transcended: settings.transcended, budgetOverride: settings.custom ? settings.budget : null, base: settings.base});
          const combinedBonuses = combineBonuses(settings.bonuses, resolved.jobBonuses);
          const itemStart = performance.now();
          const result = optimize({activity: activity.id, budget: resolved.budget, cap: resolved.cap, base: baseline, bonuses: combinedBonuses, formula: settings.formula});
          const elapsed = performance.now() - itemStart;
          operations += result.operations;
          count++;
          return activeCard(activity, settings, result, elapsed, resolved, combinedBonuses);
        } catch (error) {
          return lockedCard(activity, settings, error.message);
        }
      });
      const elapsed = performance.now() - started;
      $('#result-cards').innerHTML = cards.join('');
      $('#results-panel').classList.remove('is-stale');
      $('#calculation-info').textContent = `${count} กิจกรรม · ${elapsed < 0.1 ? '< 0.1' : elapsed.toFixed(1)} ms · ${number(operations)} ขั้นตอน DP`;
      setStatus(count === 0 ? 'ตรวจสอบค่าของแต่ละกิจกรรม' : count < ACTIVITIES.length ? `คำนวณได้ ${count} / ${ACTIVITIES.length} กิจกรรม` : settings.mode === 'reset' ? 'จัดสรรใหม่ทั้งหมด' : 'คำนวณแล้ว', count === 0 ? 'error' : '');
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
function handleInput(event) {
  if (event.target.id.startsWith('class-')) {
    const id = event.target.id.slice('class-'.length);
    const profile = profileFor(event.target.value);
    const input = $(`#job-${id}`);
    const message = $(`#profile-${id}-change`);
    if (profile && Number(input.value) > profile.maxJob) {
      input.value = String(profile.maxJob);
      message.textContent = `ปรับ Job Level เป็น ${profile.maxJob} ตามเพดานของ ${profile.name}`;
      message.hidden = false;
    } else {
      message.hidden = true;
    }
  }
  scheduleCalculation();
}
$('#planner-form').addEventListener('input', handleInput);
$('#profile-controls').addEventListener('input', handleInput);
$('#clear-stats').addEventListener('click', () => {
  STATS.forEach((stat) => { $(`#base-${stat}`).value = '1'; });
  calculate();
});
$('#reset-settings').addEventListener('click', () => { applySettings({...DEFAULTS, migrationPending, migrationPreviousBonuses: lastSettings?.migrationPreviousBonuses}); calculate(); });
$('#acknowledge-migration').addEventListener('click', () => {
  migrationPending = false;
  $('#migration-notice').hidden = true;
  if (lastSettings) saveSettings(lastSettings);
});
$('#result-cards').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-focus]');
  if (button) document.getElementById(button.dataset.focus)?.focus();
});

applySettings(loadSaved());
calculate();
