//═════════════════
// ENDLESS DESCENT — AFK MODE
//═════════════════
var AFK = {
  running: false,
  floor: 1,
  hp: 100,
  maxHp: 100,
  atk: 15,
  def: 0,
  charIdx: 0,
  points: 0,        // earned this run
  interval: null,
  timerInterval: null,
  timerPct: 100,
  potions: 2,
  FIGHT_MS: 12000,  // 12 seconds between auto-fights
};

var AFK_SHOP_ITEMS = [
  { id:'afk-extra-potion',  name:'Extra Potion',       icon:'🧪', cost:50,  desc:'Start each run with 1 extra Health Potion.',           max:3 },
  { id:'afk-hp-boost',      name:'Resilience',         icon:'❤️', cost:80,  desc:'+20 max HP in Endless Descent runs.',                  max:5 },
  { id:'afk-atk-boost',     name:'Sharpened Blade',    icon:'⚔️', cost:80,  desc:'+5 attack in Endless Descent runs.',                   max:5 },
  { id:'afk-slow-fight',    name:'Steady Rhythm',      icon:'⏱️', cost:120, desc:'Auto-fight timer slows by 3 seconds.',                 max:1 },
  { id:'afk-bandages',      name:'Bandages',           icon:'🩹', cost:100, desc:'Passively regenerate 8 HP after every floor.',         max:3 },
  { id:'afk-lucky-charm',   name:'Lucky Charm',        icon:'🍀', cost:150, desc:'15% chance to dodge any boss attack completely.',      max:1 },
  { id:'afk-iron-will',     name:'Iron Will',          icon:'🛡️', cost:180, desc:'Start every AFK run with +80 max HP bonus.',          max:1 },
  { id:'afk-death-save',    name:'Death Ward',         icon:'✨', cost:250, desc:'Once per run, survive a killing blow with 1 HP.',      max:1 },
  { id:'afk-mystery-coins', name:'Coin Cache',         icon:'🪙', cost:200, desc:'Convert 200 Descent Points to 2 Mystery Coins.',      max:99 },
  { id:'afk-title-void',    name:'Title: TheEndless',  icon:'⬇',  cost:300, desc:'Unlock the "TheEndless" leaderboard title.',          max:1 },
  { id:'afk-title-fallen',  name:'Title: TheFallen',   icon:'💀', cost:300, desc:'Unlock the "TheFallen" leaderboard title.',           max:1 },
];

function getAFKSave() {
  try { return _jsonParseSafe(DDStore.getItem('dd_afk'), '{}'); } catch(e) { return {}; }
}
function saveAFKData(o) { DDStore.setItem('dd_afk', JSON.stringify(o)); }

function addDescentPoints(pts) {
  var s = getAFKSave();
  s.totalPoints = (s.totalPoints || 0) + pts;
  s.bestFloor = Math.max(s.bestFloor || 0, AFK.floor);
  saveAFKData(s);
  // Track for achievements
  updateAchievementStat('afkBestFloor', AFK.floor);
  updateAchievementStat('afkTotalPoints', s.totalPoints);
  if (AFK.level >= 10 && AFK.floor >= 50) {
    updateAchievementStat('afkLevel10Floor50', 1);
  }
  checkAchievements();
}

// ── SETUP SCREEN ──
function initAFKSetup() {
  var s = getAFKSave();
  var pts = document.getElementById('afk-setup-points');
  if (pts) pts.textContent = (s.totalPoints || 0).toLocaleString();
  setTimeout(function(){ injectCharSlider('afk-char-list', '_afkCharIdx'); }, 50);

  // Daily challenge — render first so it always shows regardless
  var challenge = getTodayAFKChallenge();
  var completed = isAFKChallengeCompleted();
  var challengeEl = document.getElementById('afk-daily-challenge');
  if (challengeEl) {
    challengeEl.textContent = (completed ? '✓ ' : '🎯 Daily: ') + challenge.desc + (completed ? ' (done)' : ' — +' + challenge.bonus + ' pts');
    challengeEl.style.color = completed ? '#44ff88' : '#ffdd44';
  }

  var list = document.getElementById('afk-char-list');
  if (!list) return;
  list.innerHTML = '';
  if (CHARS.length === 0) {
    list.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.75rem;color:#555;text-align:center;">Create a character first.</p>';
    return;
  }
  var firstBtn = null;
  CHARS.forEach(function(ch, i) {
    if (!ch || !ch.name) return;
    var btn = document.createElement('button');
    btn.className = 'raid-char-btn' + (i === 0 ? ' selected' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', ch.name + ', ' + ch.cls + ', Level ' + (ch.persistLevel||ch.level||1));
    btn.textContent = ch.name + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel||ch.level||1) + ')';
    btn.onclick = function() {
      list.querySelectorAll('.raid-char-btn').forEach(function(b) {
        b.setAttribute('aria-checked', 'false');
        b.classList.remove('selected');
      });
      btn.setAttribute('aria-checked', 'true');
      btn.classList.add('selected');
      AFK.charIdx = i;
      say(ch.name + ' selected.');
    };
    if (i === 0) { AFK.charIdx = 0; firstBtn = btn; }
    list.appendChild(btn);
  });
  if (firstBtn) setTimeout(function() { firstBtn.focus(); }, 150);
  say('Endless Descent. Choose your champion and begin. Your descent points: ' + (s.totalPoints || 0) + '. Daily challenge: ' + challenge.desc + (completed ? ' Completed.' : ' Bonus ' + challenge.bonus + ' points.'));
}

// ── START RUN ──
function startAFKRun() {
  var ch = CHARS[AFK.charIdx];
  if (!ch || !ch.name) { say('Select a character first.'); return; }

  var save = getAFKSave();
  var hpBoosts    = (save.upgrades && save.upgrades['afk-hp-boost'])     || 0;
  var atkBoosts   = (save.upgrades && save.upgrades['afk-atk-boost'])    || 0;
  var extraPotions= (save.upgrades && save.upgrades['afk-extra-potion']) || 0;
  var slowFight   = (save.upgrades && save.upgrades['afk-slow-fight'])   || 0;
  var bandages    = (save.upgrades && save.upgrades['afk-bandages'])     || 0;
  var luckyCharm  = (save.upgrades && save.upgrades['afk-lucky-charm'])  || 0;
  var ironWill    = (save.upgrades && save.upgrades['afk-iron-will'])    || 0;
  var deathWard   = (save.upgrades && save.upgrades['afk-death-save'])   || 0;

  var baseHp = 1000 + (hpBoosts * 50) + (ironWill ? 200 : 0); // Bumped from 300 — allows hours of play
  // Load persistent level
  var persist = getCharPersistentLevel(AFK.charIdx);
  var persistLvl = persist.level || 1;
  var persistHpBonus  = (persistLvl - 1) * 10;
  var persistAtkBonus = (persistLvl - 1) * 1;

  AFK.running = true;
  AFK.floor = 1;
  AFK.totalDmgDealt = 0;
  AFK.totalDmgTaken = 0;
  AFK.enemiesDefeated = 0;
  AFK._bossesDefeated = 0;
  AFK.hp = baseHp + persistHpBonus;
  AFK.maxHp = baseHp + persistHpBonus;
  // Apply equipped weapon/armor
  var _afkWepBonus = 0, _afkDefBonus = 0;
  try {
    var _aw = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
    if (_aw) { var _awAtk = getWeaponAtk(_aw); if (Array.isArray(_awAtk)) _afkWepBonus = Math.floor((_awAtk[0]+_awAtk[1])/2); }
    var _aa = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
    if (_aa) _afkDefBonus = _aa.defBase || _aa.defBonus || 0;
  } catch(e) {}

  AFK.atk = 28 + Math.round((ch.atkBonus || 0) * 0.7) + (ch.level ? (ch.level - 1) * 2 : 0) + (atkBoosts * 5) + persistAtkBonus + _afkWepBonus;
  AFK.def = (ch.defBonus || 0) + _afkDefBonus;
  AFK.points = 0;
  AFK.potions = 5 + extraPotions; // Bumped from 2 — need more for long runs
  AFK.FIGHT_MS = slowFight ? 20000 : 15000; // Slowed from 12/15s — more time per fight = longer runs
  AFK.timerPct = 100;
  // Level tracking
  AFK.level = persistLvl;
  AFK.xp    = persist.xp || 0;
  AFK.levelsGainedThisRun = 0;
  AFK.skills = persist.skills ? persist.skills.slice() : [];
  AFK.battleScrollActive = false;
  AFK.xpBoostFights = 0;
  AFK.xpBoostMult = 1;
  AFK._xpBoostThisFight = false;
  AFK.bandages = bandages;         // regen 8 HP per floor per stack
  AFK.luckyCharm = luckyCharm > 0; // 15% boss dodge
  AFK.deathWard = deathWard > 0;   // survive killing blow once
  AFK._deathWardUsed = false;      // tracks if ward was consumed this run

  // Class passive for AFK
  var clsPassives = {
    'Warrior':     'warrior',     // +10% damage on bosses
    'Assassin':    'assassin',    // 20% one-shot chance
    'Necromancer': 'necromancer', // +5 HP per kill
    'Paladin':     'paladin',     // take 15% less damage
    'Berserker':   'berserker',   // +20% attack but -10% defense
    'Monk':        'monk',        // 10% dodge chance
    'Druid':       'druid',       // heal 3% max HP per floor
    'Sorcerer':    'sorcerer',    // +25% damage but -15% max HP
    'Bard':        'bard',        // 15% chance to skip enemy attack
    'Alchemist':   'alchemist',   // potions heal 60% instead of 45%
    'BloodKnight': 'bloodknight', // heal 8% max HP on boss kill
    'Naturalist':  'naturalist',  // +3 def passively
    'Warlock':     'warlock',     // 25% chance to deal double damage
    'DeathKnight': 'deathknight', // enemies deal 20% less damage
    'Dragonborn':  'dragonborn',  // +15% damage on every attack
    'Cleric':      'cleric',      // heal 5% max HP every 5 floors
    'Wizard':      'wizard',      // reveals enemy stats + 20% chance to deal double spell damage
  };
  AFK.classPassive = clsPassives[ch.cls] || null;

  // Berserker — more attack, less defense
  if (AFK.classPassive === 'berserker') {
    AFK.atk = Math.round(AFK.atk * 1.20);
    AFK.def = Math.max(0, AFK.def - 2);
  }
  // Sorcerer — more damage but fragile
  if (AFK.classPassive === 'sorcerer') {
    AFK.atk = Math.round(AFK.atk * 1.25);
    AFK.maxHp = Math.round(AFK.maxHp * 0.85);
    AFK.hp = AFK.maxHp;
  }
  // Wizard — high damage, very fragile, arcane surges
  if (AFK.classPassive === 'wizard') {
    AFK.atk = Math.round(AFK.atk * 1.30);
    AFK.maxHp = Math.round(AFK.maxHp * 0.80);
    AFK.hp = AFK.maxHp;
  }
  // Dragonborn — flat damage boost
  if (AFK.classPassive === 'dragonborn') {
    AFK.atk = Math.round(AFK.atk * 1.15);
  }
  // Naturalist — passive defense
  if (AFK.classPassive === 'naturalist') {
    AFK.def = (AFK.def || 0) + 3;
  }
  // DeathKnight — enemy damage reduction applied in combat
  // Alchemist — potion heal boost applied in auto-potion code

  goTo('afk');
  // Immediately set level display before updateAFKUI runs
  var lvInitEl = document.getElementById('afk-level-display');
  if (lvInitEl) { lvInitEl.textContent = AFK.level; lvInitEl.setAttribute('aria-label','Level ' + AFK.level); }
  setTimeout(function() { updateAFKUI(); }, 50);
  afkLog('The descent begins. ' + ch.name + ' steps into the dark.', '#8888ff');
  say('Endless Descent started. ' + ch.name + '. Floor 1. HP: ' + AFK.hp + '. Auto-combat every ' + (AFK.FIGHT_MS/1000) + ' seconds.');

  // Play AFK ambient music
  playTrack('afk'); // Add audio/music-afk.mp3 to your audio folder for AFK music

  // Start timer bar animation
  AFK.timerInterval = setInterval(function() {
    if (!AFK.running) return;
    AFK.timerPct -= (100 / (AFK.FIGHT_MS / 100));
    if (AFK.timerPct < 0) AFK.timerPct = 0;
    var bar = document.getElementById('afk-timer-bar');
    if (bar) bar.style.width = Math.max(0, AFK.timerPct) + '%';
  }, 100);

  // Main auto-fight loop
  AFK.interval = setInterval(function() {
    if (!AFK.running) return;
    AFK.timerPct = 100;
    afkDoFight();
  }, AFK.FIGHT_MS);
}

