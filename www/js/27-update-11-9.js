// ═══════════════════════════════════════════════════════════════════════
// v11.9 — THE TOGETHER UPDATE (the same features as the iPhone app's 11.9)
//   • Daily World Boss: one boss a day that every player fights together.
//   • Weekly Ladder: one dungeon all week, one life, a top 10 every Monday.
//   • Endless Descent rivals: the next player above your floor.
//   • Alt+W "What just happened": the last few combat lines again.
// The World Boss and the Weekly Ladder use the same online ladders as the
// iPhone app, so web and app players fight the same boss and climb the
// same ladder.
// ═══════════════════════════════════════════════════════════════════════

function _u119Esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function _u119Name(d) {
  var n = d.name || d.email || 'Anonymous';
  return n.indexOf('@') !== -1 ? n.split('@')[0].replace(/[^A-Za-z0-9]/g, '').slice(0, 3) + '***' : n;
}
// One player's entry in an online ladder (tournament/{season}/scores/{uid}).
async function _u119Upload(season, score, character) {
  var user = typeof getFirebaseUser === 'function' ? getFirebaseUser() : null;
  if (!user || !window._fbDb) return false;
  try {
    var name = (typeof getLeaderboardName === 'function' && getLeaderboardName(user)) || 'Anonymous';
    await window._fbDb.collection('tournament').doc(season).collection('scores').doc(user.uid).set({
      uid: user.uid, email: name, name: name, score: score, updatedAt: Date.now(),
      seasonName: season, character: character || ''
    });
    return true;
  } catch (e) { console.warn('[11.9] upload failed', season, e); return false; }
}
async function _u119Top(season, n) {
  if (!window._fbDb) return null;
  try {
    var snap = await window._fbDb.collection('tournament').doc(season).collection('scores')
      .orderBy('score', 'desc').limit(n || 10).get();
    var out = [];
    snap.forEach(function(d) { out.push(d.data()); });
    return out;
  } catch (e) { console.warn('[11.9] ladder failed', season, e); return null; }
}
function _u119CharButtons(listId, selected, onPick) {
  var list = document.getElementById(listId);
  if (!list) return;
  list.innerHTML = '';
  if (!CHARS || !CHARS.length) {
    list.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.7rem;color:#555;text-align:center;">No characters. Create one first.</p>';
    return;
  }
  CHARS.forEach(function(ch, i) {
    var b = document.createElement('button');
    b.className = 'menu-btn' + (i === selected ? ' selected' : '');
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', i === selected ? 'true' : 'false');
    b.textContent = ch.name + ' — ' + ch.cls + ' (Lv ' + (ch.persistLevel || 1) + ')';
    b.onclick = function() {
      list.querySelectorAll('button').forEach(function(x) { x.setAttribute('aria-checked', 'false'); x.classList.remove('selected'); });
      b.setAttribute('aria-checked', 'true'); b.classList.add('selected');
      onPick(i);
      say(ch.name + ' selected.');
    };
    list.appendChild(b);
  });
}

// ── DAILY WORLD BOSS ─────────────────────────────────────────────────────
// A UTC day, so it's the same boss for everyone everywhere; the same bosses,
// in the same order, as the iPhone app (WorldBoss.swift).
var WB = {
  hp: 30000, strikes: 10, gold: 750, fragments: 2,
  bosses: [
    { name: 'The Bone Colossus', intro: 'A mountain of bones rises, older than the dungeon itself.',
      taunts: ['Its ribs grind together.', 'Dust pours from its skull.', 'It shrugs off a rib and grows another.'] },
    { name: 'The Drowned King', intro: 'Water floods the hall. A crowned corpse stands in it.',
      taunts: ['The water rises to your knees.', 'It gurgles a forgotten order.', 'Its crown flickers green.'] },
    { name: 'Mother of Spiders', intro: 'The ceiling moves. It is all legs.',
      taunts: ['A thousand eyes turn toward you.', 'Webs snap around your feet.', 'Something skitters behind you.'] },
    { name: 'The Ash Wyrm', intro: 'The air turns to cinders. A dragon of ash uncoils.',
      taunts: ['Embers rain from its wings.', 'It breathes smoke, not fire. Yet.', 'Its scales crack and glow.'] },
    { name: 'The Hollow Bell', intro: 'A bell the size of a house rings with no one pulling it.',
      taunts: ['The toll shakes your teeth.', 'It rings again. Closer.', 'Silence, then one more toll.'] },
    { name: 'The Weeping Statue', intro: 'A stone giant cries real tears. They burn.',
      taunts: ['Stone grinds as it turns.', 'A tear hisses on the floor.', 'It sobs, and the walls crack.'] },
    { name: 'The Hunger', intro: 'No body, only a mouth in the dark, and it is never full.',
      taunts: ['It swallows the light.', 'Teeth, everywhere.', 'It chews on nothing, loudly.'] }
  ],
  charIdx: 0, shared: null, loaded: false, log: []
};

