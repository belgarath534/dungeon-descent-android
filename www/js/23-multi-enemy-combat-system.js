//═════════════════
// MULTI-ENEMY COMBAT SYSTEM
//═════════════════
var _multiEnemies = []; // array of enemy objects during ambush
var _pendingAction = null; // action waiting for target selection
var _multiCombatActive = false;

function startMultiCombat(enemies) {
  _multiEnemies = enemies.map(function(e) { return Object.assign({}, e, { hp: e.hp || e.maxHp }); });
  _multiCombatActive = true;
  DS.inCombat = true;
  DS.defending = false;

  // Set DS.enemy to first enemy for compatibility
  DS.enemy = _multiEnemies[0];

  playTrack(battleTrack());
  showDgPanels(false, true, false);

  // Hide single enemy, show multi
  document.getElementById('dg-single-enemy').style.display = 'none';
  document.getElementById('dg-multi-enemies').style.display = 'flex';
  document.getElementById('dg-combat-log').innerHTML = '';
  setCombatBtns(true);

  renderMultiEnemies();
  applySpiritOnCombatStart();

  var names = _multiEnemies.map(function(e){ return e.name; }).join(', ');
  document.getElementById('dg-combat-title').textContent = '⚔ ' + t('Ambush!');
  addLog('⚡ AMBUSH! ' + _multiEnemies.length + ' enemies attack at once: ' + names + '!');
  say('Ambush! ' + _multiEnemies.length + ' enemies. ' + names + '. Select your action then choose your target.');
  setTimeout(function(){ document.getElementById('cbtn-attack').focus(); }, 100);
}

function renderMultiEnemies() {
  var container = document.getElementById('dg-multi-enemies');
  if (!container) return;
  container.innerHTML = '';
  _multiEnemies.forEach(function(e, idx) {
    var pct = Math.round((e.hp / e.maxHp) * 100);
    var row = document.createElement('div');
    row.style.cssText = 'background:#0a0500;border:1px solid #331100;padding:8px 10px;border-radius:2px;';
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label', e.name + '. HP ' + e.hp + ' of ' + e.maxHp);
    row.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
      '<span style="font-family:Cinzel,serif;font-size:0.75rem;color:#ff8844;">' + (e.icon||'👹') + ' ' + e.name + '</span>' +
      '<span style="font-family:Cinzel,serif;font-size:0.65rem;color:#888;">' + e.hp + '/' + e.maxHp + ' HP</span>' +
      '</div>' +
      '<div style="background:#1a0000;height:6px;margin-top:4px;border-radius:2px;">' +
      '<div style="background:#cc3300;height:100%;width:' + pct + '%;border-radius:2px;transition:width 0.3s;"></div>' +
      '</div>';
    container.appendChild(row);
  });
}

function doFightMulti(action) {
  if (!_multiCombatActive) return;

  // Defend and potion do not need targets
  if (action === 'defend') {
    DS.defending = true;
    addLog('🛡 You brace yourself against multiple attackers.');
    say('Defending.');
    multiEnemiesTakeTurns();
    return;
  }
  if (action === 'potion') {
    vibe(VIBE.potion);
    var pots = DS.inventory.filter(function(i){ return i.type === 'potion'; });
    if (!pots.length) { say('No potions.'); return; }
    var pot = pots[0];
    var heal = pot.heal || 40;
    DS.hp = Math.min(DS.maxHp, DS.hp + heal);
    DS.inventory.splice(DS.inventory.indexOf(pot), 1);
    updatePlayerBar();
    addLog('🧪 Potion used. Healed ' + heal + ' HP.');
    say('Healed ' + heal + ' HP.');
    multiEnemiesTakeTurns();
    return;
  }
  // Track last action for Reflection mechanic
  DS._lastCombatAction = action;

  if (action === 'purge') {
    purgeCorruption();
    setCombatBtns(true); updateSkillButtons();
    return;
  }

  if (action === 'flee') {
    vibe(VIBE.flee);
    addLog('You attempt to flee...');
    // BUGFIX: Rune of Speed ("flee always succeeds this run") and Swift Potion were
    // never checked here, so both were silently ignored during multi-enemy combat.
    var _multiSwiftGuarantee = (DS._swiftPotion && DS._swiftPotion > 0) || DS._runeSpeed;
    if (DS._swiftPotion && DS._swiftPotion > 0) DS._swiftPotion--;
    if (_multiSwiftGuarantee || Math.random() < 0.4) {
      vibe(VIBE.fleeSuccess);
      endMultiCombat(false, true);
    } else {
      addLog('Escape failed! The enemies block your path.');
      say('Escape failed.');
      multiEnemiesTakeTurns();
    }
    return;
  }

  if (action === 'spell') {
    // Point DS.enemy at first living enemy for spell targeting
    var firstAlive = _multiEnemies.find(function(e){ return e.hp > 0; });
    if (firstAlive) DS.enemy = firstAlive;
    openCombatSpells();
    return;
  }

  // Attack/heavy/skill — need target selection
  _pendingAction = action;
  showTargetSelector();
}

var _selectingTarget = false;

function showTargetSelector() {
  var sel = document.getElementById('dg-target-select');
  var btnContainer = document.getElementById('dg-target-btns');
  if (!sel || !btnContainer) {
    // UI element missing — recover by re-enabling buttons instead of freezing
    console.warn('[DD] Target selector UI missing — recovering');
    setCombatBtns(true);
    _pendingAction = null;
    return;
  }

  sel.style.display = '';
  btnContainer.innerHTML = '';
  setCombatBtns(false);
  _selectingTarget = true;

  // Only show living enemies — filter out any at 0 HP
  var aliveEnemies = _multiEnemies.filter(function(e){ return e.hp > 0; });
  if (aliveEnemies.length === 0) {
    hideTargetSelector();
    setTimeout(function(){ endMultiCombat(true, false); }, 300);
    return;
  }

  aliveEnemies.forEach(function(e) {
    var idx = _multiEnemies.indexOf(e);
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:10px 14px;background:#1a0800;border:1px solid #ff6622;color:#ff8844;font-family:Cinzel,serif;font-size:0.75rem;cursor:pointer;text-align:left;';
    btn.textContent = (e.icon||'👹') + ' ' + e.name + ' — ' + e.hp + ' HP';
    btn.setAttribute('aria-label', 'Target ' + e.name + ' with ' + e.hp + ' HP');
    btn.onclick = function() { executeMultiAttack(idx); };
    btnContainer.appendChild(btn);
  });

  // Focus first target
  setTimeout(function(){ var first = btnContainer.querySelector('button'); if (first) first.focus(); }, 50);
  say('Choose your target. ' + aliveEnemies.map(function(e){ return e.name + ' ' + e.hp + ' HP'; }).join(', '));
}

function hideTargetSelector() {
  var sel = document.getElementById('dg-target-select');
  if (sel) sel.style.display = 'none';
  _selectingTarget = false;
  setCombatBtns(true);
}

function executeMultiAttack(targetIdx) {
  hideTargetSelector();
  var e = _multiEnemies[targetIdx];
  if (!e || e.hp <= 0) { say('That enemy is already defeated.'); setCombatBtns(true); return; }

  setCombatBtns(false);
  var action = _pendingAction;
  _pendingAction = null;

  // Handle skill actions
  if (action && action.indexOf('skill-') === 0) {
    var skillIdx = parseInt(action.replace('skill-',''));
    DS.enemy = e; // point DS.enemy at target
    useSkill(skillIdx);
    return;
  }

  // Calculate damage — synced with single combat buffs
  var baseAtk = rnd(DS.atk[0] + (DS.atkBonus||0), DS.atk[1] + (DS.atkBonus||0));

  // Event ATK boost
  var _evBns = getEventBonuses();
  if (_evBns && _evBns.atkBoost) baseAtk = Math.round(baseAtk * (1 + _evBns.atkBoost));
  // Weather ATK
  var _dwMult = getDungeonWeatherPlayerAtkMult();
  if (_dwMult !== 1) baseAtk = Math.round(baseAtk * _dwMult);
  // Class passives
  if (DS._ironFist && !DS.equippedWeapon) baseAtk = Math.round(baseAtk * 1.20);
  if (DS._avenger && DS.hp <= DS.maxHp * 0.25) baseAtk = Math.round(baseAtk * 2.0);
  if (DS._wildfire && Math.random() < 0.25) { baseAtk = Math.round(baseAtk * 2.0); addLog('🔥 Wild Surge!'); }
  if (DS._berserkerSub) { baseAtk += Math.floor((DS.maxHp - DS.hp) / 10); }
  if (DS._spellblade) baseAtk += Math.floor((DS.sp||0) / 10);
  if (DS._battleHymn && DS._battleHymnTurns > 0) { baseAtk += 5; DS._battleHymnTurns--; }
  if (DS._berserkerMark && DS.hp <= DS.maxHp * 0.5) baseAtk += 3;
  if (DS._huntersMarkReady) { baseAtk = Math.round(baseAtk * 1.5); DS._huntersMarkReady = false; addLog("🏹 Hunter's Mark!"); }
  if (DS._nightBlessing && isNightTime()) baseAtk += 5;
  if (DS.dailyChallenge === 'glassCannon') baseAtk = Math.round(baseAtk * 2.0);
  if (DS.zenStrike && DS.zenStrike > 0) { baseAtk = Math.round(baseAtk * 1.5); DS.zenStrike--; }
  if (DS.transcendence && DS.transcendence > 0) { baseAtk = Math.round(baseAtk * 2); DS.transcendence--; }
  if (DS.sacredBlade && DS.sacredBlade > 0) { baseAtk = Math.round(baseAtk * 2); DS.sacredBlade--; }
  if (DS.battlecryActive && DS.battlecryActive > 0) { baseAtk = Math.round(baseAtk * 2); DS.battlecryActive--; }

  var playerDmg = baseAtk;
  var missed = false;

  if (action === 'heavy') {
    if (Math.random() < 0.25) { missed = true; addLog('💨 Heavy strike missed ' + e.name + '!'); say('Missed!'); }
    else { playerDmg = Math.round(baseAtk * 1.6); }
  }

  var crit = !missed && Math.random() < 0.12;
  if (crit) playerDmg = Math.round(playerDmg * (DS._gladiatorCrit ? 2.5 : 1.8));

  if (!missed) {
    // Apply mechanic flags
    playerDmg = applyEnemyMechanicsOnHit(e, playerDmg);
    e.hp = Math.max(0, e.hp - playerDmg);

    var hitMsg = (crit ? '💥 CRIT! ' : '') + 'You hit ' + e.name + ' for ' + playerDmg + ' damage. (' + e.hp + ' HP left)';
    addLog(hitMsg);
    say(hitMsg);

    // Spirit attack
    var spiritDmg = applySpiritOnAttack(playerDmg, e.name);
    if (spiritDmg > 0) { e.hp = Math.max(0, e.hp - spiritDmg); }
  }

  // Check if this enemy died
  if (e.hp <= 0) {
    addLog('☠ ' + e.name + ' defeated!');
    say(e.name + ' defeated!');
    var gDrop = resolveGold(e.gold);
    if (DS._luckPotionKills && DS._luckPotionKills > 0) { gDrop = Math.round(gDrop * (DS._luckPotionMult||2)); DS._luckPotionKills--; if(DS._luckPotionKills<=0)addLog('🍀 Lucky Potion wore off.'); }
    if (DS._runeFortune) gDrop = Math.round(gDrop * 1.25);
    DS.gold += gDrop; DS.kills++;
    addGlobalGold(gDrop);
    updateTopBar();
    applySpiritOnKill();
    _multiEnemies.splice(targetIdx, 1);
  }

  renderMultiEnemies();

  // Keep DS.enemy pointing at a living enemy so watchdog doesn't misfire
  var _firstLiving = _multiEnemies.find(function(me){ return me.hp > 0; });
  if (_firstLiving) DS.enemy = _firstLiving;
  else DS.enemy = null;

  // Check if all enemies dead
  if (_multiEnemies.length === 0) {
    setTimeout(function(){ endMultiCombat(true, false); }, 600);
    return;
  }

  // Enemies counter-attack
  setTimeout(function(){ multiEnemiesTakeTurns(); }, 600);
}

function multiEnemiesTakeTurns() {
  if (!_multiCombatActive) return;
  setCombatBtns(false);

  var delay = 0;
  var snapshot = _multiEnemies.slice(); // snapshot so splice during combat doesn't affect turns
  snapshot.forEach(function(e) {
    setTimeout(function() {
      // Abort if combat ended or player already dead
      if (!_multiCombatActive || DS.hp <= 0) return;
      // Skip if this enemy was already defeated
      if (e.hp <= 0) return;
      var rawDmg = rnd(e.atk[0], e.atk[1]);
      rawDmg = applyEnemyMechanicsOnTurn(e, rawDmg);
      var def = (DS.defBonus || 0) + (DS.equippedArmorDef || 0);
      var dmg = Math.max(1, rawDmg - def);
      if (DS.defending) dmg = Math.floor(dmg * 0.5);
      DS.hp = Math.max(0, DS.hp - dmg);
      updatePlayerBar();
      addLog(e.name + ' hits you for ' + dmg + (DS.defending ? ' (defended)' : '') + '. Your HP: ' + DS.hp + '.');

      if (DS.hp <= 0) {
        if (_multiCombatActive) endMultiCombat(false, false); // only call once
        return;
      }
    }, delay);
    delay += 500;
  });

  // Re-enable buttons after all enemies attack
  setTimeout(function() {
    if (_multiCombatActive && DS.hp > 0) {
      DS.defending = false;
      setCombatBtns(true);
      say('Your turn. Choose action then target.');
      setTimeout(function(){ document.getElementById('cbtn-attack').focus(); }, 50);
    }
  }, delay + 200);
}

function endMultiCombat(won, fled) {
  _multiCombatActive = false;
  var _defeatedCount = _multiEnemies ? _multiEnemies.length : 2; // capture before clearing
  _multiEnemies = [];
  _pendingAction = null;
  _selectingTarget = false; // always reset target selection state

  // Restore single enemy display
  document.getElementById('dg-single-enemy').style.display = '';
  document.getElementById('dg-multi-enemies').style.display = 'none';
  document.getElementById('dg-target-select').style.display = 'none';

  if (won) {
    sfx('sfx-victory');
    addLog('⚔ All enemies defeated! Victory!');
    setCombatBtns(true);
    // Properly reset combat state so navigation works again
    DS.inCombat = false;
    DS.defending = false;
    DS.enemy = null;
    // Sanity check floor values after ambush
    if (isNaN(DS.floor) || !DS.floor) DS.floor = 1;
    if (isNaN(DS.roomsOnFloor)) DS.roomsOnFloor = 0;
    if (isNaN(DS.totalRooms)) DS.totalRooms = 0;
    showDgPanels(true, false, false);
    enterRoom();
    say('All enemies defeated! You are victorious. Choose a direction to continue.');
    // Run post combat rewards same as single combat
    try { awardSeasonalCurrencyOnKill(); } catch(e2) {}
    try { tryDropEnchanter(); } catch(e2) {}
    try { tryDropMaterial(DS.floor||1); } catch(e2) {}
    try { if (DS.enemy) { updateBountyProgress('kill', DS.enemy.name, DS.dungeon); if (DS.enemy.isElite) updateBountyProgress('kill_elite', DS.enemy.name, DS.dungeon); if (DS.enemy.isBoss) updateBountyProgress('kill_boss', DS.enemy.name, DS.dungeon); } } catch(e2) {}
    // Award gold and XP for the ambush
    // Gold already awarded per enemy during doFightMulti
    // Award XP based on number of enemies defeated
    try {
      var ambushXp = _defeatedCount * (ENEMY_XP['t2'] || 28);
      gainXP(ambushXp);
    } catch(e2) {}
    // Check achievements
    try { checkAchievements(); } catch(e2) {}
    // Update stat tracking
    try { updateAchievementStat('totalKills', (getAchievementStats().totalKills||0) + 1); } catch(e2) {}
  } else if (fled) {
    DS.inCombat = false;
    DS.defending = false;
    DS.enemy = null;
    showDgPanels(true, false, false);
    say('You escaped the ambush. Choose a direction to continue.');
  } else {
    showDefeat();
  }
}

