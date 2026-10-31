// ── MULTI-STAGE BOSS ──
function showPhaseTransitionModal(title, msg, color, onDismiss) {
  var modal = document.getElementById('phase-transition-modal');
  if (!modal) return;
  if (onDismiss) modal._onDismiss = onDismiss;

  // Update content
  document.getElementById('phase-modal-title').textContent = title;
  document.getElementById('phase-modal-title').style.color = color || '#ff2200';
  document.getElementById('phase-modal-title').style.textShadow = '0 0 30px ' + (color || '#ff2200');
  document.getElementById('phase-modal-msg').textContent = msg;

  // Disable combat buttons while modal is open
  setCombatBtns(false);

  // Show modal
  modal.style.display = 'flex';

  // Play trap sound — sounds like an alarm/alert
  sfx('sfx-trap');

  // Focus the button for screen reader
  setTimeout(function() {
    var btn = modal.querySelector('button');
    if (btn) btn.focus();
  }, 100);

  // Also say it dramatically
  say(title + '. ' + msg + '. Press Continue to keep fighting.');
}

function dismissPhaseModal() {
  var modal = document.getElementById('phase-transition-modal');
  if (modal) modal.style.display = 'none';
  // Fire callback if set (e.g. phase 4 rhythm game)
  if (modal && modal._onDismiss) {
    var fn = modal._onDismiss;
    modal._onDismiss = null;
    fn();
    // Safety — re-enable after callback in case callback forgets
    setTimeout(function() {
      if (DS && DS.inCombat && DS.enemy && DS.enemy.hp > 0 && DS.hp > 0) {
        var atk = document.getElementById('cbtn-attack');
        if (atk && atk.disabled) setCombatBtns(true);
      }
    }, 500);
    return;
  }
  // Re-enable combat buttons
  setCombatBtns(true);
  say('Phase transition acknowledged. Keep fighting!');
}

function showBossPhaseBar(phase, totalPhases) {
  var total = totalPhases || 3;
  var bar = document.getElementById('boss-phase-bar');
  var pips = document.getElementById('boss-phase-pips');
  var label = document.getElementById('boss-phase-label');
  if (bar) bar.style.display = '';
  if (label) label.textContent = 'Phase ' + phase + ' of ' + total;
  if (pips) {
    pips.innerHTML = '';
    for (var i = 1; i <= total; i++) {
      var pip = document.createElement('div');
      pip.className = 'boss-phase-pip' + (i <= phase ? ' active' : '');
      pips.appendChild(pip);
    }
  }
  say('Phase ' + phase + ' of ' + total + '.');
}

function checkBossPhase() {
  var e = DS.enemy;
  if (!e || !e.isMultiPhase) return false;

  // ── THE SHAPESHIFTER — Shadow World 4-phase boss ──
  if (e.isShapeshifter && DS.dungeon === 'The Shadow World') {
    var ch = _charIdx !== null ? CHARS[_charIdx] : null;
    var maxHp = e.maxHp || 500;

    if (DS.bossPhase === 1 && e.hp <= Math.round(maxHp * 0.75)) {
      DS.bossPhase = 2;
      showBossPhaseBar(2, 4);
      // Copy player's weapon damage
      if (DS.atk) {
        e._originalAtk = e.atk.slice();
        e.atk = [DS.atk[0] + 5, DS.atk[1] + 8];
      }
      var msg = e.phaseMsg2 || 'The Shapeshifter copies your weapon — attacks now deal your weapon damage!';
      addLog('🌑 PHASE 2 — ' + msg);
      say('Phase 2. The Shapeshifter copies your weapon. Its attacks grow stronger.');
      showPhaseTransitionModal('🌑 PHASE 2', msg, '#9966cc');
      return true;
    }

    if (DS.bossPhase === 2 && e.hp <= Math.round(maxHp * 0.50)) {
      DS.bossPhase = 3;
      showBossPhaseBar(3, 4);
      // Match player's current HP
      e.hp = Math.max(1, DS.hp);
      e.maxHp = Math.max(1, DS.hp);
      updateEnemyBar();
      var msg3 = e.phaseMsg3 || 'The Shapeshifter matches your current HP. It will not let you outlast it.';
      addLog('🌑 PHASE 3 — ' + msg3);
      say('Phase 3. The Shapeshifter now has ' + DS.hp + ' HP — matching yours exactly.');
      showPhaseTransitionModal('🌑 PHASE 3', msg3, '#6633aa');
      return true;
    }

    if (DS.bossPhase === 3 && e.hp <= Math.round(Math.max(1, DS.hp) * 0.50)) {
      DS.bossPhase = 4;
      showBossPhaseBar(4, 4);
      // Use player's skills — add corruption on every hit
      e.corruptOnHit = 2;
      e.atk = e.atk.map(function(v){ return Math.round(v * 1.5); });
      var msg4 = e.phaseMsg4 || 'Final Form — The Shapeshifter uses ALL your skills. Fight yourself.';
      addLog('💀 FINAL FORM — ' + msg4);
      say('Final form. The Shapeshifter unleashes everything. Every hit adds 2 corruption. Use Purge.');
      showPhaseTransitionModal('💀 FINAL FORM', msg4, '#330055');
      vibe && vibe(VIBE.finalForm);
      return true;
    }
    return false;
  }

  // ── THE HARD VOID special phase system ──
  if (e.phase2Hp !== undefined && e.phase3Hp !== undefined && (DS.dungeon === 'The Infernal Descent' || DS.dungeon === 'The Infernal')) {
    if (DS.bossPhase === 1 && e.hp <= e.phase2Hp) {
      DS.bossPhase = 2;
      showBossPhaseBar(2);
      e.atk = e.atk.map(function(v){ return Math.round(v * 1.3); });
      // Show fullscreen alert
      showInfernalPhaseAlert(2, e.phase2Desc || 'THE VOID SHIFTS. Phase 2 begins.');
      return true;
    }
    if (DS.bossPhase === 2 && e.hp <= e.phase3Hp) {
      DS.bossPhase = 3;
      showBossPhaseBar(3);
      e.atk = e.atk.map(function(v){ return Math.round(v * 1.4); });
      // Pick random weak point
      var wps = e.weakPoints || ['heavy','attack','skill'];
      DS._infernalWeakPoint = wps[Math.floor(Math.random() * wps.length)];
      DS._infernalHpDrainActive = true;
      // Show fullscreen alert with weak point hint
      var hints = {
        heavy: 'Strike with everything you have. Precision over brute force will not work here.',
        attack: 'Strike precisely. Measured. Controlled. Not with force — with accuracy.',
        skill: 'Channel your energy. A skill strike will find the opening.'
      };
      showInfernalPhaseAlert(3, (e.phase3Desc || 'FINAL PHASE. The Void consumes.') + '\n\n' + hints[DS._infernalWeakPoint]);
      return true;
    }
    return false;
  }

  if (DS.bossPhase === 1 && e.hp <= e.phase1Hp) {
    DS.bossPhase = 2;
    showBossPhaseBar(2);
    var phaseMsg = e.phaseMsg2 || 'The boss enters phase 2 — it grows more powerful!';
    addLog('⚡ PHASE TRANSITION — ' + phaseMsg);
    e.atk = e.atk.map(function(v) { return Math.round(v * 1.25); });
    showPhaseTransitionModal('⚡ PHASE 2', phaseMsg, '#cc2200');
    // Switch to phase 2 music if in Abyssal Deep
    if (DS.dungeon === 'The Abyssal Deep') playTrack('abyssal-boss-p2');
    return true;
  }
  if (DS.bossPhase === 2 && e.hp <= e.phase2Hp) {
    // Check if this boss has 4 phases
    if (e.fourPhase && e.phase3Hp !== undefined) {
      DS.bossPhase = 3;
      showBossPhaseBar(3, 4);
      var phase3Msg = e.phaseMsg3 || 'Phase 3 — the boss grows desperate!';
      addLog('⚡ PHASE 3 — ' + phase3Msg);
      e.atk = e.atk.map(function(v) { return Math.round(v * 1.3); });
      showPhaseTransitionModal('⚡ PHASE 3', phase3Msg, '#660088');
      // Switch to phase 3 music if in Abyssal Deep
      if (DS.dungeon === 'The Abyssal Deep') playTrack('abyssal-boss-p3');
      return true;
    }
    DS.bossPhase = 3;
    showBossPhaseBar(3);
    var phase3Msg = e.phaseMsg3 || 'Final phase — the boss unleashes everything!';
    addLog('⚡ FINAL PHASE — ' + phase3Msg);
    e.atk = e.atk.map(function(v) { return Math.round(v * 1.35); });
    showPhaseTransitionModal('💀 FINAL PHASE', phase3Msg, '#880000');
    // Switch to phase 3 music if in Abyssal Deep
    if (DS.dungeon === 'The Abyssal Deep') playTrack('abyssal-boss-p3');
    return true;
  }
  if (DS.bossPhase === 3 && e.fourPhase && e.phase3Hp !== undefined && e.hp <= e.phase3Hp) {
    updateAchievementStat('phase4Reached', 1);
    DS.bossPhase = 4;
    showBossPhaseBar(4, 4);
    var phase4Msg = e.phaseMsg4 || 'The abyss awakens. This is the final phase.';
    addLog('💀 THE ABYSS AWAKENS — ' + phase4Msg);
    e.atk = e.atk.map(function(v) { return Math.round(v * 1.5); });
    // Switch to phase 4 music if in Abyssal Deep — most intense track
    if (DS.dungeon === 'The Abyssal Deep') playTrack('abyssal-boss-p4');
    // Show phase 4 alert then trigger rhythm game
    showPhaseTransitionModal('💀 THE ABYSS', phase4Msg, '#000044', function() {
      setTimeout(function() { triggerRhythmGame(); }, 800);
    });
    return true;
  }
  return false;
}



// ── THE HARD VOID PHASE ALERT SYSTEM ──
function showInfernalPhaseAlert(phase, message) {
  if (document.getElementById('ov-infernal-phase')) return;
  // Pause combat buttons
  setCombatBtns(false);
  sfx('sfx-sanity-warning');

  var ov = document.createElement('div');
  ov.id = 'ov-infernal-phase';
  ov.style.cssText = 'position:fixed;inset:0;background:#000;z-index:500;display:flex;align-items:center;justify-content:center;padding:20px;';
  ov.setAttribute('role', 'alertdialog');
  ov.setAttribute('aria-modal', 'true');
  ov.setAttribute('aria-labelledby', 'infernal-phase-title');

  var color = phase === 3 ? '#ff2200' : '#ff6600';
  var title = phase === 3 ? '⚠ FINAL PHASE' : '⚠ PHASE ' + phase;

  var phaseHtml = '<div id="infernal-phase-title" style="max-width:360px;width:100%;background:#0a0000;border:2px solid ' + color + ';padding:24px;text-align:center;">';
  phaseHtml += '<div style="font-size:1.8rem;margin-bottom:12px;" aria-hidden="true">🔥</div>';
  phaseHtml += '<div style="font-family:sans-serif;font-size:1rem;color:' + color + ';margin-bottom:8px;">' + title + '</div>';
  phaseHtml += '<div style="font-family:sans-serif;font-size:0.72rem;color:#888;line-height:1.7;margin-bottom:20px;white-space:pre-line;">' + message + '</div>';
  phaseHtml += '<button type="button" onclick="dismissInfernalPhaseAlert()" style="width:100%;padding:14px;background:#1a0000;border:2px solid ' + color + ';color:#ff6644;font-family:sans-serif;font-size:0.8rem;cursor:pointer;" aria-label="Continue the fight">Continue →</button>';
  phaseHtml += '</div>';
  ov.innerHTML = phaseHtml;
  document.body.appendChild(ov);

  // Focus the button for screen readers
  setTimeout(function() {
    var btn = ov.querySelector('button');
    if (btn) btn.focus();
  }, 100);

  say(title + '. ' + message + '. Press OK to continue combat.');
}