function wbDay(date) {
  date = date || new Date();
  var n = Math.floor(date.getTime() / 86400000);
  var iso = date.toISOString().slice(0, 10);
  return { date: iso, season: 'worldboss-' + iso, boss: WB.bosses[((n % 7) + 7) % 7] };
}
function wbHoursLeft() {
  var into = Date.now() % 86400000;
  return Math.max(1, Math.ceil((86400000 - into) / 3600000));
}
function wbMine(day) { return parseInt(DDStore.getItem('dd_wb_dmg_' + day.date) || '0', 10) || 0; }
function wbUsed(day) { return parseInt(DDStore.getItem('dd_wb_strikes_' + day.date) || '0', 10) || 0; }
function wbLeft(day) { return Math.max(0, WB.strikes - wbUsed(day)); }
function wbSignedIn() { return !!(typeof getFirebaseUser === 'function' && getFirebaseUser()); }
// Signed out, your damage isn't online, so it's added here.
function wbTotal(day) { return WB.shared == null ? null : WB.shared + (wbSignedIn() ? 0 : wbMine(day)); }

async function wbSharedDamage(season) {
  if (!window._fbDb) return null;
  try {
    var snap = await window._fbDb.collection('tournament').doc(season).collection('scores').get();
    var sum = 0;
    snap.forEach(function(d) { sum += Number(d.data().score) || 0; });
    return sum;
  } catch (e) { console.warn('[11.9] world boss HP failed', e); return null; }
}

function wbClaim(day, total) {
  if (total == null || total < WB.hp || wbMine(day) <= 0) return;
  var k = 'dd_wb_claimed_' + day.date;
  if (DDStore.getItem(k)) return;
  DDStore.setItem(k, '1');
  addGlobalGold(WB.gold);
  var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0', 10) || 0;
  DDStore.setItem('dd_soul_fragments', String(frags + WB.fragments));
  try { sfx('victory'); } catch (e) {}
  setTimeout(function() {
    say(day.boss.name + ' has fallen! You earn ' + WB.gold + ' gold and ' + WB.fragments + ' Soul Fragments.');
  }, 1000);
}

function wbEnsureScreen() {
  if (document.getElementById('screen-worldboss')) return;
  var el = document.createElement('div');
  el.id = 'screen-worldboss';
  el.className = 'screen';
  el.setAttribute('role', 'main');
  el.setAttribute('aria-label', 'Daily World Boss');
  el.innerHTML =
    '<div style="max-width:420px;margin:0 auto;padding:20px 16px;">' +
    '<div class="screen-header"><button class="back-btn" onclick="goTo(\'menu\')" aria-label="Back to main menu">← Menu</button>' +
    '<h2 class="screen-title" style="color:#ff8866;">🐉 Daily World Boss</h2></div>' +
    '<h3 id="wb-name" style="font-family:\'Cinzel Decorative\',cursive;font-size:1.1rem;color:#fff;text-align:center;margin:8px 0 4px;"></h3>' +
    '<p id="wb-intro" style="font-family:\'Crimson Text\',serif;font-style:italic;color:#aaa;text-align:center;margin-bottom:12px;"></p>' +
    '<div id="wb-info" tabindex="0" style="border:1px solid #4a1a1a;padding:12px;margin-bottom:14px;"></div>' +
    '<div id="wb-fight"></div>' +
    '<div id="wb-log" aria-label="Strike log" style="font-family:Cinzel,serif;font-size:0.65rem;color:#999;line-height:1.7;margin:12px 0;"></div>' +
    '<div id="wb-top"></div>' +
    '</div>';
  var anchor = document.getElementById('screen-void-reaper');
  (anchor && anchor.parentNode ? anchor.parentNode : document.body).insertBefore(el, anchor || null);
}

