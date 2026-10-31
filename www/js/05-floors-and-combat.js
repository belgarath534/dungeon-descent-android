// ── FLOOR COMPLETE SCREEN ──
function showFloorCompleteScreen() {
  // Never stack a duplicate overlay — enterRoom() re-triggers this unconditionally
  // every time it's called once DS.roomsOnFloor >= floorRoomsNeeded, since nothing
  // resets those until the player actually picks Descend or Wander. Without this
  // guard, each additional "move" attempt appended a brand new full-screen overlay
  // on top of the last one (document.body.appendChild, never removed/deduped),
  // growing without bound — a real path to crashing the tab on a device with less
  // memory headroom than this was ever tested against.
  var existing = document.getElementById('floor-complete-overlay');
  if (existing) {
    var btn = existing.querySelector('button');
    if (btn) btn.focus();
    return;
  }
  // Collect floor stats
  var kills = DS._floorKills || 0;
  var dmgDealt = DS._floorDmgDealt || 0;
  var dmgTaken = DS._floorDmgTaken || 0;
  // gold gained on this floor (the old counter was never added to)
  var goldEarned = DS._floorGoldEarned || Math.max(0, (DS.gold || 0) - (DS._floorGoldStart || 0));
  var bestHit = DS._floorBestHit || 0;
  var hpHealed = DS._floorHpHealed || 0;

  var ov = document.createElement('div');
  ov.id = 'floor-complete-overlay';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-label', 'Floor ' + DS.floor + ' complete');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.94);z-index:8800;display:flex;align-items:center;justify-content:center;padding:20px;';

  var box = document.createElement('div');
  box.style.cssText = 'max-width:380px;width:100%;background:#08080a;border:1px solid #446;padding:24px;';
  box.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.4em;color:#446688;margin-bottom:6px;">FLOOR ' + DS.floor + ' COMPLETE</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1rem;color:#88aacc;margin-bottom:16px;">' + (getFloorName ? getFloorName(DS.floor) || 'Floor ' + DS.floor : 'Floor ' + DS.floor) + '</div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#666;line-height:2;margin-bottom:20px;">' +
    '<div>⚔️ Enemies killed: <span style="color:#e0c080;">' + kills + '</span></div>' +
    '<div>💥 Damage dealt: <span style="color:#e0c080;">' + dmgDealt + '</span></div>' +
    '<div>🏆 Best hit: <span style="color:#e0c080;">' + bestHit + '</span></div>' +
    '<div>❤️ Damage taken: <span style="color:#cc4444;">' + dmgTaken + '</span></div>' +
    '<div>💊 HP healed: <span style="color:#44cc44;">' + hpHealed + '</span></div>' +
    '<div>💰 Gold earned: <span style="color:#e0c080;">' + goldEarned + '</span></div>' +
    '</div>' +
    '<div style="display:flex;flex-direction:column;gap:10px;">' +
    '<button type="button" onclick="floorDescend()" style="padding:14px;background:#0a0a12;border:2px solid #446688;color:#88aacc;font-family:Cinzel,serif;font-size:0.78rem;cursor:pointer;" aria-label="Descend to floor ' + (DS.floor + 1) + '">⬇ Descend to Floor ' + (DS.floor + 1) + '</button>' +
    (DS.floor < 9 ? '<button type="button" onclick="floorWander()" style="padding:14px;background:#0a0800;border:1px solid #443a10;color:#888;font-family:Cinzel,serif;font-size:0.78rem;cursor:pointer;" aria-label="Wander this floor — explore more rooms">🗺 Wander — Explore More</button>' : '') +
    '</div>';

  ov.appendChild(box);
  document.body.appendChild(ov);
  setTimeout(function() { var btn = ov.querySelector('button'); if (btn) btn.focus(); }, 100);

  var statStr = 'Floor ' + DS.floor + ' complete. Kills: ' + kills + '. Best hit: ' + bestHit + '. Gold earned: ' + goldEarned + '. Choose to descend or wander.';
  say(statStr);

  // Reset floor stats
  DS._floorKills = 0; DS._floorDmgDealt = 0; DS._floorDmgTaken = 0;
  DS._floorGoldEarned = 0; DS._floorBestHit = 0; DS._floorHpHealed = 0; DS._floorGoldStart = DS.gold || 0;
}

function floorDescend() {
  // CRITICAL — same double-invocation class as every other fixed overlay this
  // session, just without a stacked element to detect: a fast double-tap (or a
  // VoiceOver double-activation) on this button fires floorDescend() twice.
  // Nothing stopped the second call from also removing (a no-op by then) and
  // calling advanceFloor() again — which increments the floor a second time,
  // re-runs every floor-start side effect twice (including scheduling openShop()
  // twice), and can leave DS in a state nothing else here was written to expect.
  var ov = document.getElementById('floor-complete-overlay');
  if (!ov) return; // already handled — nothing left to descend from
  ov.remove();
  advanceFloor();
}

function floorWander() {
  // Same double-invocation guard as floorDescend() above.
  var ov = document.getElementById('floor-complete-overlay');
  if (!ov) return;
  ov.remove();
  // Add 3 more rooms to the current floor
  DS.floorRoomsNeeded = (DS.floorRoomsNeeded || 5) + 3;
  if (shouldUse3DMode() && DS._roomGraph) extend3DRoomGraph(3);
  say('Wandering floor ' + DS.floor + '. 3 more rooms added. Explore carefully.');
  addLog('🗺 You wander further. The floor opens up with more rooms to explore.');
  enterRoom();
}

function getFloorName(floor) {
  try {
    var dungeon = DS.dungeon;
    if (!dungeon) return null;
    var info = DUNGEONS && DUNGEONS[dungeon];
    var names = info && info.floorNames;
    if (names && names[floor - 1]) return names[floor - 1];
  } catch(e) {}
  return null;
}
// ── END FLOOR COMPLETE SCREEN ──

function advanceFloor() {
  // Check Echoes of the Void — reaching floor 10
  if (DS.floor >= 9) {
    var stats = getAchievementStats();
    stats.maxFloorReached = Math.max(stats.maxFloorReached || 0, DS.floor + 1);
    saveAchievementStats && saveAchievementStats(stats);
    if ((DS.floor + 1) >= 10) {
      setTimeout(function() { awardAchievement('ach-echoes-of-void'); }, 1000);
    }
  }
  // Guard against NaN
  if (isNaN(DS.floor) || DS.floor === undefined || DS.floor === null) DS.floor = 1;
  DS.floor++;
  if (DS.floor === 2) setTimeout(function(){ showDungeonTip('first-floor2'); }, 800);
  DS._blackBoxThisFloor = false;
  DS._weaponUndyingUsedFloor = false;
  DS._armorSanctuaryUsedFloor = false;
  DS._killStreak = 0; // reset kill streak on new floor
  // Warm Blood coin upgrade — heal 1 HP on entering each new floor
  if (DS._warmBlood && DS.hp > 0) { DS.hp = Math.min(DS.maxHp, DS.hp + 1); updatePlayerBar(); }
  // Reset Shadow World per-run state on floor 1
  if (DS.floor === 1 && DS.dungeon === 'The Shadow World') {
    DS._shadowCorruption = 0;
    DS._shadowKilledEnemies = [];
    DS._fearTurns = 0;
    DS._maskUsedThisRun = false;
    DS._maskImmune = false;
    DS._maskCorrupt = false;
    DS._maskFear = false;
    DS._maskRevive = false;
    DS._maskGrow = false;
    DS._maskDodge = false;
    DS.enemyFearTurns = 0;
    updateCorruptionDisplay();
  }
  if (typeof applyTraitPerFloor === 'function') applyTraitPerFloor();
  DS.roomsOnFloor = 0;
  DS._warlordAtk = 0;
  DS._wardenUsedFloor = false;
  if (DS._xpBoost && DS._xpBoost.floors > 0) { DS._xpBoost.floors--; if (DS._xpBoost.floors === 0) addLog('Your XP boost wears off.'); }
  if (DS._beastCaller) {
    DS._beast = Math.floor(Math.random() * SUB_BEASTS.length);
    addLog(SUB_BEASTS[DS._beast][0] + ' A ' + SUB_BEASTS[DS._beast][1] + ' answers your call and joins you on this floor.');
  }
  DS._preBossGauntletDone = false;
  DS._gauntletWavesCurrent = 0;
  DS._gauntletWavesTotal = 0;
  if (DS.hunterMode && DS.hunterAlive) {
    if (DS.floor === 2 && DS.hunterPhase === 1) {
      setTimeout(function() { hunterPhaseUp(); }, 1200);
    }
    DS.hunterDist = Math.min(10, (DS.hunterDist || 1) + 3);
    updateHunterBar();
    var floorMsg = '🏹 New floor. The hunter resets — now ' + DS.hunterDist + ' rooms behind you.';
    addLog(floorMsg);
    say(floorMsg);
  }
  // Bounty floor tracking
  try { updateBountyProgress('floor', DS.floor, DS.dungeon); } catch(e2) {}
  DS.shopRerolled = false;

  // The Last Blade — degrades one level per floor
  if (DS.equippedWeapon && DS.equippedWeapon.degrading) {
    DS.equippedWeapon.level = Math.max(1, (DS.equippedWeapon.level || 10) - 1);
    DDStore.setItem('dd_equipped_weapon', JSON.stringify(DS.equippedWeapon));
    addLog('💔 The Last Blade degrades to level ' + DS.equippedWeapon.level + '.');
    if (DS.equippedWeapon.level <= 1) {
      addLog('💔 The Last Blade has crumbled. It is gone.');
      say('The Last Blade has crumbled to dust. Your weapon is gone.');
      DS.inventory = DS.inventory.filter(function(i){ return i.id !== 'last-blade'; });
      DS.equippedWeapon = null;
      DS.equippedWeaponAtk = null;
      DDStore.removeItem('dd_equipped_weapon');
      updateTopBar();
    }
  }

  // 5% chance per floor to inject a special enemy into next room
  if (DS.floor >= 2 && Math.random() < 0.05) {
    var spe = SPECIAL_ENEMIES[Math.floor(Math.random() * SPECIAL_ENEMIES.length)];
    if (spe && DS.floor >= (spe.minFloor || 1)) {
      DS._nextSpecialEnemy = Object.assign({}, spe, { maxHp: spe.hp });
    }
  }
  // Custom spirit corruption reduction
  if (isWhisperForest() && DS.activeSpirit && DS.activeSpirit.isCustomBuilt && DS.activeSpirit.abilityId === 'corruption') {
    reduceCorruption(5);
    addLog(_sbIcon() + ' ' + DS.activeSpirit.name + ': Purifying Song — corruption reduced by 5%.');
  }
  // Whispering Forest — drop Music Box item every 3 floors
  if (DS.dungeon === 'The Whispering Forest' && DS.floor % 3 === 0 && DS.floor < 10) {
    var mbItem = { name:'Music Box', icon:'🎵', type:'keyitem', isWhisperMusicBox:true,
      desc:'A small music box. In the Whispering Forest, its melody purges all corruption. Use it from your inventory.' };
    DS.inventory.push(mbItem);
    renderInv();
    sayLog('A Music Box was left on the path. It is in your inventory. Use it to clear corruption.');
  }
  // Variable rooms per floor based on depth
  if ((DS._dailyMod_earlyBoss ? DS.floor === 7 : DS.floor === 10) && DS.diff !== 'Endless') {
    DS.floorRoomsNeeded = 1; // floor 10 (or 7 with modifier) goes straight to boss
  } else if (DS.floor <= 3) {
    DS.floorRoomsNeeded = 5 + Math.floor(Math.random() * 4); // 5-8 rooms
  } else if (DS.floor <= 6) {
    DS.floorRoomsNeeded = 7 + Math.floor(Math.random() * 5); // 7-11 rooms
  } else {
    DS.floorRoomsNeeded = 9 + Math.floor(Math.random() * 7); // 9-15 rooms
  }
  // Generate procedural room sequence for this floor
  generateFloorRooms();
  if (shouldUse3DMode()) {
    generate3DRoomGraph();
    var _newFloorStartCell = DS._roomGraph.cells[_room3DKey(0, 0)];
    if (_room3D.built) _placeCameraAt(_newFloorStartCell);
    play3DExitCues(_newFloorStartCell);
  }
  // Track no-damage floors for achievement
  if (DS.hpAtFloorStart && DS.hp >= DS.hpAtFloorStart) {
    incrementAchievementStat('noDmgFloors', 1);
    checkAchievements();
  }
  DS.hp = Math.min(DS.maxHp, DS.hp + Math.round(DS.maxHp * 0.35));
  // Endless mode milestones
  if (DS.diff === 'Endless' && DS.floor > 1) {
    if (DS.floor % 25 === 0) {
      // Every 25 floors — full heal + announcement
      DS.hp = DS.maxHp;
      DS.maxHp += 5;
      updatePlayerBar();
      setEvent('good', '⬇ Floor ' + DS.floor + ' — Endless Milestone! Full heal granted. Max HP increased by 5. The darkness deepens.');
      say('Endless milestone! Floor ' + DS.floor + '. Full heal. Max HP increased. Keep going.');
      awardScore('dungeon_clears', 500);
    } else if (DS.floor % 10 === 0) {
      // Every 10 floors — partial heal
      DS.hp = Math.min(DS.maxHp, DS.hp + Math.round(DS.maxHp * 0.30));
      setEvent('good', '⬇ Floor ' + DS.floor + ' — Milestone! You feel stronger in the dark.');
      say('Floor ' + DS.floor + ' milestone. Bonus heal.');
      awardScore('dungeon_clears', 200);
    }
    // Save best floor
    if (_charIdx !== null && CHARS[_charIdx]) {
      var best = CHARS[_charIdx].endlessBest || 0;
      if (DS.floor > best) {
        CHARS[_charIdx].endlessBest = DS.floor;
        saveChars();
      }
    }
  }
  DS.hpAtFloorStart = DS.hp;
  saveProgress();
  addJournalEntry('Descended to floor ' + DS.floor + '. Kills so far: ' + DS.kills + '. HP: ' + DS.hp + '/' + DS.maxHp + '.');
  addRunLog('Descended to floor ' + DS.floor, 'info');
  trackGlobalStat('totalFloors', 1);
  setGlobalStatMax('bestFloor', DS.floor);
  sfx('sfx-stairs'); vibe(VIBE.loot);
  playDescentCue();
  say('Floor ' + DS.floor + ' of 10. You reach the stairs. A merchant waits in the passage. Shop open.');
  setEvent('good', 'You find the stairs down. The cold deepens. A hooded figure crouches nearby, wares spread on a cloth.');
  updateTopBar();
  // Track floor quest — passes current floor as absolute value
  checkFloorQuest();
  setTimeout(function() { openShop(); }, 1200);
}

function setRoom(name, desc, eventType, eventText) {
  document.getElementById('dg-room-name').textContent = name;
  document.getElementById('dg-room-num').textContent = 'Floor ' + DS.floor + ' · Room ' + DS.roomsOnFloor;
  document.getElementById('dg-room-desc').textContent = desc;
  setEvent(eventType, eventText);
  // Announce room to screen reader
  say('Floor ' + DS.floor + ', room ' + DS.roomsOnFloor + '. ' + name + '. ' + desc);
}

function setEvent(type, text) {
  var el = document.getElementById('dg-event');
  if (!el) return;
  if (!text) { el.style.display = 'none'; return; }
  el.className = 'dg-event' + (type ? ' ' + type : '');
  el.style.display = 'block';
  el.innerHTML = '';
  var textSpan = document.createElement('span');
  textSpan.className = 'dg-event-text';
  textSpan.textContent = text;
  el.appendChild(textSpan);
  if (typeof _translationEnabled !== 'undefined' && _translationEnabled) {
    // Only the narration span is updated here — callers routinely append choice
    // buttons to dg-event right after calling setEvent() (Weeping Child, Weeping
    // Mother, generic dungeon events). Writing el.textContent used to wipe those
    // buttons out the instant this callback resolved, since it replaces every
    // child. Updating textSpan instead leaves anything appended afterward intact.
    translateText(text).then(function(t) { textSpan.textContent = t; });
  }
}

function updateTopBar() {
  document.getElementById('dg-name').textContent = DS.name;
  var dungeonShort = DS.dungeon === 'The Ashbound Wastes' ? 'Ashbound Wastes'
    : DS.dungeon === 'Frosthold Abyss' ? 'Frosthold Abyss' : DS.dungeon;
  document.getElementById('dg-sub').textContent = DS.race + ' ' + DS.cls + ' · ' + dungeonShort;
  document.getElementById('dg-floor-num').textContent = DS.floor;
  document.getElementById('dg-lives-val').textContent = '×' + DS.lives;
  document.getElementById('dg-hp-val').textContent = DS.hp + '/' + DS.maxHp;
  // Sanitize gold — prevent NaN display
  if (isNaN(DS.gold) || DS.gold === undefined || DS.gold === null) DS.gold = 0;
  DS.gold = Math.max(0, Math.floor(DS.gold));
  // Keep global gold in sync
  if (DS.gold > 0) setGlobalGold(DS.gold);
  document.getElementById('dg-gold-val').textContent = DS.gold + 'g';
  // Show diamonds in topbar if player has a gun equipped
  try {
    var dgDiamondStat = document.getElementById('dg-diamond-stat');
    if (dgDiamondStat) {
      var hasGunEquipped = !!getEquippedGun();
      dgDiamondStat.style.display = hasGunEquipped ? '' : 'none';
      if (hasGunEquipped) { var topDiaEl = document.getElementById('dg-diamond-val'); if (topDiaEl) topDiaEl.textContent = getDiamonds() + '💎'; }
    }
  } catch(e) {}
  // Fix: always sync level badge
  var lvBadge = document.getElementById('dg-level-badge');
  if (lvBadge && DS.level) lvBadge.textContent = 'Lv ' + DS.level;
  // Update aria-label on stats container so JAWS reads full status
  var statsEl = document.querySelector('.dg-stats');
  var sanityText = _insaneMode ? ' Sanity: ' + Math.round(_sanity) + ' percent.' : '';
  var hcText = DS.hardcoreMode ? ' HARDCORE MODE ACTIVE.' : '';
  if (statsEl) statsEl.setAttribute('aria-label', 'Lives: ' + DS.lives + '. Health: ' + DS.hp + ' of ' + DS.maxHp + '. Gold: ' + DS.gold + ' gold.' + sanityText + hcText);
  // HC badge
  var hcBadge = document.getElementById('dg-hc-badge');
  if (!hcBadge && DS.hardcoreMode) {
    hcBadge = document.createElement('div');
    hcBadge.id = 'dg-hc-badge';
    hcBadge.setAttribute('aria-label', 'Hardcore Mode active');
    hcBadge.style.cssText = 'font-family:Cinzel,serif;font-size:0.55rem;color:#cc0000;background:#0a0000;border:1px solid #cc0000;padding:2px 6px;letter-spacing:0.1em;';
    hcBadge.textContent = '💀 HC';
    var topbar = document.querySelector('.dg-topbar');
    if (topbar) topbar.appendChild(hcBadge);
  }
  // Update sanity bar if insane mode active
  if (_insaneMode) updateSanityBar();
  // Update gold quest tracking
  // gold quest is updated directly when gold is earned, not here
  // Active event banner
  var evBanner = document.getElementById('dg-event-banner');
  if (evBanner) {
    var evB3 = getEventBonuses();
    if (evB3 && evB3.label) {
      evBanner.textContent = evB3.label + ' — active now';
      evBanner.style.display = '';
    } else {
      evBanner.style.display = 'none';
    }
  }
  // Hollow weather banner
  var weatherBanner = document.getElementById('dg-weather-banner');
  if (weatherBanner) {
    var hw2 = getHollowWeather();
    if (hw2 && DS.dungeon === 'The Hollow') {
      weatherBanner.textContent = hw2.icon + ' ' + hw2.name + ' — ' + hw2.effect;
      weatherBanner.style.display = '';
    } else {
      weatherBanner.style.display = 'none';
    }
  }
  // Event banner in dungeon
  var evBanner = document.getElementById('dg-event-banner');
  if (evBanner) {
    var evB = getEventBonuses();
    if (evB && evB.label) {
      evBanner.textContent = evB.label + ' active';
      evBanner.style.display = '';
    } else {
      evBanner.style.display = 'none';
    }
  }
}

