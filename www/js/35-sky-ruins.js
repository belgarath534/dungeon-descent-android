// ════════════════════════════════════════════════════════════════════════════
// THE SKY RUINS — dungeon 10 (12.3). Unlocked by clearing The Shadow World.
// Four mechanics: stacking poison, killer plants, wind, and The Garden Grows.
// Boss: Queen Verdana, the Undying Bloom. Mini-boss elite: The Groundskeeper.
//
// Everything lives here. The rest of the game only names the dungeon in its
// lists (music, enemy pools, unlocks); the mechanics hook in by wrapping
// doFight / useSkill / enterRoom / advanceFloor / enemyDead / handleDeath /
// useItem / startCombat, so nothing changes outside the Sky Ruins.
// The apps (DungeonCore SkyRuins.swift) use the same numbers.
// ════════════════════════════════════════════════════════════════════════════

var SKY_DUNGEON = 'The Sky Ruins';

var SKY_ENEMIES = {
  t1: [
    { name:'Vine Creeper',  icon:'🌿', hp:30, atk:[6,12], gold:[4,7], desc:'A tangle of vines that moves like a snake. Its thorns can poison you.', poisonChance:0.25, poisonStacks:1 },
    { name:'Spore Drifter', icon:'🍄', hp:26, atk:[5,10], gold:[3,7], desc:'A floating mushroom. When it dies it bursts into a poison cloud.', burstPoison:1 },
    { name:'Ruin Gull',     icon:'🐦', hp:28, atk:[7,12], gold:[4,8], desc:'A sky gull grown huge on garden seeds. Fast and mean.' },
    { name:'Thorn Sprite',  icon:'🌱', hp:24, atk:[8,13], gold:[4,7], desc:'A little spirit made of thorns. Hitting it hurts you: 3 damage.', thorns:3 },
    { name:'Rootling',      icon:'🪴', hp:34, atk:[5,9],  gold:[3,6], desc:'A walking plant. It heals 4 HP every turn while its roots are in the soil.', rootHeal:4 },
  ],
  t2: [
    { name:'Strangler Fig',     icon:'🌳', hp:48, atk:[9,15],  gold:[6,10], desc:'A tree that wraps around its prey. Once a fight, its grip makes you lose a turn.', strangle:true },
    { name:'Blight Wasp Swarm', icon:'🐝', hp:40, atk:[10,16], gold:[6,10], desc:'A cloud of wasps fat on poisoned nectar. Every sting poisons you.', poisonChance:1, poisonStacks:1 },
    { name:'Gargoyle Moss',     icon:'🗿', hp:55, atk:[8,14],  gold:[7,11], desc:'A statue covered in stone-hard moss. Your first two hits do half damage.', gargoyle:2 },
    { name:'Pollen Wraith',     icon:'👻', hp:44, atk:[11,17], gold:[6,10], desc:'A ghost made of pollen. Its hits can put you to sleep, and you lose a turn.', sleepChance:0.2 },
    { name:'Sky Serpent',       icon:'🐍', hp:46, atk:[12,18], gold:[7,12], desc:'A winged snake. Its bite gives 2 poison stacks.', poisonChance:0.5, poisonStacks:2 },
  ],
  t3: [
    { name:'Verdant Knight',    icon:'🛡️', hp:75, atk:[13,21], gold:[10,17], desc:'A knight in armor made of bark. It blocks 6 damage a hit until you burn it or hit it hard (20 or more).', bark:6 },
    { name:'Corpse Bloom',      icon:'🌺', hp:68, atk:[12,20], gold:[10,16], desc:'A giant flower that feeds on poison. It heals from the poison damage you take.', corpseBloom:true, poisonChance:0.35, poisonStacks:1 },
    { name:'Stormcaller Harpy', icon:'🦅', hp:70, atk:[14,22], gold:[11,17], desc:'A harpy that rides the wind. When it dies, its last gust can knock you down.', harpyGust:0.3 },
    { name:'Hollow Gardener',   icon:'🧑‍🌾', hp:80, atk:[13,20], gold:[12,18], desc:'A gardener with nothing inside but roots. Every 3 turns it plants a Spore Pod that poisons you. Sometimes drops a Root Torch.', gardener:true },
  ],
  elites: [
    { name:'The Overgrown Colossus', icon:'🌲', hp:130, atk:[17,26], gold:[22,38], isElite:true, eliteAbility:'Regrows 10 HP a turn until you burn it.', regrow:10 },
    { name:'Mother of Spores',       icon:'🍄', hp:115, atk:[15,24], gold:[20,35], isElite:true, eliteAbility:'Every hit gives you 2 poison stacks.', poisonChance:1, poisonStacks:2 },
    { name:'The Windbroken King',    icon:'👑', hp:125, atk:[18,27], gold:[22,38], isElite:true, eliteAbility:'Every 3rd turn, a gust: you lose your next action.', kingGust:true },
    { name:'The Groundskeeper',      icon:'🪓', hp:140, atk:[15,23], gold:[25,40], isElite:true, eliteAbility:'A giant pruning hook. Every 3rd turn, a sweep that makes you bleed 4 a turn for 3 turns.', sweep:true },
  ],
  bossPool: [
    { name:'Queen Verdana', icon:'🌹', hp:260, atk:[18,28], gold:[60,90], isBoss:true, verdana:true,
      desc:'The Undying Bloom. She bred a flower that could not die, and it tore her kingdom out of the earth. She is still growing.',
      phaseMsg2:'"You\'ll make such lovely soil." A wall of thorns rises in front of her. Her attacks are halved until you cut through it.',
      phaseMsg3:'"I cannot die. I am the garden." Her roots dig into the stone. Unless they are burned, she regrows 20 HP a turn.' },
  ],
};

