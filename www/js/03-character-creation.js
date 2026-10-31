//═════════════════
// CHARACTER CREATION
//═════════════════
var NC = { cls: null, race: null, prof: null, name: '', dungeon: null, diff: null, runMode: 'classic', step: 1 };

function resetCreation() {
  NC.cls = null; NC.race = null; NC.prof = null; NC.name = ''; NC.dungeon = null; NC.diff = null; NC.step = 1; NC.runMode = 'classic'; NC.spirit = null; NC.corruption = false; NC.hardcore = false;
  document.querySelectorAll('.class-card,.race-card,.prof-card,.diff-card,.dungeon-card:not(.locked)').forEach(function(c) {
    c.classList.remove('sel'); c.setAttribute('aria-checked', 'false');
  });
  document.getElementById('char-name-input').value = '';
  document.getElementById('name-hint').textContent = 'Name must be between 2 and 24 characters.';
  for (var i = 1; i <= 6; i++) {
    var ind = document.getElementById('ci-' + i);
    if (ind) ind.className = 'step-item' + (i === 1 ? ' active' : '');
    var pan = document.getElementById('cp-' + i);
    if (pan) pan.className = 'step-panel' + (i === 1 ? ' active' : '');
  }
}

function cStep(n) {
  if (n > NC.step) {
    if (NC.step === 1 && !NC.cls) { say('Please select a class first.'); return; }
    if (NC.step === 2 && !NC.race) { say('Please select a race first.'); return; }
    if (NC.step === 3 && !NC.prof) { say('Please select a profession first.'); return; }
    if (NC.step === 4 && NC.name.length < 2) { say('Please enter a name of at least 2 characters.'); return; }
    if (NC.step === 5 && !NC.dungeon) { say('Please select a dungeon first.'); return; }
    if (NC.step === 6 && !NC.diff) { NC.diff = 'Wanderer'; }
    if (NC.step === 7 && !NC.runMode) { NC.runMode = 'classic'; }
    if (NC.step === 8 && !NC.spirit) {
      // Auto-pick first available spirit if none chosen
      var allSpirits = STARTER_SPIRITS.concat(getCustomSpiritsWithFunctions());
      if (allSpirits.length) NC.spirit = allSpirits[0].id;
    }
  }
  document.getElementById('cp-' + NC.step).classList.remove('active');
  var oldInd = document.getElementById('ci-' + NC.step);
  if (oldInd) { oldInd.classList.remove('active'); if (n > NC.step) oldInd.classList.add('done'); else oldInd.classList.remove('done'); }
  NC.step = n;
  document.getElementById('cp-' + n).classList.add('active');
  if (n === 8) renderSpiritCreationStep();
  if (n === 12) renderBackstoryGrid();
  if (n === 7) {
    // Init run mode selection
    pickRunMode(NC.runMode || 'classic');
  }
  var newInd = document.getElementById('ci-' + n);
  if (newInd) { newInd.classList.remove('done'); newInd.classList.add('active'); }
  var h = document.querySelector('#cp-' + n + ' h3');
  if (h) { h.setAttribute('tabindex', '-1'); h.focus(); }
  var names = ['','Choose Your Class','Choose Your Race','Choose Your Profession','Name Your Character','Choose Your Dungeon','Choose Your Difficulty','Choose Your Run Mode','Choose Your Spirit','Corruption Mode','Hunter Mode','Your Guide','Your Origin'];
  say('Step ' + n + ' of 12. ' + (names[n]||'') + '. Use the options below to make your selection.');
  if (n === 5) {
    refreshDungeonUnlocks();
    // Auto-select first unlocked dungeon if nothing chosen yet
    if (!NC.dungeon) {
      var firstUnlocked = document.querySelector('.dungeon-card:not(.locked)');
      if (firstUnlocked) pickDungeon(firstUnlocked);
    } else {
      // Re-highlight already-chosen dungeon
      var chosen = document.querySelector('.dungeon-card[data-dungeon="' + NC.dungeon + '"]');
      if (chosen && !chosen.disabled) { chosen.classList.add('sel'); chosen.setAttribute('aria-checked','true'); }
    }
  }
  if (n === 6) {
    updateSummary();
    if (!NC.diff) {
      var defaultCard = document.querySelector('.diff-card[data-diff="Wanderer"]');
      if (defaultCard) pickDiff(defaultCard);
    }
    // Restore hardcore radio buttons to reflect current NC.hardcore state
    var hcOff = document.getElementById('hardcore-off-btn');
    var hcOn  = document.getElementById('hardcore-on-btn');
    if (hcOff) { hcOff.setAttribute('aria-checked', String(!NC.hardcore)); hcOff.style.borderColor = NC.hardcore ? '#333' : '#cc0000'; }
    if (hcOn)  { hcOn.setAttribute('aria-checked',  String(!!NC.hardcore)); hcOn.style.borderColor  = NC.hardcore ? '#cc0000' : '#333'; }
  }
  if (n === 10) {
    // Restore Hunter Mode radio buttons to reflect current NC.hunterMode state
    var hOff = document.getElementById('hunter-off-btn');
    var hOn  = document.getElementById('hunter-on-btn');
    var hunterOn = !!NC.hunterMode;
    if (hOff) { hOff.setAttribute('aria-checked', String(!hunterOn)); hOff.style.borderColor = hunterOn ? '#333' : '#444'; }
    if (hOn)  { hOn.setAttribute('aria-checked',  String(hunterOn));  hOn.style.borderColor  = hunterOn ? '#cc4400' : '#444'; }
  }
  if (n === 11) {
    // Restore companion name input
    var nameInput = document.getElementById('companion-name-input');
    if (nameInput && NC.companionName) nameInput.value = NC.companionName;
  }
}

function pickClass(el) {
  document.querySelectorAll('.class-card').forEach(function(c) { c.classList.remove('sel'); c.setAttribute('aria-checked','false'); });
  el.classList.add('sel'); el.setAttribute('aria-checked','true'); NC.cls = el.dataset.class;
  var sn = document.getElementById('cls-slider-name'); if(sn) sn.textContent = NC.cls;
  say(NC.cls + ' selected.');
}

var _CLASSES = ['Warrior','Monk','Assassin','Paladin','Naturalist','Sorcerer','Necromancer','Berserker','Bard','Alchemist','BloodKnight','Druid','Warlock','DeathKnight','Ranger','Sentinel','Cleric','Wizard','Elementalist','VoidWalker','ShadowMage','TimeMage','Shaman','Arcanist'];
var _clsDescs = {Warrior:'Frontline Fighter',Monk:'Spiritual Striker',Assassin:'Shadow Predator',Paladin:'Divine Guardian',Naturalist:'Wild Caller',Sorcerer:'Glass Cannon',Necromancer:'Death Wielder',Berserker:'Rage Engine',Bard:'Silver Tongue',Alchemist:'Master Brewer',BloodKnight:'Blood Harvester',Druid:"Nature's Bond",Warlock:'Soul Drainer',DeathKnight:'Undying Resolve',Ranger:'Swift Hunter',Sentinel:'Unbreakable Wall',Cleric:'Sacred Healer',Wizard:'Arcane Scholar'};
var _clsIdx = 0;
function stepCls(dir) {
  _clsIdx = (_clsIdx + dir + _CLASSES.length) % _CLASSES.length;
  var c = _CLASSES[_clsIdx];
  var card = document.querySelector('.class-card[data-class="' + c + '"]');
  if (card) pickClass(card);
  var sn = document.getElementById('cls-slider-name'); if(sn) sn.textContent = c;
  var sd = document.getElementById('cls-slider-desc'); if(sd) sd.textContent = _clsDescs[c]||'';
  var slider = document.getElementById('cls-slider'); if(slider){ slider.setAttribute('aria-valuenow',_clsIdx); slider.setAttribute('aria-valuetext', c + ' — ' + (_clsDescs[c]||'')); }
  say(c + '. ' + (_clsDescs[c]||'') + '.');
}

function pickRace(el) {
  document.querySelectorAll('.race-card').forEach(function(c) { c.classList.remove('sel'); c.setAttribute('aria-checked','false'); });
  el.classList.add('sel'); el.setAttribute('aria-checked','true'); NC.race = el.dataset.race;
  var sn = document.getElementById('race-slider-name'); if(sn) sn.textContent = NC.race;
  say(NC.race + ' selected.');
}

var _RACES = ['Human','Elf','Dwarf','Orc','Tiefling','Shade','Vampire','Goblin','Angel','Demon','Golem','Halfling','Dragonborn','Gnome','Merfolk'];
var _raceDescs = {Human:'Adaptable · +All Stats',Elf:'+AGI +INT',Dwarf:'+STR +DEF',Orc:'+STR+STR -DEF',Tiefling:'+LCK +INT',Shade:'+AGI +LCK',Vampire:'Drain 5 HP per kill',Goblin:'+25% gold',Angel:'+1 extra life',Demon:'+15% damage dealt and taken',Golem:'+5 defense · Immune to status',Halfling:'+LCK+LCK -STR',Dragonborn:'10% burn damage · Scales with floor',Gnome:'+INT +LCK · Skills cost less SP',Merfolk:'+AGI · Bonus in Sunken Archives · Potions +heal'};
var _raceIdx = 0;
function stepRace(dir) {
  _raceIdx = (_raceIdx + dir + _RACES.length) % _RACES.length;
  var r = _RACES[_raceIdx];
  var card = document.querySelector('.race-card[data-race="' + r + '"]');
  if (card) pickRace(card);
  var sn = document.getElementById('race-slider-name'); if(sn) sn.textContent = r;
  var sd = document.getElementById('race-slider-desc'); if(sd) sd.textContent = _raceDescs[r]||'';
  var slider = document.getElementById('race-slider'); if(slider){ slider.setAttribute('aria-valuenow',_raceIdx); slider.setAttribute('aria-valuetext', r + ' — ' + (_raceDescs[r]||'')); }
  say(r + '. ' + (_raceDescs[r]||'') + '.');
}

function pickProf(el) {
  document.querySelectorAll('.prof-card').forEach(function(c) { c.classList.remove('sel'); c.setAttribute('aria-checked','false'); });
  el.classList.add('sel'); el.setAttribute('aria-checked','true'); NC.prof = el.dataset.prof;
  var sn = document.getElementById('prof-slider-name'); if(sn) sn.textContent = NC.prof;
  say(NC.prof + ' selected.');
}

var _PROFS = ['Blacksmith','Herbalist','Scholar','Mercenary','Gravedigger','Thief','Pilgrim','Grave Robber'];
var _profDescs = {Blacksmith:'Armor and Weapon Durability',Herbalist:'Potions twice as effective',Scholar:'Trap and Curse Detection',Mercenary:'Starting Gold +1 Weapon',Gravedigger:'Undead Resistance',Thief:'Hidden Loot Discovery',Pilgrim:'Holy Relic · +15% XP','Grave Robber':'Start with 50g · Bonus loot','Street Rat':'Free Smoke Bomb · +20% Flee Chance',Warden:'+3 Defense · Debuff Immunity',Tinkerer:'2 Free Potions · Skills Cost 2 Less SP'};
var _profIdx = 0;
function stepProf(dir) {
  _profIdx = (_profIdx + dir + _PROFS.length) % _PROFS.length;
  var p = _PROFS[_profIdx];
  var card = document.querySelector('.prof-card[data-prof="' + p + '"]');
  if (card) pickProf(card);
  var sn = document.getElementById('prof-slider-name'); if(sn) sn.textContent = p;
  var sd = document.getElementById('prof-slider-desc'); if(sd) sd.textContent = _profDescs[p]||'';
  var slider = document.getElementById('prof-slider'); if(slider){ slider.setAttribute('aria-valuenow',_profIdx); slider.setAttribute('aria-valuetext', p + ' — ' + (_profDescs[p]||'')); }
  say(p + '. ' + (_profDescs[p]||'') + '.');
}

//═════════════════════════════
// FANTASY NAME GENERATOR
//═════════════════════════════
var _NAME_PREFIXES = [
  'Mal','Val','Ash','Vor','Thar','Zel','Kyr','Drav','Mor','Sel',
  'Ven','Bran','Cal','Dur','El','Fal','Gar','Hal','Ith','Jor',
  'Kael','Lyr','Nax','Obr','Phal','Quin','Rael','Siv','Tor','Ul',
  'Vyth','Wren','Xar','Yel','Zeph','Aer','Bel','Cor','Dex','Era',
  'Fin','Gal','Hav','Ix','Jin','Kos','Lev','Mav','Nev','Orv'
];
var _NAME_MIDS = [
  'ith','ael','orn','una','ara','enn','ash','eld','ion','ira',
  'oth','wen','ath','el','in','or','an','eth','ial','ynn',
  'ax','ek','id','im','us','ix','os','av','ev','ur',
  'ald','eld','old','ard','erd','ord','and','end','ond','und'
];
var _NAME_SUFFIXES = [
  'dor','wyn','ix','ath','ryn','on','iel','ius','ax','or',
  'en','in','an','us','is','ar','er','ir','ur','yn',
  'ith','eth','oth','ath','uth','aer','eer','oir','uur','yyr',
  'bane','fall','born','rise','dawn','dusk','shade','vale','moor','ford'
];

function generateCharName() {
  var prefix = _NAME_PREFIXES[Math.floor(Math.random() * _NAME_PREFIXES.length)];
  var mid = Math.random() > 0.4 ? _NAME_MIDS[Math.floor(Math.random() * _NAME_MIDS.length)] : '';
  var suffix = _NAME_SUFFIXES[Math.floor(Math.random() * _NAME_SUFFIXES.length)];
  var name = prefix + mid + suffix;
  // Capitalize properly
  name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
  // Make sure it's not too long
  if (name.length > 18) name = name.slice(0, 18);
  var input = document.getElementById('char-name-input');
  if (input) {
    input.value = name;
    onNameInput(input);
    say('Generated name: ' + name + '. Press Generate again for a different name.');
  }
}

