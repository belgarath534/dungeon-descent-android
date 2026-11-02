// --════════════════════════
// THE HUNTING GROUNDS — BOUNTY RANK + AFK HUNT WITH BRIAN NARRATOR
// --════════════════════════

// BUGFIX (security): this used to call ElevenLabs directly from the client
// with a hardcoded API key, which ships to every install of the app —
// anyone can pull it out of the bundle and burn the account's credits on
// it, which is almost certainly what actually happened. The key has been
// removed and rotated; narration now goes through Amazon Polly (Brian
// neural voice) and is only ever called from the narrateHuntLine Cloud
// Function (see /functions/index.js), which holds the real AWS
// credentials server-side, requires a signed-in Firebase user, and rate
// limits per-user daily usage. Signed-out players still hear the Hunting
// Grounds narration — it just falls back straight to device TTS below,
// same as any proxy failure.
var BRIAN_PROXY_URL = 'https://leonardo1212-109323203666.us-central1.run.app';
var _brianAudio = null;
var _brianQueue = [];
var _brianPlaying = false;

async function brianSay(text) {
  _brianQueue.push(text);
  if (!_brianPlaying) brianPlayNext();
}

async function brianPlayNext() {
  if (_brianQueue.length === 0) { _brianPlaying = false; return; }
  _brianPlaying = true;
  var text = _brianQueue.shift();
  try {
    var user = getFirebaseUser();
    if (!user) throw new Error('Not signed in — narrator voice requires an account.');
    var idToken = await user.getIdToken();
    var response = await fetch(BRIAN_PROXY_URL, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + idToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: text })
    });
    if (!response.ok) throw new Error('Narrator proxy error: ' + response.status);
    var blob = await response.blob();
    var url = URL.createObjectURL(blob);
    if (_brianAudio) { _brianAudio.pause(); _brianAudio = null; }
    _brianAudio = new Audio(url);
    _brianAudio.onended = function() { URL.revokeObjectURL(url); brianPlayNext(); };
    var bp = _brianAudio.play();
    // BUGFIX: a failed play() (autoplay policy, decode error, etc.) used to
    // be swallowed here with an empty .catch() — real audio came back from
    // the proxy, but if the browser refused to actually play it, nothing
    // happened and nothing was said at all. Fall back to say() instead.
    if (bp && bp.catch) {
      bp.catch(function(err) {
        console.warn('Brian audio playback failed:', err);
        say(text);
        setTimeout(function() { brianPlayNext(); }, 2500);
      });
    }
  } catch(e) {
    console.warn('Brian TTS error:', e);
    // BUGFIX: this used to call window.speechSynthesis directly, which is
    // unreliable — often silently produces no sound at all — inside this
    // app's WebView, especially with VoiceOver/TalkBack active. say() ->
    // _saySR() -> Capacitor's native ScreenReader.speak() is the actual
    // path every other spoken line in the game already relies on, so
    // route the fallback through that instead of a second, unproven one.
    say(text);
    setTimeout(function() { brianPlayNext(); }, 2500);
  }
}

// ── BOUNTY RANK SYSTEM ────────────────────────────────────────────────────────

var BOUNTY_RANKS = [
  { rank:1,  name:'Scout',         xpNeeded:0,    desc:'Basic bounties available.' },
  { rank:2,  name:'Tracker',       xpNeeded:100,  desc:'Rare items found in forest.' },
  { rank:3,  name:'Hunter',        xpNeeded:250,  desc:'Elite bounties unlocked.' },
  { rank:4,  name:'Stalker',       xpNeeded:500,  desc:'Bonus gold from hunts.' },
  { rank:5,  name:'Predator',      xpNeeded:900,  desc:'Legendary items can drop.' },
  { rank:6,  name:'Warden',        xpNeeded:1400, desc:'Hunt duration increased.' },
  { rank:7,  name:'Shadowblade',   xpNeeded:2000, desc:'Critical hunt strikes unlocked.' },
  { rank:8,  name:'Deathstalker',  xpNeeded:2800, desc:'Legendary bounties unlocked.' },
  { rank:9,  name:'Forest Reaper', xpNeeded:3800, desc:'Maximum bounty rewards.' },
  { rank:10, name:'The Unseen',    xpNeeded:5000, desc:'Master hunter. All rewards unlocked.' },
];

function getBountyRankData() {
  return _jsonParseSafe(DDStore.getItem('dd_bounty_rank'), '{"rank":1,"xp":0}');
}
function saveBountyRankData(d) { DDStore.setItem('dd_bounty_rank', JSON.stringify(d)); }

function getCurrentRank() {
  var d = getBountyRankData();
  var rank = BOUNTY_RANKS[0];
  for (var i = 0; i < BOUNTY_RANKS.length; i++) {
    if (d.xp >= BOUNTY_RANKS[i].xpNeeded) rank = BOUNTY_RANKS[i];
  }
  return rank;
}

function addBountyXP(xp) {
  var d = getBountyRankData();
  var oldRank = getCurrentRank();
  d.xp += xp;
  saveBountyRankData(d);
  var newRank = getCurrentRank();
  if (newRank.rank > oldRank.rank) {
    huntLog('🏹 RANK UP! You are now a ' + newRank.name + '!', 'rank');
    brianSay('Rank up. You are now ' + newRank.name + '. ' + newRank.desc);
    showToast('🏹 Bounty Rank ' + newRank.rank + ': ' + newRank.name + '!', 'gold');
  }
  updateHuntRankUI();
}

function updateHuntRankUI() {
  var d = getBountyRankData();
  var rank = getCurrentRank();
  var nextRank = BOUNTY_RANKS[Math.min(rank.rank, BOUNTY_RANKS.length - 1)];
  var xpForNext = nextRank.xpNeeded;
  var xpPrev = rank.xpNeeded;
  var pct = xpForNext > xpPrev ? Math.min(100, ((d.xp - xpPrev) / (xpForNext - xpPrev)) * 100) : 100;

  var rn = document.getElementById('hunt-rank-num'); if(rn) rn.textContent = rank.rank;
  var rx = document.getElementById('hunt-rank-xp'); if(rx) rx.textContent = d.xp;
  var rm = document.getElementById('hunt-rank-xp-max'); if(rm) rm.textContent = xpForNext;
  var rb = document.getElementById('hunt-rank-bar'); if(rb) rb.style.width = pct + '%';
  var rl = document.getElementById('hunt-rank-label'); if(rl) rl.textContent = rank.name + ' — ' + rank.desc;
}

// ── HUNT SYSTEM ───────────────────────────────────────────────────────────────

var HUNT = {
  active: false,
  charIdx: 0,
  hp: 100, maxHp: 100,
  atk: [8,14], def: 2,
  kills: 0, items: 0, gold: 0,
  timer: null,
  intervalMs: 30000,
};

var HUNT_ENEMIES = [
  {name:'Shadow Wolf',     hp:60,  atk:[8,14],  gold:25, xp:15},
  {name:'Forest Wraith',   hp:50,  atk:[10,16], gold:30, xp:18},
  {name:'Cursed Boar',     hp:80,  atk:[7,12],  gold:20, xp:12},
  {name:'Vine Strangler',  hp:70,  atk:[9,14],  gold:28, xp:16},
  {name:'Hollow Scout',    hp:55,  atk:[11,17], gold:35, xp:20},
  {name:'Night Stalker',   hp:90,  atk:[12,18], gold:40, xp:25},
  {name:'Bone Archer',     hp:65,  atk:[10,15], gold:32, xp:18},
  {name:'Swamp Horror',    hp:100, atk:[13,20], gold:45, xp:28},
];

var HUNT_ITEMS = [
  {name:'Iron Scrap',      icon:'🪨', type:'material', rarity:'common'},
  {name:'Shadow Essence',  icon:'🌑', type:'material', rarity:'uncommon'},
  {name:'Forest Herb',     icon:'🌿', type:'potion',   rarity:'common'},
  {name:'Bone Fragment',   icon:'🦴', type:'material', rarity:'common'},
  {name:'Void Crystal',    icon:'💎', type:'material', rarity:'rare'},
  {name:'Ancient Coin',    icon:'🪙', type:'gold',     rarity:'uncommon', gold:50},
  {name:'Hunters Rune',  icon:'✨', type:'special',  rarity:'rare'},
  {name:'Dark Pelt',       icon:'🐺', type:'material', rarity:'uncommon'},
];

var HUNT_NARRATION = {
  enter:    ["The forest swallows you whole. Something watches from the dark.", "Leaves crunch beneath your feet. The hunt begins.", "The trees close in. You are not alone here."],
  enemy:    ["Something emerges from the shadows.", "A creature blocks your path.", "You are not alone. Something approaches.", "The undergrowth stirs. An enemy reveals itself."],
  kill:     ["The creature falls. The forest grows quiet.", "Another enemy defeated. Your blade runs dark.", "It is done. You press deeper into the forest.", "The hunt continues. Another falls before you."],
  item:     ["Something catches your eye in the dirt.", "A glint in the darkness. You reach down.", "Among the fallen leaves, you find something useful."],
  hurt:     ["You take a wound. Stay focused.", "The enemy draws blood. Keep moving.", "That one hurt. You press on regardless."],
  lowHp:    ["Your wounds are severe. The forest senses weakness.", "You are bleeding. The darkness grows bolder.", "Critical condition. One more hit could end this hunt."],
  rest:     ["A moment of stillness. You catch your breath.", "The forest is quiet for now.", "Nothing stirs. You recover slightly."],
  rankUp:   ["Your skill grows. The forest respects strength.", "A new rank achieved. The hunt rewards the worthy."],
  return:   ["You emerge from the forest. The hunt is over.", "Daylight returns. You carry your spoils home.", "The forest releases you. For now."],
};

function getHuntNarration(type) {
  var lines = HUNT_NARRATION[type] || ["The hunt continues."];
  return lines[Math.floor(Math.random() * lines.length)];
}

function huntLog(msg, type) {
  var log = document.getElementById('hunt-log');
  if (!log) return;
  var line = document.createElement('div');
  line.className = 'hunting-log-line' + (type ? ' ' + type : '');
  line.textContent = msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function updateHuntStatsUI() {
  var c = CHARS[HUNT.charIdx];
  var cn = document.getElementById('hunt-char-name'); if(cn) cn.textContent = c ? c.name : 'None';
  var hs = document.getElementById('hunt-status-text'); if(hs) hs.textContent = HUNT.active ? 'Hunting...' : 'Idle';
  var hh = document.getElementById('hunt-hp-text'); if(hh) hh.textContent = HUNT.active ? HUNT.hp + ' / ' + HUNT.maxHp : '—';
  var hk = document.getElementById('hunt-kills'); if(hk) hk.textContent = HUNT.kills;
  var hi = document.getElementById('hunt-items'); if(hi) hi.textContent = HUNT.items;
  var hg = document.getElementById('hunt-gold'); if(hg) hg.textContent = HUNT.gold + 'g';
}

function renderHuntCharList() {
  // Reload CHARS fresh from storage
  CHARS = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]');
  var container = document.getElementById('hunt-char-list');
  if (!container) return;
  container.innerHTML = '';
  if (!CHARS || CHARS.length === 0) {
    container.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">No characters. Create one first.</p>';
    return;
  }
  CHARS.forEach(function(c, i) {
    if (!c || !c.name) return;
    var btn = document.createElement('button');
    var sel = i === HUNT.charIdx;
    btn.style.cssText = 'width:100%;padding:8px;background:' + (sel?'#030f03':'#050505') + ';border:1px solid ' + (sel?'#44aa44':'#111') + ';color:' + (sel?'#44ff88':'#555') + ';font-family:Cinzel,serif;font-size:0.62rem;cursor:pointer;text-align:left;';
    btn.setAttribute('aria-label', c.name + ' ' + (c.cls||'') + ' level ' + (c.level||1) + (sel?' selected':''));
    btn.textContent = (sel?'► ':' ') + c.name + ' — ' + (c.cls||'?') + ' Lv.' + (c.level||1);
    btn.onclick = function(){ HUNT.charIdx = i; renderHuntCharList(); };
    container.appendChild(btn);
  });
}

function loadHuntingGrounds() {
  updateHuntRankUI();
  renderHuntCharList();
  updateHuntStatsUI();
  // Show/hide controls based on active state
  var startBtn = document.getElementById('hunt-start-btn');
  var stopBtn = document.getElementById('hunt-stop-btn');
  var charSel = document.getElementById('hunt-char-select');
  if (startBtn) startBtn.style.display = HUNT.active ? 'none' : '';
  if (stopBtn) stopBtn.style.display = HUNT.active ? '' : 'none';
  if (charSel) charSel.style.display = HUNT.active ? 'none' : '';
  say('The Hunting Grounds. Bounty Rank ' + getCurrentRank().rank + '. ' + (HUNT.active ? 'Your hunter is active in the forest.' : 'Select a character and enter the forest.'));
}

function startHunt() {
  if (!CHARS || CHARS.length === 0) { say('No characters available.'); return; }
  var c = CHARS[HUNT.charIdx];
  if (!c) { say('Select a character first.'); return; }

  HUNT.active = true;
  // Characters don't store HP, attack or defense, so everyone hunted with 100 HP and 8–14 attack
  HUNT.hp = (HP_MAP[c.cls] || 100) + ((c.level || 1) - 1) * 5;
  HUNT.maxHp = HUNT.hp;
  HUNT.atk = (ATK_MAP[c.cls] || [8,14]).slice();
  HUNT.def = DEF_MAP[c.cls] || 2;
  HUNT.kills = 0;
  HUNT.items = 0;
  HUNT.gold = 0;

  // Update UI
  var startBtn = document.getElementById('hunt-start-btn'); if(startBtn) startBtn.style.display = 'none';
  var stopBtn = document.getElementById('hunt-stop-btn'); if(stopBtn) stopBtn.style.display = '';
  var charSel = document.getElementById('hunt-char-select'); if(charSel) charSel.style.display = 'none';

  // Start forest ambience
  try {
    if (window.AUD && AUD.tracks && AUD.tracks['ambient-whisper']) {
      AUD.tracks['ambient-whisper'].loop = true;
      AUD.tracks['ambient-whisper'].volume = 0.4;
      AUD.tracks['ambient-whisper'].play().catch(function(){});
    }
  } catch(e2) {}

  var enterLine = getHuntNarration('enter');
  huntLog('🌲 ' + c.name + ' enters the Hunting Grounds.', 'system');
  updateHuntStatsUI();
  // Play ambience first for 5 seconds, then Brian speaks
  setTimeout(function(){
    huntLog(enterLine, 'system');
    brianSay(enterLine);
  }, 5000);

  // Start hunt loop - first tick after 8 seconds (ambient intro)
  // Then random 25-45 seconds between events
  setTimeout(function() {
    if (!HUNT.active) return;
    huntTick();
    scheduleNextHuntTick();
  }, 8000);
  say('Hunt started. Brian will narrate. Keep the screen open.');
}

function scheduleNextHuntTick() {
  if (!HUNT.active) return;
  // Random delay between 25 and 45 seconds
  var delay = 25000 + Math.floor(Math.random() * 20000);
  HUNT.timer = setTimeout(function() {
    if (!HUNT.active) return;
    huntTick();
    scheduleNextHuntTick();
  }, delay);
}

function huntTick() {
  if (!HUNT.active) return;

  var rank = getCurrentRank();
  var roll = Math.random();

  // 55% chance encounter enemy, 20% find item, 15% rest/recover, 10% nothing
  if (roll < 0.55) {
    huntEncounterEnemy(rank);
  } else if (roll < 0.75) {
    huntFindItem(rank);
  } else if (roll < 0.90) {
    huntRest();
  } else {
    huntLog('The forest is still. Nothing moves.', 'system');
  }

  updateHuntStatsUI();

  // Check if hunter dies
  if (HUNT.hp <= 0) {
    HUNT.hp = 0;
    huntLog('💀 ' + (CHARS[HUNT.charIdx]?CHARS[HUNT.charIdx].name:'Hunter') + ' has fallen. The hunt ends.', 'enemy');
    brianSay('Your hunter has fallen. The forest claims another. The hunt is over.');
    stopHunt(true);
  }
}