var SKY_FLOOR_NAMES = [
  '',
  'The Landing', 'The Hanging Gardens', 'The Aviary', 'The Rootways',
  'The Groundskeeper\'s Shed', 'The Poisoned Wells', 'The Bell Tower',
  'The Windward Edge', 'The Queen\'s Arboretum', 'The Throne of Thorns'
];

var SKY_FLOOR_LINES = [
  '',
  'Broken stairs, open sky, and a garden that hasn\'t been tended in a thousand years. It tends itself now.',
  'Planters hang from chains over nothing. Some of them are breathing.',
  'Empty cages, every door bent outward.',
  'Corridors carved by roots, not hands. They\'re still carving.',
  'Tools on every wall. One hook is missing. You hear it scraping somewhere ahead.',
  'The water is green and sweet-smelling. Don\'t.',
  'The bell is wrapped in vines. Every so often, they ring it.',
  'The floor ends. The wind doesn\'t.',
  'Every plant here leans the same way: toward the throne.',
  'She has been waiting. She has been growing.'
];

var SKY_ROOM_DESCS = [
  'A fountain overgrown with flowers the color of bruises.',
  'Wind howls through a hole where a wall used to be. Clouds drift past below.',
  'A collapsed bridge. Vines hold the halves together, barely.',
  'A kitchen garden where the herbs have grown taller than you.',
  'A sundial with no shadow. The light here comes from everywhere.',
  'A library with every book split open by roots growing through the pages.',
  'A greenhouse. The glass is intact. Something inside taps on it.',
  'Seed pods hang from the ceiling like lanterns. One sways without wind.',
  'Bones in a flowerbed, arranged neatly, like they were planted.',
  'Pollen drifts in the light like snow. You try not to breathe too deep.',
  'A royal portrait, the queen\'s face scratched out and replaced with a flower.',
  'A gardener\'s journal on a bench: "She says it can\'t die. She says that like it\'s good news."',
  'Statues of soldiers, each one hollowed out and full of moss.',
  'A rope bridge between two towers. It creaks in a rhythm, like breathing.',
  'A cracked observatory. The telescope points down.',
];

var SKY_LOOT = [
  { name:'Antidote',          icon:'🧴', type:'consumable', skyItem:'antidote',    desc:'Clears all poison. Health potions don\'t.' },
  { name:'Antidote',          icon:'🧴', type:'consumable', skyItem:'antidote',    desc:'Clears all poison. Health potions don\'t.' },
  { name:'Featherfall Charm', icon:'🪶', type:'relic',      skyItem:'featherfall', desc:'You take no damage from falls while you carry it.' },
  { name:'Verdant Blade',     icon:'🗡️', type:'weapon', atk:19, skyItem:'verdantBlade', desc:'A blade grown, not forged. Each hit gives the enemy a poison stack.' },
  { name:'Bark Mail',         icon:'🛡️', type:'armor',  def:7,  skyItem:'barkMail',     desc:'Armor of living bark. Poison can\'t touch you while you\'re above half HP.' },
  { name:'Sky Lily',          icon:'🌼', type:'potion', heal:40, desc:'A flower that grows only above the clouds. Restores 40 HP.' },
  { name:'Cloud Pearl',       icon:'⚪', type:'gem', gold:45, desc:'A pearl formed inside a cloud. Worth 45 gold.' },
  { name:'Gardener\'s Shears', icon:'✂️', type:'weapon', atk:16, desc:'Rusty but sharp. Made for cutting things that grow back.' },
];

var SKY_ROOT_TORCH = { name:'Root Torch', icon:'🔥', type:'consumable', skyItem:'rootTorch', desc:'Burns roots. Use it in a fight to stop a plant (or Queen Verdana) from regrowing.' };
var SKY_SEED = { name:'Seed of the Undying', icon:'🌰', type:'relic', skyItem:'seed', desc:'Queen Verdana\'s trophy. Once per run, it saves you from a killing blow at 1 HP.' };

var SKY_GARDEN_LINES = ['',
  'The vines are thicker now. The garden is growing.',
  'Roots crack the floor behind you. The garden is growing.',
  'The garden has noticed you.'];

// ── helpers ─────────────────────────────────────────────────────────────────
function skyActive() { return typeof DS !== 'undefined' && DS && DS.dungeon === SKY_DUNGEON; }

var _skyByName = null;
function skyTemplate(e) {
  if (!e || !e.name) return {};
  if (!_skyByName) {
    _skyByName = {};
    ['t1','t2','t3','elites','bossPool'].forEach(function(k){ SKY_ENEMIES[k].forEach(function(t){ _skyByName[t.name] = t; }); });
  }
  if (_skyByName[e.name]) return _skyByName[e.name];
  // Cursed rooms, echoes and events put words in front ("Cursed Vine Creeper").
  for (var n in _skyByName) { if (e.name.length > n.length && e.name.slice(-n.length - 1) === ' ' + n) return _skyByName[n]; }
  return {};
}
function skyHas(skyItem) { return !!(DS.inventory && DS.inventory.some(function(i){ return i && i.skyItem === skyItem; })); }
function skyIsRace(r) { return DS.race === r; }
function skyLog(msg, spoken) { addLog(msg); if (spoken) say(spoken); }
function skySfx(name) { try { sfx(name); } catch(e) {} }
function skyWeapon() { return DS.equippedWeapon || DS.weapon || null; }

