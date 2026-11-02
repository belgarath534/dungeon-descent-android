// ═══════════════════════════════════════════════════════
// EVENTS — v11.8
// ═══════════════════════════════════════════════════════
// Nine new events. Each one is a day (or a few) on the calendar like the
// existing ones, and plugs into the same systems: getActiveEvent() decides
// what's on, getEventBonuses() gives the XP / gold / enemy multipliers and the
// event's enemies, and the hooks below add each event's own twist.
//
//  🌼 Día de los Muertos (Nov 1–2)   — fallen heroes fight beside you; Marigolds and the Ofrenda
//  🇲🇽 Mexican Independence (Sep 15–16) — ¡El Grito! battle cry, +16% gold
//  🎆 New Year (Dec 31–Jan 1)        — double XP into the new year
//  🐉 Lunar New Year (by the lunar calendar) — red envelopes, a dragon dance
//  🃏 Chaos Day (Apr 1)              — every fight rolls a random twist
//  🌑 The Longest Night (Dec 21)     — night all day
//  🌘 The Eclipse (one evening a month, the same for everyone) — shadow-touched enemies, double gold
//  🏮 Night Market (first weekend of the month) — the merchant comes often, 25% off
//  🐾 Monster Migration (two days a month) — enemies wander in from other dungeons

// Lunar New Year: first day, by year (it moves with the moon).
var LUNAR_NEW_YEAR = {
  2025: [1, 29, 'Snake', '🐍'], 2026: [2, 17, 'Horse', '🐴'], 2027: [2, 6, 'Goat', '🐐'],
  2028: [1, 26, 'Monkey', '🐒'], 2029: [2, 13, 'Rooster', '🐓'], 2030: [2, 3, 'Dog', '🐕'],
  2031: [1, 23, 'Pig', '🐖'], 2032: [2, 11, 'Rat', '🐀'], 2033: [1, 31, 'Ox', '🐂'],
  2034: [2, 19, 'Tiger', '🐅'], 2035: [2, 8, 'Rabbit', '🐇']
};

function lunarNewYearInfo(year) {
  var l = LUNAR_NEW_YEAR[year];
  return l ? { month: l[0], day: l[1], animal: l[2], icon: l[3] } : null;
}

// The Eclipse: one evening a month (18:00–22:00 UTC), the same for every player.
function eclipseDayOfMonth(year, month) { return ((year * 12 + month) * 7) % 26 + 2; }
// Monster Migration: two days a month, away from the Eclipse.
function migrationDayOfMonth(year, month) {
  var d = ((year * 31 + month * 11) % 24) + 3;
  var e = eclipseDayOfMonth(year, month);
  return Math.abs(d - e) < 2 ? ((d + 5 - 1) % 26) + 2 : d;
}

function newEventToday(now) {
  now = now || new Date();
  var month = now.getMonth() + 1, day = now.getDate(), year = now.getFullYear();
  if (month === 11 && day <= 2) return 'muertos';
  if (month === 9 && (day === 15 || day === 16)) return 'mexico';
  if ((month === 12 && day === 31) || (month === 1 && day === 1)) return 'newyear';
  var lny = lunarNewYearInfo(year);
  if (lny) {
    var start = new Date(year, lny.month - 1, lny.day), end = new Date(year, lny.month - 1, lny.day + 2);
    if (now >= start && now < end) return 'lunar';
  }
  if (month === 4 && day === 1) return 'chaos';
  if (month === 12 && day === 21) return 'longestnight';
  return null;
}

// The recurring ones only take a day no other dated event wants.
function recurringEventToday(now) {
  now = now || new Date();
  var uy = now.getUTCFullYear(), um = now.getUTCMonth() + 1, ud = now.getUTCDate(), uh = now.getUTCHours();
  if (ud === eclipseDayOfMonth(uy, um) && uh >= 18 && uh < 22) return 'eclipse';
  var month = now.getMonth() + 1, day = now.getDate(), year = now.getFullYear(), dow = now.getDay();
  var md = migrationDayOfMonth(year, month);
  if (day === md || day === md + 1) return 'migration';
  if (day <= 7 && (dow === 6 || dow === 0)) return 'nightmarket';
  return null;
}

