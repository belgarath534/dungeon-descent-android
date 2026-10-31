// ── MENU EVENT BANNER ──
function updateMenuEventBanner() {
  var evB2 = getEventBonuses();
  var menuEvBanner = document.getElementById('menu-event-banner');
  var lines = [];
  if (menuEvBanner) {
    if (evB2) {
      var hrs = getEventHoursRemaining();
      if (hrs > 0) {
        var days = Math.floor(hrs / 24);
        var hoursLeft = hrs % 24;
        var timeStr = days > 0 ? days + 'd ' + hoursLeft + 'h remaining' : hrs + 'h remaining';
        lines.push(evB2.label + ' · ACTIVE · ' + timeStr);
      }
    }
    // Always check weekly events independently so they show alongside major events
    var now = new Date(); var dow = now.getDay(); var day = now.getDate(); var month = now.getMonth()+1;
    var activeEv = getActiveEvent();
    if (activeEv !== 'xpweekend' && (dow === 6 || dow === 0)) {
      var xpEnd = new Date(now); xpEnd.setDate(xpEnd.getDate() + (dow===0?0:1)); xpEnd.setHours(23,59,59);
      var xpHrs = Math.max(0, Math.ceil((xpEnd-now)/3600000));
      if (xpHrs > 0) lines.push('⚡ XP Weekend · ACTIVE · ' + xpHrs + 'h remaining');
    }
    if (activeEv !== 'voidweek' && dow === 1) {
      var vEnd = new Date(now); vEnd.setHours(23,59,59);
      var vHrs = Math.max(0, Math.ceil((vEnd-now)/3600000));
      if (vHrs > 0) lines.push('🌑 Void Week · ACTIVE · ' + vHrs + 'h remaining');
    }
    if (activeEv !== 'bloodmoon' && day <= 7 && month !== 10 && month !== 12) {
      var bmEnd = new Date(now.getFullYear(), month-1, 7, 23, 59, 59);
      var bmHrs = Math.max(0, Math.ceil((bmEnd-now)/3600000));
      if (bmHrs > 0) lines.push('🔴 Blood Moon · ACTIVE · ' + Math.floor(bmHrs/24) + 'd ' + (bmHrs%24) + 'h remaining');
    }
    if (activeEv !== 'architect' && day >= 8 && day <= 14 && month !== 10 && month !== 12) {
      var aEnd = new Date(now.getFullYear(), month-1, 14, 23, 59, 59);
      var aHrs = Math.max(0, Math.ceil((aEnd-now)/3600000));
      if (aHrs > 0) lines.push('🏛️ Architect Week · ACTIVE · ' + Math.floor(aHrs/24) + 'd ' + (aHrs%24) + 'h remaining');
    }
    if (lines.length > 0) {
      menuEvBanner.innerHTML = lines.join('<br>');
      menuEvBanner.style.display = 'block';
    } else {
      menuEvBanner.style.display = 'none';
    }
  }
  // Night Mode banner — shows ALONGSIDE event banner, not instead of it
  var nightBanner = document.getElementById('menu-night-banner');
  if (nightBanner) {
    if (isNightTime()) {
      var nightHrs = getNightModeHoursRemaining();
      var _nbLang = DDStore.getItem('dd_lang') || 'en';
      var _nbPT = _nbLang === 'pt-BR';
      var nightStr = nightHrs > 1 ? nightHrs + (_nbPT ? 'h restantes' : 'h remaining') : (_nbPT ? 'encerrando em breve' : 'ending soon');
      nightBanner.textContent = _nbPT
        ? '🌙 Modo Noturno · +50% ouro · lojas 25% mais baratas · ' + nightStr
        : '🌙 Night Mode · +50% gold · 25% cheaper shops · ' + nightStr;
      nightBanner.style.display = 'block';
    } else {
      nightBanner.style.display = 'none';
    }
  }
  // Void Reaper banner
  if (typeof updateVRMenuBanner === 'function') updateVRMenuBanner();
}

// ── MUSIC BOX TUTORIAL ──
var _musicBoxTutorialSeen = false; // real value hydrated in the DDStore.whenReady() callback

function showMusicBoxTutorial(callback) {
  if (_musicBoxTutorialSeen) { callback(); return; }
  _musicBoxTutorialSeen = true;
  DDStore.setItem('dd_mb_tutorial', '1');
  var ov = document.getElementById('musicbox-tutorial');
  if (!ov) { callback(); return; }
  ov.style.display = 'flex';
  ov._callback = callback;
  say('New enemy. The Music Box. Listen carefully. After each attack you make, the melody plays and deals damage 3 times before your turn returns. Defending reduces melody damage by 50 percent. Press the button when ready to fight.');
  setTimeout(function() {
    var btn = ov.querySelector('button');
    if (btn) btn.focus();
  }, 100);
}

function closeMusicBoxTutorial() {
  var ov = document.getElementById('musicbox-tutorial');
  if (!ov) return;
  var cb = ov._callback;
  ov.style.display = 'none';
  ov._callback = null;
  if (cb) cb();
}

// ── SKIP NAV ──
function skipToMain() {
  var el = document.getElementById('screen-menu');
  if (el) el.focus();
  say('Main menu.');
}

// Remove skip nav from DOM entirely on Capacitor — VoiceOver on native doesn't need it
// and it causes accidental Dynamic Island focus when swiping left from the top
(function() {
  if (window.Capacitor) {
    var skipNav = document.getElementById('skip-nav');
    if (skipNav) skipNav.parentNode.removeChild(skipNav);
  }
})();

// ── MANUAL SAVE ──
function manualSave() {
  if (_charIdx === null || !CHARS[_charIdx]) {
    say('No active character to save.');
    return;
  }
  if (DS.inCombat) {
    say('Cannot save during combat.');
    setEvent('', 'The dungeon will not pause for paperwork. Finish the fight first.');
    return;
  }
  try {
    saveProgress();
    var now = new Date();
    var timeStr = now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0');
    setEvent('good', 'Progress saved at floor ' + DS.floor + '. ' + timeStr + '. The dungeon acknowledges your caution.');
    say('Game saved. Floor ' + DS.floor + '. ' + timeStr + '.');
    sfx('sfx-select');
  } catch(e) {
    console.error('[DD Save] manualSave error:', e.message);
    say('Save failed. Try again.');
  }
}


//═════════════════
// SEASONAL EVENTS SYSTEM
//═════════════════
var JULY4_ENEMIES = [
  { name:'Redcoat Wraith',   icon:'🇬🇧', hp:80,  atk:[12,18], def:3, pts:40, tier:'t1', desc:'A phantom soldier from a forgotten war.' },
  { name:'Cannon Specter',   icon:'💣',  hp:100, atk:[15,22], def:2, pts:55, tier:'t2', desc:'Fires spectral cannonballs that ignore armor.' },
  { name:'Musket Shade',     icon:'🔫',  hp:70,  atk:[14,20], def:2, pts:45, tier:'t1', desc:'Attacks from range before you can reach it.' },
  { name:'Loyalist Knight',  icon:'⚔️',  hp:120, atk:[16,24], def:5, pts:65, tier:'t2', desc:'A heavily armored servant of the old order.' },
  { name:'Tyrant Sentinel',  icon:'👑',  hp:150, atk:[18,26], def:6, pts:80, tier:'t3', desc:'Guards the Tyrant King with fanatical loyalty.' },
];

var HALLOWEEN_ENEMIES = [
  // 12 Halloween-exclusive enemies
  { name:'Jack Lantern',         icon:'🎃', hp:28, atk:[6,12],  gold:[3,7],  seasonal:'halloween' },
  { name:'The Scarecrow',        icon:'🪆', hp:32, atk:[7,13],  gold:[3,7],  seasonal:'halloween' },
  { name:'Candy Wraith',         icon:'🍬', hp:20, atk:[5,11],  gold:[2,5],  seasonal:'halloween' },
  { name:'The Pumpkin King',     icon:'👑', hp:80, atk:[14,22], gold:[20,35],seasonal:'halloween', isBoss:true },
  { name:'Grave Fog',            icon:'🌫️', hp:22, atk:[5,10], gold:[2,5],  seasonal:'halloween' },
  { name:'The Bat Swarm',        icon:'🦇', hp:18, atk:[4,10],  gold:[2,4],  seasonal:'halloween' },
  { name:'Hollow Skeleton',      icon:'💀', hp:30, atk:[6,12],  gold:[3,6],  seasonal:'halloween' },
  { name:'The Black Cat',        icon:'🐈', hp:16, atk:[5,12],  gold:[2,5],  seasonal:'halloween' },
  { name:'Cursed Pumpkin',       icon:'🎃', hp:24, atk:[6,11],  gold:[2,5],  seasonal:'halloween' },
  { name:'The Witch',            icon:'🧙', hp:45, atk:[9,16],  gold:[8,14], seasonal:'halloween' },
  { name:'Ghost of Halloween',   icon:'👻', hp:26, atk:[6,12],  gold:[3,6],  seasonal:'halloween' },
  { name:'The Headless One',     icon:'🪖', hp:55, atk:[11,18], gold:[9,15], seasonal:'halloween' },
];

var CHRISTMAS_ENEMIES = [
  { name:'Krampus Imp',          icon:'😈', hp:26, atk:[5,11],  gold:[3,6],  seasonal:'christmas' },
  { name:'The Snowman',          icon:'⛄', hp:40, atk:[7,13],  gold:[5,9],  seasonal:'christmas' },
  { name:'Cursed Elf',           icon:'🧝', hp:22, atk:[5,10],  gold:[2,5],  seasonal:'christmas' },
  { name:'Krampus',              icon:'🎄', hp:90, atk:[15,24], gold:[25,40],seasonal:'christmas', isBoss:true },
  { name:'Frozen Gift',          icon:'🎁', hp:18, atk:[4,9],   gold:[2,4],  seasonal:'christmas' },
  { name:'The Dark Reindeer',    icon:'🦌', hp:35, atk:[7,14],  gold:[4,8],  seasonal:'christmas' },
  { name:'Naughty Elf',          icon:'🧦', hp:30, atk:[6,12],  gold:[3,7],  seasonal:'christmas' },
  { name:'Frost Imp',            icon:'❄️', hp:20, atk:[4,9],   gold:[2,5],  seasonal:'christmas' },
];

var VALENTINES_ENEMIES = [
  { name:'Heartbreak Wraith',  icon:'💔', hp:32, atk:[6,12],  gold:[5,10], seasonal:'valentines' },
  { name:'The Jealous Spirit', icon:'😤', hp:28, atk:[7,13],  gold:[4,8],  seasonal:'valentines' },
  { name:'Thorned Rose',       icon:'🥀', hp:35, atk:[6,11],  gold:[5,9],  seasonal:'valentines', poisonsPlayer:true },
  { name:'The Rejected One',   icon:'💧', hp:40, atk:[8,14],  gold:[6,12], seasonal:'valentines' },
  { name:'Love Letter Golem',  icon:'💌', hp:45, atk:[7,13],  gold:[8,14], seasonal:'valentines' },
  { name:'The Cupid',          icon:'💘', hp:38, atk:[9,15],  gold:[10,18],seasonal:'valentines', dropsLovePotion:true, desc:'A rare sighting. Defeating it always drops a Love Potion.' },
  { name:'The Heartbreaker',   icon:'💝', hp:90, atk:[13,20], gold:[25,40],seasonal:'valentines', isBoss:true, charmsPlayer:true, desc:'Its arrows do not wound the body. They charm the mind. Resist or lose a turn.' },
];

var BRAZIL_ENEMIES = [
  { name:'O Craque',       icon:'⚽', hp:35, atk:[8,14],  gold:[8,14],  seasonal:'brazil', footballKick:true, desc:'Kicks an enchanted football at you instead of attacking normally. It hurts more than it should.' },
  { name:'A Onça',         icon:'🐆', hp:30, atk:[7,16],  gold:[6,12],  seasonal:'brazil', dodgeChance:0.20, desc:'The jaguar. Fast, agile, 20% dodge chance. The rainforest\'s apex predator.' },
  { name:'O Jacaré',       icon:'🐊', hp:70, atk:[10,16], gold:[8,15],  seasonal:'brazil', desc:'The caiman. Massive defense. Slow but devastating.' },
  { name:'O Papagaio',     icon:'🦜', hp:25, atk:[5,11],  gold:[4,8],   seasonal:'brazil', mirrorAtk:true, desc:'Copies your last attack and uses it against you.' },
  { name:'A Cobra',        icon:'🐍', hp:28, atk:[6,12],  gold:[5,10],  seasonal:'brazil', poisonsPlayer:true, desc:'Poisons you every turn.' },
  { name:'O Gavião',       icon:'🦅', hp:22, atk:[7,15],  gold:[5,9],   seasonal:'brazil', desc:'A hawk that dives from above. First strike always hits for maximum damage.' },
  { name:'O Boto Cor-de-Rosa', icon:'🐬', hp:45, atk:[8,14], gold:[10,18], seasonal:'brazil', desc:'The pink river dolphin of Amazonian legend. Enchants you with 30% chance to charm.' },
  { name:'O Rei do Carnaval', icon:'👑', hp:100, atk:[15,24], gold:[30,50], seasonal:'brazil', isBoss:true, desc:'The King of Carnival. He came to celebrate. You interrupted the celebration. He will not forgive this.' },
];

var STPATRICKS_ENEMIES = [
  { name:'The Leprechaun',       icon:'🧝', hp:35, atk:[6,12],  gold:[15,25],seasonal:'stpatricks', stealsGold:true, desc:'Steals 10 gold from you each turn instead of dealing damage. Kill it fast.' },
  { name:'Cursed Shamrock',      icon:'☘️', hp:22, atk:[5,10],  gold:[4,8],  seasonal:'stpatricks' },
  { name:'Green Wraith',         icon:'💚', hp:40, atk:[7,14],  gold:[5,10], seasonal:'stpatricks' },
  { name:'The Pot Guardian',     icon:'🌈', hp:55, atk:[9,16],  gold:[8,14], seasonal:'stpatricks' },
  { name:'Lucky Imp',            icon:'🍀', hp:18, atk:[4,9],   gold:[3,6],  seasonal:'stpatricks', dodgeChance:0.25, coward:true, desc:'Has a 25% chance to dodge your attack entirely. Flees if you look too dangerous.' },
  { name:'The Rainbow Serpent',  icon:'🐍', hp:65, atk:[11,18], gold:[10,18],seasonal:'stpatricks' },
  { name:'Gold Goblin',          icon:'💰', hp:28, atk:[5,11],  gold:[20,35],seasonal:'stpatricks', goldFlee:true, desc:'Carries extra gold but runs fast — it has a 30% chance to flee each turn.' },
  { name:'The Clurichaun',       icon:'🍺', hp:85, atk:[14,22], gold:[25,40],seasonal:'stpatricks', isBoss:true, desc:'The dark twin of the Leprechaun. Drunk on cursed ale. Hits harder every turn.' },
];