// ── poison ──────────────────────────────────────────────────────────────────
function skyPoisonImmune() {
  var a = DS.equippedArmor;
  return a && a.skyItem === 'barkMail' && DS.hp > (DS.maxHp || 100) / 2;
}
function skyAddPoison(stacks, source) {
  if (!stacks) return;
  if (skyPoisonImmune()) { skyLog('🛡️ Your Bark Mail keeps the poison out.'); return; }
  var p = DS._skyPoison || { stacks:0, turns:0 };
  p.stacks = Math.min(5, p.stacks + stacks);
  p.turns = 4;
  DS._skyPoison = p;
  skySfx('sfx-poison-bubble');
  var per = skyPoisonPerTurn();
  skyLog('☠️ Poisoned' + (source ? ' by ' + source : '') + ': ' + p.stacks + ' stack' + (p.stacks > 1 ? 's' : '') + ', ' + per + ' damage a turn.',
    'Poisoned, ' + p.stacks + ' stack' + (p.stacks > 1 ? 's' : '') + ', ' + per + ' damage a turn.');
  skyUpdateStatus();
}
function skyPoisonPerTurn() {
  var p = DS._skyPoison; if (!p || !p.stacks) return 0;
  var d = p.stacks * 2;
  if (DS.cls === 'PlagueDoctor') d = Math.ceil(d / 2);
  return d;
}
function skyClearPoison() { DS._skyPoison = null; skyUpdateStatus(); }
function skyTickPoison(inBoss) {
  var p = DS._skyPoison; if (!p || !p.stacks) return 0;
  var dmg = skyPoisonPerTurn();
  if (!inBoss) dmg = Math.min(dmg, Math.max(0, DS.hp - 1));
  DS.hp = Math.max(0, DS.hp - dmg);
  p.turns--;
  skySfx('sfx-poison-tick');
  skyLog('☠️ Poison: ' + dmg + ' damage.' + (p.turns <= 0 ? ' The poison wears off.' : ''));
  if (p.turns <= 0) DS._skyPoison = null;
  updatePlayerBar(); skyUpdateStatus();
  return dmg;
}

function skyUpdateStatus() {
  var el = document.getElementById('dg-sky-status');
  if (!el) return;
  if (!skyActive()) { el.style.display = 'none'; return; }
  var parts = [], spoken = [];
  var p = DS._skyPoison;
  if (p && p.stacks) { parts.push('☠️ Poison ' + p.stacks + ' (' + skyPoisonPerTurn() + '/turn, ' + p.turns + ' left)'); spoken.push('Poison ' + p.stacks + ' stacks, ' + skyPoisonPerTurn() + ' damage a turn'); }
  var g = DS._skyGardenStage || 0;
  if (g) { parts.push('🌱 Garden ' + g + '/3'); spoken.push('Garden stage ' + g + ' of 3'); }
  if (DS._skyBleed && DS._skyBleed.turns > 0) { parts.push('🩸 Bleeding'); spoken.push('Bleeding'); }
  el.style.display = parts.length ? '' : 'none';
  el.textContent = parts.join(' · ');
  el.setAttribute('aria-label', spoken.join('. '));
}

// ── The Garden Grows ────────────────────────────────────────────────────────
function skyApplyStage(e) {
  if (!e || e.hp <= 0) return;
  var stage = DS._skyGardenStage || 0;
  while ((e._skyStage || 0) < stage) {
    e._skyStage = (e._skyStage || 0) + 1;
    e.maxHp = Math.round((e.maxHp || e.hp) * 1.1);
    e.hp = Math.round(e.hp * 1.1);
    if (e.atk) e.atk = [Math.round(e.atk[0] * 1.1), Math.round(e.atk[1] * 1.1)];
    if (e.phase1Hp) { e.phase1Hp = Math.round(e.phase1Hp * 1.1); e.phase2Hp = Math.round(e.phase2Hp * 1.1); }
  }
  try { updateEnemyBar(); } catch(x) {}
}
function skyGardenTurn() {
  DS._skyGardenTurns = (DS._skyGardenTurns || 0) + 1;
  if (DS._skyGardenTurns % 8 === 0 && (DS._skyGardenStage || 0) < 3) {
    DS._skyGardenStage = (DS._skyGardenStage || 0) + 1;
    skySfx('sfx-vine-creak');
    skyLog('🌱 ' + SKY_GARDEN_LINES[DS._skyGardenStage] + ' (Enemies on this floor: +' + (DS._skyGardenStage * 10) + '% HP and attack.)',
      SKY_GARDEN_LINES[DS._skyGardenStage]);
    skyUpdateStatus();
  }
}

// ── burning (fire skills, fire weapons, Root Torch, Flamethrower) ───────────
var SKY_FIRE_RE = /fire|flame|burn|blaze|inferno|ember|immolat|meteor|pyro|scorch|magma|lava|incinerat|torch/i;
function skyBurn(e, how) {
  if (!e || e._skyBurned) return;
  var t = skyTemplate(e);
  if (!(t.regrow || t.bark || t.verdana || t.rootHeal)) return;
  e._skyBurned = true;
  if (t.verdana && !e._skyPhase3) DS._skyRootsBurnedEarly = true;
  skyLog('🔥 ' + how + ' — ' + e.name + (t.bark ? '\'s bark armor burns away!' : '\'s roots are burned. It can\'t regrow.'),
    e.name + (t.bark ? '\'s bark burns away.' : '\'s roots are burned.'));
}

// ── losing a turn (strangle, sleep, ivy, the King's gust) ───────────────────
function skyFreeHit(e) {
  var dmg = rnd(e.atk[0], e.atk[1]);
  dmg = Math.max(1, dmg - Math.round((DS.def || 0) / 2));
  dmg = skyBeforeHit(e, dmg);
  DS.hp = Math.max(0, DS.hp - dmg);
  skySfx('sfx-hurt');
  addLog(e.name + t_(' attacks for ') + dmg + t_(' damage.'));
  skyAfterHit(e, dmg);
  updatePlayerBar();
  if (DS.hp <= 0) { setTimeout(function(){ handleDeath(); }, 600); }
  else { setCombatBtns(true); updateSkillButtons(); }
}
function t_(s) { return typeof t === 'function' ? t(s) : s; }