(function() {
  var _baseActive = getActiveEvent;
  var WEEKLY = { xpweekend: 1, voidweek: 1, bloodmoon: 1, architect: 1 };
  getActiveEvent = function() {
    var n = newEventToday();
    if (n) return n;
    var base = _baseActive.apply(this, arguments);
    if (base && !WEEKLY[base]) return base;
    return recurringEventToday() || base;
  };

  var _baseBonuses = getEventBonuses;
  getEventBonuses = function() {
    var ev = getActiveEvent();
    switch (ev) {
      case 'muertos': return { xpMult: 1.30, goldMult: 1.20, enemyMult: 1.10, label: '🌼 Día de los Muertos', extraEnemies: MUERTOS_ENEMIES,
        seasonalCurrency: 'marigolds', seasonalCurrencyIcon: '🌼', seasonalCurrencyName: 'Marigolds', isMuertos: true };
      case 'mexico': return { xpMult: 1.30, goldMult: 1.16, enemyMult: 1.10, label: '🇲🇽 Independencia de México', extraEnemies: MEXICO_ENEMIES, isMexico: true };
      case 'newyear': return { xpMult: 2.00, goldMult: 1.20, enemyMult: 1.00, label: '🎆 New Year', extraEnemies: NEWYEAR_ENEMIES, isNewYear: true };
      case 'lunar': var l = lunarNewYearInfo(new Date().getFullYear());
        return { xpMult: 1.40, goldMult: 1.28, enemyMult: 1.10, label: '🐉 Lunar New Year' + (l ? ' — Year of the ' + l.animal : ''), extraEnemies: LUNAR_ENEMIES, isLunar: true };
      case 'chaos': return { xpMult: 1.25, goldMult: 1.25, enemyMult: 1.00, label: '🃏 Chaos Day', extraEnemies: CHAOS_ENEMIES, isChaos: true };
      case 'longestnight': return { xpMult: 1.30, goldMult: 1.10, enemyMult: 1.20, label: '🌑 The Longest Night', extraEnemies: NIGHT_ENEMIES, isLongestNight: true };
      case 'eclipse': return { xpMult: 1.50, goldMult: 2.00, enemyMult: 1.30, label: '🌘 The Eclipse', extraEnemies: ECLIPSE_ENEMIES, isEclipse: true };
      case 'nightmarket': return { xpMult: 1.10, goldMult: 1.10, enemyMult: 1.00, label: '🏮 Night Market', extraEnemies: [], isNightMarket: true };
      case 'migration': return { xpMult: 1.25, goldMult: 1.00, enemyMult: 1.05, label: '🐾 Monster Migration', extraEnemies: migrationEnemies(), isMigration: true };
    }
    return _baseBonuses.apply(this, arguments);
  };

  // The Longest Night: it's night all day (every night bonus is on).
  var _baseNight = isNightTime;
  isNightTime = function() { return getActiveEvent() === 'longestnight' || _baseNight.apply(this, arguments); };
})();

