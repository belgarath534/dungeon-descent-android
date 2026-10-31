//═════════════════
// TUTORIAL SYSTEM
//═════════════════
var _tutStep = 1;
var TUTORIAL_STEPS = 8;

function openTutorial() {
  // Mark as seen immediately so refresh does not re-trigger
  DDStore.setItem('dd_tutorial_seen', '1');
  _tutStep = 1;
  renderTutPips();
  // Show step 1
  for (var i = 1; i <= TUTORIAL_STEPS; i++) {
    var el = document.getElementById('tut-' + i);
    if (el) el.classList.toggle('active', i === 1);
  }
  document.getElementById('tutorial-overlay').classList.add('open');
  say(t('Tutorial. Step 1 of ') + TUTORIAL_STEPS + t('. Welcome to Dungeon Descent. Press Next to continue or Skip Tutorial to go straight to the game.'));
  setTimeout(function() {
    var btn = document.querySelector('#tut-1 .btn-gold');
    if (btn) btn.focus();
  }, 80);
}

function tutStep(n) {
  var old = document.getElementById('tut-' + _tutStep);
  if (old) old.classList.remove('active');
  _tutStep = n;
  var next = document.getElementById('tut-' + n);
  if (next) next.classList.add('active');
  renderTutPips();
  var titles = ['','Welcome','Character Creation','Navigation','Accessibility','Combat','Progression','Blacksmith','Ready to Descend'];
  say(t('Tutorial step ') + n + t(' of ') + TUTORIAL_STEPS + t('. ') + t(titles[n] || ''));
  setTimeout(function() {
    var btn = document.querySelector('#tut-' + n + ' .btn-gold');
    if (btn) btn.focus();
  }, 60);
}

function renderTutPips() {
  var pips = document.getElementById('tutorial-pips');
  if (!pips) return;
  pips.innerHTML = '';
  for (var i = 1; i <= TUTORIAL_STEPS; i++) {
    var pip = document.createElement('div');
    pip.className = 'tutorial-pip' + (i === _tutStep ? ' active' : i < _tutStep ? ' done' : '');
    pips.appendChild(pip);
  }
}

function closeTutorial() {
  document.getElementById('tutorial-overlay').classList.remove('open');
  DDStore.setItem('dd_tutorial_seen', '1');
  say('Tutorial closed. Welcome to Dungeon Descent.');
  // Focus main menu play button
  setTimeout(function() {
    var btn = document.querySelector('.menu-btn.primary');
    if (btn) btn.focus();
  }, 100);
}

// Settings "View Tutorial" — a deliberate replay. Unlike the automatic
// first-run trigger, this also clears the in-dungeon contextual tip banners
// (DUNGEON_TIPS) so a player who asks to see the tutorial again actually
// gets the full experience back, not just the modal.
function replayTutorial() {
  DDStore.setItem('dd_dungeon_tips_seen', '[]');
  closeSettings();
  openTutorial();
}

//═════════════════
// CORRUPTION SYSTEM
//═════════════════
var CORRUPTION_WHISPERS = [
  'Something in the dark knows your name.',
  'The walls remember everyone who has passed through them. They remember you.',
  'You have been here before. You do not remember it. The dungeon does.',
  'The enemies are not random. They were placed here specifically for you.',
  'You are not the first. The others did not leave.',
  'Your spirit companion has noticed something following you.',
  'The floor beneath you is colder than it should be.',
  'Something has been counting your steps since you entered.',
  'The dungeon is not trying to kill you. It is trying to keep you.',
  'You should turn back. You will not turn back.',
];

function getCharCorruption() {
  if (_charIdx === null || !CHARS[_charIdx]) return 0;
  return CHARS[_charIdx].corruption || 0;
}

function addCharCorruption(amount) {
  if (_charIdx === null || !CHARS[_charIdx]) return;
  var ch = CHARS[_charIdx];
  if (!ch.corruptionMode) return; // only if opted in
  var prev = ch.corruption || 0;
  ch.corruption = Math.min(100, prev + amount);
  saveChars();
  checkCorruptionThresholds(prev, ch.corruption);
  updateCorruptionDisplay();
}

function checkCorruptionThresholds(prev, current) {
  // 25% — whispers begin
  if (prev < 25 && current >= 25) {
    say('⚠ Your corruption reaches 25%. The dungeon begins to whisper.');
    addLog('☠ CORRUPTION 25% — The whispers begin.');
    sfx('sfx-sanity-warning');
    scheduleCorruptionWhisper();
  }
  // 50% — Corrupted hunter spawns
  if (prev < 50 && current >= 50) {
    say('⚠ Corruption 50%. Something has noticed you. It is coming.');
    addLog('☠ CORRUPTION 50% — The Corrupted Hunter awakens.');
    sfx('sfx-sanity-critical');
    DS._corruptedHunterActive = true;
  }
  // 75% — skills backfire
  if (prev < 75 && current >= 75) {
    say('⚠ Corruption 75%. Your skills are turning against you.');
    addLog('☠ CORRUPTION 75% — Skills begin to backfire.');
    sfx('sfx-sanity-critical');
    DS._skillsBackfire = true;
  }
  // 100% — Corruption Run
  if (prev < 100 && current >= 100) {
    say('Your soul is fully corrupted. You have become something the dungeon fears. Corruption Run begins.');
    addLog('☠ FULL CORRUPTION — You are beyond saving. The dungeon trembles.');
    sfx('sfx-trap');
    DS._corruptionRun = true;
    setTimeout(function(){ showCorruptionRunModal(); }, 1000);
  }
}

function scheduleCorruptionWhisper() {
  if (!DS.inCombat && getCharCorruption() >= 25) {
    var whisper = CORRUPTION_WHISPERS[Math.floor(Math.random() * CORRUPTION_WHISPERS.length)];
    setTimeout(function(){
      say('The dungeon whispers: ' + whisper);
      addLog('👁 ' + whisper);
    }, Math.random() * 30000 + 15000); // random 15-45 seconds
  }
}

function showCorruptionRunModal() {
  var modal = document.getElementById('phase-transition-modal');
  if (!modal) return;
  document.getElementById('phase-modal-label').textContent = 'CORRUPTION COMPLETE';
  document.getElementById('phase-modal-title').textContent = '☠ YOU ARE THE DUNGEON NOW';
  document.getElementById('phase-modal-title').style.color = '#7a207a';
  document.getElementById('phase-modal-title').style.textShadow = '0 0 30px rgba(122,32,122,0.8)';
  document.getElementById('phase-modal-msg').textContent = 'Your soul is gone. But something remains. Enemies fear you. Gold drops doubled. Legendary rewards await at the boss. Survive to the end.';
  modal.style.display = 'flex';
  setCombatBtns(false);
  sfx('sfx-trap');
  // Re-enable after player has seen the message
  setTimeout(function() {
    modal.style.display = 'none';
    setCombatBtns(true);
  }, 4000);
}

function updateCorruptionDisplay() {
  var corruption = getCharCorruption();
  var el = document.getElementById('dg-corruption-bar');
  var label = document.getElementById('dg-corruption-label');
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (!ch || !ch.corruptionMode) {
    var row = document.getElementById('dg-corruption-row');
    if (row) row.style.display = 'none';
    return;
  }
  var row = document.getElementById('dg-corruption-row');
  if (row) row.style.display = '';
  if (el) el.style.width = corruption + '%';
  if (label) label.textContent = '☠ Corruption: ' + corruption + '%';
}

// Hook corruption into player death
function onPlayerDeathCorruption() {
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  if (!ch || !ch.corruptionMode) return;
  var gain = DS.floor >= 7 ? 10 : DS.floor >= 4 ? 7 : 5;
  addCharCorruption(gain);
  say('Corruption increases by ' + gain + '%. Total: ' + ch.corruption + '%.');
}
// ── END CORRUPTION SYSTEM ──
(function() {
  var bar = document.getElementById('loading-bar');
  var screen = document.getElementById('loading-screen');
  var tipEl = document.getElementById('loading-tip');
  if (!screen) return;

  var tips = [
    'Tip: Equip weapons and armor from your inventory between runs.',
    'Tip: Soul Fragments drop from enemies. Collect 25 to build a custom spirit.',
    'Tip: The Wandering Merchant appears every few floors. Always check the sell tab.',
    'Tip: Elite enemies have a 30% chance to drop rare spirits on death.',
    'Tip: Legacy Mode carries your level between runs. Build one legend.',
    'Tip: Ambush Day hits 4 times a year — all battles become multi-enemy.',
    'Tip: The Void Anchor prevents fleeing. Kill it or die trying.',
    'Tip: Claim your Daily Descent reward every day to build your streak.',
    'Tip: The Last Blade starts at Level 10 but degrades each floor.',
    'Tip: Thornmail reflects 20% of damage back at attackers.',
  ];
  var tipIdx = Math.floor(Math.random() * tips.length);
  if (tipEl) tipEl.textContent = tips[tipIdx];

  // Announce to VoiceOver
  setTimeout(function() {
    say('Dungeon Descent. Created by Leo Productions. Loading. ' + tips[tipIdx]);
  }, 300);

  // Cycle tips every 800ms during load
  var tipInterval = setInterval(function() {
    tipIdx = (tipIdx + 1) % tips.length;
    if (tipEl) tipEl.textContent = tips[tipIdx];
    say(tips[tipIdx]);
  }, 2500);

  // Animate bar in stages — feels more real
  setTimeout(function(){ if(bar) bar.style.width = '30%'; }, 200);
  setTimeout(function(){ if(bar) bar.style.width = '65%'; }, 1500);
  setTimeout(function(){ if(bar) bar.style.width = '90%'; }, 3500);
  setTimeout(function(){ if(bar) bar.style.width = '100%'; }, 4500);

  // Fade out after 5 seconds
  setTimeout(function(){
    clearInterval(tipInterval);
    if (screen) {
      screen.classList.add('fade-out');
      setTimeout(function(){
        if(screen) screen.style.display='none';
      }, 850);
    }
    // Apply translations now — DOM is stable
    if (typeof _translationEnabled !== 'undefined' && _translationEnabled) {
      translateMenuText();
    }
    // Phones and tablets have no Tab key: tell touch screen reader users to swipe.
    var _touch = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
    var welcomeMsg = (typeof _translationEnabled !== 'undefined' && _translationEnabled && _translationLang === 'pt-BR')
      ? (_touch ? 'Dungeon Descent carregado. Bem-vindo. Deslize para explorar o menu principal.' : 'Dungeon Descent carregado. Bem-vindo. Pressione Tab para navegar pelo menu principal.')
      : (_touch ? 'Dungeon Descent loaded. Welcome. Swipe to explore the main menu.' : 'Dungeon Descent loaded. Welcome. Press Tab to navigate the main menu.');
    say(welcomeMsg);
    // Check for active seasonal event and show popup
    setTimeout(function(){ try { checkSeasonalEventPopup(); } catch(e) { console.warn('[DD] seasonal popup error:', e); } }, 1000);
  }, 5000);
})();

// checkFirstRun() used to auto-open the tutorial here AND startTutorial()
// auto-opened it again at the first "Begin Descent" (two unsynced flags,
// dd_tutorial_seen vs dd_combat_tutorial) — a new player saw the full modal
// twice in one session. Removed; shouldShowTutorial()/startTutorial() at
// closeQuestPopup() is now the single trigger, consolidated onto
// dd_tutorial_seen (set by openTutorial() itself).

//═════════════════
// DEFEAT QUOTES — dungeon taunts
//═════════════════
var DEFEAT_QUOTES = {
  'Crypt of Malachar': [
    'The Crypt does not mourn you. It simply continues.',
    'Malachar has waited a thousand years. He can wait a little longer.',
    'Your bones will keep the others company.',
    'The silence returned before you finished falling.',
    'You lasted longer than most. That is not a compliment.'
  ],
  'The Ashbound Wastes': [
    'The fire noticed you. Then it stopped noticing you.',
    'Vel Ashara claimed another.',
    'The ash is indifferent. The ash is always indifferent.',
    'You burned. Everything here burns eventually.',
    'The Wastes did not hate you. They simply consumed you.'
  ],
  'Frosthold Abyss': [
    'The cold does not celebrate. It simply remains.',
    'The journals of this expedition will not return to the surface.',
    'Whatever waits at the bottom heard you coming. Now it does not hear you.',
    'The ice closes over the gap you left. As if you were never here.',
    'The Abyss keeps everything it touches. Forever.'
  ]
};

var NIGHTMARE_DEFEAT_QUOTES = [
  'It does not remember you. Nothing here remembers anything.',
  'You were here. Now you are part of it.',
  'The nightmare does not end when you do.',
  'It watched you the whole time. You never saw it.',
  'Some doors, once opened, do not close from this side.'
];

function getDefeatQuote() {
  var pool = DS.diff === 'Nightmare' ? NIGHTMARE_DEFEAT_QUOTES
    : (DEFEAT_QUOTES[DS.dungeon] || DEFEAT_QUOTES['Crypt of Malachar']);
  return pool[Math.floor(Math.random() * pool.length)];
}

function getVictoryQuote() {
  var quotes = [
    'The dungeon is silent. For now.',
    'You did what armies could not. The question is whether you can do it again.',
    'The dark remembers the ones who walk back out of it.',
    'Victory. The rarest thing these walls have ever witnessed.',
    'You survived. Not everyone does. Almost no one does.'
  ];
  return quotes[Math.floor(Math.random() * quotes.length)];
}


