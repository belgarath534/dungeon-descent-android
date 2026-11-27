// ════════════════════════════════════════════════════════════════════════════
// 12.3 — new heroes and a new difficulty:
//   Classes: Plague Doctor ("The Cure Is Worse"), Artificer ("Built, Not Born")
//   Races:   Aarakocra (bird-folk), Goliath (giant-folk)
//   Impossible mode (above Insane)
// Added to the game's existing tables at load time; their mechanics hook in
// here and in js/35-sky-ruins.js (poison, falls, gusts, ivy, Stone's
// Endurance). The apps (DungeonCore) use the same numbers.
// ════════════════════════════════════════════════════════════════════════════

(function newHeroesData() {
  // Base stats (HP_MAP / ATK_MAP / DEF_MAP in js/04)
  if (typeof HP_MAP !== 'undefined') { HP_MAP.PlagueDoctor = 95; HP_MAP.Artificer = 100; }
  if (typeof ATK_MAP !== 'undefined') { ATK_MAP.PlagueDoctor = [7, 14]; ATK_MAP.Artificer = [6, 12]; }
  if (typeof DEF_MAP !== 'undefined') { DEF_MAP.PlagueDoctor = 2; DEF_MAP.Artificer = 3; }

  // Creation lists and labels
  if (typeof _CLASSES !== 'undefined') ['PlagueDoctor', 'Artificer'].forEach(function(c) { if (_CLASSES.indexOf(c) === -1) _CLASSES.push(c); });
  if (typeof _clsDescs !== 'undefined') { _clsDescs.PlagueDoctor = 'The Cure Is Worse'; _clsDescs.Artificer = 'Built, Not Born'; }
  if (typeof _RACES !== 'undefined') ['Aarakocra', 'Goliath'].forEach(function(r) { if (_RACES.indexOf(r) === -1) _RACES.push(r); });
  if (typeof _raceDescs !== 'undefined') { _raceDescs.Aarakocra = 'Glide · +8% dodge · −10% HP'; _raceDescs.Goliath = '+15% HP · Stone\'s Endurance'; }
  if (typeof _ccClasses !== 'undefined') ['PlagueDoctor', 'Artificer'].forEach(function(c) { if (_ccClasses.indexOf(c) === -1) _ccClasses.push(c); });
  if (typeof _ccRaces !== 'undefined') ['Aarakocra', 'Goliath'].forEach(function(r) { if (_ccRaces.indexOf(r) === -1) _ccRaces.push(r); });
  if (typeof _ccDiffs !== 'undefined' && _ccDiffs.indexOf('Impossible') === -1) _ccDiffs.push('Impossible');
  if (typeof CLASS_ICONS !== 'undefined') { CLASS_ICONS.PlagueDoctor = '🩺'; CLASS_ICONS.Artificer = '⚙️'; }
  if (typeof CLASS_ICONS_ORIG !== 'undefined') { CLASS_ICONS_ORIG.PlagueDoctor = '🩺'; CLASS_ICONS_ORIG.Artificer = '⚙️'; }

  // Subclasses (chosen at level 5)
  if (typeof SUBCLASSES !== 'undefined') {
    SUBCLASSES.PlagueDoctor = [
      { id:'carrier', name:'Carrier', icon:'🦠',
        desc:'Your attacks have a 25% chance to infect. Infected enemies take 5 damage per turn.',
        passive:'Patient Zero — the sickness spreads from your touch.',
        statBonus:{ intelligence:2, luck:1 },
        apply: function(){ DS._plagueBearerSub = true; addLog('🦠 Carrier path chosen. The sickness spreads.'); } },
      { id:'apothecary', name:'Apothecary', icon:'⚗️',
        desc:'Potions heal 50% more. A doctor knows the right dose.',
        passive:'Right Dose — every potion works harder.',
        statBonus:{ intelligence:1, vitality:2 },
        apply: function(){ DS.potionMult = (DS.potionMult || 1) * 1.5; addLog('⚗️ Apothecary path chosen. Every potion works harder.'); } },
    ];
    SUBCLASSES.Artificer = [
      { id:'engineer', name:'Engineer', icon:'🔧',
        desc:'+4 defense from reinforced plating. Built to last.',
        passive:'Reinforced — your gear takes the hits.',
        statBonus:{ vitality:2, strength:1 },
        apply: function(){ DS.defBonus = (DS.defBonus || 0) + 4; addLog('🔧 Engineer path chosen. Built to last.'); } },
      { id:'demolitionist', name:'Demolitionist', icon:'💣',
        desc:'+4 attack. Everything you build explodes eventually.',
        passive:'Blast Radius — your gadgets hit harder.',
        statBonus:{ strength:2, agility:1 },
        apply: function(){ DS.atkBonus = (DS.atkBonus || 0) + 4; addLog('💣 Demolitionist path chosen. Things go boom.'); } },
    ];
  }

  // Class traits (Class Traits setting)
  if (typeof CLASS_TRAITS !== 'undefined') {
    CLASS_TRAITS.PlagueDoctor = { name:'Bird Mask', desc:'Poison does half damage to you and spore clouds can\'t reach you. Enemies you\'ve poisoned deal 15% less damage.' };
    CLASS_TRAITS.Artificer = { name:'Tinkerer', desc:'Strangling Ivy can\'t hold you. Your Flamethrower burns roots, bark and regrowth. Turrets last a turn longer.' };
  }

  // Skills (CLASS_SKILLS and SKILL_SPECS in js/08). 15 each, unlocking with level.
  if (typeof CLASS_SKILLS !== 'undefined') {
    CLASS_SKILLS.PlagueDoctor = [
      { name:'Toxic Flask',    icon:'🧪', desc:'Throw a flask — poisons the enemy for 6 damage a turn for 3 turns.',       spCost:8,  tier:'common',    effect:'pd-toxic-flask' },
      { name:'Remedy',         icon:'💊', desc:'Clear your poison and heal 20 HP.',                                          spCost:10, tier:'common',    effect:'pd-remedy' },
      { name:'Leeches',        icon:'🪱', desc:'Attach leeches — 1.2x damage, you heal half of it.',                         spCost:12, tier:'common',    effect:'pd-leeches' },
      { name:'Bone Saw',       icon:'🪚', desc:'A brutal cut — 1.4x damage.',                                                spCost:7,  tier:'common',    effect:'pd-bone-saw' },
      { name:'Smelling Salts', icon:'🧂', desc:'Wake up sharp — restore 12 SP and heal 8 HP.',                               spCost:4,  tier:'common',    effect:'pd-salts' },
      { name:'Miasma',         icon:'🌫️', desc:'A cloud of sickness — poisons the enemy for 10 damage a turn for 4 turns.', spCost:16, tier:'rare',      effect:'pd-miasma' },
      { name:'Quarantine',     icon:'🚧', desc:'Seal the enemy in — its next 2 attacks are halved.',                         spCost:12, tier:'rare',      effect:'pd-quarantine' },
      { name:'Fever Dream',    icon:'🤒', desc:'Burning fever — 1.3x damage, 40% chance to stun.',                           spCost:13, tier:'rare',      effect:'pd-fever' },
      { name:'Bloodletting',   icon:'🩸', desc:'Let the bad blood out — 2.2x damage, costs you 10 HP.',                       spCost:12, tier:'rare',      effect:'pd-bloodletting' },
      { name:'Plague Mask',    icon:'🎭', desc:'Breathe easy — take 35% less damage for 3 turns.',                           spCost:12, tier:'rare',      effect:'pd-mask' },
      { name:'Black Death',    icon:'☠️', desc:'The great sickness — 2.5x damage and poison for 14 a turn for 3 turns.',    spCost:22, tier:'legendary', effect:'pd-black-death' },
      { name:'Pandemic',       icon:'🦠', desc:'It spreads — 3x damage, the enemy takes 40% more damage for 3 turns.',       spCost:22, tier:'legendary', effect:'pd-pandemic' },
      { name:'The Cure',       icon:'⚕️', desc:'The cure is worse — heal 60% of your max HP. Once per run.',              spCost:20, tier:'legendary', effect:'pd-the-cure' },
      { name:'Pestilence',     icon:'🐀', desc:'A plague of rats — deals a third of the enemy\'s current HP.',               spCost:22, tier:'legendary', effect:'pd-pestilence' },
      { name:'Last Rites',     icon:'⚰️', desc:'Read the last rites — kills any non-boss below 25% HP outright.',            spCost:18, tier:'legendary', effect:'pd-last-rites' },
    ];
    CLASS_SKILLS.Artificer = [
      { name:'Deploy Turret',  icon:'🔫', desc:'A turret that shoots for 7 damage every turn for 3 turns.',                  spCost:10, tier:'common',    effect:'ar-turret' },
      { name:'Shock Gauntlet', icon:'⚡', desc:'1.3x damage, 30% chance to stun.',                                           spCost:8,  tier:'common',    effect:'ar-shock' },
      { name:'Repair Kit',     icon:'🧰', desc:'Patch yourself up — heal 18 HP.',                                            spCost:10, tier:'common',    effect:'ar-repair' },
      { name:'Rivet Gun',      icon:'🔩', desc:'Three rivets — 0.6x damage, three hits.',                                    spCost:9,  tier:'common',    effect:'ar-rivets' },
      { name:'Steam Vent',     icon:'♨️', desc:'Scalding steam — the enemy\'s next 2 attacks are 30% weaker.',               spCost:8,  tier:'common',    effect:'ar-steam' },
      { name:'Flamethrower',   icon:'🔥', desc:'14–20 fire damage and burning for 3 turns. Burns roots, bark and regrowth.', spCost:14, tier:'rare',      effect:'ar-flamethrower' },
      { name:'Clockwork Shield', icon:'⚙️', desc:'A spinning shield absorbs up to 35 damage.',                               spCost:12, tier:'rare',      effect:'ar-shield' },
      { name:'Tesla Coil',     icon:'🌩️', desc:'2x damage and stuns for a turn.',                                            spCost:15, tier:'rare',      effect:'ar-tesla' },
      { name:'Grappling Hook', icon:'🪝', desc:'Pull the enemy off balance — its next attack will probably miss.',           spCost:10, tier:'rare',      effect:'ar-grapple' },
      { name:'Iron Plating',   icon:'🛡️', desc:'+8 defense for 3 turns.',                                                    spCost:12, tier:'rare',      effect:'ar-plating' },
      { name:'Overclock',      icon:'🏎️', desc:'Your next 2 attacks deal double.',                           spCost:20, tier:'legendary', effect:'ar-overclock' },
      { name:'Siege Cannon',   icon:'💣', desc:'4x damage. Costs you 15 HP from the recoil.',                                spCost:22, tier:'legendary', effect:'ar-cannon' },
      { name:'Automaton',      icon:'🤖', desc:'A clockwork soldier fights beside you — 15 damage a turn for 4 turns.',      spCost:22, tier:'legendary', effect:'ar-automaton' },
      { name:'Masterwork',     icon:'🏆', desc:'All your skills deal 40% more for the rest of the run.',                     spCost:20, tier:'legendary', effect:'ar-masterwork' },
      { name:'Doomsday Device', icon:'☢️', desc:'5x damage. Once per run.',                                                  spCost:25, tier:'legendary', effect:'ar-doomsday' },
    ];
  }
  if (typeof SKILL_SPECS !== 'undefined') {
    var S = {
      'PlagueDoctor/pd-toxic-flask': {"dmg":0.5,"hits":1,"dot":[6,3,1]},
      'PlagueDoctor/pd-remedy':      {"free":1,"heal":20},
      'PlagueDoctor/pd-leeches':     {"dmg":1.2,"hits":1,"lifesteal":0.5},
      'PlagueDoctor/pd-bone-saw':    {"dmg":1.4,"hits":1},
      'PlagueDoctor/pd-salts':       {"free":1,"heal":8,"sp":12},
      'PlagueDoctor/pd-miasma':      {"dmg":0.5,"hits":1,"dot":[10,4,1]},
      'PlagueDoctor/pd-quarantine':  {"soften":[0.5,2]},
      'PlagueDoctor/pd-fever':       {"dmg":1.3,"hits":1,"stun":[1,0.4]},
      'PlagueDoctor/pd-bloodletting':{"dmg":2.2,"hits":1,"selfDmg":10},
      'PlagueDoctor/pd-mask':        {"reduce":[0.35,3]},
      'PlagueDoctor/pd-black-death': {"dmg":2.5,"hits":1,"dot":[14,3,1]},
      'PlagueDoctor/pd-pandemic':    {"dmg":3.0,"hits":1,"vuln":[0.4,3,1]},
      'PlagueDoctor/pd-the-cure':    {"free":1,"healPct":0.6,"once":1},
      'PlagueDoctor/pd-pestilence':  {"pctHp":0.34},
      'PlagueDoctor/pd-last-rites':  {"dmg":1.0,"hits":1,"killBelow":0.25},
      'Artificer/ar-turret':         {"dmg":0.5,"hits":1,"dot":[7,3,1]},
      'Artificer/ar-shock':          {"dmg":1.3,"hits":1,"stun":[1,0.3]},
      'Artificer/ar-repair':         {"free":1,"heal":18},
      'Artificer/ar-rivets':         {"dmg":0.6,"hits":3},
      'Artificer/ar-steam':          {"soften":[0.7,2]},
      'Artificer/ar-flamethrower':   {"dmg":1.6,"hits":1,"dot":[6,3,1]},
      'Artificer/ar-shield':         {"free":1,"shield":35},
      'Artificer/ar-tesla':          {"dmg":2.0,"hits":1,"stun":[1,1]},
      'Artificer/ar-grapple':        {"free":1,"enemyMiss":0.7},
      'Artificer/ar-plating':        {"buff":[0,8,3]},
      'Artificer/ar-overclock':      {"free":1,"empower":[2.0,2]},
      'Artificer/ar-cannon':         {"dmg":4.0,"hits":1,"selfDmg":15},
      'Artificer/ar-automaton':      {"dmg":0.6,"hits":1,"dot":[15,4,1]},
      'Artificer/ar-masterwork':     {"free":1,"mastery":[0.4,0,1]},
      'Artificer/ar-doomsday':       {"dmg":5.0,"hits":1,"once":1},
    };
    Object.keys(S).forEach(function(k) { SKILL_SPECS[k] = S[k]; });
  }
})();