// Check if room should spawn multiple enemies (20% chance floor 3+)
function shouldSpawnMultiEnemy() {
  if (window._forceAmbushDay) return true; // Ambush Day — always multi
  if (DS._forceAmbush) { DS._forceAmbush = false; return true; } // Dev tool
  return DS.floor >= 3 && !(DS.enemy && DS.enemy.isBoss) && Math.random() < 0.20;
}

function spawnAmbush() {
  // Shadow World uses its own echo ambush system
  if (DS.dungeon === 'The Shadow World') {
    return spawnShadowAmbush();
  }
  var pool = getEnemyPool();
  if (!pool || pool.length < 2) {
    // Pool too small for ambush — fall back to normal single combat
    if (DS.enemy && DS.enemy.hp > 0 && !DS.inCombat) startCombat(false);
    return false;
  }

  var count = DS.floor >= 7 ? 3 : 2;
  var enemies = [];
  for (var i = 0; i < count; i++) {
    var e = pool[Math.floor(Math.random() * pool.length)];
    var enemy = Object.assign({}, e);
    enemy.maxHp = enemy.hp;
    enemy = applyTierScaling(enemy);
    enemies.push(enemy);
  }

  startMultiCombat(enemies);
  return true;
}

function getEnemyPool() {
  var dungeon = DS.dungeon;
  var tier = DS.floor <= 3 ? 't1' : DS.floor <= 6 ? 't2' : 't3';
  var pool;
  if (dungeon === 'The Ashbound Wastes') pool = ASH_ENEMIES[tier] || ASH_ENEMIES.normal || [];
  else if (dungeon === 'Frosthold Abyss') pool = FROST_ENEMIES[tier] || FROST_ENEMIES.normal || [];
  else if (dungeon === 'The Sunken Archives') pool = SUNKEN_ENEMIES[tier] || SUNKEN_ENEMIES.normal || [];
  else if (dungeon === 'The Hollow') pool = HOLLOW_ENEMIES[tier] || HOLLOW_ENEMIES.normal || [];
  else if (dungeon === 'The Whispering Forest') pool = WHISPER_ENEMIES[tier] || [];
  else if (dungeon === 'The Infernal Descent' || dungeon === 'The Infernal') pool = INFERNAL_ENEMIES ? (INFERNAL_ENEMIES[tier] || INFERNAL_ENEMIES.normal || []) : [];
  else if (dungeon === 'The Abyssal Deep') pool = ABYSSAL_ENEMIES[tier] || [];
  else if (dungeon === 'The Shadow World') pool = SHADOW_ENEMIES[tier] || [];
  else pool = ENEMIES[tier] || ENEMIES.normal || [];
  // Fallback to crypt enemies if pool is empty
  if (!pool || pool.length === 0) pool = ENEMIES[tier] || ENEMIES.t1 || [];
  return pool.filter(function(e){ return !e.isBoss; });
}
// ── NEW SPECIAL ENEMIES ──
var SPECIAL_ENEMIES = [
  { name:'Mirror Shade',     icon:'🪞', hp:55,  atk:[0,0],  gold:25, xp:30, desc:'Reflects your own attack stat back at you. The stronger you are the harder it hits.',   mirrorAtk:true, minFloor:3 },
  { name:'Debt Collector',   icon:'💀', hp:40,  atk:[0,0],  gold:0,  xp:20, desc:'Steals 15 gold per turn. If it survives 5 turns you lose all your gold.',               drainGold:15, debtTimer:5, minFloor:2 },
  { name:'Hollow Preacher',  icon:'📿', hp:45,  atk:[4,8],  gold:20, xp:25, desc:'Heals all other enemies in ambushes by 10 HP each turn. Kill it first.',                healsAllies:10, minFloor:4 },
  { name:'Void Anchor',      icon:'⚓', hp:70,  atk:[8,14], gold:30, xp:35, desc:'Prevents fleeing. You cannot escape this fight.',                                        preventFlee:true, minFloor:5 },
  { name:'The Lurker',       icon:'👁️', hp:35,  atk:[12,20],gold:15, xp:20, desc:'Hides until you attack — then strikes for double damage on counter.',                   hiddenName:'The Lurker', immuneFirstHit:true, doubleCounterOnReveal:true, minFloor:3 },
];
// Called from searchRoom when player searches
function checkSpiritOrbDrop() {
  if (!DS || !DS.dungeon) return false;
  // 5% chance per search
  if (Math.random() > 0.05) return false;

  // Pick a spirit the player does not already have
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (!ch) return false;
  // BUGFIX: this referenced a global SPIRITS variable that has never existed
  // anywhere in the codebase — every single time this 5% roll actually hit,
  // the whole function threw a ReferenceError, which broke searchRoom()
  // entirely for that search. Also wrote captured spirits to ch.spirits
  // (full objects) instead of ch.earnedSpirits (the real field every other
  // spirit-unlock path in the game reads/writes — see openPauseSpirits(),
  // getUnlockedFamiliarSpecies(), etc. — as a plain array of id strings).
  var ownedIds = ch.earnedSpirits || [];

  // Filter available spirits
  var available = getAllSpirits().filter(function(s){
    return ownedIds.indexOf(s.id) === -1 && !s.requiresCompletion;
  });
  if (available.length === 0) return false;

  var spirit = available[Math.floor(Math.random() * available.length)];
  if (!ch.earnedSpirits) ch.earnedSpirits = [];
  ch.earnedSpirits.push(spirit.id);
  saveChars();

  setEvent('good', '✨ Spirit Orb Found! You discovered ' + spirit.icon + ' ' + spirit.name + '. Activate it from the Pause Menu → Spirits.');
  say('Spirit Orb found! ' + spirit.name + ' has been added to your spirits. Open the pause menu to activate it.');
  return true;
}

// ── END PAUSE MENU OVERHAUL ──

function toggleStatLegend() {
  var legend = document.getElementById('stat-legend');
  if (!legend) return;
  var isOpen = legend.style.display !== 'none';
  legend.style.display = isOpen ? 'none' : '';
  say(isOpen ? 'Stat legend closed.' : 'Stat legend. STR is Strength — attack damage. DEF is Defense — damage reduction. AGI is Agility — flee and dodge. INT is Intelligence — magic and SP. FAI is Faith — healing. LCK is Luck — loot and crits. Four filled dots is very high, zero filled dots is very low.');
}

// ── END STORY LIBRARY ──

function renderGraveyard() {
  try {
  var content = document.getElementById('graveyard-content');
  var empty = document.getElementById('graveyard-empty');
  if (!content) return;
  content.innerHTML = '';
  var g = getGraveyard();
  if (g.length === 0) {
    if (empty) empty.style.display = '';
    say('The Graveyard. No fallen characters yet. The graveyard waits.');
    return;
  }
  if (empty) empty.style.display = 'none';

  g.forEach(function(entry, i) {
    var stone = document.createElement('div');
    stone.style.cssText = 'background:#050505;border:1px solid #1a1a1a;border-top:2px solid #444;padding:16px;margin-bottom:12px;text-align:center;';
    stone.setAttribute('tabindex','0');
    var killedBy = entry.killedBy || 'unknown causes';
    var label = (entry.name||'Unknown') + ' the ' + (entry.race||'') + ' ' + (entry.cls||'') +
      '. Level ' + (entry.level||1) +
      '. ' + (killedBy !== 'unknown causes' ? 'Fell to ' + killedBy + '.' : 'Deleted.') +
      (entry.topFloor ? ' Reached floor ' + entry.topFloor + '.' : '');
    stone.setAttribute('aria-label', label);
    var html = '<div style="font-size:1.5rem;margin-bottom:8px;" aria-hidden="true">&#x26B0;</div>';
    html += '<div style="font-family:Cinzel,serif;font-size:0.85rem;color:#888;margin-bottom:4px;">' + (entry.name||'Unknown') + '</div>';
    html += '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;margin-bottom:8px;">' + (entry.race||'') + ' ' + (entry.cls||'') + ' Level ' + (entry.level||1) + '</div>';
    html += '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#444;margin-bottom:4px;">' + (entry.dungeon||'') + (entry.difficulty ? ' ' + entry.difficulty : '') + '</div>';
    if (killedBy !== 'unknown causes') {
      html += '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#666;margin-bottom:8px;">Fell to ' + killedBy + (entry.topFloor ? ' on floor ' + entry.topFloor : '') + '</div>';
    } else {
      html += '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;margin-bottom:8px;font-style:italic;">Removed from the roster.</div>';
    }
    if (entry.journal) {
      var journalText = typeof entry.journal === 'string'
        ? entry.journal
        : Array.isArray(entry.journal)
          ? entry.journal.map(function(j){ return typeof j === 'object' ? (j.text || '') : j; }).filter(Boolean).join(' · ')
          : (entry.journal.text || '');
      if (journalText) {
        html += '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#333;font-style:italic;border-top:1px solid #111;padding-top:8px;margin-top:4px;">' + journalText + '</div>';
      }
    }
    html += '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#222;margin-top:8px;">' + (entry.date||'') + '</div>';
    stone.innerHTML = html;
    content.appendChild(stone);
  });

  say('The Graveyard. ' + g.length + ' fallen champion' + (g.length !== 1 ? 's' : '') + '. Tab through to read each tombstone.');
  } catch(e) {
    console.warn('renderGraveyard error:', e);
    var content = document.getElementById('graveyard-content');
    if (content) content.innerHTML = '<p style="font-family:Cinzel,serif;color:#555;padding:20px;text-align:center;">The graveyard is empty.</p>';
    say('The Graveyard.');
  }
}
// ── END GRAVEYARD ──
var _charListSliderIdx = 0;

function updateCharListSlider() {
  if (!CHARS || CHARS.length === 0) {
    var wrap = document.getElementById('char-list-slider-wrap');
    if (wrap) wrap.style.display = 'none';
    return;
  }
  var wrap = document.getElementById('char-list-slider-wrap');
  if (wrap) wrap.style.display = 'flex';
  var ch = CHARS[_charListSliderIdx];
  if (!ch) return;
  var sn = document.getElementById('char-list-slider-name');
  var ss = document.getElementById('char-list-slider-sub');
  var slider = document.getElementById('char-list-slider');
  if (sn) sn.textContent = ch.name + ' — ' + ch.cls;
  if (ss) ss.textContent = 'Level ' + (ch.persistLevel||1) + ' · ' + (ch.race||'') + ' · ' + ch.dungeon;
  if (slider) {
    slider.setAttribute('aria-valuemax', CHARS.length - 1);
    slider.setAttribute('aria-valuenow', _charListSliderIdx);
    slider.setAttribute('aria-valuetext', ch.name + ' Level ' + (ch.persistLevel||1) + ' ' + ch.cls + '. ' + ch.dungeon + '. ' + (ch.difficulty||''));
  }
}

function charListSliderStep(dir) {
  if (!CHARS || CHARS.length === 0) return;
  _charListSliderIdx = (_charListSliderIdx + dir + CHARS.length) % CHARS.length;
  updateCharListSlider();
  var ch = CHARS[_charListSliderIdx];
  say(ch.name + '. Level ' + (ch.persistLevel||1) + ' ' + ch.cls + '. ' + ch.dungeon + '. ' + (ch.difficulty||'') + '. Press Play to enter the dungeon.');
}

function charListSliderPlay() {
  if (!CHARS || CHARS.length === 0) return;
  playChar(_charListSliderIdx);
}
// ── END CHARACTER LIST SLIDER ──

// ── CHARACTER PICKER SLIDER ──
// Injects a ◀ name ▶ slider above any character list container
function injectCharSlider(wrapperId, idxRef, onStep) {
  var wrap = document.getElementById(wrapperId);
  if (!wrap || document.getElementById(wrapperId + '-slider-wrap')) return;
  var sliderWrap = document.createElement('div');
  sliderWrap.id = wrapperId + '-slider-wrap';
  sliderWrap.style.cssText = 'background:#0a0800;border:1px solid #2a2010;padding:10px;margin-bottom:10px;display:flex;align-items:center;gap:10px;';
  sliderWrap.innerHTML =
    '<button onclick="charSliderStep(\'' + wrapperId + '\',-1)" style="font-family:Cinzel,serif;padding:6px 12px;background:#1a1000;border:1px solid #555;color:#aaa;cursor:pointer;" aria-label="Previous character">◀</button>' +
    '<div role="slider" tabindex="0" id="' + wrapperId + '-slider" aria-label="Character selector" aria-valuemin="0" aria-valuemax="4" aria-valuenow="0" aria-valuetext="" style="flex:1;text-align:center;outline:none;" onkeydown="if(event.key===\'ArrowUp\'||event.key===\'ArrowRight\')charSliderStep(\'' + wrapperId + '\',1);else if(event.key===\'ArrowDown\'||event.key===\'ArrowLeft\')charSliderStep(\'' + wrapperId + '\',-1);">' +
      '<div id="' + wrapperId + '-slider-name" style="font-family:Cinzel,serif;font-size:0.8rem;color:#e0c080;">—</div>' +
      '<div id="' + wrapperId + '-slider-lvl" style="font-family:Cinzel,serif;font-size:0.62rem;color:#666;margin-top:2px;">—</div>' +
    '</div>' +
    '<button onclick="charSliderStep(\'' + wrapperId + '\',1)" style="font-family:Cinzel,serif;padding:6px 12px;background:#1a1000;border:1px solid #555;color:#aaa;cursor:pointer;" aria-label="Next character">▶</button>';
  wrap.parentNode.insertBefore(sliderWrap, wrap);
  updateCharSlider(wrapperId);
}

var _charSliderIdx = {};

function charSliderStep(wrapperId, dir) {
  if (CHARS.length === 0) return;
  _charSliderIdx[wrapperId] = _charSliderIdx[wrapperId] || 0;
  _charSliderIdx[wrapperId] = (_charSliderIdx[wrapperId] + dir + CHARS.length) % CHARS.length;
  updateCharSlider(wrapperId);
  // Click the corresponding button in the list
  var list = document.getElementById(wrapperId);
  if (list) {
    var btns = list.querySelectorAll('button, [role="radio"]');
    var idx = _charSliderIdx[wrapperId];
    if (btns[idx]) btns[idx].click();
  }
}

function updateCharSlider(wrapperId) {
  var idx = _charSliderIdx[wrapperId] || 0;
  var ch = CHARS[idx];
  if (!ch) return;
  var sn = document.getElementById(wrapperId + '-slider-name');
  var sl = document.getElementById(wrapperId + '-slider-lvl');
  var slider = document.getElementById(wrapperId + '-slider');
  if (sn) sn.textContent = ch.name + ' — ' + ch.cls;
  if (sl) sl.textContent = 'Level ' + (ch.persistLevel||1) + ' · ' + (ch.race||'') + ' · ' + (ch.prof||'');
  if (slider) { slider.setAttribute('aria-valuenow', idx); slider.setAttribute('aria-valuetext', ch.name + ' Level ' + (ch.persistLevel||1) + ' ' + ch.cls); }
}
// ── END CHARACTER PICKER SLIDER ──
function openDeathLog() {
  goTo('deathlog');
  say('Death Log. Your complete history of runs and deaths across all characters.');
}