function showDgPanels(nav, combat, inv) {
  document.getElementById('dg-nav').style.display = nav ? '' : 'none';
  document.getElementById('dg-combat').style.display = combat ? '' : 'none';
  document.getElementById('dg-inv').style.display = inv ? '' : 'none';
  if (!combat) document.getElementById('boss-phase-bar').style.display = 'none';
  // Examine only shows in combat
  var examBtn = document.getElementById('cbtn-examine');
  if (examBtn) examBtn.style.display = combat ? '' : 'none';
  var eagleBtn2 = document.getElementById('cbtn-eagles-cry');
  if (eagleBtn2) eagleBtn2.style.display = (combat && getActiveEvent() === 'july4') ? '' : 'none';
  // 3D Mode visual only makes sense during exploration — pause the render
  // loop the rest of the time so it's not burning battery behind combat/inv.
  var view3d = document.getElementById('dg-3d-view');
  if (view3d && typeof _room3DWantsVisual === 'function' && _room3DWantsVisual()) {
    if (nav) { view3d.style.display = ''; if (!_room3D.built) init3DView(); else _start3DLoop(); }
    else { view3d.style.display = 'none'; _stop3DLoop(); }
  } else if (view3d) {
    view3d.style.display = 'none';
  }
}

// ── NAVIGATION ──
function moveRoom(dir) {
  if (DS.inCombat) return;
  if (shouldUse3DMode()) {
    // Self-healing: _roomGraph is normally generated once, lazily, the
    // moment the player first reaches the dungeon screen — but if 3D Mode
    // gets toggled on mid-run (already past that point), or a save
    // resumed without it for any reason, there was previously no recovery
    // path at all. moveRoom() would just silently fall through to the old
    // flat 2D system below forever: fresh flavor text on every move, no
    // wall detection, no "already cleared" recognition — which read as
    // "3D mode doesn't work in this dungeon" even though the toggle itself
    // was on the whole time. Generating on demand here closes that gap
    // regardless of what caused it.
    if (!DS._roomGraph) generate3DRoomGraph();
    moveRoom3D(dir);
    return;
  }
  sfx('sfx-footstep');
  say('Moving ' + dir + '...');
  showDgPanels(true, false, false);
  enterRoom();
  hunterTurn(false); // player moved — hunter advances
}

function searchRoom() {
  if (DS.searched) { say('You have already searched this room.'); setEvent('', 'You find nothing more here.'); return; }
  DS.searched = true;
  try { gainFamiliarBond(1); } catch(e2) {}
  updateSearchBadge(false);
  sfx('sfx-search');
  sfx('sfx-select');
  var r = Math.random();
  // The first search of a run always finds something, so a new player's first try is never a trap.
  if (!DS._firstSearchDone) { DS._firstSearchDone = true; r = 0; }
  var findChance = (DS.prof === 'Thief' ? 0.50 : 0.35) + (hasUpgrade('cu-loot-boost') ? 0.08 : 0);
  var searchLoot = DS.dungeon === 'The Ashbound Wastes' ? ASH_LOOT
               : DS.dungeon === 'Frosthold Abyss'       ? FROST_LOOT
               : LOOT;
  if (r < findChance) {
    var item = searchLoot[Math.floor(Math.random() * searchLoot.length)];
    if (item.type === 'gem') {
      var gemAmt = resolveGold(item.gold);
      DS.gold += gemAmt;
      addGlobalGold(gemAmt);
      updateDailyQuestProgress('gold', gemAmt);
      setEvent('good', t('Searching carefully, you find') + ' ' + gemAmt + ' ' + t('gold hidden in the shadows.'));
      say(t('Found') + ' ' + gemAmt + ' ' + t('gold') + '.');
    } else {
      var li = JSON.parse(JSON.stringify(item));
      DS.inventory.push(li); applyItem(li);
      setEvent('good', t('Searching carefully, you find') + ' ' + item.icon + ' ' + t(item.name) + '. ' + t(item.desc));
      say(t('Found') + ' ' + t(item.name) + '.');
      setTimeout(function(){ showDungeonTip('first-loot'); }, 800);
    }

    // Enchanter drop — 2.5% chance
    tryDropEnchanter();
    // Spirit Orb drop — 5% chance to earn a new spirit companion
    checkSpiritOrbDrop();
    updateTopBar(); saveProgress();
  } else if (r < findChance + 0.20) {
    var hasTrapSense = DS.scholarProf || (DS.activeSpirit && DS.activeSpirit.id === 'frost-sprite');
    var usedWardingBell = false;
    if (!hasTrapSense && DS._wardingBellCharges > 0) {
      DS._wardingBellCharges--;
      usedWardingBell = true;
      hasTrapSense = true;
    }
    if (hasTrapSense) {
      playRadarPing(0.85);
      var trapMsg = DS.activeSpirit && DS.activeSpirit.id==='frost-sprite' ? DS.activeSpirit.icon+' Frost Sprite senses the trap!' : usedWardingBell ? '🔔 The Warding Bell rings sharply.' : 'Your scholarly instincts warn you.';
      setEvent('', trapMsg + ' You step around it easily.');
      say(usedWardingBell ? 'The Warding Bell rings. You sense the trap and step around it.' : 'You detected and avoided a trap.');
      if (usedWardingBell) saveProgress();
    } else {
      triggerTrap();
    }
  } else {
    setEvent('', 'Dust. Silence. Nothing but old stone and older shadows.');
    say('You find nothing.');
  }
}

// ── COMBAT ──
// One shared entrance sound per dungeon (regular enemies) and a punchier variant for bosses.
// 402 unique enemies exist across the combat tables — too many to give each a unique sound,
// so sound is themed by dungeon instead. Files must be uploaded to the R2 audio bucket.
var DUNGEON_ENEMY_SFX = {
  'Crypt of Malachar':     'sfx-enemy-undead',
  'The Ashbound Wastes':   'sfx-enemy-fire',
  'Frosthold Abyss':       'sfx-enemy-ice',
  'The Sunken Archives':   'sfx-enemy-aquatic',
  'The Hollow':            'sfx-enemy-horror',
  'The Whispering Forest': 'sfx-enemy-beast',
  'The Infernal Descent':  'sfx-enemy-demon',
  'The Infernal':          'sfx-enemy-demon',
  'The Abyssal Deep':      'sfx-enemy-leviathan',
  'The Shadow World':      'sfx-enemy-shadow',
};
var DUNGEON_BOSS_SFX = {
  'Crypt of Malachar':     'sfx-boss-undead',
  'The Ashbound Wastes':   'sfx-boss-fire',
  'Frosthold Abyss':       'sfx-boss-ice',
  'The Sunken Archives':   'sfx-boss-aquatic',
  'The Hollow':            'sfx-boss-horror',
  'The Whispering Forest': 'sfx-boss-beast',
  'The Infernal Descent':  'sfx-boss-demon',
  'The Infernal':          'sfx-boss-demon',
  'The Abyssal Deep':      'sfx-boss-leviathan',
  'The Shadow World':      'sfx-boss-shadow',
};

function startCombat(isBoss) {
  fxReset();
  if (ACCESS.classTraits && DS.enemy) {
    // Wizard — Arcane Study reveals the enemy (the flag was never read)
    if (DS.wizardStudy) setTimeout(function(){ if (DS.enemy) addLog('🔮 Arcane Study: ' + DS.enemy.name + ' — ' + DS.enemy.hp + ' HP, hits for ' + DS.enemy.atk[0] + ' to ' + DS.enemy.atk[1] + '.'); }, 400);
    // Necromancer — the risen enemy fights beside you in this fight
    if (DS._necroRisen) { fxGet().ally = DS._necroRisen; DS._necroRisen = null; addLog('💀 Your risen ' + fxGet().ally.name + ' fights beside you.'); }
    // Bard — Silver Tongue: 10% of enemies leave without fighting
    if (DS.cls === 'Bard' && !isBoss && !DS.enemy.isBoss && !DS.enemy.isElite && Math.random() < 0.10) {
      var _leaver = DS.enemy.name;
      setTimeout(function() {
        if (!DS.inCombat || !DS.enemy || DS.enemy.name !== _leaver || DS.enemy.hp < DS.enemy.maxHp) return;
        DS.inCombat = false; fxReset();
        playTrack(exploTrackForFloor(DS.floor));
        showDgPanels(true, false, false);
        setEvent('good', '🎵 Silver Tongue — you talk ' + _leaver + ' out of the fight. It leaves.');
        say('Silver Tongue. ' + _leaver + ' leaves without fighting.');
        setCombatBtns(true);
      }, 1200);
    }
  }
  // Bloodfire Potion and Glacier Tonic: "the next enemy" burns / is stunned (set, never read)
  if (DS._potionBurnNext) { DS._potionBurnNext = false; fxGet().dot = 8; fxGet().dotTurns = 3; addLog('🔥 Bloodfire! The enemy burns for 8 damage a turn for 3 turns.'); }
  if (DS._potionStunNext) { DS._potionStunNext = false; fxGet().stun = Math.max(fxGet().stun, 1); addLog('❄️ Glacier Tonic! The enemy is frozen for a turn.'); }
  // Corruption 50% — one fight in ten, the Corrupted Hunter comes instead (the flag was never read)
  if (!isBoss && DS._corruptedHunterActive && DS.enemy && !DS.enemy.isBoss && !DS.enemy._corruptedHunter && (DS.floor || 1) >= 2 && Math.random() < 0.10) {
    DS.enemy.name = 'Corrupted Hunter'; DS.enemy.icon = '🏹';
    DS.enemy.hp = Math.round(DS.enemy.hp * 1.3); DS.enemy.maxHp = DS.enemy.hp;
    DS.enemy.atk = [Math.round(DS.enemy.atk[0] * 1.2), Math.round(DS.enemy.atk[1] * 1.2)];
    DS.enemy.isElite = true; DS.enemy._corruptedHunter = true;
    addLog('🏹 The Corrupted Hunter has found you. Your corruption led it here.');
    say('The Corrupted Hunter has found you.');
  }
  setTimeout(function(){ showDungeonTip(isBoss ? 'first-boss' : (DS.enemy && DS.enemy.isElite) ? 'first-elite' : 'first-combat'); }, 800);
  DS.inCombat = true; DS.defending = false;
  if (isBoss) { DS._eliteKilledFloor10 = false; try { companionOnBossEncounter(); } catch(e2) {} }
  try { updateCombatSpellBtn(); } catch(e2) {}
  if (DS.cls === 'Ranger') DS.rangerFirstHit = true;
  DS._weaponFirstHit = true;
  DS._tookDamageThisCombat = false;
  if (DS._huntersMark) DS._huntersMarkReady = true;
  if (DS.enemy) DS.enemy = applyTierScaling(DS.enemy);

  // Shadow World — Mimic surprise attack
  if (DS.dungeon === 'The Shadow World' && DS.enemy && DS.enemy.mimicSurprise && !DS.enemy._mimicRevealed) {
    DS.enemy._mimicRevealed = true;
    setTimeout(function() {
      var surprise = Math.round(rnd(DS.enemy.atk[0], DS.enemy.atk[1]) * 2);
      DS.hp = Math.max(0, DS.hp - surprise);
      updatePlayerBar();
      addLog('📦 The Mimic reveals itself! Surprise attack deals ' + surprise + ' damage!');
      say('The Mimic! Surprise attack. ' + surprise + ' damage.');
      vibe && vibe(VIBE.mimicReveal);
    }, 500);
  }

  // Shadow World — Lurker hides first turn
  if (DS.dungeon === 'The Shadow World' && DS.enemy && DS.enemy.lurkerHide) {
    DS.enemy._lurkerHiding = true;
    addLog('👁️ ' + DS.enemy.name + ' hides in the shadows. It will strike with full power next turn.');
    say(DS.enemy.name + ' hides. It will strike with guaranteed critical next turn.');
  }
  // Boss gets boss music, normal enemies get battle music
  playTrack(isBoss ? exploTrackForFloor(10) : battleTrack());
  if (isBoss) {
    // 2% chance — DDDI Grand Overseer appears instead of normal boss
    if (Math.random() < 0.02 && !DS.dddiDefeated) {
      spawnDDDIBoss(); return;
    }
    var pool = DS.diff === 'Nightmare'                  ? NIGHTMARE_ENEMIES.bossPool
             : DS.dungeon === 'The Ashbound Wastes'   ? ASH_ENEMIES.bossPool
             : DS.dungeon === 'Frosthold Abyss'       ? FROST_ENEMIES.bossPool
             : DS.dungeon === 'The Sunken Archives'   ? SUNKEN_ENEMIES.bossPool
             : DS.dungeon === 'The Hollow'            ? HOLLOW_ENEMIES.bossPool
             : DS.dungeon === 'The Whispering Forest' ? WHISPER_ENEMIES.bossPool
             : DS.dungeon === 'The Infernal Descent'  ? INFERNAL_ENEMIES.bossPool
             : DS.dungeon === 'The Abyssal Deep'      ? ABYSSAL_ENEMIES.bossPool
             : DS.dungeon === 'The Shadow World'      ? SHADOW_ENEMIES.bossPool.filter(function(b){ return b.isEcho; })
             : ENEMIES.bossPool;
    var bossTemplate = pool[Math.floor(Math.random() * pool.length)];
    // Show boss preview before spawning
    showBossPreview(bossTemplate);
    DS.bossPhase = 1;
    // Boss scales aggressively with player level — never one-shottable
    var _bossLvl = DS.level || 1;
    var _bossLvlMult = 1 + (_bossLvl - 1) * 0.15; // +15% per level above 1
    var _ngBossMult = DS.ngPlus ? (1.20 + ((CHARS[_charIdx] && CHARS[_charIdx].ngPlusCount || 1) - 1) * 0.08) : 1.0;
    var _bossTotalMult = _bossLvlMult * _ngBossMult;
    var _bossHp = Math.round(bossTemplate.hp * _bossTotalMult);
    var _bossAtk = bossTemplate.atk.map(function(a){ return Math.round(a * _bossLvlMult); });
    // Ensure boss has at least enough HP to survive 3 player hits
    var _minBossHp = Math.round((DS.atk ? DS.atk[1] : 20) * 3 * _bossLvlMult);
    _bossHp = Math.max(_bossHp, _minBossHp);
    DS.enemy = {
      name: bossTemplate.name, icon: bossTemplate.icon, gold: bossTemplate.gold,
      isBoss: true, isMultiPhase: true,
      maxHp: _bossHp, hp: _bossHp, atk: _bossAtk,
      phase1Hp: Math.round(_bossHp * 0.66),
      phase2Hp: Math.round(_bossHp * 0.33),
      phaseMsg2: bossTemplate.phaseMsg2,
      phaseMsg3: bossTemplate.phaseMsg3,
      // Four phase data — must be copied and thresholds scaled to actual boss HP
      fourPhase:  bossTemplate.fourPhase  || false,
      leviathan:  bossTemplate.leviathan  || false,
      phase3Hp:   bossTemplate.fourPhase  ? Math.round(_bossHp * 0.15) : undefined,
      phaseMsg4:  bossTemplate.phaseMsg4  || null,
      // Infernal specific
      phase2Desc: bossTemplate.phase2Desc || null,
      phase3Desc: bossTemplate.phase3Desc || null,
      weakPoints: bossTemplate.weakPoints || null,
      // Shadow World specific
      isShapeshifter: bossTemplate.isShapeshifter || false,
      isEcho:     bossTemplate.isEcho     || false,
    };
    // Shapeshifter — 4 phase boss, announce dramatically
    if (bossTemplate.isShapeshifter) {
      DS.enemy.fourPhase = true;
      DS.enemy.phase3Hp = Math.round(_bossHp * 0.15);
      setTimeout(function() {
        addLog('🌑 The Shapeshifter appears — wearing your face. Using your name. It knows every move you will make.');
        say('The Shapeshifter. It looks exactly like you. Same class, same level, same weapon. This is the final boss of The Shadow World.');
      }, 800);
    }
    // Echo boss — announce as copy of a fallen enemy
    if (bossTemplate.isEcho) {
      setTimeout(function() {
        addLog('🔄 The Echo takes shape — a memory of something you defeated. It has learned from your methods.');
        say('The Echo. A shadow copy of an enemy you defeated. It remembers the fight. It will not make the same mistakes.');
      }, 800);
    }
    showBossPhaseBar(1);
    say('The boss appears — ' + bossTemplate.name + '. Prepare yourself.');
    // Start boss timer
    setTimeout(function() { startBossTimer(); }, 1500);
  }
  var e = DS.enemy;

  // ── DAILY DUNGEON MODIFIERS ──
  if (DS._dailyMod_doubleHp && e) { e.hp = e.hp * 2; e.maxHp = e.maxHp * 2; if (e.phase1Hp) { e.phase1Hp *= 2; e.phase2Hp *= 2; } }
  if (DS._dailyMod_fastEnemies && e) { e.atk = e.atk.map(function(a){ return Math.round(a * 1.25); }); }

  showDgPanels(false, true, false);
  document.getElementById('dg-combat-title').textContent = '⚔ ' + t(e.name);
  document.getElementById('dg-enemy-icon').textContent = e.icon;
  document.getElementById('dg-enemy-name').textContent = t(e.name);
  // Show boss art in combat if available
  var artEl = document.getElementById('dg-enemy-art');
  if (artEl) {
    var art = typeof BOSS_ART !== 'undefined' ? BOSS_ART[e.name] : null;
    if (art) {
      artEl.src = art;
      artEl.style.display = 'block';
      document.getElementById('dg-enemy-icon').style.display = 'none';
    } else {
      artEl.style.display = 'none';
      document.getElementById('dg-enemy-icon').style.display = '';
    }
  }
  document.getElementById('dg-combat-log').innerHTML = '';
  updateEnemyBar(); updatePlayerBar();
  setCombatBtns(true);
  addLog('You face ' + e.name + '. It regards you with cold, empty eyes.');
  showEnemyPreview(e);
  applySpiritOnCombatStart();
  applyMedusaTempSpirit();
  addRunLog('Faced ' + e.name + (e.isBoss ? ' (Boss)' : ''), 'combat');
  updateEnemyStatusDisplay();
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
  say('Combat! Fighting ' + e.name + '. HP ' + e.hp + '. Choose attack, heavy, defend, potion, or flee.');

  // ── HOLLOW ENEMY ENTRANCE ANNOUNCEMENTS ──
  if (e.hollowZombie) {
    setTimeout(function() {
      sfx('sfx-zombie-groan');
      addLog('🧟 Something dead stands up. It should not be able to do that.');
      say(e.name + '. It was dead. It is not anymore. Warning — it will rise once when killed.');
    }, 600);
  } else if (e.hollowVampire) {
    setTimeout(function() {
      sfx('sfx-vampire-laugh');
      addLog('🧛 The temperature drops. Something hungry steps into the light.');
      say(e.name + '. It heals 8 HP every time it hits you. Kill it fast.');
    }, 600);
  } else if (e.hollowGhost) {
    setTimeout(function() {
      sfx('sfx-ghost-scream');
      addLog('👻 The air goes cold. Something steps through the wall. Your attacks may pass right through it.');
      say(e.name + '. 30 percent chance your attacks phase through it entirely.');
    }, 600);
  } else {
    // ── DUNGEON-THEMED ENEMY ENTRANCE SOUND ──
    // Every enemy gets an entrance sound keyed by which dungeon it's from (one shared
    // sound per dungeon rather than one per enemy — 402 unique enemies across the game
    // makes truly unique-per-enemy audio impractical). Bosses use a punchier variant.
    var _archetypeSfx = e.isBoss ? DUNGEON_BOSS_SFX[DS.dungeon] : DUNGEON_ENEMY_SFX[DS.dungeon];
    if (_archetypeSfx) {
      setTimeout(function() { sfx(_archetypeSfx); }, e.isBoss ? 400 : 300);
    }
  }
}

var _combatBtnSafetyTimer = null;

function throwSubclassBomb() {
  if (!DS.inCombat || !DS.enemy || !DS._bombThrower || !DS._bombReady) return;
  var e = DS.enemy;
  DS._bombReady = false;
  e.hp = Math.max(0, e.hp - 60);
  sfx('sfx-trap');
  updateEnemyBar();
  addLog('💣 You throw your bomb at ' + e.name + ' for 60 damage!');
  say('Bomb! 60 damage to ' + e.name + '. Your next bomb is ready on the next floor.');
  if (e.hp <= 0) { setCombatBtns(false); setTimeout(function() { enemyDead(); }, 400); return; }
  setCombatBtns(true); updateSkillButtons();
}