function huntEncounterEnemy(rank) {
  // Pick enemy — harder enemies at higher ranks
  var poolSize = Math.min(HUNT_ENEMIES.length, 2 + rank.rank);
  var pool = HUNT_ENEMIES.slice(0, poolSize);
  var enemy = pool[Math.floor(Math.random() * pool.length)];

  var narLine = getHuntNarration('enemy');
  huntLog('⚔️ ' + enemy.name + ' appears!', 'enemy');

  // Calculate damage exchange
  var playerAtk = Math.floor(Math.random() * (HUNT.atk[1] - HUNT.atk[0] + 1)) + HUNT.atk[0];
  var crit = Math.random() < 0.12;
  if (crit) playerAtk = Math.round(playerAtk * 1.8);
  var dmgToEnemy = Math.max(1, playerAtk - enemy.atk[0]);

  var enemyAtk = Math.floor(Math.random() * (enemy.atk[1] - enemy.atk[0] + 1)) + enemy.atk[0];
  var dmgToPlayer = Math.max(1, enemyAtk - HUNT.def);

  // Assume player wins if they deal enough — scale by rank
  var winChance = 0.55 + (rank.rank * 0.04);
  var playerWins = Math.random() < winChance;

  if (playerWins) {
    var goldEarned = enemy.gold + (rank.rank >= 4 ? Math.round(enemy.gold * 0.3) : 0);
    var xpEarned = enemy.xp;
    // Rank 7's "Critical hunt strikes unlocked": a critical kill pays double rank XP (it changed nothing)
    if (crit && rank.rank >= 7) xpEarned *= 2;
    HUNT.kills++;
    HUNT.gold += goldEarned;
    addGlobalGold(goldEarned);
    addBountyXP(xpEarned);

    huntLog((crit?'💥 CRITICAL! ':'') + 'Defeated ' + enemy.name + '. +' + goldEarned + 'g +' + xpEarned + ' XP', 'system');

    // Brian speaks most of the time on normal kills
    if (Math.random() < 0.70) {
      brianSay(getHuntNarration('enemy'));
      setTimeout(function(){ brianSay(getHuntNarration('kill')); }, 4000);
    }
    // Always Brian on kill milestones
    if (HUNT.kills === 10 || HUNT.kills === 25 || HUNT.kills === 50) {
      brianSay('Remarkable. ' + HUNT.kills + ' enemies have fallen before you.');
    }

    try { updateBountyProgress('kill', enemy.name, 'Hunting Grounds'); } catch(e2) {}

  } else {
    HUNT.hp -= dmgToPlayer;
    huntLog('🩸 ' + enemy.name + ' wounds you for ' + dmgToPlayer + ' damage. (' + Math.max(0,HUNT.hp) + ' HP)', 'enemy');

    // Always Brian when HP is critical
    if (HUNT.hp < HUNT.maxHp * 0.3) {
      brianSay(getHuntNarration('lowHp'));
    } else if (Math.random() < 0.65) {
      // Brian comments on most regular hits
      brianSay(getHuntNarration('hurt'));
    }
  }
}

function huntFindItem(rank) {
  // Higher rank = better items
  var pool = rank.rank >= 5
    ? HUNT_ITEMS
    : HUNT_ITEMS.filter(function(i){ return i.rarity !== 'rare'; });

  var item = pool[Math.floor(Math.random() * pool.length)];
  HUNT.items++;

  var findLine = getHuntNarration('item');
  huntLog('✨ Found: ' + item.icon + ' ' + item.name + ' (' + item.rarity + ')', 'item');

  if (item.type === 'gold') {
    var g = item.gold || 30;
    HUNT.gold += g;
    addGlobalGold(g);
    huntLog('  → +' + g + ' gold', 'item');
    // Brian comments on most gold finds
    if (Math.random() < 0.55) brianSay('An ancient coin catches the light. Worth ' + g + ' gold.');
  } else {
    try {
      var inv = getGlobalInventory();
      inv.push({name: item.name, icon: item.icon, type: item.type, desc: 'Found in the Hunting Grounds.', rarity: item.rarity});
      saveGlobalInventory(inv);
    } catch(e2) {}
    // Brian always speaks for rare items, and most of the time for others now
    if (item.rarity === 'rare') {
      brianSay(getHuntNarration('item') + ' Something rare. ' + item.name + '.');
    } else if (Math.random() < 0.55) {
      brianSay(getHuntNarration('item') + ' ' + item.name + '.');
    }
  }

  addBountyXP(8);
}

function huntRest() {
  var healAmt = Math.round(HUNT.maxHp * 0.08);
  HUNT.hp = Math.min(HUNT.maxHp, HUNT.hp + healAmt);
  huntLog('💚 Rest. Recovered ' + healAmt + ' HP. (' + HUNT.hp + ' HP)', 'system');
  // Brian comments on about half of rest ticks
  if (Math.random() < 0.45) brianSay(getHuntNarration('rest'));
}

function stopHunt(died) {
  if (HUNT.timer) { clearTimeout(HUNT.timer); HUNT.timer = null; }
  HUNT.active = false;

  // Stop forest ambience
  try {
    if (window.AUD && AUD.tracks && AUD.tracks['ambient-whisper']) {
      AUD.tracks['ambient-whisper'].pause();
    }
  } catch(e2) {}

  if (!died) {
    var returnLine = getHuntNarration('return');
    huntLog('📯 Hunt ended. ' + HUNT.kills + ' enemies slain, ' + HUNT.items + ' items found, ' + HUNT.gold + 'g earned.', 'rank');
    brianSay(returnLine + ' You slew ' + HUNT.kills + ' enemies and found ' + HUNT.items + ' items.');
  }

  updateHuntStatsUI();
  var startBtn = document.getElementById('hunt-start-btn'); if(startBtn) startBtn.style.display = '';
  var stopBtn = document.getElementById('hunt-stop-btn'); if(stopBtn) stopBtn.style.display = 'none';
  var charSel = document.getElementById('hunt-char-select'); if(charSel) charSel.style.display = '';
  updateTrophyDisplay();
}

function leaveHuntingGrounds() {
  if (HUNT.active) {
    // Hunt keeps running in background if screen changes
    huntLog('You step away. The hunt continues without you.', 'system');
  }
  goTo('bounty');
}

// --════════════════════════
// THE SIEGE — FORTRESS DEFENSE MODE
// --════════════════════════

var SG = {
  wave: 1, maxWaves: 10,
  difficulty: 'easy',
  charIdx: 0,
  hp: 100, maxHp: 100,
  atk: [8,14], def: 2, sp: 20, maxSp: 20,
  potions: 2,
  gold: 0, wavePoints: 0,
  baseDur: 50, baseMaxDur: 50, baseLevel: 1,
  minionAtk: 0, minionCount: 0,
  enemy: null,
  damageDealtThisWave: 0,
  inCombat: false,
  siegeActive: false
};

// Difficulty enemy pools
var SIEGE_POOLS = {
  easy: [
    {name:'Crypt Rat',       hp:40,  atk:[4,8],  def:0, gold:30},
    {name:'Brittle Skeleton',hp:55,  atk:[6,10], def:1, gold:35},
    {name:'Tomb Bat',        hp:35,  atk:[5,9],  def:0, gold:28},
    {name:'Grave Crawler',   hp:60,  atk:[7,11], def:1, gold:40},
    {name:'Ashen Wisp',      hp:45,  atk:[8,12], def:0, gold:38},
    {name:'Cinder Wraith',   hp:65,  atk:[9,14], def:1, gold:45},
    {name:'Ash Crawler',     hp:70,  atk:[8,13], def:2, gold:48},
    {name:'Scorched Husk',   hp:80,  atk:[10,15],def:2, gold:52},
    {name:'Char Bat',        hp:55,  atk:[9,13], def:1, gold:42},
    {name:'Wailing Wraith',  hp:75,  atk:[11,16],def:1, gold:55},
  ],
  normal: [
    {name:'Scorched Husk',   hp:90,  atk:[12,18],def:3, gold:65},
    {name:'Flame Wraith',    hp:100, atk:[14,20],def:3, gold:70},
    {name:'Molten Knight',   hp:120, atk:[15,22],def:4, gold:80},
    {name:'Hollow Bride',    hp:95,  atk:[13,19],def:3, gold:68},
    {name:'The Portrait',    hp:85,  atk:[14,20],def:2, gold:72},
    {name:'Creaking Step',   hp:80,  atk:[12,18],def:3, gold:65},
    {name:'The Reflection',  hp:110, atk:[15,21],def:4, gold:78},
    {name:'The Twin',        hp:100, atk:[14,20],def:3, gold:75},
    {name:'Char Stalker',    hp:130, atk:[16,23],def:5, gold:85},
    {name:'Blighted Overseer',hp:140,atk:[17,25],def:5, gold:90},
  ],
  nightmare: [
    {name:'The Door Warden', hp:160, atk:[18,26],def:6, gold:110},
    {name:'The Music Box',   hp:150, atk:[20,28],def:5, gold:105},
    {name:'Void Shadow',     hp:170, atk:[22,30],def:6, gold:120},
    {name:'Infernal Ember',  hp:155, atk:[20,28],def:7, gold:115},
    {name:'Tide Wraith',     hp:175, atk:[21,30],def:6, gold:125},
    {name:'Ink Fiend',       hp:165, atk:[22,32],def:6, gold:118},
    {name:'Deep Stalker',    hp:180, atk:[23,33],def:7, gold:130},
    {name:'Pressure Beast',  hp:200, atk:[24,35],def:8, gold:140},
    {name:'Abyssal Eye',     hp:190, atk:[25,36],def:7, gold:145},
    {name:'Void Sentinel',   hp:210, atk:[26,38],def:8, gold:155},
  ]
};

var SIEGE_UPGRADES = [
  { id:'repair',   name:'Repair Kit',       desc:'Restore base durability to current level maximum.',          goldCost:600, wpCost:500,  icon:'🔧', repeatable:true },
  { id:'reinforce',name:'Reinforce Base',   desc:'Upgrade base to next level. +10% max durability per level.',goldCost:800, wpCost:0,    icon:'🧱', maxLevel:5 },
  { id:'station',  name:'Station Minion',   desc:'Deploy one of your captured minions to defend the base.',   goldCost:300, wpCost:200,  icon:'👾', repeatable:true },
  { id:'stockpile',name:'Extra Potion',     desc:'Stock one extra health potion for the battle ahead.',       goldCost:200, wpCost:0,    icon:'🧪', repeatable:true },
];

function getSiegeData() { return _jsonParseSafe(DDStore.getItem('dd_siege_data'), '{}'); }
function saveSiegeData(d) { DDStore.setItem('dd_siege_data', JSON.stringify(d)); }

function loadSiegeHub() {
  var d = getSiegeData();
  SG.baseLevel = d.baseLevel || 1;
  SG.baseDur = d.baseDur || 50;
  SG.baseMaxDur = 40 + (SG.baseLevel * 10);
  SG.wavePoints = d.wavePoints || 0;
  SG.difficulty = d.difficulty || 'easy';

  // Count stationed minions
  var minions = _jsonParseSafe(DDStore.getItem('dd_minions'), '[]');
  var stationed = d.stationedMinions || [];
  SG.minionCount = stationed.length;
  SG.minionAtk = stationed.reduce(function(t,m){ return t + (m.atk||8); }, 0);

  // Update base card
  var el = document.getElementById('siege-base-level'); if(el) el.textContent = 'Level ' + SG.baseLevel;
  var dp = document.getElementById('siege-dur-pct'); if(dp) dp.textContent = Math.round(SG.baseDur) + '%';
  var db = document.getElementById('siege-dur-bar'); if(db) db.style.width = SG.baseDur + '%';
  var md = document.getElementById('siege-max-dur'); if(md) md.textContent = SG.baseMaxDur + '%';
  var wp = document.getElementById('siege-wave-pts'); if(wp) wp.textContent = SG.wavePoints;
  var mc = document.getElementById('siege-minion-count'); if(mc) mc.textContent = SG.minionCount;

  // Update difficulty buttons
  ['easy','normal','nightmare'].forEach(function(d2) {
    var btn = document.getElementById('siege-diff-' + d2);
    if (!btn) return;
    var active = d2 === SG.difficulty;
    btn.style.background = active ? (d2==='easy'?'#0a1a0a':d2==='normal'?'#1a1000':'#1a0000') : '#0a0a0a';
    btn.style.borderColor = active ? (d2==='easy'?'#44aa44':d2==='normal'?'#cc9944':'#cc4444') : '#333';
    btn.style.color = active ? (d2==='easy'?'#44ff88':d2==='normal'?'#ffdd44':'#ff8888') : '#666';
  });

  renderSiegeUpgrades();
  renderSiegeCharList();

  say('The Siege. Your fortress is at level ' + SG.baseLevel + '. Base durability ' + Math.round(SG.baseDur) + ' percent. ' + SG.wavePoints + ' Wave Points. Choose your difficulty and character then begin.');
}

function renderSiegeUpgrades() {
  var container = document.getElementById('siege-upgrades-list');
  if (!container) return;
  var d = getSiegeData();
  var globalGold = getGlobalGold();
  container.innerHTML = '';

  SIEGE_UPGRADES.forEach(function(upg) {
    // Check if upgradeable
    if (upg.id === 'reinforce' && SG.baseLevel >= 5) return;
    if (upg.id === 'station') {
      var minions = _jsonParseSafe(DDStore.getItem('dd_minions'), '[]');
      if (minions.length === 0) return;
    }

    var canAfford = globalGold >= upg.goldCost && SG.wavePoints >= upg.wpCost;
    var div = document.createElement('div');
    div.className = 'siege-upgrade-item';
    div.setAttribute('tabindex','0');
    div.setAttribute('aria-label', upg.name + '. ' + upg.desc + '. Cost: ' + upg.goldCost + ' gold' + (upg.wpCost ? ' and ' + upg.wpCost + ' Wave Points' : '') + '.');

    var costStr = upg.goldCost + 'g' + (upg.wpCost ? ' + ' + upg.wpCost + ' WP' : '');
    div.innerHTML =
      '<div><div class="siege-upgrade-name">' + upg.icon + ' ' + upg.name + '</div>' +
      '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#555;">' + upg.desc + '</div></div>' +
      '<button onclick="buySiegeUpgrade(this.dataset.upg)" data-upg="' + upg.id + '" style="padding:6px 12px;background:' + (canAfford?'#1a1200':'#0a0a0a') + ';border:1px solid ' + (canAfford?'#cc9944':'#333') + ';color:' + (canAfford?'#ffdd44':'#444') + ';font-family:Cinzel,serif;font-size:0.6rem;cursor:pointer;white-space:nowrap;" aria-label="Buy upgrade">' + costStr + '</button>';

    container.appendChild(div);
  });
}

function renderSiegeCharList() {
  // Reload CHARS fresh from storage
  CHARS = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]');
  var container = document.getElementById('siege-char-list');
  if (!container) return;
  container.innerHTML = '';
  if (!CHARS || CHARS.length === 0) {
    container.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.65rem;color:#555;">No characters available. Create a character first.</p>';
    return;
  }
  CHARS.forEach(function(c, i) {
    if (!c || !c.name) return;
    var btn = document.createElement('button');
    var selected = i === SG.charIdx;
    btn.style.cssText = 'width:100%;padding:10px;background:' + (selected?'#1a1200':'#080808') + ';border:1px solid ' + (selected?'#cc9944':'#222') + ';color:' + (selected?'#ffdd44':'#888') + ';font-family:Cinzel,serif;font-size:0.65rem;cursor:pointer;text-align:left;';
    btn.setAttribute('aria-label', c.name + ', ' + (c.cls||'Unknown') + ', level ' + (c.level||1) + (selected ? ', selected' : ''));
    btn.textContent = (selected?'► ':' ') + c.name + ' — ' + (c.cls||'?') + ' Lv.' + (c.level||1) + ' (HP: ' + (c.maxHp||100) + ')';
    btn.onclick = function() { SG.charIdx = i; renderSiegeCharList(); say(c.name + ' selected for The Siege.'); };
    container.appendChild(btn);
  });
}