//═════════════════
// SETTINGS NAVIGATION
//═════════════════
// Generic accessible choice modal — replaces confirm() dialogs throughout the game
function showChoiceModal(title, body, options) {
  // Remove any existing modal
  var existing = document.getElementById('dd-choice-modal');
  if (existing) existing.remove();

  var overlay = document.createElement('div');
  overlay.id = 'dd-choice-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', title);
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px;';

  var box = document.createElement('div');
  box.style.cssText = 'background:#0a0500;border:1px solid #663300;padding:24px;max-width:340px;width:100%;';

  var h = document.createElement('div');
  h.style.cssText = 'font-family:Cinzel,serif;font-size:0.9rem;color:#ff8844;margin-bottom:12px;';
  h.textContent = title;

  var p = document.createElement('div');
  p.style.cssText = 'font-family:Cinzel,serif;font-size:0.75rem;color:#888;margin-bottom:20px;line-height:1.5;';
  p.textContent = body;

  box.appendChild(h);
  box.appendChild(p);

  say(title + '. ' + body);

  options.forEach(function(opt, i) {
    var btn = document.createElement('button');
    btn.style.cssText = 'width:100%;padding:12px;background:#1a0800;border:1px solid #663300;color:#ffaa44;font-family:Cinzel,serif;font-size:0.75rem;cursor:pointer;margin-bottom:8px;display:block;';
    btn.textContent = opt.label;
    btn.setAttribute('aria-label', opt.label);
    btn.onclick = function() {
      overlay.remove();
      if (opt.action) opt.action();
    };
    box.appendChild(btn);
    if (i === 0) setTimeout(function(){ btn.focus(); }, 50);
  });

  overlay.appendChild(box);
  document.body.appendChild(overlay);
}

function openSettings() {
  document.getElementById('settings-screen').classList.add('open');
  // Hide notification settings on web — only relevant on native app
  var notifBtn = document.getElementById('btn-settings-notifications');
  if (notifBtn) notifBtn.style.display = window.Capacitor ? '' : 'none';
  // 3D Settings only appears once 3D Mode is turned on in Beta Features
  var td3Btn = document.getElementById('btn-settings-3dmode');
  if (td3Btn) td3Btn.style.display = isBetaOn('3dmode') ? '' : 'none';
  // Sync shake toggle to actual saved state
  var shakeBtn = document.getElementById('shake-toggle');
  if (shakeBtn) {
    shakeBtn.textContent = _shakeEnabled ? 'On' : 'Off';
    shakeBtn.classList.toggle('on', _shakeEnabled);
    shakeBtn.setAttribute('aria-pressed', String(_shakeEnabled));
  }
  say(t('⚙ Settings') + '. ' + t('Choose a category to customize your experience.'));
  setTimeout(function() {
    var first = document.querySelector('#settings-screen .settings-cat-btn');
    if (first) first.focus();
  }, 80);
}

function closeSettings() {
  document.getElementById('settings-screen').classList.remove('open');
  // Close all panels too
  ['audio','language','accessibility'].forEach(function(p) {
    var el = document.getElementById('settings-panel-' + p);
    if (el) el.classList.remove('open');
  });
  say('Settings closed.');
}

function openSettingsPanel(panel) {
  if (panel === 'beta') updateBetaPanel();
  if (panel === '3dmode') update3DSettingsPanel();
  if (panel === 'notifications') syncNotifToggleUI();
  // BUGFIX: checkSavedCustomTrack() existed to restore your last-used custom
  // track URL into the input field, but nothing ever called it — the URL was
  // saved correctly, just never shown again, so the field always looked blank.
  if (panel === 'audio') checkSavedCustomTrack();
  var el = document.getElementById('settings-panel-' + panel);
  if (el) el.classList.add('open');
  var names = { audio: 'Audio', language: 'Language', accessibility: 'Accessibility', gameplay: 'Gameplay', account: 'Account', dev: 'Developer Tools', feedback: 'Send Feedback' };
  say((names[panel] || panel) + ' settings opened.');
  setTimeout(function() {
    var first = document.querySelector('#settings-panel-' + panel + ' button, #settings-panel-' + panel + ' input, #settings-panel-' + panel + ' select');
    if (first) first.focus();
  }, 80);
}

function closeSettingsPanel(panel) {
  document.getElementById('settings-panel-' + panel).classList.remove('open');
  say('Back to settings.');
  setTimeout(function() {
    var first = document.querySelector('#settings-screen .settings-cat-btn');
    if (first) first.focus();
  }, 60);
}


//═════════════════
// SPIRIT COMPANION SYSTEM
//═════════════════
var STARTER_SPIRITS = [
  { id:'ember-fox',    name:'Ember Fox',    icon:'🦊', rarity:'starter',
    desc:'A fox wreathed in embers. Attacks with you every turn.',
    ability:'Attacks each turn for 15% of your base attack as fire damage.',
    passiveDesc:'Fire Strike',
    onAttack:function(b){ return Math.round(b*0.15); }, onCombatStart:null, onKill:null },
  { id:'bone-hound', enemyType:'beast',   name:'Bone Hound',   icon:'🦴', rarity:'starter',
    desc:'An undead hound bound to your will. Stronger against undead.',
    ability:'Attacks for 20% base damage. +10% bonus vs undead enemies.',
    passiveDesc:'Undead Hunter',
    onAttack:function(b,n){ var u=['Hollow Shade','Brittle Skeleton','Death Knight','Malachar the Undying','Bone Colossus','Armored Skeleton','Wailing Wraith']; return Math.round(b*(0.20+(u.indexOf(n)!==-1?0.10:0))); }, onCombatStart:null, onKill:null },
  { id:'frost-sprite', name:'Frost Sprite', icon:'❄️', rarity:'starter',
    desc:'A tiny ice spirit. Slows enemies and detects traps.',
    ability:'At combat start reduces enemy attack 10% for 3 turns. Detects traps.',
    passiveDesc:'Frost Aura',
    onAttack:null,
    onCombatStart:function(){ DS.frostSpriteAura=3; addLog('Frost Sprite chills the air — enemy attack reduced for 3 turns.'); }, onKill:null },
  { id:'shadow-crow',  name:'Shadow Crow',  icon:'🐦', rarity:'starter',
    desc:'A shadowy crow that steals gold from fallen enemies.',
    ability:'Each kill grants +3 bonus gold stolen by the crow.',
    passiveDesc:'Gold Thief',
    onAttack:null, onCombatStart:null,
    onKill:function(){ DS.gold+=3; addGlobalGold(3); updateTopBar(); addLog('Shadow Crow steals 3 gold!'); } },
  { id:'stone-turtle', name:'Stone Turtle',  icon:'🐢', rarity:'starter',
    desc:'Ancient and unbreakable. Absorbs the first hit of every combat.',
    ability:'At combat start creates a shell absorbing up to 15 damage.',
    passiveDesc:'Shell Guard',
    onAttack:null,
    onCombatStart:function(){ DS.manaShield=Math.max(DS.manaShield||0,15); addLog('Stone Turtle raises its shell — absorbs up to 15 damage!'); },
    onKill:null },
  { id:'thunder-moth', name:'Thunder Moth',  icon:'🦋', rarity:'starter',
    desc:'A moth charged with static. Has a chance to stun on attack.',
    ability:'Each attack has a 20% chance to stun the enemy for 1 turn.',
    passiveDesc:'Static Shock',
    onAttack:function(b){ if(Math.random()<0.20){ fxGet().stun = Math.max(fxGet().stun, 1); addLog('Thunder Moth shocks the enemy — stunned!'); } return Math.round(b*0.12); },
    onCombatStart:null, onKill:null },
  { id:'market-sprite', name:'Market Sprite', icon:'🪙', rarity:'starter',
    desc:'A spirit bound to commerce. Negotiates on your behalf at every shop.',
    ability:'All shop items cost 20% less this run. Costs 50 gold to reactivate next run.',
    passiveDesc:'Merchant Aura',
    isMarketSprite: true,
    reactivateCost: 50,
    onAttack:null, onCombatStart:null, onKill:null }
];

var RARE_SPIRITS = [
  { id:'bone-hound-prime', enemyType:'beast', name:'Bone Hound Prime', icon:'💀', rarity:'rare',
    dungeon:'Crypt of Malachar',
    desc:'The alpha undead hound. Drains SP from fallen enemies.',
    ability:'Attacks for 25% damage each turn. On kill steals 5 SP.',
    passiveDesc:'Soul Drain', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.25); }, onCombatStart:null,
    onKill:function(){ DS.sp=Math.min(DS.maxSp,DS.sp+5); updateXPBar(); addLog('Bone Hound Prime drains 5 SP!'); } },
  { id:'inferno-hawk', name:'Inferno Hawk', icon:'🦅', rarity:'rare',
    dungeon:'The Ashbound Wastes',
    desc:'A hawk born from Vel Ashara\'s eternal fire.',
    ability:'Attacks every turn for 30% fire damage. Burns enemy on combat start.',
    passiveDesc:'Eternal Flame', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.30); },
    onCombatStart:function(){ DS.venomTurns=Math.max(DS.venomTurns||0,2); addLog('Inferno Hawk ignites the enemy — burning for 2 turns!'); }, onKill:null },
  { id:'glacial-wolf', enemyType:'beast', name:'Glacial Wolf', icon:'🐺', rarity:'rare',
    dungeon:'Frosthold Abyss',
    desc:'A wolf of ancient ice. Freezes enemies and grants defense.',
    ability:'At combat start grants +4 defense. Attacks for 20% damage, may freeze.',
    passiveDesc:'Arctic Guard', minLevel:5,
    onAttack:function(b){ if(Math.random()<0.25){ fxGet().stun = Math.max(fxGet().stun, 1); addLog('Glacial Wolf freezes the enemy!'); } return Math.round(b*0.20); },
    onCombatStart:function(){ DS.defBonus+=4; fxGet().fightDef += 4; addLog('Glacial Wolf surrounds you in ice armor. +4 defense for this fight!'); }, onKill:null },
  { id:'void-wraith', enemyType:'spirit', name:'Void Wraith', icon:'👁️', rarity:'rare',
    dungeon:'Nightmare',
    desc:'A wraith from beyond reality. Drains life to heal you.',
    ability:'Attacks for 35% damage each turn. Steals 8 HP from enemy on each hit.',
    passiveDesc:'Life Drain Aura', minLevel:5,
    onAttack:function(b){ DS.hp=Math.min(DS.maxHp,DS.hp+8); updatePlayerBar(); addLog('Void Wraith drains 8 HP!'); return Math.round(b*0.35); },
    onCombatStart:null, onKill:null },
  { id:'crystal-serpent', name:'Crystal Serpent', icon:'🐍', rarity:'rare',
    dungeon:'Frosthold Abyss',
    desc:'A serpent of living ice. Poisons enemies with frost venom.',
    ability:'At combat start applies 4-turn frost poison. Attacks for 18% damage.',
    passiveDesc:'Frost Venom', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.18); },
    onCombatStart:function(){ DS.venomTurns=Math.max(DS.venomTurns||0,4); addLog('Crystal Serpent injects frost venom — 4 turn poison!'); },
    onKill:null },
  { id:'ash-phoenix', name:'Ash Phoenix', icon:'🔥', rarity:'rare',
    dungeon:'The Ashbound Wastes',
    desc:'Reborn from Vel Ashara\'s fire. Restores HP when you kill.',
    ability:'Each kill restores 12 HP. Attacks for 22% fire damage.',
    passiveDesc:'Phoenix Fire', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.22); },
    onCombatStart:null,
    onKill:function(){ DS.hp=Math.min(DS.maxHp,DS.hp+12); updatePlayerBar(); addLog('Ash Phoenix blazes — +12 HP!'); } },
  { id:'shadow-stalker', name:'Shadow Stalker', icon:'🕷️', rarity:'rare',
    dungeon:'Crypt of Malachar',
    desc:'A spider of pure shadow. Weakens enemies on combat start.',
    ability:'At combat start reduces enemy attack by 20%. Attacks for 15% damage.',
    passiveDesc:'Web of Weakness', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.15); },
    onCombatStart:function(){
      if(DS.enemy){ DS.enemy.atk=DS.enemy.atk.map(function(v){return Math.round(v*0.80);}); }
      addLog('Shadow Stalker webs the enemy — attack reduced 20%!');
    },
    onKill:null },
  { id:'grave-hound', enemyType:'beast',    name:'Grave Hound',    icon:'🐕', rarity:'rare',
    dungeon:'The Hollow',
    desc:'A spirit hound from the Hollow. Guards you and strikes hard.',
    ability:'Attacks for 25% damage. At combat start reduces enemy attack by 15%.',
    passiveDesc:'Guardian Growl', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.25); },
    onCombatStart:function(){
      if(DS.enemy){ DS.enemy.atk=DS.enemy.atk.map(function(v){return Math.round(v*0.85);}); }
      addLog('Grave Hound growls — enemy attack reduced 15%!');
    },
    onKill:null },
  { id:'the-lantern',    name:'The Lantern',    icon:'🏮', rarity:'starter',
    desc:'A warm light that guides and protects. Reveals traps and rewards exploration.',
    ability:'Detects traps like Frost Sprite. Each kill grants +5 gold.',
    passiveDesc:'Guiding Light',
    isLantern: true,
    onAttack:null,
    onCombatStart:null,
    onKill:function(){ DS.gold+=5; addGlobalGold(5); updateTopBar(); addLog('The Lantern glows — +5 gold!'); } },
  { id:'medusa-spirit',  name:'Medusa',          icon:'🐍', rarity:'elite',
    desc:'Found at last. She guards those who showed her mercy.',
    ability:'Serpent Guard — absorbs one enemy attack per combat.',
    passiveDesc:'Serpent Guard',
    onAttack: null,
    onCombatStart: function(){ DS.medusaGuardActive = true; addLog('🐍 Medusa: Serpent Guard active.'); say('Medusa Serpent Guard active.'); },
    onKill: null },
  { id:'easter-bunny',   name:'Easter Bunny',   icon:'🐰', rarity:'starter',
    desc:'A spirit companion found only during Easter. Hops alongside you and finds hidden treats.',
    ability:'Each kill has a 20% chance to find an Easter Egg that restores 10 HP.',
    passiveDesc:'Egg Hunt', isEasterBunny:true,
    onAttack: null,
    onCombatStart: null,
    onKill: function(){
      if (Math.random() < 0.20) {
        DS.hp = Math.min(DS.maxHp, DS.hp + 10);
        updatePlayerBar();
        sayLog('Easter Bunny found an egg! Restored 10 HP.');
      }
    }
  },
  { id:'void-moth',      name:'Void Moth',      icon:'🦋', rarity:'rare',
    dungeon:'Nightmare',
    desc:'A moth of pure void. Attacks relentlessly and sometimes negates damage.',
    ability:'Attacks for 35% damage. 15% chance to negate incoming damage each hit.',
    passiveDesc:'Void Wings', minLevel:5,
    onAttack:function(b){ return Math.round(b*0.35); },
    onCombatStart:null,
    onKill:null }
];