function setCombatBtns(on) {
  // Show Purge button only in Shadow World
  var purgeBtn = document.getElementById('cbtn-purge');
  if (purgeBtn) purgeBtn.style.display = (DS && DS.dungeon === 'The Shadow World') ? '' : 'none';
  // Bomb Thrower — the bomb recharged every floor, but there was no way to throw it
  var bombBtn = document.getElementById('cbtn-bomb');
  if (bombBtn) { bombBtn.style.display = (DS && DS._bombThrower && DS._bombReady) ? '' : 'none'; bombBtn.disabled = !on; }

  ['cbtn-attack','cbtn-heavy','cbtn-defend','cbtn-potion','cbtn-flee','cbtn-examine'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.disabled = !on;
  });
  if (!on) {
    // Move focus to combat log so browser doesn't jump to page top
    var log = document.getElementById('dg-combat-log');
    if (log) { log.setAttribute('tabindex', '-1'); log.focus(); }
    // Safety net — unified single timer re-enables buttons after 5 seconds if still frozen
    clearTimeout(window._combatBtnSafetyTimer);
    window._combatBtnSafetyTimer = setTimeout(function() {
      if (DS && DS.inCombat && DS.enemy && DS.enemy.hp > 0 && DS.hp > 0) {
        var atk = document.getElementById('cbtn-attack');
        if (atk && atk.disabled) {
          setCombatBtns(true);
        }
      } else if (DS && DS.inCombat && !DS.enemy) {
        // BUGFIX: buttons stuck disabled with no enemy to fight — combat state desynced.
        // Re-enabling attack here would just crash again, so exit combat back to exploration instead.
        DS.inCombat = false;
        setCombatBtns(true);
        try { showDgPanels(true, false, false); enterRoom(); } catch(eRecover) {}
      }
    }, 3000);
  } else {
    clearTimeout(window._combatBtnSafetyTimer);
    window._combatBtnSafetyTimer = null;
    // Return focus to attack button when re-enabled
    setTimeout(function() {
      var atk = document.getElementById('cbtn-attack');
      if (atk && !atk.disabled) atk.focus();
    }, 50);
  }
  // Show examine button always during combat
  var examBtn = document.getElementById('cbtn-examine');
  if (examBtn) examBtn.style.display = '';
  // Show Eagle's Cry only during July 4th event
  var eagleBtn = document.getElementById('cbtn-eagles-cry');
  if (eagleBtn) eagleBtn.style.display = getActiveEvent() === 'july4' ? '' : 'none';
  // Sync soul traps + keepable items from global inventory at combat start
  try {
    var _kt2 = ['soul-trap','enchanter','music-player','skill-orb'];
    var _gi2 = getGlobalInventory();
    _gi2.filter(function(i){ return _kt2.indexOf(i.type) !== -1; }).forEach(function(ki) {
      var already = DS.inventory && DS.inventory.some(function(di){ return di.type === ki.type && di.id === ki.id; });
      if (!already) DS.inventory.push(ki);
    });
  } catch(e2) {}
  // Show/hide soul trap button based on inventory
  var stBtn = document.getElementById('cbtn-soul-trap');
  if (stBtn) {
    var hasSoulTrap = DS.inventory && DS.inventory.some(function(i){ return i.type === 'soul-trap'; });
    var isBoss = DS.enemy && DS.enemy.isBoss;
    stBtn.style.display = (hasSoulTrap && !isBoss) ? '' : 'none';
    stBtn.disabled = !on;
  }
  if (on) {
    updateSkillButtons();
  } else {
    ['cbtn-skill1','cbtn-skill2','cbtn-skill3'].forEach(function(id) {
      var b = document.getElementById(id); if (b) b.disabled = true;
    });
  }
  // Gun button — show only if player has a gun equipped
  updateGunCombatButton();
}

// ══════════════════════════════════════════
// 🔫 GUN COMBAT SYSTEM
// ══════════════════════════════════════════
var _gunState = {
  charged: false,
  shotsLeft: 0,
  onCooldown: false,
  cooldownTimer: null,
  cooldownSeconds: 0
};

function updateGunCombatButton() {
  var btn = document.getElementById('cbtn-gun');
  if (!btn) return;
  var gun = getEquippedGun();
  if (!gun || typeof DS === 'undefined' || !DS.inCombat) { btn.style.display = 'none'; return; }
  btn.style.display = '';

  if (_gunState.onCooldown) {
    btn.disabled = true;
    btn.textContent = '🔫 Reloading... ' + _gunState.cooldownSeconds + 's';
    btn.setAttribute('aria-label', 'Gun reloading. ' + _gunState.cooldownSeconds + ' seconds remaining.');
    btn.style.borderColor = '#555'; btn.style.color = '#555';
  } else if (_gunState.charged && _gunState.shotsLeft > 0) {
    btn.disabled = false;
    var shotLabel = _gunState.shotsLeft > 1 ? ' (' + _gunState.shotsLeft + ' shots left)' : '';
    btn.textContent = '🔫 Shoot' + shotLabel;
    btn.setAttribute('aria-label', 'Shoot gun. ' + _gunState.shotsLeft + ' shots remaining.');
    btn.style.borderColor = '#ff4400'; btn.style.color = '#ff6622';
  } else {
    btn.disabled = false;
    btn.textContent = '🔫 Charge Gun';
    btn.setAttribute('aria-label', 'Charge gun before shooting.');
    btn.style.borderColor = '#cc8800'; btn.style.color = '#ffaa00';
  }
}

function _playGunSfx(type) {
  try {
    var src = type === 'charge' ? _GUN_AUDIO.charge : _GUN_AUDIO.shot;
    var a = new Audio(src);
    a.volume = AUD ? (AUD.sfxVol || 0.7) : 0.7;
    a.play().catch(function(){});
  } catch(e) {}
}

function gunAction() {
  if (!DS.inCombat || !DS.enemy) return;
  var gun = getEquippedGun();
  if (!gun) return;
  if (_gunState.onCooldown) return;

  if (!_gunState.charged) {
    // CHARGE
    _gunState.charged = true;
    _gunState.shotsLeft = gun.shots;
    setCombatBtns(false);
    _playGunSfx('charge');
    addLog('🔫 ' + gun.name + ' charged. Ready to fire — ' + gun.shots + ' shot' + (gun.shots > 1 ? 's' : '') + ' available.');
    say(gun.name + ' charged. Ready to fire.');
    setTimeout(function() {
      sfx('sfx-unlock');
      setCombatBtns(true);
      updateGunCombatButton();
    }, 1200);
  } else if (_gunState.shotsLeft > 0) {
    // SHOOT
    _gunState.shotsLeft--;
    var dmg = Math.floor(Math.random() * (gun.dmgMax - gun.dmgMin + 1)) + gun.dmgMin;
    // Apply ATK bonus
    dmg = Math.round(dmg * (1 + (DS.atkBonus || 0) / 100));
    dmg = Math.max(1, dmg);

    DS.enemy.hp = Math.max(0, DS.enemy.hp - dmg);
    updateEnemyBar();
    DS._floorDmgDealt = (DS._floorDmgDealt || 0) + dmg;
    DS._floorBestHit = Math.max(DS._floorBestHit || 0, dmg);
    trackGlobalStat('totalDmgDealt', dmg);

    _playGunSfx('shot');
    addLog('🔫 ' + gun.name + ' fires! ' + dmg + ' damage!');
    say(gun.name + ' fires for ' + dmg + ' damage.');
    addRunLog('Shot ' + DS.enemy.name + ' for ' + dmg + ' with ' + gun.name + '.', 'good');

    if (DS.enemy.hp <= 0) {
      _gunState.charged = false; _gunState.shotsLeft = 0;

      // ── AMBUSH / MULTI-ENEMY handling ──
      if (_multiCombatActive && _multiEnemies.length > 0) {
        var mIdx = _multiEnemies.indexOf(DS.enemy);
        if (mIdx !== -1) {
          addLog('🔫 ' + DS.enemy.name + ' falls to the gun!');
          say(DS.enemy.name + ' defeated!');
          var gDrop = resolveGold(DS.enemy.gold);
          DS.gold += gDrop; DS.kills++;
          addGlobalGold(gDrop);
          updateTopBar();
          _multiEnemies.splice(mIdx, 1);
        }
        renderMultiEnemies();
        if (_multiEnemies.length === 0) {
          setTimeout(function() { endMultiCombat(true, false); }, 400);
        } else {
          DS.enemy = _multiEnemies[0];
          setTimeout(function() { multiEnemiesTakeTurns(); }, 600);
        }
        return;
      }

      // Single enemy — set victoryPending if boss to block race condition
      if (DS.enemy.isBoss) DS._victoryPending = true;
      // If elite on floor 10, set guard to prevent premature victory
      if (DS.enemy.isElite && DS.floor === 10) DS._eliteKilledFloor10 = true;
      setTimeout(function() { enemyDead(); }, 400);
      return;
    }

    if (_gunState.shotsLeft <= 0) {
      // Start cooldown
      _gunState.charged = false;
      startGunCooldown(gun.cooldown);
    } else {
      updateGunCombatButton();
    }

    // Enemy counter-attack
    setTimeout(function() {
      if (!DS.inCombat || !DS.enemy || DS.enemy.hp <= 0) return;
      doFight('_gunCounter'); // enemyAttacks() doesn't exist — reuse doFight's counter-attack, same pattern as raidFight('_gunCounter')
    }, 600);
  }
}

function startGunCooldown(seconds) {
  _gunState.onCooldown = true;
  _gunState.cooldownSeconds = seconds;
  updateGunCombatButton();
  clearInterval(_gunState.cooldownTimer);
  _gunState.cooldownTimer = setInterval(function() {
    _gunState.cooldownSeconds--;
    updateGunCombatButton();
    updateSiegeGunButton();
    updateRaidGunButton();
    try { updateSpireGunButton(); } catch(e) {}
    if (_gunState.cooldownSeconds <= 0) {
      clearInterval(_gunState.cooldownTimer);
      _gunState.onCooldown = false;
      _gunState.cooldownSeconds = 0;
      sfx('sfx-unlock');
      try { addLog('🔫 ' + (getEquippedGun() ? getEquippedGun().name : 'Gun') + ' ready to charge again.'); } catch(e) {}
      say('Gun ready. You can charge again.');
      updateGunCombatButton();
      updateSiegeGunButton();
      updateRaidGunButton();
      try { updateSpireGunButton(); } catch(e) {}
    }
  }, 1000);
}

function resetGunState() {
  clearInterval(_gunState.cooldownTimer);
  _gunState.charged = false;
  _gunState.shotsLeft = 0;
  _gunState.onCooldown = false;
  _gunState.cooldownSeconds = 0;
  updateGunCombatButton();
  updateSiegeGunButton();
  updateRaidGunButton();
}

// ── GUN IN SIEGE ──
function updateSiegeGunButton() {
  var btn = document.getElementById('siege-btn-gun');
  if (!btn) return;
  var gun = getEquippedGun();
  if (!gun) { btn.style.display = 'none'; return; }
  btn.style.display = '';
  if (_gunState.onCooldown) {
    btn.disabled = true;
    btn.textContent = '🔫 Reloading... ' + _gunState.cooldownSeconds + 's';
    btn.style.borderColor = '#555'; btn.style.color = '#555';
  } else if (_gunState.charged && _gunState.shotsLeft > 0) {
    btn.disabled = false;
    btn.textContent = '🔫 Shoot' + (_gunState.shotsLeft > 1 ? ' (' + _gunState.shotsLeft + ' left)' : '');
    btn.style.borderColor = '#ff4400'; btn.style.color = '#ff6622';
  } else {
    btn.disabled = false;
    btn.textContent = '🔫 Charge Gun';
    btn.style.borderColor = '#cc8800'; btn.style.color = '#ffaa00';
  }
}

function siegeGunAction() {
  var gun = getEquippedGun();
  if (!gun || _gunState.onCooldown) return;
  if (!SG || !SG.inCombat || !SG.enemy) return;
  if (!_gunState.charged) {
    _gunState.charged = true;
    _gunState.shotsLeft = gun.shots;
    _playGunSfx('charge');
    siegeLog('🔫 ' + gun.name + ' charged. Ready to fire.');
    say(gun.name + ' charged. Ready to shoot.');
    // Small delay so button update fires AFTER any setSiegeCombatBtns call
    setTimeout(function() {
      sfx('sfx-unlock');
      updateSiegeGunButton();
    }, 150);
  } else if (_gunState.shotsLeft > 0) {
    _gunState.shotsLeft--;
    var dmg = Math.floor(Math.random() * (gun.dmgMax - gun.dmgMin + 1)) + gun.dmgMin;
    dmg = Math.max(1, dmg);
    _playGunSfx('shot');
    SG.enemy.hp = Math.max(0, SG.enemy.hp - dmg);
    SG.damageDealtThisWave = (SG.damageDealtThisWave || 0) + dmg;
    siegeLog('🔫 ' + gun.name + ' fires! ' + dmg + ' damage on ' + SG.enemy.name + '! (' + Math.max(0, SG.enemy.hp) + ' HP left)');
    say(gun.name + ' fires for ' + dmg + ' damage.');
    updateSiegeBattleUI();
    if (SG.enemy.hp <= 0) {
      resetGunState();
      setTimeout(siegeEnemyDead, 400);
      return;
    }
    if (_gunState.shotsLeft <= 0) {
      _gunState.charged = false;
      startGunCooldown(gun.cooldown);
    }
    updateSiegeGunButton();
    setTimeout(siegeEnemyAttack, 600);
  }
}

// ── GUN IN RAID ──
function updateRaidGunButton() {
  var btn = document.getElementById('rb-gun');
  if (!btn) return;
  var gun = getEquippedGun();
  if (!gun) { btn.style.display = 'none'; return; }
  btn.style.display = '';
  if (_gunState.onCooldown) {
    btn.disabled = true;
    btn.textContent = '🔫 Reloading... ' + _gunState.cooldownSeconds + 's';
    btn.style.borderColor = '#555'; btn.style.color = '#555';
  } else if (_gunState.charged && _gunState.shotsLeft > 0) {
    btn.disabled = false;
    btn.textContent = '🔫 Shoot' + (_gunState.shotsLeft > 1 ? ' (' + _gunState.shotsLeft + ' left)' : '');
    btn.style.borderColor = '#ff4400'; btn.style.color = '#ff6622';
  } else {
    btn.disabled = false;
    btn.textContent = '🔫 Charge Gun';
    btn.style.borderColor = '#cc8800'; btn.style.color = '#ffaa00';
  }
}

function raidGunAction() {
  var gun = getEquippedGun();
  if (!gun || _gunState.onCooldown || (typeof RD !== 'undefined' && RD.done)) return;
  if (!_gunState.charged) {
    _gunState.charged = true;
    _gunState.shotsLeft = gun.shots;
    _playGunSfx('charge');
    rLog('🔫 ' + gun.name + ' charged. Ready to fire.');
    say(gun.name + ' charged. Ready to shoot.');
    setTimeout(function() {
      sfx('sfx-unlock');
      updateRaidGunButton();
    }, 150);
  } else if (_gunState.shotsLeft > 0) {
    var e = getActiveEnemy();
    if (!e) { resetGunState(); return; }
    _gunState.shotsLeft--;
    var dmg = Math.floor(Math.random() * (gun.dmgMax - gun.dmgMin + 1)) + gun.dmgMin;
    dmg = Math.max(1, Math.round(dmg * (1 + (RD.atkBonus || 0) / 100)));
    _playGunSfx('shot');
    e.curHp = Math.max(0, e.curHp - dmg);
    rLog('🔫 ' + gun.name + ' fires! ' + dmg + ' damage on ' + e.name + '!');
    say(gun.name + ' fires for ' + dmg + ' damage.');
    renderRaidGrid();
    updateRaidHp();
    if (e.curHp <= 0) {
      rLog('☠ ' + e.name + ' defeated!');
      resetGunState();
      setTimeout(function() {
        if (aliveCount() === 0) { waveComplete(); }
        else { setRaidBtns(true); updateRaidGunButton(); }
      }, 400);
      return;
    }
    // Enemy counter-attacks — reuse raid enemy attack logic
    setRaidBtns(false);
    setTimeout(function() {
      raidFight('_gunCounter');
    }, 600);
    if (_gunState.shotsLeft <= 0) {
      _gunState.charged = false;
      startGunCooldown(gun.cooldown);
    }
    updateRaidGunButton();
  }
}