var THANKSGIVING_ENEMIES = [
  { name:'The Harvest Wraith',   icon:'🌾', hp:45, atk:[8,14],  gold:[6,10], seasonal:'thanksgiving' },
  { name:'Rotten Pilgrim',       icon:'🎩', hp:35, atk:[6,12],  gold:[4,8],  seasonal:'thanksgiving' },
  { name:'Cursed Scarecrow',     icon:'🌻', hp:50, atk:[9,16],  gold:[5,10], seasonal:'thanksgiving' },
  { name:'The Hungry Shade',     icon:'🍂', hp:28, atk:[5,10],  gold:[3,6],  seasonal:'thanksgiving' },
  { name:'Autumn Revenant',      icon:'🍁', hp:55, atk:[10,18], gold:[7,12], seasonal:'thanksgiving' },
  { name:'The Cornfield Horror', icon:'🌽', hp:40, atk:[7,13],  gold:[5,9],  seasonal:'thanksgiving' },
  { name:'The Feast Devourer',   icon:'🦃', hp:120,atk:[18,28], gold:[30,50],seasonal:'thanksgiving', isBoss:true, desc:'It came for the feast. There is no feast. It settled for you.' },
  { name:'Harvest Moon Shade',   icon:'🌕', hp:38, atk:[7,14],  gold:[4,8],  seasonal:'thanksgiving' },
];

//═════════════════
// DAILY DESCENT — Daily Login Rewards
//═════════════════
var DAILY_REWARDS = [
  { day:1,  gold:25,  icon:'💰', name:'25 Gold',                     desc:'A small offering from the dungeon. Every descent begins here.' },
  { day:2,  gold:40,  icon:'🧪', name:'40 Gold + Health Potion',      desc:'The dungeon remembers you returned. It rewards consistency.', bonus:{ type:'potion', name:'Health Potion', icon:'🧪', heal:40 } },
  { day:3,  gold:55,  icon:'✨', name:'55 Gold + 5 Soul Fragments',   desc:'Three days. The dungeon is starting to respect you.', bonus:{ type:'fragment', amount:5 } },
  { day:4,  gold:70,  icon:'✨', name:'70 Gold + 8 Soul Fragments',   desc:'A soul fragment stirs. Something down here is rooting for you.', bonus:{ type:'fragment', amount:8 } },
  { day:5,  gold:90,  icon:'🪙', name:'90 Gold + Mystery Coin',       desc:'Five days. The merchant left something for you at the entrance.', bonus:{ type:'coin', amount:1 } },
  { day:6,  gold:110, icon:'💊', name:'110 Gold + Greater Potion',    desc:'Six days without stopping. The dungeon yields more than usual.', bonus:{ type:'potion', name:'Greater Potion', icon:'💊', heal:80 } },
  { day:7,  gold:130, icon:'🌋', name:'130 Gold + Volcanic Elixir',   desc:'A full week. The vendor sends a Volcanic Elixir down with the delivery.', bonus:{ type:'elixir', name:'Volcanic Elixir', icon:'🌋', healPct:0.65 } },
  { day:8,  gold:150, icon:'✨', name:'150 Gold + 10 Soul Fragments', desc:'Eight days. The fragments are starting to add up.', bonus:{ type:'fragment', amount:10 } },
  { day:9,  gold:170, icon:'🧪', name:'170 Gold + Health Potion',     desc:'Nine days. The dungeon keeps a tab, and you are owed.', bonus:{ type:'potion', name:'Health Potion', icon:'🧪', heal:40 } },
  { day:10, gold:190, icon:'🪙', name:'190 Gold + Mystery Coin',      desc:'Ten days. A milestone most never reach.', bonus:{ type:'coin', amount:1 } },
  { day:11, gold:210, icon:'🌑', name:'210 Gold + Void Elixir',       desc:'The vendor has heard of your streak and sends a Void Elixir.', bonus:{ type:'elixir', name:'Void Elixir', icon:'🌑', healPct:0.65 } },
  { day:12, gold:230, icon:'✨', name:'230 Gold + 12 Soul Fragments', desc:'Twelve days. Your resolve is starting to show.', bonus:{ type:'fragment', amount:12 } },
  { day:13, gold:250, icon:'💊', name:'250 Gold + Greater Potion',    desc:'Thirteen days. Unlucky for the dungeon, not for you.', bonus:{ type:'potion', name:'Greater Potion', icon:'💊', heal:80 } },
  { day:14, gold:270, icon:'🪙', name:'270 Gold + 2 Mystery Coins',   desc:'Two full weeks. The merchant is impressed.', bonus:{ type:'coin', amount:2 } },
  { day:15, gold:300, icon:'🌿', name:'300 Gold + Sylvan Elixir',     desc:'Halfway through the month. The vendor sends a Sylvan Elixir.', bonus:{ type:'elixir', name:'Sylvan Elixir', icon:'🌿', healPct:0.60 } },
  { day:16, gold:320, icon:'✨', name:'320 Gold + 15 Soul Fragments', desc:'Sixteen days. The fragments hum with stored power.', bonus:{ type:'fragment', amount:15 } },
  { day:17, gold:340, icon:'🧪', name:'340 Gold + Health Potion',     desc:'Seventeen days. Still here. Still descending.', bonus:{ type:'potion', name:'Health Potion', icon:'🧪', heal:40 } },
  { day:18, gold:360, icon:'🪙', name:'360 Gold + Mystery Coin',      desc:'Eighteen days. The dungeon has stopped being surprised.', bonus:{ type:'coin', amount:1 } },
  { day:19, gold:380, icon:'🩶', name:'380 Gold + Hollow Elixir',     desc:'The vendor sends a Hollow Elixir. Left behind by someone who no longer needs it.', bonus:{ type:'elixir', name:'Hollow Elixir', icon:'🩶', healPct:0.55 } },
  { day:20, gold:400, icon:'✨', name:'400 Gold + 18 Soul Fragments', desc:'Twenty days. A number that means something.', bonus:{ type:'fragment', amount:18 } },
  { day:21, gold:420, icon:'💊', name:'420 Gold + Greater Potion',    desc:'Three weeks. The dungeon has run out of ways to test you.', bonus:{ type:'potion', name:'Greater Potion', icon:'💊', heal:80 } },
  { day:22, gold:440, icon:'🪙', name:'440 Gold + 2 Mystery Coins',   desc:'Twenty-two days. Close now.', bonus:{ type:'coin', amount:2 } },
  { day:23, gold:460, icon:'🔱', name:'460 Gold + Hellfire Elixir',   desc:'The vendor sends a Hellfire Elixir, distilled from infernal flame.', bonus:{ type:'elixir', name:'Hellfire Elixir', icon:'🔱', healPct:0.65 } },
  { day:24, gold:480, icon:'✨', name:'480 Gold + 20 Soul Fragments', desc:'Twenty-four days. Almost a month.', bonus:{ type:'fragment', amount:20 } },
  { day:25, gold:500, icon:'⭐', name:'500 Gold + Superior Potion',   desc:'Twenty-five days. The dungeon brews something stronger for you.', bonus:{ type:'potion', name:'Superior Potion', icon:'⭐', heal:120 } },
  { day:26, gold:520, icon:'🪙', name:'520 Gold + 2 Mystery Coins',   desc:'Twenty-six days. The merchant no longer asks your name.', bonus:{ type:'coin', amount:2 } },
  { day:27, gold:540, icon:'🌑', name:'540 Gold + Shadow Elixir',    desc:'The vendor sends a Shadow Elixir, brewed from the dark between worlds.', bonus:{ type:'elixir', name:'Shadow Elixir', icon:'🌑', healPct:0.65 } },
  { day:28, gold:560, icon:'✨', name:'560 Gold + 25 Soul Fragments', desc:'Four full weeks. The fragments could almost speak.', bonus:{ type:'fragment', amount:25 } },
  { day:29, gold:580, icon:'🪙', name:'580 Gold + 3 Mystery Coins',   desc:'Twenty-nine days. One more.', bonus:{ type:'coin', amount:3 } },
  { day:30, gold:700, icon:'👑', name:'700 Gold + 5 Mystery Coins + 50 Soul Fragments', desc:'A full month. The dungeon bows. This reward will not come again until you have earned it again.', bonus:{ type:'monthly', coins:5, fragments:50 } },
];

function getDailyRewardForDay(day) {
  var idx = ((day - 1) % 30);
  var reward = JSON.parse(JSON.stringify(DAILY_REWARDS[idx]));
  // Bonus gold per completed 30-day cycle
  var cyclesCompleted = Math.floor((day - 1) / 30);
  if (cyclesCompleted > 0) reward.gold += cyclesCompleted * 50;
  reward.day = day;
  return reward;
}

function getDailyDescentState() {
  try {
    return _jsonParseSafe(DDStore.getItem('dd_daily_descent'), 'null');
  } catch(e) { return null; }
}

function saveDailyDescentState(state) {
  DDStore.setItem('dd_daily_descent', JSON.stringify(state));
}

function initDailyDescentBadge() {
  var now = new Date();
  var today = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
  var state = getDailyDescentState() || { streak:0, lastClaim:null, totalDays:0 };

  // Check if streak is broken
  if (state.lastClaim && state.lastClaim !== today) {
    var last = parseDayKey(state.lastClaim);
    var diffDays = calendarDaysBetween(last, now);
    if (diffDays > 1) state.streak = 0;
  }

  var alreadyClaimed = state.lastClaim === today;
  var badge = document.getElementById('menu-streak-badge');
  if (!badge) return;

  badge.style.display = '';
  if (alreadyClaimed) {
    badge.textContent = '🔥 Day ' + state.streak + ' Streak ✓ Claimed';
    badge.style.color = '#668844';
    badge.style.borderColor = '#334422';
    badge.setAttribute('aria-label', 'Daily Descent. Day ' + state.streak + ' streak. Already claimed today. Come back tomorrow.');
    badge.onclick = function() { say('You already claimed today\'s reward. Come back tomorrow for Day ' + (state.streak + 1) + '.'); };
  } else {
    var pendingStreak = state.streak + 1;
    badge.textContent = '🔥 Day ' + pendingStreak + ' — Tap to Claim!';
    badge.style.color = '#cc8844';
    badge.style.borderColor = '#443300';
    badge.setAttribute('aria-label', 'Daily Descent. Day ' + pendingStreak + ' reward ready. Tap to claim.');
    badge.onclick = function() { checkDailyDescent(); };
  }
  badge.onkeydown = function(e) { if (e.key === 'Enter' || e.key === ' ') badge.onclick(); };
}

function checkDailyDescent() {
  var now = new Date();
  var today = now.getFullYear() + '-' + (now.getMonth()+1) + '-' + now.getDate();
  var state = getDailyDescentState() || { streak:0, lastClaim:null, totalDays:0 };

  // Already claimed today — just say so
  if (state.lastClaim === today) {
    var _lang = DDStore.getItem('dd_lang') || 'en';
    if (_lang === 'pt-BR') {
      say('Já resgatado hoje. Volte amanhã para o Dia ' + (state.streak + 1) + '.');
    } else {
      say('Already claimed today. Come back tomorrow for Day ' + (state.streak + 1) + '.');
    }
    return;
  }

  // Check if streak broken
  if (state.lastClaim) {
    var last = parseDayKey(state.lastClaim);
    var diffDays = calendarDaysBetween(last, now);
    if (diffDays > 1) state.streak = 0;
  }

  state.streak++;
  var reward = getDailyRewardForDay(state.streak);
  showDailyDescentPopup(state, reward, today);
}

function showDailyDescentPopup(state, reward, today) {
  var ov = document.getElementById('ov-daily-descent');
  if (!ov) return;

  // Set streak display
  var streakEl = document.getElementById('dd-streak-display');
  if (streakEl) streakEl.textContent = '🔥 Day ' + state.streak + ' Streak';

  // Set reward icon and name
  document.getElementById('dd-reward-icon').textContent = reward.icon;
  document.getElementById('dd-reward-name').textContent = reward.name;
  document.getElementById('dd-reward-desc').textContent = reward.desc;

  // Build reward preview
  var preview = document.getElementById('dd-reward-preview');
  preview.innerHTML = '';
  var rewards = [{ icon:'💰', label:reward.gold + 'g' }];
  if (reward.bonus) {
    if (reward.bonus.type === 'potion') rewards.push({ icon:reward.bonus.icon, label:reward.bonus.name });
    if (reward.bonus.type === 'elixir') rewards.push({ icon:reward.bonus.icon, label:reward.bonus.name });
    if (reward.bonus.type === 'fragment') rewards.push({ icon:'✨', label:reward.bonus.amount + ' Soul Fragments' });
    if (reward.bonus.type === 'coin') rewards.push({ icon:'🪙', label:reward.bonus.amount + ' Mystery Coin' + (reward.bonus.amount === 1 ? '' : 's') });
    if (reward.bonus.type === 'weekly') {
      rewards.push({ icon:'🪙', label:'1 Mystery Coin' });
      rewards.push({ icon:'✨', label:'25 Soul Fragments' });
    }
    if (reward.bonus.type === 'monthly') {
      rewards.push({ icon:'🪙', label:reward.bonus.coins + ' Mystery Coins' });
      rewards.push({ icon:'✨', label:reward.bonus.fragments + ' Soul Fragments' });
    }
  }
  rewards.forEach(function(r) {
    var chip = document.createElement('div');
    chip.style.cssText = 'background:#1a1000;border:1px solid #443300;padding:8px 14px;font-family:Cinzel,serif;font-size:0.72rem;color:#e0c080;';
    chip.textContent = r.icon + ' ' + r.label;
    chip.setAttribute('aria-label', r.label);
    preview.appendChild(chip);
  });

  // Week progress dots — shows position within the current 7-day block of the 30-day reward cycle
  var weekProg = document.getElementById('dd-week-progress');
  weekProg.innerHTML = '';
  var posInWeek = ((state.streak - 1) % 7) + 1;
  var isCycleFinale = ((state.streak - 1) % 30) === 29; // day 30 of the cycle
  for (var i = 1; i <= 7; i++) {
    var dot = document.createElement('div');
    var filled = i <= posInWeek;
    var isToday = i === posInWeek;
    var showCrown = isToday && isCycleFinale;
    dot.style.cssText = 'width:28px;height:28px;border-radius:50%;border:1px solid ' + (filled ? 'var(--gold)' : '#333') + ';background:' + (filled ? 'rgba(201,162,39,0.2)' : '#0a0a0a') + ';display:flex;align-items:center;justify-content:center;font-size:0.6rem;font-family:Cinzel,serif;color:' + (filled ? 'var(--gold)' : '#444') + ';' + (isToday ? 'box-shadow:0 0 8px rgba(201,162,39,0.6);' : '');
    dot.textContent = showCrown ? '👑' : i;
    dot.setAttribute('aria-label', 'Day ' + i + (filled ? ' completed' : '') + (isToday ? ' today' : ''));
    weekProg.appendChild(dot);
  }

  // Store pending state for claim
  ov._pendingState = state;
  ov._pendingReward = reward;
  ov._pendingToday = today;

  ov.style.display = 'flex';
  setTimeout(function() {
    var btn = document.getElementById('dd-claim-btn');
    if (btn) btn.focus();
  }, 100);

  var _ddLang = DDStore.getItem('dd_lang') || 'en';
  if (_ddLang === 'pt-BR') {
    say('Descida Diária. Série do Dia ' + state.streak + '. Recompensa de hoje: ' + reward.name + '. Pressione Resgatar Recompensa para coletar.');
  } else {
    say('Daily Descent. Day ' + state.streak + ' streak. Today\'s reward: ' + reward.name + '. Press Claim Reward to collect.');
  }
}