// ── The events' enemies ──
var MUERTOS_ENEMIES = [
  { name:'Calaca Dancer',  icon:'💀', hp:30, atk:[6,12],  gold:[6,12],  seasonal:'muertos', dodgeChance:0.15, desc:'A skeleton in its best clothes. It dances, and it dodges like it dances.' },
  { name:'La Catrina',     icon:'💃', hp:60, atk:[9,16],  gold:[12,20], seasonal:'muertos', lifesteal:0.20, desc:'Elegant, smiling, and very much dead. She takes a little of your life with every touch.' },
  { name:'Alebrije',       icon:'🦎', hp:45, atk:[8,14],  gold:[8,15],  seasonal:'muertos', burn:3, burnTurns:2, desc:'A spirit guide painted in impossible colors. Its bite burns.' },
  { name:'Xolo Spirit',    icon:'🐕', hp:35, atk:[7,13],  gold:[7,13],  seasonal:'muertos', desc:'The hairless dog who guides souls home. It guards the way.' }
];
var MEXICO_ENEMIES = [
  { name:'Charro Fantasma', icon:'🤠', hp:45, atk:[9,15],  gold:[9,16],  seasonal:'mexico', desc:'A ghostly horseman in a silver-studded suit. He rides through walls.' },
  { name:'Luchador Spirit', icon:'🤼', hp:55, atk:[8,15],  gold:[10,17], seasonal:'mexico', grows:true, desc:'The masked wrestler never stays down. He gets stronger every round.' },
  { name:'Grito Champion',  icon:'📯', hp:70, atk:[11,18], gold:[16,26], seasonal:'mexico', desc:'Its battle cry shakes the dungeon. Answer it with your own.' }
];
var NEWYEAR_ENEMIES = [
  { name:'Midnight Reveler',  icon:'🥳', hp:35, atk:[7,13],  gold:[8,14],  seasonal:'newyear', desc:'It never left last year’s party. It never will.' },
  { name:'Countdown Golem',   icon:'⏳', hp:65, atk:[10,17], gold:[12,20], seasonal:'newyear', immuneFirstHit:true, desc:'Ten, nine, eight… it shrugs off the first blow.' },
  { name:'Firework Wisp',     icon:'🎇', hp:25, atk:[8,14],  gold:[6,11],  seasonal:'newyear', burn:3, burnTurns:2, desc:'A spark that forgot to go out.' }
];
var LUNAR_ENEMIES = [
  { name:'Dragon Dancer',   icon:'🐉', hp:60, atk:[10,17], gold:[14,24], seasonal:'lunar', dodgeChance:0.15, desc:'A long paper dragon with something real inside it.' },
  { name:'Nian Beast',      icon:'🦁', hp:75, atk:[11,19], gold:[16,26], seasonal:'lunar', desc:'The beast that comes at the new year. It fears the color red and loud noise.' },
  { name:'Lantern Spirit',  icon:'🏮', hp:30, atk:[6,12],  gold:[8,14],  seasonal:'lunar', desc:'A lantern that floated too far from home.' }
];
var CHAOS_ENEMIES = [
  { name:'Jester of Mischief', icon:'🃏', hp:40, atk:[5,18], gold:[5,30], seasonal:'chaos', dodgeChance:0.20, desc:'Nothing it does makes sense. Neither does its gold.' },
  { name:'Rubber Chicken',     icon:'🐔', hp:20, atk:[1,25], gold:[1,40], seasonal:'chaos', desc:'It squeaks. It hurts. Sometimes.' }
];
var NIGHT_ENEMIES = [
  { name:'Night Stalker',  icon:'🌑', hp:50, atk:[10,16], gold:[10,18], seasonal:'longestnight', dodgeChance:0.15, desc:'It only hunts on the longest night. Tonight it has all the time it needs.' },
  { name:'Frost Owl',      icon:'🦉', hp:35, atk:[8,13],  gold:[8,14],  seasonal:'longestnight', desc:'It watches from the dark and never blinks.' }
];
var ECLIPSE_ENEMIES = [
  { name:'Eclipse Wraith', icon:'🌘', hp:55, atk:[10,17], gold:[14,22], seasonal:'eclipse', lifesteal:0.15, desc:'Born in the moment the sun goes dark. It feeds while the light is gone.' },
  { name:'Corona Shade',   icon:'☀️', hp:45, atk:[9,16],  gold:[12,20], seasonal:'eclipse', burn:4, burnTurns:2, desc:'A ring of fire around nothing at all.' }
];