function wbRender() {
  var day = wbDay();
  var total = wbTotal(day);
  var left = WB.loaded && total != null ? Math.max(0, WB.hp - total) : null;
  var mine = wbMine(day), strikes = wbLeft(day);
  document.getElementById('wb-name').textContent = day.boss.name;
  document.getElementById('wb-intro').textContent = day.boss.intro;
  var pct = left == null ? 100 : Math.round(left / WB.hp * 100);
  var info = document.getElementById('wb-info');
  info.innerHTML =
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.2em;color:#555;" aria-hidden="true">WORLD BOSS — ALL PLAYERS</div>' +
    '<div style="background:#111;height:10px;margin:6px 0;" aria-hidden="true"><div style="background:#cc4422;height:100%;width:' + pct + '%;"></div></div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.8rem;color:#ff8866;">' +
      (!WB.loaded ? 'Loading...' : left == null ? 'HP can\'t be reached right now' : left.toLocaleString() + ' / ' + WB.hp.toLocaleString() + ' HP') + '</div>' +
    '<div style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:#888;">Your damage today: ' + mine.toLocaleString() +
      ' · ' + strikes + ' of ' + WB.strikes + ' strikes left · ' + wbHoursLeft() + 'h until the next boss</div>' +
    '<div style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:#44cc88;">Kill reward: ' + WB.gold + ' gold + ' + WB.fragments + ' Soul Fragments for everyone who struck</div>';
  info.setAttribute('aria-label', wbStatus(day) + ' Your damage today: ' + mine + '. ' + strikes + ' strikes left.');

  var fight = document.getElementById('wb-fight');
  if (left === 0) {
    fight.innerHTML = '<p style="color:#44cc88;font-family:\'Crimson Text\',serif;">It has fallen. Everyone who struck it collects ' + WB.gold +
      ' gold and ' + WB.fragments + ' Soul Fragments. A new boss comes at midnight UTC.</p>';
  } else if (strikes > 0) {
    fight.innerHTML =
      '<p style="font-family:Cinzel,serif;font-size:0.7rem;color:var(--gold-dim);text-transform:uppercase;letter-spacing:0.2em;">Choose your champion</p>' +
      '<div id="wb-char-list" role="radiogroup" aria-label="Select a character" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;"></div>' +
      '<button class="menu-btn primary" style="width:100%;" onclick="wbStrike()" aria-label="Strike ' + _u119Esc(day.boss.name) + '. ' + strikes + ' strikes left today.">⚔ Strike (' + strikes + ' left today)</button>';
    _u119CharButtons('wb-char-list', WB.charIdx, function(i) { WB.charIdx = i; });
  } else {
    fight.innerHTML = '<p style="font-family:\'Crimson Text\',serif;color:#aaa;">You\'ve used all ' + WB.strikes + ' strikes today. Come back tomorrow for a new boss.</p>';
  }
  if (!wbSignedIn()) {
    fight.innerHTML += '<p style="font-family:\'Crimson Text\',serif;font-style:italic;font-size:0.8rem;color:#666;">Sign in (Settings → Account) so your damage counts for everyone. Signed out, it only counts in this browser.</p>';
  }
  document.getElementById('wb-log').innerHTML = WB.log.slice(0, 10).map(function(l) { return '<div>' + _u119Esc(l) + '</div>'; }).join('');
}

function wbStatus(day) {
  var h = wbHoursLeft();
  var time = h + ' hour' + (h === 1 ? '' : 's') + ' until the next boss.';
  var total = wbTotal(day);
  if (!WB.loaded) return day.boss.name + '. Loading. ' + time;
  if (total == null) return day.boss.name + '. The shared HP can\'t be reached right now. ' + time;
  var left = Math.max(0, WB.hp - total);
  if (left === 0) return day.boss.name + ' has fallen today. ' + time;
  return day.boss.name + ': ' + left.toLocaleString() + ' of ' + WB.hp.toLocaleString() + ' HP left. ' + time;
}