function getCustomSpiritsWithFunctions() {
  var customs = _jsonParseSafe(DDStore.getItem('dd_custom_spirits'), '[]');
  return customs.map(function(s) {
    var fns = getCustomSpiritFunctions(s.abilityId || '');
    return Object.assign({}, s, fns);
  });
}

function getAllSpirits() {
  return STARTER_SPIRITS.concat(RARE_SPIRITS).concat(ELITE_SPIRITS).concat(getCustomSpiritsWithFunctions());
}

function getSpiritById(id) {
  return getAllSpirits().find(function(s){ return s.id===id; });
}

function pickSpirit(spirit) {
  DS.activeSpirit = spirit;
  updateSpiritDisplay();
  // Save spirit choice to character so it persists
  if (_charIdx !== null && CHARS[_charIdx]) {
    CHARS[_charIdx].lastSpirit = spirit.id;
    saveChars();
  }
  say('You chose ' + spirit.name + '. ' + spirit.ability);
}

function updateSpiritDisplay() {
  var row = document.getElementById('dg-spirit-row');
  if (!row) return;
  if (!DS.activeSpirit) { row.style.display='none'; return; }
  row.style.display='';
  document.getElementById('dg-spirit-icon').textContent = DS.activeSpirit.icon;
  document.getElementById('dg-spirit-name').textContent = DS.activeSpirit.name + ' · ' + DS.activeSpirit.passiveDesc;
  document.getElementById('dg-spirit-status').textContent = DS.activeSpirit.rarity==='rare' ? '★ Rare Spirit' : 'Starter Spirit';
}

function applySpiritOnAttack(baseAtk, enemyName) {
  if (!DS.activeSpirit || !DS.activeSpirit.onAttack) return 0;
  // Rare spirits wake at level 5, and a spirit's own minLevel (the Void Herald's 7) was never checked
  var _spMin = DS.activeSpirit.minLevel || (DS.activeSpirit.rarity === 'rare' ? 5 : 0);
  if (DS.level < _spMin) {
    addLog(DS.activeSpirit.name + ' dormant — reach level ' + _spMin + ' to awaken.');
    return 0;
  }
  var dmg = DS.activeSpirit.onAttack(baseAtk, enemyName);
  if (DS._spiritBoost && dmg > 0) dmg = Math.round(dmg * DS._spiritBoost);
  if (dmg > 0) {
    var msg = DS.activeSpirit.name + ' strikes for ' + dmg + '!';
    addLog(DS.activeSpirit.icon + ' ' + msg);
    say(msg);
  }
  return dmg;
}

function applyMedusaTempSpirit() {
  if (!DS.medusaTempSpirit) return;
  // Serpent Guard — absorbs one hit per combat
  DS.medusaGuardActive = true;
  addLog('🐍 Medusa stands beside you. Serpent Guard — she will absorb one attack this fight.');
  say('Medusa fights with you. Serpent Guard active — she will block one attack.');
}

function applySpiritOnCombatStart() {
  if (!DS.activeSpirit || !DS.activeSpirit.onCombatStart) return;
  if (DS.level < (DS.activeSpirit.minLevel || (DS.activeSpirit.rarity === 'rare' ? 5 : 0))) return;
  DS.activeSpirit.onCombatStart();
  // Combat start effects already call addLog — also say the spirit name so JAWS hears it
  say(DS.activeSpirit.name + ' activates.');
}

function applySpiritOnKill() {
  if (!DS.activeSpirit || !DS.activeSpirit.onKill) return;
  if (DS.activeSpirit.rarity==='rare' && DS.level < 5) return;
  DS.activeSpirit.onKill();
  // onKill effects call addLog internally — announce spirit triggered
  say(DS.activeSpirit.name + ' triggered on kill.');
}

function awardRareSpirit() {
  if (_charIdx===null) return;
  var ch = CHARS[_charIdx];
  if (!ch.earnedSpirits) ch.earnedSpirits = [];
  var map = {'Crypt of Malachar':'bone-hound-prime','The Ashbound Wastes':'inferno-hawk','Frosthold Abyss':'glacial-wolf','The Sunken Archives':'crystal-serpent','The Hollow':'grave-hound'};
  var id = DS.diff==='Nightmare' ? (Math.random() < 0.5 ? 'void-wraith' : 'void-moth') : map[DS.dungeon];
  if (id && ch.earnedSpirits.indexOf(id)===-1) {
    ch.earnedSpirits.push(id);
    saveChars();
    var s = getSpiritById(id);
    if (s) {
      say('Rare Spirit unlocked: ' + s.name + '! Saved to your character forever. Requires level 5 to use.');
      setEvent('good', '✦ Rare Spirit Unlocked: ' + s.icon + ' ' + s.name + '! Saved forever.');
    }
  }
}


//═════════════════
// SKILL BOOK
//═════════════════
function openSkillBook() {
  renderSkillBook();
  document.getElementById('skillbook-overlay').classList.add('open');
  var skills = getUnlockedSkills();
  say('Skill Book. ' + skills.length + ' skills unlocked. ' +
    (skills.length > 0 ? skills.map(function(s){return s.name;}).join(', ') + '. Use Move Up and Move Down buttons to reorder.' : 'Level up to unlock skills.'));
  setTimeout(function(){
    var first = document.querySelector('#skillbook-list .skillbook-move, #skillbook-overlay .btn-close');
    if (first) first.focus();
  }, 80);
}

function closeSkillBook() {
  document.getElementById('skillbook-overlay').classList.remove('open');
  say('Skill book closed.');
}

function renderSkillBook() {
  var list = document.getElementById('skillbook-list');
  var skills = getUnlockedSkills();
  if (skills.length === 0) {
    list.innerHTML = '<div class="skillbook-empty">No skills unlocked yet. Level up to choose your first skill.</div>';
    return;
  }
  list.innerHTML = '';
  skills.forEach(function(sk, idx) {
    var entry = document.createElement('div');
    entry.className = 'skillbook-entry ' + sk.tier;
    entry.setAttribute('aria-label', (idx+1) + ' of ' + skills.length + '. ' + sk.name + '. ' + sk.tier + '. ' + sk.desc + ' Costs ' + sk.spCost + ' SP.');
    var isFirst = idx === 0;
    var isLast = idx === skills.length - 1;
    entry.innerHTML =
      '<span class="skillbook-icon" aria-hidden="true">' + sk.icon + '</span>' +
      '<div class="skillbook-info">' +
        '<div class="skillbook-name">' + sk.name +
          ' <span style="font-size:0.58rem;color:var(--text-dim);font-family:Cinzel,serif;">' + sk.tier + '</span>' +
        '</div>' +
        '<div class="skillbook-desc">' + sk.desc + '</div>' +
        '<div class="skillbook-cost">' + sk.spCost + ' SP</div>' +
      '</div>' +
      '<div class="skillbook-reorder">' +
        '<button class="skillbook-move" ' + (isFirst ? 'disabled' : '') +
          ' onclick="moveSkill(' + idx + ', -1)" aria-label="Move ' + sk.name + ' up">▲</button>' +
        '<button class="skillbook-move" ' + (isLast ? 'disabled' : '') +
          ' onclick="moveSkill(' + idx + ', 1)" aria-label="Move ' + sk.name + ' down">▼</button>' +
      '</div>';
    list.appendChild(entry);
  });
}

function moveSkill(idx, dir) {
  var skills = DS.unlockedSkills;
  var newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= skills.length) return;
  var tmp = skills[idx];
  skills[idx] = skills[newIdx];
  skills[newIdx] = tmp;
  renderSkillBook();
  updateSkillButtons();
  var allSkills = getUnlockedSkills();
  var movedSkill = allSkills[newIdx];
  say((movedSkill ? movedSkill.name : 'Skill') + ' moved ' + (dir < 0 ? 'up' : 'down') + '. Now position ' + (newIdx+1) + ' of ' + skills.length + '.');
  // Refocus the same skill's button
  setTimeout(function(){
    var entries = document.querySelectorAll('.skillbook-entry');
    if (entries[newIdx]) {
      var btn = entries[newIdx].querySelector(dir < 0 ? '.skillbook-move:first-child' : '.skillbook-move:last-child');
      if (btn && !btn.disabled) btn.focus();
    }
  }, 40);
}

//═════════════════
// ENEMY PREVIEW
//═════════════════
function showEnemyPreview(enemy) {
  var el = document.getElementById('enemy-preview');
  if (!el) return;
  var tier = getEnemyTier(enemy.name);
  var tierLabels = { common:'Common Enemy', rare:'Rare Enemy', elite:'Elite Enemy', boss:'⚠ Boss Encounter' };
  if (enemy.isElite) {
    document.getElementById('ep-tier').textContent = '★ ELITE ENEMY — ' + (enemy.eliteAbility || '');
    document.getElementById('ep-tier').style.color = 'var(--gold)';
  }
  var hpDesc = enemy.hp <= 30 ? 'Frail' : enemy.hp <= 60 ? 'Moderate HP' : enemy.hp <= 100 ? 'Tough' : 'Very Tough';
  var atkDesc = enemy.atk[1] <= 10 ? 'Weak attacks' : enemy.atk[1] <= 18 ? 'Moderate attacks' : 'Strong attacks';

  // Third Eye upgrade — show exact HP and ATK
  var thirdEyeExtra = '';
  if (DS._thirdEye) {
    var spec = typeof ENEMY_SPECIALS !== 'undefined' ? ENEMY_SPECIALS[enemy.name] : null;
    hpDesc = enemy.hp + ' HP';
    atkDesc = enemy.atk[0] + '-' + enemy.atk[1] + ' ATK';
    thirdEyeExtra = spec ? ' · ' + spec.name : '';
  }

  document.getElementById('ep-name').textContent = enemy.name;
  document.getElementById('ep-meta').textContent = hpDesc + ' · ' + atkDesc + thirdEyeExtra;
  document.getElementById('ep-tier').textContent = DS._thirdEye ? '👁 Third Eye Active' : (tierLabels[tier] || 'Enemy');
  el.classList.add('active');

  // Announce to screen reader immediately
  if (DS._thirdEye) {
    say('Third Eye. ' + enemy.name + '. ' + enemy.hp + ' HP. Attack ' + enemy.atk[0] + ' to ' + enemy.atk[1] + (thirdEyeExtra ? '. ' + thirdEyeExtra : '') + '. Tap to begin combat.');
  } else {
    say('Entering combat with ' + enemy.name + '. ' + (tierLabels[tier]||'') + '. ' + hpDesc + '. ' + atkDesc + '. Prepare your skills.');
  }

  // Hide preview after 2.5 seconds when combat buttons activate
  setTimeout(function() { el.classList.remove('active'); }, 2500);
}

//═════════════════
// DUNGEON EVENT LOG
//═════════════════
// DS.runLog is an array of {floor, text, type} objects
// type: 'combat' | 'good' | 'bad' | 'info'

function addRunLog(text, type) {
  if (!DS.runLog) DS.runLog = [];
  DS.runLog.push({ floor: DS.floor, text: text, type: type || 'info' });
  // Keep last 100 entries
  if (DS.runLog.length > 100) DS.runLog.shift();
}

function openEventLog() {
  var list = document.getElementById('eventlog-list');
  if (!DS.runLog || DS.runLog.length === 0) {
    list.innerHTML = '<div class="eventlog-empty">Nothing logged yet. Start exploring!</div>';
  } else {
    // Show most recent first
    var reversed = DS.runLog.slice().reverse();
    list.innerHTML = reversed.map(function(entry) {
      return '<div class="eventlog-entry">' +
        '<span class="eventlog-floor">FL ' + entry.floor + '</span>' +
        '<span class="eventlog-text ' + (entry.type||'') + '">' + entry.text + '</span>' +
        '</div>';
    }).join('');
  }
  document.getElementById('eventlog-overlay').classList.add('open');
  say('Run Log. ' + (DS.runLog ? DS.runLog.length : 0) + ' events recorded this run.');
  setTimeout(function(){
    var btn = document.querySelector('#eventlog-overlay .btn-close');
    if (btn) btn.focus();
  }, 80);
}

function closeEventLog() {
  document.getElementById('eventlog-overlay').classList.remove('open');
  say('Run log closed.');
}