// Monster Migration: enemies from another dungeon, at this floor's tier.
var MIGRATION_DUNGEONS = function() {
  return [['Crypt of Malachar', ENEMIES], ['The Ashbound Wastes', ASH_ENEMIES], ['Frosthold Abyss', FROST_ENEMIES],
          ['The Sunken Archives', SUNKEN_ENEMIES], ['The Hollow', HOLLOW_ENEMIES], ['The Whispering Forest', WHISPER_ENEMIES],
          ['The Infernal Descent', INFERNAL_ENEMIES], ['The Abyssal Deep', ABYSSAL_ENEMIES]];
};
function migrationEnemies() {
  try {
    var here = (typeof DS !== 'undefined' && DS && DS.dungeon) || '';
    var floor = (typeof DS !== 'undefined' && DS && DS.floor) || 1;
    var out = [];
    MIGRATION_DUNGEONS().forEach(function(p) {
      if (p[0] === here || !p[1]) return;
      var tier = floor <= 3 ? p[1].t1 : floor <= 6 ? p[1].t2 : p[1].t3;
      (tier || []).forEach(function(e) {
        if (e.isBoss) return;
        out.push(Object.assign({}, e, { seasonal: 'migration', desc: (e.desc || '') + ' (Wandered in from ' + p[0] + '.)' }));
      });
    });
    return out;
  } catch (e) { return []; }
}

// ── 🌼 The Ofrenda (Día de los Muertos shop) ──
var OFRENDA_SHOP_ITEMS = [
  { id:'muertos-candle', name:'Ofrenda Candle', icon:'🕯️', cost:8, desc:'Heals 60 HP and restores 10 SP. A light left for the ones who came back.',
    apply: function() { seasonalGive({ name:'Ofrenda Candle', icon:'🕯️', type:'potion', heal:60, desc:'Heals 60 HP.' }); say('Ofrenda Candle added to your bag.'); } },
  { id:'muertos-skull', name:'Sugar Skull', icon:'💀', cost:6, desc:'Heals 45 HP. Sweet, and a little haunted.',
    apply: function() { seasonalGive({ name:'Sugar Skull', icon:'💀', type:'potion', heal:45, desc:'Heals 45 HP.' }); say('Sugar Skull added to your bag.'); } },
  { id:'muertos-marigold', name:'Marigold Path', icon:'🌼', cost:15, desc:'+8 attack for 4 turns. The petals light the way home.',
    apply: function() { seasonalGive({ name:'Marigold Path', icon:'🌼', type:'seasonal-buff', buff:'rose', desc:'+8 attack for 4 turns.' }); say('Marigold Path added to your bag.'); } },
  { id:'muertos-gold', name:'Pan de Muerto', icon:'🍞', cost:10, desc:'Receive 250 gold.',
    apply: function() { addGlobalGold(250); say('250 gold received.'); } },
  { id:'muertos-title', name:'The Remembered', icon:'🌼', cost:25, desc:'Earn the title "The Remembered". Only during Día de los Muertos.',
    apply: function() { grantSeasonalTitle('The Remembered'); say('Title unlocked: The Remembered.'); } }
];

// ── Hooks, called from the game ──