// ── AUTO FIGHT ──
function afkDoFight() {
  // ── BOSS FLOOR CHECK — every 25 floors ──
  var isBossFloor = AFK.floor > 0 && AFK.floor % 25 === 0;
  if (isBossFloor) {
    afkDoBossFight();
    return;
  }

  // Pick enemy tier based on floor
  var tier = AFK.floor <= 5 ? 't1' : AFK.floor <= 15 ? 't2' : AFK.floor <= 30 ? 't3' : 't4';
  var pool = (ENEMIES[tier] || ENEMIES['t2']).slice();
  if (!pool || pool.length === 0) pool = ENEMIES['t1'].slice();
  // Inject exclusive endless enemies at floor 20+ (30% chance at t3, 50% at t4)
  if (AFK.floor >= 20 && AFK_EXCLUSIVE_ENEMIES[tier]) {
    var excChance = tier === 't4' ? 0.50 : 0.30;
    if (Math.random() < excChance) {
      pool = AFK_EXCLUSIVE_ENEMIES[tier];
    }
  }
  var base = pool[Math.floor(Math.random() * pool.length)];
  // Void Titan scales with floor
  if (base.special === 'void-titan') {
    base = { name:'The Void Titan', icon:'🌀', hp: 80 + AFK.floor * 2,
      atk:[10 + Math.floor(AFK.floor * 0.3), 16 + Math.floor(AFK.floor * 0.4)],
      special:'void-titan', desc:'Scales with your floor.' };
  }

  // Apply class passive — Assassin 20% one-shot
  if (AFK.classPassive === 'assassin' && Math.random() < 0.20) {
    var pts = 5 + Math.floor(AFK.floor / 2);
    AFK.points += pts;
    var xpGain = 20 + (AFK.floor * 3);
    AFK.xp += xpGain;
    afkCheckLevelUp();
    AFK.floor++;
    afkLog('🗡️ Assassin instinct — one-shot kill! +' + pts + ' pts. → Floor ' + AFK.floor, '#ff88ff');
    say('Assassin one-shot. Floor ' + AFK.floor + '.');
    updateAFKUI();
    return;
  }

  // Scale enemy with floor
  var floorMult = 1 + (AFK.floor - 1) * 0.03; // reduced from 0.06 — was too punishing
  var eHp  = Math.round(base.hp  * floorMult);
  var eAtk = [Math.round(base.atk[0] * floorMult), Math.round(base.atk[1] * floorMult)];
  var totalPlayerDmg = 0;
  var totalEnemyDmg  = 0;
  var rounds = 0;
  var maxRounds = 20; // safety cap

  // Full combat loop — runs until enemy or player dies
  while (eHp > 0 && AFK.hp > 0 && rounds < maxRounds) {
    rounds++;
    // Player hits
    var playerDmg = Math.max(1, rnd(AFK.atk - 2, AFK.atk + 6));
    // Watcher — gets stronger every round instead of attacking
    if (base.special === 'watcher') {
      eAtk = [Math.round(eAtk[0] * (1 + rounds * 0.5)), Math.round(eAtk[1] * (1 + rounds * 0.5))];
    }
    // Battle Scroll — 2x damage on first round
    if (AFK.battleScrollActive && rounds === 1) {
      playerDmg = playerDmg * 2;
      AFK.battleScrollActive = false;
    }
    // Void Shard XP boost tracking
    if (AFK.xpBoostFights && AFK.xpBoostFights > 0 && rounds === 1) {
      AFK._xpBoostThisFight = true;
    }
    eHp -= playerDmg;
    totalPlayerDmg += playerDmg;
    AFK.totalDmgDealt += playerDmg;
    if (eHp <= 0) break;
    // Enemy hits back
    var enemyDmg = Math.max(1, rnd(eAtk[0], eAtk[1]) - AFK.def);
    if (AFK.classPassive === 'paladin') enemyDmg = Math.round(enemyDmg * 0.85);
    if (AFK.classPassive === 'deathknight') enemyDmg = Math.round(enemyDmg * 0.80);
    if (AFK.classPassive === 'monk' && Math.random() < 0.10) enemyDmg = 0;
    if (AFK.classPassive === 'bard' && Math.random() < 0.15) { enemyDmg = 0; afkLog('🎵 Bard charm — enemy attack skipped!', '#88ffaa'); }
    if (AFK.classPassive === 'warlock' && Math.random() < 0.25) { playerDmg = playerDmg * 2; afkLog('🧿 Warlock surge — double damage!', '#cc88ff'); }
    if (AFK.classPassive === 'wizard' && Math.random() < 0.20) { playerDmg = playerDmg * 2; afkLog('🧙 Arcane surge — spell doubles in power!', '#aaaaff'); }
    AFK.hp = Math.max(0, AFK.hp - enemyDmg);
    AFK.totalDmgTaken += enemyDmg;
    totalEnemyDmg += enemyDmg;
  }

  // Endless Knight — respawns once with 50% HP
  if (eHp <= 0 && base.special === 'endless-knight' && !AFK._endlessKnightRespawned) {
    AFK._endlessKnightRespawned = true;
    eHp = Math.round(base.hp * 0.50);
    afkLog('💀 The Endless Knight falls... and rises again with ' + eHp + ' HP!', '#ff8888');
    say('The Endless Knight respawns with ' + eHp + ' HP!');
  }
  AFK._endlessKnightRespawned = false;
  if (eHp <= 0) {
    // Enemy defeated
    var pts = 5 + Math.floor(AFK.floor / 2);
    AFK.points += pts;
    AFK.enemiesDefeated++;

    // Roll for loot drop
    afkRollLoot();

    // XP gain — same rate as dungeons
    var xpGain = 20 + (AFK.floor * 3);
    if (AFK._xpBoostThisFight && AFK.xpBoostFights > 0) {
      xpGain = Math.round(xpGain * (AFK.xpBoostMult || 1.5));
      AFK.xpBoostFights--;
      AFK._xpBoostThisFight = false;
      if (AFK.xpBoostFights === 0) { afkLog('🔮 Void Shard expired.', '#555'); }
    }
    AFK.xp += xpGain;

    // Check level up
    afkCheckLevelUp();

    // Druid passive — heal 3% max HP each floor
    if (AFK.classPassive === 'druid') {
      var druidHeal = Math.round(AFK.maxHp * 0.03);
      AFK.hp = Math.min(AFK.maxHp, AFK.hp + druidHeal);
    }
    // Cleric — heal 5% max HP every 5 floors
    if (AFK.classPassive === 'cleric' && AFK.floor % 5 === 0) {
      var clericHeal = Math.round(AFK.maxHp * 0.05);
      AFK.hp = Math.min(AFK.maxHp, AFK.hp + clericHeal);
      afkLog('✝️ Cleric blessing — +' + clericHeal + ' HP.', '#ffffaa');
    }
    AFK.floor++;
    var hpColor = AFK.hp > AFK.maxHp * 0.5 ? '#a0e0ff' : AFK.hp > AFK.maxHp * 0.25 ? '#ffaa44' : '#ff6666';
    // Necromancer passive — heal 5 HP per kill
    if (AFK.classPassive === 'necromancer') {
      AFK.hp = Math.min(AFK.maxHp, AFK.hp + 5);
    }
    // Bandages passive — regen 8 HP per floor per stack
    if (AFK.bandages > 0) {
      var bandageHeal = AFK.bandages * 8;
      AFK.hp = Math.min(AFK.maxHp, AFK.hp + bandageHeal);
    }
    afkLog(base.icon + ' ' + base.name + ' defeated in ' + rounds + ' rounds. Dealt ' + totalPlayerDmg + ', took ' + totalEnemyDmg + '. +' + pts + ' pts +' + xpGain + ' xp. HP: ' + AFK.hp + '/' + AFK.maxHp + (AFK.classPassive === 'necromancer' ? ' (+5 lifesteal)' : ''), hpColor);
    say(base.name + ' defeated. Floor ' + AFK.floor + '. Plus ' + pts + ' descent points. HP: ' + AFK.hp + '.');
    updateAFKUI();

    // Auto-potion after winning if low
    if (AFK.hp <= Math.round(AFK.maxHp * 0.30) && AFK.potions > 0) {
      var heal = Math.round(AFK.maxHp * (AFK.classPassive === 'alchemist' ? 0.60 : 0.45));
      AFK.hp = Math.min(AFK.maxHp, AFK.hp + heal);
      AFK.potions--;
      afkLog('🧪 Auto-potion used after combat. HP: ' + AFK.hp + '/' + AFK.maxHp + '. ' + AFK.potions + ' left.' + (AFK.classPassive === 'alchemist' ? ' (Alchemist boost)' : ''), '#44ff88');
      say('Auto potion. HP: ' + AFK.hp + '. Potions left: ' + AFK.potions + '.');
      updateAFKUI();
    }

    // Check daily challenge on every floor
    afkCheckDailyChallenge();

    // Every 10 floors — full heal + potion refill
    if (AFK.floor > 1 && AFK.floor % 10 === 0) {
      AFK.hp = AFK.maxHp;
      AFK.potions = Math.min(AFK.potions + 3, 10); // Refill up to 3 potions, max 10
      afkLog('✨ Floor ' + AFK.floor + ' cleared. Full heal granted. Potions restocked. The descent deepens.', '#44ff88');
      say('Floor ' + AFK.floor + ' milestone. Full heal! HP restored. Potions refilled to ' + AFK.potions + '.');
      updateAFKUI();
    } else if (AFK.floor % 10 === 1 && AFK.floor > 1) {
      afkLog('⬇ Floor ' + AFK.floor + ' reached. The darkness deepens.', '#8888ff');
      say('Milestone! Floor ' + AFK.floor + '. Total points this run: ' + AFK.points + '.');
    }
    return;
  }

  // Player died
  // Death Ward — survive killing blow once per run
  if (AFK.hp <= 0 && AFK.deathWard && !AFK._deathWardUsed) {
    AFK._deathWardUsed = true;
    AFK.hp = 1;
    afkLog('✨ Death Ward activates — you survive with 1 HP!', '#ffdd44');
    say('Death Ward activated. You survive with 1 HP.');
    updateAFKUI();
    return;
  }
  afkLog(base.icon + ' ' + base.name + ' — you fell after ' + rounds + ' rounds. Dealt ' + totalPlayerDmg + ', took ' + totalEnemyDmg + '.', '#ff4444');
  say('You fell to ' + base.name + ' on floor ' + AFK.floor + '.');
  updateAFKUI();
  afkEndRun();
}

// ── END RUN ──
function afkEndRun() {
  AFK.running = false;
  clearInterval(AFK.interval);
  clearInterval(AFK.timerInterval);
  AFK.interval = null;
  AFK.timerInterval = null;
  _gameStatusHide();

  // Save points
  addDescentPoints(AFK.points);
  var save = getAFKSave();

  // Save persistent level progress
  saveCharPersistentLevel(AFK.level, AFK.xp, AFK.skills, AFK.maxHp, AFK.atk - 20, AFK.charIdx);

  // If levels were gained this run — show skill pick screen first
  if (AFK.levelsGainedThisRun > 0) {
    afkShowSkillPick();
    return;
  }

  afkShowSummary();
}

function afkShowSkillPick() {
  var ch = CHARS[AFK.charIdx];
  if (!ch) { afkShowSummary(); return; }

  // Build available skills for this class that aren't already unlocked
  var allSkills = CLASS_SKILLS[ch.cls] || [];
  var available = allSkills.filter(function(sk) {
    return AFK.skills.indexOf(sk.effect) === -1;
  });

  if (available.length === 0) { afkShowSummary(); return; }

  // Show AFK skill pick overlay
  var ov = document.getElementById('ov-afk-skill');
  if (!ov) { afkShowSummary(); return; }

  var grid = document.getElementById('afk-skill-grid');
  var title = document.getElementById('afk-skill-title');
  if (title) title.textContent = AFK.levelsGainedThisRun + ' level' + (AFK.levelsGainedThisRun > 1 ? 's' : '') + ' gained. Choose ' + AFK.levelsGainedThisRun + ' skill' + (AFK.levelsGainedThisRun > 1 ? 's' : '') + '.';

  AFK._skillsToChoose = AFK.levelsGainedThisRun;
  AFK._skillsChosen = 0;

  if (grid) {
    grid.innerHTML = '';
    // Pick up to 6 random available skills
    var pool = available.slice().sort(function(){ return Math.random() - 0.5; }).slice(0, 6);
    pool.forEach(function(sk) {
      var btn = document.createElement('button');
      btn.style.cssText = 'background:#0a0a0a;border:1px solid #333;padding:10px;border-radius:4px;text-align:left;cursor:pointer;font-family:Cinzel,serif;';
      btn.setAttribute('aria-label', sk.name + '. ' + sk.desc + '. Cost ' + sk.spCost + ' SP.');
      var nameEl = document.createElement('div');
      nameEl.style.cssText = 'font-size:0.75rem;color:#ffdd44;margin-bottom:3px;';
      nameEl.textContent = (sk.icon || '') + ' ' + sk.name;
      var descEl = document.createElement('div');
      descEl.style.cssText = 'font-size:0.62rem;color:#888;line-height:1.5;';
      descEl.textContent = sk.desc;
      var costEl = document.createElement('div');
      costEl.style.cssText = 'font-size:0.6rem;color:#555;margin-top:4px;';
      costEl.textContent = sk.spCost + ' SP · ' + (sk.tier || 'common');
      btn.appendChild(nameEl);
      btn.appendChild(descEl);
      btn.appendChild(costEl);
      btn.onclick = (function(skill, b) {
        return function() {
          if (AFK.skills.indexOf(skill.effect) === -1) AFK.skills.push(skill.effect);
          AFK._skillsChosen++;
          b.style.borderColor = '#44ff88';
          b.style.opacity = '0.5';
          b.disabled = true;
          say(skill.name + ' selected.');
          // Save after each pick
          saveCharPersistentLevel(AFK.level, AFK.xp, AFK.skills, AFK.maxHp, AFK.atk - 20, AFK.charIdx);
          if (AFK._skillsChosen >= AFK._skillsToChoose) {
            setTimeout(function() {
              ov.classList.remove('open');
              afkShowSummary();
            }, 800);
          }
        };
      })(sk, btn);
      grid.appendChild(btn);
    });
  }

  ov.classList.add('open');
  say('Level up skill selection. You gained ' + AFK.levelsGainedThisRun + ' level' + (AFK.levelsGainedThisRun > 1 ? 's' : '') + '. Choose ' + AFK.levelsGainedThisRun + ' skill' + (AFK.levelsGainedThisRun > 1 ? 's' : '') + ' for your character.');
  setTimeout(function() {
    var firstBtn = grid ? grid.querySelector('button') : null;
    if (firstBtn) firstBtn.focus();
  }, 150);
}