function renderDeathLog() {
  var content = document.getElementById('deathlog-content');
  if (!content) return;
  content.innerHTML = '';

  if (!CHARS || CHARS.length === 0) {
    content.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.75rem;color:#555;text-align:center;padding:20px;">No characters yet.</p>';
    say('No characters found.');
    return;
  }

  var totalDeaths = 0;

  CHARS.forEach(function(ch, ci) {
    var deaths = ch.deathLog || [];
    var spireAttempts = ch.spireAttempts || 0;
    totalDeaths += deaths.length;

    var header = document.createElement('div');
    header.style.cssText = 'background:#0a0800;border:1px solid #2a2010;border-top:2px solid #e0c080;padding:14px;margin-bottom:4px;';
    header.setAttribute('tabindex','0');
    header.setAttribute('aria-label', ch.name + ' the ' + ch.cls + '. Level ' + (ch.persistLevel||1) + '. ' + deaths.length + ' deaths.');
    header.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div style="font-family:Cinzel,serif;font-size:0.85rem;color:#e0c080;">' + (CLASS_ICONS[ch.cls]||'⚔️') + ' ' + ch.name + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#ffaa00;">Lv ' + (ch.persistLevel||1) + ' ' + ch.cls + '</div>' +
      '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;margin-top:6px;display:flex;gap:16px;">' +
        '<span>☠ ' + deaths.length + ' death' + (deaths.length !== 1 ? 's' : '') + '</span>' +
        (spireAttempts ? '<span>🗼 ' + spireAttempts + ' spire attempt' + (spireAttempts !== 1 ? 's' : '') + '</span>' : '') +
      '</div>';
    content.appendChild(header);

    if (deaths.length === 0) {
      var none = document.createElement('div');
      none.style.cssText = 'background:#050505;border:1px solid #111;padding:10px 14px;margin-bottom:12px;font-family:Cinzel,serif;font-size:0.68rem;color:#444;font-style:italic;';
      none.textContent = ch.name + ' still lives. No deaths recorded.';
      none.setAttribute('tabindex','0');
      content.appendChild(none);
      return;
    }

    deaths.forEach(function(d, di) {
      var entry = document.createElement('div');
      entry.style.cssText = 'background:#050505;border:1px solid #1a1a1a;border-left:2px solid #441111;padding:12px 14px;margin-bottom:' + (di === deaths.length-1 ? '16' : '2') + 'px;';
      entry.setAttribute('tabindex','0');
      entry.setAttribute('aria-label',
        'Death ' + (di+1) + '. ' + (d.dungeon||'Unknown') + '. Floor ' + d.floor +
        '. Killed by ' + d.killedBy + '. Level ' + (d.level||1) + '. ' + (d.kills||0) + ' kills. ' + (d.date||'') + '.'
      );
      entry.innerHTML =
        '<div style="display:flex;justify-content:space-between;margin-bottom:4px;">' +
          '<span style="font-family:Cinzel,serif;font-size:0.72rem;color:#ff6666;">☠ Floor ' + d.floor + ' — ' + d.killedBy + '</span>' +
          '<span style="font-family:Cinzel,serif;font-size:0.6rem;color:#444;">' + (d.date||'') + '</span>' +
        '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#666;margin-bottom:4px;">' + (d.dungeon||'') + (d.diff ? ' · ' + d.diff : '') + ' · Lv ' + (d.level||1) + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;display:flex;gap:12px;">' +
          '<span>⚔ ' + (d.kills||0) + ' kills</span>' +
          '<span>💰 ' + (d.gold||0) + 'g</span>' +
          (d.bestDmg ? '<span>💥 ' + d.bestDmg + ' best</span>' : '') +
        '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#333;margin-top:6px;font-style:italic;">' + (d.flavor||'') + '</div>';
      content.appendChild(entry);
    });
  });

  var footer = document.createElement('div');
  footer.style.cssText = 'background:#0a0a0a;border:1px solid #222;padding:14px;text-align:center;margin-top:8px;';
  footer.setAttribute('tabindex','0');
  footer.setAttribute('aria-label', 'Total: ' + totalDeaths + ' deaths across ' + CHARS.length + ' characters.');
  footer.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">Total across all characters</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1rem;color:#ff6666;margin-top:4px;">☠ ' + totalDeaths + ' death' + (totalDeaths !== 1 ? 's' : '') + '</div>';
  content.appendChild(footer);
  say('Death Log. ' + CHARS.length + ' character' + (CHARS.length !== 1 ? 's' : '') + '. ' + totalDeaths + ' total deaths.');
}
// ── END DEATH LOG ──

// ── VOID REAPER FIGHT ──

function getCharPersistentLevel(charIdx) {
  var idx = charIdx !== undefined ? charIdx : _charIdx;
  if (idx === null || !CHARS[idx]) return { level: 1, xp: 0, skills: [], maxHp: 0, atkBonus: 0 };
  var ch = CHARS[idx];
  return {
    level:    ch.persistLevel    || 1,
    xp:       ch.persistXp       || 0,
    skills:   ch.persistSkills   || [],
    maxHp:    ch.persistMaxHp    || 0,
    atkBonus: ch.persistAtk      || 0,
  };
}

function getEndlessBestStr(ch) {
  if (!ch.endlessBest || ch.endlessBest < 1) return '';
  return ' · ⬇ Floor ' + ch.endlessBest + ' (Endless)';
}

// Get persistent bonuses as plain object for non-DS modes

function saveCharPersistentLevel(level, xp, skills, maxHp, atkBonus, charIdx) {
  var idx = charIdx !== undefined ? charIdx : _charIdx;
  if (idx === null || idx === undefined || !CHARS[idx]) return;
  CHARS[idx].persistLevel  = level;
  CHARS[idx].persistXp     = xp;
  CHARS[idx].persistSkills = skills || [];
  CHARS[idx].persistMaxHp  = maxHp  || 0;
  CHARS[idx].persistAtk    = atkBonus || 0;
  saveChars();
}

function startEndlessCombat(enemy) {
  // Normal combat start
  DS.inCombat = true; DS.defending = false;
  playTrack(battleTrack());
  showDgPanels(false, true, false);
  document.getElementById('dg-enemy-icon').textContent = enemy.icon;
  document.getElementById('dg-enemy-name').textContent = t(enemy.name);
  updateEnemyBar(); updatePlayerBar();
  showEnemyPreview(enemy);
  DS._endlessKnightRespawned = false;
  setCombatBtns(true); updateSkillButtons();
  setTimeout(function(){ document.getElementById('cbtn-attack').focus(); }, 100);
}

// Show endless best floor on character cards


// ── TIME DESCENDER ENCOUNTER FUNCTIONS ──
function timeDescenderClockHit(action) {
  if (!DS._clockAttackWindow) return;
  DS._clockAttackWindow = false;
  var missed = false;
  var dmg = 0;
  if (action === 'heavy' && Math.random() < 0.30) {
    missed = true;
    sfx('sfx-heavy-miss');
    addLog('Your heavy strike misses the clock! It ticks on relentlessly.');
    say('Miss! Your heavy strike missed the clock. It resumes.');
  }
  if (!missed) {
    var base = rnd(DS.atkBonus + 8, DS.atkBonus + 18);
    if (action === 'heavy') base = Math.round(base * 1.6);
    dmg = base;
    DS.enemy.hp = Math.max(0, DS.enemy.hp - dmg);
    updateEnemyBar(); // renderEnemy() doesn't exist — this is the real function, used everywhere else
    addLog('You strike the clock for ' + dmg + '. Clock HP: ' + DS.enemy.hp + '/' + DS.enemy.maxHp + '.');
    say('Struck the clock for ' + dmg + '. Clock HP: ' + DS.enemy.hp + '.');
  }
  if (DS.enemy.hp <= 0) { timeDescenderVictory(); return; }
  // Chrono Armor: no clock cycles — strike freely
  if (hasChronoArmor()) { DS._clockAttackWindow = true; setCombatBtns(true); updateSkillButtons(); return; }
  setCombatBtns(false);
  addLog('\u23f0 The clock continues. Brace yourself.');
  say('The clock endures. Another cycle begins.');
  setTimeout(function(){
    var prev2 = AUD.current;
    if (AUD.current){ var old2=AUD.tracks[AUD.current]; if(old2){try{old2.pause();}catch(e4){}} AUD.current=null; }
    playTrack('time-descender');
    var ticks2 = 0;
    _timeDescenderInterval = setInterval(function(){
      if (ticks2 >= 3){
        clearInterval(_timeDescenderInterval); _timeDescenderInterval=null;
        var td2=AUD.tracks['time-descender']; if(td2){try{td2.pause();td2.currentTime=0;}catch(e5){}}
        AUD.current=null; playTrack(prev2||battleTrack());
        addLog('\u23f1 The clock pauses. Attack now.');
        say('The clock pauses. Your turn. Attack precisely.');
        var ab2=document.getElementById('cbtn-attack');
        var db2=document.getElementById('cbtn-defend');
        var hb2=document.getElementById('cbtn-heavy');
        if(ab2){ab2.disabled=false;ab2.style.opacity='1';}
        if(db2){db2.disabled=false;db2.style.opacity='1';}
        if(hb2){hb2.disabled=false;hb2.style.opacity='0.6';}
        DS._clockAttackWindow=true;
        setTimeout(function(){if(ab2)ab2.focus();},150);
        return;
      }
      ticks2++;
      var dmg2=rnd(18,28); if(DS.defending)dmg2=Math.max(1,Math.round(dmg2*0.5));
      DS.hp=Math.max(0,DS.hp-dmg2); updatePlayerBar(); updateTopBar();
      sayLog('\u23f0 Tick '+ticks2+' of 3. '+dmg2+' damage. HP: '+DS.hp+'/'+DS.maxHp+'.');
      if(DS.hp<=0){clearInterval(_timeDescenderInterval);_timeDescenderInterval=null;setTimeout(function(){handleDeath();},400);}
    }, 5000);
  }, 800);
}

function timeDescenderPhaseTwo() {
  DS._timeDescenderPhase = 2;
  DS.enemy = { name:'The Clock', icon:'\ud83d\udd70\ufe0f', hp:79, maxHp:79, atk:[18,28], gold:[0,0], isTimeDescender:true, isClock:true, phase:2 };
  updateEnemyBar(); // renderEnemy() doesn't exist \u2014 this is the real function, used everywhere else
  setCombatBtns(false);
  addLog('\u26a1 Switching to Phase 2.');
  say('Switching to Phase 2.');
  setTimeout(function(){
    addLog('\u23f0 The clock begins.');
    say('The clock begins.');
    if (hasChronoArmor()) {
      addLog('\u2728 Chrono Armor resonates. The clock\'s power is nullified.');
      say('Your Chrono Armor negates the clock. The Time Descender is vulnerable.');
      // (the strike window was never opened, so no attack could land and the fight froze)
      DS._clockAttackWindow = true;
      setCombatBtns(true); updateSkillButtons();
      setTimeout(function(){ document.getElementById('cbtn-attack').focus(); }, 200);
      return;
    }
    var prevTrack = AUD.current;
    if (AUD.current) { var old = AUD.tracks[AUD.current]; if (old) { try { old.pause(); } catch(e2){} } AUD.current = null; }
    playTrack('time-descender');
    var ticks = 0;
    _timeDescenderInterval = setInterval(function(){
      if (ticks >= 3) {
        clearInterval(_timeDescenderInterval); _timeDescenderInterval = null;
        var tdTrack = AUD.tracks['time-descender'];
        if (tdTrack) { try { tdTrack.pause(); tdTrack.currentTime = 0; } catch(e3){} }
        AUD.current = null; playTrack(prevTrack || battleTrack());
        addLog('\u23f1 The clock pauses. Your turn. This enemy is no joke. Attack with precision.');
        say('The clock pauses. Your turn. This enemy is no joke. Heavy strike may miss.');
        var ab = document.getElementById('cbtn-attack');
        var hb = document.getElementById('cbtn-heavy');
        var db = document.getElementById('cbtn-defend');
        if (ab){ ab.disabled=false; ab.style.opacity='1'; }
        if (db){ db.disabled=false; db.style.opacity='1'; }
        if (hb){ hb.disabled=false; hb.style.opacity='0.6'; hb.setAttribute('aria-label','Heavy strike. WARNING: may miss against The Clock. A miss deals no damage.'); }
        DS._clockAttackWindow = true;
        setTimeout(function(){ if(ab) ab.focus(); }, 150);
        return;
      }
      ticks++;
      var dmg = rnd(18, 28);
      if (DS.defending) dmg = Math.max(1, Math.round(dmg * 0.5));
      DS.hp = Math.max(0, DS.hp - dmg);
      updatePlayerBar(); updateTopBar();
      sayLog('\u23f0 Tick ' + ticks + ' of 3. The clock strikes for ' + dmg + '. HP: ' + DS.hp + '/' + DS.maxHp + '.');
      if (DS.hp <= 0) { clearInterval(_timeDescenderInterval); _timeDescenderInterval = null; setTimeout(function(){ handleDeath(); }, 400); }
    }, 5000);
  }, 1200);
}

function timeDescenderVictory() {
  DS._timeDescenderDefeatedThisRun = true;
  DS._inTimeDescenderFight = false;
  DS._clockAttackWindow = false;
  if (_timeDescenderInterval) { clearInterval(_timeDescenderInterval); _timeDescenderInterval = null; }
  var gold = rnd(80, 140);
  DS.gold += gold; addGlobalGold(gold);
  var saveData = _jsonParseSafe(DDStore.getItem('dd_time_descender'), '{}');
  var firstKill = !saveData.defeated;
  addLog('\u23f3 The Time Descender crumbles. Time flows normally again. +' + gold + ' gold.');
  say('The Time Descender falls. Time flows normally. You earned ' + gold + ' gold.');
  if (firstKill) {
    saveData.defeated = true;
    DDStore.setItem('dd_time_descender', JSON.stringify(saveData));
    var chronoArmor = { name:'Chrono Armor', icon:'\u23f3', type:'chronoarmor', desc:'Legendary. Negates the Time Descender clock cycle in all future encounters.', legendary:true };
    DS.inventory.push(chronoArmor);
    renderInv();
    addLog('\u2728 LEGENDARY DROP: Chrono Armor! The clock will never bind you again.');
    say('Legendary item obtained. Chrono Armor. Future clock cycles will be skipped.');
    setEvent('good', '\u2728 Legendary: Chrono Armor obtained!');
  }
  trackGlobalStat('totalKills', 1);
  incrementAchievementStat('timeDescenderDefeated', 1);
  checkAchievements();
  var tdFinal = AUD.tracks['time-descender'];
  if (tdFinal) { try { tdFinal.pause(); tdFinal.currentTime = 0; } catch(e6){} }
  AUD.current = null;
  playTrack(battleTrack());
  DS.inCombat = false;
  DS.enemy = null;
  setTimeout(function(){
    showDgPanels(true, false, false);
    updateTopBar();
    gainXP(120);
    say('Returning to dungeon. ' + gold + ' gold added.');
  }, 1500);
}



function hasChronoArmor() {
  return DS.inventory && DS.inventory.some(function(item){ return item.type === 'chronoarmor'; });
}


// ── TITLE SYSTEM ──
var TITLE_COSTS = {
  'TheVoid':0,'Slayer':0,'Undying':0,'Cursed':0,'Shadow':0,
  'Ironclad':0,'Ashen':0,'Hollow':0,'Forsaken':0,'Eternal':0,
  'Crimson':5,'Frost':5,'Storm':5,'Silent':5,'Lost':5,
  'Ancient':10,'Broken':10,'Risen':10,'Scarred':10,'Phantom':10,
  'Ember':15,'Dusk':15,'Dawn':15,'Warden':15,'Exile':15,
  'Relic':20,'Marked':20,'Wanderer':20,'Remnant':20,'Sovereign':25
};

function getPlayerFirstName() {
  var user = getFirebaseUser();
  if (!user) return 'Player';
  var email = user.email || '';
  var local = email.split('@')[0] || '';
  var letters = local.replace(/[^a-zA-Z]/g,'');
  if (!letters) return 'Player';
  return letters.charAt(0).toUpperCase() + letters.slice(1,8).toLowerCase();
}