function doFight(action) {
  if (!DS.inCombat) return;
  // Berserk Mode — no defending (only the keyboard shortcut checked it)
  if (action === 'defend' && DS.runModNoDefend) { say('Cannot defend in Berserk Mode.'); return; }
  // The Clock (Time Descender phase 2) runs its own attack-window combat loop —
  // route attack/heavy/defend clicks there instead of the normal resolution below.
  if (DS.enemy && DS.enemy.isClock) { timeDescenderClockHit(action); return; }
  // Interactive tutorial practice fight (Training Shade) — narrate each action the
  // first time it's used, then let real combat resolve normally below.
  if (DS.enemy && DS.enemy.isTutorialEnemy) { _tutCombatOnAction(action); }
  try { tickSpellCooldown(); } catch(e2) {}
  // Charmed by The Heartbreaker — skip this turn
  if (DS._playerCharmed && (action === 'attack' || action === 'heavy' || action === 'skill')) {
    DS._playerCharmed = false;
    addLog('💘 You are charmed! You gaze longingly instead of attacking. Turn wasted.');
    say('Charmed! You cannot attack this turn.');
    setCombatBtns(false);
    setTimeout(function() {
      var e = DS.enemy;
      if (e && e.hp > 0) {
        var rawDmg = rnd(e.atk[0], e.atk[1]);
        var def = (DS.defBonus || 0) + (DS.equippedArmorDef || 0);
        var dmg = Math.max(1, rawDmg - def);
        DS.hp = Math.max(0, DS.hp - dmg);
        updatePlayerBar();
        addLog(e.name + ' attacks while you are distracted, for ' + dmg + ' damage.');
        if (DS.hp <= 0) { handleDeath(); return; }
      }
      setCombatBtns(true);
    }, 800);
    return;
  }
  // Soul trap action
  if (action === 'soul-trap') {
    var e = DS.enemy;
    if (!e) { say('No enemy to capture.'); setCombatBtns(true); return; }
    if (e.isBoss) { say('You cannot capture bosses.'); setCombatBtns(true); return; }
    var stIdx = DS.inventory.findIndex(function(i){ return i.type === 'soul-trap'; });
    if (stIdx === -1) { say('No Soul Trap in inventory.'); setCombatBtns(true); return; }
    var captured = captureMinion({ id: (e.id || e.name.toLowerCase().replace(/ /g,'_')), name: e.name, icon: e.icon || '👾', atk: e.atk ? (Array.isArray(e.atk) ? e.atk[1] : e.atk) : 5 });
    if (captured) {
      DS.inventory.splice(stIdx, 1);
      addLog('🪤 ' + e.name + ' captured as a minion!');
      sfx('sfx-unlock');
      say(e.name + ' captured! It will fight for you as a minion.');
      renderInv(); saveProgress();
      // Properly clear combat state before triggering death sequence
      DS.inCombat = false;
      DS.enemy = null;
      DS.kills = (DS.kills || 0) + 1;
      DS._killStreak = (DS._killStreak || 0) + 1;
      // Shadow World — track for echo ambush
      if (DS.dungeon === 'The Shadow World' && DS.enemy && !DS.enemy.isEcho && !DS.enemy.isBoss) {
        if (!DS._shadowKilledEnemies) DS._shadowKilledEnemies = [];
        var _shadowKilledCopy = Object.assign({}, DS.enemy);
        _shadowKilledCopy.maxHp = DS.enemy.maxHp || DS.enemy.hp;
        DS._shadowKilledEnemies.push(_shadowKilledCopy);
      }
      setCombatBtns(false);
      setTimeout(function(){
        showDgPanels(true, false, false);
        setEvent('good', '🪤 ' + e.name + ' has been captured. It is now your minion.');
        try { alchemyDropOnKill(e); } catch(e2) {}
        enterRoom();
      }, 600);
    } else {
      say('You already have this minion. The Soul Trap is not consumed.');
      setCombatBtns(true);
    }
    return;
  }
  // Redirect to multi-enemy system if active
  if (_multiCombatActive) { doFightMulti(action); return; }
  // BUGFIX: combat state desync guard — if DS.inCombat is true but DS.enemy is missing
  // (e.g. cleared by a special-encounter handler without properly ending combat),
  // dereferencing DS.enemy below throws and permanently freezes the combat screen
  // with buttons stuck disabled. Recover gracefully instead of crashing.
  if (!DS.enemy) {
    DS.inCombat = false;
    setCombatBtns(true);
    try { showDgPanels(true, false, false); enterRoom(); } catch(eRecover) {}
    return;
  }
  setCombatBtns(false);
  sfx('sfx-select');
  var e = DS.enemy;
  if (action === '_gunCounter') {
    // Gun mechanic already dealt the player's damage separately (see
    // gunAction()) — this call only triggers the enemy's counter-attack,
    // mirroring raidFight's identical '_gunCounter' handling.
    setTimeout(function() {
      if (e && e.hp > 0) {
        var rawDmg = rnd(e.atk[0], e.atk[1]);
        var def = (DS.defBonus || 0) + (DS.equippedArmorDef || 0);
        var dmg = Math.max(1, rawDmg - def);
        DS.hp = Math.max(0, DS.hp - dmg);
        updatePlayerBar();
        addLog(e.name + ' counter-attacks for ' + dmg + ' damage.');
        if (DS.hp <= 0) { handleDeath(); return; }
      }
      setCombatBtns(true);
    }, 200);
    return;
  }
  var baseAtk = rnd(DS.atk[0], DS.atk[1]) + DS.atkBonus + (DS._bossRelicAtkBonus || 0);
  // Shadow Tear relic — +12% damage amp
  if (DS.inventory && DS.inventory.some(function(i){ return i.dmgAmp; })) {
    var _shadowAmp = DS.inventory.reduce(function(sum, i){ return sum + (i.dmgAmp || 0); }, 0);
    if (_shadowAmp > 0) baseAtk = Math.round(baseAtk * (1 + _shadowAmp));
  }
  // Shadow Notes — guaranteed critical from the handwriting event
  if (DS._shadowNotes) {
    DS._shadowNotes = false;
    baseAtk = Math.round(baseAtk * 2.5);
    addLog('📝 Shadow Notes — guaranteed critical! ' + baseAtk + ' damage!');
    say('Shadow notes critical hit!');
  }
  // Echo Bone relic — +25% damage vs Echo/Shapeshifter variants
  var hasEchoBone = DS.inventory.some(function(i){ return i.shadowItem === 'echoBone'; });
  if (hasEchoBone && e && e.name && (e.name.indexOf('Echo') !== -1 || e.name.indexOf('Shapeshifter') !== -1)) {
    baseAtk = Math.round(baseAtk * 1.25);
    addLog('🦴 Echo Bone — +25% damage vs ' + e.name + '!');
    say('Echo Bone bonus damage.');
  }
  // Mask — Growing Power: +4 ATK per turn
  if (DS._maskGrow) {
    DS._maskGrowBonus = (DS._maskGrowBonus || 0) + 4;
    baseAtk += DS._maskGrowBonus;
    addLog('🎭 Mask: Growing Power — +' + DS._maskGrowBonus + ' ATK this turn.');
  }
  // Mask — Lurker Strike: guaranteed 2.5x crit next attack
  if (DS._maskLurker) {
    DS._maskLurker = false;
    baseAtk = Math.round(baseAtk * 2.5);
    addLog('🎭 Mask: Lurker Strike — guaranteed 2.5x critical hit!');
    say('Lurker Strike — massive critical hit!');
  }
  // Mask — Mimic Surprise: double damage next attack
  if (DS._maskMimic) {
    DS._maskMimic = false;
    baseAtk = Math.round(baseAtk * 2);
    addLog('🎭 Mask: Mimic Surprise — double damage!');
    say('Mimic Surprise — double damage!');
  }
  // Mask — Shadow Command: +15% ATK
  if (DS._maskCommand) {
    baseAtk = Math.round(baseAtk * 1.15);
    addLog('🎭 Mask: Shadow Command — +15% ATK.');
  }
  // Shadow World fear penalty
  if (DS._fearTurns && DS._fearTurns > 0) {
    baseAtk = Math.round(baseAtk * 0.8);
    DS._fearTurns--;
    if (DS._fearTurns <= 0) { addLog('😤 The fear fades. Your damage returns to normal.'); say('Fear fades. Damage restored.'); }
    else addLog('😨 Sorrow Hound fear — damage reduced 20%. ' + DS._fearTurns + ' turn' + (DS._fearTurns !== 1 ? 's' : '') + ' remaining.');
  }
  // Shadow World corruption damage penalty
  if (DS.dungeon === 'The Shadow World' && DS._shadowCorruption >= 3) {
    baseAtk = Math.round(baseAtk * getCorruptionDamageMult());
    if (DS._shadowCorruption >= 3) addLog('🌑 Corrupted — half damage! Use Purge to clear stacks.');
  }
  // Rage Tonic — triple ATK for duration
  if (DS._rageTurns && DS._rageTurns > 0) {
    baseAtk = Math.round(baseAtk * 3);
    DS._rageTurns--;
    if (DS._rageTurns <= 0) addLog('💢 Rage fades. ATK returns to normal.');
  }
  var _evBns = getEventBonuses();
  if (_evBns && _evBns.atkBoost) baseAtk = Math.round(baseAtk * (1 + _evBns.atkBoost));
  // Dungeon weather player ATK
  var _dwPlayerMult = getDungeonWeatherPlayerAtkMult();
  if (_dwPlayerMult !== 1) baseAtk = Math.round(baseAtk * _dwPlayerMult);
  // Subclass player ATK passives
  if (DS._ironFist && !DS.equippedWeapon) baseAtk = Math.round(baseAtk * 1.20);
  // Sparkler buff — July 4th event
  try { var _sparklerBonus = checkSparklerBuff(baseAtk); if (_sparklerBonus > 0) baseAtk += _sparklerBonus; } catch(e2) {}
  if (DS._avenger && DS.hp <= DS.maxHp * 0.25) baseAtk = Math.round(baseAtk * 2.0);
  if (DS._wildfire && Math.random() < 0.25) { baseAtk = Math.round(baseAtk * 2.0); addLog('🔥 Wild Surge! Double damage!'); }
  if (DS._berserkerSub) { var hpMissing = DS.maxHp - DS.hp; baseAtk += Math.floor(hpMissing / 10); }
  if (DS._spellblade) baseAtk += Math.floor((DS.sp||0) / 10);
  if (DS._battleHymn && DS._battleHymnTurns > 0) { baseAtk += 5; DS._battleHymnTurns--; }
  // Berserk Mode — +40% attack (announced, never applied)
  if (DS.runModAtkBoost) baseAtk = Math.round(baseAtk * DS.runModAtkBoost);
  // Sparkler Buff from the Liberty Shop — +30% attack this run
  if (DS._sparklerAtk) baseAtk = Math.round(baseAtk * 1.30);
  // Night Shroud — +35% at night (its "Night Mode" doesn't exist; the Night Blessing hours are used)
  if (DS._nightShroud && isNightTime()) baseAtk = Math.round(baseAtk * 1.35);
  // Warlord — the kill streak, reset each floor
  if (DS._warlordAtk) baseAtk += DS._warlordAtk;
  // Berserker's Mark coin upgrade — +3 damage below 50% HP
  if (DS._berserkerMark && DS.hp <= DS.maxHp * 0.5) baseAtk += 3;
  // Hunter's Mark coin upgrade — first attack always crits
  if (DS._huntersMarkReady) { baseAtk = Math.round(baseAtk * 1.5); DS._huntersMarkReady = false; addLog("🏹 Hunter's Mark — critical first strike!"); }
  // Night Blessing — +5 ATK during Night Mode
  if (DS._nightBlessing && isNightTime()) baseAtk += 5;
  // Abyssal Deep — apply player mechanics (blind, charm, shell)
  if (DS.dungeon === 'The Abyssal Deep') {
    try {
      var _abyssalResult = applyAbyssalPlayerMechanics(baseAtk, e);
      // A blind miss or a Siren self-hit costs the turn (it gave a free retry)
      if (_abyssalResult === 0) DS._abyssalLostTurn = true;
      baseAtk = _abyssalResult;
    } catch(err) {}
  }
  // Abyssal Deep — abyssal weather ATK
  var _abyssalW = getAbyssalWeather();
  if (_abyssalW && _abyssalW.playerAtkMult && DS.dungeon === 'The Abyssal Deep') baseAtk = Math.round(baseAtk * _abyssalW.playerAtkMult);
  // Glass Cannon DC — double player damage
  if (DS.dailyChallenge === 'glassCannon') baseAtk = Math.round(baseAtk * 2.0);
  // Zen Strike — attacks cannot miss (guaranteed crit modifier)
  if (DS.zenStrike && DS.zenStrike > 0) { baseAtk = Math.round(baseAtk * 1.5); DS.zenStrike--; }
  // Transcendence — double damage
  if (DS.transcendence && DS.transcendence > 0) { baseAtk = Math.round(baseAtk * 2); DS.transcendence--; }
  // Sacred Blade — attacks deal double
  if (DS.sacredBlade && DS.sacredBlade > 0) { baseAtk = Math.round(baseAtk * 2); DS.sacredBlade--; }
  // Battlecry active
  if (DS.battlecryActive && DS.battlecryActive > 0) { baseAtk = Math.round(baseAtk * 2); DS.battlecryActive--; }
  var monkBonus = (DS.cls==='Monk' && ACCESS.classTraits && DS.hp < DS.maxHp*0.30) ? DS.defBonus : 0;
  var baseDef = DS.def + DS.defBonus + monkBonus + (DS.defending ? 4 : 0);
  DS.defending = false;
  var playerDmg = 0;
  // Check Infernal weak point multiplier
  var _wpMult = checkInfernalWeakPoint(action);

  if (action === 'attack') {
    // First Blood — "every combat" (it was used up after the first fight of the run)
    if (DS.cls === 'Assassin' && ACCESS.classTraits && !fxGet().firstBloodDone) { fxGet().firstBloodDone = true; DS.markedKill = true; }
    // Weapon rarity effect — resolved once per attack, checked by id below
    var _wre = DS.equippedWeapon && DS.equippedWeapon.rarityEffect;
    // Keen — +5% critical hit chance
    var _keenBonus = _wre === 'keen' ? 0.05 : 0;
    // The Unlucky One — no crits, no luck
    // Wind Walker and Shadow — the first attack of every fight is a critical
    // Phantom Run's "first strike always crits" too
    var _subFirst = (DS._windWalker || DS._shadowAssassin || DS.runModFirstCrit) && !(DS._fx && DS._fx.subFirstStrike);
    if (_subFirst) fxGet().subFirstStrike = true;
    var crit = !DS._unluckyOne && (Math.random() < (0.10 + (DS.critBonus||0) + _keenBonus + (forgeFx() === 'crit-boost' ? 0.10 : 0)) || DS.markedKill || _subFirst);
    if (DS.markedKill) { DS.markedKill = false; addLog('Marked Kill activates — guaranteed critical!'); }
    // Transcendence
    var transcMult = (DS.transcendence && DS.transcendence > 0) ? 2 : 1;
    if (DS.transcendence && DS.transcendence > 0) DS.transcendence--;
    // Sacred blade
    var swordMult = (DS.sacredBlade && DS.sacredBlade > 0) ? 2 : 1;
    if (DS.sacredBlade && DS.sacredBlade > 0) DS.sacredBlade--;
    playerDmg = Math.round((crit ? Math.round(baseAtk * (DS._gladiatorCrit ? 2.5 : 1.8)) : baseAtk) * transcMult * swordMult);
    if (DS.berserkerTrait && ACCESS.classTraits && DS.hp < DS.maxHp * 0.5) {
      playerDmg = Math.round(playerDmg * (1 + (1 - DS.hp/DS.maxHp) * 0.5));
    }
    if (DS.dragonbornBonus && ACCESS.classTraits) playerDmg = Math.round(playerDmg * DS.dragonbornBonus);
    // Smiter subclass — every 3rd attack deals bonus holy damage equal to level x 3
    if (DS._smiter) {
      DS._smiterCount = (DS._smiterCount || 0) + 1;
      if (DS._smiterCount >= 3) {
        DS._smiterCount = 0;
        var smiteDmg = DS.level * 3;
        playerDmg += smiteDmg;
        addLog('⚡ Holy Smite! +' + smiteDmg + ' holy damage!');
      }
    }
    // Crusader — +50% against the undead
    if (DS._crusader && e && SUB_UNDEAD.indexOf(e.name) !== -1) playerDmg = Math.round(playerDmg * 1.5);
    // Swift weapon — +20% damage on the first attack of combat
    if (_wre === 'swift' && DS._weaponFirstHit) {
      playerDmg = Math.round(playerDmg * 1.20);
      addLog('⚔ Swift blade strikes first — +20% opening damage!');
    // Bow — "First strike every combat" (its own catalog description) — same +20% opening bonus as Swift
    } else if (DS.equippedWeapon && DS.equippedWeapon.weaponType === 'bow' && DS._weaponFirstHit) {
      playerDmg = Math.round(playerDmg * 1.20);
      addLog('🏹 First strike! Bow finds its mark — +20% opening damage!');
    }
    DS._weaponFirstHit = false;
    // Cursed weapon — +40% damage (paid for with HP drain, see doFight's per-round tick)
    if (_wre === 'cursed') playerDmg = Math.round(playerDmg * 1.40);
    // Apocalypse weapon — +60% damage on every attack
    if (_wre === 'apocalypse') playerDmg = Math.round(playerDmg * 1.60);
    // Godslayer weapon — double damage against bosses
    if (_wre === 'godslayer' && e.isBoss) playerDmg = Math.round(playerDmg * 2);
    // Executioner weapon — +50% damage against enemies below 25% HP
    if (_wre === 'executioner' && e.maxHp && (e.hp / e.maxHp) < 0.25) {
      playerDmg = Math.round(playerDmg * 1.50);
      addLog('💀 Executioner strikes the weakened foe — +50% damage!');
    }
    // Aegis armor — -20% damage dealt (paid for with -40% damage taken, see enemy-attack block)
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'aegis') playerDmg = Math.round(playerDmg * 0.80);
    // Ranger — bonus damage on first hit of combat
    if (DS.cls === 'Ranger' && ACCESS.classTraits && DS.rangerFirstHit) {
      playerDmg = Math.round(playerDmg * 1.75);
      DS.rangerFirstHit = false;
      addLog('🏹 Ranger\'s Opening Shot — +75% first hit damage!');
    }
    // Sentinel — deals 20% less damage
    if (DS.cls === 'Sentinel' && ACCESS.classTraits) playerDmg = Math.round(playerDmg * 0.80);
    // Dragonborn RACE — 10% burn chance on attack
    if (DS.race === 'Dragonborn' && ACCESS.classTraits && Math.random() < 0.10) {
      var burnDmg = Math.round(playerDmg * 0.30);
      playerDmg += burnDmg;
      addLog('🔥 Dragon Blood ignites — +'+ burnDmg +' burn damage!');
    }
    // Demon race — +15% damage
    if (DS.demonRace && ACCESS.classTraits) playerDmg = Math.round(playerDmg * 1.15);
    // Assassin — 15% chance to one-shot non-boss enemies
    if (DS.cls === 'Assassin' && ACCESS.classTraits && !e.isBoss && Math.random() < 0.15) {
      playerDmg = e.hp; addLog('💀 Assassin\'s Mark — instant kill!'); say('Instant kill!');
    }
    // Warlock — 25% chance to deal double damage
    if (DS.cls === 'Warlock' && ACCESS.classTraits && Math.random() < 0.25) {
      playerDmg = Math.round(playerDmg * 2); addLog('🔥 Dark Pact — double damage!');
    }
    // Sorcerer — +20% damage always
    if (DS.cls === 'Sorcerer' && ACCESS.classTraits) playerDmg = Math.round(playerDmg * 1.20);
    // Wizard — 20% chance to deal triple damage (spell surge)
    if (DS.cls === 'Wizard' && ACCESS.classTraits && Math.random() < 0.20) {
      playerDmg = Math.round(playerDmg * 3); addLog('⚡ Arcane Surge — triple damage!');
    }
    // Apply enemy mechanic flags — immune first hit, dodge, etc
    playerDmg = applyEnemyMechanicsOnHit(e, playerDmg);
    // Apply weak point multiplier and deal damage to enemy NOW
    playerDmg = Math.round(playerDmg * _wpMult * getWeaponDamageMult());
    playerDmg = fxPlayerDamage(playerDmg, false);
    e.hp = Math.max(0, e.hp - playerDmg);
    if (!DS.bestHit || playerDmg > DS.bestHit) DS.bestHit = playerDmg;
    updateEnemyBar();
    sfx(crit ? 'sfx-crit' : 'sfx-attack');
    vibe(crit ? VIBE.critical : VIBE.hit);
    if (typeof degradeWeapon !== 'undefined') degradeWeapon(action === 'heavy' ? 2 : 1);
    if (!DS._floorDmgDealt) DS._floorDmgDealt = 0; DS._floorDmgDealt += playerDmg;
    if (!DS._floorBestHit || playerDmg > DS._floorBestHit) DS._floorBestHit = playerDmg;
    // Mask — Corrupt on hit
    // (this added corruption to you; "corruption on hit" now powers your next attack, in fxPlayerDamage)
    // Ember Heart relic — burn bonus on each attack
    if (e.hp > 0 && DS.inventory && DS.inventory.some(function(i){ return i.ashBurn; })) {
      var emberBurn = DS.inventory.reduce(function(sum, i){ return sum + (i.ashBurn || 0); }, 0);
      if (emberBurn > 0) { e.hp = Math.max(0, e.hp - emberBurn); addLog('❤️‍🔥 Ember Heart burns for ' + emberBurn + ' extra damage!'); updateEnemyBar(); }
    }
    // Frostbite Shard relic — 20% chance to freeze (enemy skips next turn)
    if (e.hp > 0 && DS.inventory && DS.inventory.some(function(i){ return i.frostChance; }) && Math.random() < 0.20) {
      e._stunned = true; addLog('🧊 Frostbite Shard freezes ' + e.name + '! They skip their next attack.'); say(e.name + ' frozen!');
    }
    // Hollow Mask relic — extra 15% dodge (applied in applyEnemyMechanicsOnHit above; checked on incoming enemy attacks)
    // Shadow Tear relic — damage amp
    if (e.hp > 0 && DS._shadowTearAmp) { /* applied at baseAtk level — no-op here */ }
    // Leech Brew — heal for 30% of damage dealt
    if (DS._leechTurns && DS._leechTurns > 0) {
      var leechHeal = Math.round(playerDmg * (DS._leechPct || 0.30));
      DS.hp = Math.min(DS.maxHp, DS.hp + leechHeal);
      DS._leechTurns--;
      addLog('🩸 Leech! +'  + leechHeal + ' HP from life steal.' + (DS._leechTurns <= 0 ? ' Leech fades.' : ' ' + DS._leechTurns + ' turns left.'));
      updatePlayerBar();
    }
    addLog(crit ? t('CRITICAL HIT! You strike for ') + playerDmg + t(' damage!') : t('You attack for ') + playerDmg + t(' damage.'));
    if (crit) { updateDailyQuestProgress('crits', 1); trackGlobalStat('totalCrits', 1); }
    // Serrated — 15% chance to hit twice
    if (DS.equippedWeapon && DS.equippedWeapon.rarityEffect === 'serrated' && Math.random() < 0.15 && e.hp > 0) {
      var bonusHit = Math.round(playerDmg * 0.5);
      e.hp = Math.max(0, e.hp - bonusHit);
      addLog('⚔ Serrated blade strikes again for ' + bonusHit + ' damage!');
      updateEnemyBar();
    }
    // Dagger — "15% chance to strike twice" (its own catalog description)
    if (DS.equippedWeapon && DS.equippedWeapon.weaponType === 'dagger' && Math.random() < 0.15 && e.hp > 0) {
      var daggerBonusHit = Math.round(playerDmg * 0.5);
      e.hp = Math.max(0, e.hp - daggerBonusHit);
      addLog('🗡️ Dagger strikes again for ' + daggerBonusHit + ' damage!');
      updateEnemyBar();
    }
    // Vampiric weapon — heal 3 HP on every hit
    if (_wre === 'vampiric') {
      DS.hp = Math.min(DS.maxHp, DS.hp + 3);
      addLog('🩸 Vampiric blade drains 3 HP.');
      updatePlayerBar();
    }
    // Lifesteal weapon — heal 15% of damage dealt
    if (_wre === 'lifesteal') {
      var lsHeal = Math.max(1, Math.round(playerDmg * 0.15));
      DS.hp = Math.min(DS.maxHp, DS.hp + lsHeal);
      addLog('🩸 Lifesteal! +' + lsHeal + ' HP.');
      updatePlayerBar();
    }
    // Thundering weapon — 25% chance to stun the enemy on hit
    if (_wre === 'thundering' && e.hp > 0 && Math.random() < 0.25) {
      e._stunned = true;
      addLog('⚡ Thundering strike stuns ' + e.name + '!');
    }
    // Check if player attack killed enemy already
    if (e.hp <= 0) { if(e.isMedusa){setTimeout(function(){showMedusaChoice();},300);return;} setTimeout(function(){enemyDead();},300); return; }
    // Thunderfist stun
    if (DS.equippedWeapon && DS.equippedWeapon.stunChance && Math.random() < DS.equippedWeapon.stunChance) {
      e._stunned = true;
      addLog('⚡ Thunderfist stuns ' + e.name + '! They skip their next attack.');
      say(e.name + ' stunned!');
    }
    // Holy crusade heal
    if (DS.holyCrusade) { DS.hp = Math.min(DS.maxHp, DS.hp + 15); updatePlayerBar(); addLog('Holy Crusade heals 15 HP.'); }
    // Spirit attack (bonus damage if enemy survived player hit)
    var spiritDmg = applySpiritOnAttack(baseAtk, e.name);
    if (spiritDmg > 0) { e.hp = Math.max(0, e.hp - spiritDmg); updateEnemyBar(); if(e.hp<=0){ if(e.isMedusa){setTimeout(function(){showMedusaChoice();},300);return;} setTimeout(function(){enemyDead();},300);return;} }
    // Minion attack (bonus damage if enemy survived)
    minionCombatAttack(e);
    // Love Potion — charmed ally attacks alongside you for its remaining turns
    if (DS._charmedAlly && DS._charmedAlly.turns > 0 && e.hp > 0) {
      var caDmg = Math.max(1, (DS._charmedAlly.atk ? rnd(DS._charmedAlly.atk[0], DS._charmedAlly.atk[1]) : 5));
      e.hp = Math.max(0, e.hp - caDmg);
      addLog('💘 ' + DS._charmedAlly.name + ' fights for you — ' + caDmg + ' damage!');
      DS._charmedAlly.turns--;
      if (DS._charmedAlly.turns <= 0) {
        addLog('💔 ' + DS._charmedAlly.name + '\'s charm fades. It slips away.');
        DS._charmedAlly = null;
      }
    }
    updateEnemyBar();
    if (e.hp <= 0) { if(e.isMedusa){setTimeout(function(){showMedusaChoice();},300);return;} setTimeout(function(){enemyDead();},300); return; }
    // Music Box — after player attacks, melody plays
    if (e.isMusicBox && e.hp > 0) {
      setTimeout(function(){ musicBoxMelody(); }, 400);
      return;
    }

  } else if (action === 'heavy') {
    // Weighted weapon — heavy strikes never miss
    var _heavyWre = DS.equippedWeapon && DS.equippedWeapon.rarityEffect;
    // Hawkeye — Heavy Strike never misses (the flag was never read)
    if (_heavyWre !== 'weighted' && !DS._hawkeye && Math.random() < 0.30) {
      sfx('sfx-heavy-miss');
      vibe(VIBE.miss);
      addLog('Your heavy strike misses! The enemy sidesteps.');
    } else {
      playerDmg = Math.round(baseAtk * 1.7);
      // Swift weapon — +20% damage on the first attack of combat
      if (_heavyWre === 'swift' && DS._weaponFirstHit) {
        playerDmg = Math.round(playerDmg * 1.20);
        addLog('⚔ Swift blade strikes first — +20% opening damage!');
      // Bow — "First strike every combat" — same +20% opening bonus as Swift
      } else if (DS.equippedWeapon && DS.equippedWeapon.weaponType === 'bow' && DS._weaponFirstHit) {
        playerDmg = Math.round(playerDmg * 1.20);
        addLog('🏹 First strike! Bow finds its mark — +20% opening damage!');
      }
      DS._weaponFirstHit = false;
      // Cursed weapon — +40% damage (paid for with HP drain, see doFight's per-round tick)
      if (_heavyWre === 'cursed') playerDmg = Math.round(playerDmg * 1.40);
      // Apocalypse weapon — +60% damage on every attack
      if (_heavyWre === 'apocalypse') playerDmg = Math.round(playerDmg * 1.60);
      // Godslayer weapon — double damage against bosses
      if (_heavyWre === 'godslayer' && e.isBoss) playerDmg = Math.round(playerDmg * 2);
      // Executioner weapon — +50% damage against enemies below 25% HP
      if (_heavyWre === 'executioner' && e.maxHp && (e.hp / e.maxHp) < 0.25) {
        playerDmg = Math.round(playerDmg * 1.50);
        addLog('💀 Executioner strikes the weakened foe — +50% damage!');
      }
      // Aegis armor — -20% damage dealt
      if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'aegis') playerDmg = Math.round(playerDmg * 0.80);
      sfx('sfx-heavy-hit');
      addLog(t('Heavy strike lands for ') + playerDmg + t(' damage!'));
      // Dagger — "15% chance to strike twice"
      if (DS.equippedWeapon && DS.equippedWeapon.weaponType === 'dagger' && Math.random() < 0.15 && e.hp > 0) {
        var daggerHeavyBonusHit = Math.round(playerDmg * 0.5);
        e.hp = Math.max(0, e.hp - daggerHeavyBonusHit);
        addLog('🗡️ Dagger strikes again for ' + daggerHeavyBonusHit + ' damage!');
        updateEnemyBar();
      }
      // Shadow World — heavy strike breaks Void Weaver web
      if (DS.dungeon === 'The Shadow World' && DS.enemy && DS.enemy.corruptWeb && DS.enemy._webActive) {
        DS.enemy._webActive = false;
        addLog('🕸️ Heavy strike shatters the Void Web! Passive damage stopped.');
        say('Void Web broken. No more passive shadow damage.');
      }
    }

  } else if (action === 'defend') {
    DS.defending = true;
    playerDmg = Math.round(baseAtk * 0.5);
    addLog(t('You defend, dealing ') + playerDmg + t(' and bracing for the counter.'));

  } else if (action === 'potion') {
    vibe(VIBE.potion);
    if (DS._dailyMod_noPotions) {
      addLog('Daily Modifier: Dry Run — potions cannot be used today.');
      say('Daily modifier active. Potions cannot be used in this run.');
      setCombatBtns(true); return;
    }
    var pots = DS.inventory.filter(function(i) { return i.type === 'potion'; });
    if (pots.length === 0) {
      addLog('You reach for a potion — your satchel is empty.');
      say('No potions available.');
      setCombatBtns(true); return;
    }
    var pot = pots[0];
    DS.inventory.splice(DS.inventory.indexOf(pot), 1);
    // Brewmaster — potions heal twice as much (the flag was never read)
    var heal = Math.round((pot.heal || 40) * DS.potionMult * (DS._brewmaster ? 2 : 1) * weatherPotionMult());
    // "Find the Music Box or use a potion" — potions never touched the forest's corruption
    if (isWhisperForest() && _corruption > 0) { reduceCorruption(10); addLog('🌲 The potion pushes the corruption back 10%.'); }
    // (the Alchemist's Master Brewer already doubles potions through potionMult; this
    // second boost made them heal 2.7 times)
    // Merfolk — potions heal 20% more
    if (DS.merfolkRace && ACCESS.classTraits) heal = Math.round(heal * 1.20);
    DS.hp = Math.min(DS.maxHp, DS.hp + heal);
    sfx('sfx-potion');
    DS.potionsUsed = (DS.potionsUsed || 0) + 1;
    addLog('You drink ' + pot.name + ', restoring ' + heal + ' HP.');
    updatePlayerBar();
    say('Drank ' + pot.name + '. Healed ' + heal + '. HP: ' + DS.hp);
    // Flag potion used — invalidates nopotion quest
    DS.usedPotion = true;
    trackGlobalStat('totalPotions', 1);
    setCombatBtns(true); return;

  } else if (action === 'flee' && e && e.preventFlee) {
    // Creaking Step, the Door Warden and the Void Anchor block flight (they only warned)
    addLog('You try to flee — but ' + e.name + ' blocks every exit. There is no escape.');
    say('Cannot flee. ' + e.name + ' blocks the way.');
  } else if (action === 'flee') {
    vibe(VIBE.flee);
    if (DS.berserkerTrait && ACCESS.classTraits) {
      addLog('No Retreat — Berserkers cannot flee.'); say('No Retreat. Berserkers do not run.');
      setCombatBtns(true); return;
    }
    var hasRing = DS.inventory.some(function(i) { return i.effect === 'flee'; });
    // Swift Potion guarantees flee
    var swiftGuarantee = (DS._swiftPotion && DS._swiftPotion > 0) || DS._runeSpeed;
    if (DS._swiftPotion && DS._swiftPotion > 0) DS._swiftPotion--;
    // Light Step armor rarity effect — +10% flee chance
    var lightStepBonus = (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'light-step') ? 0.10 : 0;
    var fleeChance = swiftGuarantee ? 1.0 : (hasRing ? 0.75 : 0.45) + (DS.fleeBonus || 0) + lightStepBonus;
    if (Math.random() < fleeChance) {
      DS.inCombat = false;
      fxReset();
      playTrack(exploTrackForFloor(DS.floor));
      showDgPanels(true, false, false);
      setEvent('', swiftGuarantee ? '💨 Swift as a ghost — you vanish before they can react.' : 'You slip into the shadows. The enemy\'s howl fades behind you.');
      say('You successfully fled!');
      setCombatBtns(true); return;
    } else {
      addLog('You attempt to flee — but there is nowhere to go.');
      say('Flee failed.');
    }
  }

  // Only apply playerDmg for heavy/defend (attack already applied above)
  // _wpMult already consumed in attack block above
  if (playerDmg > 0 && e.hp > 0 && action !== 'attack') {
    playerDmg = Math.round(playerDmg * _wpMult);
    playerDmg = fxPlayerDamage(playerDmg, false);
    e.hp = Math.max(0, e.hp - playerDmg);
    // Track best hit
    if (!DS.bestHit || playerDmg > DS.bestHit) DS.bestHit = playerDmg;
    updateEnemyBar();
  }

  // BUGFIX: boss phase transitions (attack-multiplier buffs, phase message/modal, and
  // The Infernal dungeon's entire weak-point/HP-drain mechanic) were only ever checked
  // here for 'heavy'/'defend' actions. Basic Attack — the primary action — never
  // reached this check, so most boss fights silently skipped their multi-phase
  // mechanics for players who just attack normally. Check unconditionally instead.
  if (e.isBoss && e.hp > 0 && checkBossPhase()) {
    setTimeout(function() { setCombatBtns(true); updateSkillButtons(); }, 500);
    return;
  }

  if (e.hp <= 0) {
    if (e.isMedusa) { setTimeout(function() { showMedusaChoice(); }, 500); return; }
    setTimeout(function() { enemyDead(); }, 500); return;
  }
  if (e.isBoss) { checkBossTimerThreshold(); rollBossRiddle(); }

  setTimeout(function() {
    // Medusa gaze — 35% chance INSTEAD of normal attack
    if (e.isMedusa && Math.random() < 0.35) {
      applyMedusaGaze();
      setCombatBtns(true); updateSkillButtons();
      return;
    }
    // Venom tick
    if (DS.venomTurns > 0) {
      var venomDmg = 8;
      e.hp = Math.max(0, e.hp - venomDmg);
      DS.venomTurns--;
      addLog('Poison deals ' + venomDmg + ' damage to ' + e.name + '. (' + DS.venomTurns + ' turns left)');
      updateEnemyBar();
      if (e.hp <= 0) { setTimeout(function() { enemyDead(); }, 300); return; }
    }
    // Divine shield check
    if (DS.divineShield) {
      DS.divineShield = false;
      addLog('Divine Shield absorbs the attack completely!');
      say('Divine Shield blocked all damage.');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Check frozen (from trap)
    if (DS.frozen) {
      DS.frozen = false;
      // Juggernaut armor — immune to being frozen
      if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'juggernaut') {
        addLog('🛡️ Juggernaut armor shrugs off the freeze!');
      } else {
        addLog('You are frozen and cannot act this turn!');
        say('Frozen! You skip this turn.');
        setCombatBtns(true); updateSkillButtons(); return;
      }
    }
    // Regenerating armor — heal 3 HP at the start of every enemy turn
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'regenerating' && DS.hp > 0) {
      DS.hp = Math.min(DS.maxHp, DS.hp + 3);
      addLog('💚 Regenerating armor heals 3 HP.');
      updatePlayerBar();
    }
    var _fxT = fxEnemyTurn(e, true);
    if (_fxT === 'dead') { setTimeout(function() { enemyDead(); }, 300); return; }
    if (_fxT.skip) { setCombatBtns(true); updateSkillButtons(); return; }
    var rawDmg = rnd(e.atk[0], e.atk[1]);
    rawDmg = Math.round(rawDmg * _fxT.mult);
    // Rage Tonic — double incoming damage, but player ATK is tripled (applied in attack)
    if (DS._rageTurns && DS._rageTurns > 0) rawDmg = Math.round(rawDmg * 2);
    // Corruption Flask — enemy takes corruption damage before attacking
    if (DS._corruptionFlask && DS._corruptionFlask.turns > 0) {
      var corrDmg = DS._corruptionFlask.dmgPerTurn;
      e.hp = Math.max(0, e.hp - corrDmg);
      DS._corruptionFlask.turns--;
      updateEnemyBar();
      addLog('💜 Corruption! ' + e.name + ' takes ' + corrDmg + ' corruption damage.' + (DS._corruptionFlask.turns <= 0 ? ' Corruption fades.' : ' ' + DS._corruptionFlask.turns + ' turns left.'));
      if (e.hp <= 0) { setTimeout(function(){ enemyDead(); }, 300); return; }
    }
    // Dungeon weather enemy ATK mult
    var _dwEnemyMult = getDungeonWeatherEnemyAtkMult();
    if (_dwEnemyMult !== 1) rawDmg = Math.round(rawDmg * _dwEnemyMult);
    // Subclass passives — damage taken
    if (DS._highPriest) rawDmg = Math.round(rawDmg * 0.80);
    if (DS._ironclad) rawDmg = Math.min(rawDmg, 12);
    // Eagle's Cry — July 4th skill debuff reduces enemy ATK 30%
    if (DS._eaglesCryActive) { rawDmg = Math.round(rawDmg * 0.70); DS._eaglesCryTurns = (DS._eaglesCryTurns||0) - 1; if (DS._eaglesCryTurns <= 0) { DS._eaglesCryActive = false; addLog('The eagle is silent. The cry fades.'); } }
    if (DS._tricksterBard && Math.random() < 0.25) { addLog('🎭 Distracted! Enemy misses!'); say('Trickster distraction — enemy misses!'); rawDmg = 0; }
    if (DS._bulwark && DS.defending) { var reflectDmg = Math.round(rawDmg * 0.30); if (DS.enemy && reflectDmg > 0) { DS.enemy.hp = Math.max(0, DS.enemy.hp - reflectDmg); addLog('⚔️ Bulwark reflects ' + reflectDmg + ' damage!'); updateEnemyBar(); } }
    // Mask — Immunity to first hit
    if (DS._maskImmune) { DS._maskImmune = false; rawDmg = 0; addLog('🎭 Mask absorbs the hit — immunity triggered!'); say('Mask immunity — hit absorbed!'); }
    // Mask — Dodge every other hit
    if (DS._maskDodge) { DS._maskDodgeToggle = !DS._maskDodgeToggle; if (DS._maskDodgeToggle) { rawDmg = 0; addLog('🎭 Mask: Phase Dodge — you slip through the attack!'); say('Phase dodge — attack missed!'); } }
    // Shadow Cloak potion — timed dodge chance
    if (DS._dodgeBuff && DS._dodgeBuffTurns > 0 && rawDmg > 0 && Math.random() < DS._dodgeBuff) {
      rawDmg = 0;
      addLog('🌒 Shadow Cloak — you phase through the attack!');
      say('Shadow Cloak — attack dodged!');
    }
    // Mask — Reflection: reflect enemy attack back
    if (DS._maskReflect && rawDmg > 0) { DS._maskReflect = false; var reflected = rawDmg; rawDmg = 0; if (DS.enemy) { DS.enemy.hp = Math.max(0, DS.enemy.hp - reflected); updateEnemyBar(); } addLog('🎭 Mask: Reflection — ' + reflected + ' damage reflected back at the enemy!'); say('Reflection — attack reflected for ' + reflected + ' damage!'); }
    // Mask — Spirit Form: half physical damage
    if (DS._maskSpirit) { rawDmg = Math.round(rawDmg * 0.5); addLog('🎭 Mask: Spirit Form — physical damage halved!'); }
    // Mask — Second Life: revive at 50% HP
    if (DS._maskRevive && DS.hp - rawDmg <= 0) { DS._maskRevive = false; rawDmg = 0; DS.hp = Math.round(DS.maxHp * 0.5); updatePlayerBar(); addLog('🎭 Mask: Second Life — you refuse to die! Revived at 50% HP!'); say('Second life! Revived at 50% HP!'); }
    // Enemy fear from mask
    if (DS.enemyFearTurns && DS.enemyFearTurns > 0) { rawDmg = Math.round(rawDmg * 0.8); DS.enemyFearTurns--; addLog('😨 Enemy is afraid — damage reduced 20%. ' + DS.enemyFearTurns + ' turn' + (DS.enemyFearTurns !== 1 ? 's' : '') + ' left.'); }
    // Hollow Matron — all enemies deal +10% damage while she lives
    if (DS.dungeon === 'The Hollow' && e && e.hollowMatron) rawDmg = Math.round(rawDmg * 1.1);
    // The Shade — 30% chance to strike three times
    if (e && e.isShadeElite) rawDmg = applyShadeSpecialHit(rawDmg);
    // Abyssal Deep enemy mechanics
    if (DS.dungeon === 'The Abyssal Deep') { try { applyAbyssalEnemyMechanics(e, 'defend'); } catch(err){} }
    // Abyssal weather enemy mult
    var _abyssalWE = getAbyssalWeather();
    if (_abyssalWE && _abyssalWE.enemyAtkMult && DS.dungeon === 'The Abyssal Deep') rawDmg = Math.round(rawDmg * _abyssalWE.enemyAtkMult);
    // Apply barkskin reduction
    if (DS.barkskin && DS.barkskin > 0) { rawDmg = Math.round(rawDmg * 0.60); DS.barkskin--; }
    // Apply consecrate reduction
    if (DS.consecrate && DS.consecrate > 0) { rawDmg = Math.round(rawDmg * 0.80); DS.consecrate--; }
    // Apply sanctuary cap
    if (DS.sanctuary && DS.sanctuary > 0) { rawDmg = Math.min(rawDmg, 10); DS.sanctuary--; }
    // Apply fortify
    if (DS.fortify && DS.fortify > 0) { rawDmg = Math.round(rawDmg * 0.65); DS.fortify--; }
    // Apply taunted
    if (DS.taunted && DS.taunted > 0) { rawDmg = Math.round(rawDmg * 0.50); DS.taunted--; }
    if (DS.frostSpriteAura && DS.frostSpriteAura > 0) { rawDmg = Math.round(rawDmg * 0.90); DS.frostSpriteAura--; }
    // Tick temporary ATK/DEF boosts from potions and elixirs (e.g. Golden Elixir)
    if (DS._atkBoostTurns && DS._atkBoostTurns > 0) {
      DS._atkBoostTurns--;
      if (DS._atkBoostTurns <= 0) { DS.atkBonus = Math.max(0, (DS.atkBonus||0) - (DS._lastAtkBoost||0)); DS._lastAtkBoost = 0; addLog('ATK boost expired.'); }
    }
    if (DS._defBoostTurns && DS._defBoostTurns > 0) {
      DS._defBoostTurns--;
      if (DS._defBoostTurns <= 0) { DS.defBonus = Math.max(0, (DS.defBonus||0) - (DS._lastDefBoost||0)); DS._lastDefBoost = 0; addLog('DEF boost expired.'); }
    }
    // Cursed weapon — the +40% damage bonus (applied at hit time) costs 3 HP every round
    if (DS.equippedWeapon && DS.equippedWeapon.rarityEffect === 'cursed') {
      DS.hp = Math.max(1, DS.hp - 3);
      addLog('💀 The cursed blade drains 3 HP from you.');
      updatePlayerBar();
    }
    // Shadow Cloak potion — tick down its timed dodge buff
    if (DS._dodgeBuffTurns && DS._dodgeBuffTurns > 0) {
      DS._dodgeBuffTurns--;
      if (DS._dodgeBuffTurns <= 0) { DS._dodgeBuff = 0; addLog('Shadow Cloak faded.'); }
    }
    // Void Moth — 15% chance to negate damage entirely
    if (DS.activeSpirit && DS.activeSpirit.id === 'void-moth' && DS.level >= 5 && Math.random() < 0.15) {
      sayLog('Void Moth intercepts the attack — damage negated!');
      rawDmg = 0;
    }
    // Lantern trap detection
    if (DS.activeSpirit && DS.activeSpirit.isLantern) {
      DS.scholarProf = true; // Lantern detects traps same as Scholar
    }
    // Check enemy special ability
    var specialResult = checkEnemySpecial(e, rawDmg);
    if (specialResult.skipPlayer || specialResult.skipEnemy) { setCombatBtns(true); updateSkillButtons(); return; }

    // Thunderfist stun — enemy skips attack
    if (e._stunned) {
      e._stunned = false;
      addLog(e.name + ' is stunned and cannot attack!');
      say(e.name + ' stunned — skips their attack.');
      setCombatBtns(true); updateSkillButtons();
      return;
    }
    rawDmg = specialResult.dmg;
    // Apply enemy mechanic flags — drain, lifesteal, double strike etc
    rawDmg = applyEnemyMechanicsOnTurn(e, rawDmg);
    // Difficulty multiplier — hard modes hit harder
    var diffMult = DS.diff === 'Nightmare' ? 1.75 : DS.diff === 'Forsaken' ? 1.5 : DS.diff === 'Condemned' ? 1.25 : DS.diff === 'Ironblood' ? 1.1 : 1.0;
    rawDmg = Math.round(rawDmg * diffMult);
    // Undead resistance
    var undeadNames = ['Hollow Shade','Brittle Skeleton','Wailing Wraith','Armored Skeleton','Bone Colossus','Death Knight','Soul Harvester','Malachar the Undying'];
    if (DS.undeadRes && undeadNames.indexOf(e.name) !== -1) rawDmg = Math.round(rawDmg * 0.65);
    // Defense can block up to 60% of damage max — never zero
    var maxBlock = specialResult.ignoreDef ? 0 : Math.floor(rawDmg * 0.60);
    var defVal = DS.def + DS.defBonus + (DS.defending ? 4 : 0);
    var blocked = Math.min(defVal, maxBlock);
    var taken = Math.max(1, rawDmg - blocked);
    // Ember Ward — reduce all damage by 2 permanently
    if (DS._emberWard) taken = Math.max(1, taken - 2);
    // Legend of Echoes victory — 30% less damage taken rest of run
    if (DS._legendEchoShield) taken = Math.max(1, Math.round(taken * 0.70));
    // Paladin — take 15% less damage always
    if (DS.cls === 'Paladin' && ACCESS.classTraits) taken = Math.max(1, Math.round(taken * 0.85));
    // DeathKnight — take 20% less damage
    if (DS.cls === 'DeathKnight' && ACCESS.classTraits) taken = Math.max(1, Math.round(taken * 0.80));
    // Sentinel — take 25% less damage
    if (DS.cls === 'Sentinel' && ACCESS.classTraits) taken = Math.max(1, Math.round(taken * 0.75));
    // Fortified armor — 15% less damage taken
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'fortified') taken = Math.max(1, Math.round(taken * 0.85));
    // Aegis armor — 40% less damage taken (paid for with -20% damage dealt, applied in attack)
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'aegis') taken = Math.max(1, Math.round(taken * 0.60));
    // Unbreakable armor — no single hit exceeds 25% of max HP
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'unbreakable') taken = Math.min(taken, Math.ceil(DS.maxHp * 0.25));
    // Demon race — take 15% MORE damage (high risk high reward)
    if (DS.demonRace && ACCESS.classTraits) taken = Math.round(taken * 1.15);
    // Bard — 15% chance to charm enemy into skipping attack
    if (DS.cls === 'Bard' && ACCESS.classTraits && Math.random() < 0.15) {
      addLog('🎵 Bard\'s Charm — ' + e.name + ' is enchanted and skips their attack!');
      say(e.name + ' charmed! Attack skipped.');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Monk — 10% dodge chance
    if (DS.cls === 'Monk' && ACCESS.classTraits && Math.random() < 0.10) {
      addLog('🥷 Monk dodges the attack completely!');
      say('Dodged!');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Sturdy armor — 5% chance to fully block an attack
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'sturdy' && Math.random() < 0.05) {
      addLog('🛡️ Sturdy armor fully blocks the attack!');
      say('Sturdy armor — attack fully blocked!');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Hollow Mask relic — 15% dodge chance
    if (DS.inventory && DS.inventory.some(function(i){ return i.hollowDodge; }) && Math.random() < 0.15) {
      addLog('🎭 Hollow Mask — you slip through the shadows! Attack dodged!');
      say('Hollow Mask dodge! Attack missed!');
      setCombatBtns(true); updateSkillButtons(); return;
    }
    // Leviathan Scale relic — flat damage reduction
    if (DS.inventory && DS.inventory.some(function(i){ return i.dmgReduction; })) {
      var scaleDR = DS.inventory.reduce(function(sum, i){ return sum + (i.dmgReduction || 0); }, 0);
      if (scaleDR > 0) taken = Math.max(1, taken - scaleDR);
    }
    // Mana shield
    if (DS.manaShield && DS.manaShield > 0) {
      var absorbed = Math.min(DS.manaShield, taken);
      taken -= absorbed; DS.manaShield -= absorbed;
      addLog('Mana Shield absorbs ' + absorbed + '. You take ' + taken + ' damage.');
    } else {
      sfx('sfx-hurt');
      if (blocked > 0) {
        addLog(e.name + t(' strikes for ') + rawDmg + t(' — you absorb ') + blocked + t('. You take ') + taken + t(' damage.'));
      } else {
        addLog(e.name + t(' attacks for ') + taken + t(' damage.'));
      }
    }
    DS.hp = Math.max(0, DS.hp - taken);
    if (!DS._floorDmgTaken) DS._floorDmgTaken = 0; DS._floorDmgTaken += taken;
    var _retaliated = fxAfterTaken(e, taken);
    vibe(taken > (DS.maxHp||100) * 0.3 ? VIBE.bigDamage : (e && e.isBoss ? VIBE.bossAttack : VIBE.takeDamage));
    updatePlayerBar();
    // Daily Quest — took damage this combat (nodmg quest) and low-HP survival
    // (survive quest); neither 'nodmg' nor 'survive' had a call site anywhere,
    // so both quests were unwinnable if rolled as the day's quest.
    DS._tookDamageThisCombat = true;
    if (DS.hp > 0 && DS.hp <= 10) updateDailyQuestProgress('survive', 1);

    // Thornmail — reflect damage back to attacker
    if (DS.equippedArmor && DS.equippedArmor.thornReflect && taken > 0) {
      var reflected = Math.floor(taken * DS.equippedArmor.thornReflect);
      if (reflected > 0 && e && e.hp > 0) {
        e.hp = Math.max(0, e.hp - reflected);
        updateEnemyBar();
        addLog('🌵 Thornmail reflects ' + reflected + ' back at ' + e.name + '!');
      }
    }

    // Thorned armor rarity effect — reflect 15% of damage taken
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'thorned' && taken > 0 && e && e.hp > 0) {
      var thornedReflect = Math.floor(taken * 0.15);
      if (thornedReflect > 0) {
        e.hp = Math.max(0, e.hp - thornedReflect);
        updateEnemyBar();
        addLog('🌵 Thorned armor reflects ' + thornedReflect + ' back at ' + e.name + '!');
        if (e.hp <= 0) { setTimeout(function(){ enemyDead(); }, 300); return; }
      }
    }

    // Vengeful armor rarity effect — 20% chance to counter for your own ATK
    if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'vengeful' && e && e.hp > 0 && Math.random() < 0.20) {
      var vengefulDmg = rnd(DS.atk[0], DS.atk[1]) + (DS.atkBonus || 0);
      e.hp = Math.max(0, e.hp - vengefulDmg);
      updateEnemyBar();
      addLog('⚔️ Vengeful armor counters for ' + vengefulDmg + ' damage!');
      if (e.hp <= 0) { setTimeout(function(){ enemyDead(); }, 300); return; }
    }

    // Ghost Shroud — 10% chance attack fully missed (retroactive dodge)
    if (DS.equippedArmor && DS.equippedArmor.ghostDodge && Math.random() < DS.equippedArmor.ghostDodge) {
      DS.hp = Math.min(DS.maxHp, DS.hp + taken); // refund the damage
      updatePlayerBar();
      addLog('👻 Ghost Shroud — you phase out! You take no damage!');
      say('Ghost Shroud activated — you phased through the attack!');
    }
    checkInfernalHpDrain();
    say(e.name + ' dealt ' + taken + ' damage. Your HP: ' + DS.hp + ' of ' + DS.maxHp + '.');
    if (DS.hp <= 0) { setTimeout(function() { handleDeath(); }, 600); }
    else if (_retaliated && e.hp <= 0) { setTimeout(function() { enemyDead(); }, 300); }
    else { setCombatBtns(true); updateSkillButtons(); }
  }, 700);
}