async function wbLoad(announce) {
  var day = wbDay();
  WB.shared = await wbSharedDamage(day.season);
  var top = await _u119Top(day.season, 10);
  WB.loaded = true;
  if (_currentScreen !== 'worldboss') return;
  wbRender();
  var topEl = document.getElementById('wb-top');
  if (topEl && top && top.length) {
    topEl.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);" role="heading" aria-level="3">🏆 TODAY\'S TOP DAMAGE</p>' +
      top.map(function(d, i) { return '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (i ? '#aaa' : '#ffdd44') + ';">' +
        (i + 1) + '. ' + _u119Esc(_u119Name(d)) + ' — ' + (Number(d.score) || 0).toLocaleString() + '</div>'; }).join('');
  }
  if (announce) say(day.boss.intro + ' ' + wbStatus(day) + ' You have ' + wbLeft(day) + ' strikes left today.');
  wbClaim(day, wbTotal(day));
  // Yesterday's boss, if you struck it and it fell after you left.
  var yd = wbDay(new Date(Date.now() - 86400000));
  if (wbMine(yd) > 0 && !DDStore.getItem('dd_wb_claimed_' + yd.date)) {
    var yt = await wbSharedDamage(yd.season);
    wbClaim(yd, yt);
  }
}

function wbStrike() {
  var day = wbDay();
  var ch = CHARS && CHARS[WB.charIdx];
  if (!ch) { say('Please select a character.'); return; }
  var used = wbUsed(day);
  if (used >= WB.strikes) { say('No strikes left today.'); return; }
  var base = 80 + 12 * Math.max(1, ch.persistLevel || 1);
  var lo = Math.floor(base * 4 / 5), hi = Math.floor(base * 6 / 5);
  var dmg = lo + Math.floor(Math.random() * (hi - lo + 1));
  var crit = Math.random() < 0.15;
  if (crit) dmg *= 2;
  var mine = wbMine(day) + dmg;
  DDStore.setItem('dd_wb_dmg_' + day.date, String(mine));
  DDStore.setItem('dd_wb_strikes_' + day.date, String(used + 1));
  var taunt = day.boss.taunts[Math.floor(Math.random() * day.boss.taunts.length)];
  try { sfx(crit ? 'heavy-hit' : 'attack'); } catch (e) {}
  var line = (crit ? '💥 Critical! ' : '⚔ ') + ch.name + ' deals ' + dmg + ' damage. ' + taunt;
  WB.log.unshift(line);
  if (wbSignedIn() && WB.shared != null) WB.shared += dmg;
  var total = wbTotal(day);
  wbRender();
  say(line + (total != null ? ' ' + Math.max(0, WB.hp - total).toLocaleString() + ' HP left.' : '') + ' ' + wbLeft(day) + ' strikes left.');
  (async function() {
    if (wbSignedIn()) await _u119Upload(day.season, mine, ch.name);
    await wbLoad(false);
  })();
}

function openWorldBoss() {
  wbEnsureScreen();
  WB.loaded = false;
  WB.log = [];
  goTo('worldboss');
  try { playTrack('boss'); } catch (e) {}
  wbRender();
  wbLoad(true);
}

// ── WEEKLY LADDER ────────────────────────────────────────────────────────
// The ISO week, so every player (web and app) gets the same dungeon and
// modifiers; the same seed as the iPhone app (Challenges.weekly).
var _weeklyCharIdx = 0;
function weeklySetup(date) {
  date = date || new Date();
  var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  var dayNum = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNum + 3); // the week's Thursday
  var y = d.getFullYear();
  var firstThu = new Date(y, 0, 4);
  var w = 1 + Math.round(((d - firstThu) / 86400000 - 3 + (firstThu.getDay() + 6) % 7) / 7);
  var s = y * 100 + w + 7000000;
  var dIdx = Math.floor(_seededRandom(s) * GAUNTLET_DUNGEONS.length);
  var m1 = Math.floor(_seededRandom(s + 1) * DAILY_MODIFIERS_POOL.length);
  var m2 = Math.floor(_seededRandom(s + 2) * DAILY_MODIFIERS_POOL.length);
  if (m2 === m1) m2 = (m2 + 1) % DAILY_MODIFIERS_POOL.length;
  return {
    dungeon: GAUNTLET_DUNGEONS[Math.min(dIdx, GAUNTLET_DUNGEONS.length - 1)],
    mods: [DAILY_MODIFIERS_POOL[m1], DAILY_MODIFIERS_POOL[m2]],
    key: 'dd_weekly_' + y + 'w' + w,
    season: 'weekly-' + y + '-W' + (w < 10 ? '0' : '') + w,
    name: 'Week ' + w
  };
}
function weeklyBest() { return parseInt(DDStore.getItem(weeklySetup().key) || '0', 10) || 0; }