function claimDailyDescent() {
  var ov = document.getElementById('ov-daily-descent');
  if (!ov || !ov._pendingState) return;

  var state = ov._pendingState;
  var reward = ov._pendingReward;
  var today = ov._pendingToday;

  // Apply gold
  addGlobalGold(reward.gold);

  // Apply bonus
  if (reward.bonus) {
    if (reward.bonus.type === 'potion') {
      addToGlobalInventory({ name:reward.bonus.name, icon:reward.bonus.icon, type:'potion', heal:reward.bonus.heal, desc:'Daily Descent reward.' });
    }
    if (reward.bonus.type === 'elixir') {
      addToGlobalInventory({ name:reward.bonus.name, icon:reward.bonus.icon, type:'elixir', healPct:reward.bonus.healPct, desc:'Daily Descent reward.' });
    }
    if (reward.bonus.type === 'fragment') {
      var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0') + reward.bonus.amount;
      DDStore.setItem('dd_soul_fragments', String(frags));
    }
    if (reward.bonus.type === 'coin') {
      addMysteryCoin(reward.bonus.amount);
    }
    if (reward.bonus.type === 'weekly') {
      addMysteryCoin(reward.bonus.coins);
      var frags2 = parseInt(DDStore.getItem('dd_soul_fragments') || '0') + reward.bonus.fragments;
      DDStore.setItem('dd_soul_fragments', String(frags2));
    }
    if (reward.bonus.type === 'monthly') {
      addMysteryCoin(reward.bonus.coins);
      var frags3 = parseInt(DDStore.getItem('dd_soul_fragments') || '0') + reward.bonus.fragments;
      DDStore.setItem('dd_soul_fragments', String(frags3));
    }
  }

  // Save state
  state.lastClaim = today;
  state.totalDays = (state.totalDays || 0) + 1;
  saveDailyDescentState(state);

  // Close popup
  ov.style.display = 'none';
  sfx('sfx-unlock');

  // Refresh badge to show claimed state
  initDailyDescentBadge();

  say('Claimed! ' + reward.gold + ' gold added. ' + (reward.bonus ? 'Bonus reward also added.' : '') + ' Come back tomorrow to continue your streak.');
}

// ── END DAILY DESCENT ──
function getSeasonalCurrency(key) {
  return parseInt(DDStore.getItem('dd_sc_' + key) || '0');
}
function addSeasonalCurrency(key, amount) {
  var current = getSeasonalCurrency(key);
  DDStore.setItem('dd_sc_' + key, String(current + amount));
}
function spendSeasonalCurrency(key, amount) {
  var current = getSeasonalCurrency(key);
  if (current < amount) return false;
  DDStore.setItem('dd_sc_' + key, String(current - amount));
  return true;
}

function awardSeasonalCurrencyOnKill() {
  var ev = getEventBonuses();
  if (!ev || !ev.seasonalCurrency) return;
  // 30% chance to earn 1 seasonal coin on kill
  if (Math.random() < 0.30) {
    addSeasonalCurrency(ev.seasonalCurrency, 1);
    updateSeasonalCurrencyDisplay();
  }
}

function updateSeasonalCurrencyDisplay() {
  var ev = getEventBonuses();
  var el = document.getElementById('seasonal-currency-display');
  if (!el) return;
  if (ev && ev.seasonalCurrency) {
    var count = getSeasonalCurrency(ev.seasonalCurrency);
    el.style.display = '';
    el.textContent = ev.seasonalCurrencyIcon + ' ' + count + ' ' + ev.seasonalCurrencyName;
  } else {
    el.style.display = 'none';
  }
}

// ── SEASONAL SHOP ITEMS ──
// Seasonal shop items bought from the menu went into a run that wasn't there
// (the last run's leftover state). They now go into your saved inventory, and
// into the current run's bag when you're in one.
function seasonalGive(item) {
  var inRun = _currentScreen === 'dungeon' && DS && DS.inventory;
  if (inRun) DS.inventory.push(item);
  addToGlobalInventory(item);
}

var CURSE_SHOP_ITEMS = [
  { id:'bs-discount-code', name:'Blacksmith Discount',   icon:'⚒️', cost:15, desc:'10% off all Blacksmith upgrades for 24 hours. A code is added to your General Settings.',
    apply: function() {
      var exp = Date.now() + 86400000;
      DDStore.setItem('dd_blacksmith_discount', JSON.stringify({pct:0.10,expires:exp,source:'Curse Shop'}));
      say('Blacksmith discount applied. 10% off for 24 hours.');
    }
  },
  { id:'double-xp-potion',  name:'Potion of Darkness',   icon:'🧪', cost:20, desc:'Double XP for your next 3 dungeon floors. Darkness has its perks.',
    apply: function() {
      DDStore.setItem('dd_xp_boost', JSON.stringify({mult:2,floors:3}));
      say('Double XP for next 3 floors activated.');
    }
  },
  { id:'cursed-run-mod',   name:'Cursed Modifier',       icon:'💀', cost:10, desc:'Apply a random Halloween run modifier to your next run.',
    apply: function() {
      var mods = ['double-hp','fast-enemies','cursed-floor'];
      var mod = mods[Math.floor(Math.random()*mods.length)];
      DDStore.setItem('dd_pending_run_mod', mod);
      say('Cursed modifier applied to your next run.');
    }
  },
  { id:'demon-revival', enemyType:'demon',    name:'Demon Revival',          icon:'😈', cost:30, desc:'Grants one extra life in your next dungeon run.',
    apply: function() {
      DDStore.setItem('dd_bonus_life', '1');
      say('One bonus life granted for your next run.');
    }
  },
  { id:'halloween-potion', name:'Pumpkin Brew',           icon:'🎃', cost:8,  desc:'A potion that heals 80 HP. Only sold in the Curse Shop.',
    apply: function() {
      seasonalGive({name:'Pumpkin Brew',icon:'🎃',type:'potion',heal:80,desc:'Halloween brew. Heals 80 HP.'});
      say('Pumpkin Brew added to inventory.');
    }
  },
];

var SANTA_SHOP_ITEMS = [
  { id:'santa-bs-discount', name:'Christmas Discount',   icon:'🎁', cost:15, desc:'15% off all Blacksmith upgrades for 24 hours. A gift from Santa.',
    apply: function() {
      var exp = Date.now() + 86400000;
      DDStore.setItem('dd_blacksmith_discount', JSON.stringify({pct:0.15,expires:exp,source:'Santa Shop'}));
      say('Christmas discount applied. 15% off for 24 hours.');
    }
  },
  { id:'santa-xp-boost',   name:'Cookie of Knowledge',  icon:'🍪', cost:20, desc:'Triple XP for your next 2 dungeon floors.',
    apply: function() {
      DDStore.setItem('dd_xp_boost', JSON.stringify({mult:3,floors:2}));
      say('Triple XP for next 2 floors activated.');
    }
  },
  { id:'santa-potion',     name:'Eggnog Flask',          icon:'🥛', cost:8,  desc:'Heals 60 HP and restores 10 SP. Only sold in the Santa Shop.',
    apply: function() {
      seasonalGive({name:'Eggnog Flask',icon:'🥛',type:'potion',heal:60,spRestore:10,desc:'Heals 60 HP and 10 SP.'});
      say('Eggnog Flask added to inventory.');
    }
  },
  { id:'santa-bonus-gold', name:"Santa's Coin Bag",     icon:'💰', cost:12, desc:'Instantly receive 150 gold.',
    apply: function() {
      addGlobalGold(150);
      say('150 gold received from Santa.');
    }
  },
  { id:'santa-spirit-boost',name:'Elf Blessing',        icon:'🌟', cost:25, desc:'Your spirit companion deals double damage for your next run.',
    apply: function() {
      DDStore.setItem('dd_spirit_boost', '2');
      say('Elf blessing applied. Spirit deals double damage next run.');
    }
  },
];

var LIBERTY_SHOP_ITEMS = [
  { id:'liberty-firework',   name:'Mega Firework',          icon:'🎆', cost:5,  desc:'A powerful firework. Deals massive damage in combat.',
    apply: function() {
      seasonalGive({name:'Mega Firework',icon:'🎆',type:'firework',isFirework:true,desc:'Deals massive damage.'});
      say('Mega Firework added to inventory. Use it in combat for massive damage.');
    }
  },
  { id:'liberty-gold',       name:'Liberty Treasury',       icon:'💰', cost:8,  desc:'Receive 300 gold. For the cause of freedom.',
    apply: function() { addGlobalGold(300); say('300 gold received from the Liberty Treasury.'); }
  },
  { id:'liberty-eagle',      name:'Liberty Eagle',          icon:'🦅', cost:12, desc:'A patriotic minion joins your cause. Exclusive to July 4th.',
    apply: function() {
      if (DS && DS.minions) DS.minions.push({name:'Liberty Eagle',icon:'🦅',type:'eagle',desc:'A patriot minion.'});
      say('Liberty Eagle joins your cause. A patriot minion exclusive to the Fourth of July.');
    }
  },
  { id:'liberty-xp',         name:'Independence Scroll',    icon:'📜', cost:10, desc:'Double XP for your next 7 dungeon floors. In honor of 1776.',
    apply: function() {
      DDStore.setItem('dd_xp_boost', JSON.stringify({mult:2, floors:7}));
      say('Double XP for next 7 floors activated. Independence Day honors your sacrifice.');
    }
  },
  { id:'liberty-sparkler',   name:'Sparkler Buff',          icon:'✨', cost:6,  desc:'+30% ATK for your next run. The sparkler lights your path.',
    apply: function() {
      DS.sparklerBuff = true;
      DDStore.setItem('dd_sparkler_buff', '1');
      say('Sparkler buff activated. Plus 30 percent attack for your next run.');
    }
  },
  { id:'liberty-cannon',     name:'Patriot Cannon',         icon:'💣', cost:15, desc:'One-use item. Instantly defeats any non-boss enemy.',
    apply: function() {
      seasonalGive({name:'Patriot Cannon',icon:'💣',type:'cannon',isInstakill:true,desc:'Instantly defeats any non-boss enemy.'});
      say('Patriot Cannon added to inventory. One shot, one kill. Non-boss enemies only.');
    }
  },
  { id:'liberty-potion',     name:'Freedom Potion',         icon:'🔵', cost:7,  desc:'Heals 100 HP and grants immunity to debuffs for 3 turns.',
    apply: function() {
      seasonalGive({name:'Freedom Potion',icon:'🔵',type:'potion',heal:100,debuffImmune:3,desc:'Heals 100 HP. Debuff immunity for 3 turns.'});
      say('Freedom Potion added to inventory. Heals 100 HP and grants debuff immunity.');
    }
  },
  { id:'liberty-title',      name:'Patriot Title',          icon:'🗽', cost:20, desc:'Earn the title "The Patriot". Exclusive to July 4th.',
    apply: function() {
      if (CHARS[_charIdx]) { CHARS[_charIdx].title = 'The Patriot'; saveChars(); }
      say('Title unlocked: The Patriot. A title earned only on Independence Day.');
    }
  },
];

var HARVEST_SHOP_ITEMS = [
  { id:'harvest-gold',     name:'Harvest Bounty',        icon:'🌽', cost:10, desc:'Receive 200 gold. The harvest was good this year.',
    apply: function() { addGlobalGold(200); say('200 gold received from the harvest.'); }
  },
  { id:'harvest-potion',   name:'Harvest Brew',          icon:'🍂', cost:8,  desc:'Heals 70 HP. Made from autumn herbs.',
    apply: function() {
      seasonalGive({name:'Harvest Brew',icon:'🍂',type:'potion',heal:70,desc:'Heals 70 HP.'});
      say('Harvest Brew added to inventory.');
    }
  },
  { id:'harvest-xp',       name:'Feast of Knowledge',   icon:'🦃', cost:20, desc:'Double XP for your next 5 dungeon floors.',
    apply: function() {
      DDStore.setItem('dd_xp_boost', JSON.stringify({mult:2,floors:5}));
      say('Double XP for next 5 floors activated.');
    }
  },
];

var SHAMROCK_SHOP_ITEMS = [
  { id:'stpat-clover',     name:'Lucky Clover',          icon:'🍀', cost:5,  desc:'Doubles gold drops for the next 3 floors.',
    apply: function() {
      DS._luckPotionKills = (DS._luckPotionKills || 0) + 30;
      DS._luckPotionMult = 2;
      addLog('🍀 Lucky Clover! Double gold for 3 floors.');
      say('Lucky Clover active. Double gold drops for 3 floors.');
    }
  },
  { id:'stpat-stout',      name:'Irish Stout',           icon:'🍺', cost:6,  desc:'Heals 50 HP but reduces your ATK by 3 for 2 turns.',
    apply: function() {
      // (these buffs applied the moment you bought them — from the menu, to no run at all;
      // they now wait in your bag and work when you use them)
      seasonalGive({name:'Irish Stout',icon:'🍺',type:'seasonal-buff',buff:'stout',desc:'Heals 50 HP. -3 ATK for 2 turns.'});
      say('Irish Stout added to your bag.');
    }
  },
  { id:'stpat-pot',        name:'Pot of Gold',           icon:'🌈', cost:8,  desc:'Gain 300 gold but lose 20 HP. High risk, high reward.',
    apply: function() {
      addGlobalGold(300);
      if (DS) { DS.hp = Math.max(1, DS.hp - 20); updatePlayerBar(); }
      say('Pot of Gold! 300 gold gained. 20 HP lost.');
    }
  },
  { id:'stpat-charm',      name:'Leprechaun\'s Charm',   icon:'🧝', cost:10, desc:'Your next attack is guaranteed to critically hit.',
    apply: function() {
      seasonalGive({name:'Leprechaun\'s Charm',icon:'🧝',type:'seasonal-buff',buff:'crit',desc:'Your next attack is guaranteed to critically hit.'});
      say('Leprechaun\'s Charm added to your bag.');
    }
  },
  { id:'stpat-rainbow',    name:'Rainbow Shield',        icon:'🌈', cost:12, desc:'Absorbs the next 40 damage taken.',
    apply: function() {
      seasonalGive({name:'Rainbow Shield',icon:'🌈',type:'seasonal-buff',buff:'shield',amount:40,desc:'Absorbs the next 40 damage taken.'});
      say('Rainbow Shield added to your bag.');
    }
  },
  { id:'stpat-title',      name:'The Lucky One',         icon:'☘️', cost:25, desc:'Earn the title "The Lucky One". Exclusive to St. Patrick\'s Day.',
    apply: function() {
      if (CHARS[_charIdx]) { CHARS[_charIdx].title = 'The Lucky One'; saveChars(); }
      say('Title unlocked: The Lucky One. A title earned only on St. Patrick\'s Day.');
    }
  },
];