function setSiegeDifficulty(diff) {
  SG.difficulty = diff;
  var d = getSiegeData(); d.difficulty = diff; saveSiegeData(d);
  loadSiegeHub();
  say('Difficulty set to ' + diff + '. ' + (diff==='easy'?'Crypt and Ashbound enemies.':diff==='normal'?'Ashbound to Hollow enemies.':'Hollow to Abyssal Deep enemies.'));
}

function buySiegeUpgrade(id) {
  var upg = SIEGE_UPGRADES.find(function(u){ return u.id === id; });
  if (!upg) return;
  var globalGold = getGlobalGold();
  if (globalGold < upg.goldCost) { say('Not enough gold. Need ' + upg.goldCost + ' gold.'); showToast('Not enough gold', 'red'); return; }
  if (SG.wavePoints < upg.wpCost) { say('Not enough Wave Points. Need ' + upg.wpCost + '.'); showToast('Not enough Wave Points', 'red'); return; }

  // Deduct costs
  setGlobalGold(getGlobalGold() - upg.goldCost);
  updateTrophyDisplay();
  SG.wavePoints -= upg.wpCost;
  var d = getSiegeData(); d.wavePoints = SG.wavePoints;

  if (id === 'repair') {
    SG.baseDur = SG.baseMaxDur;
    d.baseDur = SG.baseDur;
    saveSiegeData(d);
    showToast('🔧 Base repaired to ' + SG.baseMaxDur + '%', 'gold');
    say('Base repaired. Durability restored to ' + SG.baseMaxDur + ' percent.');
  } else if (id === 'reinforce') {
    if (SG.baseLevel >= 5) { say('Base is already at maximum level.'); return; }
    SG.baseLevel++;
    SG.baseMaxDur = 40 + (SG.baseLevel * 10);
    SG.baseDur = Math.min(SG.baseDur + 10, SG.baseMaxDur);
    d.baseLevel = SG.baseLevel; d.baseDur = SG.baseDur;
    saveSiegeData(d);
    showToast('🧱 Base upgraded to level ' + SG.baseLevel + '!', 'gold');
    say('Base reinforced to level ' + SG.baseLevel + '. Maximum durability is now ' + SG.baseMaxDur + ' percent.');
  } else if (id === 'station') {
    var minions = _jsonParseSafe(DDStore.getItem('dd_minions'), '[]');
    if (minions.length === 0) { say('No minions available to station.'); return; }
    var stationed = d.stationedMinions || [];
    // The first minion was stationed again every time; send the next one not yet stationed.
    var nextMinion = minions.find(function(m){ return !stationed.some(function(s){ return s.id === m.id && s.name === m.name; }); });
    if (!nextMinion) { say('All your minions are already stationed.'); return; }
    stationed.push(nextMinion);
    d.stationedMinions = stationed;
    SG.minionCount = stationed.length;
    SG.minionAtk += (nextMinion.atk || 8);
    saveSiegeData(d);
    showToast('👾 ' + nextMinion.name + ' stationed at the fortress!', 'gold');
    say(nextMinion.name + ' stationed at your fortress. They will fight alongside you.');
  } else if (id === 'stockpile') {
    d.extraPotions = (d.extraPotions || 0) + 1;
    saveSiegeData(d);
    showToast('🧪 Extra potion stocked!', 'gold');
    say('Extra health potion added to your supplies.');
  }

  loadSiegeHub();
}

function startSiege() {
  if (!CHARS || CHARS.length === 0) {
    document.getElementById('siege-start-msg').textContent = 'Create a character first.';
    say('You need a character to begin The Siege. Go to Play and create one.');
    return;
  }

  var c = CHARS[SG.charIdx];
  if (!c) { document.getElementById('siege-start-msg').textContent = 'Select a character.'; return; }

  // Init from character — use FULL character stats
  CHARS = _jsonParseSafe(DDStore.getItem('dd_chars'), '[]');
  c = CHARS[SG.charIdx];
  if (!c) { say('Select a character first.'); return; }

  var d = getSiegeData();
  SG.wave = 1;
  // Characters don't store max HP or attack, so every hero fought as the same
  // 150 HP, 8–14 attack nobody. Use the class's stats and the level instead.
  var _sgLvl = c.level || 1;
  SG.hp = Math.round(((HP_MAP[c.cls] || 100) + (_sgLvl - 1) * 5) * 1.50);
  SG.maxHp = SG.hp;
  var baseAtk = ATK_MAP[c.cls] || [8,14];
  var lvlBonus = Math.floor(_sgLvl * 0.8);
  SG.atk = [baseAtk[0] + lvlBonus, baseAtk[1] + lvlBonus];
  SG.def = (DEF_MAP[c.cls] || 0) + Math.floor(_sgLvl * 0.3);
  // Potions: start with 4 plus any stockpiled
  SG.potions = 4 + (d.extraPotions || 0);
  SG.gold = 0;
  SG.damageDealtThisWave = 0;
  SG.inCombat = false;
  SG.siegeActive = true;
  SG.baseDur = d.baseDur || 50;
  SG.baseMaxDur = 40 + (SG.baseLevel * 10);

  // Stop any current music and start siege battle music
  try {
    if (window.AUD && AUD.tracks) {
      Object.keys(AUD.tracks).forEach(function(k){ var t=AUD.tracks[k]; if(t){t.pause();t.currentTime=0;} });
    }
    AUD.current = null;
    setTimeout(function(){ try { playTrack('void-reaper'); } catch(e2){} }, 300);
  } catch(e2) {}

  goTo('siege-battle');
  startSiegeWave();
}

function startSiegeWave() {
  // Pick enemy from pool — scale by wave
  var pool = SIEGE_POOLS[SG.difficulty] || SIEGE_POOLS.easy;
  var baseEnemy = pool[Math.min(SG.wave - 1, pool.length - 1)];
  // Everything grew 20% a wave, so wave 10 hit five times harder with nothing
  // given back: no one could win. Attack now grows 10% a wave (HP still 20%),
  // and you get 20% of your HP back between waves.
  var mult = Math.pow(1.20, SG.wave - 1);
  var atkMult = Math.pow(1.10, SG.wave - 1);
  if (SG.wave > 1) SG.hp = Math.min(SG.maxHp, SG.hp + Math.round(SG.maxHp * 0.20));

  SG.enemy = {
    name: baseEnemy.name,
    hp: Math.round(baseEnemy.hp * mult),
    maxHp: Math.round(baseEnemy.hp * mult),
    atk: [Math.round(baseEnemy.atk[0] * atkMult), Math.round(baseEnemy.atk[1] * atkMult)],
    def: Math.round(baseEnemy.def * mult),
    gold: Math.round(baseEnemy.gold * mult),
  };

  SG.damageDealtThisWave = 0;
  SG.inCombat = true;

  updateSiegeBattleUI();
  siegeLog('Wave ' + SG.wave + ' of ' + SG.maxWaves + ': ' + SG.enemy.name + ' approaches!');
  siegeLog('Enemy HP: ' + SG.enemy.hp + ' | ATK: ' + SG.enemy.atk[0] + '-' + SG.enemy.atk[1] + ' | DEF: ' + SG.enemy.def);
  say('Wave ' + SG.wave + '. ' + SG.enemy.name + ' approaches. HP: ' + SG.enemy.hp + '.');
  setSiegeCombatBtns(true);
}

function updateSiegeBattleUI() {
  var wl = document.getElementById('siege-wave-label'); if(wl) wl.textContent = 'Wave ' + SG.wave + ' / ' + SG.maxWaves;
  var gl = document.getElementById('siege-gold-label'); if(gl) gl.textContent = 'Gold: ' + SG.gold;
  var wpl = document.getElementById('siege-wpts-label'); if(wpl) wpl.textContent = 'WP: ' + SG.wavePoints;

  // Player HP
  var hpPct = Math.max(0, Math.min(100, (SG.hp / SG.maxHp) * 100));
  var hpBar = document.getElementById('siege-hp-bar');
  if (hpBar) { hpBar.style.width = hpPct + '%'; hpBar.style.background = hpPct < 25 ? '#cc4444' : hpPct < 50 ? '#cc8844' : '#44aa44'; }
  var hpTxt = document.getElementById('siege-hp-text'); if(hpTxt) hpTxt.textContent = Math.max(0,SG.hp) + ' / ' + SG.maxHp;

  var pn = document.getElementById('siege-player-name');
  if (pn && CHARS[SG.charIdx]) pn.textContent = CHARS[SG.charIdx].name || 'Hero';

  // Base durability
  var durPct = Math.max(0, SG.baseDur);
  var durBar = document.getElementById('siege-battle-dur-bar');
  if (durBar) { durBar.style.width = durPct + '%'; durBar.style.background = durPct < 25 ? '#cc4444' : '#cc9944'; }
  var durTxt = document.getElementById('siege-battle-dur'); if(durTxt) durTxt.textContent = Math.round(durPct) + '%';

  // Base under attack warning
  var warn = document.getElementById('siege-base-attack-warn');
  if (warn) warn.style.display = SG.hp <= 50 ? '' : 'none';

  // Enemy
  if (SG.enemy) {
    var en = document.getElementById('siege-enemy-name'); if(en) en.textContent = SG.enemy.name;
    var ehp = document.getElementById('siege-enemy-hp'); if(ehp) ehp.textContent = Math.max(0,SG.enemy.hp);
    var emhp = document.getElementById('siege-enemy-maxhp'); if(emhp) emhp.textContent = SG.enemy.maxHp;
    var ebar = document.getElementById('siege-enemy-bar');
    if (ebar) ebar.style.width = Math.max(0, (SG.enemy.hp / SG.enemy.maxHp) * 100) + '%';
    var el2 = document.getElementById('siege-enemy-label'); if(el2) el2.textContent = 'WAVE ' + SG.wave + ' ENEMY';
  }
}

function setSiegeCombatBtns(on) {
  ['siege-btn-attack','siege-btn-heavy','siege-btn-potion','siege-btn-minion'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = !on;
    btn.style.opacity = on ? '1' : '0.4';
  });
  var potBtn = document.getElementById('siege-btn-potion');
  if (potBtn) { potBtn.disabled = !on || SG.potions <= 0; potBtn.textContent = '🧪 Potion (' + SG.potions + ')'; }
  var minBtn = document.getElementById('siege-btn-minion');
  if (minBtn) { minBtn.disabled = !on || SG.minionCount === 0; }
  // Gun button — always re-render with correct state regardless of on/off
  updateSiegeGunButton();
  if (!on && !_gunState.charged) {
    var gunBtn = document.getElementById('siege-btn-gun');
    if (gunBtn) { gunBtn.disabled = true; gunBtn.style.opacity = '0.4'; }
  }
  if (!on) {
    var log = document.getElementById('siege-log');
    if (log) { log.setAttribute('tabindex','-1'); log.focus(); }
  } else {
    setTimeout(function(){ var b=document.getElementById('siege-btn-attack'); if(b&&!b.disabled) b.focus(); },50);
  }
}