// Called by the enemy-attack code in doFight, just before your mana shield.
function skyBeforeHit(e, taken) {
  if (!skyActive() || !e) return taken;
  if (e._skyThornwall) taken = Math.round(taken / 2);
  // Goliath — Stone's Endurance: once a fight, a heavy hit is halved.
  if (skyIsRace('Goliath') && !DS._skyStoneUsed && taken >= (DS.maxHp || 100) * 0.15) {
    DS._skyStoneUsed = true;
    taken = Math.round(taken / 2);
    skyLog('🗿 Stone\'s Endurance — you take the blow like a mountain. Damage halved.', 'Stone\'s Endurance. Damage halved.');
  }
  return taken;
}
// Called right after the hit lands.
function skyAfterHit(e, taken) {
  if (!skyActive() || !e || taken <= 0 || DS.hp <= 0) return;
  var t = skyTemplate(e);
  if (t.verdana) skyAddPoison(1, 'her vines');
  else if (t.poisonChance && Math.random() < t.poisonChance) skyAddPoison(t.poisonStacks || 1, e.name);
  if (t.strangle && !e._skyStrangled && Math.random() < 0.35) {
    e._skyStrangled = true; DS._skyLoseTurn = 'strangle';
    skySfx('sfx-vine-creak');
    skyLog('🌳 The Strangler Fig wraps around you! You\'ll spend your next turn breaking free.', 'Strangled! You lose your next turn.');
  }
  if (t.sleepChance && !DS._skyLoseTurn && Math.random() < t.sleepChance) {
    DS._skyLoseTurn = 'sleep';
    skyLog('💤 The pollen gets in your eyes. You fall asleep for a moment.', 'Asleep! You lose your next turn.');
  }
}

// ── turn start / turn end around doFight and useSkill ───────────────────────
function skyTurnStart(e, action, skill) {
  skyApplyStage(e);
  var t = skyTemplate(e);
  e._skyTurns = (e._skyTurns || 0) + 1;
  if (!e.isBoss) skyGardenTurn(); // the garden doesn't grow during Verdana's fight
  skyApplyStage(e);
  // Poison, bleed
  skyTickPoison(!!e.isBoss);
  if (t.corpseBloom && DS._skyPoison) {
    var heal = skyPoisonPerTurn();
    e.hp = Math.min(e.maxHp, e.hp + heal);
    skyLog('🌺 The Corpse Bloom drinks your poison and heals ' + heal + ' HP.');
  }
  if (DS._skyBleed && DS._skyBleed.turns > 0) {
    var b = Math.min(4, Math.max(0, DS.hp - (e.isBoss ? 0 : 1)));
    DS.hp -= b; DS._skyBleed.turns--;
    skyLog('🩸 You bleed for ' + b + '.');
    updatePlayerBar(); skyUpdateStatus();
  }
  if (DS.hp <= 0) { setTimeout(function(){ handleDeath(); }, 600); return true; }
  // Burning: a fire skill or a fire weapon burns roots and bark.
  if (skill && (SKY_FIRE_RE.test(skill.name || '') || SKY_FIRE_RE.test(skill.effect || ''))) skyBurn(e, skill.name);
  var w = skyWeapon();
  if (!skill && (action === 'attack' || action === 'heavy') && w && (SKY_FIRE_RE.test(w.name || '') || w.element === 'fire')) skyBurn(e, 'Your ' + w.name);
  // Regrowth
  var regrow = t.rootHeal || (t.regrow && !e._skyBurned ? t.regrow : 0) || (t.verdana && e._skyPhase3 && !e._skyBurned ? 20 : 0);
  if (regrow && e.hp < e.maxHp) {
    e.hp = Math.min(e.maxHp, e.hp + regrow);
    skyLog((t.verdana ? '🌹 Verdana\'s roots drink from the stone. She regrows ' : '🌿 ' + e.name + ' regrows ') + regrow + ' HP.');
  }
  // Verdana: warn before phase 3
  if (t.verdana && !e._skyWarned && e.hp <= e.maxHp * 0.45 && !e._skyBurned) {
    e._skyWarned = true;
    skyLog('🌹 Her roots are reaching into the stone. Burn them (a fire skill, a fire weapon or a Root Torch) before she drops below a third of her health, or she will regrow 20 HP every turn.',
      'Warning. Burn Verdana\'s roots before she drops below a third of her health, or she will regrow every turn.');
  }
  // The Hollow Gardener plants a Spore Pod every 3 turns.
  if (t.gardener && e._skyTurns % 3 === 0) {
    skySfx('sfx-spore-burst');
    if (DS.cls === 'PlagueDoctor') skyLog('🍄 The Gardener plants a Spore Pod. Your bird mask filters the spores.');
    else { skyLog('🍄 The Gardener plants a Spore Pod. It bursts in your face.'); skyAddPoison(1, 'a Spore Pod'); }
  }
  // The Groundskeeper's sweep every 3rd turn.
  if (t.sweep && e._skyTurns % 3 === 0) {
    DS._skyBleed = { turns:3 };
    skyLog('🪓 The Groundskeeper sweeps the pruning hook low. You\'re bleeding: 4 a turn for 3 turns.', 'Sweep! You are bleeding.');
    skyUpdateStatus();
  }
  updateEnemyBar(); updatePlayerBar();
  // Lost turn?
  if (DS._skyLoseTurn && (action === 'attack' || action === 'heavy' || action === 'defend' || skill)) {
    var why = DS._skyLoseTurn; DS._skyLoseTurn = null;
    var msg = why === 'sleep' ? '💤 You shake off the sleep. Your turn is gone.'
            : why === 'gust' ? '🌪️ The gust knocks you off your feet. Your turn is gone.'
            : why === 'ivy' ? '🌿 You tear yourself free of the ivy. Your turn is gone.'
            : '🌳 You break free of the grip. Your turn is gone.';
    skyLog(msg, 'You lose this turn.');
    setCombatBtns(false);
    setTimeout(function(){ if (DS.inCombat && DS.enemy === e && e.hp > 0) skyFreeHit(e); }, 700);
    return true;
  }
  // The Windbroken King's gust every 3rd turn: you lose the next action.
  if (t.kingGust && e._skyTurns % 3 === 0) {
    skySfx('sfx-wind-gust');
    if (skyIsRace('Goliath')) skyLog('🌪️ The King calls a gust. You don\'t move. Mountain Born.');
    else { DS._skyLoseTurn = 'gust'; skyLog('🌪️ The Windbroken King calls a gust! You\'ll lose your next action.', 'A gust! You lose your next action.'); }
  }
  return false;
}

