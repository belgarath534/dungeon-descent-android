//═════════════════
// DEATH CINEMATIC SYSTEM
//═════════════════

var DEATH_LINES = {
  'Crypt of Malachar': {
    early:  [ // floors 1-3
      'The Crypt was always going to win. It has had a thousand years of practice.',
      'The dead here have seen this before. They are not impressed.',
      'Malachar did not even notice. The Crypt is patient.',
      'The bones on the floor shifted to make room. They have done this many times.',
      'The silence returned before you finished falling.',
    ],
    mid:    [ // floors 4-6
      'You made it deeper than most. The Crypt acknowledges this by doing nothing.',
      'The undead carry you to the entrance without ceremony. They have a system.',
      'Floor {floor}. Malachar counted. He does not look up from his work.',
      'You were close. The Crypt disagrees with your definition of close.',
      'The torches burned on after you fell. They always do.',
    ],
    late:   [ // floors 7-9
      'Floor {floor}. The boss could hear your footsteps. It was ready.',
      'You reached the deep Crypt. Almost no one does. That is the only comfort available.',
      'The ancient dead watched you fall. They respected the effort. They will not remember your name.',
      'So close. The Crypt has heard that before. It is unmoved.',
    ],
    boss:   [
      'Malachar has stood since the first age. You are not the first to challenge him. You are not the last.',
      'The Undying King endures. You did not. This is the natural order of the Crypt.',
      'Malachar returned to his throne. Your name was not added to his records.',
    ],
  },
  'The Ashbound Wastes': {
    early:  [
      'The fire did not notice you leave. It was busy.',
      'The Wastes absorbed you. This is what they do.',
      'Ash to ash. The Wastes appreciate the symmetry.',
      'The heat was waiting for you. It waited until floor {floor}.',
      'You burned. The Wastes continued burning. No difference was noted.',
    ],
    mid:    [
      'Floor {floor}. The Wastes have claimed stronger than you.',
      'The fire has been burning for a thousand years. You lasted {floor} floors. The math is unkind.',
      'Something in the Wastes made a sound that might have been a laugh. You will never know.',
      'The ash settled over you. It settles over everything eventually.',
    ],
    late:   [
      'The Eternal Pyre was visible from where you fell. You almost reached it.',
      'Floor {floor}. The heat at this depth breaks stone. You lasted longer than stone.',
      'The oldest fire in the world watched you fall. It has watched everything fall.',
    ],
    boss:   [
      'The Eternal Pyre burns on. It has always burned. It will always burn. You did not change this.',
      'The Ashen King rules still. The Wastes are unchanged. The fire did not mourn you.',
      'You reached the source of the fire. The fire was not grateful.',
    ],
  },
  'Frosthold Abyss': {
    early:  [
      'The cold took you on floor {floor}. It takes everyone eventually.',
      'The Abyss is patient. The cold is patient. You were not patient enough.',
      'The ice sealed over the gap you left. The Abyss does not leave gaps.',
      'The frozen dead watched you fall. They have been watching this place for centuries.',
      'The cold did not hurry. It never hurries. It simply waits.',
    ],
    mid:    [
      'Floor {floor}. The cold gets heavier the deeper you go. You found that out.',
      'The Abyss swallowed you quietly. It swallows everything quietly.',
      'Something frozen and ancient noted your passing. Then returned to waiting.',
      'The ice closed. The silence returned. Nothing changed in the Frosthold Abyss.',
    ],
    late:   [
      'So deep. The cold at floor {floor} is a different kind of cold. You know that now.',
      'The Frozen King was one floor away. You almost reached the bottom of the world.',
      'The Abyss acknowledges floor {floor}. It acknowledges nothing else.',
    ],
    boss:   [
      'The Eternal Winter endures. Winter always endures. Spring does not reach the Abyss.',
      'The Frozen King has ruled since before the Abyss had a name. You did not end his reign.',
      'The cold is permanent. Your run was not. The Abyss observes the difference.',
    ],
  },
  'The Sunken Archives': {
    early:  [
      'The Archives have recorded millions of deaths. Yours is entry {kills} this century.',
      'The drowned scholars noted your passing. They file everything.',
      'The water closed over floor {floor}. It closes over everything down here.',
      'You are in the Archives now. The entry is brief. The filing system is meticulous.',
      'The ink in the Archives never dries. Your name has been added. In the margin.',
    ],
    mid:    [
      'Floor {floor}. The Archives record this. They record everything.',
      'A drowned librarian retrieved your belongings. They will be catalogued.',
      'The Archives absorb everything that enters and does not leave. You are part of the collection now.',
      'The water is very still at floor {floor}. You found out why.',
    ],
    late:   [
      'The restricted section was close. The Archives do not let anyone reach the restricted section.',
      'Floor {floor}. The Head Archivist has seen stronger challengers. He has filed them all.',
      'Whatever is in the deepest stacks of the Archives, you did not reach it. It is still there.',
    ],
    boss:   [
      'The Sunken Archives have stood since the world had a different shape. You did not reshape them.',
      'The Head Archivist returns to his work. Your file has been sealed.',
      'The Archives are patient. They have time. All the time in the world, at the bottom of the world.',
    ],
  },
  'The Hollow': {
    early:  [
      'The house was not finished with you on floor {floor}. The house is never finished.',
      'Something in the Hollow smiled. You did not see it. You were already falling.',
      'The candles burned on. They always burn in the Hollow. You just could not see them anymore.',
      'The Hollow absorbed you quietly. It has practice.',
      'A door closed somewhere in the house. You had nothing to do with it. The house just closes doors.',
    ],
    mid:    [
      'Floor {floor}. The Hollow had been watching since you arrived. It was not in a hurry.',
      'The portraits in the hall all turned to face the same direction. Away from where you fell.',
      'The music box played one note, then stopped. Then the Hollow went quiet.',
      'Something in the house made a sound like breathing. Then it stopped. Then there was only you, falling.',
      'The Hollow keeps what it takes. It has kept many things.',
    ],
    late:   [
      'So deep in the house. The rooms at floor {floor} have not had a living visitor in decades.',
      'The Last Resident was one floor below. The house knew. The house was patient.',
      'You could hear something at the bottom of the stairs. You almost found out what it was.',
      'The Hollow gives floor {floor} to very few. It takes them all back eventually.',
    ],
    boss:   [
      'The House Itself endures. Houses outlast everything. They outlasted you.',
      'The Last Resident has always been here. Will always be here. You were a visitor.',
      'The Hollow is quiet again. It prefers quiet. It prefers to be alone with its dead.',
    ],
    medusa: [
      'You met her eyes. The house was the last thing you saw. The Hollow has a new statue.',
      'She did not mean to. She never means to. The Hollow has a new addition to its collection.',
      'Stone. Cold. Still. The Hollow preferred you this way.',
    ],
    lord_phorcys: [
      'Lord Phorcys found what he was looking for. It was not his daughter.',
      'He was not angry. Just broken. You were simply in the way.',
      'He has been walking the Hollow for years. He will keep walking.',
    ],
    weeping_child: [
      'The child you woke is still crying somewhere in the Hollow. It will cry for a long time.',
      'You found the child but could not comfort it. The Hollow noticed. The Hollow always notices.',
      'The Weeping Child watched you fall. It has seen this before. Everyone falls eventually.',
    ],
    music_box: [
      'The melody played to the empty room after you fell. Three ticks. Then silence.',
      'The Music Box wound itself again. It always does. It played for no one.',
      'The melody of the Music Box was the last thing you heard. It was not comforting.',
    ],
    oldest_guest: [
      'The Oldest Guest has been here since before the house had a name. You were not the first. You will not be the last.',
      'The Oldest Guest does not hurry. He has time. All the time in the world, in that house.',
      'He was sitting in the same chair when you arrived. He will be sitting there long after.',
    ],
  },
  'The Whispering Forest': {
    early: [
      'The Forest whispered your name on floor {floor}. You should not have stopped to listen.',
      'The trees remember everything that happens between them. They will remember you.',
      'Something in the undergrowth watched you fall. It had been watching since you entered.',
      'The Forest is patient. It has been here longer than the paths through it.',
      'The whispers were not warning you. They were describing you. Past tense.',
    ],
    mid: [
      'Floor {floor}. The Forest had been narrowing the path since you arrived.',
      'The canopy closed over where you fell. By morning no light will reach that spot.',
      'The roots moved after. They always move after. The Forest prefers things tidy.',
      'A bird called somewhere above. Then silence. The Forest went back to whispering.',
      'The corruption was never the enemy. The Forest was always the enemy.',
    ],
    late: [
      'This deep in the Forest the trees have names. They know yours now.',
      'Floor {floor}. The witch\'s curse found you eventually. It finds everyone eventually.',
      'The path closed behind you weeks ago. You just did not notice until now.',
      'Something ancient in the wood exhaled. It had been holding its breath since you entered.',
    ],
    boss: [
      'The Forest endures. It was here before the witch. It will be here after you.',
      'Seraphine does not die. She waits. She has been waiting longer than the Forest has had a name.',
      'The Corrupter was never an enemy you could fight. It is the Forest. And the Forest won.',
    ],
  },
  'The Infernal Descent': {
    early: [
      'The void on floor {floor} had been waiting for something to fill it. It found you.',
      'The Descent swallowed you quietly. It has had practice.',
      'The darkness here is not an absence of light. It is a substance. You fell into it.',
      'Something in the void noted your passing. It did not care. Nothing here cares.',
      'The Descent goes deeper. You simply stopped going with it.',
    ],
    mid: [
      'Floor {floor}. The void gets heavier the further down you go. You found the weight of it.',
      'The things that live here do not sleep. They watched you fall without expression.',
      'The Descent did not notice you leave. It does not notice anything. It simply is.',
      'The darkness closed over where you had been standing. Perfectly.',
      'You lasted longer than most. The void has seen many. It will see many more.',
    ],
    late: [
      'This deep in the Descent the void has texture. You fell through several layers of it.',
      'Floor {floor}. The Architect was one floor below. It knew you were coming.',
      'Something in the dark exhaled. Whether in hunger or satisfaction, there was no way to know.',
      'The Descent keeps going below where you fell. It keeps going for a very long time.',
    ],
    boss: [
      'The Architect built this place. It is still building. You were never more than material.',
      'The Hard Void has existed since before the concept of light. You were a brief interruption.',
      'The void reasserted itself. It always does. It is very patient about these things.',
    ],
  },
  'The Abyssal Deep': {
    early: [
      'The water on floor {floor} closed over you without a sound. The Deep does not make speeches.',
      'The pressure down here changes things. It changed you. Permanently.',
      'Something vast moved in the water below where you fell. It did not stop moving.',
      'The Deep has been swallowing things since before the surface existed. You were not exceptional.',
      'The current took you. The current takes everything eventually.',
    ],
    mid: [
      'Floor {floor}. The light stopped reaching this far down a long time ago.',
      'The creatures of the Deep watched without eyes. They sense pressure. They sensed you stop.',
      'The water here is cold in a way that is not about temperature. You found that out.',
      'The Leviathan turned, somewhere below. It felt the ripple of your falling.',
      'The Deep is very quiet now. It was quiet before you arrived. It is quiet again.',
    ],
    late: [
      'This close to the bottom. The pressure is not something you survive. Most of the time.',
      'Floor {floor}. The Leviathan was one floor below. Four thousand years old and patient.',
      'The void at the bottom of the ocean is different from other voids. Wetter. You found out.',
      'Something ancient in the Deep exhaled. Bubbles rose past where you fell. They made it to the surface.',
    ],
    boss: [
      'The Leviathan is four thousand years old. It has outlasted everything that has tried to end it. Including you.',
      'The Deep reclaimed you. It reclaims everything. The ocean is patient in the way that only oceans can be.',
      'The Leviathan sank back into the abyss. It will be there when the next one comes. It is always there.',
    ],
  },
};

function getDeathCinematicLine(killerName, floor, dungeon, kills) {
  var lines = DEATH_LINES[dungeon];
  if (!lines) lines = DEATH_LINES['Crypt of Malachar'];

  // Special killer lines
  if (dungeon === 'The Hollow') {
    if (killerName === 'Medusa' && lines.medusa) {
      return pick(lines.medusa);
    }
    if (killerName === 'Lord Phorcys' && lines.lord_phorcys) {
      return pick(lines.lord_phorcys);
    }
    if (killerName === 'The Weeping Child' && lines.weeping_child) {
      return pick(lines.weeping_child);
    }
    if (killerName === 'The Music Box' && lines.music_box) {
      return pick(lines.music_box);
    }
    if (killerName === 'The Oldest Guest' && lines.oldest_guest) {
      return pick(lines.oldest_guest);
    }
  }

  // Boss lines
  var bossNames = ['Malachar','The Eternal Pyre','The Eternal Winter','The Last Resident',
    'The House Itself','The Grieving One','The Head Archivist','The Void Below'];
  var isBoss = bossNames.some(function(b){ return killerName && killerName.indexOf(b) !== -1; });
  if (isBoss && lines.boss) return pick(lines.boss);

  // Floor range
  var pool = floor <= 3 ? lines.early : floor <= 6 ? lines.mid : lines.late;
  if (!pool || pool.length === 0) pool = lines.early;
  var line = pick(pool);

  // Replace tokens
  line = line.replace('{floor}', floor);
  line = line.replace('{kills}', kills || 0);
  return line;
}