//═════════════════
// ENEMY STATUS EFFECTS SYSTEM
//═════════════════
function updateEnemyStatusDisplay() {
  var el = document.getElementById('dg-enemy-status');
  if (!el || !DS.enemy) return;
  var effects = [];
  if (DS.venomTurns && DS.venomTurns > 0)
    effects.push({ label: '☠ Poison ×' + DS.venomTurns, cls: 'poison' });
  if (DS.frozen)
    effects.push({ label: '❄ Frozen', cls: 'freeze' });
  if (DS.markedKill)
    effects.push({ label: '🎯 Marked', cls: 'mark' });
  if (DS.deathMark && DS.deathMark > 0)
    effects.push({ label: '💜 Cursed ×' + DS.deathMark, cls: 'curse' });
  if (DS.frostBolt)
    effects.push({ label: '❄ Chilled', cls: 'freeze' });
  if (DS.corrosion && DS.corrosion > 0)
    effects.push({ label: '☣ Corroded ×' + DS.corrosion, cls: 'weak' });
  if (DS.gravityWell && DS.gravityWell > 0)
    effects.push({ label: '🌑 Trapped ×' + DS.gravityWell, cls: 'stun' });

  if (effects.length === 0) {
    el.innerHTML = '';
    el.setAttribute('aria-label', 'No status effects on enemy.');
    return;
  }

  el.innerHTML = effects.map(function(e) {
    return '<span class="status-pip ' + e.cls + '">' + e.label + '</span>';
  }).join('');
  el.setAttribute('aria-label', 'Enemy status effects: ' + effects.map(function(e){ return e.label; }).join(', ') + '.');
}

//═════════════════
// CLASS-SPECIFIC SHOP ITEMS
//═════════════════
function getClassShopItem() {
  var classItems = {
    Warrior:     { name:'War Banner',       icon:'🏴', type:'atk-potion', atk:5, cost:20, desc:'Permanent +5 attack this run.' },
    Monk:        { name:'Meditation Stone', icon:'🧘', type:'sp-potion',  sp:25, cost:18, desc:'Restore 25 SP instantly.' },
    Assassin:    { name:'Shadow Oil',       icon:'🌑', type:'def-potion', def:0, cost:15, desc:'Next attack guaranteed critical hit.', special:'crit' },
    Paladin:     { name:'Holy Water',       icon:'✝️', type:'potion',     heal:60, cost:20, desc:'Restores 60 HP with divine blessing.' },
    Naturalist:  { name:'Nature Salve',     icon:'🍃', type:'potion',     heal:45, cost:14, desc:'Natural remedy. Restores 45 HP.' },
    Sorcerer:    { name:'Spell Scroll',     icon:'📜', type:'sp-potion',  sp:35,  cost:22, desc:'Restores 35 SP. Arcane knowledge.' },
    Necromancer: { name:'Soul Shard',       icon:'💠', type:'sp-potion',  sp:20,  cost:16, desc:'Crystallized soul energy. +20 SP.' },
    Berserker:   { name:'Rage Brew',        icon:'🍺', type:'atk-potion', atk:8,  cost:22, desc:'Permanent +8 attack. Pure fury.' },
    Bard:        { name:'Inspiration',      icon:'🎵', type:'sp-potion',  sp:20,  cost:15, desc:'Musical inspiration. +20 SP.' },
    Alchemist:   { name:'Base Reagents',    icon:'⚗️', type:'cursed',     cost:5,  desc:'Raw alchemical components. Unpredictable.' },
    BloodKnight: { name:'Blood Vial',       icon:'🩸', type:'potion',     heal:50, cost:18, desc:'Dark crimson brew. Restores 50 HP.' },
    Druid:       { name:'Ancient Root',     icon:'🌿', type:'potion',     heal:45, cost:14, desc:'Ancient healing root. Restores 45 HP.' },
    Warlock:     { name:'Soul Fragment',    icon:'🧿', type:'sp-potion',  sp:30,  cost:18, desc:'Dark soul energy. Restores 30 SP.' },
    DeathKnight: { name:'Death Rune',       icon:'💀', type:'atk-potion', atk:6,  cost:20, desc:'Runic power. Permanent +6 attack this run.' },
    Dragonborn:  { name:'Dragon Scale',     icon:'🐉', type:'atk-potion', atk:7,  cost:22, desc:'A scale that radiates ancient power. +7 attack.' },
    Cleric:      { name:'Holy Relic',       icon:'✝️', type:'potion',     heal:70, cost:24, desc:'Sacred relic. Restores 70 HP with divine light.' },
    Wizard:      { name:'Spell Scroll',     icon:'📜', type:'sp-potion',  sp:40,  cost:20, desc:'Arcane scroll. Restores 40 SP instantly.' },
  };
  // NG+ exclusive item — always available in shop when on NG+
  if (DS.ngPlus) {
    var ngItem = { name:'Veteran Elixir', icon:'⭐', type:'potion', heal:100, cost:35, desc:'NG+ exclusive. Restores 100 HP. For survivors.' };
    return ngItem;
  }
  var item = classItems[DS.cls];
  if (!item) return null;
  // Handle shadow oil special
  if (item.special === 'crit') {
    return Object.assign({}, item, {
      onUse: function() { DS.markedKill = true; setEvent('good', 'Shadow Oil applied. Next attack guaranteed critical!'); say('Shadow Oil. Next attack is a guaranteed critical hit.'); }
    });
  }
  return item;
}


//═════════════════
// DDDI SECRET BOSS
//═════════════════
function spawnDDDIBoss() {
  DS.inCombat = true; DS.defending = false;
  DS.bossPhase = 1;
  DS.isDDDIBoss = true;
  DS.enemy = {
    name: 'Grand Overseer of the DDDI',
    icon: '🏛️',
    isBoss: true,
    isMultiPhase: true,
    isDDDI: true,
    gold: [150, 200],
    maxHp: 280,
    hp: 280,
    atk: [12, 22],
    phase1Hp: Math.round(280 * 0.66),
    phase2Hp: Math.round(280 * 0.33),
    phaseMsg2: 'The Grand Overseer adjusts their robes. "Your compliance record is insufficient." They hit harder.',
    phaseMsg3: 'The Grand Overseer produces a 47-page document. "Article IV, Section 12." The dungeon shakes.',
  };
  DS.enemy.maxHp = DS.enemy.hp;

  playTrack('boss');
  showDgPanels(false, true, false);

  document.getElementById('dg-enemy-icon').textContent = '🏛️';
  document.getElementById('dg-enemy-name').textContent = t('Grand Overseer of the DDDI');
  document.getElementById('dg-enemy-bar').style.width = '100%';
  document.getElementById('dg-enemy-hp').textContent = 'HP: 280/280';

  var bossPhaseEl = document.getElementById('boss-phase-bar');
  if (bossPhaseEl) {
    bossPhaseEl.style.display = '';
    document.querySelectorAll('.boss-phase-pip').forEach(function(p,i){ p.classList.toggle('active', i===0); });
  }

  setEvent('bad', 'THE DEPARTMENT OF DUNGEON DESCENT INCORPORATED HAS ARRIVED. The Grand Overseer materializes from a cloud of paperwork. Your dungeon record shows compliance violations. They produce a gavel the size of a door. The audit begins NOW.');

  say('SECRET BOSS ENCOUNTERED! The Grand Overseer of the Department of Dungeon Descent Incorporated. 280 HP. Three phases. The audit begins now. Prepare yourself.');
  addRunLog('DDDI SECRET BOSS ENCOUNTERED. The audit begins.', 'bad');

  setTimeout(function() {
    setCombatBtns(true);
    updateSkillButtons();
    document.getElementById('cbtn-attack').focus();
  }, 100);
}

function checkDDDIVictory() {
  if (!DS.isDDDIBoss) return false;
  // Mark DDDI as defeated permanently this run
  DS.dddiDefeated = true;
  DS.isDDDIBoss = false;
  // Unlock DDDI story in library
  var unlocks = _jsonParseSafe(DDStore.getItem('dd_unlocks'), '{}');
  unlocks['dddi-boss-defeated'] = true;
  DDStore.setItem('dd_unlocks', JSON.stringify(unlocks));
  // Big reward
  var reward = Math.round(175 + Math.random() * 50);
  DS.gold += (isNaN(reward) ? 0 : reward);
  DS.maxHp += 10; DS.hp = Math.min(DS.maxHp, DS.hp + 20);
  DS.maxSp += 10; DS.sp = Math.min(DS.maxSp, DS.sp + 10);
  updateTopBar(); updatePlayerBar(); updateXPBar();

  // Special victory screen
  showDgPanels(false, false, false);
  document.getElementById('dg-end').style.display = '';
  document.getElementById('dg-end-icon').textContent = '⚖';
  var t = document.getElementById('dg-end-title');
  t.className = 'dg-end-title victory';
  t.textContent = 'COMPLIANCE ACHIEVED';
  document.getElementById('dg-end-sub').textContent =
    'You have defeated the Grand Overseer of the Department of Dungeon Descent Incorporated.';

  var quoteEl = document.getElementById('dg-end-quote');
  if (!quoteEl) { quoteEl = document.createElement('div'); quoteEl.id='dg-end-quote'; quoteEl.className='dg-end-quote'; document.getElementById('dg-end-sub').after(quoteEl); }
  quoteEl.style.borderLeftColor = 'var(--gold-dim)';
  quoteEl.textContent = 'The Department does not acknowledge this defeat. The Department does not care. Your suspension has been reduced to 358,999,999 years.';

  document.getElementById('dg-end-stats').innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:var(--gold-dim);margin-bottom:12px;line-height:1.8;">' +
    '✦ Reward: +' + reward + ' gold<br>' +
    '✦ +10 permanent Max HP<br>' +
    '✦ +10 permanent Max SP<br>' +
    '✦ DDDI Founding Charter unlocked in Library<br>' +
    '✦ Suspension reduced to 358,999,999 years' +
    '</div>';

  document.getElementById('dg-retry-btn').textContent = 'Continue Descent';
  document.getElementById('dg-retry-btn').onclick = function() {
    document.getElementById('dg-end').style.display = 'none';
    DS.enemy = null; DS.inCombat = false;
    enterRoom();
  };

  say('You have defeated the Grand Overseer of the DDDI! ' +
    'The Department does not acknowledge this defeat. The Department does not care. ' +
    'Your suspension has been reduced to 358 million 999 thousand 999 years. ' +
    'Reward: ' + reward + ' gold. Plus 10 max HP. Plus 10 max SP. DDDI story unlocked in Library.');
  addRunLog('DDDI GRAND OVERSEER DEFEATED. Suspension reduced.', 'good');
  sfx('sfx-victory');
  return true;
}


// ── LORE FRAGMENT READER ──
function openLoreFragment(item) {
  var frag = SUNKEN_LORE_FRAGMENTS.find(function(f){ return f.id === item.fragmentId; });
  if (!frag) return;
  document.getElementById('fragment-title').textContent = '📜 ' + frag.name;
  document.getElementById('fragment-text').textContent = frag.text;
  openOv('ov-fragment');
  say('Reading: ' + frag.name + '. ' + frag.text);
}


//═════════════════
// BOSS FIGHT PREVIEW
//═════════════════
var BOSS_INTROS = {
  'Malachar the Undying':   'He refused to die. He still refuses. He has been refusing for a very long time.',
  'The Bone Colossus':      'Assembled from every skeleton in the Crypt. It remembers all of their deaths.',
  'The Crypt Sovereign':    'The dungeon itself built this thing. For occasions exactly like this one.',
  'Vel Ashara Reborn':      'The city did not just burn. It became this.',
  'The Eternal Pyre':       'The fire became aware three hundred years ago. It has been thinking ever since.',
  'The Ash Sovereign':      'It rules what the flames left behind. Which is everything.',
  'The Glacial Titan':      'It has been here since before the ice. The ice formed around it.',
  'The Frosthold Sovereign':'Nothing survives the Abyss. Except this.',
  'The Eternal Winter':     'The cold does not want you here. It will make this very clear.',
  'The Drowned Curator':    'It has read every book in the Archives. It did not enjoy what it learned.',
  'Leviathan of the Deep':  'The Archives were built around it. Not on top of it. Around it.',
  'The Last Librarian':     'She stayed when everyone else drowned. She has had a very long time to be angry.',
  'The Dungeon Itself':     'You have descended far enough that the dungeon noticed you. This is not good.',
  'The Nightmare Sovereign':'It was always here. You simply could not see it until now.',
  'Void Incarnate':         'The void has a name. You cannot pronounce it. This is for the best.',
  'Grand Overseer of the DDDI': 'The audit begins NOW.',
  'The Leviathan':          'It did not come here. It has always been here. You descended into it.',
  'The Ancient Tide':       'The ocean remembers every ship that sank. This is what memory becomes.',
  'The Drowned God':        'It was worshipped once. Then the sea rose. It is still waiting for the prayers to resume.',
  'The Abyssal Crown':      'Something at the bottom of everything decided it wanted to be in charge.',
  'The Deep Archivist':     'It has catalogued every creature that ever drowned. You are about to become an entry.',
  'The Echo':               'It is a copy of something you already killed. It remembers the fight. It will not make the same mistakes.',
  'The Shapeshifter':       'It has waited 3000 years for someone worth copying. Now it wears your face. It knows every move you will make.',
};