var CHOCOLATE_SHOP_ITEMS = [
  { id:'val-love-potion',  name:'Love Potion',       icon:'💘', cost:10, desc:'Charms an enemy to fight for you for 2 turns, then it turns on you.',
    apply: function() {
      seasonalGive({ name:'Love Potion', icon:'💘', type:'love-potion', desc:'Use on an enemy in combat. Charms them for 2 turns.' });
      say('Love Potion added to inventory.');
    }
  },
  { id:'val-chocolate-box', name:'Box of Chocolates', icon:'🍫', cost:6,  desc:'Heals 55 HP. Sweet and simple.',
    apply: function() {
      seasonalGive({name:'Box of Chocolates',icon:'🍫',type:'potion',heal:55,desc:'Heals 55 HP.'});
      say('Box of Chocolates added to inventory.');
    }
  },
  { id:'val-rose',          name:'Enchanted Rose',    icon:'🌹', cost:12, desc:'+8 ATK for 4 turns. Beautiful and dangerous.',
    apply: function() {
      seasonalGive({name:'Enchanted Rose',icon:'🌹',type:'seasonal-buff',buff:'rose',desc:'+8 ATK for 4 turns.'});
      say('Enchanted Rose added to your bag.');
    }
  },
  { id:'val-cupid-arrow',   name:"Cupid's Arrow",     icon:'🏹', cost:15, desc:'Guaranteed critical hit on your next attack.',
    apply: function() {
      seasonalGive({name:"Cupid's Arrow",icon:'🏹',type:'seasonal-buff',buff:'crit',desc:'Guaranteed critical hit on your next attack.'});
      say("Cupid's Arrow added to your bag.");
    }
  },
  { id:'val-heart-shield',  name:'Heart Shield',      icon:'💗', cost:14, desc:'Absorbs the next 45 damage taken.',
    apply: function() {
      seasonalGive({name:'Heart Shield',icon:'💗',type:'seasonal-buff',buff:'shield',amount:45,desc:'Absorbs the next 45 damage taken.'});
      say('Heart Shield added to your bag.');
    }
  },
  { id:'val-title',         name:'The Beloved',       icon:'💘', cost:28, desc:'Earn the title "The Beloved". Exclusive to Valentine\'s Day.',
    apply: function() {
      if (CHARS[_charIdx]) { CHARS[_charIdx].title = 'The Beloved'; saveChars(); }
      say('Title unlocked: The Beloved. A title earned only on Valentine\'s Day.');
    }
  },
];

function openSeasonalShop() {
  var activeSc = document.querySelector('.screen.active');
  var activeId = activeSc ? activeSc.id : '';
  _seasonalShopOrigin = (activeId === 'screen-dungeon' || activeId === 'screen-battle') ? 'dungeon' : 'menu';
  var ev = getEventBonuses();
  if (!ev || !ev.seasonalCurrency) { say('No seasonal shop available right now.'); return; }
  var items = ev.seasonalCurrency === 'demonCoins' ? CURSE_SHOP_ITEMS
            : ev.seasonalCurrency === 'christmasCookies' ? SANTA_SHOP_ITEMS
            : ev.seasonalCurrency === 'libertyCoins' ? LIBERTY_SHOP_ITEMS
            : ev.seasonalCurrency === 'shamrocks' ? SHAMROCK_SHOP_ITEMS
            : ev.seasonalCurrency === 'chocolate' ? CHOCOLATE_SHOP_ITEMS
            : HARVEST_SHOP_ITEMS;
  var shopName = ev.seasonalCurrency === 'demonCoins' ? '💀 Curse Shop'
               : ev.seasonalCurrency === 'christmasCookies' ? '🎅 Santa Shop'
               : ev.seasonalCurrency === 'libertyCoins' ? '🗽 Liberty Shop'
               : ev.seasonalCurrency === 'shamrocks' ? '☘️ Shamrock Shop'
               : ev.seasonalCurrency === 'chocolate' ? '🍫 Chocolate Shop'
               : '🌽 Harvest Market';
  var currency = getSeasonalCurrency(ev.seasonalCurrency);

  document.getElementById('ss-title').textContent = shopName;
  document.getElementById('ss-currency').textContent = ev.seasonalCurrencyIcon + ' ' + currency + ' ' + ev.seasonalCurrencyName;
  var list = document.getElementById('ss-items');
  list.innerHTML = '';
  items.forEach(function(item) {
    var canAfford = currency >= item.cost;
    var btn = document.createElement('button');
    btn.className = 'shop-item';
    btn.setAttribute('aria-label', item.name + '. ' + item.desc + '. Cost: ' + item.cost + ' ' + ev.seasonalCurrencyName + (canAfford ? '' : '. Cannot afford.'));
    btn.innerHTML =
      '<span class="shop-item-icon" aria-hidden="true">' + item.icon + '</span>' +
      '<div class="shop-item-info"><div class="shop-item-name">' + item.name + '</div><div class="shop-item-desc">' + item.desc + '</div></div>' +
      '<span class="shop-item-cost">' + item.cost + ev.seasonalCurrencyIcon + '</span>';
    if (!canAfford) btn.style.opacity = '0.5';
    btn.onclick = function() {
      if (!spendSeasonalCurrency(ev.seasonalCurrency, item.cost)) { say('Not enough ' + ev.seasonalCurrencyName + '.'); return; }
      item.apply();
      sfx('sfx-purchase');
      currency = getSeasonalCurrency(ev.seasonalCurrency);
      document.getElementById('ss-currency').textContent = ev.seasonalCurrencyIcon + ' ' + currency + ' ' + ev.seasonalCurrencyName;
      updateSeasonalCurrencyDisplay();
      btn.textContent = '✅ Purchased!';
      btn.disabled = true;
    };
    list.appendChild(btn);
  });
  goTo('seasonal-shop');
  say(shopName + '. You have ' + currency + ' ' + ev.seasonalCurrencyName + '. ' + items.length + ' items available.');
}

var _seasonalShopOrigin = 'menu';

function closeSeasonalShop() {
  sfx('sfx-select');
  if (_seasonalShopOrigin === 'dungeon') {
    goTo('dungeon');
  } else {
    goTo('menu');
  }
}

// Calculate Easter Sunday for a given year (Anonymous Gregorian algorithm)
function getEasterDate(year) {
  try {
    var a = year % 19, b = Math.floor(year/100), c = year % 100;
    var d = Math.floor(b/4), e = b % 4, f = Math.floor((b+8)/25);
    var g = Math.floor((b-f+1)/3), h = (19*a+b-d-g+15) % 30;
    var i = Math.floor(c/4), k = c % 4, l = (32+2*e+2*i-h-k) % 7;
    var m = Math.floor((a+11*h+22*l)/451);
    var month = Math.floor((h+l-7*m+114)/31);
    var day = ((h+l-7*m+114) % 31) + 1;
    return new Date(year, month-1, day);
  } catch(e) {
    return new Date(year, 3, 20); // fallback to April 20
  }
}

function getActiveEvent() {
  var now = new Date();
  var month = now.getMonth() + 1; // 1-12
  var day = now.getDate();
  var dow = now.getDay();
  var year = now.getFullYear();
  // Seasonal
  if (month === 10) return 'halloween';
  if (month === 11 && day <= 2) return 'halloween';
  if (month === 12) return 'christmas';
  // Easter — dynamic, runs Easter Sunday through Tuesday
  var easter = getEasterDate(year);
  var easterEnd = new Date(easter); easterEnd.setDate(easterEnd.getDate() + 2);
  if (now >= easter && now <= easterEnd) return 'easter';
  // Thanksgiving — November 22-28
  if (month === 11 && day >= 22 && day <= 28) return 'thanksgiving';
  // St. Patrick's Day — March 14-18
  if (month === 3 && day >= 14 && day <= 18) return 'stpatricks';
  // Dungeon Descent Birthday — March 23rd every year
  if (month === 3 && day === 23) return 'birthday';
  // Cinco de Mayo — May 5th only
  if (month === 5 && day === 5) return 'cincodemayo';
  // Brazil Independence Day — September 7th only
  if (month === 9 && day === 7) return 'brazil';
  // Valentine's Day — February 13-15
  if (month === 2 && day >= 13 && day <= 15) return 'valentines';
  // Friday the 13th — whenever it lands
  if (day === 13 && dow === 5) return 'friday13';
  // Fourth of July — July 1-7
  if (month === 7 && day >= 1 && day <= 7) return 'july4';
  // Ambush Day — 15th of January, April, July, October
  if (day === 15 && (month === 1 || month === 4 || month === 7 || month === 10)) return 'ambushday';
  // Weekly
  if (dow === 6 || dow === 0) return 'xpweekend';
  if (dow === 1) return 'voidweek';
  if (day <= 7 && month !== 10 && month !== 12) return 'bloodmoon';
  if (day >= 8 && day <= 14 && month !== 10 && month !== 12) return 'architect';
  return null;
}

function getEventBonuses() {
  var ev = getActiveEvent();
  if (ev === 'halloween')    return { xpMult:1.25, enemyMult:1.30, label:'🎃 Halloween',      extraEnemies:HALLOWEEN_ENEMIES, seasonalCurrency:'demonCoins', seasonalCurrencyIcon:'🪙', seasonalCurrencyName:'Demon Coins' };
  if (ev === 'christmas')    return { xpMult:1.15, enemyMult:1.20, label:'🎄 Christmas',       extraEnemies:CHRISTMAS_ENEMIES, seasonalCurrency:'christmasCookies', seasonalCurrencyIcon:'🍪', seasonalCurrencyName:'Christmas Cookies' };
  if (ev === 'thanksgiving') return { xpMult:1.20, enemyMult:1.15, label:'🦃 Thanksgiving',   extraEnemies:THANKSGIVING_ENEMIES, seasonalCurrency:'harvestTokens', seasonalCurrencyIcon:'🌽', seasonalCurrencyName:'Harvest Tokens' };
  if (ev === 'cincodemayo') return { xpMult:1.50, enemyMult:1.00, label:'🌮 Cinco de Mayo', extraEnemies:[], goldMult:1.25, cincoWeapon:true };
  if (ev === 'july4')        return { xpMult:1.76, goldMult:1.76, enemyMult:1.10, label:'🎆 Fourth of July', extraEnemies:JULY4_ENEMIES, seasonalCurrency:'libertyCoins', seasonalCurrencyIcon:'🗽', seasonalCurrencyName:'Liberty Coins', isJuly4:true };
  if (ev === 'ambushday')    return { xpMult:1.50, enemyMult:1.25, label:'⚔️ Ambush Day',     extraEnemies:[], forceAmbush:true, goldMult:1.5 };
  if (ev === 'xpweekend')    return { xpMult:2.00, enemyMult:1.00, label:'⚡ XP Weekend',      extraEnemies:[] };
  if (ev === 'voidweek')     return { xpMult:1.10, enemyMult:1.20, label:'🌑 Void Week',       extraEnemies:[], goldMult:2.0, extraHp:true };
  if (ev === 'bloodmoon')    return { xpMult:1.00, enemyMult:1.25, label:'🔴 Blood Moon',      extraEnemies:[], atkBoost:0.25, takesMore:0.25 };
  if (ev === 'architect')    return { xpMult:1.20, enemyMult:1.10, label:'🏛️ Architect Week', extraEnemies:[], julioTriple:true };
  if (ev === 'brazil')       return { xpMult:1.50, goldMult:1.822, enemyMult:1.10, label:'🟢 Independencia do Brasil', extraEnemies:BRAZIL_ENEMIES, isBrazil:true };
  if (ev === 'valentines')   return { xpMult:1.25, goldMult:1.14, enemyMult:1.05, label:'💘 Valentine\'s Day', extraEnemies:VALENTINES_ENEMIES, seasonalCurrency:'chocolate', seasonalCurrencyIcon:'🍫', seasonalCurrencyName:'Chocolate', isValentines:true };
  if (ev === 'friday13')     return { xpMult:1.00, goldMult:0.75, enemyMult:1.30, label:'🔪 Friday the 13th', extraEnemies:[], isFriday13:true };
  if (ev === 'stpatricks')   return { xpMult:1.30, goldMult:1.50, enemyMult:1.15, label:'☘️ St. Patrick\'s Day', extraEnemies:STPATRICKS_ENEMIES, seasonalCurrency:'shamrocks', seasonalCurrencyIcon:'☘️', seasonalCurrencyName:'Shamrocks', isStPatricks:true };
  if (ev === 'easter')       return { xpMult:1.50, enemyMult:0.80, label:'🐰 Easter',          extraEnemies:[], isEaster:true };
  return null;
}