function getPlayerTitle() {
  return DDStore.getItem('dd_title') || 'Wanderer';
}

function getFullDisplayName() {
  var first = getPlayerFirstName();
  var title = getPlayerTitle();
  return first + ' the ' + title;
}

function openTitlePicker() {
  var ov = document.getElementById('ov-title-picker');
  if (!ov) return;
  ov.style.display = 'flex';
  renderTitlePicker();
  say('Choose your title. First 10 titles are free. Others cost Mystery Coins.');
}

function closeTitlePicker() {
  var ov = document.getElementById('ov-title-picker');
  if (ov) ov.style.display = 'none';
}

function renderTitlePicker() {
  var firstName = getPlayerFirstName();
  var current = getPlayerTitle();
  var coins = (getRaidSave().mysteryCoins || 0);
  var owned = _jsonParseSafe(DDStore.getItem('dd_owned_titles'), '["Wanderer"]');

  var preview = document.getElementById('title-picker-preview');
  if (preview) preview.textContent = 'Currently: ' + firstName + ' the ' + current;

  var coinsEl = document.getElementById('title-picker-coins');
  if (coinsEl) coinsEl.textContent = coins;

  var grid = document.getElementById('title-picker-grid');
  if (!grid) return;
  grid.innerHTML = '';

  TITLE_TAGS.forEach(function(tag) {
    var cost = TITLE_COSTS[tag] || 0;
    var isOwned = owned.indexOf(tag) !== -1 || cost === 0;
    var isCurrent = tag === current;
    var canAfford = coins >= cost;

    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:' +
      (isCurrent ? 'rgba(201,162,39,0.1)' : '#0a0a0a') +
      ';border:1px solid ' + (isCurrent ? 'var(--gold)' : '#1a1a1a') + ';';

    var nameDiv = document.createElement('div');
    nameDiv.style.cssText = 'font-family:Cinzel,serif;font-size:0.78rem;color:' + (isCurrent ? 'var(--gold)' : '#aaa') + ';';
    nameDiv.textContent = firstName + ' the ' + tag + (isCurrent ? ' ✓' : '');

    var btn = document.createElement('button');
    btn.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:4px 10px;cursor:pointer;border:1px solid;';

    if (isCurrent) {
      btn.textContent = 'Active';
      btn.style.cssText += 'background:transparent;border-color:var(--gold);color:var(--gold);cursor:default;';
      btn.disabled = true;
    } else if (isOwned) {
      btn.textContent = 'Select';
      btn.style.cssText += 'background:#0a1a0a;border-color:#336633;color:#aaffaa;';
      btn.setAttribute('aria-label', 'Select title ' + firstName + ' the ' + tag);
      btn.onclick = (function(t){ return function(){ selectTitle(t); }; })(tag);
    } else if (canAfford) {
      btn.textContent = '🪙 ' + cost;
      btn.style.cssText += 'background:#1a1400;border-color:#ffdd44;color:#ffdd44;';
      btn.setAttribute('aria-label', 'Buy title ' + tag + ' for ' + cost + ' mystery coins');
      btn.onclick = (function(t, c){ return function(){ buyTitle(t, c); }; })(tag, cost);
    } else {
      btn.textContent = '🪙 ' + cost;
      btn.style.cssText += 'background:transparent;border-color:#333;color:#444;cursor:default;';
      btn.disabled = true;
      btn.setAttribute('aria-label', tag + ' costs ' + cost + ' mystery coins, not enough coins');
    }

    row.appendChild(nameDiv);
    row.appendChild(btn);
    grid.appendChild(row);
  });
}

function selectTitle(tag) {
  DDStore.setItem('dd_title', tag);
  var fullName = getFullDisplayName();
  // Update username storage too so leaderboard uses it
  DDStore.setItem('dd_username', fullName);
  // Save to Firebase
  var user = getFirebaseUser();
  if (window._fbDb && user) {
    window._fbDb.collection('users').doc(user.uid).set({ username: fullName, title: tag }, { merge: true }).catch(function(){});
  }
  renderTitlePicker();
  updateAccountUI();
  say('Title changed to ' + fullName + '.');
}

function buyTitle(tag, cost) {
  var data = getRaidSave();
  var coins = parseInt(DDStore.getItem('dd_mystery_coins') || '0');
  if (coins < cost) { say('Not enough Mystery Coins.'); return; }
  var newCoins = coins - cost;
  DDStore.setItem('dd_mystery_coins', String(newCoins));
  var data = getRaidSave();
  data.mysteryCoins = newCoins;
  setRaidSave(data);
  var owned = _jsonParseSafe(DDStore.getItem('dd_owned_titles'), '["Wanderer"]');
  if (owned.indexOf(tag) === -1) owned.push(tag);
  DDStore.setItem('dd_owned_titles', JSON.stringify(owned));
  say('Title unlocked: ' + tag + '. ' + data.mysteryCoins + ' coins remaining.');
  selectTitle(tag);
}


//═════════════════
// VOID REAPER — GLOBAL MULTIPLAYER SYSTEM v9.0
//═════════════════

//═════════════════
// EQUIPMENT SYSTEM — v9.1
//═════════════════

// Weapon definitions by type
var WEAPON_TYPES = {
  sword:  { icon:'⚔️',  name:'Sword',   atkBase:[5,8],   desc:'Balanced. Reliable damage.' },
  mace:   { icon:'🔨',  name:'Mace',    atkBase:[6,10],  desc:'Slow but hits hard.' },
  axe:    { icon:'🪓',  name:'Axe',     atkBase:[7,11],  desc:'High variance. Feast or famine.' },
  dagger: { icon:'🗡️',  name:'Dagger',  atkBase:[3,7],   desc:'Fast. 15% chance to strike twice.' },
  staff:  { icon:'🪄',  name:'Staff',   atkBase:[4,9],   desc:'Boosts SP by 10 when equipped.' },
  bow:    { icon:'🏹',  name:'Bow',     atkBase:[5,10],  desc:'First strike every combat.' },
};

var ARMOR_TYPES = {
  light:  { icon:'🥋', name:'Light Armor',  defBase:2, desc:'Fast. +1 speed, low protection.' },
  medium: { icon:'🛡️', name:'Medium Armor', defBase:4, desc:'Balanced protection.' },
  heavy:  { icon:'⛓️', name:'Heavy Armor',  defBase:7, desc:'High protection. -1 ATK.' },
};

// Upgrade costs per level (level = current weapon level)
var UPGRADE_COSTS = [0, 40, 80, 140, 220, 320, 440, 580, 740, 920, 1150];

function getUpgradeCost(level) {
  var cost = UPGRADE_COSTS[level] || Math.round(3000 * Math.pow(1.4, level - 10));
  // Blacksmith profession discount — only inside a run (from the menu, DS is the
  // last run's leftover state, and the screen says there's no discount there)
  if (DS && DS.prof === 'Blacksmith' && !DS._fromMenu) cost = Math.round(cost * 0.9);
  // Seasonal/birthday/event discount code
  try {
    var discRaw = DDStore.getItem('dd_blacksmith_discount');
    if (discRaw) {
      var disc = JSON.parse(discRaw);
      if (typeof disc === 'number') {
        // Old plain-number format (birthday code) — permanent discount
        cost = Math.round(cost * (1 - disc));
      } else if (disc && typeof disc === 'object') {
        if (!disc.expires || disc.expires > Date.now()) {
          cost = Math.round(cost * (1 - (disc.pct || 0)));
        } else {
          DDStore.removeItem('dd_blacksmith_discount'); // expired
        }
      }
    }
  } catch(e) {}
  return Math.max(1, cost);
}

function getWeaponAtk(weapon) {
  if (!weapon) return 0;
  // Forged weapons saved their attack as atkRange, so they hit like a starter sword
  var base = weapon.atkBase || weapon.atkRange || [5, 8];
  var lvl = weapon.level || 1;
  var bonus = Math.round((lvl - 1) * 2.5);
  return [base[0] + bonus, base[1] + bonus];
}

function getArmorDef(armor) {
  if (!armor) return 0;
  var base = armor.defBase || 4;
  var lvl = armor.level || 1;
  return base + Math.round((lvl - 1) * 1.5);
}

function equipWeapon(item) {
  if (DS.equippedWeapon) unequipWeapon();
  DS.equippedWeapon = item;
  var atk = getWeaponAtk(item);
  DS.equippedWeaponAtk = atk;
  // The middle of the range, as at the start of a run (equipping used the low end).
  DS.atkBonus = (DS.atkBonus || 0) + Math.floor((atk[0] + atk[1]) / 2);
  if (item.weaponType === 'staff') { DS.sp = Math.min((DS.maxSp||100), (DS.sp||0) + 10); }
  DS.inventory = DS.inventory.filter(function(i){ return i !== item; });
  // Save equipped weapon globally so it persists
  DDStore.setItem('dd_equipped_weapon', JSON.stringify(item));
  // Remove from global inventory
  var globalInv = getGlobalInventory();
  globalInv = globalInv.filter(function(i){ return i.id !== item.id || i.name !== item.name; });
  saveGlobalInventory(globalInv);
  updateTopBar();
  renderInv();
  say('Equipped ' + item.icon + ' ' + item.name + ' Level ' + (item.level||1) + '. Attack increased.');
  try { checkSetBonus(); } catch(e) {}
}

function unequipWeapon() {
  if (!DS.equippedWeapon) return;
  var atk = DS.equippedWeaponAtk || [0,0];
  DS.atkBonus = Math.max(0, (DS.atkBonus||0) - Math.floor((atk[0] + atk[1]) / 2));
  // Return to global inventory
  addToGlobalInventory(DS.equippedWeapon);
  DS.inventory.push(DS.equippedWeapon);
  DS.equippedWeapon = null;
  DS.equippedWeaponAtk = null;
  DDStore.removeItem('dd_equipped_weapon');
  renderInv();
  say('Weapon unequipped and returned to inventory.');
}

function equipArmor(item) {
  if (DS.inCombat) {
    say('Cannot change armor during combat.');
    showToast('Armor locked during combat', 'red');
    return;
  }
  if (DS.equippedArmor) unequipArmor();
  DS.equippedArmor = item;
  var def = getArmorDef(item);
  DS.equippedArmorDef = def;
  DS.defBonus = (DS.defBonus || 0) + def;
  if (item.armorType === 'heavy') DS.atkBonus = Math.max(0, (DS.atkBonus||0) - 1);
  DS.inventory = DS.inventory.filter(function(i){ return i !== item; });
  // Save equipped armor globally
  DDStore.setItem('dd_equipped_armor', JSON.stringify(item));
  var globalInv = getGlobalInventory();
  globalInv = globalInv.filter(function(i){ return i.id !== item.id || i.name !== item.name; });
  saveGlobalInventory(globalInv);
  updateTopBar();
  renderInv();
  say('Equipped ' + item.icon + ' ' + item.name + ' Level ' + (item.level||1) + '. Defense increased by ' + def + '.');
}

function unequipArmor() {
  if (!DS.equippedArmor) return;
  DS.defBonus = Math.max(0, (DS.defBonus||0) - (DS.equippedArmorDef||0));
  if (DS.equippedArmor.armorType === 'heavy') DS.atkBonus = (DS.atkBonus||0) + 1;
  addToGlobalInventory(DS.equippedArmor);
  DS.inventory.push(DS.equippedArmor);
  DS.equippedArmor = null;
  DS.equippedArmorDef = null;
  DDStore.removeItem('dd_equipped_armor');
  renderInv();
  say('Armor unequipped and returned to inventory.');
}

// ── BLACKSMITH WEAPON SHOP ──
// ── WEAPON DURABILITY SYSTEM ──
var WEAPON_MAX_DURABILITY = 100;

function getWeaponDurability(weapon) {
  if (!weapon) return 100;
  return weapon.durability !== undefined ? weapon.durability : WEAPON_MAX_DURABILITY;
}

function getDurabilityLabel(dur) {
  if (dur >= 80) return { label:'Perfect', color:'#44cc44' };
  if (dur >= 60) return { label:'Good', color:'#88cc44' };
  if (dur >= 40) return { label:'Worn', color:'#ccaa00' };
  if (dur >= 20) return { label:'Damaged', color:'#cc6600' };
  if (dur > 0)   return { label:'Critical', color:'#cc2200' };
  return { label:'Broken', color:'#444' };
}

function degradeWeapon(amount) {
  if (!DS.equippedWeapon) return;
  if (DS.equippedWeapon.durability === undefined) DS.equippedWeapon.durability = WEAPON_MAX_DURABILITY;
  DS.equippedWeapon.durability = Math.max(0, DS.equippedWeapon.durability - amount);
  var dur = DS.equippedWeapon.durability;
  // Warn player at key thresholds
  if (dur === 40) { addLog('⚠ ' + DS.equippedWeapon.name + ' is Worn. Visit the Blacksmith to repair it.'); say('Warning. Your weapon is worn. Visit the Blacksmith.'); }
  if (dur === 20) { addLog('🔴 ' + DS.equippedWeapon.name + ' is Damaged! Repair it soon or it will break!'); say('Danger. Your weapon is damaged. Repair immediately.'); vibe && vibe(VIBE.weaponDamaged); }
  if (dur === 0)  { addLog('💔 ' + DS.equippedWeapon.name + ' has BROKEN! Your attacks deal half damage until repaired.'); say('Your weapon has broken! Half damage until repaired at Blacksmith.'); vibe && vibe(VIBE.weaponBroken); }
}

function getWeaponDamageMult() {
  if (!DS.equippedWeapon) return 1.0;
  var dur = getWeaponDurability(DS.equippedWeapon);
  if (dur === 0) return 0.5; // Broken — half damage
  if (dur < 20)  return 0.75; // Critical — 75% damage
  return 1.0; // Normal
}

function getWeaponRepairCost(weapon) {
  if (!weapon) return 0;
  var dur = getWeaponDurability(weapon);
  var missing = WEAPON_MAX_DURABILITY - dur;
  var baseCost = weapon.cost || 50;
  return Math.round((missing / WEAPON_MAX_DURABILITY) * baseCost * 0.6);
}
// ── END WEAPON DURABILITY SYSTEM ──

// ── WEAPON RARITY SYSTEM ──
var WEAPON_RARITIES = [
  { id:'common',    label:'Common',    color:'#888',    symbol:'⚪', atkMult:1.0,  dropChance:0.60, specialEffect: null },
  { id:'uncommon',  label:'Uncommon',  color:'#44aa44', symbol:'🟢', atkMult:1.15, dropChance:0.25, specialEffect: 'minor' },
  { id:'rare',      label:'Rare',      color:'#4488cc', symbol:'🔵', atkMult:1.30, dropChance:0.10, specialEffect: 'moderate' },
  { id:'epic',      label:'Epic',      color:'#aa44cc', symbol:'🟣', atkMult:1.50, dropChance:0.04, specialEffect: 'strong' },
  { id:'legendary', label:'Legendary', color:'#cc9944', symbol:'🟡', atkMult:1.75, dropChance:0.009,specialEffect: 'legendary' },
  { id:'mythic',    label:'Mythic',    color:'#cc2222', symbol:'🔴', atkMult:2.20, dropChance:0.001,specialEffect: 'mythic' }
];