function showDeathCinematic(callback) {
  try {
    var dungeon = DS.dungeon || 'Crypt of Malachar';
    var floor = DS.floor || 1;
    var killer = DS.enemy ? DS.enemy.name : 'the dungeon';
    var kills = DS.kills || 0;
    var charDesc = DS.name + ' — ' + DS.race + ' ' + DS.cls;
    var line = '';
    try { line = getDeathCinematicLine(killer, floor, dungeon, kills); } catch(e) { line = 'The dungeon claims another.'; }
    var ov = document.getElementById('death-cinematic');
    if (!ov) { if (callback) callback(); return; }
    var dcFloor = document.getElementById('dc-floor');
    var dcLine = document.getElementById('dc-line');
    var dcChar = document.getElementById('dc-char');
    var dcKiller = document.getElementById('dc-killer');
    if (dcFloor) dcFloor.textContent = dungeon.toUpperCase() + ' · FLOOR ' + floor;
    if (dcLine) dcLine.textContent = line;
    if (dcChar) dcChar.textContent = charDesc;
    if (dcKiller) dcKiller.textContent = 'Slain by ' + killer + ' · ' + kills + ' enemies defeated';
    // Add tap-to-continue hint
    var tapHint = document.getElementById('dc-tap-hint');
    if (!tapHint) {
      tapHint = document.createElement('div');
      tapHint.id = 'dc-tap-hint';
      tapHint.setAttribute('role', 'button');
      tapHint.setAttribute('tabindex', '0');
      tapHint.setAttribute('aria-label', 'Tap to continue to run summary');
      tapHint.style.cssText = 'font-family:Cinzel,serif;font-size:0.55rem;letter-spacing:0.3em;color:rgba(255,255,255,0.3);margin-top:32px;cursor:pointer;';
      tapHint.textContent = '· TAP TO CONTINUE ·';
      ov.appendChild(tapHint);
    }
    ov.classList.add('show');
    try { say(line + ' ' + charDesc + '. Slain by ' + killer + ' on floor ' + floor + '. Tap to continue.'); } catch(e) {}

    var _done = false;
    function finish() {
      if (_done) return;
      _done = true;
      try { ov.classList.remove('show'); } catch(e) {}
      if (callback) callback();
    }

    // Auto-advance after 5.5s
    var _timer = setTimeout(finish, 5500);

    // Tap to skip — critical for Safari iOS where setTimeout gets killed
    ov.onclick = function() { clearTimeout(_timer); finish(); };
    ov.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { clearTimeout(_timer); finish(); } };

  } catch(e) {
    console.error('[DD Death] showDeathCinematic crashed:', e.message);
    if (callback) callback();
  }
}


//═════════════════
// CHARACTER BACKSTORY SYSTEM
//═════════════════
var BACKSTORIES = [
  { id:'exiled-noble',    name:'Exiled Noble',     bonus:'+15 starting gold',      bonusKey:'gold',    bonusVal:15,  desc:'Cast out from court. The dungeon is preferable to the shame.',   journal:'I was a noble once. The title meant something. The dungeon does not care about titles.' },
  { id:'cursed-wanderer', name:'Cursed Wanderer',  bonus:'+10 max HP',             bonusKey:'hp',      bonusVal:10,  desc:'Something followed you home. You went to the dungeon to lose it.', journal:'The curse has been with me since the crossroads. Maybe the dungeon will take it instead of me.' },
  { id:'former-soldier',  name:'Former Soldier',   bonus:'+2 starting defense',    bonusKey:'def',     bonusVal:2,   desc:'The war ended. The fighting did not.',                            journal:'Fifteen years of orders. Now there are no orders. I choose the dungeon.' },
  { id:'lost-scholar',    name:'Lost Scholar',     bonus:'+20% XP this run',       bonusKey:'xp',      bonusVal:0.2, desc:'You read about the dungeon in seventeen books. None of them helped.',journal:'I have studied every known account of the descent. Theory, I am finding, is different from practice.' },
  { id:'debt-collector',  name:'Debt Collector',   bonus:'+25 starting gold',      bonusKey:'gold',    bonusVal:25,  desc:'The dungeon owes someone money. You are here to collect.',         journal:'The client said the dungeon has treasure. The client did not say what the dungeon has in return.' },
  { id:'true-believer',   name:'True Believer',    bonus:'+1 extra life',          bonusKey:'lives',   bonusVal:1,   desc:'Your faith is absolute. The dungeon will test it.',               journal:'I believe I will survive. The dungeon does not know this yet.' },
  { id:'nobody-special',  name:'Nobody Special',   bonus:'No bonus. Just honest.',  bonusKey:'none',    bonusVal:0,   desc:'No dramatic backstory. Just someone who opened the door.',        journal:'I am not here for glory or treasure or redemption. I am here because I opened the door and kept walking.' },
  { id:'last-hope',       name:'Last Hope',        bonus:'+5 SP per level up',     bonusKey:'sp',      bonusVal:5,   desc:'Everything was tried. The dungeon is what remains.',             journal:'This is the last option available to me. I am aware of the odds.' },
];

var _selectedBackstory = null;

function renderBackstoryGrid() {
  var grid = document.getElementById('backstory-grid');
  if (!grid) return;
  grid.innerHTML = '';
  BACKSTORIES.forEach(function(b) {
    var card = document.createElement('div');
    card.className = 'backstory-card' + (_selectedBackstory === b.id ? ' selected' : '');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'radio');
    card.setAttribute('aria-checked', _selectedBackstory === b.id ? 'true' : 'false');
    card.setAttribute('aria-label', b.name + '. ' + b.desc + '. Bonus: ' + b.bonus);
    card.innerHTML = '<div class="backstory-name">' + b.name + '</div>' +
      '<div class="backstory-desc">' + b.desc + '</div>' +
      '<div class="backstory-bonus">✦ ' + b.bonus + '</div>';
    card.onclick = function() { selectBackstory(b.id); };
    card.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectBackstory(b.id); } };
    grid.appendChild(card);
  });
}

function selectBackstory(id) {
  _selectedBackstory = id;
  renderBackstoryGrid();
  var b = BACKSTORIES.find(function(x){ return x.id === id; });
  if (b) {
    var sn = document.getElementById('bk-slider-name'); if(sn) sn.textContent = b.name;
    var sd = document.getElementById('bk-slider-desc'); if(sd) sd.textContent = b.bonus;
    say(b.name + ' selected. ' + b.desc + '. Bonus: ' + b.bonus);
  }
}

var _bkIdx = 0;
function stepBk(dir) {
  _bkIdx = (_bkIdx + dir + BACKSTORIES.length) % BACKSTORIES.length;
  var b = BACKSTORIES[_bkIdx];
  selectBackstory(b.id);
  var slider = document.getElementById('bk-slider');
  if (slider){ slider.setAttribute('aria-valuenow',_bkIdx); slider.setAttribute('aria-valuetext', b.name + ' — ' + b.bonus); }
}

// An origin's bonus, every time a run starts.
function applyBackstoryToRun(ch) {
  if (!ch || !ch.backstory || typeof BACKSTORIES === 'undefined') return;
  var b = BACKSTORIES.find(function(x){ return x.id === ch.backstory; });
  if (!b) return;
  // A resumed run gets its saved stats back; only the per-level effects need setting.
  if (hasMidRunSave(ch)) {
    if (b.bonusKey === 'sp') DS.backstorySPBonus = b.bonusVal;
    if (b.bonusKey === 'xp') DS.backstoryXPBonus = 0.2;
    return;
  }
  if (b.bonusKey === 'gold') { DS.gold += b.bonusVal; addGlobalGold(b.bonusVal); }
  if (b.bonusKey === 'hp') { DS.maxHp += b.bonusVal; DS.hp = Math.min(DS.maxHp, DS.hp + b.bonusVal); }
  if (b.bonusKey === 'def') DS.defBonus += b.bonusVal;
  if (b.bonusKey === 'lives') { DS.lives += b.bonusVal; DS.maxLives = (DS.maxLives||1) + b.bonusVal; }
  if (b.bonusKey === 'sp') { DS.backstorySPBonus = b.bonusVal; DS.maxSp += b.bonusVal; DS.sp = Math.min(DS.maxSp, DS.sp + b.bonusVal); }
  if (b.bonusKey === 'xp') DS.backstoryXPBonus = 0.2;
}
// The stat lines on the race cards ("+AGI +INT", "+STR+STR -DEF" …) were never
// applied, Golems had no code at all, and Vampires, Goblins and Angels missed
// their extras. Each "+STAT" is one level point on that stat; "-STAT" takes one away.
var RACE_STAT_IDS = { STR:'strength', AGI:'agility', INT:'intelligence', DEF:'defense', LCK:'luck', STA:'stamina' };
function applyRaceStats(ch) {
  if (!ch) return;
  // Abilities are flags (kept on a resumed run); the stats are saved with the run
  DS.golemRace = ch.race === 'Golem';
  DS.angelRace = ch.race === 'Angel';
  if (hasMidRunSave(ch)) return;
  var desc = (typeof _raceDescs !== 'undefined' && _raceDescs[ch.race]) || '';
  var lp = function(id, sign) {
    var st = LP_STATS.find(function(s){ return s.id === id; });
    if (!st) return;
    if (sign > 0) { st.apply(); return; }
    if (id === 'strength') DS.atkBonus = (DS.atkBonus || 0) - 2;
    else if (id === 'defense') DS.defBonus = Math.max(0, (DS.defBonus || 0) - 2);
    else if (id === 'agility') { DS.fleeBonus = (DS.fleeBonus || 0) - 0.05; DS.critBonus = (DS.critBonus || 0) - 0.03; }
    else if (id === 'luck') DS.luckBonus = (DS.luckBonus || 0) - 0.10;
  };
  if (ch.race === 'Human') { ['strength','stamina','intelligence'].forEach(function(id){ lp(id, 1); }); }
  else if (ch.race !== 'Halfling') { // (the Halfling's luck and strength are already applied above)
    var re = /([+-])(STR|AGI|INT|DEF|LCK|STA)/g, m;
    while ((m = re.exec(desc))) lp(RACE_STAT_IDS[m[2]], m[1] === '+' ? 1 : -1);
  }
  if (!ACCESS.classTraits) return;
  if (ch.race === 'Golem') DS.defBonus = (DS.defBonus || 0) + 5;
  if (ch.race === 'Vampire') { DS.maxHp = Math.round(DS.maxHp * 0.80); DS.hp = Math.min(DS.hp, DS.maxHp); }
  if (ch.race === 'Goblin') { DS.gold += 30; addGlobalGold(30); }
}

// Seasonal shop rewards saved "for your next run" (nothing ever read them).
function applyNextRunRewards(ch) {
  if (!ch || hasMidRunSave(ch)) return;
  // "In a single run" bounties added up across every run
  try {
    var _bd = getBountyData();
    if (_bd.activeBounty && _bd.activeBounty.type === 'kill_count' && !_bd.bountyComplete && _bd.bountyProgress) { _bd.bountyProgress = 0; saveBountyData(_bd); }
  } catch (eB) {}
  // Void code "2x XP for your next run" saved a flag nothing read
  if (DDStore.getItem('dd_code_xp_boost')) {
    DDStore.removeItem('dd_code_xp_boost');
    DS._xpBoost = { mult: 2, floors: 99 };
    addLog('⚡ Reward code: 2x XP this run.');
  }
  if (DDStore.getItem('dd_bonus_life')) {
    DDStore.removeItem('dd_bonus_life');
    DS.lives += 1; DS.maxLives += 1;
    addLog('😈 Demon Revival: +1 life this run.');
  }
  var xb = _jsonParseSafe(DDStore.getItem('dd_xp_boost'), 'null');
  if (xb && xb.mult > 1 && xb.floors > 0) {
    DDStore.removeItem('dd_xp_boost');
    DS._xpBoost = { mult: xb.mult, floors: xb.floors };
    addLog('📜 ' + xb.mult + 'x XP for your next ' + xb.floors + ' floors.');
  }
  if (DDStore.getItem('dd_spirit_boost')) {
    DS._spiritBoost = parseFloat(DDStore.getItem('dd_spirit_boost')) || 2;
    DDStore.removeItem('dd_spirit_boost');
    addLog('🌟 Elf Blessing: your spirit deals double damage this run.');
  }
  if (DDStore.getItem('dd_sparkler_buff')) {
    DDStore.removeItem('dd_sparkler_buff');
    DS._sparklerAtk = true;
    addLog('✨ Sparkler: +30% attack this run.');
  }
  var mod = DDStore.getItem('dd_pending_run_mod');
  if (mod) {
    DDStore.removeItem('dd_pending_run_mod');
    var dm = DAILY_MODIFIERS_POOL.find(function(m){ return m.id === mod; });
    if (dm) { dm.apply(); addLog('💀 Cursed Modifier: ' + dm.name + ' — ' + dm.desc); }
  }
}