// Safely resolve gold — handles number, [min,max] array, undefined, NaN
function resolveGold(val) {
  if (Array.isArray(val)) return rnd(val[0]||0, val[1]||0);
  var n = parseInt(val);
  return isNaN(n) ? 0 : Math.max(0, n);
}

// Sanitize DS.gold — call whenever gold might be corrupted
function sanitizeGold() {
  if (isNaN(DS.gold) || DS.gold === undefined || DS.gold === null) {
    DS.gold = getGlobalGold() || 0;
  }
  DS.gold = Math.max(0, Math.floor(DS.gold));
}

function enemyDead() {
  if (DS._fx && DS._fx.bossMinion && DS.enemy && DS.enemy.isBoss) addLog('👹 With its master gone, the ' + DS._fx.bossMinion.name + ' fades into the dark.');
  // Necromancer — Death Follows: 15% a killed enemy fights for you in the next fight (never applied)
  if (DS.cls === 'Necromancer' && ACCESS.classTraits && DS.enemy && !DS.enemy.isBoss && Math.random() < 0.15) {
    DS._necroRisen = { name: DS.enemy.name, atk: [Math.max(1, Math.round(DS.enemy.atk[0] * 0.5)), Math.max(1, Math.round(DS.enemy.atk[1] * 0.5))] };
    addLog('💀 Death Follows — ' + DS.enemy.name + ' rises to serve you in your next fight.');
  }
  // Death March's legendary boss drop and the Corruption Run's prize
  if ((DS._corruptionRun || DS.runModLegendaryBoss) && DS.enemy && DS.enemy.isBoss && !DS._corruptionPrize) {
    DS._corruptionPrize = true;
    try {
      var _leg = WEAPON_RARITIES.find(function(r){ return r.id === 'legendary'; });
      var _cw = applyRarityToWeapon({ name:'Corrupted Blade', icon:'🗡️', type:'weapon', weaponType:'sword', atkBase:[12, 20],
        level: Math.max(1, 1 + Math.floor((DS.floor || 1) / 3)), isEquippable:true, desc:'Forged from your own corruption.' }, _leg);
      DS.inventory.push(_cw); addToGlobalInventory(_cw);
      addLog('☠ Corruption Run reward: ' + _cw.name + '! Check your inventory.');
    } catch (eP) {}
  }
  if (DS._fx && DS._fx.soulLeash && DS.enemy && DS.hp > 0) {
    var leash = Math.round((DS.enemy.maxHp || DS.enemy.hp || 0) * 0.5);
    DS.hp = Math.min(DS.maxHp, DS.hp + leash);
    addLog('🔗 Soul Leash — you heal ' + leash + ' HP from its fall.');
  }
  if (DS._hungerKills > 0 && DS.hp > 0) {
    DS._hungerKills--;
    DS.hp = Math.min(DS.maxHp, DS.hp + 15);
    addLog('🖤 The Hunger feeds — you heal 15 HP.' + (DS._hungerKills === 0 ? ' It is not satisfied. It turns on you.' : ''));
    if (DS._hungerKills === 0) DS._hungerDrain = 3;
  }
  if (DS._fx && DS._fx.warlord && DS.hp > 0) {
    DS.hp = Math.min(DS.maxHp, DS.hp + 10); DS.sp = Math.min(DS.maxSp, DS.sp + 3);
    addLog('Warlord! The kill restores 10 HP and 3 SP.');
  }
  fxReset();
  var e = DS.enemy;
  try { resetGunState(); } catch(e2) {}
  // Daily Quest — defeated an enemy without taking damage this combat
  if (!DS._tookDamageThisCombat) updateDailyQuestProgress('nodmg', 1);
  // Soulbound weapon — restore 5 SP on every kill
  if (DS.equippedWeapon && DS.equippedWeapon.rarityEffect === 'soulbound' && DS.sp !== undefined) {
    DS.sp = Math.min(DS.maxSp, (DS.sp || 0) + 5);
    addLog('💠 Soulbound blade restores 5 SP.');
    updateXPBar();
  }

  // Time Descender — every kill path (attack, heavy, skills, DoT ticks, guns,
  // scrolls, potions) ends up here since enemyDead() reads DS.enemy directly,
  // so one check covers all of them instead of patching each site. Phase 1
  // transitions into phase 2 ("The Clock"); if phase 2 itself is somehow
  // killed through one of those side paths instead of its own attack-window
  // loop, still route to the real victory payout rather than generic loot.
  if (e && e.isTimeDescender) {
    if (e.phase === 2) { setTimeout(function() { timeDescenderVictory(); }, 300); return; }
    setTimeout(function() { timeDescenderPhaseTwo(); }, 300);
    return;
  }

  // Interactive tutorial practice fight (Training Shade) — no loot/XP, just resume
  // the tutorial overlay at the next step once the player's had their reps in.
  if (e && e.isTutorialEnemy) {
    DS.inCombat = false;
    addLog('✨ The Training Shade dissolves. Practice complete!');
    say('Practice fight complete! Continuing the tutorial.');
    showDgPanels(true, false, false);
    setTimeout(function() { resumeTutorialAfterCombat(); }, 1000);
    return;
  }

  // hollowZombie — revives once at 20% HP
  if (e && e.hollowZombie && !e._zombieRevived) {
    e._zombieRevived = true;
    e.hp = Math.round((e.maxHp || 30) * 0.20);
    updateEnemyBar();
    sfx('sfx-hurt');
    addLog('🧟 ' + e.name + ' falls — then rises again. It will not stay down.');
    say(e.name + ' rises from death at 20 percent HP. Strike it down again.');
    vibe && vibe(VIBE.undeadRises);
    setCombatBtns(true);
    return;
  }

  // Shadow World — Echo boss triggers Shapeshifter after death
  if (DS.dungeon === 'The Shadow World' && e && e.isEcho && e.isBoss) {
    DS.inCombat = false;
    addLog('🌑 The Echo dissolves... but something else stirs in the dark.');
    say('The Echo is destroyed. But the darkness shifts. Something worse emerges.');
    sfx('sfx-victory');
    setTimeout(function() {
      // Now spawn the Shapeshifter
      var shapeshifterTemplate = SHADOW_ENEMIES.bossPool.find(function(b){ return b.isShapeshifter; });
      if (!shapeshifterTemplate) { enterRoom(); return; }
      var _bossLvl = DS.level || 1;
      var _bossLvlMult = 1 + (_bossLvl - 1) * 0.15;
      var _bossHp = Math.round(shapeshifterTemplate.hp * _bossLvlMult);
      DS.enemy = {
        name: shapeshifterTemplate.name, icon: shapeshifterTemplate.icon,
        gold: shapeshifterTemplate.gold, isBoss: true, isMultiPhase: true,
        isShapeshifter: true,
        maxHp: _bossHp, hp: _bossHp,
        atk: shapeshifterTemplate.atk.map(function(a){ return Math.round(a * _bossLvlMult); }),
        phase1Hp: Math.round(_bossHp * 0.66),
        phase2Hp: Math.round(_bossHp * 0.33),
        phaseMsg2: shapeshifterTemplate.phaseMsg2,
        phaseMsg3: shapeshifterTemplate.phaseMsg3,
        phaseMsg4: shapeshifterTemplate.phaseMsg4,
        desc: shapeshifterTemplate.desc
      };
      DS.bossPhase = 1;
      DS.inCombat = true;
      DS.defending = false;
      playTrack('shadow-boss');
      addLog('🌑 THE SHAPESHIFTER EMERGES — wearing your face. Using your name.');
      say('The Shapeshifter. It looks exactly like you. Same class, same level, same weapon. This is the final boss of The Shadow World.');
      updateEnemyBar(); updatePlayerBar();
      setCombatBtns(true); updateSkillButtons();
    }, 2500);
    return;
  }

  // Shadow World — Twice Dead mechanic
  if (DS.dungeon === 'The Shadow World' && e && e.twiceDead && !e._diedOnce) {
    e._diedOnce = true;
    e.hp = Math.round((e.maxHp || 80) * 0.5);
    updateEnemyBar();
    addLog('💀 ' + e.name + ' refuses to stay dead! Returns at ' + e.hp + ' HP!');
    say(e.name + ' refuses to stay dead. It returns at ' + e.hp + ' HP. Kill it again.');
    vibe && vibe(VIBE.undeadRises);
    setCombatBtns(true); updateSkillButtons();
    return; // don't complete the kill yet
  }
  setCombatBtns(true);
  vibe(VIBE.victory);
  try { gainFamiliarBond(2); } catch(e2) {}
  // Clear Friday the 13th bad luck flag
  if (DS._unluckyOne) { DS._unluckyOne = false; addLog('🔲 The Unlucky One is defeated. Your luck returns.'); say('The Unlucky One is defeated. Your luck returns.'); }
  // Alchemy ingredient drop
  try { alchemyDropOnKill(e); } catch(e2) {}
  // Cupid — always drops a Love Potion
  if (e && e.dropsLovePotion && DS.inventory) {
    DS.inventory.push({ name:'Love Potion', icon:'💘', type:'love-potion', desc:'Use on an enemy in combat. Charms them to fight for you for 2 turns.' });
    addLog('💘 The Cupid drops a Love Potion!');
    say('The Cupid dropped a Love Potion.');
  }
  // Check for spell scroll drop
  try { checkSpellScrollDrop(); } catch(e2) {}
  // Blood Pact — steal 2 HP on every kill
  if (DS._bloodPact) {
    DS.hp = Math.min(DS.maxHp, DS.hp + 2);
    updatePlayerBar();
  }
  // Track floor stats
  if (!DS._floorKills) DS._floorKills = 0; DS._floorKills++;
  // Check if player just killed The Hunter
  if (DS.enemy && DS.enemy.isHunter) {
    hunterSlain();
    return;
  }
  // Boss death cinematic
  if (DS.enemy && DS.enemy.isBoss && DS.enemy.hp <= 0) {
    showBossDeathCinematic(function() { _continueBossVictory(); });
    return;
  }
  hunterTurn(false); // killing enemy = one turn passed
  try {
    // Material drop
    try { tryDropMaterial(DS.floor || 1); } catch(e) {}
    // Abyssal Deep — check Witness
    try { if (DS.dungeon === 'The Abyssal Deep' && DS.enemy && DS.enemy.isWitness) { if (checkWitnessAfterKill(DS.enemy)) return; } } catch(e) {}
    // Abyssal Deep — check resurrection
    try { if (DS.dungeon === 'The Abyssal Deep' && DS.enemy) { if (checkAbyssalResurrect(DS.enemy)) return; } } catch(e) {}
    // Abyssal Deep — kill bonus (thermal vent)
    try { applyAbyssalKillBonus(); } catch(e) {}
    // July 4th firework drop and tournament
    try { checkFireworkDrop(); } catch(e2) {}
    try { if (JULY4_TOURNAMENT.active) { addJuly4TournamentScore(25); checkJuly4TournamentEnd(); } } catch(e2) {}
    // Bounty kill tracking
    try {
      var _bEnemy = DS.enemy;
      if (_bEnemy) {
        updateBountyProgress('kill', _bEnemy.name, DS.dungeon);
        if (_bEnemy.isElite) updateBountyProgress('kill_elite', _bEnemy.name, DS.dungeon);
        if (_bEnemy.isBoss) updateBountyProgress('kill_boss', _bEnemy.name, DS.dungeon);
      }
    } catch(e2) {}
    // Warlord kill streak
    // (the streak was added to attack for the whole run; it now resets each floor)
    if (DS._subclassPassive === 'warlord' || DS._subclass === 'warlord') { DS._warlordAtk = (DS._warlordAtk||0) + 2; addLog('👑 Warlord: +2 ATK from kill streak!'); }
    // Death Knight — death feeds you
    if (DS._deathKnightSub) { DS.hp = Math.min(DS.maxHp, DS.hp + 10); addLog('💀 Death feeds you — +10 HP.'); updatePlayerBar(); }
    // Soul Reaper — steal skill from elite/boss
    if (DS._soulReaper && DS.enemy && (DS.enemy.isElite || DS.enemy.isBoss) && DS.skillPool && DS.skillPool.length > 0) {
      var stolen = DS.skillPool.splice(0,1)[0];
      if (stolen && DS.unlockedSkills.indexOf(stolen) === -1) { DS.unlockedSkills.push(stolen); var sk = getSkillByEffect(stolen); addLog('🌀 Soul Reaper: Stole ' + (sk?sk.name:stolen) + '!'); say('Soul Reaper! Stole ' + (sk?sk.name:'a skill') + ' from ' + DS.enemy.name + '.'); }
    }
    // Druid — heal on room enter tracked in enterRoom, but reset warlord ATK on floor change is handled in enterFloor
    // Soul Drinker — heal 5 HP on kill
    if (DS.equippedWeapon && DS.equippedWeapon.soulDrinker) {
      DS.hp = Math.min(DS.maxHp, DS.hp + 5);
      updatePlayerBar();
      addLog('🩸 Soul Drinker feeds — you heal 5 HP!');
    }
    // Necromancer — heal 5 HP per kill
    if (DS.cls === 'Necromancer' && ACCESS.classTraits) {
      DS.hp = Math.min(DS.maxHp, DS.hp + 5); updatePlayerBar();
      addLog('💀 Necromancer feeds — +5 HP.');
    }
    // BloodKnight — heal 8% max HP on boss kill
    if (DS.cls === 'BloodKnight' && ACCESS.classTraits && DS.enemy && DS.enemy.isBoss) {
      var bkHeal = Math.round(DS.maxHp * 0.08);
      DS.hp = Math.min(DS.maxHp, DS.hp + bkHeal); updatePlayerBar();
      addLog('🩸 BloodKnight absorbs the boss power — +' + bkHeal + ' HP!');
    }
    // Vampire race — drain 5 HP per kill
    if (DS.race === 'Vampire' && ACCESS.classTraits) {
      DS.hp = Math.min(DS.maxHp, DS.hp + 5); updatePlayerBar();
    }
    // Award seasonal currency
    awardSeasonalCurrencyOnKill();
    // Try drop enchanter (2.5% chance)
    tryDropEnchanter();
  // Check if this was the DDDI boss
  if (DS.isDDDIBoss) { checkDDDIVictory(); return; }
  DS.inCombat = false;
  DS.enemy = null;
  DS.kills++;
  if (!e) { showDgPanels(true, false, false); enterRoom(); return; }
  // Elite enemy kill — chance to drop an elite spirit
  // Track special enemy kills
  if (e && e.isTwin) incrementAchievementStat('twinKilled', 1);
  if (e && e.isMusicBox) {
    incrementAchievementStat('musicBoxDefeated', 1);
    // Drop the Music Box item — key item for Weeping Child
    var musicBoxItem = { name:'Music Box', icon:'🎵', type:'keyitem', desc:'A small mechanical box. The melody it plays is familiar. Use it on the Weeping Child.', isMusicBoxItem:true };
    DS.inventory.push(musicBoxItem);
    renderInv();
    sayLog('The Music Box dropped a Music Box item. It is now in your inventory. Use it on the Weeping Child.');
  }
  if (e && e.isElite) {
    trackGlobalStat('eliteKills', 1);
    addRunLog('Defeated elite enemy: ' + e.name, 'good');
    updateDailyQuestProgress('elite', 1);
    awardScore('elite_kills', 150);
    incrementAchievementStat('eliteKills', 1);
    if (Math.random() < 0.30 && _charIdx !== null) {
      // 30% chance to earn a random elite spirit
      var ch = CHARS[_charIdx];
      if (!ch.earnedSpirits) ch.earnedSpirits = [];
      var unearned = ELITE_SPIRITS.filter(function(s){ return ch.earnedSpirits.indexOf(s.id) === -1; });
      if (unearned.length > 0) {
        var earned = unearned[Math.floor(Math.random() * unearned.length)];
        ch.earnedSpirits.push(earned.id);
        saveChars();
        sfx('sfx-unlock');
        say('Elite Spirit unlocked! ' + earned.name + ' has joined you. ' + earned.ability);
        setEvent('good', '★ Elite Spirit: ' + earned.icon + ' ' + earned.name + ' unlocked! ' + earned.ability);
        showAchievementToast({ icon: earned.icon, name: earned.name, desc: earned.ability });
      }
    }
  }
  recordKill(e.name);
  checkEquipmentDrop();
  var g = Array.isArray(e.gold) ? rnd(e.gold[0], e.gold[1]) : (parseInt(e.gold) || 5);
  if (DS.goblinGold) g = Math.round(g * 1.25);
  if (DS.graveRobberLoot) g = Math.round(g * 1.20);
  if (DS.equippedWeapon && DS.equippedWeapon.rarityEffect === 'fortune') g = Math.round(g * 1.25);
  if (DS._dailyMod_tripleGold) g = g * 3;
  if (DS._dailyMod_lucky) g = Math.round(g * 1.5);
  var hw = getHollowWeather();
  if (hw && hw.goldMult && DS.dungeon === 'The Hollow') g = Math.round(g * hw.goldMult);
  // Vampire Lord — heal from kills
  // (Vampire Lord healed 20% of the gold dropped; it now heals from damage dealt, in subOnHit)
  // Dungeon weather gold mult
  var _awGold = abyssalWeatherGoldMult();
  if (_awGold !== 1) g = Math.round(g * _awGold);
  var _dwGold = getDungeonWeatherGoldMult();
  if (_dwGold !== 1 && DS.dungeon !== 'The Hollow') g = Math.round(g * _dwGold);
  // Luck bonus gold
  if (DS.luckBonus) g = Math.round(g * (1 + DS.luckBonus));
  // Dream gold mult
  if (DS.dreamGoldMult && DS.dreamGoldMult !== 1) g = Math.round(g * DS.dreamGoldMult);
  // Night Blessing coin upgrade — +10% gold during Night Mode
  if (DS._nightBlessing && isNightTime()) g = Math.round(g * 1.10);
  // Chaos mode gold
  var _cgm = getChaosGoldMult(); if (_cgm !== 1) g = Math.max(1, Math.round(g * _cgm));
  // BUGFIX: Rune of Fortune ("+25% gold from all enemies this run") set a flag
  // (DS._runeFortune) that nothing ever read — it did nothing. Apply it here.
  if (DS._runeFortune) g = Math.round(g * 1.25);
  // Event gold (Void Week, Fourth of July, St. Patrick's, Brazil, Valentine's,
  // Cinco de Mayo, Ambush Day, Friday the 13th) was shown but never paid.
  var _evGold = getEventBonuses();
  if (_evGold && _evGold.goldMult && _evGold.goldMult !== 1) g = Math.max(1, Math.round(g * _evGold.goldMult));
  // Forge: Lucky — 5 more gold a kill
  if (forgeFx() === 'gold-find') g += 5;
  // Corruption Run (100%) — gold drops doubled
  if (DS._corruptionRun) g = g * 2;
  // Lucky Potion: only multi-enemy fights ever read it.
  if (DS._luckPotionKills && DS._luckPotionKills > 0) {
    g = Math.round(g * (DS._luckPotionMult || 2)); DS._luckPotionKills--;
    addLog('🍀 Lucky Potion doubles the gold!' + (DS._luckPotionKills <= 0 ? ' It wears off.' : ''));
  }
  DS.gold += g;
  addGlobalGold(g);
  updateDailyQuestProgress('gold', g);
  trackGlobalStat('totalGold', g);
  updateAchievementStat('bestGoldRun', DS.gold);
  // XP gain
  var tier = getEnemyTier(e.name);
  var xpGain = ENEMY_XP[tier] || 20;
  if (DS._dailyMod_doubleXp) xpGain = xpGain * 2;
  gainXP(xpGain);
  sfx(e.isBoss ? 'sfx-victory' : 'sfx-enemy-die');
  if (e.isBoss) stopBossTimer();
  if (e.isLordPhorcys) recordKill('lord-phorcys');
  if (e.isMedusa) recordKill('medusa');
  addLog(e.name + ' is defeated! You gain ' + g + ' gold and ' + xpGain + ' XP.');
  addRunLog('Defeated ' + e.name + ' — ' + g + 'g, ' + xpGain + ' XP', 'good');
  say(e.name + ' defeated! Gained ' + g + ' gold and ' + xpGain + ' experience. HP: ' + DS.hp);
  if (e.isBoss) addJournalEntry('Defeated ' + e.name + ' — the dungeon boss falls. Gold: ' + DS.gold + '. Enemies slain: ' + DS.kills + '.');
  else if (DS.kills % 5 === 0) addJournalEntry('Reached ' + DS.kills + ' kills. Still standing. HP: ' + DS.hp + '/' + DS.maxHp + '.');
  // 🪙 Mystery coin drop — bosses always drop 1, small chance of 2
  if (e.isBoss) {
    var mcDrop = Math.random() < 0.25 ? 2 : 1;
    addMysteryCoin(mcDrop);
    addLog('🪙 The boss drops ' + mcDrop + ' mystery coin' + (mcDrop > 1 ? 's' : '') + '!');
    say('The boss dropped ' + mcDrop + ' mystery coin' + (mcDrop > 1 ? 's' : '') + '!');
  }
  // 💎 Diamond drop — bosses only, 20% chance
  if (e.isBoss && Math.random() < 0.20) {
    var diamondDrop = Math.floor(Math.random() * 3) + 1; // 1-3 diamonds
    addDiamonds(diamondDrop);
    addLog('💎 The boss drops ' + diamondDrop + ' diamond' + (diamondDrop > 1 ? 's' : '') + '!');
    say('The boss dropped ' + diamondDrop + ' diamond' + (diamondDrop > 1 ? 's' : '') + '!');
  }
  // 🏆 BOSS LOOT — guaranteed unique relic drop based on dungeon
  if (e.isBoss) {
    var bossRelicTable = {
      'Crypt of Malachar':      { name:"Malachar's Crown Fragment", icon:'👑', type:'relic', desc:'A shard of the Undying King\'s crown. Grants +15 max HP and 10% chance to ignore death once per run.', maxHpBonus:15, hasCrownShield:true },
      'The Ashbound Wastes':    { name:'Ember Heart', icon:'❤️‍🔥', type:'relic', desc:'The smoldering core of the Ash boss. Burns enemies for 3 extra damage each turn you attack.', ashBurn:3 },
      'Frosthold Abyss':        { name:'Frostbite Shard', icon:'🧊', type:'relic', desc:'A frozen splinter from the Frost boss. Each attack has 20% chance to freeze the enemy, skipping their next turn.', frostChance:0.20 },
      'The Sunken Archives':    { name:'Drowned Tome', icon:'📖', type:'relic', desc:'A waterlogged grimoire. Grants +20 max SP and spells cost 1 fewer SP.', maxSpBonus:20, spellDiscount:1 },
      'The Hollow':             { name:'Hollow Mask', icon:'🎭', type:'relic', isShadowItem:true, desc:'A mask worn by the Hollow boss. Grants 15% dodge chance and makes you invisible to the Stalker for 3 floors.', hollowDodge:0.15, stalkerImmunity:3 },
      'The Whispering Forest':  { name:'Sylvan Heart', icon:'🌿', type:'relic', desc:'The forest boss\'s life essence. Heals 3 HP every room you enter.', roomHealBonus:3 },
      'The Infernal Descent':   { name:'Infernal Brand', icon:'🔱', type:'relic', desc:'Seared into your palm by the Infernal boss. Grants +8 ATK and makes all fire damage deal 25% more.', atkBonus:8, fireAmp:0.25 },
      'The Abyssal Deep':       { name:'Leviathan Scale', icon:'🐉', type:'relic', desc:'A scale from the deep boss. Grants +25 max HP and reduces all incoming damage by 3.', maxHpBonus:25, dmgReduction:3 },
      'The Shadow World':       { name:'Shadow Tear', icon:'🌑', type:'relic', isShadowItem:true, desc:'A crystallized drop of shadow. Boosts all damage by 12% and makes the Stalker hesitate once.', dmgAmp:0.12, stalkerHesitate:true },
    };
    var bossRelic = bossRelicTable[DS.dungeon];
    // Already carrying this relic (kept from an earlier run): no second copy
    if (bossRelic && DS.inventory && DS.inventory.some(function(i){ return i.type === 'relic' && i.name === bossRelic.name; })) {
      addLog('🏆 ' + bossRelic.icon + ' ' + bossRelic.name + ' — you already carry this relic.');
      bossRelic = null;
    }
    if (bossRelic) {
      var relicCopy = Object.assign({}, bossRelic);
      // Boss relics vanished when the run ended; one of each is now kept
      try { var _rs = _jsonParseSafe(DDStore.getItem('dd_relic_stash'), '{}'); _rs[relicCopy.name] = relicCopy; DDStore.setItem('dd_relic_stash', JSON.stringify(_rs)); } catch (eR) {}
      // Apply immediate stat bonuses
      if (relicCopy.maxHpBonus) { DS.maxHp = (DS.maxHp || 100) + relicCopy.maxHpBonus; DS.hp = Math.min(DS.hp + relicCopy.maxHpBonus, DS.maxHp); }
      if (relicCopy.maxSpBonus) { DS.maxSp = (DS.maxSp || 50) + relicCopy.maxSpBonus; DS.sp = Math.min(DS.sp + relicCopy.maxSpBonus, DS.maxSp); }
      if (relicCopy.atkBonus)   { DS._bossRelicAtkBonus = (DS._bossRelicAtkBonus || 0) + relicCopy.atkBonus; }
      if (relicCopy.hasCrownShield) DS._crownShieldActive = true;
      if (relicCopy.stalkerImmunity) DS._stalkerImmunityFloors = (DS._stalkerImmunityFloors || 0) + relicCopy.stalkerImmunity;
      DS.inventory.push(relicCopy);
      updatePlayerBar();
      renderInv();
      addLog('🏆 ' + relicCopy.icon + ' Boss drops: ' + relicCopy.name + '! ' + relicCopy.desc);
      say('Boss relic acquired! ' + relicCopy.name + '. ' + relicCopy.desc);
      sfx('sfx-unlock');
    }
  }
  // 🔩 Gun part drop — any enemy, 8% chance
  if (Math.random() < 0.08) {
    var partDefs = GUN_PARTS_DEFS;
    var droppedPart = partDefs[Math.floor(Math.random() * partDefs.length)];
    addGunPart(droppedPart.id);
    addLog(droppedPart.icon + ' ' + e.name + ' drops a ' + droppedPart.name + '!');
    say(e.name + ' dropped a ' + droppedPart.name + '. Gun crafting part collected.');
  }
  // Quest tracking
  updateDailyQuestProgress('kills', 1);
  // (totalKills was incremented twice here, so kill achievements unlocked at half the kills)
  incrementAchievementStat('totalKills', 1);
  trackGlobalStat('totalKills', 1);
  awardScore('enemy_kills', 10);
  if (DS.enemy && DS.enemy.name === 'Hollow Shade') incrementAchievementStat('hollowShadeKills', 1);
  if (DS.floor > (getAchievementStats().maxFloorReached || 0)) updateAchievementStat('maxFloorReached', DS.floor);
  applySpiritOnKill();
  if (typeof applyTraitOnKill === 'function' && e) applyTraitOnKill(e);
  // Sanity Drainer drops Insanity Potion
  if (DS.enemy && DS.enemy.isSanityDrainer) {
    var potion = { name:'Insanity Potion', icon:'🔴', type:'insanity', desc:'A potion of unknown effect. It could restore your sanity completely. Or drain it.', isInsanityPotion:true };
    DS.inventory.push(potion);
    renderInv();
    sayLog('The Sanity Drainer dropped an Insanity Potion! It is now in your inventory. Its effect is unknown.');
  }
  // Warlord — heal on kill
  if (DS.warlord) { DS.hp = Math.min(DS.maxHp, DS.hp + 10); DS.sp = Math.min(DS.maxSp, DS.sp + 3); updatePlayerBar(); updateXPBar(); addLog('Warlord: +10 HP, +3 SP on kill!'); }
  // Soul Fragment drop — 40% chance per kill
  if (Math.random() < 0.40 && !(DS.enemy && DS.enemy.isTutorialEnemy)) {
    var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0');
    frags++;
    DDStore.setItem('dd_soul_fragments', String(frags));
    if (frags % 5 === 0 || frags === 1) {
      addLog('🔮 Soul Fragment collected. ' + frags + ' of 25.');
      if (frags === 1) say('You collected your first Soul Fragment. Collect 25 to build a custom spirit in the Bestiary.');
      else if (frags === 25) { say('You have 25 Soul Fragments! Go to the Bestiary Builder tab to create your own spirit companion.'); sfx('sfx-unlock'); }
      else say('Soul Fragment collected. ' + frags + ' of 25.');
    }
  }
  // Vampire drain
  if (DS.vampiricDrain) {
    DS.hp = Math.min(DS.maxHp, DS.hp + 5);
    updatePlayerBar();
    addLog('Vampiric drain — restored 5 HP.');
  }
  // Angel level-up heal already handled in levelUp()
  updateAchievementStat('maxLevel', DS.level);
  if (e.isBoss) {
    awardScore('boss_kills', 500);
    awardScore('dungeon_clears', 1000);
    // Track unique boss kills
    var bossKillKey = 'boss_' + e.name.split(' ').join('_');
    var bs = getAchievementStats();
    if (!bs[bossKillKey]) {
      bs[bossKillKey] = true;
      bs.uniqueBossKills = (bs.uniqueBossKills || 0) + 1;
      saveAchievementStats(bs);
      checkAchievements();
    }
    if (DS.diff === 'Nightmare') incrementAchievementStat('nightmareBossKills', 1);
    DS.inCombat = false; DS.enemy = null;
    DS._victoryPending = true;
    saveProgress(true); setTimeout(function() { DS._victoryPending = false; showVictory(); }, 1200); return;
  }
  // If elite was killed on floor 10, set roomsOnFloor so the boss triggers next.
  // enterRoom() (called automatically right after this) always does roomsOnFloor++
  // as its first step, so the target here is _rn, not _rn+1 — otherwise that
  // auto-increment pushes the count one past the boss check and the boss gets
  // skipped entirely, going straight to victory.
  if (e.isElite && DS.floor === 10) {
    DS.roomsOnFloor = (DS.floorRoomsNeeded !== undefined ? DS.floorRoomsNeeded : 5);
    DS._eliteKilledFloor10 = true;
    // Pre-boss minion gauntlet — run waves before the boss spawns
    if (!DS._preBossGauntletDone) {
      DS._preBossGauntletDone = false; // will be set true after waves complete
      setTimeout(function() { startPreBossGauntlet(); }, 1200);
      playTrack(exploTrackForFloor(DS.floor));
      saveProgress(); updateTopBar();
      return;
    }
  }
  // Return to floor exploration music after combat
  playTrack(exploTrackForFloor(DS.floor));
  saveProgress(); updateTopBar();
  setTimeout(function() {
    var deathMsgs = [
      'The ' + e.name + ' crumbles. Silence returns — cold and watching.',
      'The ' + e.name + ' falls. The dungeon swallows it whole.',
      'The ' + e.name + ' collapses. You stand over it, breathing hard.',
      'The ' + e.name + ' is gone. The room feels emptier than before.',
      'The ' + e.name + ' dissolves into shadow. It will not return.',
      'The ' + e.name + ' drops. Whatever animated it has left.',
      'The ' + e.name + ' is defeated. The silence that follows is heavy.',
      'The ' + e.name + ' shatters. The pieces do not move.',
      'The ' + e.name + ' falls still. You did not come this far to lose.',
      'The ' + e.name + ' ceases. The dungeon notes your victory.',
      'The ' + e.name + ' is no more. Something deeper stirs in response.',
      'The ' + e.name + ' yields to the dark. You press forward.',
    ];
    var bossDeathMsgs = [
      'The ' + e.name + ' is destroyed. The dungeon shudders around you.',
      'The ' + e.name + ' falls at last. You have earned this floor.',
      'The ' + e.name + ' is no more. Something shifts in the dungeon\'s soul.',
      'The ' + e.name + ' collapses. The dungeon has never been more silent.',
      'The ' + e.name + ' is defeated. You are something the dungeon fears now.',
    ];
    var msgPool = e.isBoss ? bossDeathMsgs : deathMsgs;
    var deathMsg = msgPool[Math.floor(Math.random() * msgPool.length)];
    setCombatBtns(true);
    DS.inCombat = false;
    DS.enemy = null;
    showDgPanels(true, false, false);
    setEvent('good', deathMsg);
    // Track kill streak for coward enemies
    DS._killStreak = (DS._killStreak || 0) + 1;
    // Clear combat state BEFORE entering next room
    DS.inCombat = false;
    DS.enemy = null;
    updateTopBar();
    // If this was a gauntlet minion, hand off to gauntlet handler instead of enterRoom
    if (e && e.isGauntletMinion) {
      onGauntletWaveComplete();
      return;
    }
    enterRoom();
  }, 1000);
  } catch(err) {
    console.error('enemyDead error:', err);
    try { setCombatBtns(true); showDgPanels(true, false, false); enterRoom(); } catch(e2) { goTo('menu'); }
  }
}