var RARITY_EFFECTS = {
  minor: [
    { id:'keen',      name:'Keen',        desc:'+5% critical hit chance.' },
    { id:'swift',     name:'Swift',       desc:'First attack each combat deals +20% damage.' },
  ],
  moderate: [
    { id:'vampiric',  name:'Vampiric',    desc:'Heals 3 HP on every hit.' },
    { id:'serrated',  name:'Serrated',    desc:'15% chance to hit twice per attack.' },
    { id:'weighted',  name:'Weighted',    desc:'Heavy strikes never miss.' },
    { id:'fortune',   name:'Fortune',     desc:'+25% gold from every kill.' },
  ],
  strong: [
    { id:'soulbound', name:'Soulbound',   desc:'Restores 5 SP on every kill.' },
    { id:'thundering',name:'Thundering',  desc:'25% chance to stun enemy on hit.' },
    { id:'cursed',    name:'Cursed',      desc:'+40% damage but you take 3 HP per turn in combat.' },
    { id:'executioner',name:'Executioner',desc:'+50% damage against enemies below 25% HP.' },
  ],
  legendary: [
    { id:'godslayer', name:'Godslayer',   desc:'Deals double damage to bosses.' },
    { id:'phantom',   name:'Phantom',     desc:'Attacks ignore all enemy defense.' },
    { id:'lifesteal', name:'Lifesteal',   desc:'Heals 15% of all damage dealt.' },
  ],
  mythic: [
    { id:'apocalypse',name:'Apocalypse',  desc:'Skills cost 0 SP. All attacks deal +60% damage.' },
    { id:'undying',   name:'Undying',     desc:'Once per floor survive a killing blow at 1 HP.' },
  ]
};

function rollWeaponRarity() {
  var roll = Math.random();
  var cumulative = 0;
  for (var i = WEAPON_RARITIES.length - 1; i >= 0; i--) {
    cumulative += WEAPON_RARITIES[i].dropChance;
    if (roll <= cumulative) return WEAPON_RARITIES[i];
  }
  return WEAPON_RARITIES[0]; // common fallback
}

// Reforging stacked rarities ("Rare Uncommon Iron Sword", attack multiplied
// twice) and a Common roll changed nothing. The weapon is now rebuilt from its
// base every time.
function weaponRarityBase(weapon) {
  var w = Object.assign({}, weapon);
  if (w._rarityBase) {
    w.name = w._rarityBase.name; w.desc = w._rarityBase.desc; w.atkBase = w._rarityBase.atkBase;
    delete w._rarityBase;
  }
  delete w.rarity; delete w.rarityLabel; delete w.rarityColor; delete w.raritySymbol;
  delete w.rarityEffect; delete w.rarityEffectName; delete w.rarityEffectDesc;
  return w;
}
// Re-forging the equipped weapon: keep your attack bonus and the saved copy in step.
function setEquippedWeaponForged(w) {
  var oldAtk = DS.equippedWeaponAtk || getWeaponAtk(DS.equippedWeapon);
  var newAtk = getWeaponAtk(w);
  DS.equippedWeapon = w;
  if (!DS._fromMenu && Array.isArray(oldAtk) && Array.isArray(newAtk)) {
    DS.atkBonus = (DS.atkBonus || 0) - Math.floor((oldAtk[0] + oldAtk[1]) / 2) + Math.floor((newAtk[0] + newAtk[1]) / 2);
  }
  DS.equippedWeaponAtk = newAtk;
  DDStore.setItem('dd_equipped_weapon', JSON.stringify(w));
  updateTopBar();
}

function applyRarityToWeapon(weapon, rarity) {
  if (!rarity || rarity.id === 'common') return weapon;
  var w = Object.assign({}, weapon);
  if (!w._rarityBase) w._rarityBase = { name: w.name, desc: w.desc, atkBase: w.atkBase };
  w.rarity = rarity.id;
  w.rarityLabel = rarity.label;
  w.rarityColor = rarity.color;
  w.raritySymbol = rarity.symbol;
  // Boost ATK
  if (w.atkBase && Array.isArray(w.atkBase)) {
    w.atkBase = w.atkBase.map(function(a){ return Math.round(a * rarity.atkMult); });
  }
  // Add special effect
  if (rarity.specialEffect && RARITY_EFFECTS[rarity.specialEffect]) {
    var effects = RARITY_EFFECTS[rarity.specialEffect];
    var effect = effects[Math.floor(Math.random() * effects.length)];
    w.rarityEffect = effect.id;
    w.rarityEffectName = effect.name;
    w.rarityEffectDesc = effect.desc;
    w.desc = '[' + rarity.label + '] ' + effect.name + ' — ' + effect.desc + ' ' + (w.desc || '');
    w.name = rarity.label + ' ' + w.name;
  }
  return w;
}

// ── END WEAPON RARITY SYSTEM ──

// ── ARMOR RARITY SYSTEM ──
// Mirrors the weapon rarity system above — same WEAPON_RARITIES tier/drop-chance
// table (a generic rarity roll, not actually weapon-specific), a parallel
// effects table themed around defense instead of offense, and the same
// apply-on-drop pattern.
var ARMOR_RARITY_EFFECTS = {
  minor: [
    { id:'sturdy',      name:'Sturdy',      desc:'5% chance to fully block an attack.' },
    { id:'light-step',  name:'Light Step',  desc:'+10% flee chance.' },
  ],
  moderate: [
    { id:'regenerating',name:'Regenerating',desc:'Heals 3 HP at the start of every enemy turn.' },
    { id:'thorned',     name:'Thorned',     desc:'Reflects 15% of damage taken back at the attacker.' },
  ],
  strong: [
    { id:'fortified',   name:'Fortified',   desc:'-15% all incoming damage.' },
    { id:'vengeful',    name:'Vengeful',    desc:'20% chance to counter for your own attack damage when hit.' },
  ],
  legendary: [
    { id:'juggernaut',  name:'Juggernaut',  desc:'Immune to being frozen.' },
    { id:'unbreakable', name:'Unbreakable', desc:'No single hit can deal more than 25% of your max HP.' },
  ],
  mythic: [
    { id:'sanctuary',   name:'Sanctuary',   desc:'Once per floor, survive a killing blow at 1 HP.' },
    { id:'aegis',       name:'Aegis',       desc:'-40% damage taken, but -20% damage dealt.' },
  ]
};

function applyRarityToArmor(armor, rarity) {
  if (!rarity || rarity.id === 'common') return armor;
  var a = Object.assign({}, armor);
  a.rarity = rarity.id;
  a.rarityLabel = rarity.label;
  a.rarityColor = rarity.color;
  a.raritySymbol = rarity.symbol;
  // Boost DEF
  if (typeof a.defBase === 'number') {
    a.defBase = Math.round(a.defBase * rarity.atkMult);
  }
  // Add special effect
  if (rarity.specialEffect && ARMOR_RARITY_EFFECTS[rarity.specialEffect]) {
    var effects = ARMOR_RARITY_EFFECTS[rarity.specialEffect];
    var effect = effects[Math.floor(Math.random() * effects.length)];
    a.rarityEffect = effect.id;
    a.rarityEffectName = effect.name;
    a.rarityEffectDesc = effect.desc;
    a.desc = '[' + rarity.label + '] ' + effect.name + ' — ' + effect.desc + ' ' + (a.desc || '');
    a.name = rarity.label + ' ' + a.name;
  }
  return a;
}
// ── END ARMOR RARITY SYSTEM ──

// ── RARITY EFFECTS GUIDE ──
function openRarityGuide() {
  var ov = document.getElementById('ov-rarity-guide');
  if (!ov) return;
  renderRarityGuide();
  ov.style.display = 'flex';
  say('Rarity Effects Guide.');
}

function closeRarityGuide() {
  var ov = document.getElementById('ov-rarity-guide');
  if (ov) ov.style.display = 'none';
}

function renderRarityGuide() {
  var c = document.getElementById('rarity-guide-content');
  if (!c) return;
  var html = '';
  WEAPON_RARITIES.forEach(function(tier) {
    if (!tier.specialEffect) return; // Common has no effects
    var weaponEffects = RARITY_EFFECTS[tier.specialEffect] || [];
    var armorEffects = ARMOR_RARITY_EFFECTS[tier.specialEffect] || [];
    html += '<div style="margin-bottom:18px;">';
    html += '<div style="font-family:Cinzel,serif;font-size:0.78rem;color:' + tier.color + ';margin-bottom:8px;border-bottom:1px solid #222;padding-bottom:4px;">' + tier.symbol + ' ' + tier.label + '</div>';
    weaponEffects.forEach(function(e) {
      html += '<div style="margin-bottom:6px;padding-left:6px;border-left:2px solid ' + tier.color + ';">' +
        '<span style="font-family:Cinzel,serif;font-size:0.68rem;color:#ddd;">⚔ ' + e.name + '</span>' +
        '<span style="font-size:0.62rem;color:#888;"> — ' + e.desc + '</span></div>';
    });
    armorEffects.forEach(function(e) {
      html += '<div style="margin-bottom:6px;padding-left:6px;border-left:2px solid ' + tier.color + ';">' +
        '<span style="font-family:Cinzel,serif;font-size:0.68rem;color:#ddd;">🛡 ' + e.name + '</span>' +
        '<span style="font-size:0.62rem;color:#888;"> — ' + e.desc + '</span></div>';
    });
    html += '</div>';
  });
  c.innerHTML = html;
}
// ── END RARITY EFFECTS GUIDE ──

var BLACKSMITH_WEAPONS = [
  { id:'starter-blade',  name:'Worn Blade',      icon:'🗡️', type:'weapon', weaponType:'sword',  level:1, cost:0,   atkBase:[4,8],  isEquippable:true, desc:'A battered but reliable blade. Free for any new adventurer.' },
  { id:'iron-sword',     name:'Iron Sword',       icon:'⚔️', type:'weapon', weaponType:'sword',  level:1, cost:40,  atkBase:[5,10], isEquippable:true, desc:'Standard iron. Reliable in any dungeon.' },
  { id:'hunters-bow',    name:'Hunter\'s Bow',    icon:'🏹', type:'weapon', weaponType:'bow',    level:1, cost:50,  atkBase:[4,9],  isEquippable:true, desc:'Quick to draw. Good attack range.' },
  { id:'oak-staff',      name:'Oak Staff',        icon:'🪄', type:'weapon', weaponType:'staff',  level:1, cost:55,  atkBase:[4,8],  isEquippable:true, desc:'Channels arcane energy. Restores 10 SP on equip.' },
  { id:'battle-axe',     name:'Battle Axe',       icon:'🪓', type:'weapon', weaponType:'axe',    level:1, cost:70,  atkBase:[7,13], isEquippable:true, desc:'Heavy and slow but devastating damage.' },
  { id:'shadow-dagger',  name:'Shadow Dagger',    icon:'🔪', type:'weapon', weaponType:'dagger', level:1, cost:65,  atkBase:[5,9],  isEquippable:true, desc:'Fast strikes. Higher crit chance.' },
  { id:'war-hammer',     name:'War Hammer',       icon:'🔨', type:'weapon', weaponType:'hammer', level:1, cost:80,  atkBase:[7,14], isEquippable:true, desc:'Crushes through armor. Ignores 2 enemy defense.' },
  { id:'silver-rapier',  name:'Silver Rapier',    icon:'🤺', type:'weapon', weaponType:'sword',  level:2, cost:120, atkBase:[6,11], isEquippable:true, desc:'Elegant and precise. Level 2 right out of the forge.' },
  { id:'soul-drinker',   name:'Soul Drinker',     icon:'🩸', type:'weapon', weaponType:'sword',  level:1, cost:130, atkBase:[5,10], isEquippable:true, soulDrinker:true, desc:'Heals 5 HP on every kill. Thirsty blade.' },
  { id:'thunderfist',    name:'Thunderfist',      icon:'⚡', type:'weapon', weaponType:'hammer', level:1, cost:140, atkBase:[6,12], isEquippable:true, stunChance:0.30, desc:'30% chance to stun enemy — they skip their next attack.' },
  { id:'last-blade',     name:'The Last Blade',   icon:'💔', type:'weapon', weaponType:'sword',  level:10,cost:200, atkBase:[9,16], isEquippable:true, degrading:true, desc:'Starts at level 10 but degrades one level per floor. Use it while it lasts.' },
];

var BLACKSMITH_ARMORS = [
  { id:'leather-vest',   name:'Leather Vest',      icon:'🦺', type:'armor', armorType:'light',  level:1, cost:50,  defBase:3, isEquippable:true, desc:'Light leather. +3 defense. Doesn\'t slow you down.' },
  { id:'chain-mail',     name:'Chain Mail',         icon:'⛓️', type:'armor', armorType:'medium', level:1, cost:80,  defBase:5, isEquippable:true, desc:'Linked iron rings. +5 defense. Balanced protection.' },
  { id:'iron-plate',     name:'Iron Plate',         icon:'🛡️', type:'armor', armorType:'heavy',  level:1, cost:110, defBase:8, isEquippable:true, desc:'Heavy iron plate. +8 defense. -1 attack. Worth it.' },
  { id:'ember-shield',   name:'Ember Shield',       icon:'🔥', type:'armor', armorType:'medium', level:1, cost:140, defBase:6, isEquippable:true, desc:'Forged in ashbound fire. +6 defense. Resists heat.' },
  { id:'void-cloak',     name:'Void Cloak',         icon:'🌑', type:'armor', armorType:'light',  level:1, cost:160, defBase:4, isEquippable:true, desc:'Woven from void silk. +4 defense. +5% dodge chance.' },
  { id:'thornmail',      name:'Thornmail',          icon:'🌵', type:'armor', armorType:'medium', level:1, cost:180, defBase:5, isEquippable:true, thornReflect:0.20, desc:'+5 defense. Reflects 20% of incoming damage back at attacker.' },
  { id:'ghost-shroud',   name:'Ghost Shroud',       icon:'👻', type:'armor', armorType:'light',  level:1, cost:200, defBase:3, isEquippable:true, ghostDodge:0.10, desc:'+3 defense. 10% chance to become untargetable for one turn.' },
];

function renderReforgePanel() {
  var c = document.getElementById('bs-reforge-content');
  if (!c) return;
  var weapon = DS.equippedWeapon;
  if (!weapon) {
    c.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;padding:20px;text-align:center;">No weapon equipped. Equip a weapon from the Inventory tab first.</div>';
    return;
  }
  var currentRar = weapon.rarity || 'common';
  var currentIdx = WEAPON_RARITIES.findIndex(function(r){ return r.id === currentRar; });
  var reforgeCost = [0, 80, 150, 300, 600, 1200][currentIdx] || 80;
  var upgradeCost = [100, 200, 400, 800, 1600, 9999][currentIdx] || 100;
  var nextRar = WEAPON_RARITIES[Math.min(currentIdx + 1, WEAPON_RARITIES.length - 1)];
  var rarDisplay = weapon.raritySymbol ? weapon.raritySymbol + ' ' + weapon.rarityLabel : '⚪ Common';

  c.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:#e0c080;margin-bottom:4px;">' + (weapon.icon||'⚔️') + ' ' + weapon.name + '</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#888;margin-bottom:16px;">Current rarity: ' + rarDisplay + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
    '<button type="button" onclick="reforgeWeapon(' + reforgeCost + ')" style="padding:12px;background:#0a0800;border:1px solid #cc9944;color:#ffaa00;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;" aria-label="Reforge weapon for ' + reforgeCost + ' gold — random new rarity">🎲 Reforge — ' + reforgeCost + 'g (Random rarity)</button>' +
    (currentIdx < WEAPON_RARITIES.length - 1 ?
    '<button type="button" onclick="upgradeWeaponRarity(' + upgradeCost + ')" style="padding:12px;background:#0a0800;border:1px solid #6644aa;color:#bb88ff;font-family:Cinzel,serif;font-size:0.7rem;cursor:pointer;" aria-label="Upgrade to ' + nextRar.label + ' for ' + upgradeCost + ' gold">⬆ Upgrade to ' + nextRar.label + ' — ' + upgradeCost + 'g</button>' : '') +
    '</div>';
}