function dismissInfernalPhaseAlert() {
  var ov = document.getElementById('ov-infernal-phase');
  if (ov) ov.remove();
  // Resume combat
  setCombatBtns(true);
  var firstBtn = document.querySelector('.dg-act-btn:not([disabled])');
  if (firstBtn) firstBtn.focus();
  say('Combat resumed. Choose your action.');
}

// Apply Hard Void phase 3 HP drain on each enemy turn
function checkInfernalHpDrain() {
  if (!DS._infernalHpDrainActive) return;
  if (DS.dungeon !== 'The Infernal') return;
  var drain = 5 + Math.floor(DS.floor / 2);
  DS.hp = Math.max(1, DS.hp - drain);
  updatePlayerBar();
  addLog('The Void drains ' + drain + ' HP from you.', 'bad');
  say('The Void drains ' + drain + ' HP. Your HP: ' + DS.hp + '.');
}

// Check if player used the weak point action
function checkInfernalWeakPoint(action) {
  if (!DS._infernalWeakPoint || DS.bossPhase !== 3) return 1;
  if (action === DS._infernalWeakPoint) {
    addLog('WEAK POINT HIT! The Void recoils.', 'good');
    say('WEAK POINT! Massive damage!');
    return 3; // 3x damage multiplier
  }
  return 1;
}
// ── END HARD VOID PHASE SYSTEM ──
var BOSS_RIDDLES = [
  { q: 'I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?',
    a: ['A map', 'A dream', 'A mirror'], correct: 0 },
  { q: 'The more you take, the more you leave behind. What am I?',
    a: ['Footsteps', 'Memories', 'Gold'], correct: 0 },
  { q: 'I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?',
    a: ['An echo', 'A shadow', 'A flame'], correct: 0 },
  { q: 'I have hands but cannot clap. I have a face but no eyes. I tell you something important, but I never speak. What am I?',
    a: ['A clock', 'A statue', 'A corpse'], correct: 0 },
  { q: 'What can run but never walks, has a mouth but never talks, has a head but never weeps, has a bed but never sleeps?',
    a: ['A river', 'A shadow', 'The wind'], correct: 0 },
  { q: 'I am always hungry and must always be fed. The finger I touch will soon turn red. What am I?',
    a: ['Fire', 'Poison', 'A blade'], correct: 0 },
  { q: 'The man who makes it does not need it. The man who buys it does not use it. The man who uses it does not know it. What is it?',
    a: ['A coffin', 'A weapon', 'A crown'], correct: 0 },
  { q: 'What has roots as nobody sees, is taller than trees, up, up, up it goes, and yet never grows?',
    a: ['A mountain', 'A dungeon', 'A grave'], correct: 0 },
  { q: 'I am not alive, but I grow. I have no lungs, but I need air. I have no mouth, but water kills me. What am I?',
    a: ['Fire', 'Darkness', 'Stone'], correct: 0 },
  { q: 'What gets stronger the more you take away from it?',
    a: ['A hole', 'A wound', 'A shadow'], correct: 0 },
  { q: 'I have no eyes, no ears, no mouth — yet I see everything that enters this place. What am I?',
    a: ['The dungeon', 'The dark', 'The door'], correct: 0 },
  { q: 'Alive without breath, cold as death, never thirsty, ever drinking. What am I?',
    a: ['A fish', 'A ghost', 'The hollow'], correct: 0 },
];

var _bossRiddleUsed = false;
var _bossRiddleActive = false;
var _bossRiddleTimer = null;
var _bossRiddleSeconds = 30;

function rollBossRiddle() {
  if (_bossRiddleUsed) return;
  if (!DS.enemy || !DS.enemy.isBoss) return;
  // ~22% chance per attack after phase transition
  if (Math.random() > 0.22) return;
  _bossRiddleUsed = true;
  showBossRiddle();
}

function showBossRiddle() {
  _bossRiddleActive = true;
  _bossRiddleSeconds = 30;
  setCombatBtns(false); // Disable combat buttons during riddle

  var riddle = BOSS_RIDDLES[Math.floor(Math.random() * BOSS_RIDDLES.length)];
  // The right answer was always the first — shuffle a copy
  var _order = [0, 1, 2].sort(function(){ return Math.random() - 0.5; });
  riddle = { q: riddle.q, a: _order.map(function(k){ return riddle.a[k]; }), correct: _order.indexOf(riddle.correct) };
  DS._activeRiddle = riddle;

  var ov = document.getElementById('ov-boss-riddle');
  document.getElementById('br-question').textContent = riddle.q;
  var btns = document.querySelectorAll('.br-answer-btn');
  btns.forEach(function(btn, i) {
    btn.textContent = riddle.a[i];
    btn.setAttribute('aria-label', 'Answer ' + (i+1) + ': ' + riddle.a[i]);
    btn.onclick = function() { answerBossRiddle(i); };
  });
  document.getElementById('br-timer').textContent = '30';
  ov.classList.add('open');

  say('The boss pauses. It speaks. ' + riddle.q + ' Answer 1: ' + riddle.a[0] + '. Answer 2: ' + riddle.a[1] + '. Answer 3: ' + riddle.a[2] + '. You have 30 seconds.');
  setTimeout(function() {
    var firstBtn = document.querySelector('.br-answer-btn');
    if (firstBtn) firstBtn.focus();
  }, 200);

  _bossRiddleTimer = setInterval(function() {
    _bossRiddleSeconds--;
    var timerEl = document.getElementById('br-timer');
    if (timerEl) timerEl.textContent = _bossRiddleSeconds;
    if (_bossRiddleSeconds === 10) say('10 seconds remaining.');
    if (_bossRiddleSeconds === 5) say('5. 4. 3. 2. 1.');
    if (_bossRiddleSeconds <= 0) {
      clearInterval(_bossRiddleTimer);
      answerBossRiddle(-1); // timeout = wrong
    }
  }, 1000);
}

function answerBossRiddle(idx) {
  if (!_bossRiddleActive) return;
  _bossRiddleActive = false;
  clearInterval(_bossRiddleTimer);

  var riddle = DS._activeRiddle;
  var correct = riddle && idx === riddle.correct;
  var ov = document.getElementById('ov-boss-riddle');
  ov.classList.remove('open');
  setCombatBtns(true);

  if (correct) {
    var heal = 59;
    DS.hp = Math.min(DS.maxHp, DS.hp + heal);
    updatePlayerBar();
    addLog('✓ Correct. The boss is silent. You feel stronger. +59 HP.');
    say('Correct answer. The boss falls silent. You recover 59 HP.');
    addRunLog('Answered the boss riddle correctly. +59 HP.', 'good');
    incrementAchievementStat('riddlesCorrect', 1);
    checkAchievements();
    sfx('sfx-unlock');
  } else {
    var boost = 0.25;
    if (DS.enemy && DS.enemy.atk) {
      DS.enemy.atk = DS.enemy.atk.map(function(v) { return Math.round(v * (1 + boost)); });
    }
    addLog('✗ Wrong. The boss grows furious. Its attack increased by 25%.');
    say('Wrong answer. The boss is enraged. Its attack has increased by 25 percent.');
    addRunLog('Failed the boss riddle. Boss attack +25%.', 'bad');
    incrementAchievementStat('riddlesWrong', 1);
    checkAchievements();
    sfx('sfx-hit');
  }

  setTimeout(function() {
    document.getElementById('cbtn-attack').focus();
  }, 100);
}


//═════════════════
// BOSS TIMER SYSTEM
//═════════════════
var _bossTimerInterval = null;
var _bossTimerSeconds = 0;
var _bossTimerEnraged = false;

function startBossTimer() {
  if (!ACCESS || ACCESS.bossTimer === false) return; // respect setting
  _bossTimerEnraged = false;
  _bossRiddleUsed = false;
  var isHollow = DS.dungeon === 'The Hollow';
  var isInsane = DS.diff === 'Insane';
  // Hollow gets 3 min, everyone else 5 min, Insane cuts it by 1 min
  var minutes = isHollow ? 3 : 5;
  if (isInsane) minutes = Math.max(2, minutes - 1);
  _bossTimerSeconds = minutes * 60;
  updateBossTimerDisplay();
  var tw = document.getElementById('boss-timer-wrap');
  if (tw) tw.style.display = '';
  say('Boss timer started. You have ' + minutes + ' minutes to reduce the boss below 50 percent HP.');

  _bossTimerInterval = setInterval(function() {
    _bossTimerSeconds--;
    updateBossTimerDisplay();
    // Warnings
    if (_bossTimerSeconds === 60) say('One minute remaining on the boss timer.');
    if (_bossTimerSeconds === 30) say('30 seconds. Hurry.');
    if (_bossTimerSeconds === 10) say('10 seconds!');
    if (_bossTimerSeconds <= 0 && !_bossTimerEnraged) {
      bossTimerEnrage();
    }
  }, 1000);
}

function updateBossTimerDisplay() {
  var el = document.getElementById('boss-timer-display');
  if (!el) return;
  var m = Math.floor(_bossTimerSeconds / 60);
  var s = _bossTimerSeconds % 60;
  el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  el.style.color = _bossTimerSeconds <= 30 ? '#ff4444' : _bossTimerSeconds <= 60 ? '#ffaa00' : '#a0e0ff';
}

function stopBossTimer() {
  clearInterval(_bossTimerInterval);
  _bossTimerInterval = null;
  var wrap = document.getElementById('boss-timer-wrap');
  if (wrap) wrap.style.display = 'none';
}

function checkBossTimerThreshold() {
  // Called after every player attack on boss
  // If boss HP below 50% and timer still running — stop timer, player made it
  if (!_bossTimerInterval || _bossTimerEnraged) return;
  var e = DS.enemy;
  if (!e || !e.isBoss) return;
  if (e.hp <= Math.round(e.maxHp * 0.50)) {
    stopBossTimer();
    addLog('⏱ You beat the timer! The boss staggers.');
    say('You beat the boss timer! The boss is staggered.');
    addRunLog('Beat the boss timer threshold.', 'good');
    incrementAchievementStat('bossTimerBeaten', 1);
    checkAchievements();
  }
}

function bossTimerEnrage() {
  _bossTimerEnraged = true;
  stopBossTimer();
  var e = DS.enemy;
  if (!e || !e.isBoss) return;

  // +25% attack
  e.atk = e.atk.map(function(v) { return Math.round(v * 1.25); });

  // Spawn a minion — dungeon specific
  var minionName = DS.dungeon === 'The Hollow' ? 'Hollow Shade' :
                   DS.dungeon === 'The Ashbound Wastes' ? 'Ash Wraith' :
                   DS.dungeon === 'Frosthold Abyss' ? 'Frost Revenant' :
                   DS.dungeon === 'The Sunken Archives' ? 'Drowned Scholar' : 'Crypt Stalker';

  addLog('⚠ TIME\'S UP — ' + e.name + ' grows impatient. Attack +25%. ' + minionName + ' joins the fight!');
  say('Time is up. The boss grows impatient. Attack increased by 25 percent. A ' + minionName + ' joins the fight.');
  addRunLog('Boss timer ran out. Boss enraged. Minion spawned.', 'bad');

  // Visual flash
  var wrap = document.getElementById('dg-combat-wrap');
  if (wrap) { wrap.style.animation = 'none'; wrap.style.borderColor = '#ff2222'; }

  // Add minion to combat log as flavor
  incrementAchievementStat('bossEnrages', 1);
  checkAchievements();
  sfx('sfx-hit');
}