// The start of every fight.
function eventCombatStart(isBoss) {
  var ev = getActiveEvent();
  if (!DS || !DS.enemy) return;
  // 🌼 A fallen hero from your Graveyard fights beside you
  if (ev === 'muertos') {
    var g = [];
    try { g = getGraveyard() || []; } catch (e) {}
    if (g.length) {
      var hero = g[Math.floor(Math.random() * g.length)];
      var lvl = hero.level || 1;
      fxGet().ally = { ghost: true, name: 'ghost of ' + (hero.name || 'a fallen hero'), atk: [3 + lvl, 7 + lvl * 2] };
      addLog('🌼 The ghost of ' + (hero.name || 'a fallen hero') + (hero.cls ? ' the ' + hero.cls : '') + ' returns to fight beside you.');
    }
  }
  // 🃏 Chaos Day: every fight rolls a twist
  if (ev === 'chaos') {
    var e = DS.enemy, roll = Math.floor(Math.random() * 5), msg = '';
    if (roll === 0) { e.hp = Math.round(e.hp * 0.5); e.maxHp = e.hp; msg = 'It forgot half its HP at home.'; }
    else if (roll === 1) { e.atk = [Math.max(1, Math.round(e.atk[0] * 1.5)), Math.max(2, Math.round(e.atk[1] * 1.5))]; e.gold = Array.isArray(e.gold) ? [e.gold[0] * 3, e.gold[1] * 3] : (e.gold || 5) * 3; msg = 'It hits 50% harder — and carries triple gold.'; }
    else if (roll === 2) { DS.markedKill = true; msg = 'It trips. Your first strike is a critical.'; }
    else if (roll === 3) { fxGet().stun = Math.max(fxGet().stun, 1); msg = 'It is laughing too hard to attack this turn.'; }
    else { e.name = ['Sir Wobbles', 'The Unimpressed', 'Gerald', 'Definitely Not A Mimic', 'Mr. Bones Jr.'][Math.floor(Math.random() * 5)] + ' (' + e.name + ')'; msg = 'It insists on a new name.'; }
    addLog('🃏 Chaos Day: ' + msg);
  }
}

// After every kill.
function eventOnKill(e) {
  var ev = getActiveEvent();
  // 🐉 Red envelopes
  if (ev === 'lunar' && Math.random() < 0.15) {
    if (Math.random() < 0.15) { addMysteryCoin(1); addLog('🧧 A red envelope! It holds a Mystery Coin.'); }
    else { var g = rnd(20, 60); DS.gold += g; addGlobalGold(g); updateTopBar(); addLog('🧧 A red envelope! ' + g + ' gold inside.'); }
  }
  // 🐾 A wanderer from another dungeon
  if (ev === 'migration' && e && e.isSeasonal) { gainXP(15); addLog('🐾 A wanderer from another dungeon — +15 bestiary XP.'); }
}

// 🇲🇽 ¡El Grito! — once a fight, +30% attack for 3 turns.
function gritoCry() {
  if (!DS.inCombat || !DS.enemy || getActiveEvent() !== 'mexico') return;
  var f = fxGet();
  if (f.gritoUsed) { say('You already gave your grito this fight.'); return; }
  f.gritoUsed = true;
  if (f.buffTurns > 0) { DS.atkBonus -= f.buffAtk; DS.defBonus -= f.buffDef; }
  f.buffAtk = Math.max(2, Math.round(((DS.atk[0] + DS.atk[1]) / 2 + (DS.atkBonus || 0)) * 0.3));
  f.buffDef = 0; f.buffTurns = 3;
  DS.atkBonus += f.buffAtk;
  sfx('sfx-confirm');
  addLog('🇲🇽 ¡VIVA MÉXICO! Your grito echoes through the dungeon — +' + f.buffAtk + ' attack for 3 turns!');
  say('Viva México! Your battle cry gives you plus ' + f.buffAtk + ' attack for 3 turns.');
  setCombatBtns(true); updateSkillButtons();
}

// 🏮 Night Market: the merchant comes far more often.
function eventMerchantChance(base) { return getActiveEvent() === 'nightmarket' ? 0.25 : base; }

// 🏮 The shop's 25% discount: night time, or the Night Market.
function shopNightDiscount() { return isNightTime() || getActiveEvent() === 'nightmarket'; }

var NEW_EVENT_IDS = { muertos:1, mexico:1, newyear:1, lunar:1, chaos:1, longestnight:1, eclipse:1, nightmarket:1, migration:1 };