function getDaysUntilEvent(eventName) {
  var now = new Date();
  var dow = now.getDay();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var day = now.getDate();

  if (eventName === 'xpweekend') {
    var daysUntilSat = (6 - dow + 7) % 7 || 7;
    return daysUntilSat;
  }
  if (eventName === 'voidweek') {
    var daysUntilMon = (1 - dow + 7) % 7 || 7;
    return daysUntilMon;
  }

  var target;
  if (eventName === 'halloween')    target = new Date(year, 9, 1);
  if (eventName === 'christmas')    target = new Date(year, 11, 1);
  if (eventName === 'bloodmoon')    target = new Date(year, now.getMonth() + 1, 1);
  if (eventName === 'architect')    target = new Date(year, now.getMonth(), 8);
  if (eventName === 'thanksgiving') {
    target = new Date(year, 10, 22); // Nov 22
    if (target <= now) target = new Date(year + 1, 10, 22);
  }
  if (eventName === 'ambushday') {
    // Next occurrence on the 15th of Jan, Apr, Jul, Oct
    var ambushMonths = [1, 4, 7, 10];
    var nextAmbush = null;
    for (var i = 0; i < ambushMonths.length; i++) {
      var candidate = new Date(year, ambushMonths[i] - 1, 15);
      if (candidate > now) { nextAmbush = candidate; break; }
    }
    if (!nextAmbush) nextAmbush = new Date(year + 1, 0, 15); // Jan 15 next year
    target = nextAmbush;
  }
  if (eventName === 'july4') {
    if (month === 7 && day >= 1 && day <= 7) return 0;
    if (month < 7 || (month === 7 && day > 7)) {
      var nextYear = new Date(year + 1, 6, 4);
      return Math.ceil((nextYear - now) / 86400000);
    }
    var target2 = new Date(year, 6, 1);
    return Math.ceil((target2 - now) / 86400000);
  }
  if (eventName === 'valentines') {
    target = new Date(year, 1, 13); // February 13
    if (target <= now) target = new Date(year + 1, 1, 13);
  }
  if (eventName === 'brazil') {
    target = new Date(year, 8, 7); // September 7
    if (target <= now) target = new Date(year + 1, 8, 7);
  }
  if (eventName === 'cincodemayo') {
    target = new Date(year, 4, 5); // May 5
    if (target <= now) target = new Date(year + 1, 4, 5);
  }
  if (eventName === 'friday13') {
    // Find next Friday the 13th
    var check = new Date(now);
    for (var fi = 1; fi <= 400; fi++) {
      check.setDate(check.getDate() + 1);
      if (check.getDate() === 13 && check.getDay() === 5) {
        return Math.ceil((check - now) / (1000 * 60 * 60 * 24));
      }
    }
    return 0;
  }
  if (eventName === 'easter') {
    var nextEaster = getEasterDate(year);
    if (nextEaster <= now) nextEaster = getEasterDate(year + 1);
    return Math.max(1, Math.ceil((nextEaster - now) / (1000 * 60 * 60 * 24)));
  }
  if (eventName === 'stpatricks') {
    target = new Date(year, 2, 14); // March 14
    if (target <= now) target = new Date(year + 1, 2, 14);
  }
  if (eventName === 'birthday') {
    target = new Date(year, 2, 23); // March 23
    if (target <= now) target = new Date(year + 1, 2, 23);
  }

  if (!target) return 0;
  if (target <= now) target = new Date(year + (target.getMonth() < now.getMonth() ? 1 : 0), target.getMonth(), target.getDate());
  return Math.max(1, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
}

function getEventHoursRemaining() {
  var ev = getActiveEvent();
  var now = new Date();
  var month = now.getMonth() + 1;
  var dow = now.getDay();
  var year = now.getFullYear();
  var end = null;
  if (ev === 'halloween') {
    end = new Date(year, 10, 3, 0, 0, 0);
  } else if (ev === 'christmas') {
    end = new Date(year, 11, 31, 23, 59, 59);
  } else if (ev === 'easter') {
    var easterDate = getEasterDate(year);
    end = new Date(easterDate); end.setDate(end.getDate() + 2); end.setHours(23, 59, 59);
  } else if (ev === 'july4') {
    end = new Date(year, 6, 7, 23, 59, 59);
  } else if (ev === 'stpatricks') {
    end = new Date(year, 2, 18, 23, 59, 59);
  } else if (ev === 'birthday') {
    end = new Date(year, 2, 23, 23, 59, 59);
  } else if (ev === 'cincodemayo') {
    end = new Date(year, 4, 5, 23, 59, 59);
  } else if (ev === 'xpweekend') {
    end = new Date(now);
    var daysUntilEnd = (dow === 0) ? 0 : 1;
    end.setDate(end.getDate() + daysUntilEnd);
    end.setHours(23, 59, 59);
  } else if (ev === 'voidweek') {
    end = new Date(now);
    end.setHours(23, 59, 59);
  } else if (ev === 'thanksgiving') {
    end = new Date(year, 10, 28, 23, 59, 59);
  } else if (ev === 'ambushday') {
    end = new Date(now);
    end.setHours(23, 59, 59);
  } else if (ev === 'bloodmoon') {
    end = new Date(year, month-1, 7, 23, 59, 59);
  } else if (ev === 'architect') {
    end = new Date(year, month-1, 14, 23, 59, 59);
  }
  if (!end) return 0;
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60)));
}

function renderEventsScreen() {
  var list = document.getElementById('events-list');
  if (!list) return;
  var _evLang = DDStore.getItem('dd_lang') || 'en';
  var _isPT = _evLang === 'pt-BR';
  var active = getActiveEvent();
  var now = new Date();
  var month = now.getMonth() + 1;

  var events = [
    {
      id: 'valentines',
      title: '💘 Valentine\'s Day',
      titleClass: 'christmas',
      desc: 'February 13th through 15th. The dungeon turns romantic and dangerous. 7 exclusive enemies including The Cupid, who always drops a Love Potion when defeated. Use the Love Potion on any non-boss enemy to charm it into fighting for you for 2 turns — then it turns back on you. The final boss, The Heartbreaker, can charm you and force you to skip a turn.',
      bonuses: '+25% XP. +14% gold. Enemies 5% stronger. 7 Valentine\'s enemies. Earn 🍫 Chocolate — spend it at the 🍫 Chocolate Shop.',
      dates: 'Active: February 13 — February 15',
    },
    {
      id: 'brazil',
      title: '🇧🇷 Independência do Brasil',
      titleClass: 'halloween',
      desc: 'September 7th only. Brazil declared independence on this day in 1822. The dungeon does not know what independence means but it celebrates anyway. Eight Brazilian-inspired enemies invade including O Craque who kicks a football at you instead of attacking, A Onça the jaguar, O Jacaré the caiman, and O Rei do Carnaval — the final boss who came to celebrate and you interrupted him.',
      bonuses: '+50% XP. Gold drops multiplied by 1.822 honoring the year of independence. Enemies 10% stronger. 8 Brazilian enemies. Secret console code active today only.',
      dates: 'Active: September 7th only',
    },
    {
      id: 'birthday',
      title: '🎂 Dungeon Descent Birthday',
      titleClass: 'christmas',
      desc: 'March 23rd every year. The dungeon was born on this day. It does not celebrate. It does not have feelings. But something changes in the air.',
      bonuses: 'Special birthday music. Unique birthday themed enemies and surprises. A once-a-year event.',
      dates: 'Active: March 23rd only',
    },
    {
      id: 'easter',
      title: '🐰 Easter',
      titleClass: 'halloween',
      desc: 'A large rabbit in a bow tie has entered the dungeon. It has a basket. It is not clear what its intentions are. It can be fought, adopted as a spirit companion, or released in peace.',
      bonuses: '+50% XP from all enemies. Enemies are 20% weaker. The Easter Bunny appears in rooms. Adopt it to unlock it as a permanent spirit.',
      dates: (function(){ var e = getEasterDate(new Date().getFullYear()); return 'Active: ' + e.toLocaleDateString('en-US',{month:'long',day:'numeric'}) + ' — ' + new Date(e.getTime()+2*86400000).toLocaleDateString('en-US',{month:'long',day:'numeric'}); }()),
      titlePT: '🐰 Páscoa',
      descPT: 'Um grande coelho de gravata borboleta entrou na masmorra. Ele pode ser lutado, adotado como companheiro espírito, ou libertado em paz.',
      bonusesPT: '+50% XP de todos os inimigos. Inimigos 20% mais fracos. O Coelho da Páscoa aparece em salas.',
      datesPT: 'Ativo de 5 a 7 de abril.',
    },
    {
      id: 'xpweekend',
      title: '⚡ XP Weekend',
      titleClass: 'halloween',
      desc: 'Every Saturday and Sunday the dungeon rewards the dedicated. Double XP. No catch. The DDDI did not authorize this but also did not stop it.',
      bonuses: '2x XP from all enemies. No enemy buffs. Pure reward.',
      dates: 'Active: Every Saturday and Sunday',
    },
    {
      id: 'voidweek',
      title: '🌑 Void Week',
      titleClass: 'christmas',
      desc: 'Every Monday the dungeon is darker than usual. Enemies are harder. Gold is worth more. The void is not a punishment. The void is a test.',
      bonuses: '+10% XP. Enemies have 20% more HP. All gold drops doubled.',
      dates: 'Active: Every Monday',
    },
    {
      id: 'bloodmoon',
      title: '🔴 Blood Moon',
      titleClass: 'halloween',
      desc: 'The first week of each month. You hit harder. You also take more hits. The moon does not care about fairness.',
      bonuses: '+25% player damage dealt. +25% damage taken. High risk high reward.',
      dates: 'Active: Days 1-7 of each month',
    },
    {
      id: 'architect',
      title: '🏛️ The Architect Week',
      titleClass: 'christmas',
      desc: 'The second week of each month. Sponsored by the Department of Dungeon Descent Incorporated. The Department did not ask to be called the architect. The Department has accepted this.',
      bonuses: '+20% XP. Enemies 10% stronger. Julio appears three times more often. The DDDI is watching.',
      dates: 'Active: Days 8-14 of each month',
    },
    {
      id: 'friday13',
      title: '🔪 Friday the 13th',
      titleClass: 'halloween',
      desc: 'Whenever the 13th falls on a Friday. The main menu goes dark. The dungeon plays Halloween music. A black box appears somewhere in the dungeon. If you open it, The Unlucky One steps out — a boss that steals your gold, disables all crits, and hits harder than anything you have faced.',
      bonuses: 'Halloween music everywhere. 20% chance per floor to find the Black Box. The Unlucky One boss inside — 120 HP, steals gold each turn, your critical chance drops to zero for the fight. Gold drops reduced 25%.',
      dates: 'Active: Any Friday the 13th',
    },
    {
      id: 'stpatricks',
      title: '☘️ St. Patrick\'s Day',
      titleClass: 'christmas',
      desc: 'March 14th through 18th. The dungeon goes green. The Leprechaun has entered and it wants your gold. Eight exclusive Irish enemies roam the dungeons including The Clurichaun — a drunk boss that gets angrier every turn. The Gold Goblin carries extra gold but might run away before you can kill it. Lucky Imps dodge 25% of your attacks.',
      bonuses: '+30% XP. +50% gold drops. Enemies 15% stronger. 8 St. Patrick\'s Day enemies. The Leprechaun steals gold each turn instead of dealing damage. Earn ☘️ Shamrocks — spend them at the ☘️ Shamrock Shop.',
      dates: 'Active: March 14 — March 18',
    },
    {
      id: 'halloween',
      title: '🎃 Halloween',
      titleClass: 'halloween',
      desc: 'The dungeon twists into something seasonal. Old enemies wear new faces. New enemies wear old bones.',
      bonuses: '+25% XP from all enemies. Enemies are 30% stronger. 12 Halloween-exclusive creatures spawn. Earn 🪙 Demon Coins — spend them at the 💀 Curse Shop.',
      dates: 'Active: October 1 — November 2',
      titlePT: '🎃 Halloween',
      descPT: 'A masmorra acorda. Inimigos exclusivos de Halloween assombram cada sala. Eles são mais fortes. O ouro é mais generoso. Os mortos-vivos são muito mais numerosos.',
      bonusesPT: '+25% XP. Inimigos 30% mais fortes. 12 inimigos exclusivos.',
      datesPT: 'Ativo em outubro e 1-2 de novembro.',
    },
    {
      id: 'christmas',
      title: '🎄 Dark Christmas',
      titleClass: 'christmas',
      desc: 'Something gift-shaped and terrible has entered the dungeon. It came down the wrong chimney.',
      bonuses: '+15% XP from all enemies. Enemies are 20% stronger. Krampus and his crew join the enemy pool. Earn 🍪 Christmas Cookies — spend them at the 🎅 Santa Shop.',
      dates: 'Active: December 1 — December 31',
      titlePT: '🎄 Natal',
      descPT: 'O Papai Noel entrou nas masmorras para entregar presentes. Krampus também entrou. Eles não concordam sobre o propósito da visita.',
      bonusesPT: '+15% XP. 6 inimigos exclusivos incluindo o Krampus.',
      datesPT: 'Ativo em dezembro.',
    },
    {
      id: 'thanksgiving',
      title: '🦃 Thanksgiving',
      titleClass: 'halloween',
      desc: 'The harvest failed. Something in the cornfield is angry about it. Eight new enemies have entered the dungeon and they are hungry.',
      bonuses: '+20% XP. Enemies 15% stronger. 8 Thanksgiving enemies including The Feast Devourer boss. Earn 🌽 Harvest Tokens — spend them at the 🌽 Harvest Market.',
      dates: 'Active: November 22 — November 28',
    },
    {
      id: 'july4',
      title: '🎆 Fourth of July',
      titleClass: 'halloween',
      desc: 'July 1st through 7th. The dungeon goes patriotic. Redcoat Wraiths, Cannon Specters and Loyalist Knights invade from a forgotten war. The Sparkler buff makes every 3rd attack explode with fire. Fireworks drop from enemies and deal massive unblockable damage. The Fireworks Corner opens at your Home. The Independence Tournament begins. And somewhere, there is a secret.',
      bonuses: '+76% XP and gold honoring 1776. Redcoat enemies invade all dungeons. Firework items drop from enemies. Sparkler buff on every 3rd attack. Independence Tournament for trophies and gold. Fireworks Corner at Home for bonus XP. Earn 🗽 Liberty Coins.',
      dates: 'Active: July 1 — July 7',
    },
    {
      id: 'cincodemayo',
      title: '🌮 Cinco de Mayo',
      titleClass: 'halloween',
      desc: 'May 5th only. The dungeon celebrates. El Taco Blade appears exclusively in the Blacksmith for 24 hours. The weapon is yours to keep and upgrade forever.',
      bonuses: '+50% XP. +25% gold. 🌮 El Taco Blade available in Blacksmith — exclusive weapon only on May 5th.',
      dates: 'Active: May 5th only',
    },
    {
      id: 'ambushday',
      title: '⚔️ Ambush Day',
      titleClass: 'christmas',
      desc: 'Four times a year the dungeon stops sending one enemy at a time. It sends all of them. Every battle is a multi-enemy ambush for a full 24 hours.',
      bonuses: '+50% XP. +50% gold. ALL battles are ambushes — 2 to 3 enemies per fight. No single combat. Good luck.',
      dates: 'Active: January 15, April 15, July 15, October 15',
    },
  ];

  list.innerHTML = '';
  events.forEach(function(ev) {
    var isActive = active === ev.id;
    var daysLeft = 0;
    var daysUntil = getDaysUntilEvent(ev.id);

    if (isActive && ev.id === 'halloween') daysLeft = new Date(now.getFullYear(), 10, 2) - now;
    if (isActive && ev.id === 'christmas') daysLeft = new Date(now.getFullYear(), 11, 31) - now;
    if (isActive && ev.id === 'easter') { var eEnd = getEasterDate(now.getFullYear()); eEnd.setDate(eEnd.getDate() + 2); daysLeft = eEnd - now; }
    if (isActive && ev.id === 'thanksgiving') daysLeft = new Date(now.getFullYear(), 10, 28, 23,59,59) - now;
    if (isActive && ev.id === 'ambushday') daysLeft = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59) - now;
    if (isActive && ev.id === 'cincodemayo') daysLeft = new Date(now.getFullYear(), 4, 5, 23,59,59) - now;
    if (isActive && ev.id === 'bloodmoon') daysLeft = new Date(now.getFullYear(), now.getMonth(), 7, 23,59,59) - now;
    if (isActive && ev.id === 'architect') daysLeft = new Date(now.getFullYear(), now.getMonth(), 14, 23,59,59) - now;
    if (isActive && ev.id === 'stpatricks') daysLeft = new Date(now.getFullYear(), 2, 18, 23,59,59) - now;
    if (isActive && ev.id === 'friday13') daysLeft = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23,59,59) - now;
    if (isActive && ev.id === 'birthday') daysLeft = new Date(now.getFullYear(), 2, 23, 23,59,59) - now;
    if (isActive && ev.id === 'brazil') daysLeft = new Date(now.getFullYear(), 8, 7, 23,59,59) - now;
    if (isActive && ev.id === 'valentines') daysLeft = new Date(now.getFullYear(), 1, 15, 23,59,59) - now;
    daysLeft = isActive ? Math.max(0, Math.ceil(daysLeft / (1000 * 60 * 60 * 24))) : 0;

    var card = document.createElement('div');
    card.className = 'event-card ' + (isActive ? 'active' : 'upcoming');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label',
      ev.title + '. ' + (isActive ? (_isPT ? 'ATIVO AGORA. ' : 'ACTIVE NOW. ') : (_isPT ? 'Em ' + daysUntil + ' dias. ' : 'Upcoming in ' + daysUntil + ' days. ')) +
      ev.desc + ' Bonuses: ' + ev.bonuses + ' ' + ev.dates);
    card.innerHTML =
      (isActive ? '<div class="event-card-title active-label">' + (_isPT ? '✦ ATIVO AGORA' : '✦ ACTIVE NOW') + '</div>' : '') +
      '<div class="event-card-title ' + ev.titleClass + '">' + (_isPT && ev.titlePT ? ev.titlePT : ev.title) + '</div>' +
      '<div class="event-card-desc">' + (_isPT && ev.descPT ? ev.descPT : ev.desc) + '</div>' +
      '<div class="event-card-bonus">' + (_isPT && ev.bonusesPT ? ev.bonusesPT : ev.bonuses) + '</div>' +
      '<div class="event-card-dates">' + (_isPT && ev.datesPT ? ev.datesPT : ev.dates) + '</div>' +
      (isActive
        ? '<div class="event-card-days">✦ ' + daysLeft + (_isPT ? ' dias restantes' : ' days remaining') + '</div>'
        : '<div class="event-card-days">' + (_isPT ? 'Próxima ocorrência em ' + daysUntil + ' dias' : 'Next occurrence in ' + daysUntil + ' days') + '</div>');
    list.appendChild(card);
  });
}