//═════════════════
// THE VOID REAPER — GLOBAL WORLD EVENT SYSTEM (v11.1)
//═════════════════
// All state lives in Firebase RTDB under /void_reaper
// so every player worldwide shares the same boss, HP, and countdown.

var VR_GLOBAL_HP     = 50000;     // Shared HP pool for all players
var VR_PLAYER_DMG    = 500;       // Damage each attack deals to global pool
var VR_WINDOW_HOURS  = 24;        // Hours to defeat once awake
var VR_STR_BONUS     = 0.59;      // +59% strength bonus for player
var VR_GOLD_REWARD   = 2000;      // Gold reward for participating in kill
var VR_COIN_REWARD   = 50;        // Mystery Coins reward for kill
var VR_PUNISH_HOURS  = 24;        // Hours enemies are 50% stronger if failed

var _vrListener      = null;      // RTDB listener handle
var _vrState         = null;      // Latest cached RTDB state
var _vrSeeding       = false;     // Prevents double-seed on temporary disconnect
var _vrChatListener  = null;      // VR screen reuses global chat listener ref

function getVRRef() {
  if (!window._fbRtdb) return null;
  return window._fbRtdb.ref('void_reaper');
}

// ── INIT: attach real-time listener for VR state ──
function initVoidReaper() {
  var ref = getVRRef();
  if (!ref) return;
  ref.on('value', function(snap) {
    var data = snap.val();
    if (!data) {
      // First time ever — seed the state as admin would; wait for seeding
      _vrState = null;
    } else {
      _vrState = data;
    }
    updateVRMenuBanner();
    // If currently on VR screen, refresh it live
    var vrScreen = document.getElementById('screen-void-reaper');
    if (vrScreen && vrScreen.classList.contains('active')) {
      renderVRScreen();
    }
  }, function(err) {
    console.warn('[VR] RTDB listen error:', err);
  });
}

// ── SEED: called by dev tool or first-boot if no state exists ──
function vrSeedState(daysUntilWake) {
  var ref = getVRRef();
  if (!ref) return;
  var days = daysUntilWake || (7 + Math.floor(Math.random() * 14)); // 1–3 weeks
  var now = Date.now();
  var initial = {
    countdownStart: now,
    targetWakeDate: now + (days * 24 * 60 * 60 * 1000),
    currentHp: VR_GLOBAL_HP,
    totalHp: VR_GLOBAL_HP,
    awake: false,
    defeated: false,
    punishmentUntil: 0,
    killCount: 0,           // total players who attacked
    lastKiller: null,       // username of player who dealt killing blow
    awakenedAt: 0,
    windowExpiredAt: 0,
  };
  ref.set(initial);
}

// ── STATE HELPERS ──
function getVRState() {
  if (!_vrState) return { loading: true };
  var s = _vrState;
  var now = Date.now();
  var pct = 0;
  if (s.countdownStart && s.targetWakeDate) {
    var total = s.targetWakeDate - s.countdownStart;
    var elapsed = now - s.countdownStart;
    pct = Math.min(99, Math.floor((elapsed / total) * 100));
    if (s.awake) pct = 100;
  }
  var hoursLeft = 0;
  if (s.awakenedAt) {
    hoursLeft = Math.max(0, Math.ceil((VR_WINDOW_HOURS * 3600000 - (now - s.awakenedAt)) / 3600000));
  }
  var windowExpired = s.awake && s.awakenedAt && (now - s.awakenedAt > VR_WINDOW_HOURS * 3600000) && !s.defeated;
  var daysLeft = s.targetWakeDate ? Math.max(0, Math.ceil((s.targetWakeDate - now) / 86400000)) : 0;
  var punishActive = s.punishmentUntil && now < s.punishmentUntil;
  return {
    pct: pct,
    daysLeft: daysLeft,
    awake: !!s.awake && !s.defeated && !windowExpired,
    defeated: !!s.defeated,
    windowExpired: windowExpired,
    hoursLeft: hoursLeft,
    currentHp: s.currentHp !== undefined ? s.currentHp : VR_GLOBAL_HP,
    totalHp: s.totalHp || VR_GLOBAL_HP,
    killCount: s.killCount || 0,
    lastKiller: s.lastKiller || null,
    punishActive: !!punishActive,
    punishUntil: s.punishmentUntil || 0,
    awakenedAt: s.awakenedAt || 0,
    targetWakeDate: s.targetWakeDate || 0,
  };
}

// ── CHECK: server-side auto-awaken / expire (runs on banner update) ──
function vrCheckServerTransitions() {
  var ref = getVRRef();
  if (!ref || !_vrState) return;
  var now = Date.now();
  var s = _vrState;

  // Defeated, but the cycle never restarted — this used to depend entirely
  // on the killing-blow player's own client staying open for 10 more seconds
  // after victory (see vrVictory()'s setTimeout below). If they closed the
  // app before that fired — which is exactly what most players do right
  // after "Victory!" — nothing else in the game ever rechecked this state,
  // so the shared world boss stayed stuck on "Dormant. The cycle resets."
  // forever, for every player, until a dev manually reset it. Any client
  // that next opens the menu now restarts it instead, same as every other
  // transition here already works.
  if (s.defeated) {
    vrRestartCycle();
    return;
  }

  // Time to awaken?
  if (!s.awake && !s.defeated && s.targetWakeDate && now >= s.targetWakeDate) {
    ref.update({ awake: true, awakenedAt: now });
    vrSendSystemChat('🌑 THE VOID REAPER HAS AWAKENED. You have ' + VR_WINDOW_HOURS + ' hours. Fight together.');
    return;
  }

  // Window expired without defeat?
  if (s.awake && !s.defeated && s.awakenedAt && (now - s.awakenedAt > VR_WINDOW_HOURS * 3600000)) {
    var punishUntil = now + (VR_PUNISH_HOURS * 3600000);
    ref.update({
      awake: false,
      defeated: false,
      windowExpiredAt: now,
      punishmentUntil: punishUntil,
    });
    vrSendSystemChat('💀 The Void Reaper was not stopped. All dungeons are cursed for ' + VR_PUNISH_HOURS + ' hours.');
    // Restart cycle
    setTimeout(function() { vrRestartCycle(); }, 3000);
  }
}

function vrRestartCycle() {
  var ref = getVRRef();
  if (!ref) return;
  var days = 7 + Math.floor(Math.random() * 14);
  var now = Date.now();
  ref.update({
    countdownStart: now,
    targetWakeDate: now + (days * 24 * 60 * 60 * 1000),
    currentHp: VR_GLOBAL_HP,
    totalHp: VR_GLOBAL_HP,
    awake: false,
    defeated: false,
    awakenedAt: 0,
    windowExpiredAt: 0,
    killCount: 0,
    lastKiller: null,
  });
}

// ── PUNISHMENT CHECK ──
function isVRPunishmentActive() {
  if (!_vrState) return false;
  return _vrState.punishmentUntil && Date.now() < _vrState.punishmentUntil;
}

// ── MENU BANNER ──
function updateVRMenuBanner() {
  var banner = document.getElementById('vr-menu-banner');
  var btn    = document.getElementById('vr-menu-btn');
  if (!banner || !btn) return;

  vrCheckServerTransitions();

  if (!_vrState) {
    // No RTDB data yet — seed if we're connected
    if (window._fbRtdb) {
      banner.textContent = '🌑 The Void — Initializing...';
      banner.style.display = 'block';
      btn.style.display = 'none';
      // Only seed if RTDB confirms truly empty — not just temporarily unloaded
      setTimeout(function() {
        if (!_vrState && !_vrSeeding) {
          _vrSeeding = true;
          // Double-check RTDB directly before seeding to avoid overwriting existing data
          var ref = getVRRef();
          if (ref) {
            ref.once('value', function(snap) {
              if (!snap.val()) {
                // Truly empty — safe to seed
                vrSeedState();
              } else {
                // Data exists — just not loaded yet, don't overwrite
                _vrState = snap.val();
                updateVRMenuBanner();
              }
              _vrSeeding = false;
            });
          }
        }
      }, 3000);
    }
    return;
  }

  var state = getVRState();

  if (state.punishActive) {
    var punishMins = Math.ceil((_vrState.punishmentUntil - Date.now()) / 60000);
    banner.textContent = '💀 VOID CURSE ACTIVE — All enemies +50% stronger for ' + (punishMins > 60 ? Math.ceil(punishMins/60) + 'h' : punishMins + 'm') + ' more.';
    banner.style.display = 'block';
    btn.style.display = 'none';
    return;
  }

  if (state.defeated) {
    banner.textContent = '🌑 The Void — Dormant. The cycle resets.';
    banner.style.display = 'block';
    btn.style.display = 'none';
    return;
  }

  if (state.awake) {
    banner.textContent = '🌑 THE VOID REAPER AWAKENS — ' + state.hoursLeft + 'h remaining. Global HP: ' + state.currentHp.toLocaleString() + ' / ' + state.totalHp.toLocaleString() + '. Fight together!';
    banner.style.display = 'block';
    btn.style.display = 'block';
    btn.textContent = '🌑 Face The Void Reaper';
    return;
  }

  // Counting down
  var wakeDate = state.targetWakeDate ? new Date(state.targetWakeDate).toLocaleDateString([], {month:'short', day:'numeric'}) : 'soon';
  banner.textContent = '🌑 The Void Stirs — ' + state.pct + '% awakened. ' + state.daysLeft + ' day' + (state.daysLeft !== 1 ? 's' : '') + ' until it wakes (' + wakeDate + ').';
  banner.style.display = 'block';
  btn.style.display = 'none';
}

// ── SYSTEM CHAT HELPER ──
function vrSendSystemChat(msg) {
  if (!window._fbRtdb) return;
  window._fbRtdb.ref('global_chat').push({
    username: '⚔ VOID EVENT',
    message: msg,
    timestamp: Date.now(),
    system: true,
  }).catch(function(e) { console.warn('[VR] system chat err:', e); });
}

// ── VR SCREEN ──
function showVoidReaper() {
  var state = getVRState();
  if (state.loading) { say('Connecting to the Void. Please wait a moment.'); return; }
  if (!state.awake) {
    say('The Void Reaper has not yet awakened. ' + state.pct + '% — ' + state.daysLeft + ' days remaining.');
    return;
  }
  goTo('void-reaper');
  renderVRScreen();
  vrInitScreenChat();
  familiarRecognizeVoidReaper();
}