function afkShowSummary() {
  var save = getAFKSave();
  var summaryEl = document.getElementById('afk-summary-content');
  if (summaryEl) {
    summaryEl.innerHTML = '';
    var rows = [
      ['Floor Reached',          AFK.floor],
      ['Level Reached',          AFK.level],
      ['Levels Gained This Run', '+' + AFK.levelsGainedThisRun],
      ['Skills Unlocked',        AFK.skills.length],
      ['Enemies Defeated',       AFK.enemiesDefeated || 0],
      ['Bosses Defeated',        AFK._bossesDefeated || 0],
      ['Total Damage Dealt',     (AFK.totalDmgDealt || 0).toLocaleString()],
      ['Total Damage Taken',     (AFK.totalDmgTaken || 0).toLocaleString()],
      ['Descent Points Earned',  '+' + AFK.points],
      ['Total Descent Points',   save.totalPoints.toLocaleString()],
      ['Best Floor Ever',        save.bestFloor],
    ];
    rows.forEach(function(pair) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;border-bottom:1px solid #111;padding:6px 0;';
      var label = document.createElement('span');
      label.style.color = '#555';
      label.style.fontFamily = 'Cinzel,serif';
      label.style.fontSize = '0.7rem';
      label.textContent = pair[0];
      var val = document.createElement('span');
      val.style.color = '#aaa';
      val.style.fontFamily = 'Cinzel,serif';
      val.style.fontSize = '0.7rem';
      val.textContent = pair[1];
      row.appendChild(label);
      row.appendChild(val);
      summaryEl.appendChild(row);
    });
  }

  goTo('afk-summary');
  window.scrollTo(0, 0);
  say('Run ended. Floor ' + AFK.floor + ' reached. Level ' + AFK.level + '. ' + AFK.levelsGainedThisRun + ' levels gained. ' + AFK.points + ' descent points earned. Your progress is saved and carries into all game modes.');
  stopAmbient();
  playTrack(getMenuTrack());
}

function endAFKRun() {
  if (!AFK.running) { goTo('menu'); return; }
  afkEndRun();
}

// ── MANUAL POTION ──
function afkUsePotion() {
  if (!AFK.running) return;
  if (AFK.potions <= 0) { say('No potions remaining.'); return; }
  var heal = Math.round(AFK.maxHp * 0.40);
  AFK.hp = Math.min(AFK.maxHp, AFK.hp + heal);
  AFK.potions--;
  afkLog('🧪 Potion used. Restored ' + heal + ' HP. ' + AFK.potions + ' remaining.', '#44ff88');
  say('Potion used. HP: ' + AFK.hp + '. Potions remaining: ' + AFK.potions + '.');
  updateAFKUI();
}

// ── UI UPDATE ──
function updateAFKUI() {
  var floorEl = document.getElementById('afk-floor-display');
  if (floorEl) {
    floorEl.textContent = AFK.floor;
    floorEl.setAttribute('aria-label', 'Floor ' + AFK.floor);
  }
  if (AFK.running) _gameStatusNotify('Endless Descent', 'Floor ' + AFK.floor + ' — ' + AFK.points.toLocaleString() + ' points');
  var hpPct = Math.max(0, Math.round((AFK.hp / AFK.maxHp) * 100));
  var hpBar = document.getElementById('afk-hp-bar');
  if (hpBar) {
    hpBar.style.width = hpPct + '%';
    hpBar.setAttribute('aria-valuenow', hpPct);
    hpBar.style.background = hpPct > 50
      ? 'linear-gradient(90deg,#228822,#44ff44)'
      : hpPct > 25
        ? 'linear-gradient(90deg,#886622,#ffaa44)'
        : 'linear-gradient(90deg,#882222,#ff4444)';
  }
  var hpText = document.getElementById('afk-hp-text');
  if (hpText) hpText.textContent = AFK.hp + ' / ' + AFK.maxHp;
  var ptsEl = document.getElementById('afk-points-display');
  if (ptsEl) ptsEl.textContent = AFK.points.toLocaleString();
  var lvlEl = document.getElementById('afk-level-display');
  if (lvlEl) lvlEl.textContent = AFK.level || 1;
  // XP bar
  var xpNeeded = [0,100,220,380,580,820,1100,1430,1810,2240,9999][AFK.level || 1];
  var xpPct = AFK.level >= 10 ? 100 : Math.min(100, Math.round(((AFK.xp || 0) / xpNeeded) * 100));
  var xpBar = document.getElementById('afk-xp-bar');
  if (xpBar) xpBar.style.width = xpPct + '%';
  var xpText = document.getElementById('afk-xp-text');
  if (xpText) xpText.textContent = (AFK.xp || 0) + ' / ' + (AFK.level >= 10 ? 'MAX' : xpNeeded);
  var potBtn = document.getElementById('afk-potion-btn');
  if (potBtn) {
    potBtn.textContent = '🧪 Potion (' + AFK.potions + ')';
    potBtn.disabled = AFK.potions <= 0;
    potBtn.style.opacity = AFK.potions <= 0 ? '0.4' : '1';
  }
}



// ── AFK LOOT SYSTEM ──
var AFK_LOOT_ITEMS = [
  // Potions
  { id:'potion',       name:'Health Potion',    icon:'🧪', desc:'Added to your potion stock.',       floor:1,  rarity:'common',    apply:function(){ AFK.potions++; afkLog('🧪 Health Potion found. Potions: ' + AFK.potions + '.', '#44ff88'); say('Found a Health Potion. Potions now: ' + AFK.potions + '.'); } },
  { id:'big-potion',   name:'Mega Potion',       icon:'🧪', desc:'Heals 60% HP immediately.',         floor:20, rarity:'uncommon',  apply:function(){ var h=Math.round(AFK.maxHp*0.60); AFK.hp=Math.min(AFK.maxHp,AFK.hp+h); afkLog('🧪 Mega Potion! Healed ' + h + ' HP. HP: ' + AFK.hp + '/' + AFK.maxHp + '.', '#44ff88'); say('Found a Mega Potion. Healed ' + h + ' HP.'); } },
  // Weapons
  { id:'rusty-blade',  name:'Rusty Blade',       icon:'🗡️', desc:'+5 attack for this run.',           floor:1,  rarity:'common',    apply:function(){ AFK.atk+=5;  afkLog('🗡️ Rusty Blade found. Attack +5. Now ' + AFK.atk + '.', '#a0e0ff'); say('Found a Rusty Blade. Attack increased by 5. Now ' + AFK.atk + '.'); } },
  { id:'sharp-edge',   name:'Sharp Edge',        icon:'⚔️', desc:'+8 attack for this run.',           floor:10, rarity:'uncommon',  apply:function(){ AFK.atk+=8;  afkLog('⚔️ Sharp Edge found. Attack +8. Now ' + AFK.atk + '.', '#a0e0ff'); say('Found a Sharp Edge. Attack increased by 8. Now ' + AFK.atk + '.'); } },
  { id:'void-blade',   name:'Void Blade',        icon:'🌑', desc:'+15 attack for this run.',          floor:30, rarity:'rare',      apply:function(){ AFK.atk+=15; afkLog('🌑 Void Blade found! Attack +15. Now ' + AFK.atk + '.', '#8888ff'); say('Found a Void Blade. Attack increased by 15. Now ' + AFK.atk + '.'); } },
  // Armor
  { id:'iron-fragment','name':'Iron Fragment',   icon:'🛡️', desc:'+3 defense for this run.',          floor:1,  rarity:'common',    apply:function(){ AFK.def+=3;  afkLog('🛡️ Iron Fragment found. Defense +3. Now ' + AFK.def + '.', '#a0e0ff'); say('Found an Iron Fragment. Defense increased by 3.'); } },
  { id:'heavy-stone',  name:'Heavy Stone',       icon:'🪨', desc:'+5 defense, -2 attack.',            floor:5,  rarity:'uncommon',  apply:function(){ AFK.def+=5; AFK.atk=Math.max(1,AFK.atk-2); afkLog('🪨 Heavy Stone. Defense +5, Attack -2.', '#a0e0ff'); say('Found a Heavy Stone. Defense plus 5, Attack minus 2.'); } },
  { id:'void-armor',   name:'Void Plate',        icon:'⚫', desc:'+10 defense for this run.',         floor:40, rarity:'rare',      apply:function(){ AFK.def+=10; afkLog('⚫ Void Plate found! Defense +10. Now ' + AFK.def + '.', '#8888ff'); say('Found Void Plate. Defense increased by 10.'); } },
  // Specials
  { id:'blood-vial',   name:'Blood Vial',        icon:'🩸', desc:'Heals 30 HP immediately.',          floor:5,  rarity:'uncommon',  apply:function(){ AFK.hp=Math.min(AFK.maxHp,AFK.hp+30); afkLog('🩸 Blood Vial. Healed 30 HP. HP: ' + AFK.hp + '/' + AFK.maxHp + '.', '#ff8888'); say('Found a Blood Vial. Healed 30 HP.'); } },
  { id:'herb-bundle',  name:'Herb Bundle',       icon:'🌿', desc:'Heals 20 HP and +2 defense.',       floor:3,  rarity:'common',    apply:function(){ AFK.hp=Math.min(AFK.maxHp,AFK.hp+20); AFK.def+=2; afkLog('🌿 Herb Bundle. +20 HP, +2 defense.', '#44ff88'); say('Found an Herb Bundle. Healed 20 HP and defense plus 2.'); } },
  { id:'descent-gem',  name:'Descent Gem',       icon:'💎', desc:'+20 descent points instantly.',     floor:10, rarity:'uncommon',  apply:function(){ AFK.points+=20; afkLog('💎 Descent Gem! +20 descent points.', '#ffdd44'); say('Found a Descent Gem. Plus 20 descent points.'); } },
  { id:'battle-scroll','name':'Battle Scroll',   icon:'📜', desc:'Next fight deals 2x damage.',       floor:15, rarity:'uncommon',  apply:function(){ AFK.battleScrollActive=true; afkLog('📜 Battle Scroll! Next fight deals double damage.', '#ffaa44'); say('Found a Battle Scroll. Your next fight deals double damage.'); } },
  { id:'void-shard',   name:'Void Shard',        icon:'🔮', desc:'+50% XP for next 5 fights.',        floor:25, rarity:'rare',      apply:function(){ AFK.xpBoostFights=5; AFK.xpBoostMult=1.5; afkLog('🔮 Void Shard! +50% XP for next 5 fights.', '#8888ff'); say('Found a Void Shard. Plus 50 percent XP for your next 5 fights.'); } },
  { id:'elixir',       name:'Elixir of Power',   icon:'✨', desc:'+10 attack AND +5 defense.',        floor:50, rarity:'legendary', apply:function(){ AFK.atk+=10; AFK.def+=5; afkLog('✨ ELIXIR OF POWER! Attack +10, Defense +5.', '#ffdd44'); say('Found an Elixir of Power. Attack plus 10, Defense plus 5.'); } },
];

function afkRollLoot() {
  if (!AFK.running) return;
  // 15% base chance to find an item, +5% every 25 floors
  var baseChance = 0.15 + (Math.floor(AFK.floor / 25) * 0.05);
  if (Math.random() > baseChance) return;

  // Filter by floor requirement and weighted by rarity
  var available = AFK_LOOT_ITEMS.filter(function(item) {
    return AFK.floor >= item.floor;
  });
  if (available.length === 0) return;

  // Weight by rarity: common=4, uncommon=2, rare=1, legendary=0.3
  var weights = { common:4, uncommon:2, rare:1, legendary:0.3 };
  var total = available.reduce(function(sum, item) {
    return sum + (weights[item.rarity] || 1);
  }, 0);
  var roll = Math.random() * total;
  var picked = null;
  var cum = 0;
  for (var i = 0; i < available.length; i++) {
    cum += (weights[available[i].rarity] || 1);
    if (roll <= cum) { picked = available[i]; break; }
  }
  if (!picked) picked = available[Math.floor(Math.random() * available.length)];

  // Apply the item
  picked.apply();
  updateAFKUI();

  // Check daily challenge
  afkCheckDailyChallenge();
}

// ── DAILY AFK CHALLENGE ──
var AFK_DAILY_CHALLENGES = [
  { id:'reach-floor-20',  desc:'Reach floor 20.',          target: 20,  type:'floor',  bonus: 50  },
  { id:'reach-floor-50',  desc:'Reach floor 50.',          target: 50,  type:'floor',  bonus: 100 },
  { id:'reach-floor-100', desc:'Reach floor 100.',         target: 100, type:'floor',  bonus: 200 },
  { id:'reach-level-3',   desc:'Reach level 3 in one run.',target: 3,   type:'level',  bonus: 75  },
  { id:'reach-level-5',   desc:'Reach level 5 in one run.',target: 5,   type:'level',  bonus: 150 },
  { id:'defeat-boss',     desc:'Defeat a boss floor.',     target: 1,   type:'boss',   bonus: 80  },
  { id:'defeat-3-bosses', desc:'Defeat 3 boss floors.',    target: 3,   type:'boss',   bonus: 200 },
  { id:'earn-100-pts',    desc:'Earn 100 descent points.', target: 100, type:'points', bonus: 60  },
  { id:'earn-500-pts',    desc:'Earn 500 descent points.', target: 500, type:'points', bonus: 150 },
];

function getTodayAFKChallenge() {
  // Pick a deterministic challenge based on date
  var d = new Date();
  var dateKey = d.getFullYear() + '-' + d.getMonth() + '-' + d.getDate();
  var idx = (d.getDate() + d.getMonth() * 7) % AFK_DAILY_CHALLENGES.length;
  return AFK_DAILY_CHALLENGES[idx];
}

function isAFKChallengeCompleted() {
  var s = getAFKSave();
  var challenge = getTodayAFKChallenge();
  var key = 'challenge_' + todayKey() + '_' + challenge.id;
  return !!(s[key]);
}