function reforgeWeapon(cost) {
  var gold = DS._fromMenu ? getGlobalGold() : DS.gold;
  if (gold < cost) { say('Not enough gold. Need ' + cost + ' gold.'); return; }
  if (DS._fromMenu) addGlobalGold(-cost); else DS.gold -= cost;
  var newRarity = rollWeaponRarity();
  setEquippedWeaponForged(applyRarityToWeapon(weaponRarityBase(DS.equippedWeapon), newRarity));
  updateBsGoldDisplay();
  renderReforgePanel();
  var msg = 'Reforged! New rarity: ' + (newRarity.raritySymbol || '') + ' ' + newRarity.label + '.';
  say(msg);
  saveProgress();
}

function upgradeWeaponRarity(cost) {
  var gold = DS._fromMenu ? getGlobalGold() : DS.gold;
  if (gold < cost) { say('Not enough gold. Need ' + cost + ' gold.'); return; }
  if (DS._fromMenu) addGlobalGold(-cost); else DS.gold -= cost;
  var currentIdx = WEAPON_RARITIES.findIndex(function(r){ return r.id === (DS.equippedWeapon.rarity || 'common'); });
  var nextRar = WEAPON_RARITIES[Math.min(currentIdx + 1, WEAPON_RARITIES.length - 1)];
  setEquippedWeaponForged(applyRarityToWeapon(weaponRarityBase(DS.equippedWeapon), nextRar));
  updateBsGoldDisplay();
  renderReforgePanel();
  var msg = 'Weapon upgraded to ' + nextRar.label + '! ' + (nextRar.raritySymbol || '') + ' ' + nextRar.label + '.';
  say(msg);
  saveProgress();
}

function updateBsGoldDisplay() {
  var fromMenu = DS._fromMenu;
  var inSpire = !fromMenu && SPIRE && SPIRE.active;
  var playerGold = fromMenu ? getGlobalGold() : inSpire ? SPIRE.gold : (DS.gold || 0);
  var goldEl = document.getElementById('bs-gold-display');
  if (goldEl) goldEl.textContent = '💰 Gold: ' + playerGold + 'g';
}

function switchBlacksmithTab(tab) {
  updateBsGoldDisplay();
  ['upgrade','shop','armor','sell','inv','reforge','guns'].forEach(function(t) {
    var btn = document.getElementById('bs-tab-' + t);
    var panel = document.getElementById('bs-panel-' + t);
    if (btn) { btn.style.background='#0a0800'; btn.style.borderColor='#555'; btn.style.color='#888'; btn.setAttribute('aria-selected','false'); }
    if (panel) panel.style.display='none';
  });
  var activeBtn = document.getElementById('bs-tab-' + tab);
  var activePanel = document.getElementById('bs-panel-' + tab);
  if (activeBtn) { activeBtn.style.background='#1a1000'; activeBtn.style.borderColor='#ffaa00'; activeBtn.style.color='#ffaa00'; activeBtn.setAttribute('aria-selected','true'); }
  if (activePanel) activePanel.style.display='';
  if (tab === 'upgrade') {
    say('Upgrade tab. Upgrade your equipped gear.');
    // Add durability display
    setTimeout(function() {
      var panel = document.getElementById('bs-panel-upgrade');
      if (panel && !panel.querySelector('.dur-display')) {
        var durDiv = document.createElement('div');
        durDiv.className = 'dur-display';
        durDiv.innerHTML = renderWeaponDurabilityInUpgrade();
        panel.appendChild(durDiv);
      } else if (panel) {
        var durDiv2 = panel.querySelector('.dur-display');
        if (durDiv2) durDiv2.innerHTML = renderWeaponDurabilityInUpgrade();
      }
    }, 100);
  }
  else if (tab === 'shop') { renderBlacksmithShop(); say('Buy Weapons tab.'); }
  else if (tab === 'armor') { renderBlacksmithArmor(); say('Armor tab. Buy armor to increase defense.'); }
  else if (tab === 'sell') { renderBlacksmithSell(); say('Sell tab. Sell items from your inventory for gold.'); }
  else if (tab === 'inv') { renderBlacksmithInv(); say('Inventory tab. View your items and equip gear.'); }
  else if (tab === 'reforge') { renderReforgePanel(); say('Reforge tab. Spend gold to reroll your weapon rarity.'); }
  else if (tab === 'guns') { renderBlacksmithGuns(); say('Guns tab. Buy guns with diamonds. Equip them to use in combat.'); }
}

function renderBlacksmithGuns() {
  var diamonds = getDiamonds();
  var owned = getOwnedGuns();
  var equipped = getEquippedGun();
  var bsDiamondDisplay = document.getElementById('bs-diamond-display');
  if (bsDiamondDisplay) bsDiamondDisplay.textContent = '💎 Diamonds: ' + diamonds;
  var container = document.getElementById('bs-guns-content');
  if (!container) return;
  container.innerHTML = '';

  // ── OWNED GUNS SECTION (always at top) ──
  if (owned.length > 0) {
    var ownedHeader = document.createElement('div');
    ownedHeader.style.cssText = 'font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.2em;color:#44aa44;margin-bottom:8px;';
    ownedHeader.textContent = '✓ YOUR GUNS — EQUIP BELOW';
    container.appendChild(ownedHeader);

    owned.forEach(function(gunId) {
      var gun = getGunDef(gunId);
      if (!gun) return;
      var isEquipped = equipped && equipped.id === gunId;
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;justify-content:space-between;align-items:center;border:1px solid ' + (isEquipped ? '#ff6622' : '#44aa44') + ';padding:10px 12px;margin-bottom:6px;background:#0a0800;';
      var info = document.createElement('span');
      info.style.cssText = 'font-family:Cinzel,serif;font-size:0.7rem;color:' + (isEquipped ? '#ff6622' : '#ffaa00') + ';';
      info.textContent = gun.icon + ' ' + gun.name + (isEquipped ? ' ✓' : '');
      var eBtn = document.createElement('button');
      eBtn.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:7px 14px;background:#0a0800;border:1px solid ' + (isEquipped ? '#ff6622' : '#44aa44') + ';color:' + (isEquipped ? '#ff6622' : '#44aa44') + ';cursor:pointer;';
      eBtn.textContent = isEquipped ? 'Unequip' : '⚡ Equip';
      eBtn.setAttribute('aria-label', isEquipped ? 'Unequip ' + gun.name : 'Equip ' + gun.name);
      (function(g, eq) {
        eBtn.onclick = function() {
          if (eq) { unequipGun(); say(g.name + ' unequipped.'); }
          else { equipGun(g.id); say(g.name + ' equipped. A gun button will now appear in combat.'); }
          renderBlacksmithGuns();
        };
      })(gun, isEquipped);
      row.appendChild(info);
      row.appendChild(eBtn);
      container.appendChild(row);
    });

    var divider = document.createElement('div');
    divider.style.cssText = 'border-top:1px solid #222;margin:14px 0;';
    container.appendChild(divider);

    var shopHeader = document.createElement('div');
    shopHeader.style.cssText = 'font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.2em;color:#888;margin-bottom:8px;';
    shopHeader.textContent = '🔫 BUY MORE GUNS';
    container.appendChild(shopHeader);
  }

  // ── BUY SECTION ──
  GUN_DEFS.forEach(function(gun) {
    var isOwned = owned.indexOf(gun.id) !== -1;
    if (isOwned) return; // already shown above
    var canAfford = diamonds >= gun.diamondCost;
    var div = document.createElement('div');
    div.style.cssText = 'border:1px solid #333;padding:12px;margin-bottom:10px;background:#0a0800;';
    div.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:#ffaa00;margin-bottom:4px;">' + gun.icon + ' ' + gun.name + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#888;margin-bottom:6px;">' + gun.desc + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#aaa;margin-bottom:8px;">' +
        '⚔ Damage: ' + gun.dmgMin + '-' + gun.dmgMax + ' &nbsp;|&nbsp; ' +
        '🔫 Shots: ' + gun.shots + ' &nbsp;|&nbsp; ' +
        '⏱ Cooldown: ' + gun.cooldown + 's' +
      '</div>';
    var buyBtn = document.createElement('button');
    buyBtn.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:8px 14px;background:#0a0800;border:1px solid ' + (canAfford ? '#88ddff' : '#333') + ';color:' + (canAfford ? '#88ddff' : '#555') + ';cursor:' + (canAfford ? 'pointer' : 'default') + ';';
    buyBtn.disabled = !canAfford;
    buyBtn.textContent = canAfford ? '💎 Buy — ' + gun.diamondCost + ' diamonds' : '💎 ' + gun.diamondCost + ' diamonds (need more)';
    buyBtn.setAttribute('aria-label', gun.name + '. ' + gun.desc + '. Costs ' + gun.diamondCost + ' diamonds. ' + (canAfford ? 'Press to buy.' : 'Cannot afford.'));
    (function(g) { buyBtn.onclick = function() { buyGunWithDiamonds(g.id); }; })(gun);
    div.appendChild(buyBtn);
    container.appendChild(div);
  });

  if (owned.length === 0) {
    var tip = document.createElement('div');
    tip.style.cssText = 'font-family:Cinzel,serif;font-size:0.6rem;color:#555;margin-top:10px;line-height:1.7;';
    tip.textContent = 'Earn diamonds by defeating dungeon bosses (20% drop chance) or by crafting guns at the Home crafting station using gun parts found in dungeons.';
    container.appendChild(tip);
  }
}

function buyGunWithDiamonds(gunId) {
  var gun = getGunDef(gunId);
  if (!gun) return;
  if (hasGun(gunId)) { say('You already own the ' + gun.name + '.'); return; }
  if (!spendDiamonds(gun.diamondCost)) {
    say('Not enough diamonds. You need ' + gun.diamondCost + ' diamonds to buy the ' + gun.name + '.');
    return;
  }
  addOwnedGun(gunId);
  say('You bought the ' + gun.name + '! Scroll down in this tab to find your gun and press Equip.');
  renderBlacksmithGuns();
  sfx('sfx-unlock');
}

function renderWeaponDurabilityInUpgrade() {
  var weapon = DS.equippedWeapon;
  if (!weapon) return '';
  var dur = getWeaponDurability(weapon);
  var dl = getDurabilityLabel(dur);
  var repairCost = getWeaponRepairCost(weapon);
  if (dur >= 100) return '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#44cc44;margin-top:10px;">✅ Weapon durability: Perfect (100/100)</div>';
  return '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:' + dl.color + ';margin-top:10px;">⚠ Durability: ' + dl.label + ' (' + dur + '/100)</div>' +
    '<button type="button" onclick="repairWeapon()" style="margin-top:6px;width:100%;padding:8px;background:#0a0800;border:1px solid #cc9944;color:#ffaa00;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;" aria-label="Repair weapon for ' + repairCost + ' gold">🔧 Repair — ' + repairCost + 'g</button>';
}

function repairWeapon() {
  var weapon = DS.equippedWeapon;
  if (!weapon) { say('No weapon equipped.'); return; }
  var cost = getWeaponRepairCost(weapon);
  var gold = DS._fromMenu ? getGlobalGold() : DS.gold;
  if (cost === 0) { say('Weapon is already in perfect condition.'); return; }
  if (gold < cost) { say('Not enough gold. Need ' + cost + ' gold to repair.'); return; }
  if (DS._fromMenu) addGlobalGold(-cost); else DS.gold -= cost;
  weapon.durability = WEAPON_MAX_DURABILITY;
  updateBsGoldDisplay();
  say('Weapon repaired to perfect condition for ' + cost + ' gold!');
  // Refresh upgrade panel
  var upgradePanel = document.getElementById('bs-panel-upgrade');
  if (upgradePanel) {
    var durDiv = upgradePanel.querySelector('.dur-display');
    if (durDiv) durDiv.innerHTML = renderWeaponDurabilityInUpgrade();
  }
  saveProgress();
}

function renderBlacksmithInv() {
  var content = document.getElementById('blacksmith-inv-content');
  if (!content) return;
  content.innerHTML = '';

  // Load equipped gear from storage
  var equippedWeapon = DS.equippedWeapon;
  var equippedArmor = DS.equippedArmor;
  if (!equippedWeapon) {
    try { equippedWeapon = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null'); } catch(e) {}
  }
  if (!equippedArmor) {
    try { equippedArmor = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null'); } catch(e) {}
  }

  var inv = getGlobalInventory();

  // Show equipped gear first
  var eqSection = document.createElement('div');
  eqSection.style.cssText = 'margin-bottom:14px;';
  eqSection.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);margin-bottom:8px;">EQUIPPED</div>';

  [['weapon', equippedWeapon], ['armor', equippedArmor]].forEach(function(pair) {
    var type = pair[0], item = pair[1];
    var row = document.createElement('div');
    row.style.cssText = 'background:#1a0a00;border:1px solid #443300;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;';
    if (item) {
      row.setAttribute('tabindex','0');
      row.setAttribute('aria-label', 'Equipped ' + item.name + '. Tap to unequip.');
      row.innerHTML = '<div style="flex:1;font-family:Cinzel,serif;font-size:0.72rem;color:#e0c080;">' + (item.icon||'') + ' ' + item.name + ' Lv' + (item.level||1) + '</div>';
      var unBtn = document.createElement('button');
      unBtn.style.cssText = 'padding:4px 10px;background:#0a0500;border:1px solid #664400;color:#aa6622;font-family:Cinzel,serif;font-size:0.62rem;cursor:pointer;';
      unBtn.textContent = 'Unequip';
      unBtn.setAttribute('aria-label', 'Unequip ' + item.name);
      unBtn.onclick = function() {
        if (type === 'weapon') { DS.equippedWeapon = item; unequipWeapon(); }
        else { DS.equippedArmor = item; unequipArmor(); }
        renderBlacksmithInv();
        renderBlacksmith();
      };
      row.appendChild(unBtn);
    } else {
      row.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#444;">No ' + type + ' equipped</div>';
    }
    eqSection.appendChild(row);
  });
  content.appendChild(eqSection);

  // Show inventory items
  var invTitle = document.createElement('div');
  invTitle.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);margin-bottom:8px;';
  invTitle.textContent = 'INVENTORY (' + inv.length + ' items)';
  content.appendChild(invTitle);

  if (!inv.length) {
    var empty = document.createElement('div');
    empty.style.cssText = 'font-family:Cinzel,serif;font-size:0.68rem;color:#444;padding:10px;';
    empty.textContent = 'Inventory empty. Buy weapons and armor from the other tabs.';
    content.appendChild(empty);
    return;
  }

  inv.forEach(function(item, idx) {
    var row = document.createElement('div');
    row.style.cssText = 'background:#0a0500;border:1px solid #221100;padding:8px 10px;margin-bottom:6px;display:flex;align-items:center;gap:8px;';
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label', (item.icon||'') + ' ' + item.name + (item.level > 1 ? ' Level ' + item.level : '') + '. ' + (item.desc||''));

    var info = document.createElement('div');
    info.style.cssText = 'flex:1;font-family:Cinzel,serif;font-size:0.72rem;color:#cc9944;';
    info.textContent = (item.icon||'') + ' ' + item.name + (item.level > 1 ? ' Lv'+item.level : '');

    row.appendChild(info);

    if (item.isEquippable && (item.type === 'weapon' || item.type === 'armor')) {
      var eqBtn = document.createElement('button');
      eqBtn.style.cssText = 'padding:4px 10px;background:#0a0a00;border:1px solid #ffaa00;color:#ffaa00;font-family:Cinzel,serif;font-size:0.62rem;cursor:pointer;';
      eqBtn.textContent = 'Equip';
      eqBtn.setAttribute('aria-label', 'Equip ' + item.name);
      eqBtn.onclick = function() {
        if (item.type === 'weapon') equipWeapon(item);
        else equipArmor(item);
        renderBlacksmithInv();
        renderBlacksmith();
      };
      row.appendChild(eqBtn);
    }

    content.appendChild(row);
  });
}