// homeSleep's dream, on the run after the one you slept in.
function applyPendingDream(ch) {
  if (!ch || !ch.pendingDream || hasMidRunSave(ch) || typeof HOME_DREAMS === 'undefined') return;
  var dream = HOME_DREAMS.find(function(d){ return d.id === ch.pendingDream; });
  ch.pendingDream = null;
  saveChars();
  if (!dream || !dream.apply) return;
  dream.apply();
  // Turn the dream's flags into stats, as initDungeon does.
  if (DS.dreamAtkBonus) { DS.atkBonus = (DS.atkBonus||0) + DS.dreamAtkBonus; DS.dreamAtkBonus = 0; }
  if (DS.dreamDefBonus) { DS.defBonus = (DS.defBonus||0) + DS.dreamDefBonus; DS.dreamDefBonus = 0; }
  if (DS.dreamSpBonus) { DS.maxSp = (DS.maxSp||20) + DS.dreamSpBonus; DS.sp = DS.maxSp; DS.dreamSpBonus = 0; }
  if (DS.dreamPotionBoost) { DS.potionMult = (DS.potionMult||1) * (1 + DS.dreamPotionBoost); DS.dreamPotionBoost = 0; }
  if (DS.dreamFleeBonus) { DS.fleeBonus = (DS.fleeBonus||0) + DS.dreamFleeBonus; DS.dreamFleeBonus = 0; }
  addLog('💭 ' + dream.title + ' — ' + dream.buff);
}
(function() {
  var _baseInitDungeon = initDungeon;
  initDungeon = function(ch) {
    var r = _baseInitDungeon.apply(this, arguments);
    // One wandering NPC per run (the flag was never reset, so it was one per app launch)
    if (typeof _npcEncounterUsed !== 'undefined') _npcEncounterUsed = false;
    try { applyBackstoryToRun(ch); } catch (e) {}
    try { applyPendingDream(ch); } catch (e) {}
    try { applyNextRunRewards(ch); } catch (e) {}
    try { applyRaceStats(ch); } catch (e) {}
    if (ch && ch.spellBook) DS.spellBook = true;
    return r;
  };
})();

function applyBackstory(ch) {
  if (!_selectedBackstory) return;
  var b = BACKSTORIES.find(function(x){ return x.id === _selectedBackstory; });
  if (!b) return;
  ch.backstory = b.id;
  ch.backstoryName = b.name;
  // Save backstory to character permanently
  if (_charIdx !== null && CHARS[_charIdx]) {
    CHARS[_charIdx].backstory = b.id;
    CHARS[_charIdx].backstoryName = b.name;
    saveChars();
  }
  // The bonus is applied when each run starts (applyBackstoryToRun). Applying
  // it here changed the previous run's state, so it never reached the player.
  // Write first journal entry
  addJournalEntry(b.journal);
  say('Backstory: ' + b.name + '. ' + b.desc + '. Bonus: ' + b.bonus);
}


//═════════════════
// HALL OF LEGENDS
//═════════════════
function getLegends() {
  try { return _jsonParseSafe(DDStore.getItem('dd_legends'), '{}'); } catch(e) { return {}; }
}
function saveLegends(l) { try { DDStore.setItem('dd_legends', JSON.stringify(l)); } catch(e) { console.warn('[DD] saveLegends failed:', e); } }

function updateLegend(key, data) {
  try {
    var l = getLegends();
    l[key] = data;
    saveLegends(l);
  } catch(e) { console.warn('[DD] updateLegend failed:', e); }
}

function checkLegends() {
  try {
    var l = getLegends();
    var changed = false;
    // Best kill run
    if (!l.bestKills || DS.kills > (l.bestKills.kills||0)) {
      l.bestKills = { kills:DS.kills, name:DS.name, cls:DS.cls, race:DS.race, dungeon:DS.dungeon, diff:DS.diff };
      changed = true;
    }
    // Best gold run
    if (!l.bestGold || DS.gold > (l.bestGold.gold||0)) {
      l.bestGold = { gold:DS.gold, name:DS.name, cls:DS.cls, race:DS.race, dungeon:DS.dungeon };
      changed = true;
    }
    // Deepest floor (non-boss)
    if (!l.deepestFloor || DS.floor > (l.deepestFloor.floor||0)) {
      l.deepestFloor = { floor:DS.floor, name:DS.name, cls:DS.cls, race:DS.race, dungeon:DS.dungeon };
      changed = true;
    }
    // Best damage hit
    if (DS.bestDmgThisRun && (!l.bestDmg || DS.bestDmgThisRun > (l.bestDmg.dmg||0))) {
      l.bestDmg = { dmg:DS.bestDmgThisRun, name:DS.name, cls:DS.cls, dungeon:DS.dungeon };
      changed = true;
    }
    if (changed) saveLegends(l);
  } catch(e) { console.warn('[DD] checkLegends failed:', e); }
}

function recordDungeonFirstClear(dungeon, charName, cls, race) {
  try {
    var l = getLegends();
    if (!l.firstClears) l.firstClears = {};
    if (!l.firstClears[dungeon]) {
      l.firstClears[dungeon] = { name:charName, cls:cls, race:race, date:todayKey() };
      saveLegends(l);
    }
  } catch(e) { console.warn('[DD] recordDungeonFirstClear failed:', e); }
}

function renderLegendsPanel() {
  var panel = document.getElementById('gs-legends-panel');
  if (!panel) return;
  var l = getLegends();

  function legendRow(icon, title, val, detail) {
    return '<div style="background:var(--bg-panel);border:1px solid var(--border-dim);border-left:3px solid var(--gold-dim);padding:12px 16px;margin-bottom:8px;" tabindex="0" aria-label="' + title + ': ' + val + '">' +
      '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--gold-dim);letter-spacing:0.2em;margin-bottom:4px;">' + icon + ' ' + title + '</div>' +
      '<div style="font-family:Cinzel Decorative,cursive;font-size:1.1rem;color:var(--gold);">' + val + '</div>' +
      (detail ? '<div style="font-size:0.72rem;color:var(--text-dim);margin-top:3px;">' + detail + '</div>' : '') +
    '</div>';
  }

  var html = '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--gold-dim);letter-spacing:0.3em;margin-bottom:14px;">YOUR GREATEST MOMENTS — SAVED FOREVER</div>';

  if (l.bestKills) html += legendRow('⚔️','MOST ENEMIES IN ONE RUN', l.bestKills.kills + ' kills', l.bestKills.name + ' · ' + l.bestKills.race + ' ' + l.bestKills.cls + ' · ' + l.bestKills.dungeon);
  else html += legendRow('⚔️','MOST ENEMIES IN ONE RUN','—','Complete a run to set this record.');

  if (l.bestGold) html += legendRow('🪙','MOST GOLD IN ONE RUN', l.bestGold.gold + 'g', l.bestGold.name + ' · ' + l.bestGold.race + ' ' + l.bestGold.cls);
  else html += legendRow('🪙','MOST GOLD IN ONE RUN','—','Complete a run to set this record.');

  if (l.deepestFloor) html += legendRow('🗺️','DEEPEST FLOOR REACHED', 'Floor ' + l.deepestFloor.floor, l.deepestFloor.name + ' · ' + l.deepestFloor.dungeon);
  else html += legendRow('🗺️','DEEPEST FLOOR REACHED','—','Enter a dungeon to set this record.');

  if (l.bestDmg) html += legendRow('💥','HIGHEST SINGLE HIT', l.bestDmg.dmg + ' damage', l.bestDmg.name + ' · ' + l.bestDmg.dungeon);
  else html += legendRow('💥','HIGHEST SINGLE HIT','—','Deal damage in combat to set this record.');

  // First clears
  var dungeons = ['Crypt of Malachar','The Ashbound Wastes','Frosthold Abyss','The Sunken Archives','The Hollow','The Whispering Forest','The Infernal Descent','The Abyssal Deep'];
  var fc = l.firstClears || {};
  html += '<div style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--gold-dim);letter-spacing:0.3em;margin:16px 0 10px;">FIRST COMPLETIONS</div>';
  dungeons.forEach(function(d) {
    if (fc[d]) {
      html += legendRow('👑', d.toUpperCase(), fc[d].name, fc[d].race + ' ' + fc[d].cls + ' · ' + fc[d].date);
    } else {
      html += legendRow('🔒', d.toUpperCase(), 'Not yet conquered', 'Complete this dungeon to claim the first clear record.');
    }
  });

  panel.innerHTML = html;
  var entries = Object.keys(l).length;
  say('Hall of Legends. ' + entries + ' records set. Your greatest moments preserved forever.');
}

function gsTab(tab) {
  ['stats','awards','legends'].forEach(function(t) {
    var btn = document.getElementById('gs-tab-' + t);
    var panel = document.getElementById('gs-' + t + '-panel');
    if (btn) { btn.classList.toggle('active', t === tab); btn.setAttribute('aria-selected', t === tab ? 'true' : 'false'); }
    if (panel) panel.style.display = t === tab ? '' : 'none';
  });
  if (tab === 'legends') renderLegendsPanel();
  if (tab === 'stats') say('Stats tab. Your lifetime statistics.');
  if (tab === 'awards') say('Milestones tab. Your earned milestone rewards.');
}


//═════════════════
// JULIO QUESTLINE
//═════════════════
var JULIO_FRAGMENTS = [
  { id:'jf1', text:'A folded piece of paper. It reads: "Back at 3AM. — J"' },
  { id:'jf2', text:'A name tag. It says JULIO. Someone has written underneath in small letters: "still here."' },
  { id:'jf3', text:'A memo. "RE: Founding Charter signatures. I signed it because it was on my desk. I thought it needed a signature. — J"' },
  { id:'jf4', text:'A lunch schedule. 3AM to 3:15AM. Every day. The dungeon is listed as the lunch location.' },
  { id:'jf5', text:'A note. "The Department keeps asking where I am. I am right here. I am always right here. — Julio"' },
];

function getJulioFragments() {
  return _jsonParseSafe(DDStore.getItem('dd_julio_fragments'), '[]');
}
function saveJulioFragments(f) { DDStore.setItem('dd_julio_fragments', JSON.stringify(f)); }

function collectJulioFragment() {
  var collected = getJulioFragments();
  var remaining = JULIO_FRAGMENTS.filter(function(f){ return collected.indexOf(f.id) === -1; });
  if (remaining.length === 0) return null;
  var frag = remaining[Math.floor(Math.random() * remaining.length)];
  collected.push(frag.id);
  saveJulioFragments(collected);
  // Check if all collected
  if (collected.length >= JULIO_FRAGMENTS.length) {
    unlockJulioStory();
  }
  return frag;
}

function unlockJulioStory() {
  var unlocked = _jsonParseSafe(DDStore.getItem('dd_julio_story'), 'false');
  if (unlocked) return;
  DDStore.setItem('dd_julio_story', 'true');
  sfx('sfx-unlock');
  say('Julio questline complete. A new Library story has been unlocked. Check the Library.');
  showAchievementPopup({ icon:'🏷️', name:'Found Him', desc:'Collected all of Julio fragments. Read his story in the Library.' });
  awardScore('achievements', 500);
  incrementAchievementStat('julioStoryUnlocked', 1);
  checkAchievements();
}