function weeklyEnsurePanel() {
  if (document.getElementById('ch-panel-weekly')) return;
  var daily = document.getElementById('ch-tab-daily');
  if (!daily) return;
  var tab = daily.cloneNode(false);
  tab.id = 'ch-tab-weekly';
  tab.setAttribute('aria-selected', 'false');
  tab.setAttribute('aria-label', 'Weekly Ladder tab — one dungeon all week, one life, a leaderboard');
  tab.setAttribute('onclick', "switchChallengeTab('weekly')");
  tab.textContent = '📆 WEEKLY LADDER';
  daily.parentNode.appendChild(tab);
  var panel = document.createElement('div');
  panel.id = 'ch-panel-weekly';
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-label', 'Weekly Ladder');
  panel.style.display = 'none';
  panel.innerHTML =
    '<div style="background:#0a0800;border:1px solid #2a2010;padding:16px;margin-bottom:16px;">' +
    '<div id="weekly-title" style="font-family:Cinzel,serif;font-size:0.75rem;color:#e0c080;margin-bottom:4px;"></div>' +
    '<div id="weekly-dung" style="font-family:Cinzel,serif;font-size:0.85rem;color:#fff;margin-bottom:8px;"></div>' +
    '<div id="weekly-mods" style="font-family:Cinzel,serif;font-size:0.65rem;color:#aaa;line-height:1.8;"></div>' +
    '<div style="font-family:Cinzel,serif;font-size:0.6rem;color:#666;margin-top:8px;">One life. Score: 100 a floor, 5 a kill, 2000 for the boss. Starts over every Monday.</div></div>' +
    '<div id="weekly-best" style="font-family:Cinzel,serif;font-size:0.7rem;color:#aaa;margin-bottom:12px;"></div>' +
    '<div id="weekly-top" style="margin-bottom:14px;"></div>' +
    '<div id="weekly-char-list" role="radiogroup" aria-label="Select a character for the Weekly Ladder" style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;"></div>' +
    '<button class="menu-btn primary" style="width:100%;" onclick="startWeeklyLadder()" id="weekly-start-btn">📆 Enter the Weekly Ladder</button>';
  document.getElementById('ch-panel-daily').parentNode.insertBefore(panel, document.getElementById('ch-panel-daily').nextSibling);
}

function weeklyRender() {
  var w = weeklySetup();
  document.getElementById('weekly-title').textContent = "This Week's Dungeon — " + w.name;
  document.getElementById('weekly-dung').textContent = w.dungeon;
  document.getElementById('weekly-mods').innerHTML = w.mods.map(function(m) {
    return '<div>⚡ <strong>' + _u119Esc(m.name) + '</strong> — ' + _u119Esc(m.desc) + '</div>'; }).join('');
  document.getElementById('weekly-best').textContent = 'Your best this week: ' + weeklyBest();
  document.getElementById('weekly-start-btn').setAttribute('aria-label', "Begin this week's ladder run, " + w.dungeon + ', one life');
  _u119CharButtons('weekly-char-list', _weeklyCharIdx, function(i) { _weeklyCharIdx = i; });
  var top = document.getElementById('weekly-top');
  top.innerHTML = '<p style="font-family:Cinzel,serif;font-size:0.65rem;color:#666;font-style:italic;">Loading the ladder...</p>';
  _u119Top(w.season, 10).then(function(list) {
    var html = '<p style="font-family:Cinzel,serif;font-size:0.65rem;letter-spacing:0.2em;color:var(--gold-dim);" role="heading" aria-level="3">🏆 TOP 10 THIS WEEK</p>';
    if (!list) html += '<p style="font-size:0.7rem;color:#666;">The ladder can\'t be reached right now.</p>';
    else if (!list.length) html += '<p style="font-size:0.7rem;color:#666;font-style:italic;">No scores yet this week. Be the first.</p>';
    else html += list.map(function(d, i) { return '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (i ? '#aaa' : '#ffdd44') + ';">' +
      (i + 1) + '. ' + _u119Esc(_u119Name(d)) + ' — ' + (Number(d.score) || 0) + '</div>'; }).join('');
    if (!wbSignedIn()) html += '<p style="font-size:0.7rem;color:#666;font-style:italic;">Sign in (Settings → Account) to put your score on the ladder.</p>';
    top.innerHTML = html;
  });
}