//═════════════════
// DUNGEON INTRO SEQUENCE
//═════════════════
var DUNGEON_INTROS = {
  'Crypt of Malachar':      { eyebrow:'Entering the Crypt',    text:'Malachar has been waiting. He has been waiting for a very long time. He is patient in the way that only things which cannot die are patient.' },
  'The Ashbound Wastes':    { eyebrow:'Entering the Wastes',   text:'The fire remembers everyone who has come here. It has a very good memory. It has had a long time to practice.' },
  'Frosthold Abyss':        { eyebrow:'Entering the Abyss',    text:'The cold is not a temperature. It is a presence. It has noticed you. It is deciding what to do about that.' },
  'The Sunken Archives':    { eyebrow:'Entering the Archives', text:'The water is perfectly still. The candles are still lit. Something has been cataloguing. It has found a new entry.' },
  'The Hollow':             { eyebrow:'Entering the Hollow',   text:'The house knows you are here. It has always known. It has been waiting for you specifically. It does not explain how it knew.' },
  'The Whispering Forest':  { eyebrow:'Entering the Forest',   text:'The trees do not move in the wind here. There is no wind. The sound you hear is not the wind. The forest would like you to know that.' },
  'The Infernal Descent':   { eyebrow:'Entering the Infernal', text:'Everything here has already burned. It burns still. The things that live in the fire have stopped noticing the fire. They will notice you.' },
  'The Abyssal Deep':       { eyebrow:'Descending into the Deep', text:'The deepest dungeon. Every boss here has four phases and at least 600 HP. It hits harder than anything you have faced. Stock every potion. Use every skill. Cast every spell. You have been warned.' },
  'The Shadow World':       { eyebrow:'Entering the Shadow World', text:'It has existed for 3000 years beneath a cursed forest. It does not obey your rules. The Shapeshifter waits at the end — wearing your face, using your skills, knowing your every move. Nothing that enters here leaves unchanged.' },
};
var _dungeonIntroShown = {};

function showDungeonIntro(dungeon, callback) {
  if (_dungeonIntroShown[dungeon]) { callback(); return; }
  var intro = DUNGEON_INTROS[dungeon];
  if (!intro) { callback(); return; }
  _dungeonIntroShown[dungeon] = true;
  var overlay = document.getElementById('dungeon-intro-overlay');
  if (!overlay) { callback(); return; }
  document.getElementById('di-eyebrow').textContent = intro.eyebrow;
  document.getElementById('di-name').textContent = dungeon;
  document.getElementById('di-text').textContent = intro.text;
  overlay.classList.add('open');
  say(intro.eyebrow + '. ' + dungeon + '. ' + intro.text);
  setTimeout(function() { overlay.classList.remove('open'); callback(); }, 4000);
}

//═════════════════
// BESTIARY FILTER
//═════════════════
var _bestiaryFilter = 'all';

var _bestiarySearchTerm = '';

function searchBestiary(term) {
  _bestiarySearchTerm = term.trim().toLowerCase();
  _bestiaryVisibleCount = _bestiaryPageSize;
  renderBestiary();
  if (_bestiarySearchTerm) {
    say('Searching for ' + term + '.');
  }
}

function clearBestiarySearch() {
  _bestiarySearchTerm = '';
  _bestiaryVisibleCount = _bestiaryPageSize;
  var input = document.getElementById('be-search');
  if (input) input.value = '';
  renderBestiary();
  say('Search cleared.');
}

function filterBestiary(filter) {
  _bestiaryFilter = filter;
  // Clear search when switching tabs
  _bestiarySearchTerm = '';
  _bestiaryVisibleCount = _bestiaryPageSize;
  var input = document.getElementById('be-search');
  if (input) input.value = '';
  ['all','crypt','ash','frost','sunken','hollow','nightmare','elite','whisper','spire','infernal','abyssal','shadow','special','type-undead','type-beast','type-demon','type-elemental','type-spirit'].forEach(function(f) {
    var tab = document.getElementById('be-filter-' + f);
    if (tab) {
      tab.classList.toggle('active', f === filter);
      tab.setAttribute('aria-selected', f === filter ? 'true' : 'false');
    }
  });
  // Hide community section if switching away
  document.getElementById('bestiary-grid').style.display = '';
  renderBestiary();
  var labels = {all:'All enemies',crypt:'Crypt',ash:'Ashbound',frost:'Frosthold',sunken:'Archives',hollow:'Hollow',nightmare:'Nightmare',elite:'Elite',whisper:'Whispering Forest',spire:'The Spire',infernal:'The Infernal',abyssal:'The Abyssal Deep',shadow:'The Shadow World',special:'Special enemies','type-undead':'Undead enemies','type-beast':'Beast enemies','type-demon':'Demon enemies','type-elemental':'Elemental enemies','type-spirit':'Spirit enemies'};
  say('Showing ' + (labels[filter]||filter) + ' enemies.');
}


//═════════════════
// HIGH SCORE SYSTEM
//═════════════════
var SCORE_RANKS = [
  { min:0,      label:'INITIATE',        color:'#888' },
  { min:500,    label:'ADVENTURER',      color:'#a0b0c0' },
  { min:2000,   label:'VETERAN',         color:'#70a0d0' },
  { min:5000,   label:'CHAMPION',        color:'#c0a030' },
  { min:10000,  label:'LEGEND',          color:'#c9a227' },
  { min:25000,  label:'DUNGEON MASTER',  color:'#e0c060' },
  { min:50000,  label:'THE UNKILLABLE',  color:'#f0d080' },
  { min:100000, label:'DDDI CERTIFIED',  color:'#fff8dc' },
];

function getScoreData() {
  return _jsonParseSafe(DDStore.getItem('dd_score'), '{"total":0,"breakdown":{}}');
}
function saveScoreData(s) { DDStore.setItem('dd_score', JSON.stringify(s)); }

function addScore(category, points, label) {
  var s = getScoreData();
  s.total = (s.total || 0) + points;
  if (!s.breakdown) s.breakdown = {};
  s.breakdown[category] = (s.breakdown[category] || 0) + points;
  saveScoreData(s);
}

function getScoreRank(total) {
  var rank = SCORE_RANKS[0];
  for (var i = 0; i < SCORE_RANKS.length; i++) {
    if (total >= SCORE_RANKS[i].min) rank = SCORE_RANKS[i];
  }
  return rank;
}

function renderHighScore() {
  try {
  var s = getScoreData();
  var total = s.total || 0;
  var rank = getScoreRank(total);
  var totalEl = document.getElementById('hs-total');
  var rankEl = document.getElementById('hs-rank');
  if (totalEl) totalEl.textContent = total.toLocaleString();
  if (rankEl) { rankEl.textContent = 'RANK: ' + rank.label; rankEl.style.color = rank.color; }
  // Show actual global gold balance
  var goldBalEl = document.getElementById('hs-gold-balance');
  if (goldBalEl) goldBalEl.textContent = '💰 Global Gold: ' + (typeof getGlobalGold==='function'?getGlobalGold().toLocaleString():'0') + 'g  |  🏆 Trophies: ' + (typeof getTrophies==='function'?getTrophies():'0');

  var cats = document.getElementById('hs-categories');
  if (!cats) return;
  var bd = s.breakdown || {};
  var catDefs = [
    { key:'enemy_kills',      label:'Enemy Kills',          icon:'⚔️' },
    { key:'boss_kills',       label:'Boss Kills',            icon:'👑' },
    { key:'elite_kills',      label:'Elite Kills',           icon:'★' },
    { key:'dungeon_clears',   label:'Dungeon Completions',   icon:'🏰' },
    { key:'achievements',     label:'Achievements Earned',   icon:'✨' },
    { key:'daily_quests',     label:'Daily Quests Completed',icon:'☀️' },
    { key:'gold_earned',      label:'Gold Collected',        icon:'🪙' },
    { key:'floors_reached',   label:'Floors Explored',       icon:'🗺️' },
    { key:'boss_rush',        label:'Boss Rush Clears',      icon:'⚡' },
  ];
  cats.innerHTML = '';
  var shown = 0;
  catDefs.forEach(function(cat) {
    var pts = bd[cat.key] || 0;
    if (pts === 0) return;
    shown++;
    var row = document.createElement('div');
    row.className = 'score-category';
    row.setAttribute('tabindex','0');
    row.setAttribute('aria-label', cat.label + ': ' + pts.toLocaleString() + ' points');
    row.innerHTML = '<span class="score-cat-name">' + cat.icon + ' ' + cat.label + '</span>' +
      '<span class="score-cat-pts">' + pts.toLocaleString() + ' pts</span>';
    cats.appendChild(row);
  });
  if (shown === 0) {
    cats.innerHTML = '<p style="font-size:0.82rem;color:var(--text-dim);font-style:italic;text-align:center;padding:20px;">Play the game to earn score points. Every action counts.</p>';
  }
  say('High Score. Total: ' + total.toLocaleString() + ' points. Rank: ' + rank.label + '. ' + shown + ' score categories active.');
  } catch(e) { console.error('renderHighScore error:', e); }
}

// Award score at key moments
function awardScore(category, pts) {
  addScore(category, pts);
}

//═════════════════
// ACHIEVEMENT POPUP
//═════════════════
var _achPopupTimer = null;

var _achPopupQueue = [];
var _achPopupShowing = false;

function showAchievementPopup(ach, gold, trophies) {
  ach._popupGold = gold || ach.gold || 50;
  ach._popupTrophies = trophies || ach.trophies || 1;
  // Cap queue at 3 — dont stack up 20 popups
  if (_achPopupQueue.length < 3) _achPopupQueue.push(ach);
  if (!_achPopupShowing) processAchPopupQueue();
}

function processAchPopupQueue() {
  if (_achPopupQueue.length === 0) { _achPopupShowing = false; return; }
  _achPopupShowing = true;
  var ach = _achPopupQueue.shift();
  var popup = document.getElementById('ach-popup');
  if (!popup) { _achPopupShowing = false; return; }

  document.getElementById('ach-popup-icon').textContent = ach.icon || '🏆';
  document.getElementById('ach-popup-name').textContent = ach.name;
  document.getElementById('ach-popup-desc').textContent = (ach.desc || '') + ' · +' + (ach._popupGold||50) + 'g · +' + (ach._popupTrophies||1) + ' 🏆';
  var tier = getAchievementTier(ach);
  var tierEl = document.getElementById('ach-popup-tier');
  if (tierEl) {
    tierEl.textContent = (ACH_TIER_LABELS[tier] || 'Normal').toUpperCase();
    tierEl.style.color = ACH_TIER_COLORS[tier] || '#999';
  }

  var notifOn = !ACCESS.notificationsOff;
  if (notifOn) {
    popup.classList.add('show');
    sfx('sfx-unlock');
  }

  setTimeout(function() {
    var ann = document.getElementById('ach-announce');
    var tierPrefix = (ACH_TIER_LABELS[tier] || 'Normal') + ' achievement unlocked. ';
    if (ann) {
      ann.textContent = '';
      setTimeout(function() {
        ann.textContent = tierPrefix + ach.name + (ach.desc ? '. ' + ach.desc : '') + '.';
      }, 50);
    }
    say(tierPrefix + ach.name + (ach.desc ? '. ' + ach.desc : '') + '.');
  }, 100);

  // Auto dismiss after 4 seconds — shorter than before
  if (_achPopupTimer) clearTimeout(_achPopupTimer);
  _achPopupTimer = setTimeout(function() {
    popup.classList.remove('show');
    _achPopupShowing = false;
    // Clear content so screen reader stops reading it
    setTimeout(function() {
      var nameEl = document.getElementById('ach-popup-name');
      var descEl = document.getElementById('ach-popup-desc');
      var iconEl = document.getElementById('ach-popup-icon');
      if (nameEl) nameEl.textContent = '';
      if (descEl) descEl.textContent = '';
      if (iconEl) iconEl.textContent = '';
      // Also clear the announce region
      var ann = document.getElementById('ach-announce');
      if (ann) ann.textContent = '';
      processAchPopupQueue();
    }, 300);
  }, 4000);
}