//═════════════════
// MUSIC PLAYER
//═════════════════
var MUSIC_CATALOGUE = [
  { key:'menu',            label:'Dungeon Descent — Main Theme',              dungeon:'Main Menu' },
  { key:'floor1',          label:'Into the Dark — Crypt of Malachar',         dungeon:'Crypt of Malachar' },
  { key:'floor2',          label:'The Deeper Cold — Crypt of Malachar',       dungeon:'Crypt of Malachar' },
  { key:'floor3',          label:'Malachar\'s Reach — Crypt of Malachar',     dungeon:'Crypt of Malachar' },
  { key:'boss',            label:'The Undying King — Crypt Boss',             dungeon:'Crypt of Malachar' },
  { key:'battle',          label:'Bones and Shadows — Crypt Battle',          dungeon:'Crypt of Malachar' },
  { key:'ash1',            label:'Cinder Road — Ashbound Wastes',             dungeon:'The Ashbound Wastes' },
  { key:'ash2',            label:'Where the Flame Remembers — Ashbound',      dungeon:'The Ashbound Wastes' },
  { key:'ash3',            label:'The Pyre Eternal — Ashbound Wastes',        dungeon:'The Ashbound Wastes' },
  { key:'ash-boss',        label:'King of Ash — Ashbound Boss',               dungeon:'The Ashbound Wastes' },
  { key:'ash-battle',      label:'Ember and Iron — Ashbound Battle',          dungeon:'The Ashbound Wastes' },
  { key:'frost1',          label:'First Frost — Frosthold Abyss',             dungeon:'Frosthold Abyss' },
  { key:'frost2',          label:'The Blue Silence — Frosthold Abyss',        dungeon:'Frosthold Abyss' },
  { key:'frost3',          label:'Absolute Zero — Frosthold Abyss',           dungeon:'Frosthold Abyss' },
  { key:'frost-boss',      label:'The Frozen King — Frosthold Boss',          dungeon:'Frosthold Abyss' },
  { key:'frost-battle',    label:'Ice and Blood — Frosthold Battle',          dungeon:'Frosthold Abyss' },
  { key:'sunken1',         label:'Drowned Pages — Sunken Archives',           dungeon:'The Sunken Archives' },
  { key:'sunken2',         label:'The Weight of Water — Sunken Archives',     dungeon:'The Sunken Archives' },
  { key:'sunken3',         label:'The Final Chapter — Sunken Archives',       dungeon:'The Sunken Archives' },
  { key:'sunken-boss',     label:'Leviathan — Sunken Archives Boss',          dungeon:'The Sunken Archives' },
  { key:'sunken-battle',   label:'Ink and Tide — Sunken Battle',              dungeon:'The Sunken Archives' },
  { key:'hollow1',         label:'Something in the Walls — The Hollow',       dungeon:'The Hollow' },
  // 'hollow2' ("The House Remembers") omitted — see TRACK_FILES note above
  { key:'hollow3',         label:'No One Left — The Hollow',                  dungeon:'The Hollow' },
  { key:'hollow-boss',     label:'The Hollow Matron — Final Confrontation',   dungeon:'The Hollow' },
  { key:'hollow-battle',   label:'Grief Made Real — Hollow Battle',           dungeon:'The Hollow' },
  { key:'music-box',       label:'Lullaby for the Lost — Music Box',          dungeon:'The Hollow' },
  { key:'whisper1',        label:'The Forest Speaks — Whispering Forest',     dungeon:'The Whispering Forest' },
  { key:'whisper2',        label:'Old Growth — Whispering Forest',            dungeon:'The Whispering Forest' },
  { key:'whisper3',        label:'The Root and the Dark — Whispering Forest', dungeon:'The Whispering Forest' },
  { key:'whisper-boss',    label:'The Chimera — Final Hunt',                  dungeon:'The Whispering Forest' },
  { key:'whisper-battle',  label:'Thorn and Fang — Whispering Battle',        dungeon:'The Whispering Forest' },
  { key:'abyssal1',        label:'Into the Deep — The Abyssal Deep',              dungeon:'The Abyssal Deep' },
  { key:'abyssal2',        label:'Midnight Zone — The Abyssal Deep',             dungeon:'The Abyssal Deep' },
  { key:'abyssal3',        label:'The Leviathan Stirs — The Abyssal Deep',        dungeon:'The Abyssal Deep' },
  { key:'abyssal-boss',    label:'The Leviathan — Final Descent',                 dungeon:'The Abyssal Deep' },
  { key:'abyssal-battle',  label:'Deep Water — Abyssal Battle',                   dungeon:'The Abyssal Deep' },
  { key:'infernal1',       label:'Gates of Fire — The Infernal Descent',         dungeon:'The Infernal Descent' },
  { key:'infernal2',       label:'The Burning Below — The Infernal Descent',      dungeon:'The Infernal Descent' },
  { key:'infernal3',       label:'Void and Flame — The Infernal Descent',         dungeon:'The Infernal Descent' },
  { key:'infernal-boss',   label:'The Infernal King — Infernal Boss',             dungeon:'The Infernal Descent' },
  { key:'infernal-battle', label:'Hellfire — Infernal Battle',                    dungeon:'The Infernal Descent' },
  { key:'shadow1',         label:'3000 Years of Dark — The Shadow World',         dungeon:'The Shadow World' },
  { key:'shadow2',         label:'The Place That Wasn\'t — The Shadow World',     dungeon:'The Shadow World' },
  { key:'shadow3',         label:'Where You End — The Shadow World',              dungeon:'The Shadow World' },
  { key:'shadow-boss',     label:'The Shapeshifter — Final Reflection',           dungeon:'The Shadow World' },
  { key:'shadow-battle',   label:'Echo of a Fight — Shadow Battle',               dungeon:'The Shadow World' },
  { key:'shadow-stalker',  label:'Something Is Close — Stalker Floor',            dungeon:'The Shadow World' },
  { key:'raid',            label:'No Retreat — Daily Raid',                   dungeon:'Special' },
  { key:'raid-victory',    label:'Still Standing — Raid Victory',             dungeon:'Special' },
  { key:'void-reaper',     label:'The Void Stirs — Void Reaper Theme',        dungeon:'Special' },
  { key:'hunter-theme',    label:'Dark Investigation — Hunter Mode Theme',     dungeon:'Special' },
  { key:'afk',             label:'Endless Night — Endless Descent',           dungeon:'Special' },
  { key:'time-descender',  label:'The Last Tick — Time Descender',            dungeon:'Special' },
  { key:'menu-halloween',  label:'All Hallows — Halloween Menu',              dungeon:'Main Menu' },
  { key:'menu-birthday',   label:'Year One — Birthday Theme',                 dungeon:'Main Menu' },
  { key:'menu-christmas',  label:'Silent Descent — Christmas Menu',           dungeon:'Main Menu' },
  { key:'bestiary',        label:'The Archive of Darkness — Bestiary',        dungeon:'Special' },
  { key:'help',            label:'The Codex — Help Theme',                    dungeon:'Special' },
  { key:'chronicles',      label:'Lore of the Descent — Chronicles',          dungeon:'Special' },
  { key:'codex',           label:'The Nocturnia Spire — Codex Theme',         dungeon:'Special' },
  { key:'mine-explore',    label:'Depths Unknown — Mine Exploration',         dungeon:'The Mine' },
  { key:'hideseek-explore',label:'Something Waits — Hide and Seek',           dungeon:'Hide and Seek' },
  { key:'hideseek-chase',  label:'It Found You — Hide and Seek Chase',        dungeon:'Hide and Seek' },
  { key:'home',            label:'Hearthstone — Home Theme',                  dungeon:'Special' },
  { key:'time-eater',      label:'Blackmoor Colossus — The Time Eater',       dungeon:'The Spire' },
  { key:'credits',         label:'A Game by Leo — Credits Theme',             dungeon:'Special' },
];

var _mpCurrentKey = null;
var _mpPlaying = false;
var _mpAudio = null;
var _mpShuffle = false;

function mpGetAllKeys() {
  return MUSIC_CATALOGUE.filter(function(t){ return TRACK_FILES[t.key]; }).map(function(t){ return t.key; });
}

function mpNext() {
  var keys = mpGetAllKeys();
  if (!keys.length) return;
  if (_mpShuffle) {
    _mpCurrentKey = keys[Math.floor(Math.random() * keys.length)];
  } else {
    var idx = keys.indexOf(_mpCurrentKey);
    _mpCurrentKey = keys[(idx + 1) % keys.length];
  }
  mpUpdateNowPlaying();
  mpPlay();
}

function mpPrev() {
  var keys = mpGetAllKeys();
  if (!keys.length) return;
  if (_mpShuffle) {
    _mpCurrentKey = keys[Math.floor(Math.random() * keys.length)];
  } else {
    var idx = keys.indexOf(_mpCurrentKey);
    _mpCurrentKey = keys[(idx - 1 + keys.length) % keys.length];
  }
  mpUpdateNowPlaying();
  mpPlay();
}

function toggleMpShuffle() {
  _mpShuffle = !_mpShuffle;
  var btn = document.getElementById('mp-shuffle-btn');
  if (btn) {
    btn.textContent = '🔀 ' + (_mpShuffle ? 'On' : 'Off');
    btn.setAttribute('aria-pressed', _mpShuffle ? 'true' : 'false');
    btn.setAttribute('aria-label', 'Shuffle, currently ' + (_mpShuffle ? 'on' : 'off'));
  }
  say('Shuffle ' + (_mpShuffle ? 'on' : 'off') + '.');
}

function setMpVolume(val) {
  AUD.musicVol = val;
  if (AUD.musicGain) AUD.musicGain.gain.setValueAtTime(val, AUD.ctx.currentTime);
  if (_mpAudio && _mpAudio.volume !== undefined) _mpAudio.volume = val;
  saveAudioPrefs();
}

function mpUpdateNowPlaying() {
  var el = document.getElementById('mp-track-name');
  if (!el) return;
  if (!_mpCurrentKey) { el.textContent = 'Select a track below'; return; }
  var track = MUSIC_CATALOGUE.find(function(t){ return t.key === _mpCurrentKey; });
  el.textContent = track ? track.label : _mpCurrentKey;
}

function renderMusicPlayer() {
  var panel = document.getElementById('library-music-panel');
  if (!panel) return;
  panel.innerHTML = '';

  // Player controls
  var player = document.createElement('div');
  player.className = 'music-player';
  player.innerHTML =
    '<div class="mp-now-playing" role="heading" aria-level="2" aria-label="Music Player — Now Playing section">NOW PLAYING</div>' +
    '<div class="mp-track-name" id="mp-track-name" aria-live="polite">Select a track below</div>' +
    '<div class="mp-controls">' +
      '<button class="mp-btn" onclick="mpPrev()" aria-label="Previous track">⏮</button>' +
      '<button class="mp-btn" onclick="mpPlay()" aria-label="Play selected track">▶ Play</button>' +
      '<button class="mp-btn" onclick="mpStop()" aria-label="Stop music">■ Stop</button>' +
      '<button class="mp-btn" onclick="mpNext()" aria-label="Next track">⏭</button>' +
      '<button class="mp-btn" id="mp-shuffle-btn" onclick="toggleMpShuffle()" aria-label="Shuffle, currently off" aria-pressed="false">🔀 Off</button>' +
      '<button class="mp-btn" id="mp-loop-btn" onclick="toggleMusicLoop()" aria-label="Loop all songs, currently off" aria-pressed="false">🔁 Loop: Off</button>' +
    '</div>' +
    '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">' +
      '<span style="font-family:Cinzel,serif;font-size:0.65rem;color:#888;">🔈</span>' +
      '<input type="range" min="0" max="1" step="0.05" value="' + (AUD.musicVol || 0.7) + '" ' +
        'style="flex:1;" aria-label="Music volume" ' +
        'oninput="setMpVolume(parseFloat(this.value))">' +
      '<span style="font-family:Cinzel,serif;font-size:0.65rem;color:#888;">🔊</span>' +
    '</div>';
  panel.appendChild(player);

  // Group tracks by dungeon
  var grouped = {};
  var order = [];
  MUSIC_CATALOGUE.forEach(function(t) {
    if (!grouped[t.dungeon]) { grouped[t.dungeon] = []; order.push(t.dungeon); }
    grouped[t.dungeon].push(t);
  });

  order.forEach(function(dungeon) {
    var section = document.createElement('div');
    section.className = 'mp-section';
    var title = document.createElement('div');
    title.className = 'mp-section-title';
    title.textContent = dungeon.toUpperCase();
    section.appendChild(title);

    grouped[dungeon].forEach(function(track) {
      var btn = document.createElement('button');
      btn.className = 'mp-track-btn';
      btn.id = 'mp-btn-' + track.key;
      btn.setAttribute('aria-label', track.label);
      btn.dataset.key = track.key; // Set key directly on dataset
      btn.innerHTML = '<span>' + track.label + '</span><span class="mp-track-label" id="mp-label-' + track.key + '"></span>';
      btn.onclick = function() { mpSelect(this); };
      section.appendChild(btn);
    });

    panel.appendChild(section);
  });

  // My Tracks section
  var mySection = document.createElement('div');
  mySection.className = 'mp-section';
  var myTitle = document.createElement('div');
  myTitle.className = 'mp-section-title';
  myTitle.textContent = 'MY TRACKS';
  mySection.appendChild(myTitle);
  var myTracksDiv = document.createElement('div');
  myTracksDiv.id = 'my-tracks-section';
  myTracksDiv.innerHTML = '<div style="font-size:0.75rem;color:var(--text-dim);font-style:italic;padding:8px 0;">Loading...</div>';
  mySection.appendChild(myTracksDiv);
  panel.appendChild(mySection);
  renderMyTracks();

  say('Music Player. ' + MUSIC_CATALOGUE.length + ' tracks available. Select a track then press Play. My Tracks section at the bottom shows your saved custom tracks.');
}