function skyTurnEnd(e, before) {
  if (!e || DS.enemy !== e) return;
  var t = skyTemplate(e);
  var dealt = before - e.hp;
  if (dealt > 0) {
    if (t.verdana && e._skyThornwall) {
      var back = Math.min(dealt, e.maxHp - e.hp); e.hp += back;
      e._skyThornwall = false;
      skyLog('🌹 You cut through the wall of thorns. Her attacks are back to full strength, but she\'s exposed.', 'You cut through the thorns.');
      dealt = 0;
    } else if (t.gargoyle && (e._skyGargoyleHits || 0) < t.gargoyle && e.hp > 0) {
      e._skyGargoyleHits = (e._skyGargoyleHits || 0) + 1;
      var g = Math.floor(dealt / 2); e.hp += g;
      skyLog('🗿 The moss is hard as stone. Half damage (' + (dealt - g) + ').');
    } else if (t.bark && !e._skyBurned && e.hp > 0) {
      if (dealt >= 20) { e._skyBurned = true; skyLog('🛡️ Your blow splits the Verdant Knight\'s bark armor!', 'The bark armor breaks.'); }
      else { var bk = Math.min(t.bark, dealt - 1); e.hp += bk; if (bk > 0) skyLog('🛡️ The bark armor blocks ' + bk + ' damage.'); }
    }
    if (t.thorns && DS.hp > 1) {
      var th = Math.min(t.thorns, DS.hp - 1); DS.hp -= th;
      skyLog('🌱 The thorns cut you for ' + th + '.');
    }
    var w = skyWeapon();
    if (w && w.skyItem === 'verdantBlade' && e.hp > 0) {
      e._skyPoison = Math.min(5, (e._skyPoison || 0) + 1);
    }
  }
  // Enemy poison (Verdant Blade, Plague Doctor) ticks at the end of your turn.
  if (e._skyPoison && e.hp > 0) {
    var pd = e._skyPoison * 3; e.hp = Math.max(0, e.hp - pd);
    skyLog('☠️ ' + e.name + ' takes ' + pd + ' poison damage.');
    if (e.hp <= 0 && DS.inCombat) setTimeout(function(){ if (DS.enemy === e) enemyDead(); }, 400);
  }
  // Verdana's phases (the game's boss phases are at two thirds and one third).
  if (t.verdana && e.hp > 0) {
    if (!e._skyPhase2 && e.hp <= e.maxHp * 0.66) {
      e._skyPhase2 = true; e._skyThornwall = true; skySfx('sfx-vine-creak');
    }
    if (!e._skyPhase3 && e.hp <= e.maxHp * 0.33) {
      e._skyPhase3 = true; skySfx('sfx-boss-bloom-roar');
    }
  }
  try { updateEnemyBar(); updatePlayerBar(); } catch(x) {}
}

function _skyWrapTurn(name, isSkill) {
  var orig = window[name];
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function(arg) {
    if (!skyActive() || !DS.inCombat || !DS.enemy || (typeof _multiCombatActive !== 'undefined' && _multiCombatActive)) return orig.apply(this, arguments);
    var e = DS.enemy, skill = null;
    if (isSkill) {
      var list = (typeof getUnlockedSkills === 'function') ? getUnlockedSkills() : [];
      skill = list[arg];
      if (!skill || DS.sp < skill.spCost) return orig.apply(this, arguments);
    } else if (arg !== 'attack' && arg !== 'heavy' && arg !== 'defend') {
      return orig.apply(this, arguments);
    }
    if (skyTurnStart(e, isSkill ? 'skill' : arg, skill)) return;
    var before = e.hp;
    var r = orig.apply(this, arguments);
    skyTurnEnd(e, before);
    return r;
  };
  wrapped._sky = true;
  window[name] = wrapped;
}

// ── combat start: scale for the garden, reset per-fight state ───────────────
function _skyWrapStartCombat() {
  var orig = window.startCombat;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function(isBoss) {
    if (skyActive()) { DS._skyStoneUsed = false; }
    var r = orig.apply(this, arguments);
    if (skyActive() && DS.enemy) {
      skyApplyStage(DS.enemy);
      var t = skyTemplate(DS.enemy);
      if (t.verdana) {
        setTimeout(function(){ skyLog('🌹 "Welcome to my garden." Queen Verdana rises from a throne of thorns.', 'Queen Verdana. Welcome to my garden.'); skySfx('sfx-boss-bloom-roar'); }, 900);
      } else if (t.name && DS.enemy.desc == null) {
        DS.enemy.desc = t.desc;
      }
      skyUpdateStatus();
    }
    return r;
  };
  wrapped._sky = true;
  window.startCombat = wrapped;
}