// ── mechanics ───────────────────────────────────────────────────────────────

// Remedy also clears the Sky Ruins' poison; the Turret lasts a turn longer
// for the Artificer's trait (handled by the dot length above already).
(function newHeroesSkills() {
  var orig = window.useSkill;
  if (typeof orig !== 'function' || orig._heroes) return;
  window.useSkill = function(idx) {
    try {
      var list = getUnlockedSkills(); var s = list[idx];
      if (s && s.effect === 'pd-remedy' && DS && DS._skyPoison && DS.sp >= s.spCost) {
        DS._skyPoison = null;
        if (typeof skyUpdateStatus === 'function') skyUpdateStatus();
        addLog('💊 Remedy — the poison is gone.');
      }
    } catch (e) {}
    return orig.apply(this, arguments);
  };
  window.useSkill._heroes = true;
  window.useSkill._sky = orig._sky; // keep the Sky Ruins wrapper's mark
})();

// Aarakocra: +8% dodge (Hollow Bones). Plague Doctor's trait: enemies it has
// poisoned (damage over time on them) hit 15% softer. Runs from the same
// enemy-hit hook as the Sky Ruins (skyBeforeHit).
function heroesBeforeHit(e, taken) {
  if (!DS || !e || taken <= 0) return taken;
  if (DS.race === 'Aarakocra' && Math.random() < 0.08) {
    addLog('🪶 You flap out of the way — dodged!'); say('Dodged!');
    return 0;
  }
  if (DS.cls === 'PlagueDoctor' && ACCESS && ACCESS.classTraits && (e.dotTurns > 0 || e.poisonTurns > 0 || e._skyPoison)) {
    taken = Math.round(taken * 0.85);
  }
  return taken;
}
(function chainBeforeHit() {
  var orig = window.skyBeforeHit;
  window.skyBeforeHit = function(e, taken) {
    taken = heroesBeforeHit(e, taken);
    return typeof orig === 'function' ? orig(e, taken) : taken;
  };
})();