function mpSelect(el) {
  var key = (el && el.dataset) ? el.dataset.key : el;
  _mpCurrentKey = key;
  var track = MUSIC_CATALOGUE.find(function(t){ return t.key === key; });
  var label = track ? track.label : key;
  document.querySelectorAll('.mp-track-btn').forEach(function(b){ b.classList.remove('playing'); });
  var btn = document.getElementById('mp-btn-' + key);
  if (btn) btn.classList.add('playing');
  var nameEl = document.getElementById('mp-track-name');
  if (nameEl) nameEl.textContent = label;
  say(label + ' selected. Press Play to listen.');
  mpPlay();
}

function mpPlay() {
  if (!_mpCurrentKey) { say('Select a track first.'); return; }
  mpUpdateNowPlaying();
  var track = MUSIC_CATALOGUE.find(function(t){ return t.key === _mpCurrentKey; });
  var label = track ? track.label : _mpCurrentKey;
  var filePath = TRACK_FILES[_mpCurrentKey];
  if (!filePath) { say('Track not uploaded yet. Add the audio file to play this track.'); return; }

  // Stop EVERYTHING first — custom track, YouTube, game music
  if (_customTrackActive || _ytActive) stopCustomTrack();
  mpStop();
  // Stop Web Audio BufferSource (main path on iOS)
  if (AUD.currentSource) { try { AUD.currentSource.stop(); } catch(e) {} AUD.currentSource = null; }
  // Stop Howler (fallback path)
  if (typeof _howlMusic !== 'undefined' && _howlMusic) { try { _howlMusic.stop(); } catch(e) {} }
  // Stop HTML Audio tracks (legacy path)
  if (AUD.current) {
    var gameTrack = AUD.tracks[AUD.current];
    if (gameTrack) { try { gameTrack.pause(); } catch(e) {} }
  }

  try {
    // On iOS, createMediaElementSource fails on cross-origin URLs (Supabase CDN)
    // Use fetch + decodeAudioData to route through GainNode safely
    if (_webAudioReady && AUD.ctx && AUD.musicGain) {
      fetch(filePath)
        .then(function(r) { return r.arrayBuffer(); })
        .then(function(ab) { return AUD.ctx.decodeAudioData(ab); })
        .then(function(buffer) {
          if (_mpAudio) { try { _mpAudio.pause(); } catch(e) {} }
          var src = AUD.ctx.createBufferSource();
          src.buffer = buffer;
          src.loop = true;
          src.connect(AUD.musicGain);
          AUD.musicGain.gain.setValueAtTime(AUD.musicVol, AUD.ctx.currentTime);
          src.start(0);
          _mpAudio = src;
          _mpPlaying = true;
          say('Now playing: ' + label);
        }).catch(function(e) {
          say('Could not play ' + label + '. Check that the audio file exists.');
        });
    } else {
      _mpAudio = new Audio(filePath);
      _mpAudio.volume = AUD.musicVol || 0.7;
      _mpAudio.loop = true;
      _mpAudio.play().then(function() {
        _mpPlaying = true;
        say('Now playing: ' + label);
      }).catch(function(e) {
        say('Could not play ' + label + '. Check that the audio file exists.');
      });
    }
  } catch(e) {
    say('Audio error: ' + e.message);
  }
}

function mpStop() {
  if (typeof _mpAudio !== 'undefined' && _mpAudio) {
    try {
      if (typeof _mpAudio.stop === 'function') {
        _mpAudio.stop(); // BufferSource
      } else {
        _mpAudio.pause(); _mpAudio.currentTime = 0; // Audio element
      }
    } catch(e) {}
    _mpAudio = null;
  }
  _mpPlaying = false;
  document.querySelectorAll('.mp-track-btn').forEach(function(b){ b.classList.remove('playing'); });
  var nameEl = document.getElementById('mp-track-name');
  if (nameEl) nameEl.textContent = 'Nothing playing';
  // Resume game music if it was playing before music player opened
  if (AUD && AUD.musicOn && AUD.current) {
    try { playTrack(AUD.current); } catch(e) {}
  }
}


//═════════════════
// INSANE MODE — FULL SYSTEM
//═════════════════
var _sanity = 100;
var _sanityTimer = null;
var _insaneMode = false;
var _distortedActive = false;

var DISTORTED_MESSAGES = [
  'Someone is watching you.',
  'Be careful.',
  'You have been defeated.',
  'Run.',
  'Watch.',
  'The sanity engulfs you.',
  'You cannot escape.',
  'We are all you can see.',
  'Be careful. Be careful. Be careful.',
  'It knows you are here.',
  'Do not look at it.',
  'You were warned.',
  'The walls remember everything.',
  'You have been defeated.',
  'Turn back.',
  'It is behind you.',
  'You cannot win this.',
  'The dungeon is inside you now.',
];

var GLITCH_WORDS = ['ERROR','NULL','VOID','???','---','CORRUPTED','LOST','GONE','WRONG'];

function initInsaneMode() {
  _sanity = 100;
  _insaneMode = true;
  _distortedActive = false;
  updateSanityBar();
  // Start passive sanity drain — 1% every 8 seconds
  if (_sanityTimer) clearInterval(_sanityTimer);
  _sanityTimer = setInterval(function() {
    if (_insaneMode && !DS.inCombat) drainSanity(1, false);
  }, 10000);
  var wrap = document.getElementById('sanity-bar-wrap');
  if (wrap) wrap.classList.add('show');
  say('Insane Mode active. Sanity bar at 100 percent. Keep it above zero or the dungeon claims your mind.');
}

var _sanityLastAnnounced = 100;
function drainSanity(amount, announce) {
  if (!_insaneMode) return;
  var prev = _sanity;
  _sanity = Math.max(0, _sanity - amount);
  updateSanityBar();
  applyInsanityEffects();
  // Announce at 50, 25, 10 percent milestones
  var milestones = [50, 25, 10];
  milestones.forEach(function(m) {
    if (prev > m && _sanity <= m) {
      say('Warning. Sanity at ' + m + ' percent. ' + (m === 10 ? 'Critical. The dungeon is becoming unstable.' : m === 25 ? 'The room feels wrong.' : 'Something is watching you.'));
    }
  });
  if (announce !== false && amount > 8) {
    say('Sanity dropping. ' + Math.round(_sanity) + ' percent remaining.');
  }
  if (_sanity <= 0) triggerSanityZero();
}

function restoreSanity(amount) {
  if (!_insaneMode) return;
  _sanity = Math.min(100, _sanity + amount);
  updateSanityBar();
  applyInsanityEffects();
}

function updateSanityBar() {
  var bar = document.getElementById('sanity-bar');
  var label = document.getElementById('sanity-label');
  var wrap = document.getElementById('sanity-bar-wrap');
  var pct = Math.round(_sanity);
  if (bar) {
    bar.style.width = pct + '%';
    var col = pct > 50 ? '#ff4444' : pct > 25 ? '#cc2222' : '#880000';
    bar.style.background = 'linear-gradient(90deg,' + col + ',' + col + 'aa)';
    bar.style.animation = pct <= 10 ? 'sanityPulse 0.6s infinite alternate' : pct <= 25 ? 'sanityPulse 1.2s infinite alternate' : 'none';
  }
  if (label) label.textContent = pct + '%';
  if (wrap) {
    wrap.setAttribute('aria-valuenow', pct);
    wrap.setAttribute('aria-label', 'Sanity ' + pct + ' percent');
  }
  // JAWS milestone warnings + sounds
  if (pct === 50) say('Warning. Sanity at 50 percent. The dungeon is affecting your mind.');
  if (pct === 25) say('Danger. Sanity at 25 percent. Reality is breaking down.');
  if (pct === 10) { sfx('sfx-sanity-warning'); say('Critical. Sanity at 10 percent. The dungeon is consuming you.'); familiarSanityComfort(); }
  if (pct === 5)  { sfx('sfx-sanity-critical'); say('CRITICAL. Sanity at 5 percent. You are almost gone.'); }
  if (pct > 25) _familiarSanityCommentedThisDrop = false;
}

function applyInsanityEffects() {
  if (!_insaneMode) return;
  var eventEl = document.getElementById('dg-event');
  var logEl = document.getElementById('dg-log');

  // 25% — UI starts glitching
  if (_sanity <= 25 && _sanity > 10) {
    if (eventEl) eventEl.classList.add('insane-glitch');
    flashRed(0.3);
  } else {
    if (eventEl) eventEl.classList.remove('insane-glitch');
  }

  // 10% — severe corruption
  if (_sanity <= 10) {
    if (eventEl) eventEl.classList.add('insane-glitch');
    if (logEl) logEl.classList.add('insane-glitch');
    flashRed(0.6);
    // Corrupt a random log entry visually
    var entries = document.querySelectorAll('.log-entry');
    if (entries.length > 0) {
      var rnd = entries[Math.floor(Math.random() * entries.length)];
      if (rnd && !rnd.dataset.corrupted) {
        rnd.dataset.corrupted = '1';
        rnd.textContent = GLITCH_WORDS[Math.floor(Math.random() * GLITCH_WORDS.length)] + ' ' +
          GLITCH_WORDS[Math.floor(Math.random() * GLITCH_WORDS.length)];
        rnd.style.color = '#cc0000';
      }
    }
  }
}

function flashRed(opacity) {
  var fl = document.getElementById('insanity-flash');
  if (!fl) return;
  fl.style.background = 'rgba(139,0,0,' + opacity + ')';
  fl.style.display = 'block';
  setTimeout(function(){ fl.style.display = 'none'; }, 200);
}

function triggerSanityZero() {
  if (_sanityTimer) clearInterval(_sanityTimer);
  _insaneMode = false;
  showDgPanels(false, false, false);
  // Unique zero sanity ending
  var ov = document.getElementById('death-cinematic');
  if (ov) {
    document.getElementById('dc-floor').textContent = DS.dungeon.toUpperCase() + ' · FLOOR ' + DS.floor;
    document.getElementById('dc-line').textContent = 'The sanity bar reached zero. The dungeon did not kill you. It absorbed you. You woke up at the entrance with no memory of what happened below floor ' + DS.floor + '. The dungeon kept what it took.';
    document.getElementById('dc-char').textContent = DS.name + ' — ' + DS.race + ' ' + DS.cls;
    document.getElementById('dc-killer').textContent = 'Lost to the void · Sanity: 0%';
    ov.classList.add('show');
    say('Sanity zero. The dungeon claims your mind. You wake at the entrance. The dungeon kept what it took.');
    setTimeout(function(){
      ov.classList.remove('show');
      buildRunSummary(false);
      goTo('runsummary');
    }, 6000);
  }
}

function stopInsaneMode() {
  _insaneMode = false;
  if (_sanityTimer) clearInterval(_sanityTimer);
  _sanityTimer = null;
  var wrap = document.getElementById('sanity-bar-wrap');
  if (wrap) wrap.classList.remove('show');
  var eventEl = document.getElementById('dg-event');
  var logEl = document.getElementById('dg-log');
  if (eventEl) eventEl.classList.remove('insane-glitch');
  if (logEl) logEl.classList.remove('insane-glitch');
}

// ── SANITY DRAINER ENEMY ──
function spawnSanityDrainer() {
  DS.inCombat = false;
  var enemy = {
    name: 'The Sanity Drainer',
    icon: '🕳️',
    hp: 45 + Math.floor(DS.floor * 3),
    atk: [8, 15],
    gold: [15, 30],
    isSanityDrainer: true,
    maxHp: 45 + Math.floor(DS.floor * 3),
  };
  DS.enemy = enemy;
  setEvent('danger',
    'The air in the room changes. Something is here that should not be here. ' +
    'It looks at you and you feel something leave. The sanity bar drops.'
  );
  drainSanity(10, true);
  say('The Sanity Drainer. A special Insane Mode enemy. Defeat it to earn an Insanity Potion. It drains your sanity with every hit.');
  setTimeout(function() { startCombat(false); }, 1500);
}

