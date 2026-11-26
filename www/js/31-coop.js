// ═══════════════════════════════════════════════════════════════════════
// v12.1 — CO-OP 2.0 (the same rules and room as the apps' Coop.swift /
// CoopModel.swift, so web and app players play together)
// 2–4 players through 10 floors: two fights a floor (now and then an elite)
// and the boss on floor 10, who changes phase at two thirds and a third of
// its HP. Everyone brings their real character: gear, Legacy's spent level
// points, prestige stars, up to three class skills (SP) and their gun. Each
// round every player picks an action; when everyone has (or after 30
// seconds) it all happens at once, then the enemy strikes the weakest player
// or whoever hit it hardest. Revive a friend with a potion, or protect one.
// Potions cost your own gold at the merchant between floors.
// Each device writes its own stats and skills as plain numbers, so the host
// (web or app) runs every fight the same way. Room: "pvp_rooms/coop_CODE",
// kind "coop2" (a 12.0 app looks for "coop" and sees no room).
// ═══════════════════════════════════════════════════════════════════════

var COOP = {
  kind: 'coop2', max: 4, floors: 10, fightsPerFloor: 2, roundMs: 30000, startPotions: 2, maxPotions: 6,
  potionPrice: 40, spPerRound: 3,
  myId: 'c' + Math.random().toString(36).slice(2, 11),
  code: null, isHost: false, hostId: '', stage: 'choose', status: 'lobby',
  party: [], foe: null, floor: 1, fight: 1, round: 0, roundStart: 0, actions: {}, beats: {}, buys: {},
  shop: false, bought: 0,
  dungeon: '', myAction: null, seen: {}, log: [], resolving: false, rewarded: false,
  charIdx: 0, dungeonIdx: 0, ref: null, timer: null,
  dungeons: ['Crypt of Malachar', 'The Ashbound Wastes', 'Frosthold Abyss', 'The Sunken Archives', 'The Hollow', 'The Whispering Forest']
};