function showBossPreview(bossTemplate) {
  var overlay = document.getElementById('boss-preview-overlay');
  if (!overlay) return;

  var name = bossTemplate.name;
  var desc = BOSS_INTROS[name] || 'Something ancient stirs at the end of the hall. Something that has been waiting.';
  var isDDDI = name.indexOf('DDDI') !== -1;

  document.getElementById('bp-eyebrow').textContent = isDDDI ? '⚖ COMPLIANCE REQUIRED' : '⚠ Boss Encounter — Floor 10';
  document.getElementById('bp-icon').textContent = bossTemplate.icon || '💀';
  document.getElementById('bp-name').textContent = name;
  document.getElementById('bp-desc').textContent = desc;
  var artEl = document.getElementById('bp-art');
  if (artEl) {
    var art = typeof BOSS_ART !== 'undefined' ? BOSS_ART[name] : null;
    if (art) {
      artEl.src = art;
      artEl.style.display = 'block';
      document.getElementById('bp-icon').style.display = 'none';
    } else {
      artEl.style.display = 'none';
      document.getElementById('bp-icon').style.display = '';
    }
  }

  // Add HP info and dismiss button if not already there
  var bpExtra = document.getElementById('bp-extra');
  if (!bpExtra) {
    bpExtra = document.createElement('div');
    bpExtra.id = 'bp-extra';
    bpExtra.style.cssText = 'margin-top:16px;';
    overlay.querySelector('.boss-preview-overlay') ? overlay.querySelector('.boss-preview-overlay').appendChild(bpExtra) : overlay.appendChild(bpExtra);
  }
  var lvl = DS.level || 1;
  var bossHp = Math.round(bossTemplate.hp * (1 + (lvl-1) * 0.15));
  bpExtra.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.68rem;color:#cc4444;margin-bottom:14px;">HP: ' + bossHp + ' — 3 Phases — Grows stronger each phase</div>' +
    '<button type="button" onclick="dismissBossPreview()" style="padding:12px 28px;background:#1a0000;border:2px solid #cc0000;color:#ff6644;font-family:Cinzel,serif;font-size:0.8rem;cursor:pointer;" aria-label="Face the boss">⚔ Face It</button>';

  overlay.classList.add('open');
  say('Boss encounter. ' + name + '. ' + desc + ' HP: ' + bossHp + '. Three phases. Grows stronger each phase. Press Face It to begin.');

  // Boss entrance sound — evil laugh
  setTimeout(function() { sfx('sfx-vampire-laugh'); }, 400);

  // Focus dismiss button
  setTimeout(function() {
    var btn = overlay.querySelector('button');
    if (btn) btn.focus();
  }, 200);
}

function dismissBossPreview() {
  var overlay = document.getElementById('boss-preview-overlay');
  if (overlay) overlay.classList.remove('open');
}

//═════════════════
// SPIRIT BESTIARY
//═════════════════
function switchBestiaryTab(tab) {
  ['enemies','spire','spirits','community'].forEach(function(t) {
    var btn = document.getElementById('be-tab-' + t);
    var sec = document.getElementById('be-section-' + t);
    if (btn) { btn.classList.toggle('active', t === tab); btn.setAttribute('aria-selected', t === tab ? 'true' : 'false'); }
    if (sec) { sec.classList.toggle('active', t === tab); sec.style.display = t === tab ? '' : 'none'; }
  });
  if (tab === 'spirits') renderSpiritBestiary();
  if (tab === 'spire') renderSpireBestiary();
  if (tab === 'community') renderCommunityBestiary();
  say(tab === 'spirits' ? 'Spirits tab. Your spirit collection.' : tab === 'spire' ? 'The Spire tab. Creatures encountered in The Spire.' : tab === 'community' ? 'Community tab. Enemies created by players.' : 'Enemies tab. Bestiary entries.');
}

async function renderCommunityBestiary() {
  var grid = document.getElementById('be-community-grid');
  if (!grid) return;
  grid.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:20px;">Loading community enemies...</div>';

  try {
    await loadCommunityEnemies();
    grid.innerHTML = '';

    if (!_communityEnemyCache.length) {
      grid.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:20px;">No community enemies yet. Be the first to create one!</div>';
      return;
    }

    _communityEnemyCache.forEach(function(enemy) {
      var card = document.createElement('div');
      card.className = 'be-card';
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'listitem');
      card.setAttribute('aria-label', enemy.name + ', created by ' + enemy.creator + ', ' + (enemy.kills || 0) + ' kills');
      card.style.borderColor = '#554488';

      card.innerHTML =
        '<div class="be-icon" style="color:#aa88ff;" aria-hidden="true">' + (enemy.icon || '👤') + '</div>' +
        '<div class="be-name">' + enemy.name + '</div>' +
        '<div class="be-tier" style="color:#aa88ff;">Created by ' + enemy.creator + '</div>' +
        '<div class="be-desc">' + (enemy.desc || '') + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.58rem;color:#555;margin-top:4px;">' +
          (enemy.dungeon === 'all' ? 'All Dungeons' : enemy.dungeon) + ' · ' +
          (enemy.type || 'common') + ' · ' +
          'HP ' + enemy.hp + ' · ATK ' + enemy.atk +
          ' · ⚔ ' + (enemy.kills || 0) + ' kills' +
        '</div>';

      grid.appendChild(card);
    });

    say(_communityEnemyCache.length + ' community enemies loaded.');
  } catch(e) {
    grid.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#444;text-align:center;padding:20px;">Failed to load community enemies. Check your connection.</div>';
  }
}

function renderSpireBestiary() {
  var grid = document.getElementById('spire-bestiary-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var spireEntries = SPIRE_BESTIARY_DATA;
  if (spireEntries.length === 0) {
    var empty = document.createElement('p');
    empty.style.cssText = 'font-family:Cinzel,serif;font-size:0.75rem;color:#555;text-align:center;padding:20px;';
    empty.textContent = 'No Spire creatures discovered yet. Enter The Spire to begin your climb.';
    grid.appendChild(empty);
    return;
  }
  spireEntries.forEach(function(entry) {
    var card = document.createElement('div');
    card.className = 'be-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'listitem');
    card.setAttribute('aria-label', entry.name + '. ' + entry.tier + '. ' + entry.desc);
    card.innerHTML =
      '<div class="be-icon" aria-hidden="true">' + entry.icon + '</div>' +
      '<div class="be-info">' +
        '<div class="be-name">' + entry.name + (entry.isBoss ? ' ⚡' : '') + '</div>' +
        '<div class="be-tier">' + entry.tier + '</div>' +
        '<div class="be-desc">' + entry.desc + '</div>' +
      '</div>';
    grid.appendChild(card);
  });
}

function renderSpiritBestiary() {
  var grid = document.getElementById('spirit-be-grid');
  if (!grid) return;

  // Get all earned spirits across ALL characters
  var allEarned = [];
  CHARS.forEach(function(ch) {
    if (ch && ch.earnedSpirits) {
      ch.earnedSpirits.forEach(function(id) {
        if (allEarned.indexOf(id) === -1) allEarned.push(id);
      });
    }
  });

  var allSpirits = getAllSpirits();
  grid.innerHTML = '';

  // Group by rarity
  var groups = ['starter', 'rare', 'elite'];
  var groupLabels = { starter:'Starter Spirits', rare:'Rare Spirits — Dungeon Rewards', elite:'Elite Spirits — Elite Enemy Drops' };

  groups.forEach(function(rarity) {
    var spirits = allSpirits.filter(function(s){ return s.rarity === rarity; });
    if (spirits.length === 0) return;

    var header = document.createElement('div');
    header.style.cssText = 'grid-column:1/-1;font-family:Cinzel,serif;font-size:0.68rem;letter-spacing:0.3em;color:var(--gold-dim);text-transform:uppercase;margin:8px 0 4px;padding-bottom:6px;border-bottom:1px solid var(--border-dim);';
    header.textContent = groupLabels[rarity];
    grid.appendChild(header);

    spirits.forEach(function(spirit) {
      var isEarned = rarity === 'starter' || allEarned.indexOf(spirit.id) !== -1;
      var card = document.createElement('div');
      card.className = 'spirit-be-card ' + (isEarned ? (rarity === 'elite' ? 'elite-earned' : 'earned') : 'locked');
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'listitem');

      var lockHint = '';
      if (!isEarned) {
        if (rarity === 'rare') {
          var dungeonMap = { 'bone-hound-prime':'Complete Crypt of Malachar','inferno-hawk':'Complete Ashbound Wastes','glacial-wolf':'Complete Frosthold Abyss','crystal-serpent':'Complete Frosthold Abyss','void-wraith':'Complete Nightmare Mode','ash-phoenix':'Complete Ashbound Wastes','shadow-stalker':'Complete Crypt of Malachar' };
          lockHint = dungeonMap[spirit.id] || 'Complete a dungeon to unlock';
        } else if (rarity === 'elite') {
          lockHint = 'Defeat elite enemies for a chance to unlock';
        }
      }

      card.innerHTML =
        '<span class="spirit-be-icon" aria-hidden="true">' + (isEarned ? spirit.icon : '🔒') + '</span>' +
        '<div class="spirit-be-name">' + spirit.name + '</div>' +
        '<div class="spirit-be-rarity ' + rarity + '">' + rarity.toUpperCase() + (spirit.minLevel ? ' · LV ' + spirit.minLevel + '+' : '') + '</div>' +
        '<div class="spirit-be-desc">' + (isEarned ? spirit.desc : '???') + '</div>' +
        (isEarned ? '<div class="spirit-be-ability">✦ ' + spirit.ability + '</div>' : '') +
        (lockHint ? '<div class="spirit-be-lock">🔒 ' + lockHint + '</div>' : '');

      card.setAttribute('aria-label',
        spirit.name + '. ' + rarity + '. ' +
        (isEarned ? spirit.desc + ' Ability: ' + spirit.ability : 'Locked. ' + lockHint));

      grid.appendChild(card);
    });
  });

  var earnedCount = allEarned.length;
  var totalNonStarter = allSpirits.filter(function(s){ return s.rarity !== 'starter'; }).length;
  say('Spirit Bestiary. ' + earnedCount + ' of ' + totalNonStarter + ' non-starter spirits earned across all characters.');
}


//═════════════════
// DAILY QUEST INDICATOR
//═════════════════
function updateDQIndicator() {
  var el = document.getElementById('dq-indicator');
  var textEl = document.getElementById('dq-indicator-text');
  var barEl = document.getElementById('dq-indicator-bar');
  if (!el || !textEl || !barEl) return;

  var save = getDailyQuest();
  var def = getDailyQuestDef();
  if (!def) { el.style.display = 'none'; return; }

  el.style.display = '';
  var pct = Math.min(100, Math.round(((save.progress || 0) / def.target) * 100));

  if (save.complete) {
    el.className = 'dq-indicator complete';
    textEl.textContent = def.desc + ' ✦ Complete!';
    barEl.style.width = '100%';
  } else {
    el.className = 'dq-indicator';
    textEl.textContent = def.desc + ' (' + (save.progress||0) + '/' + def.target + ')';
    barEl.style.width = pct + '%';
  }
  // Update aria-label for screen readers
  el.setAttribute('aria-label', 'Daily quest: ' + def.desc + '. Progress: ' + (save.progress||0) + ' of ' + def.target + (save.complete ? '. Complete!' : '.'));
}


//═════════════════
// THE WEEPING CHILD — Special Encounter
//═════════════════
function triggerWeepingChild() {
  DS.inCombat = false;
  DS.wepingChildActive = true;
  var isRaid = (typeof RD !== 'undefined' && RD.active);

  // In raid mode — skip soothe mechanic, go straight to combat
  if (isRaid) {
    startWeepingChildCombat();
    return;
  }

  // In dungeon — show soothe options
  showDgPanels(false, false, false);
  setEvent('bad',
    'In the corner of the room, something small is sitting with its knees pulled to its chest. ' +
    'It is crying. The sound fills the entire floor. You do not know how long it has been here. ' +
    'You do not know what it is. But something about it makes you very reluctant to draw your weapon.'
  );
  var hasMBItem = DS.inventory && DS.inventory.some(function(item){ return item.isMusicBoxItem; });
  say('The Weeping Child. Something small and crying is in the corner. ' + (hasMBItem ? 'Three options: gently pick it up, hum a lullaby, or play the Music Box item from your inventory for a 75 percent chance.' : 'Two options: gently pick it up, or hum a lullaby. Choose carefully.'));

  // Check if player has Music Box item
  var hasMusicBox = DS.inventory && DS.inventory.some(function(item){ return item.isMusicBoxItem; });
  var actHtml =
    '<button class="dg-act-btn" onclick="sootheChild(\'pick\')" aria-label="Gently pick up the child and try to soothe it to sleep">🤱 Pick It Up Gently</button>' +
    '<button class="dg-act-btn" onclick="sootheChild(\'hum\')" aria-label="Hum a soft lullaby and hope it falls asleep">🎵 Hum a Lullaby</button>' +
    (hasMusicBox ? '<button class="dg-act-btn" style="border-color:var(--gold-dim);color:var(--gold);" onclick="sootheChild(\'musicbox\')" aria-label="Play the Music Box to lull the child to sleep. 75 percent success chance.">🎵 Play the Music Box (75%)</button>' : '');

  document.getElementById('dg-event').style.display = '';
  document.getElementById('dg-event').innerHTML +=
    '<div style="margin-top:12px;" id="weeping-child-btns">' + actHtml + '</div>';
}