// ── THE DISTORTED ENEMY ──
function spawnDistorted() {
  _distortedActive = true;
  DS.inCombat = true;
  DS.defending = false;
  var enemy = {
    name: 'The Distorted',
    icon: '▓',
    hp: 35 + Math.floor(DS.floor * 2),
    atk: [0, 0], // Does sanity damage not HP
    gold: [10, 20],
    isDistorted: true,
    maxHp: 35 + Math.floor(DS.floor * 2),
  };
  DS.enemy = enemy;
  showDgPanels(false, true, false);
  document.getElementById('dg-enemy-icon').textContent = '▓';
  document.getElementById('dg-enemy-name').textContent = t('The Distorted');
  updateEnemyBar();
  setCombatBtns(true);
  addLog('Something is in the room. It has been here longer than the room has.');
  say('The Distorted. A psychological enemy. It does not deal HP damage. It drains your sanity. Every time it acts messages will interrupt. Stay focused and defeat it.');
  setTimeout(function(){ document.getElementById('cbtn-attack').focus(); }, 100);
}

function distortedTurn() {
  // Fire rapid JAWS messages while dealing sanity damage
  setCombatBtns(false);
  var msgs = [];
  var count = 3 + Math.floor(Math.random() * 4);
  for (var i = 0; i < count; i++) {
    msgs.push(DISTORTED_MESSAGES[Math.floor(Math.random() * DISTORTED_MESSAGES.length)]);
  }
  var delay = 0;
  msgs.forEach(function(msg) {
    setTimeout(function() {
      addLog(msg, 'bad');
      // Force JAWS to read it by updating a live region
      var liveEl = document.getElementById('dg-event');
      if (liveEl) {
        var p = document.createElement('p');
        p.style.cssText = 'color:#cc0000;font-family:Cinzel,serif;font-size:0.85rem;margin:4px 0;';
        p.textContent = msg;
        liveEl.appendChild(p);
      }
      say(msg);
      flashRed(0.4);
      drainSanity(3, false);
    }, delay);
    delay += 1200;
  });
  setTimeout(function() {
    updateSanityBar();
    if (_sanity <= 0) { triggerSanityZero(); return; }
    setCombatBtns(true);
    addLog('The messages stop. Your turn returns.');
  }, delay + 300);
}

// Insanity Potion item
function useInsanityPotion() {
  // Random effect — player does not know which
  var restore = Math.random() < 0.50;
  if (restore) {
    restoreSanity(100);
    flashRed(0.1);
    setEvent('good', 'Clarity. Complete clarity. The sanity bar fills entirely. You are not sure how long it will last.');
    say('Insanity Potion — Clarity! Sanity fully restored to 100 percent.');
  } else {
    var drain = 30 + Math.floor(Math.random() * 20);
    drainSanity(drain, true);
    flashRed(0.8);
    setEvent('bad', 'The potion was wrong. Something was wrong with it. The dungeon is louder now. The sanity bar drops sharply.');
    say('Insanity Potion — Wrong effect! Sanity drained by ' + drain + ' percent.');
  }
}

// ── JULIO ANCHORS SANITY ──
function julioRestoresSanity() {
  if (!_insaneMode) return;
  restoreSanity(15);
  addLog('Julio is completely unbothered by everything around him. This is somehow grounding. +15 sanity.');
  say('Julio restores 15 sanity. He does not know he did this.');
}


//═════════════════
// SCREEN READER HEADINGS SYSTEM
//═════════════════
function applyHeadings(on) {
  if (on) {
    injectHeadings();
  } else {
    removeHeadings();
  }
}

function removeHeadings() {
  // Remove all injected heading roles
  document.querySelectorAll('[data-injected-heading]').forEach(function(el) {
    el.removeAttribute('role');
    el.removeAttribute('aria-level');
    el.removeAttribute('data-injected-heading');
  });
}

function injectHeadings() {
  removeHeadings();

  function h(el, level) {
    if (!el) return;
    var tag = el.tagName ? el.tagName.toLowerCase() : '';
    if (tag === 'h1'||tag === 'h2'||tag === 'h3'||tag === 'h4') return;
    // Never turn something you can press into a heading: VoiceOver would stop calling it a button.
    if (tag === 'button'||tag === 'a'||tag === 'input'||tag === 'select'||tag === 'textarea'||el.getAttribute('role') === 'button'||el.hasAttribute('onclick')) return;
    el.setAttribute('role', 'heading');
    el.setAttribute('aria-level', String(level));
    el.setAttribute('data-injected-heading', '1');
  }
  function hAll(sel, level) {
    document.querySelectorAll(sel).forEach(function(el){ h(el, level); });
  }

  // -- H1 — PAGE LEVEL
  h(document.querySelector('.title-main'), 1);           // Main menu title
  hAll('.screen-title', 1);                              // All screen titles
  h(document.getElementById('dg-floor-name'), 1);        // Dungeon floor name
  h(document.getElementById('story-reader-title'), 1);   // Story reader title
  h(document.querySelector('.rs-title'), 1);             // Run summary title
  h(document.querySelector('.wn-title'), 1);             // Whats new title

  // -- H2 — SECTION LEVEL
  hAll('.quest-tab', 2);                   // All tabs (quests, bestiary filter etc)
  hAll('.lore-title', 2);                  // Lore section titles
  hAll('.mp-section-title', 2);            // Music player dungeon groups
  hAll('.rs-section-title', 2);            // Run summary sections
  hAll('.version-num', 2);                 // Version history entries
  hAll('.char-name', 2);                   // Character card names
  hAll('.settings-section-title', 2);      // Settings sections
  hAll('.death-log-title', 2);             // Death log heading
  h(document.getElementById('dg-enemy-name'), 2);  // Enemy name in combat
  h(document.querySelector('.menu-wrap h1'), 2);   // Menu subtitle
  hAll('.score-cat-name', 2);              // Score categories
  hAll('.backstory-name', 2);              // Backstory options
  hAll('.diff-name', 2);                   // Difficulty options
  hAll('.race-name', 2);                   // Race options
  hAll('.prof-name', 2);                   // Profession options
  hAll('.class-name', 2);                  // Class options in creation

  // -- H3 — ITEM LEVEL
  hAll('.bestiary-entry .be-name', 3);     // Each bestiary enemy
  hAll('.ach-name', 3);                    // Each achievement
  hAll('.story-card-title', 3);            // Each library story
  hAll('.spirit-name', 3);                 // Spirit names in picker
  hAll('.skill-name', 3);                  // Skill names in skill overlay
  hAll('.coin-item-name', 3);              // Coin shop items
  hAll('.stat-box-val', 3);               // Stat box values
  hAll('.step-title', 3);                  // Creation step titles
  hAll('.access-option-name', 3);          // Accessibility option names
  hAll('.dg-end-title', 3);               // Victory/defeat title
  hAll('.rs-stat-label', 3);              // Run summary stat labels

  // -- MENU BUTTONS — H2 on menu buttons so H key hits them
  document.querySelectorAll('.menu-nav .menu-btn').forEach(function(btn) {
    h(btn, 2);
  });

  // -- BACK BUTTONS — H2 so you can jump back easily
  document.querySelectorAll('.back-btn').forEach(function(btn) {
    h(btn, 2);
  });
}


// Re-apply headings whenever a screen changes
function applyHeadingsIfEnabled() {
  if (ACCESS.headings) {
    setTimeout(function() { injectHeadings(); }, 100);
  }
}


//═════════════════
// FIRST LAUNCH SCREEN READER PROMPT
//═════════════════
async function checkSRPrompt() {
  // Only show once ever
  if (DDStore.getItem('dd_sr_prompt_seen')) return;

  // On Capacitor — we KNOW if VoiceOver is on, so don't ask
  if (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.ScreenReader) {
    try {
      var result = await Capacitor.Plugins.ScreenReader.isEnabled();
      var voiceOverOn = !!(result && result.value);

      if (voiceOverOn) {
        // VoiceOver is ON — show a tailored prompt
        setTimeout(function() {
          var el = document.getElementById('sr-prompt');
          if (!el) return;
          // Update text for Capacitor/VoiceOver context
          document.getElementById('sr-prompt-title').textContent = 'VoiceOver Detected';
          el.querySelector('p').textContent = 'We detected you are using VoiceOver. Would you like to enable all accessibility features for the best experience?';
          el.querySelector('[onclick="srPromptYes()"]').textContent = 'Yes — Enable Accessibility Features';
          el.querySelector('[onclick="srPromptNo()"]').textContent = 'No — Continue as is';
          el.style.display = 'flex';
          setTimeout(function() {
            say('VoiceOver detected. Would you like to enable all accessibility features? Press the first button for yes, second button for no.');
            var btn = el.querySelector('button');
            if (btn) btn.focus();
          }, 500);
        }, 2000);
      } else {
        // VoiceOver is OFF on Capacitor — skip the prompt entirely
        DDStore.setItem('dd_sr_prompt_seen', '1');
      }
      return;
    } catch(e) {
      // Fall through to web prompt if plugin fails
    }
  }

  // Web — can't detect screen reader, so ask the user
  setTimeout(function() {
    var el = document.getElementById('sr-prompt');
    if (el) {
      el.style.display = 'flex';
      setTimeout(function() {
        say('Welcome to Dungeon Descent. Are you using a screen reader? Press the first button to enable all accessibility features, or the second button to continue without them.');
        var btn = el.querySelector('button');
        if (btn) btn.focus();
      }, 500);
    }
  }, 2000);
}

function srPromptYes() {
  // Enable ALL accessibility features
  ACCESS.verbose  = true;
  ACCESS.combat   = true;
  ACCESS.srmode   = true;
  ACCESS.headings = true;
  ACCESS.motion   = true; // reduce motion too
  saveAccessPrefs();
  applyReducedMotion(true);
  applyHeadings(true);

  // Sync all UI buttons
  ['verbose','combat','srmode','headings','motion'].forEach(function(key) {
    var btn = document.getElementById('access-' + key);
    if (btn) {
      btn.textContent = 'On';
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
    }
  });

  DDStore.setItem('dd_sr_prompt_seen', '1');
  var el = document.getElementById('sr-prompt');
  if (el) el.style.display = 'none';

  say('All accessibility features enabled. Verbose mode on. Screen reader headings on. Combat announcements on. Reduced motion on. Welcome to Dungeon Descent. You can adjust any feature in the Settings screen under Accessibility.');
}

function srPromptNo() {
  DDStore.setItem('dd_sr_prompt_seen', '1');
  var el = document.getElementById('sr-prompt');
  if (el) el.style.display = 'none';
  say('Welcome to Dungeon Descent. You can enable accessibility features at any time in Settings.');
}