function onNameInput(el) {
  var v = el.value.trim(); NC.name = v;
  var hint = document.getElementById('name-hint');
  var b = document.getElementById('cbtn-4');
  if (v.length < 2) {
    hint.textContent = v.length === 0 ? 'Name must be between 2 and 24 characters.' : 'Name is too short.';
    b.disabled = true; b.setAttribute('aria-disabled','true');
  } else {
    hint.textContent = v.length + ' characters.';
    b.disabled = false; b.removeAttribute('aria-disabled');
  }
}

// ── DUNGEON UNLOCK POPUP SYSTEM ────────────────────────────────────────────

var DUNGEON_UNLOCK_INFO = {
  'The Ashbound Wastes': {
    icon: '🔥',
    desc: 'A scorched wasteland of eternal flame. Fire creatures and ash storms await.',
    details: 'Floors 1-10 · New enemies · Unique boss · Ashbound weather system'
  },
  'Frosthold Abyss': {
    icon: '❄️',
    desc: 'A frozen abyss where the cold never ends. Ice beasts patrol the dark.',
    details: 'Floors 1-10 · New enemies · Unique boss · Frosthold weather system'
  },
  'The Sunken Archives': {
    icon: '📚',
    desc: 'A drowned library beneath the waves. Ancient knowledge — and ancient dangers.',
    details: 'Floors 1-10 · New enemies · Unique boss · Sunken weather system'
  },
  'The Hollow': {
    icon: '🕯️',
    desc: 'A haunted manor where grief has taken form. Something watches from inside the walls.',
    details: 'Floors 1-10 · Unique weather system · The Hollow Matron awaits'
  },
  'The Whispering Forest': {
    icon: '🌲',
    desc: 'An ancient forest that speaks. The trees remember everything — and they do not forgive.',
    details: 'Floors 1-10 · New enemies · The Chimera boss · Forest ambient'
  },
  'The Infernal Descent': {
    icon: '🔥',
    desc: 'The deepest fire. A dungeon of pure void and flame only the strongest reach.',
    details: 'Floors 1-10 · Unlocked with 100 trophies · Infernal enemies · Unique boss'
  },
  'The Abyssal Deep': {
    icon: '🌊',
    desc: 'The bottom of the ocean where no light reaches. Ancient creatures have waited for you.',
    details: 'Floors 1-10 · Unlocked after The Infernal · Ocean enemies · The Leviathan awaits'
  },
};

function checkDungeonUnlockPopups() {
  var unlocked = getUnlockedDungeons();
  var seen = _jsonParseSafe(DDStore.getItem('dd_dungeon_popup_seen'), '[]');
  // Also check infernal
  if (isInfernalUnlocked()) {
    if (unlocked.indexOf('The Infernal Descent') === -1) unlocked.push('The Infernal Descent');
  }
  var toShow = unlocked.filter(function(d) { return seen.indexOf(d) === -1 && DUNGEON_UNLOCK_INFO[d]; });
  if (toShow.length === 0) return;
  // Show one at a time
  var dungeon = toShow[0];
  seen.push(dungeon);
  DDStore.setItem('dd_dungeon_popup_seen', JSON.stringify(seen));
  setTimeout(function() { showDungeonUnlockedPopup(dungeon); }, 800);
}

function showDungeonUnlockedPopup(dungeonName) {
  var info = DUNGEON_UNLOCK_INFO[dungeonName];
  if (!info) return;
  var ov = document.getElementById('ov-dungeon-unlocked');
  if (!ov) return;
  document.getElementById('du-icon').textContent = info.icon;
  document.getElementById('du-title').textContent = dungeonName;
  document.getElementById('du-desc').textContent = info.desc;
  document.getElementById('du-details').textContent = info.details;
  ov.style.display = 'flex';
  sfx('sfx-unlock'); vibe(VIBE.bossKill);
  say('New dungeon unlocked! ' + dungeonName + '. ' + info.desc + ' ' + info.details);
  setTimeout(function(){ var btn = ov.querySelector('button'); if(btn) btn.focus(); }, 100);
}

function closeDungeonUnlockedPopup() {
  var ov = document.getElementById('ov-dungeon-unlocked');
  if (ov) ov.style.display = 'none';
}



// --════════════════════════

// --════════════════════════
// SECRET CONSOLE SYSTEM
// --════════════════════════

var _consoleOpen = false;
var _consoleHistory = [];
var _konamiSequence = [];
var _titleTapCount = 0;
var _titleTapTimer = null;
var KONAMI = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

document.addEventListener('keydown', function(e) {
  if (e.altKey && e.key === 'F5') { e.preventDefault(); toggleConsole(); return; }
  if (!_consoleOpen) {
    _konamiSequence.push(e.key);
    if (_konamiSequence.length > KONAMI.length) _konamiSequence.shift();
    if (JSON.stringify(_konamiSequence) === JSON.stringify(KONAMI)) {
      _konamiSequence = [];
      openConsole();
      setTimeout(function(){ consoleLog('> UUDDLRLRBA'); executeCode('UUDDLRLRBA'); }, 400);
    }
  }
});

function handleTitleTap() {
  _titleTapCount++;
  if (_titleTapTimer) clearTimeout(_titleTapTimer);
  _titleTapTimer = setTimeout(function(){ _titleTapCount = 0; }, 1500);
  if (_titleTapCount >= 7) { _titleTapCount = 0; clearTimeout(_titleTapTimer); openConsole(); }
}

var _consolePrevScreen = 'menu';

function openConsole() {
  // Remember current screen - console overlays it, never replaces it
  var active = document.querySelector('.screen.active');
  _consolePrevScreen = active ? active.id.replace('screen-', '') : 'menu';
  _consoleOpen = true;
  // Stop all music
  try {
    if (window.AUD && AUD.tracks) {
      Object.keys(AUD.tracks).forEach(function(k){ var t = AUD.tracks[k]; if(t){t.pause();t.currentTime=0;} });
    }
    AUD.current = null;
  } catch(e2) {}
  try { stopAmbient(); } catch(e2) {}
  // Show console as overlay - does not affect other screens
  var cs = document.getElementById('screen-console');
  if (cs) cs.style.display = 'flex';
  clearConsoleOutput();
  consoleLog('DUNGEON DESCENT // CLASSIFIED ACCESS');
  consoleLog('You found something you were not supposed to find.');
  consoleLog('');
  setTimeout(function(){
    var inp = document.getElementById('console-input');
    if (inp) { inp.value = ''; inp.focus(); }
  }, 150);
  say('Secret console opened. Type a code and press Enter. Type HELP for hints. Type EXIT to close.');
}

function closeConsole() {
  _consoleOpen = false;
  var cs = document.getElementById('screen-console');
  if (cs) cs.style.display = 'none';
  var inp = document.getElementById('console-input');
  if (inp) inp.value = '';
  // Return to previous screen without re-navigating (we never left)
  say('Console closed. Returning to ' + (_consolePrevScreen || 'menu') + '.');
}

function toggleConsole() { if (_consoleOpen) closeConsole(); else openConsole(); }

function clearConsoleOutput() {
  var el = document.getElementById('console-output');
  if (el) el.textContent = '';
  _consoleHistory = [];
}