function sootheChild(method) {
  var btns = document.getElementById('weeping-child-btns');
  if (btns) btns.remove();

  // Music Box option — play melody audio, consume item, high success
  if (method === 'musicbox') {
    // Consume the item
    var mbIdx = DS.inventory.findIndex(function(item){ return item.isMusicBoxItem; });
    if (mbIdx !== -1) DS.inventory.splice(mbIdx, 1);
    renderInv();
    // Play melody if audio loaded
    var prevTrack = AUD.current;
    if (AUD.current) {
      var old = AUD.tracks[AUD.current];
      if (old) { try { old.pause(); } catch(e2) {} }
      AUD.current = null;
    }
    playTrack('music-box');
    setEvent('', 'You open the music box. The melody fills the room. The child goes very still. Its eyes grow heavy. It has heard this melody before. It remembers something safe.');
    say('You play the Music Box. The melody plays. 75 percent chance of success.');
    // Result after melody plays
    setTimeout(function() {
      var mbTrack = AUD.tracks['music-box'];
      if (mbTrack) { try { mbTrack.pause(); mbTrack.currentTime = 0; } catch(e2) {} }
      AUD.current = null;
      if (prevTrack) playTrack(prevTrack);
      var success = Math.random() < 0.75;
      if (success) {
        DS.wepingChildSoothedThisRun = true;
        var reward = 22 + Math.floor(Math.random() * 12);
        DS.gold += (isNaN(reward) ? 0 : reward);
        updateTopBar();
        incrementAchievementStat('wepingChildSoothed', 1);
        sfx('sfx-unlock');
        setEvent('good', 'The child closes its eyes. It is asleep. The music box goes silent. You gain ' + reward + ' gold.');
        say('Success. The Music Box worked. The child sleeps. You gain ' + reward + ' gold.');
        setTimeout(function() { DS.wepingChildActive = false; enterRoom(); }, 3000);
      } else {
        setEvent('bad', 'The melody stops. The child opens its eyes. It stares at the music box. Then at you. It begins to scream.');
        say('Failed. The child woke up angry. Combat starting.');
        setTimeout(function() { startWeepingChildCombat(); }, 1500);
      }
    }, 5000); // Let melody play for 5 seconds
    return;
  }

  var successChance = method === 'pick' ? 0.50 : 0.55;
  var success = Math.random() < successChance;

  if (success) {
    DS.wepingChildActive = false;
    var reward = 18 + Math.floor(Math.random() * 12);
    DS.gold += (isNaN(reward) ? 0 : reward);
    updateTopBar();
    addRunLog('Soothed the Weeping Child. ' + reward + 'g reward.', 'good');
    incrementAchievementStat('wepingChildSoothed', 1);
    DS.wepingChildSoothedThisRun = true;
    sfx('sfx-unlock');
    setEvent('good',
      method === 'pick'
        ? 'You pick up the child carefully. For a moment nothing happens. Then it stops crying. It closes its eyes. Its breathing slows. You set it down gently. It is asleep. You gain ' + reward + ' gold and leave the room quietly.'
        : 'You begin to hum. It is not a song you know. It comes from somewhere older. The child stops crying and listens. Its eyes grow heavy. It is asleep. You gain ' + reward + ' gold and stand there for a moment before leaving.'
    );
    say('Success. The child is asleep. You gain ' + reward + ' gold. Achievement progress updated.');
    // Continue dungeon after brief pause
    setTimeout(function() {
      DS.wepingChildActive = false;
      enterRoom();
    }, 3000);
  } else {
    // Failed — now fight it
    setEvent('bad',
      method === 'pick'
        ? 'The child startles awake as you reach for it. Its eyes fly open. What you see in them is not fear. It begins to scream.'
        : 'The humming stops working. The child looks up at you. Its expression changes. It was never just crying. It was warning you.'
    );
    say('Failed. The child woke up. Combat starting now.');
    setTimeout(function() { startWeepingChildCombat(); }, 1500);
  }
}

function startWeepingChildCombat() {
  DS.wepingChildActive = false;
  var child = HOLLOW_ENEMIES.weeingChild;
  var ngMult = DS.ngPlus ? 1.20 : 1.0;
  DS.enemy = {
    name: child.name, icon: child.icon, gold: child.gold,
    hp: Math.round(child.hp * ngMult),
    maxHp: Math.round(child.hp * ngMult),
    atk: [Math.round(child.atk[0] * ngMult), Math.round(child.atk[1] * ngMult)],
    isWeepingChild: true,
  };
  DS.inCombat = true;
  DS.defending = false;
  // First encounter popup
  var killKey = 'dd_seen_' + (DS.enemy.name || '').replace(/[^a-z0-9]/gi,'_').toLowerCase();
  if (!DDStore.getItem(killKey)) {
    DDStore.setItem(killKey, '1');
    var bestEntry = BESTIARY_DATA ? BESTIARY_DATA.find(function(b){ return b.name === DS.enemy.name; }) : null;
    if (bestEntry && bestEntry.desc) {
      setEvent('good', '📖 First encounter: ' + DS.enemy.name + ' — ' + bestEntry.desc);
      say('First encounter. ' + DS.enemy.name + '. ' + bestEntry.desc);
    }
  }
  playTrack(battleTrack());
  showDgPanels(false, true, false);
  document.getElementById('dg-enemy-icon').textContent = child.icon;
  document.getElementById('dg-enemy-name').textContent = t(child.name);
  updateEnemyBar();
  setCombatBtns(true);
  updateSkillButtons();
  addLog('The Weeping Child attacks! It is small but it is furious.');
  say('The Weeping Child is fighting you. ' + DS.enemy.hp + ' HP. It is not happy.');
  showEnemyPreview(DS.enemy);
  applySpiritOnCombatStart();
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
}


//═════════════════
// WEEPING MOTHER — Special Encounter
//═════════════════
function triggerWeepingMother() {
  DS.inCombat = false;
  showDgPanels(false, false, false);

  var childSoothed = DS.wepingChildSoothedThisRun;

  if (childSoothed) {
    // Option: lead her to the sleeping child
    setEvent('bad',
      'A woman stands in the hallway. She is not looking at you. She is looking past you, through walls, through floors, through everything. ' +
      'She has been searching this house for longer than the house has existed. ' +
      'You realize you know what she is looking for.'
    );
    say('The Weeping Mother. She is searching for her child. You soothed the child earlier this run. You can lead her to it. Or you can fight her. She is very strong.');

    var actHtml =
      '<button class="dg-act-btn" onclick="motherOption(\'child\')" aria-label="Lead her to the sleeping child you soothed earlier">👶 Lead Her to the Child</button>' +
      '<button class="dg-act-btn" onclick="motherOption(\'fight\')" aria-label="Fight the Weeping Mother">⚔ Fight Her</button>';
    document.getElementById('dg-event').style.display = '';
    document.getElementById('dg-event').innerHTML +=
      '<div style="margin-top:12px;" id="weeping-mother-btns">' + actHtml + '</div>';
  } else {
    // No child — two options
    setEvent('bad',
      'A woman stands in the hallway. She is not looking at you. She is looking past you, through walls, through floors, through everything. ' +
      'She has been searching this house for longer than the house has existed. ' +
      'You do not have what she is looking for.'
    );
    say('The Weeping Mother. She is searching for her child. You did not find the child. Two options: do a chore for her, or fight her. She hits very hard.');

    var actHtml2 =
      '<button class="dg-act-btn" onclick="motherOption(\'chore\')" aria-label="Offer to do a chore for her in exchange for safe passage">🧹 Do a Chore For Her</button>' +
      '<button class="dg-act-btn" onclick="motherOption(\'fight\')" aria-label="Fight the Weeping Mother">⚔ Fight Her</button>';
    document.getElementById('dg-event').style.display = '';
    document.getElementById('dg-event').innerHTML +=
      '<div style="margin-top:12px;" id="weeping-mother-btns">' + actHtml2 + '</div>';
  }
}

function motherOption(choice) {
  var btns = document.getElementById('weeping-mother-btns');
  if (btns) btns.remove();

  if (choice === 'child') {
    // Best outcome — reunion
    var reward = 30 + Math.floor(Math.random() * 20);
    DS.gold += (isNaN(reward) ? 0 : reward);
    DS.maxHp += 5;
    DS.hp = Math.min(DS.maxHp, DS.hp + 20);
    updateTopBar(); updatePlayerBar();
    incrementAchievementStat('motherReunion', 1);
    sfx('sfx-unlock');
    addRunLog('Reunited the Weeping Mother with her child.', 'good');
    setEvent('good',
      'You lead her through the corridors. She follows without a word. ' +
      'When she sees the child sleeping in the corner she stops. ' +
      'She kneels down. She does not cry anymore. ' +
      'She looks at you once. Then she is gone. Both of them are gone. ' +
      'The room feels different now. Lighter. ' +
      'You gain ' + reward + ' gold. Your max HP increases by 5.'
    );
    say('Reunion. The mother found her child. Both at peace. You gain ' + reward + ' gold and 5 max HP. Achievement progress updated.');
    setTimeout(function() { enterRoom(); }, 3500);

  } else if (choice === 'chore') {
    // Cost HP but avoid fight
    var hpCost = 15 + Math.floor(Math.random() * 10);
    DS.hp = Math.max(1, DS.hp - hpCost);
    updatePlayerBar();
    addRunLog('Did a chore for the Weeping Mother. Cost ' + hpCost + ' HP.', 'bad');
    setEvent('',
      'You spend time helping her. Moving furniture. Searching rooms. Looking in places you would rather not look. ' +
      'She watches without speaking. Eventually she steps aside. ' +
      'You lost ' + hpCost + ' HP but you are still alive.'
    );
    say('You did the chore. Cost ' + hpCost + ' HP. She let you pass. Continuing.');
    setTimeout(function() { enterRoom(); }, 2500);

  } else {
    // Fight
    setEvent('bad', 'She turns to face you fully for the first time. Her expression does not change. It was never going to change.');
    say('Combat starting. The Weeping Mother. 80 HP. She hits very hard. Good luck.');
    setTimeout(function() { startWeepingMotherCombat(); }, 1200);
  }
}

function startWeepingMotherCombat() {
  var mother = HOLLOW_ENEMIES.weepingMother;
  var ngMult = DS.ngPlus ? 1.20 : 1.0;
  DS.enemy = {
    name: mother.name, icon: mother.icon, gold: mother.gold,
    hp: Math.round(mother.hp * ngMult),
    maxHp: Math.round(mother.hp * ngMult),
    atk: [Math.round(mother.atk[0] * ngMult), Math.round(mother.atk[1] * ngMult)],
    isWeepingMother: true,
  };
  DS.inCombat = true; DS.defending = false;
  playTrack(battleTrack());
  showDgPanels(false, true, false);
  document.getElementById('dg-enemy-icon').textContent = mother.icon;
  document.getElementById('dg-enemy-name').textContent = t(mother.name);
  updateEnemyBar(); updatePlayerBar();
  setCombatBtns(true); updateSkillButtons();
  showEnemyPreview(DS.enemy);
  applySpiritOnCombatStart();
  addLog('The Weeping Mother attacks. She is not angry. She is simply looking for something and you are in the way.');
  say('The Weeping Mother. ' + DS.enemy.hp + ' HP. She hits for up to ' + DS.enemy.atk[1] + ' damage.');
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
}

//═════════════════
// THE MUSIC BOX — Special Combat
//═════════════════
var _musicBoxInterval = null;

function startMusicBoxCombat(enemy) {
  DS.inCombat = true; DS.defending = false;
  DS.enemy = enemy;
  DS.musicBoxTurn = false; // false = your turn, true = music box melody turn

  playTrack(battleTrack());
  showDgPanels(false, true, false);
  document.getElementById('dg-enemy-icon').textContent = enemy.icon;
  document.getElementById('dg-enemy-name').textContent = t(enemy.name);
  updateEnemyBar(); updatePlayerBar();
  showEnemyPreview(enemy);

  addLog('The Music Box begins to play. When the melody starts your turn ends. Attack while you can.');
  say('The Music Box. Special combat. When the melody plays it deals damage every 1.5 seconds for 3 ticks. Then your turn returns. Attack now.');

  setCombatBtns(true); updateSkillButtons();
  setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
}

function musicBoxMelody() {
  // Disable combat buttons
  setCombatBtns(false);
  DS.musicBoxTurn = true;

  // Stop battle music and play music box melody
  var prevTrack = AUD.current;
  if (AUD.current) {
    var old = AUD.tracks[AUD.current];
    if (old) { try { old.pause(); } catch(e) {} }
    AUD.current = null;
  }
  playTrack('music-box');

  var ticks = 0;
  var maxTicks = 3;
  say('The Music Box plays. Brace yourself.');
  addLog('♪ The melody begins...');

  _musicBoxInterval = setInterval(function() {
    if (ticks >= maxTicks) {
      clearInterval(_musicBoxInterval);
      _musicBoxInterval = null;
      DS.musicBoxTurn = false;
      // Stop melody, resume battle music
      var melodyTrack = AUD.tracks['music-box'];
      if (melodyTrack) { try { melodyTrack.pause(); melodyTrack.currentTime = 0; } catch(e) {} }
      AUD.current = null;
      playTrack(prevTrack || battleTrack());
      addLog('♪ The melody fades. Your turn.');
      say('The melody ends. Your turn.');
      if (DS.enemy && DS.enemy.hp > 0 && DS.hp > 0) {
        setCombatBtns(true); updateSkillButtons();
        setTimeout(function() { document.getElementById('cbtn-attack').focus(); }, 100);
      }
      return;
    }
    ticks++;
    var dmg = 6 + Math.floor(Math.random() * 5);
    if (DS.defending) dmg = Math.max(1, Math.round(dmg * 0.5));
    DS.hp = Math.max(0, DS.hp - dmg);
    updatePlayerBar();
    sayLog('♪ Note ' + ticks + ' of ' + maxTicks + '. ' + dmg + ' damage. HP: ' + DS.hp + '/' + DS.maxHp + '.');
    if (DS.hp <= 0) {
      clearInterval(_musicBoxInterval);
      _musicBoxInterval = null;
      setTimeout(function() { playerDead(); }, 300);
    }
  }, 1500);
}