//═════════════════
// RUN START QUOTES
//═════════════════
var RUN_START_QUOTES = {
  'Crypt of Malachar': {
    Warrior:    'The Crypt has broken stronger than you. That is not a warning. It is a challenge.',
    Monk:       'The dead here have forgotten stillness. You have not. Remind them.',
    Assassin:   'The Crypt sees everything. Move anyway.',
    Paladin:    'The divine light you carry is the first light this place has seen in a thousand years. Use it.',
    Naturalist: 'Nothing grows in the Crypt. You are about to change that.',
    Sorcerer:   'The magic here is old and angry. Yours is newer. Show it the difference.',
    Necromancer:'The dead here are not your enemies. They are your colleagues. Introduce yourself.',
    Berserker:  'The undead have been angry for a thousand years. You have been angry longer. You win.',
    Bard:       'You will sing in the Crypt. The dead will listen. They have not heard music in centuries.',
    Alchemist:  'The Crypt is one giant experiment. You are the variable it did not account for.',
    BloodKnight:'Blood answers blood. The Crypt has plenty. So do you.',
    Druid:      'Nothing lives here. Yet. Give it time.',
  },
  'The Ashbound Wastes': {
    Warrior:    'The fire has never met a wall before. You are the wall.',
    Monk:       'The Wastes burn everything. Find the stillness inside the fire.',
    Assassin:   'Everything in the Wastes is on fire. Smoke makes excellent cover.',
    Paladin:    'Your faith burns hotter than this place. Prove it.',
    Naturalist: 'The Wastes forgot what living things feel like. Be a reminder.',
    Sorcerer:   'The fire here is ancient. Ancient things can still be surprised.',
    Necromancer:'Even ash remembers what it was. Ask it.',
    Berserker:  'The Wastes want to make you rage. You were already raging. You are ahead.',
    Bard:       'No one has sung in the Wastes. The silence has gone on long enough.',
    Alchemist:  'Heat plus pressure plus the right compound equals opportunity. Calculate accordingly.',
    BloodKnight:'The Wastes run red beneath the ash. You will feel at home.',
    Druid:      'One green thing. That is all you need to leave behind. Start small.',
  },
  'Frosthold Abyss': {
    Warrior:    'The cold slows everything down. Not you. Never you.',
    Monk:       'The Abyss is perfectly still. So are you. One of you will move first.',
    Assassin:   'Ice reflects everything. Do not let it reflect you.',
    Paladin:    'The cold cannot touch what has already been claimed by the divine.',
    Naturalist: 'The Abyss has been frozen so long it forgot spring exists. Teach it.',
    Sorcerer:   'Old cold magic versus new hot magic. The math is in your favor.',
    Necromancer:'The frozen dead are the most patient dead. They have been waiting for someone to talk to.',
    Berserker:  'The cold tries to slow your anger. Your anger is faster than cold.',
    Bard:       'The Abyss has been silent forever. That ends today.',
    Alchemist:  'Freezing point. Boiling point. You know exactly where the interesting things happen.',
    BloodKnight:'Blood does not freeze. You have tested this.',
    Druid:      'Under all that ice something is still alive. Find it.',
  },
  'The Sunken Archives': {
    Warrior:    'The Archives recorded every warrior who entered. None of them finished the index.',
    Monk:       'The Archives contain every answer ever written. The question is whether you survive long enough to read them.',
    Assassin:   'The Archives know everything. Make sure they do not learn too much about you.',
    Paladin:    'The drowned scholars chose knowledge over faith. Show them what faith chose.',
    Naturalist: 'The Archives catalogued every living thing. They missed a few. You will find them.',
    Sorcerer:   'Every spell ever written is in here somewhere. Try not to accidentally read one.',
    Necromancer:'The drowned scholars died for knowledge. They will appreciate the professional courtesy.',
    Berserker:  'Knowledge is power. Power is what you hit things with. You are ready.',
    Bard:       'You are about to become the most dramatic entry in the Archives. Make it worth reading.',
    Alchemist:  'The restricted section exists for a reason. That reason is about to become your opportunity.',
    BloodKnight:'The Archives are written in ink. You prefer a different medium. Make your mark.',
    Druid:      'The waterlogged plants in the Archives are trying very hard. Help them.',
  },
  'The Hollow': {
    Warrior:    'The house wants you afraid. Refuse.',
    Monk:       'The Hollow is full of noise disguised as silence. Listen through it.',
    Assassin:   'The house watches every room. Every room except the one you are already in.',
    Paladin:    'The Hollow has not felt holy light in a very long time. It is about to.',
    Naturalist: 'Something alive is in the Hollow. Something that should not be. It might be you.',
    Sorcerer:   'The Hollow runs on old grief. Grief is just energy with nowhere to go. Redirect it.',
    Necromancer:'The dead in the Hollow were not expecting a colleague. The surprise is yours to exploit.',
    Berserker:  'The house is built on fear. You are not afraid. This is already over.',
    Bard:       'The Hollow has been silent for decades. You are going to fix that whether it wants you to or not.',
    Alchemist:  'The Hollow is a controlled environment. You are the uncontrolled variable.',
    BloodKnight:'The house keeps what it takes. Make sure it remembers what it took from you.',
    Druid:      'The garden died when the house did. One of you is going to fix that today.',
  },
};

function getRunStartQuote() {
  var dungeon = DS.dungeon;
  var cls = DS.cls;
  var dungeonQuotes = RUN_START_QUOTES[dungeon];
  if (!dungeonQuotes) return null;
  return dungeonQuotes[cls] || null;
}

function showRunStartQuote(callback) {
  var quote = getRunStartQuote();
  if (!quote) { if (callback) callback(); return; }

  // Show as a brief overlay
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:800;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;text-align:center;pointer-events:none;';
  ov.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.4em;color:var(--gold-dim);margin-bottom:16px;">' + DS.dungeon.toUpperCase() + '</div>' +
    '<div style="font-family:Cinzel,serif;font-size:1rem;color:var(--text-secondary);line-height:1.8;max-width:400px;font-style:italic;">' + quote + '</div>' +
    '<div style="font-family:Cinzel Decorative,cursive;font-size:0.75rem;color:var(--gold-dim);margin-top:20px;">— ' + DS.name + ' the ' + DS.cls + '</div>';
  document.body.appendChild(ov);

  // JAWS reads it
  say(quote);

  // Hold 4 seconds then fade out and continue
  setTimeout(function() {
    ov.style.transition = 'opacity 0.8s';
    ov.style.opacity = '0';
    setTimeout(function() {
      ov.remove();
      if (callback) callback();
    }, 800);
  }, 4000);
}


// ── 67 ──
function toggleMenuNotifications() {
  ACCESS.notificationsOff = !ACCESS.notificationsOff;
  saveAccessPrefs();
  var icon = document.getElementById('menu-notif-icon');
  var label = document.getElementById('menu-notif-label');
  var btn = document.getElementById('menu-notif-btn');
  var on = !ACCESS.notificationsOff;
  if (icon) icon.textContent = on ? '🔔' : '🔕';
  if (label) label.textContent = on ? 'Notifications On' : 'Notifications Off';
  if (btn) btn.setAttribute('aria-label', 'Achievement notifications currently ' + (on ? 'on' : 'off') + ', press to toggle');
  // Sync settings button too
  var settBtn = document.getElementById('access-notificationsOff');
  if (settBtn) {
    settBtn.textContent = on ? 'On' : 'Off';
    settBtn.classList.toggle('on', on);
    settBtn.setAttribute('aria-pressed', String(!on));
  }
  say('Achievement notifications ' + (on ? 'on.' : 'off. JAWS will still announce achievements.'));
}

// check67 removed


//═════════════════
// HELP SCREEN
//═════════════════
function helpTab(tab) {
  var tabs = ['basics','characters','dungeons','combat','features','online','strategies','access','keys'];
  tabs.forEach(function(t) {
    var btn = document.getElementById('help-tab-' + t);
    var panel = document.getElementById('help-' + t);
    if (btn) { btn.classList.toggle('active', t === tab); btn.setAttribute('aria-selected', t === tab ? 'true' : 'false'); }
    if (panel) { panel.style.display = t === tab ? 'block' : 'none'; panel.style.setProperty('display', t === tab ? 'block' : 'none', 'important'); }
  });
  var names = { basics:'Basics. How the game works.', characters:'Characters. Classes, races, professions, skills and spirits.', dungeons:'Dungeons. All nine dungeons, difficulties and weather.', combat:'Combat. How to fight, special enemies and Insane Mode.', features:'Features. Chronicles, Hall of Legends, Julio questline and more.', online:'Multiplayer and Online. PVP Arena, Global Chat, community enemies and the global obituary.', strategies:'Strategies. Tips and tactics to survive and win the dungeon.', access:'Accessibility. Screen reader support, headings and settings.', keys:'Key Commands. Keyboard shortcuts for every screen.' };
  say('Help — ' + (names[tab] || tab));
}


//═════════════════
// RESET GAME
//═════════════════
var ALL_DD_KEYS = [
  'dd_access','dd_ach_stats','dd_achievements','dd_audio',
  'dd_bestiary','dd_br_scores','dd_chars','dd_claimed_awards',
  'dd_coin_upgrades','dd_daily_quest','dd_dc','dd_dc_history',
  'dd_dc_reg','dd_global_stats','dd_julio_fragments','dd_julio_story',
  'dd_legends','dd_mb_tutorial','dd_milestone_effects','dd_milestones',
  'dd_raid','dd_score','dd_unlocks','dd_version_seen',
  'dd_sr_prompt_seen','dd_tutorial_seen'
];

function showResetGame() {
  // Close settings panel first so overlay appears on top
  try { closeSettingsPanel('data'); } catch(e2) {}
  try { closeSettingsPanel('accessibility'); } catch(e2) {}
  try { goTo('menu'); } catch(e2) {}
  setTimeout(function() {
    openOv('ov-reset-game');
    say('Reset all progress. Warning — this will delete everything permanently. Press Delete Everything to confirm or Cancel to go back.');
  }, 200);
}

function confirmResetGame() {
  // Clear all known keys
  ALL_DD_KEYS.forEach(function(key) {
    DDStore.removeItem(key);
  });
  // Also clear story read keys and quest seen keys
  DDStore.keysList().forEach(function(key) {
    if (key.startsWith('dd_')) DDStore.removeItem(key);
  });
  closeOv('ov-reset-game');
  // Reset in-memory state
  CHARS = [];
  _charIdx = null;
  say('All progress deleted. The dungeon does not remember your name. Reloading now.');
  setTimeout(function() { location.reload(); }, 2000);
}

//═════════════════


// ── RUN MODIFIERS ──
var RUN_MODIFIERS = [
  { id:'burning',    icon:'🔥', name:'Burning Dungeon',   desc:'Enemies deal fire damage but drop 50% more gold.',
    apply: function(){ DS.runModGoldBoost = 1.5; DS.runModFireDmg = true; } },
  { id:'frozen',     icon:'❄️', name:'Frozen Floors',     desc:'Enemies hit 20% less hard but you move slower. Fewer rooms per floor.',
    apply: function(){ DS.runModEnemyDmgMult = 0.8; DS.floorRoomsNeeded = Math.max(4, DS.floorRoomsNeeded - 1); } },
  { id:'watching',   icon:'👁️', name:'The Watching',      desc:'No event rooms this run. Double XP from all kills.',
    apply: function(){ DS.runModNoEvents = true; DS.xpBoost = (DS.xpBoost||1) * 2; } },
  { id:'deathmarch', icon:'💀', name:'Death March',       desc:'Enemies 25% stronger. Boss drops a legendary item.',
    apply: function(){ DS.runModEnemyDmgMult = (DS.runModEnemyDmgMult||1) * 1.25; DS.runModLegendaryBoss = true; } },
  { id:'goldcurse',  icon:'💰', name:'Gold Curse',        desc:'Triple gold from all sources but potions cost double.',
    apply: function(){ DS.runModGoldBoost = (DS.runModGoldBoost||1) * 3; DS.runModPotionCostMult = 2; } },
  { id:'phantom',    icon:'👻', name:'Phantom Run',       desc:'You are invisible to enemies until you attack. First strike always crits.',
    apply: function(){ DS.runModPhantom = true; DS.runModFirstCrit = true; } },
  { id:'berserk',    icon:'😤', name:'Berserk Mode',      desc:'Your attacks deal 40% more damage but you cannot defend.',
    apply: function(){ DS.runModAtkBoost = 1.4; DS.runModNoDefend = true; } },
  { id:'blessed',    icon:'✨', name:'Blessed Run',       desc:'Start with a full inventory of potions and 100 bonus gold.',
    apply: function(){
      for (var i=0;i<4;i++) DS.inventory.push({name:'Health Potion',icon:'🧪',type:'potion',heal:40,desc:'Restores 40 HP.'});
      DS.gold += 100; addGlobalGold(100); updateTopBar();
    }
  },
];

var _currentRunModifier = null;

function rollRunModifier() {
  if (DDStore.getItem('dd_run_modifiers') === '0') return null;
  var mod = RUN_MODIFIERS[Math.floor(Math.random() * RUN_MODIFIERS.length)];
  _currentRunModifier = mod;
  return mod;
}

function applyRunModifier() {
  if (!_currentRunModifier) return;
  _currentRunModifier.apply();
}

function showRunModifierIntro(callback) {
  if (!_currentRunModifier) { callback(); return; }
  var mod = _currentRunModifier;
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.96);z-index:850;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;';
  var box = document.createElement('div');
  box.style.cssText = 'max-width:400px;width:100%;background:var(--bg-panel);border:1px solid var(--gold-dim);border-top:3px solid var(--gold);padding:28px 24px;text-align:center;';
  var eyebrow = document.createElement('div');
  eyebrow.style.cssText = 'font-family:Cinzel,serif;font-size:0.62rem;letter-spacing:0.3em;color:var(--gold-dim);margin-bottom:10px;';
  eyebrow.textContent = '🎲 RUN MODIFIER';
  var icon = document.createElement('div');
  icon.style.cssText = 'font-size:2.5rem;margin-bottom:10px;';
  icon.textContent = mod.icon;
  var name = document.createElement('div');
  name.style.cssText = 'font-family:Cinzel Decorative,cursive;font-size:1rem;color:var(--gold);margin-bottom:8px;';
  name.textContent = mod.name;
  var desc = document.createElement('p');
  desc.style.cssText = 'font-size:0.78rem;color:var(--text-secondary);line-height:1.6;margin-bottom:16px;';
  desc.textContent = mod.desc;
  var note = document.createElement('div');
  note.style.cssText = 'font-size:0.65rem;color:var(--text-dim);font-style:italic;margin-bottom:16px;';
  note.textContent = 'You can disable run modifiers in Settings — Gameplay.';
  var btn = document.createElement('button');
  btn.className = 'menu-btn primary';
  btn.style.width = '100%';
  btn.textContent = 'Begin Descent ⚔';
  btn.setAttribute('aria-label', 'Accept modifier and begin');
  btn.onclick = function() { ov.remove(); callback(); };
  box.appendChild(eyebrow);
  box.appendChild(icon);
  box.appendChild(name);
  box.appendChild(desc);
  box.appendChild(note);
  box.appendChild(btn);
  ov.appendChild(box);
  document.body.appendChild(ov);
  setTimeout(function() { btn.focus(); }, 100);
  say('Run modifier. ' + mod.name + '. ' + mod.desc + '. You can disable run modifiers in Settings Gameplay. Press Begin Descent to continue.');
}