function renderVRScreen() {
  var state = getVRState();
  var el = document.getElementById('vr-char-list');
  if (!el) return;
  el.innerHTML = '';
  var firstBtn = null;
  CHARS.forEach(function(ch, i) {
    if (!ch || !ch.name) return;
    var btn = document.createElement('button');
    btn.className = 'raid-char-btn';
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', i === 0 ? 'true' : 'false');
    btn.setAttribute('aria-label', ch.name + ', ' + ch.cls + ', Level ' + (ch.persistLevel||ch.level||1));
    btn.textContent = ch.name + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel||ch.level||1) + ')';
    btn.onclick = function() {
      document.querySelectorAll('.raid-char-btn').forEach(function(b){ b.setAttribute('aria-checked','false'); b.classList.remove('selected'); });
      btn.setAttribute('aria-checked','true'); btn.classList.add('selected');
      VR.charIdx = i;
      say(ch.name + ' selected.');
    };
    if (i === 0) { btn.setAttribute('aria-checked','true'); btn.classList.add('selected'); VR.charIdx = 0; firstBtn = btn; }
    el.appendChild(btn);
  });
  if (firstBtn) setTimeout(function() { firstBtn.focus(); }, 150);

  var info = document.getElementById('vr-info');
  if (info) {
    var hpPct = Math.max(0, Math.round((state.currentHp / state.totalHp) * 100));
    info.innerHTML =
      '<p style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;letter-spacing:0.2em;margin-bottom:4px;">WORLD BOSS — ALL PLAYERS</p>' +
      '<div style="background:#111;border:1px solid #2a1a4a;border-radius:4px;height:12px;overflow:hidden;margin-bottom:4px;">' +
        '<div style="height:100%;background:linear-gradient(90deg,#4400aa,#8888ff);width:' + hpPct + '%;transition:width 0.5s;"></div>' +
      '</div>' +
      '<p style="color:#a0c0ff;font-family:Cinzel,serif;font-size:0.75rem;"><strong>' + state.currentHp.toLocaleString() + '</strong> / ' + state.totalHp.toLocaleString() + ' HP</p>' +
      '<p style="color:#888;font-size:0.7rem;">' + state.hoursLeft + 'h remaining · ' + state.killCount + ' players have struck · Each attack deals ' + VR_PLAYER_DMG.toLocaleString() + ' damage</p>' +
      (state.lastKiller ? '<p style="color:#cc8844;font-size:0.65rem;font-style:italic;">Last strike by: ' + state.lastKiller + '</p>' : '') +
      '<p style="color:#44cc88;font-size:0.65rem;margin-top:4px;">Kill reward: ' + VR_GOLD_REWARD.toLocaleString() + ' gold + ' + VR_COIN_REWARD + ' Mystery Coins for all attackers</p>';
    say('Global Void Reaper. HP: ' + state.currentHp.toLocaleString() + ' of ' + state.totalHp.toLocaleString() + '. ' + state.hoursLeft + ' hours remaining. ' + state.killCount + ' players have attacked. Each hit deals ' + VR_PLAYER_DMG + ' damage.');
  }
}



// ── VOID REAPER GLOBAL ATTACK ──
var VR = {};
var _vrCooldown = false; // Prevent double-tap spam

function startVRFight() {
  var ch = CHARS[VR.charIdx !== undefined ? VR.charIdx : 0];
  if (!ch || !ch.name) { say('Please select a character first.'); return; }
  var state = getVRState();
  if (!state.awake) { say('The Void Reaper has not awakened yet.'); return; }
  if (state.currentHp <= 0) { say('The Void Reaper has already been defeated.'); return; }

  // Build local combat state (HP for fight-back simulation)
  var maxHp = (HP_MAP[ch.cls] || 100) + 20;
  VR = {
    charIdx: VR.charIdx !== undefined ? VR.charIdx : 0,
    charName: ch.name,
    cls: ch.cls,
    hp: maxHp,
    maxHp: maxHp,
    atkBonus: Math.round((ch.atkBonus||0) * (1 + VR_STR_BONUS)) + 8,
    defBonus: ch.defBonus || 0,
    potions: 3,
    hasAttacked: false, // track if they've dealt global damage this session
  };

  goTo('vr-combat');
  renderVRCombat();
  playTrack('void-reaper');
  say('You face the Void Reaper. Global HP: ' + state.currentHp.toLocaleString() + '. Your HP: ' + VR.hp + '. Attack deals ' + VR_PLAYER_DMG + ' to the shared boss. Coordinate with all players to bring it down.');
}

function renderVRCombat() {
  var state = getVRState();
  var globalHp = state ? state.currentHp : VR_GLOBAL_HP;
  var globalTotal = state ? state.totalHp : VR_GLOBAL_HP;
  var bpct = Math.max(0, Math.round((globalHp / globalTotal) * 100));
  var ppct = Math.max(0, Math.round((VR.hp / VR.maxHp) * 100));

  // Phase based on global HP %
  var phase = 1;
  if (bpct <= 66 && bpct > 33) phase = 2;
  if (bpct <= 33) phase = 3;
  VR.phase = phase;

  var phaseEl = document.getElementById('vrc-phase');
  if (phaseEl) {
    var phaseText = phase === 1 ? 'Phase 1 — The Void Watches' : phase === 2 ? 'Phase 2 — The Void Hungers' : 'Final Phase — The Void Consumes';
    phaseEl.textContent = phaseText;
  }

  document.getElementById('vrc-boss-name').textContent = '🌑 The Void Reaper';
  document.getElementById('vrc-boss-hp').textContent = globalHp.toLocaleString() + ' / ' + globalTotal.toLocaleString() + ' HP (Global)';
  document.getElementById('vrc-boss-bar-fill').style.width = bpct + '%';
  document.getElementById('vrc-player-hp').textContent = VR.hp + ' / ' + VR.maxHp + ' HP';
  document.getElementById('vrc-player-bar-fill').style.width = ppct + '%';

  var potCount = document.getElementById('vrc-potion-count');
  if (potCount) potCount.textContent = VR.potions || 0;
  var healBtn = document.getElementById('vrc-heal-btn');
  if (healBtn) {
    healBtn.style.opacity = (VR.potions || 0) > 0 ? '1' : '0.4';
    healBtn.setAttribute('aria-label', 'Use a health potion. ' + (VR.potions||0) + ' remaining.');
  }
}

function vrHeal() {
  if ((VR.potions || 0) <= 0) {
    say('No potions remaining. Fight on.');
    var log = document.getElementById('vrc-log');
    if (log) { var e = document.createElement('div'); e.style.color='#ff4444'; e.textContent='No potions left!'; log.insertBefore(e,log.firstChild); }
    return;
  }
  var healAmt = Math.round(VR.maxHp * 0.35);
  VR.hp = Math.min(VR.maxHp, VR.hp + healAmt);
  VR.potions--;
  var log = document.getElementById('vrc-log');
  if (log) { var e = document.createElement('div'); e.style.color='#44ff88'; e.textContent='🧪 Potion used — +' + healAmt + ' HP. HP: ' + VR.hp + '/' + VR.maxHp + '. Potions left: ' + VR.potions + '.'; log.insertBefore(e,log.firstChild); }
  say('Potion used. Healed ' + healAmt + ' HP. Now at ' + VR.hp + ' HP. ' + VR.potions + ' potions remaining.');
  // Boss counterattacks even on heal
  var bAtk = rnd(14, 24);
  if (VR.phase === 2) bAtk = Math.round(bAtk * 1.15);
  if (VR.phase === 3) bAtk = Math.round(bAtk * 1.30);
  VR.hp = Math.max(0, VR.hp - bAtk);
  if (log) { var e2 = document.createElement('div'); e2.style.color='#ff6666'; e2.textContent='The Void Reaper strikes — ' + bAtk + ' damage!'; log.insertBefore(e2,log.firstChild); }
  renderVRCombat();
  if (VR.hp <= 0) vrDeath();
}

function vrAttack(type) {
  if (_vrCooldown) return;
  var log = document.getElementById('vrc-log');
  var state = getVRState();
  if (!state || state.currentHp <= 0) {
    say('The Void Reaper has already fallen.');
    return;
  }

  _vrCooldown = true;
  setTimeout(function() { _vrCooldown = false; }, 1200);

  // Local flavor damage (for feedback)
  var base = rnd(12, 20) + VR.atkBonus;
  if (type === 'heavy') base = Math.round(base * 1.6);
  if (type === 'defend') base = Math.round(base * 0.4);

  // Global damage always = VR_PLAYER_DMG (fixed per spec)
  var globalDmg = VR_PLAYER_DMG;
  if (type === 'heavy') globalDmg = Math.round(VR_PLAYER_DMG * 1.2);

  var username = chatGetUsername() || ('Player#' + Math.floor(Math.random()*9000+1000));
  var msg = type === 'heavy' ? '💥 Heavy strike — ' + globalDmg.toLocaleString() + ' damage to the Void Reaper!' :
            type === 'defend' ? '🛡 Defended and struck back — ' + globalDmg.toLocaleString() + ' damage!' :
            '⚔ Attack — ' + globalDmg.toLocaleString() + ' damage!';

  if (log) {
    var entry = document.createElement('div');
    entry.style.color = '#a0e0ff';
    entry.textContent = msg;
    log.insertBefore(entry, log.firstChild);
  }

  // Write global damage to RTDB atomically
  var ref = getVRRef();
  if (ref) {
    var newHp = Math.max(0, (state.currentHp || 0) - globalDmg);
    var updates = {
      currentHp: newHp,
      killCount: (state.killCount || 0) + 1,
      lastKiller: username,
    };
    VR.hasAttacked = true;

    if (newHp <= 0) {
      // Killing blow
      updates.defeated = true;
      updates.awake = false;
      updates.currentHp = 0;
      ref.update(updates).then(function() {
        vrVictory(true); // isKillingBlow = true
      }).catch(function(err) {
        console.warn('[VR] attack write err:', err);
        vrVictory(false);
      });
    } else {
      ref.update(updates).catch(function(err) {
        console.warn('[VR] attack write err:', err);
      });
      // Phase announcements
      var newPct = Math.round((newHp / (state.totalHp || VR_GLOBAL_HP)) * 100);
      if (newPct <= 66 && (state.currentHp / state.totalHp) > 0.66) {
        vrSendSystemChat('⚡ Phase 2 — The Void Hungers. HP: ' + newHp.toLocaleString() + '. Keep pushing!');
        if (log) { var p2 = document.createElement('div'); p2.style.color='#ff8844'; p2.textContent='⚡ Phase 2 — The Void Hungers!'; log.insertBefore(p2,log.firstChild); }
        say('Phase 2. The Void Hungers. Keep attacking.');
      } else if (newPct <= 33 && (state.currentHp / state.totalHp) > 0.33) {
        vrSendSystemChat('🔥 FINAL PHASE — The Void Consumes. ' + newHp.toLocaleString() + ' HP remaining. Finish it!');
        if (log) { var p3 = document.createElement('div'); p3.style.color='#ff4444'; p3.textContent='🔥 FINAL PHASE — The Void Consumes!'; log.insertBefore(p3,log.firstChild); }
        say('Final phase. The Void Consumes. Give everything.');
      }
    }
  }

  say(msg + ' Global HP: ' + Math.max(0, (state.currentHp||0) - globalDmg).toLocaleString() + '.');

  // Boss counterattacks (local HP only, for gameplay tension)
  var bAtk = rnd(18, 32);
  if (VR.phase === 2) bAtk = Math.round(bAtk * 1.25);
  if (VR.phase === 3) bAtk = Math.round(bAtk * 1.5);
  if (type === 'defend') bAtk = Math.round(bAtk * 0.35);

  VR.hp = Math.max(0, VR.hp - bAtk);
  if (log) {
    var bEntry = document.createElement('div');
    bEntry.style.color = '#ff6666';
    bEntry.textContent = type === 'defend' ? '🛡 Defended — reduced to ' + bAtk + ' damage. Your HP: ' + VR.hp + '.' : 'The Void Reaper strikes — ' + bAtk + ' damage! Your HP: ' + VR.hp + '.';
    log.insertBefore(bEntry, log.firstChild);
  }
  renderVRCombat();

  if (VR.hp <= 0 && (state.currentHp - globalDmg) > 0) {
    vrDeath();
  }
}