function startWeeklyLadder() {
  if (!CHARS || !CHARS.length) { say('No characters. Create one first.'); return; }
  var ch = CHARS[_weeklyCharIdx];
  if (!ch) { say('Please select a character.'); return; }
  var w = weeklySetup();
  _charIdx = _weeklyCharIdx;
  ch.dungeon = w.dungeon;
  ch.floor = 1;
  ch.midRunSave = null;
  saveChars();
  initDungeon(ch);
  DS._weeklyRun = true;
  DS._weeklyKey = w.key;
  DS._weeklySeason = w.season;
  w.mods.forEach(function(m) { m.apply(); });
  gauntletOneLife();
  challengeFixEndless();
  goTo('dungeon');
  say('Weekly Ladder begins. ' + ch.name + ' enters ' + w.dungeon + '. One life. Active modifiers: ' +
      w.mods.map(function(m) { return m.name; }).join(', ') + '.');
}

// A Weekly Ladder run ends (cleared or not): its score, kept if it's your best.
function weeklyDone(cleared) {
  if (typeof DS === 'undefined' || !DS._weeklyRun) return;
  DS._weeklyRun = false;
  var score = Math.max(0, DS.floor || 0) * 100 + Math.max(0, DS.kills || 0) * 5 + (cleared ? 2000 : 0);
  var key = DS._weeklyKey, w = weeklySetup();
  var best = parseInt(DDStore.getItem(key) || '0', 10) || 0;
  var isBest = score > best;
  if (isBest) DDStore.setItem(key, String(score));
  if (isBest && key === w.key) {
    var ch = CHARS && CHARS[_charIdx];
    _u119Upload(DS._weeklySeason, score, ch ? ch.name : '');
  }
  var msg = '📆 Weekly Ladder score: ' + score + '.' + (isBest ? ' Your best this week!' : ' Your best this week is ' + Math.max(best, score) + '.');
  try { addLog(msg); } catch (e) {}
  setTimeout(function() { say(msg); }, 1500);
}

// ── ENDLESS DESCENT RIVALS ───────────────────────────────────────────────
var AFK_RIVALS = [];
function afkRivalLine(floor) {
  if (!AFK_RIVALS.length) return null;
  var above = null, passed = null;
  AFK_RIVALS.forEach(function(r) {
    if (r.floor >= floor && (!above || r.floor < above.floor)) above = r;
    if (r.floor === floor - 1 && !passed) passed = r;
  });
  var parts = [];
  if (passed) parts.push('Passed ' + passed.name + ' (floor ' + passed.floor + ')!');
  if (above) {
    var gap = above.floor - floor;
    parts.push('Next rival: ' + above.name + ', floor ' + above.floor + (gap === 0 ? ', level with you.' : ', ' + gap + ' to go.'));
  } else parts.push("You're deeper than every rival on the board!");
  return parts.join(' ');
}
async function afkLoadRivals() {
  var best = (typeof getAFKSave === 'function' && getAFKSave().bestFloor) || 0;
  var ch = CHARS && CHARS[_charIdx];
  if (best > 0) await _u119Upload('afk-rivals', best, ch ? ch.name : '');
  if (!window._fbDb) return;
  try {
    var snap = await window._fbDb.collection('tournament').doc('afk-rivals').collection('scores')
      .orderBy('score', 'desc').limit(51).get();
    var me = wbSignedIn() ? getFirebaseUser().uid : null;
    var out = [];
    snap.forEach(function(d) {
      var x = d.data(), f = Number(x.score) || 0;
      if (d.id === me || f <= 0) return;
      var n = x.character || _u119Name(x);
      out.push({ name: n, floor: f });
    });
    AFK_RIVALS = out;
    if (typeof updateAFKUI === 'function' && typeof AFK !== 'undefined' && AFK.running) updateAFKUI();
  } catch (e) { console.warn('[11.9] rivals failed', e); }
}
function afkShowRival() {
  var floorEl = document.getElementById('afk-floor-display');
  if (!floorEl || typeof AFK === 'undefined') return;
  var el = document.getElementById('afk-rival-line');
  if (!el) {
    el = document.createElement('div');
    el.id = 'afk-rival-line';
    el.style.cssText = "font-family:'Cinzel',serif;font-size:0.65rem;color:#ffdd44;margin-top:6px;";
    floorEl.parentNode.appendChild(el);
  }
  var line = afkRivalLine(AFK.floor);
  el.textContent = line ? '🏁 ' + line : '';
  // Say it when you pass someone (the line changes on a new floor).
  if (line && line.indexOf('Passed ') === 0 && el._spokenFloor !== AFK.floor) {
    el._spokenFloor = AFK.floor;
    say(line);
  }
}