function getSellPrice(item) {
  if (!item) return 0;
  var level = item.level || 1;
  if (item.type === 'potion') return item.heal ? Math.floor(item.heal * 0.15) : 5;
  if (item.type === 'gem') return item.gold || 10;
  if (item.type === 'ring') return 15;
  if (item.type === 'weapon') return (item.cost ? Math.floor(item.cost * 0.35) : 20) + (level - 1) * 15;
  if (item.type === 'armor') return (item.cost ? Math.floor(item.cost * 0.35) : 15) + (level - 1) * 10;
  return 5;
}

function renderBlacksmithSell() {
  updateBsGoldDisplay();
  var content = document.getElementById('blacksmith-sell-content');
  if (!content) return;
  content.innerHTML = '';
  var fromMenu = DS._fromMenu;
  var inv = fromMenu ? getGlobalInventory() : (DS.inventory || []);
  if (!inv.length) {
    content.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;padding:20px;">Inventory empty. Find items in dungeons or buy from the shop.</div>';
    say('Inventory empty. Nothing to sell.');
    return;
  }
  var title = document.createElement('div');
  title.style.cssText = 'font-family:Cinzel,serif;font-size:0.7rem;color:#888;margin-bottom:12px;';
  title.textContent = inv.length + ' items — tap to sell';
  content.appendChild(title);
  inv.forEach(function(item, idx) {
    var price = getSellPrice(item);
    var row = document.createElement('div');
    row.style.cssText = 'background:#0a0500;border:1px solid #221100;padding:10px;margin-bottom:8px;display:flex;align-items:center;gap:10px;';
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label', (item.icon||'') + ' ' + item.name + '. Sell for ' + price + ' gold.');
    var info = document.createElement('div');
    info.style.cssText = 'flex:1;';
    info.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:#e0c080;">' + (item.icon||'') + ' ' + item.name + (item.level > 1 ? ' Lv' + item.level : '') + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#666;">' + (item.desc||item.type||'') + '</div>';
    var btn = document.createElement('button');
    btn.style.cssText = 'padding:6px 14px;background:#1a0800;border:1px solid #aa6622;color:#cc8844;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;flex-shrink:0;';
    btn.textContent = '💰 ' + price + 'g';
    btn.setAttribute('aria-label', 'Sell ' + item.name + ' for ' + price + ' gold');
    btn.onclick = (function(i, x) { return function() { sellItem(i, x); }; })(item, idx);
    row.appendChild(info);
    row.appendChild(btn);
    content.appendChild(row);
  });
}

function sellItem(item, idx) {
  var fromMenu = DS._fromMenu;
  var price = getSellPrice(item);
  if (fromMenu) {
    var globalInv = getGlobalInventory().filter(function(i, x) { return x !== idx; });
    saveGlobalInventory(globalInv);
    addGlobalGold(price);
  } else {
    DS.inventory = DS.inventory.filter(function(i, x) { return x !== idx; });
    DS.gold += price;
    addGlobalGold(price);
    updateTopBar();
  }
  var totalSells = parseInt(DDStore.getItem('dd_total_sells') || '0') + 1;
  DDStore.setItem('dd_total_sells', String(totalSells));
  var totalSpent = parseInt(DDStore.getItem('dd_total_gold_spent') || '0');
  var totalGold = parseInt(DDStore.getItem('dd_total_gold_earned') || '0') + price;
  DDStore.setItem('dd_total_gold_earned', String(totalGold));
  sfx('sfx-purchase');
  say('Sold ' + item.name + ' for ' + price + ' gold.');
  if (totalSells >= 1) awardAchievement('ach-first-sale');
  if (totalSells >= 5) awardAchievement('ach-merchant');
  if (totalSells >= 20) awardAchievement('ach-black-market');
  renderBlacksmithSell();
  if (!fromMenu) renderInv();
}

function renderBlacksmithArmor() {
  updateBsGoldDisplay();
  var content = document.getElementById('blacksmith-armor-content');
  if (!content) return;
  content.innerHTML = '';
  var fromMenu = DS._fromMenu;
  var playerGold = fromMenu ? getGlobalGold() : DS.gold || 0;

  var title = document.createElement('div');
  title.style.cssText = 'font-family:Cinzel,serif;font-size:0.7rem;color:#888;margin-bottom:12px;';
  title.textContent = 'Buy Armor — ' + playerGold + 'g available';
  content.appendChild(title);

  BLACKSMITH_ARMORS.forEach(function(armor) {
    var owned = getGlobalInventory().some(function(i){ return i.id === armor.id; }) ||
                (DS.equippedArmor && DS.equippedArmor.id === armor.id);
    var canAfford = playerGold >= armor.cost;

    var row = document.createElement('div');
    row.style.cssText = 'background:#0a0a00;border:1px solid #332200;padding:10px;margin-bottom:8px;';
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label', t(armor.name) + '. ' + t(armor.desc) + '. ' + t('Cost') + ': ' + armor.cost + ' ' + t('gold') + '.');

    var btn = document.createElement('button');
    btn.style.cssText = 'float:right;padding:6px 14px;font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;border:1px solid ' + (owned ? '#446644' : canAfford ? '#ffaa00' : '#444') + ';background:#1a1000;color:' + (owned ? '#44aa44' : canAfford ? '#ffaa00' : '#555') + ';';
    btn.textContent = owned ? '✅ ' + t('Owned') : armor.cost + 'g';
    btn.setAttribute('aria-label', owned ? t('Already owned') : t('Buy') + ' ' + t(armor.name) + ' ' + t('for') + ' ' + armor.cost + ' ' + t('gold'));
    if (!owned) {
      btn.onclick = function() { buyBlacksmithArmor(armor); };
    }

    row.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:#e0c080;">' + armor.icon + ' ' + t(armor.name) + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#666;margin-top:3px;">' + t(armor.desc) + '</div>';
    row.appendChild(btn);
    content.appendChild(row);
  });
}

function buyBlacksmithArmor(armor) {
  var fromMenu = DS._fromMenu;
  var playerGold = fromMenu ? getGlobalGold() : DS.gold || 0;
  if (playerGold < armor.cost) { say('Not enough gold. Need ' + armor.cost + 'g.'); return; }

  if (fromMenu) { spendGlobalGold(armor.cost); }
  else { DS.gold -= armor.cost; spendGlobalGold(armor.cost); updateTopBar(); }

  var item = Object.assign({}, armor);
  addToGlobalInventory(item);
  if (!fromMenu) DS.inventory.push(item);

  sfx('sfx-purchase');
  say('Purchased ' + armor.name + '. Open inventory to equip it.');
  renderBlacksmithArmor();
}

function renderBlacksmithShop() {
  updateBsGoldDisplay();
  var content = document.getElementById('blacksmith-shop-content');
  if (!content) return;
  content.innerHTML = '';
  var fromMenu = DS._fromMenu;
  var inSpire = !fromMenu && SPIRE && SPIRE.active;
  var playerGold = fromMenu ? getGlobalGold() : inSpire ? SPIRE.gold : (DS.gold || 0);
  var spireChar = inSpire ? CHARS[SPIRE.charIdx] : null;
  var isBlacksmith = fromMenu ? false : inSpire ? (spireChar && spireChar.prof === 'Blacksmith') : DS.prof === 'Blacksmith';
  var starterGiven = DDStore.getItem('dd_starter_weapon_given') === '1';

  // Read discount from any source — seasonal shops, birthday code, Time Eater
  var totalDiscount = 0;
  var discountSource = '';
  try {
    var discRaw = DDStore.getItem('dd_blacksmith_discount');
    if (discRaw) {
      var discData = JSON.parse(discRaw);
      if (typeof discData === 'number') {
        // Birthday code saves as plain number — permanent
        totalDiscount = discData;
        discountSource = DDStore.getItem('dd_blacksmith_discount_source') || 'Promo';
      } else if (discData && typeof discData === 'object') {
        // Seasonal shops save as {pct, expires, source}
        if (!discData.expires || discData.expires > Date.now()) {
          totalDiscount = discData.pct || 0;
          discountSource = discData.source || 'Event';
        } else {
          DDStore.removeItem('dd_blacksmith_discount');
        }
      }
    }
  } catch(e2) {
    // Plain float string fallback
    totalDiscount = parseFloat(DDStore.getItem('dd_blacksmith_discount') || '0') || 0;
  }

  var discountMult = isBlacksmith ? (0.9 * (1 - totalDiscount)) : (1 - totalDiscount);
  var discountLabel = totalDiscount > 0 && isBlacksmith
    ? ' (10% Blacksmith + ' + Math.round(totalDiscount*100) + '% ' + discountSource + ' discount!)'
    : isBlacksmith ? ' (10% Blacksmith discount)'
    : totalDiscount > 0 ? ' (' + Math.round(totalDiscount*100) + '% ' + discountSource + ' discount!)'
    : '';

  // Gold display
  var goldDiv = document.createElement('div');
  goldDiv.style.cssText = 'font-family:Cinzel,serif;font-size:0.72rem;color:#ffdd44;margin-bottom:12px;';
  goldDiv.textContent = '💰 ' + playerGold + ' gold available' + discountLabel;
  content.appendChild(goldDiv);

  // Build weapon list — add Cinco de Mayo exclusive if active today
  var ev = getEventBonuses();
  var weaponList = BLACKSMITH_WEAPONS.slice();
  if (ev && ev.cincoWeapon) {
    var alreadyHasTaco = getGlobalInventory().some(function(i){ return i.id==='taco-blade'; }) || (DS.equippedWeapon && DS.equippedWeapon.id==='taco-blade');
    if (!alreadyHasTaco) weaponList.unshift(CINCO_WEAPON);
  }
  weaponList.forEach(function(w) {
    var isFree = w.cost === 0;
    var alreadyClaimed = isFree && starterGiven;
    var finalCost = isFree ? 0 : Math.round(w.cost * discountMult);
    var canAfford = isFree ? !alreadyClaimed : playerGold >= finalCost;

    var div = document.createElement('div');
    div.style.cssText = 'background:#0a0800;border:1px solid ' + (isFree && !alreadyClaimed ? '#ffaa00' : '#2a2010') + ';padding:12px;margin-bottom:8px;display:flex;align-items:center;gap:12px;';

    var info = document.createElement('div');
    info.style.cssText = 'flex:1;';
    var atkRange = w.atkBase ? ' <span style="color:#ff9944;font-size:0.62rem;">(' + w.atkBase[0] + '-' + w.atkBase[1] + ' atk)</span>' : '';
    info.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:' + (alreadyClaimed?'#555':'#e0c080') + ';margin-bottom:2px;">' + w.icon + ' ' + t(w.name) + (w.level > 1 ? ' <span style="color:#88aaff;font-size:0.65rem;">Lv' + w.level + '</span>' : '') + (isFree ? ' <span style="color:#ffaa00;font-size:0.6rem;">[' + t('FREE') + ']</span>' : '') + atkRange + '</div>' +
      '<div style="font-size:0.68rem;color:#666;font-style:italic;">' + t(w.desc) + '</div>';
    div.appendChild(info);

    var btn = document.createElement('button');
    btn.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:6px 12px;background:' + (canAfford?'#1a1000':'#0a0a0a') + ';border:1px solid ' + (canAfford?'#ffaa00':'#333') + ';color:' + (canAfford?'#ffaa00':'#444') + ';cursor:' + (canAfford?'pointer':'default') + ';white-space:nowrap;';
    btn.disabled = !canAfford;
    btn.textContent = alreadyClaimed ? t('Claimed') : isFree ? t('Claim Free') : finalCost + 'g';
    btn.setAttribute('aria-label', alreadyClaimed ? t(w.name) + ' ' + t('already claimed') : (isFree ? t('Claim free') + ' ' + t(w.name) : t('Buy') + ' ' + t(w.name) + ' ' + t('for') + ' ' + finalCost + ' ' + t('gold')));
    if (canAfford) {
      (function(weapon, cost, free) {
        btn.onclick = function() { buyBlacksmithWeapon(weapon, cost, free); };
      })(w, finalCost, isFree);
    }
    div.appendChild(btn);
    content.appendChild(div);
  });
}

function buyBlacksmithWeapon(weapon, cost, isFree) {
  var fromMenu = DS._fromMenu;
  var inSpire = !fromMenu && SPIRE && SPIRE.active;
  var playerGold = fromMenu ? getGlobalGold() : inSpire ? SPIRE.gold : DS.gold;
  if (!isFree && playerGold < cost) { say('Not enough gold.'); return; }
  if (isFree && DDStore.getItem('dd_starter_weapon_given') === '1') { say('Already claimed your starter weapon.'); return; }

  if (!isFree) {
    if (fromMenu) { spendGlobalGold(cost); }
    else if (inSpire) { SPIRE.gold -= cost; spendGlobalGold(cost); spireRenderUI(); }
    else { DS.gold -= cost; spendGlobalGold(cost); updateTopBar(); }
  }
  if (isFree) DDStore.setItem('dd_starter_weapon_given', '1');

  // Add to appropriate inventory
  var item = Object.assign({}, weapon);
  if (fromMenu) {
    addToGlobalInventory(item);
    say('Purchased ' + weapon.name + '. Added to your global inventory. You can equip it in any dungeon or The Spire.');
  } else if (inSpire) {
    if (!SPIRE.inventory) SPIRE.inventory = [];
    SPIRE.inventory.push(item);
    addToGlobalInventory(item);
    say('Purchased ' + weapon.name + '. Added to inventory. Open Inventory to equip it.');
  } else {
    DS.inventory.push(item);
    addToGlobalInventory(item);
    say('Purchased ' + weapon.name + '. Added to your inventory. Open inventory to equip it.');
  }
  sfx('sfx-purchase');
  if (!inSpire && !fromMenu) { updateTopBar(); saveProgress(); }
  renderBlacksmithShop();
  var remaining = fromMenu ? getGlobalGold() : inSpire ? SPIRE.gold : DS.gold;
  say('Gold remaining: ' + remaining + '.');
}

// ── END BLACKSMITH WEAPON SHOP ──

function openMenuBlacksmith() {
  // Use global gold when opening from menu
  DS._fromMenu = true;
  openBlacksmith();
  // Update close button to just close overlay
  setTimeout(function() {
    var closeBtn = document.querySelector('#ov-blacksmith button[onclick="closeBlacksmith()"]');
    if (closeBtn) {
      closeBtn.setAttribute('aria-label', 'Close blacksmith and return to main menu');
      closeBtn.textContent = '← Back to Menu';
    }
  }, 50);
}

function openSpireInventory() {
  SPIRE._invOpen = true;
  spireStopAutoTimer();

  // Combine global inventory + current DS inventory so nothing is missed
  var globalInv = getGlobalInventory();
  var dsInv = (DS && DS.inventory) ? DS.inventory : [];
  // Merge — avoid duplicates by id
  var seen = {};
  var combined = [];
  globalInv.forEach(function(i){ if(!seen[i.id]){ seen[i.id]=true; combined.push(i); } });
  dsInv.forEach(function(i){ if(i.isEquippable && !seen[i.id]){ seen[i.id]=true; combined.push(i); } });

  var equippable = combined.filter(function(i){ return i.type==='weapon' || i.type==='armor'; });

  if (equippable.length === 0) {
    say('Your inventory is empty. Visit the Blacksmith to buy weapons first.');
    return;
  }

  var ov = document.getElementById('ov-blacksmith');
  if (!ov) return;
  ov.style.display = 'flex';
  var content = document.getElementById('blacksmith-content');
  if (!content) return;
  switchBlacksmithTab('upgrade');
  content.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:#e0c080;margin-bottom:12px;">Your Inventory — Select a weapon to equip</div>';

  equippable.forEach(function(item, idx) {
    var div = document.createElement('div');
    div.style.cssText = 'background:#0a0800;border:1px solid #2a2010;padding:10px;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;';
    var isEquipped = DS.equippedWeapon && DS.equippedWeapon.id === item.id;
    div.innerHTML = '<span style="font-family:Cinzel,serif;font-size:0.72rem;color:#e0c080;">' + (item.icon||'⚔️') + ' ' + item.name + ' Lv.' + (item.level||1) + (isEquipped ? ' ✓ Equipped' : '') + '</span>';
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', item.name + ' Level ' + (item.level||1) + (isEquipped ? '. Currently equipped.' : '. Press Equip to use.'));
    var btn = document.createElement('button');
    btn.textContent = isEquipped ? 'Equipped' : 'Equip';
    btn.disabled = isEquipped;
    btn.style.cssText = 'font-family:Cinzel,serif;font-size:0.65rem;padding:6px 12px;background:#1a1000;border:1px solid #ffaa00;color:#ffaa00;cursor:pointer;';
    btn.setAttribute('aria-label', 'Equip ' + item.name);
    (function(it) {
      btn.onclick = function() {
        DS.equippedWeapon = it;
        say(it.name + ' equipped.');
        ov.style.display = 'none';
        SPIRE._invOpen = false;
        DS._fromMenu = false;
      };
    })(item);
    div.appendChild(btn);
    content.appendChild(div);
  });

  var closeBtn = document.querySelector('#ov-blacksmith button[onclick="closeBlacksmith()"]');
  if (closeBtn) {
    closeBtn.textContent = '← Back to Spire';
    closeBtn.setAttribute('aria-label', 'Close inventory and return to The Spire');
  }
  say('Inventory open. ' + equippable.length + ' item' + (equippable.length !== 1 ? 's' : '') + ' available. Tab through to equip.');
}