function vrVictory(isKillingBlow) {
  // Award rewards to this player
  addCoinsToWallet(VR_COIN_REWARD);
  var chIdx = VR.charIdx !== undefined ? VR.charIdx : 0;
  var ch = CHARS[chIdx];
  // (the gold went onto the character, where nothing reads it)
  addGlobalGold(VR_GOLD_REWARD);

  incrementAchievementStat('voidReaperDefeated', 1);
  checkAchievements();

  // Killing blow system chat
  if (isKillingBlow) {
    var username = chatGetUsername() || 'A warrior';
    vrSendSystemChat('🌑 ' + username + ' dealt the killing blow! The Void Reaper has been defeated. All attackers earn ' + VR_GOLD_REWARD.toLocaleString() + ' gold + ' + VR_COIN_REWARD + ' Mystery Coins. The cycle resets.');
  }

  // Update victory screen reward text
  var rewardEl = document.getElementById('vr-victory-reward');
  if (rewardEl) rewardEl.textContent = '+' + VR_GOLD_REWARD.toLocaleString() + ' gold and +' + VR_COIN_REWARD + ' Mystery Coins awarded.';

  goTo('void-reaper-victory');
  setTimeout(function() {
    var btn = document.querySelector('#screen-void-reaper-victory .menu-btn');
    if (btn) btn.focus();
  }, 200);
  speakCritical('Victory! The Void Reaper has been defeated! You earned ' + VR_GOLD_REWARD.toLocaleString() + ' gold and ' + VR_COIN_REWARD + ' Mystery Coins. The dungeons are safe. For now.');

  // Start new cycle after 10 seconds
  setTimeout(function() { vrRestartCycle(); }, 10000);
}

function vrDeath() {
  goTo('void-reaper-death');
  say('You have fallen. Your damage to the global boss carries on. Return and attack again — every hit counts.');
}

// ── VR SCREEN CHAT (reuses global chat, filtered to VR context) ──
function vrInitScreenChat() {
  // We just open global chat inline on the VR screen
  var vrChatEl = document.getElementById('vr-chat-messages');
  if (!vrChatEl || !window._fbRtdb) return;

  vrChatEl.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:10px;">Loading chat...</div>';

  if (_vrChatListener) {
    try { window._fbRtdb.ref('global_chat').off('value', _vrChatListener); } catch(e) {}
    _vrChatListener = null;
  }

  var ref = window._fbRtdb.ref('global_chat').orderByChild('timestamp').limitToLast(30);
  _vrChatListener = function(snap) {
    var messages = [];
    snap.forEach(function(child) { messages.push(child.val()); });
    vrRenderChat(messages);
  };
  ref.on('value', _vrChatListener, function(err) {
    console.warn('[VR Chat] err:', err);
  });
}

