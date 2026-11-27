// ═══════════════════════════════════════════════════════════════════════
// GUILDS (the same as the iPhone app's 12.2 Guilds: GuildStore.swift,
// GuildsView.swift and Guilds.swift)
//   Up to 20 players under one name, with their own chat and a Guild Boss
//   each week. The same "guilds" collection as the app, so web, Android and
//   iPhone players are in the same guilds. firebase/firestore.rules says who
//   may change what; guilds need an account so the rules know who's who.
// ═══════════════════════════════════════════════════════════════════════

var GUILDS = {
  maxMembers: 20, strikesPerDay: 5, gold: 1500, fragments: 5,
  bosses: [
    { name: 'The Siege Engine', intro: 'A war machine with no crew rolls out of the dark. It was built to break guilds.',
      taunts: ['Its gears shriek.', 'A plank tears loose and it keeps coming.', 'Chains rattle somewhere inside it.'] },
    { name: 'The Twin Wardens', intro: 'Two guards who never sleep, sharing one shield and one grudge.',
      taunts: ['One guards while the other swings.', 'They trade places. You barely see it.', 'The shield rings like a bell.'] },
    { name: 'The Swarm Queen', intro: 'The walls hum. Every crack in the stone is a door for her children.',
      taunts: ['The humming gets louder.', 'Wings, everywhere.', 'Something crawls up your sleeve.'] },
    { name: 'The Iron Abbot', intro: 'A monk in rusted armour, praying to something that answers.',
      taunts: ['He mutters a prayer. The room goes cold.', 'His censer swings, trailing black smoke.', 'Iron creaks as he kneels and rises.'] },
    { name: 'The Tide Beneath', intro: 'The floor is wet. Then it is water. Then it is looking at you.',
      taunts: ['A wave crashes over your feet.', 'The water pulls back, gathering.', 'Salt stings your eyes.'] },
    { name: 'The Ember Choir', intro: 'A hundred burning voices, singing one note that never ends.',
      taunts: ['The note gets higher.', 'Sparks fall like snow.', 'One voice drops out. Two more join.'] }
  ],
  page: 'home', mine: null, checked: false, all: null, allFailed: false, chat: [], hits: [], total: null,
  unsub: null, seen: {}, firstChat: true, charIdx: 0, log: [], msg: ''
};

// ── The week (Monday to Sunday, UTC), the boss, the HP ──
function guildWeek(date) {
  date = date || new Date();
  var d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 3 - (d.getUTCDay() + 6) % 7); // the week's Thursday
  var y = d.getUTCFullYear();
  var w = 1 + Math.round(((d - Date.UTC(y, 0, 4)) / 86400000 - 3 + (new Date(Date.UTC(y, 0, 4)).getUTCDay() + 6) % 7) / 7);
  var n = Math.floor(Math.floor(date.getTime() / 86400000 + 3) / 7);
  var b = GUILDS.bosses;
  return { key: y + '-W' + (w < 10 ? '0' : '') + w, boss: b[((n % b.length) + b.length) % b.length] };
}
function guildDaysLeft() {
  var into = (Date.now() / 86400000 + 3) % 7;
  return Math.max(1, Math.ceil(7 - into));
}
function guildHp(members) { return 10000 + 6000 * Math.min(GUILDS.maxMembers, Math.max(1, members)); }
function guildToday() { return new Date().toISOString().slice(0, 10); }
function guildMyDamage(week) { return parseInt(DDStore.getItem('dd_guild_dmg_' + week.key) || '0', 10) || 0; }
function guildStrikesUsed() { return parseInt(DDStore.getItem('dd_guild_strikes_' + guildToday()) || '0', 10) || 0; }
function guildStrikesLeft() { return Math.max(0, GUILDS.strikesPerDay - guildStrikesUsed()); }
function guildStatus(week, total, members) {
  var d = guildDaysLeft();
  var time = d + ' day' + (d === 1 ? '' : 's') + ' until the next boss.';
  if (total == null) return week.boss.name + ". The guild's damage can't be reached right now. " + time;
  var left = Math.max(0, guildHp(members) - total);
  if (left === 0) return week.boss.name + ' has fallen this week. ' + time;
  return week.boss.name + ': ' + left.toLocaleString() + ' of ' + guildHp(members).toLocaleString() + ' HP left. ' + time;
}