function handleDeath() {
  vibe(VIBE.death);
  setTimeout(companionOnDeath, 1000);
  // Check one-time class survival abilities BEFORE hardcore deletion.
  // These are intentional "cheat death once" mechanics that should work in hardcore.
  if (DS._undying && !DS._undyingUsed) {
    DS._undyingUsed = true;
    DS.hp = 1;
    updatePlayerBar();
    addLog('💜 Undying! Death refused you — you survive at 1 HP!');
    say('Undying passive! You survive death at 1 HP. This can only happen once.');
    setCombatBtns(true);
    return;
  }
  // Undying weapon rarity effect — survive a killing blow at 1 HP, once per floor
  if (DS.equippedWeapon && DS.equippedWeapon.rarityEffect === 'undying' && !DS._weaponUndyingUsedFloor) {
    DS._weaponUndyingUsedFloor = true;
    DS.hp = 1;
    updatePlayerBar();
    addLog('💜 The Undying blade refuses death — you survive at 1 HP!');
    say('Undying weapon activates! Death refused. You survive at 1 HP.');
    setCombatBtns(true);
    return;
  }
  // Sanctuary armor rarity effect — survive a killing blow at 1 HP, once per floor
  if (DS.equippedArmor && DS.equippedArmor.rarityEffect === 'sanctuary' && !DS._armorSanctuaryUsedFloor) {
    DS._armorSanctuaryUsedFloor = true;
    DS.hp = 1;
    updatePlayerBar();
    addLog('🛡️ Sanctuary armor refuses death — you survive at 1 HP!');
    say('Sanctuary armor activates! Death refused. You survive at 1 HP.');
    setCombatBtns(true);
    return;
  }
  // Crown Fragment relic — 10% chance to ignore death once per run (it always worked)
  if (DS._crownShieldActive && !DS._crownShieldUsed && Math.random() < 0.10) {
    DS._crownShieldUsed = true;
    DS._crownShieldActive = false;
    DS.hp = Math.round(DS.maxHp * 0.20);
    updatePlayerBar();
    addLog('👑 Malachar\'s Crown Fragment shines — death is refused! You survive at 20% HP!');
    say('Crown Fragment activates! Death refused. You survive at 20 percent HP. The relic is spent.');
    setCombatBtns(true);
    return;
  }
  // Phoenix Feather — purchased/found consumable, auto-revives once if carried
  if (DS.inventory) {
    var pfIdx = -1;
    for (var pfi = 0; pfi < DS.inventory.length; pfi++) {
      if (DS.inventory[pfi].type === 'phoenix-feather') { pfIdx = pfi; break; }
    }
    if (pfIdx !== -1) {
      DS.inventory.splice(pfIdx, 1);
      DS.hp = Math.max(1, Math.round(DS.maxHp * 0.30));
      updatePlayerBar();
      addLog('🔥 The Phoenix Feather ignites. You are reborn from the ashes at 30% HP!');
      say('The Phoenix Feather ignites! You rise again at 30 percent HP. The feather crumbles to ash.');
      renderInv(); saveProgress();
      setCombatBtns(true);
      return;
    }
  }
  // In hardcore, after one-time saves are exhausted, delete the character immediately
  if (DS.hardcoreMode && handleHardcoreDeath()) return;
  try {
  stopBossTimer();
  DS.inCombat = false;
  // Normalize lives — if undefined/NaN treat as 0
  if (typeof DS.lives !== 'number' || isNaN(DS.lives)) DS.lives = 0;
  DS.lives = Math.max(0, DS.lives - 1);
  // Corruption Mode — every life lost darkens your soul (only one rare death ever added it)
  try { addCharCorruption((DS.floor || 1) >= 7 ? 10 : (DS.floor || 1) >= 4 ? 7 : 5); } catch (eC) {}
  // Log this death
  var killerName = DS.enemy ? DS.enemy.name : 'the dungeon';
  logDeath(_charIdx, DS.floor, killerName);
  checkLegends();
  trackGlobalStat('totalDeaths', 1);
  addRunLog('Slain by ' + killerName + ' on floor ' + DS.floor, 'bad');
  saveProgress();
  // Play death sound — wrapped extra carefully for Safari which can throw fatal rejections
  try {
    var deathSfxName = (typeof DS.lives === 'number' && DS.lives <= 0) ? 'sfx-gameover' : 'sfx-death';
    var deathSnd = AUD && AUD.sfx && AUD.sfx[deathSfxName];
    if (deathSnd) {
      deathSnd.currentTime = 0;
      var deathPlay = deathSnd.play();
      if (deathPlay && typeof deathPlay.catch === 'function') deathPlay.catch(function() {});
    }
  } catch(e) {}
  // (Skill Orbs were made here on every lost life, wiping your Home upgrades
  // each time; they are made when the run ends in death, below)
  // Resurrection — Paladin skill
  if (DS.lives <= 0 && DS.resurrection) {
    DS.resurrection = false;
    DS.lives = 1;
    DS.hp = Math.round(DS.maxHp * 0.50);
    DS.inCombat = false;
    showDgPanels(true, false, false);
    setEvent('good', 'Resurrection! You return from death with 50% HP. The divine will not save you twice.');
    say('Resurrection! Returned from death with 50% HP.'); updateTopBar(); return;
  }
  // DeathKnight — survive once at 1 HP
  if (DS.lives <= 0 && DS.deathKnightRevive && ACCESS.classTraits) {
    DS.deathKnightRevive = false; DS.lives = 1; DS.hp = 1; DS.inCombat = false;
    showDgPanels(true, false, false);
    setEvent('good', 'Undying Resolve — death refused. You stand at 1 HP.');
    say('Undying Resolve. You refuse to die. 1 HP. This will not happen again.');
    updateTopBar(); return;
  }
  // Second Wind — survive killing blow with 1 HP once
  if (DS.lives <= 0 && DS.secondWind) {
    DS.secondWind = false;
    DS.lives = 1;
    DS.hp = 1;
    DS.inCombat = false;
    showDgPanels(true, false, false);
    setEvent('good', 'Second Wind! You cling to life with 1 HP. The upgrade has been consumed.');
    say('Second Wind activated! You survived with 1 HP. This can only happen once per run.');
    updateTopBar(); return;
  }
  // Death's Bargain — final counterattack on death
  if (DS.lives <= 0 && DS._deathsBargain && DS.enemy && DS.enemy.hp > 0) {
    DS._deathsBargain = false;
    var finalDmg = Math.round((DS.atk ? DS.atk[1] : 20) * 2);
    DS.enemy.hp = Math.max(0, DS.enemy.hp - finalDmg);
    updateEnemyBar();
    addLog("⚰️ Death's Bargain — final strike for " + finalDmg + " damage!");
    say("Death's Bargain activates! Final strike — " + finalDmg + " damage to " + DS.enemy.name + "!");
    vibe(VIBE.bossKill);
    if (DS.enemy.hp <= 0) {
      setTimeout(function(){ enemyDead(); }, 500);
      return;
    }
  }
  if (DS.lives <= 0) {
    // Boss retry — offer a second chance if killed by a boss
    if (DS.enemy && DS.enemy.isBoss && !DS._bossRetryUsed) {
      setTimeout(function() { showBossRetry(); }, 800);
    } else {
      // A lost Gauntlet sends the character home
      if (_gauntletActive) endGauntlet();
      medusaStillLooksCheck();
      try { homeCreateSkillOrbs(); } catch(e) {}
      say('Defeated. All lives lost.');
      setTimeout(function() {
        try {
          showDefeat();
        } catch(e) {
          console.error('[DD] showDefeat crashed:', e);
          // Nuclear fallback — just get to runsummary no matter what
          try {
            document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
            var rs = document.getElementById('screen-runsummary');
            if (rs) { rs.classList.add('active'); _currentScreen = 'runsummary'; }
          } catch(e2) {}
        }
      }, 800);
    }
  }
  else {
    DS.hp = Math.round(DS.maxHp * 0.4);
    DS.inCombat = false;
    showDgPanels(true, false, false);
    setEvent('danger', 'Death took you — but your soul clings to this world. You awaken, weakened. Lives remaining: ' + DS.lives + '.');
    speakCritical('You died. ' + DS.lives + ' life remaining. Restored to 40 percent health.');
    updateTopBar();
  }
  } catch(err) {
    console.error('handleDeath error:', err);
    try {
      DS.inCombat = false;
      buildRunSummary(false);
      goTo('runsummary');
    } catch(e2) {
      console.error('handleDeath fallback failed:', e2);
      // Never go to menu on death — always try runsummary
      try {
        document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
        var rs = document.getElementById('screen-runsummary');
        if (rs) { rs.classList.add('active'); _currentScreen = 'runsummary'; }
        say('Run ended. Return to menu when ready.');
      } catch(e3) { console.error('Nuclear fallback failed:', e3); }
    }
  }
}