function _coRnd(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function _coNow() { return Date.now(); }

// A class skill as co-op numbers, from its description (the apps use their
// skill tables; the host only ever sees the numbers).
function coopSkillFrom(sk) {
  var d = (sk.desc || '').toLowerCase(), m;
  var c = { id: sk.effect, name: sk.name, icon: sk.icon || '✨', sp: sk.spCost || 0, dmg: 0, pct: 0, flat: 0,
            heal: 0, healPct: 0, team: false, shield: 0, stun: 0, dot: 0, dotTurns: 0, weaken: 1 };
  if ((m = d.match(/(\d+(?:\.\d+)?)x damage/))) c.dmg = parseFloat(m[1]);
  if (/twice|two hits|2 hits/.test(d)) c.dmg = (c.dmg || 1) * 2;
  if (/three times|3 hits/.test(d)) c.dmg = (c.dmg || 1) * 3;
  var nw = { two: 2, three: 3, four: 4, five: 5 };
  if (c.dmg > 0 && c.dmg < 1 && (m = d.match(/(\d+|two|three|four|five) (?:missiles|hits|strikes|times|bolts|skeletons|waves|blasts)/))) c.dmg *= nw[m[1]] || parseInt(m[1], 10) || 1;
  if ((m = d.match(/(?:heal|restore)\w*\s+(?:for\s+)?(\d+)\s*%/))) c.healPct = parseInt(m[1], 10) / 100;
  else if ((m = d.match(/(?:heal|restore)\w*\s+(?:for\s+)?(\d+)\s*hp/))) c.heal = parseInt(m[1], 10);
  else if (/heal|restore/.test(d) && !c.dmg) c.healPct = 0.25;
  if ((c.heal || c.healPct) && /party|allies|everyone/.test(d)) c.team = true;
  if ((m = d.match(/(\d+)[- ](?:point |hp |damage )?shield/)) || (m = d.match(/shield (?:of|for|absorbing) (\d+)/))) c.shield = parseInt(m[1], 10);
  if (/stun|paraly|freez/.test(d)) c.stun = 1;
  if ((m = d.match(/(\d+) damage (?:per|each|every) turn for (\d+)/))) { c.dot = parseInt(m[1], 10); c.dotTurns = parseInt(m[2], 10); }
  if (/half damage|weaken|reduc\w* (?:the )?enemy|enemy next attack/.test(d)) c.weaken = 0.75;
  if ((m = d.match(/reduce all incoming damage by (\d+)%/))) c.weaken = Math.max(0.5, 1 - parseInt(m[1], 10) / 100);
  if (/massive|devastating/.test(d) && !c.dmg) c.dmg = 2;
  if ((m = d.match(/absorb\w* (\d+)/))) c.shield = parseInt(m[1], 10);
  if (/block all incoming damage|cannot be killed/.test(d)) c.shield = Math.max(c.shield, 40);
  if (!c.dmg && /strike|damage|hit|blast|bolt|slash|shot/.test(d) && !/incoming damage|cannot be killed|block all/.test(d)) c.dmg = 1.3;
  if (!(c.dmg || c.pct || c.flat || c.heal || c.healPct || c.shield || c.stun || c.dot || c.weaken < 1)) c.dmg = 1.5;
  return c;
}

// Up to three: the ones this character knows (Legacy's saved skills), the
// starting skill, then by tier as the level allows (rare from 5, legendary 10).
function coopLoadout(cls, level, known) {
  var all = (typeof CLASS_SKILLS !== 'undefined' && CLASS_SKILLS[cls]) || [];
  var starts = {"Warrior": "shield-bash", "Monk": "swift-strike", "Assassin": "backstab", "Paladin": "holy-strike", "Naturalist": "entangle", "Wizard": "arcane-bolt", "Ranger": "aimed-shot", "Necromancer": "raise-dead", "Sorcerer": "fireball", "Warlock": "eldritch-blast", "Sentinel": "sentinel-strike", "Dragonborn": "flame-breath"};
  var picks = (known || []).map(function(k) { return all.filter(function(s) { return s.effect === k; })[0]; }).filter(Boolean);
  var first = all.filter(function(s) { return s.effect === starts[cls]; })[0];
  if (first && picks.indexOf(first) < 0) picks.unshift(first);
  var tiers = ['common'].concat(level >= 5 ? ['rare'] : []).concat(level >= 10 ? ['legendary'] : []).reverse();
  tiers.forEach(function(t) {
    if (picks.length >= 3) return;
    var s = all.filter(function(x) { return x.tier === t && picks.indexOf(x) < 0; })[0];
    if (s) picks.push(s);
  });
  return picks.slice(0, 3).map(coopSkillFrom);
}

// Your co-op self: class stats, prestige stars, +12 HP and +1 attack a level,
// your equipped weapon and armor, Legacy's spent level points, skills and gun.
function coopPlayer(ch) {
  var lvl = Math.max(1, ch.persistLevel || 1);
  var s = typeof prestigeStars === 'function' ? prestigeStars(ch) : 0;
  var hpBase = Math.round((HP_MAP[ch.cls] || 100) * (1 + 0.05 * s));
  var atk = ATK_MAP[ch.cls] || [6, 12], m = 1 + 0.05 * s;
  var bonus = lvl - 1, def = DEF_MAP[ch.cls] || 0, sp = 20, crit = 0.1, hpBonus = 0;
  try {
    var w = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
    if (w) { var wa = getWeaponAtk(w); if (Array.isArray(wa)) bonus += Math.floor((wa[0] + wa[1]) / 2); }
    var ar = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
    if (ar) def += ar.defBase || ar.defBonus || 0;
  } catch (e) {}
  if (ch.runMode === 'legacy' && lvl > 1 && ch.lpSpent) {
    var budget = 3 * (lvl - 1), used = 0, lp = ch.lpSpent;
    ['strength', 'stamina', 'defense', 'intelligence', 'agility', 'luck'].forEach(function(k) {
      var n = Math.min(lp[k] || 0, budget - used); if (n <= 0) return; used += n;
      if (k === 'strength') bonus += 2 * n; else if (k === 'stamina') hpBonus += 10 * n;
      else if (k === 'defense') def += 2 * n; else if (k === 'intelligence') sp += 5 * n; else if (k === 'agility') crit += 0.03 * n;
    });
  }
  var hp = hpBase + hpBonus + 12 * (lvl - 1);
  var lo = Math.max(1, Math.round(atk[0] * m) + bonus), hi = Math.max(lo, Math.round(atk[1] * m) + bonus);
  var p = { id: COOP.myId, name: s > 0 ? ch.name + ' ★' + s : ch.name, cls: ch.cls, level: lvl, hp: hp, maxHp: hp,
            atkLo: lo, atkHi: hi, def: def, sp: sp, maxSp: sp, crit: Math.min(0.5, crit), potions: COOP.startPotions,
            platform: 'web', ready: false, joinedAt: _coNow(),
            skills: coopLoadout(ch.cls, lvl, ch.runMode === 'legacy' ? ch.persistSkills : []),
            gunName: '', gunLo: 0, gunHi: 0, gunShots: 0, shots: 0, shield: 0, dealt: 0 };
  var g = typeof getEquippedGun === 'function' ? getEquippedGun() : null;
  if (g) { p.gunName = (g.icon || '🔫') + ' ' + g.name; p.gunLo = g.dmgMin || 0; p.gunHi = Math.max(p.gunLo, g.dmgMax || 0);
           p.gunShots = Math.max(1, Math.min(3, g.shots || 1)); p.shots = p.gunShots; }
  return p;
}

function coopTable(dungeon) {
  return dungeon === 'The Ashbound Wastes' ? ASH_ENEMIES : dungeon === 'Frosthold Abyss' ? FROST_ENEMIES :
    dungeon === 'The Sunken Archives' ? SUNKEN_ENEMIES : dungeon === 'The Hollow' ? HOLLOW_ENEMIES :
    dungeon === 'The Whispering Forest' ? WHISPER_ENEMIES : ENEMIES;
}

// The fight's enemy (the boss on floor 10), scaled like a normal run and by
// the dungeon's depth, 70% more HP for each extra player, 60% more for the
// boss, and one fight in seven from floor 3 is an elite (+50%).
function coopFoe(dungeon, floor, party) {
  var tb = coopTable(dungeon) || ENEMIES;
  var boss = floor >= COOP.floors;
  var t;
  if (boss) t = (tb.bosses && tb.bosses[_coRnd(0, tb.bosses.length - 1)]) || tb.boss || ENEMIES.boss;
  else {
    var pool = (tb[floor <= 3 ? 't1' : floor <= 6 ? 't2' : 't3'] || tb.t1 || ENEMIES.t1).filter(function(e) { return !e.isBoss; });
    t = pool[_coRnd(0, pool.length - 1)];
  }
  var n = Math.max(1, party.length);
  var lvl = Math.max(1, Math.floor(party.reduce(function(a, p) { return a + (p.level || 1); }, 0) / n));
  var lm = lvl > 1 ? 1 + (lvl - 1) * 0.08 : 1, f = floor - 1;
  var elite = !boss && floor >= 3 && Math.random() < 1 / 7;
  var mult = (typeof dungeonDepthMult === 'function' ? dungeonDepthMult(dungeon) : 1) * (elite ? 1.5 : 1);
  var hp = Math.round(Math.round(t.hp * (1 + f * 0.09) * lm) * (1 + 0.7 * (n - 1)) * (boss ? 1.6 : 1) * mult);
  var lo = Math.round(Math.round(t.atk[0] * (1 + f * 0.06) * lm) * mult), hi = Math.round(Math.round(t.atk[1] * (1 + f * 0.06) * lm) * mult);
  return { name: (elite ? 'Elite ' : '') + t.name, icon: t.icon || '💀', hp: hp, maxHp: hp, atkLo: lo, atkHi: Math.max(lo, hi),
           boss: boss, elite: elite, phase: 1, stun: 0, dot: 0, dotTurns: 0, weaken: 1 };
}

function _coList(x) { return Array.isArray(x) ? x : x ? Object.keys(x).sort(function(a, b) { return a - b; }).map(function(k) { return x[k]; }) : []; }
function _coAtk(f) {
  var m = (f.weaken || 1) * (1 + 0.2 * ((f.phase || 1) - 1));
  var lo = Math.max(1, Math.round(f.atkLo * m)); return [lo, Math.max(lo, Math.round(f.atkHi * m))];
}

// Everyone's actions at once, then the enemy's answer (Coop.resolve).
function coopResolve(party, foe, actions) {
  party = party.map(function(p) { var q = Object.assign({}, p); q.skills = _coList(p.skills); q.dealt = 0; return q; });
  foe = Object.assign({ phase: 1, stun: 0, dot: 0, dotTurns: 0, weaken: 1 }, foe);
  var lines = [], defending = {}, guardOf = {};
  function byId(id) { return party.filter(function(p) { return p.id === id; })[0]; }
  // Only those standing when the round starts act (a friend revived this
  // round gets up, but doesn't swing until the next one).
  var acting = party.filter(function(p) { return p.hp > 0; });
  acting.forEach(function(p) {
    var raw = actions[p.id] || 'attack', a = raw.split(':')[0], arg = raw.indexOf(':') > 0 ? raw.slice(raw.indexOf(':') + 1) : '';
    var sk = a === 'skill' ? p.skills.filter(function(s) { return s.id === arg; })[0] : null;
    if (a === 'potion' && p.potions <= 0) a = 'attack';
    if (a === 'gun' && (p.shots <= 0 || !(p.gunShots > 0 && p.gunHi > 0))) a = 'attack';
    if (a === 'skill' && !(sk && p.sp >= sk.sp)) a = 'attack';
    if (a === 'revive' && !(p.potions > 0 && byId(arg) && byId(arg).hp <= 0)) a = 'attack';
    if (a === 'protect' && !(arg !== p.id && byId(arg) && byId(arg).hp > 0)) a = 'defend';
    if (['attack', 'heavy', 'defend', 'potion', 'gun', 'skill', 'revive', 'protect'].indexOf(a) < 0) a = 'attack';
    if (a === 'potion') {
      var heal = Math.round(p.maxHp * 0.4);
      p.hp = Math.min(p.maxHp, p.hp + heal); p.potions--;
      lines.push('🧪 ' + p.name + ' drinks a potion: +' + heal + ' HP (' + p.hp + ' of ' + p.maxHp + ').');
      return;
    }
    if (a === 'revive') {
      var t = byId(arg); p.potions--; t.hp = Math.max(1, Math.round(t.maxHp * 0.35));
      lines.push('💫 ' + p.name + ' pours a potion on ' + t.name + ', who gets back up with ' + t.hp + ' HP!');
      return;
    }
    if (a === 'protect') {
      guardOf[arg] = p.id; defending[p.id] = true;
      lines.push('🛡 ' + p.name + ' stands in front of ' + byId(arg).name + '.');
      return;
    }
    if (a === 'defend') defending[p.id] = true;
    if (foe.hp <= 0) return;
    var dmg = _coRnd(p.atkLo, p.atkHi), line;
    if (a === 'heavy') {
      if (Math.random() < 0.3) { lines.push('💥 ' + p.name + '\'s heavy strike misses!'); return; }
      dmg = Math.round(dmg * 1.8); line = '💥 ' + p.name + ' heavy strikes for ' + dmg;
    } else if (a === 'defend') {
      dmg = Math.max(1, Math.floor(dmg / 2)); line = '🛡 ' + p.name + ' defends and strikes for ' + dmg;
    } else if (a === 'gun') {
      dmg = _coRnd(p.gunLo, p.gunHi) + Math.floor(p.atkLo / 2); p.shots--;
      line = '🔫 ' + p.name + ' fires ' + p.gunName + ' for ' + dmg;
    } else if (a === 'skill') {
      p.sp -= sk.sp;
      dmg = Math.round(dmg * (sk.dmg || 0)) + Math.round(foe.maxHp * (sk.pct || 0)) + (sk.flat || 0);
      var extra = [];
      if (sk.heal || sk.healPct) {
        (sk.team ? party.filter(function(q) { return q.hp > 0; }) : [p]).forEach(function(q) {
          q.hp = Math.min(q.maxHp, q.hp + (sk.heal || 0) + Math.round(q.maxHp * (sk.healPct || 0)));
        });
        var amt = (sk.heal || 0) + Math.round(p.maxHp * (sk.healPct || 0));
        extra.push(sk.team ? 'the party heals ' + amt : 'heals ' + amt);
      }
      if (sk.shield) { p.shield = (p.shield || 0) + sk.shield; extra.push('a ' + sk.shield + ' shield'); }
      if (sk.stun) { foe.stun = Math.max(foe.stun, sk.stun); extra.push(foe.name + ' is stunned'); }
      if (sk.dot) { foe.dot = Math.max(foe.dot, sk.dot); foe.dotTurns = Math.max(foe.dotTurns, sk.dotTurns); extra.push(sk.dot + ' a round for ' + sk.dotTurns + ' rounds'); }
      if (sk.weaken < 1) { foe.weaken = Math.max(0.4, foe.weaken * sk.weaken); extra.push(foe.name + ' hits softer'); }
      line = sk.icon + ' ' + p.name + ' uses ' + sk.name + (dmg > 0 ? ' for ' + dmg : '') + (extra.length ? ': ' + extra.join(', ') : '');
      if (dmg <= 0) { lines.push(line + '.'); return; }
    } else if (Math.random() < (p.crit || 0.1)) {
      dmg *= 2; line = '⚔ ' + p.name + ' lands a CRITICAL hit for ' + dmg;
    } else line = '⚔ ' + p.name + ' hits for ' + dmg;
    foe.hp = Math.max(0, foe.hp - dmg);
    p.dealt = dmg;
    lines.push(line + (foe.hp > 0 ? '.' : ' — ' + foe.name + ' falls!'));
  });
  if (foe.hp > 0 && foe.dotTurns > 0 && foe.dot > 0) {
    foe.hp = Math.max(0, foe.hp - foe.dot); foe.dotTurns--;
    lines.push('🩸 ' + foe.name + ' takes ' + foe.dot + ' more damage' + (foe.hp > 0 ? '.' : ' and falls!'));
  }
  if (foe.hp <= 0) return { party: party, foe: foe, lines: lines, foeDown: true, partyDown: false };

  function hurt(t, raw, prefix) {
    var d = Math.max(1, raw - Math.floor(t.def / 2));
    if (defending[t.id]) d = Math.max(1, Math.floor(d / 2));
    if (t.shield > 0) { var soak = Math.min(t.shield, d); t.shield -= soak; d -= soak; }
    t.hp = Math.max(0, t.hp - d);
    lines.push(prefix + ' ' + t.name + ' for ' + d + (t.hp > 0 ? ' (' + t.hp + ' of ' + t.maxHp + ' HP).' : ' — ' + t.name + ' is down!'));
  }
  var sweep = false;
  if (foe.boss) {
    var ph = foe.hp * 3 <= foe.maxHp ? 3 : foe.hp * 3 <= foe.maxHp * 2 ? 2 : 1;
    if (ph > foe.phase) {
      foe.phase = ph; sweep = true;
      lines.push(ph === 2 ? '⚡ ' + foe.name + ' roars and changes! It hits harder now.' : '🔥 ' + foe.name + ' is desperate. Its final phase begins!');
    }
  }
  var standing = party.filter(function(p) { return p.hp > 0; }), ar = _coAtk(foe);
  if (foe.stun > 0) {
    foe.stun--; lines.push('💫 ' + foe.name + ' is stunned and can\'t attack.');
  } else if (sweep) {
    standing.forEach(function(t) { hurt(t, Math.max(1, Math.floor(_coRnd(ar[0], ar[1]) * 2 / 3)), foe.icon + ' The blast hits'); });
  } else if (standing.length) {
    var t;
    if (Math.random() < 0.5) t = standing.slice().sort(function(x, y) { return x.hp / x.maxHp - y.hp / y.maxHp; })[0];
    else {
      var top = standing.slice().sort(function(x, y) { return y.dealt - x.dealt; })[0];
      t = top.dealt > 0 ? top : standing[_coRnd(0, standing.length - 1)];
    }
    var g = guardOf[t.id] && byId(guardOf[t.id]);
    if (g && g.hp > 0) { lines.push('🛡 ' + g.name + ' takes the hit for ' + t.name + '!'); t = g; }
    hurt(t, _coRnd(ar[0], ar[1]), foe.icon + ' ' + foe.name + ' strikes');
  }
  var down = !party.some(function(p) { return p.hp > 0; });
  lines.push(foe.name + ': ' + foe.hp + ' of ' + foe.maxHp + ' HP.');
  party.forEach(function(p) { if (p.hp > 0) p.sp = Math.min(p.maxSp, p.sp + COOP.spPerRound); });
  return { party: party, foe: foe, lines: lines, foeDown: false, partyDown: down };
}

// Between fights: everyone heals 15% and the gun reloads. Between floors the
// downed get back up with 30% HP, everyone else heals 25%, and SP fills.
function coopRest(party, floor) {
  return party.map(function(p) {
    var q = Object.assign({}, p);
    q.shots = p.gunShots || 0; q.shield = 0; q.dealt = 0;
    if (p.hp > 0) q.hp = Math.min(p.maxHp, p.hp + Math.round(p.maxHp * (floor ? 0.25 : 0.15)));
    else if (floor) q.hp = Math.round(p.maxHp * 0.3);
    if (floor) q.sp = p.maxSp;
    return q;
  });
}

function coopSkillSummary(sk) {
  var parts = [];
  if (sk.dmg > 0) parts.push(sk.dmg === 1 ? 'a hit' : '×' + (Math.round(sk.dmg * 10) / 10) + ' damage');
  if (sk.pct > 0) parts.push(Math.round(sk.pct * 100) + '% of its max HP');
  if (sk.flat > 0) parts.push('+' + sk.flat + ' damage');
  if (sk.heal > 0 || sk.healPct > 0) { var amt = sk.healPct > 0 ? Math.round(sk.healPct * 100) + '% HP' : sk.heal + ' HP'; parts.push(sk.team ? 'heals the party ' + amt : 'heals you ' + amt); }
  if (sk.shield > 0) parts.push(sk.shield + ' shield');
  if (sk.stun > 0) parts.push('stuns ' + sk.stun + ' turn' + (sk.stun === 1 ? '' : 's'));
  if (sk.dot > 0) parts.push(sk.dot + ' a round for ' + sk.dotTurns + ' rounds');
  if (sk.weaken < 1) parts.push('enemy hits ' + Math.round((1 - sk.weaken) * 100) + '% softer');
  return parts.length ? parts.join(', ') : 'a hit';
}

function coopXp(cleared, won) { var x = 0; for (var i = 0; i < cleared; i++) x += 60 + i * 15; return x + (won ? 500 : 0); }

function coopCode() {
  var c = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = '';
  for (var i = 0; i < 4; i++) s += c[_coRnd(0, c.length - 1)];
  return s;
}

function coopRef() { return COOP.code && window._fbRtdb ? window._fbRtdb.ref('pvp_rooms/coop_' + COOP.code) : null; }
function coopMe() { return COOP.party.filter(function(p) { return p.id === COOP.myId; })[0]; }

// ── Rooms ──
function coopHost() {
  var ch = CHARS[COOP.charIdx];
  if (!ch) { say('Choose a character first.'); return; }
  if (!window._fbRtdb) { say('Co-op needs the internet. Check your connection.'); return; }
  COOP.code = coopCode(); COOP.isHost = true; COOP.hostId = COOP.myId; COOP.dungeon = COOP.dungeons[COOP.dungeonIdx];
  var me = coopPlayer(ch), players = {}, beat = {};
  players[COOP.myId] = me; beat[COOP.myId] = _coNow();
  coopRef().set({ kind: COOP.kind, version: 2, code: COOP.code, status: 'lobby', host: COOP.myId, dungeon: COOP.dungeon, floor: 1, round: 0,
                  createdAt: _coNow(), players: players, beat: beat }).then(function() {
    COOP.stage = 'lobby';
    try { sfx('sfx-confirm'); } catch (e) {}
    say('Room created. Your code is ' + COOP.code.split('').join(' ') + '. Share it with up to three friends, then press Start when everyone is ready.');
    coopListen();
  }).catch(function() { say('Couldn\'t create the room. Check your connection.'); });
}

function coopJoin() {
  var ch = CHARS[COOP.charIdx];
  if (!ch) { say('Choose a character first.'); return; }
  var c = ((document.getElementById('coop-code') || {}).value || '').trim().toUpperCase();
  if (c.length !== 4) { say('Enter the 4 character room code.'); return; }
  if (!window._fbRtdb) { say('Co-op needs the internet. Check your connection.'); return; }
  COOP.code = c;
  coopRef().once('value').then(function(snap) {
    var r = snap.val();
    if (r && r.kind === 'coop') { COOP.code = null; say('That room is from an older version of Dungeon Descent. Ask the host to update, then make a new room.'); return; }
    if (!r || r.kind !== COOP.kind) { COOP.code = null; say('No co-op room with that code. Check it and try again.'); return; }
    if (r.status !== 'lobby') { COOP.code = null; say('That run has already started.'); return; }
    if (Object.keys(r.players || {}).length >= COOP.max) { COOP.code = null; say('That room is full.'); return; }
    coopRef().child('players/' + COOP.myId).set(coopPlayer(ch));
    coopRef().child('beat/' + COOP.myId).set(_coNow());
    COOP.stage = 'lobby';
    try { sfx('sfx-confirm'); } catch (e) {}
    say('Joined room ' + c + '. Press Ready when you\'re set. The host starts the run.');
    coopListen();
  }).catch(function() { say('Couldn\'t reach the room. Check your connection.'); });
}

function coopReady() { var r = coopRef(); if (r) r.child('players/' + COOP.myId + '/ready').set(true); say('Ready.'); }

function coopStart() {
  if (!COOP.isHost) return;
  var waiting = COOP.party.filter(function(p) { return !p.ready && p.id !== COOP.myId; });
  if (waiting.length) { say('Waiting for ' + waiting.map(function(p) { return p.name; }).join(', ') + ' to be ready.'); return; }
  var f = coopFoe(COOP.dungeon, 1, COOP.party);
  coopRef().update({ status: 'playing', floor: 1, fight: 1, round: 1, roundStart: _coNow(), foe: f });
  coopLog(['⚔ The party descends into ' + COOP.dungeon + '. Floor 1, fight 1 of ' + COOP.fightsPerFloor + ': ' + f.icon + ' ' + f.name + ' blocks the way, ' + f.hp + ' HP.']);
}

function coopLeave() {
  var r = coopRef();
  if (r) {
    if (COOP.isHost && (COOP.status === 'lobby' || COOP.status === 'playing')) r.child('status').set('closed');
    else if (COOP.status === 'lobby') r.child('players/' + COOP.myId).remove();
  }
  coopStop();
  COOP.stage = 'choose'; COOP.code = null; COOP.isHost = false; COOP.status = 'lobby'; COOP.party = []; COOP.foe = null;
  COOP.log = []; COOP.seen = {}; COOP.rewarded = false; COOP.myAction = null; COOP.round = 0;
  COOP.fight = 1; COOP.shop = false; COOP.bought = 0; COOP.buys = {}; COOP.endText = '';
  coopRender();
}

function coopStop() {
  if (COOP.timer) { clearInterval(COOP.timer); COOP.timer = null; }
  if (COOP.ref) { try { COOP.ref.off(); } catch (e) {} COOP.ref = null; }
}

function coopActName(raw) {
  var m = coopMe(), a = raw.split(':')[0], arg = raw.slice(raw.indexOf(':') + 1);
  function who(id) { var p = COOP.party.filter(function(q) { return q.id === id; })[0]; return p ? p.name : 'a friend'; }
  if (a === 'skill') { var s = m && _coList(m.skills).filter(function(x) { return x.id === arg; })[0]; return s ? s.name : 'Skill'; }
  if (a === 'revive') return 'Revive ' + who(arg);
  if (a === 'protect') return 'Protect ' + who(arg);
  if (a === 'gun') return 'Fire ' + (m && m.gunName ? m.gunName : 'your gun');
  return { attack: 'Attack', heavy: 'Heavy strike', defend: 'Defend', potion: 'Potion' }[a] || a;
}

function coopAct(raw) {
  var m = coopMe();
  if (COOP.status !== 'playing' || COOP.shop || !m || m.hp <= 0 || COOP.myAction) return;
  var a = raw.split(':')[0], arg = raw.slice(raw.indexOf(':') + 1);
  if ((a === 'potion' || a === 'revive') && m.potions <= 0) { say('No potions left.'); return; }
  if (a === 'gun' && m.shots <= 0) { say('Your gun is empty until the next fight.'); return; }
  if (a === 'skill') {
    var s = _coList(m.skills).filter(function(x) { return x.id === arg; })[0];
    if (!s) return;
    if (m.sp < s.sp) { say('Not enough SP: ' + s.name + ' needs ' + s.sp + ', you have ' + m.sp + '.'); return; }
  }
  COOP.myAction = raw;
  coopRef().child('actions/' + COOP.myId).set(raw);
  try { sfx(a === 'potion' ? 'sfx-potion' : a === 'defend' || a === 'protect' ? 'sfx-select' : 'sfx-attack'); } catch (e) {}
  say(coopActName(raw) + ' chosen. Waiting for the party.');
  coopRender();
}

// The merchant between floors: a potion for your own gold, added when the
// next floor starts.
function coopBuyPotion() {
  var m = coopMe();
  if (!COOP.shop || !m) return;
  if (m.potions + COOP.bought >= COOP.maxPotions) { say('You can carry ' + COOP.maxPotions + ' potions.'); return; }
  if (!spendGlobalGold(COOP.potionPrice)) { say('Not enough gold. A potion is ' + COOP.potionPrice + ' gold, you have ' + getGlobalGold() + '.'); return; }
  COOP.bought++;
  coopRef().child('buys/' + COOP.myId).set(COOP.bought);
  try { sfx('sfx-purchase'); } catch (e) {}
  say('Potion bought for ' + COOP.potionPrice + ' gold. You\'ll have ' + (m.potions + COOP.bought) + '. ' + getGlobalGold() + ' gold left.');
  coopRender();
}

function coopLog(lines) {
  var r = coopRef();
  if (!r) return;
  lines.forEach(function(l) { r.child('log').push({ text: l, t: _coNow() }); });
}

function coopListen() {
  coopStop();
  COOP.ref = coopRef();
  COOP.ref.on('value', function(snap) { coopReceived(snap.val()); });
  COOP.timer = setInterval(coopTick, 1000);
  coopRender();
}

function coopReceived(r) {
  if (!r) { if (COOP.stage !== 'choose') { say('The room is gone.'); COOP.stage = 'over'; coopStop(); coopRender(); } return; }
  COOP.hostId = r.host || COOP.hostId;
  COOP.dungeon = r.dungeon || COOP.dungeon;
  var nf = r.floor || COOP.floor;
  if (nf !== COOP.floor && nf >= COOP.floors && COOP.status === 'playing') { try { playTrack('boss'); } catch (e) {} }
  COOP.floor = nf;
  if ((r.round || 0) !== COOP.round) { COOP.round = r.round || 0; COOP.myAction = null; }
  COOP.roundStart = r.roundStart || COOP.roundStart;
  COOP.fight = r.fight || 1;
  var shop = !!r.shop;
  if (shop !== COOP.shop) { COOP.shop = shop; if (!shop) COOP.bought = 0; }
  COOP.buys = r.buys || {};
  var before = {};
  COOP.party.forEach(function(p) { before[p.id] = true; });
  var players = [];
  Object.keys(r.players || {}).forEach(function(k) { var p = r.players[k]; if (p && p.id) players.push(p); });
  players.sort(function(a, b) { return (a.joinedAt || 0) - (b.joinedAt || 0); });
  if (COOP.party.length && COOP.stage === 'lobby') players.forEach(function(p) { if (!before[p.id] && p.id !== COOP.myId) say(p.name + ' joined the party.'); });
  COOP.party = players;
  COOP.foe = r.foe || null;
  COOP.actions = r.actions || {};
  if (COOP.actions[COOP.myId]) COOP.myAction = COOP.actions[COOP.myId];
  COOP.beats = r.beat || {};
  var keys = Object.keys(r.log || {}).sort(), fresh = [];
  keys.forEach(function(k) { if (!COOP.seen[k]) { COOP.seen[k] = true; if (r.log[k] && r.log[k].text) fresh.push(r.log[k].text); } });
  if (fresh.length) { COOP.log = fresh.slice().reverse().concat(COOP.log).slice(0, 40); say(fresh.join(' ')); }
  var st = r.status || 'lobby';
  if (st !== COOP.status) {
    COOP.status = st;
    if (st === 'playing') { COOP.stage = 'playing'; try { playTrack('battle'); } catch (e) {} }
    else if (st === 'won' || st === 'lost') { COOP.stage = 'over'; coopPayOut(st === 'won'); }
    else if (st === 'closed') { COOP.stage = 'over'; say('The host ended the run.'); coopPayOut(false); }
  }
  if (COOP.isHost) coopHostStep();
  coopRender();
}

function coopTick() {
  var r = coopRef();
  if (r) r.child('beat/' + COOP.myId).set(_coNow());
  if (COOP.isHost) coopHostStep();
  var hb = COOP.beats[COOP.hostId];
  if (!COOP.isHost && (COOP.status === 'lobby' || COOP.status === 'playing') && hb && _coNow() - hb > 60000) {
    COOP.status = 'closed'; COOP.stage = 'over';
    say('The host left, so the run is over.');
    coopPayOut(false); coopStop(); coopRender();
  }
}

// ── The host runs the fight ──
function coopHostStep() {
  if (!COOP.isHost || COOP.status !== 'playing' || COOP.resolving || COOP.shop || !COOP.foe || COOP.foe.hp <= 0 || COOP.round <= 0) return;
  var standing = COOP.party.filter(function(p) { return p.hp > 0; });
  var allIn = standing.every(function(p) { return COOP.actions[p.id]; });
  var timedOut = _coNow() - COOP.roundStart > COOP.roundMs;
  if (!allIn && !timedOut) return;
  COOP.resolving = true;
  var res = coopResolve(COOP.party, COOP.foe, COOP.actions), lines = res.lines;
  if (timedOut && !allIn) lines.unshift('⏱ Time\'s up — anyone who hadn\'t chosen attacks.');
  var u = { foe: res.foe, actions: null };
  coopWrite(res.party, u);
  if (res.foeDown) {
    if (COOP.floor >= COOP.floors) {
      lines.push('👑 ' + res.foe.name + ' is defeated! The party has conquered ' + COOP.dungeon + '!');
      u.status = 'won';
    } else if (COOP.fight < COOP.fightsPerFloor) {
      lines.push('✨ Fight won! Everyone catches their breath and heals a little.');
      u.round = 0;
      var rested = coopRest(res.party, false), nf = COOP.fight + 1, fl = COOP.floor;
      setTimeout(function() { if (COOP.status === 'playing') coopStartFight(fl, nf, rested); }, 3000);
    } else {
      lines.push('✨ Floor ' + COOP.floor + ' cleared! Everyone heals, and the fallen get back up.');
      lines.push('🛒 The merchant is here for 15 seconds: potions are ' + COOP.potionPrice + ' gold each, with your own gold.');
      u.round = 0; u.shop = true;
      var healed = coopRest(res.party, true), next = COOP.floor + 1;
      coopWrite(healed, u);
      setTimeout(function() {
        if (COOP.status !== 'playing') return;
        var party = COOP.party.map(function(p) {
          var q = Object.assign({}, p); q.potions = Math.min(COOP.maxPotions, (p.potions || 0) + (COOP.buys[p.id] || 0)); return q; });
        coopRef().update({ shop: false, buys: null });
        coopStartFight(next, 1, party);
      }, 15000);
    }
  } else if (res.partyDown) {
    lines.push('💀 The whole party has fallen on floor ' + COOP.floor + '.');
    u.status = 'lost';
  } else {
    u.round = COOP.round + 1;
    u.roundStart = _coNow();
  }
  coopRef().update(u).then(function() { COOP.resolving = false; }).catch(function() { COOP.resolving = false; });
  coopLog(lines);
}

function coopWrite(party, u) {
  party.forEach(function(p) {
    ['hp', 'potions', 'sp', 'shield', 'shots', 'dealt'].forEach(function(k) { u['players/' + p.id + '/' + k] = p[k] || 0; });
  });
}

function coopStartFight(floor, n, party) {
  var f = coopFoe(COOP.dungeon, floor, party);
  var u = { floor: floor, fight: n, round: 1, roundStart: _coNow(), foe: f };
  coopWrite(party, u);
  coopRef().update(u);
  coopLog([f.boss ? '👑 Floor ' + floor + ': the boss, ' + f.icon + ' ' + f.name + ', ' + f.hp + ' HP. It changes when it\'s hurt. This is it.'
                  : '⬇ Floor ' + floor + ', fight ' + n + ' of ' + COOP.fightsPerFloor + ': ' + f.icon + ' ' + f.name + (f.elite ? ', an elite,' : '') + ', ' + f.hp + ' HP.']);
}

// ── Rewards, on each player's own device ──
function coopPayOut(won) {
  if (COOP.rewarded) return;
  COOP.rewarded = true;
  var cleared = won ? COOP.floors : Math.max(0, COOP.floor - 1);
  var gold = 100 * cleared + (won ? 1000 : 0);
  if (gold > 0) addGlobalGold(gold);
  // XP for your real level, on the Endless Descent curve (never lower).
  var xp = coopXp(cleared, won), levelLine = '', ch = CHARS[COOP.charIdx];
  if (xp > 0 && ch && typeof afkXpToLevelUp === 'function') {
    var lv = Math.max(1, ch.persistLevel || 1), have = (ch.persistXp || 0) + xp, start = lv, need;
    while ((need = afkXpToLevelUp(lv)) !== null && have >= need) { have -= need; lv++; }
    if (lv >= AFK_MAX_LEVEL) have = 0;
    ch.persistLevel = lv; ch.persistXp = have;
    try { saveChars(); } catch (e) {}
    if (lv > start) levelLine = ' ' + ch.name + ' reaches level ' + lv + '!';
  }
  if (typeof bpRecord === 'function') {
    for (var i = 0; i < cleared; i++) { bpRecord('floor'); if (!won || i < cleared - 1) bpRecord('kill', {}); }
    if (won) { bpRecord('kill', { boss: true }); bpRecord('clear'); }
  }
  if (won) { try { sfx('sfx-victory'); } catch (e) {} }
  try { playTrack(getMenuTrack()); } catch (e) {}
  var text = won ? 'Victory! The party cleared all ' + COOP.floors + ' floors. You earn ' + gold + ' gold and ' + xp + ' XP.' + levelLine
    : cleared > 0 ? 'The run is over after ' + cleared + ' floor' + (cleared === 1 ? '' : 's') + '. You earn ' + gold + ' gold and ' + xp + ' XP.' + levelLine : 'The run is over.';
  COOP.endText = text;
  setTimeout(function() { say(text); }, 1500);
  if (COOP.isHost) { var ref = coopRef(); setTimeout(function() { try { ref.remove(); } catch (e) {} }, 120000); }
}

// ── The screen ──
function openCoop() {
  var el = document.getElementById('screen-coop');
  if (!el) {
    el = document.createElement('div');
    el.id = 'screen-coop'; el.className = 'screen';
    el.setAttribute('role', 'main'); el.setAttribute('aria-label', 'Co-op Dungeon');
    var anchor = document.getElementById('screen-void-reaper');
    (anchor && anchor.parentNode ? anchor.parentNode : document.body).insertBefore(el, anchor || null);
  }
  goTo('coop');
  coopRender();
  say('Co-op Dungeon. Fight through ten floors with up to three friends, on the web or the app. Choose a character, then host a room or join one with its code.');
}

function _coBtn(label, onclick, aria, primary, selected) {
  return '<button class="menu-btn' + (primary ? ' primary' : '') + (selected ? ' selected' : '') + '" style="width:100%;margin-bottom:6px;"' +
    (selected !== undefined ? ' role="radio" aria-checked="' + (selected ? 'true' : 'false') + '"' : '') +
    ' onclick="' + onclick + '" aria-label="' + _u119Esc(aria || label) + '">' + _u119Esc(label) + '</button>';
}
function _coH(t) { return '<h3 style="font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:0.2em;color:var(--gold-dim);margin:14px 0 6px;">' + t + '</h3>'; }
function _coBar(v, c) { return '<div aria-hidden="true" style="background:#111;height:8px;margin:3px 0;"><div style="background:' + c + ';height:100%;width:' + Math.round(Math.max(0, Math.min(1, v)) * 100) + '%;"></div></div>'; }

function coopRender() {
  var el = document.getElementById('screen-coop');
  if (!el) return;
  var h = '<div style="max-width:440px;margin:0 auto;padding:20px 16px;">' +
    '<div class="screen-header"><button class="back-btn" onclick="coopLeave();goTo(\'menu\')" aria-label="Leave co-op and go back to the main menu">← Menu</button>' +
    '<h2 class="screen-title" style="color:#66ddcc;">🤝 Co-op Dungeon</h2></div>';
  if (COOP.stage === 'choose') {
    if (!CHARS.length) h += '<p style="color:#aaa;">Create a character first.</p>';
    else {
      h += _coH('YOUR CHARACTER');
      CHARS.forEach(function(ch, i) {
        var s = typeof prestigeStars === 'function' ? prestigeStars(ch) : 0;
        h += _coBtn(ch.name + (s ? ' ★' + s : '') + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel || 1) + ')', 'COOP.charIdx=' + i + ';say(\'' + _u119Esc(ch.name).replace(/'/g, '') + ' selected.\');coopRender()', null, false, i === COOP.charIdx);
      });
      h += _coH('HOST A ROOM');
      COOP.dungeons.forEach(function(d, i) { h += _coBtn(d, 'COOP.dungeonIdx=' + i + ';say(\'' + d.replace(/'/g, '') + ' selected.\');coopRender()', null, false, i === COOP.dungeonIdx); });
      h += _coBtn('🤝 Host a Room', 'coopHost()', 'Host a co-op room in ' + COOP.dungeons[COOP.dungeonIdx], true);
      h += _coH('JOIN A FRIEND') + '<div style="display:flex;gap:6px;"><input id="coop-code" maxlength="4" autocapitalize="characters" aria-label="Room code, 4 letters" placeholder="Room code" style="flex:1;background:#111;border:1px solid #333;color:#ddd;font-family:Cinzel,serif;padding:8px;text-transform:uppercase;">' +
        '<button class="menu-btn primary" onclick="coopJoin()" aria-label="Join the room">Join</button></div>';
    }
  } else if (COOP.stage === 'lobby') {
    h += '<p style="font-family:Cinzel,serif;font-size:1.1rem;color:#66ddcc;" aria-label="Room code: ' + (COOP.code || '').split('').join(' ') + '">Room code: ' + COOP.code + '</p>' +
      '<p style="font-family:\'Crimson Text\',serif;font-style:italic;color:#aaa;">' + _u119Esc(COOP.dungeon) + ' · up to ' + COOP.max + ' players</p>' + _coH('THE PARTY');
    COOP.party.forEach(function(p) {
      var ok = p.ready || (COOP.isHost && p.id === COOP.myId);
      h += '<p style="font-family:\'Crimson Text\',serif;color:#bbb;">' + (ok ? '✓ ' : '… ') + _u119Esc(p.name) + ' — ' + _u119Esc(p.cls) + ', Lv ' + p.level + ', ' + p.maxHp + ' HP' + (p.id === COOP.myId ? ' (you)' : '') + '</p>';
    });
    var me = coopMe();
    if (COOP.isHost) h += _coBtn('⚔ Start the Run', 'coopStart()', null, true);
    else if (!(me && me.ready)) h += _coBtn('✓ Ready', 'coopReady()', null, true);
    else h += '<p style="color:#666;font-style:italic;">Waiting for the host to start.</p>';
    h += _coBtn('Leave the Room', 'coopLeave()');
  } else if (COOP.stage === 'playing') {
    var f = COOP.foe;
    h += '<p style="font-family:Cinzel,serif;font-size:0.75rem;color:#ffdd44;">Floor ' + COOP.floor + ' of ' + COOP.floors + ' · ' +
      (f && f.boss ? 'BOSS' : 'Fight ' + COOP.fight + ' of ' + COOP.fightsPerFloor) + ' · ' + _u119Esc(COOP.dungeon) + '</p>';
    if (f) h += '<div tabindex="0" aria-label="' + _u119Esc(f.name + (f.boss ? ', the boss, phase ' + (f.phase || 1) + ' of 3' : '') + '. ' + f.hp + ' of ' + f.maxHp + ' HP.' + (f.stun > 0 ? ' Stunned.' : '')) + '" style="border:1px solid #5a2020;padding:10px;margin-bottom:10px;">' +
      '<div aria-hidden="true" style="font-family:Cinzel,serif;color:#e08080;">' + f.icon + ' ' + _u119Esc(f.name) + (f.boss ? ' — BOSS, phase ' + (f.phase || 1) : '') + (f.stun > 0 ? ' · stunned' : '') + '</div>' + _coBar(f.hp / f.maxHp, '#cc3333') +
      '<div aria-hidden="true" style="font-family:Cinzel,serif;font-size:0.7rem;color:#aaa;">' + f.hp + ' / ' + f.maxHp + ' HP</div></div>';
    h += _coH('THE PARTY');
    COOP.party.forEach(function(p) {
      var you = p.id === COOP.myId ? ', you' : '';
      h += '<div tabindex="0" aria-label="' + _u119Esc(p.name + you + '. ' + (p.hp > 0 ? p.hp + ' of ' + p.maxHp + ' HP, ' + (p.sp || 0) + ' SP, ' + p.potions + ' potions' + (p.shield > 0 ? ', ' + p.shield + ' shield' : '') + '.' : 'Down. A potion can revive them.')) + '">' +
        '<div aria-hidden="true" style="font-family:Cinzel,serif;font-size:0.75rem;color:' + (p.hp > 0 ? '#ddd' : '#885555') + ';">' + _u119Esc(p.name) + (you ? ' (you)' : '') + (p.hp > 0 ? '' : ' — DOWN') + '</div>' + _coBar(p.hp / p.maxHp, '#44cc44') + '</div>';
    });
    var m = coopMe();
    if (COOP.shop) {
      h += _coH('THE MERCHANT') + '<p style="font-style:italic;color:#aaa;">Potions are ' + COOP.potionPrice + ' gold each, paid with your own gold. They\'re added when the next floor starts.</p>' +
        _coBtn('🧪 Buy a Potion (' + COOP.potionPrice + 'g)', 'coopBuyPotion()', 'Buy a potion for ' + COOP.potionPrice + ' gold. You have ' + getGlobalGold() + ' gold' + (COOP.bought ? ', ' + COOP.bought + ' bought' : '') + '.', true);
    } else if (m && m.hp > 0) {
      // The buttons stay after you choose (disabled), so the screen reader
      // stays on the one you pressed instead of jumping away.
      var picked = COOP.myAction;
      var act = function(id, label, aria, primary, off) {
        var b = _coBtn(label, picked || off ? '' : "coopAct('" + id + "')", aria + (picked === id ? '. Chosen.' : ''), primary);
        return picked || off ? b.replace('<button ', '<button aria-disabled="true" ') : b;
      };
      h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:10px;">' +
        act('attack', '⚔ Attack', 'Attack, ' + m.atkLo + ' to ' + m.atkHi + ' damage', true) +
        act('heavy', '💥 Heavy', 'Heavy strike, much harder but can miss', true) +
        act('defend', '🛡 Defend', 'Defend: strike for half and take half') +
        act('potion', '🧪 Potion (' + m.potions + ')', 'Potion, heal 40 percent. ' + m.potions + ' left.', false, m.potions <= 0) + '</div>';
      var sks = _coList(m.skills);
      if (sks.length) {
        h += _coH('SKILLS · ' + (m.sp || 0) + ' of ' + (m.maxSp || 0) + ' SP');
        sks.forEach(function(sk) {
          h += act('skill:' + sk.id, sk.icon + ' ' + sk.name + ' (' + sk.sp + ' SP)', sk.name + ', ' + sk.sp + ' SP: ' + coopSkillSummary(sk), true, (m.sp || 0) < sk.sp);
        });
      }
      if (m.gunShots > 0 && m.gunHi > 0) h += act('gun', '🔫 ' + m.gunName + ' (' + m.shots + ')', 'Fire ' + m.gunName + ', ' + m.gunLo + ' to ' + m.gunHi + ' damage. ' + m.shots + ' shots left this fight.', true, m.shots <= 0);
      var friends = COOP.party.filter(function(p) { return p.id !== COOP.myId; });
      if (friends.length) {
        h += _coH('TEAM MOVES');
        friends.forEach(function(fr) {
          h += fr.hp > 0 ? act('protect:' + fr.id, '🛡 Protect ' + fr.name, 'Protect ' + fr.name + ': take the enemy\'s hit for them this round, at half damage')
                         : act('revive:' + fr.id, '💫 Revive ' + fr.name, 'Revive ' + fr.name + ' with one of your potions. ' + m.potions + ' left.', true, m.potions <= 0);
        });
      }
      if (picked) {
        var waiting = COOP.party.filter(function(p) { return p.hp > 0 && !COOP.actions[p.id]; }).map(function(p) { return p.name; });
        h += '<p style="font-style:italic;color:#888;margin-top:10px;">You chose ' + _u119Esc(coopActName(picked)) + '. Waiting for ' + (waiting.length ? _u119Esc(waiting.join(', ')) : 'the round') + '.</p>';
      }
    } else h += '<p style="font-style:italic;color:#888;">You\'re down. A friend can revive you with a potion, or you get back up on the next floor.</p>';
    h += _coH('WHAT HAPPENED') + '<div aria-label="Co-op log">' + COOP.log.slice(0, 12).map(function(l) {
      return '<div style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:#aaa;">' + _u119Esc(l) + '</div>'; }).join('') + '</div>';
    h += _coBtn('Leave the Run', 'coopLeave()');
  } else {
    var won = COOP.status === 'won';
    h += '<h3 style="font-family:\'Cinzel Decorative\',cursive;color:' + (won ? '#44ff88' : '#aa4444') + ';">' + (won ? '👑 VICTORY' : 'The run is over') + '</h3>' +
      (COOP.endText ? '<p style="color:#bbb;">' + _u119Esc(COOP.endText) + '</p>' : '') +
      _coBtn('🤝 Play Again', 'coopLeave()', null, true) + _coBtn('← Main Menu', "coopLeave();goTo('menu')");
  }
  // Nothing changed (most room updates are only heartbeats): don't redraw,
  // or the screen reader loses its place.
  if (h === COOP._lastHtml && el.innerHTML) return;
  COOP._lastHtml = h;
  // Keep focus where it was when the screen redraws.
  var focusedLabel = document.activeElement && document.activeElement.closest && document.activeElement.closest('#screen-coop') ? document.activeElement.getAttribute('aria-label') : null;
  var typed = (document.getElementById('coop-code') || {}).value;
  el.innerHTML = h + '</div>';
  if (typed) { var inp = document.getElementById('coop-code'); if (inp) inp.value = typed; }
  if (focusedLabel) {
    var again = Array.prototype.filter.call(el.querySelectorAll('[aria-label]'), function(n) { return n.getAttribute('aria-label') === focusedLabel; })[0];
    if (again) try { again.focus(); } catch (e) {}
  }
}