// ── Names ──
function guildNameProblem(raw) {
  var name = String(raw || '').trim();
  if (name.length < 3) return 'A guild name needs at least 3 characters.';
  if (name.length > 24) return 'A guild name can be at most 24 characters.';
  if (!/^[A-Za-z0-9 '\-]+$/.test(name)) return 'Use only letters, numbers, spaces, apostrophes and hyphens in a guild name.';
  if (name.indexOf('  ') !== -1) return 'Use only one space between words.';
  if (typeof chatContainsBadWord === 'function' && chatContainsBadWord(name)) return 'That guild name is not allowed. Please choose another.';
  return null;
}
function guildDescProblem(raw) {
  if (String(raw || '').length > 120) return 'The description can be at most 120 characters.';
  if (typeof chatContainsBadWord === 'function' && chatContainsBadWord(raw)) return 'The description contains inappropriate content.';
  return null;
}
function guildKey(name) { return String(name).trim().toLowerCase(); }

// ── Online ──
function guildDb() { return window._fbDb || (typeof window._ddFirestore === 'function' ? (window._fbDb = window._ddFirestore()) : null); }
function guildUid() { var u = typeof getFirebaseUser === 'function' ? getFirebaseUser() : null; return u ? u.uid : null; }
function guildIsDev() { return guildUid() === 'WgqZGmnPKeYIymlMkx0aAg8G2T52'; }
function guildMyName() {
  var n = [DDStore.getItem('dd_chat_username'), DDStore.getItem('dd_username')].filter(function(x) { return x && String(x).trim(); })[0] || 'Adventurer';
  return String(n).trim().slice(0, 20);
}
function guildFromDoc(id, v) {
  if (!v || !v.name || !v.leader) return null;
  var g = { id: id, name: v.name, desc: v.desc || '', leader: v.leader, leaderName: v.leaderName || '', members: v.members || {},
            week: v.week || '', weekDamage: Number(v.weekDamage) || 0 };
  g.count = Object.keys(g.members).length;
  g.thisWeek = g.week === guildWeek().key ? g.weekDamage : 0;
  return g;
}
function guildRoster(g) {
  return Object.keys(g.members).map(function(u) { return { uid: u, name: g.members[u] }; }).sort(function(a, b) {
    if (a.uid === g.leader) return -1; if (b.uid === g.leader) return 1;
    return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
  });
}
var FV = function() { return firebase.firestore.FieldValue; };
var FP = function(a, b) { return new firebase.firestore.FieldPath(a, b); };

async function guildLoadMine() {
  var uid = guildUid(), db = guildDb();
  if (!uid || !db) { GUILDS.mine = null; GUILDS.checked = true; return; }
  try {
    var snap = await db.collection('guilds').where(FP('members', uid), '>', '').limit(1).get();
    GUILDS.mine = snap.empty ? null : guildFromDoc(snap.docs[0].id, snap.docs[0].data());
  } catch (e) { console.warn('[guilds] mine', e); }
  GUILDS.checked = true;
  guildWatch();
}
// Keeps your guild up to date while the screen is open: new members, a new
// leader, being removed, or the guild being disbanded.
function guildWatch() {
  var g = GUILDS.mine;
  if (GUILDS.docUnsub && (!g || GUILDS.watching !== g.id)) { GUILDS.docUnsub(); GUILDS.docUnsub = null; GUILDS.watching = null; }
  if (!g || GUILDS.docUnsub) return;
  GUILDS.watching = g.id;
  GUILDS.docUnsub = guildDb().collection('guilds').doc(g.id).onSnapshot(function(d) {
    var uid = guildUid(), was = GUILDS.mine;
    var now = d.exists ? guildFromDoc(d.id, d.data()) : null;
    if (now && !now.members[uid]) now = null;
    if (!now) {
      if (GUILDS.docUnsub) { GUILDS.docUnsub(); GUILDS.docUnsub = null; GUILDS.watching = null; }
      guildCloseChat();
      GUILDS.mine = null;
      if (was && _currentScreen === 'guilds') guildGo('home', d.exists ? 'You are no longer in ' + was.name + '.' : was.name + ' was disbanded.');
      return;
    }
    var becameLeader = was && was.leader !== uid && now.leader === uid;
    GUILDS.mine = now;
    if (_currentScreen === 'guilds' && GUILDS.page !== 'chat' && !(document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName))) guildRender();
    if (becameLeader) say('You now lead ' + now.name + '.');
  }, function() {});
}
async function guildLoadAll() {
  var db = guildDb();
  try {
    var snap = await db.collection('guilds').limit(300).get();
    var list = [];
    snap.forEach(function(d) { var g = guildFromDoc(d.id, d.data()); if (g) list.push(g); });
    list.sort(function(a, b) { return b.thisWeek - a.thisWeek || b.count - a.count || (a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1); });
    GUILDS.all = list; GUILDS.allFailed = false;
  } catch (e) { GUILDS.all = null; GUILDS.allFailed = true; }
}

async function guildCreate(nameRaw, descRaw) {
  var uid = guildUid(), db = guildDb();
  if (!uid) return 'Sign in first (Settings, Account). Guilds need an account.';
  var name = String(nameRaw).trim(), desc = String(descRaw).trim();
  var p = guildNameProblem(name) || guildDescProblem(desc);
  if (p) return p;
  await guildLoadMine();
  if (GUILDS.mine) return "You're already in a guild. Leave it first.";
  var key = guildKey(name);
  try { if ((await db.collection('guildNames').doc(key).get()).exists) return 'A guild called ' + name + ' already exists. Choose another name.'; } catch (e) {}
  var ref = db.collection('guilds').doc();
  var me = guildMyName(), members = {}; members[uid] = me;
  var batch = db.batch();
  batch.set(db.collection('guildNames').doc(key), { gid: ref.id, uid: uid });
  batch.set(ref, { name: name, nameKey: key, desc: desc, leader: uid, leaderName: me, members: members,
                   createdAt: Date.now(), week: guildWeek().key, weekDamage: 0 });
  try { await batch.commit(); } catch (e) { return "Couldn't create the guild. The name may have just been taken, or you're offline. Try again."; }
  await guildLoadMine();
  return null;
}
async function guildJoin(g) {
  var uid = guildUid();
  if (!uid) return 'Sign in first (Settings, Account). Guilds need an account.';
  await guildLoadMine();
  if (GUILDS.mine) return "You're already in a guild. Leave it first.";
  if (g.count >= GUILDS.maxMembers) return g.name + ' is full: ' + GUILDS.maxMembers + ' members.';
  try { await guildDb().collection('guilds').doc(g.id).update(FP('members', uid), guildMyName()); }
  catch (e) { return "Couldn't join " + g.name + ". It may have just filled up, or you're offline."; }
  await guildLoadMine();
  return null;
}
async function guildLeave() {
  await guildLoadMine();
  var uid = guildUid(), g = GUILDS.mine;
  if (!g) return null;
  if (g.leader === uid) {
    if (g.count > 1) return 'You lead ' + g.name + '. Make another member the leader first (Members), or disband the guild (Manage Guild).';
    return guildDisband(g);
  }
  if (GUILDS.docUnsub) { GUILDS.docUnsub(); GUILDS.docUnsub = null; GUILDS.watching = null; }
  try { await guildDb().collection('guilds').doc(g.id).update(FP('members', uid), FV().delete()); }
  catch (e) { guildWatch(); return "Couldn't leave the guild. Check your connection."; }
  guildCloseChat(); GUILDS.mine = null; guildWatch();
  return null;
}
async function guildRemove(member) {
  var g = GUILDS.mine;
  try { await guildDb().collection('guilds').doc(g.id).update(FP('members', member), FV().delete()); }
  catch (e) { return "Couldn't remove them. Check your connection."; }
  delete g.members[member]; g.count--;
  return null;
}
async function guildMakeLeader(member) {
  var g = GUILDS.mine;
  try { await guildDb().collection('guilds').doc(g.id).update({ leader: member, leaderName: g.members[member] }); }
  catch (e) { return "Couldn't change the leader. Check your connection."; }
  g.leader = member; g.leaderName = g.members[member];
  return null;
}
async function guildSetDesc(raw) {
  var g = GUILDS.mine, desc = String(raw).trim(), p = guildDescProblem(desc);
  if (p) return p;
  try { await guildDb().collection('guilds').doc(g.id).update({ desc: desc }); }
  catch (e) { return "Couldn't save it. Check your connection."; }
  g.desc = desc;
  return null;
}
async function guildDisband(target) {
  var g = target || GUILDS.mine, db = guildDb();
  if (!g) return null;
  var batch = db.batch();
  batch.delete(db.collection('guildNames').doc(guildKey(g.name)));
  batch.delete(db.collection('guilds').doc(g.id));
  try { await batch.commit(); } catch (e) { return "Couldn't disband the guild. Check your connection."; }
  if (GUILDS.mine && g.id === GUILDS.mine.id) { guildCloseChat(); GUILDS.mine = null; guildWatch(); }
  if (GUILDS.all) GUILDS.all = GUILDS.all.filter(function(x) { return x.id !== g.id; });
  return null;
}

// ── Guild chat ──
function guildBlocked() { try { return JSON.parse(DDStore.getItem('dd_guild_blocked') || '[]'); } catch (e) { return []; } }
function guildOpenChat() {
  var g = GUILDS.mine;
  if (GUILDS.unsub || !g) return;
  GUILDS.firstChat = true;
  GUILDS.unsub = guildDb().collection('guilds').doc(g.id).collection('chat').orderBy('timestamp').limitToLast(60)
    .onSnapshot(function(snap) {
      var me = guildUid(), blocked = guildBlocked(), list = [];
      snap.forEach(function(d) { var v = d.data(); list.push({ id: d.id, uid: v.uid || '', username: v.username || 'Unknown', message: v.message || '', timestamp: Number(v.timestamp) || 0 }); });
      list = list.filter(function(m) { return blocked.indexOf(m.username) === -1; });
      if (!GUILDS.firstChat) list.forEach(function(m) { if (!GUILDS.seen[m.id] && m.uid !== me) say('Guild. ' + m.username + ' said ' + m.message); });
      GUILDS.firstChat = false;
      list.forEach(function(m) { GUILDS.seen[m.id] = 1; });
      GUILDS.chat = list;
      if (GUILDS.page === 'chat' && _currentScreen === 'guilds') guildRenderChatList();
    }, function() {});
}
function guildCloseChat() { if (GUILDS.unsub) GUILDS.unsub(); GUILDS.unsub = null; GUILDS.chat = []; GUILDS.seen = {}; }
function guildSend() {
  var input = document.getElementById('guild-chat-input');
  var text = (input.value || '').trim(), uid = guildUid(), g = GUILDS.mine;
  var problem = !g ? 'Join a guild first.' : !text ? 'Please type a message first.' : text.length > 200 ? 'Message too long. Maximum 200 characters.'
    : (typeof chatContainsBadWord === 'function' && chatContainsBadWord(text)) ? 'Your message contains inappropriate content and was not sent.' : null;
  if (problem) { say(problem); return; }
  if (DDStore.getItem('dd_chat_terms_ok') !== '1') {
    if (!confirm('Guild chat is seen by every member of your guild. By continuing you agree to the Dungeon Descent Terms of Service at dungen-descent.org/terms. There is no tolerance for objectionable content or abusive users. You can report or block anyone.')) {
      say('You need to agree to the Terms of Service to post.'); return;
    }
    DDStore.setItem('dd_chat_terms_ok', '1');
  }
  guildDb().collection('guilds').doc(g.id).collection('chat').add({ uid: uid, username: guildMyName(), message: text, timestamp: Date.now() })
    .catch(function() { say('Failed to send message. Check your connection.'); });
  input.value = '';
  try { sfx('sfx-confirm'); } catch (e) {}
}
async function guildReport(kind, id, author, content) {
  var reason = prompt('What is wrong with it? For example: offensive, harassment, spam. You can also leave this empty.');
  if (reason === null) { say('Report cancelled.'); return false; }
  var user = typeof getFirebaseUser === 'function' ? getFirebaseUser() : null;
  try {
    var r = await fetch('https://formspree.io/f/mkjnkenn', { method: 'POST', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'Content report: ' + kind,
        message: 'REPORTED ' + kind.toUpperCase() + '\nAuthor: ' + author + '\nContent: ' + content + '\nID: ' + id + '\nReason: ' + (reason || 'not given') +
                 '\nReported by: ' + guildMyName() + '\nTime: ' + new Date().toISOString(),
        email: (user && user.email) || 'no-reply@dungen-descent.org',
        platform: (window.Capacitor && typeof Capacitor.getPlatform === 'function') ? Capacitor.getPlatform() : 'web',
        gameVersion: (typeof CURRENT_VERSION !== 'undefined') ? CURRENT_VERSION : 'unknown' }) });
    if (!r.ok) throw new Error(r.status);
    say('Report sent. Thank you. The developer reviews reports within 24 hours. It is hidden for you now.');
  } catch (e) { say('The report could not be sent. Check your connection. It is hidden for you now.'); }
  return true;
}