function afkCheckDailyChallenge() {
  if (isAFKChallengeCompleted()) return;
  var challenge = getTodayAFKChallenge();
  var met = false;
  if (challenge.type === 'floor'  && AFK.floor  >= challenge.target) met = true;
  if (challenge.type === 'level'  && AFK.level  >= challenge.target) met = true;
  if (challenge.type === 'points' && AFK.points >= challenge.target) met = true;
  if (challenge.type === 'boss') {
    AFK._bossesDefeated = (AFK._bossesDefeated || 0);
    if (AFK._bossesDefeated >= challenge.target) met = true;
  }
  if (!met) return;
  // Complete it
  var s = getAFKSave();
  var key = 'challenge_' + todayKey() + '_' + challenge.id;
  s[key] = true;
  s.totalPoints = (s.totalPoints || 0) + challenge.bonus;
  saveAFKData(s);
  afkLog('🎯 DAILY CHALLENGE COMPLETE! ' + challenge.desc + ' +' + challenge.bonus + ' bonus pts!', '#ffdd44');
  say('Daily challenge complete! ' + challenge.desc + ' Plus ' + challenge.bonus + ' bonus descent points!');
  updateAFKUI();
}

// ── AFK BOSS FLOORS ──
// ── ENDLESS EXCLUSIVE ENEMIES ──
// These enemies only appear in Endless Descent
// They have special mechanics that play out in the AFK combat loop
var AFK_EXCLUSIVE_ENEMIES = {
  t3: [
    { name:'The Hydra',        icon:'🐉', hp:95,  atk:[14,22], special:'hydra',       desc:'Attacks 3 times per turn. Each head is a separate strike.' },
    { name:'The Minotaur',     icon:'🐂', hp:110, atk:[12,18], special:'minotaur',    desc:'Charges every 3 rounds for a devastating 3x damage strike.' },
    { name:'The Colossus Spider', icon:'🕷️', hp:80, atk:[11,17], special:'spider',   desc:'Poisons AND freezes simultaneously. Hard to deal with.' },
    { name:'The Watcher',      icon:'👁️', hp:70,  atk:[8,12],  special:'watcher',    desc:'Does not attack. Gets 50% stronger every round you survive.' },
    { name:'The Accumulator',  icon:'🔮', hp:88,  atk:[10,16], special:'accumulator', desc:'Absorbs damage dealt to it and reflects 20% back next turn.' },
    { name:'Void Leech',       icon:'🌑', hp:75,  atk:[12,19], special:'void-leech',  desc:'Drains 5 HP from you each turn regardless of combat outcome.' },
    { name:'The Eternal',      icon:'♾️', hp:100, atk:[11,17], special:'eternal',     desc:'Cannot be killed below 1 HP more than once per combat.' },
    { name:'Soul Collector',   icon:'💜', hp:85,  atk:[13,20], special:'soul-collector', desc:'Steals 10 SP from you on each hit. High SP players beware.' },
  ],
  t4: [
    { name:'The Endless Knight', icon:'💀', hp:130, atk:[16,24], special:'endless-knight', desc:'Respawns with 50% HP the first time you kill it.' },
    { name:'The Void Titan',   icon:'🌀', hp:150, atk:[18,28], special:'void-titan',     desc:'HP and ATK scale with your current floor. Always a challenge.' },
    { name:'The Dread Hydra',  icon:'🐲', hp:140, atk:[15,22], special:'dread-hydra',    desc:'Four heads. Four hits per turn. Deep floor terror.' },
    { name:'The Labyrinth Guard', icon:'🗿', hp:160, atk:[14,20], special:'labyrinth',   desc:'Cannot be one-shot. Always survives at least 2 rounds.' },
  ],
};

var AFK_BOSSES = [
  { name:'The Hollow Warden',    icon:'🕯️', hpMult:1.8, atkMult:1.2, pts:50,  color:'#aaaaff', msg:'A guardian stirs in the dark.' },
  { name:'The Ashen Colossus',   icon:'🔥', hpMult:2.2, atkMult:1.4, pts:75,  color:'#ff8844', msg:'The floor trembles. Something massive descends.' },
  { name:'The Void Sentinel',    icon:'🌑', hpMult:2.6, atkMult:1.6, pts:100, color:'#8888ff', msg:'The void takes shape.' },
  { name:'The Eternal Revenant', icon:'💀', hpMult:3.0, atkMult:1.8, pts:150, color:'#ff4444', msg:'It has been waiting.' },
  { name:'The Deep Architect',   icon:'🏛️', hpMult:3.5, atkMult:2.0, pts:250, color:'#ffdd44', msg:'Something ancient notices your descent.' },
];

function afkDoBossFight() {
  // Pick boss based on depth
  var bossIdx = Math.min(Math.floor(AFK.floor / 100), AFK_BOSSES.length - 1);
  var boss = AFK_BOSSES[bossIdx];

  // Boss scaling: balanced so floor 25 boss is beatable with base stats
  var floorBonus = Math.floor(AFK.floor / 25) * 8; // +8 HP per 25 floors
  var bHp  = Math.round((80 + floorBonus) * boss.hpMult); // base 80 HP
  // Soft sqrt curve attack scaling
  var bAtkBase = 12 + Math.floor(Math.sqrt(AFK.floor) * 1.8);
  var bAtk = [Math.round(bAtkBase * boss.atkMult * 0.85), Math.round(bAtkBase * boss.atkMult)];

  afkLog('⚡ BOSS FLOOR ' + AFK.floor + ' — ' + boss.icon + ' ' + boss.name, boss.color);
  afkLog(boss.msg, '#555');
  say('Boss floor ' + AFK.floor + '. ' + boss.name + '. ' + boss.msg);

  var totalPlayerDmg = 0;
  var totalEnemyDmg  = 0;
  var rounds = 0;
  var maxRounds = 40;
  var hp = AFK.hp;

  while (bHp > 0 && hp > 0 && rounds < maxRounds) {
    rounds++;
    var pDmg = Math.max(1, rnd(AFK.atk - 2, AFK.atk + 8));
    // Warrior passive — +10% damage on boss
    if (AFK.classPassive === 'warrior') pDmg = Math.round(pDmg * 1.10);
    bHp -= pDmg;
    totalPlayerDmg += pDmg;
    if (bHp <= 0) break;
    var eDmg = Math.max(1, rnd(bAtk[0], bAtk[1]) - AFK.def);
    // Lucky Charm — 15% chance to dodge boss attack
    if (AFK.luckyCharm && Math.random() < 0.15) {
      eDmg = 0;
      afkLog('🍀 Lucky Charm — boss attack dodged!', '#44ff88');
    }
    hp = Math.max(0, hp - eDmg);
    totalEnemyDmg += eDmg;
  }

  AFK.hp = hp;

  if (bHp <= 0) {
    var bonusPts = boss.pts + Math.floor(AFK.floor / 5);
    AFK.points += bonusPts;
    var xpGain = 150 + (AFK.floor * 5);
    AFK.xp += xpGain;
    afkCheckLevelUp();
    AFK.floor++;
    // Full heal on boss kill
    AFK.hp = AFK.maxHp;
    // BloodKnight — extra heal on boss kill
    if (AFK.classPassive === 'bloodknight') {
      var bkHeal = Math.round(AFK.maxHp * 0.08);
      AFK.hp = Math.min(AFK.maxHp, AFK.hp + bkHeal);
      afkLog('🩸 BloodKnight — +' + bkHeal + ' HP from boss kill.', '#ff6666');
    }
    AFK._bossesDefeated = (AFK._bossesDefeated || 0) + 1;
    afkLog('⚡ ' + boss.name + ' DEFEATED! +' + bonusPts + ' pts +' + xpGain + ' xp. Full heal!', boss.color);
    say('Boss defeated. ' + boss.name + ' falls. Plus ' + bonusPts + ' descent points. Full heal!');
    updateAFKUI();
    // Check daily challenge
    afkCheckDailyChallenge();
  } else {
    afkLog('💀 Fell to ' + boss.name + ' on floor ' + AFK.floor + '. Dealt ' + totalPlayerDmg + ', took ' + totalEnemyDmg + '.', '#ff4444');
    say('You fell to ' + boss.name + ' on floor ' + AFK.floor + '.');
    AFK.hp = 0;
    updateAFKUI();
    afkEndRun();
  }
}