// ── kills ───────────────────────────────────────────────────────────────────
function _skyWrapEnemyDead() {
  var orig = window.enemyDead;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function() {
    var e = DS && DS.enemy;
    var r = orig.apply(this, arguments);
    if (skyActive() && e) skyOnKill(e);
    return r;
  };
  wrapped._sky = true;
  window.enemyDead = wrapped;
}
function skyOnKill(e) {
  var t = skyTemplate(e);
  if (t.burstPoison) {
    skySfx('sfx-spore-burst');
    if (DS.cls === 'PlagueDoctor') skyLog('🍄 The Spore Drifter bursts. Your bird mask filters the cloud.');
    else { skyLog('🍄 The Spore Drifter bursts into a poison cloud!'); skyAddPoison(t.burstPoison, 'the spore cloud'); }
  }
  if (t.harpyGust && Math.random() < t.harpyGust && !skyIsRace('Goliath')) {
    var d = Math.min(6, Math.max(0, DS.hp - 1));
    DS.hp -= d; updatePlayerBar();
    skySfx('sfx-wind-gust');
    skyLog('🦅 The harpy\'s last gust slams you into a wall. You take ' + d + ' damage.');
  }
  if (t.gardener && Math.random() < 0.35) skyGive(SKY_ROOT_TORCH, 'The Hollow Gardener drops a Root Torch.');
  if (t.verdana) {
    skyGive(SKY_SEED, 'A single seed falls from Verdana\'s last root: the Seed of the Undying.');
    skyAward('ach-undying-no-more');
    if (DS._skyRootsBurnedEarly) skyAward('ach-root-and-branch');
    if (!DS._skyAntidoteUsed) skyAward('ach-antidote-not-required');
    try { DDStore.setItem('dd_skyruins_cleared', '1'); } catch(x) {}
  }
  if (Math.random() < 0.08) skyGive(SKY_LOOT[0], 'You find an Antidote.');
}
function skyGive(item, msg) {
  if (!DS.inventory) DS.inventory = [];
  DS.inventory.push(JSON.parse(JSON.stringify(item)));
  skyLog(item.icon + ' ' + msg, msg);
  try { renderInv(); } catch(x) {}
}
function skyAward(id) { try { if (typeof awardAchievement === 'function') setTimeout(function(){ awardAchievement(id); }, 1500); } catch(x) {} }

// ── Seed of the Undying: survive one killing blow ───────────────────────────
function _skyWrapHandleDeath() {
  var orig = window.handleDeath;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function() {
    if (DS && DS.hp <= 0 && !DS._skySeedUsed && skyHas('seed')) {
      DS._skySeedUsed = true; DS.hp = 1;
      updatePlayerBar();
      skyLog('🌰 The Seed of the Undying cracks open. Roots hold you together. You stand at 1 HP.', 'The Seed of the Undying saves you. 1 HP.');
      if (DS.inCombat) { setCombatBtns(true); updateSkillButtons(); }
      return;
    }
    return orig.apply(this, arguments);
  };
  wrapped._sky = true;
  window.handleDeath = wrapped;
}

// ── items ───────────────────────────────────────────────────────────────────
function _skyWrapUseItem() {
  var orig = window.useItem;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function(i) {
    var item = DS.inventory && DS.inventory[i];
    if (item && item.skyItem === 'antidote') {
      if (!DS._skyPoison) { say('You aren\'t poisoned. Keep the Antidote for later.'); return; }
      DS.inventory.splice(i, 1); DS._skyAntidoteUsed = true; skyClearPoison();
      skyLog('🧴 You drink the Antidote. The poison is gone.', 'Antidote. Poison cleared.');
      renderInv(); saveProgress(); return;
    }
    if (item && item.skyItem === 'rootTorch') {
      if (!DS.inCombat || !DS.enemy) { say('Use the Root Torch in a fight, against something with roots.'); return; }
      var tt = skyTemplate(DS.enemy);
      if (!(tt.regrow || tt.bark || tt.verdana || tt.rootHeal)) { say('This enemy has no roots to burn.'); return; }
      DS.inventory.splice(i, 1);
      if (tt.rootHeal) { DS.enemy._skyBurned = true; }
      skyBurn(DS.enemy, 'The Root Torch');
      if (tt.rootHeal) skyLog('🔥 The Rootling\'s roots shrivel.');
      renderInv(); saveProgress(); return;
    }
    return orig.apply(this, arguments);
  };
  wrapped._sky = true;
  window.useItem = wrapped;
}