function siegeLog(msg) {
  var log = document.getElementById('siege-log');
  if (!log) return;
  var line = document.createElement('div');
  // Never translated at all (unlike the main dungeon's addLog()) — every
  // Siege combat message stayed English regardless of language setting.
  line.textContent = (typeof t === 'function') ? t(msg) : msg;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function siegeAttack(type) {
  if (!SG.inCombat || !SG.enemy) return;
  setSiegeCombatBtns(false);

  var missed = type === 'heavy' && Math.random() < 0.30;
  var atkLow = SG.atk[0] || 8;
  var atkHigh = SG.atk[1] || 14;
  var raw = missed ? 0 : Math.floor(Math.random() * (atkHigh - atkLow + 1)) + atkLow;
  if (type === 'heavy' && !missed) raw = Math.round(raw * 1.6);
  var dmg = Math.max(1, raw - (SG.enemy.def || 0));
  var crit = !missed && Math.random() < 0.10;
  if (crit) dmg = Math.round(dmg * 1.8);

  if (missed) {
    siegeLog('You swing and miss!');
    say('Miss!');
  } else {
    SG.enemy.hp -= dmg;
    SG.damageDealtThisWave += dmg;
    siegeLog((crit ? t('CRITICAL! ') : '') + t('You deal ') + dmg + t(' damage to ') + SG.enemy.name + t('. (') + Math.max(0,SG.enemy.hp) + t(' HP left)'));
    say((crit?t('Critical hit! '):'') + dmg + t(' damage. Enemy has ') + Math.max(0,SG.enemy.hp) + t(' HP left.'));
  }

  updateSiegeBattleUI();

  if (SG.enemy.hp <= 0) {
    setTimeout(siegeEnemyDead, 400);
    return;
  }

  setTimeout(siegeEnemyAttack, 600);
}

function siegeUsePotion() {
  if (SG.potions <= 0) { say('No potions left.'); return; }
  SG.potions--;
  var heal = Math.round(SG.maxHp * 0.50);
  SG.hp = Math.min(SG.maxHp, SG.hp + heal);
  siegeLog('You use a potion and restore ' + heal + ' HP. (' + SG.hp + ' HP)');
  say('Potion used. Restored ' + heal + ' HP. Now at ' + SG.hp + ' HP. ' + SG.potions + ' potions left.');
  updateSiegeBattleUI();
  setSiegeCombatBtns(true);

  // Check if base attack stops
  if (SG.hp > 50) {
    siegeLog('Your HP is above 50 — the enemy returns focus to you!');
    say('HP above 50. Enemy targets you again.');
  }
}

function siegeCallMinion() {
  if (SG.minionCount === 0) { say('No minions stationed.'); return; }
  var dmg = Math.max(4, SG.minionAtk + Math.floor(Math.random() * 6));
  SG.enemy.hp -= dmg;
  SG.damageDealtThisWave += dmg;
  siegeLog('Your stationed minion attacks for ' + dmg + ' damage!');
  say('Minion attacks for ' + dmg + ' damage.');
  updateSiegeBattleUI();
  if (SG.enemy.hp <= 0) { setTimeout(siegeEnemyDead, 400); return; }
  // It was free and endless; it now takes your turn.
  setSiegeCombatBtns(false);
  setTimeout(function() { siegeEnemyAttack(); }, 700);
}

function siegeEnemyAttack() {
  if (!SG.enemy || SG.enemy.hp <= 0) return;
  var eLow = SG.enemy.atk[0];
  var eHigh = SG.enemy.atk[1];
  var eRaw = Math.floor(Math.random() * (eHigh - eLow + 1)) + eLow;
  var eDmg = Math.max(1, eRaw - (SG.def || 0));

  // If player HP below 50 — enemy attacks base instead
  if (SG.hp <= 50) {
    var baseDmg = Math.round(eDmg * 0.4);
    SG.baseDur -= baseDmg;
    siegeLog('⚠️ YOUR BASE IS UNDER ATTACK! ' + SG.enemy.name + ' hits the fortress for ' + baseDmg + ' durability damage!');
    say('Warning! Base under attack! Fortress loses ' + baseDmg + ' durability. Heal up fast!');

    if (SG.baseDur <= 0) {
      SG.baseDur = 0;
      updateSiegeBattleUI();
      setTimeout(siegeBaseDestroyed, 500);
      return;
    }
  } else {
    SG.hp -= eDmg;
    siegeLog(SG.enemy.name + t(' attacks you for ') + eDmg + t(' damage. (') + Math.max(0,SG.hp) + t(' HP left)'));
    say(t('Enemy deals ') + eDmg + t(' damage. You have ') + Math.max(0,SG.hp) + t(' HP left.'));

    if (SG.hp <= 50) {
      siegeLog('⚠️ HP dropped below 50! Enemy will now target your base!');
      say('Warning! Your HP is below 50. Enemy will start attacking your fortress!');
    }

    if (SG.hp <= 0) {
      SG.hp = 0;
      updateSiegeBattleUI();
      setTimeout(siegePlayerDead, 500);
      return;
    }
  }

  updateSiegeBattleUI();
  setSiegeCombatBtns(true);
}

function siegeEnemyDead() {
  var e = SG.enemy;
  // Gold reward
  SG.gold += e.gold;

  // Wave Points — 500 WP per 50 damage dealt (scaled)
  var wp = Math.floor(SG.damageDealtThisWave / 50) * 500;
  SG.wavePoints += wp;

  siegeLog(e.name + ' defeated! +' + e.gold + ' gold' + (wp > 0 ? ', +' + wp + ' Wave Points' : '') + '.');
  say(e.name + ' defeated! Earned ' + e.gold + ' gold' + (wp > 0 ? ' and ' + wp + ' Wave Points' : '') + '.');

  updateSiegeBattleUI();

  if (SG.wave >= SG.maxWaves) {
    setTimeout(siegeVictory, 800);
  } else {
    SG.wave++;
    SG.inCombat = false;
    setTimeout(function() {
      siegeLog('--- Wave ' + SG.wave + ' incoming ---');
      startSiegeWave();
    }, 1200);
  }
}

function siegePlayerDead() {
  SG.inCombat = false;
  setSiegeCombatBtns(false);
  siegeLog('You have fallen. The siege is lost.');
  say('You have fallen. The siege is lost. Your fortress survives but the battle is over.');
  showSiegeResult(false, 'fallen');
}

function siegeBaseDestroyed() {
  SG.inCombat = false;
  setSiegeCombatBtns(false);
  siegeLog('Your fortress has been destroyed!');
  say('Your fortress has been destroyed! Durability reached zero. The siege is lost.');
  showSiegeResult(false, 'base');
}

function siegeVictory() {
  SG.inCombat = false;
  setSiegeCombatBtns(false);
  siegeLog('All 10 waves defeated! The Siege is won!');
  say('Victory! All 10 waves defeated. The Siege is complete!');
  showSiegeResult(true, '');
}

function showSiegeResult(won, reason) {
  // Save progress
  var d = getSiegeData();
  d.baseDur = Math.max(SG.baseDur, 10); // base keeps at least 10% if destroyed
  d.baseLevel = SG.baseLevel;
  d.wavePoints = SG.wavePoints;

  // Award gold to global
  addGlobalGold(SG.gold);
  updateTrophyDisplay();

  if (won) {
    addTrophies(3);
    checkAchievements();
  }
  saveSiegeData(d);

  goTo('siege-result');
  var icon = document.getElementById('siege-result-icon');
  var title = document.getElementById('siege-result-title');
  var desc = document.getElementById('siege-result-desc');
  var rewards = document.getElementById('siege-result-rewards');

  if (won) {
    if (icon) icon.textContent = '🏆';
    if (title) { title.textContent = 'The Siege: Victory!'; title.style.color = '#ffdd44'; }
    if (desc) desc.textContent = 'You defended your fortress through all 10 waves. The enemies have been repelled. Your base stands strong.';
    if (rewards) rewards.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#44ff88;">+' + SG.gold + ' gold earned<br>+3 trophies awarded<br>+' + SG.wavePoints + ' Wave Points total</div>';
  } else {
    if (icon) icon.textContent = reason === 'base' ? '💥' : '💀';
    if (title) { title.textContent = reason === 'base' ? 'Fortress Destroyed' : 'You Have Fallen'; title.style.color = '#cc4444'; }
    if (desc) desc.textContent = reason === 'base'
      ? 'Your fortress durability reached zero. The enemies broke through. Upgrade your base and try again.'
      : 'You fought valiantly but were overwhelmed. Your fortress survives. Upgrade and return stronger.';
    if (rewards) rewards.innerHTML = '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#cc9944;">+' + SG.gold + ' gold earned this run<br>Base level ' + SG.baseLevel + ' preserved<br>' + SG.wavePoints + ' Wave Points saved</div>';
  }
}


// --════════════════════════
// FOURTH OF JULY EVENT SYSTEMS
// --════════════════════════

// Sparkler buff — every 3rd attack deals bonus fire damage
var _sparklerCount = 0;
function checkSparklerBuff(baseDmg) {
  if (getActiveEvent() !== 'july4') return 0;
  _sparklerCount++;
  if (_sparklerCount >= 3) {
    _sparklerCount = 0;
    var fireDmg = Math.round(DS.level * 2.5);
    addLog('🎇 Sparkler! +' + fireDmg + ' fire damage!');
    return fireDmg;
  }
  return 0;
}

// Fireworks drop — 15% chance from enemy kill
function checkFireworkDrop() {
  if (getActiveEvent() !== 'july4') return;
  if (Math.random() > 0.15) return;
  DS.inventory.push({
    name:'Firework',
    icon:'🎆',
    type:'special',
    desc:'Launch at an enemy for massive AoE damage. One use.',
    isFirework:true
  });
  addLog('🎆 A Firework dropped from the enemy!');
  sfx('sfx-firework');
  say('Firework found. Use it in combat for massive damage.');
}

// Firework use in combat
function useFirework(idx) {
  if (!DS.enemy) return;
  var dmg = 80 + DS.level * 5;
  DS.enemy.hp -= dmg;
  DS.inventory.splice(idx, 1);
  addLog('🎆 BOOM! Firework deals ' + dmg + ' damage to ' + DS.enemy.name + '!');
  sfx('sfx-firework');
  say('Firework! ' + dmg + ' massive damage!');
  updateEnemyBar();
  if (DS.enemy.hp <= 0) { setTimeout(enemyDead, 400); return; }
  setCombatBtns(true);
}

// Independence Tournament
var JULY4_TOURNAMENT = {
  active: false,
  score: 0,
  target: 0,
  kills: 0,
};

function getJuly4TournamentData() {
  return _jsonParseSafe(DDStore.getItem('dd_july4_tourney'), '{}');
}
function saveJuly4TournamentData(d) { DDStore.setItem('dd_july4_tourney', JSON.stringify(d)); }

function startJuly4Tournament(charIdx) {
  var d = getJuly4TournamentData();
  // Generate personal target based on character level
  var c = CHARS[charIdx];
  var lvl = c ? (c.level || 1) : 1;
  var target = 500 + (lvl * 100) + Math.floor(Math.random() * 500);
  // Round to nearest 50
  target = Math.round(target / 50) * 50;
  JULY4_TOURNAMENT.active = true;
  JULY4_TOURNAMENT.score = 0;
  JULY4_TOURNAMENT.target = target;
  JULY4_TOURNAMENT.kills = 0;
  d.target = target; d.score = 0; d.active = true;
  saveJuly4TournamentData(d);
  say('Independence Tournament started. Your target score is ' + target + ' points. Earn points by defeating enemies.');
}

function addJuly4TournamentScore(pts) {
  if (!JULY4_TOURNAMENT.active) return;
  JULY4_TOURNAMENT.score += pts;
  JULY4_TOURNAMENT.kills++;
  var d = getJuly4TournamentData();
  d.score = JULY4_TOURNAMENT.score;
  saveJuly4TournamentData(d);
}

function checkJuly4TournamentEnd() {
  if (!JULY4_TOURNAMENT.active) return;
  if (JULY4_TOURNAMENT.score >= JULY4_TOURNAMENT.target) {
    JULY4_TOURNAMENT.active = false;
    var d = getJuly4TournamentData();
    d.active = false; d.completed = true; d.place = 1;
    saveJuly4TournamentData(d);
    addGlobalGold(500); addTrophies(5);
    showToast('🏆 First Place! +500g +5 trophies!', 'gold');
    say('First place! You reached your target score of ' + JULY4_TOURNAMENT.target + '. 500 gold and 5 trophies awarded.');
  }
}

// Fireworks Corner at Home — fun XP minigame
var _fireworksCornerCooldown = false;
function openFireworksCorner() {
  if (getActiveEvent() !== 'july4') { say('The Fireworks Corner is only available during the Fourth of July event.'); return; }
  if (_fireworksCornerCooldown) { say('The fireworks are reloading. Wait a moment.'); return; }
  var xp = 50 + Math.floor(Math.random() * 50);
  addLog('🎆 You launch fireworks into the night sky! +' + xp + ' XP');
  sfx('sfx-firework');
  say('Fireworks launched! Beautiful. You earned ' + xp + ' experience points.');
  // Award XP to active character
  try {
    var c = CHARS[_charIdx];
    if (c) { c.xp = (c.xp || 0) + xp; saveChars(); }
  } catch(e2) {}
  showToast('🎆 +' + xp + ' XP!', 'gold');
  _fireworksCornerCooldown = true;
  setTimeout(function(){ _fireworksCornerCooldown = false; }, 8000);
}

// --════════════════════════
// BOUNTY BOARD SYSTEM
// --════════════════════════

var BOUNTY_TEMPLATES = [
  // Kill count bounties — correct enemy names per dungeon
  { id:'kill-crypt-shades', enemyType:'spirit',      title:'Shade Purge',         desc:'Slay 5 Hollow Shades in The Crypt.',                dungeon:'Crypt of Malachar',              type:'kill_type',  target:'Hollow Shade',       count:5,  gold:150, trophies:1, icon:'💀' },
  { id:'kill-crypt-wraiths', enemyType:'spirit',     title:'Wraith Hunter',       desc:'Slay 3 Wailing Wraiths in The Crypt.',              dungeon:'Crypt of Malachar',              type:'kill_type',  target:'Wailing Wraith',     count:3,  gold:200, trophies:1, icon:'👻' },
  { id:'kill-crypt-skeletons', enemyType:'undead',   title:'Bone Collector',      desc:'Slay 5 Brittle Skeletons in The Crypt.',            dungeon:'Crypt of Malachar',              type:'kill_type',  target:'Brittle Skeleton',   count:5,  gold:150, trophies:1, icon:'🦴' },
  { id:'kill-ash-wraiths', enemyType:'spirit',       title:'Cinder Wraith Hunt',  desc:'Slay 4 Cinder Wraiths in the Ashbound Wastes.',     dungeon:'The Ashbound Wastes',        type:'kill_type',  target:'Cinder Wraith',      count:4,  gold:200, trophies:1, icon:'🔥' },
  { id:'kill-ash-husks',         title:'Scorched Remains',    desc:'Slay 5 Scorched Husks in the Ashbound Wastes.',     dungeon:'The Ashbound Wastes',        type:'kill_type',  target:'Scorched Husk',      count:5,  gold:175, trophies:1, icon:'🔥' },
  { id:'kill-frost-shades', enemyType:'spirit',      title:'Frost Shade Slayer',  desc:'Slay 4 Frost Shades in Frosthold.',                 dungeon:'Frosthold Abyss',              type:'kill_type',  target:'Frost Shade',        count:4,  gold:175, trophies:1, icon:'❄️' },
  { id:'kill-frost-wraiths', enemyType:'spirit',     title:'Blizzard Hunter',     desc:'Slay 3 Blizzard Wraiths in Frosthold.',             dungeon:'Frosthold Abyss',              type:'kill_type',  target:'Blizzard Wraith',    count:3,  gold:200, trophies:1, icon:'❄️' },
  { id:'kill-sunken-archivists', title:'The Drowned',         desc:'Slay 4 Drowned Archivists in the Sunken Archives.', dungeon:'The Sunken Archives',        type:'kill_type',  target:'Drowned Archivist',  count:4,  gold:200, trophies:1, icon:'💧' },
  { id:'kill-sunken-ink',        title:'Ink Purge',           desc:'Slay 3 Ink Wraiths in the Sunken Archives.',        dungeon:'The Sunken Archives',        type:'kill_type',  target:'Ink Wraith',         count:3,  gold:225, trophies:1, icon:'💧' },
  { id:'kill-hollow-bride',      title:'The Hollow Bride',    desc:'Slay 3 Hollow Brides in The Hollow.',               dungeon:'The Hollow',             type:'kill_type',  target:'Hollow Bride',       count:3,  gold:250, trophies:2, icon:'🕯️' },
  { id:'kill-hollow-portraits',  title:'Burn the Portraits',  desc:'Slay 4 Portraits in The Hollow.',                   dungeon:'The Hollow',             type:'kill_type',  target:'The Portrait',       count:4,  gold:200, trophies:1, icon:'🕯️' },
  { id:'kill-whisper-wolves',    title:'Cursed Wolf Pack',    desc:'Slay 4 Cursed Wolves in the Whispering Forest.',    dungeon:'The Whispering Forest',      type:'kill_type',  target:'Cursed Wolf',        count:4,  gold:225, trophies:1, icon:'🌲' },
  { id:'kill-whisper-roots',     title:'Root Purge',          desc:'Slay 5 Root Crawlers in the Whispering Forest.',    dungeon:'The Whispering Forest',      type:'kill_type',  target:'Root Crawler',       count:5,  gold:175, trophies:1, icon:'🌲' },
  { id:'kill-infernal-wisps', enemyType:'spirit',    title:'Void Wisp Purge',     desc:'Slay 5 Void Wisps in The Infernal Descent.',        dungeon:'The Infernal Descent',   type:'kill_type',  target:'Void Wisp',          count:5,  gold:275, trophies:2, icon:'😈' },
  { id:'kill-infernal-wraiths', enemyType:'spirit',  title:'Void Wraith Hunter',  desc:'Slay 3 Void Wraiths in The Infernal Descent.',      dungeon:'The Infernal Descent',   type:'kill_type',  target:'Void Wraith',        count:3,  gold:300, trophies:2, icon:'😈' },
  { id:'kill-abyssal-eels',      title:'Eel Hunter',          desc:'Slay 3 Abyssal Eels in The Abyssal Deep.',          dungeon:'The Abyssal Deep',       type:'kill_type',  target:'Abyssal Eel',        count:3,  gold:250, trophies:2, icon:'🌊' },
  { id:'kill-abyssal-tide',      title:'Tide Wraith Slayer',  desc:'Slay 4 Tide Wraiths in The Abyssal Deep.',          dungeon:'The Abyssal Deep',       type:'kill_type',  target:'Tide Wraith',        count:4,  gold:225, trophies:2, icon:'🌊' },

  // Elite bounties
  { id:'elite-crypt',    title:'Elite Hunter',        desc:'Defeat an Elite enemy in The Crypt.',            dungeon:'Crypt of Malachar',            type:'kill_elite', count:1, gold:300, trophies:2, icon:'★' },
  { id:'elite-ash',      title:'Ashbound Champion',   desc:'Defeat an Elite enemy in the Ashbound Wastes.',  dungeon:'The Ashbound Wastes',      type:'kill_elite', count:1, gold:350, trophies:2, icon:'★' },
  { id:'elite-frost',    title:'Frost Giant',         desc:'Defeat an Elite enemy in Frosthold.',            dungeon:'Frosthold Abyss',            type:'kill_elite', count:1, gold:350, trophies:2, icon:'★' },
  { id:'elite-abyssal',  title:'Deep Terror',         desc:'Defeat an Elite enemy in The Abyssal Deep.',     dungeon:'The Abyssal Deep',     type:'kill_elite', count:1, gold:500, trophies:3, icon:'★' },
  { id:'elite-infernal', title:'Infernal Champion',   desc:'Defeat an Elite enemy in The Infernal Descent.', dungeon:'The Infernal Descent', type:'kill_elite', count:1, gold:500, trophies:3, icon:'★' },

  // Boss bounties
  { id:'boss-crypt',    title:'Crypt Cleansed',      desc:'Defeat the boss of The Crypt.',             dungeon:'Crypt of Malachar',            type:'kill_boss', count:1, gold:400,  trophies:3, icon:'👑' },
  { id:'boss-ash',      title:'Ash Lord Slain',      desc:'Defeat the boss of the Ashbound Wastes.',   dungeon:'The Ashbound Wastes',      type:'kill_boss', count:1, gold:450,  trophies:3, icon:'👑' },
  { id:'boss-frost',    title:'Winter Ended',        desc:'Defeat the boss of Frosthold.',             dungeon:'Frosthold Abyss',            type:'kill_boss', count:1, gold:450,  trophies:3, icon:'👑' },
  { id:'boss-sunken',   title:'Archives Sealed',     desc:'Defeat the boss of the Sunken Archives.',   dungeon:'The Sunken Archives',      type:'kill_boss', count:1, gold:500,  trophies:3, icon:'👑' },
  { id:'boss-hollow',   title:'Darkness Purged',     desc:'Defeat the boss of The Hollow.',            dungeon:'The Hollow',           type:'kill_boss', count:1, gold:500,  trophies:3, icon:'👑' },
  { id:'boss-infernal', title:'Infernal Sealed',     desc:'Defeat the boss of The Infernal Descent.',  dungeon:'The Infernal Descent', type:'kill_boss', count:1, gold:700,  trophies:5, icon:'👑' },
  { id:'boss-abyssal',  title:'The Deep Calmed',     desc:'Defeat the boss of The Abyssal Deep.',      dungeon:'The Abyssal Deep',     type:'kill_boss', count:1, gold:700,  trophies:5, icon:'👑' },

  // Floor bounties
  { id:'floor-5-any',   title:'Halfway There',       desc:'Reach floor 5 in any dungeon without dying.',    dungeon:'Any dungeon',   type:'reach_floor', count:5,  gold:200, trophies:1, icon:'🗺️' },
  { id:'floor-8-any',   title:'The Long Road',       desc:'Reach floor 8 in any dungeon without dying.',    dungeon:'Any dungeon',   type:'reach_floor', count:8,  gold:350, trophies:2, icon:'🗺️' },
  { id:'floor-10-any',  title:'Full Clear',          desc:'Reach floor 10 in any dungeon without dying.',   dungeon:'Any dungeon',   type:'reach_floor', count:10, gold:500, trophies:3, icon:'🗺️' },

  // Kill count any dungeon
  { id:'kills-10-any',  title:'Blood and Gold',      desc:'Defeat 10 enemies in a single run.',   dungeon:'Any dungeon', type:'kill_count', count:10, gold:150, trophies:1, icon:'⚔️' },
  { id:'kills-20-any',  title:'Relentless',          desc:'Defeat 20 enemies in a single run.',   dungeon:'Any dungeon', type:'kill_count', count:20, gold:250, trophies:2, icon:'⚔️' },
  { id:'kills-30-any',  title:'Slaughter',           desc:'Defeat 30 enemies in a single run.',   dungeon:'Any dungeon', type:'kill_count', count:30, gold:400, trophies:3, icon:'⚔️' },
];

function getBountyData() {
  return _jsonParseSafe(DDStore.getItem('dd_bounty_data'), '{}');
}
function saveBountyData(d) { DDStore.setItem('dd_bounty_data', JSON.stringify(d)); }

function getBountyRefreshes() {
  var d = getBountyData();
  var today = new Date().toDateString();
  if (d.refreshDate !== today) return 5;
  return typeof d.refreshesLeft === 'number' ? d.refreshesLeft : 5;
}

function setBountyRefreshes(n) {
  var d = getBountyData();
  d.refreshDate = new Date().toDateString();
  d.refreshesLeft = n;
  saveBountyData(d);
}

function getActiveBounty() {
  var d = getBountyData();
  return d.activeBounty || null;
}

function generateBounties() {
  // Pick 3 random unique bounties
  var pool = BOUNTY_TEMPLATES.slice();
  // Filter out active bounty and recently completed
  var d = getBountyData();
  var active = d.activeBounty ? d.activeBounty.id : null;
  var completed = d.completedBounties || [];
  pool = pool.filter(function(b) { return b.id !== active && completed.indexOf(b.id) === -1; });
  if (pool.length < 3) pool = BOUNTY_TEMPLATES.slice(); // reset if too few
  var picked = [];
  while (picked.length < 3 && pool.length > 0) {
    var idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

function renderBountyBoard() {
  var d = getBountyData();
  var today = new Date().toDateString();

  // Generate today bounties if needed
  if (!d.todayBounties || d.bountyDate !== today) {
    d.todayBounties = generateBounties().map(function(b){ return b.id; });
    d.bountyDate = today;
    saveBountyData(d);
  }

  // Refresh count
  var refreshesLeft = getBountyRefreshes();
  var rcEl = document.getElementById('bounty-refresh-count');
  if (rcEl) rcEl.textContent = refreshesLeft + ' refreshes remaining today';
  var rbBtn = document.getElementById('bounty-refresh-btn');
  if (rbBtn) {
    rbBtn.disabled = refreshesLeft <= 0;
    rbBtn.style.opacity = refreshesLeft <= 0 ? '0.4' : '1';
    rbBtn.setAttribute('aria-label', 'Refresh bounties. ' + refreshesLeft + ' refreshes remaining today.');
  }

  // Active bounty banner
  var active = getActiveBounty();
  var banner = document.getElementById('bounty-active-banner');
  if (banner) {
    if (active) {
      var prog = d.bountyProgress || 0;
      banner.style.display = '';
      banner.textContent = '📋 Active: ' + active.title + ' — ' + prog + ' / ' + active.count + ' ' + getBountyProgressLabel(active);
    } else {
      banner.style.display = 'none';
    }
  }

  // Render bounty list
  var list = document.getElementById('bounty-list');
  if (!list) return;
  list.innerHTML = '';

  var bounties = (d.todayBounties || []).map(function(id) {
    return BOUNTY_TEMPLATES.find(function(b){ return b.id === id; });
  }).filter(Boolean);

  if (bounties.length === 0) {
    list.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;padding:20px;">No bounties available. Refresh to generate new ones.</p>';
    return;
  }

  bounties.forEach(function(b) {
    var isActive = active && active.id === b.id;
    var card = document.createElement('div');
    card.className = 'bounty-card' + (isActive ? ' active-bounty' : '');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', b.title + '. ' + b.desc + '. Reward: ' + b.gold + ' gold and ' + b.trophies + ' trophies.');

    var progressHtml = '';
    if (isActive) {
      var prog = d.bountyProgress || 0;
      progressHtml = '<div class="bounty-progress" aria-live="polite">Progress: ' + prog + ' / ' + b.count + ' ' + getBountyProgressLabel(b) + '</div>';
    }

    var btnHtml = '';
    if (isActive) {
      btnHtml = '<button class="bounty-abandon-btn" onclick="abandonBounty()" aria-label="Abandon this bounty">Abandon Bounty</button>';
    } else if (!active) {
      btnHtml = '<button class="bounty-register-btn" onclick="registerBounty(\''+ b.id +'\')" aria-label="Register for bounty">📋 Register</button>';
    }

    card.innerHTML =
      '<div class="bounty-title">' + b.icon + ' ' + b.title + (isActive ? ' <span style="color:#44ff88;font-size:0.6rem;">● ACTIVE</span>' : '') + '</div>' +
      '<div class="bounty-desc">' + b.desc + '</div>' +
      '<div class="bounty-dungeon">📍 ' + b.dungeon + '</div>' +
      '<div class="bounty-reward">Reward: ' + b.gold + 'g + ' + b.trophies + ' 🏆</div>' +
      progressHtml + btnHtml;

    list.appendChild(card);
  });

  say('Bounty Board. ' + bounties.length + ' bounties available. ' + (active ? 'Active bounty: ' + active.title : 'No active bounty.') + ' ' + refreshesLeft + ' refreshes remaining.');
}

function getBountyProgressLabel(b) {
  if (b.type === 'kill_type') return b.target + 's killed';
  if (b.type === 'kill_elite') return 'elite enemies defeated';
  if (b.type === 'kill_boss') return 'bosses defeated';
  if (b.type === 'reach_floor') return 'floors reached';
  if (b.type === 'kill_count') return 'enemies killed';
  return 'completed';
}

function registerBounty(id) {
  var b = BOUNTY_TEMPLATES.find(function(x){ return x.id === id; });
  if (!b) return;
  var d = getBountyData();
  d.activeBounty = b;
  d.bountyProgress = 0;
  d.bountyRunKills = 0;
  saveBountyData(d);
  renderBountyBoard();
  showToast('📋 Bounty registered: ' + b.title, 'gold');
  say('Bounty registered. ' + b.title + '. ' + b.desc + '. Good luck.');
}

function abandonBounty() {
  var d = getBountyData();
  var name = d.activeBounty ? d.activeBounty.title : 'bounty';
  d.activeBounty = null;
  d.bountyProgress = 0;
  saveBountyData(d);
  renderBountyBoard();
  say('Bounty abandoned. You can register for a new one.');
}

function refreshBounties() {
  var left = getBountyRefreshes();
  if (left <= 0) { say('No refreshes remaining today. Come back tomorrow.'); showToast('No refreshes left today', 'red'); return; }
  setBountyRefreshes(left - 1);
  var d = getBountyData();
  d.todayBounties = generateBounties().map(function(b){ return b.id; });
  d.bountyDate = new Date().toDateString();
  saveBountyData(d);
  renderBountyBoard();
  say('Bounties refreshed. ' + (left - 1) + ' refreshes remaining today.');
}

function updateBountyProgress(type, value, dungeon) {
  var d = getBountyData();
  var b = d.activeBounty;
  if (!b) return;
  if (d.bountyComplete) return;

  var progress = d.bountyProgress || 0;
  var updated = false;

  if (b.type === 'kill_count' && (type === 'kill' || type === 'kill_count')) {
    progress++; updated = true;
  }
  // (said "in The Crypt" but counted kills in any dungeon)
  if (b.type === 'kill_type' && type === 'kill' && value && b.target && value.toLowerCase().indexOf(b.target.toLowerCase()) !== -1
      && (!b.dungeon || b.dungeon === 'Any dungeon' || dungeon === b.dungeon)) {
    progress++; updated = true;
  }
  if (b.type === 'kill_elite' && type === 'kill_elite' && (b.dungeon === 'Any dungeon' || dungeon === b.dungeon)) {
    progress++; updated = true;
  }
  if (b.type === 'kill_boss' && type === 'kill_boss' && (b.dungeon === 'Any dungeon' || dungeon === b.dungeon)) {
    progress++; updated = true;
  }
  // "without dying" — only when no life has been lost this run
  if (b.type === 'reach_floor' && type === 'floor' && value >= b.count && (b.dungeon === 'Any dungeon' || dungeon === b.dungeon)
      && !(DS && DS.lives < DS.maxLives)) {
    progress = b.count; updated = true;
  }

  if (!updated) return;
  d.bountyProgress = progress;
  saveBountyData(d);

  // Update dungeon banner
  updateDungeonBountyBanner();

  // Check complete
  if (progress >= b.count) {
    completeBounty();
  }
}

function completeBounty() {
  var d = getBountyData();
  var b = d.activeBounty;
  if (!b) return;

  // Award rewards
  addGlobalGold(b.gold);
  addTrophies(b.trophies);
  updateTrophyDisplay();
  checkAchievements();

  // Track completed
  if (!d.completedBounties) d.completedBounties = [];
  d.completedBounties.push(b.id);
  d.activeBounty = null;
  d.bountyProgress = 0;
  d.bountyComplete = false;
  saveBountyData(d);

  showToast('📋 Bounty Complete! +' + b.gold + 'g +' + b.trophies + '🏆', 'gold');
  say('Bounty complete! ' + b.title + ' finished. You earned ' + b.gold + ' gold and ' + b.trophies + ' trophies. Well done.');
  updateDungeonBountyBanner();
}

function updateDungeonBountyBanner() {
  // Show active bounty progress in dungeon
  var d = getBountyData();
  var b = d.activeBounty;
  var el = document.getElementById('dg-bounty-banner');
  if (!el) return;
  if (!b) { el.style.display = 'none'; return; }
  var prog = d.bountyProgress || 0;
  el.style.display = '';
  el.textContent = '📋 ' + b.title + ': ' + prog + '/' + b.count + ' ' + getBountyProgressLabel(b);
}

// ── IN-DUNGEON FIRST-RUN TIPS ────────────────────────────────────────────────

var DUNGEON_TIPS = {
  'first-room':    { text:'💡 Use North, South, East or West to move. Press Search to look for loot in this room. Each room can hold combat, loot, or a special event.', duration:25000 },
  'first-combat':  { text:'💡 Combat is turn-based. Attack always hits. Heavy Strike hits harder but can miss 30% of the time. Defend reduces damage. Use Potion to heal.', duration:25000 },
  'first-skill':   { text:'💡 Skills cost SP to use. You regenerate 2 SP per room entered. Powerful skills cost more — save them for tough fights and bosses.', duration:22000 },
  'first-levelup': { text:'💡 You leveled up! Choose one of three skills offered. You also have 3 stat points to spend on Vitality, Strength, Endurance, Spirit or Agility.', duration:22000 },
  'first-shop':    { text:'💡 Shop! Spend your gold on potions, weapons, armor and special items. Soul Traps let you capture enemies as permanent minions.', duration:22000 },
  'first-floor2':  { text:'💡 Floor 2 reached. The dungeon has 10 floors total. Enemies get stronger each floor. The boss is on floor 10 and has 3 phases.', duration:20000 },
  'first-boss':    { text:'💡 Boss fight! Three phases — each phase the boss gets stronger. Use skills and potions. You cannot flee from a boss.', duration:25000 },
  'first-home':    { text:'💡 Home unlocked! Buy a Bed to restore HP and SP. Use the Safe to store gold. Visit the Forge tab to craft weapons from materials you find.', duration:22000 },
  'first-elite':   { text:'💡 Elite enemy! Elites have special abilities and much higher HP. Defeat them for bonus gold and a chance at a rare spirit.', duration:20000 },
  'first-loot':    { text:'💡 Loot found! Check your inventory to use items. Weapons and armor can be equipped from inventory or at the Blacksmith.', duration:18000 },
};

var _tutTimer = null;
var _tutProgressTimer = null;

function getDungeonTipsSeen() {
  return _jsonParseSafe(DDStore.getItem('dd_dungeon_tips_seen'), '[]');
}

function markTipSeen(id) {
  var seen = getDungeonTipsSeen();
  if (seen.indexOf(id) === -1) { seen.push(id); DDStore.setItem('dd_dungeon_tips_seen', JSON.stringify(seen)); }
}

function hasSeenTip(id) {
  // Each tip depends only on its own seen-state now. It used to also
  // short-circuit true for every tip once dd_tutorial_done was set after a
  // player's first dungeon clear — but that silently killed tips for things
  // a player genuinely hadn't encountered yet (e.g. their first elite, on
  // their second dungeon), not just ones they'd already seen.
  return getDungeonTipsSeen().indexOf(id) !== -1;
}

function showDungeonTip(id) {
  if (hasSeenTip(id)) return;
  var tip = DUNGEON_TIPS[id];
  if (!tip) return;
  markTipSeen(id);

  // Clear any existing tip
  dismissDungeonTip(true);

  var banner = document.getElementById('dg-tut-banner');
  var textEl = document.getElementById('dg-tut-text');
  var bar = document.getElementById('dg-tut-progress');
  if (!banner || !textEl) return;

  textEl.textContent = tip.text;
  banner.style.display = '';

  // Progress bar drains over tip duration
  bar.style.transition = 'none';
  bar.style.width = '100%';
  setTimeout(function() {
    bar.style.transition = 'width ' + tip.duration + 'ms linear';
    bar.style.width = '0%';
  }, 50);

  // JAWS reads it
  say(tip.text);

  // Auto dismiss
  _tutTimer = setTimeout(function() { dismissDungeonTip(); }, tip.duration);
}

function dismissDungeonTip(silent) {
  if (_tutTimer) { clearTimeout(_tutTimer); _tutTimer = null; }
  var banner = document.getElementById('dg-tut-banner');
  if (banner) banner.style.display = 'none';
}

// Mark tutorial done after first dungeon clear so tips never show again
function markTutorialDone() {
  DDStore.setItem('dd_tutorial_done', '1');
}

function startRunTimer() { _runStartTime = Date.now(); }

function buildRunSummary(isVictory) {
  try {
  var elapsed = _runStartTime ? Math.round((Date.now() - _runStartTime) / 1000) : 0;
  var mins = Math.floor(elapsed / 60);
  var secs = elapsed % 60;
  var timeStr = mins + 'm ' + (secs < 10 ? '0' : '') + secs + 's';

  // Hide continue journey button by default — only shown on victory
  var rsBtn = document.getElementById('rs-continue-journey-btn');
  if (rsBtn) rsBtn.style.display = 'none';
  var allCompleteBtn = document.getElementById('rs-all-complete-btn');
  if (allCompleteBtn) allCompleteBtn.remove();

  // Crown / header
  var crownEl = document.getElementById('rs-crown');
  var dungeonEl = document.getElementById('rs-dungeon');
  var titleEl = document.getElementById('rs-title');
  var charEl = document.getElementById('rs-char');
  if (crownEl) crownEl.textContent = isVictory ? '👑' : '💀';
  if (dungeonEl) dungeonEl.textContent = (DS.dungeon || 'THE DUNGEON').toUpperCase();
  if (titleEl) titleEl.textContent = isVictory ? 'Dungeon Cleared' : 'The Dark Claims You';
  if (charEl) charEl.textContent = (DS.name || 'Adventurer') + ' · ' + (DS.race || '') + ' ' + (DS.cls || '') + ' · ' + (DS.diff || 'Normal');

  // Closing line
  var closingEl = document.getElementById('rs-closing');
  if (closingEl) {
    var dungeonLines = (DS.dungeon && CLOSING_LINES[DS.dungeon]) ? CLOSING_LINES[DS.dungeon] : (CLOSING_LINES['Crypt of Malachar'] || {});
    var closing = isVictory
      ? (dungeonLines[DS.cls] || 'You descended. You survived. The dungeon remembers.')
      : 'The dungeon claimed you on floor ' + (DS.floor || 1) + '. It will not forget your name. Neither should you.';
    closingEl.textContent = closing;
  }

  // Stat grid
  var score = getScoreData();
  var rankInfo = getScoreRank(score.total || 0);
  var grid = document.getElementById('rs-grid');
  function rsStat(val, label) {
    return '<div class="rs-stat" tabindex="0" aria-label="' + label + ': ' + val + '">' +
      '<div class="rs-stat-val">' + val + '</div>' +
      '<div class="rs-stat-label">' + label + '</div>' +
    '</div>';
  }
  var grid = document.getElementById('rs-grid');
  if (grid) {
    grid.innerHTML =
      rsStat(DS.kills || 0, 'Enemies Slain') +
      rsStat('Floor ' + (DS.floor || 1), 'Reached') +
      rsStat('Lv ' + (DS.level || 1), 'Level') +
      rsStat((DS.gold || 0) + 'g', 'Gold') +
      rsStat(timeStr, 'Time') +
      rsStat(isVictory ? '✓' : '✗', 'Cleared') +
      (DS.bestHit ? rsStat(DS.bestHit, 'Best Hit') : '') +
      (DS.potionsUsed ? rsStat(DS.potionsUsed, 'Potions Used') : '');
  }

  // Level Points summary
  var lpSection = document.getElementById('rs-lp-section');
  var ch = _charIdx !== null ? CHARS[_charIdx] : null;
  var lpSpent = ch && ch.lpSpent ? ch.lpSpent : null;
  if (lpSection) {
    if (lpSpent && Object.keys(lpSpent).length > 0) {
      lpSection.style.display = '';
      var lpNames = { vitality:'❤️ Vitality', strength:'⚔️ Strength', endurance:'🛡️ Endurance', spirit:'✨ Spirit', agility:'🏃 Agility' };
      var lpHtml = '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);margin-bottom:8px;">LEVEL POINTS INVESTED</div>';
      Object.keys(lpSpent).forEach(function(stat) {
        if (lpSpent[stat] > 0) {
          lpHtml += '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#e0c080;margin-bottom:4px;">' +
            (lpNames[stat]||stat) + ' <span style="color:var(--gold);">+' + lpSpent[stat] + ' pts</span></div>';
        }
      });
      lpSection.innerHTML = lpHtml;
    } else {
      lpSection.style.display = 'none';
    }
  }

  // Corruption summary
  var corruptSection = document.getElementById('rs-corrupt-section');
  if (corruptSection) {
    var corruption = ch && ch.corruptionMode ? (ch.corruption || 0) : 0;
    if (corruption > 0) {
      corruptSection.style.display = '';
      var corruptColor = corruption >= 100 ? '#cc44cc' : corruption >= 75 ? '#aa22aa' : corruption >= 50 ? '#884488' : '#664466';
      corruptSection.innerHTML =
        '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);margin-bottom:6px;">CORRUPTION</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.85rem;color:' + corruptColor + ';">☠ ' + corruption + '%' +
        (corruption >= 100 ? ' — YOU BECAME THE DUNGEON' : corruption >= 75 ? ' — Skills backfired' : corruption >= 50 ? ' — Hunter was watching' : corruption >= 25 ? ' — The whispers began' : '') +
        '</div>';
    } else {
      corruptSection.style.display = 'none';
    }
  }

  // Class passive highlight
  var passiveSection = document.getElementById('rs-passive-section');
  if (passiveSection) {
    var trait = CLASS_TRAITS && CLASS_TRAITS[DS.cls];
    if (trait) {
      passiveSection.style.display = '';
      passiveSection.innerHTML =
        '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);margin-bottom:6px;">CLASS PASSIVE</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#e0c080;">' + CLASS_ICONS[DS.cls] + ' ' + trait.name + '</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.62rem;color:#666;margin-top:3px;">' + trait.desc + '</div>';
    } else {
      passiveSection.style.display = 'none';
    }
  }

  // Spirit companion
  var spiritSection = document.getElementById('rs-spirit-section');
  var spiritEl = document.getElementById('rs-spirit');
  if (spiritSection) {
    var spirit = DS.activeSpirit && typeof DS.activeSpirit === 'object' ? DS.activeSpirit : null;
    if (spirit) {
      spiritSection.style.display = '';
      if (spiritEl) spiritEl.innerHTML =
        '<div class="rs-spirit-icon">' + spirit.icon + '</div>' +
        '<div class="rs-spirit-info">' +
          '<div class="rs-spirit-name">' + spirit.name + '</div>' +
          '<div class="rs-spirit-ability">' + (spirit.passiveDesc || spirit.ability || '') + '</div>' +
        '</div>';
    } else {
      spiritSection.style.display = 'none';
    }
  }

  // Skills used
  var skillsSection = document.getElementById('rs-skills-section');
  var skillsEl = document.getElementById('rs-skills');
  var unlockedSkills = DS.unlockedSkills || [];
  if (skillsSection) {
    if (unlockedSkills.length > 0) {
      skillsSection.style.display = '';
      var allSkills = CLASS_SKILLS[DS.cls] || [];
      if (skillsEl) skillsEl.innerHTML = unlockedSkills.map(function(eff) {
        var sk = allSkills.find(function(s){ return s.effect === eff; });
        if (!sk) return '';
        return '<div class="rs-skill-row">' +
          '<span>' + (sk.icon||'⚔') + ' ' + sk.name + '</span>' +
          '<span style="color:var(--text-dim);font-size:0.72rem;">' + sk.tier + ' · ' + sk.spCost + ' SP</span>' +
        '</div>';
      }).join('');
    } else {
      skillsSection.style.display = 'none';
    }
  }

  // Score
  var scoreTotalEl = document.getElementById('rs-score-total');
  var scoreRankEl = document.getElementById('rs-score-rank');
  if (scoreTotalEl) scoreTotalEl.textContent = (score.total || 0).toLocaleString() + ' pts';
  if (scoreRankEl) { scoreRankEl.textContent = 'RANK: ' + rankInfo.label; scoreRankEl.style.color = rankInfo.color; }

  // Show NG+ and Continue Journey buttons on victory
  var btns = document.querySelector('#screen-runsummary .rs-btns');
  var existingNG = document.getElementById('rs-ngplus-btn');
  var existingCJ = document.getElementById('rs-continue-btn');
  if (existingNG) existingNG.remove();
  if (existingCJ) existingCJ.remove();
  if (isVictory && btns) {
    // Continue Journey button — only if there's a next dungeon available
    var ngBtn = document.createElement('button');
    ngBtn.id = 'rs-ngplus-btn';
    ngBtn.className = 'btn-gold';
    ngBtn.setAttribute('aria-label', 'Start New Game Plus. Enemies will be 20 percent stronger. Press to begin.');
    ngBtn.textContent = '✦ New Game Plus';
    ngBtn.onclick = function() {
      if (_charIdx !== null && CHARS[_charIdx]) {
        var ch = CHARS[_charIdx];
        ch.ngPlus = (ch.ngPlus || 0) + 1;
        ch.floor = 1;
        ch.completed = false;
        ch.midRunSave = null;
        saveChars();
        initDungeon(ch);
        goTo('dungeon');
      }
    };
    btns.insertBefore(ngBtn, btns.firstChild);

    // Continue Journey button
    var cjBtn = document.createElement('button');
    cjBtn.id = 'rs-continue-btn';
    cjBtn.className = 'btn-gold';
    cjBtn.style.cssText = 'background:linear-gradient(90deg,#1a3a1a,#2a5a2a);border:1px solid #4a8a4a;color:#80cc80;';
    cjBtn.setAttribute('aria-label', 'Continue Journey — move to the next dungeon with your current character');
    cjBtn.textContent = '⬆ Continue Journey';
    cjBtn.onclick = function() { continueJourney(); };
    btns.insertBefore(cjBtn, ngBtn);
  }

  // Death Recap — only for an actual combat/HP death, not the sanity-zero
  // ending or other non-death "false" summaries (those don't route through
  // handleDeath, so DS.hp isn't actually <=0 for them). Built straight
  // from current DS state rather than ch.deathLog so it still works for
  // Hardcore Mode's early-exit death path, which never calls logDeath()
  // since the character gets deleted right after.
  var recapSection = document.getElementById('rs-recap-section');
  var recapText = '';
  if (!isVictory && DS.hp <= 0) {
    var recapBits = [];
    var killerName = DS.enemy ? DS.enemy.name : 'the dungeon';
    recapBits.push('Killed by ' + killerName + ' on floor ' + (DS.floor || 1) + '.');
    if (typeof DS._hpBeforeLastHit === 'number' && DS.maxHp) {
      var hpBeforePct = Math.max(0, Math.round((DS._hpBeforeLastHit / DS.maxHp) * 100));
      recapBits.push('You were at ' + hpBeforePct + '% health before that blow.');
    }
    try {
      var logEl = document.getElementById('dg-combat-log');
      if (logEl) {
        var logLines = Array.prototype.slice.call(logEl.children).map(function(el){ return el.textContent; }).filter(Boolean);
        // Skip the very last line — that's the killing blow itself, already
        // covered by "Killed by X" above. The line before it is what
        // actually happened on your last turn (item used, spell cast, etc).
        var lastAction = logLines.length > 1 ? logLines[logLines.length - 2] : null;
        if (lastAction) recapBits.push('Just before that: ' + lastAction);
      }
    } catch(e) {}
    recapText = recapBits.join(' ');
  }
  if (recapSection) {
    if (recapText) {
      recapSection.style.display = '';
      recapSection.innerHTML =
        '<div style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:#cc6666;margin-bottom:6px;">💀 DEATH RECAP</div>' +
        '<div style="font-family:Cinzel,serif;font-size:0.72rem;color:#e0a0a0;line-height:1.6;">' + recapText + '</div>';
    } else {
      recapSection.style.display = 'none';
    }
  }

  // JAWS announcement
  var jaws = (isVictory ? 'Victory! ' : 'Defeated. ') +
    (DS.name || 'Adventurer') + ' the ' + (DS.cls || '') + '. ' +
    (DS.kills || 0) + ' enemies slain. Floor ' + (DS.floor || 1) + '. Level ' + (DS.level || 1) + '. ' +
    'Total score: ' + (score ? (score.total||0).toLocaleString() : '0') + ' points. Rank: ' + (rankInfo ? rankInfo.label : 'Initiate') + '.' +
    (isVictory ? ' New Game Plus is available.' : '') +
    (recapText ? ' ' + recapText : '');
  say(jaws);

  // Play music for run summary — clean cut from combat, brief silence, then summary music
  try {
    stopAmbient();
    // Hard stop combat music immediately
    if (AUD && AUD.currentSource) {
      try { AUD.currentSource.stop(); } catch(e) {}
      AUD.currentSource = null;
    }
    AUD.current = '';
    // Brief silence (1.2s) then start summary music — feels intentional, not glitchy
    setTimeout(function() {
      playTrack(isVictory ? 'raid-victory' : getMenuTrack());
    }, 1200);
  } catch(e) {}

  } catch(e) { console.error('[DD] buildRunSummary crashed:', e.message); }
}

function rsPlayAgain() {
  if (_charIdx !== null && CHARS[_charIdx]) {
    CHARS[_charIdx].floor = 1;
    CHARS[_charIdx].midRunSave = null;
    saveChars();
    initDungeon(CHARS[_charIdx]);
    goTo('dungeon');
    setTimeout(function(){ showQuestPopup(); }, 150);
  } else {
    // Character was deleted (hardcore) or charIdx lost — go to character list
    goTo('charlist');
    say('Returning to character selection.');
  }
}


//═════════════════
// THE HOLLOW — WEATHER SYSTEM
//═════════════════


// --
// THE ABYSSAL DEEP — DUNGEON DATA
// --

var ABYSSAL_ENEMIES = {
  t1: [
    { name:'Tide Wraith',      icon:'🌊', hp:20, atk:[4,9],  gold:[2,5],  desc:'Phases through defense when you defend.', tidePhase:true },
    { name:'Drowned Sailor',   icon:'⚓', hp:26, atk:[5,10], gold:[2,5],  desc:'Every 3 turns it screams, silencing your skills for 1 turn.', silenceTimer:3 },
    { name:'Ink Fiend',        icon:'🐙', hp:18, atk:[4,8],  gold:[1,4],  desc:'25% chance to blind you, making your next attack miss.', blindChance:0.25 },
    { name:'Sea Slug',         icon:'🐌', hp:22, atk:[3,7],  gold:[1,4],  desc:'Slow but relentless. Poisons on hit 20% of the time.', poisonChance:0.20 },
    { name:'Shore Rat',        icon:'🐀', hp:14, atk:[5,9],  gold:[1,3],  desc:'Small and vicious. Attacks twice per turn.' },
    { name:'Pale Drifter',     icon:'👻', hp:16, atk:[4,9],  gold:[1,4],  desc:'A ghost of someone who drowned. Seeks company.' },
    { name:'Tide Caller',      icon:'🌊', hp:20, atk:[4,9],  gold:[2,5],  tidePhase:true, desc:'Calls the tide from somewhere that has no tide. Phases through your defense when you defend.' },
    { name:'Depth Shade',      icon:'🌑', hp:16, atk:[4,8],  gold:[1,4],  dodgeEvery:3, desc:'Made of deep darkness. Phases out every third turn — you cannot hit what the abyss becomes.' },
  ],
  t2: [
    { name:'Deep Stalker',     icon:'🦈', hp:50, atk:[10,17], gold:[5,10], desc:'Studies you first turn, hits double on second turn.', stalkerStudy:true },
    { name:'Coral Horror',     icon:'🪸', hp:58, atk:[9,15],  gold:[6,11], desc:'Takes 20% less damage from physical attacks.', physResist:0.20 },
    { name:'Pressure Beast',   icon:'💀', hp:44, atk:[8,14],  gold:[5,9],  desc:'Gains +10% damage each turn it stays alive.', pressureStacks:true },
    { name:'Kelp Strangler',   icon:'🌿', hp:48, atk:[9,16],  gold:[5,10], desc:'Wraps around you — 20% chance to stun for 1 turn.', stunChance:0.20 },
    { name:'Abyssal Eel',      icon:'⚡', hp:40, atk:[10,18], gold:[4,9],  desc:'Shocks you — reduces ATK by 2 for 2 turns on hit.', shockATK:true },
    { name:'Brine Golem',      icon:'🧂', hp:62, atk:[8,14],  gold:[6,11], desc:'Built from salt and pressure. Slow but very durable.' },
    { name:'Sunken Titan',     icon:'⚓', hp:65, atk:[10,16], gold:[6,12], immuneFirstHit:true, desc:'Rose from the ocean floor. The first strike glances off something that has survived centuries of pressure.' },
    { name:'Void Swimmer',     icon:'🦈', hp:52, atk:[10,17], gold:[5,10], grows:true, desc:'Evolved in the void between depths. Gets faster and stronger every turn it survives.' },
  ],
  t3: [
    { name:'Abyssal Eye',      icon:'👁️', hp:70, atk:[11,19], gold:[9,16], desc:'Drains 3 SP every turn instead of attacking sometimes.', spDrain:3 },
    { name:'Siren',            icon:'🧜', hp:65, atk:[12,20], gold:[9,17], desc:'30% chance your attack hits yourself instead.', sirenCharm:0.30 },
    { name:'Void Angler',      icon:'🎣', hp:75, atk:[13,21], gold:[10,17], desc:'Lures you closer — first attack always hits for max damage.', anglerFirst:true },
    { name:'Titan Crab',       icon:'🦀', hp:82, atk:[10,18], gold:[10,18], desc:'Armored shell — takes 30% less damage first 3 turns.', shellArmor:3 },
    { name:'The Drowned King', icon:'👑', hp:88, atk:[12,20], gold:[11,19], desc:'Elite. Resurrects once at 1 HP. Undead royalty.', isElite:true, eliteAbility:'Resurrects once at 1 HP when killed.', resurrect:true },
    { name:'Pressure Wraith',  icon:'💀', hp:78, atk:[12,20], gold:[10,17], pressureStacks:true, drainsSP:true, desc:'Created by centuries of deep water pressure. Gets stronger every turn AND drains your SP. End it fast.' },
  ],
  boss: {
    name:'The Leviathan', icon:'🐉', hp:800, atk:[28,42], gold:[150,220], isBoss:true,
    phase1Hp:600, phase2Hp:400, phase3Hp:200,
    isMultiPhase:true, fourPhase:true,
    phaseMsg2:'The Leviathan lets out a sound that shakes the ocean floor. Its eyes open fully. The water begins to rise.',
    phaseMsg3:'The water darkens completely. The Leviathan rises fully. The Deep Pull begins — kill it before its power overwhelms you.',
    phaseMsg4:'The abyss awakens. The Leviathan abandons all restraint. Nothing can save you now.',
    leviathan:true
  },
  bossPool: [
    {
      name:'The Leviathan', icon:'🐉', hp:800, atk:[28,42], gold:[150,220], isBoss:true,
      phase1Hp:600, phase2Hp:400, phase3Hp:200,
      isMultiPhase:true, fourPhase:true,
      phaseMsg2:'The Leviathan lets out a sound that shakes the ocean floor. Its eyes open fully. Rage — its attacks grow stronger.',
      phaseMsg3:'The water darkens completely. The Leviathan rises. The Deep Pull begins.',
      phaseMsg4:'The abyss awakens. The Leviathan abandons all restraint. Nothing can save you now.',
      leviathan:true
    },
    {
      name:'The Ancient Tide', icon:'🌊', hp:650, atk:[24,38], gold:[120,180], isBoss:true,
      isMultiPhase:true, fourPhase:true,
      phaseMsg2:'The Ancient Tide swells — the water rises to your chest. Its form grows larger.',
      phaseMsg3:'The tide is at your neck. Fight harder or drown.',
      phaseMsg4:'The ocean itself rises. The Ancient Tide becomes the water. There is no escaping it now.',
    },
    {
      name:'The Drowned God', icon:'🌑', hp:700, atk:[26,40], gold:[130,200], isBoss:true,
      isMultiPhase:true, fourPhase:true,
      phaseMsg2:'The Drowned God opens its eyes for the first time in centuries. The abyss itself screams.',
      phaseMsg3:'It speaks. You cannot understand the words. Your HP cap drops by 20 for the remainder of the fight.',
      phaseMsg4:'It has stopped speaking. Words were a courtesy. It extends no more courtesies.',
    },
    { name:'The Leviathan Eye',  icon:'👁️', hp:620, atk:[25,39], gold:[110,170], isBoss:true, isMultiPhase:true, fourPhase:true, phaseMsg2:'The Eye blinks. Everything goes dark for one terrible second.', phaseMsg3:'It has seen everything that happens here. Including your death.', phaseMsg4:'It is no longer watching. It is acting.' },
    { name:'Abyssal Sovereign',  icon:'🌊', hp:600, atk:[24,38], gold:[110,165], isBoss:true, isMultiPhase:true, fourPhase:true, phaseMsg2:'The Abyssal Sovereign releases the pressure it has held for centuries!', phaseMsg3:'The depths have no bottom. Neither does its rage.', phaseMsg4:'The Sovereign abandons form entirely. It is the pressure now. It is everywhere.' }
  ],
  elites: [
    { name:'The Drowned King', icon:'👑', hp:95, atk:[14,22], gold:[18,28], isElite:true, eliteAbility:'Resurrects once at 1 HP.', resurrect:true },
    { name:'Abyssal Sentinel', icon:'🔱', hp:88, atk:[13,21], gold:[16,26], isElite:true, eliteAbility:'Cannot be stunned. Immune to debuffs.', debuffImmune:true },
    { name:'The Pale Leviathan',icon:'🤍', hp:100,atk:[15,23], gold:[20,30], isElite:true, eliteAbility:'Calls one Tide Wraith every 3 turns.' },
  ],
};

// ── THE SHADOW WORLD ──────────────────────────────────────────────────────────
var SHADOW_ENEMIES = {
  t1: [
    { name:'The Mimic',       icon:'📦', hp:28, atk:[6,11],  gold:[3,6],  desc:'Looks like a chest until engaged. Surprise attack first turn deals double damage.', mimicSurprise:true },
    { name:'Shadow Pup',      icon:'🐾', hp:18, atk:[5,9],   gold:[2,4],  desc:'Weak alone. Always spawns with a second Shadow Pup.', spawnsPair:true },
    { name:'The Drifter',     icon:'🌫️', hp:22, atk:[5,10],  gold:[2,5],  desc:'Phases between shadow and reality. Dodges every other hit.', dodgeEvery:2 },
    { name:'Null Fragment',   icon:'⬛', hp:16, atk:[4,8],   gold:[1,4],  desc:'A piece of something that was erased. Adds 1 corruption stack on every hit.', corruptOnHit:1 },
    { name:'The Smear',       icon:'🖤', hp:20, atk:[4,9],   gold:[2,4],  desc:'Leaves corruption wherever it goes. Adds 1 corruption stack on every hit.', corruptOnHit:1 },
  ],
  t2: [
    { name:'Null Knight',     icon:'🗡️', hp:42, atk:[9,16],  gold:[5,9],  desc:'Corrupted armor with nothing inside. Immune to the first hit every combat.', immuneFirstHit:true },
    { name:'The Reflection',  icon:'🪞', hp:38, atk:[8,15],  gold:[4,8],  desc:'Mirrors your last action. If you attacked, it attacks. If you defended, it heals 15 HP.', reflection:true },
    { name:'Sorrow Hound',    icon:'🐕', hp:36, atk:[8,14],  gold:[4,8],  desc:'Howls first turn applying fear — your damage is reduced 20% for 3 turns.', fearHowl:true },
    { name:'The Lurker',      icon:'👁️', hp:34, atk:[7,13],  gold:[4,8],  desc:'Hides first turn. Guaranteed critical second turn.', lurkerHide:true },
    { name:'Void Weaver',     icon:'🕸️', hp:44, atk:[9,16],  gold:[5,10], desc:'Weaves a corruption web — passive 8 damage per turn until destroyed with a Heavy Strike.', corruptWeb:true },
  ],
  t3: [
    { name:'The Twice Dead',  icon:'💀', hp:70, atk:[12,20], gold:[9,16], desc:'Refuses to stay dead. Returns at 50% HP after the first kill. Must be defeated twice.', twiceDead:true },
    { name:'Shadow Archon',   icon:'👑', hp:65, atk:[11,19], gold:[8,15], desc:'Commands the shadows. All enemies deal 15% more damage while it lives.', shadowCommand:true },
    { name:'The Unborn',      icon:'🌑', hp:60, atk:[12,21], gold:[9,16], desc:'Never existed in the physical world. Weapons deal half damage. Only spells damage it fully.', spiritOnly:true },
    { name:'The Remnant',     icon:'🔮', hp:55, atk:[13,22], gold:[9,17], desc:'What remains after violent death. Gains +4 ATK every turn it survives. Burst it down fast.', grows:true },
  ],
  bossPool: [
    { name:'The Echo',        icon:'🔄', hp:120, atk:[14,22], gold:[18,28], isBoss:true,
      desc:'A shadow copy of an enemy you already killed this run. Same mechanics. Same hunger. Returns from the dark wearing a familiar face.',
      phaseMsg2:'The Echo shifts — it remembers everything you did to it.', isEcho:true },
    { name:'The Shapeshifter',icon:'🌑', hp:500, atk:[18,28], gold:[80,120], isBoss:true,
      desc:'It has waited 3000 years for someone worth copying. Now it wears your face. Uses your skills. Knows your every move.',
      phaseMsg2:'The Shapeshifter copies your equipped weapon — attacks now deal your weapon damage!',
      phaseMsg3:'Phase 3 — The Shapeshifter matches your current HP. It will not let you outlast it.',
      phaseMsg4:'Final Form — The Shapeshifter uses ALL your skills. Fight yourself.',
      isShapeshifter:true },
  ],
  elites: [
    { name:'The Hollow Echo',  icon:'🔄', hp:120, atk:[16,25], gold:[22,38], isElite:true, eliteAbility:'Returns once at full HP after first kill.' },
    { name:'Null Sovereign',   icon:'⬛', hp:110, atk:[15,24], gold:[20,35], isElite:true, eliteAbility:'Adds 2 corruption stacks on every hit.' },
    { name:'The Shapeless',    icon:'🌫️', hp:105, atk:[14,23], gold:[18,32], isElite:true, eliteAbility:'Copies your equipped weapon damage on every attack.' },
  ],
};

// (no empty first entry like the other dungeons' lists, so every floor showed
// the next floor's name and "The Place That Wasn't" never appeared)
var SHADOW_FLOOR_NAMES = [
  '',
  'The Place That Wasn\'t', 'Where Light Forgot', 'The 3000th Year',
  'Hall of Erased Things', 'The Corridor of What Remains',
  'Chamber of the Twice Dead', 'The Mirror Room', 'Where You End',
  'The Shapeshifter\'s Approach', 'The Final Reflection'
];

var SHADOW_ROOM_DESCS = [
  'The air here feels like it is breathing you instead of the other way around.',
  'Your shadow is moving independently. It has been for three steps now.',
  'Something is watching from a direction that does not exist.',
  'The walls are made of compressed darkness. They are warm.',
  'You hear your own voice from somewhere ahead. You said nothing.',
  'A corridor stretches behind you that was not there when you entered.',
  'The floor shows your footprints going the wrong direction.',
  'Something in here remembers you from a time you have not lived yet.',
  'The silence here has weight. It presses against your chest.',
  'You see yourself standing at the far end of the room. It waves.',
  'The room shifts slightly every time you look away.',
  'Whatever died here left its shape in the air. You walk through it.',
  'Your heartbeat echoes twice. The second one is not yours.',
  'The darkness between the torches moves with purpose.',
  'Time feels wrong here. You cannot tell if you have been walking for seconds or hours.',
];

var SHADOW_LOOT = [
  { name:'Shadow Blade',      icon:'🗡️', type:'weapon', atk:18, desc:'Deals bonus damage equal to 10% of the enemy\'s missing HP. Punishes the weakened.' },
  { name:'The Null Shield',   icon:'🛡️', type:'armor',  def:14, desc:'Absorbs the first hit of every combat completely. Then it is just armor.' },
  { name:'Void Cloth',        icon:'🌑', type:'armor',  def:10, desc:'Gets stronger as shadow corruption builds. Turns the dungeon\'s curse into defense.' },
  { name:'Echo Staff',        icon:'🔮', type:'weapon', atk:15, desc:'Spells cast twice — second cast deals 50% damage. Everything echoes here.' },
  { name:'Shapeshifter\'s Mask', icon:'🎭', type:'consumable', shadowItem:'shapeshifterMask', desc:'Copy one enemy ability per dungeon. Use it once. Make it yours.' },
  { name:'Shadow Cloak',      icon:'🌫️', type:'armor',  def:12, desc:'25% chance to phase through an attack entirely. You learned from the Drifter.' },
  { name:'The Erased Blade',  icon:'⬛', type:'weapon', atk:20, desc:'Deals true damage — ignores all enemy defense. As if the enemy never had any.' },
  { name:'Null Potion',       icon:'🌑', type:'potion', heal:55, desc:'Made from compressed shadow. Restores 55 HP and removes all corruption stacks.' },
  { name:'Mirror Fragment',   icon:'🪞', type:'consumable', shadowItem:'mirrorFragment', desc:'A shard of the Mirror event. Use it to instantly purge all corruption stacks. One use.' },
  { name:'Echo Bone',         icon:'🦴', type:'relic', shadowItem:'echoBone', desc:'Carved from an Echo. Deals +25% damage to any Echo or Shapeshifter variant. The hunter becomes the hunted.' },
  { name:'Offering Cloth',    icon:'🩶', type:'relic', shadowItem:'offeringCloth', desc:'The wrapping from The Offering. The shadow now guarantees its gifts are real. Offering events always give loot or gold.' },
  { name:'Door Key',          icon:'🗝️', type:'relic', shadowItem:'doorKey', desc:'Found beyond a door that should not open. The Two Doors event always reveals the good path.' },
  { name:'Shadow Elixir',    icon:'🌑', type:'elixir', healPct:0.65, isShadowItem:true, desc:'Restores 65% of max HP. Brewed from the dark between worlds. Glows faintly wrong.' },
];

// ── ABYSSAL ROOM DESCRIPTIONS ──
var ABYSSAL_ROOM_DESCS = [
  'The water here is ankle deep. Cold. Very cold. Something moves below the surface.',
  'Bioluminescent moss lines the walls. It pulses slowly. Like breathing.',
  'The pressure changes as you enter. Your ears pop. Something adjusts to your presence.',
  'A skeleton sits against the wall in full armor. The armor is bent inward. From outside.',
  'The water is perfectly still here. It should not be this still.',
  'Something large passed through recently. The current still carries the memory of it.',
  'Coral grows from the ceiling in patterns too regular to be natural.',
  'A lanternfish drifts past your face and disappears into the dark. You are very deep.',
  'The walls are covered in claw marks. All pointing the same direction. Down.',
  'Salt crystals cover every surface. The room is older than anything above the water.',
  'You hear something. Not a sound — a feeling. The ocean is aware of you.',
  'An anchor the size of a house rests in the corner. No ship could have carried it here.',
  'The light from your torch bends in the water. Things at the edges look wrong.',
  'Teeth line the doorway. Not placed there. Grown there.',
  'The floor is soft here. You do not look at what makes it soft.',
  'A message is scratched into the wall. It reads: IT IS ALREADY BEHIND YOU.',
  'Dead fish float near the ceiling in a perfect circle. Nothing disturbed them.',
  'The pressure here is immense. You feel it in your chest. In your eyes.',
  'Something is humming. You cannot find the source. The hum is getting louder.',
  'The coral here has grown into the shape of a face. It was not always coral.',
  // Mid
  'The water rises to your knees. Somewhere below a current pulls south.',
  'A ghost ship is wedged in the walls somehow. Its flag still flies.',
  'You find a compass at the bottom of the floor. It spins endlessly and stops pointing at you.',
  'The bioluminescence dims as you enter. The room does not want to be seen.',
  'Barnacles cover the walls so densely they form a texture like skin.',
  'An old gramophone plays something at the bottom of the room. There is no record.',
  'The shadow on the wall is not yours. It does not move when you do.',
  'Something has been arranging the bones here. Into letters you recognize. Your name.',
  // Deep
  'At this depth the darkness is absolute without your torch. Something lives in that darkness.',
  'The walls pulse slowly. You realize you are inside something alive.',
  'The Leviathan was here. The scratch marks are the size of doors.',
  'Everything here is old. Older than the dungeon. Older than the ocean itself perhaps.',
  'You find a journal from someone who came before. The last entry says: DO NOT GO DEEPER.',
  'The water is warm here. That is wrong. That is very wrong.',
];

// ── ABYSSAL WEATHER ──
var ABYSSAL_WEATHER = [
  { id:'crushing-depth',    name:'Crushing Depth',      icon:'💀', desc:'The pressure at this depth is immense. Every room costs you.',             effect:'Lose 2 HP per room. Enemies deal +10% damage.',          roomHpLoss:2, enemyAtkMult:1.10 },
  { id:'bioluminescent',    name:'Bioluminescent Bloom', icon:'✨', desc:'The water glows with ancient light. Gold shimmers everywhere.',            effect:'Gold drops +60%.',                                       goldMult:1.60 },
  { id:'dead-calm',         name:'Dead Calm',             icon:'🌑', desc:'The abyss is perfectly still. Not even the creatures stir.',               effect:'No special effects. An eerie peace.',                    },
  { id:'thermal-vent',      name:'Thermal Vent',          icon:'🌋', desc:'Warm currents from below carry strange energy. Healing flows easier.',     effect:'Heal 3 HP per enemy killed.',                            hpPerKill:3 },
  { id:'strong-current',    name:'The Current',           icon:'🌊', desc:'A deep current runs through everything. Skills flow easily.',              effect:'Skills cost 2 less SP this run.',                        spDiscount:2 },
  { id:'midnight-zone',     name:'Midnight Zone',         icon:'🔵', desc:'At this depth no light reaches. Enemies are disoriented.',                 effect:'Enemy ATK -20%. You deal +15% damage.',                  enemyAtkMult:0.80, playerAtkMult:1.15 },
];

var _abyssalWeather = null;

function rollAbyssalWeather() {
  _abyssalWeather = ABYSSAL_WEATHER[Math.floor(Math.random() * ABYSSAL_WEATHER.length)];
  return _abyssalWeather;
}

function getAbyssalWeather() { return _abyssalWeather; }

// ── DUNGEON WEATHER SYSTEM ──────────────────────────────────────────────────

var DUNGEON_WEATHER = {

  // Generic dungeons (Crypt, DDDI, Infernal, etc)
  default: [
    { id:'blood-moon',    name:'Blood Moon',      icon:'🩸', desc:'A crimson moon hangs overhead. Violence feels closer tonight.',     effect:'Enemies deal +20% damage. You deal +20% damage.',    enemyAtkMult:1.20, playerAtkMult:1.20 },
    { id:'divine-light',  name:'Divine Blessing',  icon:'✨', desc:'A warm golden light fills the dungeon. Something watches over you.', effect:'+15 max HP this run. Potions heal 25% more.',          hpBonus:15, potionBoost:0.25 },
    { id:'cursed-fog',    name:'Cursed Fog',        icon:'🌫️', desc:'A grey mist clings to everything. Navigation feels wrong.',         effect:'Combat encounters +20% more frequent.',               combatBonus:0.20 },
    { id:'dead-calm',     name:'Dead Calm',         icon:'🕯️', desc:'Total silence. Not even the rats move.',                            effect:'Enemies have -15% attack. Gold drops +30%.',          enemyAtkMult:0.85, goldMult:1.30 },
    { id:'fever-run',     name:'Fever Run',         icon:'🔥', desc:'The walls pulse with heat. Your blood is up.',                      effect:'You deal +30% damage but take +15% more.',            playerAtkMult:1.30, playerDmgTaken:1.15 },
    { id:'still-air',     name:'Still Air',         icon:'💨', desc:'Nothing unusual. The dungeon breathes slowly.',                     effect:'No special effects.',                                 },
  ],

  'The Ashbound Wastes': [
    { id:'scorching-heat',name:'Scorching Heat',   icon:'☀️', desc:'The air burns your lungs. Every step costs more.',                  effect:'You lose 2 HP per room entered. Enemies are weakened -15% ATK.', roomHpLoss:2, enemyAtkMult:0.85 },
    { id:'ash-storm',     name:'Ash Storm',         icon:'🌪️', desc:'A wall of ash blots out the sky. Breathing is difficult.',         effect:'Gold drops +50%. Combat encounters +15% more frequent.', goldMult:1.50, combatBonus:0.15 },
    { id:'ember-rain',    name:'Ember Rain',        icon:'🔥', desc:'Burning cinders fall from above. The ground is hot.',              effect:'You deal +25% damage. Enemies deal +25% damage.',     playerAtkMult:1.25, enemyAtkMult:1.25 },
    { id:'cooled-ashes',  name:'Cooled Ashes',      icon:'⚫', desc:'The wastes are quiet today. The fire has burned itself out.',       effect:'+20 max HP this run. Potions heal 30% more.',         hpBonus:20, potionBoost:0.30 },
    { id:'burning-winds', name:'Burning Winds',     icon:'💨', desc:'Hot winds from the east. They carry the scent of something dead.', effect:'Enemies are 20% stronger but drop double gold.',      enemyAtkMult:1.20, goldMult:2.0 },
  ],

  'Frosthold Abyss': [
    { id:'blizzard',      name:'Blizzard',          icon:'❄️', desc:'A whiteout. You can barely see your hands in front of you.',       effect:'Combat chance -10%. Enemy ATK +25% — they hunt by smell.', combatBonus:-0.10, enemyAtkMult:1.25 },
    { id:'frozen-moon',   name:'Frozen Moon',       icon:'🌕', desc:'Ice crystal light everywhere. Beautiful and deadly.',              effect:'Enemies deal +20% damage. You deal +30% damage.',     enemyAtkMult:1.20, playerAtkMult:1.30 },
    { id:'black-ice',     name:'Black Ice',          icon:'🖤', desc:'The floor is treacherous. One wrong step.',                        effect:'You lose 3 HP per room entered. Gold drops +40%.',    roomHpLoss:3, goldMult:1.40 },
    { id:'cold-clarity',  name:'Cold Clarity',       icon:'🌨️', desc:'Crisp cold air sharpens the mind.',                               effect:'+10 SP max. Skills cost 2 less SP this run.',         spBonus:10, spDiscount:2 },
    { id:'dead-winter',   name:'Dead Winter',        icon:'💀', desc:'The abyss is completely still. Even the ice makes no sound.',      effect:'No special effects. The cold is the only enemy.',     },
  ],

  'The Sunken Archives': [
    { id:'rising-tides',  name:'Rising Tides',      icon:'🌊', desc:'Water levels are higher than usual. Entire sections are flooded.', effect:'+15% combat encounters. Enemies deal +15% damage.',   combatBonus:0.15, enemyAtkMult:1.15 },
    { id:'ancient-curse', name:'Ancient Curse',     icon:'📜', desc:'A curse written in an unknown language activates.',                effect:'You lose 1 HP per enemy attack regardless of defense.', cursedArmor:true },
    { id:'library-silence',name:'Library Silence',  icon:'🤫', desc:'An unnatural silence. Even combat feels muted.',                   effect:'Gold drops +35%. Potions heal 20% more.',             goldMult:1.35, potionBoost:0.20 },
    { id:'ink-flood',     name:'Ink Flood',          icon:'🖋️', desc:'Black ink seeps from the walls. The texts are being erased.',     effect:'Enemies are 15% stronger but drop 40% more gold.',   enemyAtkMult:1.15, goldMult:1.40 },
    { id:'dry-archives',  name:'Dry Archives',       icon:'📚', desc:'The water has receded. The archives breathe.',                    effect:'+20 max HP. No other effects.',                       hpBonus:20 },
  ],

  'Crypt of Malachar': [
    { id:'dead-restless',   name:'The Dead Stir',      icon:'💀', desc:'Something has disturbed the ancient dead. They rise with purpose.', effect:'Enemies deal +20% damage. Gold drops +50%.',          enemyAtkMult:1.20, goldMult:1.50 },
    { id:'crypt-mist',      name:'Crypt Mist',          icon:'🌫️', desc:'A pale mist fills every corridor. The cold seeps into your bones.',effect:'You lose 2 HP per room. Potions heal 30% more.',      roomHpLoss:2, potionBoost:0.30 },
    { id:'unholy-night',    name:'Unholy Night',        icon:'🩸', desc:'The walls weep blood. Something ancient awakens deep below.',     effect:'Enemies deal +30% damage. You deal +30% damage.',     enemyAtkMult:1.30, playerAtkMult:1.30 },
    { id:'hallowed-ground', name:'Hallowed Ground',     icon:'✝️', desc:'Ancient prayers still echo in this crypt. Something protects you.', effect:'+25 max HP this run. Potions heal 40% more.',         hpBonus:25, potionBoost:0.40 },
    { id:'bone-silence',    name:'The Silence of Bones',icon:'🕯️', desc:'Not even a rattle. The dead sleep deeply tonight.',              effect:'No special effects. The crypt is at peace.',          },
  ],

  'The Whispering Forest': [
    { id:'cursed-whispers', name:'Cursed Whispers',    icon:'👁️', desc:'The voices grow louder. They speak of things that should not be.',effect:'You lose 1 HP per room. Enemy ATK +15%.',             roomHpLoss:1, enemyAtkMult:1.15 },
    { id:'wild-hunt',       name:'The Wild Hunt',       icon:'🐺', desc:'Something ancient runs through the forest tonight. It is hunting.',effect:'+30% combat encounters. Enemies deal +20% damage.',  combatBonus:0.30, enemyAtkMult:1.20 },
    { id:'forest-blessing', name:'Forest Blessing',     icon:'🌿', desc:'The forest chooses to protect you tonight. The whispers are kind.', effect:'+20 max HP. Heal 2 HP per enemy killed.',            hpBonus:20, hpPerKill:2 },
    { id:'silver-fog',      name:'Silver Fog',          icon:'🌙', desc:'A pale moonlit fog rolls in. Gold gleams beneath your feet.',     effect:'Gold drops +60%. Combat encounters -10%.',            goldMult:1.60, combatBonus:-0.10 },
    { id:'deep-dark',       name:'The Deep Dark',       icon:'🌑', desc:'The forest closes its canopy. No light reaches the floor.',       effect:'You deal +25% damage. Enemies deal +25% damage.',     playerAtkMult:1.25, enemyAtkMult:1.25 },
  ],

  'Crypts of the Fallen': [
    { id:'death-rattle',  name:'Death Rattle',      icon:'💀', desc:'The dead are particularly restless tonight.',                      effect:'Undead enemies deal +25% damage. You earn +40% gold.', undeadAtkMult:1.25, goldMult:1.40 },
    { id:'holy-ground',   name:'Holy Ground',        icon:'✝️', desc:'Something consecrated this crypt long ago.',                      effect:'Undead enemies deal -20% damage. +10 max HP.',        undeadAtkMult:0.80, hpBonus:10 },
    { id:'grave-silence', name:'Grave Silence',      icon:'🕯️', desc:'Even the dead are quiet tonight.',                               effect:'No special effects.',                                 },
    { id:'bone-storm',    name:'Bone Storm',         icon:'🦴', desc:'Bones crunch underfoot. The crypt has shifted.',                  effect:'+25% combat encounters. Gold +20%.',                  combatBonus:0.25, goldMult:1.20 },
  ],

};

var _dungeonWeather = null;

function rollDungeonWeather(dungeonName) {
  if (dungeonName === 'The Hollow') return null; // Hollow has its own system
  var pool = DUNGEON_WEATHER[dungeonName] || DUNGEON_WEATHER.default;
  _dungeonWeather = pool[Math.floor(Math.random() * pool.length)];
  return _dungeonWeather;
}

function getDungeonWeather() { return _dungeonWeather; }

function applyDungeonWeatherBonuses() {
  var w = _dungeonWeather;
  if (!w) return;
  if (w.hpBonus) { DS.maxHp += w.hpBonus; DS.hp = Math.min(DS.hp + w.hpBonus, DS.maxHp); updateTopBar(); }
  if (w.spBonus) { DS.maxSp += w.spBonus; DS.sp = Math.min(DS.sp + w.spBonus, DS.maxSp); updateTopBar(); }
}

function getDungeonWeatherGoldMult() {
  var w = _dungeonWeather;
  if (!w || !w.goldMult) return 1;
  return w.goldMult;
}

function getDungeonWeatherEnemyAtkMult() {
  var w = _dungeonWeather;
  if (!w) return 1;
  return w.enemyAtkMult || 1;
}

function getDungeonWeatherPlayerAtkMult() {
  var w = _dungeonWeather;
  if (!w) return 1;
  return w.playerAtkMult || 1;
}

function getDungeonWeatherCombatBonus() {
  var w = _dungeonWeather;
  if (!w || !w.combatBonus) return 0;
  return w.combatBonus;
}

function getDungeonWeatherSpDiscount() {
  var w = _dungeonWeather;
  if (!w || !w.spDiscount) return 0;
  return w.spDiscount;
}

// The Abyssal Deep's own conditions: Crushing Depth's room cost and
// Bioluminescent Bloom's gold were announced but never applied.
function abyssalWeatherGoldMult() {
  var w = DS.dungeon === 'The Abyssal Deep' ? getAbyssalWeather() : null;
  return (w && w.goldMult) || 1;
}
// Stronger potions (Divine Blessing, Cooled Ashes, Crypt Mist, Hallowed Ground, Library Silence)
function weatherPotionMult() {
  var w = getDungeonWeather();
  return 1 + ((w && w.potionBoost) || 0);
}
function applyDungeonWeatherRoomHpLoss() {
  var aw = DS.dungeon === 'The Abyssal Deep' ? getAbyssalWeather() : null;
  if (aw && aw.roomHpLoss && DS.hp > 1) {
    DS.hp = Math.max(1, DS.hp - aw.roomHpLoss); updatePlayerBar();
    addLog(aw.icon + ' ' + aw.name + ' — -' + aw.roomHpLoss + ' HP from the pressure.');
  }
  var w = _dungeonWeather;
  if (!w || !w.roomHpLoss) return;
  DS.hp = Math.max(1, DS.hp - w.roomHpLoss);
  updatePlayerBar();
  addLog('🌡️ ' + w.name + ' — -' + w.roomHpLoss + ' HP from the conditions.');
}

var HOLLOW_WEATHER = [
  {
    id: 'foggy-night',
    name: 'Foggy Night',
    icon: '🌫️',
    desc: 'A thick fog fills the Hollow. Visibility is nearly zero. The house feels closer.',
    effect: 'Combat chance +15%. Something is moving in the fog.',
    combatBonus: 0.15,
  },
  {
    id: 'full-moon',
    name: 'Full Moon',
    icon: '🌕',
    desc: 'Moonlight pours through broken windows. The shadows are sharp. The dead are restless.',
    effect: 'Enemies are 20% stronger but drop 50% more gold.',
    enemyMult: 1.20,
    goldMult: 1.50,
  },
  {
    id: 'silent-night',
    name: 'Silent Night',
    icon: '🤫',
    desc: 'The Hollow is perfectly silent. Even your footsteps make no sound. Something is listening.',
    effect: 'Weeping Child appears twice as often. Music Box appears more frequently.',
    silentNight: true,
  },
  {
    id: 'witching-hour',
    name: 'The Witching Hour',
    icon: '🕛',
    desc: 'It is exactly midnight in the Hollow. The clocks stopped at this moment years ago.',
    effect: 'Enemy critical hits doubled. You deal 25% more damage.',
    atkBoost: 0.25,
    enemyCritBoost: true,
  },
  {
    id: 'still-and-cold',
    name: 'Still and Cold',
    icon: '❄️',
    desc: 'Nothing unusual. The Hollow is quiet and cold. The house is just waiting.',
    effect: 'No special effects. The house observes.',
  },
];

var _hollowWeather = null;

function rollHollowWeather() {
  var idx = Math.floor(Math.random() * HOLLOW_WEATHER.length);
  _hollowWeather = HOLLOW_WEATHER[idx];
  return _hollowWeather;
}

function getHollowWeather() { return _hollowWeather; }

function applyHollowWeatherBonuses() {
  var w = _hollowWeather;
  if (!w) return;
  if (w.atkBoost) DS.atkBonus = Math.round(DS.atkBonus + (DS.atk[1] * w.atkBoost));
}