//═════════════════
// BOSS RUSH LEADERBOARD
//═════════════════
function getBossRushScores() {
  return _jsonParseSafe(DDStore.getItem('dd_br_scores'), '[]');
}
function saveBossRushScore(entry) {
  var scores = getBossRushScores();
  scores.push(entry);
  // Keep top 10 by bosses defeated, then time
  scores.sort(function(a,b){ return b.bosses - a.bosses || a.time - b.time; });
  scores = scores.slice(0, 10);
  DDStore.setItem('dd_br_scores', JSON.stringify(scores));
}
function renderBossRushLeaderboard() {
  var scores = getBossRushScores();
  if (scores.length === 0) return '';
  var html = '<div style="margin-top:16px;font-family:Cinzel,serif;font-size:0.72rem;color:var(--gold-dim);letter-spacing:0.2em;margin-bottom:8px;">PERSONAL BEST RUNS</div>';
  scores.slice(0,5).forEach(function(s, i) {
    html += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-dim);font-size:0.75rem;">' +
      '<span style="color:var(--gold-dim);">' + (i+1) + '. ' + (s.cls||'Unknown') + '</span>' +
      '<span>' + s.bosses + '/9 bosses</span>' +
      '<span style="color:var(--text-dim);">' + (s.timeStr||'--') + '</span>' +
    '</div>';
  });
  return html;
}