function openBlacksmith() {
  playTrack('blacksmith');
  sfx('sfx-purchase');
  var ov = document.getElementById('ov-blacksmith');
  if (!ov) return;
  ov.style.display = 'flex';
  switchBlacksmithTab('upgrade');
  renderBlacksmith();
  var fromMenu = DS._fromMenu;
  var playerGold = fromMenu ? getGlobalGold() : (SPIRE && SPIRE.active) ? SPIRE.gold : (DS.gold || 0);
  var isBlacksmith = fromMenu ? false : (SPIRE && SPIRE.active) ? (CHARS[SPIRE.charIdx] && CHARS[SPIRE.charIdx].prof === 'Blacksmith') : DS.prof === 'Blacksmith';
  say('Blacksmith. ' + (isBlacksmith ? '10% discount active. ' : '') +
    'Two tabs available. Upgrade to improve equipped gear. Buy Weapons to purchase new weapons. Gold available: ' + playerGold + '.');
  setTimeout(function(){ var f = ov.querySelector('button'); if(f) f.focus(); }, 100);
}

function closeBlacksmith() {
  var ov = document.getElementById('ov-blacksmith');
  if (ov) ov.style.display = 'none';
  var wasFromMenu = DS._fromMenu;
  DS._fromMenu = false;
  // Play correct music — if from dungeon use current floor track, if from menu use menu track
  if (wasFromMenu || !DS.dungeon) {
    playTrack(getMenuTrack());
  } else {
    playTrack(exploTrackForFloor(DS.floor));
  }
  say('Blacksmith closed.');
}

function renderBlacksmith() {
  var content = document.getElementById('blacksmith-content');
  if (!content) return;
  content.innerHTML = '';
  var fromMenu = DS._fromMenu;
  var inSpire = !fromMenu && SPIRE && SPIRE.active;
  var playerGold = fromMenu ? getGlobalGold() : inSpire ? SPIRE.gold : (DS.gold || 0);
  // Always update the gold display
  var goldEl = document.getElementById('bs-gold-display');
  if (goldEl) goldEl.textContent = '💰 Gold: ' + playerGold + 'g';
  var spireChar = inSpire ? CHARS[SPIRE.charIdx] : null;
  var isBlacksmith = fromMenu ? false : inSpire ? (spireChar && spireChar.prof === 'Blacksmith') : DS.prof === 'Blacksmith';

  // Always load equipped gear from localStorage on menu
  if (fromMenu || !DS.equippedWeapon || !DS.equippedArmor) {
    try {
      if (!DS.equippedWeapon) {
        var _w = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
        if (_w) { DS.equippedWeapon = _w; DS.equippedWeaponAtk = getWeaponAtk(_w); }
      }
      if (!DS.equippedArmor) {
        var _a = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
        if (_a) { DS.equippedArmor = _a; DS.equippedArmorDef = getArmorDef(_a); }
      }
    } catch(e) {}
  }

  // Equipped weapon
  if (DS.equippedWeapon) {
    var w = DS.equippedWeapon;
    var lvl = w.level || 1;
    var MAX_UPGRADE = 10;
    var atMax = lvl >= MAX_UPGRADE;
    var cost = atMax ? 0 : getUpgradeCost(lvl);
    var hasEnchanter = (fromMenu ? getGlobalInventory() : DS.inventory).some(function(i){ return i.type === 'enchanter' && i.charges > 0; });
    var canAfford = !atMax && (playerGold >= cost || hasEnchanter);
    var div = document.createElement('div');
    div.style.cssText = 'background:#0a0a0a;border:1px solid #3a2a1a;padding:14px;margin-bottom:10px;';
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', w.name + ' Level ' + lvl + '. ATK ' + getWeaponAtk(w).join(' to ') + (atMax ? '. Maximum level reached.' : '. Upgrade to level ' + (lvl+1) + ' costs ' + cost + ' gold.'));
    div.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:var(--gold);margin-bottom:6px;">' + w.icon + ' ' + w.name + ' — Level ' + lvl + (atMax ? ' <span style="color:#44ff88;font-size:0.6rem;">MAX</span>' : '') + '</div>' +
      '<div style="font-size:0.68rem;color:#888;font-style:italic;margin-bottom:10px;">' + w.desc + ' ATK: ' + getWeaponAtk(w).join('-') + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (atMax?'#44ff88':canAfford?'#ffdd44':'#666') + ';">' + (atMax ? '✦ Maximum Level Reached' : hasEnchanter ? '🪄 Enchanter Active — Free Upgrade!' : 'Upgrade to Level ' + (lvl+1) + ' — ' + cost + 'g' + (isBlacksmith?' (10% off)':'')) + '</div>' +
        (atMax ? '' : '<button onclick="upgradeEquipped(\'weapon\')" ' + (canAfford?'':'disabled') + ' style="padding:6px 14px;font-family:Cinzel,serif;font-size:0.68rem;background:' + (canAfford?'#1a1400':'#0a0a0a') + ';border:1px solid ' + (canAfford?'#ffdd44':'#333') + ';color:' + (canAfford?'#ffdd44':'#444') + ';cursor:' + (canAfford?'pointer':'default') + ';" aria-label="Upgrade weapon to level ' + (lvl+1) + ' for ' + cost + ' gold">⬆ Upgrade</button>') +
      '</div>';
    content.appendChild(div);
  } else {
    var noW = document.createElement('div');
    noW.style.cssText = 'font-family:Cinzel,serif;font-size:0.7rem;color:#555;padding:12px;border:1px solid #1a1a1a;margin-bottom:10px;';
    noW.textContent = 'No weapon equipped. Buy a weapon from the Weapons tab and equip it from your inventory.';
    content.appendChild(noW);
  }

  // Equipped armor
  if (DS.equippedArmor) {
    var a = DS.equippedArmor;
    var alvl = a.level || 1;
    var acost = getUpgradeCost(alvl);
    var aHasEnchanter = (fromMenu ? getGlobalInventory() : DS.inventory).some(function(i){ return i.type === 'enchanter' && i.charges > 0; });
    var aAfford = playerGold >= acost || aHasEnchanter;
    var adiv = document.createElement('div');
    adiv.style.cssText = 'background:#0a0a0a;border:1px solid #1a2a3a;padding:14px;margin-bottom:10px;';
    adiv.innerHTML =
      '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:#88aaff;margin-bottom:6px;">' + a.icon + ' ' + a.name + ' — Level ' + alvl + '</div>' +
      '<div style="font-size:0.68rem;color:#888;font-style:italic;margin-bottom:10px;">' + a.desc + ' DEF: +' + getArmorDef(a) + '</div>' +
      '<div style="display:flex;align-items:center;justify-content:space-between;">' +
        '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (aAfford?'#ffdd44':'#666') + ';">Upgrade to Level ' + (alvl+1) + ' — ' + acost + 'g' + (isBlacksmith?' (10% off)':'') + '</div>' +
        '<button onclick="upgradeEquipped(\'armor\')" ' + (aAfford?'':'disabled') + ' style="padding:6px 14px;font-family:Cinzel,serif;font-size:0.68rem;background:' + (aAfford?'#0a1a1a':'#0a0a0a') + ';border:1px solid ' + (aAfford?'#88aaff':'#333') + ';color:' + (aAfford?'#88aaff':'#444') + ';cursor:' + (aAfford?'pointer':'default') + ';" aria-label="Upgrade armor to level ' + (alvl+1) + ' for ' + acost + ' gold">⬆ Upgrade</button>' +
      '</div>';
    content.appendChild(adiv);
  } else {
    var noA = document.createElement('div');
    noA.style.cssText = 'font-family:Cinzel,serif;font-size:0.7rem;color:#555;padding:12px;border:1px solid #1a1a1a;';
    noA.textContent = 'No armor equipped. Equip armor from your inventory first.';
    content.appendChild(noA);
  }

  // Gold display
  var goldDiv = document.createElement('div');
  goldDiv.style.cssText = 'font-family:Cinzel,serif;font-size:0.72rem;color:#ffdd44;text-align:center;margin-top:12px;';
  goldDiv.textContent = '💰 ' + playerGold + ' gold available';
  content.appendChild(goldDiv);
}

function upgradeEquipped(type) {
  var inSpire = SPIRE && SPIRE.active;
  var fromMenu = DS._fromMenu;

  // From menu — load equipped gear from localStorage
  if (fromMenu) {
    try {
      if (!DS.equippedWeapon) {
        var _w = _jsonParseSafe(DDStore.getItem('dd_equipped_weapon'), 'null');
        if (_w) { DS.equippedWeapon = _w; DS.equippedWeaponAtk = getWeaponAtk(_w); }
      }
      if (!DS.equippedArmor) {
        var _a = _jsonParseSafe(DDStore.getItem('dd_equipped_armor'), 'null');
        if (_a) { DS.equippedArmor = _a; DS.equippedArmorDef = getArmorDef(_a); }
      }
    } catch(e) {}
  }

  var item = type === 'weapon' ? DS.equippedWeapon : DS.equippedArmor;
  if (!item) { say('Nothing equipped to upgrade. Go to the Inventory tab to equip something first.'); return; }

  var lvl = item.level || 1;
  var MAX_UPGRADE = 10;
  if (lvl >= MAX_UPGRADE) { say(item.name + ' is already at maximum level ' + MAX_UPGRADE + '.'); return; }

  var cost = getUpgradeCost(lvl);
  var playerGold = fromMenu ? getGlobalGold() : inSpire ? SPIRE.gold : (DS.gold || 0);

  // Check if player has an Enchanter — use it instead of gold
  var inv = fromMenu ? getGlobalInventory() : DS.inventory;
  var hasEnchanter = inv.some(function(i){ return i.type === 'enchanter' && i.charges > 0; });

  if (playerGold < cost && !hasEnchanter) { say('Not enough gold. Need ' + cost + 'g but you have ' + playerGold + 'g. Find an Enchanter to upgrade for free.'); return; }

  // Deduct gold or use enchanter — enchanter is always used first if available
  if (hasEnchanter) {
    useEnchanter(fromMenu);
    var _remCharges = (function(){ var inv2 = fromMenu ? getGlobalInventory() : DS.inventory; var e = inv2.find(function(i){ return i.type==='enchanter' && i.charges>0; }); return e ? e.charges : 0; })();
    say('Enchanter used! Free upgrade applied.' + (_remCharges > 0 ? ' ' + _remCharges + ' charges remaining.' : ' Enchanter used up.'));
  } else {
    if (fromMenu) { spendGlobalGold(cost); }
    else if (inSpire) { SPIRE.gold -= cost; spendGlobalGold(cost); spireRenderUI(); }
    else { DS.gold -= cost; spendGlobalGold(cost); updateTopBar(); }
  }

  item.level = lvl + 1;

  if (type === 'weapon') {
    var oldAtk = DS.equippedWeaponAtk || [0,0];
    DS.atkBonus = Math.max(0, (DS.atkBonus||0) - oldAtk[0]);
    var newAtk = getWeaponAtk(item);
    DS.equippedWeaponAtk = newAtk;
    DS.atkBonus = (DS.atkBonus||0) + newAtk[0];
    // Persist upgraded weapon
    DDStore.setItem('dd_equipped_weapon', JSON.stringify(item));
    // Also update in global inventory if present
    var gInv = getGlobalInventory();
    var gIdx = gInv.findIndex ? gInv.findIndex(function(i){ return i.id === item.id; }) : -1;
    if (gIdx !== -1) { gInv[gIdx] = item; saveGlobalInventory(gInv); }
    sfx('sfx-unlock');
    say(item.name + ' upgraded to Level ' + item.level + '! Attack is now ' + newAtk.join(' to ') + '.');
    addLog('⚒ ' + item.name + ' upgraded to Level ' + item.level + '! ATK ' + newAtk.join('-'));
  } else {
    var oldDef = DS.equippedArmorDef || 0;
    DS.defBonus = Math.max(0, (DS.defBonus||0) - oldDef);
    var newDef = getArmorDef(item);
    DS.equippedArmorDef = newDef;
    DS.defBonus = (DS.defBonus||0) + newDef;
    // Persist upgraded armor
    DDStore.setItem('dd_equipped_armor', JSON.stringify(item));
    sfx('sfx-unlock');
    say(item.name + ' upgraded to Level ' + item.level + '! Defense is now +' + newDef + '.');
    addLog('⚒ ' + item.name + ' upgraded to Level ' + item.level + '! DEF +' + newDef);
  }
  updateTopBar();
  renderBlacksmith();
}

// Generate a weapon or armor item on loot drop
function rollEquipmentDrop(floor) {
  var isWeapon = Math.random() < 0.5;
  var scale = Math.floor(floor / 3);
  var dropRarity = rollWeaponRarity();
  if (isWeapon) {
    var types = Object.keys(WEAPON_TYPES);
    var t = types[Math.floor(Math.random() * types.length)];
    var def = WEAPON_TYPES[t];
    var wItem = {
      id: 'drop-weapon-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      name: def.name,
      icon: def.icon,
      type: 'weapon',
      weaponType: t,
      atkBase: def.atkBase,
      level: Math.max(1, 1 + scale),
      desc: def.desc,
      isEquippable: true,
    };
    return (dropRarity && dropRarity.id !== 'common') ? applyRarityToWeapon(wItem, dropRarity) : wItem;
  } else {
    var atypes = Object.keys(ARMOR_TYPES);
    var at = atypes[Math.floor(Math.random() * atypes.length)];
    var adef = ARMOR_TYPES[at];
    var aItem = {
      id: 'drop-armor-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
      name: adef.name,
      icon: adef.icon,
      type: 'armor',
      armorType: at,
      defBase: adef.defBase,
      level: Math.max(1, 1 + scale),
      desc: adef.desc,
      isEquippable: true,
    };
    return (dropRarity && dropRarity.id !== 'common') ? applyRarityToArmor(aItem, dropRarity) : aItem;
  }
}

// 15% chance to drop equipment on enemy kill
function checkEquipmentDrop() {
  var dropChance = 0.15 + (DS._bloodhound ? 0.05 : 0);
  if (Math.random() > dropChance) return;
  var item = rollEquipmentDrop(DS.floor || 1);
  DS.inventory.push(item);
  addLog('🎁 Found: ' + item.icon + ' ' + item.name + ' Level ' + item.level + '! Check inventory.');
  say('Item found. ' + item.name + ' Level ' + item.level + '. Open inventory to equip it.');
}