// ── The Guild Boss ──
function guildHits(g, week) { return guildDb().collection('guilds').doc(g.id).collection('boss').doc(week).collection('hits'); }
async function guildLoadBoss(week) {
  var g = GUILDS.mine;
  if (!g) { GUILDS.total = null; return; }
  try {
    var snap = await guildHits(g, week.key).get(), hits = [];
    snap.forEach(function(d) { hits.push({ uid: d.id, name: d.data().name || 'Unknown', damage: Number(d.data().damage) || 0 }); });
    hits.sort(function(a, b) { return b.damage - a.damage; });
    GUILDS.hits = hits;
    GUILDS.total = hits.reduce(function(a, h) { return a + h.damage; }, 0);
  } catch (e) { GUILDS.total = null; }
}
async function guildWeekTotal(week) {
  try { var snap = await guildHits(GUILDS.mine, week.key).get(), t = 0; snap.forEach(function(d) { t += Number(d.data().damage) || 0; }); return t; }
  catch (e) { return null; }
}
function guildClaim(week, total, members) {
  if (total == null || total < guildHp(members) || guildMyDamage(week) <= 0) return;
  var k = 'dd_guild_claimed_' + week.key;
  if (DDStore.getItem(k)) return;
  DDStore.setItem(k, '1');
  addGlobalGold(GUILDS.gold);
  var frags = parseInt(DDStore.getItem('dd_soul_fragments') || '0', 10) || 0;
  DDStore.setItem('dd_soul_fragments', String(frags + GUILDS.fragments));
  try { sfx('victory'); } catch (e) {}
  setTimeout(function() { say(week.boss.name + ' has fallen! You earn ' + GUILDS.gold.toLocaleString() + ' gold and ' + GUILDS.fragments + ' Soul Fragments.'); }, 900);
}
async function guildStrike() {
  var week = guildWeek(), g = GUILDS.mine, ch = CHARS && CHARS[GUILDS.charIdx];
  if (!ch) { say('Please select a character.'); return; }
  var used = guildStrikesUsed();
  if (used >= GUILDS.strikesPerDay) { say('No strikes left today.'); return; }
  var base = 100 + 15 * Math.max(1, ch.persistLevel || 1);
  var lo = Math.floor(base * 4 / 5), hi = Math.floor(base * 6 / 5);
  var dmg = lo + Math.floor(Math.random() * (hi - lo + 1));
  var crit = Math.random() < 0.15;
  if (crit) dmg *= 2;
  dmg = Math.min(5000, dmg);
  var mine = guildMyDamage(week) + dmg;
  DDStore.setItem('dd_guild_dmg_' + week.key, String(mine));
  DDStore.setItem('dd_guild_strikes_' + guildToday(), String(used + 1));
  var taunt = week.boss.taunts[Math.floor(Math.random() * week.boss.taunts.length)];
  try { sfx(crit ? 'heavy-hit' : 'attack'); } catch (e) {}
  var line = (crit ? '💥 Critical! ' : '⚔ ') + ch.name + ' deals ' + dmg + ' damage. ' + taunt;
  GUILDS.log.unshift(line);
  if (GUILDS.total != null) GUILDS.total += dmg;
  guildRender();
  var left = GUILDS.total == null ? null : Math.max(0, guildHp(g.count) - GUILDS.total);
  say(line + (left != null ? ' ' + left.toLocaleString() + ' HP left.' : '') + ' ' + guildStrikesLeft() + ' strikes left today.');
  // Your share, and the guild's total for the rankings.
  var uid = guildUid(), db = guildDb();
  try {
    await guildHits(g, week.key).doc(uid).set({ damage: FV().increment(dmg), name: guildMyName(), updatedAt: Date.now() }, { merge: true });
    var ref = db.collection('guilds').doc(g.id), cur = (await ref.get()).data() || {};
    if (cur.week === week.key) await ref.update({ weekDamage: FV().increment(dmg) });
    else await ref.update({ week: week.key, weekDamage: dmg });
  } catch (e) { console.warn('[guilds] strike upload', e); }
  await guildLoadBoss(week);
  guildClaim(week, GUILDS.total, g.count);
  if (GUILDS.page === 'boss' && _currentScreen === 'guilds') guildRender();
}