function consoleLog(text, color) {
  var el = document.getElementById('console-output');
  if (!el) return;
  var line = document.createElement('div');
  line.style.color = color || '#00ff00';
  line.textContent = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function handleConsoleKey(e) {
  if (e.key === 'Enter') {
    var inp = document.getElementById('console-input');
    if (!inp) return;
    var code = inp.value.trim().toUpperCase();
    inp.value = '';
    if (!code) return;
    consoleLog('> ' + code);
    executeCode(code);
  }
  if (e.key === 'Escape') closeConsole();
}

var _chaosMode = false; // real value hydrated in the DDStore.whenReady() callback

var _SECRET_CODES = { 'UUDDLRLRBA':1,'IAMLEO':1,'GIVEGOLD':1,'ABYSSAL':1,'INFERNAL':1,'WITNESS':1,'TROPHIES':1,'CHAOS':1,'JULIO':1,'4':1,'BRAZIL':1 };

function executeCode(code) {
  switch(code) {
    case 'EXIT': case 'CLOSE':
      consoleLog('Closing...', '#888'); setTimeout(closeConsole, 600); break;

    case 'HELP':
      consoleLog(''); consoleLog('HINT: Some codes are famous.','#888'); consoleLog('HINT: Some codes are personal.','#888');
      consoleLog('HINT: Some codes are obvious.','#888'); consoleLog('HINT: There are ' + Object.keys(_SECRET_CODES).length + ' codes total.','#888'); consoleLog('');
      say('Hints displayed. ' + Object.keys(_SECRET_CODES).length + ' codes total.'); break;

    case 'UUDDLRLRBA':
      consoleLog(''); consoleLog('THE KONAMI CODE.','#ffff00'); consoleLog('You know the old ways.','#ffff00'); consoleLog('');
      consoleLog('CHAOS MODE ACTIVATED.','#ff4444'); consoleLog('Nothing is safe. Everything is possible.','#ff4444'); consoleLog('');
      _chaosMode = true; DDStore.setItem('dd_chaos_mode','1');
      try { awardAchievement('ach-chaos'); } catch(e2) {}
      showToast('CHAOS MODE ACTIVATED','red');
      say('Konami code. Chaos mode activated. Enemies and rewards are unpredictable.');
      setTimeout(closeConsole, 3000); break;

    case 'IAMLEO':
      consoleLog(''); consoleLog('Hello, Leo.','#44ff88'); consoleLog('Developer access granted.','#44ff88'); consoleLog('');
      DDStore.setItem('dd_dev_mode','1');
      try { devUnlockAll(); } catch(e2) {}
      addGlobalGold(9999); addTrophies(50); updateTrophyDisplay();
      consoleLog('All dungeons unlocked.','#44ff88'); consoleLog('+9999 gold.','#44ff88'); consoleLog('+50 trophies.','#44ff88');
      say('Developer access. All dungeons unlocked. Gold and trophies added.');
      setTimeout(closeConsole, 2500); break;

    case 'GIVEGOLD':
      consoleLog(''); consoleLog('+500 gold deposited.','#ffdd44');
      addGlobalGold(500); updateTrophyDisplay();
      say('500 gold added.'); break;

    case 'BRAZIL':
      var now = new Date();
      if (now.getMonth() + 1 === 9 && now.getDate() === 7) {
        consoleLog(''); 
        consoleLog('🇧🇷 INDEPENDÊNCIA DO BRASIL!','#00aa44');
        consoleLog('7 de Setembro de 1822.','#ffdd44');
        consoleLog('+1,559,000 gold.','#ffdd44');
        consoleLog('Ordem e Progresso.','#00aa44');
        addGlobalGold(1559000); updateTrophyDisplay();
        say('Brasil! 1 million 559 thousand gold added. Ordem e Progresso.');
      } else {
        consoleLog(''); 
        consoleLog('This code only works on September 7th.','#888');
        consoleLog('Come back on Brazil Independence Day.','#888');
        say('This code only works on September 7th. Brazil Independence Day.');
      }
      break;

    case 'ABYSSAL':
      consoleLog(''); consoleLog('The deep answers.','#4488ff'); consoleLog('The Abyssal Deep unlocked.','#4488ff');
      DDStore.setItem('dd_abyssal_unlocked','1');
      try { refreshAbyssalCard(); } catch(e2) {}
      say('The Abyssal Deep unlocked.'); break;

    case 'INFERNAL':
      consoleLog(''); consoleLog('The gates open.','#ff4400'); consoleLog('The Infernal Descent unlocked.','#ff4400');
      DDStore.setItem('dd_infernal_unlocked','1');
      say('The Infernal Descent unlocked.'); break;

    case 'WITNESS':
      consoleLog(''); consoleLog('It was always watching.','#4488ff'); consoleLog('The Witness joins your minions.','#4488ff');
      try { captureMinion({id:'the-witness',name:'The Witness',icon:'🦈',atk:12,desc:'It watched everything.'}); } catch(e2) {}
      say('The Witness added to your minions.'); break;

    case 'TROPHIES':
      consoleLog(''); consoleLog('+100 trophies awarded.','#cc9944');
      addTrophies(100); updateTrophyDisplay(); checkAchievements();
      say('100 trophies added.'); break;

    case 'CHAOS':
      consoleLog('');
      if (_chaosMode) { _chaosMode = false; DDStore.removeItem('dd_chaos_mode'); consoleLog('Chaos mode disabled.','#888'); say('Chaos mode disabled.'); }
      else { _chaosMode = true; DDStore.setItem('dd_chaos_mode','1'); consoleLog('CHAOS MODE ACTIVATED.','#ff4444'); say('Chaos mode activated.'); }
      break;

    case '4':
      consoleLog(''); consoleLog('Happy Fourth of July.','#cc4444'); consoleLog('A patriot answers your call.','#4488ff');
      try { captureMinion({id:'liberty-eagle',name:'Liberty Eagle',icon:'🦅',atk:18,desc:'A patriot of the eternal struggle. Obtained on July 4th.'}); } catch(e2) {}
      showToast('🦅 Liberty Eagle joins your cause!','gold');
      say('Liberty Eagle captured. A patriot minion exclusive to the Fourth of July.');
      break;

    case 'JULIO':
      consoleLog(''); consoleLog('...','#888'); consoleLog('He was never really gone.','#888'); consoleLog('JULIO has been spotted.','#ffff00');
      try { updateAchievementStat('foundJulio',1); awardAchievement('ach-found-julio'); } catch(e2) {}
      say('Julio. He was never really gone.'); break;

    default:
      consoleLog('Unknown code: ' + code,'#ff4444'); consoleLog('Type HELP for hints.','#888');
      say('Unknown code. Type HELP for hints.'); break;
  }
}

function getChaosGoldMult() { return DDStore.getItem('dd_chaos_mode') ? (Math.random() < 0.5 ? 0.01 : 20) : 1; }
function getChaosEnemyMult() {
  if (!DDStore.getItem('dd_chaos_mode')) return 1;
  var r = Math.random(); return r < 0.33 ? 0.3 : r < 0.66 ? 1.0 : 3.0;
}

// BETA FEATURES SYSTEM
// --════════════════════════

function getBetaFeatures() {
  return _jsonParseSafe(DDStore.getItem('dd_beta_features'), '{"3dmode":false}');
}

function saveBetaFeatures(f) {
  DDStore.setItem('dd_beta_features', JSON.stringify(f));
}

function isBetaOn(id) {
  return getBetaFeatures()[id] === true;
}

function toggleBetaFeature(id) {
  var f = getBetaFeatures();
  f[id] = !f[id];
  saveBetaFeatures(f);
  updateBetaPanel();
  if (id === '3dmode') {
    var td3Btn = document.getElementById('btn-settings-3dmode');
    if (td3Btn) td3Btn.style.display = f[id] ? '' : 'none';
  }
  sfx('sfx-confirm');
  say(id + ' beta feature ' + (f[id] ? 'enabled' : 'disabled') + '.');
}

function updateBetaPanel() {
  var on = isBetaOn('3dmode');
  var btn = document.getElementById('beta-3dmode-toggle');
  var status = document.getElementById('beta-3dmode-status');
  var srNote = document.getElementById('beta-3dmode-srnote');
  if (btn) {
    btn.textContent = on ? 'ON' : 'OFF';
    btn.style.borderColor = on ? '#44aa44' : '#444';
    btn.style.color = on ? '#44ff88' : '#666';
    btn.style.background = on ? '#0a1a0a' : '#080808';
  }
  if (status) {
    status.textContent = on
      ? '3D Mode active — every dungeon will load in 3D next time you enter it.'
      : 'Disabled — normal dungeon navigation.';
    status.style.color = on ? '#44aa44' : '#555';
  }
  if (srNote) {
    srNote.style.display = (ACCESS && ACCESS.srmode) ? 'block' : 'none';
  }
}

// ── 3D SETTINGS (graphics/performance options for 3D Mode) ──
function get3DSettings() {
  // Merge onto the defaults rather than parsing the stored JSON directly —
  // a settings object saved before the Minimap toggle existed has no
  // "minimap" key at all, which would otherwise read as undefined (falsy)
  // instead of defaulting on for those existing players.
  var defaults = { shadows:false, torchFlicker:true, fpsCounter:false, minimap:true };
  var saved = _jsonParseSafe(DDStore.getItem('dd_3d_settings'), '{}');
  for (var k in saved) defaults[k] = saved[k];
  return defaults;
}

function save3DSettings(s) {
  DDStore.setItem('dd_3d_settings', JSON.stringify(s));
}

function toggle3DSetting(key) {
  var s = get3DSettings();
  s[key] = !s[key];
  save3DSettings(s);
  update3DSettingsPanel();
  sfx('sfx-confirm');
  say(key + ' ' + (s[key] ? 'enabled' : 'disabled') + '.');
  // Torch flicker and the FPS counter are re-read every animation frame, so
  // those two already take effect immediately. The renderer's shadow map is
  // only set up once when the 3D scene is first created — flipping the
  // setting on the WebGLRenderer itself here (and rebuilding the current
  // room so per-object castShadow/receiveShadow flags match) is what makes
  // the Shadows toggle actually apply without needing to leave and re-enter
  // the dungeon.
  if (key === 'shadows' && _room3D.renderer) {
    _room3D.renderer.shadowMap.enabled = !!s.shadows;
    _rebuildAllVisibleRooms();
  }
  if (key === 'minimap' && typeof _renderMinimap === 'function') _renderMinimap();
  if (key === 'minimap' && typeof _renderHS3DMinimap === 'function') _renderHS3DMinimap();
}

function update3DSettingsPanel() {
  var s = get3DSettings();
  var map = { shadows: 'td-shadows-toggle', torchFlicker: 'td-flicker-toggle', fpsCounter: 'td-fps-toggle', minimap: 'td-minimap-toggle' };
  Object.keys(map).forEach(function(key) {
    var btn = document.getElementById(map[key]);
    if (!btn) return;
    var on = s[key];
    btn.textContent = on ? 'On' : 'Off';
    btn.classList.toggle('on', on);
    btn.setAttribute('aria-pressed', String(on));
  });
}

// --════════════════════════
// SUBCLASS SYSTEM — 36 SUBCLASSES ACROSS 18 CLASSES
// --════════════════════════

var SUBCLASSES = {
  'Warrior': [
    { id:'warlord',    name:'Warlord',          icon:'👑',
      desc:'Every kill gives +2 ATK for the rest of the floor. Commander energy. Built for momentum.',
      passive:'Kill Streak — +2 ATK per kill, resets each floor.',
      statBonus:{ strength:2, stamina:1 },
      apply: function(){ DS._subclassPassive = 'warlord'; addLog('👑 Warlord path chosen. Every kill fuels your strength.'); } },
    { id:'gladiator',  name:'Gladiator',         icon:'⚔️',
      desc:'+20% crit chance. Critical hits deal 2.5x damage instead of 1.8x. Built for the arena.',
      passive:'Arena Fighter — crits hit harder.',
      statBonus:{ strength:2, agility:1 },
      apply: function(){ DS.critBonus = (DS.critBonus||0) + 0.20; DS._gladiatorCrit = true; addLog('⚔️ Gladiator path chosen. Your crits are devastating.'); } },
  ],
  'Monk': [
    { id:'iron-fist',  name:'Iron Fist',         icon:'👊',
      desc:'+20% damage when no weapon equipped. Pure discipline and bare knuckle mastery.',
      passive:'Unarmed Mastery — hits harder without weapons.',
      statBonus:{ strength:2, agility:1 },
      apply: function(){ DS._ironFist = true; addLog('👊 Iron Fist path chosen. Your fists are your weapons.'); } },
    { id:'wind-walker',name:'Wind Walker',        icon:'💨',
      desc:'Dodge chance +15%. First attack every combat always crits. Speed is your armor.',
      passive:'Swift Step — dodge hits, strike first.',
      statBonus:{ agility:3 },
      apply: function(){ DS._windWalker = true; DS.critBonus = (DS.critBonus||0) + 0.10; addLog('💨 Wind Walker path chosen. You move before they see you.'); } },
  ],
  'Assassin': [
    { id:'shadow',     name:'Shadow',            icon:'🌑',
      desc:'Guaranteed first strike every combat. First hit always crits. Strike before they know you are there.',
      passive:'Ambush — always strike first for a guaranteed crit.',
      statBonus:{ agility:2, strength:1 },
      apply: function(){ DS._shadowAssassin = true; addLog('🌑 Shadow path chosen. They will never see you coming.'); } },
    { id:'poisoner',   name:'Poisoner',          icon:'🐍',
      desc:'Every attack applies poison for 4 damage per turn for 3 turns. Stacks with each hit.',
      passive:'Venom — every strike poisons.',
      statBonus:{ agility:1, luck:2 },
      apply: function(){ DS._poisoner = true; addLog('🐍 Poisoner path chosen. Your blade carries death.'); } },
  ],
  'Paladin': [
    { id:'crusader',   name:'Crusader',          icon:'✝️',
      desc:'+4 DEF permanently. Undead enemies take 50% more damage from all your attacks.',
      passive:'Holy Armor — divine protection against undead.',
      statBonus:{ defense:2, stamina:1 },
      apply: function(){ DS.defBonus = (DS.defBonus||0) + 4; DS._crusader = true; addLog('✝️ Crusader path chosen. Your faith is your shield.'); } },
    { id:'avenger',    name:'Avenger',           icon:'🔥',
      desc:'The lower your HP the harder you hit. At 25% HP you deal double damage.',
      passive:'Last Stand — desperation fuels fury.',
      statBonus:{ strength:2, stamina:1 },
      apply: function(){ DS._avenger = true; addLog('🔥 Avenger path chosen. Pain makes you stronger.'); } },
  ],
  'Naturalist': [
    { id:'druid',      name:'Druid',             icon:'🌿',
      desc:'Heal 6 HP every room entered. Nature sustains and restores you constantly.',
      passive:'Natural Healing — the dungeon heals you.',
      statBonus:{ stamina:2, defense:1 },
      apply: function(){ DS._druid = true; addLog('🌿 Druid path chosen. Nature heals as you walk.'); } },
    { id:'beast-caller',name:'Beast Caller',     icon:'🐺',
      desc:'A random beast companion fights with you every floor. Attacks for 8-14 damage per round.',
      passive:'Beast Bond — an ally joins your fight.',
      statBonus:{ strength:1, stamina:2 },
      apply: function(){ DS._beastCaller = true; addLog('🐺 Beast Caller path chosen. The wild answers your call.'); } },
  ],
  'Wizard': [
    { id:'archmage',   name:'Archmage',          icon:'🔮',
      desc:'+15 max SP. All skills cost 2 less SP. Spell damage +20%. Pure arcane mastery.',
      passive:'Arcane Focus — more SP, cheaper skills, stronger magic.',
      statBonus:{ intelligence:3 },
      apply: function(){ DS.maxSp = (DS.maxSp||20) + 15; DS.sp = Math.min(DS.maxSp, (DS.sp||0) + 15); DS._archmage = true; updateXPBar(); addLog('🔮 Archmage path chosen. Your arcane power is immense.'); } },
    { id:'spellblade', name:'Spellblade',        icon:'⚡',
      desc:'Melee attacks deal bonus arcane damage equal to your current SP divided by 10.',
      passive:'Arcane Strike — your weapon channels magic.',
      statBonus:{ strength:1, intelligence:2 },
      apply: function(){ DS._spellblade = true; addLog('⚡ Spellblade path chosen. Steel and sorcery combined.'); } },
  ],
  'Ranger': [
    { id:'hawkeye',    name:'Hawkeye',           icon:'🎯',
      desc:'Heavy Strike never misses. Precision training eliminates the miss chance entirely.',
      passive:'Perfect Aim — Heavy Strike is now reliable.',
      statBonus:{ agility:2, strength:1 },
      apply: function(){ DS._hawkeye = true; addLog('🎯 Hawkeye path chosen. Every shot finds its mark.'); } },
    { id:'trapper',    name:'Trapper',           icon:'🪤',
      desc:'30% chance to stun any enemy on the first hit every combat for 1 turn.',
      passive:'Set the Trap — first hit may stun.',
      statBonus:{ agility:2, luck:1 },
      apply: function(){ DS._trapper = true; addLog('🪤 Trapper path chosen. Control the fight from the start.'); } },
  ],
  'Necromancer': [
    { id:'death-knight-sub',name:'Death Knight', icon:'💀',
      desc:'Become undead. Immune to poison. Heal 10 HP per kill. Death feeds your power.',
      passive:'Undead Form — heal from death.',
      statBonus:{ stamina:2, defense:1 },
      apply: function(){ DS._deathKnightSub = true; DS.poisonImmune = true; addLog('💀 Death Knight path chosen. You have become death.'); } },
    { id:'soul-reaper', name:'Soul Reaper',      icon:'🌀',
      desc:'Steal 1 random skill from every elite or boss you defeat. Collect their power.',
      passive:'Soul Harvest — take what they have.',
      statBonus:{ intelligence:2, luck:1 },
      apply: function(){ DS._soulReaper = true; addLog('🌀 Soul Reaper path chosen. Their power becomes yours.'); } },
  ],
  'Sorcerer': [
    { id:'wildfire',   name:'Wildfire',          icon:'🔥',
      desc:'Every attack has 25% chance to explode for double damage. Chaos fuels your magic.',
      passive:'Wild Surge — magic has a mind of its own.',
      statBonus:{ strength:1, intelligence:2 },
      apply: function(){ DS._wildfire = true; addLog('🔥 Wildfire path chosen. Your magic is gloriously unpredictable.'); } },
    { id:'elementalist', enemyType:'elemental',name:'Elementalist',    icon:'🌊',
      desc:'+15% damage to all skills. Enemies weak to your element take an extra 25% damage.',
      passive:'Elemental Mastery — elements obey you.',
      statBonus:{ intelligence:3 },
      apply: function(){ DS._elementalist = true; addLog('🌊 Elementalist path chosen. The elements are yours to command.'); } },
  ],
  'Warlock': [
    { id:'pact-keeper',name:'Pact Keeper',       icon:'📜',
      desc:'Your patron strengthens you. +5 ATK and +5 DEF as flat permanent bonuses.',
      passive:'Dark Pact — power at a price already paid.',
      statBonus:{ strength:2, defense:1 },
      apply: function(){ DS.atkBonus = (DS.atkBonus||0) + 5; DS.defBonus = (DS.defBonus||0) + 5; addLog('📜 Pact Keeper path chosen. Your patron is pleased.'); } },
    { id:'hex-blade',  name:'Hex Blade',         icon:'🖤',
      desc:'Curse enemies on hit. Cursed enemies take +35% damage from all sources for 3 turns.',
      passive:'Hex — every hit curses.',
      statBonus:{ agility:1, intelligence:2 },
      apply: function(){ DS._hexBlade = true; addLog('🖤 Hex Blade path chosen. Your strikes carry a curse.'); } },
  ],
  'Sentinel': [
    { id:'ironclad',   name:'Ironclad',          icon:'🛡️',
      desc:'Maximum 12 damage per hit no matter what. Nothing breaks through your armor.',
      passive:'Iron Defense — damage is capped.',
      statBonus:{ defense:3 },
      apply: function(){ DS._ironclad = true; addLog('🛡️ Ironclad path chosen. Nothing can break you.'); } },
    { id:'bulwark',    name:'Bulwark',           icon:'⚔️',
      desc:'Defending reflects 30% of damage back to the attacker. Your shield is a weapon.',
      passive:'Shield Bash — defense is offense.',
      statBonus:{ defense:2, strength:1 },
      apply: function(){ DS._bulwark = true; addLog('⚔️ Bulwark path chosen. Your shield strikes back.'); } },
  ],
  'Dragonborn': [
    { id:'dragon-ascendant',name:'Dragon Ascendant',icon:'🐉',
      desc:'Flame breath triggers on every attack. 20% chance to burn for 8 damage per turn.',
      passive:'Ancient Fire — flames follow every strike.',
      statBonus:{ strength:2, stamina:1 },
      apply: function(){ DS._dragonAscendant = true; addLog('🐉 Dragon Ascendant path chosen. Your blood burns.'); } },
    { id:'ancient-blood',name:'Ancient Blood',   icon:'🌟',
      desc:'+25 max HP. Completely immune to fire damage. Your heritage protects you.',
      passive:'Dragon Blood — fire cannot touch you.',
      statBonus:{ stamina:3 },
      apply: function(){ DS.maxHp += 25; DS.hp = Math.min(DS.maxHp, DS.hp + 25); DS._ancientBlood = true; updatePlayerBar(); addLog('🌟 Ancient Blood path chosen. Your heritage awakens.'); } },
  ],
  'Alchemist': [
    { id:'brewmaster', name:'Brewmaster',        icon:'⚗️',
      desc:'Potions heal double. You start every dungeon with 2 extra potions. Never run dry.',
      passive:'Master Brewer — potions are your specialty.',
      statBonus:{ stamina:2, luck:1 },
      apply: function(){ DS._brewmaster = true; DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'}); DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'}); renderInv(); addLog('⚗️ Brewmaster path chosen. Your potions are twice as potent.'); } },
    { id:'bomb-thrower',name:'Bomb Thrower',     icon:'💣',
      desc:'Once per floor throw a bomb dealing 60 unblockable damage. Recharges each floor.',
      passive:'Explosive Expert — one bomb per floor.',
      statBonus:{ strength:1, intelligence:2 },
      apply: function(){ DS._bombThrower = true; DS._bombReady = true; addLog('💣 Bomb Thrower path chosen. Handle with care.'); } },
  ],
  'DeathKnight': [
    { id:'plague-bearer',name:'Plague Bearer',   icon:'☠️',
      desc:'Your attacks have 25% chance to spread disease. Diseased enemies take 5 damage per turn.',
      passive:'Pestilence — disease spreads from your touch.',
      statBonus:{ intelligence:1, luck:2 },
      apply: function(){ DS._plagueBearerSub = true; addLog('☠️ Plague Bearer path chosen. Disease is your weapon.'); } },
    { id:'undying',    name:'Undying',           icon:'💜',
      desc:'When you would die, survive at 1 HP once per dungeon. Death refuses you.',
      passive:'Deathless — one free revival per run.',
      statBonus:{ stamina:2, defense:1 },
      apply: function(){ DS._undyingUsed = false; DS._undying = true; addLog('💜 Undying path chosen. You cannot be killed easily.'); } },
  ],
  'Bard': [
    { id:'battle-hymn',name:'Battle Hymn',       icon:'🎵',
      desc:'Your songs empower your attacks. +5 ATK for 3 turns after every skill use.',
      passive:'War Song — skills fuel combat power.',
      statBonus:{ strength:2, intelligence:1 },
      apply: function(){ DS._battleHymn = true; addLog('🎵 Battle Hymn path chosen. Your song is a weapon.'); } },
    { id:'trickster-bard',name:'Trickster',      icon:'🎭',
      desc:'25% chance any enemy attack misses due to distraction. You are impossible to pin down.',
      passive:'Distraction — they cannot focus on you.',
      statBonus:{ agility:2, luck:1 },
      apply: function(){ DS._tricksterBard = true; addLog('🎭 Trickster path chosen. Confusion is your armor.'); } },
  ],
  'Cleric': [
    { id:'high-priest', name:'High Priest',      icon:'✨',
      desc:'Divine protection. Take 20% less damage from all sources. Faith shields you.',
      passive:'Divine Shield — faith reduces all damage.',
      statBonus:{ defense:2, stamina:1 },
      apply: function(){ DS._highPriest = true; addLog('✨ High Priest path chosen. Your faith is your armor.'); } },
    { id:'smiter',     name:'Smiter',            icon:'⚡',
      desc:'Every 3rd attack deals bonus holy damage equal to your level times 3.',
      passive:'Holy Smite — divine power surges every third strike.',
      statBonus:{ strength:2, intelligence:1 },
      apply: function(){ DS._smiter = true; DS._smiterCount = 0; addLog('⚡ Smiter path chosen. Holy power flows through your strikes.'); } },
  ],
  'BloodKnight': [
    { id:'vampire-lord',name:'Vampire Lord',     icon:'🩸',
      desc:'Heal 20% of all damage dealt. The more you hit the more you heal.',
      passive:'Life Drain — combat heals you.',
      statBonus:{ stamina:2, strength:1 },
      apply: function(){ DS._vampireLord = true; addLog('🩸 Vampire Lord path chosen. Every strike heals you.'); } },
    { id:'berserker-sub',name:'Berserker',       icon:'💢',
      desc:'The more HP you lose the more damage you deal. No cap. Pure rage.',
      passive:'Berserk Rage — pain is power.',
      statBonus:{ strength:3 },
      apply: function(){ DS._berserkerSub = true; addLog('💢 Berserker path chosen. Pain makes you stronger.'); } },
  ],
  'Elementalist': [
    { id:'firelord',    name:'Firelord',           icon:'🔥',
      desc:'Fire spells deal +60% damage. Enemies you kill with fire leave burning ground that damages the next enemy.',
      passive:'Flame Mastery — fire spells devastate.',
      statBonus:{ spirit:3, strength:1 },
      apply: function(){ DS._firelord = true; addLog('🔥 Firelord path chosen. Everything burns.'); } },
    { id:'stormcaller', name:'Stormcaller',         icon:'⚡',
      desc:'Lightning spells chain to nearby enemies for 40% damage. Ice spells freeze enemies for 1 extra turn.',
      passive:'Storm Command — spells chain and freeze.',
      statBonus:{ spirit:2, agility:2 },
      apply: function(){ DS._stormcaller = true; addLog('⚡ Stormcaller path chosen. You command the storm.'); } },
  ],
  'VoidWalker': [
    { id:'void-born',   name:'Void Born',           icon:'🌑',
      desc:'Start each run with 3 Void spell scrolls. Void spells deal +50% damage to spirit enemies.',
      passive:'Born of Nothing — void is your home.',
      statBonus:{ spirit:3, agility:1 },
      apply: function(){ DS._voidBorn = true; addLog('🌑 Void Born path chosen. You came from nothing.'); } },
    { id:'shadow-step', name:'Phase Walker',         icon:'👁️',
      desc:'20% chance to phase through any attack completely. Void spells have no cooldown on floors 8-10.',
      passive:'Phase Step — reality bends for you.',
      statBonus:{ agility:2, spirit:2 },
      apply: function(){ DS._phaseWalker = true; addLog('👁️ Phase Walker path chosen. You exist between moments.'); } },
  ],
  'ShadowMage': [
    { id:'dark-arts',   name:'Dark Arts',            icon:'🖤',
      desc:'Shadow spells apply a stacking curse. Each curse reduces enemy ATK by 5. Max 5 stacks.',
      passive:'Cursed Touch — shadows weaken all they touch.',
      statBonus:{ spirit:2, agility:2 },
      apply: function(){ DS._darkArts = true; addLog('🖤 Dark Arts path chosen. Shadows obey you.'); } },
    { id:'night-shroud', name:'Night Shroud',         icon:'🌒',
      desc:'During Night Mode all your attacks deal +35% damage. Shadow spells cost 0 turns to cooldown at night.',
      passive:'Child of Night — darkness is your power.',
      statBonus:{ agility:3, spirit:1 },
      apply: function(){ DS._nightShroud = true; addLog('🌒 Night Shroud path chosen. You thrive in darkness.'); } },
  ],
  'TimeMage': [
    { id:'time-lord',   name:'Time Lord',            icon:'⏰',
      desc:'Time Stop and Time Fracture always succeed — no percentage roll. You have mastered time completely.',
      passive:'Temporal Mastery — time obeys you.',
      statBonus:{ spirit:3, vitality:1 },
      apply: function(){ DS._timeLord = true; addLog('⏰ Time Lord path chosen. Time bends to your will.'); } },
    { id:'paradox',     name:'Paradox',              icon:'🔄',
      desc:'When you die you rewind 1 turn. Once per combat. The paradox saves you from death itself.',
      passive:'Temporal Paradox — death is not the end.',
      statBonus:{ spirit:2, vitality:2 },
      apply: function(){ DS._paradox = true; addLog('🔄 Paradox path chosen. Death is merely a suggestion.'); } },
  ],
  'Shaman': [
    { id:'earthbound',  name:'Earthbound',           icon:'🌍',
      desc:'Earthshake deals +80% damage and always buffs you. Stone enemies take double damage from all your attacks.',
      passive:'Earth Mastery — the ground answers your call.',
      statBonus:{ strength:2, defense:2 },
      apply: function(){ DS._earthbound = true; addLog('🌍 Earthbound path chosen. The earth is your weapon.'); } },
    { id:'spirit-caller', name:'Spirit Caller',       icon:'🌀',
      desc:'Summon a spirit companion at the start of each dungeon. It heals you for 8 HP per turn passively.',
      passive:'Spirit Bond — a healer walks beside you.',
      statBonus:{ spirit:2, vitality:2 },
      apply: function(){ DS._spiritCaller = true; addLog('🌀 Spirit Caller path chosen. Spirits answer your call.'); } },
  ],
  'Arcanist': [
    { id:'pure-magic',  name:'Pure Magic',           icon:'✨',
      desc:'All spells cast at 150% effectiveness. No class penalty ever. The purest magic user alive.',
      passive:'Arcane Perfection — magic flows through you perfectly.',
      statBonus:{ spirit:4 },
      apply: function(){ DS._pureMagic = true; addLog('✨ Pure Magic path chosen. You are magic incarnate.'); } },
    { id:'spell-weaver', name:'Spell Weaver',         icon:'🔮',
      desc:'Can cast 2 spells before cooldown triggers instead of 1. Spell scrolls never fail to learn.',
      passive:'Weave the Arcane — two spells, one breath.',
      statBonus:{ spirit:3, agility:1 },
      apply: function(){ DS._spellWeaver = true; addLog('🔮 Spell Weaver path chosen. Two spells flow as one.'); } },
  ],
};