// ── ALT+W: WHAT JUST HAPPENED ────────────────────────────────────────────
function whatJustHappened() {
  var log = document.getElementById('dg-combat-log');
  var lines = log ? Array.prototype.slice.call(log.children, -5).map(function(n) { return n.textContent.trim(); }).filter(Boolean) : [];
  say(lines.length ? lines.join(' ') : 'Nothing has happened yet.');
}
document.addEventListener('keydown', function(e) {
  if (!e.altKey || (e.key || '').toLowerCase() !== 'w') return;
  var tag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
  var dg = document.getElementById('screen-dungeon');
  if (!dg || !dg.classList.contains('active')) return;
  e.preventDefault();
  whatJustHappened();
});

// ── HOOKS into the existing game ─────────────────────────────────────────
(function() {
  var _goTo = goTo;
  goTo = function(id) {
    if (id === 'worldboss') wbEnsureScreen();
    _goTo.apply(this, arguments);
    if (id === 'afk-setup' || id === 'afk') setTimeout(afkLoadRivals, 300);
  };
  var _init = initChallenges;
  initChallenges = function() {
    weeklyEnsurePanel();
    _init.apply(this, arguments);
    say('Challenges. Three tabs: The Gauntlet, Daily Dungeon and the Weekly Ladder.');
  };
  var _switch = switchChallengeTab;
  switchChallengeTab = function(tab) {
    weeklyEnsurePanel();
    var wt = document.getElementById('ch-tab-weekly'), wp = document.getElementById('ch-panel-weekly');
    if (tab === 'weekly') {
      ['gauntlet', 'daily'].forEach(function(t) {
        document.getElementById('ch-panel-' + t).style.display = 'none';
        var b = document.getElementById('ch-tab-' + t);
        b.setAttribute('aria-selected', 'false'); b.style.borderBottomColor = 'transparent'; b.style.color = '#666';
      });
      wp.style.display = '';
      wt.setAttribute('aria-selected', 'true'); wt.style.borderBottomColor = '#ffdd44'; wt.style.color = '#ffdd44';
      weeklyRender();
      var w = weeklySetup();
      say('Weekly Ladder. ' + w.name + '. ' + w.dungeon + ', one life. Your best this week: ' + weeklyBest() + '.');
      return;
    }
    _switch.apply(this, arguments);
    if (wp) { wp.style.display = 'none'; wt.setAttribute('aria-selected', 'false'); wt.style.borderBottomColor = 'transparent'; wt.style.color = '#666'; }
  };
  var _victory = showVictory;
  showVictory = function() { weeklyDone(true); return _victory.apply(this, arguments); };
  var _defeat = showDefeat;
  showDefeat = function() { weeklyDone(false); return _defeat.apply(this, arguments); };
  var _afkUI = updateAFKUI;
  updateAFKUI = function() { var r = _afkUI.apply(this, arguments); try { afkShowRival(); } catch (e) {} return r; };
  var _endRun = afkEndRun;
  afkEndRun = function() { var r = _endRun.apply(this, arguments); setTimeout(afkLoadRivals, 500); return r; };
})();