//═════════════════
// THE UNINVITED GUEST — Emerge Message
//═════════════════
function uninvitedGuestEmerge() {
  setEvent('danger', 'You search the room. Nothing. You turn around. It is behind you. It was not there before. It is there now. It has always been there.');
  say('The Uninvited Guest appeared behind you. It was not in the room when you entered. It is in the room now. Combat begins.');
}

//═════════════════
// THE TWIN — Mirrors your class
//═════════════════
function spawnTwin() {
  var classIcons = {
    Warrior:'⚔️', Monk:'🥋', Assassin:'🗡️', Paladin:'🛡️',
    Naturalist:'🌿', Sorcerer:'🔮', Necromancer:'💀', Berserker:'🪓',
    Bard:'🎵', Alchemist:'⚗️', BloodKnight:'🩸', Druid:'🍃'
  };
  var icon = classIcons[DS.cls] || '👤';
  return {
    name: 'The Twin',
    icon: icon,
    hp: DS.maxHp,
    maxHp: DS.maxHp,
    atk: [DS.atkBonus + 5, DS.atkBonus + 12],
    gold: [10, 20],
    isTwin: true,
  };
}


// ── MANUAL REPAIR ──
function manualRepairUnlocks() {
  repairDungeonUnlocks();
  refreshDungeonUnlocks();
  var unlocked = getUnlockedDungeons();
  say('Dungeon unlock repair complete. ' + unlocked.length + ' dungeons now available: ' + unlocked.join(', ') + '.');
  // Also force unlock based on DS if in dungeon
  if (DS && DS.dungeon) {
    var order = ['Crypt of Malachar','The Ashbound Wastes','Frosthold Abyss','The Sunken Archives','The Hollow','The Whispering Forest','The Infernal Descent','The Abyssal Deep'];
    var idx = order.indexOf(DS.dungeon);
    if (idx >= 0) {
      var u = _jsonParseSafe(DDStore.getItem('dd_unlocks'), '{}');
      // Unlock everything up to and including next dungeon
      for (var i = 0; i <= idx && i < order.length - 1; i++) {
        u[order[i+1]] = true;
      }
      DDStore.setItem('dd_unlocks', JSON.stringify(u));
    }
  }
  refreshDungeonUnlocks();
  say('Repair complete. ' + getUnlockedDungeons().length + ' dungeons now unlocked.');
}

// ── DEV TOOLS ──
function openDevToolsPrompt() {
  var ov = document.getElementById('ov-dev-password');
  if (ov) {
    ov.classList.add('open');
    document.getElementById('dev-password-input').value = '';
    document.getElementById('dev-password-error').textContent = '';
    setTimeout(function() { document.getElementById('dev-password-input').focus(); }, 200);
    say('Developer Tools. Enter the password to continue.');
  }
}

function closeDevPassword() {
  var ov = document.getElementById('ov-dev-password');
  if (ov) ov.classList.remove('open');
}

var _devPasswordAttempts = 0;
var _devToolsLocked = false;

function checkDevPassword() {
  if (_devToolsLocked) { closeDevPassword(); return; }
  var input = document.getElementById('dev-password-input');
  var error = document.getElementById('dev-password-error');
  if (!input) return;
  var correctPw = DDStore.getItem('dd_dev_pw') || '67';
  if (input.value === correctPw) {
    _devPasswordAttempts = 0;
    closeDevPassword();
    openDevTools();
  } else {
    _devPasswordAttempts++;
    input.value = '';
    if (_devPasswordAttempts >= 3) {
      _devToolsLocked = true;
      var devBtn = document.querySelector('[onclick="openDevToolsPrompt()"]');
      if (devBtn) devBtn.style.display = 'none';
      closeDevPassword();
      say('Access denied. Developer Tools have been removed.');
    } else {
      var rem = 3 - _devPasswordAttempts;
      error.textContent = 'Incorrect. ' + rem + ' attempt' + (rem !== 1 ? 's' : '') + ' remaining.';
      say('Incorrect password. ' + rem + ' attempts remaining.');
      input.focus();
    }
  }
}

function openDevTools() {
  var ov = document.getElementById('ov-dev-tools');
  if (ov) {
    ov.classList.add('open');
    say('Developer Tools unlocked. Use caution.');
    setTimeout(function() {
      var first = ov.querySelector('button');
      if (first) first.focus();
    }, 200);
  }
}

function closeDevTools() {
  var ov = document.getElementById('ov-dev-tools');
  if (ov) ov.classList.remove('open');
  say('Developer Tools closed.');
}

function openChangeDevPassword() {
  var ov = document.getElementById('ov-change-dev-pw');
  if (!ov) return;
  ov.style.display = 'flex';
  document.getElementById('dev-new-pw-input').value = '';
  document.getElementById('dev-confirm-pw-input').value = '';
  document.getElementById('dev-change-pw-error').textContent = '';
  setTimeout(function() { document.getElementById('dev-new-pw-input').focus(); }, 100);
  say('Change developer password. Enter new password twice then press Confirm.');
}

function closeChangeDevPassword() {
  var ov = document.getElementById('ov-change-dev-pw');
  if (ov) ov.style.display = 'none';
  say('Cancelled.');
}

function confirmChangeDevPassword() {
  var np = document.getElementById('dev-new-pw-input').value;
  var cp = document.getElementById('dev-confirm-pw-input').value;
  var err = document.getElementById('dev-change-pw-error');
  if (!np) { err.textContent = 'Please enter a new password.'; say('Enter a new password.'); return; }
  if (np.length < 2) { err.textContent = 'Password must be at least 2 characters.'; return; }
  if (np !== cp) { err.textContent = 'Passwords do not match.'; say('Passwords do not match.'); document.getElementById('dev-confirm-pw-input').value = ''; document.getElementById('dev-confirm-pw-input').focus(); return; }
  // Save to localStorage so it persists
  DDStore.setItem('dd_dev_pw', np);
  closeChangeDevPassword();
  say('Password changed. New password saved.');
  err.textContent = '';
}

function devGenerateCode() {
  var rewardId = document.getElementById('dev-code-reward').value;
  var label = document.getElementById('dev-code-label').value.trim();

  // Generate code with reward baked in
  // Format: VOID-XXXX-XXXX where the code deterministically maps to the reward
  // We find a code that maps to the desired reward via our seed system
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  var rewardIds = ['gold_500','gold_250','coins_5','discount_10','xp_boost','gold_750','coins_10'];
  var targetIdx = rewardIds.indexOf(rewardId);
  if (targetIdx === -1) targetIdx = 0;

  // Try codes until we find one that maps to the right reward
  var code = '';
  var attempts = 0;
  while (attempts < 1000) {
    var part1 = '', part2 = '';
    for (var i = 0; i < 4; i++) part1 += chars[Math.floor(Math.random() * chars.length)];
    for (var i = 0; i < 4; i++) part2 += chars[Math.floor(Math.random() * chars.length)];
    var candidate = 'VOID-' + part1 + '-' + part2;

    // Check what reward this maps to
    var seed = 0;
    for (var i = 0; i < candidate.length; i++) seed = (seed * 31 + candidate.charCodeAt(i)) & 0xffff;
    var prizes = ['gold_500','gold_250','coins_5','discount_10','xp_boost','gold_750','coins_10'];
    if (prizes[seed % prizes.length] === rewardId) {
      code = candidate;
      break;
    }
    attempts++;
  }

  // Fallback — use any code and just note the reward
  if (!code) {
    var p1 = '', p2 = '';
    for (var i = 0; i < 4; i++) p1 += chars[Math.floor(Math.random() * chars.length)];
    for (var i = 0; i < 4; i++) p2 += chars[Math.floor(Math.random() * chars.length)];
    code = 'VOID-' + p1 + '-' + p2;
  }

  // Show it
  var wrap = document.getElementById('dev-generated-code-wrap');
  var codeEl = document.getElementById('dev-generated-code');
  var labelEl = document.getElementById('dev-generated-label');
  if (wrap) wrap.style.display = '';
  if (codeEl) codeEl.textContent = code;

  var rewardLabels = {
    gold_500: '💰 500 Gold',
    gold_750: '💰 750 Gold',
    gold_250: '💰 250 Gold',
    coins_5:  '🪙 5 Mystery Coins',
    coins_10: '🪙 10 Mystery Coins',
    discount_10: '⚒ 10% Blacksmith Discount (1 hour)',
    xp_boost: '⚡ 2x XP Next Run'
  };
  var rewardText = rewardLabels[rewardId] || rewardId;
  if (labelEl) labelEl.textContent = 'Reward: ' + rewardText + (label ? ' — ' + label : '');

  say('Code generated: ' + code + '. Reward: ' + rewardText + '. Press Copy Code to copy it.');
}

function devCopyCode() {
  var codeEl = document.getElementById('dev-generated-code');
  if (!codeEl) return;
  var code = codeEl.textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(code).then(function() {
      say('Code copied: ' + code);
    }).catch(function() {
      // Clipboard permission can be denied (common in embedded WebViews) —
      // without this, the write silently fails and the user hears nothing.
      say('Your code is: ' + code);
    });
  } else {
    say('Your code is: ' + code);
  }
}

function devForceAmbush() {
  if (!DS || !DS.dungeon) { say('You must be in a dungeon first.'); return; }
  DS._forceAmbush = true;
  closeDevTools();
  say('Ambush forced. Enter the next room to trigger it.');
  setEvent('good', '🔧 Dev: Ambush will trigger in the next room.');
}

function devGodMode() {
  if (!DS || !DS.dungeon) { say('You must be in a dungeon first.'); return; }
  DS.maxHp = 1000000;
  DS.hp = 1000000;
  updatePlayerBar();
  updateTopBar();
  closeDevTools();
  say('God Mode active. HP set to 1 million.');
  setEvent('good', '🔧 Dev: God Mode — HP set to 1,000,000.');
}

function devJumpFloor10() {
  if (!DS || !DS.dungeon) { say('You must be in a dungeon first.'); return; }
  DS.inCombat = false;
  DS.enemy = null;
  DS.floor = 10;
  DS.roomsOnFloor = 0;
  DS.floorRoomsNeeded = 1;
  DS._killStreak = 0;
  DS._blackBoxThisFloor = false;
  closeDevTools();
  say('Jumped to floor 10. Move to trigger the elite guardian then the boss.');
  setEvent('good', '🔧 Dev: Floor 10. Move to start the boss sequence.');
  showDgPanels(true, false, false);
}

function devForceMedusa() {
  if (!DS || !DS.dungeon) { say('You must be in a dungeon first.'); return; }
  DS.medusaEncounteredThisRun = false;
  DS._forceMedusaSpawn = true;
  DS.floor = Math.max(DS.floor, 4);
  say('Medusa will spawn in the next room. Navigate to a new room.');
  closeDevTools();
  setEvent('good', 'Dev: Medusa force spawn set. Enter next room.');
}

function devAwakeVoidReaper() {
  var ref = getVRRef();
  if (!ref) { say('RTDB not connected.'); return; }
  ref.update({
    awake: true,
    awakenedAt: Date.now(),
    currentHp: VR_GLOBAL_HP,
    totalHp: VR_GLOBAL_HP,
    defeated: false,
    killCount: 0,
    lastKiller: null,
  }).then(function() {
    say('Dev: Void Reaper force-awakened in RTDB. All players can now see it.');
    setEvent('good', 'Dev: Void Reaper awakened globally.');
  }).catch(function(e) { say('Dev: RTDB write failed. ' + e.message); });
}

function devResetVoidReaper() {
  var ref = getVRRef();
  if (!ref) { say('RTDB not connected.'); return; }
  vrRestartCycle();
  say('Dev: Void Reaper reset. New countdown started for all players.');
  setEvent('good', 'Dev: Void Reaper global reset.');
}

function devUnlockAll() {
  var u = {
    'The Ashbound Wastes': true,
    'Frosthold Abyss': true,
    'The Sunken Archives': true,
    'The Hollow': true,
    'The Whispering Forest': true // (it was left locked)
  };
  DDStore.setItem('dd_unlocks', JSON.stringify(u));
  DDStore.setItem('dd_infernal_unlocked', '1');
  DDStore.setItem('dd_abyssal_unlocked', '1');
  DDStore.setItem('dd_shadowworld_unlocked', '1');
  DDStore.setItem('dd_dev_mode', '1');
  refreshDungeonUnlocks();
  refreshInfernalCard();
  say('Dev: all dungeons unlocked including The Infernal Descent.');
}

function refreshInfernalCard() {
  var card = document.getElementById('infernal-dungeon-card');
  if (!card) return;
  if (isInfernalUnlocked()) {
    var wasLocked = card.classList.contains('locked');
    card.classList.remove('locked');
    card.disabled = false;
    card.setAttribute('aria-disabled', 'false');
    card.setAttribute('aria-label', 'The Infernal Descent. Unlocked. A dungeon of pure darkness and void.');
    var noteEl = card.querySelector('.dungeon-unlock-note');
    if (noteEl) { noteEl.textContent = '🔥 Unlocked — The gate is open'; noteEl.style.color = '#ff4444'; }
    // Only announce if it JUST became unlocked this session
    if (wasLocked && !DDStore.getItem('dd_infernal_announced')) {
      DDStore.setItem('dd_infernal_announced', '1');
      showToast('🔥 The Infernal Descent is now unlocked!', 'red');
      say('The Infernal Descent has been unlocked! You have earned 100 trophies.');
    }
  }
}