// ── Impossible mode ─────────────────────────────────────────────────────────
// +80% enemy HP (attack +60% is in the enemy-damage multiplier in js/05),
// double gold and XP, no Seed of the Undying, elites twice as often (js/04),
// potions heal half (js/05), one life (js/04).
(function impossibleMode() {
  var origStart = window.startCombat;
  if (typeof origStart === 'function' && !origStart._impossible) {
    var w = function() {
      var r = origStart.apply(this, arguments);
      if (DS && DS.diff === 'Impossible' && DS.enemy && !DS.enemy._impScaled) {
        DS.enemy._impScaled = true;
        DS.enemy.maxHp = Math.round((DS.enemy.maxHp || DS.enemy.hp) * 1.8);
        DS.enemy.hp = Math.round(DS.enemy.hp * 1.8);
        if (DS.enemy.phase1Hp) { DS.enemy.phase1Hp = Math.round(DS.enemy.phase1Hp * 1.8); DS.enemy.phase2Hp = Math.round(DS.enemy.phase2Hp * 1.8); }
        if (DS.enemy.isBoss) setTimeout(function(){ addLog('💀 Impossible — this boss has never lost.'); }, 1200);
        try { updateEnemyBar(); } catch (x) {}
      }
      return r;
    };
    w._impossible = true; w._sky = origStart._sky;
    window.startCombat = w;
  }
  var origDead = window.enemyDead;
  if (typeof origDead === 'function' && !origDead._impossible) {
    var d = function() {
      var before = DS ? DS.gold : 0;
      var r = origDead.apply(this, arguments);
      if (DS && DS.diff === 'Impossible' && DS.gold > before) {
        var extra = DS.gold - before;
        DS.gold += extra; try { addGlobalGold(extra); } catch (x) {}
        addLog('💀 Impossible — double gold: +' + extra + '.');
        try { updateTopBar(); } catch (x) {}
      }
      return r;
    };
    d._impossible = true; d._sky = origDead._sky;
    window.enemyDead = d;
  }
  var origXP = window.gainXP;
  if (typeof origXP === 'function' && !origXP._impossible) {
    var x = function(amount) {
      if (DS && DS.diff === 'Impossible' && amount > 0) amount = amount * 2;
      return origXP.call(this, amount);
    };
    x._impossible = true;
    window.gainXP = x;
  }
  // No revives on Impossible: the Seed of the Undying does nothing.
  var origDeath = window.handleDeath;
  if (typeof origDeath === 'function' && !origDeath._impossible) {
    var h = function() {
      if (DS && DS.diff === 'Impossible') DS._skySeedUsed = true;
      return origDeath.apply(this, arguments);
    };
    h._impossible = true; h._sky = origDeath._sky;
    window.handleDeath = h;
  }
  // Victories: The Impossible, Beyond Impossible.
  var origVictory = window.showVictory;
  if (typeof origVictory === 'function' && !origVictory._impossible) {
    var v = function() {
      if (DS && DS.diff === 'Impossible') {
        try { setTimeout(function(){ awardAchievement('ach-the-impossible'); }, 1500); } catch (x) {}
        if (DS.dungeon === 'The Sky Ruins') try { setTimeout(function(){ awardAchievement('ach-beyond-impossible'); }, 2500); } catch (x) {}
      }
      return origVictory.apply(this, arguments);
    };
    v._impossible = true;
    window.showVictory = v;
  }
})();