// ── The screen ──
function guildEnsureScreen() {
  if (document.getElementById('screen-guilds')) return;
  var el = document.createElement('div');
  el.id = 'screen-guilds';
  el.className = 'screen';
  el.setAttribute('role', 'main');
  el.setAttribute('aria-label', 'Guilds');
  el.innerHTML = '<div style="max-width:440px;margin:0 auto;padding:20px 16px;">' +
    '<div class="screen-header"><button class="back-btn" id="guild-back" aria-label="Back">← Menu</button>' +
    '<h2 class="screen-title" id="guild-title" tabindex="-1" style="color:#e0c080;">🛡 Guilds</h2></div>' +
    '<p id="guild-msg" role="status" style="font-family:\'Crimson Text\',serif;color:#e0c080;min-height:1em;"></p>' +
    '<div id="guild-body"></div></div>';
  var anchor = document.getElementById('screen-worldboss') || document.getElementById('screen-void-reaper');
  (anchor && anchor.parentNode ? anchor.parentNode : document.body).insertBefore(el, anchor || null);
  document.getElementById('guild-back').onclick = function() {
    if (GUILDS.page === 'home') { guildCloseChat(); goTo('menu'); try { playTrack('menu'); } catch (e) {} }
    else guildGo('home');
  };
}
var _gEsc = function(s) { return typeof _u119Esc === 'function' ? _u119Esc(s) : String(s); };
function gBtn(label, aria, onclick, style) {
  return '<button class="menu-btn' + (style === 'primary' ? ' primary' : '') + '" style="width:100%;margin-bottom:8px;' + (style === 'red' ? 'color:#ff8866;border-color:#883322;' : '') + '"' +
    (aria ? ' aria-label="' + _gEsc(aria) + '"' : '') + ' onclick="' + onclick + '">' + label + '</button>';
}
var gP = function(t, extra) { return '<p style="font-family:\'Crimson Text\',serif;color:#aaa;' + (extra || '') + '">' + t + '</p>'; };
var gH = function(t) { return '<p role="heading" aria-level="3" style="font-family:Cinzel,serif;font-size:0.7rem;letter-spacing:0.2em;color:var(--gold-dim);margin-top:14px;">' + t + '</p>'; };