// ── AFK LEVEL UP ──
function afkCheckLevelUp() {
  if (AFK.level >= 10) return;
  var needed = [0,100,220,380,580,820,1100,1430,1810,2240,9999][AFK.level];
  while (AFK.xp >= needed && AFK.level < 10) {
    AFK.xp -= needed;
    AFK.level++;
    AFK.levelsGainedThisRun++;
    needed = [0,100,220,380,580,820,1100,1430,1810,2240,9999][AFK.level];

    // HP increases and heals in real time
    var hpGain = 10;
    var atkGain = 1;
    AFK.maxHp += hpGain;
    AFK.hp = Math.min(AFK.maxHp, AFK.hp + hpGain); // heal on level up
    AFK.atk += atkGain;

    afkLog('━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '#333');
    afkLog('⬆ LEVEL UP! Now Level ' + AFK.level + '. +' + hpGain + ' max HP. +' + atkGain + ' attack. HP fully restored to ' + AFK.maxHp + '.', '#ffdd44');
    say('Level up! You are now Level ' + AFK.level + '. Max HP increased to ' + AFK.maxHp + '. Attack increased. HP restored.');

    // Force level display update — direct DOM write in case updateAFKUI is delayed
    var lvEl = document.getElementById('afk-level-display');
    if (lvEl) {
      lvEl.textContent = AFK.level;
      lvEl.setAttribute('aria-label', 'Level ' + AFK.level);
    }
    updateAFKUI();
    // Flash level badge
    var lvBadge = document.getElementById('afk-level-display');
    if (lvBadge) {
      lvBadge.style.color = '#ffffff';
      setTimeout(function(){ if (lvBadge) lvBadge.style.color = '#ffdd44'; }, 600);
    }

    // Check AFK level achievements
    updateAchievementStat('afkMaxLevel', AFK.level);
    checkAchievements();
  }
}

// ── LOG ──
function afkLog(msg, color) {
  var log = document.getElementById('afk-log');
  if (!log) return;
  // Remove placeholder
  var placeholder = log.querySelector('div[style*="padding-top"]');
  if (placeholder) placeholder.remove();
  var entry = document.createElement('div');
  entry.style.cssText = 'color:' + (color || '#888') + ';border-bottom:1px solid #0a0a0a;padding:3px 0;';
  entry.textContent = msg;
  log.insertBefore(entry, log.firstChild);
  // Keep log manageable
  while (log.children.length > 50) {
    log.removeChild(log.lastChild);
  }
}

// ── SHOP ──
function renderAFKShop() {
  var save = getAFKSave();
  var totalPts = save.totalPoints || 0;
  var upgrades = save.upgrades || {};

  var ptsEl = document.getElementById('afk-shop-points');
  if (ptsEl) ptsEl.textContent = totalPts.toLocaleString();

  var grid = document.getElementById('afk-shop-grid');
  if (!grid) return;
  grid.innerHTML = '';

  AFK_SHOP_ITEMS.forEach(function(item) {
    var owned = upgrades[item.id] || 0;
    var maxed = owned >= item.max;
    var canAfford = totalPts >= item.cost;

    var card = document.createElement('div');
    card.setAttribute('role', 'listitem');
    card.style.cssText = 'background:#0a0a0a;border:1px solid ' + (maxed ? '#2a2a00' : '#1a1a1a') + ';border-radius:4px;padding:12px;display:flex;justify-content:space-between;align-items:center;gap:12px;';

    var info = document.createElement('div');
    info.style.flex = '1';
    var title = document.createElement('div');
    title.style.cssText = 'font-family:Cinzel,serif;font-size:0.72rem;color:' + (maxed ? '#ffdd44' : '#aaa') + ';margin-bottom:3px;';
    title.textContent = item.icon + ' ' + t(item.name);
    var desc = document.createElement('div');
    desc.style.cssText = 'font-family:Cinzel,serif;font-size:0.62rem;color:#555;line-height:1.6;';
    desc.textContent = t(item.desc);
    if (owned > 0 && item.max > 1) {
      var ownedBadge = document.createElement('div');
      ownedBadge.style.cssText = 'font-size:0.58rem;color:#888;margin-top:2px;';
      ownedBadge.textContent = t('Owned') + ': ' + owned + (item.max < 99 ? ' / ' + item.max : '');
      info.appendChild(title);
      info.appendChild(desc);
      info.appendChild(ownedBadge);
    } else {
      info.appendChild(title);
      info.appendChild(desc);
    }

    var btn = document.createElement('button');
    btn.style.cssText = 'padding:8px 12px;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;white-space:nowrap;border-radius:3px;' +
      (maxed ? 'background:#1a1a00;border:1px solid #333;color:#888;' :
       canAfford ? 'background:#1a1400;border:1px solid #ffdd44;color:#ffdd44;' :
       'background:#0a0a0a;border:1px solid #222;color:#444;');
    btn.textContent = maxed ? '✓ Maxed' : item.cost + ' pts';
    btn.disabled = maxed || !canAfford;
    btn.setAttribute('aria-label', item.name + '. ' + item.desc + '. Cost: ' + item.cost + ' points.' + (maxed ? ' Already maxed.' : canAfford ? '' : ' Not enough points.'));
    if (!maxed && canAfford) {
      btn.onclick = (function(it) {
        return function() { buyAFKUpgrade(it); };
      })(item);
    }

    card.appendChild(info);
    card.appendChild(btn);
    grid.appendChild(card);
  });

  say('Descent Shop. ' + totalPts + ' descent points. ' + AFK_SHOP_ITEMS.length + ' items available.');
}

function buyAFKUpgrade(item) {
  var save = getAFKSave();
  var totalPts = save.totalPoints || 0;
  if (totalPts < item.cost) { say('Not enough descent points.'); return; }
  var upgrades = save.upgrades || {};
  var owned = upgrades[item.id] || 0;
  if (owned >= item.max) { say('Already maxed.'); return; }

  // Special: mystery coins
  if (item.id === 'afk-mystery-coins') {
    save.totalPoints = totalPts - item.cost;
    var raidSave = getRaidSave();
    addCoinsToWallet(2);
    setRaidSave(raidSave);
    saveAFKData(save);
    say('Purchased. 2 Mystery Coins added. ' + save.totalPoints + ' descent points remaining.');
    renderAFKShop();
    return;
  }

  // Special: title unlocks
  if (item.id === 'afk-title-void' || item.id === 'afk-title-fallen') {
    var titleName = item.id === 'afk-title-void' ? 'TheEndless' : 'TheFallen';
    // Add to TITLE_TAGS if not already there
    var prefs = _jsonParseSafe(DDStore.getItem('dd_email_prefs'), '{}');
    var unlockedTitles = _jsonParseSafe(DDStore.getItem('dd_unlocked_titles'), '[]');
    if (unlockedTitles.indexOf(titleName) === -1) unlockedTitles.push(titleName);
    DDStore.setItem('dd_unlocked_titles', JSON.stringify(unlockedTitles));
    save.totalPoints = totalPts - item.cost;
    upgrades[item.id] = (owned || 0) + 1;
    save.upgrades = upgrades;
    saveAFKData(save);
    say('Title unlocked: ' + titleName + '. Set it in Account settings.');
    renderAFKShop();
    return;
  }

  save.totalPoints = totalPts - item.cost;
  upgrades[item.id] = owned + 1;
  save.upgrades = upgrades;
  saveAFKData(save);
  say('Purchased ' + item.name + '. ' + save.totalPoints + ' descent points remaining.');
  renderAFKShop();
}



// ── RESTORED MISSING FUNCTIONS ──
function _sbIcon() { return DS.activeSpirit ? DS.activeSpirit.icon : '🔮'; }


// ── RUN MODIFIERS ──

function applyPersistentLevelToDS() {
  if (_charIdx === null) return;
  var p = getCharPersistentLevel(_charIdx);
  if (p.level <= 1) return;
  // Apply accumulated HP and attack bonuses
  var hpBonus  = (p.level - 1) * 10;
  var atkBonus = (p.level - 1) * 1;
  DS.maxHp    += hpBonus;
  DS.hp        = Math.min(DS.maxHp, DS.hp + hpBonus);
  DS.atkBonus += atkBonus;
  DS.level     = p.level;
  DS.xp        = p.xp;
  // Restore persistent skills
  if (p.skills && p.skills.length > 0) {
    p.skills.forEach(function(eff) {
      if (DS.unlockedSkills.indexOf(eff) === -1) DS.unlockedSkills.push(eff);
    });
  }
}

//═════════════════
// CHALLENGES — GAUNTLET + DAILY DUNGEON
//═════════════════

var GAUNTLET_DUNGEONS = [
  'Crypt of Malachar',
  'The Ashbound Wastes',
  'Frosthold Abyss',
  'The Sunken Archives',
  'The Hollow',
  'The Whispering Forest'
];

var DAILY_MODIFIERS_POOL = [
  { id:'double-hp',    name:'Iron Flesh',      desc:'All enemies have double HP.',             apply: function(){ DS._dailyMod_doubleHp = true; } },
  { id:'triple-gold',  name:'Gold Rush',        desc:'Enemies drop triple gold.',               apply: function(){ DS._dailyMod_tripleGold = true; } },
  { id:'no-potions',   name:'Dry Run',          desc:'Potions cannot be used.',                 apply: function(){ DS._dailyMod_noPotions = true; } },
  { id:'fast-enemies', name:'Frenzied',         desc:'Enemies deal 25% more damage.',           apply: function(){ DS._dailyMod_fastEnemies = true; } },
  { id:'early-boss',   name:'Boss Summoned',    desc:'The boss appears on floor 7 instead of 10.',apply: function(){ DS._dailyMod_earlyBoss = true; } },
  { id:'double-xp',    name:'Seasoned Ground',  desc:'Double XP from all kills.',               apply: function(){ DS._dailyMod_doubleXp = true; } },
  { id:'no-shop',      name:'Stripped',         desc:'The shop does not appear.',               apply: function(){ DS._dailyMod_noShop = true; } },
  { id:'lucky',        name:'Fortune Favors',   desc:'All gold drops increased by 50%.',        apply: function(){ DS._dailyMod_lucky = true; } },
];

var GAUNTLET_CHALLENGE_DUNGEONS = ['Crypt of Malachar','The Ashbound Wastes','Frosthold Abyss','The Sunken Archives','The Hollow','The Whispering Forest','The Infernal Descent','The Abyssal Deep'];

var _gauntletCharIdx = 0;
var _dailyCharIdx = 0;
var _gauntletActive = false;
var _gauntletProgress = 0; // which dungeon we're on (0-5)

function initChallenges() {
  switchChallengeTab('gauntlet');
  // populate gauntlet char list
  _populateChallengeCharList('gauntlet-char-list', _gauntletCharIdx, function(i){ _gauntletCharIdx = i; });
  // populate daily char list
  _populateChallengeCharList('daily-char-list', _dailyCharIdx, function(i){ _dailyCharIdx = i; });
  // setup daily dungeon info
  _renderDailyDungeonInfo();
  // inject sliders
  setTimeout(function(){
    injectCharSlider('gauntlet-char-list');
    injectCharSlider('daily-char-list');
  }, 50);
  say('Challenges. Two tabs available: The Gauntlet and Daily Dungeon. Use tab key to switch.');
}

function _populateChallengeCharList(listId, selectedIdx, onSelect) {
  var list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '';
  if (CHARS.length === 0) {
    list.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;">No characters. Create one first.</p>';
    return;
  }
  CHARS.forEach(function(ch, i) {
    var btn = document.createElement('button');
    btn.className = 'menu-btn' + (i === selectedIdx ? ' selected' : '');
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', i === selectedIdx ? 'true' : 'false');
    btn.setAttribute('aria-label', ch.name + ', ' + ch.cls + ', Level ' + (ch.persistLevel||1) + '. Press to select.');
    btn.textContent = ch.name + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel||1) + ')';
    btn.onclick = (function(idx){ return function(){
      list.querySelectorAll('button').forEach(function(b){ b.setAttribute('aria-checked','false'); b.classList.remove('selected'); });
      btn.setAttribute('aria-checked','true'); btn.classList.add('selected');
      onSelect(idx);
      say(ch.name + ' selected.');
    }; })(i);
    list.appendChild(btn);
  });
}

function switchChallengeTab(tab) {
  document.getElementById('ch-panel-gauntlet').style.display = tab === 'gauntlet' ? '' : 'none';
  document.getElementById('ch-panel-daily').style.display = tab === 'daily' ? '' : 'none';
  document.getElementById('ch-tab-gauntlet').setAttribute('aria-selected', tab === 'gauntlet' ? 'true' : 'false');
  document.getElementById('ch-tab-daily').setAttribute('aria-selected', tab === 'daily' ? 'true' : 'false');
  document.getElementById('ch-tab-gauntlet').style.borderBottomColor = tab === 'gauntlet' ? '#ffdd44' : 'transparent';
  document.getElementById('ch-tab-gauntlet').style.color = tab === 'gauntlet' ? '#ffdd44' : '#666';
  document.getElementById('ch-tab-daily').style.borderBottomColor = tab === 'daily' ? '#ffdd44' : 'transparent';
  document.getElementById('ch-tab-daily').style.color = tab === 'daily' ? '#ffdd44' : '#666';
  say(tab === 'gauntlet' ? 'The Gauntlet. All 6 dungeons, one life.' : 'Daily Dungeon. One special dungeon per day.');
}

function _getDailyDungeonSeed() {
  var d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate();
}

function _seededRandom(seed) {
  var x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function _getDailySetup() {
  var seed = _getDailyDungeonSeed();
  var dungeonIdx = Math.floor(_seededRandom(seed) * GAUNTLET_DUNGEONS.length);
  var mod1Idx = Math.floor(_seededRandom(seed + 1) * DAILY_MODIFIERS_POOL.length);
  var mod2Idx = Math.floor(_seededRandom(seed + 2) * DAILY_MODIFIERS_POOL.length);
  if (mod2Idx === mod1Idx) mod2Idx = (mod2Idx + 1) % DAILY_MODIFIERS_POOL.length;
  return {
    dungeon: GAUNTLET_DUNGEONS[dungeonIdx],
    mods: [ DAILY_MODIFIERS_POOL[mod1Idx], DAILY_MODIFIERS_POOL[mod2Idx] ]
  };
}

function _renderDailyDungeonInfo() {
  var setup = _getDailySetup();
  var nameEl = document.getElementById('daily-dung-name');
  var modEl = document.getElementById('daily-dung-modifiers');
  var bestEl = document.getElementById('daily-best');
  if (nameEl) nameEl.textContent = setup.dungeon;
  if (modEl) {
    modEl.innerHTML = setup.mods.map(function(m){
      return '<div style="margin-bottom:4px;">⚡ <strong>' + m.name + '</strong> — ' + m.desc + '</div>';
    }).join('');
  }
  // Check if already completed today
  var todayKey = 'dd_daily_' + _getDailyDungeonSeed();
  var best = DDStore.getItem(todayKey);
  if (bestEl) {
    if (best) {
      bestEl.textContent = 'Today completed! Best time: ' + best + '. Come back tomorrow.';
      say('Daily Dungeon already completed today. Best time: ' + best + '.');
    } else {
      bestEl.textContent = 'Not yet completed today.';
    }
  }
}

// The Gauntlet promised one life for the whole climb and gave the usual lives.
function gauntletOneLife() { DS.lives = 1; DS.maxLives = 1; }
// Endless has no boss, so an Endless character could never finish a Challenge.
function challengeFixEndless() {
  if (DS.diff === 'Endless') { DS.diff = 'Wanderer'; if (!_gauntletActive) { DS.lives = LIVES_MAP.Wanderer; DS.maxLives = LIVES_MAP.Wanderer; } }
}
function endGauntlet() {
  _gauntletActive = false;
  _gauntletProgress = 0;
  var ch = CHARS[_charIdx];
  if (ch) {
    if (ch._gauntletOrigDungeon) ch.dungeon = ch._gauntletOrigDungeon;
    ch._gauntletOrigDungeon = null;
    ch._gauntlet = null;
    saveChars();
  }
}

function startGauntlet() {
  if (CHARS.length === 0) { say('No characters. Create one first.'); return; }
  var ch = CHARS[_gauntletCharIdx];
  if (!ch) { say('Please select a character.'); return; }
  _gauntletActive = true;
  _gauntletProgress = 0;
  // Store the home dungeon on the character (it was put in a global and read
  // back from the character, so the character stayed in the last Gauntlet dungeon).
  if (!ch._gauntlet) ch._gauntletOrigDungeon = ch.dungeon;
  ch._gauntlet = { progress: 0 };
  ch.dungeon = GAUNTLET_DUNGEONS[0];
  ch.floor = 1;
  ch.midRunSave = null;
  _charIdx = _gauntletCharIdx;
  saveChars();
  initDungeon(ch);
  gauntletOneLife();
  challengeFixEndless();
  goTo('dungeon');
  say('The Gauntlet begins. ' + ch.name + ' enters ' + GAUNTLET_DUNGEONS[0] + '. Survive all 6 dungeons.');
}

function startDailyDungeon() {
  if (CHARS.length === 0) { say('No characters. Create one first.'); return; }
  var ch = CHARS[_dailyCharIdx];
  if (!ch) { say('Please select a character.'); return; }
  var setup = _getDailySetup();
  var todayKey = 'dd_daily_' + _getDailyDungeonSeed();
  _charIdx = _dailyCharIdx;
  ch.dungeon = setup.dungeon;
  ch.floor = 1;
  ch.midRunSave = null;
  saveChars();
  initDungeon(ch);
  // The modifiers (and these flags) were set before initDungeon(), which
  // rebuilds the run and wiped them, so every Daily Dungeon was a normal run.
  DS._dailyRun = true;
  DS._dailyRunStart = Date.now();
  DS._dailyRunKey = todayKey;
  setup.mods.forEach(function(m){ m.apply(); });
  challengeFixEndless();
  goTo('dungeon');
  say('Daily Dungeon begins. ' + ch.name + ' enters ' + setup.dungeon + '. Active modifiers: ' + setup.mods.map(function(m){ return m.name; }).join(', ') + '.');
}

// ── END CHALLENGES ──
function getGraveyard() {
  try { return _jsonParseSafe(DDStore.getItem('dd_graveyard'), '[]'); } catch(e) { return []; }
}
function saveGraveyard(arr) { try { DDStore.setItem('dd_graveyard', JSON.stringify(arr)); } catch(e) { console.warn('[DD] saveGraveyard failed:', e); } }

function addToGraveyard(ch) {
  if (!ch || !ch.name) return;
  try {
    var g = getGraveyard();
    var deaths = ch.deathLog || [];
    var entry = {
      name:      ch.name || 'Unknown',
      cls:       ch.cls || 'Unknown',
      race:      ch.race || '',
      prof:      ch.prof || '',
      dungeon:   ch.dungeon || '',
      difficulty:ch.difficulty || '',
      level:     ch.persistLevel || 1,
      deaths:    deaths.length,
      topFloor:  (deaths[0] && deaths[0].floor) || 0,
      killedBy:  (deaths[0] && deaths[0].killedBy) || 'unknown causes',
      journal:   Array.isArray(ch.journal)
        ? (ch.journal[0] && ch.journal[0].text) || ''
        : (typeof ch.journal === 'string' ? ch.journal : (ch.journal && ch.journal.text) || ''),
      date:      new Date().toLocaleDateString(),
    };
    g.unshift(entry);
    if (g.length > 50) g = g.slice(0, 50);
    saveGraveyard(g);
  } catch(e) { console.warn('addToGraveyard error:', e); }
}

//═════════════════
// INFERNAL DUNGEON UNLOCK — trophy-gated only. The old Trial/Riddles choice
// system (INFERNAL_RIDDLES, _infernalTrial, chooseInfernalPath and everything
// under it) was dead code — its own choice screen (ov-infernal-choice) was
// never opened by anything, so none of it was reachable. Removed.
//═════════════════

function isInfernalUnlocked() {
  if (DDStore.getItem('dd_dev_mode') === '1') return true;
  if (DDStore.getItem('dd_infernal_unlocked') === '1') return true;
  if (getTrophies() >= 100) {
    DDStore.setItem('dd_infernal_unlocked', '1');
    return true;
  }
  return false;
}

function handleInfernalClick() {
  if (isInfernalUnlocked()) {
    var card = document.getElementById('infernal-dungeon-card');
    if (card) {
      card.classList.remove('locked');
      card.disabled = false;
      card.setAttribute('aria-disabled', 'false');
      pickDungeon(card);
    }
    return;
  }
  // Show trophy requirement
  var needed = 100;
  var current = getTrophies();
  var remaining = Math.max(0, needed - current);
  say('The Infernal Gate is sealed. You need 100 trophies to unlock it. You have ' + current + ' trophies. ' + (remaining > 0 ? remaining + ' more needed.' : 'You have enough! Something went wrong — try refreshing.'));
  showToast('🏆 Need 100 trophies to unlock The Infernal. You have ' + current + '.', 'red');
}

// ── GENERAL SETTINGS ──
function exportSaveFile() {
  try {
    var saveData = {};
    var keys = [];
    for (var i = 0; i < DDStore.length; i++) {
      var k = DDStore.key(i);
      if (k && k.startsWith('dd_')) {
        keys.push(k);
        saveData[k] = DDStore.getItem(k);
      }
    }
    if (keys.length === 0) {
      say('No save data found. Play the game first.');
      return;
    }
    var json = JSON.stringify(saveData, null, 2);
    var blob = new Blob([json], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'dungeon-descent-save.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    say('Save file downloaded! File name: dungeon-descent-save.json. Keep it safe — it contains all your progress.');
  } catch(e) {
    say('Export failed. Please try again.');
    console.error('Export file error:', e);
  }
}

function importSaveFile() {
  var input = document.getElementById('save-file-input');
  if (input) input.click();
}

function handleSaveFileImport(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var data = JSON.parse(e.target.result);
      var count = 0;
      Object.keys(data).forEach(function(k) {
        if (k.startsWith('dd_')) {
          DDStore.setItem(k, data[k]);
          count++;
        }
      });
      var result = document.getElementById('general-import-result');
      if (result) { result.style.color = '#44cc44'; result.textContent = 'Save restored! ' + count + ' entries loaded. Refreshing...'; }
      say('Save file imported! ' + count + ' entries restored. Refreshing now.');
      setTimeout(function() { location.reload(); }, 1500);
    } catch(err) {
      var result = document.getElementById('general-import-result');
      if (result) { result.style.color = '#ff4444'; result.textContent = 'Invalid save file. Make sure you selected the correct file.'; }
      say('Import failed. Invalid save file.');
    }
  };
  reader.readAsText(file);
  // Reset input so same file can be selected again
  event.target.value = '';
}