// ── rooms: plants and wind ──────────────────────────────────────────────────
function skyCalmRoom() {
  return skyActive() && !DS.inCombat && !DS.enemy && DS.hp > 0 && DS.floor < 10 &&
    !document.getElementById('dd-choice-modal') && !(typeof _eventPending === 'function' && _eventPending()) &&
    !(typeof _roomResolving !== 'undefined' && _roomResolving);
}
function skyHurt(n, why) {
  var d = Math.min(n, Math.max(0, DS.hp - 1));
  DS.hp -= d; updatePlayerBar();
  skyLog(why + ' You take ' + d + ' damage.');
}
function skyRoomHazard() {
  if (!skyCalmRoom()) return;
  var stage = DS._skyGardenStage || 0;
  var r = Math.random();
  if (r < 1 / 6) return skyWindRoom();
  if (r < 1 / 6 + 0.15 + stage * 0.05) return skyPlantRoom();
}
function skyWindRoom() {
  skySfx('sfx-wind-gust');
  var edge = DS.floor <= 8 && Math.random() < 0.18;
  if (edge) {
    var safe = skyIsRace('Aarakocra') || skyHas('featherfall');
    showChoiceModal('🌪️ The Edge', 'The floor crumbles under you and the wind pulls you over the edge. You fall to the floor below.' + (safe ? (skyIsRace('Aarakocra') ? ' You spread your wings and glide.' : ' Your Featherfall Charm slows you.') : ''), [
      { label: safe ? 'Glide down' : 'Fall', action: function(){ skyFall(safe); } }
    ]);
    return;
  }
  if (skyIsRace('Goliath')) { skyLog('🌪️ The wind tears at you, but you don\'t move. Mountain Born.', 'A gust. You don\'t move.'); return; }
  showChoiceModal('🌪️ A Gust', 'The wind tears at you! Brace yourself, or let it carry you ahead?', [
    { label: 'Brace (lose 5 HP)', action: function(){ skyHurt(5, '🌪️ You brace against the wind.'); } },
    { label: 'Let it carry you', action: function(){
        skySfx('sfx-wings-glide');
        skyLog('🌪️ The wind carries you past this room.', 'The wind carries you ahead.');
        setTimeout(function(){ try { DS.searched = false; enterRoom(); } catch(x) {} }, 400);
      } }
  ]);
}
function skyFall(safe) {
  skySfx('sfx-fall');
  DS._skyFalls = (DS._skyFalls || 0) + 1;
  if (DS._skyFalls >= 3) skyAward('ach-featherweight');
  if (!safe) skyHurt(Math.round((DS.maxHp || 100) * 0.10), '💥 You hit the ground hard.');
  else skyLog('🪶 You land softly on the floor below.');
  setTimeout(function(){ try { advanceFloor(); } catch(x) {} }, 600);
}
function skyPlantRoom() {
  var r = Math.random();
  if (r < 0.3) {
    skySfx('sfx-vine-creak');
    if (skyIsRace('Goliath') || DS.cls === 'Artificer') { skyLog('🌿 Strangling Ivy grabs at you. You rip it off the wall without breaking stride.', 'Strangling Ivy. You tear free.'); return; }
    DS._skyLoseTurn = 'ivy';
    showChoiceModal('🌿 Strangling Ivy', 'Ivy wraps around your legs. You\'ll spend your next action in a fight tearing free.', [
      { label: 'Pull free', action: function(){} }
    ]);
  } else if (r < 0.6) {
    skySfx('sfx-plant-hiss');
    showChoiceModal('🍄 Spore Pod', 'A fat spore pod swells on the wall. It\'s about to burst.', [
      { label: 'Hold your breath and move on (no search here)', action: function(){ DS.searched = true; try { updateSearchBadge(false); } catch(x) {} skyLog('🍄 You hold your breath and slip past.'); } },
      { label: 'Search anyway', action: function(){
          skySfx('sfx-spore-burst'); skySfx('sfx-spore-cough');
          if (DS.cls === 'PlagueDoctor') skyLog('🍄 The pod bursts. Your bird mask filters every spore.');
          else skyAddPoison(1, 'the spores');
        } }
    ]);
  } else if (r < 0.88) {
    skySfx('sfx-leaves-rustle');
    showChoiceModal('🌹 Thornwall', 'A wall of thorns blocks the room. Cut through it, or go around and leave the room unsearched?', [
      { label: 'Cut through (take 8 damage)', action: function(){ skyHurt(8, '🌹 You hack through the thorns.'); } },
      { label: 'Go around (no search here)', action: function(){ DS.searched = true; try { updateSearchBadge(false); } catch(x) {} skyLog('🌹 You go the long way around.'); } }
    ]);
  } else {
    skySfx('sfx-leaves-rustle');
    showChoiceModal('🌸 Siren Bloom', 'A huge flower with a sweet, heavy smell. Breathing it in would heal you… probably.', [
      { label: 'Breathe it in (+15 HP, 2 poison)', action: function(){
          DS.hp = Math.min(DS.maxHp, DS.hp + 15); updatePlayerBar();
          skyLog('🌸 Warmth floods through you. +15 HP.');
          skyAddPoison(2, 'the Siren Bloom');
        } },
      { label: 'Ignore it', action: function(){ skyLog('🌸 You leave the flower alone. It turns to watch you go.'); } }
    ]);
  }
}
function _skyWrapEnterRoom() {
  var orig = window.enterRoom;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function() {
    // Walking between rooms counts as a poison turn (it can't take you below 1 HP).
    if (skyActive() && !DS.inCombat && DS._skyPoison) skyTickPoison(false);
    var r = orig.apply(this, arguments);
    if (skyActive()) {
      skyUpdateStatus();
      setTimeout(skyRoomHazard, 1700);
    }
    return r;
  };
  wrapped._sky = true;
  window.enterRoom = wrapped;
}

// ── floors: reset the garden; reset the run on floor 1 ──────────────────────
function _skyWrapAdvanceFloor() {
  var orig = window.advanceFloor;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function() {
    var r = orig.apply(this, arguments);
    if (skyActive()) {
      DS._skyGardenTurns = 0; DS._skyGardenStage = 0; DS._skyLoseTurn = null;
      if (DS.floor === 1) { DS._skyPoison = null; DS._skyFalls = 0; DS._skySeedUsed = false; DS._skyAntidoteUsed = false; DS._skyRootsBurnedEarly = false; }
      // Nobody reaches Verdana without a way to burn her roots.
      if (DS.floor === 9 && !skyHas('rootTorch')) setTimeout(function(){ skyGive(SKY_ROOT_TORCH, 'A dead gardener by the stairs still clutches a Root Torch. You take it. You\'ll need it.'); }, 1500);
      var line = SKY_FLOOR_LINES[DS.floor];
      if (line) setTimeout(function(){ addLog('☁️ ' + SKY_FLOOR_NAMES[DS.floor] + ': ' + line); }, 600);
      skyUpdateStatus();
    }
    return r;
  };
  wrapped._sky = true;
  window.advanceFloor = wrapped;
}