function guildGo(page, message) {
  GUILDS.page = page;
  GUILDS.msg = message || '';
  if (page === 'chat') guildOpenChat();
  guildRender();
  var t = document.getElementById('guild-title');
  if (t) t.focus();
  var names = { home: GUILDS.mine ? GUILDS.mine.name : 'Guilds', browse: 'Find a Guild. Loading guilds.', create: 'Create a Guild',
                chat: 'Guild Chat', boss: 'Guild Boss', members: 'Members', rankings: 'Guild Rankings. Loading.', manage: 'Manage Guild' };
  say(message || names[page]);
  if (page === 'browse' || page === 'rankings') guildLoadAll().then(function() { if (GUILDS.page === page) { guildRender(); say(GUILDS.allFailed ? "Couldn't load the guilds. Check your connection." : (GUILDS.all.length + ' guilds.')); } });
  if (page === 'boss') { var wk = guildWeek(); guildLoadBoss(wk).then(function() {
    if (GUILDS.page !== 'boss') return;
    guildRender();
    say(wk.boss.intro + ' ' + guildStatus(wk, GUILDS.total, GUILDS.mine.count) + ' You have ' + guildStrikesLeft() + ' strikes left today.');
    guildClaim(wk, GUILDS.total, GUILDS.mine.count);
  }); }
}