function vrRenderChat(messages) {
  var el = document.getElementById('vr-chat-messages');
  if (!el) return;
  var myUsername = chatGetUsername();
  if (!messages.length) {
    el.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:10px;">No messages yet. Coordinate your attack!</div>';
    return;
  }
  el.innerHTML = messages.map(function(msg) {
    var isMe = msg.username === myUsername;
    var isSystem = !!msg.system;
    var time = msg.timestamp ? chatFormatTime(msg.timestamp) : '';
    var nameColor = isSystem ? '#aa44ff' : (isMe ? '#c8a832' : '#7799bb');
    return '<div style="padding:4px 0;border-bottom:1px solid #111;" tabindex="0" aria-label="' + msg.username + ': ' + msg.message + '">' +
      '<span style="font-family:Cinzel,serif;font-size:0.6rem;color:' + nameColor + ';">' + chatEscape(msg.username) + '</span>' +
      '<span style="font-family:Cinzel,serif;font-size:0.52rem;color:#333;margin-left:5px;">' + time + '</span>' +
      '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:' + (isSystem ? '#bb88ff' : '#aaa') + ';margin-top:1px;">' + chatEscape(msg.message) + '</div>' +
    '</div>';
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function vrChatSend() {
  var input = document.getElementById('vr-chat-input');
  var message = (input ? input.value : '').trim();
  var username = chatGetUsername();

  if (!username) {
    // Prompt to set username
    say('Please set a chat username in Global Chat settings first.');
    return;
  }
  if (!message || message.length > 200) { say('Message must be 1 to 200 characters.'); return; }
  if (chatContainsBadWord(message)) { say('Message contains inappropriate content.'); if(input) input.value=''; return; }
  if (!window._fbRtdb) return;

  window._fbRtdb.ref('global_chat').push({
    username: username,
    message: message,
    timestamp: Date.now(),
  }).catch(function(e) { console.warn('[VR Chat] send err:', e); });

  if (input) { input.value = ''; }
}


//═════════════════
// MEDUSA ARC SYSTEM
//═════════════════

// "She Still Looks" — nothing ever counted it: a run ends with Medusa still searching for her father.
function medusaStillLooksCheck() {
  if (DS.medusaJoined && !DS.medusaFatherFound && !DS._medusaStillCounted) {
    DS._medusaStillCounted = true;
    incrementAchievementStat('medusaStillLooks', 1);
    try { checkAchievements(); } catch (e) {}
    addLog('🐍 Medusa never found her father. She still looks for him.');
  }
}

function getMedusaSave() {
  return _jsonParseSafe(DDStore.getItem('dd_medusa'), '{}');
}
function saveMedusa(o) { DDStore.setItem('dd_medusa', JSON.stringify(o)); }

function getMedusaFatherChance() {
  var s = getMedusaSave();
  var base = 0.60;
  var reductions = s.reunions || 0;
  var chance = Math.max(0.36, base - (reductions * 0.03));
  // Reset every 30 days
  if (s.lastReset) {
    var daysSince = (Date.now() - s.lastReset) / (1000 * 60 * 60 * 24);
    if (daysSince >= 30) {
      s.reunions = 0;
      s.lastReset = Date.now();
      saveMedusa(s);
      return base;
    }
  } else {
    s.lastReset = Date.now();
    saveMedusa(s);
  }
  return chance;
}

function rollMedusaSpawn() {
  if (DS.medusaEncounteredThisRun) return false;
  var inRaid = (typeof RD !== 'undefined' && RD.active);
  if (inRaid) return false;
  // Dev force spawn
  if (DS._forceMedusaSpawn) { DS._forceMedusaSpawn = false; return true; }
  // Same rarity as Weeping Child — ~10% floors 4+
  if (DS.floor < 4) return false;
  return Math.random() < 0.10;
}

function triggerMedusa() {
  DS.medusaEncounteredThisRun = true;
  DS.medusaJoined = false;
  DS.medusaFatherFound = false;

  // Spawn Medusa as combat enemy
  var hp = 65 + (DS.floor * 4);
  DS.enemy = {
    name: 'Medusa',
    icon: '🐍',
    hp: hp, maxHp: hp,
    atk: [10, 18],
    gold: [20, 35],
    isMedusa: true,
    isBoss: false,
    gazeStacks: 0,
  };
  DS.enemy.gold = DS.enemy.gold;

  DS.inCombat = true;
  showDgPanels(false, true, false);
  document.getElementById('dg-combat-title').textContent = '🐍 ' + t('Medusa');
  document.getElementById('dg-enemy-icon').textContent = '🐍';
  document.getElementById('dg-enemy-name').textContent = t('Medusa');
  document.getElementById('dg-combat-log').innerHTML = '';
  updateEnemyBar(); updatePlayerBar();
  setCombatBtns(true);
  addLog('A rare figure steps from the shadows of the Hollow. Medusa. Her eyes are closed. For now.');
  addRunLog('Encountered Medusa in The Hollow.', 'special');
  say('Medusa appears. A rare encounter. Her eyes are closed. Fight carefully — her gaze can petrify you. Attack, heavy, defend, or flee.');
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
}

function applyMedusaGaze() {
  var e = DS.enemy;
  if (!e || !e.isMedusa) return;
  e.gazeStacks = (e.gazeStacks || 0) + 1;
  if (e.gazeStacks === 1) {
    DS.defBonus = Math.max(0, DS.defBonus - 3);
    addLog('🐍 Medusa\'s Gaze! Partially petrified. Defense -3 for 2 turns.');
    say('Medusa\'s gaze strikes you. Partially petrified. Defense reduced by 3.');
    DS.gazeDefTimer = 2;
  } else if (e.gazeStacks === 2) {
    addLog('🐍 Medusa\'s Gaze! Fully petrified — you lose your next turn!');
    say('Medusa\'s gaze fully petrifies you. You lose your next turn.');
    DS.petrified = true;
  } else if (e.gazeStacks >= 3) {
    addLog('🐍 Turned to stone. The Hollow has a new statue.');
    say('You have been turned to stone. Medusa\'s gaze claimed you completely.');
    DS.hp = 0;
    handleDeath();
  }
}

function checkMedusaGazeDecay() {
  if (DS.gazeDefTimer && DS.gazeDefTimer > 0) {
    DS.gazeDefTimer--;
    if (DS.gazeDefTimer === 0) {
      DS.defBonus += 3;
      addLog('The petrification fades. Defense restored.');
    }
  }
}

function showMedusaChoice() {
  // Called when Medusa HP hits 0
  window._cinematicInProgress = true;
  window._cinematicStartedAt = Date.now();
  var ov = document.getElementById('ov-medusa-choice');
  if (!ov) { medusaRaiseShield(); return; }
  ov.classList.add('open');
  say('Medusa is defeated. You have a choice. Raise the shield and end it. Or lower the shield and wait. What do you do?');
  setTimeout(function() {
    var btn = document.getElementById('medusa-lower-btn');
    if (btn) btn.focus();
  }, 200);
}

function medusaRaiseShield() {
  window._cinematicInProgress = false;
  var ov = document.getElementById('ov-medusa-choice');
  if (ov) ov.classList.remove('open');
  // Normal kill — record in bestiary, gold drops
  recordKill('Medusa');
  var g = rnd(20, 35);
  DS.gold += g; addGlobalGold(g);
  addLog('You raise the shield. The gaze reflects. Medusa turns to stone. +' + g + ' gold.');
  say('You raised the shield. Medusa is defeated. ' + g + ' gold found.');
  addRunLog('Defeated Medusa — raised the shield.', 'good');
  DS.enemy = null;
  showDgPanels(true, false, false);
  enterRoom();
}

function medusaLowerShield() {
  window._cinematicInProgress = false;
  var ov = document.getElementById('ov-medusa-choice');
  if (ov) ov.classList.remove('open');

  DS.medusaJoined = true;

  // Unlock Medusa spirit on first mercy
  var ch = CHARS[_charIdx];
  if (ch && ch.earnedSpirits && ch.earnedSpirits.indexOf('medusa-spirit') === -1) {
    ch.earnedSpirits.push('medusa-spirit');
    saveChars();
    sfx('sfx-unlock');
    say('Medusa spirit unlocked permanently. She guards those who showed her mercy.');
  }

  addLog('🐍 You lower the shield. You close your eyes. You wait.');
  addLog('The gaze never comes.');
  addLog('She collapses. She is just a girl. She asks you to find her father — Lord Phorcys.');
  say('You lower the shield. The gaze never comes. She collapses into your arms. She asks you to find her father. Lord Phorcys. She will fight alongside you until you find him.');
  addRunLog('Showed mercy to Medusa. She joins you.', 'special');

  incrementAchievementStat('medusaMercy', 1);
  checkAchievements();

  // Medusa as active spirit this run only
  DS.medusaTempSpirit = true;
  DS.enemy = null;
  showDgPanels(true, false, false);

  setEvent('good', '🐍 Medusa joins you. She will help you fight until her father is found.');
  enterRoom();
}

function checkMedusaFatherSpawn() {
  if (!DS.medusaJoined || DS.medusaFatherFound) return false;
  var chance = getMedusaFatherChance();
  return Math.random() < chance;
}

function triggerMedusaFather() {
  DS.medusaFatherFound = true;

  addLog('🐍 A figure appears at the end of the hall. An old man. He sees Medusa. His face changes.');
  addLog('Lord Phorcys. Her father. He has been searching the Hollow for years.');
  say('Lord Phorcys appears. Medusa\'s father. He has been searching for her. They find each other.');

  setTimeout(function() {
    addLog('She runs to him. He catches her. The Hollow goes quiet for a moment.');
    addLog('"Thank you," he says. He presses gold into your hand. "Take it. Please."');
    say('She runs to him. The reunion. Lord Phorcys thanks you and gives you gold.');

    var g = 50;
    DS.gold += g; addGlobalGold(g);
    DS.medusaTempSpirit = false;

    var s = getMedusaSave();
    s.reunions = (s.reunions || 0) + 1;
    if (!s.lastReset) s.lastReset = Date.now();
    saveMedusa(s);

    incrementAchievementStat('medusaReunion', 1);
    checkAchievements();

    addRunLog('Found Lord Phorcys. The reunion complete. +50 gold.', 'special');
    setEvent('good', '🐍 Found. +50 gold. The Hollow is quiet.');
    updatePlayerBar();
  }, 2000);
}

function triggerLordPhorcys() {
  // Father spawns as strong elite enemy when Medusa was never found this run
  var hp = 90 + (DS.floor * 5);
  DS.enemy = {
    name: 'Lord Phorcys',
    icon: '👴',
    hp: hp, maxHp: hp,
    atk: [14, 24],
    gold: [25, 45],
    isElite: true,
    isLordPhorcys: true,
    isBoss: false,
  };
  DS.inCombat = true;
  showDgPanels(false, true, false);
  document.getElementById('dg-combat-title').textContent = '👴 ' + t('Lord Phorcys');
  document.getElementById('dg-enemy-icon').textContent = '👴';
  document.getElementById('dg-enemy-name').textContent = t('Lord Phorcys');
  document.getElementById('dg-combat-log').innerHTML = '';
  updateEnemyBar(); updatePlayerBar();
  setCombatBtns(true);
  addLog('An old man blocks the hall. His eyes are red from crying. He has been searching for his daughter. He does not know you. He only knows she is gone.');
  say('Lord Phorcys. He has been searching for his daughter. He blames everyone he meets. He attacks. He is strong — but broken.');
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
}


//═════════════════
// ACCOUNT SYSTEM — BETA
//═════════════════

function getFirebaseUser() {
  // Always use Firebase auth as source of truth if available
  if (window._fbAuth && window._fbAuth.currentUser) return window._fbAuth.currentUser;
  return window._fbCurrentUser || null;
}

async function syncToCloud(silent) {
  var user = getFirebaseUser();
  if (!user) {
    if (!silent) {
      say('Not signed in. Please sign in first.');
      var err = document.getElementById('account-error');
      if (err) { err.style.color = '#ffaa44'; err.textContent = 'Not signed in. Please sign in first.'; }
    }
    return;
  }
  if (!window._fbSaveData) {
    if (!silent) say('Cloud unavailable. Game saves locally.');
    return;
  }
  var indicator = document.getElementById('account-sync-indicator');
  if (indicator) { indicator.textContent = '⏳ Syncing...'; indicator.style.color = '#ffaa44'; }
  if (!silent) say('Syncing your save data to the cloud. Please wait.');
  try {
    var saveData = {
      chars: DDStore.getItem('dd_chars'),
      unlocks: DDStore.getItem('dd_unlocks'),
      achievements: DDStore.getItem('dd_achievements'),
      globalStats: DDStore.getItem('dd_global_stats'),
      coinUpgrades: DDStore.getItem('dd_coin_upgrades'),
      raidData: DDStore.getItem('dd_raid'),
      medusa: DDStore.getItem('dd_medusa'),
      voidReaper: DDStore.getItem('dd_void_reaper'),
      username: DDStore.getItem('dd_username'),
      titleTag: DDStore.getItem('dd_title_tag'),
      srPromptSeen: DDStore.getItem('dd_sr_prompt_seen'),
      accessSettings: DDStore.getItem('dd_access'),
    };
    if (!silent) say('Uploading save data. Almost done.');
    var ok = await window._fbSaveData(user.uid, saveData);
    if (indicator) {
      indicator.textContent = ok ? '✓ Synced to cloud!' : '✗ Sync failed. Try again.';
      indicator.style.color = ok ? '#44ff88' : '#ff4444';
      setTimeout(function() { if (indicator) indicator.textContent = ''; }, 3000);
    }
    if (!silent) say(ok ? 'Sync complete. Your save data is backed up to the cloud.' : 'Sync failed. Check your connection and try again.');
  } catch(e) {
    console.error('syncToCloud error:', e);
    if (indicator) { indicator.textContent = '✗ Sync error: ' + (e.message || 'unknown'); indicator.style.color = '#ff4444'; }
    if (!silent) say('Sync error. Check your connection.');
  }
}

async function loadFromCloud() {
  var user = getFirebaseUser();
  if (!user) return false;
  say('Loading your save data from the cloud. Please wait.');
  try {
    var data = await window._fbLoadData(user.uid);
    if (!data) { say('No cloud save found. Starting fresh.'); return false; }
    if (data.chars) DDStore.setItem('dd_chars', data.chars);
    if (data.unlocks) DDStore.setItem('dd_unlocks', data.unlocks);
    if (data.achievements) DDStore.setItem('dd_achievements', data.achievements);
    if (data.globalStats) DDStore.setItem('dd_global_stats', data.globalStats);
    if (data.coinUpgrades) DDStore.setItem('dd_coin_upgrades', data.coinUpgrades);
    if (data.raidData) DDStore.setItem('dd_raid', data.raidData);
    if (data.medusa) DDStore.setItem('dd_medusa', data.medusa);
    if (data.voidReaper) DDStore.setItem('dd_void_reaper', data.voidReaper);
    if (data.username) DDStore.setItem('dd_username', data.username);
    if (data.titleTag) DDStore.setItem('dd_title_tag', data.titleTag);
    if (data.srPromptSeen) DDStore.setItem('dd_sr_prompt_seen', data.srPromptSeen);
    if (data.accessSettings) DDStore.setItem('dd_access', data.accessSettings);
    // Reload CHARS into memory from localStorage
    try {
      var freshChars = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]');
      CHARS.length = 0;
      freshChars.forEach(function(c){ CHARS.push(c); });
    } catch(e2) { console.error('CHARS reload error:', e2); }
    // Refresh UI
    renderCharList();
    if (typeof refreshDungeonUnlocks === 'function') refreshDungeonUnlocks();
    if (typeof checkAchievements === 'function') checkAchievements();
    // Navigate to charlist if on menu so player sees their characters
    var active = document.querySelector('.screen.active');
    if (active && (active.id === 'screen-menu' || active.id === 'screen-charlist')) {
      goTo('charlist');
    }
    say('Load complete. Your save data has been restored from the cloud.');
    return true;
  } catch(e) { console.error('loadFromCloud error:', e); say('Load failed. Check your connection.'); return false; }
}

function updateAccountUI() {
  var user = getFirebaseUser();
  var statusEl = document.getElementById('account-status-text');
  var emailEl = document.getElementById('account-email-display');
  var loginSection = document.getElementById('account-login-section');
  var loggedInSection = document.getElementById('account-loggedin-section');
  // Update main menu cloud status indicator
  var menuCloud = document.getElementById('menu-cloud-status');
  if (menuCloud) {
    if (user) {
      var firstName = typeof getPlayerFirstName === 'function' ? getPlayerFirstName() : 'Anon';
      var shortName = firstName.substring(0, 3).toUpperCase();
      menuCloud.textContent = '☁ ' + shortName;
      menuCloud.style.color = '#44ff88';
    } else {
      menuCloud.textContent = '☁ Not signed in';
      menuCloud.style.color = '#666';
    }
  }
  // Update title display
  var titleDisp = document.getElementById('account-title-display');
  if (titleDisp) {
    if (user) {
      titleDisp.textContent = '🏷 ' + (typeof getFullDisplayName === 'function' ? getFullDisplayName() : getDisplayName(user));
    } else {
      titleDisp.textContent = '';
    }
  }
  if (!statusEl) return;
  if (user) {
    statusEl.textContent = 'Signed in';
    statusEl.style.color = '#44ff88';
    var displayName = getDisplayName(user);
    var emailLine = user.email ? displayName + ' (' + user.email + ')' : displayName;
    if (emailEl) emailEl.textContent = emailLine;
    if (loginSection) loginSection.style.display = 'none';
    if (loggedInSection) loggedInSection.style.display = '';
    // Clear any leftover indicators
    var ind = document.getElementById('account-sync-indicator');
    if (ind) ind.textContent = '';
  } else {
    statusEl.textContent = 'Not signed in — saving to local storage';
    statusEl.style.color = '#888';
    if (loginSection) loginSection.style.display = '';
    if (loggedInSection) loggedInSection.style.display = 'none';
  }
}

async function accountSignIn() {
  var email = document.getElementById('account-email-input').value.trim();
  var pw = document.getElementById('account-pw-input').value;
  var err = document.getElementById('account-error');
  if (!email || !pw) { err.textContent = 'Please enter email and password.'; return; }
  if (!window._fbSignIn) { err.textContent = 'Cloud unavailable. The game still saves locally.'; say('Cloud unavailable. Game saves locally as normal.'); return; }
  try {
    err.textContent = 'Signing in...';
    await window._fbSignIn(email, pw);
    err.textContent = '';
    say('Signed in successfully. Syncing your save data.');
    // Store email in users collection so devSendCoins can find them
    var signedInUser = getFirebaseUser();
    if (signedInUser && window._fbDb) {
      window._fbDb.collection('users').doc(signedInUser.uid).set({ email: signedInUser.email, updatedAt: Date.now() }, { merge: true }).catch(function(){});
    }
    var loaded = await loadFromCloud();
    if (loaded) {
      say('Cloud save loaded. Your progress has been restored.');
      setEvent('good', '☁ Cloud save loaded! Your progress has been restored.');
    }
    closeAccountPanel();
    setTimeout(checkUsernameOnLogin, 1500);
  } catch(e) {
    var msg = e.code === 'auth/user-not-found' ? 'No account found. Try creating one.' :
               e.code === 'auth/wrong-password' ? 'Wrong password.' :
               e.code === 'auth/invalid-email' ? 'Invalid email address.' :
               e.code === 'auth/invalid-credential' ? 'Wrong email or password.' :
               e.code === 'auth/operation-not-allowed' ? 'Email sign-in not enabled in Firebase console.' :
               e.code === 'auth/network-request-failed' ? 'Network error. Check your connection.' :
               'Sign in failed: ' + (e.code || e.message || 'unknown error');
    err.style.color = '#ff4444';
    err.textContent = msg;
    say(msg);
    console.error('Firebase signin error:', e.code, e.message);
  }
}

async function accountSignUp() {
  var email = document.getElementById('account-email-input').value.trim();
  var pw = document.getElementById('account-pw-input').value;
  var err = document.getElementById('account-error');
  if (!email || !pw) { err.textContent = 'Please enter email and password.'; return; }
  if (pw.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
  if (!window._fbSignUp) { err.textContent = 'Cloud unavailable. The game still saves locally.'; say('Cloud unavailable. Game saves locally as normal.'); return; }
  try {
    err.textContent = 'Creating account...';
    await window._fbSignUp(email, pw);
    err.textContent = '';
    say('Account created! Syncing your save data to the cloud.');
    await syncToCloud();
    // Store email in users collection
    var newUser = getFirebaseUser();
    if (newUser && window._fbDb) {
      window._fbDb.collection('users').doc(newUser.uid).set({ email: newUser.email, createdAt: Date.now() }, { merge: true }).catch(function(){});
    }
    setEvent('good', '☁ Account created! Your save is now backed up to the cloud.');
    closeAccountPanel();
    setTimeout(checkUsernameOnLogin, 1500);
  } catch(e) {
    var msg = e.code === 'auth/email-already-in-use' ? 'Email already in use. Try signing in.' :
               e.code === 'auth/invalid-email' ? 'Invalid email address.' :
               e.code === 'auth/weak-password' ? 'Password too weak. Use at least 6 characters.' :
               e.code === 'auth/operation-not-allowed' ? 'Email sign-in not enabled. Enable it in Firebase console.' :
               e.code === 'auth/network-request-failed' ? 'Network error. Check your connection.' :
               e.code === 'auth/configuration-not-found' ? 'Firebase not configured. Check console.' :
               'Sign up failed: ' + (e.code || e.message || 'unknown error');
    err.style.color = '#ff4444';
    err.textContent = msg;
    say(msg);
    console.error('Firebase signup error:', e.code, e.message);
  }
}

var _ddSocialLoginInitialized = false;
// Shared by both accountGoogleLogin() and accountAppleLogin() — both
// providers must be registered in the SAME initialize() call, since
// _ddSocialLoginInitialized is one shared flag. If each login function
// called its own initialize() only when the flag was still false,
// whichever provider got tapped first would "win" and the other's
// config would silently never reach the plugin at all.
async function _ddInitSocialLogin() {
  if (_ddSocialLoginInitialized) return;
  console.log('[DD Cloud] Initializing SocialLogin...');
  await _ddWithTimeout(window.Capacitor.Plugins.SocialLogin.initialize({
    google: {
      webClientId: '109323203666-sj667ngkft9jr7h85c5338bvllhl3hoq.apps.googleusercontent.com',
      iOSClientId: '109323203666-sj667ngkft9jr7h85c5338bvllhl3hoq.apps.googleusercontent.com',
      mode: 'online',
    },
    // Native iOS Sign In with Apple doesn't need a clientId here — it
    // authenticates against the app's own bundle ID once the capability
    // is enabled in Xcode, not against a separate Services ID the way
    // the web OAuth flow does.
    apple: {},
  }), 15000, 'SocialLogin.initialize');
  _ddSocialLoginInitialized = true;
  console.log('[DD Cloud] SocialLogin initialized');
}
// Wraps a promise so a hung native call fails loudly instead of leaving the
// UI looking dead forever with no error and no feedback.
function _ddWithTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timed out')), ms)),
  ]);
}
// Polls auth.currentUser instead of awaiting signInWithCredential's promise
// directly, since that promise is known to hang indefinitely in some
// Capacitor/WKWebView environments even after a successful sign-in.
function _ddWaitForAuthUser(auth, timeoutMs) {
  return new Promise((resolve) => {
    var waited = 0;
    var interval = 250;
    var timer = setInterval(function() {
      if (auth.currentUser) {
        clearInterval(timer);
        resolve(auth.currentUser);
        return;
      }
      waited += interval;
      if (waited >= timeoutMs) {
        clearInterval(timer);
        resolve(null);
      }
    }, interval);
  });
}
async function accountGoogleLogin() {
  var err = document.getElementById('account-error');
  var isCapacitorNative = window.Capacitor && typeof Capacitor.getPlatform === 'function' &&
    (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android');
  if (!window._fbAuth) {
    if (err) { err.style.color='#ff4444'; err.textContent = 'Cloud not ready. Check connection.'; }
    say('Cloud not available. Check your internet connection.');
    return;
  }
  if (isCapacitorNative) {
    // iOS/Android native — use @capgo/capacitor-social-login. On iOS this
    // handles the URL scheme redirect automatically (see AppDelegate.swift).
    // signInWithPopup (the web fallback below) doesn't work in either
    // platform's embedded WebView — Google blocks OAuth sign-in there
    // (Error 403: disallowed_useragent) — so both natives must go through
    // this plugin path instead.
    try {
      console.log('[DD Cloud] Google sign-in tapped (native)');
      var SocialLogin = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SocialLogin;
      if (!SocialLogin) throw new Error('SocialLogin plugin not available');
      if (err) err.textContent = 'Opening Google sign in...';
      await _ddInitSocialLogin();
      if (err) err.textContent = 'Waiting for Google...';
      var loginRes = await _ddWithTimeout(SocialLogin.login({
        provider: 'google',
        // forcePrompt skips the plugin's "restore previous sign-in" shortcut,
        // which can otherwise silently reuse a cached Google session from a
        // different app installed via the same personal-team signing
        // identity, handing back a token scoped to the wrong client/project
        // (surfaced as Firebase auth/invalid-credential: "audience ... is
        // not authorized to be used in the project ...").
        options: { scopes: ['email', 'profile'], forcePrompt: true },
      }), 60000, 'SocialLogin.login');
      console.log('[DD Cloud] SocialLogin.login resolved:', loginRes);
      var idToken = loginRes && loginRes.result ? loginRes.result.idToken : null;
      if (!idToken) throw new Error('No idToken returned');
      var credential = firebase.auth.GoogleAuthProvider.credential(idToken);
      if (err) err.textContent = 'Signing into Firebase...';
      // Signing in with an already-obtained credential uses
      // signInWithCredential, not signInWithPopup (which expects an
      // AuthProvider to start a new browser OAuth flow). Known issue: this
      // promise can hang forever in a Capacitor/WKWebView even though the
      // sign-in actually succeeds server-side — auth.currentUser still
      // updates and onAuthStateChanged still fires. So don't block on it;
      // fire it and poll currentUser instead of trusting the promise.
      window._fbAuth.signInWithCredential(credential).catch(function(e) {
        console.log('[DD Cloud] signInWithCredential promise rejected (may be spurious):', e);
      });
      var signedInUser = await _ddWaitForAuthUser(window._fbAuth, 10000);
      if (!signedInUser) throw new Error('Firebase sign-in did not complete');
      console.log('[DD Cloud] signInWithCredential succeeded (via currentUser poll)');
      err.textContent = '';
      say('Signed in with Google. Syncing your save data.');
      var loadedNative = await loadFromCloud();
      if (loadedNative) {
        say('Cloud save loaded.');
        setEvent('good', '☁ Signed in with Google. Cloud save loaded!');
      } else {
        await syncToCloud();
        setEvent('good', '☁ Signed in with Google. Save backed up to cloud.');
      }
      closeAccountPanel();
    } catch(e) {
      console.log('[DD Cloud] Native Google sign in error:', e);
      err.textContent = 'Google sign in failed: ' + (e.message || 'unknown error');
      say('Google sign in failed: ' + (e.message || 'unknown error'));
    }
    return;
  }
  try {
    if (err) err.textContent = 'Opening Google sign in...';
    var provider = new firebase.auth.GoogleAuthProvider();
    await window._fbAuth.signInWithPopup(provider);
    err.textContent = '';
    say('Signed in with Google. Syncing your save data.');
    var loaded = await loadFromCloud();
    if (loaded) {
      say('Cloud save loaded.');
      setEvent('good', '☁ Signed in with Google. Cloud save loaded!');
    } else {
      await syncToCloud();
      setEvent('good', '☁ Signed in with Google. Save backed up to cloud.');
    }
    closeAccountPanel();
  } catch(e) {
    err.textContent = 'Google sign in failed. Try again.';
    say('Google sign in failed.');
  }
}

// Sign in with Apple. Mirrors accountGoogleLogin() — same plugin
// (@capgo/capacitor-social-login), same response shape (result.idToken),
// same Firebase sign-in-with-credential + currentUser-poll pattern to
// dodge the same signInWithCredential-hangs-forever WKWebView quirk.
// NEEDS REAL-DEVICE VERIFICATION before shipping: this can't be tested
// end-to-end without an active Apple Developer Program membership — the
// "Sign In with Apple" capability has to be added to the app's
// entitlements in Xcode (Signing & Capabilities), which itself requires
// that paid membership to provision. Also needs "Apple" enabled as a
// sign-in provider in the Firebase console before any of this can
// actually reach Firebase successfully.
async function accountAppleLogin() {
  var err = document.getElementById('account-error');
  var isCapacitorNative = window.Capacitor && typeof Capacitor.getPlatform === 'function' &&
    (Capacitor.getPlatform() === 'ios' || Capacitor.getPlatform() === 'android');
  if (!window._fbAuth) {
    if (err) { err.style.color='#ff4444'; err.textContent = 'Cloud not ready. Check connection.'; }
    say('Cloud not available. Check your internet connection.');
    return;
  }
  if (isCapacitorNative) {
    try {
      console.log('[DD Cloud] Apple sign-in tapped (native)');
      var SocialLogin = window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.SocialLogin;
      if (!SocialLogin) throw new Error('SocialLogin plugin not available');
      if (err) err.textContent = 'Opening Apple sign in...';
      await _ddInitSocialLogin();
      if (err) err.textContent = 'Waiting for Apple...';
      var loginRes = await _ddWithTimeout(SocialLogin.login({
        provider: 'apple',
        options: { scopes: ['email', 'name'] },
      }), 60000, 'SocialLogin.login');
      console.log('[DD Cloud] SocialLogin.login resolved:', loginRes);
      var idToken = loginRes && loginRes.result ? loginRes.result.idToken : null;
      if (!idToken) throw new Error('No idToken returned');
      // Some Apple flows sign the token against a nonce that Firebase then
      // requires back (as rawNonce) to validate the credential. Pass it
      // through only if the plugin actually gave us one, rather than
      // assuming either way.
      var nonce = loginRes.result.nonce || loginRes.result.rawNonce || null;
      var appleProvider = new firebase.auth.OAuthProvider('apple.com');
      var credential = nonce
        ? appleProvider.credential({ idToken: idToken, rawNonce: nonce })
        : appleProvider.credential({ idToken: idToken });
      if (err) err.textContent = 'Signing into Firebase...';
      window._fbAuth.signInWithCredential(credential).catch(function(e) {
        console.log('[DD Cloud] signInWithCredential promise rejected (may be spurious):', e);
      });
      var signedInUser = await _ddWaitForAuthUser(window._fbAuth, 10000);
      if (!signedInUser) throw new Error('Firebase sign-in did not complete');
      console.log('[DD Cloud] signInWithCredential succeeded (via currentUser poll)');
      err.textContent = '';
      say('Signed in with Apple. Syncing your save data.');
      var loadedNative = await loadFromCloud();
      if (loadedNative) {
        say('Cloud save loaded.');
        setEvent('good', '☁ Signed in with Apple. Cloud save loaded!');
      } else {
        await syncToCloud();
        setEvent('good', '☁ Signed in with Apple. Save backed up to cloud.');
      }
      closeAccountPanel();
    } catch(e) {
      console.log('[DD Cloud] Native Apple sign in error:', e);
      err.textContent = 'Apple sign in failed: ' + (e.message || 'unknown error');
      say('Apple sign in failed: ' + (e.message || 'unknown error'));
    }
    return;
  }
  try {
    if (err) err.textContent = 'Opening Apple sign in...';
    var provider = new firebase.auth.OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    await window._fbAuth.signInWithPopup(provider);
    err.textContent = '';
    say('Signed in with Apple. Syncing your save data.');
    var loaded = await loadFromCloud();
    if (loaded) {
      say('Cloud save loaded.');
      setEvent('good', '☁ Signed in with Apple. Cloud save loaded!');
    } else {
      await syncToCloud();
      setEvent('good', '☁ Signed in with Apple. Save backed up to cloud.');
    }
    closeAccountPanel();
  } catch(e) {
    err.textContent = 'Apple sign in failed. Try again.';
    say('Apple sign in failed.');
  }
}

async function accountForgotPassword() {
  var email = document.getElementById('account-email-input').value.trim();
  var err = document.getElementById('account-error');
  if (!email) { err.textContent = 'Enter your email address first.'; say('Please enter your email address.'); return; }
  try {
    await window._fbResetPw(email);
    err.textContent = '';
    err.style.color = '#44ff88';
    err.textContent = 'Password reset email sent! Check your inbox.';
    say('Password reset email sent to ' + email + '. Check your inbox.');
  } catch(e) {
    err.style.color = '#ff4444';
    err.textContent = 'Could not send reset email. Check the address.';
  }
}

async function accountSignOut() {
  var ind = document.getElementById('account-sync-indicator');
  var setInd = function(msg, col) { if (ind) { ind.textContent = msg; ind.style.color = col || '#888'; } };
  setInd('⏳ Signing out...', '#ffaa44');
  try {
    // Sign out from Firebase
    if (window._fbAuth) {
      await window._fbAuth.signOut();
    } else if (window._fbSignOut) {
      await window._fbSignOut();
    }
    // Force clear user state
    window._fbCurrentUser = null;
    // Force UI update immediately
    var statusEl = document.getElementById('account-status-text');
    var loginSection = document.getElementById('account-login-section');
    var loggedInSection = document.getElementById('account-loggedin-section');
    if (statusEl) { statusEl.textContent = 'Not signed in — saving to local storage'; statusEl.style.color = '#888'; }
    if (loginSection) loginSection.style.display = '';
    if (loggedInSection) loggedInSection.style.display = 'none';
    setInd('✓ Signed out', '#44ff88');
    setTimeout(function() { setInd(''); }, 2000);
    say('Signed out successfully. You can sign back in anytime.');
    setEvent('good', 'Signed out. Game continues saving to local storage.');
  } catch(e) {
    console.error('Sign out error:', e);
    setInd('Error: ' + (e.message || 'try again'), '#ff4444');
    say('Sign out failed: ' + (e.message || 'unknown error'));
  }
}

function accountDeleteAccount() {
  var user = getFirebaseUser();
  var ind = document.getElementById('account-sync-indicator');
  var setInd = function(msg, col) { if (ind) { ind.textContent = msg; ind.style.color = col || '#888'; } };
  if (!user) { setInd('Not signed in.', '#ff4444'); say('Not signed in.'); return; }
  // Two-tap confirmation
  if (!window._deleteConfirmPending) {
    window._deleteConfirmPending = true;
    setInd('⚠ Tap Delete again to confirm.', '#ff4444');
    say('Tap Delete Account again to confirm. Only removes cloud account. Local saves are safe.');
    setTimeout(function() {
      window._deleteConfirmPending = false;
      setInd('');
    }, 5000);
    return;
  }
  // Confirmed — delete
  window._deleteConfirmPending = false;
  setInd('⏳ Deleting account...', '#ffaa44');
  var doDelete = window._fbAuth ? window._fbAuth.currentUser.delete() : (window._fbDeleteAccount ? window._fbDeleteAccount() : Promise.reject(new Error('Not available')));
  doDelete.then(function() {
    window._fbCurrentUser = null;
    setInd('✓ Account deleted', '#44ff88');
    say('Account deleted. Local saves are untouched.');
    setEvent('', 'Cloud account deleted. Local saves are safe.');
    setTimeout(function() { updateAccountUI(); setInd(''); }, 2000);
  }).catch(function(e) {
    setInd('Error: ' + (e.message || 'sign in again first'), '#ff4444');
    say('Could not delete. Try signing in again first.');
  });
}
function openAccountPanel() {
  var ov = document.getElementById('ov-account');
  if (ov) {
    ov.classList.add('open');
    updateAccountUI();
    updateICloudBackupUI();
    say('Account panel. Beta feature. Account is not required to play. The game always saves to local storage.');
    setTimeout(function() {
      var first = ov.querySelector('input, button');
      if (first) first.focus();
    }, 200);
  }
}

function closeAccountPanel() {
  var ov = document.getElementById('ov-account');
  if (ov) ov.classList.remove('open');
}

// Auto-sync to cloud every time saveChars is called
var _origSaveChars = null;
// BUGFIX: this fired a full, spoken syncToCloud() on every single
// saveChars() call — which happens on nearly every gameplay event (loot
// pickup, floor change, etc.) — so VoiceOver users got "Syncing... Uploading
// save data... Sync complete" read out constantly, on top of whatever else
// was happening. Cloud sync itself is still valuable to keep current, so
// instead of removing it: throttled to at most once every 2 minutes of
// real time, and the throttled auto-sync is silent (silent=true) — no
// speech, no interruption. The manual "Sync to Cloud" button in Account
// still gets the full announced version, since that's a deliberate,
// occasional action where hearing confirmation is exactly the point.
var _lastAutoSyncAt = 0;
var AUTO_SYNC_MIN_INTERVAL_MS = 120000;
function initAccountSync() {
  if (typeof saveChars === 'function' && !_origSaveChars) {
    _origSaveChars = saveChars;
    saveChars = function() {
      _origSaveChars();
      // Fire and forget — sync to cloud in background, throttled and silent
      if (getFirebaseUser() && window._fbSaveData) {
        var now = Date.now();
        if (now - _lastAutoSyncAt < AUTO_SYNC_MIN_INTERVAL_MS) return;
        _lastAutoSyncAt = now;
        setTimeout(function() {
          syncToCloud(true).catch(function(e) {
            console.warn('Background sync failed:', e && e.message);
          });
        }, 500);
      }
      // Independent iCloud backup — own throttle, own opt-in toggle. Doesn't
      // know or care whether Firebase sync above also ran; a player can use
      // either, both, or neither.
      if (isICloudBackupEnabled() && getICloudPlugin()) {
        var nowIC = Date.now();
        if (nowIC - _lastICloudSyncAt < ICLOUD_SYNC_MIN_INTERVAL_MS) return;
        _lastICloudSyncAt = nowIC;
        setTimeout(function() { syncToiCloud(true); }, 500);
      }
    };
  }
}

// ── iCLOUD BACKUP (iOS only) ────────────────────────────────────────────
// A second, independent backup destination alongside Firebase — no sign-in
// screen, no account, just whatever iCloud account is already on the
// device. Opt-in via a toggle in Account settings, off by default so
// nothing writes to iCloud unless the player chooses to. This system and
// the Firebase one don't know about each other and never try to merge —
// whichever one gets restored from is just whichever button the player
// taps.
var _lastICloudSyncAt = 0;
var ICLOUD_SYNC_MIN_INTERVAL_MS = 120000;

function getICloudPlugin() {
  if (!window.Capacitor || typeof Capacitor.getPlatform !== 'function' || Capacitor.getPlatform() !== 'ios') return null;
  return (Capacitor.Plugins && Capacitor.Plugins.iCloudSync) ? Capacitor.Plugins.iCloudSync : null;
}

function isICloudBackupEnabled() {
  return DDStore.getItem('dd_icloud_backup_enabled') === 'true';
}

function setICloudBackupEnabled(on) {
  DDStore.setItem('dd_icloud_backup_enabled', on ? 'true' : 'false');
}

function buildLocalSavePayload() {
  return {
    chars: DDStore.getItem('dd_chars'),
    unlocks: DDStore.getItem('dd_unlocks'),
    achievements: DDStore.getItem('dd_achievements'),
    globalStats: DDStore.getItem('dd_global_stats'),
    coinUpgrades: DDStore.getItem('dd_coin_upgrades'),
    raidData: DDStore.getItem('dd_raid'),
    medusa: DDStore.getItem('dd_medusa'),
    voidReaper: DDStore.getItem('dd_void_reaper'),
    username: DDStore.getItem('dd_username'),
    titleTag: DDStore.getItem('dd_title_tag'),
    srPromptSeen: DDStore.getItem('dd_sr_prompt_seen'),
    accessSettings: DDStore.getItem('dd_access'),
  };
}

async function checkICloudAvailability() {
  var plugin = getICloudPlugin();
  var statusEl = document.getElementById('icloud-backup-status');
  if (!plugin) {
    if (statusEl) { statusEl.textContent = 'iCloud backup is only available on iOS.'; statusEl.style.color = '#666'; }
    return false;
  }
  try {
    var res = await plugin.isAvailable();
    if (statusEl) {
      if (res && res.available) { statusEl.textContent = '✓ iCloud is available on this device.'; statusEl.style.color = '#44ff88'; }
      else { statusEl.textContent = 'iCloud is not available. Sign in to iCloud in your device Settings first.'; statusEl.style.color = '#ffaa44'; }
    }
    return !!(res && res.available);
  } catch(e) {
    if (statusEl) { statusEl.textContent = 'Could not check iCloud status.'; statusEl.style.color = '#ff4444'; }
    return false;
  }
}

async function syncToiCloud(silent) {
  var plugin = getICloudPlugin();
  if (!plugin || !isICloudBackupEnabled()) return;
  try {
    var payload = buildLocalSavePayload();
    await plugin.saveData({ json: JSON.stringify(payload) });
    if (!silent) say('Backed up to iCloud.');
  } catch(e) {
    console.warn('[DD] iCloud backup failed:', e && e.message);
    if (!silent) say('iCloud backup failed. Check your connection.');
  }
}

async function loadFromiCloud() {
  var plugin = getICloudPlugin();
  if (!plugin) { say('iCloud backup is only available on iOS.'); return false; }
  say('Checking iCloud for a saved backup. Please wait.');
  try {
    var res = await plugin.loadData();
    if (!res || !res.found) { say('No iCloud backup found.'); return false; }
    var data = JSON.parse(res.json);
    if (data.chars) DDStore.setItem('dd_chars', data.chars);
    if (data.unlocks) DDStore.setItem('dd_unlocks', data.unlocks);
    if (data.achievements) DDStore.setItem('dd_achievements', data.achievements);
    if (data.globalStats) DDStore.setItem('dd_global_stats', data.globalStats);
    if (data.coinUpgrades) DDStore.setItem('dd_coin_upgrades', data.coinUpgrades);
    if (data.raidData) DDStore.setItem('dd_raid', data.raidData);
    if (data.medusa) DDStore.setItem('dd_medusa', data.medusa);
    if (data.voidReaper) DDStore.setItem('dd_void_reaper', data.voidReaper);
    if (data.username) DDStore.setItem('dd_username', data.username);
    if (data.titleTag) DDStore.setItem('dd_title_tag', data.titleTag);
    if (data.srPromptSeen) DDStore.setItem('dd_sr_prompt_seen', data.srPromptSeen);
    if (data.accessSettings) DDStore.setItem('dd_access', data.accessSettings);
    try {
      var freshChars = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]');
      CHARS.length = 0;
      freshChars.forEach(function(c){ CHARS.push(c); });
    } catch(e2) { console.error('CHARS reload error:', e2); }
    renderCharList();
    if (typeof refreshDungeonUnlocks === 'function') refreshDungeonUnlocks();
    if (typeof checkAchievements === 'function') checkAchievements();
    var active = document.querySelector('.screen.active');
    if (active && (active.id === 'screen-menu' || active.id === 'screen-charlist')) {
      goTo('charlist');
    }
    say('Restored from iCloud backup.');
    return true;
  } catch(e) {
    console.error('[DD] iCloud load error:', e);
    say('iCloud restore failed. Check your connection.');
    return false;
  }
}

function updateICloudBackupUI() {
  var section = document.getElementById('icloud-backup-section');
  var toggle = document.getElementById('icloud-backup-toggle');
  if (!section) return;
  var plugin = getICloudPlugin();
  if (!plugin) { section.style.display = 'none'; return; }
  section.style.display = '';
  if (toggle) toggle.checked = isICloudBackupEnabled();
  if (isICloudBackupEnabled()) checkICloudAvailability();
}

function toggleICloudBackup(on) {
  setICloudBackupEnabled(on);
  var statusEl = document.getElementById('icloud-backup-status');
  if (on) {
    say('iCloud backup enabled. Your save will back up automatically.');
    checkICloudAvailability();
    syncToiCloud(false);
  } else {
    say('iCloud backup disabled.');
    if (statusEl) { statusEl.textContent = ''; }
  }
}