// ── SUBCLASS FUNCTIONS ────────────────────────────────────────────────────────


function showSubclassChoice() {
  if (DS._subclass) return; // already chosen
  var options = SUBCLASSES[DS.cls];
  if (!options || options.length === 0) return;

  var ov = document.getElementById('ov-subclass');
  var optEl = document.getElementById('subclass-options');
  var subtitle = document.getElementById('subclass-subtitle');
  if (!ov || !optEl) return;

  if (subtitle) subtitle.textContent = 'You are a ' + DS.cls + '. Your training diverges at level 5. This choice is permanent for this run.';

  optEl.innerHTML = '';
  options.forEach(function(sub) {
    var card = document.createElement('button');
    card.style.cssText = 'width:100%;padding:16px;background:#080808;border:1px solid #333;text-align:left;cursor:pointer;font-family:Cinzel,serif;border-radius:2px;transition:border-color 0.2s,background 0.2s;';
    card.setAttribute('aria-label', sub.name + '. ' + sub.desc + '. Passive: ' + sub.passive + '. Press to choose this subclass.');
    card.innerHTML =
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">' +
        '<span style="font-size:1.5rem;" aria-hidden="true">' + sub.icon + '</span>' +
        '<div>' +
          '<div style="font-family:Cinzel,serif;font-size:0.8rem;color:var(--gold);">' + sub.name + '</div>' +
          '<div style="font-size:0.6rem;color:#44aa44;margin-top:2px;">' + sub.passive + '</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:0.65rem;color:#888;line-height:1.7;">' + sub.desc + '</div>';

    card.onmouseover = card.onfocus = function() {
      card.style.borderColor = '#cc9944';
      card.style.background = '#0f0c00';
    };
    card.onmouseout = card.onblur = function() {
      card.style.borderColor = '#333';
      card.style.background = '#080808';
    };
    card.onclick = function() { chooseSubclass(sub); };
    optEl.appendChild(card);
  });

  ov.style.display = 'flex';
  speakCritical('Level 5 reached. Choose your subclass as a ' + DS.cls + '. Option 1: ' + options[0].name + '. ' + options[0].desc + '. Option 2: ' + options[1].name + '. ' + options[1].desc);
  setTimeout(function(){ var btn = optEl.querySelector('button'); if(btn) btn.focus(); }, 100);
}