function guildRender() {
  var body = document.getElementById('guild-body');
  if (!body) return;
  var g = GUILDS.mine, uid = guildUid(), leader = g && g.leader === uid, week = guildWeek(), h = '';
  if (!g && ['chat', 'boss', 'members', 'manage'].indexOf(GUILDS.page) !== -1) GUILDS.page = 'home';
  if (GUILDS.page === 'manage' && !leader) GUILDS.page = 'home';
  document.getElementById('guild-msg').textContent = GUILDS.msg || '';
  document.getElementById('guild-back').textContent = GUILDS.page === 'home' ? '← Menu' : '← Guild';
  document.getElementById('guild-back').setAttribute('aria-label', GUILDS.page === 'home' ? 'Back to main menu' : 'Back to guild');
  document.getElementById('guild-title').textContent = GUILDS.page === 'home' ? '🛡 ' + (g ? g.name : 'Guilds')
    : { browse: '🔍 Find a Guild', create: '➕ Create a Guild', chat: '💬 Guild Chat', boss: '🐉 Guild Boss', members: '👥 Members', rankings: '🏆 Guild Rankings', manage: '⚙ Manage Guild' }[GUILDS.page];

  if (GUILDS.page === 'home') {
    if (g) {
      if (g.desc) h += gP(_gEsc(g.desc), 'font-style:italic;');
      h += gP(g.count + ' of ' + GUILDS.maxMembers + ' members · Leader: ' + _gEsc(g.leaderName));
      h += gP('This week: ' + _gEsc(week.boss.name) + ' · ' + g.thisWeek.toLocaleString() + ' damage');
      h += gBtn('💬 Guild Chat', 'Guild chat, talk to your guild', "guildGo('chat')", 'primary');
      h += gBtn('🐉 Guild Boss', "Guild Boss, this week's boss: " + week.boss.name, "guildGo('boss')", 'red');
      h += gBtn('👥 Members (' + g.count + ')', 'Members, ' + g.count + ' of ' + GUILDS.maxMembers, "guildGo('members')");
      h += gBtn('🏆 Guild Rankings', 'Guild rankings, the strongest guilds this week', "guildGo('rankings')");
      if (leader) h += gBtn('⚙ Manage Guild', 'Manage guild: description, or disband it', "guildGo('manage')");
      h += gBtn('🚪 Leave Guild', null, 'guildLeaveClick()');
    } else if (!uid) {
      h += gP("Guilds need an account, so everyone knows who's who. Sign in under Settings, Account, then come back.");
      h += gBtn('⚙ Go to Settings', null, "goTo('settings')", 'primary');
    } else if (!GUILDS.checked) {
      h += gP('Looking for your guild...');
    } else {
      h += gP('Up to ' + GUILDS.maxMembers + ' players under one name, with your own chat and a Guild Boss every week. Web, Android and iPhone players are in the same guilds.');
      h += gBtn('🔍 Find a Guild', 'Find a guild to join', "guildGo('browse')", 'primary');
      h += gBtn('➕ Create a Guild', 'Create a guild and lead it', "guildGo('create')");
      h += gBtn('🏆 Guild Rankings', 'Guild rankings, the strongest guilds this week', "guildGo('rankings')");
    }
  } else if (GUILDS.page === 'create') {
    h += '<label for="guild-name" style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--gold-dim);">GUILD NAME</label>' +
      '<input id="guild-name" maxlength="24" autocomplete="off" style="width:100%;margin:4px 0 10px;padding:8px;background:#111;color:#fff;border:1px solid #444;">' +
      '<label for="guild-desc" style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--gold-dim);">DESCRIPTION (optional, up to 120 characters)</label>' +
      '<textarea id="guild-desc" maxlength="120" rows="3" style="width:100%;margin:4px 0 10px;padding:8px;background:#111;color:#fff;border:1px solid #444;"></textarea>' +
      gBtn('🛡 Create Guild', null, 'guildCreateClick()', 'primary') +
      gP('3 to 24 letters, numbers, spaces, apostrophes or hyphens. You lead the guild; you can hand it to someone later.', 'font-size:0.8rem;');
  } else if (GUILDS.page === 'browse' || GUILDS.page === 'rankings') {
    var list = GUILDS.all;
    if (list == null) h += gP(GUILDS.allFailed ? "Couldn't load the guilds. Check your connection." : 'Loading guilds...');
    else if (GUILDS.page === 'browse') {
      if (!list.length) h += gP('No guilds yet. Create the first one!', 'font-style:italic;');
      list.forEach(function(x) {
        var info = x.count + ' of ' + GUILDS.maxMembers + ' members · Leader: ' + x.leaderName + ' · ' + x.thisWeek.toLocaleString() + ' damage this week';
        h += '<div style="border:1px solid #333;padding:10px;margin-bottom:10px;" role="group" aria-label="' + _gEsc(x.name) + '">' +
          '<div style="font-family:Cinzel,serif;color:#fff;">🛡 ' + _gEsc(x.name) + '</div>' +
          (x.desc ? gP(_gEsc(x.desc), 'font-style:italic;margin:4px 0;') : '') + gP(_gEsc(info), 'font-size:0.8rem;margin:4px 0;') +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;">' +
          (x.count < GUILDS.maxMembers ? '<button class="menu-btn primary" onclick="guildJoinClick(\'' + x.id + '\')" aria-label="Join ' + _gEsc(x.name) + '. ' + _gEsc(info) + '">Join</button>'
                                         : '<span style="color:#888;font-family:Cinzel,serif;font-size:0.7rem;">Full</span>') +
          '<button class="menu-btn" onclick="guildReportGuild(\'' + x.id + '\')" aria-label="Report ' + _gEsc(x.name) + '">Report</button>' +
          (guildIsDev() ? '<button class="menu-btn" style="color:#ff8866;" onclick="guildDevRemove(\'' + x.id + '\')" aria-label="Remove ' + _gEsc(x.name) + '">Remove</button>' : '') +
          '</div></div>';
      });
    } else {
      var ranked = list.filter(function(x) { return x.thisWeek > 0; });
      h += gP("This week's Guild Boss: " + _gEsc(week.boss.name) + '. ' + guildDaysLeft() + ' days left.');
      if (!ranked.length) h += gP("No guild has struck this week's boss yet.", 'font-style:italic;');
      ranked.forEach(function(x, i) {
        h += '<div style="font-family:Cinzel,serif;font-size:0.75rem;color:' + (i ? '#aaa' : '#ffdd44') + ';margin:4px 0;">' + (i + 1) + '. ' + _gEsc(x.name) + ' — ' +
          x.thisWeek.toLocaleString() + ' damage · ' + x.count + ' members' + (g && x.id === g.id ? ' (your guild)' : '') + '</div>';
      });
    }
  } else if (GUILDS.page === 'chat') {
    h += '<div id="guild-chat-list" aria-label="Guild messages, newest last" style="max-height:50vh;overflow-y:auto;border:1px solid #333;padding:8px;margin-bottom:10px;"></div>' +
      '<label for="guild-chat-input" class="sr-only" style="position:absolute;left:-9999px;">Message your guild</label>' +
      '<div style="display:flex;gap:6px;"><input id="guild-chat-input" maxlength="200" placeholder="Message your guild" style="flex:1;padding:8px;background:#111;color:#fff;border:1px solid #444;">' +
      '<button class="menu-btn primary" onclick="guildSend()">Send</button></div>';
  } else if (GUILDS.page === 'boss') {
    var total = GUILDS.total, hp = guildHp(g.count), left = total == null ? null : Math.max(0, hp - total), strikes = guildStrikesLeft();
    var pct = left == null ? 100 : Math.round(left / hp * 100);
    h += '<h3 style="font-family:\'Cinzel Decorative\',cursive;color:#fff;text-align:center;margin:4px 0;">' + _gEsc(week.boss.name) + '</h3>' +
      gP(_gEsc(week.boss.intro), 'font-style:italic;text-align:center;') +
      '<div tabindex="0" aria-label="' + _gEsc(guildStatus(week, total, g.count) + ' Your damage this week: ' + guildMyDamage(week) + '. ' + strikes + ' strikes left today.') + '" style="border:1px solid #4a1a1a;padding:12px;margin-bottom:12px;">' +
      '<div aria-hidden="true" style="font-family:Cinzel,serif;font-size:0.6rem;letter-spacing:0.2em;color:#888;">GUILD BOSS — THIS WEEK</div>' +
      '<div aria-hidden="true" style="background:#111;height:10px;margin:6px 0;"><div style="background:#cc4422;height:100%;width:' + pct + '%;"></div></div>' +
      '<div aria-hidden="true" style="font-family:Cinzel,serif;color:#ff8866;">' + (left == null ? 'Loading...' : left.toLocaleString() + ' / ' + hp.toLocaleString() + ' HP') + '</div>' +
      '<div aria-hidden="true" style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:#888;">Your damage this week: ' + guildMyDamage(week).toLocaleString() + ' · ' + strikes + ' of ' + GUILDS.strikesPerDay +
      ' strikes left today · ' + guildDaysLeft() + ' days until the next boss</div>' +
      '<div aria-hidden="true" style="font-family:\'Crimson Text\',serif;font-size:0.85rem;color:#44cc88;">Kill reward: ' + GUILDS.gold.toLocaleString() + ' gold + ' + GUILDS.fragments +
      ' Soul Fragments for every member who struck. Its HP grows with the guild.</div></div>';
    if (left === 0) h += gP('It has fallen. Every member who struck it collects the reward. A new boss comes on Monday (UTC).', 'color:#44cc88;');
    else if (strikes > 0) {
      h += '<p style="font-family:Cinzel,serif;font-size:0.7rem;color:var(--gold-dim);">CHOOSE YOUR CHAMPION</p>' +
        '<div id="guild-char-list" role="radiogroup" aria-label="Select a character" style="display:flex;flex-direction:column;gap:8px;margin-bottom:12px;"></div>' +
        gBtn('⚔ Strike (' + strikes + ' left today)', 'Strike ' + week.boss.name + '. ' + strikes + ' strikes left today.', 'guildStrike()', 'red');
    } else h += gP("You've used all " + GUILDS.strikesPerDay + ' strikes today. Come back tomorrow.');
    if (GUILDS.log.length) h += '<div aria-label="Strike log" style="font-family:Cinzel,serif;font-size:0.65rem;color:#999;line-height:1.7;margin:10px 0;">' +
      GUILDS.log.slice(0, 8).map(function(l) { return '<div>' + _gEsc(l) + '</div>'; }).join('') + '</div>';
    if (GUILDS.hits.length) {
      h += gH("⚔ THIS WEEK'S DAMAGE");
      GUILDS.hits.forEach(function(x, i) { h += '<div style="font-family:Cinzel,serif;font-size:0.7rem;color:' + (i ? '#aaa' : '#ffdd44') + ';">' + (i + 1) + '. ' + _gEsc(x.name) + ' — ' + x.damage.toLocaleString() + '</div>'; });
    }
  } else if (GUILDS.page === 'members') {
    guildRoster(g).forEach(function(m) {
      var isLead = m.uid === g.leader, me = m.uid === uid;
      h += '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;border-bottom:1px solid #222;padding:6px 0;">' +
        '<span style="flex:1;font-family:Cinzel,serif;color:#ddd;">' + (isLead ? '👑 ' : '') + _gEsc(m.name) + (me ? ' (you)' : '') + (isLead ? '<span class="sr-only" style="position:absolute;left:-9999px;">, leader</span>' : '') + '</span>' +
        (leader && !me ? '<button class="menu-btn" onclick="guildPromote(\'' + m.uid + '\')" aria-label="Make ' + _gEsc(m.name) + ' the leader">Make Leader</button>' +
                         '<button class="menu-btn" style="color:#ff8866;" onclick="guildKick(\'' + m.uid + '\')" aria-label="Remove ' + _gEsc(m.name) + '">Remove</button>' : '') + '</div>';
    });
  } else if (GUILDS.page === 'manage') {
    h += '<label for="guild-desc-edit" style="font-family:Cinzel,serif;font-size:0.65rem;color:var(--gold-dim);">DESCRIPTION</label>' +
      '<textarea id="guild-desc-edit" maxlength="120" rows="3" style="width:100%;margin:4px 0 10px;padding:8px;background:#111;color:#fff;border:1px solid #444;">' + _gEsc(g.desc) + '</textarea>' +
      gBtn('💾 Save Description', null, 'guildDescClick()', 'primary') +
      gP('To hand the guild to someone else, open Members and choose Make Leader.', 'font-size:0.85rem;') +
      gBtn('🗑 Disband Guild', null, 'guildDisbandClick()', 'red');
  }
  body.innerHTML = h;
  if (GUILDS.page === 'chat') guildRenderChatList();
  if (GUILDS.page === 'boss' && document.getElementById('guild-char-list') && typeof _u119CharButtons === 'function')
    _u119CharButtons('guild-char-list', GUILDS.charIdx, function(i) { GUILDS.charIdx = i; });
  var ci = document.getElementById('guild-chat-input');
  if (ci) ci.onkeydown = function(e) { if (e.key === 'Enter') { e.preventDefault(); guildSend(); } };
}
function guildRenderChatList() {
  var box = document.getElementById('guild-chat-list');
  if (!box) return;
  var uid = guildUid(), leader = GUILDS.mine && GUILDS.mine.leader === uid;
  if (!GUILDS.chat.length) { box.innerHTML = gP('No messages yet. Say hello!', 'text-align:center;'); return; }
  box.innerHTML = GUILDS.chat.map(function(m) {
    var mine = m.uid === uid;
    return '<div style="border-bottom:1px solid #222;padding:5px 0;">' +
      '<span style="color:#e0c080;font-family:Cinzel,serif;font-size:0.75rem;">' + _gEsc(m.username) + ':</span> <span style="color:#ddd;">' + _gEsc(m.message) + '</span> ' +
      (!mine ? '<button class="menu-btn" style="padding:2px 8px;font-size:0.65rem;" onclick="guildReportMsg(\'' + m.id + '\')" aria-label="Report message by ' + _gEsc(m.username) + '">Report</button>' +
               '<button class="menu-btn" style="padding:2px 8px;font-size:0.65rem;" onclick="guildBlock(\'' + m.id + '\')" aria-label="Block ' + _gEsc(m.username) + '">Block</button>' : '') +
      (mine || leader ? '<button class="menu-btn" style="padding:2px 8px;font-size:0.65rem;" onclick="guildDeleteMsg(\'' + m.id + '\')" aria-label="Delete message by ' + _gEsc(m.username) + '">Delete</button>' : '') +
      '</div>';
  }).join('');
  box.scrollTop = box.scrollHeight;
}