function logDeath(charIdx, floor, killedBy) {
  if (charIdx === null) return;
  var ch = CHARS[charIdx];
  if (!ch) return;
  if (!ch.deathLog) ch.deathLog = [];
  var now = new Date();
  var dateStr = (now.getMonth()+1) + '/' + now.getDate() + '/' + now.getFullYear();
  var timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
  // Add to character journal too
  if (DS.journalLog) {
    DS.journalLog.push({ time: (new Date().getMonth()+1)+'/'+(new Date().getDate())+' Floor '+floor, text: 'Fell to ' + killedBy + ' on floor ' + floor + '.' });
    ch.journal = DS.journalLog;
  }
  var deathFlavor = {
    'Crypt of Malachar':    'The Crypt is silent again. As if you were never there.',
    'The Ashbound Wastes':  'The ash settles. The fire does not notice.',
    'Frosthold Abyss':      'The cold closes over the gap you left. Perfectly.',
    'The Sunken Archives':  'The water was always still. Now it is still again.',
    'Nightmare':            'The nightmare continues. You simply stopped being in it.',
  };
  ch.deathLog.unshift({
    floor: floor,
    killedBy: killedBy,
    date: dateStr,
    time: timeStr,
    level: DS.level,
    kills: DS.kills,
    gold: DS.gold,
    dungeon: DS.dungeon,
    diff: DS.diff,
    bestDmg: DS.bestDmgThisRun || 0,
    skillsUnlocked: DS.unlockedSkills ? DS.unlockedSkills.length : 0,
    spirit: DS.activeSpirit ? DS.activeSpirit.name : 'None',
    flavor: deathFlavor[DS.dungeon] || 'The dungeon continues without you.',
  });
  // Keep last 5 deaths per character
  if (ch.deathLog.length > 5) ch.deathLog = ch.deathLog.slice(0, 5);
  saveChars();
}