// A resumed run only kept the subclass id, so every passive flag but the
// Vampire Lord's was lost. Set them again from the subclass's own apply().
function restoreSubclassFlags() {
  if (!DS._subclass || typeof SUBCLASSES === 'undefined') return;
  Object.keys(SUBCLASSES).forEach(function(cls) {
    (SUBCLASSES[cls] || []).forEach(function(sub) {
      if (sub.id !== DS._subclass || !sub.apply) return;
      var src = sub.apply.toString();
      var re = /DS\.(_[A-Za-z]+)\s*=\s*true/g, m;
      while ((m = re.exec(src))) DS[m[1]] = true;
    });
  });
}

function chooseSubclass(sub) {
  DS._subclass = sub.id;
  DS._subclassName = sub.name;
  DS._subclassIcon = sub.icon;

  // Apply stat bonuses
  if (sub.statBonus) {
    Object.keys(sub.statBonus).forEach(function(stat) {
      var pts = sub.statBonus[stat];
      // "spirit" and "vitality" aren't level-point stats, so they gave nothing.
      var statId = stat === 'spirit' ? 'intelligence' : stat === 'vitality' ? 'stamina' : stat;
      var lp = LP_STATS.find(function(s){ return s.id === statId; });
      if (lp) { for(var i=0;i<pts;i++) lp.apply(); }
    });
  }

  // Apply subclass ability
  try { sub.apply(); } catch(e) { console.warn('Subclass apply error:', e); }

  // Close overlay
  var ov = document.getElementById('ov-subclass');
  if (ov) ov.style.display = 'none';

  // Show toast and log
  showToast(sub.icon + ' ' + sub.name + ' subclass chosen!', 'gold');
  addLog(sub.icon + ' Subclass chosen: ' + sub.name + '. ' + sub.passive);
  say('Subclass chosen. ' + sub.name + '. ' + sub.desc + ' Passive: ' + sub.passive);

  // Update top bar to show subclass
  updateTopBar();
  saveProgress();
}

// ── ABYSSAL DEEP — UNLOCK & NAVIGATION ──────────────────────────────────────

function isAbyssalUnlocked() {
  if (DDStore.getItem('dd_dev_mode') === '1') return true;
  if (DDStore.getItem('dd_abyssal_unlocked') === '1') return true;
  // Unlocks automatically after Infernal is unlocked
  if (isInfernalUnlocked()) {
    DDStore.setItem('dd_abyssal_unlocked', '1');
    return true;
  }
  return false;
}

function handleAbyssalClick() {
  if (isAbyssalUnlocked()) {
    var card = document.getElementById('abyssal-dungeon-card');
    if (card) {
      card.classList.remove('locked');
      card.disabled = false;
      card.setAttribute('aria-disabled', 'false');
      pickDungeon(card);
    }
    return;
  }
  say('The Abyssal Deep is sealed. Complete The Infernal Descent first to unlock it.');
  showToast('🌊 Complete The Infernal Descent to unlock The Abyssal Deep.', 'blue');
}

function refreshAbyssalCard() {
  var card = document.getElementById('abyssal-dungeon-card');
  if (!card) return;
  if (isAbyssalUnlocked()) {
    card.classList.remove('locked');
    card.disabled = false;
    card.setAttribute('aria-disabled', 'false');
    card.setAttribute('aria-label', 'The Abyssal Deep. Unlocked. The Leviathan awaits.');
    var note = card.querySelector('.dungeon-unlock-note');
    if (note) note.style.display = 'none';
  }
}

// ── THE SHADOW WORLD ─────────────────────────────────────────────────────────
function isShadowWorldUnlocked() {
  if (DDStore.getItem('dd_dev_mode') === '1') return true;
  if (DDStore.getItem('dd_shadowworld_unlocked') === '1') return true;
  // Unlocks after completing The Abyssal Deep
  var cleared = _jsonParseSafe(DDStore.getItem('dd_cleared_dungeons'), '[]');
  if (cleared.includes('The Abyssal Deep')) {
    DDStore.setItem('dd_shadowworld_unlocked', '1');
    return true;
  }
  return false;
}

function handleShadowWorldClick() {
  if (isShadowWorldUnlocked()) {
    var card = document.getElementById('shadowworld-dungeon-card');
    if (card) {
      card.classList.remove('locked');
      card.disabled = false;
      card.setAttribute('aria-disabled', 'false');
      pickDungeon(card);
    }
    return;
  }
  say('The Shadow World is sealed. It has waited 3000 years. Complete The Abyssal Deep first to break the seal.');
  showToast('🌑 Complete The Abyssal Deep to unlock The Shadow World.', 'purple');
}

function refreshShadowWorldCard() {
  var card = document.getElementById('shadowworld-dungeon-card');
  if (!card) return;
  if (isShadowWorldUnlocked()) {
    card.classList.remove('locked');
    card.disabled = false;
    card.setAttribute('aria-disabled', 'false');
    card.setAttribute('aria-label', 'The Shadow World. Unlocked. The Shapeshifter awaits.');
    var note = card.querySelector('.dungeon-unlock-note');
    if (note) note.style.display = 'none';
  }
}

// ── ABYSSAL DEEP — COMBAT MECHANICS ─────────────────────────────────────────

function applyAbyssalEnemyMechanics(enemy, action) {
  if (!enemy) return;
  var msg = null;

  // Tide Wraith — phases through defense
  if (enemy.tidePhase && action === 'defend') {
    DS.defending = false;
    msg = '🌊 ' + enemy.name + ' phases through your defense!';
    addLog(msg); say(msg);
  }

  // Drowned Sailor — silence every 3 turns
  if (enemy.silenceTimer) {
    enemy._silenceCount = (enemy._silenceCount || 0) + 1;
    if (enemy._silenceCount >= enemy.silenceTimer) {
      enemy._silenceCount = 0;
      DS._abyssalSilenced = 2;
      msg = '⚓ ' + enemy.name + ' screams — your skills are silenced for 2 turns!';
      addLog(msg); say(msg);
    }
  }

  // Ink Fiend — blind
  if (enemy.blindChance && Math.random() < enemy.blindChance) {
    DS._abyssalBlinded = 1;
    msg = '🐙 ' + enemy.name + ' sprays ink — you are blinded! Next attack may miss.';
    addLog(msg);
  }

  // Pressure Beast — stacks
  if (enemy.pressureStacks) {
    enemy._pressureStack = (enemy._pressureStack || 0) + 1;
    // +10% per turn alive (it compounded on the already-grown attack every turn)
    if (!enemy._pressureBase) enemy._pressureBase = enemy.atk.slice();
    enemy.atk = [
      Math.round(enemy._pressureBase[0] * (1 + enemy._pressureStack * 0.10)),
      Math.round(enemy._pressureBase[1] * (1 + enemy._pressureStack * 0.10))
    ];
  }

  // Shell armor — first 3 turns
  if (enemy.shellArmor && enemy.shellArmor > 0) {
    enemy.shellArmor--;
  }

  // Siren charm
  if (enemy.sirenCharm && Math.random() < enemy.sirenCharm) {
    DS._abyssalCharmed = true;
  }

  // SP drain
  if (enemy.spDrain) {
    DS.sp = Math.max(0, DS.sp - enemy.spDrain);
    updateXPBar();
    msg = '👁️ ' + enemy.name + ' drains ' + enemy.spDrain + ' SP from your mind!';
    addLog(msg);
  }
}

function applyAbyssalPlayerMechanics(baseDmg, enemy) {
  // Blinded — 40% miss chance
  if (DS._abyssalBlinded && DS._abyssalBlinded > 0) {
    DS._abyssalBlinded--;
    if (Math.random() < 0.40) {
      addLog('😵 You are blinded — your attack misses!');
      say('Blinded. Attack missed.');
      return 0;
    }
  }
  // Charmed — 30% self hit
  if (DS._abyssalCharmed) {
    DS._abyssalCharmed = false;
    if (Math.random() < 0.30) {
      DS.hp = Math.max(1, DS.hp - baseDmg);
      updatePlayerBar();
      addLog('🧜 Siren charm — you strike yourself for ' + baseDmg + ' damage!');
      say('Charmed by the Siren! You hit yourself for ' + baseDmg + '.');
      return 0;
    }
  }
  // Shell armor — damage reduction
  if (enemy && enemy.shellArmor && enemy.shellArmor > 0) {
    baseDmg = Math.round(baseDmg * 0.70);
    addLog('🦀 Shell armor absorbs some damage!');
  }
  // Physical resist (Coral Horror)
  if (enemy && enemy.physResist) {
    baseDmg = Math.round(baseDmg * (1 - enemy.physResist));
  }
  return baseDmg;
}

function applyAbyssalSilence() {
  if (DS._abyssalSilenced && DS._abyssalSilenced > 0) {
    DS._abyssalSilenced--;
    return true; // skills blocked
  }
  return false;
}

// Thermal vent weather — heal on kill
function applyAbyssalKillBonus() {
  // Forest Blessing's heal per kill was only words
  var dw = getDungeonWeather();
  if (dw && dw.hpPerKill && DS.hp > 0) { DS.hp = Math.min(DS.maxHp, DS.hp + dw.hpPerKill); updatePlayerBar(); addLog(dw.icon + ' ' + dw.name + ' — +' + dw.hpPerKill + ' HP from the kill.'); }
  if (DS.dungeon !== 'The Abyssal Deep') return;
  var w = getAbyssalWeather();
  if (!w || !w.hpPerKill) return;
  DS.hp = Math.min(DS.maxHp, DS.hp + w.hpPerKill);
  updatePlayerBar();
  addLog('🌋 Thermal Vent — +' + w.hpPerKill + ' HP from the kill!');
}

// Drowned King resurrection
function checkAbyssalResurrect(enemy) {
  if (!enemy || !enemy.resurrect || enemy._resurrected) return false;
  if (enemy.hp <= 0) {
    enemy.hp = 1;
    enemy.maxHp = enemy.maxHp || enemy.hp;
    enemy._resurrected = true;
    addLog('👑 ' + enemy.name + ' RESURRECTS at 1 HP! The undead do not yield easily!');
    say(enemy.name + ' resurrects at 1 HP!');
    updateEnemyBar();
    return true;
  }
  return false;
}

// ── ABYSSAL DEEP — THE WITNESS EVENT ────────────────────────────────────────

function triggerTheWitness() {
  setEvent('encounter',
    'A shark drifts from the dark. Large. Calm. It circles you slowly. ' +
    'It does not attack. It watches. It has been watching for a very long time.'
  );
  say('A shark appears. It circles you. It is watching. It has been watching this entire time.');

  var sharkEnemy = {
    name: 'The Witness', icon: '🦈',
    hp: 60, maxHp: 60,
    atk: [10, 16], gold: [0, 0],
    isWitness: true,
    desc: 'It was never really fighting you.'
  };
  DS.enemy = sharkEnemy;

  setTimeout(function() {
    addLog('🦈 The Witness appears. Something feels different about this fight.');
    startCombat(false);
  }, 1500);
}

function checkWitnessAfterKill(enemy) {
  if (!enemy || !enemy.isWitness) return false;
  // Override death — shark becomes your minion
  DS.enemy = null;
  DS.inCombat = false; // BUGFIX: combat buttons are re-enabled below during the dialogue window; without this the "attack" handler would run with a null enemy and crash, freezing combat
  showDgPanels(true, false, false);
  setCombatBtns(false);

  var witnessText = [
    'The shark does not fall.',
    'It circles you one final time.',
    'Then it stops.',
    'It looks at you directly.',
    'You realize — it was never real. A projection. A test.',
    'The real shark rises from below.',
    'It has been watching you since you entered this dungeon.',
    'Every fight. Every floor. Every choice.',
    'It has decided.',
    'You passed.'
  ].join(' ');

  setEvent('good', witnessText);
  say(witnessText);
  addRunLog('The Witness chose you.', 'good');
  setCombatBtns(true); // re-enable immediately since combat is over

  setTimeout(function() {
    captureMinion({
      id: 'the-witness',
      name: 'The Witness',
      icon: '🦈',
      atk: 12,
      isWitness: true,
      desc: 'The shark that watched you from the beginning. It chose you.'
    });
    showToast('🦈 The Witness joins you as a permanent minion!', 'blue');
    awardAchievement('ach-witness');
    enterRoom();
  }, 4000);
  return true;
}