// ── Buttons ──
function _gFind(id) { return (GUILDS.all || []).filter(function(x) { return x.id === id; })[0]; }
async function guildCreateClick() {
  var p = await guildCreate(document.getElementById('guild-name').value, document.getElementById('guild-desc').value);
  if (p) { GUILDS.msg = p; guildRender(); say(p); return; }
  try { sfx('sfx-confirm'); } catch (e) {}
  guildGo('home', 'Guild created. You lead ' + GUILDS.mine.name + '.');
}
async function guildJoinClick(id) {
  var g = _gFind(id); if (!g) return;
  var p = await guildJoin(g);
  if (p) { GUILDS.msg = p; guildRender(); say(p); return; }
  try { sfx('sfx-confirm'); } catch (e) {}
  guildGo('home', 'You joined ' + g.name + '.');
}
async function guildLeaveClick() {
  await guildLoadMine();
  var g = GUILDS.mine;
  if (!g) { guildGo('home'); return; }
  if (g.leader === guildUid() && g.count > 1) { var m = 'You lead ' + g.name + '. Make another member the leader first (Members), or disband the guild (Manage Guild).'; GUILDS.msg = m; guildRender(); say(m); return; }
  if (!confirm(g.leader === guildUid() ? 'Leave and disband ' + g.name + '? You are its only member.' : 'Leave ' + g.name + '?')) return;
  var p = await guildLeave();
  if (p) { say(p); return; }
  guildGo('home', 'You left the guild.');
}
async function guildKick(uid) {
  var name = GUILDS.mine.members[uid];
  if (!confirm('Remove ' + name + ' from the guild?')) return;
  var p = await guildRemove(uid);
  guildRender(); say(p || name + ' was removed from the guild.');
}
async function guildPromote(uid) {
  var name = GUILDS.mine.members[uid];
  if (!confirm('Make ' + name + ' the leader? You stay in the guild as a member.')) return;
  var p = await guildMakeLeader(uid);
  guildRender(); say(p || name + ' now leads the guild.');
}
async function guildDescClick() {
  var p = await guildSetDesc(document.getElementById('guild-desc-edit').value);
  GUILDS.msg = p || 'Description saved.'; guildRender(); say(GUILDS.msg);
}
async function guildDisbandClick() {
  if (!confirm('Disband ' + GUILDS.mine.name + '? The guild ends for every member. This can\'t be undone.')) return;
  var g = GUILDS.mine;
  if (GUILDS.docUnsub) { GUILDS.docUnsub(); GUILDS.docUnsub = null; GUILDS.watching = null; }
  var p = await guildDisband();
  if (p) { say(p); guildWatch(); return; }
  guildGo('home', g.name + ' has been disbanded.');
}
async function guildDevRemove(id) {
  var g = _gFind(id); if (!g || !confirm('Developer: remove ' + g.name + '? This disbands the guild for every member.')) return;
  var p = await guildDisband(g);
  guildRender(); say(p || g.name + ' was removed.');
}
async function guildReportGuild(id) {
  var g = _gFind(id); if (!g) return;
  await guildReport('guild', g.id, g.leaderName, g.name + ': ' + g.desc);
}
async function guildReportMsg(id) {
  var m = GUILDS.chat.filter(function(x) { return x.id === id; })[0]; if (!m) return;
  if (await guildReport('guild message', m.id, m.username, m.message.slice(0, 300))) {
    GUILDS.chat = GUILDS.chat.filter(function(x) { return x.id !== id; }); guildRenderChatList();
  }
}
function guildBlock(id) {
  var m = GUILDS.chat.filter(function(x) { return x.id === id; })[0]; if (!m) return;
  if (!confirm('Block ' + m.username + '? You will no longer see their messages in guild chat.')) return;
  var list = guildBlocked(); if (list.indexOf(m.username) === -1) list.push(m.username);
  DDStore.setItem('dd_guild_blocked', JSON.stringify(list));
  GUILDS.chat = GUILDS.chat.filter(function(x) { return x.username !== m.username; });
  guildRenderChatList(); say(m.username + ' is blocked.');
}
function guildDeleteMsg(id) {
  guildDb().collection('guilds').doc(GUILDS.mine.id).collection('chat').doc(id).delete()
    .then(function() { say('Message deleted.'); }).catch(function() { say("Couldn't delete it."); });
}

async function openGuilds() {
  guildEnsureScreen();
  GUILDS.page = 'home'; GUILDS.msg = ''; GUILDS.log = [];
  goTo('guilds');
  guildRender();
  await guildLoadMine();
  if (_currentScreen !== 'guilds') return;
  guildRender();
  var g = GUILDS.mine;
  say(g ? 'Guilds. ' + g.name + ', ' + g.count + ' of ' + GUILDS.maxMembers + ' members. This week\'s boss: ' + guildWeek().boss.name + '.'
        : guildUid() ? "Guilds. You're not in a guild yet. Find one to join, or create your own." : 'Guilds need an account. Sign in under Settings, Account.');
  if (g) {
    // Last week's boss, if you struck it and it fell after you left.
    var lw = guildWeek(new Date(Date.now() - 7 * 86400000));
    if (guildMyDamage(lw) > 0 && !DDStore.getItem('dd_guild_claimed_' + lw.key)) guildClaim(lw, await guildWeekTotal(lw), g.count);
  }
}