// ── TUTORIAL SYSTEM (session additions) ──
function shouldShowTutorial() {
  return !DDStore.getItem('dd_tutorial_seen');
}

function startTutorial() {
  if (!shouldShowTutorial()) return;
  openTutorial(); // openTutorial() itself marks dd_tutorial_seen immediately
}

function spawnTutorialShade() {
  // hp raised from the original 12 to 50 — at 12 HP most builds one- or
  // two-shot it, leaving no room to actually demonstrate Heavy Strike and
  // Defend before it dies. atk stays trivial ([1,2]) so it's still harmless.
  DS.enemy = { name:'Training Shade', icon:'👤', hp:50, maxHp:50, atk:[1,2], gold:[0,0], isTutorialEnemy:true };
  DS.inCombat = true; DS.defending = false;
  showDgPanels(false, true, false);
  document.getElementById('dg-enemy-icon').textContent = '👤';
  document.getElementById('dg-enemy-name').textContent = t('Training Shade');
  updateEnemyBar(); updatePlayerBar(); setCombatBtns(true); updateSkillButtons();
  addLog('A Training Shade materialises. It is weak. A tutorial enemy. Defeat it.');
  say('Tutorial combat. Training Shade. 50 HP. It barely hits back. Use Attack to defeat it.');
}

// ── INTERACTIVE COMBAT PRACTICE (Tutorial Step 5) ──
// spawnTutorialShade() existed for at least a couple versions but was never
// actually called from anywhere — the tutorial's Combat step was pure text,
// no hands-on practice. This wires it up: launched from the tutorial overlay,
// it hides the overlay, spawns the Shade in a real (harmless) fight, narrates
// each action type contextually the first time it's used (see the
// isTutorialEnemy hook in doFight()), and resumes the tutorial once it dies
// (handled centrally in enemyDead(), same pattern as Medusa/Time Descender).
function startTutorialCombatPractice() {
  var dungeonScreen = document.getElementById('screen-dungeon');
  var liveRun = dungeonScreen && dungeonScreen.classList.contains('active') && DS && !DS.inCombat && DS.floor;
  // No active run (e.g. replayed from Settings/main menu) — as long as a
  // character is actually loaded (DS holds real hp/maxHp), switch to the
  // dungeon screen just for this practice fight and switch back afterward,
  // so "Replay Tutorial" can complete the whole walkthrough on demand
  // instead of always skipping the one hands-on step.
  var hasCharacter = DS && typeof DS.hp === 'number' && typeof DS.maxHp === 'number' && DS.maxHp > 0;
  if (!liveRun && !hasCharacter) {
    say('Practice fights need a character loaded. Create or load a character first, then replay the tutorial.');
    tutStep(6);
    return;
  }
  document.getElementById('tutorial-overlay').classList.remove('open');
  DS._tutCombatBeats = {};
  if (!liveRun) {
    DS._tutStandaloneReturnScreen = _currentScreen;
    goTo('dungeon');
  } else {
    DS._tutStandaloneReturnScreen = null;
  }
  spawnTutorialShade();
  addLog('📖 Tutorial: try Attack, Heavy Strike, and Defend against this Training Shade.');
}

function _tutCombatOnAction(action) {
  if (!DS._tutCombatBeats) DS._tutCombatBeats = {};
  if (DS._tutCombatBeats[action]) return;
  DS._tutCombatBeats[action] = true;
  var tips = {
    attack: '📖 Attack — reliable, always hits, small chance to crit.',
    heavy: '📖 Heavy Strike — hits harder, but can miss completely.',
    defend: '📖 Defend — reduces incoming damage and counters.',
    potion: '📖 Potion — heals you using an item from your inventory.',
    skill: '📖 Skill — your class\'s special ability, costs SP.',
  };
  if (tips[action]) addLog(tips[action]);
}

function resumeTutorialAfterCombat() {
  if (DS._tutStandaloneReturnScreen) {
    goTo(DS._tutStandaloneReturnScreen);
    DS._tutStandaloneReturnScreen = null;
  }
  document.getElementById('tutorial-overlay').classList.add('open');
  tutStep(6);
}

// ── ESCAPE CONFIRM OVERLAY ──
function showEscapeConfirmOverlay() {
  if (DS.inCombat) { say('Cannot leave during combat.'); return; }
  var ov = document.getElementById('escape-confirm-overlay');
  if (!ov) return;
  ov.style.display = 'flex';
  setTimeout(function() {
    var btn = document.getElementById('escape-confirm-yes');
    if (btn) btn.focus();
    say('Return to main menu? Press Yes to confirm or No to stay.');
  }, 100);
}

function confirmEscapeToMenu() {
  closeEscapeConfirm();
  if (_charIdx !== null && CHARS[_charIdx]) {
    CHARS[_charIdx].floor = DS.floor || 1;
    if (DS.journalLog) CHARS[_charIdx].journal = DS.journalLog;
    saveChars();
  }
  stopAmbient();
  if (typeof stopCorruptionSystem === 'function') stopCorruptionSystem();
  playTrack(getMenuTrack());
  goTo('menu');
  say('Returned to main menu. Progress saved.');
}

function closeEscapeConfirm() {
  var ov = document.getElementById('escape-confirm-overlay');
  if (ov) ov.style.display = 'none';
}

// ── SEASONAL MENU MUSIC ──
function getDungeonTrack() {
  if (!DS || !DS.dungeon) return null;
  var map = {
    'Crypt of Malachar': DS.floor <= 3 ? 'floor1' : DS.floor <= 6 ? 'floor2' : 'floor3',
    'The Ashbound Wastes': DS.floor <= 3 ? 'ash1' : DS.floor <= 6 ? 'ash2' : 'ash3',
    'Frosthold Abyss': DS.floor <= 3 ? 'frost1' : DS.floor <= 6 ? 'frost2' : 'frost3',
    'The Sunken Archives': DS.floor <= 3 ? 'sunken1' : DS.floor <= 6 ? 'sunken2' : 'sunken3',
    // hollow2 is skipped here too — see the matching TEMP note on the main
    // dungeon-track picker (~line 8856): the file never uploaded correctly
    // (it's a saved 404 page, not audio) so playing it just produces silence.
    'The Hollow': DS.floor <= 6 ? 'hollow1' : 'hollow3',
    'The Whispering Forest': DS.floor <= 3 ? 'whisper1' : DS.floor <= 6 ? 'whisper2' : 'whisper3',
  };
  return map[DS.dungeon] || null;
}

function getNightModeHoursRemaining() {
  var h = new Date().getHours();
  var m = new Date().getMinutes();
  if (h >= 20) return (24 - h - 1) + 8 + Math.round((60-m)/60);
  if (h < 8) return (8 - h - 1) + Math.round((60-m)/60);
  return 0;
}

// ── LEO EASTER EGG ──
function checkLeoEasterEgg(name) {
  if (!name) return;
  var n = name.trim().toLowerCase();
  if (n === 'leo' || n === 'leonardo') {
    setTimeout(function() {
      setEvent('good', '⚔ Leo enters the dungeon. The dungeon does not know what is coming.');
      say('Leo. The dungeon has heard this name before. It fears it.');
      sfx('sfx-unlock');
    }, 3500);
  }
}

// ── GAMEPLAY SETTINGS ──
var MENU_TOGGLE_ITEMS = [
  { id:'menu-btn-raid',        label:'Daily Raid',       icon:'⚔' },
  { id:'menu-btn-bossrush',    label:'Boss Rush',        icon:'👑' },
  { id:'tournament-menu-btn',  label:'Tournament',       icon:'🏆' },
  { id:'menu-btn-afk',         label:'Endless Descent',  icon:'⬇' },
  { id:'menu-btn-void',        label:'Void Mode',        icon:'🌑' },
  { id:'vr-menu-btn',          label:'Void Reaper',      icon:'🌑' },
  { id:'menu-btn-spire',       label:'The Spire',        icon:'🗼' },
  { id:'menu-btn-siege',       label:'The Siege',        icon:'🏰' },
  { id:'menu-btn-challenges',  label:'Challenges',       icon:'🔥' },
  { id:'menu-btn-events',      label:'Events',           icon:'✦' },
  { id:'menu-btn-highscore',   label:'High Score',       icon:'📊' },
  { id:'menu-btn-chronicles',  label:'Chronicles',       icon:'📚' },
  { id:'menu-btn-graveyard',   label:'The Graveyard',    icon:'⚰️' },
  { id:'menu-btn-obituary',    label:'Obituary',         icon:'☠️' },
  { id:'menu-btn-bounty',      label:'Bounty Board',     icon:'📋' },
  { id:'menu-btn-blacksmith',  label:'Blacksmith',       icon:'⚒' },
  { id:'menu-btn-mine',        label:'The Mine',          icon:'⛏' },
];

function renderMenuToggles() {
  var container = document.getElementById('gameplay-menu-toggles');
  if (!container) return;
  var prefs = _jsonParseSafe(DDStore.getItem('dd_menu_prefs'), '{}');
  container.innerHTML = '';
  MENU_TOGGLE_ITEMS.forEach(function(item) {
    var isOn = prefs[item.id] !== false;
    var row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-panel);border:1px solid var(--border-dim);margin-bottom:6px;';
    var label = document.createElement('div');
    label.style.cssText = 'font-family:Cinzel,serif;font-size:0.78rem;color:var(--ash-light);';
    label.textContent = item.icon + ' ' + item.label;
    var btn = document.createElement('button');
    btn.className = 'toggle-btn ' + (isOn ? 'on' : '');
    btn.textContent = isOn ? 'Show' : 'Hide';
    btn.setAttribute('aria-label', item.label + ' currently ' + (isOn ? 'visible' : 'hidden'));
    btn.onclick = (function(itemId, itemLabel) {
      return function() {
        var p = _jsonParseSafe(DDStore.getItem('dd_menu_prefs'), '{}');
        p[itemId] = !(p[itemId] !== false);
        DDStore.setItem('dd_menu_prefs', JSON.stringify(p));
        loadGameplaySettings(); renderMenuToggles();
        say(itemLabel + (p[itemId] === false ? ' hidden.' : ' shown.'));
      };
    })(item.id, item.label);
    row.appendChild(label); row.appendChild(btn);
    container.appendChild(row);
  });
}

// ── INDEXEDDB MY TRACKS ──
var _trackDB = null;
var _pendingSaveBlob = null;
var _pendingSaveUrl = '';

function initTrackDB(callback) {
  if (_trackDB) { callback(_trackDB); return; }
  try {
    if (!window.indexedDB) { callback(null); return; }
    var req = indexedDB.open('dd_tracks', 1);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('tracks')) db.createObjectStore('tracks', { keyPath: 'id' });
    };
    req.onsuccess = function(e) { _trackDB = e.target.result; callback(_trackDB); };
    req.onerror = function() { callback(null); };
  } catch(e) { callback(null); }
}

function renderMyTracks() {
  getAllTracksFromDB(function(tracks) {
    var section = document.getElementById('my-tracks-section');
    if (!section) return;
    if (tracks.length === 0) {
      section.innerHTML = '<div style="font-size:0.75rem;color:var(--text-dim);font-style:italic;padding:8px 0;">No saved tracks yet.</div>';
      return;
    }
    section.innerHTML = '';
    tracks.forEach(function(t) {
      var row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border-dim);';
      var playBtn = document.createElement('button');
      playBtn.className = 'mp-track-btn';
      playBtn.style.cssText = 'flex:1;text-align:left;padding:6px 10px;';
      playBtn.innerHTML = '<span>🎵 ' + t.name + '</span>';
      playBtn.setAttribute('aria-label', 'Play ' + t.name);
      playBtn.onclick = function() { playTrackFromDB(t); };
      var delBtn = document.createElement('button');
      delBtn.className = 'btn-ghost';
      delBtn.style.cssText = 'padding:4px 8px;font-size:0.65rem;border-color:#6a2020;color:#c06060;flex-shrink:0;';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', 'Delete ' + t.name);
      delBtn.onclick = function() { deleteTrackFromDB(t.id); };
      row.appendChild(playBtn); row.appendChild(delBtn);
      section.appendChild(row);
    });
  });
}