function updateEnemyBar() {
  var e = DS.enemy;
  var pct = Math.max(0, (e.hp / e.maxHp) * 100);
  document.getElementById('dg-enemy-bar').style.width = pct + '%';
  document.getElementById('dg-enemy-hp').textContent = 'HP: ' + e.hp + ' / ' + e.maxHp;
  document.getElementById('dg-enemy-hp').setAttribute('aria-label', e.name + ' health: ' + e.hp + ' of ' + e.maxHp);
}

function updatePlayerBar() {
  // Track HP as of just before this update — the death recap on the run
  // summary screen reads DS._hpBeforeLastHit to say what your health was
  // right before the killing blow, since by the time DS.hp itself is read
  // after death it's already 0.
  try {
    if (DS) {
      DS._hpBeforeLastHit = (typeof DS._hpAtLastUpdate === 'number') ? DS._hpAtLastUpdate : DS.hp;
      DS._hpAtLastUpdate = DS.hp;
    }
  } catch(e) {}
  // Low HP heartbeat — two tiers. Warning at <=10% (800ms beat, same as
  // before). Critical at <=5% restarts the loop faster (400ms) and adds
  // a spoken critical alert, so "about to die" reads differently from
  // "getting risky" instead of the same beat all the way down to 0 HP.
  try {
    if (DS && DS.hp > 0 && DS.maxHp > 0 && typeof _HUNTER_AUDIO !== 'undefined' && !DS.hunterMode) {
      var hpPct = DS.hp / DS.maxHp;
      if (hpPct <= 0.05) {
        if (_hpWarnTier !== 2) { _hpWarnTier = 2; startHeartbeatLoop(400); speakCritical('Critical! Health nearly gone.'); }
      } else if (hpPct <= 0.10) {
        if (_hpWarnTier !== 1) { _hpWarnTier = 1; startHeartbeatLoop(800); companionOnLowHP(); }
      } else if (_hpWarnTier !== 0) {
        _hpWarnTier = 0; stopHeartbeatLoop();
      }
    }
  } catch(e) {}
  var pct = Math.max(0, (DS.hp / DS.maxHp) * 100);
  document.getElementById('dg-player-bar').style.width = pct + '%';
  document.getElementById('dg-player-hp').textContent = 'HP: ' + DS.hp + ' / ' + DS.maxHp;
  document.getElementById('dg-player-hp').setAttribute('aria-label', 'Your health: ' + DS.hp + ' of ' + DS.maxHp);
  // Show corruption stacks in Shadow World
  updateShadowCorruptionDisplay();
}

// ── SHADOW WORLD — CORRUPTION SYSTEM ─────────────────────────────────────────
// Named distinctly from addCorruption()/updateCorruptionDisplay() below —
// those belong to the unrelated Whispering Forest sanity meter and the
// per-character corruptionMode bar, and a same-name collision would silently
// shadow this entire mechanic (later declaration in the file wins).
function addShadowCorruption(stacks, source) {
  if (DS.dungeon !== 'The Shadow World') return;
  DS._shadowCorruption = (DS._shadowCorruption || 0) + stacks;
  var msg = '🌑 Shadow Corruption +' + stacks + (source ? ' (' + source + ')' : '') + '. Stacks: ' + DS._shadowCorruption + '.';
  addLog(msg);
  if (DS._shadowCorruption >= 3) {
    say('Shadow Corruption at ' + DS._shadowCorruption + ' stacks. Your attacks deal half damage. Use Purge to clear it.');
  } else {
    say('Shadow Corruption ' + DS._shadowCorruption + ' stack' + (DS._shadowCorruption > 1 ? 's' : '') + '.');
  }
  updateShadowCorruptionDisplay();
}

function purgeCorruption() {
  if (!DS._shadowCorruption || DS._shadowCorruption === 0) {
    say('No corruption to purge.');
    return false;
  }
  var cost = 4; // SP cost
  if (DS.sp < cost) {
    say('Not enough SP to purge. Need ' + cost + ' SP.');
    return false;
  }
  DS.sp = Math.max(0, DS.sp - cost);
  var cleared = DS._shadowCorruption;
  DS._shadowCorruption = 0;
  addLog('✨ Shadow Purge — ' + cleared + ' corruption stack' + (cleared > 1 ? 's' : '') + ' cleared! Costs ' + cost + ' SP.');
  say('Purge. Corruption cleared. ' + cost + ' SP spent.');
  updateShadowCorruptionDisplay();
  updatePlayerBar();
  return true;
}

function getCorruptionDamageMult() {
  if (!DS._shadowCorruption || DS._shadowCorruption < 3) return 1;
  // Each 3 stacks = 50% damage reduction, cap at 75%
  var stacks = DS._shadowCorruption;
  if (stacks >= 9) return 0.25;
  if (stacks >= 6) return 0.5;
  return 0.5; // 3+ stacks = half damage
}

function updateShadowCorruptionDisplay() {
  var el = document.getElementById('dg-shadow-corruption');
  if (!el) return;
  var stacks = DS._shadowCorruption || 0;
  if (DS.dungeon === 'The Shadow World' && stacks > 0) {
    el.style.display = '';
    el.textContent = '🌑 Corruption: ' + stacks + (stacks >= 3 ? ' — HALF DAMAGE' : '');
    el.setAttribute('aria-label', 'Shadow corruption ' + stacks + ' stack' + (stacks !== 1 ? 's' : '') + (stacks >= 3 ? '. Your attacks deal half damage.' : '.'));
  } else {
    el.style.display = 'none';
  }
}

// Apply shadow enemy mechanics — called in applyEnemyMechanicsOnTurn
function applyShadowEnemyMechanics(e, dmgToPlayer) {
  if (DS.dungeon !== 'The Shadow World') return dmgToPlayer;

  // Lurker — guaranteed critical second turn
  if (e.lurkerHide && e._lurkerHiding) {
    e._lurkerHiding = false;
    e._lurkerStrike = true;
  }
  if (e._lurkerStrike) {
    e._lurkerStrike = false;
    dmgToPlayer = Math.round(dmgToPlayer * 2.5);
    addLog('👁️ The Lurker strikes from the shadows! Critical hit for ' + dmgToPlayer + '!');
    say('Lurker critical hit! ' + dmgToPlayer + ' damage.');
  }

  // Reflection — mirrors last player action
  if (e.reflection && DS._lastCombatAction) {
    if (DS._lastCombatAction === 'defend') {
      // Player defended — Reflection heals instead of attacking
      var heal = 15;
      e.hp = Math.min(e.maxHp || e.hp, e.hp + heal);
      updateEnemyBar();
      addLog('🪞 The Reflection mirrors your defense — it heals ' + heal + ' HP!');
      say('Reflection mirrors your defense and heals ' + heal + ' HP.');
      return 0; // no damage to player
    }
  }

  // corruptOnHit — adds corruption stacks
  if (e.corruptOnHit) {
    addShadowCorruption(e.corruptOnHit, e.name);
  }

  // Void Weaver — corruption web passive damage
  if (e.corruptWeb && e._webActive) {
    DS.hp = Math.max(0, DS.hp - 8);
    updatePlayerBar();
    addLog('🕸️ Void Web deals 8 shadow damage!');
    say('Shadow web burns. 8 damage.');
    if (DS.hp <= 0) { setTimeout(function(){ handleDeath(); }, 300); return 0; }
  }

  // Sorrow Hound — fear on first turn
  if (e.fearHowl && !e._howled) {
    e._howled = true;
    DS._fearTurns = 3;
    addLog('🐕 ' + e.name + ' howls! Your damage is reduced 20% for 3 turns.');
    say(e.name + ' howls with sorrow. Your damage reduced 20% for 3 turns.');
  }

  // Void Weaver — activate web on first turn
  if (e.corruptWeb && !e._webActive && !e._webActivated) {
    e._webActive = true;
    e._webActivated = true;
    addLog('🕸️ ' + e.name + ' weaves a shadow web! 8 passive damage per turn until destroyed by Heavy Strike.');
    say(e.name + ' weaves a shadow corruption web. 8 damage per turn. Use Heavy Strike to destroy it.');
  }

  // ── HOLLOW MECHANICS ──
  // The Portrait — gains +2 ATK each turn it watches
  if (e.hollowWatch) {
    e._watchStacks = (e._watchStacks || 0) + 2;
    e.atk = [e.atk[0] + 2, e.atk[1] + 2];
    if (e._watchStacks <= 6) addLog('🖼️ The Portrait watches. Its gaze sharpens. +2 ATK (' + e._watchStacks + ' stacks).');
  }
  // The Bell Ringer — skips player turn on turn 2
  if (e.hollowBell && !e._bellRung) {
    e._bellTurn = (e._bellTurn || 0) + 1;
    if (e._bellTurn === 2) {
      e._bellRung = true;
      DS._abyssalLostTurn = true; // your next attack is lost (it only announced the skipped turn)
      addLog('🔔 THE BELL RINGS. Your next turn is skipped!');
      say('The bell rings. Your turn is lost.');
      // The extra damage is already applied — just announce the stun
    }
  }
  // The Wall Crawler — every other attack bypasses defense
  if (e.hollowCrawl) {
    e._crawlTurn = (e._crawlTurn || 0) + 1;
    if (e._crawlTurn % 2 === 0) {
      dmgToPlayer = Math.round(dmgToPlayer * 1.5);
      addLog('🧱 The Wall Crawler attacks from above — defense bypassed! +50% damage.');
      say('Wall Crawler ceiling attack. Defense bypassed.');
    }
  }
  // The Hollow Matron — all enemies deal +10% damage while she lives (applied at combat start)
  // The Groundskeeper — heals 5 HP per turn
  if (e.hollowGround && e.hp > 0) {
    var healAmt = 5;
    e.hp = Math.min(e.maxHp || e.hp, e.hp + healAmt);
    updateEnemyBar();
    addLog('⚰️ The Groundskeeper tends to its wounds. +' + healAmt + ' HP.');
  }
  // The Pale Guest (Vampire) — heals 8 HP on every hit it lands (handled in applyEnemyMechanicsOnHit)
  // The Unfinished (Ghost) — 30% dodge handled in applyEnemyMechanicsOnHit

  return dmgToPlayer;
}

// Shadow World ambush — echoes of enemies already killed this run
function spawnShadowAmbush() {
  // Get enemies killed this run
  var killed = DS._shadowKilledEnemies || [];

  if (killed.length >= 2) {
    // Echo ambush — resurrect copies of killed enemies
    var count = Math.min(killed.length, DS.floor >= 7 ? 3 : 2);
    var shuffled = killed.slice().sort(function(){ return Math.random() - 0.5; });
    var enemies = shuffled.slice(0, count).map(function(e) {
      var echo = Object.assign({}, e);
      echo.name = 'Echo of ' + e.name;
      echo.hp = Math.round(e.maxHp * 0.75); // echoes have 75% HP
      echo.maxHp = echo.hp;
      echo.isEcho = true;
      echo.corruptOnHit = 1; // echoes always add corruption
      return echo;
    });
    addLog('🔄 The shadows stir — echoes of the fallen rise again!');
    say('Shadow ambush. Echoes of enemies you defeated return from the dark.');
    startMultiCombat(enemies);
    return true;
  }

  // Not enough kills yet — regular shadow enemies
  var tier = DS.floor <= 3 ? 't1' : DS.floor <= 6 ? 't2' : 't3';
  var pool = (SHADOW_ENEMIES[tier] || []).filter(function(e){ return !e.isBoss; });
  if (pool.length < 2) return false;
  var count = DS.floor >= 7 ? 3 : 2;
  var enemies = [];
  for (var i = 0; i < count; i++) {
    var e = pool[Math.floor(Math.random() * pool.length)];
    var enemy = Object.assign({}, e);
    enemy.maxHp = enemy.hp;
    enemies.push(enemy);
  }
  startMultiCombat(enemies);
  return true;
}