// ── victory: achievements ───────────────────────────────────────────────────
function _skyWrapShowVictory() {
  var orig = window.showVictory;
  if (typeof orig !== 'function' || orig._sky) return;
  var wrapped = function() {
    if (skyActive()) {
      DS._skyPoison = null;
      try { addLog('🌹 Verdana\'s last root splits. The towers groan, and for the first time in a thousand years the ruins begin, slowly, to sink back toward the earth. Somewhere below, a single seed falls with them.'); } catch(x) {}
    }
    if (DS && DS.cls === 'PlagueDoctor') skyAward('ach-doctors-orders');
    if (DS && DS.cls === 'Artificer') skyAward('ach-some-assembly');
    return orig.apply(this, arguments);
  };
  wrapped._sky = true;
  window.showVictory = wrapped;
}

// ── unlock and the dungeon card ─────────────────────────────────────────────
function isSkyRuinsUnlocked() {
  if (DDStore.getItem('dd_dev_mode') === '1') return true;
  if (DDStore.getItem('dd_skyruins_unlocked') === '1') return true;
  var cleared = _jsonParseSafe(DDStore.getItem('dd_cleared_dungeons'), '[]');
  if (cleared.indexOf('The Shadow World') !== -1) { DDStore.setItem('dd_skyruins_unlocked', '1'); return true; }
  return false;
}
function handleSkyRuinsClick() {
  var card = document.getElementById('skyruins-dungeon-card');
  if (isSkyRuinsUnlocked()) {
    if (card) { card.classList.remove('locked'); card.disabled = false; card.setAttribute('aria-disabled', 'false'); pickDungeon(card); }
    return;
  }
  say('The Sky Ruins float far above the dungeons. Complete The Shadow World to find the way up.');
  showToast('☁️ Complete The Shadow World to unlock The Sky Ruins.', 'green');
}
function refreshSkyRuinsCard() {
  var card = document.getElementById('skyruins-dungeon-card');
  if (!card || !isSkyRuinsUnlocked()) return;
  card.classList.remove('locked');
  card.disabled = false;
  card.setAttribute('aria-disabled', 'false');
  card.setAttribute('aria-label', 'The Sky Ruins. Unlocked. Queen Verdana awaits.');
  var note = card.querySelector('.dungeon-unlock-note');
  if (note) note.style.display = 'none';
}

// ── install ─────────────────────────────────────────────────────────────────
(function skyInstall() {
  _skyWrapTurn('doFight', false);
  _skyWrapTurn('useSkill', true);
  _skyWrapStartCombat();
  _skyWrapEnemyDead();
  _skyWrapHandleDeath();
  _skyWrapUseItem();
  _skyWrapEnterRoom();
  _skyWrapAdvanceFloor();
  _skyWrapShowVictory();
  var origRefresh = window.refreshShadowWorldCard;
  if (typeof origRefresh === 'function' && !origRefresh._sky) {
    window.refreshShadowWorldCard = function() { var r = origRefresh.apply(this, arguments); refreshSkyRuinsCard(); return r; };
    window.refreshShadowWorldCard._sky = true;
  }
})();

// ── bestiary ────────────────────────────────────────────────────────────────
var SKY_BESTIARY_TYPES = { 'Ruin Gull':'beast', 'Blight Wasp Swarm':'beast', 'Sky Serpent':'beast', 'Stormcaller Harpy':'beast',
  'Pollen Wraith':'spirit', 'Thorn Sprite':'spirit', 'Hollow Gardener':'undead', 'Gargoyle Moss':'elemental' };
function skyBestiaryId(name) { return 'sky-' + name.toLowerCase().replace(/^the /, '').replace(/[^a-z]+/g, '-').replace(/-$/, ''); }
(function skyBestiary() {
  if (typeof BESTIARY_DATA === 'undefined') return;
  var tiers = { t1:'Sky 1-3', t2:'Sky 4-6', t3:'Sky 7-9', elites:'Sky — Elite', bossPool:'Sky Boss' };
  Object.keys(tiers).forEach(function(k) {
    SKY_ENEMIES[k].forEach(function(e) {
      var id = skyBestiaryId(e.name);
      if (BESTIARY_DATA.some(function(b){ return b.id === id; })) return;
      var entry = { id:id, name:e.name, icon:e.icon, tier:tiers[k], dungeon:'sky', desc: e.desc || e.eliteAbility };
      if (SKY_BESTIARY_TYPES[e.name]) entry.enemyType = SKY_BESTIARY_TYPES[e.name];
      if (e.isElite) entry.isElite = true;
      BESTIARY_DATA.push(entry);
    });
  });
  var orig = window.recordKill;
  if (typeof orig === 'function' && !orig._sky) {
    window.recordKill = function(name) {
      if (skyTemplate({ name:name }).name) {
        var id = skyBestiaryId(name);
        bestiaryKills[id] = (bestiaryKills[id] || 0) + 1;
        saveBestiary();
        try { checkBestiaryMilestone(id); } catch(x) {}
        return;
      }
      return orig.apply(this, arguments);
    };
    window.recordKill._sky = true;
  }
})();