function refreshDungeonUnlocks() {
  var unlocked = getUnlockedDungeons();
  var infernalUnlocked = isInfernalUnlocked();
  // Auto-refresh infernal and abyssal cards
  setTimeout(function(){ if(typeof refreshInfernalCard==='function') refreshInfernalCard(); }, 100);
  setTimeout(function(){ if(typeof refreshAbyssalCard==='function') refreshAbyssalCard(); }, 150);
  setTimeout(function(){ if(typeof refreshShadowWorldCard==='function') refreshShadowWorldCard(); }, 200);
  var cards = document.querySelectorAll('.dungeon-card');
  cards.forEach(function(card) {
    var dName = card.getAttribute('data-dungeon');
    if (!dName) return;

    // Infernal uses its own unlock system
    if (dName === 'The Infernal Descent') {
      if (infernalUnlocked) {
        card.classList.remove('locked');
        card.disabled = false;
        card.removeAttribute('aria-disabled');
        card.setAttribute('onclick', 'pickDungeon(this)');
        var lockEl = card.querySelector('.dungeon-unlock-note');
        if (lockEl) { lockEl.textContent = '🔥 UNLOCKED — The gate is open'; lockEl.style.color = '#ff4444'; }
        card.setAttribute('aria-label', 'The Infernal, unlocked, dungeon of pure darkness, 10 floors. Press to select.');
      }
      return;
    }

    var shouldUnlock = unlocked.indexOf(dName) !== -1;
    if (shouldUnlock) {
      card.classList.remove('locked');
      card.disabled = false;
      card.removeAttribute('aria-disabled');
      var lockEl = card.querySelector('.dungeon-lock');
      if (lockEl) {
        lockEl.classList.add('unlocked');
        lockEl.classList.remove('locked');
        lockEl.textContent = '✦ UNLOCKED · 10 Floors';
        lockEl.style.color = '#7aaa7a';
      }
      card.setAttribute('aria-label', dName + ', unlocked, 10 floors. Press to select.');
    } else {
      card.classList.add('locked');
      card.disabled = true;
      card.setAttribute('aria-disabled', 'true');
      var lockEl = card.querySelector('.dungeon-lock');
      if (lockEl) {
        lockEl.classList.remove('unlocked');
        lockEl.style.color = '';
      }
      var lockMsgs = {
        'The Ashbound Wastes':    '🔒 LOCKED · Complete Crypt of Malachar',
        'Frosthold Abyss':        '🔒 LOCKED · Complete The Ashbound Wastes',
        'The Sunken Archives':    '🔒 LOCKED · Complete Frosthold Abyss',
        'The Hollow':             '🔒 LOCKED · Complete The Sunken Archives',
        'The Whispering Forest':  '🔒 LOCKED · Complete The Hollow',
        'The Infernal Descent':   '🔒 LOCKED · Complete The Whispering Forest',
        'The Abyssal Deep':       '🔒 LOCKED · Complete The Infernal Descent',
      };
      var lockMsg = lockMsgs[dName] || '🔒 LOCKED · Complete previous dungeon';
      if (lockEl) lockEl.textContent = lockMsg;
      card.setAttribute('aria-label', dName + ', locked. ' + lockMsg.replace('🔒 LOCKED · ',''));
    }
  });
  var count = unlocked.length + (infernalUnlocked ? 1 : 0);
  // Only announce if dungeon count changed since last check
  var lastCount = parseInt(DDStore.getItem('dd_last_dungeon_count') || '0');
  if (count !== lastCount) {
    DDStore.setItem('dd_last_dungeon_count', count);
    if (count > 1) {
      say(count + ' dungeons available. ' + unlocked.join(', ') + (infernalUnlocked ? ', The Infernal Descent' : '') + '.');
    }
  }
}

function pickDungeon(el) {
  if (el.disabled) return;
  document.querySelectorAll('.dungeon-card:not(.locked)').forEach(function(c) { c.classList.remove('sel'); c.setAttribute('aria-checked','false'); });
  el.classList.add('sel'); el.setAttribute('aria-checked','true'); NC.dungeon = el.dataset.dungeon;
  var sn = document.getElementById('dung-slider-name'); if(sn) sn.textContent = NC.dungeon;
  // Update slider aria
  var slider = document.getElementById('dung-slider');
  if (slider) { slider.setAttribute('aria-valuetext', NC.dungeon + ' — Selected'); }
  say(NC.dungeon + ' selected.');
}

var _DUNGS = ['Crypt of Malachar','The Ashbound Wastes','Frosthold Abyss','The Sunken Archives','The Hollow','The Whispering Forest','The Infernal Descent','The Abyssal Deep'];
var _dungIdx = 0;
function stepDung(dir) {
  var newIdx = (_dungIdx + dir + _DUNGS.length) % _DUNGS.length;
  var d = _DUNGS[newIdx];
  var card = document.querySelector('.dungeon-card[data-dungeon="' + d + '"]');
  var locked = card && (card.disabled || card.classList.contains('locked'));
  // Update slider label so JAWS hears the name even if locked
  var sn = document.getElementById('dung-slider-name'); if(sn) sn.textContent = d;
  var sd = document.getElementById('dung-slider-desc'); if(sd) sd.textContent = locked ? 'Locked' : 'Unlocked';
  var slider = document.getElementById('dung-slider'); if(slider){ slider.setAttribute('aria-valuenow', newIdx); slider.setAttribute('aria-valuetext', d + (locked ? ' — Locked. Complete previous dungeons to unlock.' : ' — Unlocked. Selected.')); }
  if (locked) {
    // Don't move _dungIdx — keep selection on the last valid dungeon
    say(d + ' is locked. Complete previous dungeons to unlock.');
    return;
  }
  // Only commit the index move if the dungeon is actually selectable
  _dungIdx = newIdx;
  if (card) pickDungeon(card);
}

function pickDiff(el) {
  document.querySelectorAll('.diff-card').forEach(function(c) { c.classList.remove('sel'); c.setAttribute('aria-checked','false'); });
  el.classList.add('sel'); el.setAttribute('aria-checked','true'); NC.diff = el.dataset.diff;
  // Sync slider display
  var names = {Wanderer:'3 lives · Normal damage',Ironblood:'1 life · +10% damage',Condemned:'1 life · +25% damage',Forsaken:'1 life · +50% damage',Nightmare:'1 life · Nightmare enemies',Insane:'1 life · Sanity bar',Endless:'Infinite floors · No victory'};
  var sn = document.getElementById('diff-slider-name'); if(sn) sn.textContent = NC.diff;
  var sd = document.getElementById('diff-slider-desc'); if(sd) sd.textContent = names[NC.diff]||'';
  say(NC.diff + ' difficulty selected.');
  updateSummary();
}

var _DIFFS = ['Wanderer','Ironblood','Condemned','Forsaken','Nightmare','Insane','Endless'];
var _diffIdx = 0;
function stepDiff(dir) {
  _diffIdx = (_diffIdx + dir + _DIFFS.length) % _DIFFS.length;
  var d = _DIFFS[_diffIdx];
  var card = document.querySelector('.diff-card[data-diff="' + d + '"]');
  if (card) pickDiff(card);
  var slider = document.getElementById('diff-slider');
  if (slider) { slider.setAttribute('aria-valuenow', _diffIdx); slider.setAttribute('aria-valuetext', d); }
}

function updateSummary() {
  document.getElementById('sum-name').textContent = NC.name || '—';
  document.getElementById('sum-class').textContent = NC.cls || '—';
  document.getElementById('sum-race').textContent = NC.race || '—';
  document.getElementById('sum-prof').textContent = NC.prof || '—';
  document.getElementById('sum-dungeon').textContent = NC.dungeon || '—';
  document.getElementById('sum-diff').textContent = NC.diff || '—';
}

function openConfirmDialog() {
  var warns = { Wanderer:'Wanderer: 3 lives. Good for learning.', Ironblood:'Warning — Ironblood: 1 life. One death ends your run.', Condemned:'Warning — Condemned: 1 life, empowered enemies.', Forsaken:'Final warning — Forsaken: 1 life, maximum difficulty. Most never return.' };
  document.getElementById('ov-confirm-text').textContent = NC.name + ' the ' + NC.race + ' ' + NC.cls + ' (' + NC.prof + ') will enter ' + NC.dungeon + '.';
  document.getElementById('ov-confirm-warn').textContent = warns[NC.diff] || '';
  openOv('ov-confirm');
  say('Confirm character. ' + warns[NC.diff] + ' Press Descend to confirm.');
}

function finalizeChar() {
  var runMode = NC.runMode || 'classic';

  // Auto-select first spirit if none chosen
  if (!NC.spirit) {
    var defaultSpirits = STARTER_SPIRITS.concat(getCustomSpiritsWithFunctions());
    if (defaultSpirits.length) NC.spirit = defaultSpirits[0].id;
  }

  var ch = {
    name: NC.name, cls: NC.cls, race: NC.race, prof: NC.prof,
    dungeon: NC.dungeon, difficulty: NC.diff, floor: 0,
    created: Date.now(), runMode: runMode,
    lastSpirit: NC.spirit || null,
    corruptionMode: NC.corruption || false,
    corruption: 0,
    hunterMode: NC.hunterMode || false,
    hardcoreMode: NC.hardcore || false,
    guidePersonality: NC.guidePersonality || 'encouraging',
    guideEnabled: true,
    earnedSpirits: [],
    // Legacy Mode — track dungeon tier
    dungeonTier: runMode === 'legacy' ? 1 : undefined,
    persistLevel: runMode === 'legacy' ? 1 : undefined,
    levelCap: runMode === 'legacy' ? 25 : 10
  };
  CHARS.push(ch);
  _charIdx = CHARS.length - 1;
  applyBackstory(ch);
  saveChars();
  closeOv('ov-confirm');
  var modeMsg = runMode === 'legacy' ? ' Legacy Mode active.' : ' Classic Run.';
  var spiritMsg = NC.spirit ? ' Spirit: ' + (getSpiritById(NC.spirit) ? getSpiritById(NC.spirit).name : NC.spirit) + '.' : '';
  var corruptMsg = NC.corruption ? ' Corruption Mode ON.' : '';
  var hunterMsg = NC.hunterMode ? ' Hunter Mode ON. Something will be hunting you.' : '';
  say(NC.name + ' created.' + modeMsg + spiritMsg + corruptMsg + hunterMsg + ' Returning to character list.');
  goTo('charlist');
}

function getUnlockedDungeons() {
  // Auto-repair: scan completed characters and unlock their next dungeons
  repairDungeonUnlocks();
  var u = _jsonParseSafe(DDStore.getItem('dd_unlocks'), '{}');
  var list = ['Crypt of Malachar'];
  if (u['The Ashbound Wastes']) list.push('The Ashbound Wastes');
  if (u['Frosthold Abyss']) list.push('Frosthold Abyss');
  if (u['The Sunken Archives']) list.push('The Sunken Archives');
  if (u['The Hollow']) list.push('The Hollow');
  if (u['The Whispering Forest']) list.push('The Whispering Forest');
  if (u['The Infernal Descent']) list.push('The Infernal Descent');
  if (u['The Abyssal Deep']) list.push('The Abyssal Deep');
  return list;
}

function devRepairUnlocks() {
  repairDungeonUnlocks();
  refreshDungeonUnlocks();
  showToast('Dungeon unlocks repaired!', 'gold');
  say('Dungeon unlocks repaired. If you completed a dungeon your next dungeon should now be available.');
}

function openResetGame() {
  showResetGame();
}

function repairDungeonUnlocks() {
  var dungeonOrder = ['Crypt of Malachar','The Ashbound Wastes','Frosthold Abyss','The Sunken Archives','The Hollow','The Whispering Forest','The Infernal Descent','The Abyssal Deep'];
  var unlocksData = _jsonParseSafe(DDStore.getItem('dd_unlocks'), '{}');
  var changed = false;
  CHARS.forEach(function(ch) {
    // Check multiple completion signals — completed flag, floor 10, or has death log entries (ran full dungeon)
    var isComplete = ch.completed || ch.floor >= 10 ||
      (ch.deathLog && ch.deathLog.length > 0 && ch.deathLog.some(function(d){ return d.floor >= 9; }));
    if (!isComplete) return;
    var doneIdx = dungeonOrder.indexOf(ch.dungeon);
    if (doneIdx >= 0 && doneIdx < dungeonOrder.length - 1) {
      var nextDungeon = dungeonOrder[doneIdx + 1];
      if (!unlocksData[nextDungeon]) {
        unlocksData[nextDungeon] = true;
        changed = true;
      }
    }
  });
  // Also check DS if currently in a dungeon
  if (DS && DS.dungeon && DS.floor >= 10) {
    var doneIdx = dungeonOrder.indexOf(DS.dungeon);
    if (doneIdx >= 0 && doneIdx < dungeonOrder.length - 1) {
      var nextDungeon = dungeonOrder[doneIdx + 1];
      if (!unlocksData[nextDungeon]) { unlocksData[nextDungeon] = true; changed = true; }
    }
  }
  if (changed) DDStore.setItem('dd_unlocks', JSON.stringify(unlocksData));
}