function exportSaveCode() {
  try {
    // Save ALL dd_ localStorage keys — everything matters
    var saveData = {};
    var keys = [];
    for (var i = 0; i < DDStore.length; i++) {
      var k = DDStore.key(i);
      if (k && k.startsWith('dd_')) {
        keys.push(k);
        saveData[k] = DDStore.getItem(k);
      }
    }
    if (keys.length === 0) {
      say('No save data found. Play the game first to generate save data.');
      return;
    }
    var json = JSON.stringify(saveData);
    var code = 'DD-v96-' + btoa(unescape(encodeURIComponent(json)));
    var wrap = document.getElementById('general-export-wrap');
    var ta = document.getElementById('general-export-code');
    if (wrap) wrap.style.display = '';
    if (ta) { ta.value = code; ta.focus(); ta.select(); }
    say('Save code generated. ' + keys.length + ' data entries exported. Copy the code from the text area.');
  } catch(e) {
    say('Export failed. Please try again.');
    console.error('Export error:', e);
  }
}

function copySaveCode() {
  var ta = document.getElementById('general-export-code');
  var result = document.getElementById('general-copy-result');
  if (!ta) return;
  ta.select();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ta.value).then(function() {
        if (result) result.textContent = '✅ Copied to clipboard!';
        say('Save code copied to clipboard.');
      }).catch(function() {
        document.execCommand('copy');
        if (result) result.textContent = '✅ Copied!';
        say('Save code copied.');
      });
    } else {
      document.execCommand('copy');
      if (result) result.textContent = '✅ Copied to clipboard!';
      say('Save code copied to clipboard.');
    }
  } catch(e) {
    if (result) result.textContent = 'Please manually select and copy the code above.';
    say('Could not auto-copy. Please select and copy the code manually.');
  }
}

function shareSaveCode() {
  var ta = document.getElementById('general-export-code');
  if (!ta || !ta.value) return;
  if (navigator.share) {
    navigator.share({
      title: 'Dungeon Descent Save Code',
      text: 'My Dungeon Descent save code: ' + ta.value
    }).then(function() {
      say('Save code shared.');
    }).catch(function() {
      copySaveCode();
    });
  } else {
    copySaveCode();
  }
}