// The Events screen cards.
var NEW_EVENT_CARDS = [
  { id:'muertos', title:'🌼 Día de los Muertos', titleClass:'halloween',
    desc:'November 1st and 2nd. The marigolds light the way home, and the dead come back to visit. A fallen hero from your Graveyard returns as a ghost and fights beside you in every fight. Calacas, La Catrina, Alebrijes and Xolo spirits fill the dungeon.',
    bonuses:'+30% XP. +20% gold. Enemies 10% stronger. 4 Día de los Muertos enemies. A ghost ally from your Graveyard. Earn 🌼 Marigolds — spend them at 🌼 The Ofrenda.',
    dates:'Active: November 1 — November 2' },
  { id:'mexico', title:'🇲🇽 Independencia de México', titleClass:'halloween',
    desc:'September 15th and 16th. ¡Viva México! Answer the Grito Champion with your own: the ¡El Grito! button in combat gives you +30% attack for 3 turns, once a fight. Ghostly charros and luchadores who never stay down join the dungeon.',
    bonuses:'+30% XP. +16% gold (for the 16th of September). Enemies 10% stronger. 3 Mexican Independence enemies. ¡El Grito! battle cry.',
    dates:'Active: September 15 — September 16' },
  { id:'newyear', title:'🎆 New Year', titleClass:'christmas',
    desc:'December 31st and January 1st. The old year ends, the new one begins, and the dungeon parties through both. Midnight Revelers, a Countdown Golem and Firework Wisps join in.',
    bonuses:'Double XP. +20% gold. 3 New Year enemies.',
    dates:'Active: December 31 — January 1' },
  { id:'lunar', title:'🐉 Lunar New Year', titleClass:'christmas',
    desc:'Three days at the start of the lunar new year — the date moves with the moon. Dragon dancers, the Nian Beast and lantern spirits come out. Defeated enemies sometimes leave a 🧧 red envelope with gold, or even a Mystery Coin.',
    bonuses:'+40% XP. +28% gold. Enemies 10% stronger. 3 Lunar New Year enemies. Red envelopes.',
    dates:'Active: the first three days of the lunar new year' },
  { id:'chaos', title:'🃏 Chaos Day', titleClass:'halloween',
    desc:'April 1st. Nothing makes sense. Every fight rolls a random twist: enemies with half their HP, enemies that hit harder but carry triple gold, enemies that trip, laugh, or insist on a new name.',
    bonuses:'+25% XP. +25% gold. A random twist every fight. 2 Chaos Day enemies.',
    dates:'Active: April 1st only' },
  { id:'longestnight', title:'🌑 The Longest Night', titleClass:'halloween',
    desc:'December 21st, the winter solstice. The sun never comes up in the dungeon — it is night all day, with every night bonus and the night shop discount on. Night Stalkers and Frost Owls hunt.',
    bonuses:'+30% XP. +10% gold. Enemies 20% stronger. Night all day. 2 Longest Night enemies.',
    dates:'Active: December 21st only' },
  { id:'eclipse', title:'🌘 The Eclipse', titleClass:'halloween',
    desc:'One evening a month, the sun goes dark over the dungeon for four hours — the same time for every player, so watch for it. Eclipse Wraiths and Corona Shades rise while the light is gone.',
    bonuses:'+50% XP. Double gold. Enemies 30% stronger. 2 Eclipse enemies.',
    dates:'Active: one evening a month, 18:00 — 22:00 UTC' },
  { id:'nightmarket', title:'🏮 Night Market', titleClass:'christmas',
    desc:'The first weekend of every month, the traders set up their lanterns. The Wandering Merchant shows up far more often, and everything in the shop is 25% off.',
    bonuses:'+10% XP. +10% gold. The merchant comes 4 times as often. 25% off in the shop.',
    dates:'Active: the first Saturday and Sunday of every month' },
  { id:'migration', title:'🐾 Monster Migration', titleClass:'christmas',
    desc:'Two days a month, the monsters move. Enemies from the other dungeons wander into yours — with all their abilities — at your floor\'s tier. Each wanderer you defeat gives bonus XP.',
    bonuses:'+25% XP. Enemies 5% stronger. Enemies from every other dungeon. +15 XP for each wanderer defeated.',
    dates:'Active: two days a month' }
];