//═════════════════
// DUNGEON ENGINE
//═════════════════
var ENEMIES = {
  t1: [
    { name:'Hollow Shade',      icon:'👻', hp:24, atk:[4,9],  gold:[2,5] },
    { name:'Crypt Rat',         icon:'🐀', hp:16, atk:[3,7],  gold:[1,3], coward:true },
    { name:'Brittle Skeleton',  icon:'💀', hp:28, atk:[5,10], gold:[2,6] },
    { name:'Grave Crawler',     icon:'🦂', hp:20, atk:[4,8],  gold:[1,4] },
    { name:'Tomb Bat',          icon:'🦇', hp:14, atk:[3,6],  gold:[1,3] },
    { name:'Rotting Ghoul',     icon:'🧟', hp:30, atk:[5,9],  gold:[2,5] },
    { name:'Ashen Wisp',        icon:'🌫️', hp:18, atk:[4,8],  gold:[1,4] },
    { name:'Bone Shard',        icon:'🦴', hp:22, atk:[5,9],  gold:[2,4] }
  ],
  t2: [
    { name:'Wailing Wraith',    icon:'👁️', hp:36, atk:[7,13], gold:[4,8]  },
    { name:'Armored Skeleton',  icon:'🗡️', hp:44, atk:[8,14], gold:[5,10] },
    { name:'Plague Hound',      icon:'🐺', hp:30, atk:[6,12], gold:[3,7]  },
    { name:'Crypt Banshee',     icon:'👻', hp:40, atk:[8,14], gold:[5,9]  },
    { name:'Shadow Stalker',    icon:'🌑', hp:34, atk:[7,13], gold:[4,8]  },
    { name:'Cursed Knight',     icon:'🛡️', hp:50, atk:[8,15], gold:[6,11] },
    { name:'Plague Wraith',     icon:'☠️', hp:38, atk:[7,14], gold:[5,9]  },
    { name:'Bone Archer',       icon:'🏹', hp:28, atk:[9,16], gold:[4,8]  },
    { name:'Crypt Spider',      icon:'🕷️', hp:32, atk:[7,14], gold:[4,8]  },
    { name:'Venom Spitter',     icon:'🕸️', hp:26, atk:[8,15], gold:[3,7]  }
  ],
  t3: [
    { name:'Death Knight',      icon:'⚔️', hp:60, atk:[10,18], gold:[8,15]  },
    { name:'Bone Colossus',     icon:'🦴', hp:72, atk:[12,20], gold:[10,18] },
    { name:'Soul Harvester',    icon:'🌑', hp:55, atk:[11,19], gold:[7,14]  },
    { name:'Void Reaper',       icon:'💀', hp:65, atk:[11,20], gold:[9,16]  },
    { name:'Ancient Revenant',  icon:'🧟', hp:70, atk:[12,19], gold:[9,17]  },
    { name:'Nightmare Shade',   icon:'😱', hp:58, atk:[11,21], gold:[8,15]  },
    { name:'Blood Golem',       icon:'🔴', hp:80, atk:[11,18], gold:[10,17] },
    { name:'Web Stalker',       icon:'🕷️', hp:66, atk:[12,20], gold:[8,15]  },
    { name:'Brood Mother',      icon:'🕸️', hp:74, atk:[11,19], gold:[9,16]  }
  ],
  boss: { name:'Malachar the Undying', icon:'👑', hp:120, atk:[15,25], gold:[30,50], isBoss:true },
  bossPool: [
    { name:'Malachar the Undying',  icon:'👑', hp:120, atk:[15,25], gold:[30,50], isBoss:true,
      phaseMsg2:'Malachar screams — his shield cracks. Phase 2: He summons a wall of undead fire!',
      phaseMsg3:'The fire wall falls. Malachar stands exposed — ancient and furious!' },
    { name:'The Bone Sovereign',    icon:'💀', hp:110, atk:[14,23], gold:[28,48], isBoss:true,
      phaseMsg2:'The Bone Sovereign splinters — and rebuilds himself from the fallen dead around him!',
      phaseMsg3:'His final form rises — a throne of bones animated by pure malice!' },
    { name:'The Void Walker',       icon:'🌑', hp:115, atk:[15,24], gold:[29,49], isBoss:true,
      phaseMsg2:'The Void Walker tears a rift in reality itself. Phase 2: Reality warps around you!',
      phaseMsg3:'The rift collapses inward. The Void Walker channels all of nothing at you!' },
    { name:'The Crypt Tyrant',       icon:'👺', hp:125, atk:[16,26], gold:[31,51], isBoss:true,
      phaseMsg2:'The Crypt Tyrant bellows — the walls crack and dead rise from the rubble!',
      phaseMsg3:'His power peaks. Ancient runes ignite across his armour. Final phase!' },
    { name:'The Pale Queen',         icon:'👸', hp:108, atk:[14,22], gold:[27,47], isBoss:true,
      phaseMsg2:'The Pale Queen shrieks — her veil tears and reveals something ancient beneath!',
      phaseMsg3:'She abandons grace entirely. Raw death magic pours from her hands!' }
  ]
};

// ── ASHBOUND WASTES ENEMIES (exclusive to this dungeon) ──
var ASH_ENEMIES = {
  t1: [
    { name:'Cinder Wraith',    icon:'🔥', hp:22, atk:[5,10], gold:[2,5] },
    { name:'Ash Crawler',      icon:'🌋', hp:18, atk:[4,9],  gold:[1,4] },
    { name:'Scorched Husk',    icon:'💀', hp:28, atk:[6,11], gold:[2,6] },
    { name:'Ember Shade',      icon:'✨', hp:16, atk:[5,9],  gold:[1,4] },
    { name:'Char Bat',         icon:'🦇', hp:14, atk:[4,8],  gold:[1,3] },
    { name:'Slag Crawler',     icon:'🪲', hp:24, atk:[5,10], gold:[2,5] },
    { name:'Cinder Hound',     icon:'🐕', hp:20, atk:[5,10], gold:[2,5], burn:2, burnTurns:2, desc:'Runs on embers. Leaves burning wounds on every bite.' },
    { name:'Smoke Wraith',     icon:'💨', hp:16, atk:[4,9],  gold:[1,4], dodgeEvery:3, desc:'Made of smoke. Phases out of reality every third turn.' },
  ],
  t2: [
    { name:'Molten Knight',    icon:'⚔️', hp:48, atk:[9,16], gold:[5,10] },
    { name:'Plague of Cinders',icon:'💨', hp:36, atk:[8,15], gold:[4,8]  },
    { name:'Char Stalker',     icon:'👁️', hp:40, atk:[8,14], gold:[4,9]  },
    { name:'Blighted Overseer',icon:'👺', hp:52, atk:[9,17], gold:[6,11] },
    { name:'Ashen Revenant',   icon:'🧟', hp:44, atk:[8,15], gold:[5,9]  },
    { name:'Flame Wraith',     icon:'👻', hp:38, atk:[9,16], gold:[4,8]  },
    { name:'Ember Knight',     icon:'🔥', hp:50, atk:[10,17],gold:[5,10], burn:3, burnTurns:3, desc:'Armor melted into their body. Every strike burns.' },
    { name:'Pyre Sentinel',    icon:'🪔', hp:44, atk:[8,14], gold:[5,9],  immuneFirstHit:true, desc:'Has been standing at attention for three centuries. Your first strike barely registers.' },
  ],
  t3: [
    { name:'Volcanic Revenant',icon:'🌋', hp:68, atk:[12,21], gold:[9,16]  },
    { name:'Infernal Colossus',icon:'💀', hp:80, atk:[13,22], gold:[10,18] },
    { name:'The Ashen King',   icon:'👑', hp:72, atk:[12,20], gold:[9,17]  },
    { name:'Slag Titan',       icon:'🔴', hp:76, atk:[13,21], gold:[10,17] },
    { name:'Ember Reaper',     icon:'☠️', hp:62, atk:[12,22], gold:[8,15]  },
    { name:'Burned Colossus',  icon:'🏚️', hp:85, atk:[13,21], gold:[10,18], burn:4, burnTurns:3, desc:'Walked into the fire and kept walking. Burns everything it touches.' },
  ],
  boss: { name:'The Eternal Pyre', icon:'🔥', hp:140, atk:[16,26], gold:[35,55], isBoss:true },
  bossPool: [
    { name:'The Eternal Pyre',    icon:'🔥', hp:140, atk:[16,26], gold:[35,55], isBoss:true,
      phaseMsg2:'The Eternal Pyre roars as its outer shell shatters. The fire wall ignites!',
      phaseMsg3:'The fire wall collapses. The Eternal Pyre stands before you, unshielded and furious!' },
    { name:'The Ashen Throne',    icon:'👑', hp:130, atk:[15,25], gold:[33,53], isBoss:true,
      phaseMsg2:'The Ashen Throne cracks — the ruler within stirs, awakened by rage!',
      phaseMsg3:'Fully awakened, the Ashen Throne rises from its fused seat — three centuries of fury!' },
    { name:'The Cinder Colossus', icon:'🌋', hp:150, atk:[14,24], gold:[36,56], isBoss:true,
      phaseMsg2:'The Cinder Colossus absorbs the molten floor itself. It grows larger!',
      phaseMsg3:'Fully formed, the Cinder Colossus channels the entire eruption at you!' }
  ,
    { name:'The Scorching Throne',  icon:'🔥', hp:138, atk:[17,27], gold:[34,54], isBoss:true, phaseMsg2:'The throne cracks and molten magma pours from every joint!', phaseMsg3:'The Scorching Throne becomes pure fire. Unstoppable. Undying.' },
    { name:'Pyrax the Deathless',   icon:'🌋', hp:145, atk:[16,26], gold:[35,55], isBoss:true, phaseMsg2:'Pyrax absorbs the fallen cinders around him — growing larger!', phaseMsg3:'Pyrax transcends form entirely. He IS the fire now!' }
  ]
};

// ── ASHBOUND ROOM DESCRIPTIONS ──
var ASH_ROOM_DESCS = [
  // Early (1-3)
  'The ash here is ankle deep. Every step announces you.',
  'Smoke rises from cracks in the floor. Whatever burned here has not finished burning.',
  'The heat is immediate and wrong. The walls glow faintly orange.',
  'Charred remains line the walls. They are standing upright. They were not placed that way.',
  'The air tastes of cinder and something older than fire.',
  'A fireplace dominates one wall. The fire inside burns black.',
  'The ceiling is scorched in patterns. Not random. Something drew them with flame.',
  'Your boots leave prints in the ash. Something else\'s prints are already here.',
  'The room smells of burning hair. There is no hair. There is no source.',
  'Embers drift upward from the floor. Gravity here has preferences.',
  'A torch on the wall burns without fuel. You do not touch it.',
  'The ash shifts as you walk through it. Like something underneath is listening.',
  'Soot covers every surface. Writing in it. You cannot read it. You feel it means something.',
  'The walls are warm to the touch. Not hot. Warm. Like skin.',
  'This room has burned three times. You can tell by the layers.',
  'The heat warps the air. Things at the edge of the room flicker like mirages.',
  'A melted weapon lies in the corner. Whatever the owner fought, it was hotter than steel.',
  'The floor crunches. Not ash. Something underneath the ash.',
  'A bell hangs from the ceiling. Cracked and blackened. It rings once as you enter.',
  'The smoke trails upward and then bends. Toward you.',
  // Mid (4-6)
  'The fire here is ancient. It has been burning longer than the dungeon has existed.',
  'Handprints on the wall. Burned in, not painted. Someone reached for help.',
  'The ash rises to your knees. Walking requires effort. Something benefits from that.',
  'You hear breathing. Not yours. Rhythmic. Coming from the walls.',
  'The room has no ceiling. Just darkness and falling ash from above.',
  'Everything here is the same color: black and orange. Even the shadows.',
  'A body here, preserved in char. The expression is not one of pain. It is surprise.',
  'The fire follows you across the floor. Not chasing. Curious.',
  'The air moves in circles here. Always circles. The center is perfectly still.',
  'Three burned doors. The handles are too hot to touch. You find another way.',
  'Voices in the crackle. Not words. Almost words.',
  'The room is smaller than it should be. The walls crept inward while you were not watching.',
  'Something feeds the fire. You cannot see what. You do not look closely.',
  'The floor gives slightly under your weight. The ash is deep. Very deep.',
  'A figure of ash stands in the corner. Detailed. It was made carefully.',
  // Deep (7+)
  'The Wastes remember everyone who burned here. They remember you now.',
  'The heat at this depth is not heat. It is intent.',
  'Fire does not burn things at this depth. It reveals them.',
  'You feel the ash on your skin before you realize you are breathing it.',
  'The flames here do not flicker. They are absolutely still. That is wrong.',
  'This deep, the fire is alive. It has been alive a very long time.',
  'The burning never stopped. It started before the dungeon and it will end after.',
  'You are a visitor. The fire is a resident. It tolerates your presence.',
  'The walls melt as you watch. They reform. The shapes they form are faces.',
  'Something in the fire looks back at you. You both pretend not to notice.',
  'The ash here moves without wind. It has somewhere to be.',
  'Your shadow burns on the wall. Your body does not. Not yet.',
  'The fire whispers. Not words. A tone. It knows your name in frequencies.',
  'At this depth the Wastes are not a dungeon. They are a hunger.',
  'You realize you have been warm the entire time. The cold has not reached this deep. It never will.',
  'The heat here is wrong — not warm, but hungry. Like the air itself wants to consume you.',
  'Ash coats every surface inches deep. Your footsteps leave prints. Something else already has.',
  'The walls are blackened stone, still faintly warm. Whatever burned here did not want to stop.',
  'The smell of char and sulfur is overwhelming. You breathe through your teeth.',
  'Scorched bones litter the floor. They were not arranged. They simply fell where their owners died.',
  'An old fountain stands here, bone-dry. The stone basin is cracked from extreme heat.',
  'The ceiling above you is stained black. Something burned for a very long time directly below it.',
  'A child\'s sandal lies in the ash. You do not look for the other one.',
  'The heat shimmers in visible waves. Distance is hard to judge. So is safety.',
  'Melted iron is fused to the floor — what was once a gate, or a throne, or a cage.',
  'The walls here have writing burned into them. The language is old. The warning is not.',
  'Something glows red in the far corner. You move toward it because there is nowhere else to go.',
  'The silence here is not cold and watching like the Crypt. It is hot and waiting.',
  'Fragments of pottery. A broken cup. Someone tried to carry water through here. They did not make it.',
  'You find a handprint burned into the wall at shoulder height. The fingers are spread. It did not want to leave.'
];

// ── ASHBOUND FLOOR NAMES ──
var ASH_FLOOR_NAMES = [
  '',
  'The Scorched Gateway','The Burning Quarter','Hall of Embers','The Charnel District','The Smoldering Vault',
  'Chamber of Eternal Flame','The Slag Warrens','Throne of Ash','The Pyre Court','The Eternal Flame',
  'The Cinder Hall','Passage of Smoke','The Blackened Nave','Chamber of the Pyre','The Soot Corridor',
  'The Molten Gallery','Hall of the Burned','The Ashen Vault','Crucible Passage','The Deep Ember',
  'The Lava Shelf','Chamber of the Cinder Queen','The Scorched Deep','Hall of Slag','The Blasted Wing',
  'The Incineration Hall','Passage of Cinders','The Ashfall Chamber','The Char Gallery','The Eternal Ember',
];