function importSaveCode() {
  var ta = document.getElementById('general-import-code');
  var result = document.getElementById('general-import-result');
  if (!ta) return;
  
  var code = ta.value.trim();
  if (!code) {
    say('Please paste a save code first.');
    if (result) { result.style.color = '#ff4444'; result.textContent = 'No code entered.'; }
    return;
  }

  // Handle new DD2 format (shorter, optimized)
  if (code.startsWith('DD2-')) {
    try {
      var compressed = decodeURIComponent(escape(atob(code.replace('DD2-', ''))));
      var json2 = compressed.replace(/"~/g, '"dd_');
      var data2 = JSON.parse(json2);
      var count2 = 0;
      Object.keys(data2).forEach(function(k) {
        if (k.startsWith('dd_')) { DDStore.setItem(k, data2[k]); count2++; }
      });
      if (result) { result.style.color = '#44cc44'; result.textContent = 'Save restored! ' + count2 + ' entries loaded.'; }
      say('Save restored! ' + count2 + ' entries loaded. Refreshing now.');
      setTimeout(function() { location.reload(); }, 1500);
      return;
    } catch(e) {
      say('Invalid save code. Please check and try again.');
      if (result) { result.style.color = '#ff4444'; result.textContent = 'Invalid code.'; }
      return;
    }
  }
  
  if (!code.startsWith('DD-v96-')) {
    say('Invalid save code. Make sure you copied the full code.');
    if (result) { result.style.color = '#ff4444'; result.textContent = 'Invalid code format.'; }
    return;
  }
  
  try {
    var base64 = code.replace('DD-v96-', '');
    var json = decodeURIComponent(escape(atob(base64)));
    var data = JSON.parse(json);
    
    // Show confirmation
    var keyCount = Object.keys(data).length;
    showChoiceModal(
      '⚠ Import Save Data?',
      'This will overwrite your current save with ' + keyCount + ' data entries. This cannot be undone.',
      [
        { label: 'Import and overwrite', action: function() {
          // Import all keys
          var imported = 0;
          for (var k in data) {
            if (k.startsWith('dd_')) {
              DDStore.setItem(k, data[k]);
              imported++;
            }
          }

          // Try to sync to Firebase if signed in
          if (typeof syncToCloud === 'function') syncToCloud();

          var result = document.getElementById('import-result');
          if (result) { result.style.color = '#44ff88'; result.textContent = imported + ' entries imported successfully.'; }
          say(imported + ' save entries imported. Reloading your data now.');
          // loadChars() doesn't exist anywhere in this codebase — every
          // other reload site uses this exact inline pattern instead.
          // Since it's the first statement here, the ReferenceError was
          // also silently skipping loadHighScore() and
          // updateGlobalGoldDisplay() right after it on the same line.
          try { CHARS = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]'); } catch(e) { CHARS = []; }
          loadHighScore(); updateGlobalGoldDisplay();
        }},
        { label: 'Cancel', action: function() { say('Import cancelled.'); } }
      ]
    );
    return;
    
  } catch(e) {
    var result = document.getElementById('import-result');
    if (result) { result.style.color = '#ff4444'; result.textContent = 'Import failed — invalid code.'; }
    say('Import failed. The code may be corrupted or invalid.');
    console.error('Import error:', e);
  }
}
// ── END GENERAL SETTINGS ──

//═════════════════
// VOID MODE
//═════════════════

var VOID_HEROES = [
  // Wave 1 — solo warrior, decent threat
  [{ name:'Wandering Warrior', icon:'⚔️', hp:90, maxHp:90, atk:[12,18], desc:'Overconfident. Undertrained. Still dangerous.' }],
  // Wave 2 — two enemies, heal mechanic
  [
    { name:'Holy Paladin', icon:'🛡', hp:110, maxHp:110, atk:[12,20], desc:'Carries a shield of faith. Heals every 3 turns.', heal:true, healEvery:3, healAmt:15 },
    { name:'Shadow Archer', icon:'🏹', hp:75, maxHp:75, atk:[15,24], desc:'Fires from a distance. Precise. Deadly.', ranged:true }
  ],
  // Wave 3 — three enemies, magical damage
  [
    { name:'Iron Warrior', icon:'⚔️', hp:120, maxHp:120, atk:[14,20], desc:'Veteran fighter. Has survived worse. Almost.', enrageBelow:50 },
    { name:'Battle Mage', icon:'🔮', hp:90, maxHp:90, atk:[18,28], desc:'Channels ancient fire. Burns bright.', magical:true },
    { name:'War Scout', icon:'🗡️', hp:80, maxHp:80, atk:[12,20], desc:'Fast. Strikes before you can react.', canCrit:true }
  ],
  // Wave 4 — elite party (toned down)
  [
    { name:'Elite Crusader', icon:'✨', hp:160, maxHp:160, atk:[16,26], desc:'The chosen of a forgotten god.', isElite:true, enrageBelow:50 },
    { name:'War Cleric', icon:'⛪', hp:110, maxHp:110, atk:[13,20], desc:'Heals allies. Destroy it first.', heal:true, healEvery:3, healAmt:18 },
    { name:'Rogue Assassin', icon:'🗡️', hp:95, maxHp:95, atk:[18,30], desc:'Crits for massive damage.', canCrit:true }
  ],
  // Wave 5 — legendary final wave (toned down significantly)
  [
    { name:'The Last Hero', icon:'👑', hp:250, maxHp:250, atk:[18,28], desc:'They said one would come who could end the Void. This is that one.', isLegendary:true, enrageBelow:33, heal:true, healEvery:5, healAmt:25 },
    { name:'Ancient Paladin', icon:'🌟', hp:160, maxHp:160, atk:[14,22], desc:'Has fought darkness for forty years.', isElite:true, heal:true, healEvery:4, healAmt:20 },
    { name:'Void Hunter', icon:'🎯', hp:130, maxHp:130, atk:[16,26], desc:'Trained specifically to kill entities like you.', isElite:true, canCrit:true, voidBane:true },
    { name:'Lorekeeper Mage', icon:'📚', hp:120, maxHp:120, atk:[18,30], desc:'Knows your weaknesses. Exploits them.', magical:true, isElite:true }
  ]
];

var _void = {
  active: false,
  hp: 500,
  maxHp: 500,
  wave: 0,
  enemyIdx: 0,
  turn: 1,
  shieldTurns: 0,
  blastCooldown: 0,
  shieldCooldown: 0,
  drainCooldown: 0,
  enemies: [],
  currentEnemy: null
};

function startVoidMode() {
  _void.active = true;
  _void.hp = 500;
  _void.maxHp = 500;
  _void.wave = 0;
  _void.turn = 1;
  _void.shieldTurns = 0;
  _void.blastCooldown = 0;
  _void.shieldCooldown = 0;
  _void.drainCooldown = 0;

  document.getElementById('void-pre').style.display = 'none';
  document.getElementById('void-active').style.display = '';
  document.getElementById('void-victory').style.display = 'none';
  document.getElementById('void-defeat').style.display = 'none';
  document.getElementById('void-log').innerHTML = '';

  // Play void reaper music
  playTrack('void-reaper');

  voidLoadWave(0);
  say('Void Mode begins. Wave 1 of 5. ' + _void.enemies[0].name + ' approaches. You have 500 HP. Choose your action.');
}

function voidLoadWave(waveIdx) {
  _void.wave = waveIdx;
  _void.enemies = VOID_HEROES[waveIdx].map(function(e){ return Object.assign({}, e); });
  _void.enemyIdx = 0;
  _void.currentEnemy = _void.enemies[0];

  document.getElementById('void-wave-label').textContent = 'Wave ' + (waveIdx+1) + ' of 5';
  document.getElementById('void-next-wrap').style.display = 'none';
  document.getElementById('void-btns').style.display = 'grid';
  voidUpdateBars();
  voidUpdateCooldowns();
  voidLog('Wave ' + (waveIdx+1) + ': ' + _void.enemies.map(function(e){ return e.name; }).join(', '), '#aa44ff');
}

function voidAction(action) {
  if (!_void.active || !_void.currentEnemy) return;
  var e = _void.currentEnemy;
  var playerDmg = 0;
  var msg = '';

  // Player action
  switch(action) {
    case 'blast':
      if (_void.blastCooldown > 0) { say('Void Blast on cooldown. ' + _void.blastCooldown + ' turns remaining.'); return; }
      playerDmg = rnd(40, 70);
      _void.blastCooldown = 2;
      msg = '🌑 Void Blast tears through ' + e.name + ' for ' + playerDmg + ' damage!';
      voidLog(msg, '#cc44ff');
      break;
    case 'shield':
      if (_void.shieldCooldown > 0) { say('Shadow Shield on cooldown. ' + _void.shieldCooldown + ' turns remaining.'); return; }
      _void.shieldTurns = 2;
      _void.shieldCooldown = 3;
      voidLog('🛡 Shadow Shield active. Damage reduced by 60% for 2 turns.', '#4488ff');
      say('Shadow Shield activated. Taking 60 percent less damage for 2 turns.');
      break;
    case 'drain':
      if (_void.drainCooldown > 0) { say('Soul Drain on cooldown. ' + _void.drainCooldown + ' turns remaining.'); return; }
      var drain = rnd(30, 50);
      playerDmg = drain;
      _void.hp = Math.min(_void.maxHp, _void.hp + drain);
      _void.drainCooldown = 3;
      msg = '💀 Soul Drain steals ' + drain + ' HP from ' + e.name + '!';
      voidLog(msg, '#44ff88');
      break;
    case 'strike':
      playerDmg = rnd(20, 35);
      msg = '⚔ Dark Strike hits ' + e.name + ' for ' + playerDmg + ' damage.';
      voidLog(msg, '#ffaa44');
      break;
  }

  // Apply damage to enemy
  if (playerDmg > 0) {
    e.hp = Math.max(0, e.hp - playerDmg);
    voidUpdateBars();
    say(msg + ' Enemy HP: ' + e.hp + '.');
  }

  // Check enemy dead
  if (e.hp <= 0) {
    voidLog(e.name + ' has fallen.', '#44ff88');
    setTimeout(function(){ voidEnemyDefeated(); }, 600);
    return;
  }

  // Enemy attacks back
  setTimeout(function(){ voidEnemyTurn(); }, 800);
}

function voidEnemyTurn() {
  var e = _void.currentEnemy;
  if (!e || e.hp <= 0) return;

  var eDmg = rnd(e.atk[0], e.atk[1]);

  // Special enemy abilities
  if (e.canCrit && Math.random() < 0.3) {
    eDmg = Math.round(eDmg * 2.2);
    voidLog('CRITICAL HIT! ' + e.name + ' lands a devastating blow for ' + eDmg + '!', '#ff2222');
  } else if (e.voidBane && Math.random() < 0.35) {
    eDmg = Math.round(eDmg * 1.7);
    voidLog(e.name + ' exploits your void nature for ' + eDmg + ' damage!', '#ff6666');
  } else if (e.enrageBelow && e.hp <= (e.maxHp * e.enrageBelow / 100)) {
    eDmg = Math.round(eDmg * 1.5);
    voidLog(e.name + ' is ENRAGED! Strikes for ' + eDmg + '!', '#ff4400');
  }

  // Heal mechanic
  if (e.heal && e.healEvery && _void.turn % e.healEvery === 0) {
    var healAmt = e.healAmt || 20;
    e.hp = Math.min(e.maxHp, e.hp + healAmt);
    voidLog(e.name + ' heals for ' + healAmt + ' HP! (' + e.hp + '/' + e.maxHp + ')', '#44ff88');
    voidUpdateBars();
  }

  // Apply shield reduction
  if (_void.shieldTurns > 0) {
    eDmg = Math.round(eDmg * 0.4);
    _void.shieldTurns--;
  }

  _void.hp = Math.max(0, _void.hp - eDmg);
  voidLog(e.name + ' strikes for ' + eDmg + ' damage' + (_void.shieldTurns >= 0 && eDmg < e.atk[0] ? ' (shielded)' : '') + '.', '#ff6644');
  say(e.name + ' hits for ' + eDmg + '. Your HP: ' + _void.hp + '.');
  voidUpdateBars();

  // Tick cooldowns
  if (_void.blastCooldown > 0) _void.blastCooldown--;
  if (_void.shieldCooldown > 0) _void.shieldCooldown--;
  if (_void.drainCooldown > 0) _void.drainCooldown--;
  _void.turn++;
  document.getElementById('void-turn-label').textContent = 'Turn ' + _void.turn;
  voidUpdateCooldowns();

  // Check void commander dead
  if (_void.hp <= 0) {
    voidDefeat(e.name);
    return;
  }

  // Re-enable buttons
  document.getElementById('void-btns').style.display = 'grid';
}

function voidEnemyDefeated() {
  _void.enemyIdx++;
  if (_void.enemyIdx < _void.enemies.length) {
    // More enemies in wave
    _void.currentEnemy = _void.enemies[_void.enemyIdx];
    voidLog('Next: ' + _void.currentEnemy.name + ' steps forward.', '#aa44ff');
    voidUpdateBars();
    say(_void.currentEnemy.name + ' steps forward. HP: ' + _void.currentEnemy.hp + '.');
    document.getElementById('void-btns').style.display = 'grid';
  } else {
    // Wave complete
    if (_void.wave >= 4) {
      voidVictory();
    } else {
      voidLog('Wave ' + (_void.wave+1) + ' cleared! The next wave approaches.', '#44ff88');
      // Heal 50 HP between waves
      var heal = 50;
      _void.hp = Math.min(_void.maxHp, _void.hp + heal);
      voidLog('The void restores ' + heal + ' HP.', '#aa44ff');
      voidUpdateBars();
      document.getElementById('void-btns').style.display = 'none';
      document.getElementById('void-next-wrap').style.display = '';
      say('Wave ' + (_void.wave+1) + ' cleared! Restored ' + heal + ' HP. Press Continue for wave ' + (_void.wave+2) + '.');
    }
  }
}

function voidNextWave() {
  document.getElementById('void-next-wrap').style.display = 'none';
  voidLoadWave(_void.wave + 1);
  say('Wave ' + (_void.wave+1) + ' of 5. ' + _void.enemies.map(function(e){ return e.name; }).join(', ') + '.');
}

function voidVictory() {
  _void.active = false;
  document.getElementById('void-active').style.display = 'none';
  document.getElementById('void-victory').style.display = '';

  // Level up ALL characters by 3
  var leveled = 0;
  if (CHARS && CHARS.length > 0) {
    CHARS.forEach(function(ch) {
      ch.persistLevel = Math.min(50, (ch.persistLevel || ch.level || 1) + 3);
      leveled++;
    });
    saveChars();
  }

  // Generate reward code
  var code = generateVoidCode();
  document.getElementById('void-reward-code').textContent = code;
  document.getElementById('void-level-msg').textContent = leveled + ' character' + (leveled !== 1 ? 's' : '') + ' leveled up by 3!';

  awardAchievement('ach-void-conqueror');
  say('THE VOID PREVAILS! All five waves defeated. All ' + leveled + ' characters leveled up by 3. Your reward code is ' + code + '. Share it with anyone. Press Copy Code to copy it.');
}

function voidDefeat(killedBy) {
  _void.active = false;
  document.getElementById('void-active').style.display = 'none';
  document.getElementById('void-defeat').style.display = '';
  document.getElementById('void-defeat-msg').textContent = killedBy + ' ended your reign. The Void retreats — for now.';
  say('The Void has fallen. ' + killedBy + ' defeated you on wave ' + (_void.wave+1) + '. Try again.');
}

function voidUpdateBars() {
  var hpPct = (_void.hp / _void.maxHp * 100) + '%';
  document.getElementById('void-hp-bar').style.width = hpPct;
  document.getElementById('void-hp-text').textContent = _void.hp + ' / ' + _void.maxHp + ' HP';

  var e = _void.currentEnemy;
  if (e) {
    var ePct = (e.hp / e.maxHp * 100) + '%';
    document.getElementById('void-enemy-bar').style.width = ePct;
    document.getElementById('void-enemy-name').textContent = e.icon + ' ' + e.name + (e.isLegendary ? ' ⭐ LEGENDARY' : e.isElite ? ' ★ ELITE' : '');
    document.getElementById('void-enemy-hp').textContent = e.hp + ' / ' + e.maxHp + ' HP';
    document.getElementById('void-enemy-desc').textContent = e.desc || '';
  }
}

function voidUpdateCooldowns() {
  var blast = document.getElementById('void-btn-blast');
  var shield = document.getElementById('void-btn-shield');
  var drain = document.getElementById('void-btn-drain');
  if (blast) { blast.disabled = _void.blastCooldown > 0; blast.textContent = '🌑 Void Blast' + (_void.blastCooldown > 0 ? ' (' + _void.blastCooldown + ')' : ''); }
  if (shield) { shield.disabled = _void.shieldCooldown > 0; shield.textContent = '🛡 Shadow Shield' + (_void.shieldCooldown > 0 ? ' (' + _void.shieldCooldown + ')' : ''); }
  if (drain) { drain.disabled = _void.drainCooldown > 0; drain.textContent = '💀 Soul Drain' + (_void.drainCooldown > 0 ? ' (' + _void.drainCooldown + ')' : ''); }
}

function voidLog(msg, color) {
  var log = document.getElementById('void-log');
  if (!log) return;
  var line = document.createElement('div');
  line.style.color = color || '#888';
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function generateVoidCode() {
  // Generate a shareable code: VOID-XXXX-XXXX
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var part1 = '', part2 = '';
  for (var i = 0; i < 4; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
  for (var i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
  var code = 'VOID-' + part1 + '-' + part2;
  // Store it so it can be validated
  var codes = _jsonParseSafe(DDStore.getItem('dd_void_codes'), '[]');
  codes.push({ code: code, created: Date.now() });
  if (codes.length > 10) codes = codes.slice(-10);
  DDStore.setItem('dd_void_codes', JSON.stringify(codes));
  return code;
}

function copyVoidCode() {
  var codeEl = document.getElementById('void-reward-code');
  if (!codeEl) return;
  var code = codeEl.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function() {
      say('Code copied: ' + code + '. Share it with anyone. They can enter it in Settings → General → Enter Code.');
    }).catch(function() {
      // Clipboard permission can be denied (common in embedded WebViews) —
      // without this, the write silently fails and the user hears nothing.
      say('Your code is: ' + code + '. Go to Settings, General, Enter Code to redeem it.');
    });
  } else {
    say('Your code is: ' + code + '. Go to Settings, General, Enter Code to redeem it.');
  }
}

// ── REWARD CODE REDEMPTION ──
var REWARD_CODE_PRIZES = [
  { id:'gold_500', label:'500 gold', apply: function() { addGlobalGold(500); if(CHARS&&CHARS[0]){CHARS[0].gold=(CHARS[0].gold||0)+500;saveChars();} } },
  { id:'gold_250', label:'250 gold', apply: function() { addGlobalGold(250); } },
  // (the coins went onto each character, where nothing reads them)
  { id:'coins_5',  label:'5 Mystery Coins', apply: function() { addMysteryCoin(5); } },
  { id:'discount_10', label:'10% Blacksmith discount for 1 hour', apply: function() { DDStore.setItem('dd_blacksmith_discount', JSON.stringify({pct:0.10,expires:Date.now()+3600000,source:'Reward Code'})); } },
  { id:'xp_boost', label:'2x XP for your next run', apply: function() { DDStore.setItem('dd_code_xp_boost', '1'); } },
  { id:'gold_750', label:'750 gold', apply: function() { addGlobalGold(750); } },
  { id:'coins_10', label:'10 Mystery Coins', apply: function() { addMysteryCoin(10); } },
];

// Hook into General settings Enter Code button (Void rewards)
function enterRewardCode() {
  var input = document.getElementById('general-code-input');
  var result = document.getElementById('general-code-result');
  if (!input) return;
  var code = (input.value || '').trim().toUpperCase();
  if (!code) { if(result){result.style.color='#ff4444';result.textContent='No code entered.';} say('No code entered.'); return; }

  // Birthday codes
  if (BIRTHDAY_CODES[code]) {
    if (DDStore.getItem('dd_redeemed_' + code)) { if(result){result.style.color='#ff4444';result.textContent='Already redeemed.';} say('Already redeemed.'); return; }
    var data = BIRTHDAY_CODES[code];
    addGlobalGold(data.gold);
    DDStore.setItem('dd_blacksmith_discount', JSON.stringify({pct:data.discount,source:'Birthday '+data.year}));
    var inv = getGlobalInventory();
    if (!inv.some(function(i){ return i.id==='golden-sword'; })) addToGlobalInventory(Object.assign({}, GOLDEN_SWORD));
    if (!RARE_SPIRITS.some(function(s){ return s.id==='birthday-spirit'; })) RARE_SPIRITS.push(BIRTHDAY_SPIRIT);
    CHARS.forEach(function(ch){ if(!ch)return; if(!ch.earnedSpirits)ch.earnedSpirits=[]; if(ch.earnedSpirits.indexOf('birthday-spirit')===-1)ch.earnedSpirits.push('birthday-spirit'); });
    saveChars();
    DDStore.setItem('dd_redeemed_' + code, 'true');
    if(result){result.style.color='#44ff88';result.textContent='🎂 Birthday code redeemed! +'+data.gold+'g · Golden Sword · Founder Spirit · 15% discount!';}
    sfx('sfx-unlock'); say('Birthday code redeemed!'); input.value=''; return;
  }

  // Void codes
  var redeemed = _jsonParseSafe(DDStore.getItem('dd_redeemed_codes'), '[]');
  if (redeemed.indexOf(code) !== -1) { if(result){result.style.color='#ff4444';result.textContent='Already redeemed.';} say('Already redeemed.'); return; }
  if (!code.match(/^VOID-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) {
    if(result){result.style.color='#ff4444';result.textContent='Invalid code. Birthday codes: DDBD26. Void Reaper codes: VOID-XXXX-XXXX';}
    say('Invalid code format.'); return;
  }
  var seed = 0;
  for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) & 0xffff;
  var prize = REWARD_CODE_PRIZES[seed % REWARD_CODE_PRIZES.length];
  prize.apply();
  redeemed.push(code);
  DDStore.setItem('dd_redeemed_codes', JSON.stringify(redeemed));
  if(result){result.style.color='#44ff88';result.textContent='Code redeemed! You received: ' + prize.label + '.';}
  say('Code redeemed! You received ' + prize.label + '.');
  input.value = '';
}

// ── END VOID MODE ──

// ── PAUSE MENU OVERHAUL ──

function openPauseInventory() {
  closePauseMenu();
  setTimeout(function(){ toggleInv(); }, 200);
}

function openPauseSpirits() {
  var panel = document.getElementById('pause-spirits-panel');
  if (!panel) return;
  panel.style.display = '';
  var content = document.getElementById('pause-spirits-content');
  if (!content) return;
  content.innerHTML = '';

  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  var earnedIds = ch ? (ch.earnedSpirits || []) : [];
  var activeSpirit = DS.activeSpirit;

  // Build full spirit objects from earned IDs + custom spirits
  var allSpirits = getAllSpirits();
  var spirits = allSpirits.filter(function(s){ return earnedIds.indexOf(s.id) !== -1; });
  // Always include starter spirits
  STARTER_SPIRITS.forEach(function(s){
    if (!spirits.some(function(sp){ return sp.id === s.id; })) spirits.unshift(s);
  });
  // Include custom built spirits
  getCustomSpiritsWithFunctions().forEach(function(s){
    if (!spirits.some(function(sp){ return sp.id === s.id; })) spirits.push(s);
  });

  if (spirits.length === 0) {
    content.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#555;">No spirits found. Your starter spirit is always available.</div>';
    return;
  }

  spirits.forEach(function(spirit) {
    var isActive = activeSpirit && activeSpirit.id === spirit.id;
    var div = document.createElement('div');
    div.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px;background:#050505;border:1px solid ' + (isActive?'#ffaa44':'#222') + ';margin-bottom:6px;';
    div.innerHTML = '<span style="font-family:Cinzel,serif;font-size:0.7rem;color:#e0c080;">' + (spirit.icon||'👻') + ' ' + spirit.name + (isActive?' ✓':'') + '</span>';
    var btn = document.createElement('button');
    btn.textContent = isActive ? 'Active' : 'Activate';
    btn.disabled = isActive;
    btn.style.cssText = 'font-family:Cinzel,serif;font-size:0.62rem;padding:4px 10px;background:#0a0800;border:1px solid #ffaa44;color:#ffaa44;cursor:pointer;';
    btn.setAttribute('aria-label', (isActive ? 'Currently active: ' : 'Activate ') + spirit.name);
    (function(sp){ btn.onclick = function(){
      // Market Sprite costs gold to reactivate once its shop discount has
      // already been spent this run — otherwise you could swap away after
      // using the discount, take some other spirit's bonus, then swap back
      // for another free discount window. Gated here at the explicit swap,
      // not inside pickSpirit() itself, since pickSpirit() is also what
      // silently re-applies your last-used spirit at the start of a new
      // run — that continuation should never fail for lack of gold.
      if (sp.isMarketSprite && _charIdx !== null) {
        var ch = CHARS[_charIdx];
        if (ch.marketSpriteUsed) {
          if (DS.gold < sp.reactivateCost) {
            say('Not enough gold to reactivate the Market Sprite. You need ' + sp.reactivateCost + ' gold.');
            return;
          }
          DS.gold -= sp.reactivateCost; spendGlobalGold(sp.reactivateCost);
          updateTopBar();
          addLog('Paid ' + sp.reactivateCost + 'g to reactivate Market Sprite.');
        }
      }
      // pickSpirit() (not a plain DS.activeSpirit assignment) so the switch
      // persists to CHARS[_charIdx].lastSpirit for next run and refreshes
      // the in-dungeon spirit HUD row immediately, same as the character
      // creation flow already does.
      pickSpirit(sp);
      openPauseSpirits();
    }; })(spirit);
    div.appendChild(btn);
    content.appendChild(div);
  });
  say('Your spirits. ' + spirits.length + ' collected. Tab through to activate one.');
}

function openPauseBestiary() {
  var panel = document.getElementById('pause-bestiary-panel');
  if (!panel) return;
  panel.style.display = '';

  var tabs = document.getElementById('pause-bestiary-tabs');
  var content = document.getElementById('pause-bestiary-content');
  if (!tabs || !content) return;

  var filters = ['all','crypt','ash','frost','sunken','hollow','infernal','nightmare'];
  var labels = {all:'All',crypt:'Crypt',ash:'Ash',frost:'Frost',sunken:'Sunken',hollow:'Hollow',infernal:'Infernal',nightmare:'Nightmare'};
  tabs.innerHTML = '';
  filters.forEach(function(f) {
    var btn = document.createElement('button');
    btn.textContent = labels[f];
    btn.style.cssText = 'font-family:Cinzel,serif;font-size:0.6rem;padding:4px 8px;background:#0a0a0a;border:1px solid #333;color:#888;cursor:pointer;';
    btn.setAttribute('aria-label', 'Show ' + labels[f] + ' enemies');
    btn.onclick = function(){ renderPauseBestiary(f); };
    tabs.appendChild(btn);
  });
  renderPauseBestiary('all');
  say('Bestiary info open. Filter by dungeon type. Tab through enemies for descriptions.');
}

function renderPauseBestiary(filter) {
  var content = document.getElementById('pause-bestiary-content');
  if (!content) return;
  content.innerHTML = '';

  var entries = BESTIARY_DATA.filter(function(e){
    if (filter === 'all') return true;
    return e.dungeon === filter;
  }).slice(0, 30);

  if (entries.length === 0) {
    content.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;padding:8px;">No entries found.</div>';
    return;
  }

  entries.forEach(function(entry) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:8px;border-bottom:1px solid #111;';
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', entry.name + '. ' + entry.tier + '. ' + (entry.desc||''));
    div.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#e0c080;">' + (entry.icon||'') + ' ' + entry.name + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#555;">' + (entry.tier||'') + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#888;font-style:italic;margin-top:2px;">' + (entry.desc||'') + '</div>';
    content.appendChild(div);
  });
}

function openPauseObituary() {
  var panel = document.getElementById('pause-obituary-panel');
  if (!panel) return;
  panel.style.display = '';
  loadObituary('pause-obituary-content');
  say('Obituary loading. Recent deaths from players worldwide.');
}

function openPauseEnterCode() {
  var panel = document.getElementById('pause-code-panel');
  if (!panel) return;
  panel.style.display = '';
  setTimeout(function(){
    var input = document.getElementById('pause-code-input');
    if (input) input.focus();
  }, 100);
  say('Enter reward code. Type or paste your VOID code.');
}

function pauseRedeemCode() {
  var input = document.getElementById('pause-code-input');
  var result = document.getElementById('pause-code-result');
  if (!input) return;
  // Route to appropriate system based on code format
  var code = (input.value || '').trim().toUpperCase();
  if (!code) { if(result){result.style.color='#ff4444';result.textContent='No code entered.';} say('No code entered.'); return; }

  // Birthday codes
  if (BIRTHDAY_CODES[code]) {
    // Temporarily point to pause elements then call redeemCode logic
    var savedInput = document.getElementById('redeem-code-input');
    var savedMsg = document.getElementById('redeem-msg');
    // Inline redeem
    if (DDStore.getItem('dd_redeemed_' + code)) {
      if(result){result.style.color='#ff4444';result.textContent='Already redeemed.';} say('Code already redeemed.'); return;
    }
    var data = BIRTHDAY_CODES[code];
    addGlobalGold(data.gold);
    DDStore.setItem('dd_blacksmith_discount', JSON.stringify({pct:data.discount,source:'Birthday '+data.year}));
    var inv = getGlobalInventory();
    if (!inv.some(function(i){ return i.id==='golden-sword'; })) addToGlobalInventory(Object.assign({}, GOLDEN_SWORD));
    if (!RARE_SPIRITS.some(function(s){ return s.id==='birthday-spirit'; })) RARE_SPIRITS.push(BIRTHDAY_SPIRIT);
    CHARS.forEach(function(ch){ if(!ch)return; if(!ch.earnedSpirits)ch.earnedSpirits=[]; if(ch.earnedSpirits.indexOf('birthday-spirit')===-1)ch.earnedSpirits.push('birthday-spirit'); });
    saveChars();
    DDStore.setItem('dd_redeemed_' + code, 'true');
    if(result){result.style.color='#44ff88';result.textContent='Birthday code redeemed! +'+data.gold+'g and exclusive rewards unlocked!';}
    sfx('sfx-unlock'); say('Birthday code redeemed!'); input.value='';
    return;
  }

  // Void codes — use enterRewardCode logic inline
  var redeemed = _jsonParseSafe(DDStore.getItem('dd_redeemed_codes'), '[]');
  if (redeemed.indexOf(code) !== -1) { if(result){result.style.color='#ff4444';result.textContent='Already redeemed.';} say('Already redeemed.'); return; }
  if (!code.match(/^VOID-[A-Z0-9]{4}-[A-Z0-9]{4}$/)) { if(result){result.style.color='#ff4444';result.textContent='Invalid code format.';} say('Invalid code.'); return; }
  var seed = 0;
  for (var i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) & 0xffff;
  var prize = REWARD_CODE_PRIZES[seed % REWARD_CODE_PRIZES.length];
  prize.apply();
  redeemed.push(code);
  DDStore.setItem('dd_redeemed_codes', JSON.stringify(redeemed));
  if(result){result.style.color='#44ff88';result.textContent='Code redeemed! You received: '+prize.label+'.';}
  say('Code redeemed! You received '+prize.label+'.'); input.value='';
}

// ── OBITUARY — Supabase backend ──
var _OBITUARY_URL = ''; // legacy — now using Firebase
var _OBITUARY_KEY = ''; // legacy — now using Firebase

function loadObituary(targetId) {
  var listEl = document.getElementById(targetId || 'obituary-list');
  if (!listEl) return;
  listEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;padding:20px;">Loading deaths...</div>';

  // Fallback to local graveyard after 5 seconds
  var done = false;
  var timeout = setTimeout(function() {
    if (done) return;
    done = true;
    renderObituary(listEl, getGraveyardAsObituary());
  }, 5000);

  // Use Firebase Firestore
  if (!window._fbDb) {
    clearTimeout(timeout);
    renderObituary(listEl, getGraveyardAsObituary());
    return;
  }

  window._fbDb.collection('deaths')
    .orderBy('timestamp', 'desc')
    .limit(15)
    .get()
    .then(function(snap) {
      clearTimeout(timeout);
      if (done) return;
      done = true;
      var deaths = [];
      snap.forEach(function(doc) {
        var d = doc.data();
        deaths.push({
          name: d.name,
          cls: d.cls,
          floor: d.floor,
          dungeon: d.dungeon,
          killedBy: d.killedBy,
          kills: d.kills,
          gold: d.gold,
          date: d.date,
          timestamp: d.timestamp
        });
      });
      renderObituary(listEl, deaths.length > 0 ? deaths : getGraveyardAsObituary());
    })
    .catch(function(e) {
      clearTimeout(timeout);
      if (done) return;
      done = true;
      console.error('Obituary fetch failed:', e.message || e);
      renderObituary(listEl, getGraveyardAsObituary());
    });
}

function postDeathToObituary(deathData) {
  try {
    if (!window._fbDb && typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
      window._fbDb = firebase.firestore();
    }
    if (!window._fbDb) return;
    window._fbDb.collection('deaths').add({
      name:      deathData.name     || 'Unknown',
      cls:       deathData.cls      || 'Warrior',
      floor:     deathData.floor    || 1,
      dungeon:   deathData.dungeon  || 'Unknown',
      killedBy:  deathData.killedBy || 'unknown causes',
      kills:     deathData.kills    || 0,
      gold:      deathData.gold     || 0,
      date:      deathData.date     || new Date().toLocaleDateString(),
      timestamp: Date.now()
    }).catch(function(e) {
      console.warn('Obituary post failed:', e.message || e);
    });
  } catch(e) {
    console.warn('Obituary post error:', e);
  }
}

function getGraveyardAsObituary() {
  var g = getGraveyard();
  return g.map(function(entry) {
    return {
      name: entry.name || 'Unknown',
      dungeon: entry.dungeon || 'Unknown dungeon',
      floor: entry.topFloor || 1,
      killedBy: entry.killedBy || 'unknown causes',
      timestamp: Date.now(),
      isLocal: true
    };
  });
}

function renderObituary(listEl, deaths) {
  listEl.innerHTML = '';
  if (!deaths || deaths.length === 0) {
    listEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;padding:20px;">The dungeon has claimed no one yet.</div>';
    say('The obituary is empty. No one has fallen yet.');
    return;
  }

  deaths.forEach(function(death) {
    var div = document.createElement('div');
    div.style.cssText = 'padding:10px;border-bottom:1px solid #111;';
    div.setAttribute('tabindex','0');
    var name = death.name || 'Unknown Hero';
    var dungeon = death.dungeon || 'an unknown dungeon';
    var floor = death.floor || '?';
    var killer = death.killedBy || 'unknown causes';
    var timeStr = death.isLocal ? 'Local' : _formatObituaryTime(death.timestamp);
    var msg = name + ' fell on Floor ' + floor + ' of ' + dungeon + ', slain by ' + killer + '.';
    div.setAttribute('aria-label', msg + ' ' + timeStr);
    div.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#cc4444;">☠ ' + name + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#888;margin-top:2px;">Floor ' + floor + ' · ' + dungeon + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;margin-top:1px;">Slain by ' + killer + ' · ' + timeStr + '</div>';
    listEl.appendChild(div);
  });
  say(deaths.length + ' deaths recorded. Tab through to read each entry.');
}

function _formatObituaryTime(ts) {
  if (!ts) return '';
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return mins + 'm ago';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  return Math.floor(hrs/24) + 'd ago';
}