//═════════════════
// CHARACTER IMPORT / EXPORT
//═════════════════
function showExportPicker() {
  var existing = document.getElementById('export-picker-overlay');
  if (existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'export-picker-overlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;';
  var header = document.createElement('div');
  header.style.cssText = 'font-family:Cinzel,serif;font-size:0.8rem;color:var(--gold-dim);letter-spacing:0.2em;margin-bottom:16px;text-align:center;';
  header.textContent = 'CHOOSE CHARACTER TO EXPORT';
  ov.appendChild(header);
  if (CHARS.length === 0) {
    var none = document.createElement('p');
    none.style.cssText = 'color:var(--text-dim);font-style:italic;';
    none.textContent = 'No characters to export.';
    ov.appendChild(none);
  } else {
    CHARS.forEach(function(ch, i) {
      var btn = document.createElement('button');
      btn.className = 'menu-btn';
      btn.style.cssText = 'width:100%;max-width:400px;margin-bottom:8px;text-align:left;font-size:0.78rem;';
      btn.textContent = ch.name + ' — ' + (ch.race||'') + ' ' + ch.cls + ' · ' + ch.dungeon;
      btn.setAttribute('aria-label', 'Export ' + ch.name);
      btn.onclick = (function(charIdx){
        return function(){
          var picker = document.getElementById('export-picker-overlay');
          if (picker) picker.remove();
          exportCharacter(charIdx);
        };
      })(i);
      ov.appendChild(btn);
    });
  }
  var btnCancel = document.createElement('button');
  btnCancel.className = 'btn-ghost';
  btnCancel.style.cssText = 'margin-top:14px;';
  btnCancel.textContent = 'Cancel';
  btnCancel.setAttribute('aria-label', 'Cancel export');
  btnCancel.onclick = function(){ ov.remove(); };
  ov.appendChild(btnCancel);
  document.body.appendChild(ov);
  setTimeout(function(){
    var first = ov.querySelector('button');
    if (first) first.focus();
    say('Export character. ' + CHARS.length + ' character' + (CHARS.length===1?'':'s') + ' available. Choose one.');
  }, 100);
}

function exportCharacter(idx) {
  var ch = CHARS[idx];
  if (!ch) return;
  var data = JSON.stringify(ch);
  var code = btoa(unescape(encodeURIComponent(data)));
  // Show in a copyable overlay
  var existing = document.getElementById('export-overlay');
  if (existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'export-overlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.92);z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;';
  ov.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.8rem;color:var(--gold-dim);letter-spacing:0.2em;margin-bottom:12px;">CHARACTER EXPORT CODE</div>' +
    '<div style="font-family:Cinzel Decorative,cursive;font-size:1rem;color:var(--gold);margin-bottom:8px;">' + ch.name + '</div>' +
    '<textarea id="export-code-ta" style="width:100%;max-width:500px;height:80px;background:#111;color:#ccc;border:1px solid var(--border-dim);padding:10px;font-size:0.7rem;font-family:monospace;resize:none;" readonly aria-label="Export code for ' + ch.name + '">' + code + '</textarea>' +
    '<p style="font-size:0.75rem;color:var(--text-dim);font-style:italic;margin:12px 0;">Copy this code and paste it on another device to import this character.</p>' +
    '<button class="btn-ghost" onclick="closeExportOverlay()" aria-label="Close export overlay" style="margin-top:8px;">Close</button>';
  document.body.appendChild(ov);
  setTimeout(function() {
    var ta = document.getElementById('export-code-ta');
    if (ta) { ta.focus(); ta.select(); }
    say('Export code for ' + ch.name + '. The code is shown. Copy it and use it on another device.');
  }, 100);
}

function viewCharStats(idx) {
  var ch = CHARS[idx];
  if (!ch) return;
  _charIdx = idx;
  var maxHp = HP_MAP[ch.cls] || 100;
  var atkRange = ATK_MAP[ch.cls] || [6,12];
  var defVal = DEF_MAP[ch.cls] || 0;
  var mid = ch.midRunSave || {};
  // Always overwrite DS with this character so showStats displays correctly
  DS = {
    name: ch.name, cls: ch.cls, race: ch.race, prof: ch.prof,
    dungeon: ch.dungeon, diff: ch.difficulty,
    floor: mid.floor || ch.floor || 0,
    hp: mid.hp || maxHp,
    maxHp: mid.maxHp || maxHp,
    sp: mid.sp || 20,
    maxSp: mid.maxSp || 20,
    gold: mid.gold || 0,
    level: mid.level || 1,
    xp: mid.xp || 0,
    lives: 1, maxLives: 1,
    kills: mid.kills || 0,
    atk: atkRange,
    def: defVal,
    atkBonus: mid.atkBonus || 0,
    defBonus: mid.defBonus || 0,
    inventory: mid.inventory || [],
    unlockedSkills: mid.unlockedSkills || [],
    skillPool: mid.skillPool || [],
    activeSpirit: ch.lastSpirit ? (getSpiritById(ch.lastSpirit)||null) : null,
    ngPlus: ch.ngPlus || false,
    usedPotion: false,
    dailyChallenge: null,
    inCombat: false,
    bestDmgThisRun: 0,
  };
  showStats();
}

function closeExportOverlay() {
  var ov = document.getElementById('export-overlay');
  if (ov) ov.remove();
}

function closeImportOverlay() {
  var ov = document.getElementById('import-overlay');
  if (ov) ov.remove();
}

function importCharacter() {
  var existing = document.getElementById('import-overlay');
  if (existing) existing.remove();
  var ov = document.createElement('div');
  ov.id = 'import-overlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.95);z-index:9000;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:30px;';
  var header = document.createElement('div');
  header.style.cssText = 'font-family:Cinzel,serif;font-size:0.8rem;color:var(--gold-dim);letter-spacing:0.2em;margin-bottom:12px;';
  header.textContent = 'IMPORT CHARACTER';
  var info = document.createElement('p');
  info.style.cssText = 'font-size:0.82rem;color:var(--text-secondary);font-style:italic;margin-bottom:16px;text-align:center;';
  info.textContent = 'Paste the export code from another device below.';
  var ta = document.createElement('textarea');
  ta.id = 'import-code-ta';
  ta.style.cssText = 'width:100%;max-width:500px;height:80px;background:#111;color:#ccc;border:1px solid var(--border-dim);padding:10px;font-size:0.7rem;font-family:monospace;resize:none;';
  ta.placeholder = 'Paste code here...';
  ta.setAttribute('aria-label', 'Paste your character import code here');
  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;gap:10px;margin-top:14px;';
  var btnImport = document.createElement('button');
  btnImport.className = 'menu-btn primary';
  btnImport.textContent = 'Import';
  btnImport.setAttribute('aria-label', 'Confirm import');
  btnImport.onclick = confirmImport;
  var btnCancel = document.createElement('button');
  btnCancel.className = 'btn-ghost';
  btnCancel.textContent = 'Cancel';
  btnCancel.setAttribute('aria-label', 'Cancel import');
  btnCancel.onclick = closeImportOverlay;
  btnRow.appendChild(btnImport);
  btnRow.appendChild(btnCancel);
  ov.appendChild(header);
  ov.appendChild(info);
  ov.appendChild(ta);
  ov.appendChild(btnRow);
  document.body.appendChild(ov);
  setTimeout(function() { ta.focus(); say('Import character. Paste your export code into the text area then press Import.'); }, 100);
}

function confirmImport() {
  var ta = document.getElementById('import-code-ta');
  if (!ta) return;
  var code = ta.value.trim();
  if (!code) { say('No code entered. Please paste an export code.'); return; }
  try {
    var data = JSON.parse(decodeURIComponent(escape(atob(code))));
    if (!data.name || !data.cls) { say('Invalid code. Could not import character.'); return; }
    if (CHARS.length >= 5) { say('Character slots full. Delete a character first.'); return; }
    // An export code saved from an older version of the game can be
    // missing fields that didn't exist yet back then (race/prof/dungeon/
    // difficulty). Backfill instead of importing a character with holes
    // in it — the character list has no fallback for these and would
    // literally print/speak the word "undefined" for a missing one.
    if (!data.race) data.race = 'Human';
    if (!data.prof) data.prof = 'Blacksmith';
    if (!data.dungeon) data.dungeon = 'Crypt of Malachar';
    if (!data.difficulty) data.difficulty = 'Wanderer';
    data.floor = 0; data.completed = false; data.midRunSave = null;
    CHARS.push(data);
    saveChars();
    var ov = document.getElementById('import-overlay');
    if (ov) ov.remove();
    renderCharList();
    say('Character imported. ' + data.name + ' the ' + (data.race||'') + ' ' + data.cls + ' is ready to play.');
  } catch(e) {
    say('Invalid code. Could not import. Make sure you copied the full code.');
  }
}


//═════════════════
// EASTER BUNNY ENCOUNTER
//═════════════════
function triggerEasterBunny() {
  DS.inCombat = false;
  showDgPanels(false, false, false);
  setEvent('good',
    'A rabbit sits in the middle of the room. It is larger than a rabbit should be. ' +
    'It is wearing a small bow tie. It looks at you with complete calm. ' +
    'It has a basket. The basket is full of eggs. You are not sure what is happening.'
  );
  say('The Easter Bunny. A large rabbit in a bow tie is in the room. Three options: fight it for XP, adopt it as your spirit companion, or let it go in peace.');

  var alreadyOwns = CHARS[_charIdx] && CHARS[_charIdx].earnedSpirits &&
    CHARS[_charIdx].earnedSpirits.indexOf('easter-bunny') !== -1;

  var adoptBtn = alreadyOwns
    ? '<button class="dg-act-btn" disabled aria-label="You already have the Easter Bunny spirit" style="opacity:0.5;">🐰 Already Adopted</button>'
    : '<button class="dg-act-btn" style="border-color:var(--gold-dim);color:var(--gold);" onclick="easterBunnyChoice(\'adopt\')" aria-label="Adopt the Easter Bunny as your spirit companion">🐰 Adopt It</button>';

  document.getElementById('dg-event').style.display = '';
  document.getElementById('dg-event').innerHTML +=
    '<div style="margin-top:12px;" id="easter-bunny-btns">' +
      '<button class="dg-act-btn" onclick="easterBunnyChoice(\'fight\')" aria-label="Fight the Easter Bunny for XP">⚔ Fight It</button>' +
      adoptBtn +
      '<button class="dg-act-btn" onclick="easterBunnyChoice(\'ignore\')" aria-label="Let the Easter Bunny go in peace">🕊 Let It Go</button>' +
    '</div>';
}

function easterBunnyChoice(choice) {
  var btns = document.getElementById('easter-bunny-btns');
  if (btns) btns.remove();

  if (choice === 'fight') {
    // Normal combat — Easter Bunny is weak
    DS.enemy = {
      name: 'The Easter Bunny', icon: '🐰',
      hp: 20, maxHp: 20, atk: [2, 5], gold: [10, 20],
      isEasterBunny: true
    };
    DS.inCombat = true; DS.defending = false;
    playTrack(battleTrack());
    showDgPanels(false, true, false);
    document.getElementById('dg-enemy-icon').textContent = '🐰';
    document.getElementById('dg-enemy-name').textContent = t('The Easter Bunny');
    updateEnemyBar(); setCombatBtns(true); updateSkillButtons();
    addLog('The Easter Bunny adjusts its bow tie. It does not look afraid. It should look afraid.');
    say('Fighting the Easter Bunny. 20 HP. It hits for 2 to 5 damage. It is not very strong but it has dignity.');
    setTimeout(function(){ document.getElementById('cbtn-attack').focus(); }, 100);

  } else if (choice === 'adopt') {
    // Add Easter Bunny to earned spirits
    if (_charIdx !== null && CHARS[_charIdx]) {
      if (!CHARS[_charIdx].earnedSpirits) CHARS[_charIdx].earnedSpirits = [];
      if (CHARS[_charIdx].earnedSpirits.indexOf('easter-bunny') === -1) {
        CHARS[_charIdx].earnedSpirits.push('easter-bunny');
        saveChars();
      }
    }
    // Set as active spirit this run
    var bunny = getSpiritById('easter-bunny');
    if (bunny) { DS.activeSpirit = bunny; updateSpiritDisplay(); }
    sfx('sfx-unlock');
    setEvent('good',
      'The Easter Bunny looks at you for a long moment. Then it hops over. ' +
      'It sits beside you. It is your spirit companion now. ' +
      'It brought the basket. You are not sure what to do with the eggs. Neither is it.'
    );
    say('You adopted the Easter Bunny! It is now your spirit companion. The Easter Bunny is permanently unlocked for all future runs.');
    setTimeout(function() { enterRoom(); }, 3000);

  } else {
    // Let it go
    setEvent('good', 'You step aside. The Easter Bunny hops past you without looking back. It leaves one egg behind. You are not sure if this is a gift or a warning.');
    var goldGain = 15;
    DS.gold += (isNaN(goldGain) ? 0 : goldGain); updateTopBar();
    say('You let the Easter Bunny go. It left an egg worth ' + goldGain + ' gold. How thoughtful.');
    setTimeout(function() { enterRoom(); }, 2500);
  }
}


//═════════════════
// RUN SUMMARY SCREEN
//═════════════════

var CLOSING_LINES = {
  'Crypt of Malachar': {
    Warrior:    'You held the shield. The dead fell behind it. Malachar did not expect a wall.',
    Monk:       'You moved like water through the Crypt. The dead could not touch what they could not follow.',
    Assassin:   'The Crypt never saw you coming. Neither did Malachar.',
    Paladin:    'The divine light you carried was the first light the Crypt had seen in a thousand years.',
    Naturalist: 'Life followed you through the Crypt. The dead were not prepared for that.',
    Sorcerer:   'The Crypt is made of old magic. Yours was newer. Yours was louder.',
    Necromancer:'You spoke the language of this place fluently. Malachar did not appreciate the accent.',
    Berserker:  'The Crypt tried to break you. You broke it first.',
    Bard:       'You sang in the Crypt. The dead listened. Then they stopped moving.',
    Alchemist:  'You turned the Crypt\'s own rot against it. Elegant, in a way.',
    BloodKnight:'Blood answered blood in the Crypt. Yours was the louder conversation.',
    Druid:      'You brought something living into a place that forgot what living meant.',
    Wizard:     'The Crypt runs on death magic that is centuries old. Your arcane study found the seams. You pulled them apart.',
  },
  'The Ashbound Wastes': {
    Warrior:    'The Wastes burned. You did not. That is the whole story.',
    Monk:       'You found stillness in the Wastes. The fire could not reach what was already calm.',
    Assassin:   'The Wastes saw everything. Somehow you still found shadows.',
    Paladin:    'Your faith burned hotter than the Wastes. The Pyre could not compete.',
    Naturalist: 'You found life in a place that incinerated it. That is not supposed to be possible.',
    Sorcerer:   'You met fire with fire. Yours was better fire.',
    Necromancer:'Even the ash listened to you. The dead here were just waiting for direction.',
    Berserker:  'The Wastes tried to make you rage. You were already raging. You won.',
    Bard:       'You sang in the fire. The Wastes had never heard music before. They did not survive it.',
    Alchemist:  'You turned the fire into something useful. That is disgusting and impressive.',
    BloodKnight:'You bled in the Wastes. The Wastes bled back. You had more to give.',
    Druid:      'After you left, something small and green grew in the ash. That has never happened before.',
    Wizard:     'The fire here is ancient and specific. You studied it. You named it. Then you ended it.',
  },
  'Frosthold Abyss': {
    Warrior:    'The cold tried to stop you. You stopped it instead.',
    Monk:       'You found warmth inside yourself in the coldest place in the world.',
    Assassin:   'The Abyss watches everything. You moved anyway. Fast enough.',
    Paladin:    'The cold cannot touch what the divine has already claimed.',
    Naturalist: 'The Abyss had never seen warmth before you arrived. It has now.',
    Sorcerer:   'The Abyss is old cold magic. You brought new hot magic. The math worked out.',
    Necromancer:'The frozen dead rose at your command. They were glad to move again.',
    Berserker:  'You were angrier than the cold. The cold backed down.',
    Bard:       'The Abyss has been silent forever. Not anymore.',
    Alchemist:  'You melted the Abyss with science. That is technically what happened.',
    BloodKnight:'Your blood ran warm in the Abyss. It is still warm. You kept it.',
    Druid:      'Spring is coming to the Frosthold Abyss. You started it.',
    Wizard:     'The Abyss is the purest cold you have ever studied. Your notes filled sixteen pages. Then you destroyed it.',
  },
  'The Sunken Archives': {
    Warrior:    'The Archives recorded everything. Including you. The entry is complimentary.',
    Monk:       'You read the Archives without disturbing a single page. The librarians would approve.',
    Assassin:   'The Archives catalogued millions of deaths. They were not prepared to catalogue their own.',
    Paladin:    'The divine light you carried dried the Archives out. First time in centuries.',
    Naturalist: 'You found things living in the Archives that the scholars missed. They were important.',
    Sorcerer:   'The Archives contained spells older than language. You improved on several.',
    Necromancer:'The drowned scholars rose to help you. Professional courtesy.',
    Berserker:  'You went through the Archives like water. Fast water. Loud water.',
    Bard:       'You are in the Archives now. Chapter twelve. The title is flattering.',
    Alchemist:  'You extracted something from the Archives that was not supposed to be extractable.',
    BloodKnight:'The Archives recorded your bloodline. It is impressive. Do not ask how they know.',
    Druid:      'The waterlogged plants in the Archives have started growing again. You did that.',
    Wizard:     'The Archives held more arcane knowledge than any library above the water. You memorized most of it. You destroyed the rest.',
  },
  'The Hollow': {
    Warrior:    'The Hollow tried to break you with silence. You were louder.',
    Monk:       'The Hollow is full of echoes. You left only one. Your footsteps leaving.',
    Assassin:   'The house watched. You were faster than what it was watching for.',
    Paladin:    'The Hollow had not felt holy light in a very long time. It remembered. It feared.',
    Naturalist: 'Something alive survived the Hollow. You. And one or two things that followed you out.',
    Sorcerer:   'The Hollow runs on old grief. Your magic ran on something newer. It won.',
    Necromancer:'The dead in the Hollow were not expecting a colleague.',
    Berserker:  'The Hollow is built on fear. You were not afraid. That was the only reason you survived.',
    Bard:       'You sang in the Hollow. The house went quiet. You kept singing. It stayed quiet.',
    Alchemist:  'You analyzed the Hollow. Filed a report. Left. Remarkable professional distance.',
    BloodKnight:'The Hollow feeds on what you carry. You carry more than it could consume.',
    Druid:      'The Hollow had forgotten what growing things felt like. You reminded it.',
    Wizard:     'The Hollow is grief made architecture. You studied it, named every room, and walked out the front door.',
  },
  'The Whispering Forest': {
    Warrior:    'The Forest whispered to you the whole way through. You did not listen. That is why you won.',
    Monk:       'The Forest tried to root you in place. You moved anyway. Still and moving at once.',
    Assassin:   'The Forest saw everything. You moved through its blind spots. There were exactly enough of them.',
    Paladin:    'The divine light you carried kept the dark from the trees. The trees were grateful. So was everything else.',
    Naturalist: 'The Forest recognized you. One living thing among many. It let you pass. Eventually.',
    Sorcerer:   'The Forest is old magic and older grief. Your magic was newer. Louder. Less patient.',
    Necromancer:'The dead in the Forest had been waiting for orders. You gave them some.',
    Berserker:  'The Forest tried to make you afraid of the dark. You set the dark on fire. Metaphorically.',
    Bard:       'You sang back at the whispers. They went quiet. You kept singing.',
    Alchemist:  'You identified thirty-seven new ingredients in the Forest. Professionally speaking, a very good run.',
    BloodKnight:'The Forest bleeds when you cut it. You made it bleed first.',
    Druid:      'The Forest knew you. It did not expect you to know it back.',
    Wizard:     'The Forest runs on whispered magic older than written language. You translated most of it. Then you ended it.',
  },
  'The Infernal Descent': {
    Warrior:    'The Descent threw everything at you. You hit everything back. That is the whole story.',
    Monk:       'The void tried to fill you with noise. You were already empty. In the useful way.',
    Assassin:   'The Descent watches for what moves. You moved between the watching. Fast enough.',
    Paladin:    'The divine light held. All the way down. Even here.',
    Naturalist: 'Nothing natural lives in the Descent. Until you.',
    Sorcerer:   'The Descent is void magic with no memory of light. Your magic remembered. Loudly.',
    Necromancer:'The things that live in the Descent are not dead. They wish they were. You helped.',
    Berserker:  'The Descent broke everyone who came before you. You broke the Descent.',
    Bard:       'You sang in the void. The void had never heard singing before. It will not forget.',
    Alchemist:  'You catalogued the Descent. Filed a complete report. The DDDI was very pleased.',
    BloodKnight:'The Descent feeds on what you fear. You fear nothing. It went hungry.',
    Druid:      'Nothing grows in the Descent. Something does now.',
    Wizard:     'The Descent is pure void magic, ancient and patient. You were neither. You won anyway.',
  },
  'The Abyssal Deep': {
    Warrior:    'The Deep tried to drown you in darkness. You held your breath longer than it expected.',
    Monk:       'The pressure down here would crush stone. You moved through it like water.',
    Assassin:   'The Deep is dark in every direction. You were darker. That is the advantage.',
    Paladin:    'The divine light does not bend under pressure. Neither did you.',
    Naturalist: 'The creatures of the Deep had never seen anything from the surface before. They will not forget.',
    Sorcerer:   'The Deep has been generating its own magic since before the continents settled. You outspent it.',
    Necromancer:'The drowned dead of the Deep had been waiting a very long time. You gave them purpose.',
    Berserker:  'The Deep is patient in the way that only very old things can be patient. You were not patient. You won.',
    Bard:       'Sound moves differently this far down. Your voice carried anyway. The Leviathan listened.',
    Alchemist:  'Seventeen unknown compounds. Four new reactions. One complete dungeon clear. Excellent run.',
    BloodKnight:'The pressure down here should have stopped your heart. It tried. You disagreed.',
    Druid:      'The Deep has its own ecosystem, ancient and complete. You walked through the middle of it and left it intact.',
    Wizard:     'The Leviathan is four thousand years old. Your arcane study took eleven minutes. You were thorough.',
  },
};

var _runStartTime = null;






// Eagle's Cry activation
function activateEaglesCry() {
  if (getActiveEvent() !== 'july4') { say('Eagles Cry is only available during the Fourth of July event.'); return; }
  if (DS._eaglesCryActive) { say('Eagles Cry is already active.'); return; }
  DS._eaglesCryActive = true;
  DS._eaglesCryTurns = 3;
  sfx('sfx-eagle-cry');
  addLog('🦅 Eagles Cry! Enemy attack reduced by 30 percent for 3 turns.');
  say('Eagles Cry! The eagle screams. The enemy hesitates. Their attack is reduced for 3 turns.');
  setCombatBtns(true);
}

// ── ROOM TRACKER ─────────────────────────────────────────────────────────────

function updateRoomTracker() {
  var tracker = document.getElementById('dg-room-tracker');
  var left = document.getElementById('dg-room-tracker-left');
  var right = document.getElementById('dg-room-tracker-right');
  if (!tracker || !left || !right) return;

  tracker.style.display = 'flex';

  var floor = (DS.floor && !isNaN(DS.floor)) ? DS.floor : 1;
  var room = (DS.totalRooms && !isNaN(DS.totalRooms)) ? DS.totalRooms : 1;
  var roomsOnFloor = (DS.roomsOnFloor && !isNaN(DS.roomsOnFloor)) ? DS.roomsOnFloor : 0;
  var roomsPerFloor = 8; // standard rooms per floor
  var roomsLeft = roomsPerFloor - roomsOnFloor;
  var isBossFloor = floor === 10;

  left.textContent = 'Room ' + (roomsOnFloor + 1) + ' · Floor ' + floor;

  if (isBossFloor) {
    right.textContent = '⚠ Boss Floor';
    right.style.color = '#cc4444';
  } else if (roomsLeft <= 2) {
    right.textContent = 'Next floor soon';
    right.style.color = '#cc9944';
  } else {
    right.textContent = roomsLeft + ' rooms on this floor';
    right.style.color = '#555';
  }
}

// ── EXAMINE ENEMY ─────────────────────────────────────────────────────────────

function examineEnemy() {
  if (!DS.enemy) { say('No enemy to examine.'); return; }
  var enemy = DS.enemy;
  var name = enemy.name || 'Unknown';

  // Build examine text from enemy data
  var lines = [];
  lines.push(name + '.');

  // HP info
  lines.push('Health: ' + Math.max(0, enemy.hp) + ' of ' + (enemy.maxHp || enemy.hp) + '.');

  // ATK info
  if (enemy.atk) {
    var atkLow = Array.isArray(enemy.atk) ? enemy.atk[0] : enemy.atk;
    var atkHigh = Array.isArray(enemy.atk) ? enemy.atk[1] : enemy.atk;
    lines.push('Attacks for ' + atkLow + ' to ' + atkHigh + ' damage.');
  }

  // Special abilities from name matching in BESTIARY
  var bestEntry = null;
  if (typeof BESTIARY_DATA !== 'undefined') {
    bestEntry = BESTIARY_DATA.find(function(b) {
      return b.name && b.name.toLowerCase() === name.toLowerCase();
    });
  }

  if (bestEntry && bestEntry.desc) {
    lines.push('Known for: ' + bestEntry.desc);
  }

  // Special flags
  if (enemy.isBoss) lines.push('This is a boss. Cannot flee. Three phases.');
  if (enemy.isElite) lines.push('Elite enemy. Stronger than normal. Bonus gold on defeat.');
  if (enemy.poisonOnHit) lines.push('Warning: this enemy poisons on hit.');
  if (enemy.stunOnHit) lines.push('Warning: this enemy can stun.');
  if (enemy.blind) lines.push('Warning: this enemy can blind you.');
  if (enemy.silence) lines.push('Warning: this enemy can silence your skills.');
  if (enemy.drainSP) lines.push('Warning: this enemy drains your SP.');
  if (enemy.mirrorAtk) lines.push('Danger: reflects your own attack back at you.');
  if (enemy.preventFlee) lines.push('Danger: you cannot flee this enemy.');
  if (enemy.physResist) lines.push('Resistant to physical attacks. Use skills.');
  if (enemy.charm) lines.push('Can charm you — you may attack yourself.');

  // Threat level based on HP ratio
  var hpRatio = enemy.hp / (enemy.maxHp || enemy.hp);
  if (hpRatio > 0.75) lines.push('Threat level: High. Fresh and dangerous.');
  else if (hpRatio > 0.40) lines.push('Threat level: Medium. Bloodied but still fighting.');
  else lines.push('Threat level: Low. Nearly defeated.');

  var examineText = lines.join(' ');
  addLog('🔍 Examine: ' + examineText);
  say(examineText);
}