// ── ASHBOUND LOOT ──
var ASH_LOOT = [
  { name:'Ember Shard',    icon:'🔥', type:'gem',    gold:22,       desc:'A crystallized fragment of the eternal flame. Worth 22 gold.' },
  { name:'Fire Potion',    icon:'🧪', type:'potion',  heal:45,       desc:'Forged from volcanic minerals. Restores 45 HP.' },
  { name:'Greater Fire Potion', icon:'💊', type:'potion', heal:75,  desc:'Concentrated volcanic essence. Restores 75 HP.' },
  { name:'Ashen Blade',    icon:'🗡️', type:'weapon',  atkBonus:5,   desc:'+5 attack. Forged from metal that survived the eternal fire.' },
  { name:'Ember Shield',   icon:'🛡️', type:'armor',   defBonus:4,   desc:'Reduces damage by 4. Made from the hide of a creature that could not burn.' },
  { name:'Cinder Ring',    icon:'💍', type:'ring',    effect:'flee', desc:'Wreathed in heat haze. Makes you harder to follow.' },
  { name:'Slag Ingot',     icon:'🔴', type:'gem',     gold:18,       desc:'Melted ore from the collapse. Worth 18 gold.' },
  { name:'Char Potion',    icon:'🌋', type:'potion',  heal:35,       desc:'Smells terrible. Tastes worse. Restores 35 HP.' },
  { name:'Volcanic Elixir', icon:'🌋', type:'elixir', healPct:0.65, desc:'Restores 65% of max HP. A rare find in the wastes.' }
];

// ── ASHBOUND SHOP STOCK ──
var ASH_SHOP_STOCK = [
  { name:'Fire Potion',       icon:'🧪', type:'potion', heal:45,  cost:14, desc:'Restores 45 HP.' },
  { name:'Greater Fire Potion',icon:'💊', type:'potion', heal:85,  cost:25, desc:'Restores 85 HP.' },
  { name:'Ashen Blade',       icon:'🗡️', type:'weapon', atkBonus:6, cost:32, desc:'+6 attack damage.' },
  { name:'Ember Shield',      icon:'🛡️', type:'armor',  defBonus:4, cost:28, desc:'Reduces damage by 4.' },
  { name:'Volcanic Elixir',   icon:'🌋', type:'heal',  healPct:0.65, cost:38, desc:'Restores 65% of max HP instantly.' },
  { name:'Cinder Vial',       icon:'💨', type:'ring',  effect:'flee', cost:20, desc:'Guarantees next flee attempt succeeds.' }
];

// ── FROSTHOLD ABYSS ENEMIES ──
var FROST_ENEMIES = {
  t1: [
    { name:'Frost Shade',        icon:'❄️', hp:22, atk:[4,9],  gold:[2,5] },
    { name:'Glacial Rat',        icon:'🐀', hp:16, atk:[3,7],  gold:[1,3], coward:true },
    { name:'Ice Shard',          icon:'🧊', hp:24, atk:[5,10], gold:[2,5] },
    { name:'Frozen Husk',        icon:'💀', hp:28, atk:[5,10], gold:[2,6] },
    { name:'Cave Bat',           icon:'🦇', hp:14, atk:[3,7],  gold:[1,3] },
    { name:'Permafrost Crawler', icon:'🦂', hp:20, atk:[4,8],  gold:[1,4] }
  ],
  t2: [
    { name:'Blizzard Wraith',    icon:'👻', hp:38, atk:[7,14], gold:[4,8]  },
    { name:'Glacial Knight',     icon:'⚔️', hp:46, atk:[8,15], gold:[5,10] },
    { name:'Frostbite Hound',    icon:'🐺', hp:32, atk:[7,13], gold:[3,7]  },
    { name:'Frozen Banshee',     icon:'👁️', hp:36, atk:[8,14], gold:[4,8]  },
    { name:'Ice Stalker',        icon:'🌑', hp:34, atk:[7,13], gold:[4,8]  },
    { name:'Arctic Revenant',    icon:'🧟', hp:44, atk:[8,15], gold:[5,9]  }
  ],
  t3: [
    { name:'Avalanche Colossus', icon:'🏔️', hp:74, atk:[12,21], gold:[10,18] },
    { name:'Frost Reaper',       icon:'☠️', hp:62, atk:[11,20], gold:[8,15]  },
    { name:'The Glacial Sovereign',icon:'👑',hp:70, atk:[12,20], gold:[9,17] },
    { name:'Frozen Titan',       icon:'🧊', hp:78, atk:[13,21], gold:[10,17] },
    { name:'Void Frost',         icon:'💀', hp:65, atk:[12,22], gold:[9,16]  }
  ],
  boss: { name:'The Eternal Winter', icon:'❄️', hp:145, atk:[15,26], gold:[35,55], isBoss:true },
  bossPool: [
    { name:'The Eternal Winter', icon:'❄️', hp:145, atk:[15,26], gold:[35,55], isBoss:true,
      phaseMsg2:'The Eternal Winter exhales — the temperature drops to absolute zero. Phase 2!',
      phaseMsg3:'The cold stops being cold. It becomes something without a name. Final phase!' },
    { name:'The Frozen King',    icon:'👑', hp:135, atk:[14,25], gold:[33,53], isBoss:true,
      phaseMsg2:'The ice encasing the Frozen King cracks. He stirs. He remembers why he is angry!',
      phaseMsg3:'Fully awake for the first time in a thousand years — and furious every second of it!' },
    { name:'The Void Below',     icon:'🌑', hp:150, atk:[14,24], gold:[36,56], isBoss:true,
      phaseMsg2:'The Void Below tears through the ice floor. Phase 2: The abyss rises to meet you!',
      phaseMsg3:'It is no longer rising. It is here. And it remembers you from before you were born!' }
  ,
    { name:'The Glacier Queen',     icon:'❄️', hp:132, atk:[15,25], gold:[32,52], isBoss:true, phaseMsg2:'The Glacier Queen shatters her own crown and the shards orbit her like weapons!', phaseMsg3:'Absolute zero. She freezes the very air between you!' },
    { name:'Khyros the Frozen',     icon:'🧊', hp:140, atk:[16,26], gold:[34,54], isBoss:true, phaseMsg2:'Khyros splits into three frozen mirrors of himself!', phaseMsg3:'The mirrors merge. Khyros is whole again — and furious!' }
  ]
};

// ── FROSTHOLD ROOM DESCRIPTIONS ──
var FROST_ROOM_DESCS = [
  // Early (1-3)
  'Your breath comes out in clouds. Each exhale is stolen immediately by the cold.',
  'The ice here is ancient — blue-black and deep. You can see something inside it. You try not to look.',
  'The silence is not peaceful. It is the silence of a place that has never heard sound.',
  'Your footsteps crack the ice beneath you. Whatever is below the surface, you hope it stays there.',
  'Frost patterns on the walls form shapes. You tell yourself they are not faces.',
  'A body stands frozen upright, still holding a torch that has been dark for centuries.',
  'The temperature drops as you move forward. Something colder than cold waits ahead.',
  'Stalactites of ice hang from the ceiling like teeth. The dripping has stopped.',
  'The frost here smells wrong. Like iron and emptiness and something that has no name.',
  'A crack runs floor to ceiling. The darkness on the other side is different.',
  'Crystalline formations glow faintly. There is no light source. They glow anyway.',
  'You find equipment left behind by someone. They did not leave voluntarily.',
  'A thin layer of ice covers the floor. You can see shapes beneath it. Moving shapes.',
  'The cold bites through your armor. It feels personal.',
  'Your boots stick to the floor. You pull them free. The sound echoes too long.',
  'A frozen pool in the center. The reflection shows the room differently than it is.',
  'Icicles hang at perfect intervals. Too perfect. This was arranged.',
  'The walls are mirrored with ice. Every reflection shows you a step behind where you are.',
  'Something scratched at the ice from the other side of the wall. They did not get through.',
  'The cold makes your thoughts slow. You notice too late that it is deliberate.',
  // Mid (4-6)
  'The cold is a presence here. Not weather. Not temperature. A thing that waits.',
  'Ice formations block the path. You break through them. The sound echoes wrong.',
  'At this depth, the cold becomes something else. You have no word for it.',
  'The frozen air crackles with something like electricity. Like intention.',
  'You hear breathing under the ice. Slow. Patient. Waiting for the ice to be thinner.',
  'The frost on the walls shifts as you watch. Writing that was not there before.',
  'A frozen door. The handle comes off in your hand. The door swings open anyway.',
  'Light refracts through the ice in patterns. One of the patterns moves.',
  'A frozen meal on a frozen table. The setting was for two. One chair is pushed back.',
  'The floor here is perfectly clear ice. You can see down a very long way.',
  'The cold seeps through your mind, not just your skin. It reads.',
  'Frost blooms on every surface as you enter. The room was warm a moment ago.',
  'A frozen waterfall. The water was moving when it froze. Something stopped it instantly.',
  'The ceiling drips. The drops do not reach the floor. They freeze midway.',
  'Two tunnels ahead. One exhales cold air. One inhales it. Both are wrong.',
  // Deep (7+)
  'At this depth, the Abyss is not cold. Cold is how the Abyss says hello.',
  'The frost here has memory. It remembers everyone who came before you.',
  'The ice walls show frozen faces pressed from inside. They are reaching toward you.',
  'The cold below zero is not temperature. It is the dungeon\'s oldest thought.',
  'You cannot feel your hands. You check that they are still there. They are. For now.',
  'The Void rises through the ice here. You can feel it looking up at you.',
  'The ice is so old it has become something else. A mineral. A memory. A warning.',
  'Every surface reflects differently. None of them are accurate. All of them are true.',
  'The silence here has weight. It presses against your chest.',
  'You are the warmest thing in this place by a magnitude that should not be survivable.',
  'Something in the ice stirs as you pass. It has been sleeping. It dreams of heat.',
  'The frost whispers. Not words. Directions. You do not follow them.',
  'This deep, the cold is not an enemy. It is a philosophy.',
  'The ice glows with an inner light. The light has been here longer than the dungeon.',
  'The Abyss remembers every life that ended here. You feel them recognizing you.',
];

var FROST_FLOOR_NAMES = [
  '',
  'The Frozen Gate','The Glacier Hall','The Blue Depths','Chamber of Stillness','The Permafrost Warren',
  'Hall of Eternal Cold','The Deep Freeze','The Void Approach','Throne of Ice','The Absolute Zero',
  'The Shivering Passage','Hall of Black Ice','The Cryo Chamber','Corridor of Frozen Breath','The Glacial Nave',
  'The Frost Gallery','Chamber of Rime','The Ice Labyrinth','Hall of Suspended Breath','The Deep Frost',
  'The Crystal Corridor','Chamber of the Frozen King','The Permafrost Vault','The Blue Gallery','Glacial Depths',
  'Hall of Eternal Winter','The Frozen Archive','Chamber of Stillness','The Cold Deep','The Last Warmth',
];

// ── FROSTHOLD LOOT ──
var FROST_LOOT = [
  { name:'Frost Crystal',      icon:'❄️', type:'gem',    gold:20,      desc:'A shard of ancient ice. Worth 20 gold.' },
  { name:'Glacier Potion',     icon:'🧪', type:'potion',  heal:45,      desc:'Cold, but restorative. Restores 45 HP.' },
  { name:'Greater Frost Potion',icon:'💊', type:'potion', heal:78,      desc:'Crystallized healing. Restores 78 HP.' },
  { name:'Frozen Blade',       icon:'🗡️', type:'weapon',  atkBonus:5,   desc:'+5 attack. Forged from ice that never melts.' },
  { name:'Glacial Ward',       icon:'🛡️', type:'armor',   defBonus:4,   desc:'Reduces damage by 4. Cold slows attackers.' },
  { name:'Frost Ring',         icon:'💍', type:'ring',    effect:'flee', desc:'Leaves no footprints. Makes fleeing easier.' },
  { name:'Ice Shard',          icon:'🧊', type:'gem',     gold:17,      desc:'A perfect ice formation. Worth 17 gold.' },
  { name:'Void Potion',        icon:'🌑', type:'potion',  heal:38,      desc:'From the deep dark below the ice. Restores 38 HP.' },
  { name:'Void Elixir',       icon:'🌑', type:'elixir',  healPct:0.65, desc:'Restores 65% of max HP. Brewed from the abyss itself.' }
];

// ── FROSTHOLD SHOP STOCK ──
var FROST_SHOP_STOCK = [
  { name:'Glacier Potion',      icon:'🧪', type:'potion', heal:45,  cost:14, desc:'Restores 45 HP.' },
  { name:'Greater Frost Potion',icon:'💊', type:'potion', heal:85,  cost:25, desc:'Restores 85 HP.' },
  { name:'Frozen Blade',        icon:'🗡️', type:'weapon', atkBonus:6, cost:32, desc:'+6 attack damage.' },
  { name:'Glacial Ward',        icon:'🛡️', type:'armor',  defBonus:4, cost:28, desc:'Reduces damage by 4.' },
  { name:'Void Elixir',         icon:'🌑', type:'heal',  healPct:0.65, cost:38, desc:'Restores 65% of max HP instantly.' },
  { name:'Frost Ring',          icon:'❄️', type:'ring',  effect:'flee', cost:20, desc:'Guarantees next flee attempt succeeds.' }
];