function devResetUnlocks() {
  DDStore.setItem('dd_unlocks', JSON.stringify({}));
  // (the Infernal, Abyssal and Shadow World stayed open)
  DDStore.removeItem('dd_infernal_unlocked'); DDStore.removeItem('dd_abyssal_unlocked'); DDStore.removeItem('dd_shadowworld_unlocked');
  refreshDungeonUnlocks();
  say('Dev: all dungeon unlocks reset. Only Crypt of Malachar available.');
}


function devResetSRPrompt() {
  DDStore.removeItem('dd_sr_prompt_seen');
  var el = document.getElementById('sr-prompt');
  if (el) { el.style.display = 'flex'; }
  say('Dev: screen reader prompt reset. Showing now.');
  setTimeout(function() {
    var btn = document.querySelector('#sr-prompt button');
    if (btn) btn.focus();
  }, 200);
}

// ── WHATS NEW ──
var CURRENT_VERSION = '11.7.3';
function checkWhatsNew() {
  // Update ALL version displays from single source of truth
  var vtag = document.querySelector('.version-tag');
  if (vtag) { vtag.textContent = 'v' + CURRENT_VERSION + ' · Release'; vtag.setAttribute('aria-label', t('Version ' + CURRENT_VERSION + ', Release')); }
  var loadingTag = document.getElementById('loading-version-tag');
  if (loadingTag) loadingTag.textContent = 'v' + CURRENT_VERSION;
  var generalVersion = document.getElementById('general-version-display');
  if (generalVersion) generalVersion.textContent = 'Dungeon Descent v' + CURRENT_VERSION;
  var loadingAnim = document.querySelector('.loading-animation-text');
  // loading animation text is JS-generated so handled separately below
  var seen = DDStore.getItem('dd_version_seen');
  if (seen === CURRENT_VERSION) return;

  // dd_version_seen being empty does NOT mean this is a brand-new player —
  // this whole mechanism was dead code until it got wired up, so EVERY
  // existing player's dd_version_seen is empty too, no matter how much save
  // data they have. The bug in the previous fix: it treated "never recorded"
  // as "never played," silently ate the popup on that first load, and wrote
  // dd_version_seen going forward — so it could only ever have shown once,
  // and then never again on any later refresh. Use real save-data signals
  // instead to tell an actual fresh install apart from an existing player.
  var hasPlayedBefore = !!DDStore.getItem('dd_tutorial_seen') || (CHARS && CHARS.length > 0);
  if (!seen && !hasPlayedBefore) {
    // Genuinely brand new — nothing to compare against, no popup needed.
    DDStore.setItem('dd_version_seen', CURRENT_VERSION);
    return;
  }

  // Either a returning player upgrading from a known older version, or an
  // existing player whose dd_version_seen was simply never recorded before
  // now — show the popup either way. Only play the migration animation when
  // there's an actual older version to name; it describes a real one-time
  // localStorage-to-IndexedDB migration, so it shouldn't run for a player who
  // was never truly "on" a previous version as far as this flag knows.
  setTimeout(function() {
    if (seen) {
      showMigrationAnimation(function() { showWhatsNewPopup(); });
    } else {
      showWhatsNewPopup();
    }
  }, 1200);
}
function showWhatsNewPopup() {
  // The #whats-new-popup CSS rule (fixed overlay, flex-centered) existed, but
  // no element with that id was ever added to the page — this function just
  // silently no-op'd via the `if (popup)` guard. Built here instead, reusing
  // the same content already written for the full What's New screen's latest
  // version block, so it stays in sync automatically on every future version.
  var popup = document.getElementById('whats-new-popup');
  if (!popup) {
    popup = document.createElement('div');
    popup.id = 'whats-new-popup';
    popup.setAttribute('role', 'dialog');
    popup.setAttribute('aria-modal', 'true');
    document.body.appendChild(popup);
  }
  var latestBlock = document.querySelector('.version-block.latest');
  var titleText = 'v' + CURRENT_VERSION;
  var dateText = '';
  var changesHtml = '';
  if (latestBlock) {
    var numEl = latestBlock.querySelector('.version-num');
    var dateEl = latestBlock.querySelector('.version-date');
    var changesEl = latestBlock.querySelector('.version-changes');
    if (numEl) titleText = numEl.textContent.replace('— Latest', '').trim();
    if (dateEl) dateText = dateEl.textContent;
    if (changesEl) changesHtml = changesEl.outerHTML;
  }
  popup.setAttribute('aria-label', 'What is new in ' + titleText);
  popup.innerHTML =
    '<div style="max-width:480px;width:100%;max-height:80vh;overflow-y:auto;background:#0a0a0a;border:1px solid #443300;padding:24px;box-sizing:border-box;">' +
      '<div style="text-align:center;font-family:\'Cinzel Decorative\',cursive;font-size:1.15rem;color:var(--gold-bright);margin-bottom:4px;">🎉 ' + titleText + '</div>' +
      (dateText ? '<div style="text-align:center;font-family:Cinzel,serif;font-size:0.62rem;color:var(--text-dim);letter-spacing:0.15em;margin-bottom:16px;">' + dateText + '</div>' : '') +
      changesHtml +
      '<button class="btn-gold" onclick="closeWhatsNew()" aria-label="Continue to the game" style="width:100%;margin-top:18px;padding:14px;font-family:Cinzel,serif;font-size:0.8rem;background:var(--gold);cursor:pointer;">⚔ Continue</button>' +
    '</div>';
  popup.style.display = 'flex';
  say('What is new in version ' + CURRENT_VERSION + '. Press the button to start playing.');
  setTimeout(function() {
    var btn = popup.querySelector('.btn-gold');
    if (btn) btn.focus();
  }, 100);
}

// ── MIGRATION ANIMATION ──
function showMigrationAnimation(onComplete) {
  var overlay = document.createElement('div');
  overlay.id = 'migration-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.setAttribute('aria-label', 'Upgrading save data. Please wait.');
  overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;font-family:Cinzel,serif;';

  var lines = [
    { t: 0,    text: '⚙️ Dungeon Descent v' + CURRENT_VERSION, size: '1.1rem', color: '#c9a227' },
    { t: 500,  text: 'Initialising IndexedDB storage engine...', size: '0.78rem', color: '#888' },
    { t: 1400, text: 'Reading save data from localStorage...', size: '0.78rem', color: '#888' },
    { t: 2300, text: 'Copying to IndexedDB — do not close the app', size: '0.78rem', color: '#aaa' },
    { t: 3700, text: 'Verifying data integrity...', size: '0.78rem', color: '#aaa' },
    { t: 4600, text: '✅ Migration complete. Welcome back, Descender.', size: '0.82rem', color: '#c9a227' },
  ];

  var logBox = document.createElement('div');
  logBox.style.cssText = 'width:min(480px,90%);margin-bottom:28px;min-height:140px;';
  overlay.appendChild(logBox);

  // Progress bar container
  var barWrap = document.createElement('div');
  barWrap.style.cssText = 'width:min(480px,90%);height:6px;background:#1a1a1a;border-radius:4px;overflow:hidden;margin-bottom:20px;';
  var bar = document.createElement('div');
  bar.style.cssText = 'height:100%;width:0%;background:#c9a227;border-radius:4px;transition:width 0.4s linear;';
  barWrap.appendChild(bar);
  overlay.appendChild(barWrap);

  var pct = document.createElement('div');
  pct.style.cssText = 'font-size:0.7rem;color:#555;letter-spacing:0.1em;';
  pct.textContent = '0%';
  overlay.appendChild(pct);

  document.body.appendChild(overlay);

  // AudioContext beeps
  function beep(freq, dur) {
    try {
      var ctx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + dur);
    } catch(e) {}
  }

  // Animate log lines
  lines.forEach(function(line) {
    setTimeout(function() {
      var p = document.createElement('p');
      p.style.cssText = 'font-size:' + line.size + ';color:' + line.color + ';margin:4px 0;line-height:1.6;';
      p.textContent = line.text;
      logBox.appendChild(p);
      beep(line.color === '#c9a227' ? 880 : 440, 0.08);
      say(line.text);
    }, line.t);
  });

  // Progress bar animation — 5 steps over ~4.8s
  var steps = [
    { t: 500,  w: 8 },
    { t: 1400, w: 25 },
    { t: 2300, w: 55 },
    { t: 3200, w: 72 },
    { t: 3700, w: 88 },
    { t: 4600, w: 100 },
  ];
  steps.forEach(function(s) {
    setTimeout(function() {
      bar.style.width = s.w + '%';
      pct.textContent = s.w + '%';
      if (s.w === 100) beep(1200, 0.15);
    }, s.t);
  });

  // Done — remove overlay and continue
  setTimeout(function() {
    overlay.style.transition = 'opacity 0.6s';
    overlay.style.opacity = '0';
    setTimeout(function() {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (onComplete) onComplete();
    }, 650);
  }, 5400);
}

function closeWhatsNew() {
  DDStore.setItem('dd_version_seen', CURRENT_VERSION);
  var popup = document.getElementById('whats-new-popup');
  if (popup) popup.style.display = 'none';
  say('Welcome to Dungeon Descent version ' + CURRENT_VERSION + '.');
}

// -- SEASONAL EVENT POPUP --
function checkSeasonalEventPopup() {
  var ev = getActiveEvent();
  // Only show popup for MAJOR seasonal events — weekly events just use the menu banner
  var majorEvents = ['halloween','christmas','thanksgiving','easter','july4','birthday','cincodemayo'];
  if (!ev || majorEvents.indexOf(ev) === -1) return;
  var bonuses = getEventBonuses();
  if (!bonuses) return;
  // Only show once per event activation (track by event id + date)
  var now = new Date();
  var todayKey = ev + '-' + now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
  if (DDStore.getItem('dd_event_popup_seen') === todayKey) return;

  setTimeout(function() {
    // Don't show if whats-new popup is already visible
    var wnp = document.getElementById('whats-new-popup');
    if (wnp && (wnp.style.display === 'flex' || wnp.classList.contains('open'))) { setTimeout(checkSeasonalEventPopup, 6000); return; }
    // only on the main menu: it must never cover character creation or a run
    if (typeof _currentScreen !== 'undefined' && _currentScreen && _currentScreen !== 'menu') { setTimeout(checkSeasonalEventPopup, 6000); return; }

    var existing = document.getElementById('event-arrival-popup');
    if (existing) existing.remove();
    var popup = document.createElement('div');
    popup.id = 'event-arrival-popup';
    popup.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:8800;display:flex;align-items:center;justify-content:center;padding:24px;';
    popup.innerHTML =
      '<div style="max-width:380px;width:100%;text-align:center;">' +
      '<div style="font-family:Cinzel,serif;font-size:0.5rem;letter-spacing:0.4em;color:#ffaa00;opacity:0.7;margin-bottom:12px;">✦ SEASONAL EVENT — NOW ACTIVE ✦</div>' +
      '<div style="font-size:2.5rem;margin-bottom:12px;" aria-hidden="true">' + bonuses.label.split(' ')[0] + '</div>' +
      '<h2 style="font-family:\'Cinzel Decorative\',cursive;font-size:1.1rem;color:#ffdd44;margin-bottom:12px;">' + bonuses.label + '</h2>' +
      '<p style="font-family:Cinzel,serif;font-size:0.72rem;color:#c0b090;line-height:1.8;margin-bottom:16px;">' + bonuses.label + ' has begun. Enter a dungeon to join the event.</p>' +
      '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:#ffdd44;border:1px solid #ffaa0066;padding:10px 16px;margin-bottom:20px;line-height:1.8;">' +
      (bonuses.xpMult ? '⚡ ' + Math.round((bonuses.xpMult-1)*100) + '% bonus XP<br>' : '') +
      (bonuses.goldMult ? '💰 ' + Math.round((bonuses.goldMult-1)*100) + '% bonus gold<br>' : '') +
      (bonuses.enemyMult && bonuses.enemyMult > 1 ? '⚔️ Enemies ' + Math.round((bonuses.enemyMult-1)*100) + '% stronger<br>' : '') +
      (bonuses.extraEnemies && bonuses.extraEnemies.length ? '👾 Exclusive enemies invading<br>' : '') +
      '</div>' +
      '<button onclick="document.getElementById(\'event-arrival-popup\').remove();DDStore.setItem(\'dd_event_popup_seen\',\'' + todayKey + '\');" style="font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:0.2em;padding:12px 28px;border:1px solid #ffaa00;background:transparent;color:#ffdd44;cursor:pointer;text-transform:uppercase;" aria-label="Enter the dungeon and join the event">Enter the Dungeon</button>' +
      '</div>';
    document.body.appendChild(popup);
    setTimeout(function(){ var btn = popup.querySelector('button'); if(btn) btn.focus(); }, 80);
    say(bonuses.label + ' event is now active. Enter a dungeon to join. ' + (bonuses.xpMult ? Math.round((bonuses.xpMult-1)*100) + ' percent bonus XP. ' : '') + (bonuses.goldMult ? Math.round((bonuses.goldMult-1)*100) + ' percent bonus gold.' : ''));
    DDStore.setItem('dd_event_popup_seen', todayKey);
  }, 3500);
}

// --
//  DUNGEON DESCENT -- PVP CLIENT
// --
